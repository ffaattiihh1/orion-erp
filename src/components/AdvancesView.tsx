'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Banknote, FileSpreadsheet, Search } from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';

export default function AdvancesView() {
  const { advances, projects } = useApp();
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Excel Export
  const handleExport = () => {
    const exportData = advances.map(a => ({
      'Proje Kodu': a.projectCode,
      'Personel Adı': a.personnelName,
      'Avansı Veren SPV': a.spvName,
      'Tutar (TL)': a.amount,
      'Ödeme Yöntemi': a.paymentMethod.toUpperCase(),
      'Not': a.note || '-',
      'Tarih & Saat': new Date(a.issuedAt).toLocaleString('tr-TR')
    }));

    exportToExcel(exportData, 'Orion_Avans_Takip_Cizelgesi', 'Avanslar');
  };

  const filteredAdvances = advances.filter(a => {
    if (projectFilter !== 'all' && a.projectId !== projectFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        a.personnelName.toLowerCase().includes(term) ||
        a.spvName.toLowerCase().includes(term) ||
        (a.note && a.note.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const totalAdvanceSum = filteredAdvances.reduce((sum, a) => sum + Number(a.amount), 0);

  return (
    <div className="space-y-6">
      
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
          >
            <option value="all">Tüm Projeler</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.code} - {p.clientName}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Personel veya SPV ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Toplam Dağıtılan Avans</span>
            <span className="text-sm font-bold font-mono text-amber-400">₺{totalAdvanceSum.toLocaleString('tr-TR')}</span>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel'e Aktar</span>
          </button>
        </div>
      </div>

      {/* Advances Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Tarih</th>
                <th className="py-3 px-4 font-semibold">Proje</th>
                <th className="py-3 px-4 font-semibold">Personel</th>
                <th className="py-3 px-4 font-semibold">Veren SPV</th>
                <th className="py-3 px-4 font-semibold">Yöntem</th>
                <th className="py-3 px-4 font-semibold">Açıklama / Not</th>
                <th className="py-3 px-4 font-semibold text-right">Avans Tutarı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredAdvances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Kayıtlı avans hareketi bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredAdvances.map((adv) => (
                  <tr key={adv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(adv.issuedAt).toLocaleDateString('tr-TR')} {new Date(adv.issuedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                      {adv.projectCode}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white">
                      {adv.personnelName}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      {adv.spvName}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {adv.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                      {adv.note || '-'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-black text-amber-400 text-sm">
                      ₺{adv.amount.toLocaleString('tr-TR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
