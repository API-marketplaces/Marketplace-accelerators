// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/signup']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const session = req.cookies.get(process.env.JWT_COOKIE_NAME || 'session')?.value

  // If authenticated user visits /login or /signup → send to dashboard
  if (session && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard/upload', req.url))
  }

  // Public paths — always allow
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  if (isPublic) return NextResponse.next()

  // Protected — redirect to login if no session
  if (!session) {
    const url = new URL('/login', req.url)
    url.searchParams.set('redirectTo', pathname + req.nextUrl.search)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/dashboard/:path*',
  ],
}