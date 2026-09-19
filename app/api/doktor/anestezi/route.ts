/**
 * ANESTEZI-EXCEPTIONAL-01 — Anestezi API. Ayaktan / poliklinik akışı.
 * HASTA-İZOLASYON: her istek hastaSahibiMi kapısından geçer.
 * GET  ?patientId= → şerit, ASA, hava yolu, ağrı, acil, görevler
 * POST adim: asa | havaYolu | agri | risk | gorev | kontrol
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { asaSkorla } from '@/specialties/anestezi/engines/asa'
import { havaYoluSkorla } from '@/specialties/anestezi/engines/havaYolu'
import { agriSkorla } from '@/specialties/anestezi/engines/agri'
import {
  acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, ACIL_KONTROL_LISTESI, type AcilKod,
} from '@/specialties/anestezi/engines/acil'
import { anesteziSeridi } from '@/specialties/anestezi/engines/serit'
import {
  REF_ACIKLAMA, HEKIM_KILIT_METNI, ACIL_YONLENDIRME_METNI, KAPSAM_NOTU, ISO_GUN,
} from '@/specialties/anestezi/engines/anestezi'

export const dynamic = 'force-dynamic'

const bugun = () => new Date().toISOString().slice(0, 10)

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: Array<{ kod: string; ad: string; due?: string | null; kaynak: string }>) {
  let eklenen = 0
  for (const x of g) {
    const { data } = await sb.from('anestezi_gorevleri').select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle()
    if (data) continue
    await sb.from('anestezi_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak })
    eklenen++
  }
  return eklenen
}

async function bolumKaydi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('hasta_anestezi').select('id, next_kontrol, asa, hava_yolu, agri, notes').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (data) return data
  const { data: yeni } = await sb.from('hasta_anestezi').insert({ patient_id: patientId, doctor_id: doctorId }).select('id, next_kontrol, asa, hava_yolu, agri, notes').maybeSingle()
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

  if (adim === 'asa') {
    const s = asaSkorla(b.secilen, b.asaSinif, b.not ? String(b.not) : null)
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('anestezi_asa').insert({
      patient_id: patientId, doctor_id: user.id, hasta_anestezi_id: kayit?.id || null,
      tarih: T, maddeler: s.secilen, asa_sinif: s.asaSinif, hekim_kilit: b.hekimKilit === true, not_hekim: b.not ? String(b.not).slice(0, 500) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await sb.from('hasta_anestezi').update({
      asa: { secilen: s.secilen, asaSinif: s.asaSinif, not: b.not ? String(b.not).slice(0, 500) : null, tarih: T },
      updated_at: new Date().toISOString(),
    }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    const due = b.due && ISO_GUN.test(String(b.due)) ? String(b.due) : null
    await gorevEkle(sb, user.id, patientId, s.gorevOnerileri.map((g) => ({ ...g, due, kaynak: 'asa' })))
    // Alerji/ilaç bayrağı notes'a
    if (s.secilen.includes('alerji_ilac_listesi')) {
      const notes = { ...(typeof kayit?.notes === 'object' && kayit.notes ? kayit.notes as object : {}), alerjiIlac: true }
      await sb.from('hasta_anestezi').update({ notes, updated_at: new Date().toISOString() }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, secilen: s.secilen, asaSinif: s.asaSinif, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'havaYolu') {
    const s = havaYoluSkorla(b.havaYolu ?? b)
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const tarih = s.kart.tarih || T
    const { error } = await sb.from('anestezi_hava_yolu').insert({
      patient_id: patientId, doctor_id: user.id, hasta_anestezi_id: kayit?.id || null,
      tarih, bayraklar: s.kart.bayraklar, hekim_kilit: b.hekimKilit === true, not_hekim: s.kart.not,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await sb.from('hasta_anestezi').update({
      hava_yolu: { bayraklar: s.kart.bayraklar, tarih, not: s.kart.not },
      updated_at: new Date().toISOString(),
    }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    await gorevEkle(sb, user.id, patientId, s.gorevOnerileri.map((g) => ({ ...g, kaynak: 'havaYolu' })))
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, kart: s.kart, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'agri') {
    const s = agriSkorla(b.agri ?? b)
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const tarih = s.kart.tarih || T
    const { error } = await sb.from('anestezi_agri').insert({
      patient_id: patientId, doctor_id: user.id, hasta_anestezi_id: kayit?.id || null,
      tarih, bayraklar: s.kart.bayraklar, agri_skor: s.kart.agriSkor, hekim_kilit: b.hekimKilit === true, not_hekim: s.kart.not,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await sb.from('hasta_anestezi').update({
      agri: { bayraklar: s.kart.bayraklar, agriSkor: s.kart.agriSkor, tarih, not: s.kart.not },
      updated_at: new Date().toISOString(),
    }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    await gorevEkle(sb, user.id, patientId, s.gorevOnerileri.map((g) => ({ ...g, kaynak: 'agri' })))
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
    const { error } = await sb.from('anestezi_acil').insert({
      patient_id: patientId, doctor_id: user.id, hasta_anestezi_id: kayit?.id || null,
      tarih: T, bayraklar: bayraklar.map((x) => x.kod), eylem, hekim_onay: b.hekimOnay === true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (bayraklar.length) {
      const rn = await gununNotunaEkle(sb, user.id, patientId, `⚑ Anestezi acil bayrak: ${bayraklar.map((x) => x.ad).join('; ')} — hekim onayı verildi${eylem ? `: ${eylem}` : ''}. ${ACIL_YONLENDIRME_METNI}`)
      return NextResponse.json({ ok: true, bayraklar, notId: rn.eklendi ? rn.notId : null })
    }
    return NextResponse.json({ ok: true, bayraklar })
  }

  if (adim === 'gorev') {
    const { error } = await sb.from('anestezi_gorevleri')
      .update({ durum: b.durum === 'acik' ? 'acik' : 'tamam', tamam_at: b.durum === 'acik' ? null : new Date().toISOString() })
      .eq('id', String(b.gorevId || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }

  if (adim === 'kontrol') {
    const tarih = String(b.tarih || '')
    if (!ISO_GUN.test(tarih)) return NextResponse.json({ error: 'Kontrol tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('hasta_anestezi')
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
    sb.from('hasta_anestezi').select('id, next_kontrol, asa, hava_yolu, agri, notes').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle(),
    sb.from('anestezi_acil').select('id, tarih, bayraklar, eylem, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('anestezi_gorevleri').select('id, kod, ad, due, durum, kaynak').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }),
  ])

  const acikRisk = (riskQ.data || []).filter((r) => (r.bayraklar || []).length && !r.hekim_onay)
  const sonRisk = riskQ.data?.[0] || null
  const gorevler = (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null }))
  const asa = (bolum.data?.asa && typeof bolum.data.asa === 'object' ? bolum.data.asa : null) as { secilen?: string[]; asaSinif?: string } | null
  const havaYolu = (bolum.data?.hava_yolu && typeof bolum.data.hava_yolu === 'object' ? bolum.data.hava_yolu : null) as { bayraklar?: string[] } | null
  const agri = (bolum.data?.agri && typeof bolum.data.agri === 'object' ? bolum.data.agri : null) as { bayraklar?: string[]; agriSkor?: number } | null
  const notes = (bolum.data?.notes && typeof bolum.data.notes === 'object' ? bolum.data.notes : {}) as { alerjiIlac?: boolean }
  const asaSayi = Array.isArray(asa?.secilen) ? asa!.secilen!.length : 0
  const havaYoluSayi = Array.isArray(havaYolu?.bayraklar) ? havaYolu!.bayraklar!.length : 0
  const agriSayi = Array.isArray(agri?.bayraklar) ? agri!.bayraklar!.length : 0

  const planlar: Array<{ kaynak: string; madde: string }> = []
  if (asaSayi) planlar.push({ kaynak: 'ASA/pre-op', madde: `${asaSayi} madde${asa?.asaSinif ? ` · ASA ${asa.asaSinif}` : ''}` })
  if (havaYoluSayi) planlar.push({ kaynak: 'Hava yolu', madde: `${havaYoluSayi} bayrak` })
  if (agriSayi) planlar.push({ kaynak: 'Ağrı izlem', madde: `${agriSayi} bayrak` })
  if (notes.alerjiIlac) planlar.push({ kaynak: 'Alerji/ilaç', madde: 'liste doğrulandı' })

  const serit = anesteziSeridi({
    bugun: T,
    asaSayi,
    havaYoluSayi,
    agriSayi,
    riskBayraklari: acikRisk.flatMap((r) => (r.bayraklar || []).map(String)),
    riskHekimOnay: !acikRisk.length,
    sonrakiKontrol: bolum.data?.next_kontrol ? String(bolum.data.next_kontrol) : null,
    alerjiIlac: !!notes.alerjiIlac,
    gorevler,
    planlar,
  })

  return NextResponse.json({
    serit,
    bolum: {
      nextKontrol: bolum.data?.next_kontrol || null,
      asa: bolum.data?.asa || null,
      havaYolu: bolum.data?.hava_yolu || null,
      agri: bolum.data?.agri || null,
      notes: bolum.data?.notes || null,
    },
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
