/**
 * FIZIK-TEDAVI-EXCEPTIONAL-01 — FTR API. Ayaktan muayenehane akışı.
 * HASTA-İZOLASYON: her istek hastaSahibiMi kapısından geçer.
 * GET  ?patientId= → şerit, VAS/ODI, seans, egzersiz, risk, görevler
 * POST adim: vas | odi | seans | egzersiz | risk | gorev | kontrol
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { skorlaVas, skorlaOdi, sonrakiOlcekGun, ODI_MADDELER, VAS_BANT_AD, ODI_BANT_AD, type VasBant, type OdiBant } from '@/specialties/fizik-tedavi/engines/vasOdi'
import { seansPlani, FTR_MODALITELER } from '@/specialties/fizik-tedavi/engines/seans'
import { egzersizRecetesi, EGZERSIZ_ORNEKLERI } from '@/specialties/fizik-tedavi/engines/egzersiz'
import {
  acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, ACIL_KONTROL_LISTESI, HASTA_ACIL_METNI, type AcilKod,
} from '@/specialties/fizik-tedavi/engines/acil'
import { ftrSeridi } from '@/specialties/fizik-tedavi/engines/serit'
import {
  REF_ACIKLAMA, HEKIM_KILIT_METNI, ACIL_YONLENDIRME_METNI, KAPSAM_NOTU, gunEkle,
} from '@/specialties/fizik-tedavi/engines/fizik-tedavi'

export const dynamic = 'force-dynamic'

const bugun = () => new Date().toISOString().slice(0, 10)
const ISO = /^\d{4}-\d{2}-\d{2}$/

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: Array<{ kod: string; ad: string; due?: string | null; kaynak: string }>) {
  let eklenen = 0
  for (const x of g) {
    const { data } = await sb.from('ftr_gorevleri').select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle()
    if (data) continue
    await sb.from('ftr_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak })
    eklenen++
  }
  return eklenen
}

async function bolumKaydi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('hasta_fizik_tedavi').select('id, next_kontrol, notes').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (data) return data
  const { data: yeni } = await sb.from('hasta_fizik_tedavi').insert({ patient_id: patientId, doctor_id: doctorId }).select('id, next_kontrol, notes').maybeSingle()
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

  if (adim === 'vas') {
    const s = skorlaVas(b.deger == null || b.deger === '' ? null : Number(b.deger))
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('ftr_olcek').insert({
      patient_id: patientId, doctor_id: user.id, hasta_fizik_tedavi_id: kayit?.id || null,
      tarih: T, tip: 'vas', maddeler: { deger: s.deger }, toplam: s.deger, bant: s.bant,
      hekim_kilit: b.hekimKilit === true,
      not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (b.gorevAc !== false) {
      await gorevEkle(sb, user.id, patientId, [{ kod: 'vas_tekrar', ad: 'Ağrı / fonksiyon formu (VAS)', due: gunEkle(T, sonrakiOlcekGun(s.bant)), kaynak: 'vas' }])
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, `${s.ozet}`)
    return NextResponse.json({ ok: true, deger: s.deger, bant: s.bant, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'odi') {
    const maddeler = Array.isArray(b.maddeler) ? (b.maddeler as unknown[]).map((x) => (x == null || x === '' ? null : Number(x))) : []
    const s = skorlaOdi(maddeler)
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('ftr_olcek').insert({
      patient_id: patientId, doctor_id: user.id, hasta_fizik_tedavi_id: kayit?.id || null,
      tarih: T, tip: 'odi', maddeler: { maddeler, sorular: ODI_MADDELER }, toplam: s.yuzde, bant: s.bant,
      hekim_kilit: b.hekimKilit === true,
      not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (b.gorevAc !== false) {
      await gorevEkle(sb, user.id, patientId, [{ kod: 'odi_tekrar', ad: 'Ağrı / fonksiyon formu (ODI)', due: gunEkle(T, sonrakiOlcekGun(s.bant)), kaynak: 'odi' }])
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, `${s.ozet}`)
    return NextResponse.json({ ok: true, yuzde: s.yuzde, bant: s.bant, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'seans') {
    const s = seansPlani({
      bolge: String(b.bolge || ''),
      modaliteler: Array.isArray(b.modaliteler) ? b.modaliteler.map(String) : [],
      seansSayisi: b.seansSayisi == null || b.seansSayisi === '' ? null : Number(b.seansSayisi),
      haftalikSiklik: b.haftalikSiklik == null || b.haftalikSiklik === '' ? null : Number(b.haftalikSiklik),
      not: b.not ? String(b.not) : null,
    })
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('ftr_seans').insert({
      patient_id: patientId, doctor_id: user.id, hasta_fizik_tedavi_id: kayit?.id || null,
      tarih: T,
      maddeler: { bolge: b.bolge, modaliteler: b.modaliteler, seansSayisi: b.seansSayisi, haftalikSiklik: b.haftalikSiklik },
      hekim_kilit: b.hekimKilit === true,
      not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await gorevEkle(sb, user.id, patientId, [{ kod: 'seans_takip', ad: 'Tedavi seansı takibi', due: gunEkle(T, 14), kaynak: 'seans' }])
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, ozet: s.ozet, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'egzersiz') {
    const maddeler = Array.isArray(b.maddeler) ? (b.maddeler as Array<Record<string, unknown>>).map((m) => ({
      ad: String(m.ad || ''),
      set: m.set == null || m.set === '' ? null : Number(m.set),
      tekrar: m.tekrar == null || m.tekrar === '' ? null : Number(m.tekrar),
      not: m.not ? String(m.not) : null,
    })) : []
    const s = egzersizRecetesi(maddeler)
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('ftr_egzersiz').insert({
      patient_id: patientId, doctor_id: user.id, hasta_fizik_tedavi_id: kayit?.id || null,
      tarih: T, maddeler: { maddeler },
      hekim_kilit: b.hekimKilit === true,
      not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await gorevEkle(sb, user.id, patientId, [{ kod: 'egzersiz_kontrol', ad: 'Ev egzersiz kontrolü', due: gunEkle(T, 14), kaynak: 'egzersiz' }])
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, ozet: s.ozet, notId: rn.eklendi ? rn.notId : null })
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
    const { error } = await sb.from('ftr_risk').insert({
      patient_id: patientId, doctor_id: user.id, hasta_fizik_tedavi_id: kayit?.id || null,
      tarih: T, bayraklar: bayraklar.map((x) => x.kod), eylem, hekim_onay: b.hekimOnay === true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (bayraklar.length) {
      const rn = await gununNotunaEkle(sb, user.id, patientId, `⚑ FTR kırmızı bayrak: ${bayraklar.map((x) => x.ad).join('; ')} — hekim onayı verildi${eylem ? `: ${eylem}` : ''}. ${ACIL_YONLENDIRME_METNI}`)
      return NextResponse.json({ ok: true, bayraklar, notId: rn.eklendi ? rn.notId : null })
    }
    return NextResponse.json({ ok: true, bayraklar })
  }

  if (adim === 'gorev') {
    const { error } = await sb.from('ftr_gorevleri')
      .update({ durum: b.durum === 'acik' ? 'acik' : 'tamam', tamam_at: b.durum === 'acik' ? null : new Date().toISOString() })
      .eq('id', String(b.gorevId || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }

  if (adim === 'kontrol') {
    const tarih = String(b.tarih || '')
    if (!ISO.test(tarih)) return NextResponse.json({ error: 'Kontrol tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('hasta_fizik_tedavi')
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

  const [bolum, olcekQ, seansQ, egzQ, riskQ, gorevQ] = await Promise.all([
    sb.from('hasta_fizik_tedavi').select('id, next_kontrol, notes').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle(),
    sb.from('ftr_olcek').select('id, tarih, tip, toplam, bant, maddeler, hekim_kilit, not_hekim').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(40),
    sb.from('ftr_seans').select('id, tarih, maddeler, hekim_kilit, not_hekim').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(20),
    sb.from('ftr_egzersiz').select('id, tarih, maddeler, hekim_kilit, not_hekim').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(20),
    sb.from('ftr_risk').select('id, tarih, bayraklar, eylem, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('ftr_gorevleri').select('id, kod, ad, due, durum, kaynak').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }),
  ])

  const olcekler = olcekQ.data || []
  const sonVas = olcekler.find((o) => o.tip === 'vas') || null
  const sonOdi = olcekler.find((o) => o.tip === 'odi') || null
  const acikRisk = (riskQ.data || []).filter((r) => (r.bayraklar || []).length && !r.hekim_onay)
  const gorevler = (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null }))
  const seansAcik = gorevler.filter((g) => /seans/.test(g.kod)).length
  const egzersizAcik = gorevler.filter((g) => /egzersiz|olcek|vas|odi/.test(g.kod)).length

  const planlar: Array<{ kaynak: string; madde: string }> = []
  if (sonVas) planlar.push({ kaynak: 'VAS', madde: `${sonVas.toplam}/10 — ${sonVas.bant ? (VAS_BANT_AD[sonVas.bant as VasBant] || sonVas.bant) : '—'}` })
  if (sonOdi) planlar.push({ kaynak: 'ODI', madde: `%${sonOdi.toplam} — ${sonOdi.bant ? (ODI_BANT_AD[sonOdi.bant as OdiBant] || sonOdi.bant) : '—'}` })
  if (seansQ.data?.[0]) planlar.push({ kaynak: 'Seans', madde: 'Son seans planı kayıtlı' })
  if (egzQ.data?.[0]) planlar.push({ kaynak: 'Egzersiz', madde: 'Son ev egzersiz reçetesi kayıtlı' })

  const serit = ftrSeridi({
    bugun: T,
    vas: sonVas ? { deger: sonVas.toplam == null ? null : Number(sonVas.toplam), bant: (sonVas.bant as VasBant) || null, tarih: String(sonVas.tarih) } : null,
    odi: sonOdi ? { yuzde: sonOdi.toplam == null ? null : Number(sonOdi.toplam), bant: (sonOdi.bant as OdiBant) || null, tarih: String(sonOdi.tarih) } : null,
    riskBayraklari: acikRisk.flatMap((r) => (r.bayraklar || []).map(String)),
    riskHekimOnay: !acikRisk.length,
    sonrakiKontrol: bolum.data?.next_kontrol ? String(bolum.data.next_kontrol) : null,
    seansAcik,
    egzersizAcik,
    gorevler,
    planlar,
  })

  return NextResponse.json({
    serit,
    bolum: { nextKontrol: bolum.data?.next_kontrol || null },
    sonVas,
    sonOdi,
    seanslar: seansQ.data || [],
    egzersizler: egzQ.data || [],
    risk: { son: riskQ.data?.[0] || null, acik: acikRisk, gecmis: riskQ.data || [] },
    gorevler: gorevQ.data || [],
    kutuphane: {
      odiMaddeler: ODI_MADDELER,
      vasBantlar: VAS_BANT_AD,
      odiBantlar: ODI_BANT_AD,
      modaliteler: FTR_MODALITELER,
      egzersizOrnekleri: EGZERSIZ_ORNEKLERI,
      acilKodlari: ACIL_KODLARI,
      acilListesi: ACIL_KONTROL_LISTESI,
      refler: REF_ACIKLAMA,
      hekimKilidi: HEKIM_KILIT_METNI,
      acilYonlendirme: ACIL_YONLENDIRME_METNI,
      hastaAcilMetni: HASTA_ACIL_METNI,
      kapsam: KAPSAM_NOTU,
    },
  })
}
