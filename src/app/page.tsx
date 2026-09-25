'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import LoginWall from '@/components/LoginWall';
import Navbar from '@/components/Navbar';
import ProjectsView from '@/components/ProjectsView';
import SettlementsView from '@/components/SettlementsView';
import PersonnelView from '@/components/PersonnelView';
import ExpensesView from '@/components/ExpensesView';
import AdvancesView from '@/components/AdvancesView';
import InvoicesView from '@/components/InvoicesView';
import FeasibilitySimulatorModal from '@/components/FeasibilitySimulatorModal';

export default function HomePage() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<string>('projects');
  const [isFeasibilityOpen, setIsFeasibilityOpen] = useState<boolean>(false);

  // 1. Login Wall (Zero registration, closed circuit)
  if (!currentUser) {
    return <LoginWall />;
  }

  // 2. Full Unified Dashboard (SPV & Admin have the same clean layout, role-isolated metrics)
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'projects' && (
          <ProjectsView onOpenFeasibility={() => setIsFeasibilityOpen(true)} />
        )}

        {activeTab === 'settlements' && <SettlementsView />}
        {activeTab === 'personnel' && <PersonnelView />}
        {activeTab === 'expenses' && <ExpensesView />}
        {activeTab === 'advances' && <AdvancesView />}

        {/* Manager/Admin Only Tabs */}
        {currentUser.role === 'admin' && activeTab === 'invoices' && <InvoicesView />}

        {currentUser.role === 'admin' && activeTab === 'feasibility' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-white">Fizibilite & Simülasyon Merkezi</h1>
                <p className="text-xs text-slate-400">Yeni teklif fizibilitesi oluşturun veya kârlılık projeksiyonu hesaplayın</p>
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
