/**
 * ACIL-TIP-EXCEPTIONAL-01 — Acil Tıp API.
 * HASTA-İZOLASYON: her istek hastaSahibiMi kapısından geçer.
 * GET  ?patientId= → şerit, ESI, kritik yol, sevk, risk, görevler
 * POST adim: esi | kritik | sevk | risk | gorev | kontrol
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { esiSkorla } from '@/specialties/acil-tip/engines/esi'
import { kritikYolSkorla } from '@/specialties/acil-tip/engines/kritikYol'
import { sevkSkorla } from '@/specialties/acil-tip/engines/sevk'
import {
  acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, ACIL_KONTROL_LISTESI, type AcilKod,
} from '@/specialties/acil-tip/engines/acil'
import { atSeridi } from '@/specialties/acil-tip/engines/serit'
import {
  REF_ACIKLAMA, HEKIM_KILIT_METNI, ACIL_YONLENDIRME_METNI, KAPSAM_NOTU, ISO_GUN,
} from '@/specialties/acil-tip/engines/acilTip'

export const dynamic = 'force-dynamic'

const bugun = () => new Date().toISOString().slice(0, 10)

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: Array<{ kod: string; ad: string; due?: string | null; kaynak: string }>) {
  let eklenen = 0
  for (const x of g) {
    const { data } = await sb.from('at_gorevleri').select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle()
    if (data) continue
    await sb.from('at_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak })
    eklenen++
  }
  return eklenen
}

async function bolumKaydi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('hasta_acil_tip').select('id, next_kontrol, esi, kritik_yol, sevk, notes').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (data) return data
  const { data: yeni } = await sb.from('hasta_acil_tip').insert({ patient_id: patientId, doctor_id: doctorId }).select('id, next_kontrol, esi, kritik_yol, sevk, notes').maybeSingle()
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

  if (adim === 'esi') {
    const s = esiSkorla({ seviye: b.seviye, kaynaklar: b.kaynaklar, not: b.not ? String(b.not) : null })
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('at_esi').insert({
      patient_id: patientId, doctor_id: user.id, hasta_acil_tip_id: kayit?.id || null,
      tarih: T, seviye: s.seviye, kaynaklar: s.kaynaklar, hekim_kilit: b.hekimKilit === true, not_hekim: b.not ? String(b.not).slice(0, 500) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await sb.from('hasta_acil_tip').update({
      esi: { seviye: s.seviye, kaynaklar: s.kaynaklar, tarih: T, not: b.not ? String(b.not).slice(0, 500) : null },
      updated_at: new Date().toISOString(),
    }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    const due = b.due && ISO_GUN.test(String(b.due)) ? String(b.due) : null
    await gorevEkle(sb, user.id, patientId, s.gorevOnerileri.map((g) => ({ ...g, due, kaynak: 'esi' })))
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, seviye: s.seviye, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'kritik') {
    const s = kritikYolSkorla({ yollar: b.yollar, maddeler: b.maddeler, not: b.not ? String(b.not) : null })
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('at_kritik_yol').insert({
      patient_id: patientId, doctor_id: user.id, hasta_acil_tip_id: kayit?.id || null,
      tarih: T, yollar: s.yollar, maddeler: s.maddeler, hekim_kilit: b.hekimKilit === true, not_hekim: b.not ? String(b.not).slice(0, 500) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await sb.from('hasta_acil_tip').update({
      kritik_yol: { yollar: s.yollar, maddeler: s.maddeler, tarih: T, not: b.not ? String(b.not).slice(0, 500) : null },
      updated_at: new Date().toISOString(),
    }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    const due = b.due && ISO_GUN.test(String(b.due)) ? String(b.due) : null
    await gorevEkle(sb, user.id, patientId, s.gorevOnerileri.map((g) => ({ ...g, due, kaynak: 'kritik' })))
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, yollar: s.yollar, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'sevk') {
    const s = sevkSkorla({ hedef: b.hedef, maddeler: b.maddeler, not: b.not ? String(b.not) : null })
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('at_sevk').insert({
      patient_id: patientId, doctor_id: user.id, hasta_acil_tip_id: kayit?.id || null,
      tarih: T, hedef: s.hedef, maddeler: s.maddeler, hekim_kilit: b.hekimKilit === true, not_hekim: b.not ? String(b.not).slice(0, 500) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await sb.from('hasta_acil_tip').update({
      sevk: { hedef: s.hedef, maddeler: s.maddeler, tarih: T, not: b.not ? String(b.not).slice(0, 500) : null },
      updated_at: new Date().toISOString(),
    }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    const due = b.due && ISO_GUN.test(String(b.due)) ? String(b.due) : null
    await gorevEkle(sb, user.id, patientId, s.gorevOnerileri.map((g) => ({ ...g, due, kaynak: 'sevk' })))
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, hedef: s.hedef, notId: rn.eklendi ? rn.notId : null })
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
    const { error } = await sb.from('at_risk').insert({
      patient_id: patientId, doctor_id: user.id, hasta_acil_tip_id: kayit?.id || null,
      tarih: T, bayraklar: bayraklar.map((x) => x.kod), eylem, hekim_onay: b.hekimOnay === true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (bayraklar.length) {
      const rn = await gununNotunaEkle(sb, user.id, patientId, `⚑ Acil bayrak: ${bayraklar.map((x) => x.ad).join('; ')} — hekim onayı verildi${eylem ? `: ${eylem}` : ''}. ${ACIL_YONLENDIRME_METNI}`)
      return NextResponse.json({ ok: true, bayraklar, notId: rn.eklendi ? rn.notId : null })
    }
    return NextResponse.json({ ok: true, bayraklar })
  }

  if (adim === 'gorev') {
    const { error } = await sb.from('at_gorevleri')
      .update({ durum: b.durum === 'acik' ? 'acik' : 'tamam', tamam_at: b.durum === 'acik' ? null : new Date().toISOString() })
      .eq('id', String(b.gorevId || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }

  if (adim === 'kontrol') {
    const tarih = String(b.tarih || '')
    if (!ISO_GUN.test(tarih)) return NextResponse.json({ error: 'Kontrol tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('hasta_acil_tip')
      .update({ next_kontrol: tarih, updated_at: new Date().toISOString() })
      .eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await gorevEkle(sb, user.id, patientId, [{ kod: 'taburcu_kontrol', ad: 'Acil sonrası kontrol', due: tarih, kaynak: 'kontrol' }])
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
    sb.from('hasta_acil_tip').select('id, next_kontrol, esi, kritik_yol, sevk, notes').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle(),
    sb.from('at_risk').select('id, tarih, bayraklar, eylem, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('at_gorevleri').select('id, kod, ad, due, durum, kaynak').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }),
  ])

  const acikRisk = (riskQ.data || []).filter((r) => (r.bayraklar || []).length && !r.hekim_onay)
  const sonRisk = riskQ.data?.[0] || null
  const gorevler = (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null }))
  const esi = (bolum.data?.esi && typeof bolum.data.esi === 'object' ? bolum.data.esi : null) as { seviye?: number } | null
  const kritik = (bolum.data?.kritik_yol && typeof bolum.data.kritik_yol === 'object' ? bolum.data.kritik_yol : null) as { yollar?: string[] } | null
  const sevk = (bolum.data?.sevk && typeof bolum.data.sevk === 'object' ? bolum.data.sevk : null) as { hedef?: string } | null
  const esiSeviye = typeof esi?.seviye === 'number' ? esi.seviye : null
  const kritikYolSayi = Array.isArray(kritik?.yollar) ? kritik!.yollar!.length : 0

  const planlar: Array<{ kaynak: string; madde: string }> = []
  if (esiSeviye != null) planlar.push({ kaynak: 'ESI', madde: String(esiSeviye) })
  if (kritikYolSayi) planlar.push({ kaynak: 'Kritik yol', madde: `${kritikYolSayi} bayrak` })
  if (sevk?.hedef) planlar.push({ kaynak: 'Sevk/paket', madde: sevk.hedef })

  const serit = atSeridi({
    bugun: T,
    esiSeviye,
    kritikYolSayi,
    sevkHedef: sevk?.hedef || null,
    riskBayraklari: acikRisk.flatMap((r) => (r.bayraklar || []).map(String)),
    riskHekimOnay: !acikRisk.length,
    sonrakiKontrol: bolum.data?.next_kontrol ? String(bolum.data.next_kontrol) : null,
    gorevler,
    planlar,
  })

  return NextResponse.json({
    serit,
    bolum: { nextKontrol: bolum.data?.next_kontrol || null, esi: bolum.data?.esi || null, kritikYol: bolum.data?.kritik_yol || null, sevk: bolum.data?.sevk || null, notes: bolum.data?.notes || null },
    risk: { son: sonRisk, acik: acikRisk },
    gorevler: gorevQ.data || [],
    kutuphane: {
      acilKodlari: ACIL_KODLARI,
      acilListesi: ACIL_KONTROL_LISTESI,
      hekimKilidi: HEKIM_KILIT_METNI,
      acilYonlendirme: ACIL_YONLENDIRME_METNI,
      kapsam: KAPSAM_NOTU,
      referanslar: REF_ACIKLAMA,
    },
  })
}
