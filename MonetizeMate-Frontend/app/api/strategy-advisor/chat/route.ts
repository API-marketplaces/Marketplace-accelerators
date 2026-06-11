import { NextResponse } from 'next/server'
import { cookies as nextCookies } from 'next/headers'

const API = process.env.FASTAPI_BASE_URL || process.env.FASTAPI_URL || 'http://localhost:8000'
const COOKIE = process.env.JWT_COOKIE_NAME || 'session'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const cookieStore = await nextCookies()
    const sessionCookie = cookieStore.get(COOKIE)

    if (!sessionCookie?.value) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 })
    }

    const response = await fetch(`${API}/api/v1/strategy-advisor/chat`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionCookie.value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json().catch(() => ({ message: 'AI chat request failed' }))

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ message: 'Bad request' }, { status: 400 })
  }
}
