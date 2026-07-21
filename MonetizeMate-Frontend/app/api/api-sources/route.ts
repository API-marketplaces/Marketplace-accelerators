import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API = process.env.FASTAPI_BASE_URL || process.env.FASTAPI_URL || 'http://localhost:8000'
const COOKIE = process.env.JWT_COOKIE_NAME || 'session'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(COOKIE)

    if (!sessionCookie?.value) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 })
    }

    const response = await fetch(`${API}/api/v1/api-sources/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${sessionCookie.value}`,
      },
    })

    const data = await response.json().catch(() => [])
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error fetching API sources:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(COOKIE)

    if (!sessionCookie?.value) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 })
    }

    const response = await fetch(`${API}/api/v1/api-sources/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionCookie.value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json().catch(() => ({ message: 'Failed to create connection' }))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error creating API source:', error)
    return NextResponse.json({ message: 'Bad request' }, { status: 400 })
  }
}
