import { NextResponse } from 'next/server'

const API = process.env.FASTAPI_BASE_URL || process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const COOKIE = process.env.JWT_COOKIE_NAME || 'session'
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
    const { email, password, firstName, lastName } = body
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedPassword = String(password || '').trim()
    const normalizedFirstName = String(firstName || '').trim()
    const normalizedLastName = String(lastName || '').trim()
    const name = `${normalizedFirstName} ${normalizedLastName}`.trim() || normalizedEmail

    const registerPayload = {
      email: normalizedEmail,
      password: normalizedPassword,
      name,
      first_name: normalizedFirstName,
      last_name: normalizedLastName,
      company_name: String(body.companyName || '').trim(),
      job_title: String(body.jobTitle || '').trim(),
      department: String(body.department || '').trim() || null,
      country: String(body.country || '').trim(),
      industry: String(body.industry || '').trim(),
      company_size: String(body.companySize || '').trim(),
      annual_revenue: String(body.annualRevenue || '').trim() || null,
      api_maturity: String(body.apiMaturity || '').trim(),
      primary_objectives: JSON.stringify(Array.isArray(body.primaryObjectives) ? body.primaryObjectives : []),
      api_gateway: String(body.apiGateway || '').trim(),
      apis_managed: String(body.apisManaged || '').trim(),
      team_size: String(body.teamSize || '').trim(),
      analytics_consent: Boolean(body.analyticsConsent),
    }

    const registerRes = await fetch(`${API}/api/v1/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload),
    })

    if (!registerRes.ok) {
      const { body, message } = await readBackendError(registerRes, 'Signup failed')
      return NextResponse.json({ ...body, message }, { status: registerRes.status })
    }

    const loginRes = await fetch(`${API}/api/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: normalizedEmail, password: normalizedPassword }),
    })

    if (!loginRes.ok) {
      const { message } = await readBackendError(loginRes, 'Registered! Please login.')
      return NextResponse.json({ ok: true, message })
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
  } catch (error: unknown) {
    return authProxyError(error)
  }
}

