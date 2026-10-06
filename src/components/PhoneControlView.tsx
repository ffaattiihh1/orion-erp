'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  PhoneCall, 
  Plus, 
  Calendar, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  PhoneOff, 
  Banknote, 
  FileSpreadsheet, 
  Trash2, 
  Edit3, 
  Search, 
  X, 
  TrendingUp, 
  AlertCircle,
  Percent,
  Layers,
  PhoneForwarded
} from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';
import { PhoneControlRecord } from '@/types';

export default function PhoneControlView() {
  const { 
    currentUser, 
    phoneControlRecords, 
    projects, 
    personnel, 
    addPhoneControlRecord, 
    updatePhoneControlRecord, 
    deletePhoneControlRecord 
  } = useApp();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedController, setSelectedController] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // Form states
  const [formProjectId, setFormProjectId] = useState<string>('');
  const [formControlDate, setFormControlDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formControllerName, setFormControllerName] = useState<string>('');
  const [formDailyWage, setFormDailyWage] = useState<number>(1000);
  const [formTotalCalled, setFormTotalCalled] = useState<string>('80');
  const [formTotalApproved, setFormTotalApproved] = useState<string>('72');
  const [formTotalRejected, setFormTotalRejected] = useState<string>('4');
  const [formTotalUnreachable, setFormTotalUnreachable] = useState<string>('4');
  const [formNotes, setFormNotes] = useState<string>('');

  // Quick preset wages
  const wagePresets = [800, 1000, 1200, 1500, 1750, 2000];

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingRecordId(null);
    setFormProjectId('general_tk');
    setFormControlDate(new Date().toISOString().split('T')[0]);
    setFormControllerName('');
    setFormDailyWage(1000);
    setFormTotalCalled('80');
    setFormTotalApproved('72');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rec: PhoneControlRecord) => {
    setEditingRecordId(rec.id);
    setFormProjectId(rec.projectId || 'general_tk');
    setFormControlDate(rec.controlDate);
    setFormControllerName(rec.controllerName);
    setFormDailyWage(rec.dailyWage || 1000);
    setFormTotalCalled(String(rec.totalCalled));
    setFormTotalApproved(String(rec.totalApproved));
    setFormNotes(rec.notes || '');
    setIsModalOpen(true);
  };

  // Controller quick selection helper
  const handleSelectPersonnelController = (p: { fullName: string; defaultUnitPrice?: number; defaultRole?: string }) => {
    setFormControllerName(p.fullName);
    if (p.defaultUnitPrice && p.defaultUnitPrice > 0) {
      setFormDailyWage(p.defaultUnitPrice);
    }
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formControllerName.trim()) {
      alert('Lütfen TK kontrolcüsü adını girin.');
      return;
    }

    const called = Number(formTotalCalled || 0);
    const approved = Number(formTotalApproved || 0);
    const rate = called > 0 ? Math.round((approved / called) * 100) : 0;

    if (editingRecordId) {
      updatePhoneControlRecord(editingRecordId, {
        projectId: 'general_tk',
        projectCode: 'GÜNLÜK TK',
        projectTitle: 'Günlük TK',
        controllerName: formControllerName.trim(),
        controlDate: formControlDate,
        dailyWage: Number(formDailyWage),
        totalCalled: called,
        totalApproved: approved,
        totalRejected: 0,
        totalUnreachable: 0,
        approvalRate: rate,
        notes: formNotes
      });
      setIsModalOpen(false);
    } else {
      await addPhoneControlRecord({
        projectId: 'general_tk',
        projectCode: 'GÜNLÜK TK',
        projectTitle: 'Günlük TK',
        controllerName: formControllerName.trim(),
        controlDate: formControlDate,
        dailyWage: Number(formDailyWage),
        totalCalled: called,
        totalApproved: approved,
        totalRejected: 0,
        totalUnreachable: 0,
        approvalRate: rate,
        notes: formNotes
      });
      setIsModalOpen(false);
    }
  };

  // Filter Records
  const filteredRecords = phoneControlRecords.filter(rec => {
    if (selectedProjectId !== 'all' && rec.projectId !== selectedProjectId) return false;
    if (selectedController !== 'all' && rec.controllerName !== selectedController) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const inProj = rec.projectCode?.toLowerCase().includes(q) || rec.projectTitle?.toLowerCase().includes(q);
      const inName = rec.controllerName?.toLowerCase().includes(q);
      const inNotes = rec.notes?.toLowerCase().includes(q);
      if (!inProj && !inName && !inNotes) return false;
    }
    return true;
  });

  // Unique Controllers for Filter
  const uniqueControllers = Array.from(new Set(phoneControlRecords.map(r => r.controllerName))).filter(Boolean);

  // Summary Metrics
  const totalCallsDone = filteredRecords.reduce((sum, r) => sum + Number(r.totalCalled || 0), 0);
  const totalApprovedDone = filteredRecords.reduce((sum, r) => sum + Number(r.totalApproved || 0), 0);
  const totalRejectedDone = filteredRecords.reduce((sum, r) => sum + Number(r.totalRejected || 0), 0);
  const totalTkCost = filteredRecords.reduce((sum, r) => sum + Number(r.dailyWage || 0), 0);
  const overallApprovalRate = totalCallsDone > 0 ? Math.round((totalApprovedDone / totalCallsDone) * 100) : 0;

  // Rate Badge Style
  const getApprovalRateBadge = (rate?: number) => {
    const r = rate || 0;
    if (r >= 90) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          <span>%{r} Onay (Yüksek Kalite)</span>
        </span>
      );
    }
    if (r >= 75) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <AlertCircle className="w-3 h-3" />
          <span>%{r} Onay (Standart)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
        <XCircle className="w-3 h-3" />
        <span>%{r} Onay (Düşük / İnceleme)</span>
      </span>
    );
  };

  // Excel Export
  const handleExportExcel = () => {
    const rows = filteredRecords.map(r => ({
      'Tarih': r.controlDate,
      'Proje Kodu': r.projectCode,
      'Proje Adı': r.projectTitle,
      'TK Kontrolcüsü': r.controllerName,
      'TK Günlük Ücreti (TL)': r.dailyWage,
      'Aranan Anket / Kişi': r.totalCalled,
      'Okey / Onay Alınan': r.totalApproved,
      'Red / İptal': r.totalRejected,
      'Ulaşılamayan': r.totalUnreachable || 0,
      'Okey / Onay Oranı (%)': `%${r.approvalRate || 0}`,
      'Kontrol Notları': r.notes || '-',
      'Kayıt Eden': r.createdByName || 'SPV'
    }));

    exportToExcel(rows, 'Orion_TK_Telefon_Kontrol_Raporu', 'Telefon Kontrol');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">TK & Telefon Kontrol Takibi</h1>
              <p className="text-xs text-gray-500">
                Yapılan anketlerin telefon kontrolü, günlük arama ve okey sayıları, TK kontrolcü günlük ücretleri
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all border border-gray-200 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel'e Aktar</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-gray-900 text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yeni TK Arama Kaydı Gir</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-gray-200">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">Toplam Aranan</span>
          <span className="text-xl font-black font-mono text-gray-900 mt-1 block">
            {totalCallsDone} <span className="text-xs font-normal text-gray-400">Kişi / Anket</span>
          </span>
          <span className="text-[10px] text-gray-400 block mt-0.5">{filteredRecords.length} TK Çalışma Kaydı</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">Okey / Onay Alınan</span>
          <span className="text-xl font-black font-mono text-emerald-600 mt-1 block">
            {totalApprovedDone} <span className="text-xs font-normal text-gray-400">Onay</span>
          </span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">Geçerli teyitli anket</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">Genel Onay Başarısı</span>
          <span className="text-xl font-black font-mono text-sky-600 mt-1 block">
            %{overallApprovalRate}
          </span>
          <span className="text-[10px] text-sky-600 block mt-0.5">Teyit Başarı Oranı</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">Toplam TK Maliyeti</span>
          <span className="text-xl font-black font-mono text-amber-600 mt-1 block">
            ₺{totalTkCost.toLocaleString('tr-TR')}
          </span>
          <span className="text-[10px] text-amber-600 block mt-0.5">TK günlük yevmiye toplamı</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Controller Filter */}
          <select
            value={selectedController}
            onChange={(e) => setSelectedController(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Tüm TK Kontrolcüleri ({uniqueControllers.length})</option>
            {uniqueControllers.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Kontrolcü veya not ara..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table of TK Records */}
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Kontrol Tarihi</th>
                <th className="py-3 px-4">TK Kontrolcüsü</th>
                <th className="py-3 px-4 text-right text-amber-600">TK Günlük Ücreti</th>
                <th className="py-3 px-4 text-center">Aranan Adet</th>
                <th className="py-3 px-4 text-center text-emerald-600 font-bold">Okey (Onay)</th>
                <th className="py-3 px-4 text-center">Onay Başarısı</th>
                <th className="py-3 px-4">Kontrol Notu</th>
                <th className="py-3 px-4 text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <PhoneCall className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    Henüz kayıtlı günlük telefon kontrol (TK) verisi bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-gray-700 whitespace-nowrap">
                      {rec.controlDate}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-gray-900 whitespace-nowrap flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 text-[11px] font-bold">
                        TK
                      </div>
                      <span>{rec.controllerName}</span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-600 whitespace-nowrap">
                      ₺{Number(rec.dailyWage || 0).toLocaleString('tr-TR')}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-900">
                      {rec.totalCalled}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-black text-emerald-600 bg-emerald-50">
                      {rec.totalApproved}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getApprovalRateBadge(rec.approvalRate)}
                    </td>

                    <td className="py-3.5 px-4 text-gray-600 text-xs max-w-[200px] truncate" title={rec.notes}>
                      {rec.notes || '-'}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(rec)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
                          title="Düzenle"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`${rec.controllerName} kişisine ait bu TK kaydını silmek istediğinize emin misiniz?`)) {
                              deletePhoneControlRecord(rec.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-100 text-gray-500 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- MODAL: CREATE / EDIT TK RECORD ---------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 text-gray-900 shadow-2xl space-y-4 my-6">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 tracking-tight">
                    {editingRecordId ? 'TK Arama Kaydını Düzenle' : 'Yeni TK Arama Kaydı Ekle'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Telefon kontrolcüsü günlük arama, okey sayısı ve günlük ücreti
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Row 1: Kontrol Tarihi (Günlük TK) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Kontrol Tarihi <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formControlDate}
                  onChange={(e) => setFormControlDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Row 2: TK Kontrolcü Adı */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    TK Kontrolcüsü Adı Soyadı <span className="text-rose-400">*</span>
                  </label>
                  {personnel.filter(p => p.defaultRole === 'telefon_kontrolcu').length > 0 && (
                    <span className="text-[10px] text-indigo-400 font-medium">Kayıtlı TK personellerinden seçin:</span>
                  )}
                </div>

                {/* Quick select chips for registered Telefon Kontrolcüleri */}
                {personnel.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {personnel
                      .filter(p => !p.isBlacklisted)
                      .slice(0, 8)
                      .map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectPersonnelController(p)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                            formControllerName === p.fullName
                              ? 'bg-indigo-500 text-gray-900 font-bold shadow-sm'
                              : p.defaultRole === 'telefon_kontrolcu'
                                ? 'bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900 border border-indigo-800/60'
                                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          <span>{p.fullName}</span>
                          {p.defaultRole === 'telefon_kontrolcu' && (
                            <span className="text-[9px] px-1 rounded bg-indigo-500/30 text-indigo-200">TK</span>
                          )}
                        </button>
                      ))}
                  </div>
                )}

                <input
                  type="text"
                  required
                  value={formControllerName}
                  onChange={(e) => setFormControllerName(e.target.value)}
                  placeholder="Örn: Merve Kaya (TK)"
                  list="tk-personnel-list"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <datalist id="tk-personnel-list">
                  {personnel.map(p => (
                    <option key={p.id} value={p.fullName} />
                  ))}
                </datalist>
              </div>

              {/* Row 3: TK Günlük Ücreti (Ayarlanabilir) */}
              <div className="p-3.5 rounded-2xl bg-white border border-gray-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-amber-500">
                    TK'cı Günlük Sabit Ücreti (TL) <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-gray-500">Kimine 1000, kimine 1500 seçilebilir</span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {wagePresets.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormDailyWage(preset)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer font-mono ${
                        formDailyWage === preset
                          ? 'bg-amber-500 text-gray-900 shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      ₺{preset.toLocaleString('tr-TR')}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-amber-500 font-bold text-xs">₺</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50"
                    value={formDailyWage}
                    onChange={(e) => setFormDailyWage(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-mono font-bold text-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Row 4: Arama İstatistikleri (Sadece Aranan ve Okey Onay) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                  <label className="block text-[11px] uppercase font-bold text-gray-600 mb-1">
                    ARANAN ADET <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formTotalCalled}
                    onChange={(e) => setFormTotalCalled(e.target.value)}
                    placeholder="80"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-base font-mono font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <label className="block text-[11px] uppercase font-bold text-emerald-700 mb-1">
                    OKEY (ONAY) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formTotalApproved}
                    onChange={(e) => setFormTotalApproved(e.target.value)}
                    placeholder="72"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-400 text-base font-mono font-black text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                  />
                </div>
              </div>

              {/* Live Quality Preview Ribbon */}
              {Number(formTotalCalled) > 0 && (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium">
                    Hesaplanan Başarı Oranı:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-800">
                      {formTotalApproved} / {formTotalCalled}
                    </span>
                    {getApprovalRateBadge(Math.round((Number(formTotalApproved || 0) / Number(formTotalCalled || 1)) * 100))}
                  </div>
                </div>
              )}

              {/* Row 5: Notlar */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  TK Kontrol Notları & Uyarılar (Opsiyonel)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Örn: Sorular tam ve eksiksiz sorulmuş..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  {editingRecordId ? 'TK Kaydını Güncelle' : 'TK Arama Kaydını Kaydet'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}




