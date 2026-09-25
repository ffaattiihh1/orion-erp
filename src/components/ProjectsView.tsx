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
  Trash2
} from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';
import { Project, BusinessModel, ProjectType, CityPricing } from '@/types';
import ProjectDetailModal from './ProjectDetailModal';

interface ProjectsViewProps {
  onOpenFeasibility: () => void;
}

export default function ProjectsView({ onOpenFeasibility }: ProjectsViewProps) {
  const { currentUser, projects, addProject, activateProjectFromFeasibility, settlements, advances, expenses } = useApp();
  const [filterModel, setFilterModel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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

  // Excel Export
  const handleExport = () => {
    const exportData = projects.map(p => ({
      'Proje Kodu': p.code,
      'Proje Başlığı': p.title,
      'Müşteri': p.clientName,
      'Proje Tipi': p.projectType.toUpperCase(),
      'Durum': p.status === 'active' ? 'Aktif' : p.status === 'feasibility' ? 'Fizibilite' : 'Tamamlandı',
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

  // Filtered list
  const filteredProjects = projects.filter(p => {
    if (filterModel !== 'all' && p.businessModel !== filterModel) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    return true;
  });

  // KPI Calculations
  const totalActiveBudget = projects
    .filter(p => p.status === 'active')
    .reduce((sum, p) => sum + p.clientTotalBudget, 0);

  const totalCompletedSurveys = projects.reduce((sum, p) => sum + (p.completedSurveys || 0), 0);
  const totalTargetSurveys = projects.reduce((sum, p) => sum + p.targetSurveys, 0);

  // SPV Specific Operational Totals
  const totalPersonnelGrossPay = settlements.reduce((sum, s) => sum + s.grossAmount, 0);
  const totalAdvancesIssued = advances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const totalFieldExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Aktif Portföy Cirosu</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white font-mono">
              ₺{totalActiveBudget.toLocaleString('tr-TR')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Müdür & Yönetim Canlı Finansı</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Saha İlerlemesi</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-2xl font-black text-white font-mono">
              {totalCompletedSurveys} <span className="text-sm font-normal text-slate-500">/ {totalTargetSurveys} Anket</span>
            </p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-sky-500 h-full rounded-full"
                style={{ width: `${Math.min((totalCompletedSurveys / (totalTargetSurveys || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Model A (İller)</span>
              <Building2 className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-black text-indigo-400 font-mono">
              {projects.filter(p => p.businessModel === 'model_a_macro').length} Proje
            </p>
            <p className="text-[11px] text-slate-500 mt-1">İller / Dış bölge projeleri</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Model B (İstanbul Ekip)</span>
              <Briefcase className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-2xl font-black text-sky-400 font-mono">
              {projects.filter(p => p.businessModel === 'model_b_micro').length} Proje
            </p>
            <p className="text-[11px] text-slate-500 mt-1">İstanbul saha ekibi ve avans operasyonu</p>
          </div>
        </div>
      ) : (
        /* SPV Rich KPI Header (Shows Surveyor Gross Earnings, Advances, Expenses, Progress, ZERO company margins) */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Saha İlerlemesi</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-2xl font-black text-white font-mono">
              {totalCompletedSurveys} <span className="text-sm font-normal text-slate-500">/ {totalTargetSurveys} Anket</span>
            </p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-sky-500 h-full rounded-full"
                style={{ width: `${Math.min((totalCompletedSurveys / (totalTargetSurveys || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Personele Hakediş / Kazanç</span>
              <Banknote className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400 font-mono">
              ₺{totalPersonnelGrossPay.toLocaleString('tr-TR')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Personele tahakkuk eden kazanç</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Verilen Toplam Avanslar</span>
              <Banknote className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-400 font-mono">
              ₺{totalAdvancesIssued.toLocaleString('tr-TR')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Hakedişlerden otomatik düşülür</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Toplam Saha Masrafları</span>
              <Receipt className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-2xl font-black text-sky-400 font-mono">
              ₺{totalFieldExpenses.toLocaleString('tr-TR')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Yakıt, yemek ve konaklama fişleri</p>
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif Projeler</option>
            {isAdmin && <option value="feasibility">Fizibilite / Taslak</option>}
            <option value="completed">Tamamlananlar</option>
          </select>

          {/* Model Filter */}
          <select
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
          >
            <option value="all">Tüm İş Modelleri</option>
            <option value="model_a_macro">Model A: İller</option>
            <option value="model_b_micro">Model B: İstanbul Ekip</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
            title="Tüm proje listesini Excel formatında indirin"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel'e Aktar</span>
          </button>

          {isAdmin && (
            <button
              onClick={onOpenFeasibility}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Fizibilite Simülatörü</span>
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
          <h3 className="text-base font-bold text-white">Henüz Tanımlanmış Proje Yok</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            İlk projenizi ekleyerek anket sayısı, iller ve personele verilecek birim fiyatları tanımlayabilirsiniz.
          </p>
          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ İlk Projeyi Tanımla</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredProjects.map(project => {
            const isModelA = project.businessModel === 'model_a_macro';
            const progressPercent = Math.min(((project.completedSurveys || 0) / project.targetSurveys) * 100, 100);

            return (
              <div 
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 hover:shadow-xl hover:shadow-sky-500/5 transition-all flex flex-col justify-between relative group cursor-pointer"
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
                          {isModelA ? 'Model A • İller' : 'Model B • İstanbul Ekip'}
                        </span>

                        {project.status === 'active' ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Taslak
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
                      project.simulatedMarginPercent && (
                        <div className="text-right flex-shrink-0">
                          <span className="text-[10px] text-slate-400 block">Kâr Marjı</span>
                          <span className="text-base font-black font-mono text-emerald-400">
                            %{project.simulatedMarginPercent}
                          </span>
                        </div>
                      )
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

                {/* Card Footer & Action Button */}
                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{project.startDate} - {project.endDate}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                      }}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 font-bold text-xs border border-sky-500/30 transition-all cursor-pointer"
                    >
                      <span>Detay & İşlem Ekle</span>
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

      {/* Project Detail Modal */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
      />

    </div>
  );
}
