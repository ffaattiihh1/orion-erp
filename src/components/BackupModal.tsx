'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  X, 
  Database, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileJson, 
  ShieldCheck,
  HardDrive
} from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BackupModal({ isOpen, onClose }: BackupModalProps) {
  const { 
    projects, 
    personnel, 
    settlements, 
    expenses, 
    advances, 
    clientInvoices,
    dailyReports,
    phoneControlRecords,
    exportFullBackup, 
    importFullBackup 
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleDownload = () => {
    exportFullBackup();
    setStatusMessage({
      type: 'success',
      text: 'Yedek dosyası (.json) bilgisayarınıza indirildi. İstediğiniz zaman bu dosyadan geri yükleyebilirsiniz.'
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = importFullBackup(content);
        if (result.success) {
          setStatusMessage({ type: 'success', text: result.message });
          if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
          setStatusMessage({ type: 'error', text: result.message });
        }
      }
    };
    reader.onerror = () => {
      setStatusMessage({ type: 'error', text: 'Dosya okunurken bir hata oluştu.' });
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-3xl p-6 text-gray-900 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">Veri Güvenliği & Sistem Yedeği</h3>
              <p className="text-xs text-gray-500">Tüm projelerinizi, personelleri, saha raporlarını ve hakedişleri yedekleyin</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Database Stats */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">
            Mevcut Sistem Verisi Özeti
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-white border border-gray-200">
              <span className="text-gray-500 text-[10px] block">Projeler</span>
              <strong className="text-gray-900 text-sm font-mono">{projects.length}</strong>
            </div>
            <div className="p-2 rounded-xl bg-white border border-gray-200">
              <span className="text-gray-500 text-[10px] block">Personel</span>
              <strong className="text-gray-900 text-sm font-mono">{personnel.length}</strong>
            </div>
            <div className="p-2 rounded-xl bg-white border border-gray-200">
              <span className="text-gray-500 text-[10px] block">Hakediş</span>
              <strong className="text-emerald-400 text-sm font-mono">{settlements.length}</strong>
            </div>
            <div className="p-2 rounded-xl bg-white border border-gray-200">
              <span className="text-gray-500 text-[10px] block">Saha Rapor</span>
              <strong className="text-sky-400 text-sm font-mono">{dailyReports.length}</strong>
            </div>
            <div className="p-2 rounded-xl bg-white border border-gray-200">
              <span className="text-gray-500 text-[10px] block">TK Kaydı</span>
              <strong className="text-indigo-400 text-sm font-mono">{phoneControlRecords.length}</strong>
            </div>
            <div className="p-2 rounded-xl bg-white border border-gray-200">
              <span className="text-gray-500 text-[10px] block">Gider/Avans</span>
              <strong className="text-amber-400 text-sm font-mono">{expenses.length + advances.length}</strong>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Export Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-sky-950/20 to-slate-950 border border-sky-500/20 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs mb-1">
                <Download className="w-4 h-4" />
                <span>Yedek İndir (.json)</span>
              </div>
              <p className="text-[11px] text-gray-500">
                Tüm verilerinizi tek bir JSON dosyasında güvenle saklayın.
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="w-full py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-gray-900 font-bold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Yedek Dosyası İndir</span>
            </button>
          </div>

          {/* Import Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-950/20 to-slate-950 border border-emerald-500/20 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs mb-1">
                <Upload className="w-4 h-4" />
                <span>Yedekten Geri Yükle</span>
              </div>
              <p className="text-[11px] text-gray-500">
                Önceden aldığınız bir JSON yedek dosyasını sisteme aktarın.
              </p>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-gray-900 font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Yedek Dosyası Seç</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Feedback */}
        {statusMessage && (
          <div className={`p-3 rounded-xl flex items-center gap-2 text-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

      </div>
    </div>
  );
}


