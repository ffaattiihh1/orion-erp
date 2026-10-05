'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import BackupModal from '@/components/BackupModal';
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
  User,
  Database,
  PhoneCall,
  ClipboardList,
  Menu,
  X,
  Sparkles,
  LayoutDashboard
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
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleRoleToggle = (targetRole: 'admin' | 'spv') => {
    const user = users.find(u => u.role === targetRole);
    if (user) {
      setCurrentUser(user);
    }
  };

  // Main navigation items - Dashboard / Ana Sayfa is prominent and default
  const allNavItems = [
    { id: 'dashboard', label: 'Ana Sayfa', shortLabel: 'Ana Sayfa', icon: LayoutDashboard, roles: ['admin', 'spv'] },
    { id: 'projects', label: 'Projeler', shortLabel: 'Projeler', icon: Briefcase, roles: ['admin', 'spv'] },
    { id: 'personnel', label: 'Personel Listesi', shortLabel: 'Personel', icon: Users, roles: ['admin', 'spv'] },
    { id: 'phone-control', label: 'TK Telefon Kontrol', shortLabel: 'TK Kontrol', icon: PhoneCall, roles: ['admin', 'spv'] },
    { id: 'daily-reports', label: 'Saha Günlük Raporları', shortLabel: 'Saha Rapor', icon: ClipboardList, roles: ['admin', 'spv'] },
    { id: 'settlements', label: 'Hakediş Proje Kapama', shortLabel: 'Hakediş', icon: Calculator, roles: ['admin', 'spv'] },
    { id: 'expenses', label: 'Saha Masrafları', shortLabel: 'Masraf', icon: Receipt, roles: ['admin', 'spv'] },
    { id: 'advances', label: 'Canlı Avanslar', shortLabel: 'Avans', icon: Banknote, roles: ['admin', 'spv'] },
    { id: 'feasibility', label: 'Fizibilite Simülatörü', shortLabel: 'Fizibilite', icon: Calculator, roles: ['admin'] },
    { id: 'invoices', label: 'Faturalandırma & Tahsilat', shortLabel: 'Fatura', icon: FileText, roles: ['admin'] },
  ];

  const visibleNavItems = allNavItems.filter(item => 
    !currentUser?.role || item.roles.includes(currentUser.role)
  );

  // Quick primary items for mobile bottom bar
  const mobilePrimaryIds = ['dashboard', 'projects', 'phone-control', 'daily-reports'];
  const isOtherTabActive = !mobilePrimaryIds.includes(activeTab);

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
                  <span className="font-black text-white text-sm sm:text-base tracking-tight truncate">ORİON OPT</span>
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

              {/* Data Backup & Restore Button */}
              <button
                onClick={() => setIsBackupModalOpen(true)}
                title="Sistem Yedeği Al & Geri Yükle"
                className="flex items-center gap-1 p-2 rounded-xl text-slate-300 hover:text-emerald-400 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer text-xs"
              >
                <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <span className="hidden sm:inline font-medium text-[11px]">Yedek</span>
              </button>

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

        {/* Top Sub-Navigation (Visible on both Desktop and Mobile with smooth swipe) */}
        <div className="border-t border-slate-800/80 bg-slate-950/50">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <nav className="flex space-x-1.5 overflow-x-auto py-2 scrollbar-none scroll-smooth">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                      isActive
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold shadow-sm shadow-sky-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
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
        <nav className="grid grid-cols-5 items-center h-15 px-1">
          {/* 1. Ana Sayfa (Dashboard) */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'dashboard' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'}`}>
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Ana Sayfa</span>
          </button>

          {/* 2. Projeler */}
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'projects' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'projects' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'}`}>
              <Briefcase className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Projeler</span>
          </button>

          {/* 3. TK Kontrol (Prominent & Dedicated) */}
          <button
            onClick={() => setActiveTab('phone-control')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'phone-control' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'phone-control' ? 'bg-indigo-500/25 text-indigo-400 ring-1 ring-indigo-500/50' : 'text-slate-400'}`}>
              <PhoneCall className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">TK Kontrol</span>
          </button>

          {/* 4. Saha Rapor */}
          <button
            onClick={() => setActiveTab('daily-reports')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'daily-reports' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'daily-reports' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'}`}>
              <ClipboardList className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Saha Rapor</span>
          </button>

          {/* 5. Menü / Daha Fazla */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              isOtherTabActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${isOtherTabActive ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'}`}>
              <Menu className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">
              {isOtherTabActive ? 'Diğer (*)' : 'Menü'}
            </span>
          </button>
        </nav>
      </div>

      {/* MOBILE FULL MENU BOTTOM SHEET */}
      {isMobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Tüm Modüller & Menü</h3>
                  <p className="text-[11px] text-slate-400">{currentUser?.fullName} ({currentUser?.role === 'admin' ? 'Müdür' : 'SPV'})</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Items Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${isActive ? 'bg-sky-500 text-white' : 'bg-slate-900 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{item.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions in Mobile Drawer */}
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsBackupModalOpen(true);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 text-xs font-semibold"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Yedekleme</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsPasswordModalOpen(true);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sky-400 text-xs font-semibold"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Şifre</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />

      {/* Backup & Data Preservation Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </>
  );
}
