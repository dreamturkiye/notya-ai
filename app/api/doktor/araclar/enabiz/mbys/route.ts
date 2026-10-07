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
import { notAlanlariCoz } from '@/lib/doktor/hastaKayitAlanlari'
import { arsivsizNotlar, arsivsizSeanslar } from '@/lib/doktor/arsiv'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { formlariBirlestir, sifreliFormlariCoz } from '@/lib/intake/formBirlestir'
import {
  mbysAyarCoz,
  mbysDurum,
  mbysDurumCoz,
  mbysDuzMetin,
  mbysKontrol,
  type MbysAyar,
} from '@/lib/enabiz/mbys/kontrol'
import { mbysKayitKur, mbysKayitTuruCoz, mbysCinsiyetCoz, mbysTarihCoz, type MbysKimlikEk } from '@/lib/enabiz/mbys/kayit'

export const dynamic = 'force-dynamic'

type Sb = SupabaseClient

const bulunamadi = () => NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
const NOT_ALANLARI = 'id, session_id, created_at, approved_at, basvuru_yakinmasi, content_subjektif, content_objektif, content_degerlendirme, content_plan, icd10_codes, vitaller'

function coz(v: unknown): string {
  if (!v) return ''
  try { return String(decrypt(String(v)) || '') } catch { return '' }
}

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

async function ayarOku(supabase: Sb, doktorId: string): Promise<MbysAyar> {
  const { data } = await supabase.from('users').select('mbys_ayar').eq('id', doktorId).maybeSingle()
  return mbysAyarCoz((data as { mbys_ayar?: unknown } | null)?.mbys_ayar)
}

/** Everything the record needs about the patients, read under the doctor. */
async function hastaBilgileri(supabase: Sb, doktorId: string, hastaIds: string[]) {
  const harita = new Map<string, { ad: string; dogum: string; cinsiyet: string; kartTc: string; kilit: boolean; form: Record<string, unknown> | null; ek: MbysKimlikEk | null }>()
  if (!hastaIds.length) return harita
  const [hastaQ, formQ, ekQ] = await Promise.all([
    supabase.from('patients').select('id, name_encrypted, dob_encrypted, gender_encrypted, notes_encrypted, enabiz_gonderilmesin').eq('doctor_id', doktorId).in('id', hastaIds),
    supabase.from('hasta_intake_formlari').select('patient_id, form_data_encrypted, created_at').eq('doktor_id', doktorId).in('patient_id', hastaIds).not('form_data_encrypted', 'is', null).order('created_at', { ascending: false }).limit(hastaIds.length * 3 + 10),
    supabase.from('mbys_hasta_kimlik').select('patient_id, kimlik_encrypted').eq('doctor_id', doktorId).in('patient_id', hastaIds),
  ])
  for (const p of (hastaQ.data || []) as Record<string, unknown>[]) {
    const id = String(p.id)
    const kart = notAlanlariCoz(p.notes_encrypted as string | null)
    const formSatir = ((formQ.data || []) as { patient_id: string; form_data_encrypted: string; created_at: string }[]).filter((f) => f.patient_id === id)
    const birlesik = formlariBirlestir(sifreliFormlariCoz(formSatir).formlar)
    const ekSatir = ((ekQ.data || []) as { patient_id: string; kimlik_encrypted: string }[]).find((e) => e.patient_id === id)
    let ek: MbysKimlikEk | null = null
    try { ek = ekSatir ? (JSON.parse(coz(ekSatir.kimlik_encrypted) || 'null') as MbysKimlikEk | null) : null } catch { ek = null }
    harita.set(id, {
      ad: hastaAdiCoz(p.name_encrypted as string),
      dogum: coz(p.dob_encrypted),
      cinsiyet: coz(p.gender_encrypted),
      kartTc: String(kart.tcKimlik || kart.tcKimlikNo || '').trim(),
      kilit: p.enabiz_gonderilmesin === true,
      form: birlesik?.yanitlar ?? null,
      ek,
    })
  }
  return harita
}

const KILIT_EKSIK = { alan: 'izin', mesaj: 'Hasta e-Nabız’a gönderilmesini istemiyor', duzelt: 'yok' as const }

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
    const { data: not } = await arsivsizNotlar(supabase, NOT_ALANLARI).eq('id', notIdQ).eq('doctor_id', doktorId).maybeSingle()
    if (!not) return bulunamadi()
    const n = not as unknown as Record<string, unknown>
    const seans = await seansSahibi(supabase, doktorId, String(n.session_id))
    if (!seans?.patient_id) return bulunamadi()
    const hastaId = String(seans.patient_id)
    const h = (await hastaBilgileri(supabase, doktorId, [hastaId])).get(hastaId)
    if (!h) return bulunamadi()
    const { data: akt } = await supabase.from('mbys_aktarimlar').select('durum').eq('doctor_id', doktorId).eq('note_id', notIdQ).maybeSingle()
    const kayit = mbysKayitKur({ hastaAd: h.ad, dogum: h.dogum, cinsiyet: h.cinsiyet, kartTc: h.kartTc, form: h.form, ek: h.ek, not: n, ayar, muayeneDahil })
    const eksikler = [...(h.kilit ? [KILIT_EKSIK] : []), ...mbysKontrol(kayit)]
    return NextResponse.json({
      notId: notIdQ,
      hastaId,
      hastaAd: h.ad,
      durum: mbysDurum(eksikler, mbysDurumCoz(akt?.durum)),
      eksikler,
      // A patient who refused e-Nabız sharing gets no record at all.
      kayit: h.kilit ? null : kayit,
      metin: h.kilit ? '' : mbysDuzMetin(kayit),
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
