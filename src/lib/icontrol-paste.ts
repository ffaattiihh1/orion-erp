/**
 * iControl "Projelerim" sayfasından kopyalanan metni (Ctrl+A, Ctrl+C) proje listesine çevirir.
 * Tablo kopyalandığında sütunlar sekme (Tab) ile ayrılır:
 * Script Kodu | Proje Adı | Versiyon | Segment | Başlangıç | Bitiş | ...
 * Sekme yoksa (farklı kopyalama), kod ve tarihler metinden yakalanır.
 */
export interface PastedProject {
  code: string;
  title: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;
}

const CODE_RE = /^([A-Z]{2,6}\d{3,6}(?:_[A-Z0-9]+)*)\b/;
const DATE_RE = /(\d{2})\.(\d{2})\.(\d{4})/g;

const toIso = (d?: string): string | undefined => {
  if (!d) return undefined;
  const m = d.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : undefined;
};

export function parseIcontrolPaste(text: string): PastedProject[] {
  const out: PastedProject[] = [];
  const seen = new Set<string>();

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const m = line.match(CODE_RE);
    if (!m) continue;
    const code = m[1];
    if (seen.has(code)) continue;

    let title = '';
    let startDate: string | undefined;
    let endDate: string | undefined;

    const cols = raw.split('\t').map(c => c.trim());
    if (cols.length >= 6 && cols[0] === code) {
      title = cols[1];
      startDate = toIso(cols[4]);
      endDate = toIso(cols[5]);
    } else {
      const dates = [...line.matchAll(DATE_RE)].map(d => `${d[3]}-${d[2]}-${d[1]}`);
      startDate = dates[0];
      endDate = dates[1];
      // Kod ile versiyon numarası (tek başına sayı) arasındaki metin proje adıdır
      const rest = line.slice(code.length).trim();
      title = rest.split(/\s+\d{1,2}\s+/)[0]?.trim() || rest.split(/\s{2,}|\t/)[0] || '';
    }

    seen.add(code);
    out.push({ code, title: title || code, startDate, endDate });
  }
  return out;
}
