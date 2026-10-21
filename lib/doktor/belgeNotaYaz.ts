/**
 * NOTYA-BELGE-OTO-01 — server side of the standard document workflow: evaluated documents are written into the muayene note
 * in ONE write per note (batch), without a per-document approval step. Idempotent per document id (see core/belgeler/notaBlok).
 * Never creates sessions/notes: when no target note exists the document is left in Belgeler (reported as `not_yok`).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { MODALITE_TR, type Modalite } from '@/core/belgeler/ontoloji'
import type { BelgeRaporu } from '@/core/belgeler/types'
import { notaBloklariUygula, type BlokDili, type BlokGirdi } from '@/core/belgeler/notaBlok'
import { arsivsizNotlar, arsivsizSeanslar } from '@/lib/doktor/arsiv'

export type YazimDurumu = 'eklendi' | 'degisti' | 'ayni' | 'not_yok' | 'kalite_dusuk' | 'lab_atlandi' | 'bulunamadi'

export function ulkeDili(ulke: string | undefined = process.env.NOTYA_COUNTRY): BlokDili {
  const k = (ulke || 'tr').toLowerCase()
  return k === 'tr' ? 'tr' : k === 'uz' ? 'ru' : 'en'
}

type Analiz = { id: string; belge_id: string | null; patient_id: string; note_id: string | null; sonuc: BelgeRaporu | null; hekim_tanisi: { ad: string; icd10?: string | null }[] | null; hekim_ozet: string | null; modality_final: string; durum: string; olusturuldu: string }

export async function belgeleriNotaYaz(sb: SupabaseClient, doktorId: string, analizIds: string[], dil: BlokDili = ulkeDili()): Promise<{ sonuclar: { analizId: string; durum: YazimDurumu; noteId?: string }[]; yazimSayisi: number }> {
  const ids = Array.from(new Set(analizIds.filter((x) => typeof x === 'string' && x))).slice(0, 24)
  const sonuclar: { analizId: string; durum: YazimDurumu; noteId?: string }[] = []
  if (!ids.length) return { sonuclar, yazimSayisi: 0 }
  const { data: analizler } = await sb.from('belge_analizleri').select('id, belge_id, patient_id, note_id, sonuc, hekim_tanisi, hekim_ozet, modality_final, durum, olusturuldu').in('id', ids).eq('doctor_id', doktorId)
  const liste = (analizler || []) as Analiz[]
  const belgeIdler = liste.map((a) => a.belge_id).filter((x): x is string => !!x)
  const { data: belgeler } = belgeIdler.length ? await sb.from('medical_documents').select('id, visit_id, created_at').in('id', belgeIdler).eq('doctor_id', doktorId) : { data: [] as { id: string; visit_id: string | null; created_at: string }[] }
  const belgeMap = new Map((belgeler || []).map((b) => [b.id, b]))

  // Upload order = document creation order.
  const sirali = [...liste].sort((a, b) => Date.parse(belgeMap.get(a.belge_id || '')?.created_at || a.olusturuldu) - Date.parse(belgeMap.get(b.belge_id || '')?.created_at || b.olusturuldu))
  const notGruplari = new Map<string, { analiz: Analiz; sira: number }[]>()
  const sonNotOnbellek = new Map<string, string | null>()

  for (const [sira, a] of sirali.entries()) {
    if (!a.sonuc) { sonuclar.push({ analizId: a.id, durum: 'bulunamadi' }); continue }
    if (a.durum === 'kalite_dusuk') { sonuclar.push({ analizId: a.id, durum: 'kalite_dusuk' }); continue }
    if (a.modality_final === 'lab') { sonuclar.push({ analizId: a.id, durum: 'lab_atlandi' }); continue } // lab has its own panel flow
    let noteId = a.note_id || null
    const visitId = belgeMap.get(a.belge_id || '')?.visit_id
    if (!noteId && visitId) {
      const { data: z } = await arsivsizSeanslar(sb, 'id').eq('id', visitId).eq('doctor_id', doktorId).eq('patient_id', a.patient_id).maybeSingle()
      if (z) { const { data: n } = await arsivsizNotlar(sb, 'id').eq('session_id', (z as { id: string }).id).eq('doctor_id', doktorId).maybeSingle(); noteId = (n as { id: string } | null)?.id || null }
    }
    if (!noteId) {
      if (!sonNotOnbellek.has(a.patient_id)) {
        const { data: son } = await arsivsizNotlar(sb, 'id, sessions!inner(patient_id)').eq('doctor_id', doktorId).eq('sessions.patient_id', a.patient_id).order('created_at', { ascending: false }).limit(1).maybeSingle()
        sonNotOnbellek.set(a.patient_id, (son as { id: string } | null)?.id || null)
      }
      noteId = sonNotOnbellek.get(a.patient_id) || null
    }
    if (!noteId) { sonuclar.push({ analizId: a.id, durum: 'not_yok' }); continue }
    notGruplari.set(noteId, [...(notGruplari.get(noteId) || []), { analiz: a, sira }])
  }

  let yazimSayisi = 0
  for (const [noteId, grup] of notGruplari) {
    const { data: not } = await sb.from('notes').select('id, content_objektif').eq('id', noteId).eq('doctor_id', doktorId).maybeSingle()
    if (!not) { for (const g of grup) sonuclar.push({ analizId: g.analiz.id, durum: 'not_yok' }); continue }
    const girdiler: BlokGirdi[] = grup.map(({ analiz: a, sira }) => {
      const r = a.sonuc as BelgeRaporu
      return {
        belgeId: a.belge_id || a.id,
        etiket: MODALITE_TR[a.modality_final as Modalite] || a.modality_final,
        tarih: new Date(a.olusturuldu).toLocaleDateString(dil === 'tr' ? 'tr-TR' : dil === 'ru' ? 'ru-RU' : 'en-GB'),
        yuklemeSirasi: sira,
        ozet: a.hekim_ozet || r.ozet,
        bulgular: r.bulgular || [],
        hekimTanisi: (a.hekim_tanisi || []).map((t) => (t.icd10 ? `${t.ad} (${t.icd10})` : t.ad)),
        acil: !!r.acil_bayrak,
      }
    })
    const onceki = (not as { content_objektif: string | null }).content_objektif || ''
    const uy = notaBloklariUygula(onceki, girdiler, dil)
    if (uy.degisti) {
      const { error } = await sb.from('notes').update({ content_objektif: uy.metin }).eq('id', noteId)
      if (error) { for (const g of grup) sonuclar.push({ analizId: g.analiz.id, durum: 'not_yok' }); continue }
      yazimSayisi++
      await Promise.all([
        sb.from('not_duzenlemeleri').insert({ note_id: noteId, doctor_id: doktorId, alan: 'objektif', onceki: onceki.slice(0, 2000), sonraki: uy.metin.slice(0, 2000) }),
        sb.from('muayene_revizyonlar').insert({ note_id: noteId, doctor_id: doktorId, kaynak: 'belge_analizi', kaynak_id: grup[0].analiz.id, alan: 'objektif', onceki, sonraki: uy.metin }),
      ])
    }
    const islemMap = new Map(uy.islemler.map((i) => [i.belgeId, i.islem]))
    for (const g of grup) {
      sonuclar.push({ analizId: g.analiz.id, durum: islemMap.get(g.analiz.belge_id || g.analiz.id) || 'ayni', noteId })
      await sb.from('belge_analizleri').update({ durum: 'onaylandi', note_id: noteId, onaylandi_at: new Date().toISOString(), guncellendi: new Date().toISOString() }).eq('id', g.analiz.id)
    }
  }
  return { sonuclar, yazimSayisi }
}
