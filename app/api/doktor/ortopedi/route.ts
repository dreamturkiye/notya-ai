/**
 * ORTOPEDI-EXCEPTIONAL-01 — Ortopedi API. Ayaktan muayenehane akışı.
 *
 * HASTA-İZOLASYON: her istek önce hastaSahibiMi → yabancı hasta 404.
 * GET  ?patientId= → şerit, son VAS/kırık-alçı, risk, görevler
 * POST adim: vas | kirik_alci | risk | gorev | kontrol
 * Açık "hemen" bayrak + hekimOnay yok → 409.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { skorla as vasSkorla, sonrakiVasGun, VAS_BANT_AD, FONKSIYON_MADDELER, type VasBant } from '@/specialties/ortopedi/engines/vasFonksiyon'
import { ozetle as kirikOzetle, TIP_AD, type KirikAlciTip } from '@/specialties/ortopedi/engines/kirikAlci'
import {
  acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, ACIL_KONTROL_LISTESI, HASTA_ACIL_METNI, type AcilKod,
} from '@/specialties/ortopedi/engines/acil'
import { ortoSeridi } from '@/specialties/ortopedi/engines/serit'
import {
  REF_ACIKLAMA, HEKIM_KILIT_METNI, ACIL_YONLENDIRME_METNI, KAPSAM_NOTU, gunEkle,
} from '@/specialties/ortopedi/engines/ortopedi'

export const dynamic = 'force-dynamic'

const bugun = () => new Date().toISOString().slice(0, 10)
const ISO = /^\d{4}-\d{2}-\d{2}$/

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: Array<{ kod: string; ad: string; due?: string | null; kaynak: string }>) {
  let eklenen = 0
  for (const x of g) {
    const { data } = await sb.from('orto_gorevleri').select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle()
    if (data) continue
    await sb.from('orto_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak })
    eklenen++
  }
  return eklenen
}

async function bolumKaydi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('hasta_ortopedi').select('id, next_kontrol, notes').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (data) return data
  const { data: yeni } = await sb.from('hasta_ortopedi').insert({ patient_id: patientId, doctor_id: doctorId }).select('id, next_kontrol, notes').maybeSingle()
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
    const vas = b.vas == null || b.vas === '' ? null : Number(b.vas)
    const maddeler = Array.isArray(b.maddeler) ? (b.maddeler as unknown[]).map((x) => (x == null || x === '' ? null : Number(x))) : []
    const s = vasSkorla(vas, maddeler)
    if (!s.tamamMi) return NextResponse.json({ error: `VAS/fonksiyon eksik: ${s.eksikMadde} alan boş — kısmi skor kaydedilmez`, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('orto_vas').insert({
      patient_id: patientId, doctor_id: user.id, hasta_ortopedi_id: kayit?.id || null,
      tarih: T, vas: s.vas, fonksiyon_toplam: s.fonksiyonToplam, bant: s.bant,
      hekim_kilit: b.hekimKilit === true,
      maddeler: { maddeler: maddeler.filter((x) => x != null), bant: s.bant },
      not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (b.gorevAc !== false) {
      await gorevEkle(sb, user.id, patientId, [{ kod: 'vas_tekrar', ad: 'VAS / fonksiyon formu tekrarı', due: gunEkle(T, sonrakiVasGun(s.bant)), kaynak: 'vas' }])
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, `${s.ozet} Bant karar desteğidir; tanı ve tedavi kararı hekimindedir.`)
    return NextResponse.json({ ok: true, vas: s.vas, bant: s.bant, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'kirik_alci') {
    const tipHam = String(b.tip || 'kirik')
    const tip = (['kirik', 'alci', 'ortez', 'op_sonrasi'].includes(tipHam) ? tipHam : 'kirik') as KirikAlciTip
    const girdi = {
      tip,
      bolge: String(b.bolge || '').slice(0, 80),
      taraf: String(b.taraf || '').slice(0, 40),
      baslangic: typeof b.baslangic === 'string' && ISO.test(b.baslangic) ? b.baslangic : null,
      alciAlma: typeof b.alciAlma === 'string' && ISO.test(b.alciAlma) ? b.alciAlma : null,
      yukVerme: typeof b.yukVerme === 'string' && ISO.test(b.yukVerme) ? b.yukVerme : null,
      nvDurum: String(b.nvDurum || 'Değerlendirilmedi').slice(0, 120),
      goruntuHazir: b.goruntuHazir === true,
      notHekim: b.not ? String(b.not).slice(0, 1000) : null,
      bugun: T,
    }
    const s = kirikOzetle(girdi)
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('orto_kirik_alci').insert({
      patient_id: patientId, doctor_id: user.id, hasta_ortopedi_id: kayit?.id || null,
      tarih: T, tip,
      hekim_kilit: b.hekimKilit === true,
      maddeler: girdi,
      not_hekim: girdi.notHekim,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (b.gorevAc !== false && s.gorevler.length) {
      await gorevEkle(sb, user.id, patientId, s.gorevler.map((x) => ({ ...x, kaynak: tip })))
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, `${s.ozet}${s.uyarilar.length ? `\nUyarı: ${s.uyarilar.join('; ')}` : ''}`)
    return NextResponse.json({ ok: true, tip, uyarilar: s.uyarilar, notId: rn.eklendi ? rn.notId : null })
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
    const { error } = await sb.from('orto_risk').insert({
      patient_id: patientId, doctor_id: user.id, hasta_ortopedi_id: kayit?.id || null,
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
    const { error } = await sb.from('orto_gorevleri')
      .update({ durum: b.durum === 'acik' ? 'acik' : 'tamam', tamam_at: b.durum === 'acik' ? null : new Date().toISOString() })
      .eq('id', String(b.gorevId || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }

  if (adim === 'kontrol') {
    const tarih = String(b.tarih || '')
    if (!ISO.test(tarih)) return NextResponse.json({ error: 'Kontrol tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('hasta_ortopedi')
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

  const [bolum, vasQ, kirikQ, riskQ, gorevQ] = await Promise.all([
    sb.from('hasta_ortopedi').select('id, next_kontrol, notes').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle(),
    sb.from('orto_vas').select('id, tarih, vas, fonksiyon_toplam, bant, maddeler, hekim_kilit, not_hekim').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(40),
    sb.from('orto_kirik_alci').select('id, tarih, tip, maddeler, hekim_kilit, not_hekim').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(40),
    sb.from('orto_risk').select('id, tarih, bayraklar, eylem, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('orto_gorevleri').select('id, kod, ad, due, durum, kaynak').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }),
  ])

  const vaslar = vasQ.data || []
  const kirikler = kirikQ.data || []
  const sonVas = vaslar[0] || null
  const sonKirik = kirikler[0] || null

  const acikRisk = (riskQ.data || []).filter((r) => (r.bayraklar || []).length && !r.hekim_onay)
  const sonRisk = riskQ.data?.[0] || null
  const gorevler = (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null }))

  const sonVasBant = (sonVas?.bant as VasBant | null) || null
  const kirikMadde = (sonKirik?.maddeler as { bolge?: string } | null) || null

  const planlar: Array<{ kaynak: string; madde: string }> = []
  if (sonVas) planlar.push({ kaynak: 'VAS', madde: `${sonVas.vas}/10 — ${sonVasBant ? VAS_BANT_AD[sonVasBant] : '—'} (karar desteği)` })
  if (sonKirik) {
    const tip = String(sonKirik.tip || '') as KirikAlciTip
    planlar.push({ kaynak: 'İzlem', madde: `${TIP_AD[tip] || tip}${kirikMadde?.bolge ? ` · ${kirikMadde.bolge}` : ''}` })
  }

  const serit = ortoSeridi({
    bugun: T,
    vas: sonVas ? { vas: sonVas.vas == null ? null : Number(sonVas.vas), bant: sonVasBant, tarih: String(sonVas.tarih) } : null,
    kirikAlci: sonKirik ? { tip: TIP_AD[String(sonKirik.tip) as KirikAlciTip] || String(sonKirik.tip), bolge: kirikMadde?.bolge || null, tarih: String(sonKirik.tarih) } : null,
    riskBayraklari: acikRisk.flatMap((r) => (r.bayraklar || []).map(String)),
    riskHekimOnay: !acikRisk.length,
    sonrakiKontrol: bolum.data?.next_kontrol ? String(bolum.data.next_kontrol) : null,
    gorevler,
    planlar,
  })

  return NextResponse.json({
    serit,
    bolum: { nextKontrol: bolum.data?.next_kontrol || null },
    vaslar,
    kirikler,
    sonVas: sonVas ? { ...sonVas, bantAd: sonVasBant ? VAS_BANT_AD[sonVasBant] : '—' } : null,
    sonKirik,
    risk: { son: sonRisk, acik: acikRisk, gecmis: riskQ.data || [] },
    gorevler: gorevQ.data || [],
    kutuphane: {
      vas: { maddeler: FONKSIYON_MADDELER, bantlar: VAS_BANT_AD },
      tipAd: TIP_AD,
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
