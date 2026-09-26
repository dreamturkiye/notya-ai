/**
 * NOROLOJI-EXCEPTIONAL-01 — Nöroloji API. Ayaktan muayenehane akışı.
 * HASTA-İZOLASYON: her istek hastaSahibiMi kapısından geçer.
 * GET  ?patientId= → şerit, MIDAS, risk, görevler, ilaç izlem taslağı
 * POST adim: migren | risk | gorev | kontrol | ilac_izlem
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { skorla as migrenSkorla, sonrakiOlcekGun, MIGREN_MADDELER, MIGREN_BANT_AD, type MigrenBant } from '@/specialties/noroloji/engines/migren'
import { noroIlacIzlemGorevleri } from '@/specialties/noroloji/engines/ilacIzlem'
import {
  acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, ACIL_KONTROL_LISTESI, HASTA_ACIL_METNI, type AcilKod,
} from '@/specialties/noroloji/engines/acil'
import { noroSeridi } from '@/specialties/noroloji/engines/serit'
import {
  REF_ACIKLAMA, HEKIM_KILIT_METNI, ACIL_YONLENDIRME_METNI, KAPSAM_NOTU, gunEkle,
} from '@/specialties/noroloji/engines/noroloji'
import { arsivsizIlaclar } from '@/lib/doktor/arsiv'

export const dynamic = 'force-dynamic'

const bugun = () => new Date().toISOString().slice(0, 10)
const ISO = /^\d{4}-\d{2}-\d{2}$/

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: Array<{ kod: string; ad: string; due?: string | null; kaynak: string }>) {
  let eklenen = 0
  for (const x of g) {
    const { data } = await sb.from('noro_gorevleri').select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle()
    if (data) continue
    await sb.from('noro_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak })
    eklenen++
  }
  return eklenen
}

async function bolumKaydi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('hasta_noroloji').select('id, next_kontrol, notes').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (data) return data
  const { data: yeni } = await sb.from('hasta_noroloji').insert({ patient_id: patientId, doctor_id: doctorId }).select('id, next_kontrol, notes').maybeSingle()
  return yeni || null
}

async function sonLabTarihleri(sb: Sb, patientId: string): Promise<Record<string, string | null>> {
  const keys = ['ALT', 'AST', 'Plt', 'Hb', 'Na', 'WBC', 'Kre', 'eGFR', 'Neu']
  const out: Record<string, string | null> = Object.fromEntries(keys.map((k) => [k, null]))
  try {
    const { data } = await sb.from('lab_satirlar').select('canonical_key, numune_tarihi').eq('patient_id', patientId).in('canonical_key', keys).order('numune_tarihi', { ascending: false }).limit(200)
    for (const r of data || []) {
      const k = String(r.canonical_key)
      if (k in out && !out[k] && r.numune_tarihi) out[k] = String(r.numune_tarihi).slice(0, 10)
    }
  } catch { /* lab tablosu yoksa boş */ }
  return out
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

  if (adim === 'migren') {
    const maddeler = Array.isArray(b.maddeler) ? (b.maddeler as unknown[]).map((x) => (x == null || x === '' ? null : Number(x))) : []
    const s = migrenSkorla(maddeler)
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('noro_migren').insert({
      patient_id: patientId, doctor_id: user.id, hasta_noroloji_id: kayit?.id || null,
      tarih: T, maddeler: { maddeler, sorular: MIGREN_MADDELER }, toplam: s.toplam, bant: s.bant,
      hekim_kilit: b.hekimKilit === true,
      not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (b.gorevAc !== false) {
      await gorevEkle(sb, user.id, patientId, [{ kod: 'migren_tekrar', ad: 'Baş ağrısı takip formu (MIDAS)', due: gunEkle(T, sonrakiOlcekGun(s.bant)), kaynak: 'migren' }])
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, `${s.ozet}`)
    return NextResponse.json({ ok: true, toplam: s.toplam, bant: s.bant, notId: rn.eklendi ? rn.notId : null })
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
    const { error } = await sb.from('noro_risk').insert({
      patient_id: patientId, doctor_id: user.id, hasta_noroloji_id: kayit?.id || null,
      tarih: T, bayraklar: bayraklar.map((x) => x.kod), eylem, hekim_onay: b.hekimOnay === true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (bayraklar.length) {
      const rn = await gununNotunaEkle(sb, user.id, patientId, `⚑ İnme/TIA bayrak değerlendirmesi: ${bayraklar.map((x) => x.ad).join('; ')} — hekim onayı verildi${eylem ? `: ${eylem}` : ''}. ${ACIL_YONLENDIRME_METNI}`)
      return NextResponse.json({ ok: true, bayraklar, notId: rn.eklendi ? rn.notId : null })
    }
    return NextResponse.json({ ok: true, bayraklar })
  }

  if (adim === 'gorev') {
    const { error } = await sb.from('noro_gorevleri')
      .update({ durum: b.durum === 'acik' ? 'acik' : 'tamam', tamam_at: b.durum === 'acik' ? null : new Date().toISOString() })
      .eq('id', String(b.gorevId || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }

  if (adim === 'kontrol') {
    const tarih = String(b.tarih || '')
    if (!ISO.test(tarih)) return NextResponse.json({ error: 'Kontrol tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('hasta_noroloji')
      .update({ next_kontrol: tarih, updated_at: new Date().toISOString() })
      .eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await gorevEkle(sb, user.id, patientId, [{ kod: 'kontrol_randevu', ad: 'Kontrol randevusu', due: tarih, kaynak: 'kontrol' }])
    return NextResponse.json({ ok: true })
  }

  if (adim === 'ilac_izlem') {
    const [{ data: ilaclar }, sonLab] = await Promise.all([
      arsivsizIlaclar(sb, 'ilac_adi, etken_madde, baslangic_tarihi, aktif').eq('patient_id', patientId).eq('aktif', true),
      sonLabTarihleri(sb, patientId),
    ])
    const g = noroIlacIzlemGorevleri(
      (ilaclar || []).map((i) => ({ ad: String(i.ilac_adi), etken: i.etken_madde, baslangic: i.baslangic_tarihi ? String(i.baslangic_tarihi) : null, aktif: true })),
      sonLab, T,
    )
    const eklenen = await gorevEkle(sb, user.id, patientId, g.map((x) => ({ kod: x.kod, ad: `${x.ad} (${x.ilac})`, due: x.due, kaynak: 'ilac_izlem' })))
    return NextResponse.json({ ok: true, eklenen, sayi: g.length })
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

  const [bolum, migrenQ, riskQ, gorevQ, ilacQ, sonLab] = await Promise.all([
    sb.from('hasta_noroloji').select('id, next_kontrol, notes').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle(),
    sb.from('noro_migren').select('id, tarih, toplam, bant, maddeler, hekim_kilit, not_hekim').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(40),
    sb.from('noro_risk').select('id, tarih, bayraklar, eylem, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('noro_gorevleri').select('id, kod, ad, due, durum, kaynak').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }),
    arsivsizIlaclar(sb, 'id, ilac_adi, etken_madde, baslangic_tarihi, aktif').eq('patient_id', patientId).eq('aktif', true),
    sonLabTarihleri(sb, patientId),
  ])

  const migrenler = migrenQ.data || []
  const son = migrenler[0] || null
  const izlem = noroIlacIzlemGorevleri(
    (ilacQ.data || []).map((i) => ({ ad: String(i.ilac_adi), etken: i.etken_madde, baslangic: i.baslangic_tarihi ? String(i.baslangic_tarihi) : null, aktif: true })),
    sonLab, T,
  )
  const acikRisk = (riskQ.data || []).filter((r) => (r.bayraklar || []).length && !r.hekim_onay)
  const sonRisk = riskQ.data?.[0] || null
  const gorevler = (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null }))

  const planlar: Array<{ kaynak: string; madde: string }> = []
  if (son) planlar.push({ kaynak: 'MIDAS', madde: `Toplam ${son.toplam} — ${son.bant ? (MIGREN_BANT_AD[son.bant as MigrenBant] || son.bant) : '—'}` })
  for (const g of izlem) planlar.push({ kaynak: 'İlaç izlem', madde: `${g.ad} — ${g.due}` })

  const serit = noroSeridi({
    bugun: T,
    migren: son ? { toplam: son.toplam == null ? null : Number(son.toplam), bant: (son.bant as MigrenBant) || null, tarih: String(son.tarih) } : null,
    riskBayraklari: acikRisk.flatMap((r) => (r.bayraklar || []).map(String)),
    riskHekimOnay: !acikRisk.length,
    sonrakiKontrol: bolum.data?.next_kontrol ? String(bolum.data.next_kontrol) : null,
    ilacIzlemAcik: izlem.length,
    gorevler,
    planlar,
  })

  return NextResponse.json({
    serit,
    bolum: { nextKontrol: bolum.data?.next_kontrol || null },
    migrenler,
    sonMigren: son,
    risk: { son: sonRisk, acik: acikRisk, gecmis: riskQ.data || [] },
    gorevler: gorevQ.data || [],
    ilaclar: ilacQ.data || [],
    izlem,
    kutuphane: {
      migren: { maddeler: MIGREN_MADDELER, bantlar: MIGREN_BANT_AD },
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
