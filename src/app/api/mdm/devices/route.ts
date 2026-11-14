import { NextResponse } from 'next/server';
import { requireAdmin, errorResponse, meapi, mapLimit } from '@/lib/mdm';
import type { MdmDevice, MdmLocation } from '@/types';

interface MeListDevice {
  device_id: string | number;
  device_name?: string;
  serial_number?: string;
  model?: string;
  os_version?: string;
  imei?: string | string[];
  is_lost_mode_enabled?: boolean;
  registered_time?: number | string;
}

interface MeLocation { latitude?: number | string; longitude?: number | string; located_time?: number | string; added_time?: number | string }

const iso = (ms?: number | string) => {
  const n = Number(ms);
  return n > 0 ? new Date(n).toISOString() : undefined;
};

/** Tek bir alt sorgu hata verirse liste yine dönsün */
async function soft<T>(p: Promise<T>): Promise<T | undefined> {
  try { return await p; } catch { return undefined; }
}

function pickLocation(list?: MeLocation[]): MdmLocation | undefined {
  const valid = (list || [])
    .map(l => ({ lat: Number(l.latitude), lng: Number(l.longitude), t: Number(l.located_time || l.added_time) || 0 }))
    .filter(l => Number.isFinite(l.lat) && Number.isFinite(l.lng) && !(l.lat === 0 && l.lng === 0));
  if (!valid.length) return undefined;
  const last = valid.reduce((a, b) => (b.t > a.t ? b : a));
  return { lat: last.lat, lng: last.lng, at: iso(last.t) };
}

/** Kayıtlı tabletler: ad, seri no, pil, son bağlantı, son konum */
export async function GET() {
  const user = await requireAdmin();
  if (user instanceof NextResponse) return user;
  try {
    const all: MeListDevice[] = [];
    for (let offset = 0; offset < 2000; offset += 200) {
      const page = await meapi<{ devices?: MeListDevice[] }>('/api/v1/mdm/devices', {
        query: { exclude_removed: true, limit: 200, offset },
      });
      const batch = page.devices || [];
      all.push(...batch);
      if (batch.length < 200) break;
    }

    const devices = await mapLimit(all, 4, async (d): Promise<MdmDevice> => {
      const id = String(d.device_id);
      const [detail, summary, locs] = await Promise.all([
        soft(meapi<{ battery_level?: number | string }>(`/api/v1/mdm/devices/${id}`)),
        soft(meapi<{ last_contact_time?: number | string }>(`/api/v1/mdm/devices/${id}/summary`)),
        soft(meapi<{ locations?: MeLocation[] }>(`/api/v1/mdm/devices/${id}/locations`)),
      ]);
      const battery = Number(detail?.battery_level);
      return {
        id,
        name: d.device_name || id,
        model: d.model,
        serialNumber: d.serial_number || undefined,
        imei: Array.isArray(d.imei) ? d.imei.filter(Boolean)[0] : d.imei || undefined,
        osVersion: d.os_version,
        lostMode: !!d.is_lost_mode_enabled,
        enrolledAt: iso(d.registered_time),
        lastSeenAt: iso(summary?.last_contact_time),
        batteryLevel: Number.isFinite(battery) && battery >= 0 ? battery : undefined,
        location: pickLocation(locs?.locations),
      };
    });

    devices.sort((a, b) => a.name.localeCompare(b.name, 'tr', { numeric: true }));
    return NextResponse.json({ success: true, devices, fetchedAt: new Date().toISOString() });
  } catch (e) { return errorResponse(e); }
}
