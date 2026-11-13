import type { Advance, Personnel, PhoneControlRecord, Settlement } from '@/types';

/** Kişi cari hesabındaki tek bir satır */
export type Movement = {
  id: string;
  date: string;
  kind: 'hakedis' | 'tk' | 'avans' | 'odeme';
  label: string;
  projectId: string;
  amount: number; // + kazanç, - verilen
  advance?: Advance;
};

export type PersonLedger = {
  key: string;
  name: string;
  earned: number;
  given: number;
  /** + biz borçluyuz (ödenecek), - kişide avans var (hakedişten düşülecek) */
  balance: number;
  movements: Movement[];
};

export interface LedgerInput {
  personnel: Personnel[];
  settlements: Settlement[];
  phoneControlRecords: PhoneControlRecord[];
  advances: Advance[];
}

/**
 * Kişi bazında cari hesap.
 * Hak edilen = hakediş brütü + TK yevmiyesi
 * Verilen    = tüm avanslar + ödenmiş hakedişlerin net tutarı
 * Ödenmiş bir hakedişte: brüt - avans - net = 0 olduğundan hesap kapanır.
 */
export function computeLedgers(input: LedgerInput, normalize: (s?: string) => string): PersonLedger[] {
  const byId = new Map(input.personnel.map(p => [p.id, p]));
  const byName = new Map(input.personnel.map(p => [normalize(p.fullName), p]));
  const map = new Map<string, PersonLedger>();

  const get = (personnelId: string | undefined, name: string): PersonLedger => {
    const p = (personnelId && byId.get(personnelId)) || byName.get(normalize(name));
    const key = p ? `id:${p.id}` : `n:${normalize(name)}`;
    let l = map.get(key);
    if (!l) {
      l = { key, name: p?.fullName || name.trim(), earned: 0, given: 0, balance: 0, movements: [] };
      map.set(key, l);
    }
    return l;
  };

  input.settlements.forEach(s => {
    const l = get(s.personnelId, s.personnelName);
    const gross = Number(s.grossAmount || 0);
    l.earned += gross;
    l.movements.push({ id: s.id, date: s.createdAt || '', kind: 'hakedis', label: `Hakediş (${s.validSurveys} anket)`, projectId: s.projectId, amount: gross });
    const net = Number(s.netPayable || 0);
    if (s.isPaid && net > 0) {
      l.given += net;
      l.movements.push({ id: s.id + '-paid', date: s.paidAt || s.createdAt || '', kind: 'odeme', label: 'Hakediş ödemesi', projectId: s.projectId, amount: -net });
    }
  });

  input.phoneControlRecords.forEach(r => {
    if (!r.controllerName?.trim()) return;
    const l = get(r.controllerId, r.controllerName);
    const wage = Number(r.dailyWage || 0);
    l.earned += wage;
    l.movements.push({ id: r.id, date: r.controlDate || r.createdAt || '', kind: 'tk', label: `TK yevmiyesi (${r.totalCalled || 0} arama)`, projectId: r.projectId, amount: wage });
  });

  input.advances.forEach(a => {
    const l = get(a.personnelId, a.personnelName);
    const amt = Number(a.amount || 0);
    l.given += amt;
    const note = a.note && a.note !== 'Proje içi avans' ? a.note : '';
    l.movements.push({ id: a.id, date: a.issuedAt, kind: 'avans', label: note ? `Avans — ${note}` : 'Avans', projectId: a.projectId, amount: -amt, advance: a });
  });

  return Array.from(map.values())
    .map(l => ({ ...l, balance: l.earned - l.given, movements: l.movements.sort((x, y) => (y.date || '').localeCompare(x.date || '')) }))
    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance) || a.name.localeCompare(b.name, 'tr'));
}
