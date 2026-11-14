// SERVER-ONLY: Google Android Management API (ücretsiz) istemcisi.
// Ek paket kullanmaz: servis hesabı JWT'si Node crypto ile imzalanır.
import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getDb, getSessionUser } from '@/lib/auth';
import type { UserProfile } from '@/types';
import { mergeApps, type MdmApp } from '@/lib/mdm-apps';

const API = 'https://androidmanagement.googleapis.com/v1';
const SCOPE = 'https://www.googleapis.com/auth/androidmanagement';
export const IFIELD_PACKAGE = 'com.ipsos.ifield';
const CONFIG_KEY = 'mdm_config'; // app_data içinde; /api/data bu anahtarı okumaz/yazmaz

export interface MdmConfig {
  enterpriseName?: string;   // enterprises/LC0xxxx
  signupUrlName?: string;    // signupUrls/Cxxxx (kayıt sürerken)
  adminEmail?: string;       // FRP ve kayıt hesabı (tablet@orionarastirma.com)
  kiosk?: boolean;           // sadece iField açık
  lostPhone?: string;        // kayıp modunda ekranda görünecek telefon
  apps?: MdmApp[];           // iField dışında izin verilen / engellenen uygulamalar
}

interface ServiceAccount { client_email: string; private_key: string; project_id: string }

export class MdmError extends Error {
  constructor(message: string, public status = 500) { super(message); }
}

export function getServiceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new MdmError('GOOGLE_SERVICE_ACCOUNT_JSON ortam değişkeni tanımlı değil', 503);
  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf-8');
  try {
    const sa = JSON.parse(text) as ServiceAccount;
    if (!sa.client_email || !sa.private_key || !sa.project_id) throw new Error();
    return sa;
  } catch {
    throw new MdmError('GOOGLE_SERVICE_ACCOUNT_JSON okunamadı (JSON ya da base64 JSON olmalı)', 503);
  }
}

declare global {
  var __ORION_MDM_TOKEN__: { token: string; exp: number } | undefined;
}

async function getAccessToken(): Promise<string> {
  const cached = globalThis.__ORION_MDM_TOKEN__;
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;

  const sa = getServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: sa.client_email, scope: SCOPE, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  })}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    console.error('MDM token hatası:', data);
    throw new MdmError('Google servis hesabıyla oturum açılamadı (anahtarı kontrol edin)', 502);
  }
  globalThis.__ORION_MDM_TOKEN__ = { token: data.access_token, exp: Date.now() + Number(data.expires_in || 3600) * 1000 };
  return data.access_token;
}

/** Android Management API çağrısı. path: "enterprises/..." gibi (başında / yok). */
export async function amapi<T = Record<string, unknown>>(
  path: string,
  init: { method?: string; query?: Record<string, string | undefined>; body?: unknown } = {}
): Promise<T> {
  const token = await getAccessToken();
  const url = new URL(`${API}/${path}`);
  Object.entries(init.query || {}).forEach(([k, v]) => { if (v !== undefined) url.searchParams.set(k, v); });
  const res = await fetch(url, {
    method: init.method || 'GET',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = data?.error?.message || `HTTP ${res.status}`;
    console.error(`AMAPI ${init.method || 'GET'} ${path}:`, msg);
    throw new MdmError(`Google API hatası: ${msg}`, res.status >= 500 ? 502 : 400);
  }
  return data as T;
}

// ---------- Ayarlar (app_data.mdm_config) ----------
export async function readConfig(): Promise<MdmConfig> {
  const sql = getDb();
  const rows = (await sql`SELECT value FROM app_data WHERE key = ${CONFIG_KEY}`) as { value: MdmConfig }[];
  return rows[0]?.value || {};
}

export async function writeConfig(patch: Partial<MdmConfig>): Promise<MdmConfig> {
  const next = { ...(await readConfig()), ...patch };
  const sql = getDb();
  await sql`
    INSERT INTO app_data (key, value, updated_at)
    VALUES (${CONFIG_KEY}, ${JSON.stringify(next)}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
  return next;
}

export async function requireEnterprise(): Promise<{ config: MdmConfig; enterprise: string }> {
  const config = await readConfig();
  if (!config.enterpriseName) throw new MdmError('MDM kurulumu henüz tamamlanmadı', 409);
  return { config, enterprise: config.enterpriseName };
}

// ---------- Politika ----------
export const POLICY_ID = 'standart';

export function buildPolicy(config: MdmConfig) {
  return {
    applications: [
      { packageName: IFIELD_PACKAGE, installType: 'FORCE_INSTALLED' },
      // İzin verilenler kurulur (kioskta da görünür); verilmeyenler engellenir (ön yüklü Chrome dahil gizlenir)
      ...mergeApps(config.apps)
        .filter(a => a.packageName !== IFIELD_PACKAGE)
        .map(a => ({ packageName: a.packageName, installType: a.allowed ? 'FORCE_INSTALLED' : 'BLOCKED' })),
    ],
    // Konum hep açık, kullanıcı kapatamaz
    locationMode: 'LOCATION_ENFORCED',
    // Ayarlardan fabrika ayarına dönülemez; zorla sıfırlanırsa açılışta şirket hesabı istenir
    factoryResetDisabled: true,
    ...(config.adminEmail ? { frpAdminEmails: [config.adminEmail] } : {}),
    advancedSecurityOverrides: { developerSettings: 'DEVELOPER_SETTINGS_DISABLED' },
    deviceConnectivityManagement: { usbDataAccess: 'DISALLOW_USB_FILE_TRANSFER' },
    // Play'den sadece listedeki uygulamalar kurulabilir
    playStoreMode: 'WHITELIST',
    ...(config.kiosk ? { kioskCustomLauncherEnabled: true } : {}),
    statusReportingSettings: {
      hardwareStatusEnabled: true,
      softwareInfoEnabled: true,
      powerManagementEventsEnabled: true,
      networkInfoEnabled: true,
      deviceSettingsEnabled: true,
    },
  };
}

export async function pushPolicy(enterprise: string, config: MdmConfig) {
  return amapi(`${enterprise}/policies/${POLICY_ID}`, { method: 'PATCH', body: buildPolicy(config) });
}

// ---------- Rota yardımcıları ----------
/** Sadece admin. Hata durumunda NextResponse döner. */
export async function requireAdmin(): Promise<UserProfile | NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ success: false, error: 'Oturum gerekli' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ success: false, error: 'Yetkiniz yok' }, { status: 403 });
  return user;
}

export function errorResponse(e: unknown) {
  if (e instanceof MdmError) return NextResponse.json({ success: false, error: e.message }, { status: e.status });
  console.error('MDM:', e instanceof Error ? e.message : e);
  return NextResponse.json({ success: false, error: 'Sunucu hatası' }, { status: 500 });
}

/** devices/{id} adının bu enterprise'a ait olduğunu doğrular */
export function assertDeviceName(enterprise: string, name: unknown): string {
  if (typeof name !== 'string' || !new RegExp(`^${enterprise}/devices/[A-Za-z0-9_-]+$`).test(name)) {
    throw new MdmError('Geçersiz cihaz', 400);
  }
  return name;
}
