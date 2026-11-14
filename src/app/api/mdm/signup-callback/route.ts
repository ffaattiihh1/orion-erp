import { NextResponse, type NextRequest } from 'next/server';
import { amapi, readConfig, writeConfig, pushPolicy, requireAdmin, getServiceAccount } from '@/lib/mdm';

// Google kayıt sayfası işlem bitince buraya ?enterpriseToken=... ile döner.
export async function GET(req: NextRequest) {
  const back = (status: string) => NextResponse.redirect(new URL(`/?tab=mdm&mdm=${status}`, req.url));
  const user = await requireAdmin();
  if (user instanceof NextResponse) return back('yetki');

  const enterpriseToken = req.nextUrl.searchParams.get('enterpriseToken');
  if (!enterpriseToken) return back('iptal');
  try {
    const config = await readConfig();
    if (!config.signupUrlName) return back('hata');
    const { project_id } = getServiceAccount();
    const enterprise = await amapi<{ name: string }>('enterprises', {
      method: 'POST',
      query: { projectId: project_id, signupUrlName: config.signupUrlName, enterpriseToken },
      body: { enterpriseDisplayName: 'Orion Araştırma' },
    });
    const next = await writeConfig({ enterpriseName: enterprise.name, signupUrlName: undefined });
    await pushPolicy(enterprise.name, next);
    return back('ok');
  } catch (e) {
    console.error('MDM signup-callback:', e instanceof Error ? e.message : e);
    return back('hata');
  }
}
