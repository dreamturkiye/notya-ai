/**
 * AU-MKT-06 / AU-LAUNCH-01 — APP 12 EXPORT: one patient's data, as one JSON document the doctor can hand to the patient.
 * Server only. Every read carries the doctor's id (the same readers the screens use), so a patient or note that is not
 * this doctor's is simply absent: `hastaVerisi` answers null and nothing else is read.
 *
 * WHAT IS IN IT (and nothing is invented): the patient record, every visit with its transcript and note (drafts are
 * marked as drafts), appointments, consent records, and the patient's own privacy requests. WHAT IS NOT: attached files
 * and photos (kept in storage), intake-form answers, portal messages and invoices. They are named in `notIncluded` so the
 * document never reads as complete when it is not.
 *
 * Initial compliance draft – external legal review later. Not a statement that APP 12 is met.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { hastaGetir, type Hasta } from '../uygulama/hastalar'
import { hastaninMuayeneleri } from '../uygulama/muayeneler'
import { notGetir } from '../uygulama/notlar'
import { hastaninRandevulari } from '../uygulama/randevular'
import { ulkeTablosu } from '../uygulama/tablolar'
import { hastaninTalepleri } from './talep'
import type { NotIcerigi } from '../tipler'

/** Categories this export does not carry yet. Listed in the document itself, so it can never pass for the whole record. */
export const DISA_AKTARMADA_YOK = [
  'Files and photographs attached to visits or kept in the photo archive',
  'Answers to intake forms',
  'Messages exchanged through the patient page',
  'Invoices',
] as const

export type DisaAktarilanNot = { noteId: string; status: 'approved' | 'draft'; approvedAt: string | null; language: string; content: NotIcerigi; addendum: string }
export type DisaAktarilanVizit = { visitId: string; startedAt: string; transcript: string; note: DisaAktarilanNot | null }
export type DisaAktarma = {
  document: 'Notya patient data export'
  generatedAt: string
  /** What the export covers; not a finding that the request is fully answered. */
  notIncluded: readonly string[]
  patient: Pick<Hasta, 'ad' | 'otaIsmi' | 'dogumTarihi' | 'cinsiyet' | 'telefon' | 'dil' | 'ulusalKimlik' | 'olusturuldu'>
  visits: DisaAktarilanVizit[]
  appointments: { start: string; end: string; type: string; status: string; reason: string }[]
  consents: { version: string; source: string; givenAt: string; withdrawnAt: string | null }[]
  privacyRequests: { type: string; status: string; receivedAt: string; due: string; detail: string; response: string; answeredAt: string | null }[]
}

/** The document, from what was read. Pure: no database, no clock but `simdi`. */
export function disaAktarmaOlustur(g: {
  hasta: Hasta; vizitler: DisaAktarilanVizit[]
  randevular: { baslangic: string; bitis: string; tur: string; durum: string; neden: string }[]
  rizalar: { surum: string; kaynak: string; verildiAt: string; geriCekildiAt: string | null }[]
  talepler: { tur: string; durum: string; alindiAt: string; sonTarih: string; ayrinti: string; yanit: string; yanitlandiAt: string | null }[]
  simdi?: number
}): DisaAktarma {
  const h = g.hasta
  return {
    document: 'Notya patient data export',
    generatedAt: new Date(g.simdi ?? Date.now()).toISOString(),
    notIncluded: DISA_AKTARMADA_YOK,
    patient: { ad: h.ad, otaIsmi: h.otaIsmi, dogumTarihi: h.dogumTarihi, cinsiyet: h.cinsiyet, telefon: h.telefon, dil: h.dil, ulusalKimlik: h.ulusalKimlik, olusturuldu: h.olusturuldu },
    visits: g.vizitler,
    appointments: g.randevular.map((r) => ({ start: r.baslangic, end: r.bitis, type: r.tur, status: r.durum, reason: r.neden })),
    consents: g.rizalar.map((r) => ({ version: r.surum, source: r.kaynak, givenAt: r.verildiAt, withdrawnAt: r.geriCekildiAt })),
    privacyRequests: g.talepler.map((t) => ({ type: t.tur, status: t.durum, receivedAt: t.alindiAt, due: t.sonTarih, detail: t.ayrinti, response: t.yanit, answeredAt: t.yanitlandiAt })),
  }
}

/** The patient's export, or null when this doctor has no such patient (a foreign id answers like a missing one). */
export async function hastaVerisi(supabase: SupabaseClient, doktorId: string, hastaId: string, simdi = Date.now()): Promise<DisaAktarma | null> {
  const hasta = await hastaGetir(supabase, doktorId, hastaId)
  if (!hasta) return null
  const ozetler = (await hastaninMuayeneleri(supabase, doktorId, hastaId)) ?? []
  const vizitler: DisaAktarilanVizit[] = []
  for (const o of ozetler) {
    const not = o.notId ? await notGetir(supabase, doktorId, o.notId) : null
    vizitler.push({
      visitId: o.seansId,
      startedAt: o.baslangic,
      transcript: not?.muayene.metin ?? '',
      note: not ? { noteId: not.notId, status: not.onayli ? 'approved' : 'draft', approvedAt: not.onayTarihi, language: not.dil, content: not.icerik, addendum: not.ekMetin } : null,
    })
  }
  const randevular = (await hastaninRandevulari(supabase, doktorId, hastaId, simdi)) ?? []
  const { data: rizaSatirlari } = await ulkeTablosu(supabase, 'ulke_riza_kayitlari').select('surum, kaynak, verildi_at, geri_cekildi_at').eq('doctor_id', doktorId).eq('patient_id', hastaId).order('verildi_at', { ascending: false }).limit(200)
  const rizalar = ((rizaSatirlari as { surum: string; kaynak: string; verildi_at: string; geri_cekildi_at: string | null }[] | null) ?? []).map((r) => ({ surum: r.surum, kaynak: r.kaynak, verildiAt: r.verildi_at, geriCekildiAt: r.geri_cekildi_at }))
  const talepler = await hastaninTalepleri(supabase, doktorId, hastaId)
  return disaAktarmaOlustur({ hasta, vizitler, randevular, rizalar, talepler, simdi })
}
