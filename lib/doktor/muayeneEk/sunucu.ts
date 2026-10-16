/**
 * MUAYENE-EKLERI-01 — sunucu tarafı orkestrasyon: bağlam/sahiplik, sınıflandırma, tür kaydı, ek değerlendirmesi.
 *
 * Mevcut yolları YENİDEN KULLANIR (kopyalamaz): lab çıkarımı core/lab/*, görüntü/EKG/fotoğraf core/belgeler/tierA,
 * aşı karnesi okuma lib/asi/karneOkuma, barkod lib/asi/stok/barkod + motor, vault lib/vault/service, AI lib/ai/cagir.
 * Yeni bir model/sağlayıcı adı YOK; tüm çağrılar aiCagir üzerinden (görev: goruntu-inceleme / klinik-analiz).
 *
 * HASTA-IZOLASYON: dışarıdan gelen kimlikler sessionId ve belgeId'dir. baglamYukle önce seansSahibi(doktor, seans) —
 * seansın hastası da doktorun olmalı — sonra getDocumentMeta(doktor, belge) ve belge.visitId === seans, belge.patientId ===
 * seansın hastası şartını arar; biri tutmazsa null (rota 404 döner). Hasta kimliği (ad/TC) hiçbir modele gitmez; loglara
 * klinik metin yazılmaz.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { seansSahibi } from '@/lib/doktor/hastaSahipligi'
import { downloadDocument, getDocumentMeta } from '@/lib/vault/service'
import type { DocumentMeta } from '@/lib/vault/types'
import { decrypt } from '@/lib/security/encryption'
import { aiCagir, rotaButcesiMs, yanitMetni } from '@/lib/ai/cagir'
import { aiKotaKullan } from '@/lib/doktor/hizLimiti'
import { bransAnahtari, bransKurali, etkinModalite } from '@/core/belgeler/router'
import { tierAYazVeFuzyonla } from '@/core/belgeler/tierA'
import type { Modalite } from '@/core/belgeler/ontoloji'
import { csvXlsxCoz, gorselCikar, pdfMetinCoz, type CikarimSonucu } from '@/core/lab/cikarim'
import { satirKur, uzlastir, type HamSatir, type LabSatir, type OncekiSatir } from '@/core/lab/trend'
import { labRaporYaz, labRaporuDogrula } from '@/core/lab/yorum'
import {
  KARNE_KULLANICI_METNI, KARNE_SISTEM, KarneOkumaHatasi, karneKimlikUyarisi, karneYanitiniCoz,
} from '@/lib/asi/karneOkuma'
import { barkodBilgisi } from '@/lib/asi/stok/barkod'
import { asiStokModuluAktifMiDoktor } from '@/lib/asi/stok/modul'
import { barkodTara } from '@/lib/asi/stok/motor'
import { ziyaretGunu } from '@/lib/doktor/notAsiAktarim'
import { asiSonucu, atlandiSonucu, genelSonucu, goruntuSonucu, hataSonucu, karneSatirlariniCevir, labSonucu, type GenelBelgeJson } from './donustur'
import { kasaKategorisi } from './kategori'
import { sinifla, ogrenmeSinyali, type SiniflandirGirdi } from './siniflandir'
import { degerlendirmeOku, degerlendirmeYaz, girdiHash, ogrenmeIsaretle, ogrenmeKaydet, ogrenmeYukle } from './saklama'
import { ekTuruMu, type EkAsiSatiri, type EkKaynak, type EkSonuc, type EkTuru, type SiniflandirmaSonucu } from './tipler'

export const EK_ROTA_SURESI_SN = 120

export interface EkBaglam {
  sb: SupabaseClient
  doktorId: string
  sessionId: string
  patientId: string
  meta: DocumentMeta
  /** users.specialty ham değeri (kasa kapısı + öğrenme anahtarı). */
  uzmanlik: string | null
  bransKey: string
  yasAy: number | null
  cinsiyet: 'K' | 'E' | null
  dogumIso: string | null
  ziyaretGunu: string
}

const bugunTr = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10)

export async function baglamYukle(sb: SupabaseClient, doktorId: string, sessionId: string, belgeId: string): Promise<EkBaglam | null> {
  const seans = await seansSahibi(sb, doktorId, sessionId)
  if (!seans?.patient_id) return null
  let meta: DocumentMeta
  try { meta = await getDocumentMeta({ supabase: sb }, doktorId, belgeId) } catch { return null }
  if (meta.visitId !== seans.id || meta.patientId !== seans.patient_id) return null

  const [{ data: doktor }, { data: hasta }] = await Promise.all([
    sb.from('users').select('specialty').eq('id', doktorId).maybeSingle(),
    sb.from('patients').select('dob_encrypted, gender_encrypted').eq('id', seans.patient_id).eq('doctor_id', doktorId).maybeSingle(),
  ])
  let dogumIso: string | null = null
  let cinsiyet: 'K' | 'E' | null = null
  try { if (hasta?.dob_encrypted) dogumIso = decrypt(String(hasta.dob_encrypted)).slice(0, 10) } catch { dogumIso = null }
  try {
    if (hasta?.gender_encrypted) {
      const g = decrypt(String(hasta.gender_encrypted)).toLocaleLowerCase('tr-TR')
      cinsiyet = g.startsWith('k') || g.startsWith('f') ? 'K' : g.startsWith('e') || g.startsWith('m') ? 'E' : null
    }
  } catch { cinsiyet = null }
  let yasAy: number | null = null
  if (dogumIso) {
    const d = new Date(dogumIso)
    if (!Number.isNaN(d.getTime())) { const n = new Date(); yasAy = Math.max(0, (n.getFullYear() - d.getFullYear()) * 12 + (n.getMonth() - d.getMonth())) }
  }
  const uzmanlik = (doktor?.specialty as string | null) ?? null
  return { sb, doktorId, sessionId, patientId: seans.patient_id, meta, uzmanlik, bransKey: bransAnahtari(uzmanlik), yasAy, cinsiyet, dogumIso, ziyaretGunu: ziyaretGunu() }
}

// ─── Sınıflandırma ──────────────────────────────────────────────────────────────────────────────────────
const SINIF_SISTEM = `Sen bir tıbbi belge türü ayırıcısın. Görüntü/PDF'i şu türlerden BİRİNE ayır:
lab (laboratuvar/tahlil sonucu), asi (aşı karnesi, aşı belgesi, aşı flakonu/kutusu/barkodu), foto (klinik/önce-sonra/büyüme fotoğrafı: cilt, lezyon, yara, vücut), rontgen (röntgen, BT, MR, USG gibi görüntüleme film ya da raporu), ekg (EKG kaydı), epikriz (epikriz, taburculuk, sevk/konsültasyon raporu), diger.
Emin değilsen düşük güven ver; tahmin yürütme. Hasta adı, T.C. no gibi kimlik bilgisini YAZMA.
Yalnız JSON: {"tur": "lab"|"asi"|"foto"|"rontgen"|"ekg"|"epikriz"|"diger", "guven": 0-1 arası sayı}`

function icerikBlogu(meta: DocumentMeta, bytes: Buffer): unknown | null {
  const b64 = bytes.toString('base64')
  if (meta.fileType === 'application/pdf') return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } }
  if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(meta.fileType)) return { type: 'image', source: { type: 'base64', media_type: meta.fileType, data: b64 } }
  return null
}

function jsonAyikla(ham: string): Record<string, unknown> | null {
  const t = ham.replace(/```json|```/g, '')
  const a = t.indexOf('{'), z = t.lastIndexOf('}')
  if (a < 0 || z <= a) return null
  try { const j = JSON.parse(t.slice(a, z + 1)); return j && typeof j === 'object' && !Array.isArray(j) ? j as Record<string, unknown> : null } catch { return null }
}

async function aiSiniflandir(c: EkBaglam, bytes: Buffer): Promise<{ tur: EkTuru; guven: number } | null> {
  const blok = icerikBlogu(c.meta, bytes)
  if (!blok) return null
  try {
    const y = await aiCagir({
      gorev: 'goruntu-inceleme', maxTokens: 200, temperature: 0, jsonBekleniyor: true, doctorId: c.doktorId,
      system: [{ metin: SINIF_SISTEM, onbellek: true }],
      messages: [{ role: 'user', content: [blok, { type: 'text', text: 'Bu belgenin türünü JSON olarak ver.' }] }],
      butceMs: 35_000,
    })
    const j = jsonAyikla(yanitMetni(y as { content?: unknown }, '\n'))
    if (!j || !ekTuruMu(j.tur)) return null
    const guven = Math.min(1, Math.max(0, Number(j.guven) || 0))
    return { tur: j.tur, guven }
  } catch { return null }
}

async function metinCikar(meta: DocumentMeta, bytes: Buffer): Promise<string | null> {
  try {
    if (meta.fileType === 'application/pdf') { const p = await pdfMetinCoz(bytes); return p.metin ? p.metin.slice(0, 3000) : null }
  } catch { /* metin çıkmazsa görsel yol */ }
  return null
}

export interface SiniflandirCikti extends SiniflandirmaSonucu { ogrenmeAcik: boolean }

/** Belgeyi sınıflandırır; kasa kategorisini yalnız belirsiz değilse yazar. AI yalnız sezgisel güven eşiğin altındaysa çağrılır. */
export async function belgeyiSiniflandir(c: EkBaglam, kaynak: EkKaynak, ipucuTur: EkTuru | null): Promise<SiniflandirCikti> {
  const { bytes } = await downloadDocument({ supabase: c.sb }, c.doktorId, c.meta.id)
  const brans = c.bransKey
  const [ogrenme, metin] = await Promise.all([ogrenmeYukle(c.sb, c.doktorId, brans), metinCikar(c.meta, bytes)])
  const girdi: SiniflandirGirdi = { dosyaAdi: c.meta.fileName, mime: c.meta.fileType, kaynak, metin, ipucuTur }
  let sonuc = sinifla(girdi, ogrenme)
  let aiTahmini: { tur: EkTuru; guven: number } | null = null
  if (sonuc.sor) {
    const kota = await aiKotaKullan(c.sb, c.doktorId, 'ek')
    if (kota.izin) {
      aiTahmini = await aiSiniflandir(c, bytes)
      if (aiTahmini) { girdi.ai = aiTahmini; sonuc = sinifla(girdi, ogrenme) }
    }
  }
  const ogrenmeAcik = await degerlendirmeYaz(c.sb, {
    doktorId: c.doktorId, patientId: c.patientId, sessionId: c.sessionId, belgeId: c.meta.id,
    tur: sonuc.tur, turGuven: sonuc.guven, turKaynagi: sonuc.nedenler.some((n) => n.includes('önceki tercih')) ? 'ogrenilen' : 'otomatik', durum: 'bekliyor',
  })
  if (!sonuc.sor) await kategoriYaz(c, sonuc.tur)
  return { ...sonuc, ogrenmeAcik }
}

async function kategoriYaz(c: EkBaglam, tur: EkTuru): Promise<void> {
  try {
    await c.sb.from('medical_documents').update({ category: kasaKategorisi(tur, { dosyaAdi: c.meta.fileName, fileType: c.meta.fileType, brans: c.uzmanlik }) })
      .eq('id', c.meta.id).eq('doctor_id', c.doktorId)
  } catch { /* kategori kritik değil */ }
}

/**
 * Hekim türü seçti/onayladı. `onceki` = ekranda gösterilen tür (aynıysa onay, farklıysa düzeltme). Öğrenme sinyali yazılır
 * (tablo yoksa sessizce atlanır). Her belge için sinyal bir kez sayılır (ogrenme_islendi) — tekrar dokunuş çift saymaz.
 */
export async function turuKaydet(c: EkBaglam, kaynak: EkKaynak, secilen: EkTuru, onceki: EkTuru | null): Promise<{ ogrenmeAcik: boolean }> {
  await kategoriYaz(c, secilen)
  const mevcut = await degerlendirmeOku(c.sb, c.doktorId, c.meta.id)
  await degerlendirmeYaz(c.sb, {
    doktorId: c.doktorId, patientId: c.patientId, sessionId: c.sessionId, belgeId: c.meta.id,
    tur: secilen, turGuven: 1, turKaynagi: 'hekim', ...(mevcut && mevcut.tur !== secilen ? { durum: 'bekliyor' as const, sonuc: null, girdiHash: null } : {}),
  })
  if (mevcut?.ogrenmeIslendi) return { ogrenmeAcik: true }
  let acik = false
  try {
    const { bytes } = await downloadDocument({ supabase: c.sb }, c.doktorId, c.meta.id)
    const metin = await metinCikar(c.meta, bytes)
    const sinyal = ogrenmeSinyali({ dosyaAdi: c.meta.fileName, mime: c.meta.fileType, kaynak, metin, ai: onceki ? { tur: onceki, guven: 0.5 } : null }, secilen, onceki)
    acik = await ogrenmeKaydet(c.sb, c.doktorId, c.bransKey, sinyal)
    if (acik) await ogrenmeIsaretle(c.sb, c.doktorId, c.meta.id)
  } catch { acik = false }
  return { ogrenmeAcik: acik }
}

// ─── Değerlendirme ──────────────────────────────────────────────────────────────────────────────────────
async function oncekiler(sb: SupabaseClient, doctorId: string, patientId: string): Promise<OncekiSatir[]> {
  try {
    const { data } = await sb.from('lab_satirlar').select('canonical_key, kanonik_deger, flag, numune_tarihi').eq('doctor_id', doctorId).eq('patient_id', patientId).eq('onayli', true).not('canonical_key', 'is', null).limit(400)
    return (data || []).map((r) => ({ canonical_key: String(r.canonical_key), kanonik_deger: r.kanonik_deger == null ? null : Number(r.kanonik_deger), flag: r.flag as OncekiSatir['flag'], numune_tarihi: String(r.numune_tarihi || '') }))
  } catch { return [] }
}
async function aliaslar(sb: SupabaseClient, doctorId: string): Promise<Record<string, string>> {
  try { const { data } = await sb.from('lab_takma_adlar').select('raw_norm, canonical_key').eq('doctor_id', doctorId); return Object.fromEntries((data || []).map((r) => [r.raw_norm, r.canonical_key])) } catch { return {} }
}

async function labDegerlendir(c: EkBaglam, bytes: Buffer): Promise<EkSonuc> {
  const ft = c.meta.fileType
  const butce = rotaButcesiMs(EK_ROTA_SURESI_SN)
  let yapi: CikarimSonucu | null = null, gorsel: CikarimSonucu | null = null
  try {
    if (/csv|excel|spreadsheet/.test(ft)) yapi = csvXlsxCoz(bytes, ft)
    else if (ft === 'application/pdf') { const p = await pdfMetinCoz(bytes); yapi = p.satirlar.length && p.metin.trim() ? p : null }
  } catch { yapi = null }
  try {
    if (ft === 'application/pdf') gorsel = await gorselCikar({ tip: 'pdf', base64: bytes.toString('base64') }, undefined, c.doktorId, undefined, butce)
    else if (ft.startsWith('image/')) gorsel = await gorselCikar({ tip: 'image', mime: ft, base64: bytes.toString('base64') }, undefined, c.doktorId, undefined, butce)
  } catch { gorsel = null }
  if (!yapi && !gorsel) return hataSonucu('lab', 'Bu dosyadan laboratuvar tablosu çıkarılamadı.')

  let ham: HamSatir[]
  let uyusmazlikSayisi = 0
  if (yapi && gorsel) { const u = uzlastir(yapi.satirlar, gorsel.satirlar); ham = u.satirlar; uyusmazlikSayisi = u.uyusmazlik.length }
  else ham = (yapi || gorsel)!.satirlar
  const [onc, al] = await Promise.all([oncekiler(c.sb, c.doktorId, c.patientId), aliaslar(c.sb, c.doktorId)])
  const satirlar: LabSatir[] = ham.map((h) => satirKur(h, onc, al))
  if (uyusmazlikSayisi) for (const s of satirlar) if (s.dogrulama_notu) s.dogrulanacak = true

  // Kimlik koruması: yalnız doğum tarihi karşılaştırılır (ad modele/log'a gitmez); eşleşmezse hekime uyarı.
  const basiliDogum = gorsel?.kimlik?.dogum || null
  const kimlikUyarisi = basiliDogum && c.dogumIso && basiliDogum !== c.dogumIso
    ? 'Belgedeki doğum tarihi bu hastanın kayıtlı doğum tarihiyle eşleşmiyor — doğru hastanın belgesi olduğunu kontrol edin.' : null

  const kural = bransKurali(c.bransKey)
  const kritik = satirlar.filter((s) => s.kritik).map((s) => s.kritik_neden || s.raw_name)
  let rapor = null
  try {
    const y = await labRaporYaz(kural.persona, c.bransKey, satirlar, {
      yasAy: c.yasAy, cinsiyet: c.cinsiyet, ilaclar: [], labAdi: gorsel?.lab_adi || yapi?.lab_adi || null,
      numuneTarihi: gorsel?.numune_tarihi || yapi?.numune_tarihi || null, kritik, oncekiVar: onc.length > 0,
    }, c.doktorId)
    rapor = labRaporuDogrula(y.rapor, satirlar, onc.length > 0).rapor
  } catch { rapor = null }
  return labSonucu({ satirlar, rapor, labAdi: gorsel?.lab_adi || yapi?.lab_adi || null, numuneTarihi: gorsel?.numune_tarihi || yapi?.numune_tarihi || null, kimlikUyarisi })
}

export interface DeidGorsel { mime: string; base64: string; hash?: string }

async function goruntuDegerlendir(c: EkBaglam, bytes: Buffer, tur: 'rontgen' | 'ekg' | 'foto', deid: DeidGorsel | null): Promise<EkSonuc> {
  const kural = bransKurali(c.bransKey)
  if (kural.engelli) return atlandiSonucu(tur, 'Bu branşta görüntü analizi kapalıdır.')
  const pdfMi = c.meta.fileType === 'application/pdf'
  let gorsel: Parameters<typeof tierAYazVeFuzyonla>[0]['gorsel']
  if (pdfMi) gorsel = { tip: 'pdf', base64: bytes.toString('base64') }
  else if (deid?.base64) {
    const mime = (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(deid.mime) ? deid.mime : 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
    gorsel = { tip: 'image', mime, base64: deid.base64 }
  } else return atlandiSonucu(tur, 'Kimliksizleştirilmiş görüntü gerekli — görselde hasta kimliği olmadığını onaylayın.')

  const ad = c.meta.fileName.toLocaleLowerCase('tr-TR')
  const secilen: Modalite = tur === 'ekg' ? 'ekg' : tur === 'foto' ? 'derm' : pdfMi ? 'pdf_rapor' : /akciğer|akciger|cxr|\bpa\b/.test(ad) ? 'cxr' : 'serbest'
  const { modalite, serbest } = etkinModalite(c.bransKey, secilen)
  const s = await tierAYazVeFuzyonla({
    persona: kural.persona,
    girdi: { brans: kural.ad, modality_final: modalite, yasAy: c.yasAy, cinsiyet: c.cinsiyet, klinikNot: null },
    gorsel, tierB: [], modalite, yasAy: c.yasAy, serbest, doctorId: c.doktorId,
  })
  return goruntuSonucu(tur, s.rapor)
}

const ETIKET_SISTEM = `Sen bir aşı flakonu / kutusu / etiketi okuyucususun. YALNIZ görünen yazıyı aktar; uydurma yok.
Okuyamadığın alanı null yaz ve "okunamayan_alanlar"a ekle. Barkod / karekod görselini ÇÖZMEYE ÇALIŞMA; yalnız yanındaki basılı yazıyı oku.
Tarih YYYY-MM-DD; gün okunmuyorsa null. Kişi adı, T.C. no AKTARMA.
Yalnız JSON: {"etiket": true|false, "asi_adi": string|null, "lot_no": string|null, "skt": "YYYY-MM-DD"|null, "okunamayan_alanlar": string[], "not": string|null}`

const ISO = /^\d{4}-\d{2}-\d{2}$/

async function asiDegerlendir(c: EkBaglam, bytes: Buffer): Promise<EkSonuc> {
  const bugun = bugunTr()
  const ft = c.meta.fileType
  // (a) Barkod metni (kamera/okuyucu): GS1 çözümü + hekimin kendi stok kaydı. Ad bulunamazsa uydurulmaz.
  if (ft === 'text/plain') {
    const ham = bytes.toString('utf8').slice(0, 400).trim()
    const b = barkodBilgisi(ham)
    let asiAdi = ''
    try {
      if (await asiStokModuluAktifMiDoktor(c.sb, c.doktorId)) {
        const t = await barkodTara(c.sb, c.doktorId, ham)
        if (t.bulundu) asiAdi = t.lot.asiAdi
      }
    } catch { asiAdi = '' }
    const satir: EkAsiSatiri = {
      anahtar: 'b1', asiAdi, dozNo: null, uygulamaTarihi: c.ziyaretGunu, lotNo: b.lotNo || null, skt: b.sktIso && ISO.test(b.sktIso) ? b.sktIso : null,
      okunamadi: !asiAdi, neden: asiAdi ? null : 'aşı adı barkoddan belirlenemedi — adı seçin/yazın', hamMetin: ham.slice(0, 120),
      eslesme: 'Takvim dışı aşı', kaynakTuru: 'bu_muayene',
    }
    if (asiAdi) satir.eslesme = karneSatirlariniCevir([{ anahtar: 'x', asiAdi, dozNo: null, uygulamaTarihi: null, okunamadi: false, okunamadiNedeni: null, hamMetin: null }], 'bu_muayene', bugun)[0].eslesme
    return asiSonucu({ satirlar: [satir], bugunIso: bugun })
  }
  const blok = icerikBlogu(c.meta, bytes)
  if (!blok) return hataSonucu('asi', 'Bu dosya biçiminden aşı bilgisi okunamadı.')
  const butce = rotaButcesiMs(EK_ROTA_SURESI_SN)
  // (b) Karne / belge
  try {
    const y = await aiCagir({
      gorev: 'goruntu-inceleme', system: [{ metin: KARNE_SISTEM, onbellek: true }], temperature: 0, doctorId: c.doktorId, butceMs: butce,
      messages: [{ role: 'user', content: [blok, { type: 'text', text: KARNE_KULLANICI_METNI }] }],
    })
    if ((y as { stop_reason?: string | null }).stop_reason === 'max_tokens') return hataSonucu('asi', 'Karne çok uzun — iki parça hâlinde yükleyin.')
    const k = karneYanitiniCoz(yanitMetni(y as { content?: unknown }, '\n'), { bugunIso: bugun, dogumIso: c.dogumIso })
    if (k.asiKarnesiMi && k.satirlar.length) {
      return asiSonucu({ satirlar: karneSatirlariniCevir(k.satirlar, 'karne', bugun), bugunIso: bugun, not: k.not, okunabilirlik: k.okunabilirlik, kimlikUyarisi: karneKimlikUyarisi(k.karneDogumTarihi, c.dogumIso) })
    }
  } catch (e) { if (!(e instanceof KarneOkumaHatasi)) throw e }
  // (c) Flakon / kutu / etiket fotoğrafı
  const y2 = await aiCagir({
    gorev: 'goruntu-inceleme', system: [{ metin: ETIKET_SISTEM, onbellek: true }], temperature: 0, doctorId: c.doktorId, butceMs: butce, jsonBekleniyor: true, maxTokens: 800,
    messages: [{ role: 'user', content: [blok, { type: 'text', text: 'Etiketteki aşı adı, lot ve son kullanma tarihini çıkar. Yalnızca JSON.' }] }],
  })
  const j = jsonAyikla(yanitMetni(y2 as { content?: unknown }, '\n'))
  if (!j || j.etiket === false) return asiSonucu({ satirlar: [], bugunIso: bugun })
  const ad = typeof j.asi_adi === 'string' ? j.asi_adi.trim().slice(0, 120) : ''
  const skt = typeof j.skt === 'string' && ISO.test(j.skt) ? j.skt : null
  const lot = typeof j.lot_no === 'string' ? j.lot_no.trim().slice(0, 60) : null
  const eslesme = ad ? karneSatirlariniCevir([{ anahtar: 'x', asiAdi: ad, dozNo: null, uygulamaTarihi: null, okunamadi: false, okunamadiNedeni: null, hamMetin: null }], 'bu_muayene', bugun)[0].eslesme : 'Takvim dışı aşı'
  return asiSonucu({
    bugunIso: bugun, not: typeof j.not === 'string' ? j.not.slice(0, 200) : null,
    satirlar: [{ anahtar: 'e1', asiAdi: ad, dozNo: null, uygulamaTarihi: c.ziyaretGunu, lotNo: lot, skt, okunamadi: !ad, neden: ad ? null : 'aşı adı okunamadı', hamMetin: null, eslesme, kaynakTuru: 'bu_muayene' }],
  })
}

const GENEL_SISTEM = (epikriz: boolean) => `Sen bir tıbbi belge okuyucususun (${epikriz ? 'epikriz / taburculuk / sevk raporu' : 'genel tıbbi belge'}). YALNIZ belgede yazanı aktar.
Uydurma yok: belgede olmayan tanı, değer, tarih, ilaç yazma; okuyamadığın bölümü "okunamayan" listesine ekle. Kişi adı, T.C. no AKTARMA.
Yalnız JSON: {"belge_turu": string|null, "tarih": "GG.AA.YYYY"|null, "ozet": string, "onemli_bulgular": string[], "ilaclar": string[], "takip": string[], "okunamayan": string[]}`

async function genelDegerlendir(c: EkBaglam, bytes: Buffer, tur: 'epikriz' | 'diger'): Promise<EkSonuc> {
  const ft = c.meta.fileType
  let blok = icerikBlogu(c.meta, bytes)
  if (!blok && (ft === 'text/plain' || /csv/.test(ft))) blok = { type: 'text', text: bytes.toString('utf8').slice(0, 20_000) }
  if (!blok) return atlandiSonucu(tur, 'Bu dosya biçimi için otomatik değerlendirme yok.')
  const y = await aiCagir({
    gorev: 'goruntu-inceleme', system: [{ metin: GENEL_SISTEM(tur === 'epikriz'), onbellek: true }], temperature: 0, doctorId: c.doktorId, jsonBekleniyor: true, maxTokens: 3000,
    butceMs: rotaButcesiMs(EK_ROTA_SURESI_SN),
    messages: [{ role: 'user', content: [blok, { type: 'text', text: 'Belgeyi kurallara göre özetle. Yalnızca JSON.' }] }],
  })
  const j = jsonAyikla(yanitMetni(y as { content?: unknown }, '\n'))
  if (!j) return hataSonucu(tur, 'Belge okunamadı.')
  return genelSonucu(tur, j as GenelBelgeJson)
}

export function hataNedeni(e: unknown): string {
  const m = String((e as { message?: string })?.message || '').toLowerCase()
  if (/timeout|zaman|abort|504|econn|fetch failed|network|429|rate|overload|503|529/.test(m)) return 'Servis şu an yanıt vermedi — yeniden deneyin.'
  return 'Değerlendirilemedi — yeniden deneyin.'
}

export interface DegerlendirSecenek { tur: EkTuru; yeniden?: boolean; deid?: DeidGorsel | null }

/**
 * Tek ekin değerlendirmesi. Önbellek: aynı belge + tür + sürüm + (görüntü ise kimliksiz türev) için kayıtlı SONUÇ varsa
 * AI çağrılmaz; `yeniden: true` açık istek ister. Başarısızlık HER ZAMAN `durum: 'hata'` sonucuna döner (asla fırlatmaz,
 * asla sessizce düşmez, asla uydurma içerik üretmez).
 */
export async function ekiDegerlendir(c: EkBaglam, o: DegerlendirSecenek): Promise<{ sonuc: EkSonuc; onbellekten: boolean }> {
  const tur = o.tur
  try {
    const { bytes } = await downloadDocument({ supabase: c.sb }, c.doktorId, c.meta.id)
    const hash = girdiHash(bytes, tur, o.deid?.base64 ? 'deid' : '')
    const mevcut = await degerlendirmeOku(c.sb, c.doktorId, c.meta.id)
    if (!o.yeniden && mevcut?.sonuc && mevcut.durum === 'tamam' && mevcut.girdiHash === hash && mevcut.tur === tur) {
      return { sonuc: mevcut.sonuc, onbellekten: true }
    }
    const kota = await aiKotaKullan(c.sb, c.doktorId, 'ek')
    if (!kota.izin) return { sonuc: hataSonucu(tur, 'Günlük ek değerlendirme sınırına ulaşıldı.'), onbellekten: false }

    let sonuc: EkSonuc
    switch (tur) {
      case 'lab': sonuc = await labDegerlendir(c, bytes); break
      case 'asi': sonuc = await asiDegerlendir(c, bytes); break
      case 'rontgen': case 'ekg': case 'foto': sonuc = await goruntuDegerlendir(c, bytes, tur, o.deid ?? null); break
      default: sonuc = await genelDegerlendir(c, bytes, tur)
    }
    await degerlendirmeYaz(c.sb, {
      doktorId: c.doktorId, patientId: c.patientId, sessionId: c.sessionId, belgeId: c.meta.id, tur, turGuven: 1,
      durum: sonuc.durum, girdiHash: sonuc.durum === 'tamam' ? hash : null, sonuc,
    })
    return { sonuc, onbellekten: false }
  } catch (e) {
    console.error(`[muayene-ekleri] degerlendirme basarisiz tur=${tur}`)
    return { sonuc: hataSonucu(tur, hataNedeni(e)), onbellekten: false }
  }
}
