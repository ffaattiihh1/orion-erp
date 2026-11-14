'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import type { MdmDevice, Tablet } from '@/types';
import { fetchMdmDevices, mdmApi, tabletForDevice, ago, mapsUrl } from '@/lib/mdm-client';
import {
  ShieldCheck, RefreshCw, X, Lock, MapPinOff, MapPin, AlertTriangle, CheckCircle2, BatteryMedium,
  Settings, Link2, BellRing, Pencil, ExternalLink, Copy, Plus, LocateFixed,
} from 'lucide-react';

const inputCls = 'w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400';
const STALE_HOURS = 24;
const ZOHO_CONSOLE = 'https://api-console.zoho.eu';

interface Status {
  missingEnv: string[];
  connected: boolean;
  connectedAt: string | null;
  lostPhone: string;
  panelUrl: string;
  scopes: string;
}

export default function MdmView() {
  const { tablets } = useApp();
  const [status, setStatus] = useState<Status | null>(null);
  const [devices, setDevices] = useState<MdmDevice[] | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const loadDevices = useCallback(async (force = true) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetchMdmDevices(force);
      setDevices(r.devices);
      setFetchedAt(r.fetchedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cihazlar alınamadı');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const s = await mdmApi<Status>('/api/mdm/status');
      setStatus(s);
      if (s.connected && !s.missingEnv.length) await loadDevices(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Durum alınamadı');
    }
  }, [loadDevices]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ilk yükleme
    loadStatus();
  }, [loadStatus]);

  const ready = !!status && status.connected && !status.missingEnv.length;
  const lostCount = devices?.filter(d => d.lostMode).length || 0;
  const staleCount = devices?.filter(d => ago(d.lastSeenAt).hours > STALE_HOURS).length || 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Tablet MDM</h1>
            <p className="text-sm text-gray-500">Konum, pil, uzaktan kilit ve kayıp modu (ManageEngine)</p>
          </div>
        </div>
        {ready && (
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(true)} className="px-3 py-3 rounded-xl bg-white border border-gray-200 cursor-pointer" title="Ayarlar" aria-label="Ayarlar">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={() => loadDevices(true)} disabled={loading} className="px-3 py-3 rounded-xl bg-white border border-gray-200 cursor-pointer disabled:opacity-50" title="Yenile" aria-label="Yenile">
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setShowAdd(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm cursor-pointer">
              <Plus className="w-4 h-4" /> Yeni tablet
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-800 flex gap-1.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}
        </p>
      )}

      {!status ? (
        !error && <Spinner />
      ) : !ready ? (
        <SetupCard status={status} onConnected={loadStatus} />
      ) : (
        <>
          {devices && devices.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Kayıtlı" value={devices.length} />
              <Stat label={`${STALE_HOURS} saattir yok`} value={staleCount} warn={staleCount > 0} />
              <Stat label="Kayıp modu" value={lostCount} warn={lostCount > 0} />
            </div>
          )}
          {devices === null ? (loading && <Spinner />) : devices.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-gray-200">
              <ShieldCheck className="w-10 h-10 mx-auto text-gray-300" />
              <p className="mt-2 text-gray-600 font-semibold">ManageEngine’de kayıtlı tablet yok.</p>
              <p className="text-sm text-gray-500 mt-1">“Yeni tablet” adımlarıyla QR kodunu okutun.</p>
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {devices.map(d => (
                <DeviceCard key={d.id} device={d} tablet={tabletForDevice(d, tablets)} defaultPhone={status.lostPhone} onChanged={() => loadDevices(true)} />
              ))}
            </div>
          )}
          {fetchedAt && <p className="text-xs text-gray-400 text-center">Son güncelleme: {new Date(fetchedAt).toLocaleTimeString('tr-TR')}</p>}
        </>
      )}

      {showAdd && status && <AddTabletSheet panelUrl={status.panelUrl} onClose={() => setShowAdd(false)} />}
      {showSettings && status && <SettingsModal status={status} onClose={() => setShowSettings(false)} onSaved={loadStatus} />}
    </div>
  );
}

function Spinner() {
  return <div className="py-12 flex justify-center"><div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" /></div>;
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className={`p-3 rounded-2xl border ${warn ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
      <p className={`text-2xl font-black ${warn ? 'text-amber-700' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function CopyBox({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
      <code className="flex-1 min-w-0 text-xs font-mono text-gray-800 break-all">{value}</code>
      <button type="button" onClick={() => navigator.clipboard?.writeText(value).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); })} className="shrink-0 p-1.5 rounded-md text-gray-500 hover:bg-gray-200 cursor-pointer" aria-label="Kopyala">
        {done ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

function SetupCard({ status, onConnected }: { status: Status; onConnected: () => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const envOk = status.missingEnv.length === 0;

  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await mdmApi('/api/mdm/setup', { action: 'connect', code });
      onConnected();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bağlanılamadı');
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <h2 className="text-lg font-bold text-gray-900">ManageEngine bağlantısı (bir kez)</h2>
      <Step done={envOk} n={1} title="Zoho Self Client oluşturun">
        <a href={ZOHO_CONSOLE} target="_blank" rel="noreferrer" className="text-indigo-600 font-semibold underline">api-console.zoho.eu</a>
        {' '}adresine ManageEngine hesabınızla girin → <strong>Self Client</strong> → oluşturun. Çıkan <strong>Client ID</strong> ve{' '}
        <strong>Client Secret</strong>’ı Vercel’de <code className="font-mono text-xs">ZOHO_CLIENT_ID</code> ve{' '}
        <code className="font-mono text-xs">ZOHO_CLIENT_SECRET</code> olarak ekleyip yeniden deploy edin.
        {!envOk && <span className="block mt-1 text-amber-700">Eksik: {status.missingEnv.join(', ')}</span>}
      </Step>
      <Step done={status.connected} n={2} title="Kodu üretip buraya yapıştırın">
        Self Client’ta <strong>Generate Code</strong> sekmesi → Scope alanına aşağıdakini yapıştırın, süre <strong>10 dakika</strong>, açıklama
        “Orion ERP” → <strong>Create</strong>. Çıkan kodu hemen aşağıya yapıştırın.
      </Step>
      <CopyBox value={status.scopes} />
      <form onSubmit={connect} className="flex flex-col sm:flex-row gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value.trim())} placeholder="1000.xxxxxxxx…" className={`${inputCls} font-mono`} autoComplete="off" aria-label="Zoho kodu" />
        <button type="submit" disabled={busy || !envOk || code.length < 20} className="shrink-0 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-sm cursor-pointer">
          {busy ? 'Bağlanıyor…' : 'Bağlan'}
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : n}
      </span>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{children}</p>
      </div>
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

function AddTabletSheet({ panelUrl, onClose }: { panelUrl: string; onClose: () => void }) {
  return (
    <Sheet title="Yeni tablet ekle" onClose={onClose}>
      <ol className="text-sm text-gray-700 space-y-2 list-decimal pl-5">
        <li>Tableti fabrika ayarına sıfırlayın ve açın.</li>
        <li>“Hoş geldiniz” ekranında boş bir yere <strong>6 kez art arda</strong> dokunun; QR okuyucu açılır.</li>
        <li>ManageEngine’de <strong>Enrollment → QR Code Enrollment</strong> ekranındaki QR kodu okutun. Tablet kendiliğinden “Saha Tabletleri” grubuna girer ve tüm kısıtlamaları alır.</li>
        <li>Kurulum bitince tablete Google hesabını ekleyip iField’ı Play Store’dan kurun.</li>
        <li>Bu ekranda <strong>Yenile</strong>’ye basın ve kartta <strong>Ad ver</strong> ile tablete ON-T numarasını verin. Zimmet kaydındaki kodla aynı ad otomatik eşleşir.</li>
      </ol>
      <a href={`${panelUrl}/webclient#/uems/mdm/enrollment/android/emm-token`} target="_blank" rel="noreferrer" className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
        <ExternalLink className="w-4 h-4" /> QR kodunu ManageEngine’de aç
      </a>
    </Sheet>
  );
}

function SettingsModal({ status, onClose, onSaved }: { status: Status; onClose: () => void; onSaved: () => void }) {
  const [lostPhone, setLostPhone] = useState(status.lostPhone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const post = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await mdmApi('/api/mdm/setup', body);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi');
      setBusy(false);
    }
  };

  return (
    <Sheet title="MDM ayarları" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); post({ action: 'settings', lostPhone }); }} className="space-y-4">
        <div className="text-sm text-gray-600 p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
          <p className="font-semibold text-gray-800">Kısıtlamalar ManageEngine’deki “Orion Saha Tablet” profilindedir:</p>
          <p>Fabrika ayarı ve güvenli mod kapalı · konum hep açık · sahte konum ve USB veri kapalı · zorla sıfırlanırsa saha@orionarastirma.com istenir.</p>
          <a href={status.panelUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 font-semibold">
            Paneli aç <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <label className="block">
          <span className="block text-sm font-semibold text-gray-700 mb-1">Kayıp modunda gösterilecek telefon</span>
          <input value={lostPhone} onChange={(e) => setLostPhone(e.target.value)} inputMode="tel" placeholder="+90 5xx xxx xx xx" className={inputCls} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold cursor-pointer">
          {busy ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        <div className="pt-2 border-t border-gray-100">
          {confirmDisconnect ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-700">ERP’nin ManageEngine bağlantısı silinir. Tabletler etkilenmez; yeniden bağlamak için yeni kod gerekir.</p>
              <button type="button" onClick={() => post({ action: 'disconnect' })} disabled={busy} className="w-full py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-40 cursor-pointer">Bağlantıyı kaldır</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDisconnect(true)} className="text-sm text-red-600 font-semibold cursor-pointer">ManageEngine bağlantısını kaldır…</button>
          )}
        </div>
      </form>
    </Sheet>
  );
}

type Action = null | 'lost' | 'link' | 'rename';

function DeviceCard({ device: d, tablet, defaultPhone, onChanged }: { device: MdmDevice; tablet?: Tablet; defaultPhone: string; onChanged: () => void }) {
  const { tablets, saveTablet } = useApp();
  const [action, setAction] = useState<Action>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [lostText, setLostText] = useState('');
  const [phone, setPhone] = useState(defaultPhone);
  const [newName, setNewName] = useState(tablet?.code || '');

  const seen = ago(d.lastSeenAt);
  const loc = d.location;

  const run = async (type: string, extra: Record<string, unknown> = {}, okText = 'Komut gönderildi', refresh = false) => {
    setBusy(true);
    setMsg(null);
    try {
      await mdmApi('/api/mdm/command', { deviceId: d.id, type, ...extra });
      setMsg({ ok: true, text: okText });
      setAction(null);
      if (refresh) onChanged();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Komut gönderilemedi' });
    } finally {
      setBusy(false);
    }
  };

  const link = (tabletId: string) => {
    tablets.filter(t => t.mdmDeviceId === d.id && t.id !== tabletId)
      .forEach(t => saveTablet({ ...t, mdmDeviceId: undefined }));
    const target = tablets.find(t => t.id === tabletId);
    if (target) saveTablet({ ...target, mdmDeviceId: d.id, serialNumber: target.serialNumber || d.serialNumber, imei: target.imei || d.imei });
    setAction(null);
  };

  return (
    <div className={`bg-white rounded-2xl border p-4 ${d.lostMode ? 'border-red-300' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-lg font-black text-gray-900 font-mono">{d.name}</p>
          <p className="text-sm text-gray-500 truncate">{d.model || '—'}{d.osVersion ? ` · Android ${d.osVersion}` : ''}</p>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border ${d.lostMode ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {d.lostMode ? 'Kayıp modu' : 'Yönetiliyor'}
        </span>
      </div>

      <div className="mt-3 text-sm space-y-1">
        <p className={seen.hours > STALE_HOURS ? 'text-amber-700 font-semibold' : 'text-gray-700'}>
          {seen.hours > STALE_HOURS && <AlertTriangle className="inline w-4 h-4 mr-1 -mt-0.5" />}
          Son bağlantı: {seen.text}
        </p>
        <p className="text-gray-700 flex items-center gap-1.5">
          <BatteryMedium className="w-4 h-4 text-gray-400" />
          {typeof d.batteryLevel === 'number' ? `%${d.batteryLevel}` : 'Pil bilgisi yok'}
        </p>
        <p className="text-gray-700 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-gray-400" />
          {loc ? (
            <a href={mapsUrl(loc.lat, loc.lng)} target="_blank" rel="noreferrer" className="text-indigo-600 font-semibold underline">
              Haritada aç{loc.at ? ` (${ago(loc.at).text})` : ''}
            </a>
          ) : <span className="text-gray-500">Konum yok</span>}
        </p>
        {d.serialNumber && <p className="text-xs text-gray-500 font-mono">Seri {d.serialNumber}{d.imei ? ` · IMEI ${d.imei}` : ''}</p>}
      </div>

      <div className="mt-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm flex items-center justify-between gap-2">
        {tablet ? (
          <span className="min-w-0 truncate">
            <strong className="font-mono">{tablet.code}</strong>{' '}
            {tablet.status === 'zimmetli' ? <>→ <strong>{tablet.assignedPersonName}</strong></> : <span className="text-gray-500">({tablet.status})</span>}
          </span>
        ) : <span className="text-gray-500">Zimmet kaydıyla eşleşmedi</span>}
        <button onClick={() => setAction(action === 'link' ? null : 'link')} className="shrink-0 text-indigo-600 font-semibold flex items-center gap-1 cursor-pointer">
          <Link2 className="w-4 h-4" /> {tablet ? 'Değiştir' : 'Bağla'}
        </button>
      </div>

      {action === 'link' && (
        <select defaultValue="" onChange={(e) => e.target.value && link(e.target.value)} className={`${inputCls} mt-2`} aria-label="Zimmet kaydı seç">
          <option value="">Zimmet kaydı seçin…</option>
          {tablets.slice().sort((a, b) => a.code.localeCompare(b.code, 'tr', { numeric: true })).map(t => (
            <option key={t.id} value={t.id}>{t.code}{t.assignedPersonName ? ` — ${t.assignedPersonName}` : ''}</option>
          ))}
        </select>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => run('lock', {}, 'Kilitleme komutu gönderildi')} disabled={busy} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 disabled:opacity-50 cursor-pointer">
          <Lock className="w-4 h-4" /> Kilitle
        </button>
        <button onClick={() => run('remote_alarm', {}, 'Alarm komutu gönderildi')} disabled={busy} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 disabled:opacity-50 cursor-pointer">
          <BellRing className="w-4 h-4" /> Alarm çal
        </button>
        <button onClick={() => run('fetch_location', {}, 'Konum istendi; 1-2 dk sonra Yenile’ye basın')} disabled={busy} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 disabled:opacity-50 cursor-pointer">
          <LocateFixed className="w-4 h-4" /> Konumu güncelle
        </button>
        <button onClick={() => { setNewName(tablet?.code || d.name); setAction(action === 'rename' ? null : 'rename'); }} disabled={busy} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 disabled:opacity-50 cursor-pointer">
          <Pencil className="w-4 h-4" /> Ad ver
        </button>
        {d.lostMode ? (
          <button onClick={() => run('disable_lost_mode', {}, 'Kayıp modu kapatıldı', true)} disabled={busy} className="col-span-2 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold disabled:opacity-50 cursor-pointer">
            Bulundu, kayıp modunu kapat
          </button>
        ) : (
          <button onClick={() => setAction(action === 'lost' ? null : 'lost')} disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold disabled:opacity-50 cursor-pointer">
            <MapPinOff className="w-4 h-4" /> Kayıp modu
          </button>
        )}
      </div>

      {action === 'rename' && (
        <div className="mt-3 flex gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value.toUpperCase())} placeholder="ON-T01" className={`${inputCls} font-mono font-bold`} aria-label="Yeni ad" />
          <button onClick={() => run('rename', { name: newName }, 'Ad değiştirildi', true)} disabled={busy || !newName.trim()} className="shrink-0 px-4 rounded-xl bg-gray-900 text-white text-sm font-bold disabled:opacity-40 cursor-pointer">Kaydet</button>
        </div>
      )}

      {action === 'lost' && (
        <div className="mt-3 space-y-2">
          <textarea value={lostText} onChange={(e) => setLostText(e.target.value)} rows={2} placeholder="Ekrandaki mesaj (boşsa: Bu tablet Orion Araştırma’ya aittir…)" className={inputCls} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="Aranacak telefon" className={inputCls} />
          <p className="text-xs text-gray-500">Tablet kilitlenir, ekranda mesaj ve telefon görünür; ilk 24 saat her 30 dakikada konum gönderir.</p>
          <button onClick={() => run('enable_lost_mode', { message: lostText, phone }, 'Kayıp modu başlatıldı', true)} disabled={busy} className="w-full py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-40 cursor-pointer">Kayıp modunu başlat</button>
        </div>
      )}

      {msg && <p className={`mt-2 text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</p>}
    </div>
  );
}
