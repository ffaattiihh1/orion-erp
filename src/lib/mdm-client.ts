'use client';
// İstemci tarafı: MDM cihaz listesini çeker (kısa önbellekli) ve zimmet kayıtlarıyla eşleştirir.
import type { MdmDevice, Tablet } from '@/types';
import { normCode } from '@/lib/tablet-code';

const CACHE_MS = 60_000;
let cache: { at: number; data: { devices: MdmDevice[]; fetchedAt: string } } | null = null;
let inflight: Promise<{ devices: MdmDevice[]; fetchedAt: string }> | null = null;

export async function mdmApi<T = Record<string, unknown>>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, body === undefined ? { cache: 'no-store' } : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.error || `İstek başarısız (${res.status})`);
  return data as T;
}

export function fetchMdmDevices(force = false) {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) return Promise.resolve(cache.data);
  if (!force && inflight) return inflight;
  inflight = mdmApi<{ devices: MdmDevice[]; fetchedAt: string }>('/api/mdm/devices')
    .then(d => { cache = { at: Date.now(), data: d }; return d; })
    .finally(() => { inflight = null; });
  return inflight;
}

/** Zimmet kaydının MDM cihazı: elle bağlantı > seri no > ad (ON-T10 = ON-T10) */
export function deviceForTablet(t: Tablet, devices: MdmDevice[]): MdmDevice | undefined {
  if (t.mdmDeviceId) return devices.find(d => d.id === t.mdmDeviceId);
  return (t.serialNumber ? devices.find(d => normCode(d.serialNumber) === normCode(t.serialNumber)) : undefined)
    || devices.find(d => normCode(d.name) === normCode(t.code));
}

/** MDM cihazının zimmet kaydı (deviceForTablet'in tersi) */
export function tabletForDevice(d: MdmDevice, tablets: Tablet[]): Tablet | undefined {
  return tablets.find(t => t.mdmDeviceId === d.id)
    || tablets.find(t => !t.mdmDeviceId && deviceForTablet(t, [d]) === d);
}

export function ago(iso?: string): { text: string; hours: number } {
  if (!iso) return { text: 'bilinmiyor', hours: Infinity };
  const ms = Date.now() - new Date(iso).getTime();
  const h = ms / 3_600_000;
  if (h < 1) return { text: `${Math.max(1, Math.round(ms / 60_000))} dk önce`, hours: h };
  if (h < 48) return { text: `${Math.round(h)} saat önce`, hours: h };
  return { text: `${Math.round(h / 24)} gün önce`, hours: h };
}

export const mapsUrl = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}`;
