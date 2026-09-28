'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  X, 
  Briefcase, 
  Building2, 
  MapPin, 
  Plus, 
  Trash2, 
  Check, 
  Save, 
  AlertCircle 
} from 'lucide-react';
import { Project, ProjectType, BusinessModel, CityPricing, ProjectStatus } from '@/types';

interface EditProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updated: Project) => void;
}

export default function EditProjectModal({
  project,
  isOpen,
  onClose,
  onSaved
}: EditProjectModalProps) {
  const { updateProject, currentUser } = useApp();

  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('saha');
  const [businessModel, setBusinessModel] = useState<BusinessModel>('model_b_micro');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [targetSurveys, setTargetSurveys] = useState('');
  const [defaultPersonnelRate, setDefaultPersonnelRate] = useState('');
  const [clientUnitPrice, setClientUnitPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [subcontractorName, setSubcontractorName] = useState('');
  const [subcontractorUnitPrice, setSubcontractorUnitPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [cityPricingList, setCityPricingList] = useState<CityPricing[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (project) {
      setCode(project.code || '');
      setTitle(project.title || '');
      setClientName(project.clientName || '');
      setProjectType(project.projectType || 'saha');
      setBusinessModel(project.businessModel || 'model_b_micro');
      setStatus(project.status || 'active');
      setTargetSurveys(String(project.targetSurveys || 0));
      setDefaultPersonnelRate(String(project.defaultPersonnelRate || project.clientUnitPrice || 320));
      setClientUnitPrice(String(project.clientUnitPrice || 450));
      setStartDate(project.startDate || '');
      setEndDate(project.endDate || '');
      setSubcontractorName(project.subcontractorName || '');
      setSubcontractorUnitPrice(String(project.subcontractorUnitPrice || 0));
      setNotes(project.notes || '');
      setCityPricingList(
        project.cityPricing && project.cityPricing.length > 0
          ? [...project.cityPricing]
          : [{ city: 'Ankara', unitPrice: project.defaultPersonnelRate || 320, targetSurveys: project.targetSurveys }]
      );
      setSaveSuccess(false);
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const handleAddCityRow = () => {
    setCityPricingList(prev => [
      ...prev,
      { city: '', unitPrice: Number(defaultPersonnelRate) || 320, targetSurveys: 100 }
    ]);
  };

  const handleRemoveCityRow = (index: number) => {
    setCityPricingList(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleCityChange = (index: number, field: keyof CityPricing, value: any) => {
    setCityPricingList(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: field === 'unitPrice' || field === 'targetSurveys' ? Number(value) : value
      };
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    const targetSurveysNum = Number(targetSurveys) || 0;
    const clientPriceNum = Number(clientUnitPrice) || 0;
    const personnelPriceNum = Number(defaultPersonnelRate) || 0;
    const validCityPricing = cityPricingList.filter(cp => cp.city.trim() !== '');

    const updatedData: Partial<Project> = {
      code: code.trim(),
      title: title.trim(),
      clientName: clientName.trim(),
      projectType,
      businessModel,
      status,
      targetSurveys: targetSurveysNum,
      clientUnitPrice: clientPriceNum,
      clientTotalBudget: targetSurveysNum * clientPriceNum,
      defaultPersonnelRate: personnelPriceNum,
      startDate,
      endDate,
      subcontractorName: businessModel === 'model_a_macro' ? subcontractorName : undefined,
      subcontractorUnitPrice: businessModel === 'model_a_macro' ? Number(subcontractorUnitPrice) : undefined,
      notes,
      cityPricing: validCityPricing.length > 0 ? validCityPricing : undefined
    };

    updateProject(project.id, updatedData);

    const mergedProject: Project = {
      ...project,
      ...updatedData
    };

    setSaveSuccess(true);
    if (onSaved) {
      onSaved(mergedProject);
    }

    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 shadow-2xl my-8 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Projeyi Düzenle</h3>
              <p className="text-xs text-slate-400">
                <span className="font-mono font-bold text-sky-400">{project.code}</span> - Bilgileri güncelleyin
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          
          {/* Row 1: Code & Client */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Proje Kodu</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-mono text-sky-400 font-bold focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Müşteri Adı</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Row 2: Title */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Proje Başlığı / Adı</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Row 3: Project Type, Business Model & Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Proje Tipi</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as ProjectType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              >
                <option value="saha">Saha Araştırması</option>
                <option value="studyo">Stüdyo / Odak Grup</option>
                <option value="gizli_musteri">Gizli Müşteri</option>
                <option value="diger">Diğer</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">İş Modeli</label>
              <select
                value={businessModel}
                onChange={(e) => setBusinessModel(e.target.value as BusinessModel)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              >
                <option value="model_b_micro">İstanbul Ekip</option>
                <option value="model_a_macro">İller</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Proje Durumu</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              >
                <option value="active">Aktif Proje</option>
                <option value="completed">Tamamlandı</option>
                <option value="feasibility">Fizibilite / Taslak</option>
              </select>
            </div>
          </div>

          {/* Row 4: Target Surveys & Pricing */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Toplam Hedef Anket</label>
              <input
                type="number"
                required
                min="1"
                value={targetSurveys}
                onChange={(e) => setTargetSurveys(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-mono text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-sky-400 mb-1">Personele Standart Fiyat (TL)</label>
              <input
                type="number"
                required
                min="1"
                value={defaultPersonnelRate}
                onChange={(e) => setDefaultPersonnelRate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-mono text-sky-400 font-bold"
              />
            </div>

            {currentUser?.role === 'admin' && (
              <div>
                <label className="block font-semibold text-emerald-400 mb-1">Müşteri Birim Fiyatı (TL)</label>
                <input
                  type="number"
                  min="1"
                  value={clientUnitPrice}
                  onChange={(e) => setClientUnitPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-mono text-emerald-400 font-bold"
                />
              </div>
            )}
          </div>

          {/* If Model A: Subcontractor Info */}
          {businessModel === 'model_a_macro' && (
            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 space-y-3">
              <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                <span>İller: Taşeron Bilgileri</span>
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Taşeron Firma Adı</label>
                  <input
                    type="text"
                    value={subcontractorName}
                    onChange={(e) => setSubcontractorName(e.target.value)}
                    placeholder="Örn: Anadolu Saha Araştırma Ltd."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Taşeron Anket Başı Fiyat (TL)</label>
                  <input
                    type="number"
                    value={subcontractorUnitPrice}
                    onChange={(e) => setSubcontractorUnitPrice(e.target.value)}
                    placeholder="250"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-indigo-300 font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC CITIES & CITY-BASED UNIT PRICES */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>Çalışılacak İller ve İl Bazlı Birim Fiyatlar</span>
                </span>
                <p className="text-[11px] text-slate-400">Excel hakediş aktarımında bu illerin fiyatları otomatik baz alınır</p>
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

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {cityPricingList.map((cp, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="İl Adı (Örn: Ankara)"
                    value={cp.city}
                    onChange={(e) => handleCityChange(idx, 'city', e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  />
                  <div className="w-28 relative">
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Fiyat (TL)"
                      value={cp.unitPrice}
                      onChange={(e) => handleCityChange(idx, 'unitPrice', e.target.value)}
                      className="w-full px-3 py-1.5 pl-6 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold"
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

          {/* Row 5: Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Başlangıç Tarihi</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Bitiş Tarihi</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              />
            </div>
          </div>

          {/* Row 6: Notes */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Proje Notları / Açıklama</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Proje ile ilgili genel operasyonel notlar..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono text-[11px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all cursor-pointer"
            >
              İptal
            </button>

            <button
              type="submit"
              disabled={saveSuccess}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold shadow-lg shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Güncellendi!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Değişiklikleri Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
