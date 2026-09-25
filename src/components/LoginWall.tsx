'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ShieldCheck, Lock, ArrowRight, UserCheck, Smartphone } from 'lucide-react';

export default function LoginWall() {
  const { setCurrentUser, users } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedUser = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (matchedUser) {
      setCurrentUser(matchedUser);
      setError('');
    } else {
      setError('Geçersiz kullanıcı adı veya şifre. Sistem kapalı devredir, lütfen merkez yönetim ile iletişime geçin.');
    }
  };

  const handleQuickDemo = (role: 'admin' | 'spv') => {
    const user = users.find(u => u.role === role);
    if (user) {
      setCurrentUser(user);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-100">
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-8 relative z-10">
        
        {/* Brand / Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/25 mb-4 border border-sky-400/30">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            SAHA-ERP <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-medium">Orion</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Pazar Araştırma, Hakediş & Finans Yönetim Sistemi</p>
          
          <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Kapalı Devre Güvenli Ağ (No-Index & RLS Korumalı)</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Kurumsal E-Posta / Kullanıcı Adı
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ad.soyad@orion.com"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Şifre
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm transition-all"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Güvenli Giriş Yap</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>

        {/* Demo Fast Access Buttons for immediate pair-programming evaluation */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider mb-3">
            Hızlı Test / Demo Hesapları
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemo('admin')}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Admin (Merkez)</span>
            </button>
            <button
              onClick={() => handleQuickDemo('spv')}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>SPV (Saha Mobil)</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[11px] text-slate-500">
            Sistemde genel kayıt formu kapalıdır. Yetkilendirme yalnızca Merkez İK ve Sistem Yöneticisi tarafından gerçekleştirilir.
          </p>
        </div>
      </div>
    </div>
  );
}
