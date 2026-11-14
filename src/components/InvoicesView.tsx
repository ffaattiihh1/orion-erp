'use client';

import React, { useMemo, useState } from 'react';
import { useApp, normalizeTurkishText } from '@/context/AppContext';
import type { ClientInvoice, InvoiceStatus, Project } from '@/types';
import { FileText, FileSpreadsheet, Search, X, Trash2, AlertTriangle } from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';
import { localDateStr } from '@/components/QuickAdvanceModal';

const STATUS: Record<InvoiceStatus, { label: string; short: string; on: string }> = {
  not_invoiced: { label: 'Kesilmedi', short: 'Kesilmedi', on: 'bg-gray-800 text-white border-gray-800' },
  invoiced: { label: 'Kesildi (tahsil bekliyor)', short: 'Kesildi', on: 'bg-blue-600 text-white border-blue-600' },
  collected: { label: 'Tahsil edildi', short: 'Tahsil', on: 'bg-emerald-600 text-white border-emerald-600' },
};
const ORDER: InvoiceStatus[] = ['not_invoiced', 'invoiced', 'collected'];
const fmt = (n: number) => '₺' + Math.round(n || 0).toLocaleString('tr-TR');
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('tr-TR') : '');
const normCode = (c?: string) => (c || '').trim().toUpperCase().replace(/\s+/g, ' ');

type Row = { project?: Project; invoice?: ClientInvoice; status: InvoiceStatus; key: string };

export default function InvoicesView() {
  const { projects, clientInvoices, addClientInvoice, updateClientInvoice, deleteClientInvoice } = useApp();
  const [filter, setFilter] = useState<InvoiceStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Row | null>(null);

  // Her proje için bir satır; faturası varsa onunla eşleşir (proje kimliği ya da kodu üzerinden)
  const { rows, orphans } = useMemo(() => {
    const used = new Set<string>();
    const list: Row[] = projects
      .filter(p => p.status !== 'feasibility' && p.status !== 'draft')
      .map(p => {
        const inv = clientInvoices.find(i => i.projectId === p.id) ||
          clientInvoices.find(i => !used.has(i.id) && normCode(i.projectCode) === normCode(p.code));
        if (inv) used.add(inv.id);
        return { project: p, invoice: inv, status: inv?.status || 'not_invoiced', key: p.id };
      });
    const rest: Row[] = clientInvoices
      .filter(i => !used.has(i.id))
      .map(i => ({ invoice: i, status: i.status, key: i.id }));
    return { rows: list, orphans: rest };
  }, [projects, clientInvoices]);

  const term = normalizeTurkishText(search);
  const matches = (r: Row) =>
    (filter === 'all' || r.status === filter) &&
    (!term || [r.project?.code, r.project?.title, r.project?.clientName, r.invoice?.projectCode, r.invoice?.invoiceNumber]
      .some(v => normalizeTurkishText(v).includes(term)));

  // Biten ama faturası kesilmeyen projeler en üstte
  const visible = rows.filter(matches).sort((a, b) => {
    const urgent = (r: Row) => (r.project?.status === 'completed' && r.status === 'not_invoiced' ? 0 : 1);
    return urgent(a) - urgent(b) || (b.project?.startDate || '').localeCompare(a.project?.startDate || '');
  });
  const visibleOrphans = orphans.filter(matches);

  const all = [...rows, ...orphans];
  const sumBy = (st: InvoiceStatus) => all.filter(r => r.status === st).reduce((s, r) => s + Number(r.invoice?.invoiceAmount || 0), 0);
  const count = (st: InvoiceStatus) => all.filter(r => r.status === st).length;
  const pendingCompleted = rows.filter(r => r.project?.status === 'completed' && r.status === 'not_invoiced').length;

  /** Durumu değiştir; faturası yoksa projeye bağlı yeni kayıt açılır */
  const setStatus = (r: Row, status: InvoiceStatus) => {
    const today = localDateStr();
    if (r.invoice) {
      updateClientInvoice(r.invoice.id, {
        status,
        invoicedAt: status !== 'not_invoiced' ? (r.invoice.invoicedAt || today) : r.invoice.invoicedAt,
        collectedAt: status === 'collected' ? (r.invoice.collectedAt || today) : undefined,
      });
    } else if (r.project && status !== 'not_invoiced') {
      addClientInvoice({
        projectId: r.project.id,
        projectCode: r.project.code,
        clientName: r.project.clientName,
        invoiceAmount: Number(r.project.clientTotalBudget || 0),
        status,
        invoicedAt: today,
        collectedAt: status === 'collected' ? today : undefined,
      });
    }
  };

  const handleExport = () => {
    exportToExcel([...visible, ...visibleOrphans].map(r => ({
      'Proje Kodu': r.project?.code || r.invoice?.projectCode || '',
      'Proje Adı': r.project?.title || '',
      'Müşteri': r.project?.clientName || r.invoice?.clientName || '',
      'Proje Durumu': r.project ? (r.project.status === 'completed' ? 'Bitti' : 'Devam') : '',
      'Fatura Durumu': STATUS[r.status].label,
      'Fatura No': r.invoice?.invoiceNumber || '',
      'Tutar (TL)': r.invoice?.invoiceAmount || 0,
      'Kesim Tarihi': fmtDate(r.invoice?.invoicedAt),
      'Tahsil Tarihi': fmtDate(r.invoice?.collectedAt),
      'Not': r.invoice?.notes || '',
    })), 'Orion_Fatura_Takip', 'Faturalar');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100"><FileText className="w-5 h-5" /></div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Faturalar</h1>
            <p className="text-sm text-gray-500">Her proje için fatura kesildi mi, tahsil edildi mi</p>
          </div>
        </div>
        <button onClick={handleExport} className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 cursor-pointer">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white border border-gray-200">
          <p className="text-xs text-gray-500">Kesilmedi</p>
          <p className="text-xl font-black text-gray-900">{count('not_invoiced')}</p>
          {pendingCompleted > 0 && <p className="text-xs text-amber-700 font-semibold">{pendingCompleted} biten proje</p>}
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-gray-200">
          <p className="text-xs text-gray-500">Tahsil bekleyen</p>
          <p className="text-xl font-black text-blue-700">{count('invoiced')}</p>
          <p className="text-xs text-gray-500 font-mono">{fmt(sumBy('invoiced'))}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-gray-200">
          <p className="text-xs text-gray-500">Tahsil edildi</p>
          <p className="text-xl font-black text-emerald-700">{count('collected')}</p>
          <p className="text-xs text-gray-500 font-mono">{fmt(sumBy('collected'))}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex gap-1.5 overflow-x-auto">
          {([['all', 'Tümü'], ...ORDER.map(s => [s, STATUS[s].short])] as [InvoiceStatus | 'all', string][]).map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)} className={`shrink-0 px-3.5 py-2 rounded-full text-sm font-semibold border cursor-pointer ${filter === k ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Proje kodu, ad veya fatura no…" className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
      </div>

      {visible.length === 0 && visibleOrphans.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500 bg-white rounded-2xl border border-gray-200">Kayıt bulunamadı.</p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(r => <RowCard key={r.key} r={r} onEdit={setEditing} onSetStatus={setStatus} />)}
        </div>
      )}

      {visibleOrphans.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-700">Projeyle eşleşmeyen faturalar ({visibleOrphans.length})</p>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleOrphans.map(r => <RowCard key={r.key} r={r} onEdit={setEditing} onSetStatus={setStatus} />)}
          </div>
        </div>
      )}

      {editing && (
        <EditInvoiceSheet
          row={rows.find(r => r.key === editing.key) || orphans.find(r => r.key === editing.key) || editing}
          onClose={() => setEditing(null)}
          onSave={(fields) => {
            const r = editing;
            const cur = rows.find(x => x.key === r.key)?.invoice || orphans.find(x => x.key === r.key)?.invoice;
            if (cur) updateClientInvoice(cur.id, fields);
            else if (r.project) addClientInvoice({
              projectId: r.project.id, projectCode: r.project.code, clientName: r.project.clientName,
              invoiceAmount: 0, status: 'not_invoiced', ...fields,
            } as Omit<ClientInvoice, 'id'>);
            setEditing(null);
          }}
          onDelete={(id) => { deleteClientInvoice(id); setEditing(null); }}
        />
      )}
    </div>
  );
}

function RowCard({ r, onEdit, onSetStatus }: { r: Row; onEdit: (r: Row) => void; onSetStatus: (r: Row, st: InvoiceStatus) => void }) {
  const code = r.project?.code || r.invoice?.projectCode || '—';
  const urgent = r.project?.status === 'completed' && r.status === 'not_invoiced';
  return (
    <div className={`bg-white rounded-2xl border p-4 ${urgent ? 'border-amber-300' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <button onClick={() => onEdit(r)} className="min-w-0 text-left cursor-pointer">
          <p className="font-mono font-bold text-gray-900">{code}</p>
          <p className="text-sm text-gray-600 truncate">{r.project?.title || r.invoice?.clientName}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {r.project ? (r.project.status === 'completed' ? 'Proje bitti' : 'Proje devam ediyor') : 'Projeyle eşleşmedi'}
            {r.invoice?.invoiceNumber ? ` · No: ${r.invoice.invoiceNumber}` : ''}
            {r.invoice?.invoicedAt && r.status !== 'not_invoiced' ? ` · ${fmtDate(r.invoice.invoicedAt)}` : ''}
          </p>
        </button>
        <div className="text-right shrink-0">
          {r.invoice ? <p className="font-mono font-bold text-gray-900">{fmt(r.invoice.invoiceAmount)}</p> : <p className="text-sm text-gray-400">—</p>}
          {urgent && <p className="text-xs font-semibold text-amber-700 flex items-center gap-1 justify-end"><AlertTriangle className="w-3 h-3" /> Kesilmedi</p>}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {ORDER.map(st => (
          <button
            key={st}
            onClick={() => onSetStatus(r, st)}
            disabled={!r.invoice && !r.project}
            className={`py-2 rounded-xl text-sm font-semibold border cursor-pointer ${r.status === st ? STATUS[st].on : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            {STATUS[st].short}
          </button>
        ))}
      </div>
    </div>
  );
}

function EditInvoiceSheet({ row, onClose, onSave, onDelete }: {
  row: Row;
  onClose: () => void;
  onSave: (fields: Partial<ClientInvoice>) => void;
  onDelete: (id: string) => void;
}) {
  const inv = row.invoice;
  const [status, setStatus] = useState<InvoiceStatus>(inv?.status || 'not_invoiced');
  const [number, setNumber] = useState(inv?.invoiceNumber || '');
  const [amount, setAmount] = useState(String(inv?.invoiceAmount ?? row.project?.clientTotalBudget ?? ''));
  const [invoicedAt, setInvoicedAt] = useState(inv?.invoicedAt?.slice(0, 10) || '');
  const [collectedAt, setCollectedAt] = useState(inv?.collectedAt?.slice(0, 10) || '');
  const [notes, setNotes] = useState(inv?.notes || '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const input = 'w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400';

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const today = localDateStr();
    onSave({
      status,
      invoiceNumber: number.trim() || undefined,
      invoiceAmount: Number(String(amount).replace(/\./g, '').replace(',', '.')) || 0,
      invoicedAt: status !== 'not_invoiced' ? (invoicedAt || today) : (invoicedAt || undefined),
      collectedAt: status === 'collected' ? (collectedAt || today) : undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900 font-mono">{row.project?.code || inv?.projectCode}</h3>
            <p className="text-sm text-gray-500">{row.project?.title || inv?.clientName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer" aria-label="Kapat"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={save} className="p-5 space-y-3.5">
          <div className="grid grid-cols-3 gap-1.5">
            {ORDER.map(st => (
              <button type="button" key={st} onClick={() => setStatus(st)} className={`py-2.5 rounded-xl text-sm font-semibold border cursor-pointer ${status === st ? STATUS[st].on : 'bg-white text-gray-600 border-gray-200'}`}>
                {STATUS[st].short}
              </button>
            ))}
          </div>
          <label className="block"><span className="block text-sm font-semibold text-gray-700 mb-1">Fatura no</span>
            <input value={number} onChange={(e) => setNumber(e.target.value)} className={input} /></label>
          <label className="block"><span className="block text-sm font-semibold text-gray-700 mb-1">Tutar (₺)</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className={`${input} font-mono`} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="block text-sm font-semibold text-gray-700 mb-1">Kesim tarihi</span>
              <input type="date" value={invoicedAt} onChange={(e) => setInvoicedAt(e.target.value)} className={input} /></label>
            <label className="block"><span className="block text-sm font-semibold text-gray-700 mb-1">Tahsil tarihi</span>
              <input type="date" value={collectedAt} onChange={(e) => setCollectedAt(e.target.value)} className={input} /></label>
          </div>
          <label className="block"><span className="block text-sm font-semibold text-gray-700 mb-1">Not</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={input} /></label>
          <button type="submit" className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer">Kaydet</button>
          {inv && (confirmDelete ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => onDelete(inv.id)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold cursor-pointer">Fatura kaydını sil</button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm cursor-pointer">Vazgeç</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-gray-500 hover:text-red-600 cursor-pointer">
              <Trash2 className="w-4 h-4" /> Fatura kaydını sil
            </button>
          ))}
        </form>
      </div>
    </div>
  );
}
