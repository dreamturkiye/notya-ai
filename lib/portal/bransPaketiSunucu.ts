/**
 * BRANS-PAKETI — server data layer (patient + professional). Server only.
 *
 * hasta-izolasyon: every function takes a scope the caller already proved —
 *   patient side: `{ doktorId, patientId }` resolved from the PIN-unlocked portal token (portalKapsami),
 *   professional side: `doktorId` = session user AND `patientId` passed hastaSahibiMi before the call.
 * EVERY read and write below carries BOTH columns (doctor_id AND patient_id); a photo / entry id from the request is only
 * ever used together with that scope, so a foreign id matches no row. Storage paths are built from the scope, never
 * taken from the request.
 * Branş gate (brans-alan-sizmasi): a module code is accepted only when it belongs to the token doctor's own Özel Branş
 * (modulBransaAitMi) AND is active for this patient (hastaPaketiCoz).
 * KVKK: the professional sees diary entries only after the patient's sharing consent (ev_tercihler.paylasim_onayi);
 * photos carry their own per-upload consent. acil copy (112) is always shown to the patient immediately.
 * Performance: the module page loads with ONE batch of parallel reads (no per-item round trips); this route is NOT on
 * the Sağlığım bundle hot path — it is fetched only when a package page is opened.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { decrypt } from '@/lib/security/encryption'
import { hekimBransi } from '@/lib/doktor/hekimAdi'
import { arsivsizIlaclar } from '@/lib/doktor/arsiv'
import { gorselTuruKoklayarak, metaVeriTemizle, MARKA_UZANTI } from '@/lib/portal/markaGorsel'
import { notIcdKodlari, aktifIlacAdlari } from '@/lib/saglikEvi/ilacSinifi'
import { notIcdSorgusu } from '@/lib/saglikEvi/sunucu'
import { kronikListe, notAlanlariCoz } from '@/lib/doktor/hastaKayitAlanlari'
import { hekimeBildir, varsayilanHekimGonderici } from '@/lib/saglikEvi/hekimBildirim'
import { arkaPlanda } from '@/lib/kurucu/denemeBildirimi'
import {
  BRANS_PAKETLERI, ayarTemizle, hastaPaketiCoz, kayitDegerlendir, kayitTemizle,
  modulBransaAitMi, paketBransi, paketModulu, sablonDuzenlemesiTemizle,
  type CozulmusModul, type HastaAyarKaydi, type PaketIcerik, type SablonKaydi,
} from './bransPaketi'
import { scoffDegerlendir, TARAMA_HASTA_METNI, TARAMA_TESEKKUR } from '@/specialties/diyetisyen/engines/tarama'
import { hastaYukuKur, type HastaPaketi, type Yuk } from './bransPaketiYuk'
export type { HastaPaketi, HastaPaketModulu } from './bransPaketiYuk'
import { planCoz } from '@/specialties/diyetisyen/engines/plan'
import { levotiroksinGunPlani, ilacBesinNotlari } from '@/specialties/diyetisyen/engines/ilacBesin'
import { degerlerim } from '@/specialties/longevity/engines/degerlerim'

type Sb = SupabaseClient
export interface Kapsam { doktorId: string; patientId: string }

export const PAKET_FOTO_KOVA = 'brans-paket-foto'
export const PAKET_FOTO_AZAMI_BAYT = 5 * 1024 * 1024
export const PAKET_FOTO_GUNLUK_SINIR = 30
export const PAKET_KAYIT_GUNLUK_SINIR = 120
const GUN_MS = 86_400_000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Istanbul calendar day (the product's day boundary). */
export function trBugun(simdi = Date.now()): string {
  return new Date(simdi + 3 * 3600_000).toISOString().slice(0, 10)
}

const coz = (v: unknown) => { try { return v ? decrypt(String(v)) : null } catch { return null } }
function yasYil(dobEnc: unknown, simdi: number): number | null {
  const iso = coz(dobEnc)
  const d = iso ? Date.parse(iso) : NaN
  return Number.isFinite(d) ? (simdi - d) / (365.25 * GUN_MS) : null
}

// ─── loading ────────────────────────────────────────────────────────────────────────────────────────────────────────

/** One batch of parallel reads, all scoped by doctor_id AND patient_id (sablon: doctor only — no patient data). */
async function yukle(sb: Sb, k: Kapsam, simdi: number, o: { kayitGun?: number; lab?: boolean } = {}): Promise<Yuk> {
  const doktorBransi = await hekimBransi(sb, k.doktorId)
  const brans = paketBransi(doktorBransi)
  const bos: Yuk = { brans, cozum: { brans, moduller: [], hazirlaniyor: [] }, sablonlar: {}, hastaAyar: {}, kayitlar: [], fotolar: [], paylasimOnayi: false, lab: [], ilaclar: [] }
  if (!brans) return bos
  const durumVar = BRANS_PAKETLERI[brans].some((m) => !!m.durum)
  const labGerek = o.lab !== false && BRANS_PAKETLERI[brans].some((m) => m.tur === 'biyobelirtec')
  const bugun = trBugun(simdi)
  const kayitBas = new Date(simdi - (o.kayitGun ?? 60) * GUN_MS).toISOString().slice(0, 10)
  const bos_ = Promise.resolve({ data: [] as any[] })
  const [sablonR, ayarR, kayitR, fotoR, hastaR, tercihR, notR, ilacR, planR, labR] = await Promise.all([
    sb.from('brans_paket_sablon').select('modul, icerik, kabul_at').eq('doctor_id', k.doktorId).eq('brans', brans),
    sb.from('brans_paket_hasta').select('modul, acik, baslangic, ayar').eq('doctor_id', k.doktorId).eq('patient_id', k.patientId),
    sb.from('brans_paket_kayit').select('id, modul, gun, veri, seviye, created_at').eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).gte('gun', kayitBas).order('created_at', { ascending: false }).limit(400),
    sb.from('brans_paket_foto').select('id, modul, etiket, uzman_yorum, yorum_at, created_at').eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).order('created_at', { ascending: false }).limit(120),
    sb.from('patients').select('dob_encrypted, notes_encrypted').eq('id', k.patientId).eq('doctor_id', k.doktorId).maybeSingle(),
    sb.from('ev_tercihler').select('paylasim_onayi').eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).maybeSingle(),
    durumVar ? notIcdSorgusu(sb, k.doktorId, k.patientId).then((r) => r, () => ({ data: [] })) : bos_,
    durumVar ? arsivsizIlaclar(sb, 'ilac_adi, aktif, bitis_tarihi').eq('patient_id', k.patientId).eq('doctor_id', k.doktorId).eq('onay_durumu', 'onayli').eq('aktif', true).limit(60).then((r) => r, () => ({ data: [] })) : bos_,
    durumVar ? sb.from('ozel_brans_plan').select('girdi').eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).limit(20).then((r) => r, () => ({ data: [] })) : bos_,
    labGerek ? sb.from('lab_satirlar').select('canonical_key, raw_name, value_num, unit, numune_tarihi').eq('patient_id', k.patientId).eq('doctor_id', k.doktorId).eq('onayli', true).order('numune_tarihi', { ascending: false }).limit(500).then((r) => r, () => ({ data: [] })) : bos_,
  ])
  const sablonlar: Record<string, SablonKaydi> = {}
  for (const r of (sablonR.data || []) as Array<Record<string, any>>) sablonlar[String(r.modul)] = { icerik: (r.icerik || null) as PaketIcerik | null, kabulAt: r.kabul_at ? String(r.kabul_at) : null }
  const hastaAyar: Record<string, HastaAyarKaydi> = {}
  for (const r of (ayarR.data || []) as Array<Record<string, any>>) hastaAyar[String(r.modul)] = { acik: r.acik === true ? true : r.acik === false ? false : null, baslangic: r.baslangic ? String(r.baslangic).slice(0, 10) : null, ayar: (r.ayar && typeof r.ayar === 'object' ? r.ayar : {}) as Record<string, unknown> }
  const hasta = (hastaR as { data?: Record<string, any> | null }).data || null
  const ilaclar = aktifIlacAdlari(((ilacR as { data?: unknown[] }).data || []) as Array<Record<string, any>>, bugun)
  const hekimTanilari = (((planR as { data?: unknown[] }).data || []) as Array<Record<string, any>>).map((p) => (p.girdi && typeof p.girdi === 'object' ? String(p.girdi.tani || p.girdi.hekimTani || '') : '')).filter(Boolean)
  const tanilar = durumVar ? [...kronikListe(notAlanlariCoz(hasta?.notes_encrypted ?? null)), ...hekimTanilari] : []
  const cozum = hastaPaketiCoz({
    doktorBransi, sablonlar, hastaAyar, tanilar,
    icdKodlari: durumVar ? notIcdKodlari(((notR as { data?: unknown[] }).data || []) as Array<Record<string, unknown>>) : [],
    ilaclar, hastaYasYil: yasYil(hasta?.dob_encrypted, simdi),
  })
  return {
    brans, cozum, sablonlar, hastaAyar,
    kayitlar: (kayitR.data || []) as Array<Record<string, any>>,
    fotolar: (fotoR.data || []) as Array<Record<string, any>>,
    paylasimOnayi: !!(tercihR as { data?: Record<string, any> | null }).data?.paylasim_onayi,
    lab: labGerek ? degerlerim(((labR as { data?: unknown[] }).data || []) as Array<Record<string, any>>) : [],
    ilaclar,
  }
}

export async function hastaPaketiOku(sb: Sb, k: Kapsam, simdi = Date.now()): Promise<HastaPaketi> {
  const y = await yukle(sb, k, simdi)
  return hastaYukuKur(y, trBugun(simdi))
}

// ─── patient writes ─────────────────────────────────────────────────────────────────────────────────────────────────

type Sonuc = { ok: true; [k: string]: unknown } | { ok: false; status: number; hata: string }

async function aktifModul(sb: Sb, k: Kapsam, kod: string, simdi: number): Promise<{ y: Yuk; m: CozulmusModul } | null> {
  if (typeof kod !== 'string' || !paketModulu(kod)) return null
  const y = await yukle(sb, k, simdi, { kayitGun: 120, lab: false })
  const m = y.cozum.moduller.find((x) => x.tanim.kod === kod)
  return m ? { y, m } : null
}

async function uyariYaz(sb: Sb, k: Kapsam, m: CozulmusModul, duzey: 'acil' | 'hekime_bildir' | 'dikkat', kural: string, hastaMetni: string, hekimMetni: string, kayitId: string, simdi: number) {
  const { data } = await sb.from('ev_uyarilar').insert({
    doctor_id: k.doktorId, patient_id: k.patientId, kural, anahtar: `${kural}:${trBugun(simdi)}`, duzey, metrik: m.tanim.kod,
    hasta_metni: hastaMetni, hekim_metni: hekimMetni, veri: { kayitId, modul: m.tanim.kod }, olusturma_at: new Date(simdi).toISOString(),
  }).select('id, doctor_id, patient_id, duzey, kural')
  const gonder = varsayilanHekimGonderici()
  const satirlar = (data || []) as Array<Record<string, any>>
  if (gonder && satirlar.length && duzey !== 'dikkat') {
    arkaPlanda(() => hekimeBildir(sb, gonder, satirlar.map((u) => ({ id: String(u.id), doctor_id: String(u.doctor_id), patient_id: String(u.patient_id), duzey: String(u.duzey), kural: u.kural ?? null })), simdi), 'brans-paketi-push')
  }
}

/**
 * A patient entry: diary fields, a checklist / programme tick ({ madde }), or the screening answers ({ cevaplar }).
 * Returns the patient-facing reaction (highest red flag's patient text, or the same thank-you for every screen).
 */
export async function kayitEkle(sb: Sb, k: Kapsam, govde: unknown, simdi = Date.now()): Promise<Sonuc> {
  const g = (govde && typeof govde === 'object' ? govde : {}) as Record<string, unknown>
  const am = await aktifModul(sb, k, String(g.modul || ''), simdi)
  if (!am) return { ok: false, status: 404, hata: 'Bu bölüm sizin takibinizde açık değil.' }
  const { m } = am
  const bugun = trBugun(simdi)
  const { count } = await sb.from('brans_paket_kayit').select('id', { count: 'exact', head: true }).eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).eq('gun', bugun)
  if ((count || 0) >= PAKET_KAYIT_GUNLUK_SINIR) return { ok: false, status: 429, hata: 'Bugün için kayıt sınırına ulaşıldı.' }

  let veri: Record<string, unknown>
  let seviye: 'acil' | 'hekime_bildir' | 'dikkat' | null = null
  let tepki: { duzey: string | null; metin: string } = { duzey: null, metin: 'Kaydedildi.' }
  let uyari: { kural: string; hasta: string; hekim: string } | null = null

  if (m.tanim.tur === 'tarama') {
    const d = scoffDegerlendir(Array.isArray(g.cevaplar) ? g.cevaplar : [])
    if (!d) return { ok: false, status: 400, hata: 'Lütfen her soruya evet ya da hayır deyin.' }
    veri = { cevaplar: g.cevaplar, puan: d.puan, pozitif: d.pozitif }
    if (d.pozitif) { seviye = 'hekime_bildir'; uyari = { kural: `paket-tarama:${m.tanim.kod}`, hasta: TARAMA_HASTA_METNI, hekim: `Yeme bozukluğu tarama sorularında pozitif yanıt (SCOFF ${d.puan}/5). Tanı değildir; görüşmede değerlendirin.` } }
    tepki = { duzey: null, metin: TARAMA_TESEKKUR }
  } else if (m.tanim.tur === 'liste' || m.tanim.tur === 'program') {
    const madde = Number(g.madde)
    if (m.tanim.tur === 'liste' && !m.tanim.isaretlenir) return { ok: false, status: 400, hata: 'Bu liste işaretlenmez.' }
    const ayarSatir = Array.isArray(m.ayar.satirlar) ? (m.ayar.satirlar as unknown[]).map(String) : []
    const icerikMadde = m.icerik.maddeler || []
    // programme: the professional's lines replace the template; tickable checklist: template + the patient's extra lines
    const liste = m.tanim.tur === 'program' ? (ayarSatir.length ? ayarSatir : icerikMadde) : [...icerikMadde, ...ayarSatir]
    if (!Number.isInteger(madde) || madde < 0 || madde >= liste.length) return { ok: false, status: 400, hata: 'Madde bulunamadı.' }
    veri = { madde, tamam: g.tamam !== false }
  } else if (m.tanim.tur === 'gunluk' || m.tanim.tur === 'ilac-saati' || (m.tanim.tur === 'hatirlatma' && (m.icerik.alanlar || []).length)) {
    const t = kayitTemizle(m.icerik, g.veri, m.ayar)
    if (!t.ok) return { ok: false, status: 400, hata: t.hata }
    veri = t.veri
    const b = kayitDegerlendir(m.icerik, veri)[0]
    if (b) { seviye = b.duzey; tepki = { duzey: b.duzey, metin: b.bayrak.hasta }; uyari = { kural: `paket:${m.tanim.kod}:${b.bayrak.id}`, hasta: b.bayrak.hasta, hekim: b.bayrak.hekim } }
    if (m.tanim.tur === 'ilac-saati' && typeof veri.saat === 'string') tepki = { duzey: tepki.duzey, metin: tepki.duzey ? tepki.metin : 'Kaydedildi.', ...{ gunPlani: levotiroksinGunPlani(veri.saat) } } as typeof tepki
  } else {
    return { ok: false, status: 400, hata: 'Bu bölüme kayıt girilmez.' }
  }

  const { data: ek, error } = await sb.from('brans_paket_kayit').insert({ doctor_id: k.doktorId, patient_id: k.patientId, modul: m.tanim.kod, gun: bugun, veri, seviye, created_at: new Date(simdi).toISOString() }).select('id').maybeSingle()
  if (error || !ek) return { ok: false, status: 503, hata: 'Kayıt yazılamadı.' }
  if (uyari && seviye) await uyariYaz(sb, k, m, seviye, uyari.kural, uyari.hasta, uyari.hekim, String((ek as Record<string, any>).id), simdi).catch(() => undefined)
  return { ok: true, id: String((ek as Record<string, any>).id), tepki }
}

export async function fotoEkle(sb: Sb, k: Kapsam, o: { modul: string; etiket: string | null; riza: boolean; bayt: Buffer }, simdi = Date.now()): Promise<Sonuc> {
  const am = await aktifModul(sb, k, o.modul, simdi)
  if (!am || (am.m.tanim.tur !== 'foto' && am.m.tanim.tur !== 'tabak')) return { ok: false, status: 404, hata: 'Bu bölüm sizin takibinizde açık değil.' }
  if (!o.riza) return { ok: false, status: 400, hata: 'Fotoğraf için paylaşım onayınız gerekir.' }
  if (!o.bayt.length || o.bayt.length > PAKET_FOTO_AZAMI_BAYT) return { ok: false, status: 400, hata: 'Fotoğraf en fazla 5 MB olabilir.' }
  const mime = gorselTuruKoklayarak(o.bayt)
  if (!mime) return { ok: false, status: 400, hata: 'Yalnızca JPG, PNG veya WebP fotoğraf yükleyebilirsiniz.' }
  const gunBasi = new Date(Date.parse(`${trBugun(simdi)}T00:00:00+03:00`)).toISOString()
  const { count } = await sb.from('brans_paket_foto').select('id', { count: 'exact', head: true }).eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).gte('created_at', gunBasi)
  if ((count || 0) >= PAKET_FOTO_GUNLUK_SINIR) return { ok: false, status: 429, hata: 'Bugün için fotoğraf sınırına ulaşıldı.' }
  let temiz: Buffer
  try { temiz = metaVeriTemizle(o.bayt, mime) } catch { return { ok: false, status: 400, hata: 'Fotoğraf okunamadı.' } }
  const etiket = o.etiket ? o.etiket.trim().slice(0, 80) || null : null
  if (etiket && am.m.icerik.acilar?.length && am.m.tanim.tur === 'foto' && !am.m.icerik.acilar.includes(etiket) && am.m.tanim.kod !== 'derm-foto') return { ok: false, status: 400, hata: 'Açı bulunamadı.' }
  const yol = `${k.doktorId}/${k.patientId}/${randomUUID()}.${MARKA_UZANTI[mime]}`
  const yuk = await sb.storage.from(PAKET_FOTO_KOVA).upload(yol, temiz, { contentType: mime, upsert: false })
  if (yuk.error) return { ok: false, status: 503, hata: 'Fotoğraf yüklenemedi.' }
  const { data, error } = await sb.from('brans_paket_foto').insert({ doctor_id: k.doktorId, patient_id: k.patientId, modul: am.m.tanim.kod, etiket, yol, mime, created_at: new Date(simdi).toISOString() }).select('id').maybeSingle()
  if (error || !data) { await sb.storage.from(PAKET_FOTO_KOVA).remove([yol]); return { ok: false, status: 503, hata: 'Fotoğraf kaydedilemedi.' } }
  return { ok: true, id: String((data as Record<string, any>).id) }
}

/** Photo bytes for its own patient (portal) or its own doctor (professional) — the scope decides, never the id alone. */
export async function fotoOku(sb: Sb, k: Kapsam, id: string): Promise<{ bayt: Uint8Array; mime: string } | null> {
  if (!UUID.test(String(id || ''))) return null
  const { data } = await sb.from('brans_paket_foto').select('yol, mime').eq('id', id).eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).maybeSingle()
  const r = data as Record<string, any> | null
  if (!r?.yol || !String(r.yol).startsWith(`${k.doktorId}/${k.patientId}/`)) return null
  const d = await sb.storage.from(PAKET_FOTO_KOVA).download(String(r.yol))
  if (d.error || !d.data) return null
  const v = d.data as unknown
  const bayt = v instanceof Uint8Array ? v : typeof (v as Blob).arrayBuffer === 'function' ? new Uint8Array(await (v as Blob).arrayBuffer()) : Buffer.isBuffer(v) ? new Uint8Array(v as Buffer) : new Uint8Array(Buffer.from(String(v)))
  return { bayt, mime: String(r.mime || 'image/jpeg') }
}

/** The patient deletes his own photo: object first, then the row (both scoped). */
export async function fotoSil(sb: Sb, k: Kapsam, id: string): Promise<Sonuc> {
  if (!UUID.test(String(id || ''))) return { ok: false, status: 404, hata: 'Fotoğraf bulunamadı.' }
  const { data } = await sb.from('brans_paket_foto').select('id, yol').eq('id', id).eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).maybeSingle()
  const r = data as Record<string, any> | null
  if (!r?.yol || !String(r.yol).startsWith(`${k.doktorId}/${k.patientId}/`)) return { ok: false, status: 404, hata: 'Fotoğraf bulunamadı.' }
  await sb.storage.from(PAKET_FOTO_KOVA).remove([String(r.yol)])
  await sb.from('brans_paket_foto').delete().eq('id', id).eq('doctor_id', k.doktorId).eq('patient_id', k.patientId)
  return { ok: true }
}

// ─── professional side ──────────────────────────────────────────────────────────────────────────────────────────────

/** Templates of the professional's own branş with their acceptance state. No patient data. */
export async function sablonListesi(sb: Sb, doktorId: string): Promise<{ brans: string | null; moduller: Array<{ kod: string; tur: string; baslik: string; aciklama: string; varsayilan: PaketIcerik; icerik: PaketIcerik | null; kabulAt: string | null; duzenlendi: boolean; kaynaklar: string[]; yas: string | null; baslangicEtiketi: string | null; ayarlar: unknown[] }> }> {
  const brans = paketBransi(await hekimBransi(sb, doktorId))
  if (!brans) return { brans: null, moduller: [] }
  const { data } = await sb.from('brans_paket_sablon').select('modul, icerik, kabul_at, duzenlendi').eq('doctor_id', doktorId).eq('brans', brans)
  const satir = new Map(((data || []) as Array<Record<string, any>>).map((r) => [String(r.modul), r]))
  return {
    brans,
    moduller: BRANS_PAKETLERI[brans].map((t) => {
      const r = satir.get(t.kod)
      return { kod: t.kod, tur: t.tur, baslik: t.baslik, aciklama: t.aciklama, varsayilan: t.varsayilan, icerik: (r?.icerik as PaketIcerik) ?? null, kabulAt: r?.kabul_at ? String(r.kabul_at) : null, duzenlendi: !!r?.duzenlendi, kaynaklar: t.kaynaklar, yas: t.yas ?? null, baslangicEtiketi: t.baslangicEtiketi ?? null, ayarlar: t.ayarlar || [] }
    }),
  }
}

/** Accept (and optionally edit) a template — records the timestamp and appends to the acceptance history. */
export async function sablonKabul(sb: Sb, doktorId: string, govde: unknown, simdi = Date.now()): Promise<Sonuc> {
  const g = (govde && typeof govde === 'object' ? govde : {}) as Record<string, unknown>
  const kod = String(g.modul || '')
  const doktorBransi = await hekimBransi(sb, doktorId)
  if (!modulBransaAitMi(kod, doktorBransi)) return { ok: false, status: 404, hata: 'Bu modül sizin branşınızda yok.' }
  const t = paketModulu(kod)!
  const temiz = sablonDuzenlemesiTemizle(t, g.icerik ?? {})
  if (!temiz.ok) return { ok: false, status: 400, hata: temiz.hata }
  const { data: eski } = await sb.from('brans_paket_sablon').select('kabul_gecmisi').eq('doctor_id', doktorId).eq('modul', kod).maybeSingle()
  const at = new Date(simdi).toISOString()
  const gecmis = [...(Array.isArray((eski as Record<string, any> | null)?.kabul_gecmisi) ? (eski as Record<string, any>).kabul_gecmisi : []), { at, duzenlendi: temiz.duzenlendi }].slice(-50)
  const { error } = await sb.from('brans_paket_sablon').upsert({ doctor_id: doktorId, brans: t.brans, modul: kod, icerik: temiz.icerik, kabul_at: at, duzenlendi: temiz.duzenlendi, kabul_gecmisi: gecmis, updated_at: at }, { onConflict: 'doctor_id,modul' })
  if (error) return { ok: false, status: 503, hata: 'Şablon kaydedilemedi.' }
  return { ok: true, kabulAt: at, duzenlendi: temiz.duzenlendi }
}

/** The professional's view of one patient (caller proved hastaSahibiMi). Diary entries need the patient's consent. */
export async function hekimHastaPaketi(sb: Sb, k: Kapsam, simdi = Date.now()) {
  const y = await yukle(sb, k, simdi, { kayitGun: 120 })
  const bugun = trBugun(simdi)
  const hasta = hastaYukuKur(y, bugun)
  const tumModuller = y.brans ? BRANS_PAKETLERI[y.brans].map((t) => {
    const aktif = y.cozum.moduller.find((m) => m.tanim.kod === t.kod)
    return {
      kod: t.kod, tur: t.tur, baslik: t.baslik, durumModulu: !!t.durum, varsayilanKapali: !!t.varsayilanKapali, yas: t.yas ?? null,
      aktif: !!aktif, neden: aktif?.neden ?? null, hazirlaniyor: y.cozum.hazirlaniyor.includes(t.kod), kabulAt: y.sablonlar[t.kod]?.kabulAt ?? null,
      acik: y.hastaAyar[t.kod]?.acik ?? null, baslangic: y.hastaAyar[t.kod]?.baslangic ?? null, ayar: y.hastaAyar[t.kod]?.ayar ?? {},
      ayarlar: t.ayarlar || [], baslangicEtiketi: t.baslangicEtiketi ?? null,
    }
  }) : []
  return {
    brans: y.brans,
    moduller: tumModuller,
    paylasimOnayi: y.paylasimOnayi,
    kayitlar: y.paylasimOnayi ? y.kayitlar.map((r) => ({ id: String(r.id), modul: String(r.modul), gun: String(r.gun).slice(0, 10), veri: r.veri || {}, seviye: r.seviye ?? null, at: String(r.created_at) })) : [],
    fotolar: y.fotolar.map((f) => ({ id: String(f.id), modul: String(f.modul), etiket: f.etiket ?? null, at: String(f.created_at), yorum: f.uzman_yorum ?? null, yorumAt: f.yorum_at ?? null })),
    plan: hasta.moduller.find((m) => m.tur === 'plan')?.ayar ?? null,
    lab: y.lab,
    ilacBesin: y.brans === 'diyetisyen' ? ilacBesinNotlari(y.ilaclar) : [],
  }
}

/** Per-patient switch / start date / settings for one module of the professional's own branş. */
export async function hastaAyarYaz(sb: Sb, k: Kapsam, govde: unknown, simdi = Date.now()): Promise<Sonuc> {
  const g = (govde && typeof govde === 'object' ? govde : {}) as Record<string, unknown>
  const kod = String(g.modul || '')
  if (!modulBransaAitMi(kod, await hekimBransi(sb, k.doktorId))) return { ok: false, status: 404, hata: 'Bu modül sizin branşınızda yok.' }
  const t = paketModulu(kod)!
  const acik = g.acik === true ? true : g.acik === false ? false : null
  const baslangic = typeof g.baslangic === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(g.baslangic) ? g.baslangic : null
  const a = ayarTemizle(t, g.ayar ?? {})
  if (!a.ok) return { ok: false, status: 400, hata: a.hata }
  if (typeof a.ayar.plan === 'string') {
    const p = planCoz(a.ayar.plan)
    if (p.hatali.length) return { ok: false, status: 400, hata: `Plan satırı okunamadı: "${p.hatali[0].slice(0, 80)}" — biçim: Gün | Öğün | yiyecekler (kcal yazılmaz).` }
  }
  const { error } = await sb.from('brans_paket_hasta').upsert({ doctor_id: k.doktorId, patient_id: k.patientId, modul: kod, acik, baslangic, ayar: a.ayar, updated_at: new Date(simdi).toISOString() }, { onConflict: 'doctor_id,patient_id,modul' })
  if (error) return { ok: false, status: 503, hata: 'Ayar kaydedilemedi.' }
  return { ok: true }
}

/** One comment per photo (Tabağım: portion and plate balance — never a calorie count). */
export async function fotoYorumYaz(sb: Sb, k: Kapsam, govde: unknown, simdi = Date.now()): Promise<Sonuc> {
  const g = (govde && typeof govde === 'object' ? govde : {}) as Record<string, unknown>
  const id = String(g.id || '')
  const yorum = String(g.yorum || '').trim().slice(0, 1000)
  if (!UUID.test(id)) return { ok: false, status: 404, hata: 'Fotoğraf bulunamadı.' }
  if (!yorum) return { ok: false, status: 400, hata: 'Yorum boş.' }
  if (/\d+\s*(kcal|kalori)/i.test(yorum)) return { ok: false, status: 400, hata: 'Tabak yorumuna kalori yazılmaz — porsiyon ve denge üzerine yazın.' }
  const { data } = await sb.from('brans_paket_foto').update({ uzman_yorum: yorum, yorum_at: new Date(simdi).toISOString() }).eq('id', id).eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).select('id')
  if (!(data || []).length) return { ok: false, status: 404, hata: 'Fotoğraf bulunamadı.' }
  return { ok: true }
}
