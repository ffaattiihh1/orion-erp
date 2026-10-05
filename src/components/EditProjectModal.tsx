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
  Save, 
  Banknote,
  UserCheck
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
  const [observerUnitPrice, setObserverUnitPrice] = useState('');
  const [clientUnitPrice, setClientUnitPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [subcontractorName, setSubcontractorName] = useState('');
  const [subcontractorUnitPrice, setSubcontractorUnitPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [cityPricingList, setCityPricingList] = useState<CityPricing[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

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
      setObserverUnitPrice(String(project.observerUnitPrice || 450));
      setClientUnitPrice(String(project.clientUnitPrice || 550));
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
    const surveyorPriceNum = Number(defaultPersonnelRate) || 0;
    const observerPriceNum = Number(observerUnitPrice) || 0;
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
      defaultPersonnelRate: surveyorPriceNum,
      observerUnitPrice: projectType === 'nokta' || observerPriceNum > 0 ? observerPriceNum : undefined,
      startDate,
      endDate,
      subcontractorName: businessModel === 'model_a_macro' ? subcontractorName : undefined,
      subcontractorUnitPrice: businessModel === 'model_a_macro' ? Number(subcontractorUnitPrice) : undefined,
      notes,
      cityPricing: validCityPricing.length > 0 ? validCityPricing : undefined,
      cities: validCityPricing.map(c => c.city.trim())
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
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-white border border-gray-200 rounded-3xl p-6 text-gray-900 shadow-2xl my-8 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">Projeyi Düzenle</h3>
              <p className="text-xs text-gray-500">
                <span className="font-mono font-bold text-sky-400">{project.code}</span> - Bilgileri ve birim fiyatları güncelleyin
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          
          {/* Row 1: Code & Client */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Proje Kodu</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 font-mono text-sky-400 font-bold focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Müşteri Adı</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Row 2: Title */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Proje Başlığı / Adı</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Row 3: Project Type & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Proje Tipi</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as ProjectType)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900"
              >
                <option value="saha">Saha Araştırması (Yüz Yüze)</option>
                <option value="nokta">Nokta Projesi (Anketör & Gözlemci)</option>
                <option value="studyo">Stüdyo / Odak Grup</option>
                <option value="gizli_musteri">Gizli Müşteri</option>
                <option value="diger">Diğer</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Proje Durumu</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900"
              >
                <option value="active">Aktif Proje</option>
                <option value="completed">Tamamlandı</option>
                <option value="feasibility">Fizibilite / Taslak</option>
              </select>
            </div>
          </div>

          {/* Row 4: Target Surveys & Pricing */}
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <span className="font-bold text-gray-900 flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-emerald-400" />
              <span>Fiyatlandırma & Hedef Sayısı</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Hedef Anket Sayısı</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={targetSurveys}
                  onChange={(e) => setTargetSurveys(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 font-mono text-gray-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-sky-400 mb-1">Anketör Fiyatı (TL)</label>
                <input
                  type="number"
                  min="0"
                  value={defaultPersonnelRate}
                  onChange={(e) => setDefaultPersonnelRate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 font-mono text-sky-400 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-indigo-300 mb-1">Gözlemci Fiyatı (TL)</label>
                <input
                  type="number"
                  min="0"
                  value={observerUnitPrice}
                  onChange={(e) => setObserverUnitPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 font-mono text-indigo-300 font-bold"
                />
              </div>

              {isAdmin && (
                <div className="col-span-2 sm:col-span-3 pt-1">
                  <label className="block font-semibold text-emerald-400 mb-1">Müşteri Birim Fiyatı (Bize Geliş - TL)</label>
                  <input
                    type="number"
                    min="0"
                    value={clientUnitPrice}
                    onChange={(e) => setClientUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 font-mono text-emerald-400 font-bold"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Row 5: Dynamic Cities Setup */}
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-400" />
                <span>Çalışılacak İller & İl Fiyatları</span>
              </span>
              <button
                type="button"
                onClick={handleAddCityRow}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 font-bold border border-sky-500/30 transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ İl Ekle</span>
              </button>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {cityPricingList.map((cp, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="İl Adı (Örn: Ankara)"
                    value={cp.city}
                    onChange={(e) => handleCityChange(idx, 'city', e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-900"
                  />
                  <div className="w-28 relative">
                    <input
                      type="number"
                      min="0"
                      placeholder="Fiyat (TL)"
                      value={cp.unitPrice}
                      onChange={(e) => handleCityChange(idx, 'unitPrice', e.target.value)}
                      className="w-full px-3 py-1.5 pl-6 rounded-xl bg-white border border-gray-200 text-emerald-400 font-mono font-bold"
                    />
                    <span className="text-[11px] text-gray-400 absolute left-2 top-2">₺</span>
                  </div>
                  {cityPricingList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCityRow(idx)}
                      className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Row 6: Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Başlangıç Tarihi</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Bitiş Tarihi</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-gray-900 font-bold shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saveSuccess ? 'Kaydedildi!' : 'Değişiklikleri Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


