'use client';

import React, { useState } from 'react';
import { X, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { parseIcontrolPaste, type PastedProject } from '@/lib/icontrol-paste';
import ProjectStatusSync from '@/components/ProjectStatusSync';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Preview = { created: string[]; skipped: { code: string; reason: string }[] };

export default function IcontrolImportModal({ isOpen, onClose }: Props) {
  const { syncWithServer } = useApp();
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<PastedProject[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [done, setDone] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const reset = () => { setText(''); setParsed([]); setPreview(null); setDone(null); setError(null); };
  const close = () => { reset(); onClose(); };

  const call = async (projects: PastedProject[], dryRun: boolean): Promise<Preview | null> => {
    const res = await fetch('/api/projects/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun, projects: projects.map(p => ({ ...p, clientName: 'Ipsos' })) }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error || 'Sunucuya ulaşılamadı.');
      return null;
    }
    return { created: json.created, skipped: json.skipped };
  };

  const handleCheck = async () => {
    setError(null);
    const list = parseIcontrolPaste(text);
    if (list.length === 0) {
      setError('Yapıştırılan metinde proje kodu bulunamadı. iControl → Projelerim sayfasında Ctrl+A, Ctrl+C yapıp buraya yapıştırın.');
      return;
    }
    setParsed(list);
    setBusy(true);
    const p = await call(list, true);
    setBusy(false);
    if (p) setPreview(p);
  };

  const handleImport = async () => {
    setBusy(true);
    const toAdd = parsed.filter(p => preview?.created.includes(p.code));
    const r = await call(toAdd, false);
    setBusy(false);
    if (r) {
      setDone(r.created);
      await syncWithServer();
    }
  };

  const titleOf = (code: string) => parsed.find(p => p.code === code)?.title || '';

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">iControl&apos;den Proje Aktar</h3>
              <p className="text-sm text-gray-500">Sadece yeni projeler eklenir</p>
            </div>
          </div>
          <button onClick={close} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer" aria-label="Kapat">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {done ? (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold">{done.length > 0 ? `${done.length} proje eklendi.` : 'Eklenecek yeni proje yoktu.'}</p>
                  {done.length > 0 && <p className="text-sm mt-1">Birim fiyatları ve hedef anket sayısını projeyi açıp girmeyi unutmayın.</p>}
                </div>
              </div>
              <button onClick={close} className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold cursor-pointer">Tamam</button>
            </div>
          ) : !preview ? (
            <>
              <ol className="text-sm text-gray-700 space-y-1 list-decimal pl-5">
                <li>iControl&apos;de <strong>Projelerim</strong> sayfasını açın (<strong>Aktif</strong> sekmesi — biten projeleri ayırmak için önemli).</li>
                <li>Sayfada <strong>Ctrl+A</strong>, sonra <strong>Ctrl+C</strong> yapın.</li>
                <li>Aşağıdaki kutuya <strong>Ctrl+V</strong> ile yapıştırın.</li>
              </ol>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={7}
                placeholder="iControl Projelerim sayfasından kopyaladığınız metni buraya yapıştırın…"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {error && (
                <p className="text-sm text-red-600 flex gap-1.5"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}</p>
              )}
              <button
                onClick={handleCheck}
                disabled={busy || !text.trim()}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold cursor-pointer"
              >
                {busy ? 'Kontrol ediliyor…' : 'Kontrol Et'}
              </button>
            </>
          ) : (
            <>
              {preview.created.length > 0 ? (
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-2">Eklenecek yeni projeler ({preview.created.length})</p>
                  <ul className="space-y-1.5">
                    {preview.created.map(code => (
                      <li key={code} className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-sm">
                        <span className="font-mono font-bold text-emerald-800">{code}</span>
                        <span className="text-gray-700"> — {titleOf(code)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="p-3 rounded-xl bg-gray-50 text-sm text-gray-700">Yeni proje yok; hepsi sitede zaten var.</p>
              )}
              {preview.skipped.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-600">Atlananlar ({preview.skipped.length})</summary>
                  <ul className="mt-2 space-y-1 text-gray-600">
                    {preview.skipped.map(s => (
                      <li key={s.code}><span className="font-mono">{s.code}</span> — {s.reason}</li>
                    ))}
                  </ul>
                </details>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setPreview(null); setError(null); }} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold cursor-pointer">Geri</button>
                <button
                  onClick={handleImport}
                  disabled={busy || preview.created.length === 0}
                  className="flex-[2] py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold cursor-pointer"
                >
                  {busy ? 'Ekleniyor…' : `${preview.created.length} projeyi ekle`}
                </button>
              </div>
              <ProjectStatusSync activeCodes={parsed.map(p => p.code)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
