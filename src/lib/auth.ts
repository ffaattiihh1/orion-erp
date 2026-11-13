// SERVER-ONLY: Bu dosya yalnızca Route Handler'lardan import edilmelidir.
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';
import type { UserProfile, UserRole } from '@/types';

export const SESSION_COOKIE = 'orion_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 gün
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
export const MIN_PASSWORD_LENGTH = 8;

// İlk kurulumda veritabanına eklenecek kullanıcılar (şifre YOK — INITIAL_PASSWORD env ile atanır)
const SEED_USERS: Omit<UserProfile, 'password'>[] = [
  { id: 'user-admin-fatih', username: 'fatih.sakar', email: 'fatihsakar@orionarastirma.com', fullName: 'Fatih Sakar', role: 'admin', phone: '+90 533 500 60 70' },
  { id: 'user-spv-emrah', username: 'emrah.gundeyer', email: 'emrahgundeyer@orionarastirma.com', fullName: 'Emrah Gündeyer', role: 'spv', phone: '+90 535 400 50 60' },
  { id: 'user-admin-kazim', username: 'kazim.senol', email: 'kazimsenol@orionarastirma.com', fullName: 'Kazım Şenol', role: 'admin', phone: '+90 532 200 30 40' },
];

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error('SESSION_SECRET ortam değişkeni en az 32 karakter olmalı');
  }
  return s;
}

// ---------- Şifre hash (scrypt) ----------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [algo, saltB64, hashB64] = stored.split('$');
  if (algo !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

// ---------- Kullanıcı tablosu ----------
interface UserRow {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  password_hash: string | null;
  session_version: number;
  failed_attempts: number;
  locked_until: string | null;
}

export function toProfile(r: UserRow): UserProfile {
  return {
    id: r.id,
    username: r.username,
    email: r.email,
    fullName: r.full_name,
    role: r.role,
    phone: r.phone ?? undefined,
  };
}

let schemaReady: Promise<void> | null = null;

export function ensureUsersTable(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getDb();
      await sql`
        CREATE TABLE IF NOT EXISTS app_users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT NOT NULL,
          full_name TEXT NOT NULL,
          role TEXT NOT NULL,
          phone TEXT,
          password_hash TEXT,
          session_version INTEGER NOT NULL DEFAULT 1,
          failed_attempts INTEGER NOT NULL DEFAULT 0,
          locked_until TIMESTAMPTZ,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      const initial = process.env.INITIAL_PASSWORD;
      for (const u of SEED_USERS) {
        const hash = initial && initial.length >= MIN_PASSWORD_LENGTH ? hashPassword(initial) : null;
        await sql`
          INSERT INTO app_users (id, username, email, full_name, role, phone, password_hash)
          VALUES (${u.id}, ${u.username}, ${u.email}, ${u.fullName}, ${u.role}, ${u.phone ?? null}, ${hash})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      // Daha önce şifresiz eklenmiş kullanıcılara INITIAL_PASSWORD atanır (sonradan env girildiyse)
      if (initial && initial.length >= MIN_PASSWORD_LENGTH) {
        const rows = (await sql`SELECT id FROM app_users WHERE password_hash IS NULL`) as { id: string }[];
        for (const r of rows) {
          await sql`UPDATE app_users SET password_hash = ${hashPassword(initial)} WHERE id = ${r.id} AND password_hash IS NULL`;
        }
      }
    })().catch(err => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

export async function findUserByLogin(login: string): Promise<UserRow | null> {
  await ensureUsersTable();
  const sql = getDb();
  const clean = login.trim().toLowerCase();
  const rows = (await sql`
    SELECT * FROM app_users WHERE LOWER(username) = ${clean} OR LOWER(email) = ${clean} LIMIT 1
  `) as UserRow[];
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  await ensureUsersTable();
  const sql = getDb();
  const rows = (await sql`SELECT * FROM app_users WHERE id = ${id} LIMIT 1`) as UserRow[];
  return rows[0] ?? null;
}

export async function listUsers(): Promise<UserProfile[]> {
  await ensureUsersTable();
  const sql = getDb();
  const rows = (await sql`SELECT * FROM app_users ORDER BY full_name`) as UserRow[];
  return rows.map(toProfile);
}

export type LoginResult =
  | { ok: true; user: UserRow }
  | { ok: false; error: string };

export async function attemptLogin(login: string, password: string): Promise<LoginResult> {
  const sql = getDb();
  const user = await findUserByLogin(login);
  const genericError = 'Kullanıcı adı veya şifre hatalı.';
  if (!user) {
    // Zamanlama farkıyla kullanıcı adı tahmin edilmesin diye boşa hash hesapla
    verifyPassword(password, hashPassword('dummy-password'));
    return { ok: false, error: genericError };
  }
  if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
    return { ok: false, error: `Çok fazla hatalı deneme. ${LOCK_MINUTES} dakika sonra tekrar deneyin.` };
  }
  if (!user.password_hash) {
    return { ok: false, error: 'Bu hesaba henüz şifre tanımlanmamış. Yöneticinize başvurun.' };
  }
  if (!verifyPassword(password, user.password_hash)) {
    const attempts = user.failed_attempts + 1;
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      await sql`
        UPDATE app_users SET failed_attempts = 0,
          locked_until = NOW() + make_interval(mins => ${LOCK_MINUTES}::int)
        WHERE id = ${user.id}
      `;
    } else {
      await sql`UPDATE app_users SET failed_attempts = ${attempts} WHERE id = ${user.id}`;
    }
    return { ok: false, error: genericError };
  }
  if (user.failed_attempts > 0 || user.locked_until) {
    await sql`UPDATE app_users SET failed_attempts = 0, locked_until = NULL WHERE id = ${user.id}`;
  }
  return { ok: true, user };
}

/** Şifreyi günceller ve tüm eski oturumları geçersiz kılar. Yeni session_version döner. */
export async function setPassword(userId: string, newPassword: string): Promise<number> {
  const sql = getDb();
  const rows = (await sql`
    UPDATE app_users
    SET password_hash = ${hashPassword(newPassword)},
        session_version = session_version + 1,
        failed_attempts = 0, locked_until = NULL, updated_at = NOW()
    WHERE id = ${userId}
    RETURNING session_version
  `) as { session_version: number }[];
  return rows[0]?.session_version ?? 1;
}

// ---------- Oturum çerezi (HMAC imzalı) ----------
interface SessionPayload {
  uid: string;
  v: number; // session_version
  exp: number; // unix saniye
}

function sign(data: string): string {
  return crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');
}

function encodeSession(p: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(p)).toString('base64url');
  return `${data}.${sign(data)}`;
}

function decodeSession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = Buffer.from(sign(data));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;
  try {
    const p = JSON.parse(Buffer.from(data, 'base64url').toString()) as SessionPayload;
    if (!p.uid || typeof p.v !== 'number' || p.exp * 1000 < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}

export async function startSession(userId: string, sessionVersion: number): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession({
    uid: userId,
    v: sessionVersion,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Geçerli oturumun kullanıcısını döner; yoksa null. */
export async function getSessionUser(): Promise<UserProfile | null> {
  const store = await cookies();
  const payload = decodeSession(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  const user = await findUserById(payload.uid);
  if (!user || user.session_version !== payload.v) return null;
  return toProfile(user);
}

/** Basit CSRF koruması: yalnızca aynı origin'den gelen JSON isteklerini kabul et. */
export function isSameOriginJson(req: Request): boolean {
  const ct = req.headers.get('content-type') || '';
  if (!ct.toLowerCase().startsWith('application/json')) return false;
  const origin = req.headers.get('origin');
  if (!origin) return true; // aynı origin fetch'lerde bazı tarayıcılar göndermeyebilir
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
