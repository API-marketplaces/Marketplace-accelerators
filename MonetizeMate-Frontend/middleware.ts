import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/signup']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const session = req.cookies.get(process.env.JWT_COOKIE_NAME || 'session')?.value

  if (session && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  if (isPublic) return NextResponse.next()

  if (!session) {
    const url = new URL('/login', req.url)
    url.searchParams.set('redirectTo', pathname + req.nextUrl.search)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login', '/signup', '/dashboard/:path*'],
}
