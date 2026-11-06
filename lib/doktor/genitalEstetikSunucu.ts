/**
 * GENITAL-ESTETIK-01 (Kaan, 2026-11-06) — server side of the cosmetic gynaecology package. KD ONLY (brans-alan-sizmasi): every
 * route asks `genitalEstetikBransi` of the doctor's OWN branch (users.specialty), never a request parameter.
 *
 * HASTA-IZOLASYON: the patient is proven to be the doctor's (hastaSahibiMi) before anything is read or written; every
 * statement carries doctor_id AND patient_id; a photo id from a URL is read only together with both. A foreign id answers
 * exactly like a missing one (null -> 404).
 *
 * THE GATE IS CHECKED HERE, AGAIN: a cosmetic record of a patient under 18 (or without a recorded birth date) is refused
 * before it is written (lib/clinical/genitalEstetik.ts -> geKapi). The birth date is read with doctor_id.
 *
 * INTIMATE PHOTOS live in their own encrypted table (migration 190), NOT in the document vault: no list, no portal, no
 * consultation, no document analysis, no photo-archive AI route and no export reads it. Metadata is stripped on upload
 * (the photo archive's own lib/doktor/fotoArsiv/metaTemizle.ts — reused, not copied). There is no thumbnail. Every view
 * writes an audit_logs row FIRST; if that write fails the bytes are not served (fail closed). Nothing here calls a model.
 */
import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { decryptBytes, encryptBytes } from '@/lib/vault/crypto'
import { gorselMetaTemizle } from '@/lib/doktor/fotoArsiv/metaTemizle'
import { genitalEstetikBransi } from '@/lib/doktor/genitalEstetikBrans'
import {
  GE_FOTO_GORUNUMLERI, GE_FOTO_KURALLARI, beyazlatmaDogrula, enerjiSeansiDogrula, enjeksiyonDogrula, fotoOnamiDogrula, fotoOnamiGecerli,
  geGunMu, geKapi, geTamYas, lotAnahtari, olcekKaydiDogrula, type FotoOnami, type GeIslemTuru,
} from '@/lib/clinical/genitalEstetik'

export const T_KAYIT = 'genital_estetik_kayitlari'
export const T_FOTO = 'genital_estetik_fotolar'
export const GE_KAYIT_TURLERI = ['enerji', 'enjeksiyon', 'beyazlatma', 'olcek', 'foto_onam'] as const
export type GeKayitTuru = (typeof GE_KAYIT_TURLERI)[number]
export const LISTE_AZAMI = 300
export const FOTO_LISTE_AZAMI = 200

/** THE one branch decision (lib/doktor/genitalEstetikBrans.ts): obstetrics and gynaecology only. */
export { genitalEstetikBransi }

export async function doktorBransi(sb: SupabaseClient, doktorId: string): Promise<string | null> {
  const { data } = await sb.from('users').select('specialty').eq('id', doktorId).maybeSingle()
  return data?.specialty ? String(data.specialty) : null
}

/** The patient's birth date (YYYY-MM-DD) read WITH doctor_id; null = not recorded or not readable. */
export async function hastaDogumTarihi(sb: SupabaseClient, doktorId: string, patientId: string): Promise<string | null> {
  const { data } = await sb.from('patients').select('dob_encrypted').eq('id', patientId).eq('doctor_id', doktorId).maybeSingle()
  try { const d = data?.dob_encrypted ? decrypt(String(data.dob_encrypted)).slice(0, 10) : ''; return geGunMu(d) ? d : null } catch { return null }
}

const bugunTr = (): string => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10)

export type GeKayit = { id: string; tur: GeKayitTuru; tarih: string; endikasyon: string | null; urunAdi: string | null; lot: string | null; sonrakiTarih: string | null; veri: Record<string, unknown>; created_at: string }
type Satir = { id: string; tur: GeKayitTuru; islem_tarihi: string; endikasyon: string | null; urun_adi: string | null; lot_no: string | null; sonraki_tarih: string | null; veri_encrypted: string; created_at: string }
const KOLONLAR = 'id, tur, islem_tarihi, endikasyon, urun_adi, lot_no, sonraki_tarih, veri_encrypted, created_at'
const coz = (r: Satir): GeKayit => {
  let veri: Record<string, unknown> = {}
  try { veri = JSON.parse(decrypt(r.veri_encrypted)) } catch { veri = {} }
  return { id: r.id, tur: r.tur, tarih: r.islem_tarihi, endikasyon: r.endikasyon, urunAdi: r.urun_adi, lot: r.lot_no, sonrakiTarih: r.sonraki_tarih, veri, created_at: r.created_at }
}

/** The patient's records, newest first (bounded). null = not this doctor's patient. */
export async function kayitlariListele(sb: SupabaseClient, doktorId: string, patientId: string): Promise<GeKayit[] | null> {
  if (!(await hastaSahibiMi(sb, doktorId, patientId))) return null
  const { data, error } = await sb.from(T_KAYIT).select(KOLONLAR).eq('doctor_id', doktorId).eq('patient_id', patientId).order('islem_tarihi', { ascending: false }).limit(LISTE_AZAMI)
  if (error) throw new Error('Kayıtlar okunamadı')
  return ((data || []) as Satir[]).map(coz)
}

export type KayitSonucu = { ok: true; kayit: GeKayit } | { ok: false; status: 400 | 404 | 422; hata: string; alan?: string }

/** Validates (engine), checks the gate (cosmetic: 18+, birth date known), encrypts and writes ONE record. */
export async function kayitEkle(sb: SupabaseClient, doktorId: string, patientId: string, tur: unknown, ham: unknown): Promise<KayitSonucu> {
  if (!(GE_KAYIT_TURLERI as readonly unknown[]).includes(tur)) return { ok: false, status: 400, hata: 'tur_yok' }
  if (!(await hastaSahibiMi(sb, doktorId, patientId))) return { ok: false, status: 404, hata: 'hasta_yok' }
  const t = tur as GeKayitTuru
  let veri: Record<string, unknown>, tarih: string, endikasyon: string | null = null, urunAdi: string | null = null, lot: string | null = null, sonraki: string | null = null
  if (t === 'enerji' || t === 'enjeksiyon' || t === 'beyazlatma') {
    const d = t === 'enerji' ? enerjiSeansiDogrula(ham) : t === 'enjeksiyon' ? enjeksiyonDogrula(ham) : beyazlatmaDogrula(ham)
    if (!d.ok) return { ok: false, status: 400, hata: d.hata, alan: d.alan }
    const v = d.veri as unknown as Record<string, unknown>
    const kapi = geKapi({
      dogumTarihi: await hastaDogumTarihi(sb, doktorId, patientId), gun: String(v.tarih), endikasyon: v.endikasyon,
      medikalGerekce: v.medikalGerekce, medikalAciklama: v.medikalAciklama, tur: t as GeIslemTuru,
      alt: { urun: v.urun as string | undefined, bolge: v.bolge as string | undefined, yontem: v.yontem as string | undefined },
    })
    if (!kapi.izin) return { ok: false, status: 422, hata: kapi.neden, alan: 'endikasyon' }
    veri = v; tarih = String(v.tarih); endikasyon = kapi.endikasyon
    if (t === 'enjeksiyon') { urunAdi = String(v.urunAdi); lot = String(v.lot); sonraki = String(v.kontrolTarihi) }
    if (t === 'enerji') sonraki = (v.sonrakiTarih as string | null) ?? null
    if (t === 'beyazlatma') sonraki = (v.kontrolTarihi as string | null) ?? null
  } else if (t === 'olcek') {
    const d = olcekKaydiDogrula(ham)
    if (!d.ok) return { ok: false, status: 400, hata: d.hata, alan: d.alan }
    veri = d.veri as unknown as Record<string, unknown>; tarih = d.veri.tarih
  } else {
    const d = fotoOnamiDogrula(ham)
    if (!d.ok) return { ok: false, status: 400, hata: d.hata, alan: d.alan }
    veri = d.veri as unknown as Record<string, unknown>; tarih = d.veri.tarih
  }
  const simdi = new Date().toISOString()
  const { data, error } = await sb.from(T_KAYIT).insert({
    doctor_id: doktorId, patient_id: patientId, tur: t, islem_tarihi: tarih, endikasyon, urun_adi: urunAdi, lot_no: lot, sonraki_tarih: sonraki,
    veri_encrypted: encrypt(JSON.stringify(veri)), created_at: simdi, updated_at: simdi,
  }).select(KOLONLAR).single()
  if (error || !data) throw new Error('Kaydedilemedi')
  return { ok: true, kayit: coz(data as Satir) }
}

/** PRODUCT RECALL: every injection of THIS doctor with this lot number (any of their patients), with the patient's name. */
export async function lotAra(sb: SupabaseClient, doktorId: string, lotHam: string): Promise<{ patientId: string; hastaAd: string; tarih: string; urunAdi: string | null; lot: string }[]> {
  const lot = lotAnahtari(lotHam)
  if (!/^[A-Z0-9][A-Z0-9\-/.]{1,39}$/.test(lot)) return []
  const { data } = await sb.from(T_KAYIT).select('patient_id, islem_tarihi, urun_adi, lot_no').eq('doctor_id', doktorId).eq('tur', 'enjeksiyon').eq('lot_no', lot).order('islem_tarihi', { ascending: false }).limit(LISTE_AZAMI)
  const satirlar = (data || []) as { patient_id: string; islem_tarihi: string; urun_adi: string | null; lot_no: string }[]
  if (!satirlar.length) return []
  const idler = [...new Set(satirlar.map((s) => s.patient_id))]
  const { data: hastalar } = await sb.from('patients').select('id, name_encrypted').eq('doctor_id', doktorId).in('id', idler)
  const ad = new Map<string, string>()
  for (const h of (hastalar || []) as { id: string; name_encrypted: string }[]) {
    try { const n = JSON.parse(decrypt(h.name_encrypted)); ad.set(h.id, [n.ad, n.soyad].filter(Boolean).join(' ')) } catch { ad.set(h.id, '') }
  }
  // a row whose patient is not (or no longer) the doctor's own is never shown
  return satirlar.filter((s) => ad.has(s.patient_id)).map((s) => ({ patientId: s.patient_id, hastaAd: ad.get(s.patient_id) || '—', tarih: s.islem_tarihi, urunAdi: s.urun_adi, lot: s.lot_no }))
}

/** The photo consents among the records (newest first). */
export const fotoOnamlari = (kayitlar: readonly GeKayit[]): FotoOnami[] => kayitlar.filter((k) => k.tur === 'foto_onam').map((k) => k.veri as unknown as FotoOnami)

// ───────────────────────── intimate photos ─────────────────────────

export type GeFotoMeta = { id: string; gorunum: string; cekimTarihi: string; boyut: number; mime: string; created_at: string }
const FOTO_META = 'id, gorunum, cekim_tarihi, boyut, mime, created_at'

/** Metadata only — never bytes, never a thumbnail. null = not this doctor's patient. */
export async function fotoListesi(sb: SupabaseClient, doktorId: string, patientId: string): Promise<GeFotoMeta[] | null> {
  if (!(await hastaSahibiMi(sb, doktorId, patientId))) return null
  const { data } = await sb.from(T_FOTO).select(FOTO_META).eq('doctor_id', doktorId).eq('patient_id', patientId).order('cekim_tarihi', { ascending: false }).limit(FOTO_LISTE_AZAMI)
  return ((data || []) as { id: string; gorunum: string; cekim_tarihi: string; boyut: number; mime: string; created_at: string }[]).map((r) => ({ id: r.id, gorunum: r.gorunum, cekimTarihi: r.cekim_tarihi, boyut: r.boyut, mime: r.mime, created_at: r.created_at }))
}

export type FotoYukleSonucu = { ok: true; foto: GeFotoMeta } | { ok: false; status: 400 | 404 | 422; hata: string }

/** Upload: a SEPARATE valid photo consent is required; JPEG/PNG only, at most 3 MB; metadata stripped; encrypted. */
export async function fotoYukle(sb: SupabaseClient, doktorId: string, patientId: string, g: { gorunum: unknown; cekimTarihi: unknown; gorsel: unknown }): Promise<FotoYukleSonucu> {
  if (!(await hastaSahibiMi(sb, doktorId, patientId))) return { ok: false, status: 404, hata: 'hasta_yok' }
  if (!(GE_FOTO_GORUNUMLERI as readonly unknown[]).includes(g.gorunum)) return { ok: false, status: 400, hata: 'gorunum_yok' }
  const gun = geGunMu(g.cekimTarihi) ? g.cekimTarihi : bugunTr()
  const kayitlar = (await kayitlariListele(sb, doktorId, patientId)) || []
  if (!fotoOnamiGecerli(fotoOnamlari(kayitlar), gun)) return { ok: false, status: 422, hata: 'foto_onam_yok' }
  if (typeof g.gorsel !== 'string' || !g.gorsel) return { ok: false, status: 400, hata: 'foto_gecersiz' }
  const b64 = g.gorsel.replace(/^data:[^;,]+;base64,/, '')
  if (b64.length > Math.ceil((GE_FOTO_KURALLARI.azamiBayt * 4) / 3) + 8) return { ok: false, status: 400, hata: 'foto_gecersiz' }
  let ham: Buffer
  try { ham = Buffer.from(b64, 'base64') } catch { return { ok: false, status: 400, hata: 'foto_gecersiz' } }
  const temiz = ham.length ? gorselMetaTemizle(ham) : null
  if (!temiz || !GE_FOTO_KURALLARI.mime.includes(temiz.mime) || temiz.bytes.length > GE_FOTO_KURALLARI.azamiBayt) return { ok: false, status: 400, hata: 'foto_gecersiz' }
  const { data, error } = await sb.from(T_FOTO).insert({
    doctor_id: doktorId, patient_id: patientId, gorunum: g.gorunum, cekim_tarihi: gun, mime: temiz.mime, boyut: temiz.bytes.length,
    sha256: createHash('sha256').update(temiz.bytes).digest('hex'), veri_encrypted: encryptBytes(temiz.bytes).toString('base64'), created_at: new Date().toISOString(),
  }).select(FOTO_META).single()
  if (error || !data) throw new Error('Fotoğraf kaydedilemedi')
  const r = data as { id: string; gorunum: string; cekim_tarihi: string; boyut: number; mime: string; created_at: string }
  return { ok: true, foto: { id: r.id, gorunum: r.gorunum, cekimTarihi: r.cekim_tarihi, boyut: r.boyut, mime: r.mime, created_at: r.created_at } }
}

/**
 * ONE VIEW of one photo: the photo is read with doctor_id AND patient_id (a foreign id = null); the audit row is written
 * BEFORE the bytes are decrypted; a failed audit write serves nothing.
 */
export async function fotoGoruntule(sb: SupabaseClient, doktorId: string, patientId: string, fotoId: string, kullaniciId: string, ip?: string | null): Promise<{ bytes: Buffer; mime: string } | null | 'denetim_yazilamadi'> {
  if (!(await hastaSahibiMi(sb, doktorId, patientId))) return null
  const { data } = await sb.from(T_FOTO).select('id, gorunum, mime, veri_encrypted').eq('id', fotoId).eq('doctor_id', doktorId).eq('patient_id', patientId).maybeSingle()
  if (!data) return null
  const r = data as { id: string; gorunum: string; mime: string; veri_encrypted: string }
  const { error } = await sb.from('audit_logs').insert({
    user_id: kullaniciId, action: 'view', resource_type: 'genital_estetik_foto', resource_id: r.id,
    new_values: { patient_id: patientId, doktor_id: doktorId, gorunum: r.gorunum, olay: 'goruntule' }, ip_address: ip || null, success: true,
  })
  if (error) return 'denetim_yazilamadi'
  try { return { bytes: decryptBytes(Buffer.from(r.veri_encrypted, 'base64')), mime: r.mime } } catch { return null }
}

/** The age on the day (for the screen's lock); null = birth date not recorded. */
export const yasBugun = (dogum: string | null): number | null => geTamYas(dogum, bugunTr())
