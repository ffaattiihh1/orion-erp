'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Lock, ArrowRight, KeyRound, Mail, AlertCircle, X, Eye, EyeOff } from 'lucide-react';

export default function LoginWall() {
  const { loginWithCredentials, sendPasswordReset } = useApp();
  
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = loginWithCredentials(usernameOrEmail, password);
    if (!res.success) {
      setError(res.error || 'Kullanıcı adı veya şifre hatalı.');
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSuccess(null);
    setForgotError(null);
    const res = sendPasswordReset(forgotInput);
    if (res.success) {
      setForgotSuccess(res.message);
    } else {
      setForgotError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">

        {/* Logo & Brand */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md mb-4">
            <span className="text-gray-900 font-black text-2xl">O</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Orion Proje Takip</h1>
          <p className="text-sm text-gray-500 mt-1">Saha Yönetim Sistemi</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              required
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="kullanici.adi"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-semibold text-gray-700">Şifre</label>
              <button
                type="button"
                onClick={() => { setForgotInput(usernameOrEmail); setIsForgotModalOpen(true); }}
                className="text-xs text-blue-600 hover:underline cursor-pointer"
              >
                Şifremi unuttum
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifrenizi girin"
                className="w-full px-4 py-3 pr-11 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-gray-900 font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Giriş Yap</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-gray-400">
          Giriş yaptıktan sonra oturumunuz bu cihazda korunur.
        </p>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-xl p-6">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" />
                Şifre Sıfırlama
              </h3>
              <button onClick={() => setIsForgotModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <p className="text-sm text-gray-600">
                Kullanıcı adınızı veya e-postanızı girin, şifre sıfırlama bağlantısı gönderilecek.
              </p>

              <div className="relative">
                <input
                  type="text"
                  required
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                  placeholder="Kullanıcı adı veya e-posta"
                  className="w-full px-4 py-3 pl-10 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              </div>

              {forgotSuccess && (
                <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{forgotSuccess}</div>
              )}
              {forgotError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{forgotError}</div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-gray-900 font-bold text-sm transition-all cursor-pointer"
              >
                Bağlantı Gönder
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


