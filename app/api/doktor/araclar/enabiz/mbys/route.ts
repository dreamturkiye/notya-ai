/**
 * MBYS-YARDIMCI-01 — Gün sonu MBYS kuyruğu. pratikOturum: the ön büro sees the queue and may hand over identity
 * (MBYS lets assistants register a waiting patient); the muayene part and the settings are the physician's.
 *
 *   GET  ?gun=YYYY-MM-DD   → the day's closed (approved) visits with status + what is missing (no identity numbers)
 *   GET  ?notId=…          → one visit's MBYS record for the helper + clipboard text
 *   GET  ?hastaId=…        → per-visit MBYS status of one patient (patient file)
 *   POST { islem: 'durum', notId, durum: 'aktarildi' | 'kaydedildi' }
 *   POST { islem: 'kimlik', hastaId, kimlik }
 *   POST { islem: 'ayar', muayeneTuru, vakaTuru }
 *
 * HASTA-IZOLASYON: every note / session / patient id is matched to the doctor before it is used. No request to any
 * Ministry address — the browser helper fills the form in the doctor's own browser on the doctor's click.
 */
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { hastaSahibiMi, seansSahibi } from '@/lib/doktor/hastaSahipligi'
import { hastaAdiCoz } from '@/lib/doktor/hastaCozumleyici'
import { arsivsizNotlar, arsivsizSeanslar } from '@/lib/doktor/arsiv'
import { encrypt } from '@/lib/security/encryption'
import {
  mbysAyarCoz,
  mbysDurum,
  mbysDurumCoz,
  mbysDuzMetin,
  mbysKontrol,
  type MbysAyar,
} from '@/lib/enabiz/mbys/kontrol'
import { mbysKayitKur, mbysKayitTuruCoz, mbysCinsiyetCoz, mbysTarihCoz, type MbysKimlikEk } from '@/lib/enabiz/mbys/kayit'
import { NOT_ALANLARI, KILIT_EKSIK, ayarOku, hastaBilgileri, notKaydiHazirla } from '@/lib/enabiz/mbys/sunucu'

export const dynamic = 'force-dynamic'

type Sb = SupabaseClient

const bulunamadi = () => NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
/** Turkey is UTC+3 all year. */
function trGunAraligi(gun: string): { bas: string; son: string; gun: string } {
  const simdiTr = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10)
  const g = /^\d{4}-\d{2}-\d{2}$/.test(gun) ? gun : simdiTr
  const bas = new Date(`${g}T00:00:00+03:00`)
  return { gun: g, bas: bas.toISOString(), son: new Date(bas.getTime() + 86400e3).toISOString() }
}

function saatTr(iso: unknown): string {
  const d = new Date(String(iso || ''))
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
}

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol } = oturum
  const sp = req.nextUrl.searchParams
  const notIdQ = String(sp.get('notId') || '').trim()
  const hastaIdQ = String(sp.get('hastaId') || '').trim()
  const muayeneDahil = rol === 'doktor'
  const ayar = await ayarOku(supabase, doktorId)

  // ── One visit's record (the helper's input) ──
  if (notIdQ) {
    const r = await notKaydiHazirla(supabase, doktorId, notIdQ, muayeneDahil)
    if (!r) return bulunamadi()
    return NextResponse.json({
      notId: notIdQ,
      hastaId: r.hastaId,
      hastaAd: r.hastaAd,
      durum: r.durum,
      eksikler: r.eksikler,
      // A patient who refused e-Nabız sharing gets no record at all.
      kayit: r.kayit,
      metin: r.metin,
      rol,
    })
  }

  // ── One patient's per-visit status (patient file) ──
  if (hastaIdQ) {
    if (!(await hastaSahibiMi(supabase, doktorId, hastaIdQ))) return bulunamadi()
    const { data: hasta } = await supabase.from('patients').select('name_encrypted').eq('id', hastaIdQ).eq('doctor_id', doktorId).maybeSingle()
    const { data } = await supabase.from('mbys_aktarimlar').select('note_id, durum').eq('doctor_id', doktorId).eq('patient_id', hastaIdQ)
    const durumlar: Record<string, string> = {}
    for (const r of (data || []) as { note_id: string; durum: string }[]) {
      const d = mbysDurumCoz(r.durum)
      if (d) durumlar[String(r.note_id)] = d
    }
    return NextResponse.json({ hastaId: hastaIdQ, hastaAd: hastaAdiCoz(hasta?.name_encrypted as string), durumlar })
  }

  // ── The day's queue ──
  const { gun, bas, son } = trGunAraligi(String(sp.get('gun') || ''))
  const { data: notlarHam } = await arsivsizNotlar(supabase, NOT_ALANLARI)
    .eq('doctor_id', doktorId)
    .not('approved_at', 'is', null)
    .gte('created_at', bas)
    .lt('created_at', son)
    .order('created_at', { ascending: true })
    .limit(200)
  const notlar = (notlarHam || []) as unknown as Record<string, unknown>[]
  const seansIds = [...new Set(notlar.map((n) => String(n.session_id)))]
  const { data: seanslar } = seansIds.length
    ? await arsivsizSeanslar(supabase, 'id, patient_id').eq('doctor_id', doktorId).in('id', seansIds)
    : { data: [] as Record<string, unknown>[] }
  const seansHasta = new Map(((seanslar || []) as unknown as { id: string; patient_id: string | null }[]).map((s) => [String(s.id), s.patient_id ? String(s.patient_id) : '']))
  const hastaIds = [...new Set([...seansHasta.values()].filter(Boolean))]
  const hastalar = await hastaBilgileri(supabase, doktorId, hastaIds)
  const notIds = notlar.map((n) => String(n.id))
  const { data: aktarimlar } = notIds.length
    ? await supabase.from('mbys_aktarimlar').select('note_id, durum').eq('doctor_id', doktorId).in('note_id', notIds)
    : { data: [] as { note_id: string; durum: string }[] }
  const aktHarita = new Map(((aktarimlar || []) as { note_id: string; durum: string }[]).map((a) => [String(a.note_id), a.durum]))

  const satirlar = []
  for (const n of notlar) {
    const hastaId = seansHasta.get(String(n.session_id)) || ''
    const h = hastaId ? hastalar.get(hastaId) : undefined
    // A session whose patient is not this doctor's never reaches the list (HASTA-IZOLASYON).
    if (!h) continue
    const kayit = mbysKayitKur({ hastaAd: h.ad, dogum: h.dogum, cinsiyet: h.cinsiyet, kartTc: h.kartTc, form: h.form, ek: h.ek, not: n, ayar, muayeneDahil })
    const eksikler = [...(h.kilit ? [KILIT_EKSIK] : []), ...mbysKontrol(kayit)]
    satirlar.push({
      notId: String(n.id),
      hastaId,
      hastaAd: h.ad,
      saat: saatTr(n.created_at),
      durum: mbysDurum(eksikler, mbysDurumCoz(aktHarita.get(String(n.id)))),
      eksikler,
      // The identity editor opens pre-filled; numbers are not sent in the list (only per record on demand).
      kimlik: { kayitTuru: kayit.kayitTuru, ad: kayit.kimlik.ad, soyad: kayit.kimlik.soyad, cinsiyet: kayit.kimlik.cinsiyet, dogumTarihi: kayit.kimlik.dogumTarihi, uyruk: kayit.kimlik.uyruk },
    })
  }
  return NextResponse.json({ gun, ayar, rol, satirlar })
}

const KIMLIK_ALANLARI = ['tcKimlikNo', 'pasaportNo', 'sahisNo', 'ad', 'soyad', 'uyruk'] as const

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol } = oturum
  const govde = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const islem = String(govde.islem || '')
  const simdi = new Date().toISOString()

  if (islem === 'durum') {
    const notId = String(govde.notId || '').trim()
    const durum = mbysDurumCoz(govde.durum)
    if (!durum) return NextResponse.json({ error: 'Geçersiz durum.' }, { status: 400 })
    const { data: not } = await supabase.from('notes').select('id, session_id').eq('id', notId).eq('doctor_id', doktorId).maybeSingle()
    if (!not) return bulunamadi()
    const seans = await seansSahibi(supabase, doktorId, String(not.session_id))
    if (!seans?.patient_id) return bulunamadi()
    const satir: Record<string, unknown> = { doctor_id: doktorId, patient_id: seans.patient_id, note_id: notId, durum, updated_at: simdi }
    if (durum === 'aktarildi') satir.aktarildi_at = simdi
    else satir.kaydedildi_at = simdi
    const { error } = await supabase.from('mbys_aktarimlar').upsert(satir, { onConflict: 'doctor_id,note_id' })
    if (error) return NextResponse.json({ error: 'Durum kaydedilemedi.' }, { status: 500 })
    return NextResponse.json({ ok: true, notId, durum })
  }

  if (islem === 'kimlik') {
    const hastaId = String(govde.hastaId || '').trim()
    if (!(await hastaSahibiMi(supabase, doktorId, hastaId))) return bulunamadi()
    const g = (govde.kimlik && typeof govde.kimlik === 'object' ? govde.kimlik : {}) as Record<string, unknown>
    const ek: MbysKimlikEk = { kayitTuru: mbysKayitTuruCoz(g.kayitTuru) }
    for (const k of KIMLIK_ALANLARI) {
      const v = String(g[k] ?? '').trim().slice(0, 80)
      if (v) ek[k] = k === 'tcKimlikNo' ? v.replace(/\D/g, '') : v
    }
    const cins = mbysCinsiyetCoz(g.cinsiyet)
    if (cins) ek.cinsiyet = cins
    const dogum = mbysTarihCoz(g.dogumTarihi)
    if (dogum) ek.dogumTarihi = dogum
    const { error } = await supabase
      .from('mbys_hasta_kimlik')
      .upsert({ doctor_id: doktorId, patient_id: hastaId, kimlik_encrypted: encrypt(JSON.stringify(ek)), updated_at: simdi }, { onConflict: 'doctor_id,patient_id' })
    if (error) return NextResponse.json({ error: 'Kimlik kaydedilemedi.' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (islem === 'ayar') {
    if (rol !== 'doktor') return NextResponse.json({ error: 'Bu ayarı yalnız hekim değiştirir.' }, { status: 403 })
    const ayar = mbysAyarCoz({ muayeneTuru: String(govde.muayeneTuru || '').slice(0, 80), vakaTuru: String(govde.vakaTuru || '').slice(0, 80) })
    const { error } = await supabase.from('users').update({ mbys_ayar: ayar }).eq('id', doktorId)
    if (error) return NextResponse.json({ error: 'Ayar kaydedilemedi.' }, { status: 500 })
    return NextResponse.json({ ok: true, ayar })
  }

  return NextResponse.json({ error: 'Bilinmeyen işlem.' }, { status: 400 })
}
