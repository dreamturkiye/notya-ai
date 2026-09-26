/**
 * NEFROLOJI-EXCEPTIONAL-01 — Nefroloji API. Ayaktan muayenehane akışı.
 * HASTA-İZOLASYON: her istek hastaSahibiMi kapısından geçer.
 * GET  ?patientId= → şerit, eGFR, anemi, diyaliz, acil, görevler
 * POST adim: egfr | anemi | diyaliz | risk | gorev | kontrol
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { egfrSkorla, sonrakiIzlemTarihi, ILAC_DOZ_UYARI_LISTESI } from '@/specialties/nefroloji/engines/egfr'
import { anemiSkorla, anemiSonrakiTarih, ANEMI_KONTROL_LISTESI } from '@/specialties/nefroloji/engines/anemi'
import { diyalizSkorla, diyalizGorevleri, diyalizHisIceriyorMu, DIYALIZ_KONTROL_LISTESI } from '@/specialties/nefroloji/engines/diyaliz'
import {
  acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, ACIL_KONTROL_LISTESI, HASTA_ACIL_METNI, type AcilKod,
} from '@/specialties/nefroloji/engines/acil'
import { nefSeridi } from '@/specialties/nefroloji/engines/serit'
import {
  REF_ACIKLAMA, HEKIM_KILIT_METNI, ACIL_YONLENDIRME_METNI, KAPSAM_NOTU,
} from '@/specialties/nefroloji/engines/nefroloji'
import type { Renk } from '@/specialties/nefroloji/engines/egfr'
import type { AnemiBant } from '@/specialties/nefroloji/engines/anemi'

export const dynamic = 'force-dynamic'

const bugun = () => new Date().toISOString().slice(0, 10)
const ISO = /^\d{4}-\d{2}-\d{2}$/

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: Array<{ kod: string; ad: string; due?: string | null; kaynak: string }>) {
  let eklenen = 0
  for (const x of g) {
    const { data } = await sb.from('nef_gorevleri').select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle()
    if (data) continue
    await sb.from('nef_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak })
    eklenen++
  }
  return eklenen
}

async function bolumKaydi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('hasta_nefroloji').select('id, next_kontrol, diyaliz, notes').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (data) return data
  const { data: yeni } = await sb.from('hasta_nefroloji').insert({ patient_id: patientId, doctor_id: doctorId }).select('id, next_kontrol, diyaliz, notes').maybeSingle()
  return yeni || null
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b?.adim) return NextResponse.json({ error: 'adım gerekli' }, { status: 400 })
  const patientId = String(b.patientId || '')
  if (!(await hastaSahibiMi(sb, user.id, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  const adim = String(b.adim)
  const T = bugun()

  if (adim === 'egfr') {
    const s = egfrSkorla(b.egfr == null ? null : Number(b.egfr), b.uacr == null ? null : Number(b.uacr))
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const sonraki = sonrakiIzlemTarihi(T, s.sonrakiAy)
    const { error } = await sb.from('nef_egfr').insert({
      patient_id: patientId, doctor_id: user.id, hasta_nefroloji_id: kayit?.id || null,
      tarih: T, egfr: s.g ? Number(b.egfr) : null, uacr: b.uacr == null ? null : Number(b.uacr),
      g_evre: s.g, a_evre: s.a, renk: s.renk, sonraki_izlem: sonraki, hekim_kilit: b.hekimKilit === true,
      not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (sonraki && b.gorevAc !== false) {
      await gorevEkle(sb, user.id, patientId, [{ kod: 'egfr_izlem', ad: 'eGFR / UACR izlem', due: sonraki, kaynak: 'egfr' }])
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, `${s.ozet}`)
    return NextResponse.json({ ok: true, g: s.g, a: s.a, renk: s.renk, sonraki, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'anemi') {
    const s = anemiSkorla(b.hb == null ? null : Number(b.hb), b.ferritin == null ? null : Number(b.ferritin))
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const sonraki = anemiSonrakiTarih(T, s.sonrakiAy)
    const { error } = await sb.from('nef_anemi').insert({
      patient_id: patientId, doctor_id: user.id, hasta_nefroloji_id: kayit?.id || null,
      tarih: T, hb: s.hb, ferritin: b.ferritin == null ? null : Number(b.ferritin),
      bant: s.bant, sonraki_izlem: sonraki, hekim_kilit: b.hekimKilit === true,
      not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (sonraki && b.gorevAc !== false) {
      await gorevEkle(sb, user.id, patientId, [{ kod: 'anemi_izlem', ad: 'Anemi-CKD izlem (Hb)', due: sonraki, kaynak: 'anemi' }])
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, `${s.ozet}`)
    return NextResponse.json({ ok: true, bant: s.bant, sonraki, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'diyaliz') {
    const s = diyalizSkorla(b)
    if (!s.tamamMi || !s.kayit) return NextResponse.json({ error: s.ozet }, { status: 400 })
    if (s.kayit.not && diyalizHisIceriyorMu(s.kayit.not)) {
      return NextResponse.json({ error: 'Diyaliz notunda makine / UF / reçete yazılamaz.' }, { status: 400 })
    }
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('nef_diyaliz').insert({
      patient_id: patientId, doctor_id: user.id, hasta_nefroloji_id: kayit?.id || null,
      tarih: s.kayit.tarih, modalite: s.kayit.modalite, sonraki_seans: s.kayit.sonrakiSeans,
      not_hekim: s.kayit.not,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await sb.from('hasta_nefroloji').update({
      diyaliz: { modality: s.kayit.modalite, baslangic: s.kayit.tarih, sonraki_seans: s.kayit.sonrakiSeans, not: s.kayit.not },
      updated_at: new Date().toISOString(),
    }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    await gorevEkle(sb, user.id, patientId, diyalizGorevleri(s.kayit).map((g) => ({ ...g, kaynak: 'diyaliz' })))
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'risk') {
    const isaretler = (Array.isArray(b.bayraklar) ? b.bayraklar.map(String) : []).filter((k): k is AcilKod => ACIL_KODLARI.some((x) => x.kod === k))
    const bayraklar = acilTara([b.metin ? String(b.metin) : null], isaretler)
    if (hekimOnayiGerekliMi(bayraklar) && b.hekimOnay !== true) {
      return NextResponse.json({
        error: `Kırmızı bayrak: ${bayraklar.map((x) => x.ad).join(' | ')} — kaydetmeden önce "hekim gördü ve eylemi yazdı" onayı gerekir.`,
        bayraklar,
      }, { status: 409 })
    }
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const eylem = b.eylem ? String(b.eylem).slice(0, 1000) : null
    const { error } = await sb.from('nef_acil').insert({
      patient_id: patientId, doctor_id: user.id, hasta_nefroloji_id: kayit?.id || null,
      tarih: T, bayraklar: bayraklar.map((x) => x.kod), eylem, hekim_onay: b.hekimOnay === true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (bayraklar.length) {
      const rn = await gununNotunaEkle(sb, user.id, patientId, `⚑ Nefro acil bayrak: ${bayraklar.map((x) => x.ad).join('; ')} — hekim onayı verildi${eylem ? `: ${eylem}` : ''}. ${ACIL_YONLENDIRME_METNI}`)
      return NextResponse.json({ ok: true, bayraklar, notId: rn.eklendi ? rn.notId : null })
    }
    return NextResponse.json({ ok: true, bayraklar })
  }

  if (adim === 'gorev') {
    const { error } = await sb.from('nef_gorevleri')
      .update({ durum: b.durum === 'acik' ? 'acik' : 'tamam', tamam_at: b.durum === 'acik' ? null : new Date().toISOString() })
      .eq('id', String(b.gorevId || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }

  if (adim === 'kontrol') {
    const tarih = String(b.tarih || '')
    if (!ISO.test(tarih)) return NextResponse.json({ error: 'Kontrol tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('hasta_nefroloji')
      .update({ next_kontrol: tarih, updated_at: new Date().toISOString() })
      .eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await gorevEkle(sb, user.id, patientId, [{ kod: 'kontrol_randevu', ad: 'Kontrol randevusu', due: tarih, kaynak: 'kontrol' }])
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Geçersiz adım' }, { status: 400 })
}

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const patientId = req.nextUrl.searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId gerekli' }, { status: 400 })
  if (!(await hastaSahibiMi(sb, user.id, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  const T = bugun()

  const [bolum, egfrQ, anemiQ, diyalizQ, riskQ, gorevQ] = await Promise.all([
    sb.from('hasta_nefroloji').select('id, next_kontrol, diyaliz, notes').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle(),
    sb.from('nef_egfr').select('id, tarih, egfr, uacr, g_evre, a_evre, renk, sonraki_izlem, hekim_kilit').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(40),
    sb.from('nef_anemi').select('id, tarih, hb, ferritin, bant, sonraki_izlem').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(20),
    sb.from('nef_diyaliz').select('id, tarih, modalite, sonraki_seans, not_hekim').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(20),
    sb.from('nef_acil').select('id, tarih, bayraklar, eylem, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('nef_gorevleri').select('id, kod, ad, due, durum, kaynak').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }),
  ])

  const sonEgfr = egfrQ.data?.[0] || null
  const sonAnemi = anemiQ.data?.[0] || null
  const sonDiyaliz = diyalizQ.data?.[0] || null
  const acikRisk = (riskQ.data || []).filter((r) => (r.bayraklar || []).length && !r.hekim_onay)
  const sonRisk = riskQ.data?.[0] || null
  const gorevler = (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null }))

  const sonrakiDiyaliz = sonDiyaliz?.sonraki_seans
    ? String(sonDiyaliz.sonraki_seans)
    : gorevler.find((g) => g.kod === 'diyaliz_seans')?.due || null

  const planlar: Array<{ kaynak: string; madde: string }> = []
  if (sonEgfr) planlar.push({ kaynak: 'KDIGO', madde: `${sonEgfr.g_evre || '?'} ${sonEgfr.a_evre || ''} · ${sonEgfr.renk || '—'}` })
  if (sonAnemi) planlar.push({ kaynak: 'Hb', madde: `${sonAnemi.hb} — ${sonAnemi.bant || '—'}` })
  if (sonrakiDiyaliz) planlar.push({ kaynak: 'Diyaliz', madde: `Sonraki ${sonrakiDiyaliz}` })

  const serit = nefSeridi({
    bugun: T,
    egfr: sonEgfr ? {
      deger: sonEgfr.egfr == null ? null : Number(sonEgfr.egfr),
      g: sonEgfr.g_evre ? String(sonEgfr.g_evre) : null,
      renk: (sonEgfr.renk as Renk | null) || null,
      tarih: String(sonEgfr.tarih),
    } : null,
    hb: sonAnemi ? {
      deger: sonAnemi.hb == null ? null : Number(sonAnemi.hb),
      bant: (sonAnemi.bant as AnemiBant | null) || null,
      tarih: String(sonAnemi.tarih),
    } : null,
    riskBayraklari: acikRisk.flatMap((r) => (r.bayraklar || []).map(String)),
    riskHekimOnay: !acikRisk.length,
    sonrakiKontrol: bolum.data?.next_kontrol ? String(bolum.data.next_kontrol) : null,
    sonrakiDiyaliz,
    gorevler,
    planlar,
  })

  return NextResponse.json({
    serit,
    bolum: { nextKontrol: bolum.data?.next_kontrol || null, diyaliz: bolum.data?.diyaliz || null },
    egfrKayitlari: egfrQ.data || [],
    anemiKayitlari: anemiQ.data || [],
    diyalizKayitlari: diyalizQ.data || [],
    son: {
      egfr: sonEgfr ? { deger: sonEgfr.egfr == null ? null : Number(sonEgfr.egfr), g: sonEgfr.g_evre, a: sonEgfr.a_evre, renk: sonEgfr.renk, tarih: String(sonEgfr.tarih) } : null,
      hb: sonAnemi ? { deger: sonAnemi.hb == null ? null : Number(sonAnemi.hb), bant: sonAnemi.bant, tarih: String(sonAnemi.tarih) } : null,
      diyaliz: sonDiyaliz,
    },
    risk: { son: sonRisk, acik: acikRisk, gecmis: riskQ.data || [] },
    gorevler: gorevQ.data || [],
    sonrakiDiyaliz,
    kutuphane: {
      acilKodlari: ACIL_KODLARI,
      acilListesi: ACIL_KONTROL_LISTESI,
      anemiListesi: ANEMI_KONTROL_LISTESI,
      diyalizListesi: DIYALIZ_KONTROL_LISTESI,
      ilacUyariListesi: ILAC_DOZ_UYARI_LISTESI,
      refler: REF_ACIKLAMA,
      hekimKilidi: HEKIM_KILIT_METNI,
      acilYonlendirme: ACIL_YONLENDIRME_METNI,
      hastaAcilMetni: HASTA_ACIL_METNI,
      kapsam: KAPSAM_NOTU,
    },
  })
}
