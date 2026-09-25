'use client';

import React, { useState } from 'react';
import { useApp, ExcelImportRow } from '@/context/AppContext';
import { 
  X, 
  FileSpreadsheet, 
  ClipboardPaste, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles,
  RefreshCw 
} from 'lucide-react';

interface ExcelPasteSettlementModalProps {
  projectId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ExcelPasteSettlementModal({ 
  projectId, 
  isOpen, 
  onClose,
  onSuccess 
}: ExcelPasteSettlementModalProps) {
  const { projects, importSettlementsFromExcel, getPersonnelNetAdvance } = useApp();

  const [selectedProjectId, setSelectedProjectId] = useState(projectId || projects[0]?.id || '');
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ExcelImportRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Sample data matching user's image for quick testing
  const sampleExcelData = 
`IL	TC	ANKETÖR	TOPLAM	İPTAL	GEÇERLİ	verilen	tutar	not
Ankara	6851974	HACER KARA	7	0	7	₺320,00	₺2.240,00	
Ankara	3705002	ALİ ACAR	5	0	5	₺320,00	₺1.600,00	
Ankara	1101596	DENİZ DERİN	6	1	5	₺320,00	₺1.600,00	
Ankara	1272877	HASAN TAŞ	7	0	7	₺320,00	₺2.240,00	
Ankara	2392087	CİHAN YILMAZ	6	0	6	₺320,00	₺1.920,00	
Ankara	4147286	AYLA AKAT	6	0	6	₺320,00	₺1.920,00	`;

  const parseClipboardText = (text: string) => {
    try {
      setParseError(null);
      if (!text.trim()) {
        setParsedRows([]);
        return;
      }

      const lines = text.trim().split(/\r?\n/);
      const rows: ExcelImportRow[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by tabs or multiple spaces/semicolon
        const cols = line.split('\t').map(c => c.trim());

        // Skip header row if it contains 'ANKETÖR' or 'TOPLAM' or 'IL'
        const firstColUpper = cols[0]?.toUpperCase() || '';
        const secondColUpper = cols[1]?.toUpperCase() || '';
        const thirdColUpper = cols[2]?.toUpperCase() || '';

        if (
          firstColUpper.includes('IL') || 
          secondColUpper.includes('TC') || 
          thirdColUpper.includes('ANKETÖR') ||
          firstColUpper.includes('ANKETÖR')
        ) {
          continue;
        }

        // Clean currency string (e.g. "₺320,00" -> 320, "1.600,00" -> 1600)
        const cleanNumber = (val: string | undefined): number => {
          if (!val) return 0;
          const cleaned = val
            .replace(/₺/g, '')
            .replace(/TL/gi, '')
            .replace(/\./g, '') // remove thousands dot
            .replace(/,/g, '.') // convert decimal comma to dot
            .trim();
          const num = parseFloat(cleaned);
          return isNaN(num) ? 0 : num;
        };

        let city = 'Ankara';
        let tc = '';
        let anketorName = '';
        let toplam = 0;
        let iptal = 0;
        let birimFiyat = 320;
        let not = '';

        if (cols.length >= 7) {
          // Standard Format from Image: IL, TC, ANKETÖR, TOPLAM, İPTAL, GEÇER, VERİLEN, TUTAR, NOT
          city = cols[0] || 'Ankara';
          tc = cols[1] || '';
          anketorName = cols[2] || '';
          toplam = cleanNumber(cols[3]);
          iptal = cleanNumber(cols[4]);
          birimFiyat = cleanNumber(cols[6]) || 320;
          not = cols[8] || cols[7] || '';
        } else if (cols.length >= 4) {
          // Compact Format: ANKETÖR, TOPLAM, İPTAL, FİYAT
          anketorName = cols[0];
          toplam = cleanNumber(cols[1]);
          iptal = cleanNumber(cols[2]);
          birimFiyat = cleanNumber(cols[3]) || 320;
          not = cols[4] || '';
        } else if (cols.length >= 2) {
          // Minimal Format: ANKETÖR, TOPLAM
          anketorName = cols[0];
          toplam = cleanNumber(cols[1]);
          iptal = 0;
          birimFiyat = 320;
        }

        if (anketorName) {
          rows.push({
            city,
            identityNumber: tc,
            personnelName: anketorName,
            totalSurveys: toplam,
            invalidSurveys: iptal,
            unitPrice: birimFiyat,
            notes: not
          });
        }
      }

      setParsedRows(rows);
      if (rows.length === 0) {
        setParseError('Yapıştırılan metinden geçerli anketör satırı ayrıştırılamadı. Lütfen sütunları kontrol edin.');
      }
    } catch (err: any) {
      setParseError('Ayrıştırma hatası: ' + err.message);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    parseClipboardText(val);
  };

  const handleFillSample = () => {
    setRawText(sampleExcelData);
    parseClipboardText(sampleExcelData);
  };

  const handleCommitImport = () => {
    if (!selectedProjectId) {
      alert('Lütfen hakedişlerin yükleneceği projeyi seçin.');
      return;
    }

    if (parsedRows.length === 0) {
      alert('İçe aktarılacak satır bulunamadı.');
      return;
    }

    const res = importSettlementsFromExcel(selectedProjectId, parsedRows);
    alert(`Başarılı! ${res.importedCount} anketörün hakedişi projeye aktarıldı ve net hakedişler hesaplandı.`);
    
    if (onSuccess) onSuccess();
    onClose();
  };

  const targetProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              <ClipboardPaste className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Excel'den Toplu Hakediş Kopyala & Yapıştır</h2>
              <p className="text-xs text-slate-400">Excel tablosunu kopyalayıp buraya yapıştırın, sistem otomatik anketör ve hakedişleri hesaplasın</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Selector & Sample Fill Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 my-4">
          <div className="sm:col-span-8">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Hakedişlerin Yükleneceği Proje
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-medium"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.title} ({p.clientName})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4 flex items-end">
            <button
              type="button"
              onClick={handleFillSample}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-sky-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Örnek Excel Formatını Doldur</span>
            </button>
          </div>
        </div>

        {/* Textarea Paste Area */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-300">
              Excel'den Kopyalanan Hücreleri Buraya Yapıştırın (Ctrl + V):
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Format: IL • TC • ANKETÖR • TOPLAM • İPTAL • VERİLEN
            </span>
          </div>

          <textarea
            rows={5}
            value={rawText}
            onChange={handleTextChange}
            placeholder="Excel tablonuzu seçip kopyalayın (Ctrl+C) ve bu alana yapıştırın (Ctrl+V)..."
            className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 font-mono text-xs text-emerald-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          {parseError && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{parseError}</span>
            </div>
          )}
        </div>

        {/* Live Parse Preview Table */}
        {parsedRows.length > 0 && (
          <div className="flex-1 space-y-2 mb-4 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Ayrıştırılan Hakediş Önizlemesi ({parsedRows.length} Anketör Satırı)</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Hedef Proje: <strong className="text-sky-400">{targetProject?.code}</strong>
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 flex-1 max-h-56">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px] sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">İL</th>
                    <th className="py-2 px-3">TC</th>
                    <th className="py-2 px-3">ANKETÖR</th>
                    <th className="py-2 px-3 text-center">TOPLAM</th>
                    <th className="py-2 px-3 text-center text-rose-400">İPTAL</th>
                    <th className="py-2 px-3 text-center text-sky-400">GEÇERLİ</th>
                    <th className="py-2 px-3 text-right">BİRİM FİYAT</th>
                    <th className="py-2 px-3 text-right">BRÜT TUTAR</th>
                    <th className="py-2 px-3 text-right text-amber-400">KESİLEN AVANS</th>
                    <th className="py-2 px-3 text-right text-emerald-400 font-bold">NET ÖDENECEK</th>
                    <th className="py-2 px-3">NOT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {parsedRows.map((row, idx) => {
                    const valid = Math.max(0, row.totalSurveys - row.invalidSurveys);
                    const gross = valid * row.unitPrice;
                    const adv = getPersonnelNetAdvance(selectedProjectId, row.personnelName, row.identityNumber);
                    const net = Math.max(0, gross - adv);

                    return (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 text-slate-400">{row.city || 'Ankara'}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-400">{row.identityNumber || '-'}</td>
                        <td className="py-2 px-3 font-bold text-white">{row.personnelName}</td>
                        <td className="py-2 px-3 text-center font-mono">{row.totalSurveys}</td>
                        <td className="py-2 px-3 text-center font-mono text-rose-400">{row.invalidSurveys}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-sky-300 bg-sky-500/5">{valid}</td>
                        <td className="py-2 px-3 text-right font-mono">₺{row.unitPrice}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-300">₺{gross.toLocaleString('tr-TR')}</td>
                        <td className="py-2 px-3 text-right font-mono text-amber-400">
                          {adv > 0 ? `-₺${adv.toLocaleString('tr-TR')}` : '₺0'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-emerald-400 bg-emerald-500/5">
                          ₺{net.toLocaleString('tr-TR')}
                        </td>
                        <td className="py-2 px-3 text-slate-500 text-[11px]">{row.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex justify-between items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
          >
            Vazgeç
          </button>

          <button
            type="button"
            disabled={parsedRows.length === 0}
            onClick={handleCommitImport}
            className={`py-2.5 px-6 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
              parsedRows.length > 0
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <span>Hakedişleri Projeye Aktar & Hesapla ({parsedRows.length} Satır)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
