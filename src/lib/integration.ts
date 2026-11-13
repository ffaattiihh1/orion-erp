// SERVER-ONLY: dış sistemlerden (iControl) gelen projelerin güvenli eklenmesi
import crypto from 'crypto';
import type { Project } from '@/types';

export const ICONTROL_ID_PREFIX = 'icontrol-';
export const ALLOWED_INTEGRATION_ORIGINS = ['https://icontrol.ipsos.com.tr'];

/** Authorization: Bearer <INTEGRATION_API_KEY> kontrolü (sabit zamanlı) */
export function isValidIntegrationKey(req: Request): boolean {
  const expected = process.env.INTEGRATION_API_KEY;
  if (!expected || expected.length < 32) return false;
  const header = req.headers.get('authorization') || '';
  const given = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  if (!ALLOWED_INTEGRATION_ORIGINS.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}

/** "RMSR2480_1_EK" / "RMSR2480 Exit" → "RMSR2480" */
export function baseProjectCode(code?: string): string {
  if (!code) return '';
  const m = code.toUpperCase().match(/[A-Z]{2,6}\d{3,6}/);
  return m ? m[0] : code.trim().toUpperCase();
}

export function normalizeExternalCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '_');
}

export function icontrolProjectId(code: string): string {
  return ICONTROL_ID_PREFIX + normalizeExternalCode(code).replace(/[^A-Z0-9_-]/g, '');
}

export interface IncomingProject {
  code: string;
  title?: string;
  clientName?: string;
  plannedSurveys?: number;
  startDate?: string;
  endDate?: string;
}

export type ImportDecision =
  | { code: string; action: 'create'; project: Project }
  | { code: string; action: 'skip'; reason: string };

const isDate = (s?: string) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

/**
 * Hangi projelerin ekleneceğine karar verir. Mevcut hiçbir projeyi değiştirmez.
 * - Aynı iControl kodu daha önce eklendiyse → atla
 * - Kullanıcı bu projeyi sildiyse (deleted_ids) → atla (her gün geri gelmesin)
 * - Elle açılmış bir projenin ana kodu (ör. RMSR2480) aynıysa → atla (mükerrer olmasın)
 */
export function decideImports(
  incoming: IncomingProject[],
  existing: Project[],
  deletedIds: Set<string>,
  now: Date = new Date()
): ImportDecision[] {
  const existingIds = new Set(existing.map(p => p.id));
  const existingExternal = new Set(existing.filter(p => p.externalCode).map(p => normalizeExternalCode(p.externalCode!)));
  const manualBases = new Set(existing.filter(p => p.source !== 'icontrol').map(p => baseProjectCode(p.code)));
  const seenInBatch = new Set<string>();
  const today = now.toISOString().slice(0, 10);

  return incoming.map((inc): ImportDecision => {
    const code = (inc.code || '').trim();
    if (!code) return { code, action: 'skip', reason: 'kod boş' };
    const ext = normalizeExternalCode(code);
    const id = icontrolProjectId(code);

    if (seenInBatch.has(ext)) return { code, action: 'skip', reason: 'listede tekrar ediyor' };
    seenInBatch.add(ext);
    if (existingIds.has(id) || existingExternal.has(ext)) return { code, action: 'skip', reason: 'zaten ekli' };
    if (deletedIds.has(id)) return { code, action: 'skip', reason: 'daha önce silinmiş' };
    if (manualBases.has(baseProjectCode(code))) return { code, action: 'skip', reason: `elle açılmış ${baseProjectCode(code)} projesi var` };

    const planned = Math.max(0, Math.floor(Number(inc.plannedSurveys) || 0));
    const project: Project = {
      id,
      code,
      externalCode: code,
      source: 'icontrol',
      clientName: (inc.clientName || 'Ipsos').slice(0, 120),
      title: (inc.title || code).slice(0, 200),
      projectType: 'saha',
      businessModel: 'model_b_micro',
      status: 'active',
      startDate: isDate(inc.startDate) ? inc.startDate! : today,
      endDate: isDate(inc.endDate) ? inc.endDate! : '',
      targetSurveys: planned,
      clientUnitPrice: 0,
      clientTotalBudget: 0,
      defaultPersonnelRate: 0,
      dailyOverheadRate: 0,
      notes: 'iControl’den otomatik eklendi. Birim fiyatları girmeyi unutmayın.',
      createdById: 'integration-icontrol',
      createdByName: 'iControl (otomatik)',
      createdAt: now.toISOString(),
      completedSurveys: 0,
      totalExpenses: 0,
      totalAdvances: 0,
    };
    return { code, action: 'create', project };
  });
}

/**
 * Kullanıcının tarayıcısı eski bir proje listesini gönderdiğinde, otomatik
 * eklenmiş ama o tarayıcının henüz görmediği projeler kaybolmasın.
 * Silinmiş (deleted_ids) olanlar geri getirilmez.
 */
export function preserveIntegrationProjects(
  incoming: Project[],
  stored: Project[],
  deletedIds: Set<string>
): Project[] {
  const incomingIds = new Set(incoming.map(p => p?.id));
  const missing = stored.filter(p =>
    p?.source === 'icontrol' && p.id && !incomingIds.has(p.id) && !deletedIds.has(p.id)
  );
  return missing.length ? [...missing, ...incoming] : incoming;
}
