/**
 * DIKTE-TIBBI-01 (c) — the doctor's personal dictation vocabulary ("heard → correct" terms).
 *
 * GET    → { ciftler: [{ id, duyulan, dogru, kaynak, sayac, updated_at }] }   (the doctor's own rows only)
 * POST   { duyulan, dogru } → add / update one pair typed by the doctor (terms only: ogren.ciftBicimi)
 * DELETE { id } | ?id=     → remove one of the doctor's pairs
 *
 * hasta-izolasyon: no patient id is taken; every query is scoped by the session's doktorId (row id AND doctor_id on
 * delete). Writes are the doctor's own (sadeceDoktor): a secretary session may read the list the dictation uses.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { ciftBicimi, KISISEL_AZAMI } from '@/lib/dikte/ogren'
import { dikteCiftleriniKaydet } from '@/lib/dikte/sunucu'

export const dynamic = 'force-dynamic'
const TABLO = 'doktor_dikte_sozlugu'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum
  const { data, error } = await supabase
    .from(TABLO)
    .select('id, duyulan, dogru, kaynak, sayac, updated_at')
    .eq('doctor_id', doktorId)
    .order('updated_at', { ascending: false })
    .limit(KISISEL_AZAMI)
  if (error) return NextResponse.json({ ciftler: [] })
  return NextResponse.json({ ciftler: data || [] }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  const body = (await req.json().catch(() => ({}))) as { duyulan?: unknown; dogru?: unknown }
  const cift = ciftBicimi(String(body.duyulan ?? ''), String(body.dogru ?? ''))
  if (!cift) {
    return NextResponse.json({ error: 'Yalnız terim yazılabilir: iki tarafta 1–4 kelime, en fazla 50 harf, rakam yok; sağ/sol, var/yok gibi kelimeler değiştirilemez.' }, { status: 400 })
  }
  const n = await dikteCiftleriniKaydet(supabase, doktorId, [cift], 'elle')
  if (!n) return NextResponse.json({ error: `Kaydedilemedi (sözlükte en fazla ${KISISEL_AZAMI} terim olabilir).` }, { status: 409 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  const body = (await req.json().catch(() => ({}))) as { id?: unknown }
  const id = String(body.id ?? new URL(req.url).searchParams.get('id') ?? '')
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Geçersiz kayıt.' }, { status: 400 })
  const { error } = await supabase.from(TABLO).delete().eq('id', id).eq('doctor_id', doktorId)
  if (error) return NextResponse.json({ error: 'Silinemedi.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
