'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { AlertTriangle, X, Trash2, ShieldAlert } from 'lucide-react';
import { Project } from '@/types';

interface SafeDeleteProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export default function SafeDeleteProjectModal({
  project,
  isOpen,
  onClose,
  onDeleted
}: SafeDeleteProjectModalProps) {
  const { deleteProject } = useApp();
  const [confirmInput, setConfirmInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !project) return null;

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmInput.trim().toUpperCase() !== project.code.toUpperCase()) {
      setError(`Lütfen onaylamak için projenin kodunu (${project.code}) tam olarak yazın.`);
      return;
    }

    deleteProject(project.id);
    if (onDeleted) onDeleted();
    onClose();
    setConfirmInput('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-3xl p-6 text-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Projeyi Kalıcı Olarak Sil</h3>
              <p className="text-xs text-rose-400 font-medium">Bu işlem geri alınamaz!</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 text-xs text-slate-300 space-y-2">
          <p>
            <strong className="text-white">{project.code} - {project.title}</strong> projesi silinecektir.
          </p>
          <p className="text-[11px] text-slate-400">
            İpucu: Sadece geçmiş hesaplamaları gizlemek istiyorsanız silmek yerine <strong>"Projeyi Gizle / Arşivle"</strong> seçeneğini kullanabilirsiniz.
          </p>
        </div>

        <form onSubmit={handleDelete} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Onaylamak için proje kodunu yazın: <span className="text-rose-400 font-mono font-bold">{project.code}</span>
            </label>
            <input
              type="text"
              required
              value={confirmInput}
              onChange={(e) => {
                setConfirmInput(e.target.value);
                setError(null);
              }}
              placeholder={project.code}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase font-bold"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-medium">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Projeyi ve Kayıtlarını Sil</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
