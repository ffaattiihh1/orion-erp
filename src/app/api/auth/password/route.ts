import { NextResponse } from 'next/server';
import {
  findUserById, getSessionUser, isSameOriginJson, MIN_PASSWORD_LENGTH,
  setPassword, startSession, verifyPassword,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Kendi şifreni değiştir: { currentPassword, newPassword }
 * Yönetici başka kullanıcının şifresini sıfırlar: { userId, newPassword }
 */
export async function POST(req: Request) {
  if (!isSameOriginJson(req)) {
    return NextResponse.json({ success: false, message: 'Geçersiz istek' }, { status: 403 });
  }
  try {
    const me = await getSessionUser();
    if (!me) return NextResponse.json({ success: false, message: 'Oturum süresi doldu, tekrar giriş yapın.' }, { status: 401 });

    const { currentPassword, newPassword, userId } = await req.json();
    if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ success: false, message: `Yeni şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.` }, { status: 400 });
    }

    const targetId = typeof userId === 'string' && userId ? userId : me.id;

    if (targetId !== me.id) {
      if (me.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
      }
      const target = await findUserById(targetId);
      if (!target) return NextResponse.json({ success: false, message: 'Kullanıcı bulunamadı.' }, { status: 404 });
      await setPassword(targetId, newPassword);
      return NextResponse.json({ success: true, message: `${target.full_name} için yeni şifre kaydedildi.` });
    }

    const self = await findUserById(me.id);
    if (!self || typeof currentPassword !== 'string' || !verifyPassword(currentPassword, self.password_hash)) {
      return NextResponse.json({ success: false, message: 'Mevcut şifreniz hatalı.' }, { status: 400 });
    }
    const version = await setPassword(me.id, newPassword);
    // Diğer cihazlardaki oturumlar düşer, bu cihazın oturumu yenilenir
    await startSession(me.id, version);
    return NextResponse.json({ success: true, message: 'Şifreniz başarıyla değiştirildi.' });
  } catch (error: unknown) {
    console.error('POST /api/auth/password error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Sunucu hatası, lütfen tekrar deneyin.' }, { status: 500 });
  }
}
