// İstemci + sunucu ortak: tablet adlandırma (ON-T01, ON-T02 …)

export const TABLET_PREFIX = 'ON-T';
export const formatTabletLabel = (n: number) => `${TABLET_PREFIX}${String(n).padStart(2, '0')}`;

/** Listede en büyük numaranın bir fazlası */
export function nextTabletLabel(existing: (string | undefined)[]): string {
  const nums = existing.map(s => Number((s || '').match(/(\d+)\s*$/)?.[1])).filter(n => !isNaN(n));
  return formatTabletLabel((nums.length ? Math.max(...nums) : 0) + 1);
}

/** Karşılaştırma için: boşluk/tire yok, büyük harf */
export const normCode = (s?: string) => (s || '').replace(/[\s-]/g, '').toUpperCase();
