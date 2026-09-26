/**
 * KBB-EXCEPTIONAL-01 — Kulak Burun Boğaz Hastalıkları API. Ayaktan muayenehane akışı.
 *
 * HASTA-İZOLASYON: her istek önce hastaSahibiMi(supabase, user.id, patientId) kapısından geçer; yabancı
 * hasta 404 döner. Satır güncellemeleri hem id hem doctor_id ile kapsanır (.cursor/skills/hasta-izolasyon).
 *
 * GET  ?patientId= → şerit çipleri, son odyometri, açık kırmızı bayrak, görevler, kütüphane
 * POST adim: odyometri | otoskopi | vertigo | risk | gorev | kontrol | osas
 *
 * Kilitler: doz üretilmez, tanı kilitlenmez, PTA bandı tanıya çevrilmez, kayıp tipi hekimin. Açık
 * "hemen" kırmızı bayrak varken hekim onayı olmadan risk kaydı yazılmaz (409).
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import {
  skorla as odyoSkorla, ptaBandi, degisim as odyoDegisim, sonrakiOlcumGun, asimetriNotu,
  kayipTipiGecerliMi, KAYIP_TIPI_AD, PTA_FREKANSLARI, ODYO_BANT_AD, PTA_ENAZ, PTA_ENUST, type OdyoBant,
} from '@/specialties/kulak-burun-bogaz/engines/odyometri'
import {
  otoskopiNotu, DIS_KULAK_AD, TM_AD, EK_BULGULAR,
} from '@/specialties/kulak-burun-bogaz/engines/otoskopi'
import {
  vertigoNotu, manevraSonrasiKontrolGun, MANEVRA_AD, SONUC_AD, NISTAGMUS_OZELLIKLERI, SANTRAL_ISARETLERI,
} from '@/specialties/kulak-burun-bogaz/engines/vertigo'
import {
  acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, ACIL_KONTROL_LISTESI, HASTA_ACIL_METNI, type AcilKod,
} from '@/specialties/kulak-burun-bogaz/engines/acil'
import { kbbSeridi } from '@/specialties/kulak-burun-bogaz/engines/serit'
import { KBB_RAPOR_SABLONLARI } from '@/specialties/kulak-burun-bogaz/engines/sgkRapor'
import {
  BURUN_SIKAYET_AD, BURUN_MUAYENE_BULGULARI, TEDAVI_BASAMAKLARI, SURE_AD,
} from '@/specialties/kulak-burun-bogaz/engines/sinusRinit'
import {
  REF_ACIKLAMA, HEKIM_KILIT_METNI, ACIL_YONLENDIRME_METNI, KAPSAM_NOTU, YAN_AD, gunEkle, yanGecerliMi,
} from '@/specialties/kulak-burun-bogaz/engines/kbb'

export const dynamic = 'force-dynamic'

const bugun = () => new Date().toISOString().slice(0, 10)
const ISO = /^\d{4}-\d{2}-\d{2}$/

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

/** Aynı kod açıkken görev tekrar açılmaz (psikiyatri / dahiliye gorevEkle deseni). */
async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: Array<{ kod: string; ad: string; due?: string | null; kaynak: string }>) {
  let eklenen = 0
  for (const x of g) {
    const { data } = await sb.from('kbb_gorevleri').select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle()
    if (data) continue
    await sb.from('kbb_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak })
    eklenen++
  }
  return eklenen
}

async function bolumKaydi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('hasta_kbb').select('id, next_kontrol, notes').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (data) return data
  const { data: yeni } = await sb.from('hasta_kbb').insert({ patient_id: patientId, doctor_id: doctorId }).select('id, next_kontrol, notes').maybeSingle()
  return yeni || null
}

type Notlar = { osas?: { durum?: string; not?: string | null; due?: string | null } | null }

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b?.adim) return NextResponse.json({ error: 'adım gerekli' }, { status: 400 })
  const patientId = String(b.patientId || '')
  // HASTA-İZOLASYON: kimlik doğrulanmadan hiçbir okuma/yazma yapılmaz; yabancı hasta = yok (404).
  if (!(await hastaSahibiMi(sb, user.id, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  const adim = String(b.adim)
  const T = bugun()

  if (adim === 'odyometri') {
    if (!yanGecerliMi(b.yan)) return NextResponse.json({ error: 'Kulak tarafı sag / sol / iki olmalı' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const esikler = Array.isArray(b.esikler) ? (b.esikler as unknown[]).map((x) => (x == null || x === '' ? null : Number(x))) : []
    const elleDeger = b.pta == null || b.pta === '' ? null : Number(b.pta)

    let pta: number | null = null
    let bant: OdyoBant | null = null
    let ozet = ''
    if (esikler.length) {
      const s = odyoSkorla(esikler, b.yan)
      if (!s.tamamMi) return NextResponse.json({ error: `Odyometri eksik: ${s.eksikFrekans} frekans boş — kısmi ölçüm kaydedilmez`, sonuc: s }, { status: 400 })
      pta = s.pta
      bant = s.bant
      ozet = s.ozet
    } else if (elleDeger != null && Number.isFinite(elleDeger)) {
      if (elleDeger < PTA_ENAZ || elleDeger > PTA_ENUST) return NextResponse.json({ error: `PTA ${PTA_ENAZ}–${PTA_ENUST} dB aralığında olmalı` }, { status: 400 })
      pta = Math.round(elleDeger * 10) / 10
      bant = ptaBandi(pta).bant
      ozet = `${YAN_AD[b.yan]} PTA ${pta} dB — ${ptaBandi(pta).ad} (karar desteği; tanı ve kayıp tipi hekimin)`
    } else {
      return NextResponse.json({ error: 'Frekans eşikleri veya PTA değeri girin (Notya eşik uydurmaz)' }, { status: 400 })
    }

    // Kayıp TİPİ yalnız hekimin seçimidir — motor atamaz.
    const tip = kayipTipiGecerliMi(b.tip) ? String(b.tip) : null

    const { error } = await sb.from('kbb_odyometri').insert({
      patient_id: patientId, doctor_id: user.id, hasta_kbb_id: kayit?.id || null,
      tarih: T, yan: b.yan, pta_db: pta, tip,
      hekim_kilit: b.hekimKilit === true,
      maddeler: { esikler: esikler.filter((x) => x != null), frekanslar: PTA_FREKANSLARI, bant, ek: b.ek ?? null },
      not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (b.gorevAc !== false) {
      await gorevEkle(sb, user.id, patientId, [{ kod: 'odyo_tekrar', ad: 'Odyometri tekrar ölçümü', due: gunEkle(T, sonrakiOlcumGun(bant)), kaynak: 'odyometri' }])
    }
    const tipMetni = tip ? ` Kayıp tipi (hekim): ${KAYIP_TIPI_AD[tip as keyof typeof KAYIP_TIPI_AD]}.` : ''
    const rn = await gununNotunaEkle(sb, user.id, patientId, `${ozet}.${tipMetni} Bant karar desteğidir; tanı ve tedavi kararı hekimindedir.`)
    return NextResponse.json({ ok: true, pta, bant, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'otoskopi') {
    const sonuc = otoskopiNotu({
      kulaklar: Array.isArray(b.kulaklar) ? (b.kulaklar as Array<{ yan: 'sag' | 'sol'; disKulak: never[]; tm: never[] }>) : [],
      ekBulgular: Array.isArray(b.ekBulgular) ? (b.ekBulgular as string[]).map(String) : [],
      hekimNotu: b.hekimNotu ? String(b.hekimNotu) : '',
    })
    if (!sonuc.satirlar.length) return NextResponse.json({ error: 'Otoskopi bulgusu işaretlenmedi', eksikler: sonuc.eksikler }, { status: 400 })
    const rn = await gununNotunaEkle(sb, user.id, patientId, `Otoskopi — ${sonuc.metin}`)
    return NextResponse.json({ ok: true, sonuc, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'vertigo') {
    const sonuc = vertigoNotu({
      manevralar: Array.isArray(b.manevralar) ? (b.manevralar as Array<{ manevra: never; yan?: never; sonuc: never }>) : [],
      nistagmus: Array.isArray(b.nistagmus) ? (b.nistagmus as string[]).map(String) : [],
      santralIsaretleri: Array.isArray(b.santralIsaretleri) ? (b.santralIsaretleri as string[]).map(String) : [],
      kulakBelirtisi: b.kulakBelirtisi === true,
      hekimNotu: b.hekimNotu ? String(b.hekimNotu) : '',
    })
    if (!sonuc.satirlar.length) return NextResponse.json({ error: 'Vestibüler muayene işaretlenmedi', eksikler: sonuc.eksikler }, { status: 400 })
    if (b.gorevAc !== false) {
      await gorevEkle(sb, user.id, patientId, [{ kod: 'manevra_kontrol', ad: 'Denge muayenesi kontrolü', due: gunEkle(T, manevraSonrasiKontrolGun(sonuc)), kaynak: 'vertigo' }])
    }
    const rn = await gununNotunaEkle(sb, user.id, patientId, `Vestibüler muayene — ${sonuc.metin}`)
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
    const { error } = await sb.from('kbb_risk').insert({
      patient_id: patientId, doctor_id: user.id, hasta_kbb_id: kayit?.id || null,
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
    const { error } = await sb.from('kbb_gorevleri')
      .update({ durum: b.durum === 'acik' ? 'acik' : 'tamam', tamam_at: b.durum === 'acik' ? null : new Date().toISOString() })
      .eq('id', String(b.gorevId || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }

  if (adim === 'kontrol') {
    const tarih = String(b.tarih || '')
    if (!ISO.test(tarih)) return NextResponse.json({ error: 'Kontrol tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('hasta_kbb')
      .update({ next_kontrol: tarih, updated_at: new Date().toISOString() })
      .eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await gorevEkle(sb, user.id, patientId, [{ kod: 'kontrol_randevu', ad: 'Kontrol randevusu', due: tarih, kaynak: 'kontrol' }])
    return NextResponse.json({ ok: true })
  }

  // OSAS sevk işareti: hekimin kendi kararı. Notya uyku tanısı koymaz, yalnız sevk takvimi tutar.
  if (adim === 'osas') {
    const durum = b.durum === 'planlandi' || b.durum === 'yok' ? String(b.durum) : 'planlandi'
    const due = typeof b.due === 'string' && ISO.test(b.due) ? b.due : gunEkle(T, 60)
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const mevcut = (kayit?.notes || {}) as Notlar
    const { error } = await sb.from('hasta_kbb')
      .update({ notes: { ...mevcut, osas: { durum, not: b.not ? String(b.not).slice(0, 500) : null, due } }, updated_at: new Date().toISOString() })
      .eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (durum === 'planlandi') {
      await gorevEkle(sb, user.id, patientId, [{ kod: 'osas_sevk', ad: 'Uyku tetkiki (OSAS) sevki', due, kaynak: 'osas' }])
    }
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

  const [bolum, odyoQ, riskQ, gorevQ] = await Promise.all([
    sb.from('hasta_kbb').select('id, next_kontrol, notes').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle(),
    sb.from('kbb_odyometri').select('id, tarih, yan, pta_db, tip, maddeler, hekim_kilit, not_hekim').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(40),
    sb.from('kbb_risk').select('id, tarih, bayraklar, eylem, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('kbb_gorevleri').select('id, kod, ad, due, durum, kaynak').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }),
  ])

  const odyometriler = odyoQ.data || []
  const sonYan = (yan: string) => odyometriler.find((o) => String(o.yan) === yan) || null
  const son = odyometriler[0] || null
  const sonSag = sonYan('sag'), sonSol = sonYan('sol')
  const oncekiAyniYan = son ? odyometriler.slice(1).find((o) => String(o.yan) === String(son.yan)) || null : null

  const acikRisk = (riskQ.data || []).filter((r) => (r.bayraklar || []).length && !r.hekim_onay)
  const sonRisk = riskQ.data?.[0] || null
  const gorevler = (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null }))

  const notlar = (bolum.data?.notes || {}) as Notlar
  const osasKayit = notlar.osas || null
  const osasSevk = osasKayit && osasKayit.durum === 'planlandi'
    ? { durum: (osasKayit.due && String(osasKayit.due) < T ? 'gecikti' : 'planlandi') as 'gecikti' | 'planlandi', not: osasKayit.not || (osasKayit.due ? String(osasKayit.due) : null) }
    : { durum: 'yok' as const, not: null }

  const sonBant = (son?.maddeler as { bant?: OdyoBant } | null)?.bant || ptaBandi(son?.pta_db == null ? null : Number(son.pta_db)).bant

  const planlar: Array<{ kaynak: string; madde: string }> = []
  if (son) {
    planlar.push({
      kaynak: 'Odyometri',
      madde: odyoDegisim(oncekiAyniYan?.pta_db == null ? null : Number(oncekiAyniYan.pta_db), son.pta_db == null ? null : Number(son.pta_db)).not,
    })
  }
  const asimetri = asimetriNotu(
    sonSag?.pta_db == null ? null : Number(sonSag.pta_db),
    sonSol?.pta_db == null ? null : Number(sonSol.pta_db),
  )
  if (asimetri) planlar.push({ kaynak: 'Asimetri', madde: asimetri })
  if (osasSevk.durum !== 'yok') planlar.push({ kaynak: 'OSAS', madde: `Uyku tetkiki sevki ${osasSevk.durum === 'gecikti' ? 'gecikti' : 'planlandı'}${osasKayit?.due ? ` — ${osasKayit.due}` : ''}` })

  const serit = kbbSeridi({
    bugun: T,
    odyometri: son ? { pta: son.pta_db == null ? null : Number(son.pta_db), bant: sonBant, yan: String(son.yan) as 'sag', tarih: String(son.tarih) } : null,
    riskBayraklari: acikRisk.flatMap((r) => (r.bayraklar || []).map(String)),
    riskHekimOnay: !acikRisk.length,
    sonrakiKontrol: bolum.data?.next_kontrol ? String(bolum.data.next_kontrol) : null,
    osasSevk,
    gorevler,
    planlar,
  })

  return NextResponse.json({
    serit,
    bolum: { nextKontrol: bolum.data?.next_kontrol || null, osas: osasKayit },
    odyometriler,
    sonOdyometri: son ? { ...son, bant: sonBant, bantAd: sonBant ? ODYO_BANT_AD[sonBant] : '—', degisim: odyoDegisim(oncekiAyniYan?.pta_db == null ? null : Number(oncekiAyniYan.pta_db), son.pta_db == null ? null : Number(son.pta_db)) } : null,
    asimetri,
    risk: { son: sonRisk, acik: acikRisk, gecmis: riskQ.data || [] },
    gorevler: gorevQ.data || [],
    kutuphane: {
      odyometri: { frekanslar: PTA_FREKANSLARI, bantlar: ODYO_BANT_AD, tipler: KAYIP_TIPI_AD },
      otoskopi: { disKulak: DIS_KULAK_AD, tm: TM_AD, ekBulgular: EK_BULGULAR },
      vertigo: { manevralar: MANEVRA_AD, sonuclar: SONUC_AD, nistagmus: NISTAGMUS_OZELLIKLERI, santral: SANTRAL_ISARETLERI },
      burun: { sikayetler: BURUN_SIKAYET_AD, bulgular: BURUN_MUAYENE_BULGULARI, basamaklar: TEDAVI_BASAMAKLARI, sureler: SURE_AD },
      acilKodlari: ACIL_KODLARI,
      acilListesi: ACIL_KONTROL_LISTESI,
      raporSablonlari: KBB_RAPOR_SABLONLARI,
      refler: REF_ACIKLAMA,
      hekimKilidi: HEKIM_KILIT_METNI,
      acilYonlendirme: ACIL_YONLENDIRME_METNI,
      hastaAcilMetni: HASTA_ACIL_METNI,
      kapsam: KAPSAM_NOTU,
    },
  })
}
