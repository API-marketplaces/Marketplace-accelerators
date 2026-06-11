import { NextResponse } from 'next/server'

const API = process.env.FASTAPI_BASE_URL || process.env.FASTAPI_URL || 'http://localhost:8000'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    const response = await fetch(`${API}/api/v1/forgot-password/request-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: String(email || '').trim().toLowerCase(),
      }),
    })

    const body = await response.json().catch(() => ({ detail: 'Reset link request failed' }))

    if (!response.ok) {
      return NextResponse.json(body, { status: response.status })
    }

    return NextResponse.json({ ok: true, message: body.message || 'Password reset link sent to your email' })
  } catch {
    return NextResponse.json({ message: 'Bad request' }, { status: 400 })
  }
}
