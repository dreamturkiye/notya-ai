/**
 * ESNEK-MUAYENE-B4 — fark notu on the server: the previous approved muayene of the patient (this doctor's only) + what the
 * doctor wrote on the kontrol → a full kontrol note DRAFT (changed items highlighted, unchanged stated as unchanged,
 * provenance per sentence, nothing invented). It goes through the normal review / approval path (notOnayla).
 * HASTA-IZOLASYON: patient by hastaSahibiMi (inside kaynakOlustur / before the preview); a hand-note source by id AND
 * doctor_id; the previous note by doctor_id AND the patient's visits; writes carry doctor_id.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PratikRol } from '@/lib/doktor/personelYetki'
import { arsivsizNotlar } from '@/lib/doktor/arsiv'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { denetimYaz, kaynakAl, kaynakOlustur } from '@/lib/elNotu/sunucu'
import { farkNotuBirlestir, farkMetni, farkIzleri, FARK_BOLUMLERI, type FarkSonucu, type SoapBolum } from '@/core/esnek/farkNotu'
import { ozet } from '@/core/elNotu/derleyici'
import type { EsnekMetinleri } from '@/core/esnek/metinTr'
import { genisletici } from './sunucu'

export type OncekiNot = { id: string; tarih: string; alanlar: Record<SoapBolum, string> }

export async function oncekiNot(sb: SupabaseClient, doktorId: string, patientId: string, haricSession?: string | null): Promise<OncekiNot | null> {
  let q = arsivsizNotlar(sb, 'id, created_at, session_id, content_subjektif, content_objektif, content_degerlendirme, content_plan, sessions!inner(patient_id)')
    .eq('doctor_id', doktorId).eq('sessions.patient_id', patientId).not('approved_at', 'is', null)
  if (haricSession) q = q.neq('session_id', haricSession)
  const { data } = await q.order('created_at', { ascending: false }).limit(1)
  const n = (data || [])[0] as Record<string, unknown> | undefined
  if (!n) return null
  return { id: String(n.id), tarih: String(n.created_at), alanlar: { subjektif: String(n.content_subjektif || ''), objektif: String(n.content_objektif || ''), degerlendirme: String(n.content_degerlendirme || ''), plan: String(n.content_plan || '') } }
}

export type FarkOnizleme = { onceki: { id: string; tarih: string }; sonuc: FarkSonucu; metin: Record<SoapBolum, string> }

export async function farkOnizle(sb: SupabaseClient, doktorId: string, patientId: string, fark: string, M: EsnekMetinleri, haricSession?: string | null): Promise<FarkOnizleme | { hata: string; durum: number }> {
  if (!(await hastaSahibiMi(sb, doktorId, patientId))) return { hata: 'Hasta bulunamadı.', durum: 404 }
  const t = String(fark || '').trim().slice(0, 2000)
  if (t.length < 2) return { hata: 'Değişeni yazın.', durum: 400 }
  const onceki = await oncekiNot(sb, doktorId, patientId, haricSession)
  if (!onceki) return { hata: M.fark.oncekiYok, durum: 404 }
  const genislet = await genisletici(sb, doktorId)
  const sonuc = farkNotuBirlestir(onceki.alanlar, t, M.fark.kelimeler, genislet)
  return { onceki: { id: onceki.id, tarih: onceki.tarih }, sonuc, metin: farkMetni(sonuc, M.fark.kelimeler, M.fark.tarih(onceki.tarih)) }
}

/** Create the kontrol visit's draft note. Input: typed change line (+ patient) or a hand-note source already read. */
export async function farkKaydet(sb: SupabaseClient, g: { doktorId: string; aktor: { userId: string; rol: PratikRol }; M: EsnekMetinleri; patientId?: unknown; metin?: unknown; kaynakId?: unknown }): Promise<{ noteId: string; sessionId: string; sayim: FarkSonucu['sayim'] } | { hata: string; durum: number }> {
  let patientId: string, sessionId: string | null = null, kaynakId: string | null = null, isleme = '', fark = ''
  if (g.kaynakId) {
    const k = await kaynakAl(sb, g.doktorId, g.kaynakId)
    if (!k || !k.patient_id || !k.session_id) return { hata: 'Kaynak bulunamadı.', durum: 404 }
    patientId = k.patient_id; sessionId = k.session_id; kaynakId = k.id; isleme = k.isleme_anahtari; fark = String(k.metin || '')
    if (/⟦[^⟧]*⟧/.test(fark)) return { hata: 'Önce doğrulama sorularını cevaplayın.', durum: 409 }
  } else {
    if (typeof g.patientId !== 'string' || !/^[0-9a-f-]{36}$/i.test(g.patientId)) return { hata: 'Hasta gerekli.', durum: 400 }
    patientId = g.patientId; fark = typeof g.metin === 'string' ? g.metin : ''
  }
  const on = await farkOnizle(sb, g.doktorId, patientId, fark, g.M, sessionId)
  if ('hata' in on) return on
  if (!kaynakId) {
    isleme = `${ozet(`${patientId}|${on.onceki.id}`)}${ozet(fark.trim())}`
    const k = await kaynakOlustur(sb, { doktorId: g.doktorId, patientId, tur: 'yazili_not', kanal: 'klavye', isleme, aktor: g.aktor, metin: fark.trim().slice(0, 2000) })
    if ('hata' in k) return k
    kaynakId = k.kaynak.id; sessionId = k.kaynak.session_id
    if (!sessionId) return { hata: 'Muayene açılamadı.', durum: 500 }
  }
  // one draft per visit: an existing draft of this visit is updated, an approved one is never touched
  const { data: var_ } = await arsivsizNotlar(sb, 'id, approved_at').eq('doctor_id', g.doktorId).eq('session_id', sessionId).order('created_at', { ascending: false }).limit(1)
  const mevcut = (var_ || [])[0] as { id: string; approved_at: string | null } | undefined
  if (mevcut?.approved_at) return { hata: 'Bu muayenenin notu onaylanmış.', durum: 409 }
  const m = on.metin
  const govde: Record<string, unknown> = {
    content_subjektif: m.subjektif || null, content_objektif: m.objektif || null, content_degerlendirme: m.degerlendirme || null, content_plan: m.plan || null,
    content_anamnez: m.subjektif || null, content_fizik_muayene: m.objektif || null, content_tani: m.degerlendirme || null, content_tedavi: m.plan || null,
    kaynak_izleri: farkIzleri(on.sonuc),
    kaynak_ozeti: {
      kaynaklar: [{ id: kaynakId, isleme, tur: 'yazili_not' }],
      uretilen: Object.fromEntries(FARK_BOLUMLERI.filter((b) => m[b]).map((b) => [b, ozet(m[b])])),
      fark: { oncekiNot: on.onceki.id, oncekiTarih: on.onceki.tarih, sayim: on.sonuc.sayim },
    },
  }
  let noteId: string
  if (mevcut) {
    const { error } = await sb.from('notes').update(govde).eq('id', mevcut.id).eq('doctor_id', g.doktorId).is('approved_at', null)
    if (error) return { hata: 'Not güncellenemedi.', durum: 500 }
    noteId = mevcut.id
  } else {
    const { data, error } = await sb.from('notes').insert({ ...govde, session_id: sessionId, doctor_id: g.doktorId, note_type: 'soap', ai_confidence: 1, taslak_hazirlayan_user_id: g.aktor.userId, taslak_hazirlayan_rol: g.aktor.rol }).select('id').single()
    if (error || !data) return { hata: 'Not kaydedilemedi.', durum: 500 }
    noteId = String(data.id)
  }
  await sb.from('muayene_kaynaklari').update({ note_id: noteId, durum: 'okundu' }).eq('id', kaynakId).eq('doctor_id', g.doktorId)
  await sb.from('sessions').update({ status: 'completed', ended_at: new Date().toISOString() }).eq('id', sessionId).eq('doctor_id', g.doktorId)
  await denetimYaz(sb, { doktorId: g.doktorId, patientId, noteId, sessionId, kaynakId, eylem: 'taslak', aktor: g.aktor, ayrinti: { fark: true, ...on.sonuc.sayim } })
  return { noteId, sessionId: sessionId!, sayim: on.sonuc.sayim }
}
