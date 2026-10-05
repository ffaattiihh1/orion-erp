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
  Database,
  PhoneCall,
  ClipboardList,
  X,
  LayoutDashboard,
  Menu,
  ChevronDown
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleRoleToggle = (targetRole: 'admin' | 'spv') => {
    const user = users.find(u => u.role === targetRole);
    if (user) {
      setCurrentUser(user);
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  const allNavItems = [
    { id: 'dashboard',     label: 'Ana Sayfa',    icon: LayoutDashboard, roles: ['admin', 'spv'] },
    { id: 'projects',      label: 'Projeler',     icon: Briefcase,       roles: ['admin', 'spv'] },
    { id: 'personnel',     label: 'Personel',     icon: Users,           roles: ['admin', 'spv'] },
    { id: 'daily-reports', label: 'Saha Raporu',  icon: ClipboardList,   roles: ['admin', 'spv'] },
    { id: 'phone-control', label: 'TK Kontrol',   icon: PhoneCall,       roles: ['admin', 'spv'] },
    { id: 'settlements',   label: 'Hakediş',      icon: Calculator,      roles: ['admin', 'spv'] },
    { id: 'expenses',      label: 'Masraf',       icon: Receipt,         roles: ['admin', 'spv'] },
    { id: 'advances',      label: 'Avans',        icon: Banknote,        roles: ['admin', 'spv'] },
    { id: 'invoices',      label: 'Fatura',       icon: FileText,        roles: ['admin'] },
  ];

  const visibleNavItems = allNavItems.filter(item =>
    !currentUser?.role || item.roles.includes(currentUser.role)
  );

  // Mobile bottom bar: 4 main tabs + menu
  const mobileMainIds = ['dashboard', 'projects', 'daily-reports', 'phone-control'];
  const mobileMainItems = visibleNavItems.filter(i => mobileMainIds.includes(i.id));
  const mobileMoreItems = visibleNavItems.filter(i => !mobileMainIds.includes(i.id));
  const isMoreActive = mobileMoreItems.some(i => i.id === activeTab);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-sm">O</span>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="font-black text-gray-900 text-sm tracking-tight">ORİON OPT</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isAdmin ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {isAdmin ? 'Müdür' : 'SPV'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 leading-none">{currentUser?.fullName}</p>
              </div>
            </div>

            {/* Desktop Tab Nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-1.5">

              {/* Online status */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[11px]">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-400'}`} />
                <span className="hidden sm:inline text-gray-500 font-medium">
                  {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                </span>
                {offlineQueueCount > 0 && (
                  <button
                    onClick={syncOfflineQueue}
                    className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 font-bold"
                  >
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    <span>{offlineQueueCount}</span>
                  </button>
                )}
              </div>

              {/* Role switcher - desktop only */}
              <div className="hidden lg:flex items-center rounded-lg border border-gray-200 overflow-hidden text-xs">
                <button
                  onClick={() => handleRoleToggle('admin')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 transition-all cursor-pointer ${
                    isAdmin ? 'bg-blue-600 text-white font-semibold' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Müdür</span>
                </button>
                <button
                  onClick={() => handleRoleToggle('spv')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 transition-all cursor-pointer ${
                    !isAdmin ? 'bg-amber-500 text-white font-semibold' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>SPV</span>
                </button>
              </div>

              {/* User menu button */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs transition-all cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                    {currentUser?.fullName?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden sm:inline font-medium">{currentUser?.fullName?.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-800">{currentUser?.fullName}</p>
                        <p className="text-[10px] text-gray-400">{currentUser?.role === 'admin' ? 'Müdür' : 'SPV'}</p>
                      </div>
                      <button
                        onClick={() => { setIsUserMenuOpen(false); setIsBackupModalOpen(true); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <Database className="w-3.5 h-3.5 text-green-500" />
                        Yedekleme
                      </button>
                      <button
                        onClick={() => { setIsUserMenuOpen(false); setIsPasswordModalOpen(true); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                        Şifre Değiştir
                      </button>
                      <div className="border-t border-gray-100">
                        <button
                          onClick={() => setCurrentUser(null)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Çıkış Yap
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile top scrollable sub-nav (tablet range) */}
        <div className="lg:hidden border-t border-gray-100 bg-gray-50/80">
          <div className="max-w-7xl mx-auto px-2">
            <nav className="flex gap-1 overflow-x-auto py-1.5 scrollbar-none">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM BAR */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <nav className="grid grid-cols-5 h-16">
          {mobileMainItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-50' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-semibold leading-none">{item.label}</span>
              </button>
            );
          })}

          {/* More / Menu */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              isMoreActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${isMoreActive ? 'bg-blue-50' : ''}`}>
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-semibold leading-none">
              {isMoreActive ? 'Diğer ●' : 'Diğer'}
            </span>
          </button>
        </nav>
      </div>

      {/* MOBILE BOTTOM SHEET MENU */}
      {isMobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setIsMobileMenuOpen(false)}>
          <div
            className="bg-white rounded-t-2xl shadow-2xl p-4 space-y-3 max-h-[75vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-800">Diğer Sayfalar</p>
                <p className="text-xs text-gray-400">{currentUser?.fullName}</p>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 rounded-xl bg-gray-100 text-gray-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-600 text-white' : 'bg-white text-gray-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100">
              <button
                onClick={() => { setIsMobileMenuOpen(false); handleRoleToggle('admin'); }}
                className={`flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                  isAdmin ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Müdür
              </button>
              <button
                onClick={() => { setIsMobileMenuOpen(false); handleRoleToggle('spv'); }}
                className={`flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                  !isAdmin ? 'bg-amber-500 text-white border-amber-500' : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                SPV
              </button>
              <button
                onClick={() => { setIsMobileMenuOpen(false); setCurrentUser(null); }}
                className="flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-semibold border bg-red-50 border-red-200 text-red-500 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Çıkış
              </button>
            </div>
          </div>
        </div>
      )}

      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
      <BackupModal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} />
    </>
  );
}
