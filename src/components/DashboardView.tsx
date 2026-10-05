'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  CheckCircle2, 
  PhoneCall, 
  ClipboardList, 
  Banknote, 
  Receipt, 
  Plus, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';

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

  const isAdmin = currentUser?.role === 'admin';
  const todayStr = new Date().toISOString().split('T')[0];

  const activeProjects = projects.filter(p => !p.isArchived && p.status === 'active');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const totalTargetSurveys = projects.filter(p => !p.isArchived).reduce((sum, p) => sum + (p.targetSurveys || 0), 0);
  const totalCompletedSurveys = projects.filter(p => !p.isArchived).reduce((sum, p) => sum + (p.completedSurveys || 0), 0);
  const totalBudget = activeProjects.reduce((sum, p) => sum + (p.clientTotalBudget || 0), 0);
  const surveyProgress = totalTargetSurveys > 0 ? Math.round((totalCompletedSurveys / totalTargetSurveys) * 100) : 0;

  const todayFieldReports = dailyReports.filter(r => r.reportDate === todayStr);
  const totalFieldWorkersToday = todayFieldReports.reduce((sum, r) => sum + (r.workers?.length || 0), 0);
  const totalSurveysDoneToday = todayFieldReports.reduce((sum, r) => sum + (r.totalDailySurveys || 0), 0);
  const totalFieldCostToday = todayFieldReports.reduce((sum, r) => sum + (r.totalDailyWage || 0), 0);

  const todayTkRecords = phoneControlRecords.filter(r => r.controlDate === todayStr);
  const totalTkCallsToday = todayTkRecords.reduce((sum, r) => sum + Number(r.totalCalled || 0), 0);
  const totalTkApprovedToday = todayTkRecords.reduce((sum, r) => sum + Number(r.totalApproved || 0), 0);
  const totalTkRejectedToday = todayTkRecords.reduce((sum, r) => sum + Number(r.totalRejected || 0), 0);
  const overallTkApprovalRateToday = totalTkCallsToday > 0 ? Math.round((totalTkApprovedToday / totalTkCallsToday) * 100) : 0;

  const totalAllTimeCalls = phoneControlRecords.reduce((sum, r) => sum + Number(r.totalCalled || 0), 0);
  const totalAllTimeApproved = phoneControlRecords.reduce((sum, r) => sum + Number(r.totalApproved || 0), 0);
  const allTimeTkRate = totalAllTimeCalls > 0 ? Math.round((totalAllTimeApproved / totalAllTimeCalls) * 100) : 0;

  const totalAdvancesAmt = advances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const totalSettlementsAmt = settlements.reduce((sum, s) => sum + Number(s.grossAmount || 0), 0);

  const dateStr = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-5">

      {/* Welcome Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-gray-900 font-black text-base flex-shrink-0">
              {currentUser?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-base font-black text-gray-900">
                Hoş Geldiniz, {currentUser?.fullName?.split(' ')[0]}!
              </h1>
              <p className="text-xs text-gray-500">{dateStr}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('daily-reports')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-gray-900 text-sm font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Saha Raporu Gir</span>
          </button>
          <button
            onClick={() => onNavigate('phone-control')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-all cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>TK Kaydı Gir</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        <div
          onClick={() => onNavigate('projects')}
          className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">Aktif Projeler</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900">{activeProjects.length}</div>
          <p className="text-xs text-gray-400 mt-1">{completedProjects.length} proje tamamlandı</p>
        </div>

        <div
          onClick={() => onNavigate('projects')}
          className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">Saha İlerlemesi</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900">%{surveyProgress}</div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-blue-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(surveyProgress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{totalCompletedSurveys.toLocaleString('tr-TR')} / {totalTargetSurveys.toLocaleString('tr-TR')} anket</p>
        </div>

        <div
          onClick={() => onNavigate('phone-control')}
          className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">TK Onay Oranı</span>
            <div className="p-2 rounded-xl bg-green-50 text-green-600">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-green-600">%{allTimeTkRate}</div>
          <p className="text-xs text-gray-400 mt-1">{totalAllTimeApproved} Okey / {totalAllTimeCalls} Arama</p>
        </div>

        <div
          onClick={() => onNavigate(isAdmin ? 'invoices' : 'settlements')}
          className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">
              {isAdmin ? 'Aktif Portföy' : 'Personel Hakediş'}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">
            ₺{(isAdmin ? totalBudget : totalSettlementsAmt).toLocaleString('tr-TR')}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {isAdmin ? 'Toplam aktif bütçe' : `Avans: ₺${totalAdvancesAmt.toLocaleString('tr-TR')}`}
          </p>
        </div>

      </div>

      {/* Today's Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Saha */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Bugünkü Saha</h3>
                <p className="text-xs text-gray-400">Günlük saha raporları</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('daily-reports')}
              className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              Tümü <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
              <div className="text-lg font-black text-gray-900">{totalFieldWorkersToday}</div>
              <div className="text-[10px] text-gray-500 font-medium">Personel</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
              <div className="text-lg font-black text-blue-600">{totalSurveysDoneToday}</div>
              <div className="text-[10px] text-gray-500 font-medium">Anket</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
              <div className="text-lg font-black text-amber-600">₺{totalFieldCostToday.toLocaleString('tr-TR')}</div>
              <div className="text-[10px] text-gray-500 font-medium">Yevmiye</div>
            </div>
          </div>

          {todayFieldReports.length === 0 ? (
            <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 text-center">
              <p className="text-sm text-gray-500">Bugün için saha raporu girilmemiş.</p>
              <button
                onClick={() => onNavigate('daily-reports')}
                className="mt-3 px-4 py-1.5 rounded-xl bg-blue-600 text-gray-900 text-xs font-semibold cursor-pointer"
              >
                + Rapor Gir
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {todayFieldReports.slice(0, 3).map(r => (
                <div key={r.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-gray-800">{r.projectCode}</div>
                    <div className="text-gray-500 mt-0.5">{r.workers?.length || 0} anketör • {r.locations || 'Saha'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">{r.totalDailySurveys || 0} anket</div>
                    <div className="text-amber-600 font-semibold">₺{(r.totalDailyWage || 0).toLocaleString('tr-TR')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TK */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Bugünkü TK Kontrol</h3>
                <p className="text-xs text-gray-400">Telefon arama denetimleri</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('phone-control')}
              className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              Tümü <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
              <div className="text-lg font-black text-gray-900">{totalTkCallsToday}</div>
              <div className="text-[10px] text-gray-500 font-medium">Aranan</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
              <div className="text-lg font-black text-green-600">{totalTkApprovedToday}</div>
              <div className="text-[10px] text-gray-500 font-medium">Okey</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
              <div className="text-lg font-black text-indigo-600">%{overallTkApprovalRateToday}</div>
              <div className="text-[10px] text-gray-500 font-medium">Başarı</div>
            </div>
          </div>

          {todayTkRecords.length === 0 ? (
            <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 text-center">
              <p className="text-sm text-gray-500">Bugün için TK kaydı girilmemiş.</p>
              <button
                onClick={() => onNavigate('phone-control')}
                className="mt-3 px-4 py-1.5 rounded-xl bg-indigo-600 text-gray-900 text-xs font-semibold cursor-pointer"
              >
                + TK Kaydı Gir
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {todayTkRecords.slice(0, 3).map(rec => (
                <div key={rec.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-gray-800">{rec.controllerName}</div>
                    <div className="text-gray-500 mt-0.5">{rec.projectCode} • {rec.totalCalled} Arama</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">%{rec.approvalRate || 0} Onay</div>
                    <div className="text-amber-600 font-semibold">₺{rec.dailyWage}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-3">Hızlı Erişim</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { id: 'projects',      label: 'Projeler',       sub: `${projects.length} proje`,           icon: Briefcase,    color: 'text-blue-600 bg-blue-50' },
            { id: 'personnel',     label: 'Personel',       sub: `${personnel.length} kayıtlı`,        icon: Users,        color: 'text-indigo-600 bg-indigo-50' },
            { id: 'phone-control', label: 'TK Kontrol',     sub: 'Arama & Okey',                        icon: PhoneCall,    color: 'text-violet-600 bg-violet-50' },
            { id: 'daily-reports', label: 'Saha Raporu',    sub: 'Günlük raporlar',                     icon: ClipboardList,color: 'text-sky-600 bg-sky-50' },
            { id: 'settlements',   label: 'Hakediş',        sub: 'Personel kapama',                     icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
            { id: 'expenses',      label: 'Masraflar',      sub: `${expenses.length} fiş`,             icon: Receipt,      color: 'text-amber-600 bg-amber-50' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-white hover:shadow-sm text-left transition-all cursor-pointer"
              >
                <div className={`p-2 rounded-lg w-fit mb-2 ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-gray-800">{item.label}</div>
                <p className="text-[10px] text-gray-400 mt-0.5">{item.sub}</p>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}




