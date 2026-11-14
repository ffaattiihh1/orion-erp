'use client';

import React, { useMemo, useState } from 'react';
import { useApp, normalizeTurkishText } from '@/context/AppContext';
import type { Advance } from '@/types';
import { Banknote, FileSpreadsheet, Search, Plus, Pencil, Trash2, ChevronDown, ChevronRight, Users, List } from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';
import { computeLedgers } from '@/lib/ledger';
import QuickAdvanceModal, { GENERAL_TK_ID, GENERAL_ID } from '@/components/QuickAdvanceModal';

const fmt = (n: number) => '₺' + Math.round(n).toLocaleString('tr-TR');

export default function AdvancesView() {
  const { advances, projects, personnel, settlements, phoneControlRecords, currentUser, deleteAdvance } = useApp();
  const [tab, setTab] = useState<'balances' | 'movements'>('balances');
  // Saha (anketör) ve TK hesapları ayrı tutulur
  const [group, setGroup] = useState<'saha' | 'tk'>('saha');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; editing?: Advance | null; personName?: string; projectId?: string }>({ open: false });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';
  const canEdit = (a: Advance) => isAdmin || a.issuedBySpvId === currentUser?.id;

  const projectCode = (id: string, fallback?: string) =>
    id === GENERAL_TK_ID ? 'GÜNLÜK TK' : id === GENERAL_ID ? 'GENEL' : (projects.find(p => p.id === id)?.code || fallback || '-');

  // ---- Kişi bazında cari hesap ----
  const ledgers = useMemo(
    () => group === 'tk'
      // TK: yevmiyeler + yalnızca "Günlük TK" cebine yazılan ödemeler
      ? computeLedgers({ personnel, settlements: [], phoneControlRecords, advances: advances.filter(a => a.projectId === GENERAL_TK_ID) }, normalizeTurkishText)
      // Saha: hakedişler + TK cebi dışındaki avanslar
      : computeLedgers({ personnel, settlements, phoneControlRecords: [], advances: advances.filter(a => a.projectId !== GENERAL_TK_ID) }, normalizeTurkishText),
    [personnel, settlements, phoneControlRecords, advances, group]
  );

  const term = normalizeTurkishText(searchTerm);
  const visibleLedgers = ledgers.filter(l => !term || normalizeTurkishText(l.name).includes(term));
  const totalWeOwe = ledgers.reduce((s, l) => s + Math.max(0, l.balance), 0);
  const totalOutstandingAdvance = ledgers.reduce((s, l) => s + Math.max(0, -l.balance), 0);

  // ---- Hareket listesi ----
  const filteredAdvances = advances
    .filter(a => {
      if (projectFilter !== 'all' && a.projectId !== projectFilter) return false;
      if (!term) return true;
      return normalizeTurkishText(a.personnelName).includes(term) ||
        normalizeTurkishText(a.spvName).includes(term) ||
        normalizeTurkishText(a.note).includes(term);
    })
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const filteredSum = filteredAdvances.reduce((s, a) => s + Number(a.amount || 0), 0);

  const handleExport = () => {
    if (tab === 'balances') {
      exportToExcel(visibleLedgers.map(l => ({
        'Kişi': l.name,
        'Hak Edilen (TL)': Math.round(l.earned),
        'Verilen Avans/Ödeme (TL)': Math.round(l.given),
        'Bakiye (TL)': Math.round(l.balance),
        'Durum': l.balance > 0 ? 'Ödenecek' : l.balance < 0 ? 'Kişide avans' : 'Kapalı',
      })), group === 'tk' ? 'Orion_TK_Bakiyeleri' : 'Orion_Saha_Bakiyeleri', 'Bakiyeler');
    } else {
      exportToExcel(filteredAdvances.map(a => ({
        'Tarih': new Date(a.issuedAt).toLocaleDateString('tr-TR'),
        'İş / Proje': projectCode(a.projectId, a.projectCode),
        'Kişi': a.personnelName,
        'Tutar (TL)': a.amount,
        'Yöntem': a.paymentMethod === 'havale' ? 'Havale' : 'Nakit',
        'Not': a.note || '',
        'Veren': a.spvName,
      })), 'Orion_Avans_Hareketleri', 'Avanslar');
    }
  };

  const AdvanceActions = ({ a }: { a: Advance }) => {
    if (!canEdit(a)) return null;
    if (confirmDeleteId === a.id) {
      return (
        <span className="inline-flex items-center gap-1">
          <button onClick={() => { deleteAdvance(a.id); setConfirmDeleteId(null); }} className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-bold cursor-pointer">Sil</button>
          <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs cursor-pointer">Vazgeç</button>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1">
        <button onClick={() => setModal({ open: true, editing: a })} className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer" aria-label="Düzenle"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={() => setConfirmDeleteId(a.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 cursor-pointer" aria-label="Sil"><Trash2 className="w-3.5 h-3.5" /></button>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Başlık + ana buton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Avans & Ödemeler</h1>
            <p className="text-xs text-gray-500">Kime ne kadar verdik, kime ne kadar borcumuz var</p>
          </div>
        </div>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Avans / Ödeme Yaz
        </button>
      </div>

      {/* Saha / TK ayrımı */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-100">
        {([['saha', 'Saha (anketör)'], ['tk', 'TK kontrolcü']] as const).map(([k, label]) => (
          <button key={k} onClick={() => { setGroup(k); setExpanded(null); }} className={`py-2.5 rounded-lg text-sm font-bold cursor-pointer ${group === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Özet */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-gray-200">
          <p className="text-xs text-gray-500">Ödenecek (bizim borcumuz)</p>
          <p className="text-xl font-black font-mono text-emerald-600 mt-1">{fmt(totalWeOwe)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-200">
          <p className="text-xs text-gray-500">Kişilerdeki avans (düşülecek)</p>
          <p className="text-xl font-black font-mono text-amber-600 mt-1">{fmt(totalOutstandingAdvance)}</p>
        </div>
      </div>

      {/* Sekmeler + arama */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 text-sm">
          <button onClick={() => setTab('balances')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${tab === 'balances' ? 'bg-gray-900 text-white' : 'text-gray-600'}`}>
            <Users className="w-4 h-4" /> Kişi Bakiyeleri
          </button>
          <button onClick={() => setTab('movements')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${tab === 'movements' ? 'bg-gray-900 text-white' : 'text-gray-600'}`}>
            <List className="w-4 h-4" /> Tüm Avanslar ({advances.length})
          </button>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="İsim ara…"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          {tab === 'movements' && (
            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 max-w-[40%]">
              <option value="all">Tüm işler</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
              <option value={GENERAL_TK_ID}>Günlük TK</option>
              <option value={GENERAL_ID}>Genel</option>
            </select>
          )}
          <button onClick={handleExport} className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer" aria-label="Excel'e aktar" title="Excel'e aktar">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      </div>

      {tab === 'balances' ? (
        <div className="rounded-2xl bg-white border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {visibleLedgers.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-500">Henüz kayıt yok.</p>
          )}
          {visibleLedgers.map(l => {
            const open = expanded === l.key;
            return (
              <div key={l.key}>
                <button onClick={() => setExpanded(open ? null : l.key)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 cursor-pointer">
                  {open ? <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{l.name}</p>
                    <p className="text-xs text-gray-500">Hak edilen {fmt(l.earned)} · Verilen {fmt(l.given)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {l.balance > 0 && <><p className="font-black font-mono text-emerald-600">{fmt(l.balance)}</p><p className="text-xs text-emerald-700">ödenecek</p></>}
                    {l.balance < 0 && <><p className="font-black font-mono text-amber-600">{fmt(-l.balance)}</p><p className="text-xs text-amber-700">kişide avans</p></>}
                    {l.balance === 0 && <p className="text-xs text-gray-500">hesap kapalı</p>}
                  </div>
                </button>
                {open && (
                  <div className="bg-gray-50 px-4 pb-4 pt-1">
                    <div className="flex justify-end mb-2">
                      <button onClick={() => setModal({ open: true, personName: l.name, projectId: group === 'tk' ? GENERAL_TK_ID : undefined })} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold cursor-pointer">
                        <Plus className="w-3.5 h-3.5" /> Bu kişiye avans/ödeme yaz
                      </button>
                    </div>
                    <ul className="space-y-1.5">
                      {l.movements.map(m => (
                        <li key={m.id} className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-3 py-2 text-sm">
                          <span className="text-xs text-gray-500 w-20 shrink-0">{m.date ? new Date(m.date).toLocaleDateString('tr-TR') : '-'}</span>
                          <span className="text-xs font-mono font-bold text-sky-700 shrink-0">{projectCode(m.projectId, m.advance?.projectCode)}</span>
                          <span className="flex-1 min-w-0 truncate text-gray-700">{m.label}</span>
                          <span className={`font-mono font-bold shrink-0 ${m.amount >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{m.amount >= 0 ? '+' : '−'}{fmt(Math.abs(m.amount))}</span>
                          {m.advance && <AdvanceActions a={m.advance} />}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
          <p className="px-4 py-3 text-xs text-gray-500 bg-gray-50">
            {group === 'tk'
              ? 'TK: hak edilen = TK günlük yevmiyeleri, verilen = "Günlük TK" cebine yazılan ödemeler.'
              : 'Saha: hak edilen = hakedişler (brüt), verilen = avanslar (TK hariç) + ödenmiş hakedişler. Saha raporu yevmiyeleri dahil değildir.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 text-xs text-gray-500 border-b border-gray-100 flex justify-between">
            <span>{filteredAdvances.length} kayıt</span>
            <span>Toplam <strong className="font-mono text-amber-600">{fmt(filteredSum)}</strong></span>
          </div>
          <ul className="divide-y divide-gray-100">
            {filteredAdvances.length === 0 && <li className="py-10 text-center text-sm text-gray-500">Kayıt bulunamadı.</li>}
            {filteredAdvances.map(a => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{a.personnelName}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {new Date(a.issuedAt).toLocaleDateString('tr-TR')} · <span className="font-mono text-sky-700">{projectCode(a.projectId, a.projectCode)}</span> · {a.paymentMethod === 'havale' ? 'Havale' : 'Nakit'} · {a.spvName}
                    {a.note && a.note !== 'Proje içi avans' ? ` · ${a.note}` : ''}
                  </p>
                </div>
                <span className="font-mono font-black text-amber-600 shrink-0">{fmt(Number(a.amount))}</span>
                <AdvanceActions a={a} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <QuickAdvanceModal
        isOpen={modal.open}
        editing={modal.editing}
        presetPersonName={modal.personName}
        presetProjectId={modal.projectId}
        onClose={() => setModal({ open: false })}
      />
    </div>
  );
}
