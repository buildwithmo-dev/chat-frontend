// Next.js 16: this file replaces src/app/middleware.js (delete that file).
// On Next 15 or older, rename to src/middleware.js and export `middleware` instead of `proxy`.
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function proxy(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith('/chat') || path.startsWith('/profile');
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/register');

  if (!user && isProtected) return NextResponse.redirect(new URL('/login', request.url));
  if (user && isAuthRoute) return NextResponse.redirect(new URL('/chat', request.url));
  return response;
}

export const config = { matcher: ['/chat/:path*', '/profile/:path*', '/login', '/register'] };
