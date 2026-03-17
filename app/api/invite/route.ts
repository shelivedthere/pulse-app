import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createServiceSupabaseClient } from '@/lib/supabase/service'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function DELETE(req: NextRequest) {
  try {
    const { inviteId, orgId } = await req.json()
    if (!inviteId || !orgId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id, role')
      .eq('id', user.id)
      .single()

    if (profile?.org_id !== orgId || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 })
    }

    const service = createServiceSupabaseClient()
    const { error } = await service
      .from('invitations')
      .delete()
      .eq('id', inviteId)
      .eq('org_id', orgId)

    if (error) {
      console.error('Failed to cancel invitation:', error)
      return NextResponse.json({ error: 'Failed to cancel invitation.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Cancel invite error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  console.log('[invite] POST called')
  console.log('[invite] SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('[invite] Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

  try {
    const body = await req.json()
    console.log('[invite] Request body:', { ...body, email: body.email })
    const { email, areaId, orgId, role = 'contributor' } = body

    if (!email || !areaId || !orgId) {
      console.error('[invite] Missing fields — email:', !!email, 'areaId:', !!areaId, 'orgId:', !!orgId)
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }
    if (role !== 'admin' && role !== 'contributor') {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
    }

    // Verify the calling user is an admin of this org
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) console.error('[invite] Auth error:', authError)
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    console.log('[invite] Calling user:', user.id)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('org_id, role')
      .eq('id', user.id)
      .single()

    if (profileError) console.error('[invite] Profile fetch error:', profileError)
    console.log('[invite] Profile:', profile)

    if (profile?.org_id !== orgId || profile?.role !== 'admin') {
      console.error('[invite] Auth check failed — profile org_id:', profile?.org_id, 'requested orgId:', orgId, 'role:', profile?.role)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 })
    }

    // Verify the area belongs to this org
    const { data: area, error: areaError } = await supabase
      .from('areas')
      .select('id, name')
      .eq('id', areaId)
      .eq('org_id', orgId)
      .single()

    if (areaError) console.error('[invite] Area fetch error:', areaError)
    if (!area) {
      return NextResponse.json({ error: 'Area not found.' }, { status: 404 })
    }

    // Fetch org name for the email
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single()

    // Generate an invite link via Supabase Auth (creates the user, no email sent by Supabase)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    console.log('[invite] Calling generateLink for:', email.toLowerCase())
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email.toLowerCase(),
      options: {
        data: { org_id: orgId, role, assigned_area_id: areaId },
        redirectTo: `${appUrl}/auth/callback`,
      },
    })

    if (linkError) {
      console.error('[invite] generateLink error:', linkError)

      if (
        linkError.message?.toLowerCase().includes('already been registered') ||
        linkError.message?.toLowerCase().includes('already registered') ||
        linkError.message?.toLowerCase().includes('user already exists')
      ) {
        return NextResponse.json(
          { error: 'This email is already registered. Ask them to sign in directly.' },
          { status: 409 }
        )
      }

      return NextResponse.json({ error: linkError.message ?? 'Failed to generate invite link.' }, { status: 500 })
    }

    const inviteUrl = linkData.properties.action_link
    console.log('[invite] generateLink success, sending email via Resend')

    // Send the invite email via Resend
    try {
      await resend.emails.send({
        from: 'Pulse <onboarding@resend.dev>',
        to: email,
        subject: `You've been invited to join ${org?.name ?? 'Pulse'}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <h1 style="color: #2D3272; font-size: 24px; margin-bottom: 8px;">You're invited to Pulse</h1>
            <p style="color: #5B7FA6; font-size: 15px; margin-bottom: 24px;">
              You've been invited to join <strong style="color: #252850;">${org?.name ?? 'an organization'}</strong>
              as a ${role} for the <strong style="color: #252850;">${area.name}</strong> area.
            </p>
            <a href="${inviteUrl}" style="display: inline-block; background: #2D8FBF; color: white; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              Accept Invitation →
            </a>
            <p style="color: #9aabb8; font-size: 13px; margin-top: 32px;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        `,
      })
      console.log('[invite] Resend email sent successfully')
    } catch (emailError) {
      // Non-fatal — user was created in Auth; log and continue
      console.error('[invite] Resend error:', emailError)
    }

    // Record in invitations table for the pending-invites list in the UI
    const service = createServiceSupabaseClient()
    const { data: invitation, error: dbError } = await service
      .from('invitations')
      .insert({
        org_id: orgId,
        email: email.toLowerCase(),
        area_id: areaId,
        role,
        created_by: user.id,
      })
      .select('id, email, created_at')
      .single()

    if (dbError) {
      // Non-fatal — the Auth invite was already sent successfully
      console.error('[invite] Failed to record invitation row:', dbError)
    }

    return NextResponse.json({ invitation: invitation ?? { id: null, email: email.toLowerCase(), created_at: new Date().toISOString() } })
  } catch (err) {
    console.error('[invite] Unhandled exception:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
