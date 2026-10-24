/**
 * The doctor's address book of colleagues to consult (Türkiye gold: Araçlar › Konsültasyonlar › Defter). Own rows only
 * (doctor_id = the authenticated account, on every statement). Name, phones, email, address and note are encrypted
 * together; the speciality label and the in-house flag are plain. A phone number must be a real number of this country
 * (lib/telefon/dogrula.ts) and is kept in international form. Codes only: the sentences are the pack's.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { telefonCoz, type TelefonUlke } from '@/lib/telefon/dogrula'
import { aktifUlke } from '../ulke'
import { ulkeTablosu } from './tablolar'

const TABLO = 'ulke_konsultan_defteri' as const
export const DEFTER_AZAMI = { ad: 120, brans: 80, telefon: 40, eposta: 160, adres: 240, not: 2000, kayit: 300 } as const

export type DefterKaydi = {
  id: string; ad: string; brans: string; ofisTelefon: string; telefon: string; whatsapp: string
  eposta: string; adres: string; not: string; kurumIci: boolean
}
export type DefterGirdisi = Omit<DefterKaydi, 'id'>
export type DefterAlani = 'ad' | 'brans' | 'ofisTelefon' | 'telefon' | 'whatsapp' | 'eposta' | 'adres' | 'not'

const metin = (ham: unknown, azami: number): string => (typeof ham === 'string' ? ham.trim().slice(0, azami) : '')
const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** A request body to a checked entry, or the field that is wrong. */
export function defterDogrula(g: Record<string, unknown>): { tamam: true; girdi: DefterGirdisi } | { tamam: false; alan: DefterAlani } {
  const ad = metin(g.ad, DEFTER_AZAMI.ad)
  if (!ad) return { tamam: false, alan: 'ad' }
  const eposta = metin(g.eposta, DEFTER_AZAMI.eposta)
  if (eposta && !EPOSTA.test(eposta)) return { tamam: false, alan: 'eposta' }
  const ulke = aktifUlke() as TelefonUlke
  const tel = (alan: 'ofisTelefon' | 'telefon' | 'whatsapp'): string | null => {
    const ham = metin(g[alan], DEFTER_AZAMI.telefon)
    if (!ham) return ''
    const s = telefonCoz(ulke, ham)
    return s.tamam ? s.e164 : null
  }
  const ofisTelefon = tel('ofisTelefon'); if (ofisTelefon === null) return { tamam: false, alan: 'ofisTelefon' }
  const telefon = tel('telefon'); if (telefon === null) return { tamam: false, alan: 'telefon' }
  const whatsapp = tel('whatsapp'); if (whatsapp === null) return { tamam: false, alan: 'whatsapp' }
  return { tamam: true, girdi: { ad, brans: metin(g.brans, DEFTER_AZAMI.brans), ofisTelefon, telefon, whatsapp, eposta, adres: metin(g.adres, DEFTER_AZAMI.adres), not: metin(g.not, DEFTER_AZAMI.not), kurumIci: g.kurumIci === true } }
}

type Satir = { id: string; brans: string | null; kurum_ici: boolean | null; veri_encrypted: string | null }
const KOLONLAR = 'id, brans, kurum_ici, veri_encrypted'

function kayda(s: Satir): DefterKaydi | null {
  try {
    const v = JSON.parse(decrypt(String(s.veri_encrypted))) as Partial<DefterGirdisi>
    const t = (x: unknown) => (typeof x === 'string' ? x : '')
    return { id: s.id, ad: t(v.ad), brans: s.brans ?? '', ofisTelefon: t(v.ofisTelefon), telefon: t(v.telefon), whatsapp: t(v.whatsapp), eposta: t(v.eposta), adres: t(v.adres), not: t(v.not), kurumIci: Boolean(s.kurum_ici) }
  } catch { return null }
}
const paketle = (g: DefterGirdisi) => ({ brans: g.brans, kurum_ici: g.kurumIci, veri_encrypted: encrypt(JSON.stringify({ ad: g.ad, ofisTelefon: g.ofisTelefon, telefon: g.telefon, whatsapp: g.whatsapp, eposta: g.eposta, adres: g.adres, not: g.not })) })

export async function defterListele(supabase: SupabaseClient, doktorId: string): Promise<DefterKaydi[] | null> {
  const { data, error } = await ulkeTablosu(supabase, TABLO).select(KOLONLAR).eq('doctor_id', doktorId).limit(DEFTER_AZAMI.kayit)
  if (error || !data) return null
  return (data as unknown as Satir[]).map(kayda).filter((x): x is DefterKaydi => x !== null).sort((a, b) => a.ad.localeCompare(b.ad))
}

export async function defterEkle(supabase: SupabaseClient, doktorId: string, g: DefterGirdisi): Promise<DefterKaydi | 'DOLU' | null> {
  const { count } = await ulkeTablosu(supabase, TABLO).select('id', { count: 'exact', head: true }).eq('doctor_id', doktorId)
  if ((count ?? 0) >= DEFTER_AZAMI.kayit) return 'DOLU'
  const { data, error } = await ulkeTablosu(supabase, TABLO).insert({ doctor_id: doktorId, ...paketle(g) }).select(KOLONLAR).maybeSingle()
  return error || !data ? null : kayda(data as unknown as Satir)
}

export async function defterGuncelle(supabase: SupabaseClient, doktorId: string, id: string, g: DefterGirdisi): Promise<DefterKaydi | null> {
  const { data, error } = await ulkeTablosu(supabase, TABLO).update({ ...paketle(g), updated_at: new Date().toISOString() }).eq('id', id).eq('doctor_id', doktorId).select(KOLONLAR).maybeSingle()
  return error || !data ? null : kayda(data as unknown as Satir)
}

export async function defterSil(supabase: SupabaseClient, doktorId: string, id: string): Promise<boolean> {
  const { data, error } = await ulkeTablosu(supabase, TABLO).delete().eq('id', id).eq('doctor_id', doktorId).select('id')
  return !error && Array.isArray(data) && data.length > 0
}
