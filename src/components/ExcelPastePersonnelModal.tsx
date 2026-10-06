'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  X, 
  FileSpreadsheet, 
  ClipboardPaste, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Download,
  Sparkles,
  Trash2
} from 'lucide-react';
import { downloadPersonnelTemplate } from '@/lib/excel-export';
import { Personnel } from '@/types';

interface ParsedPersonnelRow {
  fullName: string;
  identityNumber?: string;
  phone: string;
  city: string;
  defaultUnitPrice: number;
}

interface ExcelPastePersonnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (addedCount: number) => void;
}

export default function ExcelPastePersonnelModal({ 
  isOpen, 
  onClose,
  onSuccess 
}: ExcelPastePersonnelModalProps) {
  const { addMultiplePersonnel } = useApp();

  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedPersonnelRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const sampleData = `Ad Soyad\tTC Kimlik\tTelefon\tŞehir\tBirim Fiyat
Ahmet Yılmaz\t12345678901\t0532 123 45 67\tİstanbul\t180
Ayşe Kaya\t98765432109\t0543 987 65 43\tAnkara\t180
Mehmet Demir\t45678912305\t0555 456 78 90\tİzmir\t200
Fatma Çelik\t32165498701\t0533 111 22 33\tBursa\t180
Caner Öztürk\t65498732104\t0505 222 33 44\tAntalya\t180`;

  const parseClipboardText = (text: string) => {
    try {
      setParseError(null);
      if (!text.trim()) {
        setParsedRows([]);
        return;
      }

      const lines = text.trim().split(/\r?\n/);
      const rows: ParsedPersonnelRow[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by tabs or multiple spaces / semicolons
        let cols = line.split('\t').map(c => c.trim());
        if (cols.length === 1 && line.includes(';')) {
          cols = line.split(';').map(c => c.trim());
        }

        // Skip header row if it contains 'AD' or 'TC' or 'SOYAD'
        const lineUpper = line.toUpperCase();
        if (
          i === 0 && (
            lineUpper.includes('AD SOYAD') || 
            lineUpper.includes('TC') || 
            lineUpper.includes('TELEFON') ||
            lineUpper.includes('KULLANICI')
          )
        ) {
          continue;
        }

        // Clean numbers
        const cleanTc = (val?: string) => {
          if (!val) return '';
          return val.replace(/\D/g, '').trim();
        };

        const cleanPhone = (val?: string) => {
          if (!val) return '';
          const digits = val.replace(/\D/g, '');
          if (digits.length === 10) return '0' + digits;
          if (digits.length === 11 && digits.startsWith('0')) return digits;
          return val.trim();
        };

        // Extraction heuristic:
        // Col 0: Ad Soyad (or TC if first)
        // Col 1: TC Kimlik or Ad Soyad
        // Col 2: Telefon
        // Col 3: Şehir (optional)
        // Col 4: Birim Fiyat (optional)
        let fullName = '';
        let tc = '';
        let phone = '';
        let city = 'İstanbul';
        let birimFiyat = 180;

        // Case A: 3+ columns
        if (cols.length >= 3) {
          // Check if first col is TC (all digits)
          if (/^\d{7,11}$/.test(cleanTc(cols[0]))) {
            tc = cleanTc(cols[0]);
            fullName = cols[1];
            phone = cleanPhone(cols[2]);
          } else {
            fullName = cols[0];
            tc = cleanTc(cols[1]);
            phone = cleanPhone(cols[2]);
          }

          if (cols[3]) city = cols[3];
          if (cols[4]) {
            const p = parseFloat(cols[4].replace(/[^\d.,]/g, '').replace(',', '.'));
            if (!isNaN(p) && p > 0) birimFiyat = p;
          }
        } 
        // Case B: 2 columns (Name and Phone, or Name and TC)
        else if (cols.length === 2) {
          fullName = cols[0];
          const second = cols[1];
          if (second.includes('05') || second.replace(/\D/g, '').length === 10 || second.replace(/\D/g, '').length === 11) {
            phone = cleanPhone(second);
          } else {
            tc = cleanTc(second);
          }
        } else {
          // Single col fallback
          fullName = cols[0];
        }

        if (fullName && fullName.length >= 2) {
          rows.push({
            fullName: fullName.trim(),
            identityNumber: tc || undefined,
            phone: phone || '-',
            city: city.trim() || 'İstanbul',
            defaultUnitPrice: birimFiyat
          });
        }
      }

      setParsedRows(rows);
      if (rows.length === 0) {
        setParseError('Yapıştırılan metinden personel satırı okunamadı. Lütfen sütunları kontrol edin.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ayrıştırma hatası';
      setParseError('Ayrıştırma hatası: ' + msg);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    parseClipboardText(val);
  };

  const handleFillSample = () => {
    setRawText(sampleData);
    parseClipboardText(sampleData);
  };

  const handleClear = () => {
    setRawText('');
    setParsedRows([]);
    setParseError(null);
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;
    setIsImporting(true);

    try {
      const itemsToAdd = parsedRows.map(r => ({
        fullName: r.fullName,
        identityNumber: r.identityNumber,
        phone: r.phone !== '-' ? r.phone : '',
        city: r.city,
        defaultRole: 'anketor' as const,
        defaultUnitPrice: r.defaultUnitPrice,
        notes: 'Excel toplu aktarımdan eklendi'
      }));

      const added = addMultiplePersonnel(itemsToAdd);

      if (onSuccess) onSuccess(added);
      onClose();
      handleClear();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setParseError('Aktarım sırasında hata oluştu: ' + msg);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header (Ipsos / Modern style) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Excel Entegrasyonu
                </span>
                <span className="text-xs text-gray-400">Yönetim &gt; Kullanıcı / Personel Ekleme</span>
              </div>
              <h2 className="text-base font-bold text-gray-900 mt-0.5">
                Kullanıcıları / Personelleri İçeri Aktar
              </h2>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">

          {/* Info & Layout (Matching User's Image) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Left box: Instructions */}
            <div className="md:col-span-4 p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Kullanıcıları İçeri Aktar
                </p>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Excel dosyanızdaki sütunları seçip kopyalayın (<kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[11px] font-mono">Ctrl+C</kbd>) ve sağdaki kutucuğa yapıştırın (<kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[11px] font-mono">Ctrl+V</kbd>).
                </p>

                <div className="mt-3 p-2.5 rounded-lg bg-white border border-gray-200 text-[11px] text-gray-600 space-y-1">
                  <p className="font-semibold text-gray-800">Desteklenen Sütun Sırası:</p>
                  <p className="text-emerald-700 font-mono text-[10px]">
                    1. Ad Soyad | 2. TC Kimlik | 3. Telefon | 4. Şehir | 5. Ücret
                  </p>
                  <p className="text-gray-400 text-[10px] mt-1">
                    * Başlık satırı olsa da sistem otomatik tanır ve atlar.
                  </p>
                </div>
              </div>

              {/* Download Template Button */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={downloadPersonnelTemplate}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>ŞABLONU AÇ / İNDİR (.XLSX)</span>
                </button>
              </div>
            </div>

            {/* Right box: Paste Textarea */}
            <div className="md:col-span-8 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="font-semibold text-gray-700">Excel Verisi Yapıştırma Alanı:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFillSample}
                    className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Örnek Doldur</span>
                  </button>
                  {rawText && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="flex items-center gap-1 text-[11px] text-red-600 hover:text-red-800 font-medium cursor-pointer ml-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Temizle</span>
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={rawText}
                onChange={handleTextChange}
                rows={7}
                placeholder="Excel'den kopyaladığınız satırları buraya yapıştırın... (Örn: Ahmet Yılmaz	12345678901	05321234567)"
                className="w-full p-3 font-mono text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-gray-400"
              />

              {parseError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>

          </div>

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-gray-800">
                    Önizleme ({parsedRows.length} Personel Algılandı)
                  </span>
                </div>
                <span className="text-[11px] text-gray-400">
                  * Bilgiler doğrulanıp sisteme ortak havuz olarak eklenecektir.
                </span>
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Ad Soyad</th>
                      <th className="py-2 px-3">TC Kimlik No</th>
                      <th className="py-2 px-3">Telefon</th>
                      <th className="py-2 px-3">Şehir</th>
                      <th className="py-2 px-3 text-right">Birim Fiyat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white text-gray-700">
                    {parsedRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-1.5 px-3 font-mono text-[10px] text-gray-400">{idx + 1}</td>
                        <td className="py-1.5 px-3 font-semibold text-gray-900">{r.fullName}</td>
                        <td className="py-1.5 px-3 font-mono text-gray-600">
                          {r.identityNumber || <span className="text-gray-300">-</span>}
                        </td>
                        <td className="py-1.5 px-3 font-mono text-gray-600">
                          {r.phone || <span className="text-gray-300">-</span>}
                        </td>
                        <td className="py-1.5 px-3 text-gray-600">{r.city}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-medium text-emerald-600">
                          ₺{r.defaultUnitPrice}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="confirmAgreement" 
              defaultChecked 
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="confirmAgreement" className="text-xs text-gray-600 cursor-pointer">
              Tüm projelerde ortak kullanılabilir havuz personeli olarak ekle
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
            >
              Vazgeç
            </button>

            <button
              type="button"
              disabled={parsedRows.length === 0 || isImporting}
              onClick={handleImport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <ClipboardPaste className="w-4 h-4" />
              <span>
                {isImporting ? 'İçeri Aktarılıyor...' : `İÇERİ AKTAR (${parsedRows.length} KİŞİ)`}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
