import { NextResponse } from 'next/server';
import { mergeApps } from '@/lib/mdm-apps';
import { readConfig, requireAdmin, errorResponse, getServiceAccount, MdmError } from '@/lib/mdm';

export async function GET() {
  const user = await requireAdmin();
  if (user instanceof NextResponse) return user;
  try {
    let projectId: string | null = null;
    let credentialError: string | null = null;
    try { projectId = getServiceAccount().project_id; }
    catch (e) { credentialError = e instanceof MdmError ? e.message : 'Anahtar okunamadı'; }
    const config = await readConfig();
    return NextResponse.json({
      success: true,
      projectId,
      credentialError,
      enterpriseName: config.enterpriseName || null,
      adminEmail: config.adminEmail || '',
      kiosk: !!config.kiosk,
      lostPhone: config.lostPhone || '',
      apps: mergeApps(config.apps),
    });
  } catch (e) { return errorResponse(e); }
}
