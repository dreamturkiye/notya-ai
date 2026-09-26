/**
 * PSIK-EXCEPTIONAL-01 — Psikiyatri (Ruh Sağlığı ve Hastalıkları) API. Ayaktan muayenehane akışı.
 *
 * HASTA-İZOLASYON: her istek önce hastaSahibiMi(supabase, user.id, patientId) kapısından geçer; yabancı
 * hasta 404 döner. Satır güncellemeleri hem id hem doctor_id ile kapsanır (.cursor/skills/hasta-izolasyon).
 *
 * GET  ?patientId= → şerit çipleri, son ölçekler, açık risk, görevler, ilaç izlem taslağı, kütüphane
 * POST adim: olcek | risk | gorev | kontrol | ilac_izlem
 *
 * Kilitler: doz üretilmez, tanı kilitlenmez, ölçek skoru tanıya çevrilmez. Açık "hemen" güvenlik
 * bayrağı varken hekim onayı olmadan risk kaydı yazılmaz (409).
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { skorla as phq9Skorla, degisim as phq9Degisim, sonrakiOlcumGun as phq9SonrakiGun, PHQ9_MADDELER, PHQ9_SIKLIK, PHQ9_YONERGE } from '@/specialties/psikiyatri/engines/phq9'
import { skorla as gad7Skorla, degisim as gad7Degisim, sonrakiOlcumGun as gad7SonrakiGun, GAD7_MADDELER, GAD7_YONERGE } from '@/specialties/psikiyatri/engines/gad7'
import { cgiS, cgiI, gecerliMi as cgiGecerliMi, CGI_S_ETIKET, CGI_I_ETIKET } from '@/specialties/psikiyatri/engines/cgi'
import { acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, GUVENLIK_KONTROL_LISTESI, HASTA_ACIL_METNI, type AcilKod } from '@/specialties/psikiyatri/engines/acil'
import { psikIlacIzlemGorevleri, duzeyVadesi } from '@/specialties/psikiyatri/engines/ilacIzlem'
import { psikSeridi } from '@/specialties/psikiyatri/engines/serit'
import { REF_ACIKLAMA, HEKIM_KILIT_METNI, ACIL_YONLENDIRME_METNI, gunEkle } from '@/specialties/psikiyatri/engines/psikiyatri'
import { PSIK_RAPOR_SABLONLARI } from '@/specialties/psikiyatri/engines/sgkRapor'
import { arsivsizIlaclar } from '@/lib/doktor/arsiv'

export const dynamic = 'force-dynamic'

const bugun = () => new Date().toISOString().slice(0, 10)
const OLCEK_TIPLERI = ['phq9', 'gad7', 'cgi_s', 'cgi_i'] as const
type OlcekTip = (typeof OLCEK_TIPLERI)[number]

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

/** Psikotrop izlem için gereken onaylı lab anahtarları → son numune tarihi. */
const IZLEM_LAB_ANAHTARLARI = ['Li', 'Kre', 'eGFR', 'TSH', 'Ca', 'ALT', 'AST', 'Plt', 'Hb', 'WBC', 'Neu', 'Glu', 'HbA1c', 'LDL', 'TG', 'Na']

async function sonLabTarihleri(sb: Sb, patientId: string): Promise<Record<string, string | null>> {
  const { data } = await sb
    .from('lab_satirlar')
    .select('canonical_key, numune_tarihi')
    .eq('patient_id', patientId)
    .eq('onayli', true)
    .in('canonical_key', IZLEM_LAB_ANAHTARLARI)
    .not('numune_tarihi', 'is', null)
    .order('numune_tarihi', { ascending: false })
    .limit(400)
  const out: Record<string, string | null> = {}
  for (const r of data || []) {
    const k = String(r.canonical_key)
    if (!(k in out)) out[k] = r.numune_tarihi ? String(r.numune_tarihi) : null
  }
  return out
}


/** Aynı kod açıkken görev tekrar açılmaz (dahiliye gorevEkle deseni). */
async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: Array<{ kod: string; ad: string; due?: string | null; kaynak: string }>) {
  let eklenen = 0
  for (const x of g) {
    const { data } = await sb.from('psik_gorevleri').select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle()
    if (data) continue
    await sb.from('psik_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak })
    eklenen++
  }
  return eklenen
}

async function bolumKaydi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('hasta_psik').select('id, next_kontrol, notes').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (data) return data
  const { data: yeni } = await sb.from('hasta_psik').insert({ patient_id: patientId, doctor_id: doctorId }).select('id, next_kontrol, notes').maybeSingle()
  return yeni || null
}

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

  if (adim === 'olcek') {
    const tip = String(b.tip || '') as OlcekTip
    if (!(OLCEK_TIPLERI as readonly string[]).includes(tip)) return NextResponse.json({ error: 'Ölçek tipi geçersiz' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const maddeler = Array.isArray(b.maddeler) ? (b.maddeler as unknown[]).map((x) => (x == null || x === '' ? null : Number(x))) : []

    let skor: number
    let ek: Record<string, unknown> = {}
    if (tip === 'phq9') {
      const s = phq9Skorla(maddeler)
      if (!s.tamamMi) return NextResponse.json({ error: `PHQ-9 eksik: ${s.eksikMadde} madde boş — kısmi ölçek kaydedilmez`, sonuc: s }, { status: 400 })
      skor = s.toplam
      ek = { bant: s.bant, ozkiyim_madde9: s.ozkıyımMadde9, islevsellik: b.islevsellik ?? null }
    } else if (tip === 'gad7') {
      const s = gad7Skorla(maddeler)
      if (!s.tamamMi) return NextResponse.json({ error: `GAD-7 eksik: ${s.eksikMadde} madde boş — kısmi ölçek kaydedilmez`, sonuc: s }, { status: 400 })
      skor = s.toplam
      ek = { bant: s.bant, esik_ustu: s.esikUstu }
    } else {
      if (!cgiGecerliMi(b.deger)) return NextResponse.json({ error: 'CGI 1–7 arası olmalı' }, { status: 400 })
      skor = Number(b.deger)
      ek = { etiket: tip === 'cgi_s' ? CGI_S_ETIKET[skor as 1] : CGI_I_ETIKET[skor as 1] }
    }

    const { error } = await sb.from('psik_olcek').insert({
      patient_id: patientId, doctor_id: user.id, hasta_psik_id: kayit?.id || null,
      tip, skor, maddeler: { ham: maddeler.filter((x) => x != null), ...ek }, tarih: T,
      hekim_kilit: b.hekimKilit === true, not_hekim: b.not ? String(b.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Tekrar ölçüm görevi (hekim susturabilir) — ölçek adı görev kodunda, hasta yüzünde sabit başlığa çevrilir.
    if (tip === 'phq9' || tip === 'gad7') {
      const gun = tip === 'phq9' ? phq9SonrakiGun(phq9Skorla(maddeler).bant) : gad7SonrakiGun(gad7Skorla(maddeler).bant)
      if (b.gorevAc !== false) await gorevEkle(sb, user.id, patientId, [{ kod: `olcek_${tip}`, ad: `${tip === 'phq9' ? 'PHQ-9' : 'GAD-7'} tekrar ölçümü`, due: gunEkle(T, gun), kaynak: 'olcek' }])
    }
    // Nota giden satır: şiddet bandı "taslak / karar desteği" olarak yazılır, tanı olarak değil.
    const ozet = tip === 'phq9' ? phq9Skorla(maddeler).ozet : tip === 'gad7' ? gad7Skorla(maddeler).ozet : (tip === 'cgi_s' ? cgiS(skor) : cgiI(skor))?.ozet || ''
    const rn = await gununNotunaEkle(sb, user.id, patientId, `${ozet} — şiddet bandı karar desteğidir; tanı ve tedavi kararı hekimindedir.`)
    return NextResponse.json({ ok: true, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'risk') {
    const isaretler = (Array.isArray(b.bayraklar) ? b.bayraklar.map(String) : []).filter((k): k is AcilKod => ACIL_KODLARI.some((x) => x.kod === k))
    const bayraklar = acilTara([b.metin ? String(b.metin) : null], isaretler)
    if (hekimOnayiGerekliMi(bayraklar) && b.hekimOnay !== true) {
      return NextResponse.json({
        error: `Güvenlik bayrağı: ${bayraklar.map((x) => x.ad).join(' | ')} — kaydetmeden önce "hekim gördü ve eylemi yazdı" onayı gerekir.`,
        bayraklar,
      }, { status: 409 })
    }
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const eylem = b.eylem ? String(b.eylem).slice(0, 1000) : null
    const { error } = await sb.from('psik_risk').insert({
      patient_id: patientId, doctor_id: user.id, hasta_psik_id: kayit?.id || null,
      tarih: T, bayraklar: bayraklar.map((x) => x.kod), eylem, hekim_onay: b.hekimOnay === true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (bayraklar.length) {
      const rn = await gununNotunaEkle(sb, user.id, patientId, `⚑ Güvenlik değerlendirmesi: ${bayraklar.map((x) => x.ad).join('; ')} — hekim onayı verildi${eylem ? `: ${eylem}` : ''}. ${ACIL_YONLENDIRME_METNI}`)
      return NextResponse.json({ ok: true, bayraklar, notId: rn.eklendi ? rn.notId : null })
    }
    return NextResponse.json({ ok: true, bayraklar })
  }

  if (adim === 'gorev') {
    const { error } = await sb.from('psik_gorevleri')
      .update({ durum: b.durum === 'acik' ? 'acik' : 'tamam', tamam_at: b.durum === 'acik' ? null : new Date().toISOString() })
      .eq('id', String(b.gorevId || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }

  if (adim === 'kontrol') {
    const tarih = String(b.tarih || '')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tarih)) return NextResponse.json({ error: 'Kontrol tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('hasta_psik')
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
    const g = psikIlacIzlemGorevleri(
      (ilaclar || []).map((i) => ({ ad: String(i.ilac_adi), etken: i.etken_madde, baslangic: i.baslangic_tarihi ? String(i.baslangic_tarihi) : null, aktif: true })),
      sonLab, T,
    )
    const eklenen = await gorevEkle(sb, user.id, patientId, g.map((x) => ({ kod: x.kod, ad: `${x.ad} (${x.ilac})`, due: x.due, kaynak: 'ilac_izlem' })))
    return NextResponse.json({ ok: true, sayi: g.length, eklenen, gorevler: g })
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

  const [bolum, olcekQ, riskQ, gorevQ, ilacQ, sonLab] = await Promise.all([
    sb.from('hasta_psik').select('id, next_kontrol, notes').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle(),
    sb.from('psik_olcek').select('id, tip, skor, maddeler, tarih, hekim_kilit, not_hekim').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(40),
    sb.from('psik_risk').select('id, tarih, bayraklar, eylem, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('psik_gorevleri').select('id, kod, ad, due, durum, kaynak').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }),
    arsivsizIlaclar(sb, 'id, ilac_adi, etken_madde, baslangic_tarihi, aktif').eq('patient_id', patientId).eq('aktif', true),
    sonLabTarihleri(sb, patientId),
  ])

  const olcekler = olcekQ.data || []
  const seri = (tip: OlcekTip) => olcekler.filter((o) => o.tip === tip)
  const phqSeri = seri('phq9'), gadSeri = seri('gad7')
  const phqSon = phqSeri[0] || null, gadSon = gadSeri[0] || null
  const phqBant = (phqSon?.maddeler as { bant?: string } | null)?.bant || null
  const gadBant = (gadSon?.maddeler as { bant?: string } | null)?.bant || null
  const madde9 = !!(phqSon?.maddeler as { ozkiyim_madde9?: boolean } | null)?.ozkiyim_madde9

  const izlem = psikIlacIzlemGorevleri(
    (ilacQ.data || []).map((i) => ({ ad: String(i.ilac_adi), etken: i.etken_madde, baslangic: i.baslangic_tarihi ? String(i.baslangic_tarihi) : null, aktif: true })),
    sonLab, T,
  )

  const acikRisk = (riskQ.data || []).filter((r) => (r.bayraklar || []).length && !r.hekim_onay)
  const sonRisk = riskQ.data?.[0] || null
  const gorevler = (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null }))

  const planlar: Array<{ kaynak: string; madde: string }> = []
  if (phqSon) planlar.push({ kaynak: 'PHQ-9', madde: phq9Degisim(phqSeri[1]?.skor ?? null, Number(phqSon.skor)).not })
  if (gadSon) planlar.push({ kaynak: 'GAD-7', madde: gad7Degisim(gadSeri[1]?.skor ?? null, Number(gadSon.skor)).not })
  for (const g of izlem) planlar.push({ kaynak: 'İlaç izlem', madde: `${g.ad} — ${g.due}` })
  if (madde9) planlar.push({ kaynak: 'Güvenlik', madde: 'PHQ-9 9. madde pozitif — güvenlik değerlendirmesi ve kriz planı kaydı' })

  const serit = psikSeridi({
    bugun: T,
    phq9: phqSon ? { toplam: Number(phqSon.skor), bant: (phqBant as 'orta') || 'yok', tarih: String(phqSon.tarih), madde9 } : null,
    gad7: gadSon ? { toplam: Number(gadSon.skor), bant: (gadBant as 'orta') || 'yok', tarih: String(gadSon.tarih) } : null,
    riskBayraklari: acikRisk.flatMap((r) => (r.bayraklar || []).map(String)),
    riskHekimOnay: !acikRisk.length,
    duzeyDue: duzeyVadesi(izlem),
    sonrakiKontrol: bolum.data?.next_kontrol ? String(bolum.data.next_kontrol) : null,
    gorevler,
    planlar,
  })


  return NextResponse.json({
    serit,
    bolum: { nextKontrol: bolum.data?.next_kontrol || null, notes: bolum.data?.notes || null },
    olcekler,
    sonPhq9: phqSon ? { ...phqSon, degisim: phq9Degisim(phqSeri[1]?.skor ?? null, Number(phqSon.skor)) } : null,
    sonGad7: gadSon ? { ...gadSon, degisim: gad7Degisim(gadSeri[1]?.skor ?? null, Number(gadSon.skor)) } : null,
    risk: { son: sonRisk, acik: acikRisk, gecmis: riskQ.data || [] },
    gorevler: gorevQ.data || [],
    ilaclar: ilacQ.data || [],
    izlem,
    kutuphane: {
      phq9: { yonerge: PHQ9_YONERGE, maddeler: PHQ9_MADDELER, siklik: PHQ9_SIKLIK },
      gad7: { yonerge: GAD7_YONERGE, maddeler: GAD7_MADDELER, siklik: PHQ9_SIKLIK },
      cgi: { s: CGI_S_ETIKET, i: CGI_I_ETIKET },
      acilKodlari: ACIL_KODLARI,
      guvenlikListesi: GUVENLIK_KONTROL_LISTESI,
      raporSablonlari: PSIK_RAPOR_SABLONLARI,
      refler: REF_ACIKLAMA,
      hekimKilidi: HEKIM_KILIT_METNI,
      acilYonlendirme: ACIL_YONLENDIRME_METNI,
      hastaAcilMetni: HASTA_ACIL_METNI,
    },
  })
}
