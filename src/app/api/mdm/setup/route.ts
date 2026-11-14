import { NextResponse } from 'next/server';
import { isSameOriginJson } from '@/lib/auth';
import {
  amapi, readConfig, writeConfig, pushPolicy, requireAdmin, errorResponse, getServiceAccount, MdmError,
  type MdmConfig,
} from '@/lib/mdm';

import { PACKAGE_RE } from '@/lib/mdm-apps';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function originOf(req: Request): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || (host?.startsWith('localhost') ? 'http' : 'https');
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}

/**
 * action=signup      → Google kayıt bağlantısı üretir (tablet@... hesabıyla açılacak)
 * action=settings    → kiosk / kayıp telefonu / FRP hesabını kaydeder ve politikayı günceller
 * action=push-policy → politikayı yeniden gönderir
 */
export async function POST(req: Request) {
  if (!isSameOriginJson(req)) return NextResponse.json({ success: false, error: 'Geçersiz istek' }, { status: 403 });
  const user = await requireAdmin();
  if (user instanceof NextResponse) return user;
  try {
    const body = await req.json();

    if (body?.action === 'signup') {
      const adminEmail = String(body.adminEmail || '').trim().toLowerCase();
      if (!EMAIL_RE.test(adminEmail)) throw new MdmError('Geçerli bir e-posta girin', 400);
      const { project_id } = getServiceAccount();
      const signup = await amapi<{ name: string; url: string }>('signupUrls', {
        method: 'POST',
        query: { projectId: project_id, callbackUrl: `${originOf(req)}/api/mdm/signup-callback`, adminEmail },
      });
      await writeConfig({ signupUrlName: signup.name, adminEmail });
      return NextResponse.json({ success: true, url: signup.url });
    }

    if (body?.action === 'settings') {
      const patch: Partial<MdmConfig> = {};
      if (typeof body.kiosk === 'boolean') patch.kiosk = body.kiosk;
      if (typeof body.lostPhone === 'string') patch.lostPhone = body.lostPhone.trim().slice(0, 30);
      if (Array.isArray(body.apps)) {
        const seen = new Set<string>();
        patch.apps = (body.apps as unknown[]).slice(0, 50).flatMap((a) => {
          const o = a as Record<string, unknown>;
          const pkg = String(o?.packageName || '').trim();
          if (!PACKAGE_RE.test(pkg) || seen.has(pkg)) return [];
          seen.add(pkg);
          return [{ packageName: pkg, label: String(o?.label || pkg).trim().slice(0, 40), allowed: o?.allowed === true }];
        });
      }
      if (typeof body.adminEmail === 'string') {
        const e = body.adminEmail.trim().toLowerCase();
        if (e && !EMAIL_RE.test(e)) throw new MdmError('Geçerli bir e-posta girin', 400);
        patch.adminEmail = e || undefined;
      }
      const config = await writeConfig(patch);
      if (config.enterpriseName) await pushPolicy(config.enterpriseName, config);
      return NextResponse.json({ success: true });
    }

    if (body?.action === 'push-policy') {
      const config = await readConfig();
      if (!config.enterpriseName) throw new MdmError('MDM kurulumu henüz tamamlanmadı', 409);
      await pushPolicy(config.enterpriseName, config);
      return NextResponse.json({ success: true });
    }

    throw new MdmError('Bilinmeyen işlem', 400);
  } catch (e) { return errorResponse(e); }
}
