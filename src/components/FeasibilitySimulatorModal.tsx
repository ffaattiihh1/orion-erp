'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Calculator, X, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { ProjectType, BusinessModel } from '@/types';

interface FeasibilitySimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeasibilitySimulatorModal({ isOpen, onClose }: FeasibilitySimulatorModalProps) {
  const { addProject } = useApp();

  // Simulation Form State
  const [clientName, setClientName] = useState('Ipsos Türkiye');
  const [projectTitle, setProjectTitle] = useState('Büyükşehir Tüketici Memnuniyeti Araştırması');
  const [projectType, setProjectType] = useState<ProjectType>('saha');
  const [businessModel, setBusinessModel] = useState<BusinessModel>('model_b_micro');
  
  // Numerical Inputs
  const [targetSurveys, setTargetSurveys] = useState<number>(600);
  const [clientUnitPrice, setClientUnitPrice] = useState<number>(380);
  const [personnelRate, setPersonnelRate] = useState<number>(180);
  const [spvDailyRate, setSpvDailyRate] = useState<number>(2000);
  const [projectDays, setProjectDays] = useState<number>(12);
  const [otherEstimatedExpenses, setOtherEstimatedExpenses] = useState<number>(12000);

  // Model A specific inputs
  const [subcontractorName, setSubcontractorName] = useState('Ege Saha Araştırma Ltd.');
  const [subcontractorUnitPrice, setSubcontractorUnitPrice] = useState<number>(220);

  if (!isOpen) return null;

  // Real-time calculations
  const totalRevenue = targetSurveys * clientUnitPrice;

  let totalCost = 0;
  let personnelCost = 0;
  let overheadCost = 0;

  if (businessModel === 'model_a_macro') {
    // Model A: Subcontractor Macro Model
    totalCost = targetSurveys * subcontractorUnitPrice;
    personnelCost = totalCost;
    overheadCost = 0;
  } else {
    // Model B: Detailed Micro Model
    personnelCost = targetSurveys * personnelRate;
    overheadCost = spvDailyRate * projectDays;
    totalCost = personnelCost + overheadCost + otherEstimatedExpenses;
  }

  const netProfit = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const getMarginBadge = () => {
    if (marginPercent >= 30) {
      return {
        label: 'Mükemmel Kârlılık (%30+)',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        icon: CheckCircle2
      };
    }
    if (marginPercent >= 18) {
      return {
        label: 'Standart / Dengeli Marj',
        color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
        icon: TrendingUp
      };
    }
    return {
      label: 'Düşük Kâr / Riskli Teklif',
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      icon: AlertTriangle
    };
  };

  const badge = getMarginBadge();
  const BadgeIcon = badge.icon;

  const handleCreateActiveProject = () => {
    const code = 'ORION-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900);
    const startDate = new Date().toISOString().split('T')[0];
    const end = new Date();
    end.setDate(end.getDate() + projectDays);
    const endDate = end.toISOString().split('T')[0];

    addProject({
      code,
      clientName,
      title: projectTitle,
      projectType,
      businessModel,
      status: 'active',
      startDate,
      endDate,
      targetSurveys,
      clientUnitPrice,
      clientTotalBudget: totalRevenue,
      subcontractorName: businessModel === 'model_a_macro' ? subcontractorName : undefined,
      subcontractorUnitPrice: businessModel === 'model_a_macro' ? subcontractorUnitPrice : undefined,
      dailyOverheadRate: spvDailyRate,
      defaultPersonnelRate: personnelRate,
      simulatedCost: totalCost,
      simulatedNetMargin: netProfit,
      simulatedMarginPercent: Number(marginPercent.toFixed(2)),
      notes: `Fizibilite simülatöründen %${marginPercent.toFixed(1)} kâr beklentisi ile doğrudan aktif edildi.`
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-slate-100 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Canlı Fizibilite & Kârlılık Simülatörü</h2>
              <p className="text-xs text-slate-400">Teklif vermeden önce saha giderlerini ve net kâr marjını hesaplayın</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          
          {/* Left Column: Inputs (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Business Model Selector (Model A vs Model B) */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                İş Modeli Seçimi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBusinessModel('model_b_micro')}
                  className={`p-3 rounded-lg text-left transition-all border cursor-pointer ${
                    businessModel === 'model_b_micro'
                      ? 'bg-sky-500/15 border-sky-500/40 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold text-sky-300">Model B: İstanbul Ekip</p>
                  <p className="text-[11px] text-slate-400 mt-1">Avanslar, SPV günlüğü, fişli masraflar ve operasyon.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setBusinessModel('model_a_macro')}
                  className={`p-3 rounded-lg text-left transition-all border cursor-pointer ${
                    businessModel === 'model_a_macro'
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold text-indigo-300">Model A: İller</p>
                  <p className="text-[11px] text-slate-400 mt-1">İller / Dış ekip tek birim fiyat. Masraf detayı tutulmaz.</p>
                </button>
              </div>
            </div>

            {/* General Project Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Müşteri Adı</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Proje Tipi</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as ProjectType)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:ring-1 focus:ring-sky-500"
                >
                  <option value="saha">Saha Araştırması (Yüz Yüze)</option>
                  <option value="studyo">Stüdyo / Odak Grup</option>
                  <option value="gizli_musteri">Gizli Müşteri</option>
                  <option value="diger">Diğer</option>
                </select>
              </div>
            </div>

            {/* Revenue Drivers */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                Gelir Parametreleri (Müşteri)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Hedef Anket Sayısı</label>
                  <input
                    type="number"
                    min="1"
                    value={targetSurveys}
                    onChange={(e) => setTargetSurveys(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Müşteri Anket Birim Fiyatı (TL)</label>
                  <input
                    type="number"
                    min="1"
                    value={clientUnitPrice}
                    onChange={(e) => setClientUnitPrice(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Cost Drivers - Conditional Based on Model */}
            {businessModel === 'model_a_macro' ? (
              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-900/40 space-y-3">
                <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider block">
                  Model A: İller Parametreleri
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">İl / Dış Ekip / Firma Adı</label>
                    <input
                      type="text"
                      value={subcontractorName}
                      onChange={(e) => setSubcontractorName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Anket Başı Birim Fiyat (TL)</label>
                    <input
                      type="number"
                      min="1"
                      value={subcontractorUnitPrice}
                      onChange={(e) => setSubcontractorUnitPrice(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block">
                  Model B: İstanbul Ekip & Sabit Gider Dağıtımı
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Anketör Standart Fiyat (TL)</label>
                    <input
                      type="number"
                      min="1"
                      value={personnelRate}
                      onChange={(e) => setPersonnelRate(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">SPV / Günlük Sabit Gider (TL)</label>
                    <input
                      type="number"
                      min="0"
                      value={spvDailyRate}
                      onChange={(e) => setSpvDailyRate(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Tahmini Saha Gün Sayısı</label>
                    <input
                      type="number"
                      min="1"
                      value={projectDays}
                      onChange={(e) => setProjectDays(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Diğer Saha Gideri (Yakıt, Yemek vb. TL)</label>
                    <input
                      type="number"
                      min="0"
                      value={otherEstimatedExpenses}
                      onChange={(e) => setOtherEstimatedExpenses(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Output & Simulation Gauge (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Canlı Finansal Özet
                </span>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${badge.color}`}>
                  <BadgeIcon className="w-3.5 h-3.5" />
                  <span>{badge.label}</span>
                </div>
              </div>

              {/* Big KPI Metrics */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <p className="text-[11px] text-slate-400">Hedeflenen Toplam Ciro</p>
                  <p className="text-2xl font-black text-white font-mono">
                    ₺{totalRevenue.toLocaleString('tr-TR')}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Toplam Maliyet:</span>
                    <span className="text-slate-200 font-mono font-medium">₺{totalCost.toLocaleString('tr-TR')}</span>
                  </div>
                  {businessModel === 'model_b_micro' && (
                    <>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>• Anketör Hakedişleri:</span>
                        <span className="font-mono">₺{personnelCost.toLocaleString('tr-TR')}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>• SPV & Sabit Gider ({projectDays} Gün):</span>
                        <span className="font-mono">₺{overheadCost.toLocaleString('tr-TR')}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>• Tahmini Fiş Masrafları:</span>
                        <span className="font-mono">₺{otherEstimatedExpenses.toLocaleString('tr-TR')}</span>
                      </div>
                    </>
                  )}
                  {businessModel === 'model_a_macro' && (
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>• İller Toplam Hakedişi:</span>
                      <span className="font-mono">₺{personnelCost.toLocaleString('tr-TR')}</span>
                    </div>
                  )}
                </div>

                <div className={`p-4 rounded-xl border ${netProfit >= 0 ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-rose-950/30 border-rose-800/50'}`}>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Tahmini Net Kâr</p>
                      <p className={`text-2xl font-black font-mono ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ₺{netProfit.toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-400">Kâr Marjı</p>
                      <p className={`text-2xl font-black font-mono ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        %{marginPercent.toFixed(1)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar visual */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                    <div 
                      className={`h-full transition-all duration-500 ${marginPercent >= 30 ? 'bg-emerald-500' : marginPercent >= 15 ? 'bg-sky-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(Math.max(marginPercent, 0), 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleCreateActiveProject}
                className="flex-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Projeyi Aktif Et</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
