import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(process.env.JWT_COOKIE_NAME || 'session');
  if (!tokenCookie?.value) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const res = await fetch(`${FASTAPI_URL}/api/v1/concierge/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCookie.value}`,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ message: 'AI service unavailable' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(process.env.JWT_COOKIE_NAME || 'session');
  if (!tokenCookie?.value) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get('fileId');

  try {
    const url = fileId
      ? `${FASTAPI_URL}/api/v1/concierge/suggestions?file_id=${fileId}`
      : `${FASTAPI_URL}/api/v1/concierge/suggestions`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${tokenCookie.value}` },
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
}