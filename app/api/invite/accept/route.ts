import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createServiceSupabaseClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: 'Missing token.' }, { status: 400 })

    // Verify the user is signed in
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'You must be signed in to accept this invitation.' }, { status: 401 })

    // Look up the invitation using service role (bypasses RLS — user has no org_id yet)
    const service = createServiceSupabaseClient()
    const { data: invitation, error: inviteError } = await service
      .from('invitations')
      .select('id, org_id, area_id, email, accepted_at')
      .eq('token', token)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation link.' }, { status: 404 })
    }

    if (invitation.accepted_at) {
      return NextResponse.json({ error: 'This invitation has already been accepted.' }, { status: 409 })
    }

    // Verify the user's email matches the invitation
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json({
        error: `This invitation was sent to ${invitation.email}. Please sign in with that email address.`,
      }, { status: 403 })
    }

    // Update profile: set org_id, role, and assigned area
    const { error: profileError } = await service
      .from('profiles')
      .update({ org_id: invitation.org_id, role: 'contributor', assigned_area_id: invitation.area_id })
      .eq('id', user.id)

    if (profileError) {
      console.error('Failed to update profile:', profileError)
      return NextResponse.json({ error: 'Failed to accept invitation. Please try again.' }, { status: 500 })
    }

    // Mark invitation as accepted
    await service
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Accept invite error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
