import { NextResponse } from 'next/server';
import { isSameOriginJson } from '@/lib/auth';
import { amapi, requireAdmin, requireEnterprise, errorResponse, pushPolicy, POLICY_ID, MdmError } from '@/lib/mdm';

const LABEL_RE = /^[A-Za-z0-9ÇĞİÖŞÜçğıöşü _-]{1,30}$/;

/** Yeni tablet kaydı: tek kullanımlık, 24 saat geçerli kayıt kodu + QR içeriği */
export async function POST(req: Request) {
  if (!isSameOriginJson(req)) return NextResponse.json({ success: false, error: 'Geçersiz istek' }, { status: 403 });
  const user = await requireAdmin();
  if (user instanceof NextResponse) return user;
  try {
    const body = await req.json();
    const label = String(body?.label || '').trim().toUpperCase();
    if (!LABEL_RE.test(label)) throw new MdmError('Tablet adı 1-30 karakter olmalı (örn. ON-T01)', 400);

    const { config, enterprise } = await requireEnterprise();
    await pushPolicy(enterprise, config); // politika her zaman güncel olsun

    const token = await amapi<{ value: string; qrCode: string; expirationTimestamp: string }>(
      `${enterprise}/enrollmentTokens`,
      {
        method: 'POST',
        body: {
          policyName: `${enterprise}/policies/${POLICY_ID}`,
          duration: `${24 * 3600}s`,
          oneTimeOnly: true,
          allowPersonalUsage: 'PERSONAL_USAGE_DISALLOWED',
          additionalData: JSON.stringify({ label }),
        },
      }
    );

    // Wi-Fi bilgisi verilirse QR'a eklenir; tablet kurulumda ağa kendisi bağlanır
    const qr = JSON.parse(token.qrCode) as Record<string, unknown>;
    const ssid = String(body?.wifiSsid || '').trim();
    if (ssid) {
      const pass = String(body?.wifiPassword || '');
      qr['android.app.extra.PROVISIONING_WIFI_SSID'] = ssid;
      qr['android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE'] = pass ? 'WPA' : 'NONE';
      if (pass) qr['android.app.extra.PROVISIONING_WIFI_PASSWORD'] = pass;
    }

    return NextResponse.json({
      success: true,
      label,
      qrContent: JSON.stringify(qr),
      tokenValue: token.value,
      expiresAt: token.expirationTimestamp,
    });
  } catch (e) { return errorResponse(e); }
}
