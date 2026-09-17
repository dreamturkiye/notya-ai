/**
 * NOTYA-DAH-WOW W2.1 — DM kapalı döngü: yıllık FIB-4 (onaylı ALT/AST/Plt + yaş), ayak foto → Belgeler, aşı due (asi.ts),
 * SGLT2 / GLP-1 RA kardiyo-renal endikasyon bayrakları, hipoglisemi riski. Sınıf önerisi; doz ve insülin titrasyonu yok.
 */
import type { Dipnot } from './dahiliye'

/** FIB-4 = (yaş × AST) / (Plt[10⁹/L] × √ALT). Plt kanonik birimi 10³/µL = 10⁹/L. */
export function fib4(yas: number, ast: number, alt: number, plt: number): number | null {
  if (!(yas > 0 && ast > 0 && alt > 0 && plt > 0)) return null
  return Math.round(((yas * ast) / (plt * Math.sqrt(alt))) * 100) / 100
}
export type Fib4Kategori = 'dusuk' | 'belirsiz' | 'yuksek'
export function fib4Yorum(skor: number, yas: number): { kategori: Fib4Kategori; aksiyon: string; sevk: boolean; dipnot: Dipnot } {
  const dipnot: Dipnot = { ref: 'HYP', not: 'FIB-4 <1,3 düşük ilerlemiş fibroz riski; 1,3–2,67 belirsiz (dahiliye notu, elastografi/tekrar); ≥2,67 yüksek → gastroenteroloji. <35 yaşta güvenilir değil; ≥65 yaşta yanlış pozitif artar' }
  const yasNotu = yas < 35 ? ' (<35 yaş: FIB-4 güvenilir değil)' : yas >= 65 && skor < 2.0 ? ' (≥65 yaş: 2,0 altı çoğunlukla düşük risk)' : ''
  if (skor >= 2.67) return { kategori: 'yuksek', aksiyon: `FIB-4 ${skor} ≥2,67: ilerlemiş fibroz olası — gastroenteroloji sevk${yasNotu}`, sevk: true, dipnot }
  if (skor >= 1.3) return { kategori: 'belirsiz', aksiyon: `FIB-4 ${skor} (1,3–2,67): dahiliye notu — elastografi değerlendir, 1 yılda tekrar${yasNotu}`, sevk: false, dipnot }
  return { kategori: 'dusuk', aksiyon: `FIB-4 ${skor} <1,3: düşük risk — 1–2 yılda tekrar${yasNotu}`, sevk: false, dipnot }
}

export interface DmLoopGirdi {
  yas: number | null; ilacMetinleri: string[]
  askvh: boolean; kky: boolean; eGFR: number | null; uacr: number | null; vki: number | null
  alt: { deger: number; tarih: string } | null; ast: { deger: number; tarih: string } | null; plt: { deger: number; tarih: string } | null
  sonAyakFoto: string | null; bugun: string
}
export interface DmLoopSonuc {
  fib4: { skor: number; kategori: Fib4Kategori; aksiyon: string; sevk: boolean; tarih: string } | null
  kardiyoRenal: { sinif: 'SGLT2' | 'GLP-1 RA'; neden: string; kullaniyor: boolean }[]
  hipoRiski: string | null
  gorevler: { kod: string; ad: string; due: string }[]
  plan: string[]; sevk: string[]; dipnotlar: Dipnot[]
}

const RE = { sglt2: /gliflozin/i, glp1: /glutid|tirzepatid|dulaglutid|semaglutid|liraglutid|eksenatid/i, su: /gliklazid|glimepirid|glibenklamid|gliburid|glipizid/i, insulin: /insülin|insulin|glarjin|detemir|degludek|aspart|lispro|glulisin/i }
function ekleAy(t: string, ay: number): string { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }

export function dmDongu(g: DmLoopGirdi): DmLoopSonuc {
  const var_ = (re: RegExp) => g.ilacMetinleri.some((x) => re.test(x))
  const dip: Dipnot[] = [{ ref: 'TEMD_DM2026', not: 'ASKVH/KY/KBH varlığında HbA1c\'den bağımsız kanıtlı kardiyo-renal koruması olan SGLT2 inhibitörü ve/veya GLP-1 RA; yaşlı ve eGFR düşüklüğünde sülfonilüre/insülin hipoglisemi riski' }]
  const plan: string[] = [], sevk: string[] = [], gorevler: DmLoopSonuc['gorevler'] = []
  const kardiyoRenal: DmLoopSonuc['kardiyoRenal'] = []
  const kbh = (g.eGFR != null && g.eGFR < 60) || (g.uacr != null && g.uacr >= 30)
  if (g.kky) kardiyoRenal.push({ sinif: 'SGLT2', neden: 'Kalp yetersizliği', kullaniyor: var_(RE.sglt2) })
  if (kbh && (g.eGFR == null || g.eGFR >= 20)) kardiyoRenal.push({ sinif: 'SGLT2', neden: `KBH (${g.eGFR != null && g.eGFR < 60 ? `eGFR ${g.eGFR}` : ''}${g.uacr != null && g.uacr >= 30 ? ` UACR ${g.uacr}` : ''})`.replace('( ', '('), kullaniyor: var_(RE.sglt2) })
  if (g.askvh) { kardiyoRenal.push({ sinif: 'GLP-1 RA', neden: 'Aterosklerotik KVH', kullaniyor: var_(RE.glp1) }); if (!kardiyoRenal.some((k) => k.sinif === 'SGLT2')) kardiyoRenal.push({ sinif: 'SGLT2', neden: 'Aterosklerotik KVH', kullaniyor: var_(RE.sglt2) }) }
  if (g.vki != null && g.vki >= 30 && !kardiyoRenal.some((k) => k.sinif === 'GLP-1 RA')) kardiyoRenal.push({ sinif: 'GLP-1 RA', neden: `Obezite (VKİ ${g.vki})`, kullaniyor: var_(RE.glp1) })
  for (const k of kardiyoRenal.filter((x) => !x.kullaniyor)) plan.push(`${k.neden}: ${k.sinif} sınıfı endikasyon bayrağı — hekim değerlendirir, dozu yazar`)

  let hipoRiski: string | null = null
  const suVar = var_(RE.su), insVar = var_(RE.insulin)
  if ((suVar || insVar) && ((g.yas != null && g.yas >= 65) || (g.eGFR != null && g.eGFR < 45))) {
    hipoRiski = `${suVar ? 'Sülfonilüre' : 'İnsülin'} + ${g.yas != null && g.yas >= 65 ? '≥65 yaş' : ''}${g.yas != null && g.yas >= 65 && g.eGFR != null && g.eGFR < 45 ? ' + ' : ''}${g.eGFR != null && g.eGFR < 45 ? `eGFR ${g.eGFR}` : ''}: hipoglisemi riski yüksek — hedefi gevşet / ajanı gözden geçir (hekim; asistan titrasyon yapmaz)`
    plan.push(hipoRiski)
  }

  let fibSonuc: DmLoopSonuc['fib4'] = null
  if (g.yas != null && g.alt && g.ast && g.plt) {
    const tarih = [g.alt.tarih, g.ast.tarih, g.plt.tarih].sort()[0]
    const s = fib4(g.yas, g.ast.deger, g.alt.deger, g.plt.deger)
    if (s != null) {
      const y = fib4Yorum(s, g.yas); fibSonuc = { skor: s, kategori: y.kategori, aksiyon: y.aksiyon, sevk: y.sevk, tarih }; dip.push(y.dipnot)
      if (y.sevk) sevk.push(`Gastroenteroloji: ${y.aksiyon}`); else if (y.kategori === 'belirsiz') plan.push(y.aksiyon)
      if (tarih < ekleAy(g.bugun, -12)) gorevler.push({ kod: 'dm_fib4', ad: 'Yıllık FIB-4 (ALT/AST/Plt)', due: ekleAy(tarih, 12) })
    }
  } else gorevler.push({ kod: 'dm_fib4', ad: 'Yıllık FIB-4 için ALT + AST + trombosit (onaylı lab)', due: g.bugun })

  if (!g.sonAyakFoto || g.sonAyakFoto < ekleAy(g.bugun, -12)) gorevler.push({ kod: 'dm_ayak_foto', ad: 'Ayak muayenesi + foto → Belgeler (yıllık)', due: g.sonAyakFoto ? ekleAy(g.sonAyakFoto, 12) : g.bugun })
  return { fib4: fibSonuc, kardiyoRenal, hipoRiski, gorevler, plan, sevk, dipnotlar: dip }
}
