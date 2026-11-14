// SERVER-ONLY: ManageEngine MDM Plus (Cloud) REST API istemcisi.
// Kimlik doğrulama: Zoho OAuth 2.0 "Self Client" + refresh token.
//   - ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET: Vercel ortam değişkenleri
//   - refresh token: ERP'deki kurulum ekranında yapıştırılan tek seferlik koddan alınır,
//     app_data.mdm_config içinde saklanır (/api/data bu anahtara dokunmaz).
//     İstenirse ZOHO_REFRESH_TOKEN ortam değişkeni ile de verilebilir.
import { NextResponse } from 'next/server';
import { getDb, getSessionUser } from '@/lib/auth';
import type { UserProfile } from '@/types';

const ACCOUNTS_URL = (process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.eu').replace(/\/$/, '');
export const MDM_URL = (process.env.MDM_BASE_URL || 'https://mdm.manageengine.eu').replace(/\/$/, '');
export const MDM_SCOPES = 'MDMOnDemand.MDMInventory.ALL,MDMOnDemand.MDMDeviceMgmt.ALL';
const CONFIG_KEY = 'mdm_config';

export interface MdmConfig {
  refreshToken?: string;
  connectedAt?: string;
  lostPhone?: string;   // kayıp modunda ekranda görünecek telefon
}

export class MdmError extends Error {
  constructor(message: string, public status = 500) { super(message); }
}

export function missingEnv(): string[] {
  return ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET'].filter(k => !process.env[k]);
}

function clientCreds() {
  const missing = missingEnv();
  if (missing.length) throw new MdmError(`Ortam değişkeni eksik: ${missing.join(', ')}`, 503);
  return { client_id: process.env.ZOHO_CLIENT_ID!, client_secret: process.env.ZOHO_CLIENT_SECRET! };
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

async function refreshToken(): Promise<string> {
  const token = process.env.ZOHO_REFRESH_TOKEN || (await readConfig()).refreshToken;
  if (!token) throw new MdmError('ManageEngine bağlantısı kurulmadı', 409);
  return token;
}

// ---------- OAuth ----------
declare global {
  var __ORION_ME_TOKEN__: { token: string; exp: number } | undefined;
}

async function tokenRequest(params: Record<string, string>) {
  const res = await fetch(`${ACCOUNTS_URL}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    console.error('Zoho token hatası:', data?.error || res.status);
    return { ok: false as const, error: String(data?.error || `HTTP ${res.status}`) };
  }
  return { ok: true as const, data };
}

/** Kurulum: Self Client'ta üretilen tek seferlik kodu refresh token'a çevirir ve saklar */
export async function connectWithGrantCode(code: string): Promise<void> {
  const r = await tokenRequest({ ...clientCreds(), grant_type: 'authorization_code', code });
  if (!r.ok) {
    throw new MdmError(r.error === 'invalid_code'
      ? 'Kod geçersiz ya da süresi doldu. Zoho konsolunda yeni kod üretip hemen yapıştırın.'
      : `Zoho bağlantısı kurulamadı (${r.error})`, 400);
  }
  if (!r.data.refresh_token) throw new MdmError('Zoho refresh token vermedi; kodu yeniden üretin', 400);
  globalThis.__ORION_ME_TOKEN__ = r.data.access_token
    ? { token: r.data.access_token, exp: Date.now() + Number(r.data.expires_in || 3600) * 1000 }
    : undefined;
  await writeConfig({ refreshToken: r.data.refresh_token, connectedAt: new Date().toISOString() });
}

async function getAccessToken(force = false): Promise<string> {
  const cached = globalThis.__ORION_ME_TOKEN__;
  if (!force && cached && cached.exp > Date.now() + 60_000) return cached.token;
  const r = await tokenRequest({ ...clientCreds(), grant_type: 'refresh_token', refresh_token: await refreshToken() });
  if (!r.ok || !r.data.access_token) {
    throw new MdmError(r.ok ? 'Zoho erişim anahtarı alınamadı' : `ManageEngine oturumu açılamadı (${r.error}). Bağlantıyı yeniden kurun.`, 502);
  }
  globalThis.__ORION_ME_TOKEN__ = { token: r.data.access_token, exp: Date.now() + Number(r.data.expires_in || 3600) * 1000 };
  return r.data.access_token;
}

/** ManageEngine MDM çağrısı. path: "/api/v1/mdm/..." */
export async function meapi<T = Record<string, unknown>>(
  path: string,
  init: { method?: string; query?: Record<string, string | number | boolean | undefined>; body?: unknown } = {}
): Promise<T> {
  const url = new URL(`${MDM_URL}${path}`);
  Object.entries(init.query || {}).forEach(([k, v]) => { if (v !== undefined) url.searchParams.set(k, String(v)); });

  const call = async (token: string) => fetch(url, {
    method: init.method || 'GET',
    headers: { Authorization: `Zoho-oauthtoken ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  });

  let res = await call(await getAccessToken());
  if (res.status === 401) res = await call(await getAccessToken(true)); // süresi dolmuş anahtar

  const text = await res.text();
  let data: Record<string, unknown> = {};
  try { data = text ? JSON.parse(text) : {}; } catch { /* JSON olmayan yanıt */ }
  if (!res.ok) {
    const desc = String(data.localized_error_description || data.error_description || `HTTP ${res.status}`);
    console.error(`ManageEngine ${init.method || 'GET'} ${path}: ${res.status} ${data.error_code || ''} ${desc}`);
    if (res.status === 401 || res.status === 403) {
      throw new MdmError(`ManageEngine erişimi reddetti: ${desc}. Lisans/sürüm API'ye izin vermiyor olabilir ya da bağlantıyı yeniden kurmak gerekebilir.`, 502);
    }
    if (res.status === 412) throw new MdmError('Bu komut bu tablet için geçerli değil', 400);
    if (res.status === 429) throw new MdmError('ManageEngine istek sınırı aşıldı, biraz sonra tekrar deneyin', 429);
    throw new MdmError(`ManageEngine hatası: ${desc}`, res.status >= 500 ? 502 : 400);
  }
  return data as T;
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

export function assertDeviceId(id: unknown): string {
  const s = String(id ?? '');
  if (!/^\d{1,25}$/.test(s)) throw new MdmError('Geçersiz cihaz', 400);
  return s;
}

/** Sınırlı eşzamanlılıkla map */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]); }
  }));
  return out;
}
