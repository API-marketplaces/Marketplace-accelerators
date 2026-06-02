import { NextResponse } from 'next/server'

const API = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'
const COOKIE = process.env.JWT_COOKIE_NAME || 'session'
const MAX_AGE = Number(process.env.JWT_COOKIE_MAX_AGE ?? 86400)

export async function POST(req: Request) {
  try {
    const { email, password, firstName, lastName } = await req.json()
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedPassword = String(password || '').trim()

    // Combine firstName + lastName into name (backend requires it)
    const name = `${firstName || ''} ${lastName || ''}`.trim() || normalizedEmail

    // Register user
    const registerRes = await fetch(`${API}/api/v1/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword, name }),
    })

    if (!registerRes.ok) {
      const err = await registerRes.json().catch(() => ({ detail: 'Signup failed' }))
      const message = err?.message || err?.detail || 'Signup failed'
      return NextResponse.json({ ...err, message }, { status: registerRes.status })
    }

    // Auto-login after signup
    const loginRes = await fetch(`${API}/api/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: normalizedEmail, password: normalizedPassword }),
    })

    if (!loginRes.ok) {
      return NextResponse.json({ ok: true, message: 'Registered! Please login.' })
    }

    const { access_token } = await loginRes.json()
    const res = NextResponse.json({ ok: true })
    res.cookies.set({
      name: COOKIE,
      value: access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: MAX_AGE,
    })
    return res
  } catch {
    return NextResponse.json({ message: 'Bad request' }, { status: 400 })
  }
}
