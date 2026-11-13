import { NextResponse } from 'next/server';
import { getSessionUser, listUsers } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Yalnızca yöneticiler: şifre sıfırlama ekranı için kullanıcı listesi (hash içermez)
export async function GET() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ success: false, error: 'Oturum gerekli' }, { status: 401 });
  if (me.role !== 'admin') return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 });
  return NextResponse.json({ success: true, users: await listUsers() });
}
