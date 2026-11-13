import { NextResponse } from 'next/server';
import { getDb, getSessionUser, isSameOriginJson } from '@/lib/auth';
import { preserveIntegrationProjects } from '@/lib/integration';
import type { Project } from '@/types';

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

    // iControl'den otomatik eklenen projeler, onları henüz görmemiş bir tarayıcının
    // eski listesiyle ezilmesin (kullanıcı sildiyse deleted_ids'te olur, geri gelmez).
    if (updates.includes('projects')) {
      const sql = getDb();
      const rows = (await sql`
        SELECT key, value FROM app_data WHERE key = ANY(${['projects', 'deleted_ids']})
      `) as { key: string; value: unknown }[];
      const stored = rows.find(r => r.key === 'projects')?.value;
      const storedDeleted = rows.find(r => r.key === 'deleted_ids')?.value;
      const deletedIds = new Set<string>([
        ...(Array.isArray(storedDeleted) ? (storedDeleted as string[]) : []),
        ...(Array.isArray(body.deleted_ids) ? (body.deleted_ids as string[]) : []),
      ]);
      body.projects = preserveIntegrationProjects(
        body.projects as Project[],
        Array.isArray(stored) ? (stored as Project[]) : [],
        deletedIds
      );
    }

    // Veri kaybı koruması: 2+ kayıt içeren bir koleksiyon tek seferde boş listeyle
    // değiştirilemez (arayüz kayıtları tek tek siler; toplu boşaltma hata belirtisidir).
    const emptyKeys = updates.filter(k => (body[k] as unknown[]).length === 0);
    const protectedKeys = new Set<string>();
    if (emptyKeys.length > 0) {
      const sql = getDb();
      const rows = (await sql`
        SELECT key, jsonb_array_length(value) AS n FROM app_data
        WHERE key = ANY(${emptyKeys}) AND jsonb_typeof(value) = 'array'
      `) as { key: string; n: number }[];
      rows.forEach(r => { if (Number(r.n) >= 2) protectedKeys.add(r.key); });
    }

    for (const key of updates) {
      if (protectedKeys.has(key)) {
        console.warn(`POST /api/data: ${key} boş listeyle silinmek istendi, engellendi (kullanıcı: ${user.id})`);
        continue;
      }
      await upsertCollection(key, body[key]);
    }

    return NextResponse.json({
      success: true,
      lastUpdated: new Date().toISOString(),
      ...(protectedKeys.size > 0 ? { skipped: Array.from(protectedKeys) } : {}),
    });
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
