/**
 * NOTYA-BELGE-01 — Onayla / Muayeneyi onayla.
 * adim='onayla'          : doctor locked the resmi tanı and summary → append the report block to the LAST muayene's
 *                          SOAP Objective (notes.content_objektif), log to not_duzenlemeleri (the note learning log)
 *                          and muayene_revizyonlar; analiz.durum='onaylandi', note_id set.
 * adim='muayene_onayla'  : doctor edited the Plan → notes.content_plan updated with revision; analiz locked.
 * The engine output never writes the note by itself; every write here is a doctor action.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { UYARI_SERIDI } from '@/core/belgeler/yazar'
import { MODALITE_TR, type Modalite } from '@/core/belgeler/ontoloji'
import type { BelgeRaporu } from '@/core/belgeler/types'

export const dynamic = 'force-dynamic'

function labBlogu(a: { sonuc: BelgeRaporu & { lab?: { kritik?: string[]; yeni_bozulanlar?: string[]; duzelenler?: string[] } }; hekim_tanisi: { ad: string; icd10?: string | null }[]; hekim_ozet: string | null; olusturuldu: string }, panel: { lab_adi: string | null; numune_tarihi: string | null } | null, satirlar: { raw_name: string; canonical_key: string | null; value_num: number | null; value_text: string | null; unit: string | null; flag: string; kritik: boolean }[]): string {
  // Locked format (Kaan spec): [Lab] {lab_adi} — numune {date} — onay {ts} / Özet (hekim) / Resmi tanı / Anormal / AI taslağı arşivde
  const r = a.sonuc
  const anormal = satirlar.filter((s) => s.flag === 'H' || s.flag === 'L' || s.flag === 'critical').map((s) => `${s.raw_name} ${s.value_num ?? s.value_text ?? ''} ${s.unit || ''}${s.flag === 'critical' ? ' KRİTİK' : s.flag === 'H' ? ' ↑' : ' ↓'}`.trim())
  const satirlarMetin = [
    `[Lab] ${panel?.lab_adi || 'Laboratuvar'} — numune ${panel?.numune_tarihi ? new Date(panel.numune_tarihi).toLocaleDateString('tr-TR') : '—'} — onay ${new Date().toLocaleString('tr-TR')}`,
    `Özet (hekim): ${(a.hekim_ozet || r.ozet || '').trim()}`,
    `Resmi tanı: ${(a.hekim_tanisi || []).map((t) => t.icd10 ? `${t.ad} (${t.icd10})` : t.ad).join(', ') || '—'}`,
    `Anormal: ${anormal.length ? anormal.join('; ') : 'yok'}`,
  ]
  if (r.acil_bayrak) satirlarMetin.push('⚠ Kritik değer işaretlendi — hekim değerlendirdi.')
  satirlarMetin.push(`AI taslağı arşivde. ${UYARI_SERIDI}`)
  return satirlarMetin.join('\n')
}

function raporBlogu(a: { sonuc: BelgeRaporu; hekim_tanisi: { ad: string; icd10?: string | null }[]; hekim_ozet: string | null; modality_final: string; olusturuldu: string }): string {
  const r = a.sonuc
  const tarih = new Date(a.olusturuldu).toLocaleDateString('tr-TR')
  const satirlar = [
    `— Belge değerlendirmesi (${MODALITE_TR[a.modality_final as Modalite] || a.modality_final}, ${tarih}) —`,
    (a.hekim_ozet || r.ozet || '').trim(),
  ]
  if (r.bulgular?.length) satirlar.push('Bulgular: ' + r.bulgular.join('; '))
  if (a.hekim_tanisi?.length) satirlar.push('Hekim tanısı: ' + a.hekim_tanisi.map((t) => t.icd10 ? `${t.ad} (${t.icd10})` : t.ad).join(', '))
  if (r.acil_bayrak) satirlar.push('⚠ Acil bayrak: değerlendirmede kırmızı bayrak bulgu işaretlendi.')
  satirlar.push(`Motorlar: ${(r.engines_used || []).join(', ')}. ${UYARI_SERIDI}`)
  return satirlar.filter(Boolean).join('\n')
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const body = (await req.json().catch(() => null)) as { analizId?: string; adim?: 'onayla' | 'muayene_onayla'; plan?: string; noteId?: string } | null
  if (!body?.analizId || !body.adim) return NextResponse.json({ error: 'analizId ve adim gerekli' }, { status: 400 })

  const { data: a } = await supabase.from('belge_analizleri').select('id, patient_id, note_id, sonuc, hekim_tanisi, hekim_ozet, modality_final, durum, olusturuldu').eq('id', body.analizId).eq('doctor_id', user.id).maybeSingle()
  if (!a || !a.sonuc) return NextResponse.json({ error: 'Analiz bulunamadı' }, { status: 404 })
  if (a.durum === 'kalite_dusuk') return NextResponse.json({ error: 'Kalitesi düşük değerlendirme muayeneye eklenemez.' }, { status: 409 })

  if (body.adim === 'onayla') {
    if (!Array.isArray(a.hekim_tanisi) || a.hekim_tanisi.length === 0) return NextResponse.json({ error: 'Önce resmi tanıyı kilitleyin (en az bir hekim tanısı).' }, { status: 400 })
    // Target muayene: explicit noteId, else the patient's latest note
    let noteId = body.noteId || a.note_id || null
    if (!noteId) {
      const { data: son } = await supabase.from('notes').select('id, sessions!inner(patient_id)').eq('doctor_id', user.id).eq('sessions.patient_id', a.patient_id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      noteId = son?.id || null
    }
    if (!noteId) return NextResponse.json({ error: 'Bu hastanın muayene notu yok. Önce bir muayene notu oluşturun.' }, { status: 409 })
    const { data: not } = await supabase.from('notes').select('id, content_objektif').eq('id', noteId).eq('doctor_id', user.id).maybeSingle()
    if (!not) return NextResponse.json({ error: 'Muayene notu bulunamadı' }, { status: 404 })
    let blok: string
    if (a.modality_final === 'lab') {
      const { data: panel } = await supabase.from('lab_paneller').select('id, lab_adi, numune_tarihi').eq('analiz_id', a.id).maybeSingle()
      const { data: satirlar } = panel ? await supabase.from('lab_satirlar').select('raw_name, canonical_key, value_num, value_text, unit, flag, kritik').eq('panel_id', panel.id).order('sira') : { data: [] }
      blok = labBlogu(a as never, panel, (satirlar || []).map((s) => ({ ...s, value_num: s.value_num == null ? null : Number(s.value_num) })))
      // Approved rows become this patient's priors for future trend comparison (only APPROVED labs are ever compared)
      if (panel) await Promise.all([
        supabase.from('lab_satirlar').update({ onayli: true }).eq('panel_id', panel.id),
        supabase.from('lab_paneller').update({ durum: 'onaylandi', updated_at: new Date().toISOString() }).eq('id', panel.id),
      ])
    } else blok = raporBlogu(a as never)
    const onceki = not.content_objektif || ''
    if (onceki.includes(blok.split('\n')[0])) return NextResponse.json({ ok: true, noteId, zaten: true })
    const sonraki = onceki ? `${onceki.trimEnd()}\n\n${blok}` : blok
    const { error } = await supabase.from('notes').update({ content_objektif: sonraki }).eq('id', noteId)
    if (error) return NextResponse.json({ error: 'Nota yazılamadı' }, { status: 500 })
    await Promise.all([
      supabase.from('not_duzenlemeleri').insert({ note_id: noteId, doctor_id: user.id, alan: 'objektif', onceki: onceki.slice(0, 2000), sonraki: sonraki.slice(0, 2000) }),
      supabase.from('muayene_revizyonlar').insert({ note_id: noteId, doctor_id: user.id, kaynak: 'belge_analizi', kaynak_id: a.id, alan: 'objektif', onceki, sonraki }),
      supabase.from('belge_revizyonlar').insert({ analiz_id: a.id, doctor_id: user.id, alan: 'onay', onceki: null, sonraki: { noteId } }),
      supabase.from('belge_analizleri').update({ durum: 'onaylandi', note_id: noteId, onaylandi_at: new Date().toISOString(), guncellendi: new Date().toISOString() }).eq('id', a.id),
    ])
    return NextResponse.json({ ok: true, noteId })
  }

  // muayene_onayla — Plan edit + lock
  const noteId = a.note_id
  if (!noteId) return NextResponse.json({ error: 'Önce raporu onaylayın (Onayla).' }, { status: 409 })
  const { data: not } = await supabase.from('notes').select('id, content_plan').eq('id', noteId).eq('doctor_id', user.id).maybeSingle()
  if (!not) return NextResponse.json({ error: 'Muayene notu bulunamadı' }, { status: 404 })
  const yeniPlan = typeof body.plan === 'string' ? body.plan.slice(0, 8000) : not.content_plan || ''
  if (yeniPlan !== (not.content_plan || '')) {
    const { error } = await supabase.from('notes').update({ content_plan: yeniPlan }).eq('id', noteId)
    if (error) return NextResponse.json({ error: 'Plan yazılamadı' }, { status: 500 })
    await Promise.all([
      supabase.from('not_duzenlemeleri').insert({ note_id: noteId, doctor_id: user.id, alan: 'plan', onceki: (not.content_plan || '').slice(0, 2000), sonraki: yeniPlan.slice(0, 2000) }),
      supabase.from('muayene_revizyonlar').insert({ note_id: noteId, doctor_id: user.id, kaynak: 'belge_analizi', kaynak_id: a.id, alan: 'plan', onceki: not.content_plan || '', sonraki: yeniPlan }),
    ])
  }
  await Promise.all([
    supabase.from('belge_revizyonlar').insert({ analiz_id: a.id, doctor_id: user.id, alan: 'muayene_onay', onceki: null, sonraki: { noteId } }),
    supabase.from('belge_analizleri').update({ durum: 'muayene_onaylandi', guncellendi: new Date().toISOString() }).eq('id', a.id),
    a.modality_final === 'lab' ? supabase.from('lab_paneller').update({ durum: 'muayene_onaylandi', updated_at: new Date().toISOString() }).eq('analiz_id', a.id) : Promise.resolve(),
  ])
  return NextResponse.json({ ok: true, noteId })
}
