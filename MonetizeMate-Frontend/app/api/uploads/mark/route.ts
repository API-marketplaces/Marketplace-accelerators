import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'
const configuredMaxUploadSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 250)
const MAX_UPLOAD_SIZE_MB =
  Number.isFinite(configuredMaxUploadSizeMb) && configuredMaxUploadSizeMb > 0
    ? configuredMaxUploadSizeMb
    : 250
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get(process.env.JWT_COOKIE_NAME || 'session')

  if (!tokenCookie || !tokenCookie.value) {
    return NextResponse.json({ ok: false, message: 'not authenticated' }, { status: 401 })
  }

  try {
    // Forward the multipart form data directly to FastAPI
    const formData = await req.formData()
    const uploadedFile = formData.get('file')

    if (uploadedFile instanceof File && uploadedFile.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { detail: `File is too large. Maximum allowed size is ${MAX_UPLOAD_SIZE_MB} MB.` },
        { status: 413 }
      )
    }

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
