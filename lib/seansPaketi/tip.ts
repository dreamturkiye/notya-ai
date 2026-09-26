/**
 * NOTYA-PAKET-01 — onaylı seans paketi. Resmî sisteme gitmez.
 * Ham ses, ham WhatsApp cümlesi ve tanı yüzdesi bu gövdede durmaz.
 */

export type PaketKaynak = 'soap' | 'fisilti_onay' | 'ikisi'
export type PaketDurum = 'taslak' | 'hekim_onayli' | 'kopyalandi_mbys' | 'enabiz_red' | 'iptal'
export type IlacEylem = 'basla' | 'durdur' | 'devam' | 'son_doz'
export type EnabizIzin = true | false | 'bilinmiyor'
export type SutSeviye = 'kirmizi' | 'sari' | 'bilgi'

export interface PaketIlac {
  ad: string
  eylem: IlacEylem
  sure?: string | null
  kaynak: 'vizit' | 'whatsapp'
}

export interface PaketIcd {
  kod: string
  ad?: string
}

export interface SeansPaketGovde {
  sikayet: string
  fizikOzeti: string
  icd10: PaketIcd[]
  ilaclar: PaketIlac[]
  islemTaslak: string[]
  yasAy: number | null
  kilo: number | null
  brans: string | null
  enabizIzin: EnabizIzin
  kalkanFisiltiId?: string | null
}

export interface SutUyari {
  kod: 'rapor_gerekli' | 'yas_kilo' | 'antibiyotik_sure' | 'kutu_3' | 'ppi_8hafta' | 'cift_islem' | 'paket_eksik' | 'enabiz_red'
  seviye: SutSeviye
  cumle: string
}

/** Klinik serbest metin. Yüzde, ham döküm ve asistan değerlendirmesi satırları düşer. */
export function klinikMetin(s: unknown): string {
  return String(s || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/\d+\s*%|%\s*\d+/.test(l) && !/transkript|asistan değerlendirme|ai değerlendirme/i.test(l))
    .join('\n')
    .slice(0, 2000)
}

export function icdListe(raw: unknown): PaketIcd[] {
  if (!Array.isArray(raw)) return []
  const out: PaketIcd[] = []
  for (const x of raw) {
    if (typeof x === 'string' && x.trim()) out.push({ kod: x.trim().toUpperCase() })
    else if (x && typeof x === 'object') {
      const o = x as { code?: string; kod?: string; description_tr?: string; description?: string }
      const kod = String(o.code || o.kod || '').trim().toUpperCase()
      if (!kod) continue
      const ad = String(o.description_tr || o.description || '').trim()
      out.push(ad ? { kod, ad } : { kod })
    }
  }
  return out
}

export function yasAyHesapla(dogum: string | null | undefined, simdi = new Date()): number | null {
  if (!dogum) return null
  const d = new Date(dogum)
  if (Number.isNaN(d.getTime())) return null
  return Math.max(0, Math.floor((simdi.getTime() - d.getTime()) / (30.44 * 86400000)))
}

/** Fısıltı taslağı onaylanmadan pakete girmez. */
export function fisiltiOnayiPaketeGirer(durum: string): boolean {
  return durum === 'onaylandi'
}

const AD_KAT = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/[^a-zçğıöşü0-9]/g, '')

/** Aynı ilaç ikinci satır açmaz. Liste zaten durmuşsa eylem=durdur yazılır; kart burada kesilmez. */
export function ilaciIsaretle(govde: SeansPaketGovde, g: { ad: string; eylem: IlacEylem; sure?: string | null; kaynak: 'vizit' | 'whatsapp'; fisiltiId?: string | null }): SeansPaketGovde {
  const anahtar = AD_KAT(g.ad).slice(0, 12)
  if (anahtar.length < 4) return govde
  const ilaclar = govde.ilaclar.map((i) => ({ ...i }))
  const i = ilaclar.findIndex((x) => AD_KAT(x.ad).includes(anahtar) || anahtar.includes(AD_KAT(x.ad).slice(0, 12)))
  if (i >= 0) ilaclar[i] = { ...ilaclar[i], eylem: g.eylem, sure: g.sure ?? ilaclar[i].sure, kaynak: g.kaynak }
  else ilaclar.push({ ad: g.ad, eylem: g.eylem, sure: g.sure ?? null, kaynak: g.kaynak })
  return { ...govde, ilaclar, kalkanFisiltiId: g.fisiltiId ?? govde.kalkanFisiltiId ?? null }
}
