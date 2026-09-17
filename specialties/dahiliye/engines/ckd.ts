/**
 * NOTYA-DAH-WOW W1.3 — CKD KDIGO 2024 ısı haritası (eGFR × UACR). Evre yalnız onaylı lab satırından; kreatinin/eGFR yoksa evre yok.
 * Kronisite: ≥3 ay iki ölçüm gerekir — tek ölçüm "olası" olarak işaretlenir. Sınıf önerileri; hekim dozu yazar.
 */
import type { Dipnot } from './dahiliye'

export type G = 'G1' | 'G2' | 'G3a' | 'G3b' | 'G4' | 'G5'
export type A = 'A1' | 'A2' | 'A3'
export type Renk = 'yesil' | 'sari' | 'turuncu' | 'kirmizi'

export function gEvre(eGFR: number): G { return eGFR >= 90 ? 'G1' : eGFR >= 60 ? 'G2' : eGFR >= 45 ? 'G3a' : eGFR >= 30 ? 'G3b' : eGFR >= 15 ? 'G4' : 'G5' }
export function aEvre(uacrMgG: number): A { return uacrMgG < 30 ? 'A1' : uacrMgG <= 300 ? 'A2' : 'A3' }
export function kdigoRenk(g: G, a: A | null): Renk {
  const gi = ['G1', 'G2', 'G3a', 'G3b', 'G4', 'G5'].indexOf(g)
  const ai = a ? ['A1', 'A2', 'A3'].indexOf(a) : 0
  if (gi >= 4) return 'kirmizi'
  if (gi === 3) return ai === 0 ? 'turuncu' : 'kirmizi'
  if (gi === 2) return ai === 0 ? 'sari' : ai === 1 ? 'turuncu' : 'kirmizi'
  return ai === 0 ? 'yesil' : ai === 1 ? 'sari' : 'turuncu'
}

export interface CkdGirdi { eGFR: number | null; eGFRTarih: string | null; oncekiEGFR: { deger: number; tarih: string }[]; uacr: number | null; uacrTarih: string | null; dm: boolean; ht: boolean; rasBlokeri: boolean; sglt2: boolean; nsaii: boolean; k: number | null; hb: number | null; bugun: string }
export interface CkdSonuc { g: G | null; a: A | null; renk: Renk | null; kronikMi: 'evet' | 'olasi' | 'bilinmiyor'; hizliDusus: boolean; izlemAy: number | null; plan: string[]; sevk: string[]; uyarilar: string[]; dipnotlar: Dipnot[] }

export function ckdDegerlendir(x: CkdGirdi): CkdSonuc {
  const dip: Dipnot[] = [{ ref: 'TIHUD2023', not: 'KDIGO 2024: eGFR (G1–G5) × albüminüri (A1–A3) ısı haritası; ≥3 ay kalıcılık; RAS blokeri + SGLT2 albüminüride/eGFR ≥20; nefro sevk eGFR <30, UACR >300, hızlı düşüş' }]
  if (x.eGFR == null) return { g: null, a: null, renk: null, kronikMi: 'bilinmiyor', hizliDusus: false, izlemAy: null, plan: ['Kreatinin/eGFR onaylı lab satırı yok — evre verilmez'], sevk: [], uyarilar: [], dipnotlar: dip }
  const g = gEvre(x.eGFR), a = x.uacr != null ? aEvre(x.uacr) : null, renk = kdigoRenk(g, a)
  const ucAyOnce = x.oncekiEGFR.find((o) => o.tarih <= addAy(x.bugun, -3))
  const kronikMi: CkdSonuc['kronikMi'] = g === 'G1' || g === 'G2' ? (a && a !== 'A1' ? (ucAyOnce ? 'evet' : 'olasi') : 'bilinmiyor') : ucAyOnce && ucAyOnce.deger < 60 ? 'evet' : 'olasi'
  const birYilOnce = x.oncekiEGFR.find((o) => o.tarih <= addAy(x.bugun, -12))
  const hizliDusus = !!birYilOnce && x.eGFR < birYilOnce.deger * 0.75
  const izlemAy = renk === 'yesil' ? 12 : renk === 'sari' ? 12 : renk === 'turuncu' ? 6 : 3
  const plan: string[] = [], sevk: string[] = [], uyarilar: string[] = []
  const kbh = renk !== 'yesil' || (a && a !== 'A1')
  if (kbh) {
    if (a && a !== 'A1' && !x.rasBlokeri) plan.push('Albüminüri: ACEi/ARB sınıfı (maks tolere doz) — hekim dozu yazar; 1–2 haftada K/Kre')
    if (x.eGFR >= 20 && !x.sglt2 && (x.dm || (a && a !== 'A1') || g >= 'G3a')) plan.push('SGLT2 inhibitörü sınıfı (KBH progresyon koruması, eGFR ≥20) — hekim')
    if (x.nsaii) uyarilar.push('Aktif NSAİİ: KBH\'de kaçın — alternatif analjezi')
    plan.push(`KB hedefi <130/80 (tolere ediliyorsa); tuz <5 g; ${x.dm ? 'HbA1c bireysel hedef; ' : ''}izlem her ${izlemAy} ay: eGFR + UACR`)
    if (x.k != null && x.k >= 5.5) uyarilar.push(`K ${x.k}: hiperkalemi — RAS/MRA gözden geçir, diyet, potasyum bağlayıcı (hekim)`)
    if (x.hb != null && x.hb < 10 && (g === 'G3b' || g === 'G4' || g === 'G5')) uyarilar.push('KBH anemisi olası (Hb <10): demir paneli, ESA kararı nefroloji')
  }
  if (g === 'G4' || g === 'G5' || x.eGFR < 30) sevk.push('Nefroloji: eGFR <30 (G4–G5) — renal replasman planlaması, anemi, mineral-kemik')
  else if (a === 'A3') sevk.push('Nefroloji: UACR >300 mg/g (A3)')
  else if (hizliDusus) sevk.push('Nefroloji: 1 yılda eGFR >%25 düşüş')
  else if (renk === 'kirmizi') sevk.push('Nefroloji: KDIGO çok yüksek risk hücresi')
  if (x.k != null && x.k > 6) sevk.push('Acil: K >6,0 — EKG')
  return { g, a, renk, kronikMi, hizliDusus, izlemAy, plan, sevk, uyarilar, dipnotlar: dip }
}

export function nefroSevkPaketi(s: CkdSonuc, panel: { ad: string; deger: string; tarih: string }[], hasta: { yas: number | null; kadin: boolean }, ilaclar: string[]): string {
  const L = ['NEFROLOJİ SEVK — KBH DEĞERLENDİRME (dahiliye)', `Hasta: ${hasta.kadin ? 'K' : 'E'}${hasta.yas != null ? `, ${hasta.yas} yaş` : ''}`,
    `KDIGO: ${s.g ?? '?'} ${s.a ?? '(UACR yok)'} · risk: ${s.renk ?? '?'} · kronisite: ${s.kronikMi}${s.hizliDusus ? ' · HIZLI DÜŞÜŞ' : ''}`, '', 'Son onaylı panel:']
  for (const p of panel) L.push(`  ${p.ad}: ${p.deger} (${p.tarih})`)
  L.push('', `Aktif ilaçlar: ${ilaclar.join(', ') || '—'}`, '', 'Sevk nedeni:', ...s.sevk.map((x) => `  • ${x}`), '', 'Dahiliye planı (taslak, hekim onaylı):', ...s.plan.map((x) => `  • ${x}`))
  return L.join('\n')
}

function addAy(t: string, ay: number): string { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }
