import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, user: null }, { status: 401 });
    return NextResponse.json({ success: true, user });
  } catch (error: unknown) {
    console.error('GET /api/auth/me error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, user: null, error: 'Sunucu hatası' }, { status: 500 });
  }
}
