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
      'İşlemi Yapan (Veren Kişi)': a.spvName,
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
      
      {/* Top Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">Canlı Avanslar</h1>
            <p className="text-xs text-gray-500">Personele verilen ve hakedişten düşülecek canlı nakit/IBAN avansları</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-gray-200">
            <span className="text-gray-500">İşlem Sayısı: </span>
            <strong className="text-gray-900 font-mono">{advances.length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white border border-gray-200">
            <span className="text-gray-500">Toplam Avans: </span>
            <strong className="text-amber-400 font-mono">₺{advances.reduce((sum, a) => sum + Number(a.amount || 0), 0).toLocaleString('tr-TR')}</strong>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-gray-200">
        <div className="flex flex-wrap items-center gap-2">
          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-800"
          >
            <option value="all">Tüm Projeler</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.code} - {p.clientName}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Personel veya işlemi yapan kişiyi ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Toplam Dağıtılan Avans</span>
            <span className="text-sm font-bold font-mono text-amber-400">₺{totalAdvanceSum.toLocaleString('tr-TR')}</span>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-all border border-gray-200 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel'e Aktar</span>
          </button>
        </div>
      </div>

      {/* Advances Table */}
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[11px] border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Tarih</th>
                <th className="py-3 px-4 font-semibold">Proje</th>
                <th className="py-3 px-4 font-semibold">Personel</th>
                <th className="py-3 px-4 font-semibold">İşlemi Yapan (Veren Kişi)</th>
                <th className="py-3 px-4 font-semibold">Yöntem</th>
                <th className="py-3 px-4 font-semibold">Açıklama / Not</th>
                <th className="py-3 px-4 font-semibold text-right">Avans Tutarı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredAdvances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Kayıtlı avans hareketi bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredAdvances.map((adv) => (
                  <tr key={adv.id} className="hover:bg-gray-100 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-gray-500 text-[11px]">
                      {new Date(adv.issuedAt).toLocaleDateString('tr-TR')} {new Date(adv.issuedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                      {adv.projectCode}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {adv.personnelName}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-semibold">
                        {adv.spvName || 'Fatih Sakar'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {adv.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate">
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


