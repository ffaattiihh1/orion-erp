'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  FileText, 
  Plus, 
  Calendar, 
  MapPin, 
  Users, 
  Banknote, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileSpreadsheet, 
  Trash2, 
  Edit3, 
  Search, 
  X, 
  UserCheck, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp,
  Briefcase
} from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';
import { DailyFieldReport, DailyFieldWorker, FieldStatus } from '@/types';

export default function DailyReportsView() {
  const { 
    currentUser, 
    dailyReports, 
    projects, 
    personnel, 
    addDailyReport, 
    updateDailyReport, 
    deleteDailyReport 
  } = useApp();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Form states
  const [formProjectId, setFormProjectId] = useState<string>('');
  const [formReportDate, setFormReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formLocations, setFormLocations] = useState<string>('');
  const [formStatus, setFormStatus] = useState<FieldStatus>('started');
  const [formStatusReason, setFormStatusReason] = useState<string>('');
  const [formActualStartDate, setFormActualStartDate] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formWorkers, setFormWorkers] = useState<DailyFieldWorker[]>([
    {
      id: 'w-1',
      personnelName: '',
      onBehalfOf: '',
      dailyWage: 1000,
      surveysCompleted: 0,
      role: 'Anketör',
      notes: ''
    }
  ]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingReportId(null);
    setFormProjectId(projects[0]?.id || '');
    setFormReportDate(new Date().toISOString().split('T')[0]);
    setFormLocations('');
    setFormStatus('started');
    setFormStatusReason('');
    setFormActualStartDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setFormWorkers([
      {
        id: 'w-' + Date.now(),
        personnelName: '',
        onBehalfOf: '',
        dailyWage: 1000,
        surveysCompleted: 0,
        role: 'Anketör',
        notes: ''
      }
    ]);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rep: DailyFieldReport) => {
    setEditingReportId(rep.id);
    setFormProjectId(rep.projectId);
    setFormReportDate(rep.reportDate);
    setFormLocations(rep.locations || '');
    setFormStatus(rep.status);
    setFormStatusReason(rep.statusReason || '');
    setFormActualStartDate(rep.actualStartDate || '');
    setFormNotes(rep.notes || '');
    setFormWorkers(
      rep.workers && rep.workers.length > 0 
        ? JSON.parse(JSON.stringify(rep.workers)) 
        : [{
            id: 'w-' + Date.now(),
            personnelName: '',
            onBehalfOf: '',
            dailyWage: 1000,
            surveysCompleted: 0,
            role: 'Anketör',
            notes: ''
          }]
    );
    setIsModalOpen(true);
  };

  // Add Worker Row in Form
  const handleAddWorkerRow = () => {
    setFormWorkers(prev => [
      ...prev,
      {
        id: 'w-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
        personnelName: '',
        onBehalfOf: '',
        dailyWage: 1000,
        surveysCompleted: 0,
        role: 'Anketör',
        notes: ''
      }
    ]);
  };

  // Remove Worker Row
  const handleRemoveWorkerRow = (id: string) => {
    if (formWorkers.length === 1) return;
    setFormWorkers(prev => prev.filter(w => w.id !== id));
  };

  // Update Worker Field
  const handleUpdateWorker = (id: string, field: keyof DailyFieldWorker, value: any) => {
    setFormWorkers(prev => prev.map(w => {
      if (w.id !== id) return w;
      return { ...w, [field]: value };
    }));
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProjectId) {
      alert('Lütfen bir proje seçin.');
      return;
    }

    const selectedProj = projects.find(p => p.id === formProjectId);
    const validWorkers = formWorkers.filter(w => w.personnelName.trim() !== '');

    const totalWage = validWorkers.reduce((sum, w) => sum + Number(w.dailyWage || 0), 0);
    const totalSurveys = validWorkers.reduce((sum, w) => sum + Number(w.surveysCompleted || 0), 0);

    if (editingReportId) {
      updateDailyReport(editingReportId, {
        projectId: formProjectId,
        projectCode: selectedProj?.code || 'PROJ',
        projectTitle: selectedProj?.title || '',
        reportDate: formReportDate,
        locations: formLocations,
        status: formStatus,
        statusReason: formStatusReason,
        actualStartDate: formActualStartDate,
        workers: validWorkers,
        totalDailyWage: totalWage,
        totalDailySurveys: totalSurveys,
        notes: formNotes
      });
    } else {
      await addDailyReport({
        projectId: formProjectId,
        projectCode: selectedProj?.code || 'PROJ',
        projectTitle: selectedProj?.title || '',
        reportDate: formReportDate,
        locations: formLocations,
        status: formStatus,
        statusReason: formStatusReason,
        actualStartDate: formActualStartDate,
        workers: validWorkers,
        totalDailyWage: totalWage,
        totalDailySurveys: totalSurveys,
        notes: formNotes
      });
    }

    setIsModalOpen(false);
  };

  // Filter Reports
  const filteredReports = dailyReports.filter(rep => {
    if (selectedProjectId !== 'all' && rep.projectId !== selectedProjectId) return false;
    if (statusFilter !== 'all' && rep.status !== statusFilter) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const inProj = rep.projectCode?.toLowerCase().includes(q) || rep.projectTitle?.toLowerCase().includes(q);
      const inLoc = rep.locations?.toLowerCase().includes(q);
      const inNotes = rep.notes?.toLowerCase().includes(q) || rep.statusReason?.toLowerCase().includes(q);
      const inWorkers = rep.workers?.some(w => 
        w.personnelName.toLowerCase().includes(q) || 
        w.onBehalfOf?.toLowerCase().includes(q)
      );
      if (!inProj && !inLoc && !inNotes && !inWorkers) return false;
    }
    return true;
  });

  // Calculate Summary Statistics
  const totalReportsCount = filteredReports.length;
  const totalWorkersCount = filteredReports.reduce((sum, r) => sum + (r.workers?.length || 0), 0);
  const totalSurveysDone = filteredReports.reduce((sum, r) => sum + Number(r.totalDailySurveys || 0), 0);
  const totalWageCost = filteredReports.reduce((sum, r) => sum + Number(r.totalDailyWage || 0), 0);

  // Status Badge Helper
  const getStatusBadge = (status: FieldStatus) => {
    switch (status) {
      case 'started':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Saha Başladı / Aktif</span>
          </span>
        );
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            <span>Başlayamadı / Gecikti</span>
          </span>
        );
      case 'ongoing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
            <Clock className="w-3 h-3 text-sky-400" />
            <span>Saha Devam Ediyor</span>
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Geçici Durduruldu</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <CheckCircle2 className="w-3 h-3 text-indigo-400" />
            <span>Saha Tamamlandı</span>
          </span>
        );
      default:
        return null;
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    const rows: any[] = [];
    filteredReports.forEach(r => {
      if (r.workers && r.workers.length > 0) {
        r.workers.forEach(w => {
          rows.push({
            'Tarih': r.reportDate,
            'Proje Kodu': r.projectCode,
            'Proje Adı': r.projectTitle,
            'Saha Durumu': r.status.toUpperCase(),
            'Gecikme / Başlama Nedeni': r.statusReason || '-',
            'Anket Noktaları / Lokasyon': r.locations,
            'Çalışan Anketör': w.personnelName,
            'Şunun Adına Çalıştı': w.onBehalfOf || '-',
            'Günlük Ücret / Yevmiye (TL)': w.dailyWage,
            'Yapılan Anket': w.surveysCompleted || 0,
            'Raporu Giren': r.createdByName || 'SPV',
            'Genel Saha Notu': r.notes || '-'
          });
        });
      } else {
        rows.push({
          'Tarih': r.reportDate,
          'Proje Kodu': r.projectCode,
          'Proje Adı': r.projectTitle,
          'Saha Durumu': r.status.toUpperCase(),
          'Gecikme / Başlama Nedeni': r.statusReason || '-',
          'Anket Noktaları / Lokasyon': r.locations,
          'Çalışan Anketör': 'Personel Yok',
          'Şunun Adına Çalıştı': '-',
          'Günlük Ücret / Yevmiye (TL)': 0,
          'Yapılan Anket': r.totalDailySurveys || 0,
          'Raporu Giren': r.createdByName || 'SPV',
          'Genel Saha Notu': r.notes || '-'
        });
      }
    });

    exportToExcel(rows, 'Orion_Saha_Gunluk_Raporlari', 'Saha Raporları');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Saha Günlük Raporları & Anketör Takibi</h1>
              <p className="text-xs text-slate-400">
                Günlük saha lokasyonları, çalışan anketörler, adına çalışmalar, yevmiyeler ve saha başlama/gecikme durumları
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel'e Aktar</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Günlük Rapor Yaz</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Toplam Rapor Girişi</span>
          <span className="text-xl font-black font-mono text-white mt-1 block">
            {totalReportsCount} <span className="text-xs font-normal text-slate-500">Günlük Kayıt</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Proje bazlı saha günlüğü</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Toplam Sahaya Çıkan</span>
          <span className="text-xl font-black font-mono text-sky-400 mt-1 block">
            {totalWorkersCount} <span className="text-xs font-normal text-slate-500">Kişi / Gün</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Anketör & Gözlemci</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Yapılan Toplam Anket</span>
          <span className="text-xl font-black font-mono text-emerald-400 mt-1 block">
            {totalSurveysDone} <span className="text-xs font-normal text-slate-500">Anket</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Raporlanan anket sayısı</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Toplam Anketör Yevmiyesi</span>
          <span className="text-xl font-black font-mono text-amber-400 mt-1 block">
            ₺{totalWageCost.toLocaleString('tr-TR')}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Toplam saha hakedişi</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">Tüm Projeler ({projects.length})</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.code} - {p.title || p.clientName}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="started">Saha Başladı / Aktif</option>
            <option value="delayed">Başlayamadı / Gecikti</option>
            <option value="ongoing">Devam Ediyor</option>
            <option value="paused">Durduruldu</option>
            <option value="completed">Tamamlandı</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Anketör, nokta, proje veya not ara..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3.5">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <FileText className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">Henüz saha günlük raporu bulunmuyor</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Yukarıdaki <strong>"+ Günlük Rapor Yaz"</strong> butonunu kullanarak bugün anket yapılan noktaları, çalışan anketörleri ve yevmiyeleri kaydedebilirsiniz.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>İlk Raporu Oluştur</span>
            </button>
          </div>
        ) : (
          filteredReports.map((rep) => {
            const isExpanded = expandedReportId === rep.id;

            return (
              <div 
                key={rep.id} 
                className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg transition-all hover:border-slate-700"
              >
                {/* Main Card Header */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {rep.projectCode}
                      </span>
                      <span className="text-xs font-bold text-slate-200">
                        {rep.projectTitle}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <strong>{rep.reportDate}</strong>
                      </span>
                      {getStatusBadge(rep.status)}
                    </div>

                    {/* Locations */}
                    <div className="flex items-start gap-1.5 text-xs text-slate-300">
                      <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="font-semibold text-white">Çalışılan Noktalar:</span>
                      <span className="text-slate-300 font-medium">{rep.locations || 'Nokta bilgisi girilmedi'}</span>
                    </div>

                    {/* Delay or Start Reason if any */}
                    {rep.statusReason && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>Saha Durum Açıklaması:</strong> {rep.statusReason}
                          {rep.actualStartDate && (
                            <span className="block text-[11px] text-rose-200 mt-0.5">
                              Saha Gerçek Başlama Tarihi: <strong>{rep.actualStartDate}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary & Action Buttons */}
                  <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    <div className="grid grid-cols-3 gap-2 text-center text-xs pr-2">
                      <div className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Çalışan</span>
                        <strong className="text-white text-xs font-mono">{rep.workers?.length || 0} Kişi</strong>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Anket</span>
                        <strong className="text-sky-400 text-xs font-mono">{rep.totalDailySurveys || 0}</strong>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Yevmiye</span>
                        <strong className="text-amber-400 text-xs font-mono">₺{(rep.totalDailyWage || 0).toLocaleString('tr-TR')}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(rep)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                        title="Raporu Düzenle"
                      >
                        <Edit3 className="w-4 h-4 text-sky-400" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`${rep.projectCode} tarihli bu günlük raporu silmek istediğinize emin misiniz?`)) {
                            deleteDailyReport(rep.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800/40 transition-all cursor-pointer"
                        title="Raporu Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setExpandedReportId(isExpanded ? null : rep.id)}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                      >
                        <span>Detay</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details: Worker Breakdown & Notes */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-slate-800/80 bg-slate-950/40 space-y-3.5">
                    
                    {/* General Field Notes */}
                    {rep.notes && (
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                          Günün Saha Notları / Yapılan İşler:
                        </span>
                        <p className="text-slate-200 whitespace-pre-line leading-relaxed">{rep.notes}</p>
                      </div>
                    )}

                    {/* Workers Table */}
                    <div>
                      <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block mb-2">
                        Sahada Çalışan Anketörler & Günlük Yevmiyeler ({rep.workers?.length || 0} Kişi):
                      </span>
                      
                      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                            <tr>
                              <th className="py-2.5 px-3">Çalışan Personel</th>
                              <th className="py-2.5 px-3">Adına Çalıştığı Kişi (Yedek/Yerine)</th>
                              <th className="py-2.5 px-3 text-center">Rol</th>
                              <th className="py-2.5 px-3 text-center">Yapılan Anket</th>
                              <th className="py-2.5 px-3 text-right text-amber-400">Günlük Ücret (Yevmiye)</th>
                              <th className="py-2.5 px-3">Açıklama / Not</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-medium">
                            {rep.workers && rep.workers.length > 0 ? (
                              rep.workers.map((w, idx) => (
                                <tr key={w.id || idx} className="hover:bg-slate-800/30 transition-colors">
                                  <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>{w.personnelName}</span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {w.onBehalfOf ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-semibold">
                                        👉 {w.onBehalfOf} adına
                                      </span>
                                    ) : (
                                      <span className="text-slate-500 text-[11px]">Kendi adına</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-center text-slate-400 uppercase text-[10px]">
                                    {w.role || 'Anketör'}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono font-bold text-sky-400">
                                    {w.surveysCompleted || 0} Adet
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300">
                                    ₺{Number(w.dailyWage || 0).toLocaleString('tr-TR')}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                                    {w.notes || '-'}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="py-4 text-center text-slate-500">
                                  Personel detayı girilmemiş.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                      <span>Raporu Oluşturan: <strong className="text-slate-300">{rep.createdByName || 'SPV'}</strong></span>
                      <span>Kayıt Tarihi: {new Date(rep.createdAt).toLocaleString('tr-TR')}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ---------------- MODAL: CREATE / EDIT DAILY REPORT ---------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 text-slate-100 shadow-2xl space-y-4 my-6 max-h-[92vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {editingReportId ? 'Saha Günlük Raporunu Düzenle' : 'Yeni Saha Günlük Raporu Yaz'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bugün çalışılan noktalar, sahaya çıkan anketörler ve yevmiyeler
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Row 1: Proje ve Tarih */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    İlgili Proje <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">-- Proje Seçin --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code} - {p.title || p.clientName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Rapor Tarihi <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formReportDate}
                    onChange={(e) => setFormReportDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Row 2: Saha Noktaları / Lokasyon */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bugün Anket Yapılan Noktalar & Lokasyonlar <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formLocations}
                  onChange={(e) => setFormLocations(e.target.value)}
                  placeholder="Örn: Kadıköy Rıhtım, Moda Sahil, Altıyol Meydan, Beşiktaş Çarşı"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Row 3: Saha Durumu & Başlayamama/Gecikme Takibi */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Saha İlerleme / Başlama Durumu</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as FieldStatus)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="started">Saha Başladı / Aktif Çalışıyor</option>
                      <option value="ongoing">Saha Devam Ediyor</option>
                      <option value="delayed">Saha Başlayamadı / Gecikti</option>
                      <option value="paused">Hava Muhalefeti / Geçici Durduruldu</option>
                      <option value="completed">Saha Tamamlandı</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Saha Gerçek Başlama Tarihi (Varsa)</label>
                    <input
                      type="date"
                      value={formActualStartDate}
                      onChange={(e) => setFormActualStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Gecikme / Başlayamama Nedeni veya Saha Durum Notu (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={formStatusReason}
                    onChange={(e) => setFormStatusReason(e.target.value)}
                    placeholder="Örn: Yağış sebebiyle saha 13:00'te başlayabildi / İzin belgesi beklendiği için başlanamadı"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Row 4: Sahada Çalışan Kişiler, Adına Çalışmalar ve Günlük Ücretler */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Çalışan Anketörler & Günlük Yevmiyeler</span>
                    <span className="text-[11px] text-slate-400">Kimler sahaya çıktı, kimin adına çalıştı, günlük ücreti ne kadar</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddWorkerRow}
                    className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Anketör Ekle</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {formWorkers.map((w, idx) => (
                    <div 
                      key={w.id} 
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center text-xs"
                    >
                      {/* Worker Name */}
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] text-slate-400 mb-0.5">Çalışan Kişi Adı</label>
                        <input
                          type="text"
                          required
                          value={w.personnelName}
                          onChange={(e) => handleUpdateWorker(w.id, 'personnelName', e.target.value)}
                          placeholder="Örn: Ahmet Yılmaz"
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          list="personnel-datalist"
                        />
                      </div>

                      {/* On Behalf Of */}
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-slate-400 mb-0.5">Şunun Adına Çalıştı (Opsiyonel)</label>
                        <input
                          type="text"
                          value={w.onBehalfOf || ''}
                          onChange={(e) => handleUpdateWorker(w.id, 'onBehalfOf', e.target.value)}
                          placeholder="Örn: Mehmet yerine"
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-indigo-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Daily Wage */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-amber-400 mb-0.5">Günlük Yevmiye (TL)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="50"
                          value={w.dailyWage}
                          onChange={(e) => handleUpdateWorker(w.id, 'dailyWage', Number(e.target.value))}
                          placeholder="1000"
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      {/* Surveys Done */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-sky-400 mb-0.5">Yaptığı Anket</label>
                        <input
                          type="number"
                          min="0"
                          value={w.surveysCompleted || 0}
                          onChange={(e) => handleUpdateWorker(w.id, 'surveysCompleted', Number(e.target.value))}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-sky-300 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </div>

                      {/* Delete Row Button */}
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          disabled={formWorkers.length === 1}
                          onClick={() => handleRemoveWorkerRow(w.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg disabled:opacity-20 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Datalist helper for fast personnel picker */}
                <datalist id="personnel-datalist">
                  {personnel.map(p => (
                    <option key={p.id} value={p.fullName} />
                  ))}
                </datalist>

                {/* Live Cost Summary Bar */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Toplam: <strong className="text-white">{formWorkers.filter(w => w.personnelName.trim()).length}</strong> Personel •{' '}
                    <strong className="text-sky-400">{formWorkers.reduce((sum, w) => sum + Number(w.surveysCompleted || 0), 0)}</strong> Anket
                  </span>
                  <span className="font-mono text-xs">
                    Toplam Yevmiye: <strong className="text-amber-400 font-bold text-sm">₺{formWorkers.reduce((sum, w) => sum + Number(w.dailyWage || 0), 0).toLocaleString('tr-TR')}</strong>
                  </span>
                </div>
              </div>

              {/* Row 5: Genel Notlar */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Günün Saha Notu & Açıklamalar (Opsiyonel)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Bugün sahada neler yapıldı, hava durumu nasıldı, karşılaşılan bir engel oldu mu..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
                >
                  {editingReportId ? 'Rapor Değişikliklerini Kaydet' : 'Saha Günlük Raporunu Kaydet'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
