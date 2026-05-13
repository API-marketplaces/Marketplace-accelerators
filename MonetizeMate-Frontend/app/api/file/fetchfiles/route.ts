import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(process.env.JWT_COOKIE_NAME || 'session');

  if (!tokenCookie || !tokenCookie.value) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {

    // User is authenticated, now fetch the files
    const { searchParams } = new URL(req.url);
    const decisionMetrics = searchParams.get('decisionMetrics');

    if (!decisionMetrics) {
      return NextResponse.json({ message: 'decisionMetrics parameter is required' }, { status: 400 });
    }

    const filesResponse = await fetch(`${FASTAPI_URL}/api/v1/files?decisionMetrics=${decisionMetrics}`, {
      headers: {
        Authorization: `Bearer ${tokenCookie.value}`,
      },
    });

    const files = await filesResponse.json();
    return NextResponse.json(files, { status: filesResponse.status });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}