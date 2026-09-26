/**
 * GENEL-CERRAHI-EXCEPTIONAL-01 — Genel Cerrahi API. Ayaktan muayenehane akışı.
 * HASTA-İZOLASYON: her istek hastaSahibiMi kapısından geçer.
 * GET  ?patientId= → şerit, preop, yara, patoloji, acil, görevler
 * POST adim: preop | yara | patoloji | risk | gorev | kontrol
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { preopSkorla, preopGorevleri, PREOP_MADDELER } from '@/specialties/genel-cerrahi/engines/preop'
import { yaraSkorla, yaraGorevleri, YARA_TIP_AD } from '@/specialties/genel-cerrahi/engines/yaraDren'
import { patolojiSkorla, patolojiGorevleri, PATOLOJI_DURUM_AD } from '@/specialties/genel-cerrahi/engines/patoloji'
import {
  acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, ACIL_KONTROL_LISTESI, HASTA_ACIL_METNI, type AcilKod,
} from '@/specialties/genel-cerrahi/engines/acil'
import { gcSeridi } from '@/specialties/genel-cerrahi/engines/serit'
import {
  REF_ACIKLAMA, HEKIM_KILIT_METNI, ACIL_YONLENDIRME_METNI, KAPSAM_NOTU, ISO_GUN,
} from '@/specialties/genel-cerrahi/engines/genel-cerrahi'

export const dynamic = 'force-dynamic'

const bugun = () => new Date().toISOString().slice(0, 10)

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: Array<{ kod: string; ad: string; due?: string | null; kaynak: string }>) {
  let eklenen = 0
  for (const x of g) {
    const { data } = await sb.from('gc_gorevleri').select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle()
    if (data) continue
    await sb.from('gc_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak })
    eklenen++
  }
  return eklenen
}

async function bolumKaydi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('hasta_genel_cerrahi').select('id, next_kontrol, preop, yara, patoloji, notes').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (data) return data
  const { data: yeni } = await sb.from('hasta_genel_cerrahi').insert({ patient_id: patientId, doctor_id: doctorId }).select('id, next_kontrol, preop, yara, patoloji, notes').maybeSingle()
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

  if (adim === 'preop') {
    const s = preopSkorla(b.preop ?? b)
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('gc_preop').insert({
      patient_id: patientId, doctor_id: user.id, hasta_genel_cerrahi_id: kayit?.id || null,
      tarih: T, etiket: s.kart.planlananAmeliyatEtiket, ameliyat_tarihi: s.kart.ameliyatTarihi,
      maddeler: s.kart, hekim_kilit: b.hekimKilit === true, not_hekim: s.kart.not,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await sb.from('hasta_genel_cerrahi').update({ preop: s.kart, updated_at: new Date().toISOString() }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    await gorevEkle(sb, user.id, patientId, preopGorevleri(s.kart).map((g) => ({ ...g, kaynak: 'preop' })))
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, kart: s.kart, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'yara') {
    const s = yaraSkorla(b.yara ?? b)
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('gc_yara_dren').insert({
      patient_id: patientId, doctor_id: user.id, hasta_genel_cerrahi_id: kayit?.id || null,
      tarih: s.kart.tarih!, tip: s.kart.tip, maddeler: s.kart,
      hekim_kilit: b.hekimKilit === true, not_hekim: s.kart.not,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await sb.from('hasta_genel_cerrahi').update({ yara: s.kart, updated_at: new Date().toISOString() }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    await gorevEkle(sb, user.id, patientId, yaraGorevleri(s.kart).map((g) => ({ ...g, kaynak: 'yara' })))
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, kart: s.kart, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'patoloji') {
    const s = patolojiSkorla(b.patoloji ?? b)
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('gc_patoloji').insert({
      patient_id: patientId, doctor_id: user.id, hasta_genel_cerrahi_id: kayit?.id || null,
      tarih: T, durum: s.kart.durum, etiket: s.kart.etiket,
      ornek_tarihi: s.kart.ornekTarihi, rapor_tarihi: s.kart.raporTarihi,
      hekim_kilit: b.hekimKilit === true, not_hekim: s.kart.not,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await sb.from('hasta_genel_cerrahi').update({ patoloji: s.kart, updated_at: new Date().toISOString() }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    await gorevEkle(sb, user.id, patientId, patolojiGorevleri(s.kart).map((g) => ({ ...g, kaynak: 'patoloji' })))
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
    const { error } = await sb.from('gc_acil').insert({
      patient_id: patientId, doctor_id: user.id, hasta_genel_cerrahi_id: kayit?.id || null,
      tarih: T, bayraklar: bayraklar.map((x) => x.kod), eylem, hekim_onay: b.hekimOnay === true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (bayraklar.length) {
      const rn = await gununNotunaEkle(sb, user.id, patientId, `⚑ Genel cerrahi acil bayrak: ${bayraklar.map((x) => x.ad).join('; ')} — hekim onayı verildi${eylem ? `: ${eylem}` : ''}. ${ACIL_YONLENDIRME_METNI}`)
      return NextResponse.json({ ok: true, bayraklar, notId: rn.eklendi ? rn.notId : null })
    }
    return NextResponse.json({ ok: true, bayraklar })
  }

  if (adim === 'gorev') {
    const { error } = await sb.from('gc_gorevleri')
      .update({ durum: b.durum === 'acik' ? 'acik' : 'tamam', tamam_at: b.durum === 'acik' ? null : new Date().toISOString() })
      .eq('id', String(b.gorevId || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }

  if (adim === 'kontrol') {
    const tarih = String(b.tarih || '')
    if (!ISO_GUN.test(tarih)) return NextResponse.json({ error: 'Kontrol tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('hasta_genel_cerrahi')
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

  const [bolum, riskQ, gorevQ] = await Promise.all([
    sb.from('hasta_genel_cerrahi').select('id, next_kontrol, preop, yara, patoloji, notes').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle(),
    sb.from('gc_acil').select('id, tarih, bayraklar, eylem, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('gc_gorevleri').select('id, kod, ad, due, durum, kaynak').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }),
  ])

  const preop = (bolum.data?.preop && typeof bolum.data.preop === 'object' ? bolum.data.preop : null) as { tamamlanan?: string[]; ameliyatTarihi?: string; planlananAmeliyatEtiket?: string } | null
  const yara = (bolum.data?.yara && typeof bolum.data.yara === 'object' ? bolum.data.yara : null) as { tip?: string } | null
  const patoloji = (bolum.data?.patoloji && typeof bolum.data.patoloji === 'object' ? bolum.data.patoloji : null) as { durum?: string } | null
  const acikRisk = (riskQ.data || []).filter((r) => (r.bayraklar || []).length && !r.hekim_onay)
  const sonRisk = riskQ.data?.[0] || null
  const gorevler = (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null }))

  const planlar: Array<{ kaynak: string; madde: string }> = []
  if (preop?.planlananAmeliyatEtiket) planlar.push({ kaynak: 'Pre-op', madde: preop.planlananAmeliyatEtiket })
  if (preop?.ameliyatTarihi) planlar.push({ kaynak: 'Ameliyat tarihi', madde: preop.ameliyatTarihi })
  if (yara?.tip) planlar.push({ kaynak: 'Yara/dren', madde: YARA_TIP_AD[yara.tip as keyof typeof YARA_TIP_AD] || yara.tip })
  if (patoloji?.durum) planlar.push({ kaynak: 'Patoloji', madde: PATOLOJI_DURUM_AD[patoloji.durum as keyof typeof PATOLOJI_DURUM_AD] || patoloji.durum })

  const serit = gcSeridi({
    bugun: T,
    preopTamam: preop?.tamamlanan ? preop.tamamlanan.length : null,
    preopToplam: PREOP_MADDELER.length,
    ameliyatTarihi: preop?.ameliyatTarihi || null,
    yaraTip: yara?.tip ? (YARA_TIP_AD[yara.tip as keyof typeof YARA_TIP_AD] || yara.tip) : null,
    patolojiDurum: patoloji?.durum || null,
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
      yara: bolum.data?.yara || null,
      patoloji: bolum.data?.patoloji || null,
    },
    risk: { son: sonRisk, acik: acikRisk, gecmis: riskQ.data || [] },
    gorevler: gorevQ.data || [],
    kutuphane: {
      acilKodlari: ACIL_KODLARI,
      acilListesi: ACIL_KONTROL_LISTESI,
      preopMaddeler: PREOP_MADDELER,
      yaraTipAd: YARA_TIP_AD,
      patolojiDurumAd: PATOLOJI_DURUM_AD,
      refler: REF_ACIKLAMA,
      hekimKilidi: HEKIM_KILIT_METNI,
      acilYonlendirme: ACIL_YONLENDIRME_METNI,
      hastaAcilMetni: HASTA_ACIL_METNI,
      kapsam: KAPSAM_NOTU,
    },
  })
}
