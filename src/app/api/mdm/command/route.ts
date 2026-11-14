import { NextResponse } from 'next/server';
import { isSameOriginJson } from '@/lib/auth';
import { amapi, requireAdmin, requireEnterprise, errorResponse, assertDeviceName, MdmError } from '@/lib/mdm';

const msg = (text: string) => ({ defaultMessage: text });

/**
 * Uzaktan komut: LOCK | RESET_PASSWORD | START_LOST_MODE | STOP_LOST_MODE | WIPE
 * WIPE geri alınamaz: cihaz fabrika ayarına döner ve MDM'den çıkar (FRP yine şirket hesabını ister).
 */
export async function POST(req: Request) {
  if (!isSameOriginJson(req)) return NextResponse.json({ success: false, error: 'Geçersiz istek' }, { status: 403 });
  const user = await requireAdmin();
  if (user instanceof NextResponse) return user;
  try {
    const body = await req.json();
    const { config, enterprise } = await requireEnterprise();
    const device = assertDeviceName(enterprise, body?.device);
    const type = String(body?.type || '');

    if (type === 'WIPE') {
      if (body?.confirm !== true) throw new MdmError('Silme için onay gerekli', 400);
      await amapi(device, {
        method: 'DELETE',
        query: { wipeDataFlags: 'WIPE_EXTERNAL_STORAGE', wipeReasonMessage: 'Orion Araştırma tarafından silindi' },
      });
      console.warn(`MDM WIPE: ${device} (kullanıcı: ${user.id})`);
      return NextResponse.json({ success: true });
    }

    let command: Record<string, unknown>;
    switch (type) {
      case 'LOCK':
        command = { type: 'LOCK' };
        break;
      case 'RESET_PASSWORD': {
        const pin = String(body?.newPassword || '');
        if (!/^\d{4,12}$/.test(pin)) throw new MdmError('Yeni şifre 4-12 rakam olmalı', 400);
        command = { type: 'RESET_PASSWORD', newPassword: pin, resetPasswordFlags: ['REQUIRE_ENTRY', 'LOCK_NOW'] };
        break;
      }
      case 'START_LOST_MODE': {
        const text = String(body?.message || '').trim().slice(0, 200)
          || 'Bu tablet Orion Araştırma\'ya aittir. Bulduysanız lütfen arayın.';
        const phone = String(body?.phone || config.lostPhone || '').trim();
        command = {
          type: 'START_LOST_MODE',
          startLostModeParams: {
            lostOrganization: msg('Orion Araştırma'),
            lostMessage: msg(text),
            ...(phone ? { lostPhoneNumber: msg(phone) } : {}),
          },
        };
        break;
      }
      case 'STOP_LOST_MODE':
        command = { type: 'STOP_LOST_MODE', stopLostModeParams: {} };
        break;
      default:
        throw new MdmError('Bilinmeyen komut', 400);
    }

    await amapi(`${device}:issueCommand`, { method: 'POST', body: command });
    console.info(`MDM ${type}: ${device} (kullanıcı: ${user.id})`);
    return NextResponse.json({ success: true });
  } catch (e) { return errorResponse(e); }
}
