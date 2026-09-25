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
  PlusCircle
} from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';
import { Project, BusinessModel } from '@/types';
import ProjectDetailModal from './ProjectDetailModal';

interface ProjectsViewProps {
  onOpenFeasibility: () => void;
}

export default function ProjectsView({ onOpenFeasibility }: ProjectsViewProps) {
  const { projects, activateProjectFromFeasibility } = useApp();
  const [filterModel, setFilterModel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Excel Export
  const handleExport = () => {
    const exportData = projects.map(p => ({
      'Proje Kodu': p.code,
      'Proje Başlığı': p.title,
      'Müşteri': p.clientName,
      'İş Modeli': p.businessModel === 'model_a_macro' ? 'Model A: Taşeron (Makro)' : 'Model B: Öz Ekip (Mikro)',
      'Durum': p.status === 'active' ? 'Aktif' : p.status === 'feasibility' ? 'Fizibilite' : 'Tamamlandı',
      'Hedef Anket': p.targetSurveys,
      'Tamamlanan Anket': p.completedSurveys || 0,
      'Müşteri Birim Fiyat (TL)': p.clientUnitPrice,
      'Toplam Bütçe / Ciro (TL)': p.clientTotalBudget,
      'Kâr Marjı (%)': p.simulatedMarginPercent ? `%${p.simulatedMarginPercent}` : '-',
      'Sorumlu SPV / Taşeron': p.businessModel === 'model_a_macro' ? p.subcontractorName : p.assignedSpvName,
      'Başlangıç Tarihi': p.startDate,
      'Bitiş Tarihi': p.endDate
    }));

    exportToExcel(exportData, 'Orion_Proje_Finans_Ozeti', 'Projeler');
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

  return (
    <div className="space-y-6">
      
      {/* Top Banner & KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Aktif Portföy Cirosu</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">
            ₺{totalActiveBudget.toLocaleString('tr-TR')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Aktif projelerin toplam sözleşme tutarı</p>
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
            <span className="text-xs font-semibold uppercase tracking-wider">Model A (Taşeron)</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-400 font-mono">
            {projects.filter(p => p.businessModel === 'model_a_macro').length} Proje
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Dış iller makro hakedişli projeler</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Model B (Öz Ekip)</span>
            <Briefcase className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-sky-400 font-mono">
            {projects.filter(p => p.businessModel === 'model_b_micro').length} Proje
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Avans ve SPV günlük giderli operasyon</p>
        </div>
      </div>

      {/* Control Bar: Filters & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Model Filter */}
          <select
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
          >
            <option value="all">Tüm İş Modelleri</option>
            <option value="model_a_macro">Model A: Taşeron (Makro)</option>
            <option value="model_b_micro">Model B: Öz Ekip (Mikro)</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif Projeler</option>
            <option value="feasibility">Fizibilite / Taslak</option>
            <option value="completed">Tamamlananlar</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Excel Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
            title="Tüm proje listesini Excel formatında indirin"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel'e Aktar</span>
          </button>

          {/* Feasibility Simulator Button */}
          <button
            onClick={onOpenFeasibility}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Fizibilite Simülatörü</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
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
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-sky-400">{project.code}</span>
                      
                      {/* Model Badge */}
                      {isModelA ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          Model A • Taşeron (Makro)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                          Model B • Öz Ekip (Mikro)
                        </span>
                      )}

                      {/* Status */}
                      {project.status === 'active' ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Aktif
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Fizibilite
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Müşteri: <strong className="text-slate-300">{project.clientName}</strong></p>
                  </div>

                  {project.simulatedMarginPercent && (
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] text-slate-400 block">Kâr Marjı</span>
                      <span className="text-base font-black font-mono text-emerald-400">
                        %{project.simulatedMarginPercent}
                      </span>
                    </div>
                  )}
                </div>

                {/* Specific Model Highlights */}
                <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5">
                  {isModelA ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Atanan Taşeron:</span>
                        <span className="font-semibold text-indigo-300">{project.subcontractorName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Taşeron Anket Başı Fiyat:</span>
                        <span className="font-mono text-slate-200">₺{project.subcontractorUnitPrice} / Anket</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Taşeron Toplam Hakedişi:</span>
                        <span className="font-mono font-bold text-indigo-400">
                          ₺{((project.targetSurveys) * (project.subcontractorUnitPrice || 0)).toLocaleString('tr-TR')}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Sorumlu SPV:</span>
                        <span className="font-semibold text-sky-300">{project.assignedSpvName || 'Atama Bekliyor'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Günlük SPV / Sabit Gider:</span>
                        <span className="font-mono text-slate-200">₺{project.dailyOverheadRate.toLocaleString('tr-TR')} / Gün</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Saha Harcamaları & Avans:</span>
                        <span className="font-mono font-bold text-amber-400">
                          ₺{((project.totalExpenses || 0) + (project.totalAdvances || 0)).toLocaleString('tr-TR')}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Saha İlerlemesi</span>
                    <span className="font-mono text-slate-200">
                      {project.completedSurveys || 0} / {project.targetSurveys} Anket (%{progressPercent.toFixed(0)})
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${isModelA ? 'bg-indigo-500' : 'bg-sky-500'}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer & Action Button */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{project.startDate} - {project.endDate}</span>
                </div>

                <div className="flex items-center gap-2">
                  {project.status === 'feasibility' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        activateProjectFromFeasibility(project.id);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all cursor-pointer"
                    >
                      Projeyi Aktif Et
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 font-bold text-xs border border-sky-500/30 transition-all cursor-pointer"
                    >
                      <span>Detay & İşlem Ekle</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Detail Modal */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
      />

    </div>
  );
}
