import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get(process.env.JWT_COOKIE_NAME || 'session')

  if (!tokenCookie || !tokenCookie.value) {
    return NextResponse.json({ ok: false, message: 'not authenticated' }, { status: 401 })
  }

  try {
    // Forward the multipart form data directly to FastAPI
    const formData = await req.formData()

    const response = await fetch(`${FASTAPI_URL}/api/v1/uploadfile/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenCookie.value}`,
      },
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ ok: false, message: 'Upload failed' }, { status: 500 })
  }
}