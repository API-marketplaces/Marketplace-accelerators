import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

// Raise the Next.js route-handler timeout to 30s.
// The backend processes large files (100k+ rows) and can take 5-10s.
// Without this, Next.js dev cuts the connection at ~10s and the browser
// receives an AbortError ("signal is aborted without reason").
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(process.env.JWT_COOKIE_NAME || 'session');
  if (!tokenCookie?.value) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get('fileId');
  const time_filter = searchParams.get('time_filter') || '7d';
  if (!fileId) return NextResponse.json({ message: 'fileId required' }, { status: 400 });

  try {
    const res = await fetch(`${FASTAPI_URL}/api/v1/clients/${fileId}?time_filter=${time_filter}`, {
      headers: { Authorization: `Bearer ${tokenCookie.value}` },
      // Forward the incoming request signal so that if the browser
      // cancels (user navigates away) the FastAPI call is also cancelled.
      signal: req.signal,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    // AbortError means the client cancelled — not a server fault.
    if (err?.name === 'AbortError') {
      return NextResponse.json({ message: 'Request cancelled' }, { status: 499 });
    }
    console.error(`[analytics/clients] error:`, err);
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}