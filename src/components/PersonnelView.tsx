'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Users, 
  ShieldAlert, 
  ShieldCheck, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  Phone, 
  MapPin, 
  AlertTriangle, 
  X, 
  Check, 
  Layers 
} from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';
import { PersonnelRole, Personnel } from '@/types';

export default function PersonnelView() {
  const { 
    personnel, 
    addPersonnel, 
    toggleBlacklist, 
    projects, 
    assignPersonnelToProject,
    getProjectsForPersonnel 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [blacklistFilter, setBlacklistFilter] = useState<string>('all');

  // Modal: Add New Personnel
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTc, setNewTc] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCity, setNewCity] = useState('İstanbul');
  const [newRole, setNewRole] = useState<PersonnelRole>('anketor');
  const [newDefaultPrice, setNewDefaultPrice] = useState('180');
  const [newNotes, setNewNotes] = useState('');

  // Modal: Blacklist confirmation / reason
  const [blacklistTarget, setBlacklistTarget] = useState<Personnel | null>(null);
  const [blacklistReasonInput, setBlacklistReasonInput] = useState('');

  // Modal: Assign to project with price override
  const [assignTarget, setAssignTarget] = useState<Personnel | null>(null);
  const [targetProjectId, setTargetProjectId] = useState(projects[0]?.id || '');
  const [overridePriceInput, setOverridePriceInput] = useState('200');
  const [foodAllowanceInput, setFoodAllowanceInput] = useState('150');

  // Excel Export
  const handleExport = () => {
    const exportData = personnel.map(p => ({
      'Ad Soyad': p.fullName,
      'TC Kimlik': p.identityNumber || '-',
      'Telefon': p.phone,
      'Şehir': p.city,
      'Varsayılan Rol': p.defaultRole.toUpperCase(),
      'Varsayılan Birim Fiyat (TL)': p.defaultUnitPrice,
      'Tamamlanan Proje Sayısı': p.totalProjectsCompleted || 0,
      'Kara Liste Durumu': p.isBlacklisted ? 'KARA LİSTEDE (ENGELLİ)' : 'AKTİF',
      'Kara Liste Sebebi': p.blacklistReason || '-',
      'Kara Liste Tarihi': p.blacklistedAt ? new Date(p.blacklistedAt).toLocaleDateString('tr-TR') : '-'
    }));

    exportToExcel(exportData, 'Orion_Personel_Havuzu', 'Personeller');
  };

  // Filtered List
  const filteredPersonnel = personnel.filter(p => {
    if (roleFilter !== 'all' && p.defaultRole !== roleFilter) return false;
    if (blacklistFilter === 'active' && p.isBlacklisted) return false;
    if (blacklistFilter === 'blacklisted' && !p.isBlacklisted) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        p.fullName.toLowerCase().includes(term) ||
        p.phone.includes(term) ||
        p.city.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const handleCreatePersonnel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    addPersonnel({
      fullName: newName,
      identityNumber: newTc || undefined,
      phone: newPhone,
      city: newCity,
      defaultRole: newRole,
      defaultUnitPrice: Number(newDefaultPrice || 180),
      notes: newNotes
    });

    setIsAddModalOpen(false);
    setNewName('');
    setNewTc('');
    setNewPhone('');
    setNewNotes('');
  };

  const handleConfirmBlacklist = () => {
    if (!blacklistTarget) return;
    toggleBlacklist(blacklistTarget.id, blacklistReasonInput);
    setBlacklistTarget(null);
    setBlacklistReasonInput('');
  };

  const handleConfirmAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTarget || !targetProjectId) return;

    assignPersonnelToProject(
      targetProjectId,
      assignTarget.id,
      Number(overridePriceInput),
      Number(foodAllowanceInput || 0)
    );

    setAssignTarget(null);
    alert(`${assignTarget.fullName} başarıyla projeye ₺${overridePriceInput} özel fiyat ile atandı!`);
  };

  const roleLabels: Record<PersonnelRole, string> = {
    anketor: 'Anketör',
    gozlemci: 'Gözlemci',
    gizli_musteri: 'Gizli Müşteri',
    cevirici: 'Çevirici (Stüdyo)',
    girisci: 'Girişçi (PC Başı)'
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Personel Listesi</h2>
            <p className="text-xs text-slate-400">Saha araştırmacısı, anketör, çevirici ve uzman kadro havuzu</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <span>Kayıtlı Personel: </span>
            <strong className="text-white font-mono">{personnel.length} Kişi</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <span>Aktif Kadro: </span>
            <strong className="text-emerald-400 font-mono">{personnel.filter(p => !p.isBlacklisted).length} Kişi</strong>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
          >
            <option value="all">Tüm Roller</option>
            <option value="anketor">Anketör</option>
            <option value="gozlemci">Gözlemci</option>
            <option value="gizli_musteri">Gizli Müşteri</option>
            <option value="cevirici">Çevirici</option>
            <option value="girisci">Girişçi</option>
          </select>

          {/* Status Filter */}
          <select
            value={blacklistFilter}
            onChange={(e) => setBlacklistFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Yalnızca Aktifler</option>
            <option value="blacklisted">Engellenenler</option>
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="İsim, telefon veya şehir ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel'e Aktar</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Personel Ekle</span>
          </button>
        </div>
      </div>

      {/* Personnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPersonnel.map(person => {
          const workedProjects = getProjectsForPersonnel(person.id);

          return (
            <div 
              key={person.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                person.isBlacklisted
                  ? 'bg-rose-950/20 border-rose-900/60 shadow-lg shadow-rose-950/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Top Row: Role + Blacklist indicator */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {roleLabels[person.defaultRole]}
                  </span>

                  {person.isBlacklisted ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      <ShieldAlert className="w-3 h-3" />
                      <span>Engelli</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Aktif</span>
                    </span>
                  )}
                </div>

                {/* Name & TC */}
                <div className="flex items-baseline justify-between">
                  <h3 className={`text-base font-bold ${person.isBlacklisted ? 'text-rose-200 line-through' : 'text-white'}`}>
                    {person.fullName}
                  </h3>
                  {person.identityNumber && (
                    <span className="font-mono text-[11px] text-slate-500">TC: {person.identityNumber}</span>
                  )}
                </div>

                {/* Contact details */}
                <div className="mt-2 text-xs text-slate-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-200 font-mono">{person.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{person.city}</span>
                  </div>
                </div>

                {/* Worked Projects List (Çalıştığı Projeler) */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Görev Aldığı Projeler ({workedProjects.length}):
                  </span>
                  {workedProjects.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic">Henüz bir projede görev almadı</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {workedProjects.map(proj => (
                        <span 
                          key={proj.id}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-sky-400 font-bold"
                          title={proj.title}
                        >
                          {proj.code}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Blacklist Warning Box if applicable */}
                {person.isBlacklisted && person.blacklistReason && (
                  <div className="mt-3 p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-[11px] text-rose-300">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Engelleme Sebebi:</span>
                    </div>
                    <p className="text-rose-200/90 leading-relaxed">{person.blacklistReason}</p>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">
                  Tarife: <strong className="text-slate-300 font-mono">₺{person.defaultUnitPrice}</strong>
                </span>

                {/* Blacklist Toggle Button */}
                <button
                  onClick={() => {
                    if (person.isBlacklisted) {
                      toggleBlacklist(person.id);
                    } else {
                      setBlacklistTarget(person);
                    }
                  }}
                  className={`py-1 px-3 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                    person.isBlacklisted
                      ? 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-emerald-950/30'
                      : 'bg-slate-800 text-rose-400 border-slate-700 hover:bg-rose-950/30'
                  }`}
                >
                  {person.isBlacklisted ? 'Aktifleştir' : 'Engelle'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: ADD NEW PERSONNEL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" />
                <span>Yeni Personel Kaydı</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePersonnel} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Örn: Serkan Yıldız"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Telefon</label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Şehir</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Uzmanlık Rolü</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as PersonnelRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="anketor">Anketör</option>
                    <option value="gozlemci">Gözlemci</option>
                    <option value="gizli_musteri">Gizli Müşteri</option>
                    <option value="cevirici">Çevirici</option>
                    <option value="girisci">Girişçi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Standart Fiyat (TL)</label>
                  <input
                    type="number"
                    value={newDefaultPrice}
                    onChange={(e) => setNewDefaultPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notlar / Tecrübe</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Örn: 5 yıllık saha tecrübesi, b sınıfı ehliyet"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
              >
                Personeli Havuza Kaydet
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BLACKLIST REASON ENTRY */}
      {blacklistTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-rose-800 rounded-2xl p-6 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <span>Kara Listeye Alma Onayı</span>
              </h3>
              <button onClick={() => setBlacklistTarget(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-300">
                <strong className="text-white">{blacklistTarget.fullName}</strong> isimli personeli kara listeye almak üzeresiniz. Kara listedeki personel hiçbir yeni projeye seçilemez.
              </p>

              <div>
                <label className="block text-xs font-semibold text-rose-300 mb-1">
                  Kara Listeye Alma Gerekçesi (Zorunlu)
                </label>
                <textarea
                  required
                  rows={3}
                  value={blacklistReasonInput}
                  onChange={(e) => setBlacklistReasonInput(e.target.value)}
                  placeholder="Örn: Mükerrer anket girişi, sahada devamsızlık veya etik kural ihlali..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-rose-900/60 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBlacklistTarget(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBlacklist}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/30"
                >
                  Kara Listeye Al
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ASSIGN TO PROJECT & OVERRIDE PRICE */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-400" />
                <span>Projeye Atama & Fiyat Override</span>
              </h3>
              <button onClick={() => setAssignTarget(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAssignment} className="space-y-4 mt-4">
              <div>
                <span className="text-xs text-slate-400">Seçili Personel:</span>
                <p className="text-sm font-bold text-white">{assignTarget.fullName} ({assignTarget.defaultRole})</p>
                <p className="text-[11px] text-slate-500">Standart Birim Fiyatı: ₺{assignTarget.defaultUnitPrice}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Atanacak Proje</label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  {projects.filter(p => p.businessModel === 'model_b_micro').map(p => (
                    <option key={p.id} value={p.id}>{p.code} - {p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-sky-400 mb-1">
                  Özel Fiyat Ezme (Override Fiyat - TL)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={overridePriceInput}
                  onChange={(e) => setOverridePriceInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-sky-500/50 text-base font-mono font-bold text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Bu personelin hakedişi bu projede standart 180 TL yerine girdiğiniz <strong>₺{overridePriceInput}</strong> üzerinden hesaplanacaktır.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Günlük Yemek Bedeli (TL - Opsiyonel)
                </label>
                <input
                  type="number"
                  min="0"
                  value={foodAllowanceInput}
                  onChange={(e) => setFoodAllowanceInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
              >
                Projeye Ata & Fiyatı Tanımla
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
