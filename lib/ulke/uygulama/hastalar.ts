/**
 * NOTYA-UZ-MUAYENE-01 — patients of the signed-in application: create, list, find, read.
 *
 * PATIENT ISOLATION (.cursor/skills/hasta-izolasyon/SKILL.md). The client here is the SERVICE-ROLE client, which
 * bypasses row-level security, so this file IS the isolation: every query below carries the authenticated doctor's
 * id, and a patient id that came from a request is matched against that doctor in the SAME query that reads the row.
 * A foreign id and a missing id give the same answer (null → the route says 404).
 *
 * COUNTRY (lib/ulke/uygulama/tablolar.ts). Every statement below is also bound to this build's country: a patient
 * of another country is not found here even with its id and its doctor's id.
 *
 * Storage (migration 131, country tables — never Türkiye's `patients`): `ulke_hastalar` holds the patient (name /
 * birth date / sex / phone encrypted with lib/security/encryption.ts); `hasta_ulke_bilgisi`, one row per patient,
 * holds the second name field, the patient's own language and an optional national identity number.
 *
 * No Turkish identity number is read, asked for or written: `tc_kimlik_hash` stays null. The national identity
 * number is optional free text, stored encrypted and NOT validated (docs/COUNTRY-PACK-CHECKLIST.md G5 is open).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { ulkePaketi } from '../ulke'
import { ulkeTablosu } from './tablolar'

export type Cinsiyet = 'male' | 'female'

export type Hasta = {
  id: string
  ad: string
  otaIsmi: string
  /** YYYY-MM-DD or ''. */
  dogumTarihi: string
  cinsiyet: Cinsiyet | ''
  telefon: string
  /** The patient's own language: one of the pack's `hastaDilleri`. '' = not recorded. */
  dil: string
  ulusalKimlik: string
  olusturuldu: string
}

export type HastaGirdisi = { ad: string; otaIsmi: string; dogumTarihi: string; cinsiyet: Cinsiyet | ''; telefon: string; dil: string; ulusalKimlik: string }

const TARIH = /^\d{4}-\d{2}-\d{2}$/

/** A real calendar date, not in the future, not older than 130 years. */
export function dogumTarihiGecerli(ham: string): boolean {
  if (!TARIH.test(ham)) return false
  const t = new Date(`${ham}T00:00:00Z`)
  if (Number.isNaN(t.getTime()) || t.toISOString().slice(0, 10) !== ham) return false
  const simdi = Date.now()
  return t.getTime() <= simdi + 86_400_000 && t.getTime() > simdi - 130 * 365.25 * 86_400_000
}

/** Languages a patient can be recorded with in this country. */
export function hastaDilleri(): readonly string[] {
  return ulkePaketi().uygulama?.hastaDilleri ?? []
}

/** null = acceptable; otherwise the name of the field that is not. Nothing is validated beyond what the form promises. */
export function hastaGirdisiHatasi(g: HastaGirdisi): keyof HastaGirdisi | null {
  if (g.ad.length < 2) return 'ad'
  if (g.dogumTarihi && !dogumTarihiGecerli(g.dogumTarihi)) return 'dogumTarihi'
  if (g.cinsiyet && g.cinsiyet !== 'male' && g.cinsiyet !== 'female') return 'cinsiyet'
  if (!hastaDilleri().includes(g.dil)) return 'dil'
  // NOTYA-ULKE-SABLON-01: the identity number is checked only where the pack says its rule is to be applied
  // (`uygulama.kimlikNumarasi.dogrula`); elsewhere it is stored as typed. An empty value is always acceptable.
  const p = ulkePaketi()
  if (g.ulusalKimlik && p.ulusalKimlik && p.uygulama?.kimlikNumarasi.dogrula && !p.ulusalKimlik.gecerliMi(g.ulusalKimlik)) return 'ulusalKimlik'
  return null
}

/**
 * NOTYA-ULKE-SABLON-01 — the fields a country does not have are not kept, whatever a request sends: a second name
 * where the pack has no such field (`uygulama.adAlanlari.ikinciAd`), an identity number where the pack records none
 * (`ulusalKimlik: null`).
 */
export function hastaGirdisiniSuz(g: HastaGirdisi): HastaGirdisi {
  const p = ulkePaketi()
  return { ...g, otaIsmi: p.uygulama?.adAlanlari.ikinciAd ? g.otaIsmi : '', ulusalKimlik: p.ulusalKimlik ? g.ulusalKimlik : '' }
}

const coz = (ham: unknown): string => {
  if (typeof ham !== 'string' || !ham) return ''
  try { return decrypt(ham) } catch { return '' }
}

function adCoz(ham: unknown): string {
  const duz = coz(ham)
  if (!duz) return ''
  try { return String((JSON.parse(duz) as { ad?: unknown }).ad ?? '').trim() } catch { return '' }
}

type HastaSatiri = { id: string; name_encrypted: string | null; dob_encrypted: string | null; gender_encrypted: string | null; phone_encrypted: string | null; created_at: string }
type EkSatiri = { patient_id: string; ota_ismi_encrypted: string | null; dil: string | null; ulusal_kimlik_encrypted: string | null }

function birlestir(h: HastaSatiri, ek: EkSatiri | undefined): Hasta {
  const cinsiyet = coz(h.gender_encrypted)
  return {
    id: h.id,
    ad: adCoz(h.name_encrypted),
    otaIsmi: coz(ek?.ota_ismi_encrypted),
    dogumTarihi: coz(h.dob_encrypted),
    cinsiyet: cinsiyet === 'male' || cinsiyet === 'female' ? cinsiyet : '',
    telefon: coz(h.phone_encrypted),
    dil: hastaDilleri().includes(String(ek?.dil ?? '')) ? String(ek?.dil) : '',
    ulusalKimlik: coz(ek?.ulusal_kimlik_encrypted),
    olusturuldu: h.created_at,
  }
}

const HASTA_KOLONLARI = 'id, name_encrypted, dob_encrypted, gender_encrypted, phone_encrypted, created_at'
const EK_KOLONLARI = 'patient_id, ota_ismi_encrypted, dil, ulusal_kimlik_encrypted'

/** Creates the patient for THIS doctor. null = nothing was saved (a half-written patient is removed again). */
export async function hastaOlustur(supabase: SupabaseClient, doktorId: string, ham: HastaGirdisi): Promise<Hasta | null> {
  const g = hastaGirdisiniSuz(ham)
  const { data: h, error } = await ulkeTablosu(supabase, 'ulke_hastalar')
    .insert({
      doctor_id: doktorId,
      name_encrypted: encrypt(JSON.stringify({ ad: g.ad })),
      dob_encrypted: g.dogumTarihi ? encrypt(g.dogumTarihi) : null,
      gender_encrypted: g.cinsiyet ? encrypt(g.cinsiyet) : null,
      phone_encrypted: g.telefon ? encrypt(g.telefon) : null,
      is_active: true,
    })
    .select(HASTA_KOLONLARI)
    .single()
  if (error || !h) return null
  const ek = {
    patient_id: (h as HastaSatiri).id,
    doctor_id: doktorId,
    ota_ismi_encrypted: g.otaIsmi ? encrypt(g.otaIsmi) : null,
    dil: g.dil,
    ulusal_kimlik_encrypted: g.ulusalKimlik ? encrypt(g.ulusalKimlik) : null,
  }
  const { error: ekHatasi } = await ulkeTablosu(supabase, 'hasta_ulke_bilgisi').insert(ek)
  if (ekHatasi) {
    // The patient's language is part of the record this country requires: without it the patient is not saved.
    try { await ulkeTablosu(supabase, 'ulke_hastalar').delete().eq('id', ek.patient_id).eq('doctor_id', doktorId) } catch { /* reported as a failure either way */ }
    return null
  }
  return birlestir(h as HastaSatiri, ek)
}

/** One patient of THIS doctor, or null — for a foreign id exactly as for an id that does not exist. */
export async function hastaGetir(supabase: SupabaseClient, doktorId: string, hastaId: string): Promise<Hasta | null> {
  const { data: h, error } = await ulkeTablosu(supabase, 'ulke_hastalar').select(HASTA_KOLONLARI).eq('id', hastaId).eq('doctor_id', doktorId).maybeSingle()
  if (error || !h) return null
  const { data: ek } = await ulkeTablosu(supabase, 'hasta_ulke_bilgisi').select(EK_KOLONLARI).eq('patient_id', hastaId).eq('doctor_id', doktorId).maybeSingle()
  return birlestir(h as HastaSatiri, (ek as EkSatiri | null) ?? undefined)
}

/** Every patient of THIS doctor, by name. `q` narrows the list by name, patronymic, phone digits or identity number. */
export async function hastalariListele(supabase: SupabaseClient, doktorId: string, q = ''): Promise<Hasta[] | null> {
  const { data: satirlar, error } = await ulkeTablosu(supabase, 'ulke_hastalar').select(HASTA_KOLONLARI).eq('doctor_id', doktorId).order('created_at', { ascending: false })
  if (error || !satirlar) return null
  const { data: ekler } = await ulkeTablosu(supabase, 'hasta_ulke_bilgisi').select(EK_KOLONLARI).eq('doctor_id', doktorId)
  const ekHaritasi = new Map(((ekler as EkSatiri[] | null) ?? []).map((e) => [e.patient_id, e]))
  let hastalar = (satirlar as HastaSatiri[]).map((h) => birlestir(h, ekHaritasi.get(h.id)))
  const aranan = q.trim()
  if (aranan) {
    const katla = ulkePaketi().uygulama?.aramaKatla ?? ((s: string) => s.toLowerCase())
    const sozcukler = katla(aranan).split(/\s+/).filter(Boolean)
    const rakam = aranan.replace(/\D/g, '')
    hastalar = hastalar.filter((h) => {
      const metin = katla(`${h.ad} ${h.otaIsmi}`)
      if (sozcukler.length && sozcukler.every((s) => metin.includes(s))) return true
      if (rakam.length >= 3 && (h.telefon.replace(/\D/g, '').includes(rakam) || h.ulusalKimlik.replace(/\D/g, '').includes(rakam))) return true
      return false
    })
  }
  const sirala = new Intl.Collator(ulkePaketi().bicim.yerel, { sensitivity: 'base' })
  return hastalar.sort((a, b) => sirala.compare(a.ad, b.ad))
}

/** Names of the given patients of THIS doctor (for lists of visits). Ids that are not the doctor's simply have no name. */
export async function hastaAdlari(supabase: SupabaseClient, doktorId: string, idler: string[]): Promise<Map<string, string>> {
  const tekil = [...new Set(idler.filter(Boolean))]
  if (!tekil.length) return new Map()
  const { data } = await ulkeTablosu(supabase, 'ulke_hastalar').select('id, name_encrypted').eq('doctor_id', doktorId).in('id', tekil)
  return new Map(((data as { id: string; name_encrypted: string | null }[] | null) ?? []).map((h) => [h.id, adCoz(h.name_encrypted)]))
}
