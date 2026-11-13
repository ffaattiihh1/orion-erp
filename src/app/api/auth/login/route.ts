import { NextResponse } from 'next/server';
import { attemptLogin, isSameOriginJson, startSession, toProfile } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!isSameOriginJson(req)) {
    return NextResponse.json({ success: false, error: 'Geçersiz istek' }, { status: 403 });
  }
  try {
    const { username, password } = await req.json();
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return NextResponse.json({ success: false, error: 'Kullanıcı adı ve şifre gerekli.' }, { status: 400 });
    }
    const result = await attemptLogin(username, password);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 });
    }
    await startSession(result.user.id, result.user.session_version);
    return NextResponse.json({ success: true, user: toProfile(result.user) });
  } catch (error: unknown) {
    console.error('POST /api/auth/login error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: 'Sunucu hatası, lütfen tekrar deneyin.' }, { status: 500 });
  }
}
