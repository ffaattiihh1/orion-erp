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
  KeyRound
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
    { id: 'projects', label: 'Projeler', icon: Briefcase, roles: ['admin', 'spv'] },
    { id: 'settlements', label: 'Hakediş Proje Kapama', icon: Calculator, roles: ['admin', 'spv'] },
    { id: 'personnel', label: 'Personel Listesi', icon: Users, roles: ['admin', 'spv'] },
    { id: 'expenses', label: 'Saha Masrafları', icon: Receipt, roles: ['admin', 'spv'] },
    { id: 'advances', label: 'Canlı Avanslar', icon: Banknote, roles: ['admin', 'spv'] },
    { id: 'feasibility', label: 'Fizibilite Simülatörü', icon: Calculator, roles: ['admin'] },
    { id: 'invoices', label: 'Faturalandırma & Tahsilat', icon: FileText, roles: ['admin'] },
  ];

  const visibleNavItems = allNavItems.filter(item => 
    !currentUser?.role || item.roles.includes(currentUser.role)
  );

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20 border border-sky-400/20">
              <span className="text-white font-black text-lg tracking-wider">O</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight">ORİON SAHA-ERP</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  currentUser?.role === 'admin' 
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {currentUser?.role === 'admin' ? 'Müdür / Yönetim' : 'SPV / Saha'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none">Pazar Araştırma ve Saha Operasyon Yönetimi</p>
            </div>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Offline-First Network Status & Sim Toggle */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
              {isOnline ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Çevrimiçi</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium animate-pulse">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Çevrimdışı (Önbellek)</span>
                </div>
              )}

              {offlineQueueCount > 0 && (
                <button
                  onClick={syncOfflineQueue}
                  className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors border border-amber-500/30 font-semibold cursor-pointer"
                  title="Bekleyen işlemleri eşitle"
                >
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>{offlineQueueCount} İşlem Bekliyor</span>
                </button>
              )}
            </div>

            {/* Quick Role Switcher for paired testing */}
            <div className="hidden lg:flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <button
                onClick={() => handleRoleToggle('admin')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  currentUser?.role === 'admin'
                    ? 'bg-sky-500 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Müdür (Merkez)</span>
              </button>
              <button
                onClick={() => handleRoleToggle('spv')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  currentUser?.role === 'spv'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>SPV (Saha)</span>
              </button>
            </div>

            {/* Current User Info, Password Change & Logout */}
            <div className="flex items-center gap-1.5 sm:gap-2 pl-2 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white leading-tight">{currentUser?.fullName}</p>
                <p className="text-[10px] text-slate-400 font-mono">@{currentUser?.username || currentUser?.email?.split('@')[0]}</p>
              </div>

              {/* Password Change Button */}
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                title="Şifremi Değiştir"
                className="flex items-center gap-1 p-2 rounded-xl text-slate-300 hover:text-sky-400 hover:bg-slate-800 transition-colors border border-slate-700/60 cursor-pointer text-xs"
              >
                <KeyRound className="w-4 h-4 text-sky-400" />
                <span className="hidden md:inline font-semibold">Şifre Değiştir</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={() => setCurrentUser(null)}
                title="Çıkış Yap"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Tab Navigation for all authenticated roles */}
      <div className="border-t border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold'
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

      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </header>
  );
}
