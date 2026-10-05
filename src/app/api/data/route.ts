import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

const COLLECTIONS = [
  'projects', 'personnel', 'projectPersonnel', 'expenses',
  'advances', 'settlements', 'clientInvoices', 'dailyReports',
  'phoneControlRecords', 'users'
];

export async function GET() {
  try {
    const sql = getDb();
    
    // Fetch all collection keys in one query
    const rows = await sql`
      SELECT key, value FROM app_data 
      WHERE key = ANY(${COLLECTIONS})
    `;

    const db: Record<string, unknown> = {
      lastUpdated: new Date().toISOString(),
      version: 1,
    };

    // Defaults
    COLLECTIONS.forEach(k => { db[k] = []; });

    rows.forEach((row: Record<string, unknown>) => {
      db[row.key as string] = row.value;
    });

    return NextResponse.json({ success: true, data: db });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to read database';
    console.error('GET /api/data error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sql = getDb();

    // Upsert each collection that was provided in the payload
    const updates = COLLECTIONS.filter(k => body[k] !== undefined);
    
    if (updates.length === 0) {
      return NextResponse.json({ success: true, data: body });
    }

    // Upsert all provided collections
    for (const key of updates) {
      await sql`
        INSERT INTO app_data (key, value, updated_at)
        VALUES (${key}, ${JSON.stringify(body[key])}::jsonb, NOW())
        ON CONFLICT (key) DO UPDATE 
        SET value = EXCLUDED.value, updated_at = NOW()
      `;
    }

    return NextResponse.json({ 
      success: true, 
      data: { ...body, lastUpdated: new Date().toISOString() } 
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to write database';
    console.error('POST /api/data error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
