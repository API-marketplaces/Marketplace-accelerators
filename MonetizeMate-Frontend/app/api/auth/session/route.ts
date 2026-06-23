import { NextResponse } from 'next/server'
import { cookies as nextCookies } from 'next/headers'

const API = process.env.FASTAPI_BASE_URL || process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const COOKIE = process.env.JWT_COOKIE_NAME || 'session'
type SessionCookie = { name: string; value: string }

export async function GET(req: Request) {
  // Read cookie using Next.js server helpers (works in Edge/Node runtimes)
  const cookieStore = await nextCookies()
  let sessionCookie: SessionCookie | undefined = cookieStore.get(COOKIE)

  // Fallback: try to parse cookie header if cookie helper didn't find it
  if (!sessionCookie) {
    const cookieHeader = req.headers.get('cookie') || ''
    const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith(`${COOKIE}=`))
    if (match) {
      const [, value] = match.split('=')
      sessionCookie = { name: COOKIE, value }
    }
  }

  console.log('Session Cookie:', sessionCookie)
  if (!sessionCookie || !sessionCookie.value) {
    return NextResponse.json({ authenticated: false, user: null })
  }

  // Validate token and fetch user info from FastAPI backend
  try {
    const apiUrl = `${API}/api/v1/users/me`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionCookie.value}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const user = await response.json();

    // Store user info in required format
    const userInfo = {
      email: user.email,
      name: user.name,
      is_active: user.is_active,
      id: user.id,
    };

    return NextResponse.json({ authenticated: true, user: userInfo });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ authenticated: false, user: null, error: message });
  }
}
