import { NextResponse } from 'next/server';
import { getDb, getSessionUser, isSameOriginJson } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Kullanıcılar artık ayrı `app_users` tablosunda; burada asla okunmaz/yazılmaz.
const COLLECTIONS = [
  'projects', 'personnel', 'projectPersonnel', 'expenses',
  'advances', 'settlements', 'clientInvoices', 'dailyReports',
  'phoneControlRecords', 'deleted_ids'
];

// Yalnızca yöneticilerin görebileceği/değiştirebileceği koleksiyonlar
const ADMIN_ONLY = new Set(['clientInvoices']);

function allowedCollections(role: string): string[] {
  return role === 'admin' ? COLLECTIONS : COLLECTIONS.filter(k => !ADMIN_ONLY.has(k));
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Oturum gerekli' }, { status: 401 });
    }

    const sql = getDb();
    const keys = allowedCollections(user.role);
    const rows = await sql`
      SELECT key, value FROM app_data
      WHERE key = ANY(${keys})
    `;

    const db: Record<string, unknown> = {
      lastUpdated: new Date().toISOString(),
      version: 1,
    };
    keys.forEach(k => { db[k] = []; });
    rows.forEach((row: Record<string, unknown>) => {
      db[row.key as string] = row.value;
    });

    return NextResponse.json({ success: true, data: db });
  } catch (error: unknown) {
    console.error('GET /api/data error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: 'Veri okunamadı' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isSameOriginJson(req)) {
    return NextResponse.json({ success: false, error: 'Geçersiz istek' }, { status: 403 });
  }
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Oturum gerekli' }, { status: 401 });
    }

    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Geçersiz veri' }, { status: 400 });
    }

    // Rolün yazamayacağı koleksiyonlar sessizce yok sayılır
    const updates = allowedCollections(user.role).filter(k => body[k] !== undefined);

    for (const key of updates) {
      if (!Array.isArray(body[key])) {
        return NextResponse.json({ success: false, error: `${key} bir liste olmalı` }, { status: 400 });
      }
    }

    for (const key of updates) {
      await upsertCollection(key, body[key]);
    }

    return NextResponse.json({ success: true, lastUpdated: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('POST /api/data error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: 'Veri kaydedilemedi' }, { status: 500 });
  }
}

async function upsertCollection(key: string, value: unknown) {
  const sql = getDb();
  await sql`
    INSERT INTO app_data (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = NOW()
  `;
}
