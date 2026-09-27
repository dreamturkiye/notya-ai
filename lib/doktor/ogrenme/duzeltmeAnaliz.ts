/**
 * NOTYA-MESLEKTAS-V2 Faz 1 — düzeltme farkı (LLM yok).
 * Taslak vs doktorun son hali: silme, yeniden yazma, ekleme, terim, uzunluk, sıra, ilaç.
 * Doz DEĞERİ kural olmaz; doz BİÇİMİ (mg/kg → günlük toplam) işaretlenir.
 */

export type DuzeltmeAlani =
  | 'subjektif'
  | 'objektif'
  | 'degerlendirme'
  | 'plan'
  | 'basvuruYakinmasi'
  | 'hastaOzeti'
  | 'alarmBulgulari'
  | 'ilaclar'
  | 'aiDegerlendirme'

export type DeltaTur =
  | 'silme'
  | 'yeniden_yazma'
  | 'ekleme'
  | 'terim'
  | 'uzunluk'
  | 'sira'
  | 'ilac_degisimi'
  | 'doz_degeri'
  | 'doz_bicimi'

export interface DuzeltmeDelta {
  tur: DeltaTur
  alan: DuzeltmeAlani
  onceki: string
  sonraki: string
  terimOnceki?: string
  terimSonraki?: string
  oran?: number
  ilacOnceki?: string
  ilacSonraki?: string
}

export type AlanMetinleri = Partial<Record<DuzeltmeAlani, string>>

const ALANLAR: DuzeltmeAlani[] = [
  'subjektif', 'objektif', 'degerlendirme', 'plan',
  'basvuruYakinmasi', 'hastaOzeti', 'alarmBulgulari', 'ilaclar', 'aiDegerlendirme',
]

const BOLUM_ETIKET = /^(Şikayet|Şikayetin Hikayesi|Özgeçmiş|Soygeçmiş|Alışkanlıklar|Genel durum|Laboratuvar|Görüntüleme|TEDAVİ|TAKİP)\s*:/i

const DOZ_DEGER = /(\d+(?:[.,]\d+)?)\s*(mg|mcg|µg|μg|ml|ünite|unite|iu|iu\.|u)\b/gi
const DOZ_KG = /mg\s*\/\s*kg(?:\s*\/\s*gün)?/i
const DOZ_TOPLAM = /günlük\s+toplam|günde\s+toplam|total\s+günlük/i

const PII_TC = /\b\d{11}\b/g
const PII_AD = /\b[A-ZÇĞİÖŞÜ][a-zçğıöşü]{2,}\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]{2,}\b/g

export function piiTemizle(metin: string): string {
  return String(metin || '')
    .replace(PII_TC, '[TC]')
    .replace(PII_AD, '[AD]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180)
}

export function cumlelereBol(metin: string): string[] {
  return String(metin || '')
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** LCS hizası — eşleşen cümle çiftleri (küçük harf, boşluksuz karşılaştırma). */
export function cumleHizala(a: string[], b: string[]): { ai: number; dr: number }[] {
  const na = a.map(norm)
  const nb = b.map(norm)
  const n = na.length
  const m = nb.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = na[i] === nb[j] ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const cift: { ai: number; dr: number }[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (na[i] === nb[j]) {
      cift.push({ ai: i, dr: j })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++
    else j++
  }
  return cift
}

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

function sozcukler(s: string): string[] {
  return norm(s).replace(/[^\p{L}\p{N}]+/gu, ' ').split(/\s+/).filter(Boolean)
}

function bolumSirasi(metin: string): string[] {
  const sira: string[] = []
  for (const satir of String(metin || '').split('\n')) {
    const m = satir.trim().match(BOLUM_ETIKET)
    if (m) sira.push(m[1].toLowerCase())
  }
  return sira
}

function dozDegerleri(metin: string): string[] {
  const out: string[] = []
  const r = new RegExp(DOZ_DEGER.source, 'gi')
  let m: RegExpExecArray | null
  while ((m = r.exec(metin))) out.push(`${m[1].replace(',', '.')}|${m[2].toLowerCase()}`)
  return out
}

function ilacAdlari(metin: string): string[] {
  const ham = String(metin || '').trim()
  if (!ham) return []
  try {
    const j = JSON.parse(ham) as unknown
    if (Array.isArray(j)) {
      return j
        .map((x) => String((x as { ad?: string; ticariOrnek?: string })?.ad || (x as { ticariOrnek?: string })?.ticariOrnek || '').trim())
        .filter(Boolean)
        .map((s) => s.split(/\s+/)[0]!)
    }
  } catch { /* düz metin */ }
  return ham
    .split(/\n|,|;/)
    .map((s) => s.replace(/^[-*\d.)\s]+/, '').trim())
    .filter((s) => s.length >= 3)
    .map((s) => s.split(/\s+/)[0]!)
}

function terimCiftleri(ai: string, dr: string): { onceki: string; sonraki: string }[] {
  const a = sozcukler(ai)
  const b = sozcukler(dr)
  if (!a.length || !b.length) return []
  const hiza = cumleHizala(a, b)
  const aiKullan = new Set(hiza.map((h) => h.ai))
  const drKullan = new Set(hiza.map((h) => h.dr))
  const silinen = a.filter((_, i) => !aiKullan.has(i))
  const eklenen = b.filter((_, i) => !drKullan.has(i))
  const cift: { onceki: string; sonraki: string }[] = []
  const n = Math.min(silinen.length, eklenen.length)
  for (let k = 0; k < n; k++) {
    if (silinen[k] !== eklenen[k] && silinen[k].length >= 3 && eklenen[k].length >= 3) {
      cift.push({ onceki: silinen[k], sonraki: eklenen[k] })
    }
  }
  return cift.slice(0, 4)
}

function alanDeltasi(alan: DuzeltmeAlani, aiHam: string, drHam: string): DuzeltmeDelta[] {
  const ai = String(aiHam || '').trim()
  const dr = String(drHam || '').trim()
  if (ai === dr) return []
  const out: DuzeltmeDelta[] = []
  const kisa = (s: string) => piiTemizle(s)

  if (ai && !dr) {
    out.push({ tur: 'silme', alan, onceki: kisa(ai), sonraki: '' })
    return out
  }
  if (!ai && dr) {
    out.push({ tur: 'ekleme', alan, onceki: '', sonraki: kisa(dr) })
    return out
  }

  const aiC = cumlelereBol(ai)
  const drC = cumlelereBol(dr)
  const hiza = cumleHizala(aiC, drC)
  const aiK = new Set(hiza.map((h) => h.ai))
  const drK = new Set(hiza.map((h) => h.dr))

  for (let i = 0; i < aiC.length; i++) {
    if (!aiK.has(i)) out.push({ tur: 'silme', alan, onceki: kisa(aiC[i]), sonraki: '' })
  }
  for (let j = 0; j < drC.length; j++) {
    if (!drK.has(j)) out.push({ tur: 'ekleme', alan, onceki: '', sonraki: kisa(drC[j]) })
  }

  const benzer = (x: string, y: string) => {
    const sx = new Set(sozcukler(x))
    const sy = new Set(sozcukler(y))
    let ortak = 0
    for (const w of sx) if (sy.has(w)) ortak++
    return ortak / Math.max(1, Math.min(sx.size, sy.size))
  }
  for (let i = 0; i < aiC.length; i++) {
    if (aiK.has(i)) continue
    for (let j = 0; j < drC.length; j++) {
      if (drK.has(j)) continue
      if (benzer(aiC[i], drC[j]) >= 0.45) {
        out.push({ tur: 'yeniden_yazma', alan, onceki: kisa(aiC[i]), sonraki: kisa(drC[j]) })
        const sil = out.findIndex((d) => d.tur === 'silme' && d.onceki === kisa(aiC[i]))
        if (sil >= 0) out.splice(sil, 1)
        const ek = out.findIndex((d) => d.tur === 'ekleme' && d.sonraki === kisa(drC[j]))
        if (ek >= 0) out.splice(ek, 1)
        break
      }
    }
  }

  for (const t of terimCiftleri(ai, dr)) {
    out.push({
      tur: 'terim',
      alan,
      onceki: t.onceki,
      sonraki: t.sonraki,
      terimOnceki: t.onceki,
      terimSonraki: t.sonraki,
    })
  }

  const oran = ai.length ? dr.length / ai.length : 1
  if (oran < 0.7 || oran > 1.4) {
    out.push({ tur: 'uzunluk', alan, onceki: kisa(ai), sonraki: kisa(dr), oran: Math.round(oran * 100) / 100 })
  }

  const sAi = bolumSirasi(ai)
  const sDr = bolumSirasi(dr)
  if (sAi.length >= 2 && sDr.length >= 2 && sAi.join('|') !== sDr.join('|') && [...sAi].sort().join() === [...sDr].sort().join()) {
    out.push({ tur: 'sira', alan, onceki: sAi.join(' → '), sonraki: sDr.join(' → ') })
  }

  const dAi = dozDegerleri(ai)
  const dDr = dozDegerleri(dr)
  if (dAi.length && dDr.length && dAi.join() !== dDr.join()) {
    out.push({ tur: 'doz_degeri', alan, onceki: dAi.join(', '), sonraki: dDr.join(', ') })
  }
  const kgAi = DOZ_KG.test(ai)
  const kgDr = DOZ_KG.test(dr)
  const topAi = DOZ_TOPLAM.test(ai)
  const topDr = DOZ_TOPLAM.test(dr)
  if ((kgAi && !kgDr && topDr) || (topAi && !topDr && kgDr) || (kgAi && !kgDr && dDr.length)) {
    out.push({ tur: 'doz_bicimi', alan, onceki: kisa(ai), sonraki: kisa(dr) })
  }

  if (alan === 'ilaclar' || alan === 'plan') {
    const iAi = ilacAdlari(ai)
    const iDr = ilacAdlari(dr)
    if (iAi.length && iDr.length) {
      const setAi = new Set(iAi.map((x) => x.toLowerCase()))
      const setDr = new Set(iDr.map((x) => x.toLowerCase()))
      const giden = iAi.filter((x) => !setDr.has(x.toLowerCase()))
      const gelen = iDr.filter((x) => !setAi.has(x.toLowerCase()))
      if (giden.length === 1 && gelen.length === 1) {
        out.push({
          tur: 'ilac_degisimi',
          alan,
          onceki: giden[0],
          sonraki: gelen[0],
          ilacOnceki: giden[0],
          ilacSonraki: gelen[0],
        })
      }
    }
  }

  return out
}

/** Saf: alan alan fark. Model çağrısı yok. */
export function duzeltmeAnaliz(aiTaslak: AlanMetinleri, doktorSonHali: AlanMetinleri): DuzeltmeDelta[] {
  const out: DuzeltmeDelta[] = []
  for (const alan of ALANLAR) {
    out.push(...alanDeltasi(alan, String(aiTaslak[alan] || ''), String(doktorSonHali[alan] || '')))
  }
  return out
}
