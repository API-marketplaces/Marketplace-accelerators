import { NextResponse } from 'next/server'

const API = process.env.FASTAPI_BASE_URL || process.env.FASTAPI_URL || 'http://localhost:8000'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    const response = await fetch(`${API}/api/v1/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: String(email || '').trim().toLowerCase(),
        password: String(password || '').trim(),
      }),
    })

    const body = await response.json().catch(() => ({ detail: 'Password reset failed' }))

    if (!response.ok) {
      return NextResponse.json(body, { status: response.status })
    }

    return NextResponse.json({ ok: true, message: body.message || 'Password updated successfully' })
  } catch {
    return NextResponse.json({ message: 'Bad request' }, { status: 400 })
  }
}
