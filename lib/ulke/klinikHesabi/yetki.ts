/**
 * NOTYA-ULKE-KLINIK-01 — GRANTS: how a doctor lets a member of the clinic help with that doctor's patients; THE
 * CHECK every such request passes; and THE RECORD of everything done through one. Server only. (Migration 145.)
 *
 * A PATIENT BELONGS TO ONE DOCTOR, and nothing here changes it. A member of a clinic reaches another doctor's
 * patients through this file and through nothing else, and only like this:
 *
 *   1. THE CHECK (`yetkiBul`), on every request, from nothing but the database as it is at that moment:
 *        · the country's pack allows the capability;
 *        · the one who asks is a member of a clinic NOW, in a position the capability may be given to;
 *        · the doctor is a member of THE SAME clinic NOW;
 *        · a grant of exactly that capability, from that doctor to that member (for that patient, where it is a
 *          share), exists, is not withdrawn, and — for cover — the present moment is inside its period;
 *        · the one who asks works NOW in a role of the kind the capability needs (a share: an allied role the pack
 *          lists; cover: a doctor's role).
 *      Anything else is "no" — the same "no" as for a doctor, a patient or a grant that does not exist. Nothing is
 *      cached between requests: a grant withdrawn, a member removed or a position changed a moment ago is already
 *      gone when the next request asks.
 *   2. THE RECORD (`erisimKaydet`), BEFORE the read or the write: who, whose patients, which patient where there is
 *      one, which capability, what. If the row cannot be written, nothing is read: the request is refused.
 *   3. Only then the caller reads or writes — with the DOCTOR's id, through the same library functions the doctor's
 *      own routes use, which bind every statement to that doctor and to this build's country.
 *
 * A POSITION IS NOT ACCESS. No function here answers "yes" because of a position: the owner and an administrator of
 * a clinic have no grant by being that.
 *
 * WHO MAY GIVE. The doctor whose patients they are. The clinic's owner on a doctor's behalf only where the country's
 * pack says so (`sahipHekimAdinaVerebilir`; every pack starts with no) — and the record names who entered it.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { roller } from '../arayuz'
import { hastaAdlari, hastaGetir } from '../uygulama/hastalar'
import { hekimRolunuOku } from '../uygulama/rol'
import { hesapSaatDilimi } from '../uygulama/saatDilimi'
import { ulkeIslevi, ulkeTablosu } from '../uygulama/tablolar'
import { gunEkle, gunGecerli, yerelAn, yerelUtc } from '../uygulama/zaman'
import { hesapAdlari, klinikAyarlari, klinikteUyelik, uyelikOku } from './klinik'
import {
  ERISIM_NELERI, ERISIM_OLAYLARI, KAYIT_LISTE_AZAMI, YETKI_ALAN_KONUMLARI, YETKI_ROL_TARAFLARI, hastaSahibiOlabilir, yetkiTuruMu,
  type ErisimKaydi, type ErisimNesi, type ErisimOlayi, type KlinikYetkisi, type KlinikYetkiTuru,
} from './tipler'

const TABLO = 'ulke_klinik_yetkileri'
const KAYIT = 'ulke_klinik_erisim_kayitlari'
const KOLONLAR = 'id, klinik_id, doctor_id, alan_id, tur, patient_id, baslangic, bitis, kaydeden_id, iptal_at, created_at'
type Satir = { id: string; klinik_id: string; doctor_id: string; alan_id: string; tur: unknown; patient_id: string | null; baslangic: string | null; bitis: string | null; kaydeden_id: string; iptal_at: string | null; created_at: string }

/** true = the grant opens something at `simdi`: not withdrawn and, where it has a period, inside it. */
function gecerli(s: Pick<Satir, 'iptal_at' | 'baslangic' | 'bitis'>, simdi: number): boolean {
  if (s.iptal_at) return false
  if (s.baslangic === null && s.bitis === null) return true
  if (!s.baslangic || !s.bitis) return false
  return new Date(s.baslangic).getTime() <= simdi && simdi < new Date(s.bitis).getTime()
}

const satirdan = (s: Satir, simdi: number): KlinikYetkisi => ({
  id: s.id, tur: s.tur as KlinikYetkiTuru, hekimId: s.doctor_id, alanId: s.alan_id, hastaId: s.patient_id ?? null,
  baslangic: s.baslangic ?? null, bitis: s.bitis ?? null, kaydedenId: s.kaydeden_id, olusturuldu: s.created_at, iptal: s.iptal_at ?? null, gecerli: gecerli(s, simdi),
})

/** true = an account that works as `rol` may hold the capability `tur` in this country. */
function rolUygun(tur: KlinikYetkiTuru, rol: string | null): boolean {
  const taraflar = YETKI_ROL_TARAFLARI[tur]
  if (!taraflar) return true
  const tanim = rol ? roller().find((r) => r.anahtar === rol) : undefined
  if (!tanim || !taraflar.includes(tanim.taraf)) return false
  // A share: only the allied roles the pack lists (the scope of a profession is the country's law, not the kit's).
  if (tur === 'paylasim') return (klinikAyarlari()?.paylasimRolleri ?? []).includes(tanim.anahtar)
  return true
}

// ───────────────────────── THE CHECK ─────────────────────────

/** What a request is allowed to do, once the check has passed: for THIS doctor's patients, THIS capability, through THIS grant. */
export type YetkiBaglami = { yetkiId: string; klinikId: string; hekimId: string; alanId: string; tur: KlinikYetkiTuru; hastaId: string | null }

/**
 * THE CHECK. Does `alanId` hold, at this moment, the capability `tur` for the patients of `hekimId` — and, for a
 * share, for the patient `hastaId`? null = no, for whatever reason; the caller answers "not found".
 */
export async function yetkiBul(supabase: SupabaseClient, alanId: string, hekimId: string, tur: KlinikYetkiTuru, hastaId: string | null, simdi = Date.now()): Promise<YetkiBaglami | null> {
  const ayar = klinikAyarlari()
  // The pack: a capability the country has not switched on does not exist here.
  if (!ayar || !yetkiTuruMu(tur) || !ayar.yetkiTurleri.includes(tur)) return null
  if (!alanId || !hekimId || alanId === hekimId) return null
  if ((tur === 'paylasim') !== Boolean(hastaId)) return null
  // The one who asks: a member NOW, in a position this capability is given to.
  const ben = await uyelikOku(supabase, alanId)
  if (!ben || !YETKI_ALAN_KONUMLARI[tur].includes(ben.konum)) return null
  // The doctor: a member of THE SAME clinic NOW.
  const hekim = await klinikteUyelik(supabase, ben.klinikId, hekimId)
  if (!hekim || !hastaSahibiOlabilir(hekim.konum)) return null
  // THE GRANT: this clinic, this doctor, this member, this capability, not withdrawn (and this patient, for a share).
  let q = ulkeTablosu(supabase, TABLO).select('id, patient_id, baslangic, bitis, iptal_at').eq('klinik_id', ben.klinikId).eq('doctor_id', hekimId).eq('alan_id', alanId).eq('tur', tur).is('iptal_at', null)
  if (hastaId) q = q.eq('patient_id', hastaId)
  const { data, error } = await q.limit(5)
  if (error || !data) return null
  const y = (data as unknown as Pick<Satir, 'id' | 'patient_id' | 'baslangic' | 'bitis' | 'iptal_at'>[]).find((s) => gecerli(s, simdi) && (s.patient_id ?? null) === (hastaId ?? null))
  if (!y) return null
  // The role the one who asks works in NOW.
  if (!rolUygun(tur, await hekimRolunuOku(supabase, alanId))) return null
  return { yetkiId: y.id, klinikId: ben.klinikId, hekimId, alanId, tur, hastaId: hastaId ?? null }
}

// ───────────────────────── THE RECORD ─────────────────────────

/** Writes one row of the record for a read or a write through a grant. false = NOT written: the caller must refuse the request. */
export async function erisimKaydet(supabase: SupabaseClient, b: YetkiBaglami, olay: 'okuma' | 'yazma', ne: ErisimNesi, hastaId: string | null, simdi = Date.now()): Promise<boolean> {
  const { error } = await ulkeTablosu(supabase, KAYIT).insert({ doctor_id: b.hekimId, kisi_id: b.alanId, alan_id: b.alanId, patient_id: hastaId ?? null, yetki_id: b.yetkiId, tur: b.tur, olay, ne, created_at: new Date(simdi).toISOString() })
  return !error
}

/**
 * THE CHECK AND THE RECORD in one step: the way every route asks. The context, or null — also when the grant stands
 * and only the record could not be written: no row, no read.
 */
export async function yetkiyle(supabase: SupabaseClient, alanId: string, hekimId: string, tur: KlinikYetkiTuru, g: { olay: 'okuma' | 'yazma'; ne: ErisimNesi; hastaId?: string | null; paylasimHastasi?: string | null }, simdi = Date.now()): Promise<YetkiBaglami | null> {
  const b = await yetkiBul(supabase, alanId, hekimId, tur, tur === 'paylasim' ? g.paylasimHastasi ?? g.hastaId ?? null : null, simdi)
  if (!b) return null
  if (!(await erisimKaydet(supabase, b, g.olay, g.ne, g.hastaId ?? b.hastaId ?? null, simdi))) return null
  return b
}

/**
 * THE RECORD OF ONE DOCTOR: everything given, withdrawn, ended, read and written about THAT doctor's patients,
 * newest first. Read by the doctor's own id and by nothing from a request.
 */
export async function erisimKayitlari(supabase: SupabaseClient, hekimId: string): Promise<ErisimKaydi[]> {
  const { data, error } = await ulkeTablosu(supabase, KAYIT).select('id, kisi_id, alan_id, patient_id, tur, olay, ne, created_at').eq('doctor_id', hekimId).order('created_at', { ascending: false }).limit(KAYIT_LISTE_AZAMI)
  if (error || !data) return []
  const satirlar = (data as unknown as { id: string; kisi_id: string; alan_id: string; patient_id: string | null; tur: unknown; olay: unknown; ne: unknown; created_at: string }[])
    .filter((s) => yetkiTuruMu(s.tur) && (ERISIM_OLAYLARI as readonly unknown[]).includes(s.olay))
  const adlar = await hesapAdlari(supabase, satirlar.flatMap((s) => [s.kisi_id, s.alan_id]))
  // Patient names by doctor AND patient id: a row that points at a patient who is not this doctor's gets no name.
  const hastalar = await hastaAdlari(supabase, hekimId, satirlar.map((s) => s.patient_id ?? '').filter(Boolean))
  return satirlar.map((s) => ({
    id: s.id, an: s.created_at, olay: s.olay as ErisimOlayi, tur: s.tur as KlinikYetkiTuru,
    ne: (ERISIM_NELERI as readonly unknown[]).includes(s.ne) ? (s.ne as ErisimNesi) : null,
    kisiId: s.kisi_id, kisiAdi: adlar.get(s.kisi_id) ?? '', alanId: s.alan_id, alanAdi: adlar.get(s.alan_id) ?? '',
    hastaId: s.patient_id ?? null, hastaAdi: s.patient_id ? hastalar.get(s.patient_id) ?? '' : '',
  }))
}

// ───────────────────────── giving and withdrawing ─────────────────────────

export type YetkiRetKodu = 'NOT_FOUND' | 'YETKI_YOK' | 'KONUM' | 'ROL' | 'TUR_KAPALI' | 'GECERSIZ' | 'AYNI' | 'BASARISIZ'
type Ret = { tamam: false; kod: YetkiRetKodu; alan?: string }
const ret = (kod: YetkiRetKodu, alan?: string): Ret => ({ tamam: false, kod, ...(alan ? { alan } : {}) })

export type YetkiGirdisi = {
  /** The doctor whose patients the grant is about. Absent = the one who asks. */
  hekimId?: string | null
  alanId: string
  tur: unknown
  /** A share: the patient. */
  hastaId?: string | null
  /** Cover: the first and the last DAY of the period ('YYYY-MM-DD'), in the doctor's own time zone. The first day absent = today. */
  baslangicGun?: unknown
  bitisGun?: unknown
}

/**
 * A grant is given. The one who asks (`kaydedenId`) is the authenticated account: the doctor themselves, or — only
 * where the pack says so — the owner of the clinic for one of its doctors. The database checks the rest again and
 * writes the grant and its record row together (ulke_klinik_yetki_ver).
 */
export async function yetkiVer(supabase: SupabaseClient, kaydedenId: string, g: YetkiGirdisi, simdi = Date.now()): Promise<{ tamam: true; yetkiId: string; yeni: boolean } | Ret> {
  const ayar = klinikAyarlari()
  if (!ayar) return ret('NOT_FOUND')
  if (!yetkiTuruMu(g.tur)) return ret('GECERSIZ', 'tur')
  const tur = g.tur
  if (!ayar.yetkiTurleri.includes(tur)) return ret('TUR_KAPALI')
  const hekimId = g.hekimId || kaydedenId
  // ON A DOCTOR'S BEHALF: only where the country's pack allows it at all. (That the one who asks is the clinic's
  // owner, and nobody else, is the database's rule.)
  if (hekimId !== kaydedenId && ayar.sahipHekimAdinaVerebilir !== true) return ret('YETKI_YOK')
  const ben = await uyelikOku(supabase, kaydedenId)
  if (!ben) return ret('NOT_FOUND')
  const alan = await klinikteUyelik(supabase, ben.klinikId, g.alanId)
  if (!alan || g.alanId === hekimId) return ret('NOT_FOUND')
  if (!YETKI_ALAN_KONUMLARI[tur].includes(alan.konum)) return ret('KONUM')
  // The role of the member it is for: the kit's rule and the pack's list. The database cannot know a role's kind.
  if (!rolUygun(tur, await hekimRolunuOku(supabase, g.alanId))) return ret('ROL')
  let hastaId: string | null = null
  if (tur === 'paylasim') {
    // ISOLATION: the patient must be THE DOCTOR's before anything is written for them.
    const hasta = typeof g.hastaId === 'string' ? await hastaGetir(supabase, hekimId, g.hastaId) : null
    if (!hasta) return ret('NOT_FOUND')
    hastaId = hasta.id
  } else if (g.hastaId) return ret('GECERSIZ', 'hastaId')
  let baslangic: string | null = null, bitis: string | null = null
  if (tur === 'vekalet') {
    // Whole days of THE DOCTOR's own time zone: from the start of the first day to the end of the last.
    const dilim = await hesapSaatDilimi(supabase, hekimId)
    const bugun = yerelAn(simdi, dilim).gun
    const ilk = g.baslangicGun === undefined || g.baslangicGun === null || g.baslangicGun === '' ? bugun : g.baslangicGun
    if (typeof ilk !== 'string' || !gunGecerli(ilk) || ilk < bugun) return ret('GECERSIZ', 'baslangicGun')
    if (typeof g.bitisGun !== 'string' || !gunGecerli(g.bitisGun) || g.bitisGun < ilk) return ret('GECERSIZ', 'bitisGun')
    const azami = ayar.vekaletAzamiGun
    if (!Number.isInteger(azami) || azami < 1 || azami > 31 || g.bitisGun >= gunEkle(ilk, azami)) return ret('GECERSIZ', 'bitisGun')
    baslangic = new Date(yerelUtc(ilk, 0, dilim)).toISOString()
    bitis = new Date(yerelUtc(gunEkle(g.bitisGun, 1), 0, dilim)).toISOString()
  } else if (g.baslangicGun || g.bitisGun) return ret('GECERSIZ', 'bitisGun')
  const { data, error } = await ulkeIslevi(supabase, 'ulke_klinik_yetki_ver', {
    p_klinik_id: ben.klinikId, p_doctor_id: hekimId, p_alan_id: g.alanId, p_tur: tur, p_patient_id: hastaId,
    p_baslangic: baslangic, p_bitis: bitis, p_kaydeden_id: kaydedenId, p_simdi: new Date(simdi).toISOString(),
  })
  if (error) return ret('BASARISIZ')
  const d = data as { durum?: string; yetki_id?: string } | null
  if ((d?.durum === 'TAMAM' || d?.durum === 'VAR') && d.yetki_id) return { tamam: true, yetkiId: d.yetki_id, yeni: d.durum === 'TAMAM' }
  if (d?.durum === 'NOT_FOUND' || d?.durum === 'YETKI_YOK' || d?.durum === 'KONUM' || d?.durum === 'GECERSIZ') return ret(d.durum)
  return ret('BASARISIZ')
}

/**
 * A grant is withdrawn — by the doctor whose patients it is about, by the member who holds it (who gives it up), or
 * by whoever entered it. A grant of anybody else is a grant that does not exist. It ends at once.
 */
export async function yetkiGeriAl(supabase: SupabaseClient, yapanId: string, yetkiId: string, simdi = Date.now()): Promise<{ tamam: true } | Ret> {
  if (!klinikAyarlari()) return ret('NOT_FOUND')
  const { data, error } = await ulkeIslevi(supabase, 'ulke_klinik_yetki_geri_al', { p_yetki_id: yetkiId, p_yapan_id: yapanId, p_simdi: new Date(simdi).toISOString() })
  if (error) return ret('BASARISIZ')
  if (data === 'TAMAM') return { tamam: true }
  return ret(data === 'NOT_FOUND' ? 'NOT_FOUND' : data === 'AYNI' ? 'AYNI' : 'BASARISIZ')
}

// ───────────────────────── lists ─────────────────────────

/** Every grant about THIS doctor's patients: those that stand and those that ended, newest first, with the name of a shared patient. */
export async function verilenYetkiler(supabase: SupabaseClient, hekimId: string, simdi = Date.now()): Promise<(KlinikYetkisi & { alanAdi: string; hastaAdi: string })[]> {
  const { data, error } = await ulkeTablosu(supabase, TABLO).select(KOLONLAR).eq('doctor_id', hekimId).order('created_at', { ascending: false }).limit(KAYIT_LISTE_AZAMI)
  if (error || !data) return []
  const satirlar = (data as unknown as Satir[]).filter((s) => yetkiTuruMu(s.tur))
  const adlar = await hesapAdlari(supabase, satirlar.map((s) => s.alan_id))
  const hastalar = await hastaAdlari(supabase, hekimId, satirlar.map((s) => s.patient_id ?? '').filter(Boolean))
  return satirlar.map((s) => ({ ...satirdan(s, simdi), alanAdi: adlar.get(s.alan_id) ?? '', hastaAdi: s.patient_id ? hastalar.get(s.patient_id) ?? '' : '' }))
}

/**
 * The grants THIS member holds that open something now — with the doctor's name and NOTHING of any patient (not
 * even the name of a shared one: that is read through the grant, and recorded, in ./paylasim.ts).
 */
export async function alinanYetkiler(supabase: SupabaseClient, alanId: string, simdi = Date.now()): Promise<(KlinikYetkisi & { hekimAdi: string })[]> {
  const ayar = klinikAyarlari()
  const ben = await uyelikOku(supabase, alanId)
  if (!ayar || !ben) return []
  const { data, error } = await ulkeTablosu(supabase, TABLO).select(KOLONLAR).eq('klinik_id', ben.klinikId).eq('alan_id', alanId).is('iptal_at', null).order('created_at', { ascending: false }).limit(KAYIT_LISTE_AZAMI)
  if (error || !data) return []
  const satirlar = (data as unknown as Satir[]).filter((s) => yetkiTuruMu(s.tur) && ayar.yetkiTurleri.includes(s.tur) && YETKI_ALAN_KONUMLARI[s.tur].includes(ben.konum) && gecerli(s, simdi))
  const adlar = await hesapAdlari(supabase, satirlar.map((s) => s.doctor_id))
  return satirlar.map((s) => ({ ...satirdan(s, simdi), hekimAdi: adlar.get(s.doctor_id) ?? '' }))
}
