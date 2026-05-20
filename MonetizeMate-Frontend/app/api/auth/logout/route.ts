import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

export async function POST() {
  const cookieStore = await cookies()
  const cookieName = process.env.JWT_COOKIE_NAME || 'session'
  const tokenCookie = cookieStore.get(cookieName)
  let uploadsDeleted = false

  if (tokenCookie?.value) {
    try {
      const deleteResponse = await fetch(`${FASTAPI_URL}/api/v1/files/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenCookie.value}`,
        },
      })
      uploadsDeleted = deleteResponse.ok
    } catch (error) {
      console.error('Failed to delete uploaded files during logout:', error)
    }
  }

  const res = NextResponse.json({ ok: true, uploadsDeleted })
  // Clear the session cookie properly
  res.cookies.set({
    name: cookieName,
    value: '',
    httpOnly: true,
    expires: new Date(0), // expire immediately
    path: '/',
  })
  return res
}
