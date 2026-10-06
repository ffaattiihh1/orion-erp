'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  FileText, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Plus, 
  X, 
  Sparkles,
  Layers
} from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';
import { InvoiceStatus, ClientInvoice } from '@/types';

export default function InvoicesView() {
  const { 
    clientInvoices, 
    updateInvoiceStatus, 
    updateClientInvoice, 
    deleteClientInvoice, 
    addClientInvoice,
    projects 
  } = useApp();

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ClientInvoice | null>(null);

  // Form states for Edit / Add
  const [formProjectCode, setFormProjectCode] = useState('');
  const [formClientName, setFormClientName] = useState('');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formInvoiceAmount, setFormInvoiceAmount] = useState<number>(0);
  const [formStatus, setFormStatus] = useState<InvoiceStatus>('not_invoiced');
  const [formNotes, setFormNotes] = useState('');

  // Open Edit Modal
  const handleOpenEdit = (inv: ClientInvoice) => {
    setSelectedInvoice(inv);
    setFormProjectCode(inv.projectCode);
    setFormClientName(inv.clientName);
    setFormInvoiceNumber(inv.invoiceNumber || '');
    setFormInvoiceAmount(inv.invoiceAmount);
    setFormStatus(inv.status);
    setFormNotes(inv.notes || '');
    setIsEditModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    const defaultProj = projects[0];
    setFormProjectCode(defaultProj?.code || 'PROJ-01');
    setFormClientName(defaultProj?.clientName || 'Ipsos Türkiye');
    setFormInvoiceNumber('');
    setFormInvoiceAmount(defaultProj?.clientTotalBudget || 100000);
    setFormStatus('not_invoiced');
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  // Submit Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    updateClientInvoice(selectedInvoice.id, {
      projectCode: formProjectCode.trim(),
      clientName: formClientName.trim(),
      invoiceNumber: formInvoiceNumber.trim() || undefined,
      invoiceAmount: Number(formInvoiceAmount || 0),
      status: formStatus,
      notes: formNotes.trim() || undefined,
      invoicedAt: formStatus === 'invoiced' ? (selectedInvoice.invoicedAt || new Date().toISOString().split('T')[0]) : selectedInvoice.invoicedAt,
      collectedAt: formStatus === 'collected' ? (selectedInvoice.collectedAt || new Date().toISOString().split('T')[0]) : selectedInvoice.collectedAt
    });

    setIsEditModalOpen(false);
    setSelectedInvoice(null);
  };

  // Submit Add
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProjectCode.trim() || !formClientName.trim()) {
      alert('Lütfen Proje Kodu ve Müşteri Adı girin.');
      return;
    }

    addClientInvoice({
      projectId: 'proj-manual-' + Date.now(),
      projectCode: formProjectCode.trim(),
      clientName: formClientName.trim(),
      invoiceNumber: formInvoiceNumber.trim() || undefined,
      invoiceAmount: Number(formInvoiceAmount || 0),
      status: formStatus,
      notes: formNotes.trim() || undefined,
      invoicedAt: formStatus === 'invoiced' ? new Date().toISOString().split('T')[0] : undefined,
      collectedAt: formStatus === 'collected' ? new Date().toISOString().split('T')[0] : undefined
    });

    setIsAddModalOpen(false);
  };

  // Delete Invoice
  const handleDeleteInvoice = (inv: ClientInvoice) => {
    if (confirm(`"${inv.projectCode}" projesine ait ₺${inv.invoiceAmount.toLocaleString('tr-TR')} tutarındaki faturayı silmek istediğinize emin misiniz?`)) {
      deleteClientInvoice(inv.id);
    }
  };

  // Detect and Clean Duplicate Invoices
  const getDuplicateCount = () => {
    const seen = new Set<string>();
    let dupes = 0;
    clientInvoices.forEach(inv => {
      const key = `${inv.projectCode.trim()}_${inv.invoiceAmount}`;
      if (seen.has(key)) {
        dupes++;
      } else {
        seen.add(key);
      }
    });
    return dupes;
  };

  const handleCleanDuplicates = () => {
    const seen = new Set<string>();
    const idsToDelete: string[] = [];

    clientInvoices.forEach(inv => {
      const key = `${inv.projectCode.trim()}_${inv.invoiceAmount}`;
      if (seen.has(key)) {
        idsToDelete.push(inv.id);
      } else {
        seen.add(key);
      }
    });

    if (idsToDelete.length === 0) {
      alert('Mükerrer (aynı proje ve aynı tutar) fatura bulunamadı.');
      return;
    }

    if (confirm(`Toplam ${idsToDelete.length} adet mükerrer fatura tespit edildi. Bunları silmek istiyor musunuz?`)) {
      idsToDelete.forEach(id => deleteClientInvoice(id));
      alert(`${idsToDelete.length} mükerrer fatura temizlendi!`);
    }
  };

  // Excel Export
  const handleExport = () => {
    const exportData = clientInvoices.map(inv => ({
      'Proje Kodu': inv.projectCode,
      'Müşteri Adı': inv.clientName,
      'Fatura Numarası': inv.invoiceNumber || '-',
      'Fatura Tutarı (TL)': inv.invoiceAmount,
      'Durum': inv.status === 'collected' ? 'TAHSİL EDİLDİ' : inv.status === 'invoiced' ? 'FATURA KESİLDİ' : 'TASLAK',
      'Fatura Kesim Tarihi': inv.invoicedAt || '-',
      'Tahsilat Tarihi': inv.collectedAt || '-',
      'Notlar': inv.notes || '-'
    }));

    exportToExcel(exportData, 'Orion_Musteri_Faturalari', 'Faturalar');
  };

  const totalInvoiced = clientInvoices
    .filter(i => i.status !== 'not_invoiced')
    .reduce((sum, i) => sum + i.invoiceAmount, 0);

  const totalCollected = clientInvoices
    .filter(i => i.status === 'collected')
    .reduce((sum, i) => sum + i.invoiceAmount, 0);

  const pendingCollection = totalInvoiced - totalCollected;
  const duplicateCount = getDuplicateCount();

  return (
    <div className="space-y-6">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-gray-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Kesilen Toplam Fatura</p>
          <p className="text-xl font-bold font-mono text-gray-900 mt-1">₺{totalInvoiced.toLocaleString('tr-TR')}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Müşterilere düzenlenen e-faturalar</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Tahsil Edilen Tutar</p>
          <p className="text-xl font-bold font-mono text-emerald-600 mt-1">₺{totalCollected.toLocaleString('tr-TR')}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Banka hesabına intikal eden tahsilatlar</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Bekleyen Tahsilat (Vade)</p>
          <p className="text-xl font-bold font-mono text-amber-600 mt-1">₺{pendingCollection.toLocaleString('tr-TR')}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Vadesi beklenen cari alacaklar</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-2xl bg-white border border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900">Müşteri Faturalandırma & Tahsilat Çizelgesi</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-mono font-bold">
              {clientInvoices.length} Fatura
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Ipsos, GfK vb. ana müşterilere kesilen hakediş faturalarının canlı durum çubuğu</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {duplicateCount > 0 && (
            <button
              onClick={handleCleanDuplicates}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Aynı proje ve tutara sahip mükerrer faturaları temizle"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{duplicateCount} Mükerreri Temizle</span>
            </button>
          )}

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-all border border-gray-200 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel'e Aktar</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Fatura Ekle</span>
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[11px] border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Proje Kodu</th>
                <th className="py-3 px-4 font-semibold">Ana Müşteri</th>
                <th className="py-3 px-4 font-semibold">Fatura No</th>
                <th className="py-3 px-4 font-semibold text-right">Fatura Tutarı</th>
                <th className="py-3 px-4 font-semibold text-center">Durum Çubuğu</th>
                <th className="py-3 px-4 font-semibold text-center">Durum Güncelle</th>
                <th className="py-3 px-4 font-semibold text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clientInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    Henüz fatura kaydı bulunmamaktadır.
                  </td>
                </tr>
              ) : (
                clientInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-600">
                      {inv.projectCode}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {inv.clientName}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-gray-700">
                      <span 
                        onClick={() => handleOpenEdit(inv)}
                        className="cursor-pointer hover:underline text-gray-700"
                        title="Faturayı düzenlemek için tıklayın"
                      >
                        {inv.invoiceNumber || <span className="text-gray-400 italic">(Fatura No Gir)</span>}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900 text-sm">
                      ₺{inv.invoiceAmount.toLocaleString('tr-TR')}
                    </td>

                    {/* Status Indicator */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {inv.status === 'collected' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Tahsil Edildi</span>
                        </span>
                      )}

                      {inv.status === 'invoiced' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-bold text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Fatura Kesildi (Vade Bekliyor)</span>
                        </span>
                      )}

                      {inv.status === 'not_invoiced' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-semibold text-xs">
                          <span>Taslak / Kesilmedi</span>
                        </span>
                      )}
                    </td>

                    {/* Action Dropdown / Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <select
                        value={inv.status}
                        onChange={(e) => updateInvoiceStatus(inv.id, e.target.value as InvoiceStatus)}
                        className="px-3 py-1 rounded-xl bg-white border border-gray-300 text-xs text-gray-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                      >
                        <option value="not_invoiced">Taslak</option>
                        <option value="invoiced">Fatura Kesildi</option>
                        <option value="collected">Tahsil Edildi</option>
                      </select>
                    </td>

                    {/* Edit & Delete Action Buttons */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(inv)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-sky-50 text-gray-600 hover:text-sky-600 transition-colors cursor-pointer"
                          title="Faturayı Düzenle"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteInvoice(inv)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-50 text-gray-500 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Faturayı Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: EDIT INVOICE */}
      {isEditModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 text-gray-900 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-600" />
                <span>Faturayı Düzenle</span>
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Proje Kodu</label>
                <input
                  type="text"
                  required
                  value={formProjectCode}
                  onChange={(e) => setFormProjectCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-mono font-bold text-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Ana Müşteri Adı</label>
                <input
                  type="text"
                  required
                  value={formClientName}
                  onChange={(e) => setFormClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Fatura Numarası</label>
                  <input
                    type="text"
                    value={formInvoiceNumber}
                    onChange={(e) => setFormInvoiceNumber(e.target.value)}
                    placeholder="Örn: IPS-2026-001"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Fatura Tutarı (TL)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={formInvoiceAmount}
                    onChange={(e) => setFormInvoiceAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Fatura Durumu</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as InvoiceStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                >
                  <option value="not_invoiced">Taslak / Kesilmedi</option>
                  <option value="invoiced">Fatura Kesildi (Vade Bekliyor)</option>
                  <option value="collected">Tahsil Edildi</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Notlar (Opsiyonel)</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Fatura notları..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Kaydet & Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD INVOICE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 text-gray-900 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-600" />
                <span>Yeni Müşteri Faturası Ekle</span>
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Mevcut Projelerden Seç veya Kod Yaz</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Örn: RMSR2480"
                    value={formProjectCode}
                    onChange={(e) => setFormProjectCode(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-mono font-bold text-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  {projects.length > 0 && (
                    <select
                      onChange={(e) => {
                        const p = projects.find(proj => proj.id === e.target.value);
                        if (p) {
                          setFormProjectCode(p.code);
                          setFormClientName(p.clientName);
                          setFormInvoiceAmount(p.clientTotalBudget);
                        }
                      }}
                      className="px-2 py-2 rounded-xl bg-gray-50 border border-gray-300 text-xs text-gray-700"
                    >
                      <option value="">Seç...</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.code}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Ana Müşteri Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ipsos Türkiye"
                  value={formClientName}
                  onChange={(e) => setFormClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Fatura Numarası</label>
                  <input
                    type="text"
                    value={formInvoiceNumber}
                    onChange={(e) => setFormInvoiceNumber(e.target.value)}
                    placeholder="Örn: IPS-2026-001"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Fatura Tutarı (TL)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={formInvoiceAmount}
                    onChange={(e) => setFormInvoiceAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Fatura Durumu</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as InvoiceStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                >
                  <option value="not_invoiced">Taslak / Kesilmedi</option>
                  <option value="invoiced">Fatura Kesildi (Vade Bekliyor)</option>
                  <option value="collected">Tahsil Edildi</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Notlar (Opsiyonel)</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Fatura notları..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Faturayı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
