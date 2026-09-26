/**
 * ONKOLOJI-EXCEPTIONAL-01 — Onkoloji API. Ayaktan muayenehane akışı.
 * HASTA-İZOLASYON: her istek hastaSahibiMi kapısından geçer.
 * GET  ?patientId= → şerit, kür, acil, görevler, toksisite
 * POST adim: kur | toksisite | sut | risk | gorev | kontrol | goruntu
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { kurSkorla, kurGorevleri, kurNormalize } from '@/specialties/onkoloji/engines/kur'
import { toksisiteSkorla, TOKSISITE_KONTROL_LISTESI } from '@/specialties/onkoloji/engines/toksisite'
import { sutTaslagi, type SutAmac } from '@/specialties/onkoloji/engines/sut'
import {
  acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, ACIL_KONTROL_LISTESI, HASTA_ACIL_METNI, type AcilKod,
} from '@/specialties/onkoloji/engines/acil'
import { onkoSeridi } from '@/specialties/onkoloji/engines/serit'
import {
  REF_ACIKLAMA, HEKIM_KILIT_METNI, ACIL_YONLENDIRME_METNI, KAPSAM_NOTU, ISO_GUN,
} from '@/specialties/onkoloji/engines/onkoloji'

export const dynamic = 'force-dynamic'

const bugun = () => new Date().toISOString().slice(0, 10)

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: Array<{ kod: string; ad: string; due?: string | null; kaynak: string }>) {
  let eklenen = 0
  for (const x of g) {
    const { data } = await sb.from('onko_gorevleri').select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle()
    if (data) continue
    await sb.from('onko_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak })
    eklenen++
  }
  return eklenen
}

async function bolumKaydi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('hasta_onkoloji').select('id, next_kontrol, kur, toksisite, notes').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (data) return data
  const { data: yeni } = await sb.from('hasta_onkoloji').insert({ patient_id: patientId, doctor_id: doctorId }).select('id, next_kontrol, kur, toksisite, notes').maybeSingle()
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

  if (adim === 'kur') {
    const s = kurSkorla(b.kur ?? b)
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('onko_kur').insert({
      patient_id: patientId, doctor_id: user.id, hasta_onkoloji_id: kayit?.id || null,
      tarih: T, mevcut_kur: s.kart.mevcutKur, toplam_kur: s.kart.toplamKur,
      protokol_etiket: s.kart.protokolEtiket, sonraki_kur: s.kart.sonrakiKurTarihi,
      hekim_kilit: b.hekimKilit === true, not_hekim: s.kart.not,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await sb.from('hasta_onkoloji').update({ kur: s.kart, updated_at: new Date().toISOString() }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    await gorevEkle(sb, user.id, patientId, kurGorevleri(s.kart).map((g) => ({ ...g, kaynak: 'kur' })))
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, kart: s.kart, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'toksisite') {
    const s = toksisiteSkorla(b.secilen, b.not ? String(b.not) : null)
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const due = b.due && ISO_GUN.test(String(b.due)) ? String(b.due) : null
    await sb.from('hasta_onkoloji').update({ toksisite: { secilen: s.secilen, not: b.not ? String(b.not).slice(0, 500) : null, tarih: T }, updated_at: new Date().toISOString() }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    await gorevEkle(sb, user.id, patientId, s.gorevOnerileri.map((g) => ({ ...g, due, kaynak: 'toksisite' })))
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, secilen: s.secilen, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'sut') {
    const s = sutTaslagi({
      amac: String(b.amac || 'tedavi_raporu') as SutAmac,
      endikasyonOzet: String(b.endikasyonOzet || ''),
      oncekiTedaviOzet: b.oncekiTedaviOzet ? String(b.oncekiTedaviOzet) : null,
      labOzet: b.labOzet ? String(b.labOzet) : null,
      hekimNot: b.hekimNot ? String(b.hekimNot) : null,
    })
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet }, { status: 400 })
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.taslak)
    await gorevEkle(sb, user.id, patientId, [{ kod: 'sut_rapor', ad: 'Belge / rapor işlemi', due: null, kaynak: 'sut' }])
    return NextResponse.json({ ok: true, taslak: s.taslak, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'goruntu') {
    const tarih = String(b.tarih || T)
    if (!ISO_GUN.test(tarih)) return NextResponse.json({ error: 'Görüntü tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    const etiket = String(b.etiket || 'Görüntü / rapor kontrolü').slice(0, 80)
    await gorevEkle(sb, user.id, patientId, [{ kod: 'goruntu_izlem', ad: etiket, due: tarih, kaynak: 'goruntu' }])
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const notes = { ...(typeof kayit?.notes === 'object' && kayit.notes ? kayit.notes as object : {}), goruntu: { sonraki: tarih, etiket } }
    await sb.from('hasta_onkoloji').update({ notes, updated_at: new Date().toISOString() }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    const rn = await gununNotunaEkle(sb, user.id, patientId, `Görüntü / rapor zaman çizelgesi: ${etiket} · ${tarih} (tanı yazılmaz).`)
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
    const { error } = await sb.from('onko_acil').insert({
      patient_id: patientId, doctor_id: user.id, hasta_onkoloji_id: kayit?.id || null,
      tarih: T, bayraklar: bayraklar.map((x) => x.kod), eylem, hekim_onay: b.hekimOnay === true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (bayraklar.length) {
      const rn = await gununNotunaEkle(sb, user.id, patientId, `⚑ Onkoloji acil bayrak: ${bayraklar.map((x) => x.ad).join('; ')} — hekim onayı verildi${eylem ? `: ${eylem}` : ''}. ${ACIL_YONLENDIRME_METNI}`)
      return NextResponse.json({ ok: true, bayraklar, notId: rn.eklendi ? rn.notId : null })
    }
    return NextResponse.json({ ok: true, bayraklar })
  }

  if (adim === 'gorev') {
    const { error } = await sb.from('onko_gorevleri')
      .update({ durum: b.durum === 'acik' ? 'acik' : 'tamam', tamam_at: b.durum === 'acik' ? null : new Date().toISOString() })
      .eq('id', String(b.gorevId || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }

  if (adim === 'kontrol') {
    const tarih = String(b.tarih || '')
    if (!ISO_GUN.test(tarih)) return NextResponse.json({ error: 'Kontrol tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('hasta_onkoloji')
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

  const [bolum, kurQ, riskQ, gorevQ] = await Promise.all([
    sb.from('hasta_onkoloji').select('id, next_kontrol, kur, toksisite, notes').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle(),
    sb.from('onko_kur').select('id, tarih, mevcut_kur, toplam_kur, protokol_etiket, sonraki_kur, hekim_kilit, not_hekim').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(20),
    sb.from('onko_acil').select('id, tarih, bayraklar, eylem, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('onko_gorevleri').select('id, kod, ad, due, durum, kaynak').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }),
  ])

  const kart = kurNormalize(bolum.data?.kur)
  const acikRisk = (riskQ.data || []).filter((r) => (r.bayraklar || []).length && !r.hekim_onay)
  const sonRisk = riskQ.data?.[0] || null
  const gorevler = (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null }))
  const tox = (bolum.data?.toksisite && typeof bolum.data.toksisite === 'object' ? bolum.data.toksisite : null) as { secilen?: string[] } | null
  const toksisiteSayi = Array.isArray(tox?.secilen) ? tox!.secilen!.length : 0
  const notes = (bolum.data?.notes && typeof bolum.data.notes === 'object' ? bolum.data.notes : {}) as { goruntu?: { sonraki?: string } }

  const planlar: Array<{ kaynak: string; madde: string }> = []
  if (kart.mevcutKur != null) planlar.push({ kaynak: 'Kür', madde: `${kart.mevcutKur}${kart.toplamKur != null ? '/' + kart.toplamKur : ''}` })
  if (kart.sonrakiKurTarihi) planlar.push({ kaynak: 'Sonraki kür', madde: kart.sonrakiKurTarihi })
  if (notes.goruntu?.sonraki) planlar.push({ kaynak: 'Görüntü', madde: notes.goruntu.sonraki })

  const serit = onkoSeridi({
    bugun: T,
    mevcutKur: kart.mevcutKur,
    toplamKur: kart.toplamKur,
    sonrakiKur: kart.sonrakiKurTarihi,
    riskBayraklari: acikRisk.flatMap((r) => (r.bayraklar || []).map(String)),
    riskHekimOnay: !acikRisk.length,
    sonrakiKontrol: bolum.data?.next_kontrol ? String(bolum.data.next_kontrol) : null,
    toksisiteSayi,
    gorevler,
    planlar,
  })

  return NextResponse.json({
    serit,
    bolum: { nextKontrol: bolum.data?.next_kontrol || null, kur: bolum.data?.kur || null, toksisite: bolum.data?.toksisite || null },
    kurlar: kurQ.data || [],
    risk: { son: sonRisk, acik: acikRisk, gecmis: riskQ.data || [] },
    gorevler: gorevQ.data || [],
    kutuphane: {
      acilKodlari: ACIL_KODLARI,
      acilListesi: ACIL_KONTROL_LISTESI,
      toksisiteListesi: TOKSISITE_KONTROL_LISTESI,
      refler: REF_ACIKLAMA,
      hekimKilidi: HEKIM_KILIT_METNI,
      acilYonlendirme: ACIL_YONLENDIRME_METNI,
      hastaAcilMetni: HASTA_ACIL_METNI,
      kapsam: KAPSAM_NOTU,
    },
  })
}
