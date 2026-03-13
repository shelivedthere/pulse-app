import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type ScoreValue = 'pass' | 'partial' | 'fail'

type ScoreInput = {
  templateItemId: string
  score: ScoreValue
  note: string | null
  description: string
  category: string
}

type SubmitPayload = {
  areaId: string
  orgId: string
  userId: string
  scores: ScoreInput[]
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: SubmitPayload = await req.json()
    const { areaId, orgId, scores } = body

    // Verify org membership
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (profile?.org_id !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ─── 1. Calculate score ───────────────────────────────────────
    const passCount = scores.filter(s => s.score === 'pass').length
    const partialCount = scores.filter(s => s.score === 'partial').length
    const total = scores.length
    const calculatedScore =
      total > 0
        ? Math.round(((passCount + partialCount * 0.5) / total) * 1000) / 10
        : 0

    // ─── 2. Create audit record ───────────────────────────────────
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .insert({
        org_id: orgId,
        area_id: areaId,
        conducted_by: user.id,
        score: calculatedScore,
      })
      .select('id')
      .single()

    if (auditError || !audit) {
      console.error('Audit insert error:', auditError)
      return NextResponse.json({ error: 'Failed to create audit' }, { status: 500 })
    }

    // ─── 3. Insert audit_item_scores ──────────────────────────────
    const { error: scoresError } = await supabase
      .from('audit_item_scores')
      .insert(
        scores.map(s => ({
          audit_id: audit.id,
          template_item_id: s.templateItemId,
          org_id: orgId,
          score: s.score,
          note: s.note ?? null,
        }))
      )

    if (scoresError) {
      console.error('Scores insert error:', scoresError)
    }

    // ─── 4. AI features (non-blocking) ───────────────────────────
    const findings = scores.filter(s => s.score === 'partial' || s.score === 'fail')
    let aiSummary: string | null = null

    if (findings.length > 0) {
      // Fetch saved score IDs for action item linking
      const { data: savedScores } = await supabase
        .from('audit_item_scores')
        .select('id, template_item_id')
        .eq('audit_id', audit.id)

      const scoreIdMap = new Map<string, string>()
      for (const s of savedScores ?? []) {
        scoreIdMap.set(s.template_item_id, s.id)
      }

      // Run AI calls in parallel — failures degrade gracefully
      const [summaryResult, descriptionsResult] = await Promise.allSettled([
        generateAISummary(findings),
        generateAIDescriptions(findings),
      ])

      if (summaryResult.status === 'fulfilled') {
        aiSummary = summaryResult.value
        await supabase
          .from('audits')
          .update({ ai_summary: aiSummary })
          .eq('id', audit.id)
      } else {
        console.error('AI summary failed:', summaryResult.reason)
      }

      const aiDescriptions: Record<string, string> =
        descriptionsResult.status === 'fulfilled' ? descriptionsResult.value : {}

      if (descriptionsResult.status === 'rejected') {
        console.error('AI descriptions failed:', descriptionsResult.reason)
      }

      // ─── 5. Create action items ───────────────────────────────
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 14)
      const dueDateStr = dueDate.toISOString().split('T')[0] // YYYY-MM-DD

      const { error: actionsError } = await supabase
        .from('action_items')
        .insert(
          findings.map(f => ({
            org_id: orgId,
            area_id: areaId,
            audit_id: audit.id,
            audit_item_score_id: scoreIdMap.get(f.templateItemId) ?? null,
            description:
              aiDescriptions[f.templateItemId] ??
              f.note ??
              f.description,
            raw_finding: f.note ?? null,
            status: 'open',
            due_date: dueDateStr,
            created_by: user.id,
          }))
        )

      if (actionsError) {
        console.error('Action items insert error:', actionsError)
      }
    }

    return NextResponse.json({
      auditId: audit.id,
      score: calculatedScore,
      aiSummary,
    })
  } catch (err) {
    console.error('Audit submit error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── AI: Findings summary ─────────────────────────────────────────────────────

async function generateAISummary(
  findings: ScoreInput[]
): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const findingsList = findings
    .map(f =>
      `- [${f.category}] ${f.description}${f.note ? `: "${f.note}"` : ''} (${f.score})`
    )
    .join('\n')

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `You are a 6S audit assistant. Based on the findings below, write a 2–3 sentence plain-language summary of this audit. Focus on the most significant issues and the overall state of the area. Be direct and professional — this summary will be used in ops meeting updates.

Findings:
${findingsList}

Write only the summary. No headers, no bullet points, no preamble.`,
      },
    ],
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected AI response type')
  return block.text.trim()
}

// ─── AI: Action item descriptions ────────────────────────────────────────────

async function generateAIDescriptions(
  findings: ScoreInput[]
): Promise<Record<string, string>> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const numbered = findings
    .map(
      (f, i) =>
        `${i + 1}. Category: ${f.category} | Item: ${f.description} | Finding note: ${f.note ?? '(no note provided)'}`
    )
    .join('\n')

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a 6S corrective action writer. For each finding below, write one clear, professional, actionable task description. Start each with an action verb. Be specific about what needs to be done.

Findings:
${numbered}

Respond with ONLY a numbered list matching the input order, one item per line:
1. [task description]
2. [task description]`,
      },
    ],
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected AI response type')

  const result: Record<string, string> = {}
  for (const line of block.text.trim().split('\n')) {
    const match = line.match(/^(\d+)\.\s+(.+)$/)
    if (match) {
      const idx = parseInt(match[1], 10) - 1
      if (idx >= 0 && idx < findings.length) {
        result[findings[idx].templateItemId] = match[2].trim()
      }
    }
  }

  return result
}
