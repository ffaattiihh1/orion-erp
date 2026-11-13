'use client';

import React, { useEffect, useState } from 'react';
import type { UserProfile } from '@/types';

const MIN_LENGTH = 8;
import { useApp } from '@/context/AppContext';
import { KeyRound, Lock, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { currentUser, changePassword } = useApp();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Yönetici başka bir kullanıcının şifresini sıfırlayabilir ('' = kendi şifrem)
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [userList, setUserList] = useState<UserProfile[]>([]);

  const isAdmin = currentUser?.role === 'admin';
  const isResettingOther = isAdmin && targetUserId !== '' && targetUserId !== currentUser?.id;

  useEffect(() => {
    if (!isOpen || !isAdmin) return;
    fetch('/api/auth/users', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      .then(json => { if (json?.success) setUserList(json.users as UserProfile[]); })
      .catch(() => {});
  }, [isOpen, isAdmin]);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setSuccess(null);

    if (newPassword.length < MIN_LENGTH) {
      setError(`Yeni şifre en az ${MIN_LENGTH} karakter olmalıdır.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Yeni şifre ve şifre tekrarı birbiriyle uyuşmuyor.');
      return;
    }

    setIsSubmitting(true);
    const res = await changePassword(
      newPassword,
      isResettingOther ? undefined : currentPassword,
      isResettingOther ? targetUserId : undefined
    );
    setIsSubmitting(false);
    if (!res.success) {
      setError(res.message);
    } else {
      setSuccess(res.message);
      setTimeout(() => {
        onClose();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTargetUserId('');
        setSuccess(null);
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-6 text-gray-900 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Şifre Değiştir</h3>
              <p className="text-xs text-gray-500">
                {currentUser.fullName} ({currentUser.role === 'admin' ? 'Müdür' : 'SPV'})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {isAdmin && userList.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Kullanıcı
              </label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
              >
                <option value="">Kendi şifrem</option>
                {userList.filter(u => u.id !== currentUser.id).map(u => (
                  <option key={u.id} value={u.id}>{u.fullName} ({u.role === 'admin' ? 'Müdür' : 'SPV'}) — şifresini sıfırla</option>
                ))}
              </select>
            </div>
          )}

          {!isResettingOther && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Mevcut Şifre
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mevcut şifrenizi girin"
                className="w-full px-4 py-2.5 pl-10 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
              />
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
            </div>
          </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Yeni Şifre
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={`En az ${MIN_LENGTH} karakter`}
                className="w-full px-4 py-2.5 pl-10 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs font-mono"
              />
              <KeyRound className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Yeni Şifre (Tekrar)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Yeni şifrenizi tekrar yazın"
                className="w-full px-4 py-2.5 pl-10 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs font-mono"
              />
              <ShieldCheck className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-60 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Kaydediliyor…' : 'Şifreyi Güncelle & Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




