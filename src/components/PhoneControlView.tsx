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
import QuickAdvanceModal, { GENERAL_TK_ID, localDateStr } from '@/components/QuickAdvanceModal';
import { normalizeTurkishText } from '@/context/AppContext';

/** Günlük TK hedefi: kontrolcü başına günde 40 OK */
export const TK_DAILY_TARGET = 40;
const TK_NEAR = Math.round(TK_DAILY_TARGET * 0.8); // 32

export default function PhoneControlView() {
  const { 
    currentUser, 
    phoneControlRecords, 
    projects, 
    personnel, 
    advances,
    addPhoneControlRecord, 
    updatePhoneControlRecord, 
    deletePhoneControlRecord 
  } = useApp();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedController, setSelectedController] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [payFor, setPayFor] = useState<string | null>(null);
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

  // Günlük 40 OK hedefine göre rozet (arama başına dönüş oranı ikincil bilgi)
  const getTargetBadge = (approved?: number, called?: number) => {
    const ok = Number(approved || 0);
    const conv = called && Number(called) > 0 ? Math.round((ok / Number(called)) * 100) : null;
    const tone = ok >= TK_DAILY_TARGET
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : ok >= TK_NEAR ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200';
    const text = ok >= TK_DAILY_TARGET ? 'Hedef ✓' : ok >= TK_NEAR ? `Yakın · ${TK_DAILY_TARGET - ok} eksik` : `Düşük · ${TK_DAILY_TARGET - ok} eksik`;
    return (
      <span className="inline-flex flex-col items-center">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${tone}`}>
          {ok >= TK_DAILY_TARGET ? <CheckCircle2 className="w-3 h-3" /> : ok >= TK_NEAR ? <AlertCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          <span>{ok}/{TK_DAILY_TARGET} {text}</span>
        </span>
        {conv !== null && <span className="text-xs text-gray-500 mt-0.5">arama dönüşü %{conv}</span>}
      </span>
    );
  };

  // Kontrolcü bazında performans ve hesap (TK ödemeleri saha avanslarından ayrı: "Günlük TK" cebi)
  const today = localDateStr();
  const weekAgo = localDateStr(new Date(new Date(today + 'T12:00:00').getTime() - 6 * 86400000));
  const controllerStats = uniqueControllers.map(name => {
    const recs = phoneControlRecords.filter(r => r.controllerName === name);
    const days = recs.length;
    const ok = recs.reduce((s, r) => s + Number(r.totalApproved || 0), 0);
    const hitDays = recs.filter(r => Number(r.totalApproved || 0) >= TK_DAILY_TARGET).length;
    const week = recs.filter(r => r.controlDate >= weekAgo && r.controlDate <= today);
    const weekOk = week.reduce((s, r) => s + Number(r.totalApproved || 0), 0);
    const todayOk = recs.filter(r => r.controlDate === today).reduce((s, r) => s + Number(r.totalApproved || 0), 0);
    const earned = recs.reduce((s, r) => s + Number(r.dailyWage || 0), 0);
    const paid = advances
      .filter(a => a.projectId === GENERAL_TK_ID && normalizeTurkishText(a.personnelName) === normalizeTurkishText(name))
      .reduce((s, a) => s + Number(a.amount || 0), 0);
    return { name, days, ok, avg: days ? Math.round(ok / days) : 0, hitDays, weekDays: week.length, weekOk, todayOk, hasToday: recs.some(r => r.controlDate === today), earned, paid, balance: earned - paid };
  }).sort((a, b) => b.days - a.days);

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
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600 border border-indigo-500/30">
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
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel'e Aktar</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yeni TK Arama Kaydı Gir</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-gray-200">
          <span className="text-xs uppercase font-bold text-gray-500 tracking-wider block">Toplam Aranan</span>
          <span className="text-xl font-black font-mono text-gray-900 mt-1 block">
            {totalCallsDone} <span className="text-xs font-normal text-gray-500">Kişi / Anket</span>
          </span>
          <span className="text-xs text-gray-500 block mt-0.5">{filteredRecords.length} TK Çalışma Kaydı</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200">
          <span className="text-xs uppercase font-bold text-gray-500 tracking-wider block">Okey / Onay Alınan</span>
          <span className="text-xl font-black font-mono text-emerald-600 mt-1 block">
            {totalApprovedDone} <span className="text-xs font-normal text-gray-500">Onay</span>
          </span>
          <span className="text-xs text-emerald-600 block mt-0.5">Geçerli teyitli anket</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200">
          <span className="text-xs uppercase font-bold text-gray-500 tracking-wider block">Günlük Hedef ({TK_DAILY_TARGET} OK)</span>
          <span className="text-xl font-black font-mono text-gray-900 mt-1 block">
            {filteredRecords.filter(r => Number(r.totalApproved || 0) >= TK_DAILY_TARGET).length}
            <span className="text-sm font-normal text-gray-500"> / {filteredRecords.length} gün tuttu</span>
          </span>
          <span className="text-xs text-gray-600 block mt-0.5">Ortalama {filteredRecords.length ? Math.round(totalApprovedDone / filteredRecords.length) : 0} OK / gün</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200">
          <span className="text-xs uppercase font-bold text-gray-500 tracking-wider block">Toplam TK Maliyeti</span>
          <span className="text-xl font-black font-mono text-amber-600 mt-1 block">
            ₺{totalTkCost.toLocaleString('tr-TR')}
          </span>
          <span className="text-xs text-amber-600 block mt-0.5">TK günlük yevmiye toplamı</span>
        </div>
      </div>

      {/* Kontrolcü bazında hedef ve hesap */}
      {controllerStats.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">Kontrolcüler · hedef ve ödeme</h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {controllerStats.map(c => (
              <div key={c.name} className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-gray-900">{c.name}</p>
                  {c.hasToday ? (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${c.todayOk >= TK_DAILY_TARGET ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                      Bugün {c.todayOk}/{TK_DAILY_TARGET}{c.todayOk < TK_DAILY_TARGET ? ` · ${TK_DAILY_TARGET - c.todayOk} eksik` : ' ✓'}
                    </span>
                  ) : <span className="text-xs text-gray-500">Bugün kayıt yok</span>}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-gray-50 py-2">
                    <p className="text-base font-bold text-gray-900">{c.avg}</p>
                    <p className="text-xs text-gray-500">ort. OK/gün</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 py-2">
                    <p className="text-base font-bold text-gray-900">{c.hitDays}/{c.days}</p>
                    <p className="text-xs text-gray-500">hedef tutan gün</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 py-2">
                    <p className={`text-base font-bold ${c.weekOk >= c.weekDays * TK_DAILY_TARGET ? 'text-emerald-700' : 'text-amber-700'}`}>{c.weekOk}/{c.weekDays * TK_DAILY_TARGET}</p>
                    <p className="text-xs text-gray-500">son 7 gün</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                  <span className="text-gray-600">
                    Yevmiye ₺{c.earned.toLocaleString('tr-TR')} · Ödenen ₺{c.paid.toLocaleString('tr-TR')}
                    <br />
                    <strong className={c.balance > 0 ? 'text-emerald-700' : c.balance < 0 ? 'text-amber-700' : 'text-gray-500'}>
                      {c.balance > 0 ? `Ödenecek ₺${c.balance.toLocaleString('tr-TR')}` : c.balance < 0 ? `Fazla ödeme ₺${(-c.balance).toLocaleString('tr-TR')}` : 'Hesap kapalı'}
                    </strong>
                  </span>
                  <button onClick={() => setPayFor(c.name)} className="shrink-0 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold cursor-pointer">
                    Ödeme yaz
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">TK ödemeleri &ldquo;Günlük TK&rdquo; cebine yazılır ve saha (anketör) avanslarından ayrı tutulur.</p>
        </div>
      )}

      <QuickAdvanceModal isOpen={payFor !== null} presetProjectId={GENERAL_TK_ID} presetPersonName={payFor || undefined} onClose={() => setPayFor(null)} />

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

      {/* TELEFON: kart görünümü */}
      <div className="sm:hidden space-y-2.5">
        {filteredRecords.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500 bg-white rounded-2xl border border-gray-200">Kayıt bulunamadı.</p>
        ) : (
          filteredRecords.map((rec) => (
            <div key={rec.id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-base leading-tight">{rec.controllerName}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{new Date(rec.controlDate).toLocaleDateString('tr-TR')} · {rec.projectCode}</p>
                </div>
                <p className="text-lg font-black font-mono text-amber-700 shrink-0">₺{Number(rec.dailyWage || 0).toLocaleString('tr-TR')}</p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-gray-50 py-2">
                  <p className="text-base font-bold text-gray-900">{rec.totalCalled}</p>
                  <p className="text-xs text-gray-500">arandı</p>
                </div>
                <div className="rounded-xl bg-emerald-50 py-2">
                  <p className="text-base font-bold text-emerald-700">{rec.totalApproved}</p>
                  <p className="text-xs text-gray-500">okey</p>
                </div>
                <div className="rounded-xl bg-gray-50 py-2 flex flex-col items-center justify-center">
                  {getTargetBadge(rec.totalApproved, rec.totalCalled)}
                </div>
              </div>
              {rec.notes && <p className="mt-2 text-sm text-gray-600">{rec.notes}</p>}
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => handleOpenEditModal(rec)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 cursor-pointer"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => {
                    if (confirm(`${rec.controllerName} kişisine ait bu TK kaydını silmek istediğinize emin misiniz?`)) {
                      deletePhoneControlRecord(rec.id);
                    }
                  }}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-sm font-semibold text-rose-600 cursor-pointer"
                >
                  Sil
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MASAÜSTÜ: tablo */}
      <div className="hidden sm:block rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-xs border-b border-gray-200">
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
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <PhoneCall className="w-8 h-8 text-gray-500 mx-auto mb-2" />
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
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 text-xs font-bold">
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
                      {getTargetBadge(rec.totalApproved, rec.totalCalled)}
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
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600 border border-indigo-500/30">
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
                  Kontrol Tarihi <span className="text-rose-600">*</span>
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
                    TK Kontrolcüsü Adı Soyadı <span className="text-rose-600">*</span>
                  </label>
                  {personnel.filter(p => p.defaultRole === 'telefon_kontrolcu').length > 0 && (
                    <span className="text-xs text-indigo-600 font-medium">Kayıtlı TK personellerinden seçin:</span>
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
                              ? 'bg-indigo-500 text-white font-bold shadow-sm'
                              : p.defaultRole === 'telefon_kontrolcu'
                                ? 'bg-indigo-950/60 text-indigo-700 hover:bg-indigo-900 border border-indigo-800/60'
                                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          <span>{p.fullName}</span>
                          {p.defaultRole === 'telefon_kontrolcu' && (
                            <span className="text-xs px-1 rounded bg-indigo-500/30 text-indigo-200">TK</span>
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                    TK'cı Günlük Sabit Ücreti (TL) <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-xs text-gray-500">Kimine 1000, kimine 1500 seçilebilir</span>
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
                          ? 'bg-amber-500 text-white shadow-md'
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
                  <label className="block text-xs uppercase font-bold text-gray-600 mb-1">
                    ARANAN ADET <span className="text-rose-600">*</span>
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
                  <label className="block text-xs uppercase font-bold text-emerald-700 mb-1">
                    OKEY (ONAY) <span className="text-rose-600">*</span>
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
              {(Number(formTotalCalled) > 0 || Number(formTotalApproved) > 0) && (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium">
                    Günlük hedefe göre:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-800">
                      {formTotalApproved} / {formTotalCalled}
                    </span>
                    {getTargetBadge(Number(formTotalApproved || 0), Number(formTotalCalled || 0))}
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




