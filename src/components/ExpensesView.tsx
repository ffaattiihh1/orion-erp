'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Receipt, FileSpreadsheet, Search, Eye, X, Image as ImageIcon } from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';
import { ExpenseCategory } from '@/types';

export default function ExpensesView() {
  const { expenses, projects } = useApp();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Excel Export
  const handleExport = () => {
    const exportData = expenses.map(e => ({
      'Proje Kodu': e.projectCode,
      'Gider Kategorisi': e.category.toUpperCase(),
      'Tutar (TL)': e.amount,
      'Açıklama': e.description,
      'İşlemi Yapan (Kayıt Eden)': e.spvName,
      'Harcama Tarihi': e.expenseDate,
      'Fiş Görseli URL': e.receiptImageUrl || '-'
    }));

    exportToExcel(exportData, 'Orion_Saha_Masraf_Listesi', 'Giderler');
  };

  const filteredExpenses = expenses.filter(e => {
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    if (projectFilter !== 'all' && e.projectId !== projectFilter) return false;
    return true;
  });

  const totalExpenseSum = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

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

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
          >
            <option value="all">Tüm Kategoriler</option>
            <option value="yakit">Yakıt / Mazot</option>
            <option value="yemek">Yemek & İkram</option>
            <option value="konaklama">Konaklama / Otel</option>
            <option value="kargo">Kargo / Evrak</option>
            <option value="diger">Diğer</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Filtrelenen Toplam Gider</span>
            <span className="text-sm font-bold font-mono text-emerald-400">₺{totalExpenseSum.toLocaleString('tr-TR')}</span>
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

      {/* Expenses Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Tarih & Fiş</th>
                <th className="py-3 px-4 font-semibold">Proje</th>
                <th className="py-3 px-4 font-semibold">Kategori</th>
                <th className="py-3 px-4 font-semibold">Açıklama</th>
                <th className="py-3 px-4 font-semibold">İşlemi Yapan (Kayıt Eden)</th>
                <th className="py-3 px-4 font-semibold text-right">Tutar</th>
                <th className="py-3 px-4 font-semibold text-center">Fiş Görseli</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Kayıtlı masraf fişi bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {exp.expenseDate}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                      {exp.projectCode}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {exp.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate">
                      {exp.description}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold">
                        {exp.spvName || 'Fatih Sakar'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-sm">
                      ₺{exp.amount.toLocaleString('tr-TR')}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {exp.receiptImageUrl ? (
                        <button
                          onClick={() => setPreviewImage(exp.receiptImageUrl || null)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Görüntüle</span>
                        </button>
                      ) : (
                        <span className="text-slate-600 italic text-[11px]">Fiş Yok</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/80 text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-sky-400" />
              <span>Saha Fişi / Makbuz İnceleme</span>
            </h3>
            <div className="rounded-xl overflow-hidden border border-slate-800">
              <img src={previewImage} alt="Fiş Görseli" className="w-full h-auto object-contain max-h-[70vh]" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
