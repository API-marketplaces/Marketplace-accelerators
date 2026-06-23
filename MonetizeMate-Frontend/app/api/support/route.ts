import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@monetizemate.com'
const FASTAPI_URL = process.env.FASTAPI_URL || process.env.FASTAPI_BASE_URL || 'http://localhost:8000'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const email = String(formData.get('email') || '').trim()
    const application = String(formData.get('application') || 'MonetizeMate').trim()
    const message = String(formData.get('message') || '').trim()
    const files = formData.getAll('attachments').filter((item) => item instanceof File) as File[]

    if (!email || !message) {
      return NextResponse.json(
        { message: 'Email address and message are required.' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get(process.env.JWT_COOKIE_NAME || 'session')
    const attachments = files.map((file) => `${file.name} (${file.size} bytes)`)

    const response = await fetch(`${FASTAPI_URL}/api/v1/support/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(tokenCookie?.value ? { Authorization: `Bearer ${tokenCookie.value}` } : {}),
      },
      body: JSON.stringify({ email, application, message, attachments }),
      cache: 'no-store',
    })
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.message || 'Unable to send support message right now.')
    }

    return NextResponse.json({
      ok: true,
      message: data.message || `Thanks, your message has been sent to ${SUPPORT_EMAIL}.`,
    })
  } catch {
    return NextResponse.json(
      { message: 'Unable to send support message right now.' },
      { status: 500 }
    )
  }
}
