import { NextResponse } from 'next/server'

const API = process.env.FASTAPI_BASE_URL || process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const COOKIE = process.env.JWT_COOKIE_NAME || 'session'
const REFRESH_COOKIE = process.env.REFRESH_COOKIE_NAME || 'refresh_token'
const MAX_AGE = Number(process.env.JWT_COOKIE_MAX_AGE ?? 86400)

async function readBackendError(response: Response, fallback: string) {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const body = await response.json().catch(() => ({}))
    return {
      body,
      message: body?.message || body?.detail || fallback,
    }
  }

  const text = await response.text().catch(() => '')
  return {
    body: { detail: text || fallback },
    message: text || fallback,
  }
}

function authProxyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const isLocalFallback = API.includes('localhost') || API.includes('127.0.0.1')

  return NextResponse.json(
    {
      message: isLocalFallback
        ? 'Auth backend is not configured. Set FASTAPI_BASE_URL or FASTAPI_URL in Azure App Service settings.'
        : `Could not reach auth backend: ${message}`,
    },
    { status: 502 }
  )
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '').trim()

    const response = await fetch(`${API}/api/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: email, password }),
    })

    if (!response.ok) {
      const { body: errorBody, message } = await readBackendError(response, 'Login failed')
      return NextResponse.json({ ...errorBody, message }, { status: response.status })
    }

    const data = await response.json() as { access_token: string; refresh_token?: string; token_type?: string }
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
  } catch (error: unknown) {
    return authProxyError(error)
  }
}
