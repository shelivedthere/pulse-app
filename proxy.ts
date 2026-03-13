import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  // Start with a passthrough response so cookies can be forwarded
  let supabaseResponse = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write updated auth cookies onto both the request and response
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — must be called on every request
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Protect /dashboard and /onboarding — redirect unauthenticated users to /login
  if (!session && (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding'))) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Redirect already-authenticated users away from auth pages
  if (session && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/login', '/signup'],
}
