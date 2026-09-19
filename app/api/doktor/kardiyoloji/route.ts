/**
 * KARDIO-EXCEPTIONAL-01 — Kardiyoloji API. Ayaktan muayenehane akışı.
 * HASTA-İZOLASYON: her istek hastaSahibiMi kapısından geçer.
 * GET ?patientId= → şerit, SCORE2, risk, görevler
 * POST adim: score2 | izlem | risk | gorev | kontrol
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { kardioScore2Hesapla, type Cinsiyet } from '@/specialties/kardiyoloji/engines/score2'
import { izlemDegerlendir, type IzlemTip, type NyhaSinif } from '@/specialties/kardiyoloji/engines/htKky'
import {
  acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, ACIL_KONTROL_LISTESI, HASTA_ACIL_METNI, type AcilKod,
} from '@/specialties/kardiyoloji/engines/acil'
import { kardioSeridi } from '@/specialties/kardiyoloji/engines/serit'
import { KARDIO_RAPOR_SABLONLARI } from '@/specialties/kardiyoloji/engines/sgkRapor'
import {
  REF_ACIKLAMA, HEKIM_KILIT_METNI, ACIL_YONLENDIRME_METNI, KAPSAM_NOTU, gunEkle,
} from '@/specialties/kardiyoloji/engines/kardiyoloji'
import type { KvrKova } from '@/specialties/kardiyoloji/engines/score2'

export const dynamic = 'force-dynamic'

const bugun = () => new Date().toISOString().slice(0, 10)
const ISO = /^\d{4}-\d{2}-\d{2}$/

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: Array<{ kod: string; ad: string; due?: string | null; kaynak: string }>) {
  let eklenen = 0
  for (const x of g) {
    const { data } = await sb.from('kardio_gorevleri').select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle()
    if (data) continue
    await sb.from('kardio_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak })
    eklenen++
  }
  return eklenen
}

async function bolumKaydi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('hasta_kardiyoloji').select('id, next_kontrol, notes').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (data) return data
  const { data: yeni } = await sb.from('hasta_kardiyoloji').insert({ patient_id: patientId, doctor_id: doctorId }).select('id, next_kontrol, notes').maybeSingle()
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

  if (adim === 'score2') {
    const sonuc = kardioScore2Hesapla({
      yas: Number(b.yas),
      cinsiyet: b.cinsiyet as Cinsiyet,
      sigara: b.sigara === true,
      sbp: Number(b.sbp),
      tcholMgdl: Number(b.tcholMgdl),
      hdlMgdl: Number(b.hdlMgdl),
      bolge: 'high',
    })
    if (!sonuc.tamamMi) return NextResponse.json({ error: sonuc.eksikler.join('; ') || 'SCORE2 hesaplanamadı', sonuc }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('kardio_score2').insert({
      patient_id: patientId, doctor_id: user.id, hasta_kardiyoloji_id: kayit?.id || null,
      tarih: T, risk_pct: sonuc.riskPct,
      maddeler: { yas: b.yas, cinsiyet: b.cinsiyet, sigara: b.sigara, sbp: b.sbp, tcholMgdl: b.tcholMgdl, hdlMgdl: b.hdlMgdl, kova: sonuc.kova, bolge: sonuc.bolge },
      hekim_kilit: b.hekimKilit === true,
      not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (b.gorevAc !== false) {
      await gorevEkle(sb, user.id, patientId, [{ kod: 'kontrol_randevu', ad: 'Kontrol randevusu', due: gunEkle(T, 90), kaynak: 'score2' }])
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, `${sonuc.ozet}`)
    return NextResponse.json({ ok: true, sonuc, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'izlem') {
    const tip = (['ht', 'kky', 'af', 'diger'].includes(String(b.tip)) ? String(b.tip) : 'ht') as IzlemTip
    const sonuc = izlemDegerlendir({
      tip, bugun: T,
      sbp: b.sbp == null || b.sbp === '' ? null : Number(b.sbp),
      dbp: b.dbp == null || b.dbp === '' ? null : Number(b.dbp),
      kiloKg: b.kiloKg == null || b.kiloKg === '' ? null : Number(b.kiloKg),
      nyha: (b.nyha as NyhaSinif | null) || null,
      bayraklar: b.ekgBelge === true ? ['ekg_belge'] : [],
      hekimNotu: b.hekimNotu ? String(b.hekimNotu) : '',
    })
    if (sonuc.eksikler.length) return NextResponse.json({ error: sonuc.eksikler.join('; '), sonuc }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('kardio_izlem').insert({
      patient_id: patientId, doctor_id: user.id, hasta_kardiyoloji_id: kayit?.id || null,
      tarih: T, tip,
      maddeler: { sbp: b.sbp, dbp: b.dbp, kiloKg: b.kiloKg, nyha: b.nyha, ekgBelge: b.ekgBelge === true },
      hekim_kilit: b.hekimKilit === true,
      not_hekim: b.hekimNotu ? String(b.hekimNotu).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (b.gorevAc !== false) {
      await gorevEkle(sb, user.id, patientId, sonuc.gorevler.map((g) => ({ ...g, kaynak: 'izlem' })))
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, `İzlem — ${sonuc.ozet}`)
    return NextResponse.json({ ok: true, sonuc, notId: rn.eklendi ? rn.notId : null })
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
    const { error } = await sb.from('kardio_risk').insert({
      patient_id: patientId, doctor_id: user.id, hasta_kardiyoloji_id: kayit?.id || null,
      tarih: T, bayraklar: bayraklar.map((x) => x.kod), eylem, hekim_onay: b.hekimOnay === true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (bayraklar.length) {
      const rn = await gununNotunaEkle(sb, user.id, patientId, `⚑ Kırmızı bayrak değerlendirmesi: ${bayraklar.map((x) => x.ad).join('; ')} — hekim onayı verildi${eylem ? `: ${eylem}` : ''}. ${ACIL_YONLENDIRME_METNI}`)
      return NextResponse.json({ ok: true, bayraklar, notId: rn.eklendi ? rn.notId : null })
    }
    return NextResponse.json({ ok: true, bayraklar })
  }

  if (adim === 'gorev') {
    const { error } = await sb.from('kardio_gorevleri')
      .update({ durum: b.durum === 'acik' ? 'acik' : 'tamam', tamam_at: b.durum === 'acik' ? null : new Date().toISOString() })
      .eq('id', String(b.gorevId || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }

  if (adim === 'kontrol') {
    const tarih = String(b.tarih || '')
    if (!ISO.test(tarih)) return NextResponse.json({ error: 'Kontrol tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('hasta_kardiyoloji')
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

  const [bolum, scoreQ, izlemQ, riskQ, gorevQ] = await Promise.all([
    sb.from('hasta_kardiyoloji').select('id, next_kontrol, notes').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle(),
    sb.from('kardio_score2').select('id, tarih, risk_pct, maddeler, hekim_kilit, not_hekim').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('kardio_izlem').select('id, tarih, tip, maddeler, hekim_kilit').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('kardio_risk').select('id, tarih, bayraklar, eylem, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('kardio_gorevleri').select('id, kod, ad, due, durum, kaynak').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }),
  ])

  const sonScore = scoreQ.data?.[0] || null
  const sonIzlem = izlemQ.data?.[0] || null
  const acikRisk = (riskQ.data || []).filter((r) => (r.bayraklar || []).length && !r.hekim_onay)
  const gorevler = (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null }))
  const maddeler = (sonScore?.maddeler || {}) as { kova?: KvrKova }

  const planlar: Array<{ kaynak: string; madde: string }> = []
  if (sonScore?.risk_pct != null) planlar.push({ kaynak: 'SCORE2', madde: `${sonScore.risk_pct}% · karar desteği` })
  if (sonIzlem) planlar.push({ kaynak: 'İzlem', madde: String(sonIzlem.tip) })

  const serit = kardioSeridi({
    bugun: T,
    score2: sonScore ? { riskPct: sonScore.risk_pct == null ? null : Number(sonScore.risk_pct), kova: maddeler.kova || null, tarih: String(sonScore.tarih) } : null,
    riskBayraklari: acikRisk.flatMap((r) => (r.bayraklar || []).map(String)),
    riskHekimOnay: !acikRisk.length,
    sonrakiKontrol: bolum.data?.next_kontrol ? String(bolum.data.next_kontrol) : null,
    sonIzlem: sonIzlem ? { tip: String(sonIzlem.tip), tarih: String(sonIzlem.tarih) } : null,
    gorevler,
    planlar,
  })

  return NextResponse.json({
    serit,
    bolum: { nextKontrol: bolum.data?.next_kontrol || null },
    sonScore2: sonScore,
    izlemler: izlemQ.data || [],
    risk: { son: riskQ.data?.[0] || null, acik: acikRisk, gecmis: riskQ.data || [] },
    gorevler: gorevQ.data || [],
    kutuphane: {
      acilKodlari: ACIL_KODLARI,
      acilListesi: ACIL_KONTROL_LISTESI,
      raporSablonlari: KARDIO_RAPOR_SABLONLARI,
      refler: REF_ACIKLAMA,
      hekimKilidi: HEKIM_KILIT_METNI,
      acilYonlendirme: ACIL_YONLENDIRME_METNI,
      hastaAcilMetni: HASTA_ACIL_METNI,
      kapsam: KAPSAM_NOTU,
    },
  })
}
