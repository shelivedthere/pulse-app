import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client — bypasses RLS.
 * Only use server-side in API routes (never client-side).
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
export function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase service role credentials')
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}
