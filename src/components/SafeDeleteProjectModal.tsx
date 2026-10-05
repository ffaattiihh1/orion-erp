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
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <div className="w-full max-w-md bg-white border border-rose-500/40 rounded-3xl p-6 text-gray-900 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">Projeyi Kalıcı Olarak Sil</h3>
              <p className="text-xs text-rose-400 font-medium">Bu işlem geri alınamaz!</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 text-xs text-gray-700 space-y-2">
          <p>
            <strong className="text-gray-900">{project.code} - {project.title}</strong> projesi silinecektir.
          </p>
          <p className="text-[11px] text-gray-500">
            İpucu: Sadece geçmiş hesaplamaları gizlemek istiyorsanız silmek yerine <strong>"Projeyi Gizle / Arşivle"</strong> seçeneğini kullanabilirsiniz.
          </p>
        </div>

        <form onSubmit={handleDelete} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase font-bold"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-medium">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-gray-900 text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
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


