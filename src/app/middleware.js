import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set() {
          // middleware cannot reliably set request cookies
          // handled via response only
        },
        remove() {
          // handled via response only
        },
      },
    }
  )

  // -----------------------------
  // READ USER FROM COOKIE CONTEXT
  // -----------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  const isProtectedRoute =
    path.startsWith('/chat') || path.startsWith('/profile')

  const isAuthRoute =
    path.startsWith('/login') || path.startsWith('/register')

  // -----------------------------
  // REDIRECT LOGIC (SAFE)
  // -----------------------------
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  return response
}

export const config = {
  matcher: ['/chat/:path*', '/profile/:path*', '/login', '/register'],
}