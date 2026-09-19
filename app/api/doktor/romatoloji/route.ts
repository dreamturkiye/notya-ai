/**
 * ROMATOLOJI-EXCEPTIONAL-01 — Romatoloji API. Ayaktan muayenehane akışı.
 * HASTA-İZOLASYON: her istek hastaSahibiMi kapısından geçer.
 * GET  ?patientId= → şerit, skor, lab, eklem, acil, görevler
 * POST adim: skor | lab | eklem | sut | risk | gorev | kontrol
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { das28Skorla, basdaiSkorla } from '@/specialties/romatoloji/engines/das28Basdai'
import { labSkorla, sonrakiIzlemTarihi, type LabTur } from '@/specialties/romatoloji/engines/labIzlem'
import { eklemSay } from '@/specialties/romatoloji/engines/eklemHaritasi'
import { biyolojikSutKontrol, type BiyolojikEndikasyon } from '@/specialties/romatoloji/engines/biyolojikSut'
import {
  acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, ACIL_KONTROL_LISTESI, HASTA_ACIL_METNI, type AcilKod,
} from '@/specialties/romatoloji/engines/acil'
import { romaSeridi } from '@/specialties/romatoloji/engines/serit'
import {
  REF_ACIKLAMA, HEKIM_KILIT_METNI, ACIL_YONLENDIRME_METNI, KAPSAM_NOTU,
} from '@/specialties/romatoloji/engines/romatoloji'
import type { AktiviteBant } from '@/specialties/romatoloji/engines/das28Basdai'
import type { LabBant } from '@/specialties/romatoloji/engines/labIzlem'

export const dynamic = 'force-dynamic'

const bugun = () => new Date().toISOString().slice(0, 10)
const ISO = /^\d{4}-\d{2}-\d{2}$/

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: Array<{ kod: string; ad: string; due?: string | null; kaynak: string }>) {
  let eklenen = 0
  for (const x of g) {
    const { data } = await sb.from('roma_gorevleri').select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle()
    if (data) continue
    await sb.from('roma_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak })
    eklenen++
  }
  return eklenen
}

async function bolumKaydi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('hasta_romatoloji').select('id, next_kontrol, plan, notes').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (data) return data
  const { data: yeni } = await sb.from('hasta_romatoloji').insert({ patient_id: patientId, doctor_id: doctorId }).select('id, next_kontrol, plan, notes').maybeSingle()
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

  if (adim === 'skor') {
    const tur = String(b.tur || '')
    let sonuc
    if (tur === 'basdai') {
      const maddeler = Array.isArray(b.maddeler) ? b.maddeler.map((x) => (x == null ? null : Number(x))) : []
      sonuc = basdaiSkorla(maddeler)
    } else if (tur === 'das28_esr' || tur === 'das28_crp') {
      sonuc = das28Skorla({
        tjc: b.tjc == null ? null : Number(b.tjc),
        sjc: b.sjc == null ? null : Number(b.sjc),
        pga: b.pga == null ? null : Number(b.pga),
        crp: b.crp == null ? null : Number(b.crp),
        esr: b.esr == null ? null : Number(b.esr),
        varyant: tur === 'das28_esr' ? 'esr' : 'crp',
      })
    } else {
      return NextResponse.json({ error: 'Geçersiz skor türü' }, { status: 400 })
    }
    if (!sonuc.tamamMi) return NextResponse.json({ error: sonuc.ozet, sonuc }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('roma_skor').insert({
      patient_id: patientId, doctor_id: user.id, hasta_romatoloji_id: kayit?.id || null,
      tarih: T, tur: sonuc.tur, toplam: sonuc.toplam, bant: sonuc.bant,
      girdi: b, hekim_kilit: b.hekimKilit === true,
      not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await gorevEkle(sb, user.id, patientId, [{ kod: `skor_${sonuc.tur}`, ad: `${sonuc.tur.toUpperCase()} kontrol`, due: null, kaynak: 'skor' }])
    const rn = await gununNotunaEkle(sb, user.id, patientId, sonuc.ozet)
    return NextResponse.json({ ok: true, bant: sonuc.bant, toplam: sonuc.toplam, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'lab') {
    const tur = String(b.tur || '') as LabTur
    if (!['crp', 'esr', 'rf', 'anti_ccp', 'diger'].includes(tur)) return NextResponse.json({ error: 'Geçersiz lab türü' }, { status: 400 })
    const s = labSkorla(tur, b.deger == null ? null : Number(b.deger))
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const sonraki = sonrakiIzlemTarihi(T, s.sonrakiAy)
    const { error } = await sb.from('roma_lab').insert({
      patient_id: patientId, doctor_id: user.id, hasta_romatoloji_id: kayit?.id || null,
      tarih: T, tur, deger: s.deger, birim: tur === 'crp' ? 'mg/L' : tur === 'esr' ? 'mm/saat' : null,
      sonraki_izlem: sonraki, hekim_kilit: b.hekimKilit === true,
      not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (sonraki && b.gorevAc !== false) {
      await gorevEkle(sb, user.id, patientId, [{ kod: `lab_${tur}`, ad: `${tur.toUpperCase()} izlem`, due: sonraki, kaynak: 'lab' }])
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, bant: s.bant, sonraki, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'eklem') {
    const hassas = Array.isArray(b.hassas) ? b.hassas.map(String) : []
    const siskin = Array.isArray(b.siskin) ? b.siskin.map(String) : []
    const harita = eklemSay(hassas, siskin)
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('roma_eklem').insert({
      patient_id: patientId, doctor_id: user.id, hasta_romatoloji_id: kayit?.id || null,
      tarih: T, hassas: harita.hassas, siskin: harita.siskin, tjc: harita.tjc, sjc: harita.sjc,
      hekim_kilit: b.hekimKilit === true, not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const rn = await gununNotunaEkle(sb, user.id, patientId, harita.ozet)
    return NextResponse.json({ ok: true, tjc: harita.tjc, sjc: harita.sjc, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'sut') {
    const sonuc = biyolojikSutKontrol({
      endikasyon: (b.endikasyon as BiyolojikEndikasyon) || null,
      etkenSinif: b.etkenSinif ? String(b.etkenSinif) : null,
      oncekiCsDmard: typeof b.oncekiCsDmard === 'boolean' ? b.oncekiCsDmard : null,
      tbTarama: typeof b.tbTarama === 'boolean' ? b.tbTarama : null,
      hbvTarama: typeof b.hbvTarama === 'boolean' ? b.hbvTarama : null,
      hcvTarama: typeof b.hcvTarama === 'boolean' ? b.hcvTarama : null,
      akcigerGrafisi: typeof b.akcigerGrafisi === 'boolean' ? b.akcigerGrafisi : null,
      canliAsiBilgi: typeof b.canliAsiBilgi === 'boolean' ? b.canliAsiBilgi : null,
      hekimKilit: b.hekimKilit === true,
    })
    if (sonuc.dozIceriyorMu) return NextResponse.json({ error: 'Etken/sınıf alanında doz veya infüzyon HIS yazılamaz.', sonuc }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const notes = { ...(typeof kayit?.notes === 'object' && kayit.notes ? kayit.notes as object : {}), sut: { ...b, ozet: sonuc.ozet, eksikler: sonuc.eksikler, tarih: T } }
    await sb.from('hasta_romatoloji').update({ notes, updated_at: new Date().toISOString() }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    if (sonuc.eksikler.length) {
      await gorevEkle(sb, user.id, patientId, [{ kod: 'biyolojik_sut', ad: 'Biyolojik SUT eksik madde tamamla', due: null, kaynak: 'sut' }])
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, sonuc.ozet)
    return NextResponse.json({ ok: true, sonuc, notId: rn.eklendi ? rn.notId : null })
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
    const { error } = await sb.from('roma_acil').insert({
      patient_id: patientId, doctor_id: user.id, hasta_romatoloji_id: kayit?.id || null,
      tarih: T, bayraklar: bayraklar.map((x) => x.kod), eylem, hekim_onay: b.hekimOnay === true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (bayraklar.length) {
      const rn = await gununNotunaEkle(sb, user.id, patientId, `⚑ Romatoloji acil bayrak: ${bayraklar.map((x) => x.ad).join('; ')} — hekim onayı verildi${eylem ? `: ${eylem}` : ''}. ${ACIL_YONLENDIRME_METNI}`)
      return NextResponse.json({ ok: true, bayraklar, notId: rn.eklendi ? rn.notId : null })
    }
    return NextResponse.json({ ok: true, bayraklar })
  }

  if (adim === 'gorev') {
    const { error } = await sb.from('roma_gorevleri')
      .update({ durum: b.durum === 'acik' ? 'acik' : 'tamam', tamam_at: b.durum === 'acik' ? null : new Date().toISOString() })
      .eq('id', String(b.gorevId || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }

  if (adim === 'kontrol') {
    const tarih = String(b.tarih || '')
    if (!ISO.test(tarih)) return NextResponse.json({ error: 'Kontrol tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('hasta_romatoloji')
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

  const [bolum, skorQ, labQ, eklemQ, riskQ, gorevQ] = await Promise.all([
    sb.from('hasta_romatoloji').select('id, next_kontrol, plan, notes').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle(),
    sb.from('roma_skor').select('id, tarih, tur, toplam, bant, hekim_kilit').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(40),
    sb.from('roma_lab').select('id, tarih, tur, deger, sonraki_izlem, hekim_kilit').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(40),
    sb.from('roma_eklem').select('id, tarih, tjc, sjc, hassas, siskin').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('roma_acil').select('id, tarih, bayraklar, eylem, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('roma_gorevleri').select('id, kod, ad, due, durum, kaynak').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }),
  ])

  const skorlar = skorQ.data || []
  const lablar = labQ.data || []
  const sonDas = skorlar.find((s) => String(s.tur).startsWith('das28')) || null
  const sonBasdai = skorlar.find((s) => s.tur === 'basdai') || null
  const sonCrp = lablar.find((l) => l.tur === 'crp') || null
  const acikRisk = (riskQ.data || []).filter((r) => (r.bayraklar || []).length && !r.hekim_onay)
  const sonRisk = riskQ.data?.[0] || null
  const gorevler = (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null }))

  const crpBant = sonCrp ? labSkorla('crp', sonCrp.deger == null ? null : Number(sonCrp.deger)).bant : null

  const planlar: Array<{ kaynak: string; madde: string }> = []
  if (sonDas) planlar.push({ kaynak: 'DAS28', madde: `${sonDas.toplam} — ${sonDas.bant || '—'}` })
  if (sonBasdai) planlar.push({ kaynak: 'BASDAI', madde: `${sonBasdai.toplam} — ${sonBasdai.bant || '—'}` })
  if (sonCrp) planlar.push({ kaynak: 'CRP', madde: `${sonCrp.deger} — ${crpBant || '—'}` })

  const notes = (bolum.data?.notes && typeof bolum.data.notes === 'object' ? bolum.data.notes : {}) as { sut?: { eksikler?: string[] } }
  const sutEksik = Array.isArray(notes.sut?.eksikler) && notes.sut!.eksikler!.length > 0

  const serit = romaSeridi({
    bugun: T,
    das28: sonDas ? { toplam: sonDas.toplam == null ? null : Number(sonDas.toplam), bant: (sonDas.bant as AktiviteBant) || null, tarih: String(sonDas.tarih) } : null,
    basdai: sonBasdai ? { toplam: sonBasdai.toplam == null ? null : Number(sonBasdai.toplam), bant: (sonBasdai.bant as AktiviteBant) || null, tarih: String(sonBasdai.tarih) } : null,
    crp: sonCrp ? { deger: sonCrp.deger == null ? null : Number(sonCrp.deger), bant: crpBant as LabBant | null, tarih: String(sonCrp.tarih) } : null,
    riskBayraklari: acikRisk.flatMap((r) => (r.bayraklar || []).map(String)),
    riskHekimOnay: !acikRisk.length,
    sonrakiKontrol: bolum.data?.next_kontrol ? String(bolum.data.next_kontrol) : null,
    gorevler,
    planlar,
  })

  return NextResponse.json({
    serit,
    bolum: { nextKontrol: bolum.data?.next_kontrol || null, plan: bolum.data?.plan || null, notes: bolum.data?.notes || null },
    skorlar,
    lablar,
    eklemler: eklemQ.data || [],
    sonSkor: {
      das28: sonDas ? { toplam: sonDas.toplam, bant: sonDas.bant, tarih: String(sonDas.tarih) } : null,
      basdai: sonBasdai ? { toplam: sonBasdai.toplam, bant: sonBasdai.bant, tarih: String(sonBasdai.tarih) } : null,
    },
    sonLab: { crp: sonCrp ? { deger: sonCrp.deger, bant: crpBant, tarih: String(sonCrp.tarih) } : null },
    risk: { son: sonRisk, acik: acikRisk, gecmis: riskQ.data || [] },
    gorevler: gorevQ.data || [],
    sutEksik,
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
