/**
 * MBYS-YARDIMCI-01 — build the MBYS record of one visit from what Notya already holds. Pure (the route does the
 * doctor-scoped reads and decryption). Read-only over the note: nothing clinical is changed here.
 *
 * Identity precedence: what the doctor typed in the queue's "Kimlik bilgileri" (mbys_hasta_kimlik) > the patient's
 * latest intake form > the patient record (name split, dob, gender, card T.C.).
 */
import { cinsiyetTr } from '@/lib/utils/cinsiyet'
import {
  MBYS_KAYIT_SURUM,
  icd10Normalize,
  type MbysAyar,
  type MbysCinsiyet,
  type MbysKayit,
  type MbysKayitTuru,
  type MbysKimlik,
  type MbysTani,
} from './kontrol'

/** What the doctor saved for this patient in the queue (all optional). */
export type MbysKimlikEk = Partial<MbysKimlik> & { kayitTuru?: MbysKayitTuru | '' }

export type MbysNotGirdi = {
  basvuru_yakinmasi?: unknown
  content_subjektif?: unknown
  content_objektif?: unknown
  content_degerlendirme?: unknown
  content_plan?: unknown
  icd10_codes?: unknown
  vitaller?: unknown
}

export type MbysKayitGirdi = {
  hastaAd: string
  dogum: string
  cinsiyet: string
  kartTc: string
  form: Record<string, unknown> | null
  ek: MbysKimlikEk | null
  not: MbysNotGirdi | null
  ayar: MbysAyar
  /** false for ön büro: screen 2 (muayene, tanı) is never handed over. */
  muayeneDahil: boolean
  simdi?: string
}

const m = (v: unknown) => (Array.isArray(v) ? v.filter(Boolean).join(', ') : String(v ?? '')).trim()

export function mbysKayitTuruCoz(ham: unknown): MbysKayitTuru | '' {
  return ham === 'vatandas' || ham === 'yabanci' || ham === 'vatansiz' ? ham : ''
}

export function mbysCinsiyetCoz(ham: unknown): MbysCinsiyet {
  if (ham === 'E' || ham === 'K') return ham
  const tr = cinsiyetTr(m(ham))
  return tr === 'Kadın' ? 'K' : tr === 'Erkek' ? 'E' : ''
}

/** "2019-03-01", "2019-03-01T…", "01.03.2019", "1/3/2019" → "2019-03-01"; anything else → as typed (fails the check). */
export function mbysTarihCoz(ham: unknown): string {
  const s = m(ham)
  if (!s) return ''
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const tr = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(s)
  if (tr) return `${tr[3]}-${tr[2].padStart(2, '0')}-${tr[1].padStart(2, '0')}`
  return s
}

/** "Ayşe Nur Yılmaz" → ad "Ayşe Nur", soyad "Yılmaz". */
export function adSoyadAyir(tam: string): { ad: string; soyad: string } {
  const p = String(tam || '').trim().split(/\s+/).filter(Boolean)
  if (p.length < 2) return { ad: p[0] || '', soyad: '' }
  return { ad: p.slice(0, -1).join(' '), soyad: p[p.length - 1] }
}

/** The note's icd10_codes ([{kod|code, ad|aciklama}] or plain strings) → normalized, de-duplicated. */
export function mbysTanilar(ham: unknown): MbysTani[] {
  if (!Array.isArray(ham)) return []
  const out: MbysTani[] = []
  const gorulen = new Set<string>()
  for (const x of ham) {
    let kod = ''
    let ad = ''
    if (typeof x === 'string') {
      const p = /^\s*([A-Za-z][0-9]{2}(?:\.?[0-9A-Za-z]{1,4})?)\b\s*(.*)$/.exec(x)
      kod = p ? p[1] : x
      ad = p ? p[2] : ''
    } else if (x && typeof x === 'object') {
      const o = x as Record<string, unknown>
      kod = m(o.kod ?? o.code)
      ad = m(o.ad ?? o.aciklama ?? o.display)
    }
    const n = icd10Normalize(kod)
    if (!n || gorulen.has(n)) continue
    gorulen.add(n)
    out.push({ kod: n, ad: ad.replace(/^[-–—:\s]+/, '') })
  }
  return out
}

function sayiMetin(v: unknown): string {
  const s = m(v).replace(/\s*(cm|kg)$/i, '')
  return s
}

export function mbysKayitKur(g: MbysKayitGirdi): MbysKayit {
  const ek = g.ek || {}
  const f = g.form || {}
  const ayrik = adSoyadAyir(g.hastaAd)

  const tc = m(ek.tcKimlikNo) || m(f.tcKimlik) || m(f.tcKimlikNo) || m(g.kartTc)
  const kayitTuru = mbysKayitTuruCoz(ek.kayitTuru) || (tc ? 'vatandas' : '')
  const kimlik: MbysKimlik = {
    tcKimlikNo: kayitTuru === 'vatandas' ? tc : '',
    pasaportNo: kayitTuru === 'yabanci' ? m(ek.pasaportNo) : '',
    sahisNo: kayitTuru === 'vatansiz' ? m(ek.sahisNo) : '',
    ad: m(ek.ad) || m(f.ad) || ayrik.ad,
    soyad: m(ek.soyad) || m(f.soyad) || ayrik.soyad,
    cinsiyet: mbysCinsiyetCoz(ek.cinsiyet) || mbysCinsiyetCoz(g.cinsiyet) || mbysCinsiyetCoz(f.cinsiyet),
    dogumTarihi: mbysTarihCoz(ek.dogumTarihi) || mbysTarihCoz(g.dogum) || mbysTarihCoz(f.dogumTarihi),
    uyruk: m(ek.uyruk) || (kayitTuru === 'vatandas' ? 'TR' : ''),
  }

  const n = g.not || {}
  const vit = n.vitaller && typeof n.vitaller === 'object' ? (n.vitaller as Record<string, unknown>) : {}
  const hikaye = m(n.content_subjektif)
  const muayene = g.muayeneDahil
    ? {
        sikayet: m(n.basvuru_yakinmasi) || hikaye.split(/\n/)[0].trim(),
        hikaye,
        bulgu: m(n.content_objektif),
        aciklama: m(n.content_plan),
        boy: sayiMetin(vit.boy),
        kilo: sayiMetin(vit.kilo),
        muayeneTuru: g.ayar.muayeneTuru,
        vakaTuru: g.ayar.vakaTuru,
        ozellikliHizmet: '',
      }
    : null

  return {
    surum: MBYS_KAYIT_SURUM,
    kayitTuru,
    kimlik,
    muayene,
    tanilar: g.muayeneDahil ? mbysTanilar(n.icd10_codes) : [],
    hazirlandi: g.simdi || new Date().toISOString(),
  }
}
