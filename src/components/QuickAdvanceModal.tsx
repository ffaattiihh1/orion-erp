'use client';

import React, { useMemo, useState } from 'react';
import { useApp, normalizeTurkishText } from '@/context/AppContext';
import type { Advance } from '@/types';
import { X, Banknote, AlertTriangle, Info } from 'lucide-react';

// Projeye bağlı olmayan ödemeler için sabit "cepler"
export const GENERAL_TK_ID = 'general_tk';
export const GENERAL_TK_CODE = 'GÜNLÜK TK';
export const GENERAL_ID = 'general';
export const GENERAL_CODE = 'GENEL';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

interface QuickAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Proje içinden açılırsa proje sabitlenir */
  presetProjectId?: string;
  presetPersonName?: string;
  /** Doluysa düzenleme modunda açılır */
  editing?: Advance | null;
}

/** Yerel saate göre YYYY-MM-DD */
export const localDateStr = (d: Date = new Date()) => {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
};
const todayStr = () => localDateStr();

export default function QuickAdvanceModal(props: QuickAdvanceModalProps) {
  if (!props.isOpen) return null;
  // key ile her açılışta form sıfırlanır
  return <QuickAdvanceForm key={props.editing?.id || `${props.presetProjectId}-${props.presetPersonName}`} {...props} />;
}

function QuickAdvanceForm({ onClose, presetProjectId, presetPersonName, editing }: QuickAdvanceModalProps) {
  const {
    currentUser, projects, personnel, advances, settlements, phoneControlRecords, dailyReports,
    addAdvance, updateAdvance, findOrCreatePerson,
  } = useApp();

  const [personName, setPersonName] = useState(editing?.personnelName || presetPersonName || '');
  const [projectId, setProjectId] = useState(editing?.projectId || presetProjectId || '');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [method, setMethod] = useState<'nakit' | 'havale'>(editing?.paymentMethod || 'nakit');
  const [date, setDate] = useState(editing ? localDateStr(new Date(editing.issuedAt)) : todayStr());
  const [note, setNote] = useState(editing?.note && editing.note !== 'Proje içi avans' ? editing.note : '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const projectOptions = useMemo(() =>
    projects
      .filter(p => !p.isArchived || p.id === projectId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    [projects, projectId]
  );

  // Öneri listesi: personel havuzu + TK'cılar + saha raporlarındaki isimler
  const nameSuggestions = useMemo(() => {
    const seen = new Map<string, string>();
    const add = (n?: string) => {
      const clean = n?.trim();
      if (!clean) return;
      const k = normalizeTurkishText(clean);
      if (!seen.has(k)) seen.set(k, clean);
    };
    personnel.filter(p => !p.isBlacklisted).forEach(p => add(p.fullName));
    phoneControlRecords.forEach(r => add(r.controllerName));
    dailyReports.forEach(r => r.workers?.forEach(w => add(w.personnelName)));
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [personnel, phoneControlRecords, dailyReports]);

  const normName = normalizeTurkishText(personName);
  const poolMatch = normName ? personnel.find(p => normalizeTurkishText(p.fullName) === normName) : undefined;
  const isNewPerson = normName.length > 0 && !poolMatch;

  // Bu kişinin seçili projede önceki avansları ve hakediş durumu
  const priorAdvanceSum = useMemo(() => {
    if (!poolMatch || !projectId) return 0;
    return advances
      .filter(a => a.projectId === projectId && a.personnelId === poolMatch.id && a.id !== editing?.id)
      .reduce((s, a) => s + Number(a.amount || 0), 0);
  }, [advances, poolMatch, projectId, editing?.id]);

  const paidSettlement = poolMatch && projectId
    ? settlements.find(s => s.projectId === projectId && s.personnelId === poolMatch.id && s.isPaid)
    : undefined;

  const projectInfo = (id: string): { code: string } => {
    if (id === GENERAL_TK_ID) return { code: GENERAL_TK_CODE };
    if (id === GENERAL_ID) return { code: GENERAL_CODE };
    return { code: projects.find(p => p.id === id)?.code || id };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);

    const cleanName = personName.trim().replace(/\s+/g, ' ');
    const value = Number(String(amount).replace(/\./g, '').replace(',', '.'));
    if (!cleanName) return setError('Kime verildiğini yazın.');
    if (!projectId) return setError('Hangi proje için verildiğini seçin (projesizse "Genel" seçin).');
    if (!value || value <= 0) return setError('Geçerli bir tutar girin.');

    setSaving(true);
    try {
      const person = findOrCreatePerson(cleanName, projectId === GENERAL_TK_ID ? 'telefon_kontrolcu' : 'anketor');
      const issuedAt = date === todayStr()
        ? new Date().toISOString()
        : new Date(`${date}T12:00:00`).toISOString();

      if (editing) {
        updateAdvance(editing.id, {
          projectId,
          projectCode: projectInfo(projectId).code,
          personnelId: person.id,
          personnelName: person.fullName,
          amount: value,
          paymentMethod: method,
          note: note.trim(),
          issuedAt,
        });
      } else {
        await addAdvance({
          projectId,
          projectCode: projectInfo(projectId).code,
          personnelId: person.id,
          personnelName: person.fullName,
          issuedBySpvId: currentUser?.id || '',
          spvName: currentUser?.fullName || '',
          amount: value,
          paymentMethod: method,
          note: note.trim(),
          issuedAt,
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{editing ? 'Avansı Düzenle' : 'Avans / Ödeme Yaz'}</h3>
              <p className="text-xs text-gray-500">Kime, ne kadar, hangi iş için</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer" aria-label="Kapat">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Kişi */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kime?</label>
            <input
              list="qa-person-suggestions"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Ad Soyad yazın"
              autoComplete="off"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <datalist id="qa-person-suggestions">
              {nameSuggestions.map(n => <option key={n} value={n} />)}
            </datalist>
            {isNewPerson && (
              <p className="mt-1.5 text-xs text-blue-600 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Yeni kişi — kaydedince personel listesine otomatik eklenir.
              </p>
            )}
            {poolMatch?.isBlacklisted && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Bu kişi kara listede{poolMatch.blacklistReason ? `: ${poolMatch.blacklistReason}` : ''}.
              </p>
            )}
          </div>

          {/* Proje */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hangi iş için?</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={Boolean(presetProjectId) && !editing}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-70"
            >
              <option value="">Seçin…</option>
              <optgroup label="Projeler">
                {projectOptions.map(p => (
                  <option key={p.id} value={p.id}>{p.code} — {p.clientName}</option>
                ))}
              </optgroup>
              <optgroup label="Projesiz">
                <option value={GENERAL_TK_ID}>Günlük TK (telefon kontrol)</option>
                <option value={GENERAL_ID}>Genel / projesiz ödeme</option>
              </optgroup>
            </select>
            {priorAdvanceSum > 0 && (
              <p className="mt-1.5 text-xs text-gray-500">Bu kişi bu işte daha önce <strong>₺{priorAdvanceSum.toLocaleString('tr-TR')}</strong> almış.</p>
            )}
            {paidSettlement && (
              <p className="mt-1.5 text-xs text-amber-700">Bu kişinin bu projedeki hakedişi ödenmiş; bu tutar açık bakiye olarak görünecek.</p>
            )}
          </div>

          {/* Tutar */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tutar (₺)</label>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-2xl font-bold font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <div className="flex gap-2 mt-2">
              {QUICK_AMOUNTS.map(v => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setAmount(String(v))}
                  className="flex-1 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-amber-50 hover:border-amber-300 cursor-pointer"
                >
                  {v.toLocaleString('tr-TR')}
                </button>
              ))}
            </div>
          </div>

          {/* Yöntem + Tarih */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nasıl?</label>
              <div className="grid grid-cols-2 rounded-xl border border-gray-200 overflow-hidden">
                {(['nakit', 'havale'] as const).map(m => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`py-3 text-sm font-semibold cursor-pointer ${method === m ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'}`}
                  >
                    {m === 'nakit' ? 'Nakit' : 'Havale'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tarih</label>
              <input
                type="date"
                value={date}
                max={todayStr()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Not */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Not <span className="font-normal text-gray-500">(isteğe bağlı)</span></label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Örn: kira için, yol parası…"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold text-base shadow-sm cursor-pointer"
          >
            {saving ? 'Kaydediliyor…' : editing ? 'Değişiklikleri Kaydet' : 'Kaydet'}
          </button>
        </form>
      </div>
    </div>
  );
}
