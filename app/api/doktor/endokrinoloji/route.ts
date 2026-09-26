/**
 * ENDOKRINOLOJI-EXCEPTIONAL-01 — Endokrinoloji API. Ayaktan muayenehane akışı.
 * HASTA-İZOLASYON: her istek hastaSahibiMi kapısından geçer.
 * GET  ?patientId= → şerit, lab, acil, görevler, rejim
 * POST adim: lab | dxa | rejim | risk | gorev | kontrol
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { labSkorla, type LabTur } from '@/specialties/endokrinoloji/engines/labIzlem'
import { sonrakiIzlemTarihi } from '@/specialties/endokrinoloji/engines/labIzlem'
import { dxaPlanla, type DxaRisk } from '@/specialties/endokrinoloji/engines/dxa'
import {
  acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, ACIL_KONTROL_LISTESI, HASTA_ACIL_METNI, type AcilKod,
} from '@/specialties/endokrinoloji/engines/acil'
import { endoSeridi } from '@/specialties/endokrinoloji/engines/serit'
import { rejimNormalize, rejimGorevleri, rejimOzeti, rejimDozIceriyorMu } from '@/specialties/endokrinoloji/engines/rejim'
import {
  REF_ACIKLAMA, HEKIM_KILIT_METNI, ACIL_YONLENDIRME_METNI, KAPSAM_NOTU,
} from '@/specialties/endokrinoloji/engines/endokrinoloji'
import type { LabBant } from '@/specialties/endokrinoloji/engines/labIzlem'

export const dynamic = 'force-dynamic'

const bugun = () => new Date().toISOString().slice(0, 10)
const ISO = /^\d{4}-\d{2}-\d{2}$/

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: Array<{ kod: string; ad: string; due?: string | null; kaynak: string }>) {
  let eklenen = 0
  for (const x of g) {
    const { data } = await sb.from('endo_gorevleri').select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle()
    if (data) continue
    await sb.from('endo_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak })
    eklenen++
  }
  return eklenen
}

async function bolumKaydi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('hasta_endokrinoloji').select('id, next_kontrol, rejim, notes').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (data) return data
  const { data: yeni } = await sb.from('hasta_endokrinoloji').insert({ patient_id: patientId, doctor_id: doctorId }).select('id, next_kontrol, rejim, notes').maybeSingle()
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

  if (adim === 'lab') {
    const tur = String(b.tur || '') as LabTur
    if (!['hba1c', 'tsh', 'ft4', 'diger'].includes(tur)) return NextResponse.json({ error: 'Geçersiz lab türü' }, { status: 400 })
    const s = labSkorla(tur, b.deger == null ? null : Number(b.deger))
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const sonraki = sonrakiIzlemTarihi(T, s.sonrakiAy)
    const { error } = await sb.from('endo_lab').insert({
      patient_id: patientId, doctor_id: user.id, hasta_endokrinoloji_id: kayit?.id || null,
      tarih: T, tur, deger: s.deger, birim: tur === 'hba1c' ? '%' : tur === 'tsh' ? 'mIU/L' : null,
      sonraki_izlem: sonraki, hekim_kilit: b.hekimKilit === true,
      not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (sonraki && b.gorevAc !== false) {
      await gorevEkle(sb, user.id, patientId, [{ kod: `lab_${tur}`, ad: `${tur === 'hba1c' ? 'HbA1c' : tur.toUpperCase()} izlem`, due: sonraki, kaynak: 'lab' }])
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, `${s.ozet}`)
    return NextResponse.json({ ok: true, bant: s.bant, sonraki, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'dxa') {
    const risk = (String(b.risk || 'orta') as DxaRisk)
    const sonDxa = String(b.sonDxa || '')
    const plan = dxaPlanla(sonDxa, risk, T)
    if (!plan.tamamMi || !plan.sonrakiTarih) return NextResponse.json({ error: plan.ozet }, { status: 400 })
    const sonraki = String(b.sonraki || plan.sonrakiTarih)
    await gorevEkle(sb, user.id, patientId, [{ kod: 'dxa_tekrar', ad: 'Kemik yoğunluğu (DXA) kontrolü', due: sonraki, kaynak: 'dxa' }])
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const notes = { ...(typeof kayit?.notes === 'object' && kayit.notes ? kayit.notes as object : {}), dxa: { son: sonDxa, risk, sonraki, not: b.not ? String(b.not).slice(0, 500) : null } }
    await sb.from('hasta_endokrinoloji').update({ notes, updated_at: new Date().toISOString() }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    const rn = await gununNotunaEkle(sb, user.id, patientId, plan.ozet)
    return NextResponse.json({ ok: true, sonraki, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'rejim') {
    const kart = rejimNormalize(b.rejim)
    if (kart.not && rejimDozIceriyorMu(kart.not)) {
      return NextResponse.json({ error: 'Rejim notunda doz / ünite / mcg yazılamaz.' }, { status: 400 })
    }
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('hasta_endokrinoloji')
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
    const { error } = await sb.from('endo_acil').insert({
      patient_id: patientId, doctor_id: user.id, hasta_endokrinoloji_id: kayit?.id || null,
      tarih: T, bayraklar: bayraklar.map((x) => x.kod), eylem, hekim_onay: b.hekimOnay === true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (bayraklar.length) {
      const rn = await gununNotunaEkle(sb, user.id, patientId, `⚑ Endokrin acil bayrak: ${bayraklar.map((x) => x.ad).join('; ')} — hekim onayı verildi${eylem ? `: ${eylem}` : ''}. ${ACIL_YONLENDIRME_METNI}`)
      return NextResponse.json({ ok: true, bayraklar, notId: rn.eklendi ? rn.notId : null })
    }
    return NextResponse.json({ ok: true, bayraklar })
  }

  if (adim === 'gorev') {
    const { error } = await sb.from('endo_gorevleri')
      .update({ durum: b.durum === 'acik' ? 'acik' : 'tamam', tamam_at: b.durum === 'acik' ? null : new Date().toISOString() })
      .eq('id', String(b.gorevId || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }

  if (adim === 'kontrol') {
    const tarih = String(b.tarih || '')
    if (!ISO.test(tarih)) return NextResponse.json({ error: 'Kontrol tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('hasta_endokrinoloji')
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

  const [bolum, labQ, riskQ, gorevQ] = await Promise.all([
    sb.from('hasta_endokrinoloji').select('id, next_kontrol, rejim, notes').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle(),
    sb.from('endo_lab').select('id, tarih, tur, deger, sonraki_izlem, hekim_kilit, not_hekim').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(40),
    sb.from('endo_acil').select('id, tarih, bayraklar, eylem, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('endo_gorevleri').select('id, kod, ad, due, durum, kaynak').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }),
  ])

  const lablar = labQ.data || []
  const sonHba1c = lablar.find((l) => l.tur === 'hba1c') || null
  const sonTsh = lablar.find((l) => l.tur === 'tsh') || null
  const acikRisk = (riskQ.data || []).filter((r) => (r.bayraklar || []).length && !r.hekim_onay)
  const sonRisk = riskQ.data?.[0] || null
  const gorevler = (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null }))

  const notes = (bolum.data?.notes && typeof bolum.data.notes === 'object' ? bolum.data.notes : {}) as { dxa?: { sonraki?: string } }
  const dxaSonraki = notes.dxa?.sonraki || gorevler.find((g) => g.kod === 'dxa_tekrar')?.due || null

  const hba1cBant = sonHba1c ? labSkorla('hba1c', sonHba1c.deger == null ? null : Number(sonHba1c.deger)).bant : null
  const tshBant = sonTsh ? labSkorla('tsh', sonTsh.deger == null ? null : Number(sonTsh.deger)).bant : null

  const planlar: Array<{ kaynak: string; madde: string }> = []
  if (sonHba1c) planlar.push({ kaynak: 'HbA1c', madde: `${sonHba1c.deger} — ${hba1cBant || '—'}` })
  if (sonTsh) planlar.push({ kaynak: 'TSH', madde: `${sonTsh.deger} — ${tshBant || '—'}` })
  if (dxaSonraki) planlar.push({ kaynak: 'DXA', madde: `Tekrar ${dxaSonraki}` })

  const serit = endoSeridi({
    bugun: T,
    hba1c: sonHba1c ? { deger: sonHba1c.deger == null ? null : Number(sonHba1c.deger), bant: hba1cBant as LabBant | null, tarih: String(sonHba1c.tarih) } : null,
    tsh: sonTsh ? { deger: sonTsh.deger == null ? null : Number(sonTsh.deger), bant: tshBant as LabBant | null, tarih: String(sonTsh.tarih) } : null,
    riskBayraklari: acikRisk.flatMap((r) => (r.bayraklar || []).map(String)),
    riskHekimOnay: !acikRisk.length,
    sonrakiKontrol: bolum.data?.next_kontrol ? String(bolum.data.next_kontrol) : null,
    dxaSonraki,
    gorevler,
    planlar,
  })

  return NextResponse.json({
    serit,
    bolum: { nextKontrol: bolum.data?.next_kontrol || null, rejim: bolum.data?.rejim || null },
    lablar,
    sonLab: {
      hba1c: sonHba1c ? { deger: sonHba1c.deger == null ? null : Number(sonHba1c.deger), bant: hba1cBant, tarih: String(sonHba1c.tarih) } : null,
      tsh: sonTsh ? { deger: sonTsh.deger == null ? null : Number(sonTsh.deger), bant: tshBant, tarih: String(sonTsh.tarih) } : null,
    },
    risk: { son: sonRisk, acik: acikRisk, gecmis: riskQ.data || [] },
    gorevler: gorevQ.data || [],
    dxaSonraki,
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
