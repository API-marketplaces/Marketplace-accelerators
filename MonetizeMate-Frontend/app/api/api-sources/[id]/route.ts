import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API = process.env.FASTAPI_BASE_URL || process.env.FASTAPI_URL || 'http://localhost:8000'
const COOKIE = process.env.JWT_COOKIE_NAME || 'session'

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(COOKIE)

    if (!sessionCookie?.value) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 })
    }

    const response = await fetch(`${API}/api/v1/api-sources/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${sessionCookie.value}`,
      },
    })

    const data = await response.json().catch(() => ({ message: 'Failed to delete connection' }))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error deleting API source:', error)
    return NextResponse.json({ message: 'Bad request' }, { status: 400 })
  }
}
