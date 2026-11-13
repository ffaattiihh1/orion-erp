import { NextResponse } from 'next/server';
import { getDb } from '@/lib/auth';
import { corsHeaders, decideImports, isValidIntegrationKey, type IncomingProject } from '@/lib/integration';
import type { Project } from '@/types';

export const dynamic = 'force-dynamic';

const MAX_PROJECTS = 200;

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

/**
 * iControl → Orion Saha proje aktarımı.
 * POST { projects: [{ code, title?, clientName?, plannedSurveys?, startDate?, endDate? }] }
 * ?dryRun=1 → hiçbir şey yazmadan ne yapılacağını döner.
 * Yalnızca YENİ proje ekler; mevcut hiçbir kaydı değiştirmez veya silmez.
 */
export async function POST(req: Request) {
  const headers = corsHeaders(req);
  if (!isValidIntegrationKey(req)) {
    return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401, headers });
  }

  try {
    const dryRun = new URL(req.url).searchParams.get('dryRun') === '1';
    const body = await req.json().catch(() => null);
    const list = body?.projects;
    if (!Array.isArray(list) || list.length > MAX_PROJECTS) {
      return NextResponse.json({ success: false, error: `projects 1-${MAX_PROJECTS} arası bir liste olmalı` }, { status: 400, headers });
    }
    const incoming: IncomingProject[] = list
      .filter((p: unknown): p is IncomingProject => !!p && typeof (p as IncomingProject).code === 'string')
      .map((p: IncomingProject) => ({
        code: String(p.code).slice(0, 64),
        title: typeof p.title === 'string' ? p.title : undefined,
        clientName: typeof p.clientName === 'string' ? p.clientName : undefined,
        plannedSurveys: Number(p.plannedSurveys) || 0,
        startDate: typeof p.startDate === 'string' ? p.startDate : undefined,
        endDate: typeof p.endDate === 'string' ? p.endDate : undefined,
      }));

    const sql = getDb();
    const rows = (await sql`
      SELECT key, value FROM app_data WHERE key = ANY(${['projects', 'deleted_ids']})
    `) as { key: string; value: unknown }[];
    const stored = rows.find(r => r.key === 'projects')?.value;
    const deleted = rows.find(r => r.key === 'deleted_ids')?.value;
    const existing: Project[] = Array.isArray(stored) ? (stored as Project[]) : [];
    const deletedIds = new Set<string>(Array.isArray(deleted) ? (deleted as string[]) : []);

    const decisions = decideImports(incoming, existing, deletedIds);
    const toCreate = decisions.flatMap(d => (d.action === 'create' ? [d.project] : []));

    if (!dryRun && toCreate.length > 0) {
      // Yazmadan hemen önce tekrar oku: arada eklenmiş/silinmiş projeler korunur
      const fresh = (await sql`SELECT value FROM app_data WHERE key = 'projects'`) as { value: unknown }[];
      const current: Project[] = Array.isArray(fresh[0]?.value) ? (fresh[0].value as Project[]) : [];
      const currentIds = new Set(current.map(p => p.id));
      const finalAdd = toCreate.filter(p => !currentIds.has(p.id));
      if (finalAdd.length > 0) {
        await sql`
          INSERT INTO app_data (key, value, updated_at)
          VALUES ('projects', ${JSON.stringify([...finalAdd, ...current])}::jsonb, NOW())
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `;
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      created: decisions.filter(d => d.action === 'create').map(d => d.code),
      skipped: decisions.flatMap(d => (d.action === 'skip' ? [{ code: d.code, reason: d.reason }] : [])),
    }, { headers });
  } catch (error: unknown) {
    console.error('POST /api/integrations/projects error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: 'Sunucu hatası' }, { status: 500, headers });
  }
}
