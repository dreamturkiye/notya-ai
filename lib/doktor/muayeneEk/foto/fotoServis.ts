/**
 * FOTO-AI-01 — route-level orchestration of the photo AI: context + ownership, image intake (size limit, metadata strip),
 * hash cache, quota, model call, storage, adaptation from the doctor's history, feedback, audit.
 *
 * HASTA-IZOLASYON: every entry point starts with fotoBaglami (hastaSahibiMi + the document row by (id, doctor_id) + same
 * patient + image) for EACH belgeId it touches, including the "previous" photo of a comparison. A foreign id yields null
 * (the route answers 404). Photos reach the model only through aiCagir (ai-model-politikasi): a downscaled, metadata-free
 * derivative made on the device and re-stripped here; the original never leaves the vault.
 */
import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { aiKotaKullan } from '@/lib/doktor/hizLimiti'
import { decrypt } from '@/lib/security/encryption'
import { veliDiliMi } from '@/lib/specialties/kapsam'
import { bransAnahtari } from '@/core/belgeler/router'
import { fotoBaglami, fotoBaytlari, fotoMetasi } from '@/lib/doktor/fotoArsiv/sunucu'
import { gorselMetaTemizle } from '@/lib/doktor/fotoArsiv/metaTemizle'
import { gunFarki } from '@/lib/doktor/fotoArsiv/zamanCizelgesi'
import type { DocumentMeta } from '@/lib/vault/types'
import { FOTO_AI_SURUMU, gozlemHedefleri, type FotoDegerlendirme, type FotoMod, type FotoUretimKaydi } from './sema'
import { fotoModu, fotoAiKapaliBrans, yasMetni } from './uzmanlik'
import { istemParmakIzi } from './istem'
import { fotoDegerlendir, kaliteKontrol, type GorselGirdisi, type KaliteSonucu } from './degerlendir'
import { fotoKarsilastir, type FotoKarsilastirma } from './karsilastir'
import type { CagriFonksiyonu } from './cagri'
import {
  degHashIleBul, degOku, degYaz, geriBildirimleriOku, geriBildirimYaz, karsilastirmaCoz, ogrenmeIsle, ogrenmeOku, tekDogrula,
  type GeriBildirimSatiri,
} from './fotoSaklama'
import { alanaGore, mutabakatHesapla, ogrenmeUygula, type GeriBildirimKarari, type Mutabakat, type Uyarlama } from './ogrenme'

export const FOTO_AI_ROTA_SURESI_SN = 120
/** Largest derivative accepted from the device (decoded bytes). The client sends <= ~1600px JPEG, typically 150-400 KB. */
export const TUREV_AZAMI_BAYT = 2_500_000

export interface FotoAiBaglam {
  sb: SupabaseClient
  doktorId: string
  patientId: string
  belge: DocumentMeta
  bransKey: string
  mod: FotoMod
  veliDili: boolean
  yas: string | null
  dogumIso: string | null
}

async function hastaBilgisi(sb: SupabaseClient, doktorId: string, patientId: string): Promise<{ uzmanlik: string | null; dogumIso: string | null }> {
  const [{ data: doktor }, { data: hasta }] = await Promise.all([
    sb.from('users').select('specialty').eq('id', doktorId).maybeSingle(),
    sb.from('patients').select('dob_encrypted').eq('id', patientId).eq('doctor_id', doktorId).maybeSingle(),
  ])
  let dogumIso: string | null = null
  try { if (hasta?.dob_encrypted) dogumIso = decrypt(String(hasta.dob_encrypted)).slice(0, 10) } catch { dogumIso = null }
  return { uzmanlik: (doktor?.specialty as string | null) ?? null, dogumIso }
}

/** null = the photo is not this doctor's patient's photo (route: 404). */
export async function aiBaglamYukle(sb: SupabaseClient, doktorId: string, patientId: string, belgeId: string): Promise<FotoAiBaglam | null> {
  const belge = await fotoBaglami(sb, doktorId, patientId, belgeId)
  if (!belge) return null
  const { uzmanlik, dogumIso } = await hastaBilgisi(sb, doktorId, patientId)
  const bransKey = bransAnahtari(uzmanlik)
  return {
    sb, doktorId, patientId, belge, bransKey, mod: fotoModu(bransKey),
    veliDili: veliDiliMi({ doktorBransi: uzmanlik, hastaDogumIso: dogumIso }),
    yas: yasMetni(dogumIso), dogumIso,
  }
}

// ─── Image intake ────────────────────────────────────────────────────────────────────────────────────────
export type GorselCozumu = { gorsel: GorselGirdisi } | { hata: string }

/** Data-URL / base64 -> a metadata-free JPEG/PNG. Anything else (HEIC, WebP, oversize, corrupt) is refused with a Turkish reason. */
export function gorselCoz(ham: unknown): GorselCozumu {
  if (typeof ham !== 'string' || !ham) return { hata: 'Görsel eksik.' }
  const b64 = ham.replace(/^data:[^;,]+;base64,/, '')
  if (b64.length > Math.ceil(TUREV_AZAMI_BAYT * 4 / 3) + 8) return { hata: 'Görsel çok büyük; cihaz küçültülmüş bir kopya göndermeli.' }
  let bytes: Buffer
  try { bytes = Buffer.from(b64, 'base64') } catch { return { hata: 'Görsel okunamadı.' } }
  if (!bytes.length || bytes.length > TUREV_AZAMI_BAYT) return { hata: 'Görsel çok büyük; cihaz küçültülmüş bir kopya göndermeli.' }
  const temiz = gorselMetaTemizle(bytes)
  if (!temiz) return { hata: 'Yalnızca JPEG veya PNG görsel değerlendirilebilir.' }
  return { gorsel: { mime: temiz.mime, base64: temiz.bytes.toString('base64') } }
}

const sha = (...p: (string | Buffer)[]): string => { const h = createHash('sha256'); p.forEach((x, i) => { if (i) h.update('\0'); h.update(x) }); return h.digest('hex') }

// ─── Single-photo evaluation ─────────────────────────────────────────────────────────────────────────────
export interface DegerlendirmeGorunumu {
  degerlendirmeId: string | null
  deger: FotoDegerlendirme
  uyarlamalar: Uyarlama[]
  uretim: FotoUretimKaydi
  geriBildirimler: GeriBildirimSatiri[]
  mutabakat: Mutabakat
}

export type TekDegerlendirmeYaniti =
  | { durum: 'tamam'; gorunum: DegerlendirmeGorunumu }
  | { durum: 'yok' }
  | { durum: 'kapali'; mesaj: string }
  | { durum: 'kota'; mesaj: string }
  | { durum: 'hata'; mesaj: string; hatalar: string[] }

const KAPALI_MESAJI = 'Bu branşta görüntü analizi kapalıdır.'

async function gorunumKur(c: FotoAiBaglam, belgeId: string, id: string | null, deger: FotoDegerlendirme, uretim: FotoUretimKaydi): Promise<DegerlendirmeGorunumu> {
  const [satirlar, geri] = await Promise.all([ogrenmeOku(c.sb, c.doktorId, c.bransKey), geriBildirimleriOku(c.sb, c.doktorId, belgeId)])
  const u = ogrenmeUygula(deger, satirlar)
  return { degerlendirmeId: id, deger: u.deger, uyarlamalar: u.uyarlamalar, uretim, geriBildirimler: geri, mutabakat: mutabakatHesapla(satirlar) }
}

/** Reads a stored evaluation for this photo WITHOUT calling the model (the panel loads this when a photo is opened). */
export async function tekDegerlendirmeOku(c: FotoAiBaglam, belgeId: string): Promise<TekDegerlendirmeYaniti> {
  if (fotoAiKapaliBrans(c.bransKey)) return { durum: 'kapali', mesaj: KAPALI_MESAJI }
  const k = await degOku(c.sb, c.doktorId, belgeId, 'tek', null, tekDogrula(c.mod))
  if (!k?.deger || k.durum !== 'tamam' || !k.uretim) return { durum: 'yok' }
  return { durum: 'tamam', gorunum: await gorunumKur(c, belgeId, k.id, k.deger, k.uretim) }
}

export interface TekIstegi { turev: GorselGirdisi; bolgeIpucu: string | null; yenile: boolean }

export async function tekDegerlendir(c: FotoAiBaglam, g: TekIstegi, cagir?: CagriFonksiyonu): Promise<TekDegerlendirmeYaniti> {
  if (fotoAiKapaliBrans(c.bransKey)) return { durum: 'kapali', mesaj: KAPALI_MESAJI }
  const orijinal = await fotoBaytlari(c.sb, c.doktorId, c.patientId, c.belge.id)
  if (!orijinal) return { durum: 'yok' }
  const izi = istemParmakIzi(c.mod)
  // The cache identity is the ORIGINAL bytes (stable across devices/derivatives) + prompt + mode + age group.
  const hash = sha(orijinal.bytes, 'tek', izi, c.mod, c.veliDili ? 'v' : 'e')

  if (!g.yenile) {
    const buBelge = await degOku(c.sb, c.doktorId, c.belge.id, 'tek', null, tekDogrula(c.mod))
    if (buBelge?.durum === 'tamam' && buBelge.deger && buBelge.uretim && buBelge.girdiHash === hash && buBelge.surum === FOTO_AI_SURUMU) {
      return { durum: 'tamam', gorunum: await gorunumKur(c, c.belge.id, buBelge.id, buBelge.deger, { ...buBelge.uretim, kaynak: 'onbellek' }) }
    }
    const ayni = await degHashIleBul(c.sb, c.doktorId, hash, 'tek', tekDogrula(c.mod))
    if (ayni?.deger && ayni.uretim && ayni.surum === FOTO_AI_SURUMU) {
      const id = await degYaz(c.sb, { doktorId: c.doktorId, patientId: c.patientId, belgeId: c.belge.id, tur: 'tek', oncekiBelgeId: null, girdiHash: hash, surum: FOTO_AI_SURUMU, istemIzi: izi, durum: 'tamam', model: ayni.model, paket: { deger: ayni.deger, uretim: ayni.uretim } })
      return { durum: 'tamam', gorunum: await gorunumKur(c, c.belge.id, id, ayni.deger, { ...ayni.uretim, kaynak: 'onbellek' }) }
    }
  }

  const kota = await aiKotaKullan(c.sb, c.doktorId, 'ek')
  if (!kota.izin) return { durum: 'kota', mesaj: 'Günlük yapay zekâ kullanım sınırına ulaşıldı. Sınır her gece (TRT) yenilenir.' }

  const s = await fotoDegerlendir({ doctorId: c.doktorId, gorsel: g.turev, mod: c.mod, yas: c.yas, bolgeIpucu: g.bolgeIpucu, veliDili: c.veliDili, cagir })
  if (s.durum === 'hata') return { durum: 'hata', mesaj: 'Değerlendirme şu anda üretilemedi. Fotoğraf kaydedildi; daha sonra yeniden deneyebilirsiniz.', hatalar: s.hatalar }
  const id = await degYaz(c.sb, { doktorId: c.doktorId, patientId: c.patientId, belgeId: c.belge.id, tur: 'tek', oncekiBelgeId: null, girdiHash: hash, surum: FOTO_AI_SURUMU, istemIzi: izi, durum: 'tamam', model: s.uretim.model, paket: { deger: s.deger, uretim: s.uretim } })
  return { durum: 'tamam', gorunum: await gorunumKur(c, c.belge.id, id, s.deger, s.uretim) }
}

// ─── Pre-save quality gate ───────────────────────────────────────────────────────────────────────────────
export type KaliteYaniti = { durum: 'tamam'; sonuc: KaliteSonucu } | { durum: 'atlandi' } | { durum: 'kapali'; mesaj: string } | { durum: 'kota'; mesaj: string }

/** The photo is not saved yet, so there is no belgeId: nothing is cached or stored. A failed gate never blocks saving. */
export async function kaliteOnKontrol(sb: SupabaseClient, doktorId: string, bransKey: string, turev: GorselGirdisi, cagir?: CagriFonksiyonu): Promise<KaliteYaniti> {
  if (fotoAiKapaliBrans(bransKey)) return { durum: 'kapali', mesaj: KAPALI_MESAJI }
  const kota = await aiKotaKullan(sb, doktorId, 'ek')
  if (!kota.izin) return { durum: 'kota', mesaj: 'Günlük yapay zekâ kullanım sınırına ulaşıldı.' }
  const sonuc = await kaliteKontrol({ doctorId: doktorId, gorsel: turev, cagir })
  return sonuc ? { durum: 'tamam', sonuc } : { durum: 'atlandi' }
}

/** Branş of the practice for routes that have no photo yet (quality gate). */
export async function doktorBransAnahtari(sb: SupabaseClient, doktorId: string): Promise<string> {
  const { data } = await sb.from('users').select('specialty').eq('id', doktorId).maybeSingle()
  return bransAnahtari((data?.specialty as string | null) ?? null)
}

// ─── Comparison with a previous photo ────────────────────────────────────────────────────────────────────
export type KarsilastirmaYaniti =
  | { durum: 'tamam'; deger: FotoKarsilastirma; uretim: FotoUretimKaydi; gunFarki: number }
  | { durum: 'yok' }
  | { durum: 'kapali'; mesaj: string }
  | { durum: 'kota'; mesaj: string }
  | { durum: 'hata'; mesaj: string; hatalar: string[] }

const tarihOf = (b: DocumentMeta, cekim: string | null): string => cekim ? `${cekim}T12:00:00.000Z` : b.createdAt

async function karsilastirmaHazirla(c: FotoAiBaglam, oncekiBelgeId: string) {
  const onceki = await fotoBaglami(c.sb, c.doktorId, c.patientId, oncekiBelgeId)
  if (!onceki || onceki.id === c.belge.id) return null
  const [mA, mB] = await Promise.all([fotoMetasi(c.sb, c.doktorId, c.patientId, onceki.id), fotoMetasi(c.sb, c.doktorId, c.patientId, c.belge.id)])
  let eski = { belge: onceki, meta: mA }, yeni = { belge: c.belge, meta: mB }
  if (Date.parse(tarihOf(eski.belge, eski.meta.cekimTarihi)) > Date.parse(tarihOf(yeni.belge, yeni.meta.cekimTarihi))) [eski, yeni] = [yeni, eski]
  const gun = Math.max(0, Math.abs(gunFarki(tarihOf(eski.belge, eski.meta.cekimTarihi), tarihOf(yeni.belge, yeni.meta.cekimTarihi))))
  const olcekVar = (m: typeof mA) => m.ozel.notasyonlar.some((n) => n.t === 'olcek')
  return { eski, yeni, gun, olcekIkisinde: olcekVar(mA) && olcekVar(mB) }
}

export async function karsilastirmaOku(c: FotoAiBaglam, oncekiBelgeId: string): Promise<KarsilastirmaYaniti> {
  if (fotoAiKapaliBrans(c.bransKey)) return { durum: 'kapali', mesaj: KAPALI_MESAJI }
  const h = await karsilastirmaHazirla(c, oncekiBelgeId)
  if (!h) return { durum: 'yok' }
  const k = await degOku(c.sb, c.doktorId, c.belge.id, 'karsilastirma', oncekiBelgeId, karsilastirmaCoz)
  if (!k?.deger || k.durum !== 'tamam' || !k.uretim) return { durum: 'yok' }
  return { durum: 'tamam', deger: k.deger, uretim: { ...k.uretim, kaynak: 'onbellek' }, gunFarki: h.gun }
}

export interface KarsilastirmaIstegi { oncekiBelgeId: string; onceki: GorselGirdisi; sonraki: GorselGirdisi; yenile: boolean }

/** `g.onceki` / `g.sonraki` are the derivatives of the photo `oncekiBelgeId` and the open photo; the server orders them by shot date. */
export async function karsilastir(c: FotoAiBaglam, g: KarsilastirmaIstegi, cagir?: CagriFonksiyonu): Promise<KarsilastirmaYaniti> {
  if (fotoAiKapaliBrans(c.bransKey)) return { durum: 'kapali', mesaj: KAPALI_MESAJI }
  const h = await karsilastirmaHazirla(c, g.oncekiBelgeId)
  if (!h) return { durum: 'yok' }
  const [oA, oB] = await Promise.all([fotoBaytlari(c.sb, c.doktorId, c.patientId, g.oncekiBelgeId), fotoBaytlari(c.sb, c.doktorId, c.patientId, c.belge.id)])
  if (!oA || !oB) return { durum: 'yok' }
  // order the derivatives to match eski/yeni: g.onceki belongs to g.oncekiBelgeId
  const eskiBuMu = h.eski.belge.id === g.oncekiBelgeId
  const eskiTurev = eskiBuMu ? g.onceki : g.sonraki
  const yeniTurev = eskiBuMu ? g.sonraki : g.onceki
  const izi = istemParmakIzi(c.mod)
  const hEski = sha(eskiBuMu ? oA.bytes : oB.bytes), hYeni = sha(eskiBuMu ? oB.bytes : oA.bytes)
  const hash = sha(hEski, hYeni, 'karsilastirma', izi, c.veliDili ? 'v' : 'e', h.olcekIkisinde ? 'o' : 'x', String(h.gun))

  if (!g.yenile) {
    const k = await degOku(c.sb, c.doktorId, c.belge.id, 'karsilastirma', g.oncekiBelgeId, karsilastirmaCoz)
    if (k?.durum === 'tamam' && k.deger && k.uretim && k.girdiHash === hash && k.surum === FOTO_AI_SURUMU) {
      return { durum: 'tamam', deger: k.deger, uretim: { ...k.uretim, kaynak: 'onbellek' }, gunFarki: h.gun }
    }
  }
  const kota = await aiKotaKullan(c.sb, c.doktorId, 'ek')
  if (!kota.izin) return { durum: 'kota', mesaj: 'Günlük yapay zekâ kullanım sınırına ulaşıldı. Sınır her gece (TRT) yenilenir.' }
  const s = await fotoKarsilastir({ doctorId: c.doktorId, onceki: eskiTurev, sonraki: yeniTurev, gunFarki: h.gun, olcekIkisinde: h.olcekIkisinde, veliDili: c.veliDili, cagir })
  if (s.durum === 'hata') return { durum: 'hata', mesaj: 'Karşılaştırma şu anda üretilemedi.', hatalar: s.hatalar }
  await degYaz(c.sb, { doktorId: c.doktorId, patientId: c.patientId, belgeId: c.belge.id, tur: 'karsilastirma', oncekiBelgeId: g.oncekiBelgeId, girdiHash: hash, surum: FOTO_AI_SURUMU, istemIzi: izi, durum: 'tamam', model: s.uretim.model, paket: { deger: s.deger, uretim: s.uretim } })
  return { durum: 'tamam', deger: s.deger, uretim: s.uretim, gunFarki: h.gun }
}

// ─── Feedback ────────────────────────────────────────────────────────────────────────────────────────────
export type GeriBildirimYaniti =
  | { durum: 'tamam'; mutabakat: Mutabakat; alanlar: Record<string, Mutabakat> }
  | { durum: 'yok' }
  | { durum: 'gecersiz'; mesaj: string }
  | { durum: 'hata'; mesaj: string }

export const DUZELTME_AZAMI = 600

/**
 * The learning feature is derived HERE from the stored evaluation (never taken from the client): a client can only name a
 * `gozlemAnahtari` that exists in this photo's evaluation. Only counters keyed by the closed vocabulary feed learning.
 */
export async function geriBildirimIsle(c: FotoAiBaglam, g: { gozlemAnahtari: string; karar: GeriBildirimKarari; duzeltme: string | null }): Promise<GeriBildirimYaniti> {
  const k = await degOku(c.sb, c.doktorId, c.belge.id, 'tek', null, tekDogrula(c.mod))
  if (!k?.deger || k.durum !== 'tamam') return { durum: 'yok' }
  const hedef = gozlemHedefleri(k.deger).find((h) => h.anahtar === g.gozlemAnahtari)
  if (!hedef) return { durum: 'gecersiz', mesaj: 'Bilinmeyen değerlendirme maddesi.' }
  const duzeltme = g.karar === 'duzelt' && g.duzeltme ? Array.from(g.duzeltme.replace(/\u0000/g, '').trim()).slice(0, DUZELTME_AZAMI).join('') || null : null
  if (g.karar === 'duzelt' && !duzeltme) return { durum: 'gecersiz', mesaj: 'Düzeltme metni boş olamaz.' }
  const onceki = await geriBildirimYaz(c.sb, { doktorId: c.doktorId, patientId: c.patientId, belgeId: c.belge.id, degerlendirmeId: k.id, gozlemAnahtari: hedef.anahtar, ozellik: hedef.ozellik, karar: g.karar, duzeltme })
  if (onceki === undefined) return { durum: 'hata', mesaj: 'Geri bildirim kaydedilemedi.' }
  await ogrenmeIsle(c.sb, c.doktorId, c.bransKey, hedef.ozellik, onceki, g.karar)
  return { durum: 'tamam', ...(await mutabakatOzeti(c.sb, c.doktorId, c.bransKey)) }
}

export async function mutabakatOzeti(sb: SupabaseClient, doktorId: string, bransKey: string): Promise<{ mutabakat: Mutabakat; alanlar: Record<string, Mutabakat> }> {
  const satirlar = await ogrenmeOku(sb, doktorId, bransKey)
  return { mutabakat: mutabakatHesapla(satirlar), alanlar: alanaGore(satirlar) }
}
