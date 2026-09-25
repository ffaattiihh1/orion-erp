'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Calculator, 
  FileSpreadsheet, 
  Check, 
  Clock, 
  Search, 
  CheckCircle2, 
  HelpCircle, 
  PlusCircle, 
  X, 
  ArrowRight 
} from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';

export default function SettlementsView() {
  const { 
    settlements, 
    projects, 
    personnel, 
    projectPersonnel, 
    toggleSettlementPaid, 
    closeSurveysAndCalculateSettlement, 
    getPersonnelNetAdvance 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [isNewSettlementModalOpen, setIsNewSettlementModalOpen] = useState(false);

  // Modal form states
  const [modalProjectId, setModalProjectId] = useState(projects[0]?.id || '');
  const [modalPersonnelId, setModalPersonnelId] = useState('');
  const [modalTotal, setModalTotal] = useState('');
  const [modalInvalid, setModalInvalid] = useState('0');

  // Excel Export
  const handleExport = () => {
    const exportData = settlements.map(s => {
      const proj = projects.find(p => p.id === s.projectId);
      return {
        'Proje Kodu': proj?.code || s.projectId,
        'Proje Adı': proj?.title || '-',
        'Personel Adı': s.personnelName,
        'Rol': s.personnelRole.toUpperCase(),
        'Toplam Yapılan Anket': s.totalSurveys,
        'İptal (Geçersiz) Anket': s.invalidSurveys,
        'Geçerli Anket': s.validSurveys,
        'Uygulanan Birim Fiyat (TL)': s.unitPriceApplied,
        'Brüt Hakediş (TL)': s.grossAmount,
        'Mahsup Edilen Avans (TL)': s.advancesDeducted,
        'Net Ödenecek Hakediş (TL)': s.netPayable,
        'Ödeme Durumu': s.isPaid ? 'ÖDENDİ' : 'BEKLİYOR',
        'Ödeme Referansı': s.paymentReference || '-',
        'Ödeme Tarihi': s.paidAt ? new Date(s.paidAt).toLocaleDateString('tr-TR') : '-'
      };
    });

    exportToExcel(exportData, 'Orion_Personel_Hakedis_Listesi', 'Hakedişler');
  };

  // Filtered settlements
  const filteredSettlements = settlements.filter(s => {
    if (selectedProjectId !== 'all' && s.projectId !== selectedProjectId) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return s.personnelName.toLowerCase().includes(term);
    }
    return true;
  });

  // KPI aggregates
  const totalGross = settlements.reduce((sum, s) => sum + s.grossAmount, 0);
  const totalAdvancesDeducted = settlements.reduce((sum, s) => sum + s.advancesDeducted, 0);
  const totalNetPayable = settlements.reduce((sum, s) => sum + s.netPayable, 0);
  const totalPaidNet = settlements.filter(s => s.isPaid).reduce((sum, s) => sum + s.netPayable, 0);

  // Available personnel for current selected modal project
  const modalAssignedPersonnel = projectPersonnel
    .filter(pp => pp.projectId === modalProjectId)
    .map(pp => personnel.find(p => p.id === pp.personnelId))
    .filter(Boolean) as typeof personnel;

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalProjectId || !modalPersonnelId || !modalTotal) return;

    closeSurveysAndCalculateSettlement(
      modalProjectId,
      modalPersonnelId,
      Number(modalTotal),
      Number(modalInvalid || 0)
    );

    setIsNewSettlementModalOpen(false);
    setModalTotal('');
    setModalInvalid('0');
  };

  return (
    <div className="space-y-6">
      
      {/* Formula Explanation Callout */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 to-indigo-950/40 border border-sky-800/40 text-xs text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Otomatik Hakediş & Avans Mahsuplaşma Formülü</p>
            <p className="text-slate-400 mt-0.5">
              (Toplam Anket − İptal Anket = <strong className="text-sky-300">Geçerli Anket</strong>) × <strong className="text-sky-300">Kişiye Özel Fiyat</strong> − <strong className="text-amber-400">Alınan Avanslar</strong> = <strong className="text-emerald-400">NET ÖDENECEK HAKEDİŞ</strong>
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsNewSettlementModalOpen(true)}
          className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-all shadow-md shadow-sky-500/20 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Yeni Anket Kapama Yap</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Toplam Brüt Hakediş</p>
          <p className="text-xl font-bold font-mono text-white mt-1">₺{totalGross.toLocaleString('tr-TR')}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Geçerli anketlerin brüt karşılığı</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mahsup Edilen Avans</p>
          <p className="text-xl font-bold font-mono text-amber-400 mt-1">− ₺{totalAdvancesDeducted.toLocaleString('tr-TR')}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Hakedişlerden otomatik düşüldü</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Net Ödenecek Toplam</p>
          <p className="text-xl font-bold font-mono text-sky-400 mt-1">₺{totalNetPayable.toLocaleString('tr-TR')}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Avans sonrası net ödenecek</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Fiilen Ödenen Tutar</p>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">₺{totalPaidNet.toLocaleString('tr-TR')}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Ödendi işaretlenen net hakedişler</p>
        </div>
      </div>

      {/* Control Bar: Filters & Export */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
          >
            <option value="all">Tüm Projeler</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.code} - {p.clientName}</option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Personel ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Universal Excel Export Button */}
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Excel'e Aktar (.xlsx)</span>
        </button>
      </div>

      {/* Settlements Data Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Personel & Rol</th>
                <th className="py-3 px-4 font-semibold">Proje</th>
                <th className="py-3 px-4 font-semibold text-center">Toplam</th>
                <th className="py-3 px-4 font-semibold text-center text-rose-400">İptal</th>
                <th className="py-3 px-4 font-semibold text-center text-sky-400">Geçerli</th>
                <th className="py-3 px-4 font-semibold text-right">Özel Fiyat</th>
                <th className="py-3 px-4 font-semibold text-right">Brüt Tutar</th>
                <th className="py-3 px-4 font-semibold text-right text-amber-400">Kesilen Avans</th>
                <th className="py-3 px-4 font-semibold text-right text-emerald-400">NET ÖDENECEK</th>
                <th className="py-3 px-4 font-semibold text-center">Ödeme Durumu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    Kayıtlı hakediş bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredSettlements.map((s) => {
                  const proj = projects.find(p => p.id === s.projectId);

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Personnel */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white">{s.personnelName}</p>
                        <span className="text-[10px] uppercase font-semibold text-slate-500">
                          {s.personnelRole}
                        </span>
                      </td>

                      {/* Project */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                        <span className="font-semibold text-sky-400">{proj?.code}</span>
                        <p className="text-[10px] text-slate-500">{proj?.clientName}</p>
                      </td>

                      {/* Total Surveys */}
                      <td className="py-3.5 px-4 text-center font-mono font-medium">
                        {s.totalSurveys}
                      </td>

                      {/* Invalid Surveys */}
                      <td className="py-3.5 px-4 text-center font-mono text-rose-400 font-semibold">
                        {s.invalidSurveys > 0 ? `-${s.invalidSurveys}` : '0'}
                      </td>

                      {/* Valid Surveys */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-sky-300 bg-sky-500/5">
                        {s.validSurveys}
                      </td>

                      {/* Applied Unit Price */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        ₺{s.unitPriceApplied}
                      </td>

                      {/* Gross Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-200">
                        ₺{s.grossAmount.toLocaleString('tr-TR')}
                      </td>

                      {/* Advances Deducted */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-amber-400">
                        {s.advancesDeducted > 0 ? `− ₺${s.advancesDeducted.toLocaleString('tr-TR')}` : '₺0'}
                      </td>

                      {/* Net Payable */}
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-400 text-sm bg-emerald-500/5">
                        ₺{s.netPayable.toLocaleString('tr-TR')}
                      </td>

                      {/* Payment Toggle Status Bar */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => toggleSettlementPaid(s.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                            s.isPaid
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600'
                          }`}
                        >
                          {s.isPaid ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>ÖDENDİ</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>ÖDENMEDİ</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADMIN CLOSE SURVEYS & CALCULATE */}
      {isNewSettlementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-sky-400" />
                <span>Anket Kapama & Otomatik Hakediş</span>
              </h3>
              <button onClick={() => setIsNewSettlementModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Proje</label>
                <select
                  value={modalProjectId}
                  onChange={(e) => {
                    setModalProjectId(e.target.value);
                    setModalPersonnelId('');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  {projects.filter(p => p.businessModel === 'model_b_micro').map(p => (
                    <option key={p.id} value={p.id}>{p.code} - {p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Personel Seçin</label>
                <select
                  value={modalPersonnelId}
                  onChange={(e) => setModalPersonnelId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  <option value="">-- Personel Seçiniz --</option>
                  {modalAssignedPersonnel.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.defaultRole})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Toplam Yapılan Anket</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={modalTotal}
                    onChange={(e) => setModalTotal(e.target.value)}
                    placeholder="Örn: 180"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-rose-400 mb-1">İptal / Geçersiz</label>
                  <input
                    type="number"
                    min="0"
                    value={modalInvalid}
                    onChange={(e) => setModalInvalid(e.target.value)}
                    placeholder="Örn: 8"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-rose-400 font-bold"
                  />
                </div>
              </div>

              {modalPersonnelId && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Mevcut Alınan Avans:</span>
                    <span className="text-amber-400 font-mono font-bold">
                      ₺{getPersonnelNetAdvance(modalProjectId, modalPersonnelId).toLocaleString('tr-TR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Geçerli Sayılacak Anket:</span>
                    <span className="text-sky-400 font-mono font-bold">
                      {Math.max(0, Number(modalTotal || 0) - Number(modalInvalid || 0))} Adet
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
              >
                Hakedişi Hesapla & Sisteme İşle
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
