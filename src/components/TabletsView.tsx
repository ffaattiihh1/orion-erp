'use client';

import React, { useMemo, useState } from 'react';
import { useApp, normalizeTurkishText } from '@/context/AppContext';
import type { Tablet, TabletStatus } from '@/types';
import { TabletSmartphone, Plus, Search, X, UserPlus, Undo2, Pencil, Trash2, Copy, AlertTriangle, History, FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';

const STATUS: Record<TabletStatus, { label: string; cls: string }> = {
  zimmetli: { label: 'Zimmetli', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  depoda: { label: 'Depoda', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  serviste: { label: 'Serviste', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  kayip: { label: 'Kayıp / Çalıntı', cls: 'bg-red-50 text-red-700 border-red-200' },
};

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('tr-TR') : '-');
const inputCls = 'w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400';

type Modal =
  | { kind: 'edit'; tablet?: Tablet }
  | { kind: 'assign'; tablet: Tablet }
  | { kind: 'detail'; tablet: Tablet }
  | null;

export default function TabletsView() {
  const { tablets, currentUser } = useApp();
  const [filter, setFilter] = useState<TabletStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<Modal>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tablets.length, zimmetli: 0, depoda: 0, serviste: 0, kayip: 0 };
    tablets.forEach(t => { c[t.status] = (c[t.status] || 0) + 1; });
    return c;
  }, [tablets]);

  const term = normalizeTurkishText(search);
  const visible = tablets
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => !term || [t.code, t.imei, t.serialNumber, t.assignedPersonName, t.googleAccount, t.brand, t.model]
      .some(v => normalizeTurkishText(v).includes(term)))
    .sort((a, b) => a.code.localeCompare(b.code, 'tr', { numeric: true }));

  // Detay penceresi açıkken güncel kaydı göster
  const live = (t: Tablet) => tablets.find(x => x.id === t.id) || t;

  const handleExport = () => {
    exportToExcel(visible.map(t => ({
      'Kod': t.code,
      'Marka': t.brand || '',
      'Model': t.model || '',
      'IMEI': t.imei || '',
      'Seri No': t.serialNumber || '',
      'Google Hesabı': t.googleAccount || '',
      'SIM No': t.simNumber || '',
      'Durum': STATUS[t.status].label,
      'Zimmetli Kişi': t.assignedPersonName || '',
      'Zimmet Tarihi': t.assignedAt ? fmtDate(t.assignedAt) : '',
      'Not': t.notes || '',
    })), 'Orion_Tablet_Zimmet', 'Tabletler');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <TabletSmartphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Tablet Zimmet</h1>
            <p className="text-sm text-gray-500">Hangi tablet kimde, IMEI ve hesap bilgileri</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="px-3 py-3 rounded-xl bg-white border border-gray-200 cursor-pointer" title="Excel'e aktar" aria-label="Excel'e aktar">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          </button>
          <button onClick={() => setModal({ kind: 'edit' })} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm cursor-pointer">
            <Plus className="w-4 h-4" /> Tablet Ekle
          </button>
        </div>
      </div>

      {/* Durum filtreleri */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([['all', 'Tümü'], ['zimmetli', 'Zimmetli'], ['depoda', 'Depoda'], ['serviste', 'Serviste'], ['kayip', 'Kayıp']] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`shrink-0 px-3.5 py-2 rounded-full text-sm font-semibold border cursor-pointer ${filter === k ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200'}`}
          >
            {label} <span className="opacity-70">{counts[k] || 0}</span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kod, IMEI, seri no veya kişi ara…" className="w-full pl-10 pr-3 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>

      {visible.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-gray-200">
          <TabletSmartphone className="w-10 h-10 mx-auto text-gray-300" />
          <p className="mt-2 text-gray-600 font-semibold">{tablets.length === 0 ? 'Henüz tablet eklenmedi.' : 'Aramaya uyan tablet yok.'}</p>
          {tablets.length === 0 && <p className="text-sm text-gray-500 mt-1">“Tablet Ekle” ile ilk tableti kaydedin.</p>}
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(t => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <button onClick={() => setModal({ kind: 'detail', tablet: t })} className="w-full text-left cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-lg font-black text-gray-900 font-mono">{t.code}</p>
                    <p className="text-sm text-gray-500 truncate">{[t.brand, t.model].filter(Boolean).join(' ') || 'Marka/model girilmedi'}</p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS[t.status].cls}`}>{STATUS[t.status].label}</span>
                </div>
                {t.status === 'zimmetli' && t.assignedPersonName && (
                  <p className="mt-2 text-sm text-gray-800">
                    <strong>{t.assignedPersonName}</strong>
                    <span className="text-gray-500"> · {fmtDate(t.assignedAt)}’den beri</span>
                  </p>
                )}
                {t.imei && <p className="mt-1 text-xs text-gray-500 font-mono">IMEI {t.imei}</p>}
              </button>
              <div className="mt-3 flex gap-2">
                {t.status === 'zimmetli' ? (
                  <ReturnButton tablet={t} />
                ) : (
                  <button
                    onClick={() => setModal({ kind: 'assign', tablet: t })}
                    disabled={t.status === 'kayip'}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-bold cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" /> Zimmetle
                  </button>
                )}
                <button onClick={() => setModal({ kind: 'detail', tablet: t })} className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 cursor-pointer">Detay</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal?.kind === 'edit' && <EditTabletModal tablet={modal.tablet} onClose={() => setModal(null)} />}
      {modal?.kind === 'assign' && <AssignModal tablet={live(modal.tablet)} onClose={() => setModal(null)} />}
      {modal?.kind === 'detail' && (
        <DetailModal
          tablet={live(modal.tablet)}
          isAdmin={currentUser?.role === 'admin'}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ kind: 'edit', tablet: live(modal.tablet) })}
          onAssign={() => setModal({ kind: 'assign', tablet: live(modal.tablet) })}
        />
      )}
    </div>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer" aria-label="Kapat"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ReturnButton({ tablet }: { tablet: Tablet }) {
  const { returnTablet } = useApp();
  const [confirm, setConfirm] = useState(false);
  if (confirm) {
    return (
      <div className="flex-1 flex gap-1.5">
        <button onClick={() => { returnTablet(tablet.id); setConfirm(false); }} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold cursor-pointer">İade alındı</button>
        <button onClick={() => setConfirm(false)} className="px-3 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm cursor-pointer">Vazgeç</button>
      </div>
    );
  }
  return (
    <button onClick={() => setConfirm(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 text-sm font-bold cursor-pointer">
      <Undo2 className="w-4 h-4" /> İade Al
    </button>
  );
}

function EditTabletModal({ tablet, onClose }: { tablet?: Tablet; onClose: () => void }) {
  const { tablets, saveTablet } = useApp();
  const nextCode = useMemo(() => {
    const nums = tablets.map(t => Number((t.code.match(/(\d+)\s*$/) || [])[1])).filter(n => !isNaN(n));
    const n = (nums.length ? Math.max(...nums) : 0) + 1;
    return `TB-${String(n).padStart(2, '0')}`;
  }, [tablets]);

  const [f, setF] = useState({
    code: tablet?.code || nextCode,
    brand: tablet?.brand || '',
    model: tablet?.model || '',
    imei: tablet?.imei || '',
    serialNumber: tablet?.serialNumber || '',
    googleAccount: tablet?.googleAccount || '',
    simNumber: tablet?.simNumber || '',
    notes: tablet?.notes || '',
  });
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(prev => ({ ...prev, [k]: e.target.value }));

  const imeiDigits = f.imei.replace(/\D/g, '');
  const dupCode = tablets.find(t => t.id !== tablet?.id && normalizeTurkishText(t.code) === normalizeTurkishText(f.code));
  const dupImei = imeiDigits && tablets.find(t => t.id !== tablet?.id && (t.imei || '').replace(/\D/g, '') === imeiDigits);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!f.code.trim()) return setError('Tablet kodu gerekli (tabletin üzerine yazılan etiket, örn. TB-07).');
    if (dupCode) return setError(`${f.code} kodu zaten kullanılıyor.`);
    if (imeiDigits && imeiDigits.length !== 15) return setError('IMEI 15 haneli olmalı (*#06# ile görülür). Wi-Fi tablette IMEI yoksa boş bırakın.');
    if (dupImei) return setError(`Bu IMEI zaten ${dupImei.code} tabletinde kayıtlı.`);
    saveTablet({
      id: tablet?.id,
      code: f.code.trim().toUpperCase(),
      brand: f.brand.trim() || undefined,
      model: f.model.trim() || undefined,
      imei: imeiDigits || undefined,
      serialNumber: f.serialNumber.trim() || undefined,
      googleAccount: f.googleAccount.trim() || undefined,
      simNumber: f.simNumber.trim() || undefined,
      notes: f.notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Sheet title={tablet ? `${tablet.code} — Düzenle` : 'Yeni Tablet'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3.5">
        <Field label="Tablet kodu" hint="Tabletin arkasına yapıştıracağınız etiket">
          <input value={f.code} onChange={set('code')} className={`${inputCls} font-mono font-bold uppercase`} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Marka"><input value={f.brand} onChange={set('brand')} placeholder="Samsung" className={inputCls} /></Field>
          <Field label="Model"><input value={f.model} onChange={set('model')} placeholder="Galaxy Tab A9" className={inputCls} /></Field>
        </div>
        <Field label="IMEI" hint="Tablette *#06# tuşlayın ya da kutunun üzerine bakın">
          <input value={f.imei} onChange={set('imei')} inputMode="numeric" placeholder="15 haneli" className={`${inputCls} font-mono`} />
        </Field>
        <Field label="Seri no"><input value={f.serialNumber} onChange={set('serialNumber')} className={`${inputCls} font-mono`} /></Field>
        <Field label="Cihazdaki Google hesabı" hint="“Cihazımı Bul” bu hesapla çalışır">
          <input value={f.googleAccount} onChange={set('googleAccount')} type="email" placeholder="tablet07@…" className={inputCls} />
        </Field>
        <Field label="SIM numarası"><input value={f.simNumber} onChange={set('simNumber')} inputMode="tel" className={inputCls} /></Field>
        <Field label="Not"><textarea value={f.notes} onChange={set('notes')} rows={2} placeholder="Kılıf, şarj aleti, ekran çizik…" className={inputCls} /></Field>
        {error && <p className="text-sm text-red-600 flex gap-1.5"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}</p>}
        <button type="submit" className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer">Kaydet</button>
      </form>
    </Sheet>
  );
}

function AssignModal({ tablet, onClose }: { tablet: Tablet; onClose: () => void }) {
  const { assignTablet, personnel, projects, tablets } = useApp();
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const names = useMemo(
    () => personnel.filter(p => !p.isBlacklisted).map(p => p.fullName).sort((a, b) => a.localeCompare(b, 'tr')),
    [personnel]
  );
  const norm = normalizeTurkishText(name);
  const blacklisted = norm ? personnel.find(p => p.isBlacklisted && normalizeTurkishText(p.fullName) === norm) : undefined;
  const alreadyHas = norm ? tablets.filter(t => t.id !== tablet.id && t.status === 'zimmetli' && normalizeTurkishText(t.assignedPersonName) === norm) : [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Kime verildiğini yazın.');
    assignTablet(tablet.id, name, projectId || undefined, note.trim() || undefined);
    onClose();
  };

  return (
    <Sheet title={`${tablet.code} — Zimmetle`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3.5">
        <Field label="Kime verildi?">
          <input list="tablet-person-list" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ad Soyad" autoComplete="off" className={inputCls} />
          <datalist id="tablet-person-list">{names.map(n => <option key={n} value={n} />)}</datalist>
        </Field>
        {blacklisted && <p className="text-sm text-red-600">Bu kişi kara listede{blacklisted.blacklistReason ? `: ${blacklisted.blacklistReason}` : ''}.</p>}
        {alreadyHas.length > 0 && <p className="text-sm text-amber-700">Bu kişide zaten {alreadyHas.map(t => t.code).join(', ')} var.</p>}
        <Field label="Hangi proje için? (isteğe bağlı)">
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls}>
            <option value="">—</option>
            {projects.filter(p => !p.isArchived).map(p => <option key={p.id} value={p.id}>{p.code} — {p.title}</option>)}
          </select>
        </Field>
        <Field label="Not (isteğe bağlı)"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Şarj aleti ile verildi…" className={inputCls} /></Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer">Zimmetle</button>
      </form>
    </Sheet>
  );
}

function DetailModal({ tablet, isAdmin, onClose, onEdit, onAssign }: { tablet: Tablet; isAdmin: boolean; onClose: () => void; onEdit: () => void; onAssign: () => void }) {
  const { setTabletStatus, deleteTablet, projects } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (label: string, v?: string) => {
    if (!v) return;
    navigator.clipboard?.writeText(v).then(() => { setCopied(label); setTimeout(() => setCopied(null), 1500); }).catch(() => {});
  };
  const proj = projects.find(p => p.id === tablet.assignedProjectId);

  return (
    <Sheet title={tablet.code} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-sm font-bold border ${STATUS[tablet.status].cls}`}>{STATUS[tablet.status].label}</span>
          {copied && <span className="text-xs text-emerald-700">{copied} kopyalandı</span>}
        </div>

        {tablet.status === 'zimmetli' && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-sm">
            <p className="text-gray-900"><strong>{tablet.assignedPersonName}</strong></p>
            <p className="text-gray-600">{fmtDate(tablet.assignedAt)}’den beri{proj ? ` · ${proj.code}` : ''}</p>
          </div>
        )}

        <div>
          <InfoRow label="Marka / Model" value={[tablet.brand, tablet.model].filter(Boolean).join(' ')} />
          <InfoRow label="IMEI" value={tablet.imei} mono copyable onCopy={copy} />
          <InfoRow label="Seri no" value={tablet.serialNumber} mono copyable onCopy={copy} />
          <InfoRow label="Google hesabı" value={tablet.googleAccount} copyable onCopy={copy} />
          <InfoRow label="SIM" value={tablet.simNumber} copyable onCopy={copy} />
          {tablet.notes && <InfoRow label="Not" value={tablet.notes} />}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {tablet.status === 'zimmetli' ? <ReturnButton tablet={tablet} /> : (
            <button onClick={onAssign} disabled={tablet.status === 'kayip'} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 disabled:opacity-40 text-white text-sm font-bold cursor-pointer">
              <UserPlus className="w-4 h-4" /> Zimmetle
            </button>
          )}
          <button onClick={onEdit} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 cursor-pointer">
            <Pencil className="w-4 h-4" /> Düzenle
          </button>
          {tablet.status !== 'serviste' && tablet.status !== 'zimmetli' && (
            <button onClick={() => setTabletStatus(tablet.id, 'serviste')} className="py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm font-semibold cursor-pointer">Servise gönder</button>
          )}
          {tablet.status !== 'kayip' && (
            <button onClick={() => setTabletStatus(tablet.id, 'kayip')} className="py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold cursor-pointer">Kayıp / çalıntı</button>
          )}
          {(tablet.status === 'serviste' || tablet.status === 'kayip') && (
            <button onClick={() => setTabletStatus(tablet.id, 'depoda')} className="py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold cursor-pointer">Depoya döndü</button>
          )}
        </div>

        {tablet.status === 'kayip' && (
          <p className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-800">
            Hemen <strong>google.com/android/find</strong> adresinden {tablet.googleAccount ? <strong>{tablet.googleAccount}</strong> : 'cihazdaki Google hesabıyla'} giriş yapıp tableti kilitleyin. IMEI ile operatöre ve karakola bildirim yapabilirsiniz.
          </p>
        )}

        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold text-gray-900 mb-2"><History className="w-4 h-4" /> Geçmiş</p>
          <ul className="space-y-1.5">
            {tablet.history.map(h => (
              <li key={h.id} className="text-sm flex gap-2">
                <span className="text-gray-500 w-20 shrink-0">{fmtDate(h.at)}</span>
                <span className="text-gray-800">
                  {h.action === 'eklendi' && 'Kayda eklendi'}
                  {h.action === 'zimmet' && <>Zimmet → <strong>{h.personName}</strong>{h.projectCode ? ` (${h.projectCode})` : ''}</>}
                  {h.action === 'iade' && <>İade ← <strong>{h.personName}</strong></>}
                  {h.action === 'durum' && <>Durum: {h.note}</>}
                  {h.action !== 'durum' && h.note ? ` — ${h.note}` : ''}
                  {h.byName ? <span className="text-gray-400"> · {h.byName}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {isAdmin && (
          confirmDelete ? (
            <div className="flex gap-2">
              <button onClick={() => { deleteTablet(tablet.id); onClose(); }} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold cursor-pointer">Kaydı kalıcı sil</button>
              <button onClick={() => setConfirmDelete(false)} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm cursor-pointer">Vazgeç</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-gray-500 hover:text-red-600 cursor-pointer">
              <Trash2 className="w-4 h-4" /> Tableti kayıttan sil
            </button>
          )
        )}
      </div>
    </Sheet>
  );
}

function InfoRow({ label, value, mono, copyable, onCopy }: { label: string; value?: string; mono?: boolean; copyable?: boolean; onCopy?: (label: string, v?: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className={`text-sm text-gray-900 text-right break-all ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
        {copyable && value && (
          <button onClick={() => onCopy?.(label, value)} className="ml-2 inline-flex align-middle text-gray-400 hover:text-blue-600 cursor-pointer" aria-label={`${label} kopyala`}>
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}
      </span>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-gray-700 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-500 mt-1">{hint}</span>}
    </label>
  );
}
