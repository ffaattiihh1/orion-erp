'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Briefcase, 
  Plus, 
  Calculator, 
  FileSpreadsheet, 
  Users, 
  TrendingUp, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowRight,
  PlusCircle,
  X,
  Banknote,
  Receipt,
  MapPin,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  Filter,
  Archive
} from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';
import { Project, BusinessModel, ProjectType, CityPricing } from '@/types';
import ProjectDetailModal from './ProjectDetailModal';
import EditProjectModal from './EditProjectModal';
import SafeDeleteProjectModal from './SafeDeleteProjectModal';

interface ProjectsViewProps {
  onOpenFeasibility: () => void;
}

export default function ProjectsView({ onOpenFeasibility }: ProjectsViewProps) {
  const { 
    currentUser, 
    projects, 
    addProject, 
    settlements, 
    advances, 
    expenses, 
    toggleArchiveProject 
  } = useApp();

  const [filterModel, setFilterModel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [filterArchive, setFilterArchive] = useState<string>('active');

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  // New Project Modal State (For SPV & Admin)
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('ORION-2026-' + Math.floor(100 + Math.random() * 900));
  const [newTitle, setNewTitle] = useState('');
  const [newClient, setNewClient] = useState('Ipsos Türkiye');
  const [newType, setNewType] = useState<ProjectType>('saha');
  const [newTargetSurveys, setNewTargetSurveys] = useState('500');
  const [newUnitPrice, setNewUnitPrice] = useState('320');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEndDate, setNewEndDate] = useState('');
  
  // City pricing configuration state
  const [cityPricingList, setCityPricingList] = useState<CityPricing[]>([
    { city: 'Ankara', unitPrice: 320, targetSurveys: 500 }
  ]);

  const isAdmin = currentUser?.role === 'admin';

  const handleAddCityRow = () => {
    setCityPricingList(prev => [...prev, { city: '', unitPrice: Number(newUnitPrice) || 320, targetSurveys: 100 }]);
  };

  const handleRemoveCityRow = (index: number) => {
    setCityPricingList(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleCityChange = (index: number, field: keyof CityPricing, value: string | number) => {
    setCityPricingList(prev => prev.map((cp, idx) => {
      if (idx !== index) return cp;
      return {
        ...cp,
        [field]: field === 'city' ? value : Number(value) || 0
      };
    }));
  };

  // Filtered list based on Model, Status, Period and Archive
  const filteredProjects = projects.filter(p => {
    // Archive visibility filter
    if (filterArchive === 'active' && p.isArchived) return false;
    if (filterArchive === 'archived' && !p.isArchived) return false;

    // Business model filter
    if (filterModel !== 'all' && p.businessModel !== filterModel) return false;

    // Status filter
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;

    // Period filter (Based on startDate or createdAt)
    if (filterPeriod !== 'all') {
      const dateStr = p.startDate || p.createdAt;
      if (dateStr) {
        const pDate = new Date(dateStr).getTime();
        const now = Date.now();
        const daysDiff = (now - pDate) / (1000 * 60 * 60 * 24);

        if (filterPeriod === '1m' && daysDiff > 30) return false;
        if (filterPeriod === '3m' && daysDiff > 90) return false;
        if (filterPeriod === '6m' && daysDiff > 180) return false;
        if (filterPeriod === '1y' && daysDiff > 365) return false;
      }
    }

    return true;
  });

  // KPI Calculations dynamically calculated for the filtered period and projects
  const filteredProjectIds = new Set(filteredProjects.map(p => p.id));

  const totalActiveBudget = filteredProjects
    .filter(p => p.status === 'active')
    .reduce((sum, p) => sum + (p.clientTotalBudget || 0), 0);

  const totalCompletedSurveys = filteredProjects.reduce((sum, p) => sum + (p.completedSurveys || 0), 0);
  const totalTargetSurveys = filteredProjects.reduce((sum, p) => sum + (p.targetSurveys || 0), 0);

  const filteredSettlements = settlements.filter(s => filteredProjectIds.has(s.projectId));
  const filteredAdvances = advances.filter(a => filteredProjectIds.has(a.projectId));
  const filteredExpenses = expenses.filter(e => filteredProjectIds.has(e.projectId));

  const totalPersonnelGrossPay = filteredSettlements.reduce((sum, s) => sum + (s.grossAmount || 0), 0);
  const totalAdvancesIssued = filteredAdvances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const totalFieldExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // Excel Export
  const handleExport = () => {
    const exportData = filteredProjects.map(p => ({
      'Proje Kodu': p.code,
      'Proje Başlığı': p.title,
      'Müşteri': p.clientName,
      'Proje Tipi': p.projectType.toUpperCase(),
      'Durum': p.status === 'active' ? 'Aktif' : p.status === 'feasibility' ? 'Fizibilite' : 'Tamamlandı',
      'Arşiv Durumu': p.isArchived ? 'Arşivde / Gizli' : 'Aktif',
      'İş Modeli': p.businessModel === 'model_a_macro' ? 'İller' : 'İstanbul Ekip',
      'Hedef Anket': p.targetSurveys,
      'Tamamlanan Anket': p.completedSurveys || 0,
      'Personele Birim Fiyat (TL)': p.defaultPersonnelRate || p.clientUnitPrice,
      'Çalışılan İller': p.cities?.join(', ') || p.cityPricing?.map(c => c.city).join(', ') || '-',
      ...(isAdmin ? {
        'Toplam Müşteri Bütçesi (TL)': p.clientTotalBudget,
        'Kâr Marjı (%)': p.simulatedMarginPercent ? `%${p.simulatedMarginPercent}` : '-'
      } : {}),
      'Sorumlu SPV / Ekip': p.businessModel === 'model_a_macro' ? p.subcontractorName : p.assignedSpvName,
      'Başlangıç Tarihi': p.startDate,
      'Bitiş Tarihi': p.endDate
    }));

    exportToExcel(exportData, 'Orion_Proje_Listesi', 'Projeler');
  };

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newClient) return;

    const count = Number(newTargetSurveys || 500);
    const price = Number(newUnitPrice || 320);
    const end = newEndDate || new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0];

    // Filter valid cities
    const validCityPricings = cityPricingList.filter(cp => cp.city && cp.city.trim().length > 0);
    const validCityNames = validCityPricings.map(cp => cp.city.trim());

    addProject({
      code: newCode || ('ORION-' + Date.now().toString().slice(-4)),
      clientName: newClient,
      title: newTitle,
      projectType: newType,
      businessModel: 'model_b_micro',
      status: 'active',
      startDate: newStartDate,
      endDate: end,
      targetSurveys: count,
      clientUnitPrice: price,
      clientTotalBudget: count * price,
      cityPricing: validCityPricings.length > 0 ? validCityPricings : [{ city: 'Ankara', unitPrice: price, targetSurveys: count }],
      cities: validCityNames.length > 0 ? validCityNames : ['Ankara'],
      assignedSpvId: currentUser?.id,
      assignedSpvName: currentUser?.fullName,
      dailyOverheadRate: 2000,
      defaultPersonnelRate: price,
      simulatedMarginPercent: 30,
      notes: 'Saha SPV tarafından tanımlandı.'
    });

    setIsNewProjectModalOpen(false);
    setNewTitle('');
    setNewCode('ORION-2026-' + Math.floor(100 + Math.random() * 900));
    setCityPricingList([{ city: 'Ankara', unitPrice: 320, targetSurveys: 500 }]);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & KPI Metrics (Admin vs SPV) */}
      {isAdmin ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <div className="p-3 sm:p-4.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Dönem Cirosu</span>
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 flex-shrink-0" />
            </div>
            <p className="text-base sm:text-2xl font-black text-white font-mono">
              ₺{totalActiveBudget.toLocaleString('tr-TR')}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">
              {filterPeriod === 'all' ? 'Tüm aktif portföy' : `Seçili dönem (${filterPeriod.toUpperCase()})`}
            </p>
          </div>

          <div className="p-3 sm:p-4.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Saha İlerlemesi</span>
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 flex-shrink-0" />
            </div>
            <p className="text-base sm:text-2xl font-black text-white font-mono">
              {totalCompletedSurveys} <span className="text-xs font-normal text-slate-500">/ {totalTargetSurveys}</span>
            </p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className="bg-sky-500 h-full rounded-full"
                style={{ width: `${Math.min((totalCompletedSurveys / (totalTargetSurveys || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 sm:p-4.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">İller Projeleri</span>
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 flex-shrink-0" />
            </div>
            <p className="text-base sm:text-2xl font-black text-indigo-400 font-mono">
              {filteredProjects.filter(p => p.businessModel === 'model_a_macro').length} Proje
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">Dış iller / Taşeron projeleri</p>
          </div>

          <div className="p-3 sm:p-4.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">İstanbul Ekip</span>
              <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 flex-shrink-0" />
            </div>
            <p className="text-base sm:text-2xl font-black text-sky-400 font-mono">
              {filteredProjects.filter(p => p.businessModel === 'model_b_micro').length} Proje
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">İstanbul ekip operasyonu</p>
          </div>
        </div>
      ) : (
        /* SPV Rich KPI Header */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <div className="p-3 sm:p-4.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Saha İlerlemesi</span>
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 flex-shrink-0" />
            </div>
            <p className="text-base sm:text-2xl font-black text-white font-mono">
              {totalCompletedSurveys} <span className="text-xs font-normal text-slate-500">/ {totalTargetSurveys}</span>
            </p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className="bg-sky-500 h-full rounded-full"
                style={{ width: `${Math.min((totalCompletedSurveys / (totalTargetSurveys || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 sm:p-4.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Personele Hakediş</span>
              <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 flex-shrink-0" />
            </div>
            <p className="text-base sm:text-2xl font-black text-emerald-400 font-mono">
              ₺{totalPersonnelGrossPay.toLocaleString('tr-TR')}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">Dönem personele tahakkuk</p>
          </div>

          <div className="p-3 sm:p-4.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Verilen Avanslar</span>
              <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0" />
            </div>
            <p className="text-base sm:text-2xl font-black text-amber-400 font-mono">
              ₺{totalAdvancesIssued.toLocaleString('tr-TR')}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">Hakedişten düşülecek</p>
          </div>

          <div className="p-3 sm:p-4.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Saha Masrafları</span>
              <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 flex-shrink-0" />
            </div>
            <p className="text-base sm:text-2xl font-black text-sky-400 font-mono">
              ₺{totalFieldExpenses.toLocaleString('tr-TR')}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">Yakıt, yemek fişleri</p>
          </div>
        </div>
      )}

      {/* Control Bar (Period, Archive, Model, Status Filters) */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800">
        
        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
          {/* Period Filter (1 Ay / 3 Ay / 6 Ay / 1 Yıl / Tümü) */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Dönem</label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-medium cursor-pointer"
            >
              <option value="all">Tüm Zamanlar</option>
              <option value="1m">Son 1 Ay (30 Gün)</option>
              <option value="3m">Son 3 Ay (90 Gün)</option>
              <option value="6m">Son 6 Ay (180 Gün)</option>
              <option value="1y">Son 1 Yıl</option>
            </select>
          </div>

          {/* Archive / Visibility Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Görünüm / Arşiv</label>
            <select
              value={filterArchive}
              onChange={(e) => setFilterArchive(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-medium cursor-pointer"
            >
              <option value="active">Aktif Projeler</option>
              <option value="archived">Gizlenen / Arşivdekiler</option>
              <option value="all">Tümü (Arşiv Dahil)</option>
            </select>
          </div>

          {/* Model Filter (İller vs İstanbul Ekip) */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">İş Modeli</label>
            <select
              value={filterModel}
              onChange={(e) => setFilterModel(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-medium cursor-pointer"
            >
              <option value="all">Tüm Modeller</option>
              <option value="model_a_macro">İller</option>
              <option value="model_b_micro">İstanbul Ekip</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Durum</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-medium cursor-pointer"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              {isAdmin && <option value="feasibility">Fizibilite / Taslak</option>}
              <option value="completed">Tamamlandı</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end xl:self-center">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
            title="Tüm proje listesini Excel formatında indirin"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Excel'e Aktar</span>
          </button>

          {isAdmin && (
            <button
              onClick={onOpenFeasibility}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Fizibilite Simülatörü</span>
            </button>
          )}

          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Proje Ekle</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 space-y-3">
          <Briefcase className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-white">
            {filterArchive === 'archived' ? 'Arşivde Proje Bulunmuyor' : 'Kriterlere Uygun Proje Yok'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {filterArchive === 'archived' 
              ? 'Gizlenen veya arşivlenen proje bulunmamaktadır.'
              : 'Filtre kriterlerini temizleyebilir veya yeni proje tanımlayabilirsiniz.'}
          </p>
          {filterArchive !== 'archived' && (
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Yeni Proje Tanımla</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredProjects.map(project => {
            const isModelA = project.businessModel === 'model_a_macro';
            const progressPercent = Math.min(((project.completedSurveys || 0) / (project.targetSurveys || 1)) * 100, 100);

            return (
              <div 
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`p-6 rounded-2xl bg-slate-900 border transition-all flex flex-col justify-between relative group cursor-pointer ${
                  project.isArchived 
                    ? 'border-amber-500/30 bg-slate-900/60 opacity-80 hover:opacity-100 hover:border-amber-500/60'
                    : 'border-slate-800 hover:border-sky-500/50 hover:shadow-xl hover:shadow-sky-500/5'
                }`}
              >
                <div>
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-sky-400">{project.code}</span>
                        
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {project.projectType.toUpperCase()}
                        </span>

                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {isModelA ? 'İller' : 'İstanbul Ekip'}
                        </span>

                        {project.isArchived && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <EyeOff className="w-3 h-3" /> Arşivde / Gizli
                          </span>
                        )}

                        {project.status === 'active' ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Taslak
                          </span>
                        )}

                        {project.createdByName && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
                            Oluşturan: <strong className="text-white">{project.createdByName}</strong>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Müşteri: <strong className="text-slate-300">{project.clientName}</strong></p>
                    </div>

                    {/* Admin sees Profit Margin, SPV sees Surveyor Price */}
                    {isAdmin ? (
                      project.simulatedMarginPercent ? (
                        <div className="text-right flex-shrink-0">
                          <span className="text-[10px] text-slate-400 block">Kâr Marjı</span>
                          <span className="text-base font-black font-mono text-emerald-400">
                            %{project.simulatedMarginPercent}
                          </span>
                        </div>
                      ) : null
                    ) : (
                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] text-slate-400 block">Personele Fiyat</span>
                        <span className="text-base font-black font-mono text-sky-400">
                          ₺{project.defaultPersonnelRate || project.clientUnitPrice}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Target Cities & Pricing Badges */}
                  {project.cityPricing && project.cityPricing.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 my-2.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {project.cityPricing.map((cp, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                          {cp.city}: <strong className="text-sky-400 font-bold">₺{cp.unitPrice}</strong>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Saha İlerlemesi</span>
                      <span className="font-mono text-slate-200 font-bold">
                        {project.completedSurveys || 0} / {project.targetSurveys} Anket (%{progressPercent.toFixed(0)})
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all bg-sky-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer & Action Buttons */}
                <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{project.startDate} - {project.endDate}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Toggle Hide / Archive Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleArchiveProject(project.id);
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        project.isArchived
                          ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700'
                      }`}
                      title={project.isArchived ? "Projeyi görünür yap" : "Projeyi gizle / arşive kaldır"}
                    >
                      {project.isArchived ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{project.isArchived ? 'Göster' : 'Gizle'}</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(project);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
                      title="Proje bilgilerini veya birim fiyatlarını düzenle"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                      <span className="hidden sm:inline">Düzenle</span>
                    </button>

                    {/* Safe Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingProject(project);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 font-bold text-xs border border-rose-500/30 transition-all cursor-pointer"
                      title="Projeyi kalıcı olarak sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Sil</span>
                    </button>

                    {/* Detail Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 font-bold text-xs border border-sky-500/30 transition-all cursor-pointer"
                    >
                      <span>Detay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NEW PROJECT DEFINITION MODAL (With City & Price Setup) */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 shadow-2xl my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-sky-400" />
                <span>Yeni Proje Tanımla</span>
              </h3>
              <button onClick={() => setIsNewProjectModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Proje Kodu</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-sky-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Müşteri Adı</label>
                  <input
                    type="text"
                    required
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    placeholder="Örn: Ipsos, GfK"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Proje Başlığı / Adı</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Örn: Ankara Tüketici Saha Anketi"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Proje Tipi</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ProjectType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  <option value="saha">Saha Araştırması (Yüz Yüze)</option>
                  <option value="studyo">Stüdyo / Odak Grup</option>
                  <option value="gizli_musteri">Gizli Müşteri</option>
                  <option value="diger">Diğer</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Toplam Hedef Anket</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newTargetSurveys}
                    onChange={(e) => setNewTargetSurveys(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Standart Birim Fiyat (TL)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newUnitPrice}
                    onChange={(e) => setNewUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* DYNAMIC CITIES & CITY-BASED UNIT PRICES */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      <span>Çalışılacak İller ve İl Bazlı Birim Fiyatlar</span>
                    </span>
                    <p className="text-[11px] text-slate-400">Her ile özel anketör birim fiyatını belirleyebilirsiniz</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCityRow}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 font-bold border border-sky-500/30 transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ İl Ekle</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {cityPricingList.map((cp, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="İl Adı (Örn: Ankara)"
                        value={cp.city}
                        onChange={(e) => handleCityChange(idx, 'city', e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                      <div className="w-28 relative">
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Fiyat (TL)"
                          value={cp.unitPrice}
                          onChange={(e) => handleCityChange(idx, 'unitPrice', e.target.value)}
                          className="w-full px-3 py-1.5 pl-6 rounded-xl bg-slate-900 border border-slate-700 text-xs text-emerald-400 font-mono font-bold"
                        />
                        <span className="text-[11px] text-slate-500 absolute left-2 top-2">₺</span>
                      </div>
                      {cityPricingList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCityRow(idx)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
              >
                Projeyi Oluştur & Başlat
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      <EditProjectModal
        project={editingProject}
        isOpen={Boolean(editingProject)}
        onClose={() => setEditingProject(null)}
        onSaved={(updated) => {
          if (selectedProject?.id === updated.id) {
            setSelectedProject(updated);
          }
        }}
      />

      {/* Safe Delete Project Modal */}
      <SafeDeleteProjectModal
        project={deletingProject}
        isOpen={Boolean(deletingProject)}
        onClose={() => setDeletingProject(null)}
        onDeleted={() => {
          if (selectedProject?.id === deletingProject?.id) {
            setSelectedProject(null);
          }
          setDeletingProject(null);
        }}
      />

      {/* Project Detail Modal */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
      />

    </div>
  );
}
