import { NextResponse } from 'next/server';
import { requireAdmin, readConfig, missingEnv, errorResponse, MDM_URL, MDM_SCOPES } from '@/lib/mdm';

/** Kurulum durumu (gizli değer döndürmez) */
export async function GET() {
  const user = await requireAdmin();
  if (user instanceof NextResponse) return user;
  try {
    const config = await readConfig();
    return NextResponse.json({
      success: true,
      missingEnv: missingEnv(),
      connected: !!(process.env.ZOHO_REFRESH_TOKEN || config.refreshToken),
      connectedAt: config.connectedAt || null,
      lostPhone: config.lostPhone || '',
      panelUrl: MDM_URL,
      scopes: MDM_SCOPES,
    });
  } catch (e) { return errorResponse(e); }
}
