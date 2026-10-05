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
      
      {/* Top Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">Saha Masrafları</h1>
            <p className="text-xs text-gray-500">Yakıt, konaklama, yemek ve lojistik harcamalarının denetimi</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-gray-200">
            <span className="text-gray-500">Toplam Fiş: </span>
            <strong className="text-gray-900 font-mono">{expenses.length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white border border-gray-200">
            <span className="text-gray-500">Toplam Tutar: </span>
            <strong className="text-emerald-400 font-mono">₺{expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0).toLocaleString('tr-TR')}</strong>
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

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-800"
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
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Filtrelenen Toplam Gider</span>
            <span className="text-sm font-bold font-mono text-emerald-400">₺{totalExpenseSum.toLocaleString('tr-TR')}</span>
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

      {/* Expenses Table */}
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[11px] border-b border-gray-200">
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
            <tbody className="divide-y divide-gray-200/80">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Kayıtlı masraf fişi bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-100 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-gray-500">
                      {exp.expenseDate}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                      {exp.projectCode}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                        {exp.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-gray-900 max-w-xs truncate">
                      {exp.description}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold">
                        {exp.spvName || 'Fatih Sakar'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900 text-sm">
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
                        <span className="text-gray-500 italic text-[11px]">Fiş Yok</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative max-w-lg w-full bg-white border border-gray-200 rounded-2xl p-4 shadow-2xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-50 text-gray-900 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-sky-400" />
              <span>Saha Fişi / Makbuz İnceleme</span>
            </h3>
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <img src={previewImage} alt="Fiş Görseli" className="w-full h-auto object-contain max-h-[70vh]" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}




