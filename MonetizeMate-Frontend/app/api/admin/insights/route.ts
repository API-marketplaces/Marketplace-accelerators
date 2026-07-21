import { NextResponse } from 'next/server'
import { cookies as nextCookies } from 'next/headers'

const API = process.env.FASTAPI_BASE_URL || process.env.FASTAPI_URL || 'http://localhost:8000'
const COOKIE = process.env.JWT_COOKIE_NAME || 'session'

export async function GET() {
  const cookieStore = await nextCookies()
  const sessionCookie = cookieStore.get(COOKIE)

  if (!sessionCookie?.value) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 })
  }

  const response = await fetch(`${API}/api/v1/admin/insights`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${sessionCookie.value}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  const data = await response.json().catch(() => ({ message: 'Unable to load admin insights' }))
  return NextResponse.json(data, { status: response.status })
}
