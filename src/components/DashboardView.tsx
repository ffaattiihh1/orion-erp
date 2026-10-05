'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  PhoneCall, 
  ClipboardList, 
  Banknote, 
  Receipt, 
  Plus, 
  ArrowUpRight, 
  Calendar, 
  Clock, 
  MapPin, 
  AlertCircle,
  FileSpreadsheet,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Layers,
  Percent,
  Sparkles
} from 'lucide-react';
import { Project, DailyFieldReport, PhoneControlRecord } from '@/types';

interface DashboardViewProps {
  onNavigate: (tabId: string) => void;
  onOpenFeasibility: () => void;
}

export default function DashboardView({ onNavigate, onOpenFeasibility }: DashboardViewProps) {
  const { 
    currentUser, 
    projects, 
    personnel, 
    dailyReports, 
    phoneControlRecords, 
    settlements, 
    advances, 
    expenses 
  } = useApp();

  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | '30d' | '90d'>('all');

  const isAdmin = currentUser?.role === 'admin';
  const todayStr = new Date().toISOString().split('T')[0];

  // Projects calculations
  const activeProjects = projects.filter(p => !p.isArchived && p.status === 'active');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const totalTargetSurveys = projects.filter(p => !p.isArchived).reduce((sum, p) => sum + (p.targetSurveys || 0), 0);
  const totalCompletedSurveys = projects.filter(p => !p.isArchived).reduce((sum, p) => sum + (p.completedSurveys || 0), 0);
  const totalBudget = activeProjects.reduce((sum, p) => sum + (p.clientTotalBudget || 0), 0);

  // Today's Daily Reports & Field activity
  const todayFieldReports = dailyReports.filter(r => r.reportDate === todayStr);
  const totalFieldWorkersToday = todayFieldReports.reduce((sum, r) => sum + (r.workers?.length || 0), 0);
  const totalSurveysDoneToday = todayFieldReports.reduce((sum, r) => sum + (r.totalDailySurveys || 0), 0);
  const totalFieldCostToday = todayFieldReports.reduce((sum, r) => sum + (r.totalDailyWage || 0), 0);

  // Today's TK Phone Control activity
  const todayTkRecords = phoneControlRecords.filter(r => r.controlDate === todayStr);
  const totalTkCallsToday = todayTkRecords.reduce((sum, r) => sum + Number(r.totalCalled || 0), 0);
  const totalTkApprovedToday = todayTkRecords.reduce((sum, r) => sum + Number(r.totalApproved || 0), 0);
  const totalTkRejectedToday = todayTkRecords.reduce((sum, r) => sum + Number(r.totalRejected || 0), 0);
  const overallTkApprovalRateToday = totalTkCallsToday > 0 ? Math.round((totalTkApprovedToday / totalTkCallsToday) * 100) : 0;

  // All-time TK metrics
  const totalAllTimeCalls = phoneControlRecords.reduce((sum, r) => sum + Number(r.totalCalled || 0), 0);
  const totalAllTimeApproved = phoneControlRecords.reduce((sum, r) => sum + Number(r.totalApproved || 0), 0);
  const allTimeTkRate = totalAllTimeCalls > 0 ? Math.round((totalAllTimeApproved / totalAllTimeCalls) * 100) : 0;

  // Financial summaries
  const totalAdvances = advances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalSettlements = settlements.reduce((sum, s) => sum + Number(s.grossAmount || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Welcome & Quick Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 flex-shrink-0">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Hoş Geldiniz, {currentUser?.fullName}
              </h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isAdmin 
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {isAdmin ? 'Genel Müdürlük' : 'Saha Operasyon (SPV)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Orion ERP Canlı Operasyon ve Saha Yönetim Kokpiti • {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('projects')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Proje</span>
          </button>

          <button
            onClick={() => onNavigate('phone-control')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>TK Kaydı Gir</span>
          </button>

          <button
            onClick={() => onNavigate('daily-reports')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            <ClipboardList className="w-3.5 h-3.5 text-sky-400" />
            <span>Saha Raporu</span>
          </button>
        </div>
      </div>

      {/* PRIMARY OPERATIONAL METRICS (TOP 4 CARDS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Aktif Projeler */}
        <div 
          onClick={() => onNavigate('projects')}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Aktif Projeler</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{activeProjects.length}</span>
            <span className="text-xs text-slate-500">/ {projects.length} toplam</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>{completedProjects.length} proje tamamlandı</span>
          </p>
        </div>

        {/* Card 2: Saha İlerlemesi & Anket */}
        <div 
          onClick={() => onNavigate('projects')}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Saha İlerlemesi</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl sm:text-3xl font-black text-white">{totalCompletedSurveys.toLocaleString('tr-TR')}</span>
            <span className="text-xs text-slate-500">/ {totalTargetSurveys.toLocaleString('tr-TR')}</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
            <div 
              className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((totalCompletedSurveys / (totalTargetSurveys || 1)) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Card 3: TK Telefon Kontrol Başarısı */}
        <div 
          onClick={() => onNavigate('phone-control')}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">TK Kalite Onayı</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">%{allTimeTkRate}</span>
            <span className="text-xs text-slate-500">Genel Onay</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {totalAllTimeApproved} Okey / {totalAllTimeCalls} Arama
          </p>
        </div>

        {/* Card 4: Finansal Durum / Ciro veya Hakediş */}
        <div 
          onClick={() => onNavigate(isAdmin ? 'invoices' : 'settlements')}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isAdmin ? 'Aktif Portföy Cirosu' : 'Toplam Personel Hakediş'}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            ₺{(isAdmin ? totalBudget : totalSettlements).toLocaleString('tr-TR')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isAdmin ? 'Aktif projelerin toplam bütçesi' : `Avanslar: ₺${totalAdvances.toLocaleString('tr-TR')}`}
          </p>
        </div>

      </div>

      {/* TODAY'S LIVE OPERATIONS BOARD (SAHA & TK AUDITS TODAY) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Left: Bugünkü Saha Harekatı */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Bugünkü Saha Operasyonu</h3>
                  <p className="text-[11px] text-slate-400">Günün saha raporları ve aktif çalışan anketörler</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('daily-reports')}
                className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Tümü</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sub-KPI ribbon */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Sahadaki Personel</span>
                <strong className="text-sm font-black text-white font-mono">{totalFieldWorkersToday} Kişi</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Bugün Anket</span>
                <strong className="text-sm font-black text-sky-400 font-mono">{totalSurveysDoneToday} Adet</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Günlük Saha Yevmiye</span>
                <strong className="text-sm font-black text-amber-400 font-mono">₺{totalFieldCostToday.toLocaleString('tr-TR')}</strong>
              </div>
            </div>

            {/* List of recent daily reports */}
            {todayFieldReports.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-400">
                <p>Bugün için henüz girilmiş bir saha raporu bulunmuyor.</p>
                <button
                  onClick={() => onNavigate('daily-reports')}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  + Bugünün Saha Raporunu Yaz
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {todayFieldReports.slice(0, 3).map(r => (
                  <div key={r.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{r.projectCode}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-400 font-normal">
                          {r.workers?.length || 0} anketör
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[220px]">
                        📍 {r.locations || 'Saha'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sky-400 font-mono">{r.totalDailySurveys || 0} anket</div>
                      <div className="text-[10px] text-amber-400 font-mono">₺{(r.totalDailyWage || 0).toLocaleString('tr-TR')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
            <span>Saha operasyon durumu: <strong className="text-emerald-400">Aktif</strong></span>
            <button 
              onClick={() => onNavigate('daily-reports')}
              className="text-sky-400 hover:underline font-medium cursor-pointer"
            >
              Yeni Rapor Ekle ➔
            </button>
          </div>
        </div>

        {/* Right: Bugünkü TK Telefon Denetimleri */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Bugünkü TK Telefon Denetimleri</h3>
                  <p className="text-[11px] text-slate-400">Anket kontrol aramaları ve anlık okey/onay durumları</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('phone-control')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Tümü</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sub-KPI ribbon */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Bugün Aranan</span>
                <strong className="text-sm font-black text-white font-mono">{totalTkCallsToday} Kişi</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Okey (Onay)</span>
                <strong className="text-sm font-black text-emerald-400 font-mono">{totalTkApprovedToday} Anket</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Günlük Başarı</span>
                <strong className="text-sm font-black text-indigo-400 font-mono">%{overallTkApprovalRateToday}</strong>
              </div>
            </div>

            {/* List of today's TK records */}
            {todayTkRecords.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-400">
                <p>Bugün için henüz girilmiş bir TK telefon denetimi kaydı yok.</p>
                <button
                  onClick={() => onNavigate('phone-control')}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  + Yeni TK Arama Kaydı Gir
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {todayTkRecords.slice(0, 3).map(rec => (
                  <div key={rec.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{rec.controllerName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                          {rec.projectCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {rec.totalCalled} Arama • {rec.totalApproved} Okey • {rec.totalRejected} Red
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-400 font-mono">
                        %{rec.approvalRate || 0} Onay
                      </span>
                      <div className="text-[10px] text-amber-400 font-mono mt-0.5">₺{rec.dailyWage} Ücret</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
            <span>TK Kontrolcü Havuzu: <strong className="text-indigo-400">{personnel.filter(p => p.defaultRole === 'telefon_kontrolcu').length} Kayıtlı</strong></span>
            <button 
              onClick={() => onNavigate('phone-control')}
              className="text-indigo-400 hover:underline font-medium cursor-pointer"
            >
              TK Arama Gir ➔
            </button>
          </div>
        </div>

      </div>

      {/* QUICK WORKFLOW SHORTCUTS GRID */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>Hızlı Modül ve Operasyon Geçişleri</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          
          <button
            onClick={() => onNavigate('projects')}
            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/60 text-left transition-all cursor-pointer group"
          >
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 w-fit mb-2 group-hover:scale-110 transition-transform">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Projeler</div>
            <p className="text-[10px] text-slate-400 mt-0.5">{projects.length} Proje Listesi</p>
          </button>

          <button
            onClick={() => onNavigate('personnel')}
            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/60 text-left transition-all cursor-pointer group"
          >
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 w-fit mb-2 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Personel Havuzu</div>
            <p className="text-[10px] text-slate-400 mt-0.5">{personnel.length} Kayıtlı Kadro</p>
          </button>

          <button
            onClick={() => onNavigate('phone-control')}
            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/60 text-left transition-all cursor-pointer group"
          >
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 w-fit mb-2 group-hover:scale-110 transition-transform">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">TK Kontrol</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Arama & Okey Takibi</p>
          </button>

          <button
            onClick={() => onNavigate('daily-reports')}
            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/60 text-left transition-all cursor-pointer group"
          >
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 w-fit mb-2 group-hover:scale-110 transition-transform">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Saha Raporları</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Günlük Lokasyon & Ücret</p>
          </button>

          <button
            onClick={() => onNavigate('settlements')}
            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60 text-left transition-all cursor-pointer group"
          >
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit mb-2 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Hakediş & Kapama</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Personel Tahakkuku</p>
          </button>

          <button
            onClick={() => onNavigate('expenses')}
            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/60 text-left transition-all cursor-pointer group"
          >
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 w-fit mb-2 group-hover:scale-110 transition-transform">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Saha Masrafları</div>
            <p className="text-[10px] text-slate-400 mt-0.5">{expenses.length} Masraf Fişi</p>
          </button>

        </div>
      </div>

    </div>
  );
}
