import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createServiceSupabaseClient } from '@/lib/supabase/service'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email, areaId, orgId } = await req.json()

    if (!email || !areaId || !orgId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    // Verify the calling user is an admin of this org
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

    // Verify the area belongs to this org
    const { data: area } = await supabase
      .from('areas')
      .select('id, name')
      .eq('id', areaId)
      .eq('org_id', orgId)
      .single()

    if (!area) {
      return NextResponse.json({ error: 'Area not found.' }, { status: 404 })
    }

    // Fetch org name for the email
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single()

    // Use service role to create the invitation (bypass RLS for token generation)
    const service = createServiceSupabaseClient()
    const { data: invitation, error: inviteError } = await service
      .from('invitations')
      .insert({
        org_id: orgId,
        email: email.toLowerCase(),
        area_id: areaId,
        created_by: user.id,
      })
      .select('id, email, token, created_at')
      .single()

    if (inviteError || !invitation) {
      console.error('Failed to create invitation:', inviteError)
      return NextResponse.json({ error: 'Failed to create invitation.' }, { status: 500 })
    }

    // Send invitation email via Resend
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const inviteUrl = `${appUrl}/invite/${invitation.token}`

    try {
      await resend.emails.send({
        from: 'Pulse <noreply@usepulseapp.com>',
        to: email,
        subject: `You've been invited to join ${org?.name ?? 'Pulse'} as a contributor`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <h1 style="color: #2D3272; font-size: 24px; margin-bottom: 8px;">You're invited to Pulse</h1>
            <p style="color: #5B7FA6; font-size: 15px; margin-bottom: 24px;">
              You've been invited to join <strong style="color: #252850;">${org?.name ?? 'an organization'}</strong>
              as a contributor for the <strong style="color: #252850;">${area.name}</strong> area.
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
    } catch (emailError) {
      // Email failure is non-fatal — invitation is still saved
      console.error('Failed to send invitation email:', emailError)
    }

    return NextResponse.json({ invitation: { id: invitation.id, email: invitation.email, created_at: invitation.created_at } })
  } catch (err) {
    console.error('Invite error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
