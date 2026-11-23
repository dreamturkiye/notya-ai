/**
 * ESNEK-MUAYENE-A — Muayene Derleyici on the server: a visit's note from ANY mix of sources, with or without a transcript.
 *
 * - Sources = the visit's muayene_kaynaklari (hand-note pages, typed note, secretary upload) + the transcript when there
 *   is one (one source among others).
 * - Output goes through the existing downstream unchanged: soapNotuUret (the doctor's style / rules learning, ICD-10,
 *   reçete taslağı, dose and invention locks), the advisory in the background, the existing note row (→ MBYS copy package,
 *   portal after approval). e-Reçete stays the doctor's e-imza.
 * - Provenance per sentence (notes.kaynak_izleri), conflicts as Doğrula questions (never auto-resolved), proposed patient
 *   file updates (notes.kaynak_ozeti.dosyaOnerileri) each confirmed by the doctor.
 * - Idempotent per source: a source already in the note changes nothing; a LATE source regenerates and replaces only the
 *   sections its type may change, never a section someone edited by hand (that one gets a suggestion instead).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PratikRol } from '@/lib/doktor/personelYetki'
import { seansSahibi } from '@/lib/doktor/hastaSahipligi'
import { modelSec } from '@/lib/ai/modeller'
import { ETKILEDIGI_ALANLAR, SOAP_ALANLARI, bolumleriBirlestir, ozet, type DerlemeKaynagi, type KaynakTuru, type SoapAlani } from '@/core/elNotu/derleyici'
import type { ElNotuMetinleri } from '@/core/elNotu/metinTr'
import { denetimYaz } from './sunucu'

export type KaynakOzeti = {
  kaynaklar: { id: string; isleme: string; tur: KaynakTuru }[]
  /** fingerprint of each section exactly as generated — differs later = edited by hand. */
  uretilen: Partial<Record<SoapAlani, string>>
  celiskiler?: unknown[]
  dosyaOnerileri?: unknown[]
  oneriler?: { alan: SoapAlani; metin: string }[]
}

const KOLON: Record<SoapAlani, string> = { subjektif: 'content_subjektif', objektif: 'content_objektif', degerlendirme: 'content_degerlendirme', plan: 'content_plan' }

/** The visit's sources as compiler input (+ the transcript, when given or stored on the session). */
export async function kaynaklariHazirla(sb: SupabaseClient, doktorId: string, sessionId: string, metin: ElNotuMetinleri, transcript?: string | null): Promise<DerlemeKaynagi[]> {
  const { data } = await sb.from('muayene_kaynaklari').select('id, tur, metin, sayfa_sayisi, isleme_anahtari, created_at, durum').eq('doctor_id', doktorId).eq('session_id', sessionId).neq('durum', 'iptal').order('created_at', { ascending: true })
  const liste: DerlemeKaynagi[] = []
  const t = (transcript || '').trim()
  if (t && t !== 'Transkript mevcut değil') liste.push({ id: `transkript-${sessionId}`, tur: 'transkript', baslik: metin.derle.kaynakTuru.transkript, metin: t, isleme: `t-${ozet(t)}` })
  for (const k of data || []) {
    const m = String(k.metin || '').trim()
    if (!m) continue
    const tur = (['el_notu', 'yazili_not', 'belge', 'sekreter_yukleme'].includes(String(k.tur)) ? k.tur : 'el_notu') as KaynakTuru
    liste.push({ id: String(k.id), tur, baslik: `${metin.derle.kaynakTuru[tur]}${k.sayfa_sayisi ? ` (${k.sayfa_sayisi} ${metin.sayfalar})` : ''}`, metin: m, isleme: String(k.isleme_anahtari) })
  }
  return liste
}

export type DerleSonucu = { noteId: string; yeni: boolean; degisti: boolean; celiski: number; dosyaOnerisi: number }

export async function muayeneDerle(sb: SupabaseClient, g: {
  doktorId: string; sessionId: string; aktor: { userId: string; rol: PratikRol }; metin: ElNotuMetinleri; transcript?: string | null
}): Promise<DerleSonucu | { hata: string; durum: number }> {
  const seans = await seansSahibi(sb, g.doktorId, g.sessionId)
  if (!seans) return { hata: 'Muayene bulunamadı.', durum: 404 }
  const { data: sRow } = await sb.from('sessions').select('specialty, transcript_cleaned, started_at').eq('id', g.sessionId).eq('doctor_id', g.doktorId).maybeSingle()
  const kaynaklar = await kaynaklariHazirla(sb, g.doktorId, g.sessionId, g.metin, g.transcript ?? (sRow?.transcript_cleaned as string | null) ?? null)
  if (!kaynaklar.length) return { hata: 'Bu muayenenin okunmuş bir kaynağı yok.', durum: 400 }

  const { data: taslaklar } = await sb.from('notes').select('id, approved_at, kaynak_ozeti, content_subjektif, content_objektif, content_degerlendirme, content_plan').eq('doctor_id', g.doktorId).eq('session_id', g.sessionId).order('created_at', { ascending: false }).limit(1)
  const mevcut = taslaklar?.[0] as (Record<string, unknown> & { id: string; approved_at: string | null; kaynak_ozeti: KaynakOzeti | null }) | undefined
  if (mevcut?.approved_at) return { hata: 'Bu muayenenin notu onaylanmış; yeni kaynak eklenemez.', durum: 409 }
  const oncekiOzet: KaynakOzeti | null = mevcut?.kaynak_ozeti || null
  const bilinen = new Set((oncekiOzet?.kaynaklar || []).map((k) => k.isleme))
  const yeniKaynaklar = kaynaklar.filter((k) => !bilinen.has(k.isleme))
  if (mevcut && !yeniKaynaklar.length) return { noteId: String(mevcut.id), yeni: false, degisti: false, celiski: 0, dosyaOnerisi: 0 }

  const specialty = String(sRow?.specialty || 'genel')
  const hastaId = seans.patient_id ? String(seans.patient_id) : null
  const { hekimAdi, hekimBransi } = await import('@/lib/doktor/hekimAdi')
  const { hastaDogumIso } = await import('@/lib/specialties/kapsamSunucu')
  const { soapNotuUret, stilOrnekleriDerle } = await import('@/lib/doktor/soapUret')
  const { arsivsizNotlar } = await import('@/lib/doktor/arsiv')
  let klinikBaglam = '', stilOrnekleri = '', stilProfili = ''
  let doktorKurallari: { slug: string; satir: string }[] = []
  const [doktorAdi, doktorBransi, dogumIso] = await Promise.all([
    hekimAdi(sb, g.doktorId), hekimBransi(sb, g.doktorId), hastaDogumIso(sb, g.doktorId, hastaId),
    (async () => { try { if (hastaId) { const { hastaDosyasiniDerle } = await import('@/lib/doktor/hastaDosyaDerleyici'); const d = await hastaDosyasiniDerle(sb, g.doktorId, hastaId); if (d) klinikBaglam = d.split('## VİZİT GEÇMİŞİ')[0].slice(0, 4000) } } catch { /* bağlamsız da not üretilir */ } })(),
    (async () => { try { const { data } = await arsivsizNotlar(sb, 'content_subjektif, content_plan').eq('doctor_id', g.doktorId).not('approved_at', 'is', null).order('created_at', { ascending: false }).limit(2); if (data?.length) stilOrnekleri = stilOrnekleriDerle(data) } catch { /* stil örneği kritik değil */ } })(),
    (async () => { try { const { hafizaYukle, hafizaBloguNot } = await import('@/lib/doktor/hafiza'); stilProfili = hafizaBloguNot(await hafizaYukle(sb, g.doktorId)); const { uygulanirKurallariYukle } = await import('@/lib/doktor/ogrenme/kuralKaydet'); doktorKurallari = await uygulanirKurallariYukle(sb, g.doktorId) } catch { /* profil kritik değil */ } })(),
  ])
  const tumMetin = kaynaklar.map((k) => k.metin).join('\n')
  const oneri: { soz?: Promise<import('@/lib/doktor/soapUret').SoapOnerisi | null> } = {}
  const not = await soapNotuUret({
    transcript: tumMetin, kaynaklar, specialty, klinikBaglam, stilOrnekleri, stilProfili, doktorKurallari, doktorAdi, doktorBransi, hastaDogumIso: dogumIso, doctorId: g.doktorId,
  }, { oneriAyri: (s) => { oneri.soz = s } })
  const yeniSoap: Partial<Record<SoapAlani, string>> = {}
  for (const a of SOAP_ALANLARI) { const v = not.soap?.[a]; if (typeof v === 'string' && v.trim()) yeniSoap[a] = v }

  let soap = yeniSoap
  let oneriler: { alan: SoapAlani; metin: string }[] = []
  if (mevcut) {
    const alanlar = [...new Set(yeniKaynaklar.flatMap((k) => ETKILEDIGI_ALANLAR[k.tur]))]
    const elle = new Set<SoapAlani>(SOAP_ALANLARI.filter((a) => { const v = mevcut[KOLON[a]]; const u = oncekiOzet?.uretilen?.[a]; return typeof v === 'string' && v && u !== undefined && ozet(v) !== u }))
    const eski: Partial<Record<SoapAlani, string | null>> = Object.fromEntries(SOAP_ALANLARI.map((a) => [a, (mevcut[KOLON[a]] as string | null) ?? null]))
    const b = bolumleriBirlestir(eski, yeniSoap, alanlar, elle)
    soap = b.soap; oneriler = [...(oncekiOzet?.oneriler || []), ...b.oneriler]
  }
  const ozetYeni: KaynakOzeti = {
    kaynaklar: kaynaklar.map((k) => ({ id: k.id, isleme: k.isleme, tur: k.tur })),
    uretilen: Object.fromEntries(SOAP_ALANLARI.filter((a) => soap[a]).map((a) => [a, ozet(soap[a]!)])),
    celiskiler: not.celiskiler || [], dosyaOnerileri: not.dosyaOnerileri || [], oneriler,
  }
  const govde: Record<string, unknown> = {
    content_subjektif: soap.subjektif || null, content_objektif: soap.objektif || null, content_degerlendirme: soap.degerlendirme || null, content_plan: soap.plan || null,
    content_anamnez: soap.subjektif || null, content_fizik_muayene: soap.objektif || null, content_tani: soap.degerlendirme || null, content_tedavi: soap.plan || null,
    content_ilaclar: not.ilaclar || null, icd10_codes: not.icd10_codes || null, takip_suresi: not.takip_suresi || null, basvuru_yakinmasi: not.basvuruYakinmasi || null,
    vitaller: not.vitaller || null, uygulanan_kurallar: not.uygulananKurallar || [], ai_model: modelSec('soap').model, ai_confidence: not.ai_confidence || 0.9,
    kaynak_izleri: not.kaynakIzleri || null, kaynak_ozeti: ozetYeni,
  }
  let noteId: string
  if (mevcut) {
    const { error } = await sb.from('notes').update(govde).eq('id', mevcut.id).eq('doctor_id', g.doktorId).is('approved_at', null)
    if (error) return { hata: 'Not güncellenemedi.', durum: 500 }
    noteId = String(mevcut.id)
  } else {
    const { data, error } = await sb.from('notes').insert({
      ...govde, session_id: g.sessionId, doctor_id: g.doktorId, note_type: 'soap', taslak_hazirlayan_user_id: g.aktor.userId, taslak_hazirlayan_rol: g.aktor.rol,
      ...(sRow?.started_at ? { created_at: sRow.started_at } : {}),
    }).select('id').single()
    if (error || !data) return { hata: 'Not kaydedilemedi.', durum: 500 }
    noteId = String(data.id)
  }
  // conflicts → doctor's Doğrula questions on this note (kaynak_id = note id); idempotent per topic
  const celiskiler = not.celiskiler || []
  if (celiskiler.length) {
    await sb.from('okuma_dogrulamalari').upsert(celiskiler.map((c) => ({
      doctor_id: g.doktorId, patient_id: hastaId, kaynak_id: noteId, soru_anahtari: `c-${ozet(c.konu)}`, sinif: 'celiski', okunan: c.konu,
      adaylar: c.secenekler.map((s) => `${s.deger}`), kutu: { alan: c.alan, kaynaklar: c.secenekler.map((s) => s.kaynak) }, durum: 'acik', sayfa: 0,
    })), { onConflict: 'doctor_id,kaynak_id,soru_anahtari', ignoreDuplicates: true })
  }
  const elKaynaklari = kaynaklar.filter((k) => k.tur !== 'transkript').map((k) => k.id)
  if (elKaynaklari.length) await sb.from('muayene_kaynaklari').update({ note_id: noteId }).eq('doctor_id', g.doktorId).eq('session_id', g.sessionId).in('id', elKaynaklari)
  await sb.from('sessions').update({ status: 'completed', ended_at: new Date().toISOString() }).eq('id', g.sessionId).eq('doctor_id', g.doktorId)
  if (oneri.soz) {
    const { oneriyiArkaPlandaYaz } = await import('@/lib/doktor/oneriArkaPlan')
    oneriyiArkaPlandaYaz(sb, { noteId, doktorId: g.doktorId, oneriSozu: oneri.soz, aiMetni: (x: string) => x, etiket: 'el-notu/derle' })
  }
  if (hastaId) { try { const { onbellekKirlet } = await import('@/lib/doktor/ogrenme/dosyaOnbellek'); void onbellekKirlet(sb, g.doktorId, hastaId).catch(() => undefined) } catch { /* önbellek */ } }
  await denetimYaz(sb, { doktorId: g.doktorId, patientId: hastaId, noteId, sessionId: g.sessionId, eylem: 'taslak', aktor: g.aktor, ayrinti: { kaynak: kaynaklar.length, yeniKaynak: yeniKaynaklar.length, gec: Boolean(mevcut) } })
  return { noteId, yeni: !mevcut, degisti: true, celiski: celiskiler.length, dosyaOnerisi: (not.dosyaOnerileri || []).length }
}

/**
 * sessions/end with hand-note sources next to the transcript: after the note row is written by the classic path, record
 * its provenance / source summary, open the conflict questions and link the sources (same bookkeeping as muayeneDerle).
 */
export async function notaKaynaklariBagla(sb: SupabaseClient, g: {
  doktorId: string; sessionId: string; noteId: string; hastaId: string | null; kaynaklar: DerlemeKaynagi[]
  not: { soap?: Partial<Record<SoapAlani, string>>; kaynakIzleri?: unknown; celiskiler?: { konu: string; alan: SoapAlani; secenekler: { deger: string; kaynak: string }[] }[]; dosyaOnerileri?: unknown[] }
  aktor: { userId: string; rol: PratikRol }
}): Promise<void> {
  const soap = g.not.soap || {}
  const ozetYeni: KaynakOzeti = {
    kaynaklar: g.kaynaklar.map((k) => ({ id: k.id, isleme: k.isleme, tur: k.tur })),
    uretilen: Object.fromEntries(SOAP_ALANLARI.filter((a) => soap[a]).map((a) => [a, ozet(String(soap[a]))])),
    celiskiler: g.not.celiskiler || [], dosyaOnerileri: g.not.dosyaOnerileri || [], oneriler: [],
  }
  await sb.from('notes').update({ kaynak_izleri: g.not.kaynakIzleri || null, kaynak_ozeti: ozetYeni, taslak_hazirlayan_user_id: g.aktor.userId, taslak_hazirlayan_rol: g.aktor.rol }).eq('id', g.noteId).eq('doctor_id', g.doktorId)
  const celiskiler = g.not.celiskiler || []
  if (celiskiler.length) {
    await sb.from('okuma_dogrulamalari').upsert(celiskiler.map((c) => ({
      doctor_id: g.doktorId, patient_id: g.hastaId, kaynak_id: g.noteId, soru_anahtari: `c-${ozet(c.konu)}`, sinif: 'celiski', okunan: c.konu,
      adaylar: c.secenekler.map((s) => s.deger), kutu: { alan: c.alan, kaynaklar: c.secenekler.map((s) => s.kaynak) }, durum: 'acik', sayfa: 0,
    })), { onConflict: 'doctor_id,kaynak_id,soru_anahtari', ignoreDuplicates: true })
  }
  const ids = g.kaynaklar.filter((k) => k.tur !== 'transkript').map((k) => k.id)
  if (ids.length) await sb.from('muayene_kaynaklari').update({ note_id: g.noteId }).eq('doctor_id', g.doktorId).eq('session_id', g.sessionId).in('id', ids)
  await denetimYaz(sb, { doktorId: g.doktorId, patientId: g.hastaId, noteId: g.noteId, sessionId: g.sessionId, eylem: 'taslak', aktor: g.aktor, ayrinti: { kaynak: g.kaynaklar.length } })
}
