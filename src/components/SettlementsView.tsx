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
  PlusCircle, 
  X, 
  ClipboardPaste,
  Building2,
  FolderCheck,
  ArrowRight,
  TrendingUp,
  MapPin,
  FileText
} from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';
import ExcelPasteSettlementModal from './ExcelPasteSettlementModal';

export default function SettlementsView() {
  const { 
    settlements, 
    projects, 
    personnel, 
    toggleSettlementPaid, 
    closeSurveysAndCalculateSettlement, 
    getPersonnelNetAdvance 
  } = useApp();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isNewSettlementModalOpen, setIsNewSettlementModalOpen] = useState(false);
  const [isExcelPasteModalOpen, setIsExcelPasteModalOpen] = useState(false);

  // Single Modal form states
  const [modalProjectId, setModalProjectId] = useState(projects[0]?.id || '');
  const [modalPersonnelId, setModalPersonnelId] = useState('');
  const [modalTotal, setModalTotal] = useState('');
  const [modalInvalid, setModalInvalid] = useState('0');
  const [modalPrice, setModalPrice] = useState('320');
  const [modalNote, setModalNote] = useState('');

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Excel Export matching exact image format
  const handleExport = () => {
    const targetSettlements = selectedProjectId === 'all' 
      ? settlements 
      : settlements.filter(s => s.projectId === selectedProjectId);

    const exportData = targetSettlements.map(s => {
      const proj = projects.find(p => p.id === s.projectId);
      return {
        'IL': s.city || 'Ankara',
        'TC': s.identityNumber || '-',
        'ANKETÖR': s.personnelName,
        'PROJE': proj?.code || s.projectId,
        'TOPLAM': s.totalSurveys,
        'İPTAL': s.invalidSurveys,
        'GEÇERLİ': s.validSurveys,
        'VERİLEN (BİRİM FİYAT)': `₺${s.unitPriceApplied}`,
        'BRÜT TUTAR': `₺${s.grossAmount.toLocaleString('tr-TR')}`,
        'KESİLEN AVANS': `₺${s.advancesDeducted.toLocaleString('tr-TR')}`,
        'NET ÖDENECEK': `₺${s.netPayable.toLocaleString('tr-TR')}`,
        'ÖDEME DURUMU': s.isPaid ? 'ÖDENDİ' : 'ÖDENMEDİ',
        'İŞLEMİ YAPAN': s.createdByName || 'Fatih Sakar',
        'NOT': s.notes || '-'
      };
    });

    const fileName = selectedProject 
      ? `${selectedProject.code}_Hakedis_Proje_Kapama` 
      : 'Tum_Projeler_Hakedis_Listesi';

    exportToExcel(exportData, fileName, 'Hakedişler');
  };

  // Filtered settlements
  const filteredSettlements = settlements.filter(s => {
    if (selectedProjectId !== 'all' && s.projectId !== selectedProjectId) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        s.personnelName.toLowerCase().includes(term) ||
        (s.city && s.city.toLowerCase().includes(term)) ||
        (s.identityNumber && s.identityNumber.includes(term)) ||
        (s.createdByName && s.createdByName.toLowerCase().includes(term)) ||
        (s.notes && s.notes.toLowerCase().includes(term))
      );
    }
    return true;
  });

  // KPI calculations for currently displayed view
  const currentTotalGross = filteredSettlements.reduce((sum, s) => sum + s.grossAmount, 0);
  const currentTotalAdvances = filteredSettlements.reduce((sum, s) => sum + s.advancesDeducted, 0);
  const currentTotalNet = filteredSettlements.reduce((sum, s) => sum + s.netPayable, 0);
  const currentTotalPaid = filteredSettlements.filter(s => s.isPaid).reduce((sum, s) => sum + s.netPayable, 0);
  const currentValidSurveys = filteredSettlements.reduce((sum, s) => sum + s.validSurveys, 0);

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalProjectId || !modalPersonnelId || !modalTotal) return;

    closeSurveysAndCalculateSettlement(
      modalProjectId,
      modalPersonnelId,
      Number(modalTotal),
      Number(modalInvalid || 0),
      Number(modalPrice || 320),
      modalNote
    );

    setIsNewSettlementModalOpen(false);
    setModalTotal('');
    setModalInvalid('0');
    setModalNote('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="p-5 rounded-2xl bg-white border border-gray-200 border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/25">
            <FolderCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Hakediş Proje Kapama</h1>
            <p className="text-xs text-gray-500">
              Projeyi seçin, Excel'den anketör listesini tek tıkla yapıştırın veya manuel hakediş kapaması yapın
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Excel Paste Button */}
          <button
            onClick={() => setIsExcelPasteModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-gray-900 font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <ClipboardPaste className="w-4 h-4" />
            <span>Excel'den Kopyala-Yapıştır</span>
          </button>

          {/* Single Entry Button */}
          <button
            onClick={() => {
              setModalProjectId(selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || '');
              setIsNewSettlementModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-bold text-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Tekil Satır Ekle</span>
          </button>
        </div>
      </div>

      {/* Project Selector Dropdown */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-sky-400" />
            <span>Hakediş Görüntülenecek Projeyi Seçin:</span>
          </label>
          <div className="relative">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">📁 Tüm Projeler (Toplam {settlements.length} Hakediş Kaydı)</option>
              {projects.filter(p => !p.isArchived).map(p => {
                const count = settlements.filter(s => s.projectId === p.id).length;
                return (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.title} — {p.clientName} ({count} Kayıt)
                  </option>
                );
              })}
              {projects.some(p => p.isArchived) && (
                <optgroup label="--- Arşivlenen / Gizlenen Projeler ---">
                  {projects.filter(p => p.isArchived).map(p => {
                    const count = settlements.filter(s => s.projectId === p.id).length;
                    return (
                      <option key={p.id} value={p.id}>
                        [ARŞİV - {p.code}] {p.title} ({count} Kayıt)
                      </option>
                    );
                  })}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        {selectedProject && (
          <div className="flex items-center gap-3 pt-2 md:pt-0 md:border-l md:border-gray-200 md:pl-4 text-xs">
            <div>
              <span className="text-[10px] text-gray-400 block uppercase">Müşteri:</span>
              <strong className="text-gray-900">{selectedProject.clientName}</strong>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block uppercase">Hedef Anket:</span>
              <strong className="text-sky-400 font-mono">{selectedProject.targetSurveys} Adet</strong>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block uppercase">Tarih:</span>
              <span className="text-gray-700 font-mono text-[11px]">{selectedProject.startDate}</span>
            </div>
          </div>
        )}
      </div>

      {/* KPI Ribbon for Selected Project */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-gray-200">
          <span className="text-[10px] uppercase font-semibold text-gray-500 block">Toplam Geçerli Anket</span>
          <span className="text-xl font-black font-mono text-sky-400 mt-0.5 block">
            {currentValidSurveys} <span className="text-xs font-normal text-gray-400">Adet</span>
          </span>
          <span className="text-[10px] text-gray-400">{filteredSettlements.length} Anketör Hakedişi</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-gray-200">
          <span className="text-[10px] uppercase font-semibold text-gray-500 block">Brüt Hakediş Tutarı</span>
          <span className="text-xl font-black font-mono text-gray-900 mt-0.5 block">
            ₺{currentTotalGross.toLocaleString('tr-TR')}
          </span>
          <span className="text-[10px] text-gray-400">Anket × Birim Fiyat</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-gray-200">
          <span className="text-[10px] uppercase font-semibold text-gray-500 block">Mahsup Edilen Avans</span>
          <span className="text-xl font-black font-mono text-amber-400 mt-0.5 block">
            − ₺{currentTotalAdvances.toLocaleString('tr-TR')}
          </span>
          <span className="text-[10px] text-gray-400">Hakedişten düşüldü</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-gray-200">
          <span className="text-[10px] uppercase font-semibold text-gray-500 block">NET ÖDENECEK TOPLAM</span>
          <span className="text-xl font-black font-mono text-emerald-400 mt-0.5 block">
            ₺{currentTotalNet.toLocaleString('tr-TR')}
          </span>
          <span className="text-[10px] text-emerald-300">Ödenen: ₺{currentTotalPaid.toLocaleString('tr-TR')}</span>
        </div>
      </div>

      {/* Control Bar: Search & Universal Excel Export */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-gray-200">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Anketör adı, şehir, TC kimlik veya not ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Excel Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-all border border-gray-200 cursor-pointer"
            title="Şablona uygun Excel çıktısı alın"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel'e İndir (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* MAIN SETTLEMENT TABLE (MATCHING USER'S SCREENSHOTS) */}
      <div className="rounded-3xl bg-white border border-gray-200 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-white text-gray-500 uppercase tracking-wider text-[11px] border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-4 font-bold">İL</th>
                <th className="py-3.5 px-4 font-bold">TC</th>
                <th className="py-3.5 px-4 font-bold">ANKETÖR</th>
                <th className="py-3.5 px-4 font-bold">PROJE</th>
                <th className="py-3.5 px-4 font-bold text-center">TOPLAM</th>
                <th className="py-3.5 px-4 font-bold text-center text-rose-400">İPTAL</th>
                <th className="py-3.5 px-4 font-bold text-center text-sky-400">GEÇERLİ</th>
                <th className="py-3.5 px-4 font-bold text-right">BİRİM FİYAT</th>
                <th className="py-3.5 px-4 font-bold text-right">BRÜT TUTAR</th>
                <th className="py-3.5 px-4 font-bold text-right text-amber-400">KESİLEN AVANS</th>
                <th className="py-3.5 px-4 font-bold text-right text-emerald-400">NET ÖDENECEK</th>
                <th className="py-3.5 px-4 font-bold text-center">ÖDEME DURUMU</th>
                <th className="py-3.5 px-4 font-bold">İŞLEMİ YAPAN</th>
                <th className="py-3.5 px-4 font-bold">NOT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/80">
              {filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-gray-400">
                    <p className="text-sm font-semibold">Bu projede kayıtlı hakediş bulunamadı.</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Yukarıdaki <strong>"Excel'den Kopyala-Yapıştır"</strong> butonuna tıklayarak Excel tablonuzu doğrudan aktarabilirsiniz.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSettlements.map((s) => {
                  const proj = projects.find(p => p.id === s.projectId);

                  return (
                    <tr key={s.id} className="hover:bg-gray-100 transition-colors">
                      {/* IL */}
                      <td className="py-3 px-4 font-semibold text-gray-700">
                        {s.city || 'Ankara'}
                      </td>

                      {/* TC */}
                      <td className="py-3 px-4 font-mono text-gray-500 text-[11px]">
                        {s.identityNumber || '-'}
                      </td>

                      {/* ANKETÖR */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900 tracking-wide">{s.personnelName}</p>
                        <span className="text-[10px] uppercase text-gray-400">{s.personnelRole}</span>
                      </td>

                      {/* PROJE */}
                      <td className="py-3 px-4 font-mono text-[11px] text-sky-400 font-semibold">
                        {proj?.code}
                      </td>

                      {/* TOPLAM */}
                      <td className="py-3 px-4 text-center font-mono font-medium text-gray-800">
                        {s.totalSurveys}
                      </td>

                      {/* İPTAL */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-rose-400">
                        {s.invalidSurveys > 0 ? `-${s.invalidSurveys}` : '0'}
                      </td>

                      {/* GEÇERLİ */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-sky-300 bg-sky-500/5">
                        {s.validSurveys}
                      </td>

                      {/* VERİLEN (BİRİM FİYAT) */}
                      <td className="py-3 px-4 text-right font-mono text-gray-700">
                        ₺{s.unitPriceApplied.toFixed(2).replace('.', ',')}
                      </td>

                      {/* BRÜT TUTAR */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900">
                        ₺{s.grossAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* KESİLEN AVANS */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-amber-400">
                        {s.advancesDeducted > 0 ? `− ₺${s.advancesDeducted.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '₺0,00'}
                      </td>

                      {/* NET ÖDENECEK */}
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 text-sm bg-emerald-500/5">
                        ₺{s.netPayable.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* ÖDEME DURUMU (ÖDENDİ / ÖDENMEDİ BUTONU) */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleSettlementPaid(s.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                            s.isPaid
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-gray-100 text-gray-500 border-gray-200 hover:text-gray-800 hover:border-gray-300'
                          }`}
                        >
                          {s.isPaid ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>ÖDENDİ</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              <span>ÖDENMEDİ</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* İŞLEMİ YAPAN */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[11px] font-semibold">
                          {s.createdByName || 'Fatih Sakar'}
                        </span>
                      </td>

                      {/* NOT */}
                      <td className="py-3 px-4 text-gray-500 max-w-[150px] truncate text-[11px]">
                        {s.notes || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SINGLE MANUAL SETTLEMENT ENTRY MODAL */}
      {isNewSettlementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-6 text-gray-900 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-sky-400" />
                <span>Tekil Hakediş / Anket Kapama</span>
              </h3>
              <button onClick={() => setIsNewSettlementModalOpen(false)} className="p-1 text-gray-500 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Proje</label>
                <select
                  value={modalProjectId}
                  onChange={(e) => setModalProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 font-medium"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.code} - {p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Anketör Seçin</label>
                <select
                  value={modalPersonnelId}
                  onChange={(e) => setModalPersonnelId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                >
                  <option value="">-- Personel Seçiniz --</option>
                  {personnel.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.city || 'Ankara'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Toplam Yapılan Anket</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={modalTotal}
                    onChange={(e) => setModalTotal(e.target.value)}
                    placeholder="Örn: 7"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-mono text-gray-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-rose-400 mb-1">İptal / Geçersiz</label>
                  <input
                    type="number"
                    min="0"
                    value={modalInvalid}
                    onChange={(e) => setModalInvalid(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-mono text-rose-400 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Birim Fiyat (TL)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={modalPrice}
                    onChange={(e) => setModalPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-mono text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Not / Açıklama</label>
                  <input
                    type="text"
                    value={modalNote}
                    onChange={(e) => setModalNote(e.target.value)}
                    placeholder="Opsiyonel not"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                  />
                </div>
              </div>

              {modalPersonnelId && (
                <div className="p-3 rounded-xl bg-white border border-gray-200 text-xs text-gray-500 space-y-1">
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
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-gray-900 font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
              >
                Hakedişi Hesapla & Sisteme İşle
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EXCEL PASTE IMPORT MODAL */}
      <ExcelPasteSettlementModal
        projectId={selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id}
        isOpen={isExcelPasteModalOpen}
        onClose={() => setIsExcelPasteModalOpen(false)}
      />

    </div>
  );
}




