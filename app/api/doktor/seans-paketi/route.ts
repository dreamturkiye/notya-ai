/**
 * NOTYA-PAKET-01 / NOTYA-SUT-01 — paket oku, gerekçeli yine de yaz, e-Nabız işareti.
 * Başka doktorun notu 404. Sekreter 403. Tablo yoksa kapalı, 500 yok.
 * Bu rota ilaç listesini değiştirmez.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { decryptPII } from '@/lib/security/encryption'
import { tabloYokMu, hastaAdiCoz } from '@/lib/iletisim/sunucu'
import { sutKurallari, kopyaKilitliMi, kapiModu, gerekceGecerli } from '@/lib/seansPaketi/sutKurallari'
import { mbysMetni, enabizDosyasi } from '@/lib/seansPaketi/mbys'
import { type SeansPaketGovde } from '@/lib/seansPaketi/tip'
import { bosGovde } from '@/lib/seansPaketi/doldur'

export const dynamic = 'force-dynamic'

function govdeCoz(ham: unknown): SeansPaketGovde | null {
  try { return JSON.parse(decryptPII(String(ham || ''))) as SeansPaketGovde } catch { return null }
}

async function plan(sb: { from: (t: string) => any }, doktorId: string): Promise<string | null> {
  try {
    const { data, error } = await sb.from('users').select('subscription_tier').eq('id', doktorId).maybeSingle()
    if (error) return null
    return data?.subscription_tier ? String(data.subscription_tier) : null
  } catch { return null }
}

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const noteId = req.nextUrl.searchParams.get('noteId') || ''
  const hastaId = req.nextUrl.searchParams.get('hastaId') || ''
  const sb = oturum.supabase
  if (hastaId && !noteId) {
    const { data: hasta, error } = await sb.from('patients').select('id, enabiz_gonderilmesin').eq('id', hastaId).eq('doctor_id', oturum.doktorId).maybeSingle()
    if (error && tabloYokMu(error)) return NextResponse.json({ kaydedilebilir: false, istemiyor: null })
    if (!hasta) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
    return NextResponse.json({ kaydedilebilir: true, istemiyor: hasta.enabiz_gonderilmesin === true })
  }
  if (!noteId) return NextResponse.json({ error: 'Not gerekli.' }, { status: 400 })
  const { data: not } = await sb.from('notes').select('id, approved_at').eq('id', noteId).eq('doctor_id', oturum.doktorId).maybeSingle()
  if (!not) return NextResponse.json({ error: 'Not bulunamadı.' }, { status: 404 })
  const { data: paket, error } = await sb.from('seans_paketleri').select('id, patient_id, durum, json_encrypted, uyari_gecildi, kaynak').eq('doctor_id', oturum.doktorId).eq('note_id', noteId).maybeSingle()
  if (error) {
    if (tabloYokMu(error)) return NextResponse.json({ kapali: true, kapi: 'kapali', sut: [], kopyaKilit: false, mbys: null, enabiz: null })
    return NextResponse.json({ error: 'Paket okunamadı.' }, { status: 503 })
  }
  const tier = await plan(sb, oturum.doktorId)
  const kapi = kapiModu(tier)
  if (kapi === 'kapali') return NextResponse.json({ kapali: false, kapi, sut: [], kopyaKilit: false, mbys: null, enabiz: null })
  const govde = paket ? govdeCoz(paket.json_encrypted) : bosGovde()
  const sut = govde ? sutKurallari(govde, { onayli: Boolean(not.approved_at) && Boolean(paket) }) : []
  const goster = kapi === 'sari' ? sut.filter((u) => u.seviye !== 'kirmizi') : sut
  const kilit = kapi === 'tam' && kopyaKilitliMi(tier, sut, Boolean(paket?.uyari_gecildi))
  let mbys: string | null = null
  let enabiz: unknown = null
  if (govde && paket && (paket.durum === 'hekim_onayli' || paket.durum === 'kopyalandi_mbys')) {
    const { data: hasta } = await sb.from('patients').select('name_encrypted').eq('id', paket.patient_id).eq('doctor_id', oturum.doktorId).maybeSingle()
    const ad = hastaAdiCoz(hasta?.name_encrypted)
    const tarih = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long', year: 'numeric' })
    mbys = mbysMetni(govde, { tarih, hastaAd: ad })
    enabiz = enabizDosyasi(govde, { hastaAd: ad, hastaId: String(paket.patient_id) })
  }
  return NextResponse.json({ kapali: false, kapi, sut: goster, kopyaKilit: kilit, mbys, enabiz })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const b = (await req.json().catch(() => null)) as { islem?: string; noteId?: string; hastaId?: string; gerekce?: string; istemiyor?: boolean } | null
  if (!b?.islem) return NextResponse.json({ error: 'Eksik istek.' }, { status: 400 })
  const sb = oturum.supabase

  if (b.islem === 'izin') {
    if (!b.hastaId) return NextResponse.json({ error: 'Hasta gerekli.' }, { status: 400 })
    const { data: hasta } = await sb.from('patients').select('id').eq('id', b.hastaId).eq('doctor_id', oturum.doktorId).maybeSingle()
    if (!hasta) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
    const { error } = await sb.from('patients').update({ enabiz_gonderilmesin: Boolean(b.istemiyor) }).eq('id', b.hastaId).eq('doctor_id', oturum.doktorId)
    if (error) {
      if (tabloYokMu(error)) return NextResponse.json({ ok: true, kaydedilebilir: false })
      return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 503 })
    }
    return NextResponse.json({ ok: true, kaydedilebilir: true })
  }

  if (!b.noteId) return NextResponse.json({ error: 'Not gerekli.' }, { status: 400 })
  const { data: not } = await sb.from('notes').select('id').eq('id', b.noteId).eq('doctor_id', oturum.doktorId).maybeSingle()
  if (!not) return NextResponse.json({ error: 'Not bulunamadı.' }, { status: 404 })
  const { data: paket, error } = await sb.from('seans_paketleri').select('id, patient_id, json_encrypted, durum').eq('doctor_id', oturum.doktorId).eq('note_id', b.noteId).maybeSingle()
  if (error) {
    if (tabloYokMu(error)) return NextResponse.json({ kapali: true })
    return NextResponse.json({ error: 'Paket okunamadı.' }, { status: 503 })
  }
  if (!paket) return NextResponse.json({ error: 'Paket bulunamadı.' }, { status: 404 })

  if (b.islem === 'yine_de_yaz') {
    const gerekce = String(b.gerekce || '')
    if (!gerekceGecerli(gerekce)) return NextResponse.json({ error: 'Gerekçe en az 10 karakter olmalı.' }, { status: 400 })
    const { error: yaz } = await sb.from('seans_paketleri').update({ uyari_gecildi: true, uyari_gerekce: gerekce.trim().slice(0, 500), updated_at: new Date().toISOString() }).eq('id', paket.id).eq('doctor_id', oturum.doktorId)
    if (yaz) return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 503 })
    await sb.from('audit_logs').insert({ user_id: oturum.doktorId, action: 'update', resource_type: 'seans_paketleri', resource_id: paket.id, new_values: { uyari_gecildi: true, gerekce: gerekce.trim().slice(0, 500) } })
    return NextResponse.json({ ok: true })
  }

  if (b.islem === 'enabiz') {
    const govde = govdeCoz(paket.json_encrypted)
    if (!govde || govde.enabizIzin !== true) {
      await sb.from('seans_paketleri').update({ durum: 'enabiz_red', updated_at: new Date().toISOString() }).eq('id', paket.id).eq('doctor_id', oturum.doktorId)
      await sb.from('audit_logs').insert({ user_id: oturum.doktorId, action: 'update', resource_type: 'seans_paketleri', resource_id: paket.id, new_values: { enabiz: 'red', patient_id: paket.patient_id } })
      return NextResponse.json({ dosya: null })
    }
    const { data: hasta } = await sb.from('patients').select('name_encrypted').eq('id', paket.patient_id).eq('doctor_id', oturum.doktorId).maybeSingle()
    return NextResponse.json({ dosya: enabizDosyasi(govde, { hastaAd: hastaAdiCoz(hasta?.name_encrypted), hastaId: String(paket.patient_id) }) })
  }

  if (b.islem === 'mbys_kopyalandi') {
    await sb.from('seans_paketleri').update({ durum: 'kopyalandi_mbys', updated_at: new Date().toISOString() }).eq('id', paket.id).eq('doctor_id', oturum.doktorId).eq('durum', 'hekim_onayli')
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Bilinmeyen işlem.' }, { status: 400 })
}
