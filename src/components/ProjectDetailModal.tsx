'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  X, 
  Briefcase, 
  Users, 
  Receipt, 
  Banknote, 
  Calculator, 
  FileSpreadsheet, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  Camera, 
  TrendingUp, 
  Calendar, 
  Building2, 
  Layers, 
  StickyNote, 
  FileText,
  Eye,
  Plus
} from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';
import { Project, ExpenseCategory, Personnel } from '@/types';

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectDetailModal({ project, isOpen, onClose }: ProjectDetailModalProps) {
  const { 
    currentUser, 
    personnel, 
    projectPersonnel, 
    expenses, 
    advances, 
    settlements, 
    clientInvoices, 
    addExpense, 
    addAdvance, 
    closeSurveysAndCalculateSettlement, 
    toggleSettlementPaid, 
    assignPersonnelToProject, 
    getPersonnelNetAdvance,
    updateProject 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'personnel' | 'expenses' | 'advances' | 'notes'>('personnel');

  // Action Modals within Project
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form states
  // 1. Advance Form
  const [advancePersonnelId, setAdvancePersonnelId] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceMethod, setAdvanceMethod] = useState<'nakit' | 'havale'>('nakit');
  const [advanceNote, setAdvanceNote] = useState('');

  // 2. Expense Form
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('yakit');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseReceiptImage, setExpenseReceiptImage] = useState<string | null>(null);

  // 3. Survey Close Form
  const [surveyPersonnelId, setSurveyPersonnelId] = useState('');
  const [surveyTotal, setSurveyTotal] = useState('');
  const [surveyInvalid, setSurveyInvalid] = useState('0');

  // 4. Assign Personnel Form
  const [assignPersonnelId, setAssignPersonnelId] = useState('');
  const [assignOverridePrice, setAssignOverridePrice] = useState('200');
  const [assignFoodAllowance, setAssignFoodAllowance] = useState('150');

  // 5. Note Form
  const [newNoteText, setNewNoteText] = useState('');

  if (!isOpen || !project) return null;

  const isModelA = project.businessModel === 'model_a_macro';

  // Filtered data for this specific project
  const projectAssigned = projectPersonnel.filter(pp => pp.projectId === project.id);
  const projectExpenses = expenses.filter(e => e.projectId === project.id);
  const projectAdvances = advances.filter(a => a.projectId === project.id);
  const projectSettlements = settlements.filter(s => s.projectId === project.id);
  const projectInvoice = clientInvoices.find(inv => inv.projectId === project.id);

  // Aggregated totals
  const totalProjectExpenses = projectExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalProjectAdvances = projectAdvances.reduce((sum, a) => sum + Number(a.amount), 0);
  const totalProjectGrossHakedis = projectSettlements.reduce((sum, s) => sum + Number(s.grossAmount), 0);
  const totalProjectNetPayable = projectSettlements.reduce((sum, s) => sum + Number(s.netPayable), 0);
  const totalValidSurveysDone = projectSettlements.reduce((sum, s) => sum + Number(s.validSurveys), 0);

  // Unassigned eligible personnel for modal
  const assignedIds = projectAssigned.map(pp => pp.personnelId);
  const unassignedPersonnel = personnel.filter(p => !assignedIds.includes(p.id) && !p.isBlacklisted);

  // Excel Export for this single project
  const handleExportProjectSheet = () => {
    const settlementRows = projectSettlements.map(s => ({
      'Bölüm': 'Hakediş',
      'Kişi / Kalem': s.personnelName,
      'Rol / Kategori': s.personnelRole.toUpperCase(),
      'Toplam Anket': s.totalSurveys,
      'İptal Anket': s.invalidSurveys,
      'Geçerli Anket': s.validSurveys,
      'Birim Fiyat (TL)': s.unitPriceApplied,
      'Brüt Tutar (TL)': s.grossAmount,
      'Mahsup Avans (TL)': s.advancesDeducted,
      'Net Ödenecek (TL)': s.netPayable,
      'Durum': s.isPaid ? 'ÖDENDİ' : 'BEKLİYOR'
    }));

    const expenseRows = projectExpenses.map(e => ({
      'Bölüm': 'Masraf / Fiş',
      'Kişi / Kalem': e.description,
      'Rol / Kategori': e.category.toUpperCase(),
      'Toplam Anket': '-',
      'İptal Anket': '-',
      'Geçerli Anket': '-',
      'Birim Fiyat (TL)': '-',
      'Brüt Tutar (TL)': e.amount,
      'Mahsup Avans (TL)': '-',
      'Net Ödenecek (TL)': e.amount,
      'Durum': e.isApproved ? 'ONAYLANDI' : 'BEKLEMEDE'
    }));

    exportToExcel([...settlementRows, ...expenseRows], `${project.code}_Detay_Hakedis_ve_Masraf_Raporu`, 'Proje Detay');
  };

  // Submit Advance
  const handleAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advancePersonnelId || !advanceAmount) return;

    const person = personnel.find(p => p.id === advancePersonnelId);

    await addAdvance({
      projectId: project.id,
      projectCode: project.code,
      personnelId: advancePersonnelId,
      personnelName: person?.fullName || 'Personel',
      issuedBySpvId: currentUser?.id || 'spv-1',
      spvName: currentUser?.fullName || 'Ahmet Demir (SPV)',
      amount: Number(advanceAmount),
      paymentMethod: advanceMethod,
      note: advanceNote || 'Proje içi avans',
      issuedAt: new Date().toISOString()
    });

    setIsAdvanceModalOpen(false);
    setAdvanceAmount('');
    setAdvanceNote('');
  };

  // Submit Expense
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount) return;

    await addExpense({
      projectId: project.id,
      projectCode: project.code,
      createdBySpvId: currentUser?.id || 'spv-1',
      spvName: currentUser?.fullName || 'Ahmet Demir (SPV)',
      category: expenseCategory,
      amount: Number(expenseAmount),
      description: expenseDesc || `${expenseCategory.toUpperCase()} Saha Masrafı`,
      receiptImageUrl: expenseReceiptImage || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
      expenseDate: new Date().toISOString().split('T')[0]
    });

    setIsExpenseModalOpen(false);
    setExpenseAmount('');
    setExpenseDesc('');
    setExpenseReceiptImage(null);
  };

  // Submit Survey Close
  const handleSurveySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyPersonnelId || !surveyTotal) return;

    closeSurveysAndCalculateSettlement(
      project.id,
      surveyPersonnelId,
      Number(surveyTotal),
      Number(surveyInvalid || 0)
    );

    setIsSurveyModalOpen(false);
    setSurveyTotal('');
    setSurveyInvalid('0');
  };

  // Submit Assign Personnel
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignPersonnelId) return;

    assignPersonnelToProject(
      project.id,
      assignPersonnelId,
      Number(assignOverridePrice),
      Number(assignFoodAllowance || 0)
    );

    setIsAssignModalOpen(false);
    setAssignPersonnelId('');
  };

  // Submit Note
  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText) return;

    const existingNotes = project.notes || '';
    const dateStr = new Date().toLocaleDateString('tr-TR') + ' ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const updatedNotes = existingNotes ? `${existingNotes}\n[${dateStr} - ${currentUser?.fullName}]: ${newNoteText}` : `[${dateStr} - ${currentUser?.fullName}]: ${newNoteText}`;

    updateProject(project.id, { notes: updatedNotes });
    setIsNoteModalOpen(false);
    setNewNoteText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-7 my-6 text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {project.code}
              </span>

              {isModelA ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Model A • Taşeron (Makro)
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  Model B • Öz Ekip (Mikro)
                </span>
              )}

              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {project.status === 'active' ? 'Aktif Proje' : project.status === 'feasibility' ? 'Fizibilite' : 'Tamamlandı'}
              </span>
            </div>

            <h1 className="text-xl font-black text-white tracking-tight">{project.title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Ana Müşteri: <strong className="text-slate-200">{project.clientName}</strong> • {project.startDate} / {project.endDate}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportProjectSheet}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
              title="Bu projenin detaylı Excel tablosunu indir"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Proje Raporu (Excel)</span>
            </button>

            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Hedef Anket Sayısı</span>
            <span className="text-lg font-black font-mono text-white">{project.targetSurveys} <span className="text-xs font-normal text-slate-500">Anket</span></span>
            <span className="text-[10px] text-slate-500 block">Birim: ₺{project.clientUnitPrice}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Tamamlanan / Geçerli</span>
            <span className="text-lg font-black font-mono text-sky-400">{totalValidSurveysDone} <span className="text-xs font-normal text-slate-500">/ {project.targetSurveys}</span></span>
            <span className="text-[10px] text-slate-500 block">%{Math.min((totalValidSurveysDone / (project.targetSurveys || 1)) * 100, 100).toFixed(0)} Tamamlanma</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Toplam Masraf & Avans</span>
            <span className="text-lg font-black font-mono text-amber-400">₺{(totalProjectExpenses + totalProjectAdvances).toLocaleString('tr-TR')}</span>
            <span className="text-[10px] text-slate-500 block">₺{totalProjectExpenses} Masraf + ₺{totalProjectAdvances} Avans</span>
          </div>

          {currentUser?.role === 'admin' ? (
            <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-800/40">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Beklenen Kâr Marjı</span>
              <span className="text-lg font-black font-mono text-emerald-400">%{project.simulatedMarginPercent || 35}</span>
              <span className="text-[10px] text-emerald-300 block font-mono">₺{((project.clientTotalBudget) * ((project.simulatedMarginPercent || 35)/100)).toLocaleString('tr-TR')} Kâr</span>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Kalan Hedef Anket</span>
              <span className="text-lg font-black font-mono text-emerald-400">
                {Math.max(0, project.targetSurveys - totalValidSurveysDone)} <span className="text-xs font-normal text-slate-500">Adet</span>
              </span>
              <span className="text-[10px] text-slate-500 block">Saha kapanışı bekleniyor</span>
            </div>
          )}
        </div>

        {/* PROJE İÇİ HIZLI İŞLEM BUTONLARI */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-sky-400" />
            <span>İşlem Ekle:</span>
          </span>

          {/* 1. Avans Ver */}
          <button
            onClick={() => {
              if (projectAssigned.length > 0) setAdvancePersonnelId(projectAssigned[0].personnelId);
              setIsAdvanceModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>+ Avans Ekle</span>
          </button>

          {/* 2. Masraf / Fiş Ekle */}
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>+ Masraf / Fiş Ekle</span>
          </button>

          {/* 3. Anket Kapama & Hakediş */}
          <button
            onClick={() => {
              if (projectAssigned.length > 0) setSurveyPersonnelId(projectAssigned[0].personnelId);
              setIsSurveyModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>+ Anket Kapama / Hakediş</span>
          </button>

          {/* 4. Personel Ata */}
          {!isModelA && (
            <button
              onClick={() => {
                if (unassignedPersonnel.length > 0) setAssignPersonnelId(unassignedPersonnel[0].id);
                setIsAssignModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>+ Personel Ata & Fiyat Override</span>
            </button>
          )}

          {/* 5. Not Ekle */}
          <button
            onClick={() => setIsNoteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>+ Proje Notu Ekle</span>
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="flex border-b border-slate-800 space-x-2 mb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('personnel')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'personnel'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Saha Personeli & Hakedişler ({isModelA ? 'Taşeron' : projectAssigned.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'expenses'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Saha Masrafları ({projectExpenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('advances')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'advances'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>Avans Hareketleri ({projectAdvances.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>Notlar & Saha Günlüğü</span>
          </button>
        </div>

        {/* Tab 1: PERSONNEL & SETTLEMENTS */}
        {activeTab === 'personnel' && (
          <div className="space-y-4">
            {isModelA ? (
              <div className="p-6 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-indigo-300">Model A: Taşeron Makro Hakediş Özeti</h3>
                </div>
                <p className="text-slate-300">
                  Bu proje dış il / taşeron modeliyle yönetilmektedir. Kişi bazlı avans ve masraf tutulmaz.
                </p>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Taşeron Firma:</span>
                    <strong className="text-white text-sm">{project.subcontractorName}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Anket Başı Toplu Fiyat:</span>
                    <strong className="text-indigo-400 text-sm font-mono">₺{project.subcontractorUnitPrice}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Toplam Taşeron Hakedişi:</span>
                    <strong className="text-emerald-400 text-sm font-mono">₺{((project.targetSurveys) * (project.subcontractorUnitPrice || 0)).toLocaleString('tr-TR')}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Personel</th>
                      <th className="py-2.5 px-3">Rol</th>
                      <th className="py-2.5 px-3 text-right">Özel Fiyat</th>
                      <th className="py-2.5 px-3 text-center">Toplam</th>
                      <th className="py-2.5 px-3 text-center text-rose-400">İptal</th>
                      <th className="py-2.5 px-3 text-center text-sky-400">Geçerli</th>
                      <th className="py-2.5 px-3 text-right">Brüt Tutar</th>
                      <th className="py-2.5 px-3 text-right text-amber-400">Kesilen Avans</th>
                      <th className="py-2.5 px-3 text-right text-emerald-400">NET HAKEDİŞ</th>
                      <th className="py-2.5 px-3 text-center">Ödeme</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {projectAssigned.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-6 text-center text-slate-500">
                          Bu projeye henüz personel atanmadı. Yukarıdaki <strong>"+ Personel Ata"</strong> butonunu kullanarak personel ekleyebilirsiniz.
                        </td>
                      </tr>
                    ) : (
                      projectAssigned.map(pp => {
                        const settlement = projectSettlements.find(s => s.personnelId === pp.personnelId);
                        const netAdv = getPersonnelNetAdvance(project.id, pp.personnelId);

                        return (
                          <tr key={pp.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-white">
                              {pp.personnelName}
                            </td>
                            <td className="py-2.5 px-3 uppercase text-[10px] font-semibold text-slate-400">
                              {pp.assignedRole}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-sky-400">
                              ₺{pp.customUnitPrice}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              {settlement?.totalSurveys ?? '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-rose-400">
                              {settlement?.invalidSurveys ?? '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-sky-300 bg-sky-500/5">
                              {settlement?.validSurveys ?? '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              {settlement ? `₺${settlement.grossAmount.toLocaleString('tr-TR')}` : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                              {netAdv > 0 ? `− ₺${netAdv.toLocaleString('tr-TR')}` : '₺0'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-400 bg-emerald-500/5">
                              {settlement ? `₺${settlement.netPayable.toLocaleString('tr-TR')}` : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {settlement ? (
                                <button
                                  onClick={() => toggleSettlementPaid(settlement.id)}
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                    settlement.isPaid
                                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                      : 'bg-slate-800 text-slate-400 border-slate-700'
                                  }`}
                                >
                                  {settlement.isPaid ? 'ÖDENDİ' : 'BEKLİYOR'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSurveyPersonnelId(pp.personnelId);
                                    setIsSurveyModalOpen(true);
                                  }}
                                  className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30"
                                >
                                  Kapa
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: EXPENSES */}
        {activeTab === 'expenses' && (
          <div className="space-y-3">
            {projectExpenses.length === 0 ? (
              <p className="text-center py-6 text-slate-500 text-xs">Bu projeye ait kayıtlı masraf fişi bulunmuyor.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projectExpenses.map(exp => (
                  <div key={exp.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {exp.category}
                        </span>
                        <span className="text-[10px] text-slate-500">{exp.expenseDate}</span>
                      </div>
                      <p className="font-bold text-white">{exp.description}</p>
                      <p className="text-[11px] text-slate-400">SPV: {exp.spvName}</p>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="font-mono font-bold text-sm text-white">₺{exp.amount.toLocaleString('tr-TR')}</span>
                      {exp.receiptImageUrl && (
                        <button
                          onClick={() => setPreviewImage(exp.receiptImageUrl || null)}
                          className="text-[10px] text-sky-400 hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Fişi Gör
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: ADVANCES */}
        {activeTab === 'advances' && (
          <div className="space-y-3">
            {projectAdvances.length === 0 ? (
              <p className="text-center py-6 text-slate-500 text-xs">Bu projede henüz personele avans verilmedi.</p>
            ) : (
              <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800 overflow-hidden">
                {projectAdvances.map(adv => (
                  <div key={adv.id} className="p-3 bg-slate-950 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{adv.personnelName}</p>
                      <p className="text-[11px] text-slate-400">{adv.note || 'Avans'} • Veren: {adv.spvName}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-amber-400 text-sm">₺{adv.amount.toLocaleString('tr-TR')}</span>
                      <span className="text-[10px] uppercase text-slate-500 block">{adv.paymentMethod}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: NOTES & LOGS */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs whitespace-pre-line text-slate-300 leading-relaxed font-mono">
              {project.notes || 'Bu proje için henüz ek bir not girilmemiş.'}
            </div>
          </div>
        )}

        {/* ---------------- SUB-MODAL 1: ADVANCE ---------------- */}
        {isAdvanceModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-100 shadow-2xl">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-amber-400" />
                  <span>{project.code} - Avans Ekle</span>
                </h3>
                <button onClick={() => setIsAdvanceModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAdvanceSubmit} className="space-y-3 mt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Personel</label>
                  <select
                    value={advancePersonnelId}
                    onChange={(e) => setAdvancePersonnelId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="">-- Personel Seçin --</option>
                    {projectAssigned.map(pp => (
                      <option key={pp.personnelId} value={pp.personnelId}>{pp.personnelName}</option>
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-base font-mono font-bold text-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ödeme Yöntemi</label>
                  <select
                    value={advanceMethod}
                    onChange={(e) => setAdvanceMethod(e.target.value as 'nakit' | 'havale')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="nakit">Nakit (Elden)</option>
                    <option value="havale">Banka / Havale</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Not</label>
                  <input
                    type="text"
                    value={advanceNote}
                    onChange={(e) => setAdvanceNote(e.target.value)}
                    placeholder="Örn: Sahaya çıkış avansı"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow transition-all cursor-pointer"
                >
                  Avansı Kaydet & Bakiyeden Düş
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ---------------- SUB-MODAL 2: EXPENSE ---------------- */}
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-100 shadow-2xl">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-sky-400" />
                  <span>{project.code} - Masraf Ekle</span>
                </h3>
                <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleExpenseSubmit} className="space-y-3 mt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="yakit">Yakıt / Mazot</option>
                    <option value="yemek">Yemek</option>
                    <option value="konaklama">Konaklama</option>
                    <option value="kargo">Kargo</option>
                    <option value="diger">Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tutar (TL)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="Örn: 650"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-base font-mono font-bold text-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Açıklama</label>
                  <input
                    type="text"
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                    placeholder="Örn: Saha aracı yakıtı"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow transition-all cursor-pointer"
                >
                  Masrafı Projeye Kaydet
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ---------------- SUB-MODAL 3: SURVEY CLOSE ---------------- */}
        {isSurveyModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-100 shadow-2xl">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <span>Anket Kapama & Net Hakediş</span>
                </h3>
                <button onClick={() => setIsSurveyModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSurveySubmit} className="space-y-3 mt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Personel</label>
                  <select
                    value={surveyPersonnelId}
                    onChange={(e) => setSurveyPersonnelId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="">-- Personel Seçin --</option>
                    {projectAssigned.map(pp => (
                      <option key={pp.personnelId} value={pp.personnelId}>{pp.personnelName}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Toplam Yapılan</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={surveyTotal}
                      onChange={(e) => setSurveyTotal(e.target.value)}
                      placeholder="100"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-rose-400 mb-1">İptal / Geçersiz</label>
                    <input
                      type="number"
                      min="0"
                      value={surveyInvalid}
                      onChange={(e) => setSurveyInvalid(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono font-bold text-rose-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all cursor-pointer"
                >
                  Hakedişi Hesapla & Kapat
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ---------------- SUB-MODAL 4: ASSIGN PERSONNEL ---------------- */}
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-100 shadow-2xl">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Projeye Personel Ata</span>
                </h3>
                <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAssignSubmit} className="space-y-3 mt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Personel Havuzundan Seçin</label>
                  <select
                    value={assignPersonnelId}
                    onChange={(e) => {
                      setAssignPersonnelId(e.target.value);
                      const target = personnel.find(p => p.id === e.target.value);
                      if (target) setAssignOverridePrice(String(target.defaultUnitPrice));
                    }}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="">-- Personel Seçin --</option>
                    {unassignedPersonnel.map(p => (
                      <option key={p.id} value={p.id}>{p.fullName} ({p.defaultRole})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-sky-400 mb-1">Özel Fiyat Ezme (Override - TL)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={assignOverridePrice}
                    onChange={(e) => setAssignOverridePrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-sky-500/50 text-base font-mono font-bold text-sky-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Bu personelin hakedişi bu fiyattan hesaplanır.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Günlük Yemek Bedeli (TL)</label>
                  <input
                    type="number"
                    min="0"
                    value={assignFoodAllowance}
                    onChange={(e) => setAssignFoodAllowance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition-all cursor-pointer"
                >
                  Projeye Personeli Ekle
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ---------------- SUB-MODAL 5: NOTE ---------------- */}
        {isNoteModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-100 shadow-2xl">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <StickyNote className="w-4 h-4 text-sky-400" />
                  <span>Saha Notu / Güncelleme</span>
                </h3>
                <button onClick={() => setIsNoteModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleNoteSubmit} className="space-y-3 mt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Not Metni</label>
                  <textarea
                    rows={4}
                    required
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Saha operasyonu, izinler veya müşteri ile ilgili not..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow transition-all cursor-pointer"
                >
                  Notu Kaydet
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Receipt Image Preview Modal */}
        {previewImage && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="relative max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl">
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-950/80 text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="rounded-xl overflow-hidden mt-2">
                <img src={previewImage} alt="Fiş" className="w-full h-auto object-contain max-h-[60vh]" />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
