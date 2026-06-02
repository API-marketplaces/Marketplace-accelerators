import { NextResponse } from 'next/server'

const API = process.env.FASTAPI_BASE_URL || 'http://localhost:8000' // ← fixed
const COOKIE = process.env.JWT_COOKIE_NAME || 'session'
const REFRESH_COOKIE = process.env.REFRESH_COOKIE_NAME || 'refresh_token'
const MAX_AGE = Number(process.env.JWT_COOKIE_MAX_AGE ?? 86400)

export async function POST(req: Request) {
  const body = await req.json()
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '').trim()

  const r = await fetch(`${API}/api/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: email, password }),
  })

  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: 'Login failed' }))
    const message = err?.message || err?.detail || 'Login failed'
    return NextResponse.json({ ...err, message }, { status: r.status })
  }

  const data = await r.json() as { access_token: string; refresh_token?: string; token_type?: string }

  const res = NextResponse.json({ ok: true })

  res.cookies.set({
    name: COOKIE,
    value: data.access_token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })

  if (data.refresh_token) {
    res.cookies.set({
      name: REFRESH_COOKIE,
      value: data.refresh_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  }

  return res
}
