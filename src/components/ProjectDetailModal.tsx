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
  Plus,
  Edit3,
  PhoneCall,
  ClipboardList,
  MapPin,
  UserCheck,
  XCircle,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';
import { Project, ExpenseCategory, Personnel, DailyFieldReport, DailyFieldWorker, FieldStatus, PhoneControlRecord } from '@/types';
import EditProjectModal from './EditProjectModal';

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
    dailyReports,
    phoneControlRecords,
    addExpense, 
    addAdvance, 
    closeSurveysAndCalculateSettlement, 
    toggleSettlementPaid, 
    getPersonnelNetAdvance,
    updateProject,
    addProjectNote,
    addDailyReport,
    deleteDailyReport,
    addPhoneControlRecord,
    deletePhoneControlRecord
  } = useApp();

  const [activeTab, setActiveTab] = useState<'personnel' | 'daily_reports' | 'phone_control' | 'expenses' | 'advances' | 'notes'>('personnel');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Action Modals within Project
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isDailyReportModalOpen, setIsDailyReportModalOpen] = useState(false);
  const [isPhoneControlModalOpen, setIsPhoneControlModalOpen] = useState(false);
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

  // 4. Note Form
  const [newNoteText, setNewNoteText] = useState('');

  // 6. Daily Field Report Form
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportLocations, setReportLocations] = useState('');
  const [reportStatus, setReportStatus] = useState<FieldStatus>('started');
  const [reportStatusReason, setReportStatusReason] = useState('');
  const [reportActualStartDate, setReportActualStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportNotes, setReportNotes] = useState('');
  const [reportWorkers, setReportWorkers] = useState<DailyFieldWorker[]>([
    {
      id: 'rw-1',
      personnelName: '',
      onBehalfOf: '',
      dailyWage: 1000,
      surveysCompleted: 0,
      role: 'Anketör',
      notes: ''
    }
  ]);

  // 7. Phone Control Form
  const [tkControlDate, setTkControlDate] = useState(new Date().toISOString().split('T')[0]);
  const [tkControllerName, setTkControllerName] = useState('');
  const [tkDailyWage, setTkDailyWage] = useState<number>(1000);
  const [tkTotalCalled, setTkTotalCalled] = useState('80');
  const [tkTotalApproved, setTkTotalApproved] = useState('72');
  const [tkTotalRejected, setTkTotalRejected] = useState('4');
  const [tkTotalUnreachable, setTkTotalUnreachable] = useState('4');
  const [tkNotes, setTkNotes] = useState('');

  if (!isOpen || !project) return null;

  const isModelA = project.businessModel === 'model_a_macro';

  // Filtered data for this specific project
  const projectAssigned = projectPersonnel.filter(pp => pp.projectId === project.id);
  const projectExpenses = expenses.filter(e => e.projectId === project.id);
  const projectAdvances = advances.filter(a => a.projectId === project.id);
  const projectSettlements = settlements.filter(s => s.projectId === project.id);
  const projectDailyReports = dailyReports.filter(r => r.projectId === project.id);
  const projectPhoneControls = phoneControlRecords.filter(p => p.projectId === project.id);
  const projectInvoice = clientInvoices.find(inv => inv.projectId === project.id);

  // Aggregated totals
  const totalProjectExpenses = projectExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalProjectAdvances = projectAdvances.reduce((sum, a) => sum + Number(a.amount), 0);
  const totalProjectGrossHakedis = projectSettlements.reduce((sum, s) => sum + Number(s.grossAmount), 0);
  const totalProjectNetPayable = projectSettlements.reduce((sum, s) => sum + Number(s.netPayable), 0);
  const totalValidSurveysDone = projectSettlements.reduce((sum, s) => sum + Number(s.validSurveys), 0);
  const totalProjectFieldWages = projectDailyReports.reduce((sum, r) => sum + Number(r.totalDailyWage || 0), 0);
  const totalProjectTkCalls = projectPhoneControls.reduce((sum, p) => sum + Number(p.totalCalled || 0), 0);
  const totalProjectTkApproved = projectPhoneControls.reduce((sum, p) => sum + Number(p.totalApproved || 0), 0);
  const totalProjectTkCost = projectPhoneControls.reduce((sum, p) => sum + Number(p.dailyWage || 0), 0);

  // Active personnel pool (Global personnel)
  const activePersonnel = personnel.filter(p => !p.isBlacklisted);

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

  // Submit Note
  // Submit Note
  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    addProjectNote(project.id, newNoteText.trim());
    setIsNoteModalOpen(false);
    setNewNoteText('');
  };

  // Submit Daily Field Report for this Project
  const handleDailyReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validWorkers = reportWorkers.filter(w => w.personnelName.trim() !== '');
    const totalWage = validWorkers.reduce((sum, w) => sum + Number(w.dailyWage || 0), 0);
    const totalSurveys = validWorkers.reduce((sum, w) => sum + Number(w.surveysCompleted || 0), 0);

    await addDailyReport({
      projectId: project.id,
      projectCode: project.code,
      projectTitle: project.title,
      reportDate,
      locations: reportLocations,
      status: reportStatus,
      statusReason: reportStatusReason,
      actualStartDate: reportActualStartDate,
      workers: validWorkers,
      totalDailyWage: totalWage,
      totalDailySurveys: totalSurveys,
      notes: reportNotes
    });

    setIsDailyReportModalOpen(false);
    setReportLocations('');
    setReportStatusReason('');
    setReportNotes('');
  };

  // Submit Phone Control for this Project
  const handlePhoneControlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tkControllerName.trim()) return;

    const called = Number(tkTotalCalled || 0);
    const approved = Number(tkTotalApproved || 0);
    const rejected = Number(tkTotalRejected || 0);
    const unreachable = Number(tkTotalUnreachable || 0);
    const rate = called > 0 ? Math.round((approved / called) * 100) : 0;

    await addPhoneControlRecord({
      projectId: project.id,
      projectCode: project.code,
      projectTitle: project.title,
      controllerName: tkControllerName.trim(),
      controlDate: tkControlDate,
      dailyWage: Number(tkDailyWage),
      totalCalled: called,
      totalApproved: approved,
      totalRejected: rejected,
      totalUnreachable: unreachable,
      approvalRate: rate,
      notes: tkNotes
    });

    setIsPhoneControlModalOpen(false);
    setTkNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-5xl bg-white border border-gray-200 rounded-3xl shadow-2xl p-5 sm:p-7 my-6 text-gray-900 flex flex-col max-h-[92vh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-200 gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {project.code}
              </span>

              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                project.projectType === 'nokta'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}>
                {project.projectType === 'nokta' 
                  ? 'Nokta Projesi' 
                  : project.projectType === 'saha' 
                  ? 'Saha Araştırması' 
                  : project.projectType === 'studyo' 
                  ? 'Stüdyo / Odak' 
                  : project.projectType === 'gizli_musteri' 
                  ? 'Gizli Müşteri' 
                  : 'Genel Proje'}
              </span>

              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {project.status === 'active' ? 'Aktif Proje' : project.status === 'completed' ? 'Tamamlandı' : 'Taslak'}
              </span>
            </div>

            <h1 className="text-xl font-black text-gray-900 tracking-tight">{project.title}</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Ana Müşteri: <strong className="text-gray-800">{project.clientName}</strong> • {project.startDate} / {project.endDate}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-all border border-gray-200 cursor-pointer"
              title="Proje adı, hedefi, birim fiyatları veya illerini düzenle"
            >
              <Edit3 className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Projeyi Düzenle</span>
            </button>

            <button
              onClick={handleExportProjectSheet}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-all border border-gray-200 cursor-pointer"
              title="Bu projenin detaylı Excel tablosunu indir"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Proje Raporu (Excel)</span>
            </button>

            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-4">
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Hedef Anket Sayısı</span>
            <span className="text-lg font-black font-mono text-gray-900">{project.targetSurveys} <span className="text-xs font-normal text-gray-400">Anket</span></span>
            <span className="text-[10px] text-gray-400 block">Birim: ₺{project.clientUnitPrice}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Tamamlanan / Geçerli</span>
            <span className="text-lg font-black font-mono text-sky-400">{totalValidSurveysDone} <span className="text-xs font-normal text-gray-400">/ {project.targetSurveys}</span></span>
            <span className="text-[10px] text-gray-400 block">%{Math.min((totalValidSurveysDone / (project.targetSurveys || 1)) * 100, 100).toFixed(0)} Tamamlanma</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Saha Rapor & Yevmiye</span>
            <span className="text-lg font-black font-mono text-emerald-400">{projectDailyReports.length} <span className="text-xs font-normal text-gray-400">Rapor</span></span>
            <span className="text-[10px] text-gray-400 block">₺{totalProjectFieldWages.toLocaleString('tr-TR')} Saha Yevmiyesi</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block">TK Kontrol & Onay</span>
            <span className="text-lg font-black font-mono text-indigo-400">{totalProjectTkApproved} <span className="text-xs font-normal text-gray-400">/ {totalProjectTkCalls} Okey</span></span>
            <span className="text-[10px] text-gray-400 block">₺{totalProjectTkCost.toLocaleString('tr-TR')} TK Maliyeti</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Masraf & Avans</span>
            <span className="text-lg font-black font-mono text-amber-400">₺{(totalProjectExpenses + totalProjectAdvances).toLocaleString('tr-TR')}</span>
            <span className="text-[10px] text-gray-400 block">₺{totalProjectExpenses} Masraf + ₺{totalProjectAdvances} Avans</span>
          </div>
        </div>

        {/* PROJE İÇİ HIZLI İŞLEM BUTONLARI */}
        <div className="p-3.5 rounded-2xl bg-white border border-gray-200 border border-gray-200 flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold text-gray-500 mr-1 flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-sky-400" />
            <span>İşlem Ekle:</span>
          </span>

          {/* 1. Saha Günlük Raporu Ekle */}
          <button
            onClick={() => {
              setReportDate(new Date().toISOString().split('T')[0]);
              setReportLocations('');
              setReportStatus('started');
              setReportStatusReason('');
              setReportNotes('');
              setIsDailyReportModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>+ Günlük Rapor Yaz</span>
          </button>

          {/* 2. TK Telefon Kontrol Kaydı Ekle */}
          <button
            onClick={() => {
              setTkControlDate(new Date().toISOString().split('T')[0]);
              setTkControllerName('');
              setTkDailyWage(1000);
              setTkTotalCalled('80');
              setTkTotalApproved('72');
              setTkTotalRejected('4');
              setTkNotes('');
              setIsPhoneControlModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>+ TK Kaydı Gir</span>
          </button>

          {/* 3. Avans Ver */}
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

          {/* 4. Masraf / Fiş Ekle */}
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 text-xs font-bold transition-all cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>+ Masraf / Fiş</span>
          </button>

          {/* 5. Anket Kapama & Hakediş */}
          <button
            onClick={() => {
              if (activePersonnel.length > 0) setSurveyPersonnelId(activePersonnel[0].id);
              setIsSurveyModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>+ Hakediş Kapa</span>
          </button>

          {/* 6. Not Ekle */}
          <button
            onClick={() => setIsNoteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 text-xs font-bold transition-all cursor-pointer"
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>+ Not Ekle</span>
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="flex border-b border-gray-200 space-x-2 mb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('personnel')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'personnel'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Saha Personeli & Hakedişler ({isModelA ? 'Taşeron' : activePersonnel.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('daily_reports')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'daily_reports'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Saha Günlük Raporları ({projectDailyReports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('phone_control')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'phone_control'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>TK Telefon Kontrol ({projectPhoneControls.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'expenses'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-gray-500 hover:text-gray-800'
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
                : 'border-transparent text-gray-500 hover:text-gray-800'
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
                : 'border-transparent text-gray-500 hover:text-gray-800'
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
                  <h3 className="text-sm font-bold text-indigo-300">İller Hakediş Özeti</h3>
                </div>
                <p className="text-gray-700">
                  Bu proje İller modeliyle yönetilmektedir. Kişi bazlı avans ve masraf tutulmaz.
                </p>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-white border border-gray-200">
                    <span className="text-gray-400 block text-[10px]">Taşeron Firma:</span>
                    <strong className="text-gray-900 text-sm">{project.subcontractorName}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-gray-200">
                    <span className="text-gray-400 block text-[10px]">Anket Başı Toplu Fiyat:</span>
                    <strong className="text-indigo-400 text-sm font-mono">₺{project.subcontractorUnitPrice}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-gray-200">
                    <span className="text-gray-400 block text-[10px]">Toplam Taşeron Hakedişi:</span>
                    <strong className="text-emerald-400 text-sm font-mono">₺{((project.targetSurveys) * (project.subcontractorUnitPrice || 0)).toLocaleString('tr-TR')}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-white text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-200">
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
                      <th className="py-2.5 px-3 text-center">İşlemi Yapan</th>
                      <th className="py-2.5 px-3 text-center">Ödeme</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/80">
                    {activePersonnel.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-6 text-center text-gray-400">
                          Sistemde kayıtlı aktif personel bulunmuyor. Personel Yönetimi bölümünden Excel ile veya formdan personel ekleyebilirsiniz.
                        </td>
                      </tr>
                    ) : (
                      activePersonnel.map(person => {
                        const settlement = projectSettlements.find(s => s.personnelId === person.id);
                        const netAdv = getPersonnelNetAdvance(project.id, person.id);
                        const unitPrice = person.defaultUnitPrice || project.defaultPersonnelRate || 180;

                        return (
                          <tr key={person.id} className="hover:bg-gray-100 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-gray-900">
                              <div>{person.fullName}</div>
                              <div className="text-[10px] text-gray-400 font-mono font-normal">
                                {person.identityNumber ? `TC: ${person.identityNumber}` : ''} {person.phone ? `• ${person.phone}` : ''}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 uppercase text-[10px] font-semibold text-gray-500">
                              {person.defaultRole}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-sky-400">
                              ₺{unitPrice}
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
                                <span className="inline-block px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px] font-semibold">
                                  {settlement.createdByName || 'Yönetici'}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {settlement ? (
                                <button
                                  onClick={() => toggleSettlementPaid(settlement.id)}
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                    settlement.isPaid
                                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                      : 'bg-gray-100 text-gray-500 border-gray-200'
                                  }`}
                                >
                                  {settlement.isPaid ? 'ÖDENDİ' : 'BEKLİYOR'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSurveyPersonnelId(person.id);
                                    setIsSurveyModalOpen(true);
                                  }}
                                  className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 font-semibold cursor-pointer"
                                >
                                  + Kapa
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

        {/* Tab 2: DAILY REPORTS */}
        {activeTab === 'daily_reports' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold">
                Bu projeye ait kaydedilmiş gün gün saha raporları ve anketör yevmiyeleri
              </span>
              <button
                onClick={() => {
                  setReportDate(new Date().toISOString().split('T')[0]);
                  setReportLocations('');
                  setReportStatus('started');
                  setReportStatusReason('');
                  setReportNotes('');
                  setIsDailyReportModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Günlük Rapor Yaz</span>
              </button>
            </div>

            {projectDailyReports.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white border border-gray-200 text-xs text-gray-400 space-y-2">
                <ClipboardList className="w-8 h-8 text-gray-500 mx-auto" />
                <p>Bu proje için henüz günlük saha raporu girilmedi.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projectDailyReports.map((rep) => (
                  <div key={rep.id} className="p-4 rounded-2xl bg-white border border-gray-200 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                          {rep.reportDate}
                        </span>
                        <span className="font-bold text-gray-900 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{rep.locations || 'Nokta belirtilmedi'}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          rep.status === 'started' || rep.status === 'ongoing' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : rep.status === 'delayed' 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          {rep.status === 'started' ? 'Saha Başladı' : rep.status === 'delayed' ? 'Gecikti/Başlayamadı' : rep.status === 'ongoing' ? 'Devam Ediyor' : rep.status}
                        </span>
                        <button
                          onClick={() => {
                            if (confirm('Bu günlük raporu silmek istediğinize emin misiniz?')) {
                              deleteDailyReport(rep.id);
                            }
                          }}
                          className="p-1 rounded text-gray-400 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {rep.statusReason && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                        <strong>Durum Notu:</strong> {rep.statusReason}
                      </div>
                    )}

                    {rep.notes && (
                      <p className="text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                        {rep.notes}
                      </p>
                    )}

                    {/* Workers list */}
                    {rep.workers && rep.workers.length > 0 && (
                      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                        <table className="w-full text-left text-[11px] text-gray-700">
                          <thead className="bg-white text-gray-500 uppercase text-[9px]">
                            <tr>
                              <th className="py-2 px-3">Anketör</th>
                              <th className="py-2 px-3">Adına Çalıştığı</th>
                              <th className="py-2 px-3 text-center">Anket</th>
                              <th className="py-2 px-3 text-right text-amber-400">Yevmiye</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200/50">
                            {rep.workers.map((w, idx) => (
                              <tr key={w.id || idx}>
                                <td className="py-1.5 px-3 font-bold text-gray-900">{w.personnelName}</td>
                                <td className="py-1.5 px-3 text-gray-500">
                                  {w.onBehalfOf ? `👉 ${w.onBehalfOf} adına` : '-'}
                                </td>
                                <td className="py-1.5 px-3 text-center font-mono font-bold text-sky-400">{w.surveysCompleted || 0}</td>
                                <td className="py-1.5 px-3 text-right font-mono font-bold text-amber-400">₺{w.dailyWage}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1">
                      <span>Raporu Giren: <strong>{rep.createdByName || 'SPV'}</strong></span>
                      <span className="font-mono font-bold text-amber-400 text-xs">
                        Günün Toplam Yevmiyesi: ₺{(rep.totalDailyWage || 0).toLocaleString('tr-TR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: PHONE CONTROL (TK) */}
        {activeTab === 'phone_control' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold">
                Bu projenin telefon kontrol kayıtları, okey alınan anket sayıları ve TK kontrolcü yevmiyeleri
              </span>
              <button
                onClick={() => {
                  setTkControlDate(new Date().toISOString().split('T')[0]);
                  setTkControllerName('');
                  setTkDailyWage(1000);
                  setTkTotalCalled('80');
                  setTkTotalApproved('72');
                  setTkTotalRejected('4');
                  setTkNotes('');
                  setIsPhoneControlModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ TK Kaydı Gir</span>
              </button>
            </div>

            {projectPhoneControls.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white border border-gray-200 text-xs text-gray-400 space-y-2">
                <PhoneCall className="w-8 h-8 text-gray-500 mx-auto" />
                <p>Bu proje için henüz telefon kontrol (TK) kaydı girilmedi.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-white text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3">Tarih</th>
                      <th className="py-2.5 px-3">TK Kontrolcüsü</th>
                      <th className="py-2.5 px-3 text-right text-amber-400">TK Günlük Ücreti</th>
                      <th className="py-2.5 px-3 text-center">Aranan</th>
                      <th className="py-2.5 px-3 text-center text-emerald-400 font-bold">Okey (Onay)</th>
                      <th className="py-2.5 px-3 text-center text-rose-400">Red / İptal</th>
                      <th className="py-2.5 px-3 text-center">Başarı Oranı</th>
                      <th className="py-2.5 px-3">Açıklama / Not</th>
                      <th className="py-2.5 px-3 text-center">Sil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/80 font-medium">
                    {projectPhoneControls.map(rec => (
                      <tr key={rec.id} className="hover:bg-gray-100 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-gray-500">{rec.controlDate}</td>
                        <td className="py-2.5 px-3 font-bold text-gray-900">{rec.controllerName}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                          ₺{Number(rec.dailyWage || 0).toLocaleString('tr-TR')}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-900">{rec.totalCalled}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-black text-emerald-400 bg-emerald-500/5">{rec.totalApproved}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-400">{rec.totalRejected}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-sky-400">%{rec.approvalRate || 0}</td>
                        <td className="py-2.5 px-3 text-gray-500 text-[11px] truncate max-w-[160px]" title={rec.notes}>{rec.notes || '-'}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              if (confirm('Bu TK kaydını silmek istediğinize emin misiniz?')) {
                                deletePhoneControlRecord(rec.id);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 1: PERSONNEL & SETTLEMENTS */}
        {activeTab === 'personnel' && (
          <div className="space-y-4">
            {isModelA ? (
              <div className="p-6 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-indigo-300">İller Hakediş Özeti</h3>
                </div>
                <p className="text-gray-700">
                  Bu proje İller modeliyle yönetilmektedir. Kişi bazlı avans ve masraf tutulmaz.
                </p>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-white border border-gray-200">
                    <span className="text-gray-400 block text-[10px]">Taşeron Firma:</span>
                    <strong className="text-gray-900 text-sm">{project.subcontractorName}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-gray-200">
                    <span className="text-gray-400 block text-[10px]">Anket Başı Toplu Fiyat:</span>
                    <strong className="text-indigo-400 text-sm font-mono">₺{project.subcontractorUnitPrice}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-gray-200">
                    <span className="text-gray-400 block text-[10px]">Toplam Taşeron Hakedişi:</span>
                    <strong className="text-emerald-400 text-sm font-mono">₺{((project.targetSurveys) * (project.subcontractorUnitPrice || 0)).toLocaleString('tr-TR')}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-white text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-200">
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
                      <th className="py-2.5 px-3 text-center">İşlemi Yapan</th>
                      <th className="py-2.5 px-3 text-center">Ödeme</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/80">
                    {projectAssigned.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-6 text-center text-gray-400">
                          Bu projeye henüz personel atanmadı. Yukarıdaki <strong>"+ Personel Ata"</strong> butonunu kullanarak personel ekleyebilirsiniz.
                        </td>
                      </tr>
                    ) : (
                      projectAssigned.map(pp => {
                        const settlement = projectSettlements.find(s => s.personnelId === pp.personnelId);
                        const netAdv = getPersonnelNetAdvance(project.id, pp.personnelId);

                        return (
                          <tr key={pp.id} className="hover:bg-gray-100 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-gray-900">
                              {pp.personnelName}
                            </td>
                            <td className="py-2.5 px-3 uppercase text-[10px] font-semibold text-gray-500">
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
                                <span className="inline-block px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px] font-semibold">
                                  {settlement.createdByName || 'Fatih Sakar'}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {settlement ? (
                                <button
                                  onClick={() => toggleSettlementPaid(settlement.id)}
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                    settlement.isPaid
                                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                      : 'bg-gray-100 text-gray-500 border-gray-200'
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
              <p className="text-center py-6 text-gray-400 text-xs">Bu projeye ait kayıtlı masraf fişi bulunmuyor.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projectExpenses.map(exp => (
                  <div key={exp.id} className="p-3.5 rounded-xl bg-white border border-gray-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          {exp.category}
                        </span>
                        <span className="text-[10px] text-gray-400">{exp.expenseDate}</span>
                      </div>
                      <p className="font-bold text-gray-900">{exp.description}</p>
                      <p className="text-[11px] text-emerald-400 mt-0.5">
                        İşlemi Yapan: <strong className="text-gray-900">{exp.spvName || 'Fatih Sakar'}</strong>
                      </p>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="font-mono font-bold text-sm text-gray-900">₺{exp.amount.toLocaleString('tr-TR')}</span>
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
              <p className="text-center py-6 text-gray-400 text-xs">Bu projede henüz personele avans verilmedi.</p>
            ) : (
              <div className="divide-y divide-gray-200/80 rounded-2xl border border-gray-200 overflow-hidden">
                {projectAdvances.map(adv => (
                  <div key={adv.id} className="p-3 bg-white flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-gray-900">{adv.personnelName}</p>
                      <p className="text-[11px] text-gray-500">
                        {adv.note || 'Avans'} • İşlemi Yapan: <strong className="text-amber-400">{adv.spvName || 'Fatih Sakar'}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-amber-400 text-sm">₺{adv.amount.toLocaleString('tr-TR')}</span>
                      <span className="text-[10px] uppercase text-gray-400 block">{adv.paymentMethod}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: NOTES & LOGS */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            
            {/* Quick Shift / Substitute Action Chips */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Hızlı Saha & Vardiya Şablonları (Tek Tıkla Ekle):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Ahmet adına Ali çalıştı',
                  "Ahmet'in yerine Ayşe gözlemcilik yaptı",
                  'Saha ekibine 2 ek anketör takviyesi yapıldı',
                  'Nokta kontrolü yapıldı, anketler eksiksiz devam ediyor',
                  'Hava muhalefeti sebebiyle çalışma 1 saat erken sonlandırıldı'
                ].map((template, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewNoteText(template)}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-white hover:bg-gray-100 text-gray-700 hover:text-sky-300 border border-gray-200 transition-all cursor-pointer"
                  >
                    + {template}
                  </button>
                ))}
              </div>
            </div>

            {/* Inline Fast Note Addition Form */}
            <form onSubmit={handleNoteSubmit} className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder={`${currentUser?.fullName || 'Fatih Sakar'} olarak sahaya vardiya veya günlük not ekleyin...`}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-gray-900 font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
                >
                  + Notu Kaydet
                </button>
              </div>
            </form>

            {/* Note History List */}
            {project.notesList && project.notesList.length > 0 ? (
              <div className="space-y-2.5">
                {project.notesList.map((n) => (
                  <div key={n.id} className="p-3.5 rounded-2xl bg-white border border-gray-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold text-[11px]">
                        {n.authorName} {n.authorRole === 'admin' ? '(Müdür)' : '(SPV)'}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(n.createdAt).toLocaleDateString('tr-TR')} {new Date(n.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-gray-800 text-xs leading-relaxed font-sans">{n.text}</p>
                  </div>
                ))}
              </div>
            ) : project.notes ? (
              <div className="p-4 rounded-2xl bg-white border border-gray-200 text-xs whitespace-pre-line text-gray-700 leading-relaxed font-mono">
                {project.notes}
              </div>
            ) : (
              <p className="text-center py-6 text-gray-400 text-xs">Bu proje için henüz saha notu girilmemiş.</p>
            )}
          </div>
        )}

        {/* ---------------- SUB-MODAL 1: ADVANCE ---------------- */}
        {isAdvanceModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-5 text-gray-900 shadow-2xl">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-amber-400" />
                  <span>{project.code} - Avans Ekle</span>
                </h3>
                <button onClick={() => setIsAdvanceModalOpen(false)} className="text-gray-500 hover:text-gray-900">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAdvanceSubmit} className="space-y-3 mt-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Personel</label>
                  <select
                    value={advancePersonnelId}
                    onChange={(e) => setAdvancePersonnelId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                  >
                    <option value="">-- Personel Seçin --</option>
                    {activePersonnel.map(p => (
                      <option key={p.id} value={p.id}>{p.fullName} ({p.phone || p.identityNumber || p.defaultRole})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Avans Tutarı (TL)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    placeholder="Örn: 500"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-base font-mono font-bold text-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ödeme Yöntemi</label>
                  <select
                    value={advanceMethod}
                    onChange={(e) => setAdvanceMethod(e.target.value as 'nakit' | 'havale')}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                  >
                    <option value="nakit">Nakit (Elden)</option>
                    <option value="havale">Banka / Havale</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Not</label>
                  <input
                    type="text"
                    value={advanceNote}
                    onChange={(e) => setAdvanceNote(e.target.value)}
                    placeholder="Örn: Sahaya çıkış avansı"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-500 font-black text-xs shadow transition-all cursor-pointer"
                >
                  Avansı Kaydet & Bakiyeden Düş
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ---------------- SUB-MODAL 2: EXPENSE ---------------- */}
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-5 text-gray-900 shadow-2xl">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-sky-400" />
                  <span>{project.code} - Masraf Ekle</span>
                </h3>
                <button onClick={() => setIsExpenseModalOpen(false)} className="text-gray-500 hover:text-gray-900">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleExpenseSubmit} className="space-y-3 mt-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Kategori</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                  >
                    <option value="yakit">Yakıt / Mazot</option>
                    <option value="yemek">Yemek</option>
                    <option value="konaklama">Konaklama</option>
                    <option value="kargo">Kargo</option>
                    <option value="diger">Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tutar (TL)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="Örn: 650"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-base font-mono font-bold text-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Açıklama</label>
                  <input
                    type="text"
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                    placeholder="Örn: Saha aracı yakıtı"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-gray-900 font-bold text-xs shadow transition-all cursor-pointer"
                >
                  Masrafı Projeye Kaydet
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ---------------- SUB-MODAL 3: SURVEY CLOSE ---------------- */}
        {isSurveyModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-5 text-gray-900 shadow-2xl">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <span>Anket Kapama & Net Hakediş</span>
                </h3>
                <button onClick={() => setIsSurveyModalOpen(false)} className="text-gray-500 hover:text-gray-900">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSurveySubmit} className="space-y-3 mt-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Personel</label>
                  <select
                    value={surveyPersonnelId}
                    onChange={(e) => setSurveyPersonnelId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                  >
                    <option value="">-- Personel Seçin --</option>
                    {activePersonnel.map(p => (
                      <option key={p.id} value={p.id}>{p.fullName} ({p.phone || p.defaultRole})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Toplam Yapılan</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={surveyTotal}
                      onChange={(e) => setSurveyTotal(e.target.value)}
                      placeholder="100"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-mono font-bold text-gray-900"
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
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-mono font-bold text-rose-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-gray-900 font-bold text-xs shadow transition-all cursor-pointer"
                >
                  Hakedişi Hesapla & Kapat
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ---------------- SUB-MODAL 5: NOTE ---------------- */}
        {isNoteModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-5 text-gray-900 shadow-2xl">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <StickyNote className="w-4 h-4 text-sky-400" />
                  <span>Saha Notu / Güncelleme</span>
                </h3>
                <button onClick={() => setIsNoteModalOpen(false)} className="text-gray-500 hover:text-gray-900">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleNoteSubmit} className="space-y-3 mt-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Not Metni</label>
                  <textarea
                    rows={4}
                    required
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Saha operasyonu, izinler veya müşteri ile ilgili not..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-gray-900 font-bold text-xs shadow transition-all cursor-pointer"
                >
                  Notu Kaydet
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ---------------- SUB-MODAL 6: DAILY REPORT ---------------- */}
        {isDailyReportModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 text-gray-900 shadow-2xl space-y-4 my-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-sky-400" />
                  <span>{project.code} - Saha Günlük Raporu Yaz</span>
                </h3>
                <button onClick={() => setIsDailyReportModalOpen(false)} className="text-gray-500 hover:text-gray-900">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleDailyReportSubmit} className="space-y-3 mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Rapor Tarihi</label>
                    <input
                      type="date"
                      required
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Saha Durumu</label>
                    <select
                      value={reportStatus}
                      onChange={(e) => setReportStatus(e.target.value as FieldStatus)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                    >
                      <option value="started">Saha Başladı / Aktif</option>
                      <option value="ongoing">Saha Devam Ediyor</option>
                      <option value="delayed">Saha Başlayamadı / Gecikti</option>
                      <option value="paused">Hava Muhalefeti / Durduruldu</option>
                      <option value="completed">Saha Tamamlandı</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Anket Yapılan Noktalar & Lokasyonlar <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reportLocations}
                    onChange={(e) => setReportLocations(e.target.value)}
                    placeholder="Örn: Kadıköy Rıhtım, Moda Sahil, Beşiktaş Çarşı"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Gecikme / Başlama Durum Açıklaması (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={reportStatusReason}
                    onChange={(e) => setReportStatusReason(e.target.value)}
                    placeholder="Örn: Yağış sebebiyle saha 13:00'te başlayabildi"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                  />
                </div>

                {/* Workers in this project */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-900">Çalışan Anketörler & Yevmiyeler</label>
                    <button
                      type="button"
                      onClick={() => setReportWorkers(prev => [
                        ...prev,
                        {
                          id: 'rw-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
                          personnelName: '',
                          onBehalfOf: '',
                          dailyWage: 1000,
                          surveysCompleted: 0,
                          role: 'Anketör',
                          notes: ''
                        }
                      ])}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 cursor-pointer"
                    >
                      + Anketör Ekle
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {reportWorkers.map((w) => (
                      <div key={w.id} className="p-2.5 rounded-xl bg-white border border-gray-200 grid grid-cols-12 gap-2 items-center text-xs">
                        <div className="col-span-4">
                          <input
                            type="text"
                            required
                            value={w.personnelName}
                            onChange={(e) => setReportWorkers(prev => prev.map(item => item.id === w.id ? { ...item, personnelName: e.target.value } : item))}
                            placeholder="Anketör adı"
                            className="w-full px-2 py-1 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 font-bold"
                            list="project-personnel-list"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={w.onBehalfOf || ''}
                            onChange={(e) => setReportWorkers(prev => prev.map(item => item.id === w.id ? { ...item, onBehalfOf: e.target.value } : item))}
                            placeholder="Şunun adına..."
                            className="w-full px-2 py-1 rounded-lg bg-white border border-gray-200 text-xs text-indigo-300"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            required
                            min="0"
                            step="50"
                            value={w.dailyWage}
                            onChange={(e) => setReportWorkers(prev => prev.map(item => item.id === w.id ? { ...item, dailyWage: Number(e.target.value) } : item))}
                            placeholder="1000"
                            className="w-full px-2 py-1 rounded-lg bg-white border border-gray-200 text-xs text-amber-400 font-mono font-bold"
                          />
                        </div>
                        <div className="col-span-2 flex items-center justify-between">
                          <input
                            type="number"
                            min="0"
                            value={w.surveysCompleted || 0}
                            onChange={(e) => setReportWorkers(prev => prev.map(item => item.id === w.id ? { ...item, surveysCompleted: Number(e.target.value) } : item))}
                            placeholder="Anket"
                            className="w-full px-1.5 py-1 rounded-lg bg-white border border-gray-200 text-xs text-sky-300 font-mono text-center"
                          />
                          {reportWorkers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setReportWorkers(prev => prev.filter(item => item.id !== w.id))}
                              className="p-1 text-gray-400 hover:text-rose-400 ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <datalist id="project-personnel-list">
                    {projectAssigned.map(pp => (
                      <option key={pp.id} value={pp.personnelName} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Günün Notu</label>
                  <textarea
                    rows={2}
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    placeholder="Saha notları, yapılan çalışmalar..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-gray-900 font-bold text-xs shadow transition-all cursor-pointer"
                >
                  Saha Günlük Raporunu Projeye Kaydet
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ---------------- SUB-MODAL 7: PHONE CONTROL (TK) ---------------- */}
        {isPhoneControlModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-5 text-gray-900 shadow-2xl space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <PhoneCall className="w-4 h-4 text-indigo-400" />
                  <span>{project.code} - TK Arama Kaydı Gir</span>
                </h3>
                <button onClick={() => setIsPhoneControlModalOpen(false)} className="text-gray-500 hover:text-gray-900">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePhoneControlSubmit} className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Kontrol Tarihi</label>
                    <input
                      type="date"
                      required
                      value={tkControlDate}
                      onChange={(e) => setTkControlDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">TK Kontrolcüsü</label>
                    <input
                      type="text"
                      required
                      value={tkControllerName}
                      onChange={(e) => setTkControllerName(e.target.value)}
                      placeholder="Örn: Ayşe TK"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                    />
                  </div>
                </div>

                {/* TK Wage selection */}
                <div>
                  <label className="block text-xs font-semibold text-amber-400 mb-1">TK Günlük Ücreti (TL)</label>
                  <div className="flex gap-1.5 mb-1.5">
                    {[1000, 1250, 1500, 2000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTkDailyWage(amt)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all ${
                          tkDailyWage === amt ? 'bg-amber-500 text-gray-500' : 'bg-white text-gray-700 border border-gray-200'
                        }`}
                      >
                        ₺{amt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    required
                    min="0"
                    value={tkDailyWage}
                    onChange={(e) => setTkDailyWage(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-mono font-bold text-amber-400"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Aranan</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={tkTotalCalled}
                      onChange={(e) => setTkTotalCalled(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-mono font-bold text-gray-900 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-400 mb-0.5">Okey (Onay)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={tkTotalApproved}
                      onChange={(e) => setTkTotalApproved(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl bg-white border border-emerald-500/50 text-xs font-mono font-bold text-emerald-400 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-rose-400 mb-0.5">Red / İptal</label>
                    <input
                      type="number"
                      min="0"
                      value={tkTotalRejected}
                      onChange={(e) => setTkTotalRejected(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl bg-white border border-rose-500/50 text-xs font-mono font-bold text-rose-400 text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Kontrol Notu</label>
                  <input
                    type="text"
                    value={tkNotes}
                    onChange={(e) => setTkNotes(e.target.value)}
                    placeholder="Örn: 2 nolu anketörde tutarsızlık var"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-gray-900 font-bold text-xs shadow transition-all cursor-pointer"
                >
                  TK Kaydını Projeye Ekle
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Receipt Image Preview Modal */}
        {previewImage && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="relative max-w-md w-full bg-white border border-gray-200 rounded-2xl p-4 shadow-2xl">
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-50 text-gray-900"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="rounded-xl overflow-hidden mt-2">
                <img src={previewImage} alt="Fiş" className="w-full h-auto object-contain max-h-[60vh]" />
              </div>
            </div>
          </div>
        )}

        {/* Edit Project Modal */}
        <EditProjectModal
          project={project}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />

      </div>
    </div>
  );
}




