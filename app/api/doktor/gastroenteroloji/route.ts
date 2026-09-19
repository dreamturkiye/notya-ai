/**
 * GASTROENTEROLOJI-EXCEPTIONAL-01 — Gastroenteroloji API. Ayaktan muayenehane akışı.
 * HASTA-İZOLASYON: her istek hastaSahibiMi kapısından geçer.
 * GET  ?patientId= → şerit, skor, hepatit, endoskopi, acil, görevler, rejim
 * POST adim: skor | endoskopi | hepatit | rejim | risk | gorev | kontrol
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { skorHesapla, sonrakiKontrolTarihi, type SkorTur } from '@/specialties/gastroenteroloji/engines/ibdIbs'
import { endoskopiPlanla, type EndoskopiTur } from '@/specialties/gastroenteroloji/engines/endoskopi'
import { hepatitPlanla, type HepatitTur, type HepatitBant } from '@/specialties/gastroenteroloji/engines/hbvHcv'
import {
  acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, ACIL_KONTROL_LISTESI, HASTA_ACIL_METNI, type AcilKod,
} from '@/specialties/gastroenteroloji/engines/acil'
import { gastroSeridi } from '@/specialties/gastroenteroloji/engines/serit'
import { rejimNormalize, rejimGorevleri, rejimOzeti, rejimDozIceriyorMu } from '@/specialties/gastroenteroloji/engines/rejim'
import {
  REF_ACIKLAMA, HEKIM_KILIT_METNI, ACIL_YONLENDIRME_METNI, KAPSAM_NOTU,
} from '@/specialties/gastroenteroloji/engines/gastroenteroloji'
import type { SkorBant } from '@/specialties/gastroenteroloji/engines/ibdIbs'

export const dynamic = 'force-dynamic'

const bugun = () => new Date().toISOString().slice(0, 10)
const ISO = /^\d{4}-\d{2}-\d{2}$/

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: Array<{ kod: string; ad: string; due?: string | null; kaynak: string }>) {
  let eklenen = 0
  for (const x of g) {
    const { data } = await sb.from('gastro_gorevleri').select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle()
    if (data) continue
    await sb.from('gastro_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak })
    eklenen++
  }
  return eklenen
}

async function bolumKaydi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('hasta_gastroenteroloji').select('id, next_kontrol, rejim, notes').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (data) return data
  const { data: yeni } = await sb.from('hasta_gastroenteroloji').insert({ patient_id: patientId, doctor_id: doctorId }).select('id, next_kontrol, rejim, notes').maybeSingle()
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

  if (adim === 'skor') {
    const tur = String(b.tur || '') as SkorTur
    if (!['mayo_kismi', 'hbi', 'ibs_sss', 'diger'].includes(tur)) return NextResponse.json({ error: 'Geçersiz skor türü' }, { status: 400 })
    const s = skorHesapla(tur, b.skor == null ? null : Number(b.skor))
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const sonraki = sonrakiKontrolTarihi(T, s.sonrakiAy)
    const { error } = await sb.from('gastro_skor').insert({
      patient_id: patientId, doctor_id: user.id, hasta_gastroenteroloji_id: kayit?.id || null,
      tarih: T, tur, skor: s.skor, bant: s.bant, hekim_kilit: b.hekimKilit === true,
      not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (sonraki && b.gorevAc !== false) {
      await gorevEkle(sb, user.id, patientId, [{ kod: `skor_${tur}`, ad: `${tur} takip kontrolü`, due: sonraki, kaynak: 'skor' }])
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, `${s.ozet}`)
    return NextResponse.json({ ok: true, bant: s.bant, sonraki, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'endoskopi') {
    const tur = String(b.tur || '') as EndoskopiTur
    if (!['egd', 'kolonoskopi', 'sigmoidoskopi', 'eus', 'ercp', 'kapsul', 'diger'].includes(tur)) {
      return NextResponse.json({ error: 'Geçersiz endoskopi türü' }, { status: 400 })
    }
    const plan = endoskopiPlanla(tur, String(b.tarih || ''), b.sonraki ? String(b.sonraki) : null)
    if (!plan.tamamMi || !plan.tarih) return NextResponse.json({ error: plan.ozet }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('gastro_endoskopi').insert({
      patient_id: patientId, doctor_id: user.id, hasta_gastroenteroloji_id: kayit?.id || null,
      tarih: plan.tarih, tur, belge_id: b.belgeId ? String(b.belgeId) : null,
      sonraki_kontrol: plan.sonrakiKontrol, hekim_not: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (plan.sonrakiKontrol) {
      await gorevEkle(sb, user.id, patientId, [{ kod: `endoskopi_${tur}`, ad: 'Endoskopi kontrolü', due: plan.sonrakiKontrol, kaynak: 'endoskopi' }])
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, plan.ozet)
    return NextResponse.json({ ok: true, sonraki: plan.sonrakiKontrol, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'hepatit') {
    const tur = String(b.tur || '') as HepatitTur
    const bant = String(b.bant || 'bilinmiyor') as HepatitBant
    if (!['hbv', 'hcv', 'diger'].includes(tur)) return NextResponse.json({ error: 'Geçersiz hepatit türü' }, { status: 400 })
    if (!['stabil', 'aktif_izlem', 'tedavi_degerlendirme', 'bilinmiyor'].includes(bant)) {
      return NextResponse.json({ error: 'Geçersiz izlem bandı' }, { status: 400 })
    }
    const plan = hepatitPlanla(tur, bant, T)
    if (!plan.tamamMi || !plan.sonrakiTarih) return NextResponse.json({ error: plan.ozet }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('gastro_hepatit').insert({
      patient_id: patientId, doctor_id: user.id, hasta_gastroenteroloji_id: kayit?.id || null,
      tarih: T, tur, bant: plan.bant, sonraki_izlem: plan.sonrakiTarih, hekim_kilit: b.hekimKilit === true,
      not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await gorevEkle(sb, user.id, patientId, [{ kod: `hepatit_${tur}`, ad: `${tur.toUpperCase()} izlem`, due: plan.sonrakiTarih, kaynak: 'hepatit' }])
    const rn = await gununNotunaEkle(sb, user.id, patientId, plan.ozet)
    return NextResponse.json({ ok: true, sonraki: plan.sonrakiTarih, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'rejim') {
    const kart = rejimNormalize(b.rejim)
    if (kart.not && rejimDozIceriyorMu(kart.not)) {
      return NextResponse.json({ error: 'Rejim notunda doz / mg yazılamaz.' }, { status: 400 })
    }
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('hasta_gastroenteroloji')
      .update({ rejim: kart, updated_at: new Date().toISOString() })
      .eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await gorevEkle(sb, user.id, patientId, rejimGorevleri(kart).map((g) => ({ ...g, kaynak: 'rejim' })))
    const rn = await gununNotunaEkle(sb, user.id, patientId, rejimOzeti(kart))
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
    const { error } = await sb.from('gastro_acil').insert({
      patient_id: patientId, doctor_id: user.id, hasta_gastroenteroloji_id: kayit?.id || null,
      tarih: T, bayraklar: bayraklar.map((x) => x.kod), eylem, hekim_onay: b.hekimOnay === true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (bayraklar.length) {
      const rn = await gununNotunaEkle(sb, user.id, patientId, `⚑ GI acil bayrak: ${bayraklar.map((x) => x.ad).join('; ')} — hekim onayı verildi${eylem ? `: ${eylem}` : ''}. ${ACIL_YONLENDIRME_METNI}`)
      return NextResponse.json({ ok: true, bayraklar, notId: rn.eklendi ? rn.notId : null })
    }
    return NextResponse.json({ ok: true, bayraklar })
  }

  if (adim === 'gorev') {
    const { error } = await sb.from('gastro_gorevleri')
      .update({ durum: b.durum === 'acik' ? 'acik' : 'tamam', tamam_at: b.durum === 'acik' ? null : new Date().toISOString() })
      .eq('id', String(b.gorevId || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }

  if (adim === 'kontrol') {
    const tarih = String(b.tarih || '')
    if (!ISO.test(tarih)) return NextResponse.json({ error: 'Kontrol tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('hasta_gastroenteroloji')
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

  const [bolum, skorQ, hepQ, endoQ, riskQ, gorevQ] = await Promise.all([
    sb.from('hasta_gastroenteroloji').select('id, next_kontrol, rejim, notes').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle(),
    sb.from('gastro_skor').select('id, tarih, tur, skor, bant, hekim_kilit, not_hekim').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(40),
    sb.from('gastro_hepatit').select('id, tarih, tur, bant, sonraki_izlem').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(20),
    sb.from('gastro_endoskopi').select('id, tarih, tur, sonraki_kontrol, belge_id').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(20),
    sb.from('gastro_acil').select('id, tarih, bayraklar, eylem, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('gastro_gorevleri').select('id, kod, ad, due, durum, kaynak').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }),
  ])

  const skorlar = skorQ.data || []
  const sonSkor = skorlar[0] || null
  const sonHep = (hepQ.data || [])[0] || null
  const sonEndo = (endoQ.data || [])[0] || null
  const acikRisk = (riskQ.data || []).filter((r) => (r.bayraklar || []).length && !r.hekim_onay)
  const sonRisk = riskQ.data?.[0] || null
  const gorevler = (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null }))

  const hepatitSonraki = sonHep?.sonraki_izlem ? String(sonHep.sonraki_izlem) : gorevler.find((g) => /hepatit|hbv|hcv/.test(g.kod))?.due || null
  const endoskopiSonraki = sonEndo?.sonraki_kontrol ? String(sonEndo.sonraki_kontrol) : gorevler.find((g) => /endoskopi/.test(g.kod))?.due || null

  const skorBant = (sonSkor?.bant as SkorBant | null) || null

  const planlar: Array<{ kaynak: string; madde: string }> = []
  if (sonSkor) planlar.push({ kaynak: 'IBD/IBS', madde: `${sonSkor.skor} — ${skorBant || '—'}` })
  if (hepatitSonraki) planlar.push({ kaynak: 'HBV/HCV', madde: `İzlem ${hepatitSonraki}` })
  if (endoskopiSonraki) planlar.push({ kaynak: 'Endoskopi', madde: `Kontrol ${endoskopiSonraki}` })

  const serit = gastroSeridi({
    bugun: T,
    skor: sonSkor ? { deger: sonSkor.skor == null ? null : Number(sonSkor.skor), bant: skorBant, tarih: String(sonSkor.tarih), tur: String(sonSkor.tur) } : null,
    hepatitSonraki,
    endoskopiSonraki,
    riskBayraklari: acikRisk.flatMap((r) => (r.bayraklar || []).map(String)),
    riskHekimOnay: !acikRisk.length,
    sonrakiKontrol: bolum.data?.next_kontrol ? String(bolum.data.next_kontrol) : null,
    gorevler,
    planlar,
  })

  return NextResponse.json({
    serit,
    bolum: { nextKontrol: bolum.data?.next_kontrol || null, rejim: bolum.data?.rejim || null },
    skorlar,
    sonSkor: sonSkor ? { deger: sonSkor.skor == null ? null : Number(sonSkor.skor), bant: skorBant, tarih: String(sonSkor.tarih), tur: String(sonSkor.tur) } : null,
    hepatitSonraki,
    endoskopiSonraki,
    risk: { son: sonRisk, acik: acikRisk, gecmis: riskQ.data || [] },
    gorevler: gorevQ.data || [],
    kutuphane: {
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
