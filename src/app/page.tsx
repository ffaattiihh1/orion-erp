'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import LoginWall from '@/components/LoginWall';
import Navbar from '@/components/Navbar';
import DashboardView from '@/components/DashboardView';
import ProjectsView from '@/components/ProjectsView';
import SettlementsView from '@/components/SettlementsView';
import PersonnelView from '@/components/PersonnelView';
import ExpensesView from '@/components/ExpensesView';
import AdvancesView from '@/components/AdvancesView';
import InvoicesView from '@/components/InvoicesView';
import DailyReportsView from '@/components/DailyReportsView';
import PhoneControlView from '@/components/PhoneControlView';
import TabletsView from '@/components/TabletsView';
import FeasibilitySimulatorModal from '@/components/FeasibilitySimulatorModal';
import QuickAdvanceModal from '@/components/QuickAdvanceModal';
import { Banknote } from 'lucide-react';

export default function HomePage() {
  const { currentUser, isAuthReady } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isFeasibilityOpen, setIsFeasibilityOpen] = useState<boolean>(false);
  const [isQuickAdvanceOpen, setIsQuickAdvanceOpen] = useState<boolean>(false);

  // Oturum kontrol edilirken giriş ekranı yanıp sönmesin
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  // 1. Login Wall (Zero registration, closed circuit)
  if (!currentUser) {
    return <LoginWall />;
  }

  // 2. Full Unified Dashboard (SPV & Admin have the same clean layout, role-isolated metrics)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 pb-28 lg:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView 
            onNavigate={(tab) => setActiveTab(tab)} 
            onOpenFeasibility={() => setIsFeasibilityOpen(true)} 
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView onOpenFeasibility={() => setIsFeasibilityOpen(true)} />
        )}

        {activeTab === 'daily-reports' && <DailyReportsView />}
        {activeTab === 'phone-control' && <PhoneControlView />}
        {activeTab === 'settlements' && <SettlementsView />}
        {activeTab === 'personnel' && <PersonnelView />}
        {activeTab === 'expenses' && <ExpensesView />}
        {activeTab === 'advances' && <AdvancesView />}
        {activeTab === 'tablets' && <TabletsView />}

        {/* Manager/Admin Only Tabs */}
        {currentUser.role === 'admin' && activeTab === 'invoices' && <InvoicesView />}

        {currentUser.role === 'admin' && activeTab === 'feasibility' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Fizibilite & Simülasyon Merkezi</h1>
                <p className="text-xs text-gray-500">Yeni teklif fizibilitesi oluşturun veya kârlılık projeksiyonu hesaplayın</p>
              </div>
              <button
                onClick={() => setIsFeasibilityOpen(true)}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
              >
                Yeni Simülasyon Başlat
              </button>
            </div>
            <ProjectsView onOpenFeasibility={() => setIsFeasibilityOpen(true)} />
          </div>
        )}
      </main>

      {/* Her ekrandan tek dokunuşla avans/ödeme yazma */}
      {/* Sadece saha/para ile ilgili ekranlarda göster (Avans, Tablet, Fatura vb. ekranlarda gizli) */}
      {['dashboard', 'projects', 'daily-reports', 'phone-control', 'settlements', 'personnel'].includes(activeTab) && (
        <button
          onClick={() => setIsQuickAdvanceOpen(true)}
          className="fixed right-4 bottom-20 lg:bottom-6 z-40 flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg cursor-pointer"
        >
          <Banknote className="w-5 h-5" />
          Avans Yaz
        </button>
      )}
      <QuickAdvanceModal isOpen={isQuickAdvanceOpen} onClose={() => setIsQuickAdvanceOpen(false)} />

      {/* Feasibility Simulator Modal */}
      {currentUser.role === 'admin' && (
        <FeasibilitySimulatorModal 
          isOpen={isFeasibilityOpen} 
          onClose={() => setIsFeasibilityOpen(false)} 
        />
      )}
    </div>
  );
}
