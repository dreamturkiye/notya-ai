/**
 * UROLOJI-EXCEPTIONAL-01 — Üroloji API. Ayaktan muayenehane akışı.
 *
 * HASTA-İZOLASYON: her istek önce hastaSahibiMi → yabancı hasta 404.
 * GET  ?patientId= → şerit, son IPSS/PSA, risk, görevler
 * POST adim: ipss | psa | risk | gorev | kontrol
 * Açık "hemen" bayrak + hekimOnay yok → 409.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { skorla as ipssSkorla, sonrakiIpssGun, IPSS_BANT_AD, IPSS_MADDELER, type IpssBant } from '@/specialties/uroloji/engines/ipss'
import { skorla as psaSkorla, skorlaSeri, sonrakiPsaGun, PSA_BANT_AD, PSA_ENAZ, PSA_ENUST, type PsaBant } from '@/specialties/uroloji/engines/psa'
import {
  acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, ACIL_KONTROL_LISTESI, HASTA_ACIL_METNI, type AcilKod,
} from '@/specialties/uroloji/engines/acil'
import { uroSeridi } from '@/specialties/uroloji/engines/serit'
import {
  REF_ACIKLAMA, HEKIM_KILIT_METNI, ACIL_YONLENDIRME_METNI, KAPSAM_NOTU, gunEkle,
} from '@/specialties/uroloji/engines/uroloji'

export const dynamic = 'force-dynamic'

const bugun = () => new Date().toISOString().slice(0, 10)
const ISO = /^\d{4}-\d{2}-\d{2}$/

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: Array<{ kod: string; ad: string; due?: string | null; kaynak: string }>) {
  let eklenen = 0
  for (const x of g) {
    const { data } = await sb.from('uro_gorevleri').select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle()
    if (data) continue
    await sb.from('uro_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak })
    eklenen++
  }
  return eklenen
}

async function bolumKaydi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('hasta_uro').select('id, next_kontrol, notes').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (data) return data
  const { data: yeni } = await sb.from('hasta_uro').insert({ patient_id: patientId, doctor_id: doctorId }).select('id, next_kontrol, notes').maybeSingle()
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

  if (adim === 'ipss') {
    const maddeler = Array.isArray(b.maddeler) ? (b.maddeler as unknown[]).map((x) => (x == null || x === '' ? null : Number(x))) : []
    const qol = b.qol == null || b.qol === '' ? null : Number(b.qol)
    const s = ipssSkorla(maddeler, qol)
    if (!s.tamamMi) return NextResponse.json({ error: `IPSS eksik: ${s.eksikMadde} madde boş — kısmi skor kaydedilmez`, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('uro_ipss').insert({
      patient_id: patientId, doctor_id: user.id, hasta_uro_id: kayit?.id || null,
      tarih: T, toplam: s.toplam, bant: s.bant,
      hekim_kilit: b.hekimKilit === true,
      maddeler: { maddeler: maddeler.filter((x) => x != null), qol: s.qol, bant: s.bant },
      not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (b.gorevAc !== false) {
      await gorevEkle(sb, user.id, patientId, [{ kod: 'ipss_tekrar', ad: 'IPSS semptom formu tekrarı', due: gunEkle(T, sonrakiIpssGun(s.bant)), kaynak: 'ipss' }])
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, `${s.ozet} Bant karar desteğidir; tanı ve tedavi kararı hekimindedir.`)
    return NextResponse.json({ ok: true, toplam: s.toplam, bant: s.bant, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'psa') {
    const deger = b.deger == null || b.deger === '' ? null : Number(b.deger)
    if (deger == null || !Number.isFinite(deger) || deger < PSA_ENAZ || deger > PSA_ENUST) {
      return NextResponse.json({ error: `PSA ${PSA_ENAZ}–${PSA_ENUST} ng/mL aralığında olmalı` }, { status: 400 })
    }
    const tarih = typeof b.tarih === 'string' && ISO.test(b.tarih) ? b.tarih : T
    const onceki = Array.isArray(b.oncekiler)
      ? (b.oncekiler as Array<{ tarih?: string; deger?: number }>).filter((p) => p.tarih && p.deger != null).map((p) => ({ tarih: String(p.tarih), deger: Number(p.deger) }))
      : []
    const yas = b.yas == null || b.yas === '' ? null : Number(b.yas)
    const s = onceki.length
      ? skorlaSeri([...onceki, { tarih, deger }], yas)
      : psaSkorla(deger, onceki, yas)
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('uro_psa').insert({
      patient_id: patientId, doctor_id: user.id, hasta_uro_id: kayit?.id || null,
      tarih, deger_ng_ml: s.deger,
      hekim_kilit: b.hekimKilit === true,
      maddeler: {
        bant: s.bant, hiz: s.hizNgMlYil, hizNot: s.hizNot,
        onceki_deger: onceki.length ? onceki[onceki.length - 1]?.deger : null,
        yas,
      },
      not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (b.gorevAc !== false) {
      await gorevEkle(sb, user.id, patientId, [{ kod: 'psa_izlem', ad: 'PSA izlem kontrolü', due: gunEkle(tarih, sonrakiPsaGun(s.bant)), kaynak: 'psa' }])
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, `${s.ozet} Bant karar desteğidir; kanser tanısı değildir.`)
    return NextResponse.json({ ok: true, deger: s.deger, bant: s.bant, hiz: s.hizNgMlYil, notId: rn.eklendi ? rn.notId : null })
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
    const { error } = await sb.from('uro_risk').insert({
      patient_id: patientId, doctor_id: user.id, hasta_uro_id: kayit?.id || null,
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
    const { error } = await sb.from('uro_gorevleri')
      .update({ durum: b.durum === 'acik' ? 'acik' : 'tamam', tamam_at: b.durum === 'acik' ? null : new Date().toISOString() })
      .eq('id', String(b.gorevId || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }

  if (adim === 'kontrol') {
    const tarih = String(b.tarih || '')
    if (!ISO.test(tarih)) return NextResponse.json({ error: 'Kontrol tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('hasta_uro')
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

  const [bolum, ipssQ, psaQ, riskQ, gorevQ] = await Promise.all([
    sb.from('hasta_uro').select('id, next_kontrol, notes').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle(),
    sb.from('uro_ipss').select('id, tarih, toplam, bant, maddeler, hekim_kilit, not_hekim').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(40),
    sb.from('uro_psa').select('id, tarih, deger_ng_ml, maddeler, hekim_kilit, not_hekim').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(40),
    sb.from('uro_risk').select('id, tarih, bayraklar, eylem, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('uro_gorevleri').select('id, kod, ad, due, durum, kaynak').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }),
  ])

  const ipssler = ipssQ.data || []
  const psalar = psaQ.data || []
  const sonIpss = ipssler[0] || null
  const sonPsa = psalar[0] || null
  const oncekiPsa = psalar[1] || null

  const acikRisk = (riskQ.data || []).filter((r) => (r.bayraklar || []).length && !r.hekim_onay)
  const sonRisk = riskQ.data?.[0] || null
  const gorevler = (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null }))

  const sonIpssBant = (sonIpss?.bant as IpssBant | null) || null
  const sonPsaBant = ((sonPsa?.maddeler as { bant?: PsaBant } | null)?.bant) || null

  const planlar: Array<{ kaynak: string; madde: string }> = []
  if (sonIpss) planlar.push({ kaynak: 'IPSS', madde: `Toplam ${sonIpss.toplam} — ${sonIpssBant ? IPSS_BANT_AD[sonIpssBant] : '—'} (karar desteği)` })
  if (sonPsa) {
    const hizNot = (sonPsa.maddeler as { hizNot?: string } | null)?.hizNot
    planlar.push({ kaynak: 'PSA', madde: `${sonPsa.deger_ng_ml} ng/mL — ${sonPsaBant ? PSA_BANT_AD[sonPsaBant] : '—'} (karar desteği)${hizNot ? ` · ${hizNot}` : ''}` })
  }
  if (oncekiPsa && sonPsa) {
    planlar.push({ kaynak: 'PSA değişim', madde: `Önceki ${oncekiPsa.deger_ng_ml} → şimdi ${sonPsa.deger_ng_ml} ng/mL (yorum hekimde)` })
  }

  const serit = uroSeridi({
    bugun: T,
    ipss: sonIpss ? { toplam: sonIpss.toplam == null ? null : Number(sonIpss.toplam), bant: sonIpssBant, tarih: String(sonIpss.tarih) } : null,
    psa: sonPsa ? { deger: sonPsa.deger_ng_ml == null ? null : Number(sonPsa.deger_ng_ml), bant: sonPsaBant, tarih: String(sonPsa.tarih) } : null,
    riskBayraklari: acikRisk.flatMap((r) => (r.bayraklar || []).map(String)),
    riskHekimOnay: !acikRisk.length,
    sonrakiKontrol: bolum.data?.next_kontrol ? String(bolum.data.next_kontrol) : null,
    gorevler,
    planlar,
  })

  return NextResponse.json({
    serit,
    bolum: { nextKontrol: bolum.data?.next_kontrol || null },
    ipssler,
    psalar,
    sonIpss: sonIpss ? { ...sonIpss, bantAd: sonIpssBant ? IPSS_BANT_AD[sonIpssBant] : '—' } : null,
    sonPsa: sonPsa ? { ...sonPsa, bantAd: sonPsaBant ? PSA_BANT_AD[sonPsaBant] : '—' } : null,
    risk: { son: sonRisk, acik: acikRisk, gecmis: riskQ.data || [] },
    gorevler: gorevQ.data || [],
    kutuphane: {
      ipss: { maddeler: IPSS_MADDELER, bantlar: IPSS_BANT_AD },
      psa: { bantlar: PSA_BANT_AD },
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
