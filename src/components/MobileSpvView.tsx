'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  PlusCircle, 
  Receipt, 
  Banknote, 
  ClipboardCheck, 
  Camera, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  Clock, 
  X,
  AlertCircle,
  ArrowRight,
  Eye
} from 'lucide-react';
import { ExpenseCategory, Personnel, Project } from '@/types';
import ProjectDetailModal from './ProjectDetailModal';

export default function MobileSpvView() {
  const { 
    currentUser, 
    projects, 
    personnel, 
    projectPersonnel, 
    expenses, 
    advances, 
    isOnline, 
    offlineQueueCount, 
    addExpense, 
    addAdvance, 
    closeSurveysAndCalculateSettlement,
    getPersonnelNetAdvance 
  } = useApp();

  // SPV's assigned project (RLS Isolation: Only projects where assignedSpvId === currentUser.id)
  const spvProjects = projects.filter(p => p.assignedSpvId === currentUser?.id);
  const activeProject = spvProjects[0] || projects[0]; // fallback to first if test

  // Active personnel assigned to this project
  const assignedPersonnelIds = projectPersonnel
    .filter(pp => pp.projectId === activeProject?.id)
    .map(pp => pp.personnelId);

  const availablePersonnel = personnel.filter(p => assignedPersonnelIds.includes(p.id) && !p.isBlacklisted);

  // Modal States
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<Project | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form States
  // 1. Expense Form
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('yakit');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  // 2. Advance Form
  const [advancePersonnelId, setAdvancePersonnelId] = useState(availablePersonnel[0]?.id || '');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceMethod, setAdvanceMethod] = useState<'nakit' | 'havale'>('nakit');
  const [advanceNote, setAdvanceNote] = useState('');

  // 3. Survey Close Form
  const [surveyPersonnelId, setSurveyPersonnelId] = useState(availablePersonnel[0]?.id || '');
  const [totalSurveysInput, setTotalSurveysInput] = useState('');
  const [invalidSurveysInput, setInvalidSurveysInput] = useState('0');

  // Trigger temporary success notification
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Submit Expense
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || !activeProject) return;

    await addExpense({
      projectId: activeProject.id,
      projectCode: activeProject.code,
      createdBySpvId: currentUser?.id || 'spv-1',
      spvName: currentUser?.fullName || 'Ahmet Demir (SPV)',
      category: expenseCategory,
      amount: Number(expenseAmount),
      description: expenseDescription || `${expenseCategory.toUpperCase()} Saha Masrafı`,
      receiptImageUrl: receiptImage || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
      expenseDate: new Date().toISOString().split('T')[0]
    });

    setIsExpenseModalOpen(false);
    setExpenseAmount('');
    setExpenseDescription('');
    setReceiptImage(null);
    showToast(isOnline ? 'Fiş kaydedildi ve merkeze iletildi!' : 'İnternet yok: Fiş yerel hafızaya kaydedildi (Online olunca senkronize edilecek).');
  };

  // Submit Advance
  const handleAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceAmount || !advancePersonnelId || !activeProject) return;

    const person = personnel.find(p => p.id === advancePersonnelId);

    await addAdvance({
      projectId: activeProject.id,
      projectCode: activeProject.code,
      personnelId: advancePersonnelId,
      personnelName: person?.fullName || 'Personel',
      issuedBySpvId: currentUser?.id || 'spv-1',
      spvName: currentUser?.fullName || 'Ahmet Demir (SPV)',
      amount: Number(advanceAmount),
      paymentMethod: advanceMethod,
      note: advanceNote || 'Saha elden avans teslimi',
      issuedAt: new Date().toISOString()
    });

    setIsAdvanceModalOpen(false);
    setAdvanceAmount('');
    setAdvanceNote('');
    showToast(`₺${advanceAmount} avans ${person?.fullName} hesabından canlı olarak düşüldü!`);
  };

  // Submit Survey Count
  const handleSurveySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalSurveysInput || !surveyPersonnelId || !activeProject) return;

    const tot = Number(totalSurveysInput);
    const inv = Number(invalidSurveysInput || 0);

    closeSurveysAndCalculateSettlement(activeProject.id, surveyPersonnelId, tot, inv);

    setIsSurveyModalOpen(false);
    setTotalSurveysInput('');
    setInvalidSurveysInput('0');
    showToast('Anket kapaması yapıldı, hakediş motoru net rakamı hesapladı!');
  };

  // Mock Camera receipt capture
  const handleSimulateCameraCapture = () => {
    // Uses realistic receipt sample
    setReceiptImage('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80');
  };

  // Filtered recent activities for this SPV
  const recentSpvExpenses = expenses.filter(e => e.projectId === activeProject?.id);
  const recentSpvAdvances = advances.filter(a => a.projectId === activeProject?.id);

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-24 text-slate-100">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-4 left-4 right-4 z-50 p-4 rounded-2xl bg-emerald-500 text-white shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-bold">{successToast}</span>
        </div>
      )}

      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="mb-4 p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400" />
            <span><strong>Çevrimdışı Mod:</strong> İşlemler önbellekte tutuluyor.</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-[10px] font-bold">
            {offlineQueueCount} Kuyrukta
          </span>
        </div>
      )}

      {/* SPV Active Project Header (RLS Filtered) */}
      <div 
        onClick={() => setSelectedProjectForDetail(activeProject)}
        className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-sky-500/40 shadow-xl relative overflow-hidden mb-6 cursor-pointer group transition-all"
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Saha Ekip Lideri Modu
              </span>
              <span className="text-xs font-mono text-slate-400">{activeProject?.code}</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors">
              {activeProject?.title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Müşteri: {activeProject?.clientName}</p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProjectForDetail(activeProject);
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-sky-400 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20"
          >
            <span>Tüm İşlemler</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Project Target Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
            <span>Saha İlerlemesi</span>
            <span className="font-mono">{activeProject?.completedSurveys || 0} / {activeProject?.targetSurveys} Anket</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(((activeProject?.completedSurveys || 0) / (activeProject?.targetSurveys || 1)) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* BIG FINGER-FRIENDLY TOUCH BUTTONS (PWA Mobile Requirement) */}
      <div className="space-y-3 mb-8">
        
        {/* Button 1: Live Cash Advance */}
        <button
          onClick={() => setIsAdvanceModalOpen(true)}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:scale-98 text-white font-bold shadow-lg shadow-orange-500/25 flex items-center justify-between transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20">
              <Banknote className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-base font-extrabold leading-tight">Avans Ver & Canlı Düş</p>
              <p className="text-xs text-amber-100 font-normal">Anketörün hakedişinden anında eksi bakiye</p>
            </div>
          </div>
          <PlusCircle className="w-6 h-6 text-white/80" />
        </button>

        {/* Button 2: Photo Expense & Receipt */}
        <button
          onClick={() => setIsExpenseModalOpen(true)}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:scale-98 text-white font-bold shadow-lg shadow-sky-500/25 flex items-center justify-between transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-base font-extrabold leading-tight">Fiş Çek & Masraf Gir</p>
              <p className="text-xs text-sky-100 font-normal">Yakıt, yemek fişini merkeze saniyesinde ilet</p>
            </div>
          </div>
          <PlusCircle className="w-6 h-6 text-white/80" />
        </button>

        {/* Button 3: Close Surveys (Hakediş Hesapla) */}
        <button
          onClick={() => setIsSurveyModalOpen(true)}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-98 text-white font-bold shadow-lg shadow-emerald-600/25 flex items-center justify-between transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-base font-extrabold leading-tight">Anket Sayısı Gir & Kapa</p>
              <p className="text-xs text-emerald-100 font-normal">Toplam - İptal ile anında net hakediş hesapla</p>
            </div>
          </div>
          <PlusCircle className="w-6 h-6 text-white/80" />
        </button>
      </div>

      {/* Field Personnel Active Balances */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Saha Ekibi & Alınan Avanslar
        </h3>
        <div className="space-y-2">
          {availablePersonnel.map(person => {
            const assignment = projectPersonnel.find(pp => pp.projectId === activeProject?.id && pp.personnelId === person.id);
            const netAdvance = getPersonnelNetAdvance(activeProject?.id || '', person.id);
            
            return (
              <div 
                key={person.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-bold text-white">{person.fullName}</p>
                  <p className="text-[11px] text-slate-400">
                    Özel Fiyat: <span className="text-sky-400 font-semibold">{assignment?.customUnitPrice || person.defaultUnitPrice} TL</span> / Anket
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Toplam Avans</span>
                  <span className="text-xs font-bold font-mono text-amber-400">
                    ₺{netAdvance.toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Field Expenses */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Son Girilen Fişler ({recentSpvExpenses.length})
        </h3>
        <div className="space-y-2">
          {recentSpvExpenses.slice(0, 4).map(exp => (
            <div key={exp.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-white">{exp.description}</p>
                  <p className="text-[10px] text-slate-400">{exp.expenseDate} • {exp.category.toUpperCase()}</p>
                </div>
              </div>
              <span className="font-mono font-bold text-white">₺{exp.amount.toLocaleString('tr-TR')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ----------------- MODAL 1: ADVANCE ENTRY ----------------- */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-6 text-slate-100 animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-amber-400" />
                <span>Canlı Avans Ver</span>
              </h3>
              <button onClick={() => setIsAdvanceModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdvanceSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Anketör Seçin</label>
                <select
                  value={advancePersonnelId}
                  onChange={(e) => setAdvancePersonnelId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
                >
                  {availablePersonnel.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Avans Tutarı (TL)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  placeholder="Örn: 500"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-lg font-mono font-bold text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ödeme Yöntemi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdvanceMethod('nakit')}
                    className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                      advanceMethod === 'nakit' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Nakit (Elden)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvanceMethod('havale')}
                    className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                      advanceMethod === 'havale' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    IBAN / Havale
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Açıklama / Not</label>
                <input
                  type="text"
                  value={advanceNote}
                  onChange={(e) => setAdvanceNote(e.target.value)}
                  placeholder="Örn: Yol & yemek avansı"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                Avansı Onayla & Bakiyeden Düş
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 2: EXPENSE & RECEIPT PHOTO ----------------- */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-6 text-slate-100 animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-sky-400" />
                <span>Saha Fişi / Masraf Ekle</span>
              </h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Gider Kategorisi</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
                >
                  <option value="yakit">Yakıt / Mazot</option>
                  <option value="yemek">Yemek & İkram</option>
                  <option value="konaklama">Otel / Konaklama</option>
                  <option value="kargo">Kargo / Evrak</option>
                  <option value="diger">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fiş Tutarı (TL)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="Örn: 850"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-lg font-mono font-bold text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Receipt Camera Simulator */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fiş Fotoğrafı</label>
                {receiptImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-500/50">
                    <img src={receiptImage} alt="Fiş" className="w-full h-32 object-cover" />
                    <button
                      type="button"
                      onClick={() => setReceiptImage(null)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-slate-950/80 text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSimulateCameraCapture}
                    className="w-full py-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-sky-500 bg-slate-950 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-xs font-medium">Kamerayı Aç / Fiş Çek</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Açıklama</label>
                <input
                  type="text"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="Örn: Shell Kadıköy mazot fişi"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
              >
                Fişi Merkeze Gönder
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 3: SURVEY CLOSE (HAKEDİŞ HESAPLA) ----------------- */}
      {isSurveyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-6 text-slate-100 animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-emerald-400" />
                <span>Anket Sayısı Gir & Kapa</span>
              </h3>
              <button onClick={() => setIsSurveyModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSurveySubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Personel</label>
                <select
                  value={surveyPersonnelId}
                  onChange={(e) => setSurveyPersonnelId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
                >
                  {availablePersonnel.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Toplam Yapılan</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={totalSurveysInput}
                    onChange={(e) => setTotalSurveysInput(e.target.value)}
                    placeholder="Örn: 150"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-base font-mono font-bold text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-rose-400 mb-1">İptal / Geçersiz</label>
                  <input
                    type="number"
                    min="0"
                    value={invalidSurveysInput}
                    onChange={(e) => setInvalidSurveysInput(e.target.value)}
                    placeholder="Örn: 5"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-base font-mono font-bold text-rose-400"
                  />
                </div>
              </div>

              {/* Formula Preview Callout */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Geçerli Anket:</span>
                  <span className="font-bold text-white font-mono">
                    {Math.max(0, Number(totalSurveysInput || 0) - Number(invalidSurveysInput || 0))} Adet
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Düşülecek Avans:</span>
                  <span className="font-bold text-amber-400 font-mono">
                    ₺{getPersonnelNetAdvance(activeProject?.id || '', surveyPersonnelId).toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                Hakedişi Hesapla & Kapat
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      <ProjectDetailModal
        project={selectedProjectForDetail}
        isOpen={Boolean(selectedProjectForDetail)}
        onClose={() => setSelectedProjectForDetail(null)}
      />

    </div>
  );
}
