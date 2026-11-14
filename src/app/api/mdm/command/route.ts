import { NextResponse } from 'next/server';
import { isSameOriginJson } from '@/lib/auth';
import { meapi, requireAdmin, readConfig, errorResponse, assertDeviceId, MdmError } from '@/lib/mdm';

const DEFAULT_LOST_MESSAGE = 'Bu tablet Orion Araştırma’ya aittir. Bulduysanız lütfen arayın.';

/**
 * Uzaktan komut: lock | enable_lost_mode | disable_lost_mode | remote_alarm | fetch_location | rename
 * Silme (wipe) bilerek yok: yalnızca ManageEngine panelinden yapılır.
 */
export async function POST(req: Request) {
  if (!isSameOriginJson(req)) return NextResponse.json({ success: false, error: 'Geçersiz istek' }, { status: 403 });
  const user = await requireAdmin();
  if (user instanceof NextResponse) return user;
  try {
    const body = await req.json();
    const id = assertDeviceId(body?.deviceId);
    const type = String(body?.type || '');

    if (type === 'rename') {
      const name = String(body?.name || '').trim().toUpperCase();
      if (!/^[A-Z0-9ÇĞİÖŞÜ _-]{1,40}$/.test(name)) throw new MdmError('Ad 1-40 karakter olmalı (örn. ON-T01)', 400);
      await meapi(`/api/v1/mdm/devices/${id}`, { method: 'PUT', body: { name } });
      return NextResponse.json({ success: true });
    }

    if (type === 'enable_lost_mode') {
      const config = await readConfig();
      const phone = String(body?.phone || config.lostPhone || '').trim();
      if (phone && !/^[+0-9 ()-]{7,20}$/.test(phone)) throw new MdmError('Telefon numarası geçersiz', 400);
      const message = String(body?.message || '').trim().slice(0, 200) || DEFAULT_LOST_MESSAGE;
      await meapi(`/api/v1/mdm/devices/${id}/actions/enable_lost_mode`, {
        method: 'POST',
        body: { lock_message: message, phone_number: phone, audit_message: `ERP: ${user.fullName}` },
      });
      console.warn(`MDM kayıp modu açıldı: ${id} (kullanıcı: ${user.id})`);
      return NextResponse.json({ success: true });
    }

    const simple = ['lock', 'disable_lost_mode', 'remote_alarm', 'fetch_location'];
    if (!simple.includes(type)) throw new MdmError('Bilinmeyen komut', 400);
    await meapi(`/api/v1/mdm/devices/${id}/actions/${type}`, { method: 'POST', body: {} });
    return NextResponse.json({ success: true });
  } catch (e) { return errorResponse(e); }
}
