/**
 * FOTO-ARSIV-01 — server side of the patient photo archive: ownership, listing, metadata, thumbnails, batch edits.
 *
 * HASTA-IZOLASYON: ids that arrive from outside are patientId and belgeId (and belgeIds[] for batches). Every function
 * here proves, BEFORE reading or writing with them, that the patient is the authenticated practice's doctor's
 * (hastaSahibiMi) and that the document row is that doctor's, belongs to that patient, is not deleted and is an image
 * (getDocumentMeta + checks). Every query is also scoped by doctor_id. Anything else answers "not found" (the route
 * returns 404): a foreign id is indistinguishable from a missing one. Bytes are decrypted per request; no public URL.
 *
 * Tables from migration 174. While it is not applied the listing still works (it reads the vault), writes throw
 * TabloYokHatasi (routes answer 503) — nothing else in the app depends on these tables.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { downloadDocument, getDocumentMeta } from '@/lib/vault/service'
import { decryptBytes, encryptBytes } from '@/lib/vault/crypto'
import type { DocumentMeta } from '@/lib/vault/types'
import { rowToMeta } from '@/lib/vault/validation'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { tabloYokMu } from '@/lib/doktor/muayeneEk/saklama'
import { ekTuruMu } from '@/lib/doktor/muayeneEk/tipler'
import { ayarDegistiMi, bosOzel, ozelDogrula } from './duzenleme'
import { bosMeta, topluYamaya, yamayiUygula, type FotoMeta, type MetaYamasi, type TopluIstek } from './meta'
import type { FotoOge } from './zamanCizelgesi'

export class TabloYokHatasi extends Error {
  constructor() { super('Fotoğraf arşivi özellikleri henüz etkinleştirilmedi.'); this.name = 'TabloYokHatasi' }
}

const T_META = 'hasta_foto_meta'
const T_KUCUK = 'hasta_foto_kucuk'
const T_DEG = 'hasta_foto_degerlendirme'

export const FOTO_MIME: ReadonlySet<string> = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'])
/** Categories the vault gives to clinical photos (EK_TUR_KASA_KATEGORISI.foto and its siblings). */
const FOTO_KATEGORILERI = new Set(['muayene görüntüsü', 'klinik fotoğraf'])
export const ARSIV_AZAMI = 600
export const KUCUK_AZAMI_BAYT = 150 * 1024

const imageMi = (m: DocumentMeta) => FOTO_MIME.has(String(m.fileType || '').toLowerCase().split(';')[0].trim())

/**
 * The photo (vault document) of THIS patient of THIS doctor, or null. The patient is proved first; then the document row is
 * fetched by (id, doctor_id) and must belong to the same patient and be an image.
 */
export async function fotoBaglami(sb: SupabaseClient, doktorId: string, patientId: string, belgeId: string): Promise<DocumentMeta | null> {
  if (!patientId || !belgeId) return null
  if (!(await hastaSahibiMi(sb, doktorId, patientId))) return null
  let meta: DocumentMeta
  try { meta = await getDocumentMeta({ supabase: sb }, doktorId, belgeId) } catch { return null }
  if (meta.doctorId !== doktorId || meta.patientId !== patientId || !imageMi(meta)) return null
  return meta
}

// ─── Metadata (de)serialisation ──────────────────────────────────────────────────────────────────────────
function satirdanMeta(r: Record<string, unknown>): FotoMeta {
  let ozel = bosOzel()
  if (r.ozel_encrypted) {
    try { ozel = ozelDogrula(JSON.parse(decrypt(String(r.ozel_encrypted)))) } catch { ozel = bosOzel() }
  }
  const kaynak = r.bolge_kaynagi === 'hekim' || r.bolge_kaynagi === 'ayse' ? r.bolge_kaynagi : null
  return {
    belgeId: String(r.belge_id),
    bolge: typeof r.bolge === 'string' ? r.bolge : null,
    bolgeKaynagi: kaynak,
    favori: r.favori === true,
    yildiz: Math.min(5, Math.max(0, Number(r.yildiz) || 0)),
    anahtar: r.anahtar === true,
    cekimTarihi: typeof r.cekim_tarihi === 'string' ? r.cekim_tarihi.slice(0, 10) : null,
    gizli: r.gizli === true,
    ozel,
  }
}

function metadanAlanlar(m: FotoMeta): Record<string, unknown> {
  return {
    bolge: m.bolge, bolge_kaynagi: m.bolgeKaynagi, favori: m.favori, yildiz: m.yildiz, anahtar: m.anahtar,
    cekim_tarihi: m.cekimTarihi, gizli: m.gizli, ozel_encrypted: encrypt(JSON.stringify(m.ozel)),
    updated_at: new Date().toISOString(),
  }
}

async function metaOku(sb: SupabaseClient, doktorId: string, patientId: string, belgeId: string): Promise<FotoMeta | null> {
  const { data, error } = await sb.from(T_META).select('*').eq('doctor_id', doktorId).eq('patient_id', patientId).eq('belge_id', belgeId).maybeSingle()
  if (error) { if (tabloYokMu(error)) return null; throw new Error('Fotoğraf bilgisi okunamadı') }
  return data ? satirdanMeta(data as Record<string, unknown>) : null
}

export async function fotoMetasi(sb: SupabaseClient, doktorId: string, patientId: string, belgeId: string): Promise<FotoMeta> {
  return (await metaOku(sb, doktorId, patientId, belgeId)) ?? bosMeta(belgeId)
}

async function metaKaydet(sb: SupabaseClient, doktorId: string, patientId: string, m: FotoMeta): Promise<void> {
  const mevcut = await sb.from(T_META).select('id').eq('doctor_id', doktorId).eq('belge_id', m.belgeId).maybeSingle()
  if (mevcut.error) { if (tabloYokMu(mevcut.error)) throw new TabloYokHatasi(); throw new Error('Kaydedilemedi') }
  const alanlar = metadanAlanlar(m)
  if (mevcut.data?.id) {
    const { error } = await sb.from(T_META).update(alanlar).eq('id', mevcut.data.id).eq('doctor_id', doktorId)
    if (error) throw new Error('Kaydedilemedi')
  } else {
    const { error } = await sb.from(T_META).insert({ doctor_id: doktorId, patient_id: patientId, belge_id: m.belgeId, ...alanlar })
    if (error) { if (tabloYokMu(error)) throw new TabloYokHatasi(); throw new Error('Kaydedilemedi') }
  }
}

/** Applies a validated PATCH to one photo (ownership proven by the caller via fotoBaglami). */
export async function metaYaz(sb: SupabaseClient, doktorId: string, patientId: string, belgeId: string, yama: MetaYamasi): Promise<FotoMeta> {
  const mevcut = (await metaOku(sb, doktorId, patientId, belgeId)) ?? bosMeta(belgeId)
  const yeni = yamayiUygula(mevcut, yama)
  await metaKaydet(sb, doktorId, patientId, yeni)
  return yeni
}

/** Batch edit. Only documents proven to be this patient's images are touched; the rest are reported as skipped. */
export async function topluYaz(sb: SupabaseClient, doktorId: string, patientId: string, istek: TopluIstek): Promise<{ guncellenen: string[]; atlanan: string[] } | null> {
  if (!(await hastaSahibiMi(sb, doktorId, patientId))) return null
  const { data, error } = await sb.from('medical_documents').select('*').eq('doctor_id', doktorId).eq('patient_id', patientId).is('deleted_at', null).in('id', istek.belgeIds)
  if (error || !Array.isArray(data)) throw new Error('Fotoğraflar okunamadı')
  const uygun = new Set(data.map((r) => rowToMeta(r as Record<string, unknown>)).filter((m) => m.doctorId === doktorId && m.patientId === patientId && imageMi(m)).map((m) => m.id))
  const guncellenen: string[] = [], atlanan: string[] = []
  for (const id of istek.belgeIds) {
    if (!uygun.has(id)) { atlanan.push(id); continue }
    const mevcut = (await metaOku(sb, doktorId, patientId, id)) ?? bosMeta(id)
    await metaKaydet(sb, doktorId, patientId, yamayiUygula(mevcut, topluYamaya(istek, mevcut)))
    guncellenen.push(id)
  }
  return { guncellenen, atlanan }
}

// ─── Listing ─────────────────────────────────────────────────────────────────────────────────────────────
export interface ArsivListesi {
  fotograflar: FotoOge[]
  /** image documents of the patient that are not in the archive yet (for "Belgelerden ekle") */
  eklenebilir: { belgeId: string; dosyaAdi: string; yuklenmeAt: string }[]
  seanslar: { id: string; tarih: string }[]
  /** false while migration 174 is not applied: the archive works read-only from the vault */
  ozelliklerAcik: boolean
  kesildi: boolean
}

async function belgeIdKumesi(sb: SupabaseClient, tablo: string, doktorId: string, patientId: string, ek: (q: any) => any = (q) => q): Promise<Set<string> | null> {
  try {
    const { data, error } = await ek(sb.from(tablo).select('belge_id').eq('doctor_id', doktorId).eq('patient_id', patientId))
    if (error) return null
    return new Set((data || []).map((r: { belge_id: unknown }) => String(r.belge_id)))
  } catch { return null }
}

/** null = the patient is not the doctor's (route → 404). */
export async function arsivListesi(sb: SupabaseClient, doktorId: string, patientId: string): Promise<ArsivListesi | null> {
  if (!(await hastaSahibiMi(sb, doktorId, patientId))) return null
  const { data, error } = await sb.from('medical_documents').select('*').eq('doctor_id', doktorId).eq('patient_id', patientId).is('deleted_at', null).order('created_at', { ascending: false }).limit(ARSIV_AZAMI + 1)
  if (error || !Array.isArray(data)) throw new Error('Fotoğraflar listelenemedi')
  const kesildi = data.length > ARSIV_AZAMI
  const belgeler = data.slice(0, ARSIV_AZAMI).map((r) => rowToMeta(r as Record<string, unknown>))
    .filter((m) => m.doctorId === doktorId && m.patientId === patientId && imageMi(m))

  // facets from the other tables (all fail soft)
  let metalar = new Map<string, FotoMeta>()
  let ozelliklerAcik = true
  try {
    const { data: mr, error: me } = await sb.from(T_META).select('*').eq('doctor_id', doktorId).eq('patient_id', patientId).limit(ARSIV_AZAMI * 2)
    if (me) { if (tabloYokMu(me)) ozelliklerAcik = false; else throw new Error('meta') }
    else metalar = new Map((mr || []).map((r) => { const m = satirdanMeta(r as Record<string, unknown>); return [m.belgeId, m] as const }))
  } catch { ozelliklerAcik = false }
  const kucukler = (await belgeIdKumesi(sb, T_KUCUK, doktorId, patientId)) ?? new Set<string>()
  const aiVar = (await belgeIdKumesi(sb, T_DEG, doktorId, patientId, (q) => q.eq('tur', 'tek').eq('durum', 'tamam'))) ?? new Set<string>()
  const fotoTuru = new Set<string>()
  try {
    const { data: er } = await sb.from('muayene_ek_degerlendirmeleri').select('belge_id, tur').eq('doctor_id', doktorId).eq('patient_id', patientId).limit(ARSIV_AZAMI * 2)
    for (const r of er || []) if (ekTuruMu((r as { tur?: unknown }).tur) && (r as { tur: string }).tur === 'foto') fotoTuru.add(String((r as { belge_id: unknown }).belge_id))
  } catch { /* classification is a hint, not a requirement */ }

  const fotograflar: FotoOge[] = []
  const eklenebilir: ArsivListesi['eklenebilir'] = []
  const seansTarihi = new Map<string, string>()
  for (const b of belgeler) {
    const m = metalar.get(b.id)
    const klinikMi = !!m || fotoTuru.has(b.id) || FOTO_KATEGORILERI.has(String(b.category || '').toLocaleLowerCase('tr-TR'))
    if (!klinikMi || m?.gizli) {
      eklenebilir.push({ belgeId: b.id, dosyaAdi: b.fileName, yuklenmeAt: b.createdAt })
      continue
    }
    const cekimAt = m?.cekimTarihi ? `${m.cekimTarihi}T12:00:00.000Z` : b.createdAt
    fotograflar.push({
      belgeId: b.id, seansId: b.visitId, cekimAt, yuklenmeAt: b.createdAt, dosyaAdi: b.fileName, mime: b.fileType, boyut: b.fileSize,
      bolge: m?.bolge ?? null, bolgeKaynagi: m?.bolgeKaynagi ?? null, favori: m?.favori ?? false, yildiz: m?.yildiz ?? 0, anahtar: m?.anahtar ?? false,
      etiketler: m?.ozel.etiketler ?? [], not: m?.ozel.not ?? '',
      duzenlendi: !!m && ayarDegistiMi(m.ozel.ayarlar),
      notasyonSayisi: m?.ozel.notasyonlar.length ?? 0, kucukVar: kucukler.has(b.id), aiVar: aiVar.has(b.id),
    })
    if (b.visitId) {
      const onceki = seansTarihi.get(b.visitId)
      if (!onceki || Date.parse(cekimAt) < Date.parse(onceki)) seansTarihi.set(b.visitId, cekimAt)
    }
  }
  return {
    fotograflar, eklenebilir, ozelliklerAcik, kesildi,
    seanslar: [...seansTarihi].map(([id, tarih]) => ({ id, tarih })).sort((a, b) => Date.parse(b.tarih) - Date.parse(a.tarih)),
  }
}

/** One photo's full metadata (annotations, adjustments) for the viewer. null = not found. */
export async function fotoDetayi(sb: SupabaseClient, doktorId: string, patientId: string, belgeId: string): Promise<{ meta: FotoMeta; belge: DocumentMeta } | null> {
  const belge = await fotoBaglami(sb, doktorId, patientId, belgeId)
  if (!belge) return null
  return { meta: await fotoMetasi(sb, doktorId, patientId, belgeId), belge }
}

/** Original bytes (decrypted). null when ownership fails. */
export async function fotoBaytlari(sb: SupabaseClient, doktorId: string, patientId: string, belgeId: string): Promise<{ meta: DocumentMeta; bytes: Buffer } | null> {
  const belge = await fotoBaglami(sb, doktorId, patientId, belgeId)
  if (!belge) return null
  try { return await downloadDocument({ supabase: sb }, doktorId, belge.id) } catch { return null }
}

// ─── Thumbnails ──────────────────────────────────────────────────────────────────────────────────────────
export function kucukBicimi(b: Uint8Array): 'image/jpeg' | 'image/webp' | null {
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp'
  return null
}

export async function kucukYaz(sb: SupabaseClient, doktorId: string, patientId: string, belgeId: string, bytes: Buffer, genislik: number, yukseklik: number): Promise<'ok' | 'gecersiz'> {
  const mime = kucukBicimi(bytes)
  if (!mime || bytes.length > KUCUK_AZAMI_BAYT || !Number.isInteger(genislik) || !Number.isInteger(yukseklik) || genislik < 16 || yukseklik < 16 || genislik > 1024 || yukseklik > 1024) return 'gecersiz'
  const alanlar = { mime, genislik, yukseklik, veri_encrypted: encryptBytes(bytes).toString('base64') }
  const mevcut = await sb.from(T_KUCUK).select('id').eq('doctor_id', doktorId).eq('belge_id', belgeId).maybeSingle()
  if (mevcut.error) { if (tabloYokMu(mevcut.error)) throw new TabloYokHatasi(); throw new Error('Kaydedilemedi') }
  if (mevcut.data?.id) {
    const { error } = await sb.from(T_KUCUK).update(alanlar).eq('id', mevcut.data.id).eq('doctor_id', doktorId)
    if (error) throw new Error('Kaydedilemedi')
  } else {
    const { error } = await sb.from(T_KUCUK).insert({ doctor_id: doktorId, patient_id: patientId, belge_id: belgeId, ...alanlar })
    if (error) { if (tabloYokMu(error)) throw new TabloYokHatasi(); throw new Error('Kaydedilemedi') }
  }
  return 'ok'
}

export async function kucukOku(sb: SupabaseClient, doktorId: string, patientId: string, belgeId: string): Promise<{ bytes: Buffer; mime: string } | null> {
  try {
    const { data, error } = await sb.from(T_KUCUK).select('*').eq('doctor_id', doktorId).eq('patient_id', patientId).eq('belge_id', belgeId).maybeSingle()
    if (error || !data) return null
    return { bytes: decryptBytes(Buffer.from(String((data as Record<string, unknown>).veri_encrypted), 'base64')), mime: String((data as Record<string, unknown>).mime) }
  } catch { return null }
}
