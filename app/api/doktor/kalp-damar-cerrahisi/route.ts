/**
 * KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — Kalp Damar Cerrahisi API. Ayaktan muayenehane akışı.
 * HASTA-İZOLASYON: her istek hastaSahibiMi kapısından geçer.
 * GET  ?patientId= → şerit, preop, greft/yara, antikoag, acil, görevler
 * POST adim: preop | greft_yara | antikoag | risk | gorev | kontrol
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { preopSkorla } from '@/specialties/kalp-damar-cerrahisi/engines/preop'
import { greftYaraSkorla } from '@/specialties/kalp-damar-cerrahisi/engines/greftYara'
import { antikoagSkorla, antikoagNormalize } from '@/specialties/kalp-damar-cerrahisi/engines/antikoag'
import {
  acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, ACIL_KONTROL_LISTESI, type AcilKod,
} from '@/specialties/kalp-damar-cerrahisi/engines/acil'
import { kdcSeridi } from '@/specialties/kalp-damar-cerrahisi/engines/serit'
import {
  HEKIM_KILIT_METNI, ACIL_YONLENDIRME_METNI, KAPSAM_NOTU, ISO_GUN,
} from '@/specialties/kalp-damar-cerrahisi/engines/kalp-damar'

export const dynamic = 'force-dynamic'

const bugun = () => new Date().toISOString().slice(0, 10)

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: Array<{ kod: string; ad: string; due?: string | null; kaynak: string }>) {
  let eklenen = 0
  for (const x of g) {
    const { data } = await sb.from('kdc_gorevleri').select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle()
    if (data) continue
    await sb.from('kdc_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak })
    eklenen++
  }
  return eklenen
}

async function bolumKaydi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('hasta_kalp_damar_cerrahisi').select('id, next_kontrol, preop, greft_yara, antikoag, notes').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (data) return data
  const { data: yeni } = await sb.from('hasta_kalp_damar_cerrahisi').insert({ patient_id: patientId, doctor_id: doctorId }).select('id, next_kontrol, preop, greft_yara, antikoag, notes').maybeSingle()
  return yeni || null
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b?.adim) return NextResponse.json({ error: 'adim gerekli' }, { status: 400 })
  const patientId = String(b.patientId || '')
  if (!(await hastaSahibiMi(sb, user.id, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  const adim = String(b.adim)
  const T = bugun()

  if (adim === 'preop') {
    const s = preopSkorla(b.secilen, b.not ? String(b.not) : null)
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('kdc_preop').insert({
      patient_id: patientId, doctor_id: user.id, hasta_kalp_damar_cerrahisi_id: kayit?.id || null,
      tarih: T, maddeler: s.secilen, hekim_kilit: b.hekimKilit === true, not_hekim: b.not ? String(b.not).slice(0, 500) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await sb.from('hasta_kalp_damar_cerrahisi').update({ preop: { secilen: s.secilen, tarih: T }, updated_at: new Date().toISOString() }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    await gorevEkle(sb, user.id, patientId, s.gorevOnerileri.map((g) => ({ ...g, kaynak: 'preop' })))
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, secilen: s.secilen, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'greft_yara') {
    const s = greftYaraSkorla(b.kart ?? b)
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('kdc_greft_yara').insert({
      patient_id: patientId, doctor_id: user.id, hasta_kalp_damar_cerrahisi_id: kayit?.id || null,
      tarih: s.kart.tarih!, tip: s.kart.tip, durum: s.kart.durum, sonraki_kontrol: s.kart.sonrakiKontrol,
      hekim_kilit: b.hekimKilit === true, not_hekim: s.kart.not,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await sb.from('hasta_kalp_damar_cerrahisi').update({ greft_yara: s.kart, updated_at: new Date().toISOString() }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    await gorevEkle(sb, user.id, patientId, s.gorevOnerileri.map((g) => ({ ...g, kaynak: 'greft_yara' })))
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, kart: s.kart, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'antikoag') {
    const s = antikoagSkorla(b.kart ?? b)
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('kdc_antikoag').insert({
      patient_id: patientId, doctor_id: user.id, hasta_kalp_damar_cerrahisi_id: kayit?.id || null,
      sinif: s.kart.sinif, sonraki_kontrol: s.kart.sonrakiKontrol, lab_vadesi: s.kart.labVadesi,
      hekim_kilit: b.hekimKilit === true, not_hekim: s.kart.not,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await sb.from('hasta_kalp_damar_cerrahisi').update({ antikoag: s.kart, updated_at: new Date().toISOString() }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    await gorevEkle(sb, user.id, patientId, s.gorevOnerileri.map((g) => ({ ...g, kaynak: 'antikoag' })))
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, kart: s.kart, notId: rn.eklendi ? rn.notId : null })
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
    const { error } = await sb.from('kdc_acil').insert({
      patient_id: patientId, doctor_id: user.id, hasta_kalp_damar_cerrahisi_id: kayit?.id || null,
      tarih: T, bayraklar: bayraklar.map((x) => x.kod), eylem, hekim_onay: b.hekimOnay === true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (bayraklar.length) {
      const rn = await gununNotunaEkle(sb, user.id, patientId, `⚑ Kalp-damar acil bayrak: ${bayraklar.map((x) => x.ad).join('; ')} — hekim onayı verildi${eylem ? `: ${eylem}` : ''}. ${ACIL_YONLENDIRME_METNI}`)
      return NextResponse.json({ ok: true, bayraklar, notId: rn.eklendi ? rn.notId : null })
    }
    return NextResponse.json({ ok: true, bayraklar })
  }

  if (adim === 'gorev') {
    const { error } = await sb.from('kdc_gorevleri')
      .update({ durum: b.durum === 'acik' ? 'acik' : 'tamam', tamam_at: b.durum === 'acik' ? null : new Date().toISOString() })
      .eq('id', String(b.gorevId || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }

  if (adim === 'kontrol') {
    const tarih = String(b.tarih || '')
    if (!ISO_GUN.test(tarih)) return NextResponse.json({ error: 'Kontrol tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('hasta_kalp_damar_cerrahisi')
      .update({ next_kontrol: tarih, updated_at: new Date().toISOString() })
      .eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await gorevEkle(sb, user.id, patientId, [{ kod: 'kontrol_randevu', ad: 'Kontrol randevusu', due: tarih, kaynak: 'kontrol' }])
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Geçersiz adim' }, { status: 400 })
}

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const patientId = req.nextUrl.searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId gerekli' }, { status: 400 })
  if (!(await hastaSahibiMi(sb, user.id, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  const T = bugun()

  const [bolum, riskQ, gorevQ] = await Promise.all([
    sb.from('hasta_kalp_damar_cerrahisi').select('id, next_kontrol, preop, greft_yara, antikoag, notes').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle(),
    sb.from('kdc_acil').select('id, tarih, bayraklar, eylem, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('kdc_gorevleri').select('id, kod, ad, due, durum, kaynak').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }),
  ])

  const acikRisk = (riskQ.data || []).filter((r) => (r.bayraklar || []).length && !r.hekim_onay)
  const sonRisk = riskQ.data?.[0] || null
  const gorevler = (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null }))
  const preop = (bolum.data?.preop && typeof bolum.data.preop === 'object' ? bolum.data.preop : null) as { secilen?: string[] } | null
  const preopSayi = Array.isArray(preop?.secilen) ? preop!.secilen!.length : 0
  const greft = (bolum.data?.greft_yara && typeof bolum.data.greft_yara === 'object' ? bolum.data.greft_yara : null) as { durum?: string } | null
  const ak = antikoagNormalize(bolum.data?.antikoag)

  const planlar: Array<{ kaynak: string; madde: string }> = []
  if (preopSayi) planlar.push({ kaynak: 'Pre-op', madde: `${preopSayi} madde` })
  if (greft?.durum) planlar.push({ kaynak: 'Greft/yara', madde: String(greft.durum) })
  if (ak.sonrakiKontrol || ak.labVadesi) planlar.push({ kaynak: 'Antikoag', madde: ak.sonrakiKontrol || ak.labVadesi || 'vade' })

  const serit = kdcSeridi({
    bugun: T,
    preopSayi,
    greftYaraDurum: greft?.durum ? String(greft.durum) : null,
    antikoagVade: ak.sonrakiKontrol || ak.labVadesi || null,
    riskBayraklari: acikRisk.flatMap((r) => (r.bayraklar || []).map(String)),
    riskHekimOnay: !acikRisk.length,
    sonrakiKontrol: bolum.data?.next_kontrol ? String(bolum.data.next_kontrol) : null,
    gorevler,
    planlar,
  })

  return NextResponse.json({
    serit,
    bolum: {
      nextKontrol: bolum.data?.next_kontrol || null,
      preop: bolum.data?.preop || null,
      greftYara: bolum.data?.greft_yara || null,
      antikoag: bolum.data?.antikoag || null,
    },
    risk: { son: sonRisk, acik: acikRisk },
    gorevler: (gorevQ.data || []).map((g) => ({ id: g.id, kod: g.kod, ad: g.ad, due: g.due, kaynak: g.kaynak })),
    kutuphane: {
      acilKodlari: ACIL_KODLARI,
      acilListesi: ACIL_KONTROL_LISTESI,
      hekimKilidi: HEKIM_KILIT_METNI,
      acilYonlendirme: ACIL_YONLENDIRME_METNI,
      kapsam: KAPSAM_NOTU,
    },
  })
}
