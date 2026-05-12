import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(process.env.JWT_COOKIE_NAME || 'session');
  if (!tokenCookie?.value) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get('fileId');
  const time_filter = searchParams.get('time_filter') || '7d';
  if (!fileId) return NextResponse.json({ message: 'fileId required' }, { status: 400 });
  try {
    const res = await fetch(`${FASTAPI_URL}/api/v1/rankings/${fileId}?time_filter=${time_filter}`, {
      headers: { Authorization: `Bearer ${tokenCookie.value}` },
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}