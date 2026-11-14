// İstemci + sunucu ortak: tablet adlandırma ve izin verilebilir uygulamalar

/** Tablet adı öneki: ON-T01, ON-T02 … */
export const TABLET_PREFIX = 'ON-T';
export const formatTabletLabel = (n: number) => `${TABLET_PREFIX}${String(n).padStart(2, '0')}`;
/** Listede en büyük numaranın bir fazlası */
export function nextTabletLabel(existing: (string | undefined)[]): string {
  const nums = existing.map(s => Number((s || '').match(/(\d+)\s*$/)?.[1])).filter(n => !isNaN(n));
  return formatTabletLabel((nums.length ? Math.max(...nums) : 0) + 1);
}

export interface MdmApp {
  packageName: string;
  label: string;
  allowed: boolean; // true: tablete kurulur ve açılır · false: engellenir
}

/** Ayarlarda hazır gelen uygulamalar (hepsi başlangıçta kapalı) */
export const PRESET_APPS: Omit<MdmApp, 'allowed'>[] = [
  { packageName: 'com.android.chrome', label: 'Chrome' },
  { packageName: 'com.google.android.apps.maps', label: 'Google Haritalar' },
  { packageName: 'com.whatsapp', label: 'WhatsApp' },
  { packageName: 'com.google.android.gm', label: 'Gmail' },
  { packageName: 'com.google.android.youtube', label: 'YouTube' },
];

export const PACKAGE_RE = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$/;

/** Kayıtlı liste + hazır listede olup kayıtta olmayanlar */
export function mergeApps(saved?: MdmApp[]): MdmApp[] {
  const list = [...(saved || [])];
  PRESET_APPS.forEach(p => { if (!list.some(a => a.packageName === p.packageName)) list.push({ ...p, allowed: false }); });
  return list;
}
