/**
 * GOGUS-EXCEPTIONAL-01 — Göğüs Hastalıkları API. Ayaktan muayenehane akışı.
 * HASTA-İZOLASYON: her istek hastaSahibiMi kapısından geçer.
 * GET  ?patientId= → şerit, skorlar, risk, görevler, kütüphane
 * POST adim: skor | risk | gorev | kontrol | spiro | gorev_tamam
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { catMmrcDegerlendir } from '@/specialties/gogus-hastaliklari/engines/catMmrc'
import {
  acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, ACIL_KONTROL_LISTESI, HASTA_ACIL_METNI, type AcilKod,
} from '@/specialties/gogus-hastaliklari/engines/acil'
import { gogusSeridi } from '@/specialties/gogus-hastaliklari/engines/serit'
import { GOGUS_RAPOR_SABLONLARI } from '@/specialties/gogus-hastaliklari/engines/sgkRapor'
import {
  REF_ACIKLAMA, HEKIM_KILIT_METNI, ACIL_YONLENDIRME_METNI, KAPSAM_NOTU, ayEkle,
} from '@/specialties/gogus-hastaliklari/engines/gogus'

export const dynamic = 'force-dynamic'

const bugun = () => new Date().toISOString().slice(0, 10)

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: Array<{ kod: string; ad: string; due?: string | null; kaynak: string }>) {
  let eklenen = 0
  for (const x of g) {
    const { data } = await sb.from('gogus_gorevleri').select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle()
    if (data) continue
    await sb.from('gogus_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak })
    eklenen++
  }
  return eklenen
}

async function bolumKaydi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('hasta_gogus').select('id, next_kontrol, notes').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (data) return data
  const { data: yeni } = await sb.from('hasta_gogus').insert({ patient_id: patientId, doctor_id: doctorId }).select('id, next_kontrol, notes').maybeSingle()
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

  if (adim === 'skor') {
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const sonuc = catMmrcDegerlendir({
      catMaddeler: Array.isArray(b.catMaddeler) ? (b.catMaddeler as unknown[]).map((x) => (x == null || x === '' ? null : Number(x))) : undefined,
      catToplam: b.catToplam == null || b.catToplam === '' ? null : Number(b.catToplam),
      mmrc: b.mmrc == null || b.mmrc === '' ? null : Number(b.mmrc),
      ortaAlevlenme12Ay: Number(b.ortaAlevlenme12Ay) || 0,
      yatisliAlevlenme12Ay: Number(b.yatisliAlevlenme12Ay) || 0,
      fev1Yuzde: b.fev1Yuzde == null || b.fev1Yuzde === '' ? null : Number(b.fev1Yuzde),
    })
    if (!sonuc.catTamam && sonuc.cat == null && sonuc.mmrc == null) {
      return NextResponse.json({ error: 'CAT veya mMRC girin (Notya skor uydurmaz)', sonuc }, { status: 400 })
    }
    const { error } = await sb.from('gogus_skor').insert({
      patient_id: patientId, doctor_id: user.id, hasta_gogus_id: kayit?.id || null,
      tarih: T, tur: 'cat_mmrc', toplam: sonuc.cat, hekim_kilit: b.hekimKilit === true,
      maddeler: { mmrc: sonuc.mmrc, grup: sonuc.grup, goldEvre: sonuc.goldEvre, cat: sonuc.cat },
      not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (b.gorevAc !== false) {
      await gorevEkle(sb, user.id, patientId, [{ kod: 'kontrol_randevu', ad: 'Kontrol randevusu', due: ayEkle(T, 3), kaynak: 'skor' }])
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, sonuc.ozet)
    return NextResponse.json({ ok: true, sonuc, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'spiro') {
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const fev1Fvc = b.fev1Fvc == null || b.fev1Fvc === '' ? null : Number(b.fev1Fvc)
    const fev1Yuzde = b.fev1Yuzde == null || b.fev1Yuzde === '' ? null : Number(b.fev1Yuzde)
    if (fev1Fvc == null && fev1Yuzde == null) return NextResponse.json({ error: 'FEV1/FVC veya FEV1% girin (cihaz entegrasyonu yok)' }, { status: 400 })
    const notes = { ...((kayit?.notes as object) || {}), sonSpiro: T, fev1Fvc, fev1Yuzde }
    await sb.from('hasta_gogus').update({ notes, updated_at: new Date().toISOString() })
      .eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    await gorevEkle(sb, user.id, patientId, [{ kod: 'spiro_tekrar', ad: 'Yıllık spirometri (elle / Belgeler)', due: ayEkle(T, 12), kaynak: 'spiro' }])
    const ozet = `Spirometri (elle giriş ${T}):${fev1Fvc != null ? ` FEV1/FVC ${fev1Fvc}` : ''}${fev1Yuzde != null ? ` FEV1 %${fev1Yuzde}` : ''}. Cihaz entegrasyonu yok; yorum hekimindir.`
    const rn = await gununNotunaEkle(sb, user.id, patientId, ozet)
    return NextResponse.json({ ok: true, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'risk') {
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const kodlar = (Array.isArray(b.kodlar) ? b.kodlar : []).map(String) as AcilKod[]
    const bayraklar = acilTara([String(b.metin || '')], kodlar)
    if (hekimOnayiGerekliMi(bayraklar) && b.hekimOnay !== true) {
      return NextResponse.json({ error: 'Açık kırmızı bayrakta hekim onayı gerekli', bayraklar }, { status: 409 })
    }
    const { error } = await sb.from('gogus_risk').insert({
      patient_id: patientId, doctor_id: user.id, hasta_gogus_id: kayit?.id || null,
      tarih: T, bayraklar: bayraklar.map((x) => x.kod),
      eylem: b.eylem ? String(b.eylem).slice(0, 1000) : bayraklar.map((x) => x.eylem).join(' · '),
      hekim_onay: b.hekimOnay === true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const ozet = bayraklar.length
      ? `Göğüs kırmızı bayrak: ${bayraklar.map((x) => x.ad).join('; ')}. ${b.hekimOnay === true ? 'Hekim onayı verildi.' : ''}`
      : 'Göğüs kırmızı bayrak taraması: yeni bayrak yok.'
    const rn = await gununNotunaEkle(sb, user.id, patientId, ozet)
    return NextResponse.json({ ok: true, bayraklar, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'kontrol') {
    const tarih = String(b.tarih || '')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tarih)) return NextResponse.json({ error: 'Geçerli kontrol tarihi gerekli' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    await sb.from('hasta_gogus').update({ next_kontrol: tarih, updated_at: new Date().toISOString() })
      .eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    await gorevEkle(sb, user.id, patientId, [{ kod: 'kontrol_randevu', ad: 'Kontrol randevusu', due: tarih, kaynak: 'kontrol' }])
    return NextResponse.json({ ok: true })
  }

  if (adim === 'gorev') {
    const kod = String(b.kod || 'kontrol_randevu')
    const ad = String(b.ad || 'Kontrol randevusu')
    const due = b.due ? String(b.due) : null
    await gorevEkle(sb, user.id, patientId, [{ kod, ad, due, kaynak: 'manuel' }])
    return NextResponse.json({ ok: true })
  }

  if (adim === 'gorev_tamam') {
    const id = String(b.gorevId || '')
    if (!id) return NextResponse.json({ error: 'gorevId gerekli' }, { status: 400 })
    const { error } = await sb.from('gogus_gorevleri').update({ durum: 'tamam', tamam_at: new Date().toISOString() })
      .eq('id', id).eq('doctor_id', user.id).eq('patient_id', patientId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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

  const [bolum, skorQ, riskQ, gorevQ] = await Promise.all([
    sb.from('hasta_gogus').select('id, next_kontrol, notes').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle(),
    sb.from('gogus_skor').select('id, tarih, tur, toplam, maddeler, hekim_kilit, not_hekim').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(20),
    sb.from('gogus_risk').select('id, tarih, bayraklar, eylem, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('gogus_gorevleri').select('id, kod, ad, due, durum, kaynak').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }),
  ])

  const sonSkor = skorQ.data?.[0] || null
  const maddeler = (sonSkor?.maddeler || {}) as { cat?: number; mmrc?: number; grup?: 'A' | 'B' | 'E' }
  const acikRisk = (riskQ.data || []).filter((r) => (r.bayraklar || []).length && !r.hekim_onay)
  const notes = (bolum.data?.notes || {}) as { sonSpiro?: string }
  const gorevler = (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null }))

  const serit = gogusSeridi({
    bugun: T,
    skor: sonSkor ? { cat: maddeler.cat ?? (sonSkor.toplam == null ? null : Number(sonSkor.toplam)), mmrc: maddeler.mmrc ?? null, grup: maddeler.grup ?? null, tarih: String(sonSkor.tarih) } : null,
    riskBayraklari: acikRisk.flatMap((r) => (r.bayraklar || []).map(String)),
    riskHekimOnay: !acikRisk.length,
    sonrakiKontrol: bolum.data?.next_kontrol ? String(bolum.data.next_kontrol) : null,
    sonSpiroTarihi: notes.sonSpiro || null,
    gorevler,
    planlar: [],
  })

  return NextResponse.json({
    serit,
    bolum: { nextKontrol: bolum.data?.next_kontrol || null, notes },
    skorlar: skorQ.data || [],
    risk: { son: riskQ.data?.[0] || null, acik: acikRisk, gecmis: riskQ.data || [] },
    gorevler: gorevQ.data || [],
    kutuphane: {
      acilKodlari: ACIL_KODLARI,
      acilListesi: ACIL_KONTROL_LISTESI,
      raporSablonlari: GOGUS_RAPOR_SABLONLARI,
      refler: REF_ACIKLAMA,
      hekimKilidi: HEKIM_KILIT_METNI,
      acilYonlendirme: ACIL_YONLENDIRME_METNI,
      hastaAcilMetni: HASTA_ACIL_METNI,
      kapsam: KAPSAM_NOTU,
    },
  })
}
