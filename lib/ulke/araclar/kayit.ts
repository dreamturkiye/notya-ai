/**
 * NOTYA-ULKE-ARACLAR-01 — KEEPING A TOOL'S RESULT ON A PATIENT, and the follow-up list (migration 139). Server only.
 *
 * A TOOL STORES NOTHING BY ITSELF. A result is kept only when the doctor opens the tool FOR one of their patients
 * and presses "keep". What is kept: the tool's key, what the doctor typed, what came out, and — only where the
 * doctor entered one — a follow-up day.
 *
 * THE SERVER WORKS THE RESULT OUT AGAIN. The browser sends the form as it was typed; the server reads it with the
 * same function the screen used (./girdi.ts), runs the kit's own arithmetic with the pack's numbers, and keeps THAT.
 * A result a browser sends is not read at all. An incomplete form is not kept.
 *
 * WHICH TOOL. Only a tool the account may open: the same gate as the grid and the address (./paket.ts →
 * hesabinAraci), on the role the account has NOW. A key of another role's tool, of a slot, of a tool the pack does
 * not list, or of no tool at all is refused.
 *
 * THE FOLLOW-UP DAY IS THE DOCTOR'S. The kit proposes none — an interval is clinical guidance of a country, and the
 * kit holds no such content. The day is today or later, in the account's own time zone.
 *
 * HEALTH DATA. One value, encrypted with the same helper as the rest of a patient's data
 * (lib/security/encryption.ts). The country, the doctor, the patient and the tool are INSIDE the encrypted value as
 * well as in the row's key: a value that is not this row's own is read as "cannot be shown".
 *
 * PATIENT ISOLATION (.cursor/skills/hasta-izolasyon/SKILL.md). Service-role client, so this file is the isolation:
 * a patient id or a record id from a request is matched against the authenticated doctor in the same statement
 * that reads the row; another doctor's patient or record answers exactly like one that does not exist. Every
 * statement is bound to this build's country (lib/ulke/uygulama/tablolar.ts).
 *
 * NOTHING IS SENT TO ANYBODY, and nothing here is read by the note-writing path.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { arayuz } from '../arayuz'
import { aktifUlke, ozellikAcik } from '../ulke'
import { hastaAdlari, hastaGetir } from '../uygulama/hastalar'
import { hekimRolunuOku } from '../uygulama/rol'
import { hesapSaatDilimi } from '../uygulama/saatDilimi'
import { ulkeTablosu } from '../uygulama/tablolar'
import { gunEkle, gunGecerli, yerelAn } from '../uygulama/zaman'
import { girdiyiCoz, hamdanGosterilen, hamiSuz, okunamayanAlanlar } from './girdi'
import { KAYIT_LISTE_AZAMI, TAKIP_EN_UZAK_GUN, TAKIP_LISTE_AZAMI, type AracKaydi, type TakipSatiri } from './kayitTipleri'
import { birimOrtami } from './ortam'
import { hesabinAraci } from './paket'
import type { AracGirdisi, AracSonucu, UlkeAraclari } from './tipler'

const TABLO = 'ulke_arac_kayitlari'
const KOLONLAR = 'id, patient_id, arac, kayit_encrypted, takip_tarihi, kapandi_at, created_at'
type Satir = { id: string; patient_id: string; arac: string; kayit_encrypted: string | null; takip_tarihi: string | null; kapandi_at: string | null; created_at: string }
/** The stored value is never larger than this many characters before encryption. */
const KAYIT_AZAMI = 20_000

/** The pack's tools, or null where the country has no tools area. */
export const aktifAracIcerigi = (): UlkeAraclari | null => (ozellikAcik('cekirdekMuayene') && ozellikAcik('araclar') ? arayuz().araclar ?? null : null)

// ───────────────────────── the encrypted value ─────────────────────────

type Zarf = { v: 1; u: string; d: string; h: string; a: string; gun: string; g: AracGirdisi; s: AracSonucu }
const sifrele = (z: Omit<Zarf, 'v' | 'u'>): string => encrypt(JSON.stringify({ v: 1, u: aktifUlke(), ...z } satisfies Zarf))
const sonucMu = (s: unknown): s is AracSonucu => {
  const x = s as Partial<AracSonucu> | null
  return Boolean(x) && typeof x === 'object' && x!.tamam === true && Array.isArray(x!.sayilar) && Array.isArray(x!.uyarilar) && Array.isArray(x!.tarihler) && (x!.bant === null || typeof x!.bant === 'string')
}
/** What a row's value holds — or null when it is not THIS country's, doctor's, patient's and tool's own value. */
function coz(ham: unknown, doktorId: string, hastaId: string, arac: string): Pick<Zarf, 'gun' | 'g' | 's'> | null {
  if (typeof ham !== 'string' || !ham) return null
  try {
    const z = JSON.parse(decrypt(ham)) as Partial<Zarf> | null
    if (!z || z.v !== 1 || z.u !== aktifUlke() || z.d !== doktorId || z.h !== hastaId || z.a !== arac) return null
    if (typeof z.gun !== 'string' || !z.g || typeof z.g !== 'object' || !sonucMu(z.s)) return null
    return { gun: z.gun, g: z.g, s: z.s }
  } catch { return null }
}

// ───────────────────────── keeping a result ─────────────────────────

export type KayitRetKodu = 'NOT_FOUND' | 'ARAC_YOK' | 'EKSIK' | 'TAKIP' | 'DURUM' | 'BASARISIZ'

/** '' or nothing = no follow-up. Otherwise a day from today on (the account's own today), not absurdly far. */
function takipGunu(ham: unknown, bugun: string): { tamam: true; gun: string | null } | { tamam: false } {
  if (ham === undefined || ham === null || ham === '') return { tamam: true, gun: null }
  if (typeof ham !== 'string' || !gunGecerli(ham) || ham < bugun || ham > gunEkle(bugun, TAKIP_EN_UZAK_GUN)) return { tamam: false }
  return { tamam: true, gun: ham }
}

/**
 * Keeps the result of one tool on one of THIS doctor's patients. `ham` is the form as it was typed; the result is
 * worked out here. Nothing is written unless everything holds.
 */
export async function aracKaydet(supabase: SupabaseClient, doktorId: string, g: { hastaId: string; arac: unknown; ham: unknown; takipTarihi?: unknown }, icerik: UlkeAraclari, simdi = Date.now()): Promise<{ tamam: true; id: string } | { tamam: false; kod: KayitRetKodu }> {
  // ISOLATION: the patient must be this doctor's before anything else is looked at.
  const hasta = await hastaGetir(supabase, doktorId, g.hastaId)
  if (!hasta) return { tamam: false, kod: 'NOT_FOUND' }
  // THE GATE: a tool of the account's own role, as on the grid. A screen-only tile works nothing out and keeps nothing.
  const x = hesabinAraci(icerik, await hekimRolunuOku(supabase, doktorId), g.arac)
  if (!x || x.tanim.tur === 'ekran') return { tamam: false, kod: 'ARAC_YOK' }
  const bugun = yerelAn(simdi, await hesapSaatDilimi(supabase, doktorId)).gun
  const ham = hamiSuz(x.tanim.alanlar, g.ham)
  const ortam = birimOrtami(icerik)
  const girdi = girdiyiCoz(x.tanim.alanlar, ham, ortam)
  // A field that holds something that could not be read ("1,5" where the comma groups thousands) keeps nothing: the
  // screen refuses the same form with the same function, and never works an unread optional field as "left empty".
  if (okunamayanAlanlar(x.tanim.alanlar, ham, girdi, ortam).length) return { tamam: false, kod: 'EKSIK' }
  const sonuc = x.tanim.hesapla(girdi, { bugun, p: x.paket.parametreler ?? {} })
  if (!sonuc.tamam) return { tamam: false, kod: 'EKSIK' }
  const takip = takipGunu(g.takipTarihi, bugun)
  if (!takip.tamam) return { tamam: false, kod: 'TAKIP' }
  const deger = { d: doktorId, h: hasta.id, a: x.tanim.anahtar, gun: bugun, g: hamdanGosterilen(x.tanim.alanlar, ham, girdi, ortam), s: sonuc }
  if (JSON.stringify(deger).length > KAYIT_AZAMI) return { tamam: false, kod: 'BASARISIZ' }
  const an = new Date(simdi).toISOString()
  const { data, error } = await ulkeTablosu(supabase, TABLO).insert({ doctor_id: doktorId, patient_id: hasta.id, arac: x.tanim.anahtar, kayit_encrypted: sifrele(deger), takip_tarihi: takip.gun, kapandi_at: null, created_at: an, updated_at: an }).select('id').single()
  const id = (data as { id?: string } | null)?.id
  if (error || !id) return { tamam: false, kod: 'BASARISIZ' }
  return { tamam: true, id }
}

// ───────────────────────── reading ─────────────────────────

/** The kept results of one of THIS doctor's patients, newest first. null = not this doctor's patient. */
export async function hastaninAracKayitlari(supabase: SupabaseClient, doktorId: string, hastaId: string): Promise<AracKaydi[] | null> {
  const hasta = await hastaGetir(supabase, doktorId, hastaId)
  if (!hasta) return null
  const { data, error } = await ulkeTablosu(supabase, TABLO).select(KOLONLAR).eq('doctor_id', doktorId).eq('patient_id', hasta.id).order('created_at', { ascending: false }).limit(KAYIT_LISTE_AZAMI)
  if (error || !data) return []
  return (data as unknown as Satir[]).map((s) => {
    const z = coz(s.kayit_encrypted, doktorId, hasta.id, s.arac)
    return { id: s.id, arac: s.arac, olusturuldu: s.created_at, gun: z?.gun ?? '', takipTarihi: s.takip_tarihi, kapandi: s.kapandi_at, girdiler: z?.g ?? null, sonuc: z?.s ?? null }
  })
}

/**
 * THE FOLLOW-UP LIST of THIS doctor: every kept result with a follow-up day that is not marked done, earliest
 * first. `gecikti` = the day is before today in the account's own time zone. No content of a record is read here.
 */
export async function takipListesi(supabase: SupabaseClient, doktorId: string, simdi = Date.now()): Promise<{ bugun: string; takipler: TakipSatiri[] }> {
  const bugun = yerelAn(simdi, await hesapSaatDilimi(supabase, doktorId)).gun
  const { data, error } = await ulkeTablosu(supabase, TABLO).select('id, patient_id, arac, takip_tarihi').eq('doctor_id', doktorId).not('takip_tarihi', 'is', null).is('kapandi_at', null).order('takip_tarihi', { ascending: true }).limit(TAKIP_LISTE_AZAMI)
  if (error || !data) return { bugun, takipler: [] }
  const satirlar = data as unknown as Pick<Satir, 'id' | 'patient_id' | 'arac' | 'takip_tarihi'>[]
  // Names are read by doctor_id AND patient id: an id that is not this doctor's simply has no name, and no row.
  const adlar = await hastaAdlari(supabase, doktorId, satirlar.map((s) => s.patient_id))
  return {
    bugun,
    takipler: satirlar.filter((s) => adlar.has(s.patient_id) && typeof s.takip_tarihi === 'string').map((s) => ({ id: s.id, hastaId: s.patient_id, hastaAdi: adlar.get(s.patient_id) ?? '', arac: s.arac, takipTarihi: s.takip_tarihi as string, gecikti: (s.takip_tarihi as string) < bugun })),
  }
}

/** The doctor marks a follow-up of THEIR OWN record as done. Once: a closed follow-up stays closed. */
export async function takipKapat(supabase: SupabaseClient, doktorId: string, kayitId: string, simdi = Date.now()): Promise<{ tamam: true } | { tamam: false; kod: KayitRetKodu }> {
  // ISOLATION: record id + doctor_id in the same statement; a foreign id is a missing id.
  const { data: s, error } = await ulkeTablosu(supabase, TABLO).select('id, takip_tarihi, kapandi_at').eq('id', kayitId).eq('doctor_id', doktorId).maybeSingle()
  if (error) return { tamam: false, kod: 'BASARISIZ' }
  const satir = s as unknown as Pick<Satir, 'id' | 'takip_tarihi' | 'kapandi_at'> | null
  if (!satir) return { tamam: false, kod: 'NOT_FOUND' }
  if (!satir.takip_tarihi || satir.kapandi_at) return { tamam: false, kod: 'DURUM' }
  const an = new Date(simdi).toISOString()
  const { data, error: yazmaHatasi } = await ulkeTablosu(supabase, TABLO).update({ kapandi_at: an, updated_at: an }).eq('id', kayitId).eq('doctor_id', doktorId).is('kapandi_at', null).select('id')
  if (yazmaHatasi) return { tamam: false, kod: 'BASARISIZ' }
  // Two requests at the same moment: the second finds nothing left to close.
  if (!Array.isArray(data) || !data.length) return { tamam: false, kod: 'DURUM' }
  return { tamam: true }
}
