import { NextResponse } from 'next/server';
import { getSessionUser, isSameOriginJson } from '@/lib/auth';
import { runProjectImport } from '@/lib/integration';

export const dynamic = 'force-dynamic';

/**
 * Siteden "iControl'den Aktar": yöneticinin yapıştırdığı proje listesini ekler.
 * Oturum + yönetici rolü gerekir. { projects, dryRun }
 */
export async function POST(req: Request) {
  if (!isSameOriginJson(req)) {
    return NextResponse.json({ success: false, error: 'Geçersiz istek' }, { status: 403 });
  }
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Oturum gerekli' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ success: false, error: 'Bu işlem yalnızca yöneticiye açık' }, { status: 403 });

    const body = await req.json().catch(() => null);
    const result = await runProjectImport(body?.projects, body?.dryRun === true);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, created: result.created, skipped: result.skipped });
  } catch (error: unknown) {
    console.error('POST /api/projects/import error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: 'Sunucu hatası' }, { status: 500 });
  }
}
