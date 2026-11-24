/**
 * ESNEK-MUAYENE-A — server half of El Notu (service-role client; EVERY query scoped by the practice's doktorId —
 * hasta-izolasyon). Callers: app/api/doktor/el-notu/*, app/api/sessions/[id]/end, the note approve path.
 *
 * Access model (Kaan, requirement 2 + 3):
 *  - the doctor: everything;
 *  - staff with 'elnotu.hazirla' (sekreter, asistan): ingest pages, answer READING questions, edit a hand-note draft —
 *    only when the doctor chose "el notlarımı sekreterim hazırlasın";
 *  - staff with 'elnotu.kesinlestir' (sekreter): finalize a hand-note draft — only when, in addition, the doctor turned
 *    "hekim onayı gerekli" OFF; otherwise the draft goes to the doctor's "Onay bekleyen notlar" queue.
 *  - e-Reçete is never reachable here (doctor e-imza, Türkiye legal mechanic).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { izinVarMi, type PratikRol } from '@/lib/doktor/personelYetki'
import { hastaSahibiMi, seansSahibi } from '@/lib/doktor/hastaSahipligi'
import { uploadDocument, downloadDocument } from '@/lib/vault/service'
import type { HafizaOrnegi, Sablon, SozlukGirdisi, CizimBolgesi, Kutu } from '@/core/elNotu/tipler'
import { kelimeDagarcigi } from '@/core/elNotu/hafiza'
import { anahtar as sozlukAnahtari } from '@/core/elNotu/sozluk'

/** golgeModu (ESNEK-MUAYENE-B1): shadow mode lets staff with 'elnotu.hazirla' upload pages even when the doctor prepares his own notes. */
export type ElNotuAyari = { hekimOnayiGerekli: boolean; hazirlayan: 'doktor' | 'sekreter'; tabanDk: number | null; golgeModu?: boolean }
export const VARSAYILAN_AYAR: ElNotuAyari = { hekimOnayiGerekli: true, hazirlayan: 'doktor', tabanDk: null, golgeModu: false }

export async function ayarYukle(sb: SupabaseClient, doktorId: string): Promise<ElNotuAyari> {
  let { data, error } = await sb.from('esnek_muayene_ayarlari').select('hekim_onayi_gerekli, el_notu_hazirlayan, taban_dakika_not, golge_modu').eq('doctor_id', doktorId).maybeSingle()
  // a database without migration 203 (no golge_modu column) still reads the Phase A preferences
  if (error) ({ data, error } = await sb.from('esnek_muayene_ayarlari').select('hekim_onayi_gerekli, el_notu_hazirlayan, taban_dakika_not').eq('doctor_id', doktorId).maybeSingle())
  if (error || !data) return { ...VARSAYILAN_AYAR }
  return {
    hekimOnayiGerekli: data.hekim_onayi_gerekli !== false,
    hazirlayan: data.el_notu_hazirlayan === 'sekreter' ? 'sekreter' : 'doktor',
    tabanDk: data.taban_dakika_not != null ? Number(data.taban_dakika_not) : null,
    golgeModu: (data as { golge_modu?: boolean }).golge_modu === true,
  }
}

export const ELNOTU_YETKI_YOK = 'Bu işlem için yetkiniz yok.'

/** In-route gate (the route table in personelYetki also gates asistan / hasta_danismani by path). */
export function elNotuErisimi(rol: PratikRol, ayar: ElNotuAyari, eylem: 'hazirla' | 'kesinlestir'): NextResponse | null {
  if (rol === 'doktor') return null
  const yetki = eylem === 'hazirla' ? 'elnotu.hazirla' : 'elnotu.kesinlestir'
  const izin = izinVarMi(rol, yetki) && (eylem === 'hazirla' ? ayar.hazirlayan === 'sekreter' || ayar.golgeModu === true : ayar.hazirlayan === 'sekreter' && !ayar.hekimOnayiGerekli)
  return izin ? null : NextResponse.json({ error: ELNOTU_YETKI_YOK }, { status: 403 })
}

/** Can this actor finalize (vs. send to the doctor)? Pure decision, also used by the UI through GET /ayar. */
export function kesinlestirebilirMi(rol: PratikRol, ayar: ElNotuAyari): boolean {
  if (rol === 'doktor') return true
  return izinVarMi(rol, 'elnotu.kesinlestir') && ayar.hazirlayan === 'sekreter' && !ayar.hekimOnayiGerekli
}

export type KaynakSatiri = {
  id: string; doctor_id: string; patient_id: string | null; session_id: string | null; note_id: string | null
  tur: string; kanal: string; durum: string; sayfa_sayisi: number; maskeli_belge_ids: string[]; orijinal_belge_ids: string[]
  okuma: Record<string, unknown> | null; metin: string | null; acik_dogrula: number; korumali_acik: number
  isleme_anahtari: string; ziyaret_tarihi: string | null; ekleyen_user_id: string; ekleyen_rol: string; created_at: string; sablon_id: string | null
}

export async function kaynakAl(sb: SupabaseClient, doktorId: string, kaynakId: unknown): Promise<KaynakSatiri | null> {
  if (typeof kaynakId !== 'string' || !/^[0-9a-f-]{36}$/i.test(kaynakId)) return null
  const { data } = await sb.from('muayene_kaynaklari').select('*').eq('id', kaynakId).eq('doctor_id', doktorId).maybeSingle()
  return (data as KaynakSatiri) || null
}

/**
 * A source for a patient's visit. Idempotent on (doctor, isleme anahtarı): the same pages uploaded twice give the same
 * source. With no session id, a visit is opened for the patient dated to `ziyaretTarihi` (NOTYA-GECMIS-MUAYENE-01: past
 * only, ≤ 10 years) with its protokol number, so the note lands on the right day.
 */
export async function kaynakOlustur(sb: SupabaseClient, g: {
  doktorId: string; patientId: string; sessionId?: string | null; tur: 'el_notu' | 'yazili_not' | 'sekreter_yukleme'
  kanal: 'kamera' | 'dosya' | 'tarayici' | 'gelen_belge' | 'toplu' | 'klavye'; isleme: string; ziyaretTarihi?: string | null
  aktor: { userId: string; rol: PratikRol }; specialty?: string | null; gelenBelgeId?: string | null; metin?: string | null
}): Promise<{ kaynak: KaynakSatiri; yeni: boolean } | { hata: string; durum: number }> {
  if (!(await hastaSahibiMi(sb, g.doktorId, g.patientId))) return { hata: 'Hasta bulunamadı.', durum: 404 }
  const { data: var_ } = await sb.from('muayene_kaynaklari').select('*').eq('doctor_id', g.doktorId).eq('isleme_anahtari', g.isleme).maybeSingle()
  if (var_) {
    if (var_.patient_id !== g.patientId) return { hata: 'Bu sayfalar başka bir hastaya dosyalanmış.', durum: 409 }
    return { kaynak: var_ as KaynakSatiri, yeni: false }
  }
  let sessionId: string | null = null
  if (g.sessionId) {
    const s = await seansSahibi(sb, g.doktorId, g.sessionId)
    if (!s || String(s.patient_id) !== g.patientId) return { hata: 'Muayene bulunamadı.', durum: 404 }
    sessionId = g.sessionId
  } else {
    const { protokolNumarasiAta } = await import('@/lib/doktor/protokolNo')
    const protokol = await protokolNumarasiAta(sb, g.doktorId)
    if (!protokol) return { hata: 'Protokol numarası oluşturulamadı.', durum: 500 }
    let tarih: string | null = null
    if (g.ziyaretTarihi) {
      const t = new Date(g.ziyaretTarihi)
      if (!Number.isNaN(t.getTime()) && t.getTime() <= Date.now() + 60000 && t.getTime() > Date.now() - 10 * 365 * 86400000) tarih = t.toISOString()
    }
    let specialty = g.specialty || null
    if (!specialty) { const { data: u } = await sb.from('users').select('specialty').eq('id', g.doktorId).maybeSingle(); specialty = (u?.specialty as string) || 'genel' }
    const { data: s, error } = await sb.from('sessions').insert({
      doctor_id: g.doktorId, patient_id: g.patientId, specialty, session_type: 'muayene', status: 'recording',
      protokol_no: protokol.protokolNo, protokol_scope_id: protokol.scopeId, ...(tarih ? { started_at: tarih } : {}),
    }).select('id').single()
    if (error || !s) return { hata: 'Muayene açılamadı.', durum: 500 }
    sessionId = String(s.id)
  }
  const { data, error } = await sb.from('muayene_kaynaklari').insert({
    doctor_id: g.doktorId, patient_id: g.patientId, session_id: sessionId, tur: g.tur, kanal: g.kanal, durum: g.metin ? 'okundu' : 'bekliyor',
    isleme_anahtari: g.isleme, ziyaret_tarihi: g.ziyaretTarihi || null, ekleyen_user_id: g.aktor.userId, ekleyen_rol: g.aktor.rol,
    gelen_belge_id: g.gelenBelgeId || null, metin: g.metin || null,
  }).select('*').single()
  if (error || !data) return { hata: 'Kaynak kaydedilemedi.', durum: 500 }
  await denetimYaz(sb, { doktorId: g.doktorId, patientId: g.patientId, sessionId, kaynakId: String(data.id), eylem: 'kaynak_eklendi', aktor: g.aktor, ayrinti: { tur: g.tur, kanal: g.kanal } })
  return { kaynak: data as KaynakSatiri, yeni: true }
}

export async function denetimYaz(sb: SupabaseClient, g: {
  doktorId: string; patientId?: string | null; noteId?: string | null; sessionId?: string | null; kaynakId?: string | null
  eylem: 'kaynak_eklendi' | 'taslak' | 'dogrulama' | 'duzenleme' | 'kesinlestirme' | 'hekim_onayi' | 'hekime_gonderildi' | 'iade'
  aktor: { userId: string; rol: PratikRol }; ayrinti?: Record<string, unknown>
}): Promise<void> {
  try {
    await sb.from('muayene_not_denetimi').insert({
      doctor_id: g.doktorId, patient_id: g.patientId ?? null, note_id: g.noteId ?? null, session_id: g.sessionId ?? null, kaynak_id: g.kaynakId ?? null,
      eylem: g.eylem, user_id: g.aktor.userId, rol: g.aktor.rol, ayrinti: g.ayrinti ?? null,
    })
  } catch { /* the audit write never blocks the action; failures are visible in logs */ console.error('[el-notu] denetim yazılamadı') }
}

export async function vaultaYaz(sb: SupabaseClient, g: { doktorId: string; patientId: string; sessionId: string | null; ad: string; mime: string; base64: string; kategori: string; yukleyen: string }): Promise<string> {
  const meta = await uploadDocument({ supabase: sb }, {
    doctorId: g.doktorId, patientId: g.patientId, visitId: g.sessionId, fileName: g.ad, fileType: g.mime,
    bytes: Buffer.from(g.base64, 'base64'), category: g.kategori, uploadedBy: g.yukleyen,
  })
  return meta.id
}

export async function sozlukYukle(sb: SupabaseClient, doktorId: string): Promise<SozlukGirdisi[]> {
  const { data } = await sb.from('hekim_el_sozlugu').select('kisaltma, anlam').eq('doctor_id', doktorId).order('sayac', { ascending: false }).limit(500)
  return (data || []).map((r) => ({ kisaltma: String(r.kisaltma), anlam: String(r.anlam), kaynak: 'hekim' as const, baglam: 'kelime' as const }))
}

export async function sozlugeEkle(sb: SupabaseClient, doktorId: string, kisaltma: string, anlam: string, kaynak: 'dogrulama' | 'elle', brans?: string | null): Promise<boolean> {
  const k = kisaltma.trim().slice(0, 24), a = anlam.trim().replace(/\s+/g, ' ').slice(0, 80)
  if (!k || !a) return false
  const anah = sozlukAnahtari(k).slice(0, 24)
  const { data: var_ } = await sb.from('hekim_el_sozlugu').select('id, sayac').eq('doctor_id', doktorId).eq('kisaltma_anahtar', anah).maybeSingle()
  if (var_) {
    await sb.from('hekim_el_sozlugu').update({ anlam: a, sayac: Number(var_.sayac || 1) + 1, son_kullanim: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', var_.id).eq('doctor_id', doktorId)
    return true
  }
  const { error } = await sb.from('hekim_el_sozlugu').insert({ doctor_id: doktorId, kisaltma: k, kisaltma_anahtar: anah, anlam: a, kaynak, brans: brans ?? null })
  return !error
}

/** The doctor's memory (descriptors only; crops are fetched for the few examples actually used). */
export async function hafizaYukle(sb: SupabaseClient, doktorId: string): Promise<HafizaOrnegi[]> {
  const { data } = await sb.from('hekim_el_yazisi_hafizasi').select('id, metin, tanimlayici, en_boy, korumali, kirpinti_belge_id').eq('doctor_id', doktorId).order('created_at', { ascending: false }).limit(1500)
  return (data || []).map((r) => ({ id: String(r.id), metin: String(r.metin), tanimlayici: (r.tanimlayici as number[]) || [], enBoy: Number(r.en_boy) || 1, korumali: Boolean(r.korumali), gorsel: undefined, _belge: r.kirpinti_belge_id ? String(r.kirpinti_belge_id) : null } as HafizaOrnegi & { _belge: string | null }))
}

/** Crops (masked, from the vault) for the chosen examples. A crop that cannot be read is simply not sent. */
export async function ornekGorselleri(sb: SupabaseClient, doktorId: string, ornekler: (HafizaOrnegi & { _belge?: string | null })[]): Promise<HafizaOrnegi[]> {
  return Promise.all(ornekler.map(async (o) => {
    if (!o._belge) return o
    try {
      const { meta, bytes } = await downloadDocument({ supabase: sb }, doktorId, o._belge)
      if (meta.category !== 'el_notu_kirpinti') return o
      return { ...o, gorsel: { mime: meta.fileType, base64: bytes.toString('base64') } }
    } catch { return o }
  }))
}

export async function hafizayaEkle(sb: SupabaseClient, g: {
  doktorId: string; patientId: string; sessionId: string | null; kaynakId: string; metin: string; okunan: string
  tanimlayici: number[]; enBoy: number; kirpinti: { mime: string; base64: string } | null; korumali: boolean; sinif: 'kelime' | 'satir' | 'sembol'
  aktor: { userId: string; rol: PratikRol }
}): Promise<void> {
  if (!Array.isArray(g.tanimlayici) || g.tanimlayici.length < 16 || g.tanimlayici.length > 512 || !g.tanimlayici.every((x) => Number.isFinite(x))) return
  let belge: string | null = null
  if (g.kirpinti && g.kirpinti.base64.length < 400_000 && /^image\/(jpeg|png|webp)$/.test(g.kirpinti.mime)) {
    try { belge = await vaultaYaz(sb, { doktorId: g.doktorId, patientId: g.patientId, sessionId: g.sessionId, ad: `el-notu-kirpinti-${randomUUID().slice(0, 8)}.jpg`, mime: g.kirpinti.mime, base64: g.kirpinti.base64, kategori: 'el_notu_kirpinti', yukleyen: g.aktor.userId }) } catch { belge = null }
  }
  await sb.from('hekim_el_yazisi_hafizasi').insert({
    doctor_id: g.doktorId, patient_id: g.patientId, kaynak_id: g.kaynakId, sinif: g.sinif, metin: g.metin.slice(0, 160), okunan: g.okunan.slice(0, 160),
    tanimlayici: g.tanimlayici, en_boy: g.enBoy, kirpinti_belge_id: belge, korumali: g.korumali, onaylayan_user_id: g.aktor.userId, onaylayan_rol: g.aktor.rol,
  })
}

/** Vocabulary of the doctor's own approved notes (last 80), never another doctor's. */
export async function dagarcikYukle(sb: SupabaseClient, doktorId: string): Promise<Map<string, number>> {
  const { data } = await sb.from('notes').select('content_subjektif, content_objektif, content_degerlendirme, content_plan').eq('doctor_id', doktorId).not('approved_at', 'is', null).order('created_at', { ascending: false }).limit(80)
  return kelimeDagarcigi((data || []).map((n) => [n.content_subjektif, n.content_objektif, n.content_degerlendirme, n.content_plan].filter(Boolean).join('\n')))
}

/**
 * ESNEK-READER-2 — texts the reader learns this doctor's outline from (core/elNotu/anahat.ts): his sources whose every
 * Doğrula question is answered (confirmed readings) and the secretary's typed notes from shadow mode (tur 'yazili_not').
 * Scoped by doctor_id (hasta-izolasyon); text only, the latest 40.
 */
export async function anahatMetinleri(sb: SupabaseClient, doktorId: string): Promise<string[]> {
  const { data } = await sb.from('muayene_kaynaklari').select('metin, tur, durum, acik_dogrula').eq('doctor_id', doktorId).not('metin', 'is', null).order('updated_at', { ascending: false }).limit(60)
  return (data || []).filter((r) => r.tur === 'yazili_not' || (r.durum === 'okundu' && Number(r.acik_dogrula || 0) === 0)).map((r) => String(r.metin || '')).slice(0, 40)
}

export async function sorulmusKisaltmalar(sb: SupabaseClient, doktorId: string): Promise<Set<string>> {
  const { data } = await sb.from('okuma_dogrulamalari').select('soru_anahtari').eq('doctor_id', doktorId).eq('sinif', 'kisaltma').limit(2000)
  return new Set((data || []).map((r) => String(r.soru_anahtari)))
}

const kutuMu = (k: unknown): k is Kutu => !!k && typeof k === 'object' && ['x0', 'y0', 'x1', 'y1'].every((a) => Number.isFinite((k as Record<string, number>)[a]))

export function sablonSatiri(r: Record<string, unknown>): Sablon {
  return {
    id: String(r.id), ad: String(r.ad), tur: r.tur === 'serbest' ? 'serbest' : 'formlu', brans: (r.brans as string) || null, enBoy: Number(r.en_boy) || 0.7071,
    baslikBolgeleri: (Array.isArray(r.baslik_bolgeleri) ? r.baslik_bolgeleri : []).filter(kutuMu),
    cizimBolgeleri: (Array.isArray(r.cizim_bolgeleri) ? r.cizim_bolgeleri : []).filter((c: CizimBolgesi) => c && kutuMu(c.kutu)) as CizimBolgesi[],
    parmakIzi: Array.isArray(r.parmak_izi) ? (r.parmak_izi as number[]) : null,
  }
}

export async function sablonlarYukle(sb: SupabaseClient, doktorId: string): Promise<Sablon[]> {
  const { data } = await sb.from('el_notu_sablonlari').select('*').eq('doctor_id', doktorId).eq('aktif', true).order('kullanim', { ascending: false }).limit(30)
  return (data || []).map((r) => sablonSatiri(r as Record<string, unknown>))
}

export async function sureYaz(sb: SupabaseClient, g: { doktorId: string; patientId?: string | null; sessionId?: string | null; noteId?: string | null; kaynakId?: string | null; aktor: { userId: string; rol: PratikRol }; asama: 'yakalama' | 'dogrulama' | 'duzenleme' | 'onay' | 'kayit'; sureMs: number }): Promise<void> {
  const ms = Math.round(Number(g.sureMs))
  if (!Number.isFinite(ms) || ms <= 0 || ms > 3600000) return
  await sb.from('dokumantasyon_sureleri').insert({
    doctor_id: g.doktorId, patient_id: g.patientId ?? null, session_id: g.sessionId ?? null, note_id: g.noteId ?? null, kaynak_id: g.kaynakId ?? null,
    user_id: g.aktor.userId, rol: g.aktor.rol, asama: g.asama, sure_ms: ms,
  })
}

/** A note built (also) from hand-note / typed-note sources — the only notes a secretary may open (MOBIL-PERSONEL-04 kept). */
export const elNotuTaslagiMi = (oz: { kaynaklar?: { tur: string }[] } | null | undefined) => Boolean(oz?.kaynaklar?.some((k) => k.tur !== 'transkript'))

/** Display names of the doctor's own patients (decrypted server-side; foreign ids simply have no name). */
export async function hastaAdlari(sb: SupabaseClient, doktorId: string, ids: string[]): Promise<Map<string, string>> {
  const tekil = [...new Set(ids.filter(Boolean))].slice(0, 200)
  if (!tekil.length) return new Map()
  const { decrypt } = await import('@/lib/security/encryption')
  const { data } = await sb.from('patients').select('id, name_encrypted').eq('doctor_id', doktorId).in('id', tekil)
  const m = new Map<string, string>()
  for (const h of data || []) {
    try { const v = decrypt(String(h.name_encrypted)); let ad = v; try { ad = String(JSON.parse(v).ad || v) } catch { /* düz metin */ } m.set(String(h.id), ad) } catch { /* çözülemedi */ }
  }
  return m
}
