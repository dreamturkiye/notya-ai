/**
 * SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Spor hekimliği API. Ayaktan muayenehane akışı.
 *
 * HASTA-İZOLASYON: her istek önce hastaSahibiMi → yabancı hasta 404.
 * GET  ?patientId= → şerit, son RTP/sakatlık, risk, görevler
 * POST adim: rtp | sakatlik | risk | gorev | kontrol
 * Açık "hemen" bayrak + hekimOnay yok → 409.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { rtpDegerlendir, sonrakiRtpGun, RTP_BASAMAKLAR, RTP_BASAMAK_AD, type RtpBasamak } from '@/specialties/spor-hekimligi/engines/rtp'
import {
  sakatlikDegerlendir, sonrakiSakatlikGun, SIDDET_BANT_AD, BOLGELER, MEKANIZMALAR, type SiddetBant,
} from '@/specialties/spor-hekimligi/engines/sakatlik'
import {
  acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, ACIL_KONTROL_LISTESI, type AcilKod,
} from '@/specialties/spor-hekimligi/engines/acil'
import { sporSeridi } from '@/specialties/spor-hekimligi/engines/serit'
import {
  REF_ACIKLAMA, HEKIM_KILIT_METNI, ACIL_YONLENDIRME_METNI, KAPSAM_NOTU, gunEkle,
} from '@/specialties/spor-hekimligi/engines/spor'

export const dynamic = 'force-dynamic'

const bugun = () => new Date().toISOString().slice(0, 10)
const ISO = /^\d{4}-\d{2}-\d{2}$/

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: Array<{ kod: string; ad: string; due?: string | null; kaynak: string }>) {
  let eklenen = 0
  for (const x of g) {
    const { data } = await sb.from('spor_gorevleri').select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle()
    if (data) continue
    await sb.from('spor_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak })
    eklenen++
  }
  return eklenen
}

async function bolumKaydi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('hasta_spor').select('id, next_kontrol, spor_dali, notes').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (data) return data
  const { data: yeni } = await sb.from('hasta_spor').insert({ patient_id: patientId, doctor_id: doctorId }).select('id, next_kontrol, spor_dali, notes').maybeSingle()
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

  if (adim === 'rtp') {
    const s = rtpDegerlendir(b.basamak, b.not ? String(b.not) : null)
    if ('hata' in s) return NextResponse.json({ error: s.hata }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('spor_rtp').insert({
      patient_id: patientId, doctor_id: user.id, hasta_spor_id: kayit?.id || null,
      tarih: T, basamak: s.basamak,
      hekim_kilit: b.hekimKilit === true,
      maddeler: { basamakAd: s.basamakAd, dipnot: s.dipnot },
      not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (b.gorevAc !== false) {
      await gorevEkle(sb, user.id, patientId, [{ kod: 'rtp_kontrol', ad: 'RTP / antrenmana dönüş kontrolü', due: gunEkle(T, sonrakiRtpGun(s.basamak)), kaynak: 'rtp' }])
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, `${s.ozet} Basamak karar desteğidir; dönüş ve tanı hekimindir.`)
    return NextResponse.json({ ok: true, basamak: s.basamak, basamakAd: s.basamakAd, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'sakatlik') {
    const s = sakatlikDegerlendir({
      bolge: String(b.bolge || ''),
      mekanizma: b.mekanizma ? String(b.mekanizma) : null,
      siddet: (b.siddet as SiddetBant | null) || null,
      durum: (b.durum as 'aktif' | 'iyilesiyor' | 'kapandi') || 'aktif',
      yuklenmeUyari: b.yuklenmeUyari === true,
      yuklenmeDakika7: b.yuklenmeDakika7 == null || b.yuklenmeDakika7 === '' ? null : Number(b.yuklenmeDakika7),
      yuklenmeDakikaOnceki: b.yuklenmeDakikaOnceki == null || b.yuklenmeDakikaOnceki === '' ? null : Number(b.yuklenmeDakikaOnceki),
    })
    if ('hata' in s) return NextResponse.json({ error: s.hata }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('spor_sakatlik').insert({
      patient_id: patientId, doctor_id: user.id, hasta_spor_id: kayit?.id || null,
      tarih: T, bolge: s.bolge, mekanizma: s.mekanizma, siddet_bant: s.siddet,
      durum: s.durum, yuklenme_uyari: s.yuklenmeUyari,
      hekim_kilit: b.hekimKilit === true,
      maddeler: { yuklenmeNot: s.yuklenmeNot, siddetAd: s.siddetAd },
      not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (b.gorevAc !== false && s.durum !== 'kapandi') {
      await gorevEkle(sb, user.id, patientId, [{
        kod: 'sakatlik_izlem', ad: 'Sakatlık izlem kontrolü',
        due: gunEkle(T, sonrakiSakatlikGun(s.siddet, s.durum)), kaynak: 'sakatlik',
      }])
      if (s.yuklenmeUyari) {
        await gorevEkle(sb, user.id, patientId, [{ kod: 'yuklenme_degerlendirme', ad: 'Antrenman yükü değerlendirmesi', due: gunEkle(T, 7), kaynak: 'yuklenme' }])
      }
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, `${s.ozet}${s.yuklenmeNot ? ` · ${s.yuklenmeNot}` : ''}`)
    return NextResponse.json({ ok: true, bolge: s.bolge, siddet: s.siddet, yuklenmeUyari: s.yuklenmeUyari, notId: rn.eklendi ? rn.notId : null })
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
    const { error } = await sb.from('spor_risk').insert({
      patient_id: patientId, doctor_id: user.id, hasta_spor_id: kayit?.id || null,
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
    const { error } = await sb.from('spor_gorevleri')
      .update({ durum: b.durum === 'acik' ? 'acik' : 'tamam', tamam_at: b.durum === 'acik' ? null : new Date().toISOString() })
      .eq('id', String(b.gorevId || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }

  if (adim === 'kontrol') {
    const tarih = String(b.tarih || '')
    if (!ISO.test(tarih)) return NextResponse.json({ error: 'Kontrol tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const patch: Record<string, unknown> = { next_kontrol: tarih, updated_at: new Date().toISOString() }
    if (b.sporDali != null) patch.spor_dali = String(b.sporDali).slice(0, 80)
    const { error } = await sb.from('hasta_spor')
      .update(patch)
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

  const [bolum, rtpQ, sakQ, riskQ, gorevQ] = await Promise.all([
    sb.from('hasta_spor').select('id, next_kontrol, spor_dali, notes').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle(),
    sb.from('spor_rtp').select('id, tarih, basamak, maddeler, hekim_kilit, not_hekim').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(40),
    sb.from('spor_sakatlik').select('id, tarih, bolge, mekanizma, siddet_bant, durum, yuklenme_uyari, maddeler, hekim_kilit, not_hekim').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(40),
    sb.from('spor_risk').select('id, tarih, bayraklar, eylem, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('spor_gorevleri').select('id, kod, ad, due, durum, kaynak').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }),
  ])

  const rtpler = rtpQ.data || []
  const sakatliklar = sakQ.data || []
  const sonRtp = rtpler[0] || null
  const sonSakatlik = sakatliklar[0] || null
  const aktifSakatlik = sakatliklar.some((s) => s.durum === 'aktif' || s.durum === 'iyilesiyor')
  const yuklenmeUyari = sakatliklar.some((s) => s.yuklenme_uyari && (s.durum === 'aktif' || s.durum === 'iyilesiyor'))

  const acikRisk = (riskQ.data || []).filter((r) => (r.bayraklar || []).length && !r.hekim_onay)
  const sonRisk = riskQ.data?.[0] || null
  const gorevler = (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null }))

  const sonBasamak = (sonRtp?.basamak != null ? Number(sonRtp.basamak) : null) as RtpBasamak | null

  const planlar: Array<{ kaynak: string; madde: string }> = []
  if (sonRtp && sonBasamak != null) {
    planlar.push({ kaynak: 'RTP', madde: `Basamak ${sonBasamak} — ${RTP_BASAMAK_AD[sonBasamak] || '—'} (karar desteği)` })
  }
  if (sonSakatlik) {
    const siddet = sonSakatlik.siddet_bant as SiddetBant | null
    planlar.push({
      kaynak: 'Sakatlık',
      madde: `${sonSakatlik.bolge}${siddet ? ` — ${SIDDET_BANT_AD[siddet]}` : ''} · ${sonSakatlik.durum} (karar desteği)`,
    })
  }

  const serit = sporSeridi({
    bugun: T,
    rtp: sonRtp ? { basamak: sonBasamak, tarih: String(sonRtp.tarih) } : null,
    sakatlikAktif: aktifSakatlik,
    yuklenmeUyari,
    riskBayraklari: (sonRisk?.bayraklar as string[] | null) || [],
    riskHekimOnay: !!sonRisk?.hekim_onay,
    sonrakiKontrol: bolum.data?.next_kontrol ? String(bolum.data.next_kontrol) : null,
    gorevler: gorevler.map((g) => ({ kod: g.kod, ad: g.ad, due: g.due })),
    planlar,
  })

  return NextResponse.json({
    serit,
    bolum: { nextKontrol: bolum.data?.next_kontrol ? String(bolum.data.next_kontrol) : null, sporDali: bolum.data?.spor_dali || null },
    sonRtp: sonRtp ? { basamak: sonBasamak, basamakAd: sonBasamak != null ? RTP_BASAMAK_AD[sonBasamak] : '—', tarih: String(sonRtp.tarih) } : null,
    sonSakatlik: sonSakatlik ? {
      bolge: sonSakatlik.bolge, mekanizma: sonSakatlik.mekanizma, siddet_bant: sonSakatlik.siddet_bant,
      durum: sonSakatlik.durum, yuklenme_uyari: sonSakatlik.yuklenme_uyari, tarih: String(sonSakatlik.tarih),
      siddetAd: sonSakatlik.siddet_bant ? SIDDET_BANT_AD[sonSakatlik.siddet_bant as SiddetBant] : '—',
    } : null,
    risk: {
      son: sonRisk ? { tarih: String(sonRisk.tarih), bayraklar: sonRisk.bayraklar || [], eylem: sonRisk.eylem, hekim_onay: !!sonRisk.hekim_onay } : null,
      acik: acikRisk.map((r) => ({ tarih: String(r.tarih), bayraklar: r.bayraklar || [] })),
      gecmis: (riskQ.data || []).map((r) => ({ id: r.id, tarih: String(r.tarih), bayraklar: r.bayraklar || [], eylem: r.eylem, hekim_onay: !!r.hekim_onay })),
    },
    gorevler: (gorevQ.data || []).map((g) => ({ id: g.id, kod: g.kod, ad: g.ad, due: g.due, kaynak: g.kaynak })),
    kutuphane: {
      rtp: { basamaklar: RTP_BASAMAKLAR, adlar: RTP_BASAMAK_AD },
      sakatlik: { bolgeler: [...BOLGELER], mekanizmalar: [...MEKANIZMALAR], siddetler: SIDDET_BANT_AD },
      acilKodlari: ACIL_KODLARI,
      acilListesi: [...ACIL_KONTROL_LISTESI],
      hekimKilidi: HEKIM_KILIT_METNI,
      acilYonlendirme: ACIL_YONLENDIRME_METNI,
      kapsam: KAPSAM_NOTU,
      ref: REF_ACIKLAMA,
    },
  })
}
