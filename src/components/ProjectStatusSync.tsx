'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { baseProjectCode, normalizeExternalCode } from '@/lib/icontrol-paste';
import { CheckCircle2 } from 'lucide-react';

/**
 * iControl "Aktif" listesine göre proje durumlarını önerir:
 * - Aktif listede olmayan devam eden projeler → "Tamamlandı" (iControl'den gelenler varsayılan seçili,
 *   elle açılanlar seçili değil)
 * - Saha raporu olan projeler devam ediyor sayılır: tamamlanmaz; tamamlanmışsa yeniden "Aktif" önerilir.
 * Hiçbir şey kullanıcı onaylamadan değişmez.
 */
export default function ProjectStatusSync({ activeCodes }: { activeCodes: string[] }) {
  const { projects, dailyReports, updateProject } = useApp();
  const [applied, setApplied] = useState<number | null>(null);

  const plan = useMemo(() => {
    const activeExt = new Set(activeCodes.map(normalizeExternalCode));
    const activeBases = new Set(activeCodes.map(baseProjectCode));
    const withReports = new Set(dailyReports.map(r => r.projectId));

    const toComplete: { id: string; code: string; title: string; fromIcontrol: boolean }[] = [];
    const toReactivate: { id: string; code: string; title: string }[] = [];
    const keptByReports: string[] = [];

    for (const p of projects) {
      const inIcontrol = p.externalCode
        ? activeExt.has(normalizeExternalCode(p.externalCode))
        : activeBases.has(baseProjectCode(p.code));
      if (withReports.has(p.id)) {
        if (p.status === 'completed') toReactivate.push({ id: p.id, code: p.code, title: p.title });
        else if (!inIcontrol && p.status === 'active') keptByReports.push(p.code);
        continue;
      }
      if (p.status === 'active' && !inIcontrol) {
        toComplete.push({ id: p.id, code: p.code, title: p.title, fromIcontrol: p.source === 'icontrol' });
      }
    }
    return { toComplete, toReactivate, keptByReports };
  }, [projects, dailyReports, activeCodes]);

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set([...plan.toComplete.filter(p => p.fromIcontrol).map(p => p.id), ...plan.toReactivate.map(p => p.id)])
  );

  if (applied !== null) {
    return (
      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex gap-2">
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> {applied} projenin durumu güncellendi.
      </div>
    );
  }
  if (plan.toComplete.length === 0 && plan.toReactivate.length === 0) {
    return <p className="text-sm text-gray-500">Proje durumları iControl ile uyumlu; değiştirilecek proje yok.</p>;
  }

  const toggle = (id: string) => setSelected(prev => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const apply = () => {
    let n = 0;
    plan.toComplete.forEach(p => { if (selected.has(p.id)) { updateProject(p.id, { status: 'completed' }); n++; } });
    plan.toReactivate.forEach(p => { if (selected.has(p.id)) { updateProject(p.id, { status: 'active' }); n++; } });
    setApplied(n);
  };

  return (
    <div className="space-y-3 pt-2 border-t border-gray-100">
      <p className="text-sm font-bold text-gray-900">Proje durumları</p>
      {plan.toComplete.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm text-gray-600">iControl&apos;de aktif değil → <strong>Tamamlandı</strong> yapılacak:</p>
          {plan.toComplete.map(p => <Item key={p.id} checked={selected.has(p.id)} onToggle={toggle} id={p.id} code={p.code} title={p.title} tag={p.fromIcontrol ? undefined : 'elle açılmış, kontrol edin'} />)}
        </div>
      )}
      {plan.toReactivate.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm text-gray-600">Saha raporu var → tekrar <strong>Aktif</strong> yapılacak:</p>
          {plan.toReactivate.map(p => <Item key={p.id} checked={selected.has(p.id)} onToggle={toggle} id={p.id} code={p.code} title={p.title} />)}
        </div>
      )}
      {plan.keptByReports.length > 0 && (
        <p className="text-xs text-gray-500">Saha raporu olduğu için devam ediyor sayılanlar: {plan.keptByReports.join(', ')}</p>
      )}
      <button
        onClick={apply}
        disabled={selected.size === 0}
        className="w-full py-3 rounded-xl bg-gray-900 hover:bg-black disabled:opacity-40 text-white font-bold cursor-pointer"
      >
        Seçili {selected.size} projenin durumunu güncelle
      </button>
    </div>
  );
}

function Item({ id, code, title, tag, checked, onToggle }: { id: string; code: string; title: string; tag?: string; checked: boolean; onToggle: (id: string) => void }) {
  return (
    <label className="flex items-start gap-2.5 px-3 py-2 rounded-xl border border-gray-200 bg-white cursor-pointer">
      <input type="checkbox" checked={checked} onChange={() => onToggle(id)} className="mt-1 w-4 h-4" />
      <span className="text-sm">
        <span className="font-mono font-bold text-gray-900">{code}</span>
        <span className="text-gray-600"> — {title}</span>
        {tag && <span className="ml-1 text-xs text-gray-500">({tag})</span>}
      </span>
    </label>
  );
}
