/**
 * ENFEKSIYON-EXCEPTIONAL-01 — Enfeksiyon Hastalıkları API. Ayaktan muayenehane akışı.
 * HASTA-İZOLASYON: her istek hastaSahibiMi kapısından geçer.
 * GET  ?patientId= → şerit, izolasyon, atb, viral, acil, görevler
 * POST adim: izolasyon | atb | viral | risk | gorev | kontrol
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { atbHesapla, atbGorevleri, atbDozIceriyorMu } from '@/specialties/enfeksiyon-hastaliklari/engines/atbSure'
import { viralPlanla, type ViralTur } from '@/specialties/enfeksiyon-hastaliklari/engines/viralIzlem'
import { izolasyonPlanla, izolasyonGorevleri } from '@/specialties/enfeksiyon-hastaliklari/engines/izolasyon'
import {
  acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, ACIL_KONTROL_LISTESI, HASTA_ACIL_METNI, type AcilKod,
} from '@/specialties/enfeksiyon-hastaliklari/engines/acil'
import { enfSeridi } from '@/specialties/enfeksiyon-hastaliklari/engines/serit'
import {
  REF_ACIKLAMA, HEKIM_KILIT_METNI, ACIL_YONLENDIRME_METNI, KAPSAM_NOTU,
} from '@/specialties/enfeksiyon-hastaliklari/engines/enfeksiyon'

export const dynamic = 'force-dynamic'

const bugun = () => new Date().toISOString().slice(0, 10)
const ISO = /^\d{4}-\d{2}-\d{2}$/

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: Array<{ kod: string; ad: string; due?: string | null; kaynak: string }>) {
  let eklenen = 0
  for (const x of g) {
    const { data } = await sb.from('enfeksiyon_gorevleri').select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle()
    if (data) continue
    await sb.from('enfeksiyon_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak })
    eklenen++
  }
  return eklenen
}

async function bolumKaydi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('hasta_enfeksiyon').select('id, next_kontrol, atb, notes').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (data) return data
  const { data: yeni } = await sb.from('hasta_enfeksiyon').insert({ patient_id: patientId, doctor_id: doctorId }).select('id, next_kontrol, atb, notes').maybeSingle()
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

  if (adim === 'izolasyon') {
    const plan = izolasyonPlanla(b)
    if (!plan.tamamMi) return NextResponse.json({ error: plan.ozet }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('enfeksiyon_izolasyon').insert({
      patient_id: patientId, doctor_id: user.id, hasta_enfeksiyon_id: kayit?.id || null,
      tarih: T, tip: plan.kart.tip, baslangic: plan.kart.baslangic, bitis: plan.kart.bitis,
      bildirim_tarihi: plan.kart.bildirimTarihi, hekim_kilit: b.hekimKilit === true,
      not_hekim: plan.kart.not,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await gorevEkle(sb, user.id, patientId, izolasyonGorevleri(plan.kart).map((g) => ({ ...g, kaynak: 'izolasyon' })))
    const rn = await gununNotunaEkle(sb, user.id, patientId, plan.ozet)
    return NextResponse.json({ ok: true, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'atb') {
    if (b.not && atbDozIceriyorMu(String(b.not))) {
      return NextResponse.json({ error: 'ATB notunda doz / mg yazılamaz.' }, { status: 400 })
    }
    const s = atbHesapla(
      b.baslangic ? String(b.baslangic) : null,
      b.sureGun == null ? null : Number(b.sureGun),
      b.kontrol ? String(b.kontrol) : null,
      b.sinifEtiket ? String(b.sinifEtiket) : null,
      b.not ? String(b.not) : null,
    )
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('enfeksiyon_atb').insert({
      patient_id: patientId, doctor_id: user.id, hasta_enfeksiyon_id: kayit?.id || null,
      tarih: T, baslangic: s.kart.baslangic, sure_gun: s.kart.sureGun, bitis: s.kart.bitis,
      kontrol: s.kart.kontrol, sinif_etiket: s.kart.sinifEtiket, hekim_kilit: b.hekimKilit === true,
      not_hekim: s.kart.not,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await sb.from('hasta_enfeksiyon').update({ atb: s.kart, updated_at: new Date().toISOString() }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    await gorevEkle(sb, user.id, patientId, atbGorevleri(s.kart).map((g) => ({ ...g, kaynak: 'atb' })))
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, bitis: s.kart.bitis, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'viral') {
    const tur = String(b.tur || '') as ViralTur
    if (!['hiv_cd4', 'hiv_viral', 'hbv', 'hcv', 'diger'].includes(tur)) return NextResponse.json({ error: 'Geçersiz viral izlem türü' }, { status: 400 })
    const sonTarih = String(b.sonTarih || T)
    const plan = viralPlanla(tur, sonTarih, T)
    if (!plan.tamamMi || !plan.sonrakiTarih) return NextResponse.json({ error: plan.ozet }, { status: 400 })
    const sonraki = String(b.sonraki || plan.sonrakiTarih)
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('enfeksiyon_viral').insert({
      patient_id: patientId, doctor_id: user.id, hasta_enfeksiyon_id: kayit?.id || null,
      tarih: sonTarih, tur, deger: b.deger == null ? null : Number(b.deger),
      sonraki_izlem: sonraki, hekim_kilit: b.hekimKilit === true,
      not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (b.gorevAc !== false) {
      await gorevEkle(sb, user.id, patientId, [{ kod: `viral_${tur}`, ad: `${tur} izlem`, due: sonraki, kaynak: 'viral' }])
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, plan.ozet)
    return NextResponse.json({ ok: true, sonraki, notId: rn.eklendi ? rn.notId : null })
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
    const { error } = await sb.from('enfeksiyon_acil').insert({
      patient_id: patientId, doctor_id: user.id, hasta_enfeksiyon_id: kayit?.id || null,
      tarih: T, bayraklar: bayraklar.map((x) => x.kod), eylem, hekim_onay: b.hekimOnay === true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (bayraklar.length) {
      const rn = await gununNotunaEkle(sb, user.id, patientId, `⚑ Enfeksiyon acil bayrak: ${bayraklar.map((x) => x.ad).join('; ')} — hekim onayı verildi${eylem ? `: ${eylem}` : ''}. ${ACIL_YONLENDIRME_METNI}`)
      return NextResponse.json({ ok: true, bayraklar, notId: rn.eklendi ? rn.notId : null })
    }
    return NextResponse.json({ ok: true, bayraklar })
  }

  if (adim === 'gorev') {
    const { error } = await sb.from('enfeksiyon_gorevleri')
      .update({ durum: b.durum === 'acik' ? 'acik' : 'tamam', tamam_at: b.durum === 'acik' ? null : new Date().toISOString() })
      .eq('id', String(b.gorevId || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }

  if (adim === 'kontrol') {
    const tarih = String(b.tarih || '')
    if (!ISO.test(tarih)) return NextResponse.json({ error: 'Kontrol tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('hasta_enfeksiyon')
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

  const [bolum, izoQ, atbQ, viralQ, riskQ, gorevQ] = await Promise.all([
    sb.from('hasta_enfeksiyon').select('id, next_kontrol, atb, notes').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle(),
    sb.from('enfeksiyon_izolasyon').select('id, tarih, tip, baslangic, bitis, bildirim_tarihi, hekim_kilit').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(20),
    sb.from('enfeksiyon_atb').select('id, tarih, baslangic, sure_gun, bitis, kontrol, sinif_etiket').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(20),
    sb.from('enfeksiyon_viral').select('id, tarih, tur, deger, sonraki_izlem, hekim_kilit').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(40),
    sb.from('enfeksiyon_acil').select('id, tarih, bayraklar, eylem, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('enfeksiyon_gorevleri').select('id, kod, ad, due, durum, kaynak').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }),
  ])

  const gorevler = (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null }))
  const sonAtb = atbQ.data?.[0] || null
  const sonViral = viralQ.data?.[0] || null
  const sonIzo = izoQ.data?.[0] || null
  const acikRisk = (riskQ.data || []).filter((r) => (r.bayraklar || []).length && !r.hekim_onay)
  const sonRisk = riskQ.data?.[0] || null

  const atbBitis = sonAtb?.bitis ? String(sonAtb.bitis) : gorevler.find((g) => g.kod === 'atb_bitis')?.due || null
  const viralSonraki = sonViral?.sonraki_izlem ? String(sonViral.sonraki_izlem) : gorevler.find((g) => /viral/.test(g.kod))?.due || null
  const izolasyonBitis = sonIzo?.bitis ? String(sonIzo.bitis) : gorevler.find((g) => g.kod === 'izolasyon_bitis')?.due || null

  const planlar: Array<{ kaynak: string; madde: string }> = []
  if (atbBitis) planlar.push({ kaynak: 'ATB', madde: `Bitiş ${atbBitis}` })
  if (viralSonraki) planlar.push({ kaynak: 'Viral', madde: `İzlem ${viralSonraki}` })
  if (izolasyonBitis) planlar.push({ kaynak: 'İzolasyon', madde: `Bitiş ${izolasyonBitis}` })

  const serit = enfSeridi({
    bugun: T,
    riskBayraklari: acikRisk.flatMap((r) => (r.bayraklar || []).map(String)),
    riskHekimOnay: !acikRisk.length,
    sonrakiKontrol: bolum.data?.next_kontrol ? String(bolum.data.next_kontrol) : null,
    atbBitis,
    viralSonraki,
    izolasyonBitis,
    gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null })),
    planlar,
  })

  return NextResponse.json({
    serit,
    bolum: { nextKontrol: bolum.data?.next_kontrol || null, atb: bolum.data?.atb || null },
    izolasyonlar: izoQ.data || [],
    atbKayitlari: atbQ.data || [],
    viralKayitlari: viralQ.data || [],
    risk: { son: sonRisk, acik: acikRisk, gecmis: riskQ.data || [] },
    gorevler: gorevQ.data || [],
    atbBitis,
    viralSonraki,
    izolasyonBitis,
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
