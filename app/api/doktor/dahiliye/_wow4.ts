/**
 * NOTYA-DAH-WOW W4.2 — bakım kalitesi dürtmeleri sunucu katmanı. GET: son tarama tarihleri + nudge listesi. POST: nudge (frail|dusme|phq2) | kbteknik.
 */
import { NextResponse } from 'next/server'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { nudgeListesi, frailSkoru, dusmeRiski, phq2Skoru, KB_TEKNIK, FRAIL_SORULAR, DUSME_SORULAR, PHQ2_SORULAR, PHQ2_SECENEK } from '@/specialties/dahiliye/engines/nudge'
import type { Sb } from './_ortak'

type Hasta = { id: string; yas: number | null; kadin: boolean }

export async function wow4Verisi(sb: Sb, hasta: Hasta, sonKb: { hedefteMi?: boolean; teknik_onay?: boolean | null } | null, kronikKart: boolean, T: string) {
  const { data } = await sb.from('dahiliye_taramalar').select('id, tip, skor, pozitif, not_metni, nota_eklendi_at, created_at').eq('patient_id', hasta.id).order('created_at', { ascending: false }).limit(30)
  const son = (tip: string) => (data || []).find((x) => x.tip === tip) || null
  const tarih = (tip: string) => { const r = son(tip); return r ? String(r.created_at).slice(0, 10) : null }
  const nudgeler = nudgeListesi({ yas: hasta.yas, kronikKart, sonFrail: tarih('frail'), sonDusme: tarih('dusme'), sonPhq2: tarih('phq2'), kbHedefDisi: sonKb?.hedefteMi === false, kbTeknikOnay: sonKb?.teknik_onay !== false, bugun: T })
  return { nudgeler, son: { frail: son('frail'), dusme: son('dusme'), phq2: son('phq2') }, sorular: { kbTeknik: KB_TEKNIK, frail: FRAIL_SORULAR, dusme: DUSME_SORULAR, phq2: PHQ2_SORULAR, phq2Secenek: PHQ2_SECENEK } }
}
export type Wow4Veri = Awaited<ReturnType<typeof wow4Verisi>>

export async function wow4Post(adim: string, b: Record<string, unknown>, sb: Sb, userId: string, hasta: Hasta): Promise<NextResponse | null> {
  if (adim === 'nudge') {
    const tip = String(b.tip || '')
    const c = (b.cevaplar || {}) as Record<string, unknown>
    let skor: number, pozitif: boolean, not: string, cevaplar: Record<string, unknown>
    if (tip === 'frail') { cevaplar = Object.fromEntries(FRAIL_SORULAR.map((q) => [q.kod, !!c[q.kod]])); const r = frailSkoru(cevaplar as Record<string, boolean>); skor = r.skor; pozitif = r.sinif === 'kirilgan'; not = `FRAIL ${r.skor}/5 (${r.sinif.replace('_', '-')}): ${r.not}` }
    else if (tip === 'dusme') { cevaplar = Object.fromEntries(DUSME_SORULAR.map((q) => [q.kod, !!c[q.kod]])); const r = dusmeRiski(cevaplar as Record<string, boolean>); skor = Object.values(cevaplar).filter(Boolean).length; pozitif = r.pozitif; not = `Düşme taraması ${r.pozitif ? 'pozitif' : 'negatif'}: ${r.not}` }
    else if (tip === 'phq2') { cevaplar = Object.fromEntries(PHQ2_SORULAR.map((q) => [q.kod, Math.max(0, Math.min(3, Number(c[q.kod]) || 0))])); const r = phq2Skoru(cevaplar as Record<string, number>); skor = r.skor; pozitif = r.pozitif; not = `PHQ-2 ${r.skor}/6: ${r.not}` }
    else return NextResponse.json({ error: 'Tarama tipi geçersiz' }, { status: 400 })
    const { error } = await sb.from('dahiliye_taramalar').insert({ patient_id: hasta.id, doctor_id: userId, tip, cevaplar, skor, pozitif, not_metni: not })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // Hekim kilidi kuralı: sonuç nota otomatik yazılmaz; hekim "Nota ekle" ile ekler (adım notaekle).
    return NextResponse.json({ ok: true, skor, pozitif, not })
  }
  if (adim === 'notaekle') {
    const { data: t } = await sb.from('dahiliye_taramalar').select('id, not_metni').eq('patient_id', hasta.id).eq('tip', String(b.tip || '')).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (!t?.not_metni) return NextResponse.json({ error: 'Tarama sonucu yok' }, { status: 404 })
    const r = await gununNotunaEkle(sb, userId, hasta.id, `${t.not_metni} (tarama — tanı değildir; hekim ekledi)`)
    if (!r.eklendi) return NextResponse.json({ error: `Nota eklenemedi: ${r.sebep || ''}` }, { status: 409 })
    // Yalnız bu sonuç işaretlenir: NudgeBar "Nota ekle" CTA'sını gizler; yeni tarama kaydı yine CTA ile gelir.
    const simdi = new Date().toISOString()
    await sb.from('dahiliye_taramalar').update({ nota_eklendi_at: simdi }).eq('id', t.id)
    return NextResponse.json({ ok: true, notaEklendiAt: simdi, notId: r.notId }) // NOTYA-MUAYENEYE-DON-01
  }
  if (adim === 'kbteknik') {
    const liste = (Array.isArray(b.liste) ? b.liste : []).map(String).filter((x) => KB_TEKNIK.includes(x))
    const zorunlu = KB_TEKNIK.slice(0, 6)
    const onay = zorunlu.every((x) => liste.includes(x))
    const { data: son } = await sb.from('dahiliye_ht').select('id').eq('patient_id', hasta.id).order('tarih', { ascending: false }).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (!son) return NextResponse.json({ error: 'Önce KB girin' }, { status: 400 })
    const { error } = await sb.from('dahiliye_ht').update({ teknik_onay: onay, teknik_liste: liste }).eq('id', son.id).eq('doctor_id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return onay ? NextResponse.json({ ok: true, onay }) : NextResponse.json({ error: `Ölçüm tekniği eksik: ${zorunlu.filter((x) => !liste.includes(x)).join('; ')}` }, { status: 409 })
  }
  return null
}
