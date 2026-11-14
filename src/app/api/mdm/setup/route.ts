import { NextResponse } from 'next/server';
import { isSameOriginJson } from '@/lib/auth';
import { requireAdmin, errorResponse, connectWithGrantCode, writeConfig, MdmError } from '@/lib/mdm';

/**
 * action=connect    : { code } Zoho Self Client kodunu bağlantıya çevirir
 * action=settings   : { lostPhone }
 * action=disconnect : saklanan bağlantıyı siler
 */
export async function POST(req: Request) {
  if (!isSameOriginJson(req)) return NextResponse.json({ success: false, error: 'Geçersiz istek' }, { status: 403 });
  const user = await requireAdmin();
  if (user instanceof NextResponse) return user;
  try {
    const body = await req.json();
    const action = String(body?.action || '');

    if (action === 'connect') {
      const code = String(body?.code || '').trim();
      if (!/^[0-9a-zA-Z.]{20,200}$/.test(code)) throw new MdmError('Kod biçimi hatalı (1000.xxxx… şeklinde olmalı)', 400);
      await connectWithGrantCode(code);
      console.info(`MDM: ManageEngine bağlantısı kuruldu (kullanıcı: ${user.id})`);
      return NextResponse.json({ success: true });
    }

    if (action === 'settings') {
      const lostPhone = String(body?.lostPhone || '').trim();
      if (lostPhone && !/^[+0-9 ()-]{7,20}$/.test(lostPhone)) throw new MdmError('Telefon numarası geçersiz', 400);
      await writeConfig({ lostPhone });
      return NextResponse.json({ success: true });
    }

    if (action === 'disconnect') {
      await writeConfig({ refreshToken: undefined, connectedAt: undefined });
      globalThis.__ORION_ME_TOKEN__ = undefined;
      return NextResponse.json({ success: true });
    }

    throw new MdmError('Bilinmeyen işlem', 400);
  } catch (e) { return errorResponse(e); }
}
