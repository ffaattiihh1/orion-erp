'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { useApp } from '@/context/AppContext';
import type { MdmDevice, Tablet } from '@/types';
import { nextTabletLabel, PACKAGE_RE, type MdmApp } from '@/lib/mdm-apps';
import {
  ShieldCheck, Plus, RefreshCw, X, Lock, KeyRound, MapPinOff, Trash2, AlertTriangle, CheckCircle2,
  BatteryMedium, Settings, Link2, Wifi,
} from 'lucide-react';

const inputCls = 'w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400';
const DEFAULT_ADMIN_EMAIL = 'tablet@orionarastirma.com';
const STALE_HOURS = 24;

interface Status {
  projectId: string | null;
  credentialError: string | null;
  enterpriseName: string | null;
  adminEmail: string;
  kiosk: boolean;
  lostPhone: string;
  apps: MdmApp[];
}

async function api<T = Record<string, unknown>>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, body === undefined ? { cache: 'no-store' } : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.error || `İstek başarısız (${res.status})`);
  return data as T;
}

const STATE: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'Aktif', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  LOST: { label: 'Kayıp modu', cls: 'bg-red-50 text-red-700 border-red-200' },
  DISABLED: { label: 'Devre dışı', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  PROVISIONING: { label: 'Kuruluyor', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
};

function ago(iso?: string): { text: string; hours: number } {
  if (!iso) return { text: 'hiç', hours: Infinity };
  const ms = Date.now() - new Date(iso).getTime();
  const h = ms / 3_600_000;
  if (h < 1) return { text: `${Math.max(1, Math.round(ms / 60_000))} dk önce`, hours: h };
  if (h < 48) return { text: `${Math.round(h)} saat önce`, hours: h };
  return { text: `${Math.round(h / 24)} gün önce`, hours: h };
}

/** MDM cihazına bağlı zimmet kaydı: açık bağlantı > seri no > ad eşleşmesi */
function findTablet(d: MdmDevice, tablets: Tablet[]): Tablet | undefined {
  const norm = (s?: string) => (s || '').replace(/[\s-]/g, '').toUpperCase();
  return tablets.find(t => t.mdmDeviceName === d.name)
    || (d.serialNumber ? tablets.find(t => !t.mdmDeviceName && norm(t.serialNumber) === norm(d.serialNumber)) : undefined)
    || (d.label ? tablets.find(t => !t.mdmDeviceName && norm(t.code) === norm(d.label)) : undefined);
}

export default function MdmView() {
  const { tablets } = useApp();
  const [status, setStatus] = useState<Status | null>(null);
  const [devices, setDevices] = useState<MdmDevice[] | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showEnroll, setShowEnroll] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api<{ devices: MdmDevice[]; fetchedAt: string }>('/api/mdm/devices');
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
      const s = await api<Status>('/api/mdm/status');
      setStatus(s);
      if (s.enterpriseName) await loadDevices();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Durum alınamadı');
    }
  }, [loadDevices]);

  useEffect(() => {
    // Google kayıt dönüşü: ?tab=mdm&mdm=ok|hata|iptal
    const params = new URLSearchParams(window.location.search);
    const r = params.get('mdm');
    const messages: Record<string, string> = {
      ok: 'Google kaydı tamamlandı, politika yüklendi. Artık tablet kaydedebilirsiniz.',
      hata: 'Google kaydı tamamlanamadı. Tekrar deneyin; sürerse sunucu kayıtlarına bakın.',
      iptal: 'Google kaydı iptal edildi.',
      yetki: 'Kaydı tamamlamak için yönetici olarak giriş yapmış olmalısınız.',
    };
    if (r || params.get('tab')) window.history.replaceState(null, '', window.location.pathname);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tek seferlik URL bildirimi ve ilk yükleme
    if (r && messages[r]) setNotice(messages[r]);
    loadStatus();
  }, [loadStatus]);

  const lostCount = devices?.filter(d => d.state === 'LOST').length || 0;
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
            <p className="text-sm text-gray-500">Kayıt, uzaktan kilit, kayıp modu ve silme</p>
          </div>
        </div>
        {status?.enterpriseName && (
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(true)} className="px-3 py-3 rounded-xl bg-white border border-gray-200 cursor-pointer" title="Ayarlar" aria-label="Ayarlar">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={loadDevices} disabled={loading} className="px-3 py-3 rounded-xl bg-white border border-gray-200 cursor-pointer disabled:opacity-50" title="Yenile" aria-label="Yenile">
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setShowEnroll(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm cursor-pointer">
              <Plus className="w-4 h-4" /> Yeni tablet kaydet
            </button>
          </div>
        )}
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-900 flex justify-between gap-2">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-blue-500 cursor-pointer" aria-label="Kapat"><X className="w-4 h-4" /></button>
        </div>
      )}
      {error && (
        <p className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-800 flex gap-1.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}
        </p>
      )}

      {!status ? (
        !error && <div className="py-12 flex justify-center"><div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" /></div>
      ) : !status.enterpriseName ? (
        <SetupCard status={status} />
      ) : (
        <>
          {devices && devices.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Kayıtlı" value={devices.length} />
              <Stat label={`${STALE_HOURS} saattir yok`} value={staleCount} warn={staleCount > 0} />
              <Stat label="Kayıp modu" value={lostCount} warn={lostCount > 0} />
            </div>
          )}
          {devices === null ? null : devices.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-gray-200">
              <ShieldCheck className="w-10 h-10 mx-auto text-gray-300" />
              <p className="mt-2 text-gray-600 font-semibold">Henüz kayıtlı tablet yok.</p>
              <p className="text-sm text-gray-500 mt-1">“Yeni tablet kaydet” ile QR kodu üretip fabrika ayarlı tablete okutun.</p>
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {devices.map(d => (
                <DeviceCard key={d.name} device={d} tablet={findTablet(d, tablets)} defaultPhone={status.lostPhone} onChanged={loadDevices} />
              ))}
            </div>
          )}
          {fetchedAt && <p className="text-xs text-gray-400 text-center">Son güncelleme: {new Date(fetchedAt).toLocaleTimeString('tr-TR')}</p>}
        </>
      )}

      {showEnroll && <EnrollModal devices={devices || []} onClose={() => { setShowEnroll(false); loadDevices(); }} />}
      {showSettings && status && <SettingsModal status={status} onClose={() => setShowSettings(false)} onSaved={loadStatus} />}
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className={`p-3 rounded-2xl border ${warn ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
      <p className={`text-2xl font-black ${warn ? 'text-amber-700' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function SetupCard({ status }: { status: Status }) {
  const [email, setEmail] = useState(status.adminEmail || DEFAULT_ADMIN_EMAIL);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ url: string }>('/api/mdm/setup', { action: 'signup', adminEmail: email });
      window.location.href = r.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Başlatılamadı');
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Kurulum</h2>
      <Step done={!status.credentialError} n={1} title="Google servis hesabı anahtarı">
        {status.credentialError
          ? <>Vercel’de <code className="font-mono text-xs">GOOGLE_SERVICE_ACCOUNT_JSON</code> ortam değişkeni eklenmeli. ({status.credentialError})</>
          : <>Tanımlı · proje <code className="font-mono text-xs">{status.projectId}</code></>}
      </Step>
      <Step done={false} n={2} title="Google’da şirket kaydı (bir kez)">
        Aşağıdaki hesapla Google’ın sayfasında kaydı onaylayın; işlem bitince buraya geri dönersiniz.
      </Step>
      <div className="flex flex-col sm:flex-row gap-2">
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={inputCls} aria-label="Kayıt hesabı" />
        <button onClick={start} disabled={busy || !!status.credentialError} className="shrink-0 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-sm cursor-pointer">
          {busy ? 'Yönlendiriliyor…' : 'Google’da kaydı başlat'}
        </button>
      </div>
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

function EnrollModal({ devices, onClose }: { devices: MdmDevice[]; onClose: () => void }) {
  const nextLabel = useMemo(() => nextTabletLabel(devices.map(d => d.label)), [devices]);
  const [label, setLabel] = useState(nextLabel);
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ label: string; qr: string; expiresAt: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ label: string; qrContent: string; expiresAt: string }>('/api/mdm/enroll', { label, wifiSsid, wifiPassword });
      const qr = await QRCode.toDataURL(r.qrContent, { errorCorrectionLevel: 'M', margin: 2, width: 360 });
      setResult({ label: r.label, qr, expiresAt: r.expiresAt });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'QR üretilemedi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title={result ? `${result.label} — QR kodu` : 'Yeni tablet kaydet'} onClose={onClose}>
      {result ? (
        <div className="space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- yerel data URL */}
          <img src={result.qr} alt={`${result.label} kayıt QR kodu`} className="w-full max-w-[320px] mx-auto rounded-xl border border-gray-200" />
          <ol className="text-sm text-gray-700 space-y-1.5 list-decimal pl-5">
            <li>Tableti fabrika ayarına sıfırlayın ve açın.</li>
            <li>“Hoş geldiniz” ekranında boş bir yere <strong>6 kez art arda</strong> dokunun; QR okuyucu açılır.</li>
            <li>Bu kodu okutun ve kurulumu bitirin (Wi‑Fi sorarsa bağlayın).</li>
            <li>Kurulum bitince bu sayfada “Yenile”ye basın; tablet <strong>{result.label}</strong> adıyla görünür.</li>
          </ol>
          <p className="text-xs text-gray-500">Kod tek kullanımlıktır, {new Date(result.expiresAt).toLocaleString('tr-TR')} tarihine kadar geçerlidir.</p>
          <button onClick={onClose} className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold cursor-pointer">Tamam</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3.5">
          <label className="block">
            <span className="block text-sm font-semibold text-gray-700 mb-1">Tablet adı</span>
            <input value={label} onChange={(e) => setLabel(e.target.value.toUpperCase())} className={`${inputCls} font-mono font-bold`} />
            <span className="block text-xs text-gray-500 mt-1">Zimmet kaydındaki tablet koduyla aynı yazarsanız otomatik eşleşir.</span>
          </label>
          <details className="rounded-xl border border-gray-200 p-3">
            <summary className="text-sm font-semibold text-gray-700 cursor-pointer flex items-center gap-1.5"><Wifi className="w-4 h-4" /> Wi‑Fi bilgisini QR’a ekle (isteğe bağlı)</summary>
            <div className="mt-3 space-y-2.5">
              <input value={wifiSsid} onChange={(e) => setWifiSsid(e.target.value)} placeholder="Ağ adı (SSID)" className={inputCls} autoComplete="off" />
              <input value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} placeholder="Şifre" type="password" className={inputCls} autoComplete="new-password" />
            </div>
          </details>
          {error && <p className="text-sm text-red-600 flex gap-1.5"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}</p>}
          <button type="submit" disabled={busy} className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold cursor-pointer">
            {busy ? 'Hazırlanıyor…' : 'QR kodu üret'}
          </button>
        </form>
      )}
    </Sheet>
  );
}

function SettingsModal({ status, onClose, onSaved }: { status: Status; onClose: () => void; onSaved: () => void }) {
  const [kiosk, setKiosk] = useState(status.kiosk);
  const [lostPhone, setLostPhone] = useState(status.lostPhone);
  const [adminEmail, setAdminEmail] = useState(status.adminEmail || DEFAULT_ADMIN_EMAIL);
  const [apps, setApps] = useState<MdmApp[]>(status.apps || []);
  const [newPkg, setNewPkg] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleApp = (pkg: string) => setApps(prev => prev.map(a => a.packageName === pkg ? { ...a, allowed: !a.allowed } : a));
  const addApp = () => {
    // Play bağlantısı yapıştırılırsa ?id=... kısmını al
    const pkg = (newPkg.match(/[?&]id=([^&\s]+)/)?.[1] || newPkg).trim();
    if (!PACKAGE_RE.test(pkg)) return setError('Paket adı geçersiz. Play Store bağlantısını ya da com.ornek.uygulama biçimini girin.');
    if (apps.some(a => a.packageName === pkg)) return setError('Bu uygulama listede zaten var.');
    setError(null);
    setApps(prev => [...prev, { packageName: pkg, label: newLabel.trim() || pkg, allowed: true }]);
    setNewPkg('');
    setNewLabel('');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/api/mdm/setup', { action: 'settings', kiosk, lostPhone, adminEmail, apps });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi');
      setBusy(false);
    }
  };

  return (
    <Sheet title="MDM ayarları" onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div className="text-sm text-gray-600 p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
          <p className="font-semibold text-gray-800">Tüm tabletlerde her zaman açık:</p>
          <p>Konum kapatılamaz · fabrika ayarı kapalı · geliştirici seçenekleri/USB veri kapalı · iField zorunlu kurulu · Play’den listede olmayan uygulama kurulamaz</p>
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={kiosk} onChange={(e) => setKiosk(e.target.checked)} className="mt-1 w-5 h-5" />
          <span>
            <span className="block font-semibold text-gray-900">Kiosk modu</span>
            <span className="block text-sm text-gray-500">Ana ekranda sadece iField görünür. Önce bir tablette deneyin.</span>
          </span>
        </label>
        <div>
          <p className="text-sm font-semibold text-gray-700">İzin verilen uygulamalar</p>
          <p className="text-xs text-gray-500 mb-2">iField her zaman açık. İşaretlediğiniz uygulamalar tablete kurulur; işaretsizler tablette gizlenir/engellenir.</p>
          <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
            {apps.map(a => (
              <label key={a.packageName} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer">
                <input type="checkbox" checked={a.allowed} onChange={() => toggleApp(a.packageName)} className="w-5 h-5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">{a.label}</span>
                  <span className="block text-xs text-gray-400 font-mono truncate">{a.packageName}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
            <input value={newPkg} onChange={(e) => setNewPkg(e.target.value)} placeholder="Play bağlantısı veya paket adı" className={inputCls} autoComplete="off" />
            <button type="button" onClick={addApp} disabled={!newPkg.trim()} className="px-4 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 disabled:opacity-40 cursor-pointer">Ekle</button>
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Görünen ad (isteğe bağlı)" className={`${inputCls} col-span-2`} autoComplete="off" />
          </div>
        </div>
        <label className="block">
          <span className="block text-sm font-semibold text-gray-700 mb-1">Kayıp modunda gösterilecek telefon</span>
          <input value={lostPhone} onChange={(e) => setLostPhone(e.target.value)} inputMode="tel" placeholder="+90 5xx xxx xx xx" className={inputCls} />
        </label>
        <label className="block">
          <span className="block text-sm font-semibold text-gray-700 mb-1">Sıfırlama koruması hesabı</span>
          <input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} type="email" className={inputCls} />
          <span className="block text-xs text-gray-500 mt-1">Tablet zorla sıfırlanırsa açılışta bu hesap istenir.</span>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold cursor-pointer">
          {busy ? 'Kaydediliyor…' : 'Kaydet ve tabletlere gönder'}
        </button>
      </form>
    </Sheet>
  );
}

type Action = null | 'password' | 'lost' | 'wipe' | 'link';

function DeviceCard({ device: d, tablet, defaultPhone, onChanged }: { device: MdmDevice; tablet?: Tablet; defaultPhone: string; onChanged: () => void }) {
  const { tablets, saveTablet } = useApp();
  const [action, setAction] = useState<Action>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pin, setPin] = useState('');
  const [lostText, setLostText] = useState('');
  const [phone, setPhone] = useState(defaultPhone);
  const [confirmText, setConfirmText] = useState('');

  const seen = ago(d.lastSeenAt);
  const st = STATE[d.state] || { label: d.state, cls: 'bg-gray-100 text-gray-600 border-gray-200' };
  const title = d.label || d.serialNumber || d.name.split('/').pop();

  const run = async (type: string, extra: Record<string, unknown> = {}, okText = 'Komut gönderildi') => {
    setBusy(true);
    setMsg(null);
    try {
      await api('/api/mdm/command', { device: d.name, type, ...extra });
      setMsg({ ok: true, text: okText });
      setAction(null);
      setPin('');
      setConfirmText('');
      onChanged();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Komut gönderilemedi' });
    } finally {
      setBusy(false);
    }
  };

  const link = (tabletId: string) => {
    tablets.filter(t => t.mdmDeviceName === d.name && t.id !== tabletId)
      .forEach(t => saveTablet({ ...t, mdmDeviceName: undefined }));
    const target = tablets.find(t => t.id === tabletId);
    if (target) saveTablet({ ...target, mdmDeviceName: d.name, serialNumber: target.serialNumber || d.serialNumber, imei: target.imei || d.imei });
    setAction(null);
  };

  return (
    <div className={`bg-white rounded-2xl border p-4 ${d.state === 'LOST' ? 'border-red-300' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-lg font-black text-gray-900 font-mono">{title}</p>
          <p className="text-sm text-gray-500 truncate">{[d.brand, d.model].filter(Boolean).join(' ') || '—'}{d.androidVersion ? ` · Android ${d.androidVersion}` : ''}</p>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border ${st.cls}`}>{st.label}</span>
      </div>

      <div className="mt-3 text-sm space-y-1">
        <p className={seen.hours > STALE_HOURS ? 'text-amber-700 font-semibold' : 'text-gray-700'}>
          {seen.hours > STALE_HOURS && <AlertTriangle className="inline w-4 h-4 mr-1 -mt-0.5" />}
          Son bağlantı: {seen.text}
        </p>
        <p className="text-gray-700 flex items-center gap-1.5">
          <BatteryMedium className="w-4 h-4 text-gray-400" />
          {typeof d.batteryLevel === 'number' ? `%${d.batteryLevel}` : 'Pil bilgisi yok'}
          <span className="text-gray-300">·</span>
          {d.policyCompliant
            ? <span className="text-emerald-700">Politikaya uygun</span>
            : <span className="text-amber-700" title={d.nonCompliance.join('\n')}>Uyumsuz ({d.nonCompliance.length})</span>}
        </p>
        {d.serialNumber && <p className="text-xs text-gray-500 font-mono">Seri {d.serialNumber}{d.imei ? ` · IMEI ${d.imei}` : ''}</p>}
        {!d.policyCompliant && d.nonCompliance.length > 0 && (
          <ul className="text-xs text-amber-700 list-disc pl-4">{d.nonCompliance.slice(0, 3).map(n => <li key={n}>{n}</li>)}</ul>
        )}
      </div>

      <div className="mt-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm flex items-center justify-between gap-2">
        {tablet ? (
          <span className="min-w-0 truncate">
            <strong className="font-mono">{tablet.code}</strong>{' '}
            {tablet.status === 'zimmetli' ? <>→ <strong>{tablet.assignedPersonName}</strong></> : <span className="text-gray-500">({tablet.status})</span>}
          </span>
        ) : <span className="text-gray-500">Zimmet kaydına bağlı değil</span>}
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
        <button onClick={() => run('LOCK', {}, 'Kilitlendi')} disabled={busy} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 disabled:opacity-50 cursor-pointer">
          <Lock className="w-4 h-4" /> Kilitle
        </button>
        <button onClick={() => setAction(action === 'password' ? null : 'password')} disabled={busy} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 disabled:opacity-50 cursor-pointer">
          <KeyRound className="w-4 h-4" /> Şifre sıfırla
        </button>
        {d.state === 'LOST' ? (
          <button onClick={() => run('STOP_LOST_MODE', {}, 'Kayıp modu kapatıldı')} disabled={busy} className="py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold disabled:opacity-50 cursor-pointer">
            Bulundu, kayıp modunu kapat
          </button>
        ) : (
          <button onClick={() => setAction(action === 'lost' ? null : 'lost')} disabled={busy} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold disabled:opacity-50 cursor-pointer">
            <MapPinOff className="w-4 h-4" /> Kayıp modu
          </button>
        )}
        <button onClick={() => setAction(action === 'wipe' ? null : 'wipe')} disabled={busy} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-red-600 disabled:opacity-50 cursor-pointer">
          <Trash2 className="w-4 h-4" /> Sil
        </button>
      </div>

      {action === 'password' && (
        <div className="mt-3 space-y-2">
          <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Yeni PIN (4-12 rakam)" className={`${inputCls} font-mono`} />
          <p className="text-xs text-gray-500">Not: Şifre sıfırlandıktan sonra 12 saat kayıp modu açılamaz.</p>
          <button onClick={() => run('RESET_PASSWORD', { newPassword: pin }, 'Yeni PIN ayarlandı, tablet kilitlendi')} disabled={busy || pin.length < 4} className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold disabled:opacity-40 cursor-pointer">PIN’i ayarla</button>
        </div>
      )}

      {action === 'lost' && (
        <div className="mt-3 space-y-2">
          <textarea value={lostText} onChange={(e) => setLostText(e.target.value)} rows={2} placeholder="Ekrandaki mesaj (boşsa: Bu tablet Orion Araştırma’ya aittir…)" className={inputCls} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="Aranacak telefon" className={inputCls} />
          <p className="text-xs text-gray-500">Tablet kilitlenir, ekranda mesaj ve telefon görünür. Konumu görmek için cihazdaki Google hesabıyla google.com/android/find kullanın.</p>
          <button onClick={() => run('START_LOST_MODE', { message: lostText, phone }, 'Kayıp modu başlatıldı')} disabled={busy} className="w-full py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-40 cursor-pointer">Kayıp modunu başlat</button>
        </div>
      )}

      {action === 'wipe' && (
        <div className="mt-3 space-y-2 p-3 rounded-xl bg-red-50 border border-red-200">
          <p className="text-sm text-red-800">
            <strong>Geri alınamaz.</strong> Tablet fabrika ayarına döner, içindeki tüm veriler (iField’daki gönderilmemiş anketler dahil) silinir ve MDM’den çıkar.
            Onaylamak için <strong className="font-mono">{title}</strong> yazın.
          </p>
          <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className={`${inputCls} font-mono`} aria-label="Onay için tablet adı" />
          <button
            onClick={() => run('WIPE', { confirm: true }, 'Silme komutu gönderildi')}
            disabled={busy || confirmText.trim().toUpperCase() !== String(title).toUpperCase()}
            className="w-full py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-40 cursor-pointer"
          >
            Tableti kalıcı olarak sil
          </button>
        </div>
      )}

      {msg && <p className={`mt-2 text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</p>}
    </div>
  );
}
