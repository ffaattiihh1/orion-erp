'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { FileText, FileSpreadsheet, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';
import { InvoiceStatus } from '@/types';

export default function InvoicesView() {
  const { clientInvoices, updateInvoiceStatus } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('');

  // Excel Export
  const handleExport = () => {
    const exportData = clientInvoices.map(inv => ({
      'Proje Kodu': inv.projectCode,
      'Müşteri Adı': inv.clientName,
      'Fatura Numarası': inv.invoiceNumber || '-',
      'Fatura Tutarı (TL)': inv.invoiceAmount,
      'Durum': inv.status === 'collected' ? 'TAHSİL EDİLDİ' : inv.status === 'invoiced' ? 'FATURA KESİLDİ' : 'TASLAK',
      'Fatura Kesim Tarihi': inv.invoicedAt || '-',
      'Tahsilat Tarihi': inv.collectedAt || '-',
      'Notlar': inv.notes || '-'
    }));

    exportToExcel(exportData, 'Orion_Musteri_Faturalari', 'Faturalar');
  };

  const totalInvoiced = clientInvoices
    .filter(i => i.status !== 'not_invoiced')
    .reduce((sum, i) => sum + i.invoiceAmount, 0);

  const totalCollected = clientInvoices
    .filter(i => i.status === 'collected')
    .reduce((sum, i) => sum + i.invoiceAmount, 0);

  const pendingCollection = totalInvoiced - totalCollected;

  return (
    <div className="space-y-6">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Kesilen Toplam Fatura</p>
          <p className="text-xl font-bold font-mono text-white mt-1">₺{totalInvoiced.toLocaleString('tr-TR')}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Müşterilere düzenlenen e-faturalar</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tahsil Edilen Tutar</p>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">₺{totalCollected.toLocaleString('tr-TR')}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Banka hesabına intikal eden tahsilatlar</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Bekleyen Tahsilat (Vade)</p>
          <p className="text-xl font-bold font-mono text-amber-400 mt-1">₺{pendingCollection.toLocaleString('tr-TR')}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Vadesi beklenen cari alacaklar</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white">Müşteri Faturalandırma & Tahsilat Çizelgesi</h3>
          <p className="text-xs text-slate-400">Ipsos, GfK vb. ana müşterilere kesilen hakediş faturalarının canlı durum çubuğu</p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Excel'e Aktar</span>
        </button>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Proje Kodu</th>
                <th className="py-3 px-4 font-semibold">Ana Müşteri</th>
                <th className="py-3 px-4 font-semibold">Fatura No</th>
                <th className="py-3 px-4 font-semibold text-right">Fatura Tutarı</th>
                <th className="py-3 px-4 font-semibold text-center">Durum Çubuğu</th>
                <th className="py-3 px-4 font-semibold text-center">İşlem / Durum Güncelle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {clientInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                    {inv.projectCode}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-white">
                    {inv.clientName}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {editingId === inv.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={invoiceNumberInput}
                          onChange={(e) => setInvoiceNumberInput(e.target.value)}
                          placeholder="Örn: IPS-2026-01"
                          className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs text-white"
                        />
                        <button
                          onClick={() => {
                            updateInvoiceStatus(inv.id, inv.status, invoiceNumberInput);
                            setEditingId(null);
                          }}
                          className="px-2 py-1 rounded bg-sky-500 text-white text-[10px] font-bold"
                        >
                          Kaydet
                        </button>
                      </div>
                    ) : (
                      <span 
                        onClick={() => {
                          setEditingId(inv.id);
                          setInvoiceNumberInput(inv.invoiceNumber || '');
                        }}
                        className="cursor-pointer hover:underline text-slate-300"
                        title="Fatura numarasını düzenlemek için tıklayın"
                      >
                        {inv.invoiceNumber || '(Fatura No Gir)'}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-sm">
                    ₺{inv.invoiceAmount.toLocaleString('tr-TR')}
                  </td>

                  {/* Status Indicator */}
                  <td className="py-3.5 px-4 text-center">
                    {inv.status === 'collected' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tahsil Edildi</span>
                      </span>
                    )}

                    {inv.status === 'invoiced' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Fatura Kesildi (Vade Bekliyor)</span>
                      </span>
                    )}

                    {inv.status === 'not_invoiced' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-semibold text-xs">
                        <span>Taslak / Kesilmedi</span>
                      </span>
                    )}
                  </td>

                  {/* Action Dropdown / Toggle */}
                  <td className="py-3.5 px-4 text-center">
                    <select
                      value={inv.status}
                      onChange={(e) => updateInvoiceStatus(inv.id, e.target.value as InvoiceStatus)}
                      className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 cursor-pointer"
                    >
                      <option value="not_invoiced">Taslak</option>
                      <option value="invoiced">Fatura Kesildi</option>
                      <option value="collected">Tahsil Edildi</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
