'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  ShieldCheck, 
  Smartphone, 
  LogOut, 
  Briefcase, 
  Users, 
  Calculator, 
  Receipt, 
  Banknote, 
  FileText,
  KeyRound,
  User
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const { 
    currentUser, 
    setCurrentUser, 
    users, 
    isOnline, 
    offlineQueueCount, 
    syncOfflineQueue 
  } = useApp();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleRoleToggle = (targetRole: 'admin' | 'spv') => {
    const user = users.find(u => u.role === targetRole);
    if (user) {
      setCurrentUser(user);
    }
  };

  const allNavItems = [
    { id: 'projects', label: 'Projeler', shortLabel: 'Projeler', icon: Briefcase, roles: ['admin', 'spv'] },
    { id: 'settlements', label: 'Hakediş Proje Kapama', shortLabel: 'Hakediş', icon: Calculator, roles: ['admin', 'spv'] },
    { id: 'personnel', label: 'Personel Listesi', shortLabel: 'Personel', icon: Users, roles: ['admin', 'spv'] },
    { id: 'expenses', label: 'Saha Masrafları', shortLabel: 'Masraf', icon: Receipt, roles: ['admin', 'spv'] },
    { id: 'advances', label: 'Canlı Avanslar', shortLabel: 'Avans', icon: Banknote, roles: ['admin', 'spv'] },
    { id: 'feasibility', label: 'Fizibilite Simülatörü', shortLabel: 'Fizibilite', icon: Calculator, roles: ['admin'] },
    { id: 'invoices', label: 'Faturalandırma & Tahsilat', shortLabel: 'Fatura', icon: FileText, roles: ['admin'] },
  ];

  const visibleNavItems = allNavItems.filter(item => 
    !currentUser?.role || item.roles.includes(currentUser.role)
  );

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/90 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            
            {/* Logo & Role Badge */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex-shrink-0 flex items-center justify-center shadow-md shadow-sky-500/20 border border-sky-400/20">
                <span className="text-white font-black text-base sm:text-lg">O</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="font-black text-white text-sm sm:text-base tracking-tight truncate">ORİON ERP</span>
                  <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border flex-shrink-0 ${
                    currentUser?.role === 'admin' 
                      ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' 
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}>
                    {currentUser?.role === 'admin' ? 'MÜDÜR' : 'SPV'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-none hidden sm:block truncate">
                  {currentUser?.fullName} (@{currentUser?.username})
                </p>
              </div>
            </div>

            {/* Right Action Icons (Compact & Clean on Mobile) */}
            <div className="flex items-center gap-1.5 sm:gap-2">

              {/* Online Indicator Dot / Offline Sync */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px]">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="hidden md:inline text-slate-300 text-[10px] font-medium">
                  {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                </span>
                {offlineQueueCount > 0 && (
                  <button
                    onClick={syncOfflineQueue}
                    className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold"
                  >
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    <span>{offlineQueueCount}</span>
                  </button>
                )}
              </div>

              {/* Quick Role Switcher (Desktop only) */}
              <div className="hidden lg:flex items-center p-0.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                <button
                  onClick={() => handleRoleToggle('admin')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    currentUser?.role === 'admin'
                      ? 'bg-sky-500 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Müdür</span>
                </button>
                <button
                  onClick={() => handleRoleToggle('spv')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    currentUser?.role === 'spv'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>SPV</span>
                </button>
              </div>

              {/* Password Change Button */}
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                title="Şifre Değiştir"
                className="flex items-center gap-1 p-2 rounded-xl text-slate-300 hover:text-sky-400 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer text-xs"
              >
                <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
                <span className="hidden sm:inline font-medium text-[11px]">Şifre</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={() => setCurrentUser(null)}
                title="Çıkış Yap"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Top Sub-Navigation (Hidden on mobile to keep top clean) */}
        <div className="hidden sm:block border-t border-slate-800/80 bg-slate-950/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom for easy thumb reach) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl safe-area-pb">
        <nav className="grid grid-flow-col auto-cols-fr items-center h-15 px-1">
          {visibleNavItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-sky-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.shortLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </>
  );
}
