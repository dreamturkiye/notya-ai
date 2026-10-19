/**
 * Özel Branş kural bağı. Metin kopyalanmaz: `lib/klinik/klinikMevzuat.ts` okunur.
 *
 * Resmi atıf (RG, madde, kanun adı) `dogrulandi: true`. Ürün takvimi
 * (yıkama günü, greft bandı, ünite) `dogrulandi: false` — hekim kilitler.
 * Pediatri, kardiyoloji ve diğer TUS branşları null döner; saça düşmez.
 */
import { klinikMevzuat } from '@/lib/klinik/klinikMevzuat'

export type KuralTur = 'kanun' | 'qos' | 'kvkk' | 'kayit' | 'riza' | 'yasak' | 'sorumluluk'

export type BagliKural = {
  id: string
  slug: string
  tur: KuralTur
  metin: string
  kaynak: 'KLINIK_MEVZUAT' | 'ürün kararı — hekim kilitler'
  dogrulandi: boolean
}

const URUN_TAKVIM = /yıkama \d|1\/3\/10\/14|greft bandı|14\/28|ünite|fluence|NAD\+|makro bandı|1\/7\/14\/42/
const RESMI = /RG \d{2}\.\d{2}\.\d{4}|\bm\.\d+|\bmd\.\d+|sayılı|Yönetmeliği|Kanunu|KVKK|Hasta Hakları/

export function kanunSatiriMi(metin: string): boolean {
  if (URUN_TAKVIM.test(metin)) return false
  return RESMI.test(metin)
}

/** Bu on branş için yayımlanmış bir çocuk izlem tablosu yoktur. Metin Neyzi taşımaz. */
export const ULUSAL_TAKVIM_YOK =
  'Bu branş için zorunlu ulusal izlem veya doz tablosu yayımlanmamıştır. Gün sayıları öneridir — hekim kilitler.'

/** Stüdyoda önce bu branşın madde atıfı, sonra ortak kanun. Yabancı branş boş. */
export function kuralVitrin(ham: string | null | undefined, n = 4): BagliKural[] {
  const bag = kuralBagla(ham)
  if (!bag) return []
  const dogru = bag.filter((k) => k.dogrulandi)
  const ozel = dogru.filter((k) => /72 saat|40176|md\.10|md\.16|md\.18|md\.24/.test(k.metin) && !/m²/.test(k.metin))
  const geri = dogru.filter((k) => !ozel.includes(k))
  return [...ozel, ...geri].slice(0, n)
}

export function kuralBagla(ham: string | null | undefined): BagliKural[] | null {
  const m = klinikMevzuat(ham)
  if (!m) return null
  const gruplar: Array<[KuralTur, readonly string[]]> = [
    ['kanun', m.kanunlar],
    ['qos', m.qos],
    ['kvkk', m.kvkk],
    ['kayit', m.kayit],
    ['riza', m.riza],
    ['yasak', m.yasak],
    ['sorumluluk', m.sorumluluk],
  ]
  const out: BagliKural[] = []
  for (const [tur, satirlar] of gruplar) {
    satirlar.forEach((metin, i) => {
      const dogrulandi = kanunSatiriMi(metin)
      out.push({
        id: `${m.slug}-${tur}-${i}`,
        slug: m.slug,
        tur,
        metin,
        kaynak: dogrulandi ? 'KLINIK_MEVZUAT' : 'ürün kararı — hekim kilitler',
        dogrulandi,
      })
    })
  }
  return out
}

/** Dosyada çizilen omurga. Veli satırı yaş kapısındadır; burada koşulsuz yoktur. */
export function kuralDosyaSatirlari(ham: string | null | undefined): BagliKural[] {
  const bag = kuralBagla(ham)
  if (!bag) return []
  return bag
    .filter((k) => k.dogrulandi && (k.tur === 'riza' || k.tur === 'kayit' || k.tur === 'kvkk') && !/veli|yasal temsilci/i.test(k.metin))
    .slice(0, 6)
}

export function kuralYasaklari(ham: string | null | undefined): string[] {
  const bag = kuralBagla(ham)
  if (!bag) return []
  return bag.filter((k) => k.tur === 'yasak').map((k) => k.metin)
}
