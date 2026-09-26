/**
 * RADYOLOJI-EXCEPTIONAL-01 — Radyoloji API. Ayaktan görüntüleme / rapor akışı.
 * HASTA-İZOLASYON: her istek hastaSahibiMi kapısından geçer.
 * GET  ?patientId= → şerit, kuyruk, rapor, kritik, acil, görevler
 * POST adim: kuyruk | rapor | kritik | belge | risk | gorev | kontrol
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { kuyrukSkorla } from '@/specialties/radyoloji/engines/kuyruk'
import { raporSkorla } from '@/specialties/radyoloji/engines/rapor'
import { kritikSkorla } from '@/specialties/radyoloji/engines/kritik'
import {
  acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, ACIL_KONTROL_LISTESI, type AcilKod,
} from '@/specialties/radyoloji/engines/acil'
import { radyoSeridi } from '@/specialties/radyoloji/engines/serit'
import {
  REF_ACIKLAMA, HEKIM_KILIT_METNI, ACIL_YONLENDIRME_METNI, KAPSAM_NOTU, ISO_GUN,
} from '@/specialties/radyoloji/engines/radyoloji'

export const dynamic = 'force-dynamic'

const bugun = () => new Date().toISOString().slice(0, 10)

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: Array<{ kod: string; ad: string; due?: string | null; kaynak: string }>) {
  let eklenen = 0
  for (const x of g) {
    const { data } = await sb.from('radyo_gorevleri').select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle()
    if (data) continue
    await sb.from('radyo_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak })
    eklenen++
  }
  return eklenen
}

async function bolumKaydi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('hasta_radyoloji').select('id, next_kontrol, kuyruk, rapor, kritik, notes').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (data) return data
  const { data: yeni } = await sb.from('hasta_radyoloji').insert({ patient_id: patientId, doctor_id: doctorId }).select('id, next_kontrol, kuyruk, rapor, kritik, notes').maybeSingle()
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

  if (adim === 'kuyruk') {
    const s = kuyrukSkorla(b)
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('radyo_kuyruk').insert({
      patient_id: patientId, doctor_id: user.id, hasta_radyoloji_id: kayit?.id || null,
      tarih: s.kart.tarih && ISO_GUN.test(s.kart.tarih) ? s.kart.tarih : T,
      modalite: s.kart.modalite, oncelik: s.kart.oncelik, durum: s.kart.durum,
      hekim_kilit: b.hekimKilit === true, not_hekim: s.kart.not,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await sb.from('hasta_radyoloji').update({
      kuyruk: { ...s.kart, tarih: s.kart.tarih || T },
      updated_at: new Date().toISOString(),
    }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    await gorevEkle(sb, user.id, patientId, s.gorevOnerileri.map((g) => ({ ...g, kaynak: 'kuyruk' })))
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, kart: s.kart, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'rapor') {
    const s = raporSkorla(b.kategori, b.secilen, b.not ? String(b.not) : null)
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('radyo_rapor').insert({
      patient_id: patientId, doctor_id: user.id, hasta_radyoloji_id: kayit?.id || null,
      tarih: T, kategori: s.kategori, sablon_kodlari: s.secilen,
      hekim_kilit: b.hekimKilit === true, not_hekim: b.not ? String(b.not).slice(0, 500) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await sb.from('hasta_radyoloji').update({
      rapor: { kategori: s.kategori, secilen: s.secilen, tarih: T, not: b.not ? String(b.not).slice(0, 500) : null },
      updated_at: new Date().toISOString(),
    }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    await gorevEkle(sb, user.id, patientId, s.gorevOnerileri.map((g) => ({ ...g, kaynak: 'rapor' })))
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, kategori: s.kategori, secilen: s.secilen, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'kritik') {
    const s = kritikSkorla(b.bayraklar, b.bildirim, b.not ? String(b.not) : null)
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    if (b.hekimOnay !== true) {
      return NextResponse.json({
        error: 'Kritik bulgu kaydı için "hekim gördü ve klinisyene bildirdi" onayı gerekir.',
        sonuc: s,
      }, { status: 409 })
    }
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('radyo_kritik').insert({
      patient_id: patientId, doctor_id: user.id, hasta_radyoloji_id: kayit?.id || null,
      tarih: T, bayraklar: s.bayraklar, bildirim_maddeleri: s.bildirim,
      hekim_onay: true, not_hekim: b.not ? String(b.not).slice(0, 500) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await sb.from('hasta_radyoloji').update({
      kritik: { bayraklar: s.bayraklar, bildirim: s.bildirim, tarih: T },
      updated_at: new Date().toISOString(),
    }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    await gorevEkle(sb, user.id, patientId, s.gorevOnerileri.map((g) => ({ ...g, kaynak: 'kritik' })))
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, bayraklar: s.bayraklar, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'belge') {
    const sonraki = String(b.sonraki || '')
    const etiket = String(b.etiket || 'Görüntü / belge kontrolü').slice(0, 120)
    if (!ISO_GUN.test(sonraki)) return NextResponse.json({ error: 'Belge tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    if (/tan[ıi]|BI-?RADS\s*[0-6]|AI tan/i.test(etiket)) {
      return NextResponse.json({ error: 'Belge etiketinde tanı / BI-RADS sayı / AI dili yazılamaz.' }, { status: 400 })
    }
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const kart = { sonraki, etiket, belgeId: b.belgeId ? String(b.belgeId).slice(0, 80) : null }
    const notes = { ...(typeof kayit?.notes === 'object' && kayit.notes ? kayit.notes as object : {}), belge: kart }
    await sb.from('hasta_radyoloji').update({ notes, updated_at: new Date().toISOString() }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    await gorevEkle(sb, user.id, patientId, [{ kod: 'belge_kontrol', ad: etiket, due: sonraki, kaynak: 'belge' }])
    const ozet = `Belge köprüsü: ${etiket} · ${sonraki}. Tanı yazılmaz.`
    const rn = await gununNotunaEkle(sb, user.id, patientId, ozet)
    return NextResponse.json({ ok: true, kart, notId: rn.eklendi ? rn.notId : null })
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
    const { error } = await sb.from('radyo_acil').insert({
      patient_id: patientId, doctor_id: user.id, hasta_radyoloji_id: kayit?.id || null,
      tarih: T, bayraklar: bayraklar.map((x) => x.kod), eylem, hekim_onay: b.hekimOnay === true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (bayraklar.length) {
      const rn = await gununNotunaEkle(sb, user.id, patientId, `⚑ Radyoloji acil bayrak: ${bayraklar.map((x) => x.ad).join('; ')} — hekim onayı verildi${eylem ? `: ${eylem}` : ''}. ${ACIL_YONLENDIRME_METNI}`)
      return NextResponse.json({ ok: true, bayraklar, notId: rn.eklendi ? rn.notId : null })
    }
    return NextResponse.json({ ok: true, bayraklar })
  }

  if (adim === 'gorev') {
    const { error } = await sb.from('radyo_gorevleri')
      .update({ durum: b.durum === 'acik' ? 'acik' : 'tamam', tamam_at: b.durum === 'acik' ? null : new Date().toISOString() })
      .eq('id', String(b.gorevId || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }

  if (adim === 'kontrol') {
    const tarih = String(b.tarih || '')
    if (!ISO_GUN.test(tarih)) return NextResponse.json({ error: 'Kontrol tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('hasta_radyoloji')
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

  const [bolum, riskQ, gorevQ, kritikQ] = await Promise.all([
    sb.from('hasta_radyoloji').select('id, next_kontrol, kuyruk, rapor, kritik, notes').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle(),
    sb.from('radyo_acil').select('id, tarih, bayraklar, eylem, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('radyo_gorevleri').select('id, kod, ad, due, durum, kaynak').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }),
    sb.from('radyo_kritik').select('id, tarih, bayraklar, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(5),
  ])

  const acikRisk = (riskQ.data || []).filter((r) => (r.bayraklar || []).length && !r.hekim_onay)
  const sonRisk = riskQ.data?.[0] || null
  const gorevler = (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null }))
  const kuyruk = (bolum.data?.kuyruk && typeof bolum.data.kuyruk === 'object' ? bolum.data.kuyruk : null) as { modalite?: string; durum?: string } | null
  const rapor = (bolum.data?.rapor && typeof bolum.data.rapor === 'object' ? bolum.data.rapor : null) as { kategori?: string } | null
  const kritik = (bolum.data?.kritik && typeof bolum.data.kritik === 'object' ? bolum.data.kritik : null) as { bayraklar?: string[] } | null
  const notes = (bolum.data?.notes && typeof bolum.data.notes === 'object' ? bolum.data.notes : {}) as { belge?: { sonraki?: string; etiket?: string } }
  const kuyrukSayi = kuyruk?.modalite ? 1 : 0
  const kritikSayi = Array.isArray(kritik?.bayraklar) ? kritik!.bayraklar!.length : (kritikQ.data?.[0]?.bayraklar || []).length

  const planlar: Array<{ kaynak: string; madde: string }> = []
  if (kuyruk?.modalite) planlar.push({ kaynak: 'Kuyruk', madde: `${kuyruk.modalite}${kuyruk.durum ? ` · ${kuyruk.durum}` : ''}` })
  if (rapor?.kategori) planlar.push({ kaynak: 'Rapor', madde: `kategori ${rapor.kategori} (hekim)` })
  if (kritikSayi) planlar.push({ kaynak: 'Kritik', madde: `${kritikSayi} bayrak` })
  if (notes.belge?.sonraki) planlar.push({ kaynak: 'Belge', madde: notes.belge.sonraki })

  const serit = radyoSeridi({
    bugun: T,
    kuyrukSayi,
    raporKategori: rapor?.kategori || null,
    kritikSayi,
    riskBayraklari: acikRisk.flatMap((r) => (r.bayraklar || []).map(String)),
    riskHekimOnay: !acikRisk.length,
    sonrakiKontrol: bolum.data?.next_kontrol ? String(bolum.data.next_kontrol) : null,
    belgeSonraki: notes.belge?.sonraki || null,
    gorevler,
    planlar,
  })

  return NextResponse.json({
    serit,
    bolum: {
      nextKontrol: bolum.data?.next_kontrol || null,
      kuyruk: bolum.data?.kuyruk || null,
      rapor: bolum.data?.rapor || null,
      kritik: bolum.data?.kritik || null,
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
