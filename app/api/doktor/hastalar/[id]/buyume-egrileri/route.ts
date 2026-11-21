/**
 * NOTYA-BUYUME-EGRISI-02 — Büyüme Eğrileri sekmesi verisi (Kaan 2026-09-14).
 * Neyzi standart persentil çizgileri (lib/clinical/buyumeEgrisi.ts) + hastanın kendi
 * ölçümleri (onaylı notların vitaller alanından, muayene tarihindeki yaşıyla) aynı payload'ta.
 * Türetilmiş veri — saklanmaz, her açılışta yeniden hesaplanır (notlar değişirse otomatik günceldir).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { decrypt } from '@/lib/security/encryption'
import { persentilEgrileri, persentilHesapla, ayFarki, type BuyumeParametre, type Cinsiyet } from '@/lib/clinical/buyumeEgrisi'
import { cmCoz, kiloCoz } from '@/lib/clinical/olcumCoz'
import { arsivsizNotlar } from '@/lib/doktor/arsiv'
import { duzeltilmisYas, gestasyonGunu, gestasyonMetni } from '@/lib/clinical/prematur/duzeltilmisYas'
import { cinsiyetKanonik } from '@/lib/utils/cinsiyet'
import { dogumOlcumleri, DOGUM_NOT_ESIGI_AY, type DogumKaynak } from '@/lib/clinical/dogumOlcumu'
import { gebelikHaftasiPedCoz } from '@/lib/doktor/pediIntakeDogum'

export const dynamic = 'force-dynamic'

function guvenliCoz(v: string | null | undefined): string {
  if (!v) return ''
  try { return decrypt(v) } catch { return '' }
}
function sayi(x: unknown, tur: 'kilo' | 'cm'): number | null {
  if (x == null || x === '') return null
  return tur === 'kilo' ? kiloCoz(x as string | number) : cmCoz(x as string | number)
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  const { id: patientId } = await params

  const { data: hasta } = await supabase.from('patients').select('id, dob_encrypted, gender_encrypted').eq('id', patientId).eq('doctor_id', doktorId).maybeSingle()
  if (!hasta) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })

  const dogumIso = guvenliCoz(hasta.dob_encrypted) || null
  // CINSIYET-NORMAL-01: "Kadın" / "Erkek" / K / E … (manual form, birth flow, imports) all resolve — never only 'male' | 'female'.
  const cinsiyet: Cinsiyet | null = cinsiyetKanonik(guvenliCoz(hasta.gender_encrypted))
  if (!dogumIso || !cinsiyet) {
    return NextResponse.json({ dogumBilinmiyor: true, mevcutYasAy: null, cinsiyet: null, parametreler: {} })
  }

  const mevcutYasAy = ayFarki(dogumIso) ?? 0

  // One parallel batch (BUYUME-GRAFIK-V2 added the intake read without adding a round trip):
  // - Düzeltilmiş yaş (PREMATURE-MODUL): hekimin kendi bebek kartı (doctor_id kapsamlı) doğumda < 37 hafta diyorsa, kronolojik 24 aya
  //   kadar olan ölçümler düzeltilmiş yaşa göre çizilir. Kart yoksa / term ise davranış eskisi gibi (kronolojik).
  //   The same card row now also carries the birth weight / length / head circumference (first point of the curves).
  // - Onaylı notlardan vitaller + tarih — hastanın kendi büyüme noktaları.
  //   NOTYA-ARSIV-01: arşivlenmiş muayenenin ölçümü eğriye nokta olarak girmez.
  // - Hasta bilgi formu (intake): birth values when there is no card (HASTA-IZOLASYON: doktor_id + patient_id).
  const [kartQ, notQ, intakeQ] = await Promise.all([
    supabase.from('bebek_kartlari').select('gebelik_haftasi, kilo_gram, boy_cm, bas_cevresi_cm')
      .eq('doctor_id', doktorId).eq('bebek_patient_id', patientId).order('created_at', { ascending: false }).limit(1),
    arsivsizNotlar(supabase, 'created_at, vitaller, sessions!inner(patient_id)')
      .eq('sessions.patient_id', patientId).not('approved_at', 'is', null).not('vitaller', 'is', null)
      .order('created_at', { ascending: true }).limit(200),
    supabase.from('hasta_intake_formlari').select('form_data_encrypted')
      .eq('patient_id', patientId).eq('doktor_id', doktorId).order('created_at', { ascending: false }).limit(1),
  ])
  const kart = (kartQ.data?.[0] ?? null) as { gebelik_haftasi?: number | string | null; kilo_gram?: number | string | null; boy_cm?: number | string | null; bas_cevresi_cm?: number | string | null } | null
  const kartHf = kart?.gebelik_haftasi
  const gestGun = gestasyonGunu(kartHf != null ? Number(kartHf) : null)
  let duzeltmeVar = false
  const notlar = notQ.data
  let intake: Record<string, unknown> | null = null
  const intakeSifreli = (intakeQ.data?.[0] as { form_data_encrypted?: string } | undefined)?.form_data_encrypted
  if (intakeSifreli) { try { intake = JSON.parse(decrypt(intakeSifreli)) as Record<string, unknown> } catch { intake = null } }

  type Nokta = { ay: number; deger: number; tarih: string; persentil?: number | null; kaynak?: 'muayene' | DogumKaynak }
  const noktalar: Record<'kilo' | 'boy' | 'basCevresi' | 'vki', Nokta[]> = { kilo: [], boy: [], basCevresi: [], vki: [] }
  for (const n of (notlar || []) as { created_at: string; vitaller: unknown }[]) {
    let ay = ayFarki(dogumIso, n.created_at)
    if (ay === null) continue
    if (gestGun != null) {
      const y = duzeltilmisYas({ dogumIso, gestasyonGun: gestGun, tarihIso: n.created_at })
      if (y.gecerli && y.buyume.duzeltilmis) {
        if (y.buyume.termOncesi) continue // term öncesi: Neyzi eğrisi uygulanamaz, nokta çizilmez
        ay = y.buyume.gun / 30.4375
        duzeltmeVar = true
      }
    }
    const v = (n.vitaller || {}) as Record<string, unknown>
    const kilo = sayi(v.kilo, 'kilo'), boy = sayi(v.boy, 'cm'), bas = sayi(v.basCevresi, 'cm')
    if (kilo != null) noktalar.kilo.push({ ay, deger: kilo, tarih: n.created_at })
    if (boy != null) noktalar.boy.push({ ay, deger: boy, tarih: n.created_at })
    if (bas != null) noktalar.basCevresi.push({ ay, deger: bas, tarih: n.created_at })
    if (kilo != null && boy != null && ay >= 24) {
      const vki = Math.round((kilo / Math.pow(boy / 100, 2)) * 100) / 100
      noktalar.vki.push({ ay, deger: vki, tarih: n.created_at })
    }
  }

  // BUYUME-GRAFIK-V2 — birth measurements from the patient record as the first point (they were never plotted).
  // Preterm: a birth before term has a negative corrected age — no Neyzi point (same rule as the notes above). A preterm
  // birth known only from the intake form (no card week to correct with) is not plotted at age 0 either.
  const intakeHafta = gebelikHaftasiPedCoz(String(intake?.gebelikHaftasiPed ?? intake?.gebelikHaftasi ?? ''))
  let dogumAy: number | null = 0
  if (gestGun != null) {
    const y = duzeltilmisYas({ dogumIso, gestasyonGun: gestGun, tarihIso: dogumIso })
    if (y.gecerli && y.buyume.duzeltilmis) dogumAy = y.buyume.termOncesi ? null : y.buyume.gun / 30.4375
  } else if (intakeHafta != null && intakeHafta < 37) {
    dogumAy = null
  }
  if (dogumAy != null) {
    const dogum = dogumOlcumleri(kart, intake)
    for (const p of ['kilo', 'boy', 'basCevresi'] as const) {
      const d = dogum[p]
      if (!d) continue
      // A note measured in the first week already is the birth value — the record value is not added twice.
      if (noktalar[p].some((n) => ayFarki(dogumIso, n.tarih)! < DOGUM_NOT_ESIGI_AY)) continue
      // A parent-typed form value further than 4 SD from the reference at birth is a typo, not a point.
      if (d.kaynak === 'intake') { const r = persentilHesapla(p, cinsiyet, dogumAy, d.deger); if (!r || Math.abs(r.zSkor) > 4) continue }
      noktalar[p].unshift({ ay: dogumAy, deger: d.deger, tarih: dogumIso, kaynak: d.kaynak })
    }
  }

  // Percentile of every point on the same reference (Neyzi), at the age it is drawn at (corrected where corrected).
  for (const p of ['kilo', 'boy', 'basCevresi', 'vki'] as BuyumeParametre[]) {
    for (const n of noktalar[p]) {
      const r = persentilHesapla(p, cinsiyet, n.ay, n.deger)
      n.persentil = r ? Math.round(r.persentil * 10) / 10 : null
      n.kaynak = n.kaynak ?? 'muayene'
    }
  }

  const tampon = 6 // eğri, hastanın yaşının biraz ötesine kadar çizilsin
  const ustSinir = Math.max(24, mevcutYasAy + tampon)

  const parametreler = {
    kilo: { birim: 'kg', egriler: persentilEgrileri('kilo', cinsiyet, ustSinir), noktalar: noktalar.kilo },
    boy: { birim: 'cm', egriler: persentilEgrileri('boy', cinsiyet, ustSinir), noktalar: noktalar.boy },
    basCevresi: { birim: 'cm', egriler: persentilEgrileri('basCevresi', cinsiyet, ustSinir), noktalar: noktalar.basCevresi },
    // VKİ eğrisi yalnız 2 yaş ve üzeri anlamlıdır (Kaan 2026-09-14)
    vki: mevcutYasAy >= 24 || noktalar.vki.length > 0
      ? { birim: 'kg/m²', egriler: persentilEgrileri('vki', cinsiyet, ustSinir).map((s) => ({ ...s, noktalar: s.noktalar.filter((n) => n.ay >= 24) })), noktalar: noktalar.vki }
      : null,
  }

  return NextResponse.json({ dogumBilinmiyor: false, mevcutYasAy, cinsiyet, parametreler, duzeltme: duzeltmeVar && gestGun != null ? { gestasyon: gestasyonMetni(gestGun) } : null })
}
