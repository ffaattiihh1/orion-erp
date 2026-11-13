import { NextResponse } from 'next/server';
import { corsHeaders, isValidIntegrationKey, runProjectImport } from '@/lib/integration';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

/**
 * iControl → Orion Saha proje aktarımı (makine erişimi, INTEGRATION_API_KEY).
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
    const result = await runProjectImport(body?.projects, dryRun);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400, headers });
    return NextResponse.json({ success: true, dryRun, created: result.created, skipped: result.skipped }, { headers });
  } catch (error: unknown) {
    console.error('POST /api/integrations/projects error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: 'Sunucu hatası' }, { status: 500, headers });
  }
}
