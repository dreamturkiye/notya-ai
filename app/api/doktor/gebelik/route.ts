/**
 * NOTYA-KHD-01 — Gebelik takibi API.
 * GET  ?patientId=…            → aktif gebelik + izlemler + hesaplanmış yaş/takvim/uyarılar
 * POST { action:'baslat', … } → yeni gebelik kaydı (SAT/TDT, G/P/A/Y, Rh, kilo/boy)
 * POST { action:'izlem', … }  → izlem ekle; muayeneFormunaEkle:true ise bugünkü nota özet satırı
 * POST { action:'sonlandir', … } → doğum/sonlanma kaydı
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { gebelikYasi, naegeleTahminiDogum, izlemDurumlari, gebelikUyarilari, kiloAlimHedefi, gebelikOzetSatiri, type IzlemGirdisi } from '@/lib/clinical/gebelik'
import { aktifGebelikDurumu, ayniGebelikBolumu, oncekiGebelikleriFiltrele } from '@/lib/clinical/gebelikDurum'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { biyometriPersentil, hadlockEfw, type BiyometriParametre } from '@/lib/clinical/fetalBiyometri'
import { lohusaDurumlari } from '@/lib/clinical/lohusaVeJinekoloji'
import { ntDegerlendir, ileriAnneYasi } from '@/lib/clinical/genetikTarama'
import { decrypt } from '@/lib/security/encryption'
import { hekimAdi } from '@/lib/doktor/hekimAdi'
import { onerilenSonrakiTarih } from '@/specialties/kadin-dogum/engines/clinic-fit'
import { riskClassFromForm } from '@/specialties/kadin-dogum/protocols/risk-formu'
import { vteScoreFromForm } from '@/specialties/kadin-dogum/protocols/vte-formu'
import { olusturCanliDogum } from '@/lib/doktor/yenidoganKayit'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum); if (engel) return engel
  const { supabase, doktorId } = oturum
  const patientId = req.nextUrl.searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId zorunludur.' }, { status: 400 })

  const { data: tumGebelikler } = await supabase.from('gebelikler').select('*')
    .eq('patient_id', patientId).eq('doctor_id', doktorId)
    .order('created_at', { ascending: false })
  const gebelikAktif = (tumGebelikler || []).find((g) => aktifGebelikDurumu(g.durum)) || null
  // aktif yoksa: son 42 gün içinde doğum yapmış (lohusa dönemi) gebeliği göster
  let gebelik = gebelikAktif
  if (!gebelik) {
    const esik = new Date(); esik.setDate(esik.getDate() - 42)
    const { data: lohusaG } = await supabase.from('gebelikler').select('*')
      .eq('patient_id', patientId).eq('doctor_id', doktorId).eq('durum', 'tamamlandi').gte('dogum_tarihi', esik.toISOString().slice(0, 10))
      .order('dogum_tarihi', { ascending: false }).limit(1).maybeSingle()
    gebelik = lohusaG || null
  }
  const gecmisHam = (tumGebelikler || []).map((g) => ({
    id: g.id, sat: g.sat, tdt: g.tdt, durum: g.durum, dogum_tarihi: g.dogum_tarihi, dogum_sekli: g.dogum_sekli,
  }))
  const gecmis = oncekiGebelikleriFiltrele(gecmisHam, gebelik)
  if (!gebelik) {
    const { data: kadinSagligi } = await supabase.from('kadin_sagligi').select('*').eq('patient_id', patientId).eq('doctor_id', doktorId).maybeSingle()
    const { data: goruntulemeler } = await supabase.from('hasta_goruntulemeler').select('id, modalite, vucut_bolgesi, rapor_metni, goruntuleme_tarihi, created_at, dosya_url')
      .eq('patient_id', patientId).eq('doctor_id', doktorId).order('goruntuleme_tarihi', { ascending: false }).limit(40)
    return NextResponse.json({ gebelik: null, gecmis, kadinSagligi: kadinSagligi || null, goruntulemeler: goruntulemeler || [] })
  }

  const { data: izlemler } = await supabase.from('gebelik_izlemleri').select('*').eq('gebelik_id', gebelik.id).order('tarih', { ascending: true })
  const izlemGirdileri: IzlemGirdisi[] = (izlemler || []).map((i) => ({
    tarih: i.tarih, hafta: i.hafta, kilo: i.kilo, tansiyonSistolik: i.tansiyon_sistolik, tansiyonDiastolik: i.tansiyon_diastolik,
    fundusYuksekligi: i.fundus_yuksekligi, fetalKalpAtimi: i.fetal_kalp_atimi, proteinuri: i.proteinuri,
  }))
  const yas = gebelikYasi(gebelik.sat, gebelik.tdt)
  const son = izlemGirdileri.length ? izlemGirdileri[izlemGirdileri.length - 1] : null
  const vki = gebelik.gebelik_oncesi_kilo && gebelik.boy ? gebelik.gebelik_oncesi_kilo / Math.pow(gebelik.boy / 100, 2) : null

  // NOTYA-KHD-02: her izlemin USG değerleri için INTERGROWTH-21st persentili + Hadlock EFW
  const biyometri = (izlemler || []).map((i) => {
    const u = (i.usg || {}) as Record<string, string | number>
    const h = (() => { const y = gebelikYasi(gebelik.sat, gebelik.tdt, new Date(i.tarih)); return y ? y.toplamGun / 7 : i.hafta })()
    const p = (k: BiyometriParametre) => { const v = Number(String(u[k] ?? '').replace(',', '.')); return isFinite(v) && v > 0 ? biyometriPersentil(k, v, h) : null }
    const hc = Number(u.hc), ac = Number(u.ac), fl = Number(u.fl)
    const girilenHam = Number(String(u.efw ?? '').replace(',', '.'))
    const efwGirilen = isFinite(girilenHam) && girilenHam > 0 ? Math.round(girilenHam) : null
    const efwHadlock = isFinite(hc) && isFinite(ac) && isFinite(fl) ? hadlockEfw(hc, ac, fl) : null
    const efw = efwHadlock ?? efwGirilen
    return {
      izlemId: i.id, hafta: Math.round(h * 10) / 10, hc: p('hc'), bpd: p('bpd'), ac: p('ac'), fl: p('fl'),
      efw, efwGirilen, efwKaynak: efwHadlock ? 'hadlock' as const : efwGirilen ? 'girilen' as const : null,
    }
  }).filter((b) => b.hc || b.bpd || b.ac || b.fl || b.efw)

  // NOTYA-KHD-03: doğum gerçekleştiyse lohusa izlemleri
  let lohusa = null
  if (gebelik.durum === 'tamamlandi' && gebelik.dogum_tarihi) {
    const { data: li } = await supabase.from('lohusa_izlemleri').select('*').eq('gebelik_id', gebelik.id).order('tarih', { ascending: true })
    const gun = Math.floor((Date.now() - new Date(gebelik.dogum_tarihi).getTime()) / 86_400_000)
    lohusa = { dogumSonrasiGun: gun, izlemler: li || [], takvim: lohusaDurumlari(gun, (li || []).map((x) => x.dogum_sonrasi_gun)) }
  }

  const { data: genetikler } = await supabase.from('genetik_taramalar').select('*').eq('gebelik_id', gebelik.id).order('tarih', { ascending: true })
  const genetikTaramalar = (genetikler || []).map((g) => {
    if (g.tur === 'ikili' && g.veri?.ntMm != null) {
      return { ...g, ntDegerlendirme: ntDegerlendir(g.veri.ntMm, g.hafta || 12) }
    }
    return g
  })

  // Yazdırma (Gebe İzlem Kartı) için başlık — gerçek veriden, reçete/epikriz ile aynı ilke
  const [{ data: hastaRow }, { data: userRow }, hekim, { data: kadinSagligi }, { data: sonrakiRandevular }, { data: goruntulemeler }] = await Promise.all([
    supabase.from('patients').select('name_encrypted, dob_encrypted').eq('id', patientId).maybeSingle(),
    supabase.from('users').select('recete_baslik').eq('id', doktorId).maybeSingle(),
    hekimAdi(supabase, doktorId),
    supabase.from('kadin_sagligi').select('*').eq('patient_id', patientId).eq('doctor_id', doktorId).maybeSingle(),
    supabase.from('randevular').select('id, baslangic, bitis, tur, durum')
      .eq('doktor_id', doktorId).eq('patient_id', patientId).neq('durum', 'iptal')
      .gte('baslangic', new Date().toISOString()).order('baslangic', { ascending: true }).limit(1),
    supabase.from('hasta_goruntulemeler').select('id, modalite, vucut_bolgesi, rapor_metni, goruntuleme_tarihi, created_at, dosya_url')
      .eq('patient_id', patientId).eq('doctor_id', doktorId).order('goruntuleme_tarihi', { ascending: false }).limit(40),
  ])
  const coz = (v: string | null | undefined) => { try { return v ? decrypt(v) : '' } catch { return '' } }
  let hastaAd = ''
  try { const n = JSON.parse(coz(hastaRow?.name_encrypted)); hastaAd = [n.ad, n.soyad].filter(Boolean).join(' ') } catch { /* ad çözülemedi */ }
  const rb = (userRow?.recete_baslik && typeof userRow.recete_baslik === 'object' ? userRow.recete_baslik : {}) as { satirlar?: string[]; logoDataUrl?: string; diplomaNo?: string }
  const baslik = { hastaAd, dogumTarihi: coz(hastaRow?.dob_encrypted) || null, hekim, satirlar: Array.isArray(rb.satirlar) ? rb.satirlar : [], logoDataUrl: rb.logoDataUrl || '', diplomaNo: rb.diplomaNo || '' }

  const riskSinifi = (gebelik.risk_sinifi === 'orta' || gebelik.risk_sinifi === 'yuksek') ? gebelik.risk_sinifi : 'dusuk'
  const onerilen = yas ? onerilenSonrakiTarih({
    bugunIso: new Date().toISOString().slice(0, 10),
    gaWeeks: yas.hafta,
    risk: riskSinifi,
  }) : null

  return NextResponse.json({
    gebelik, izlemler: izlemler || [], gecmis: gecmis || [], biyometri, lohusa, baslik, genetikTaramalar,
    kadinSagligi: kadinSagligi || null,
    sonrakiRandevu: (sonrakiRandevular && sonrakiRandevular[0]) || null,
    goruntulemeler: goruntulemeler || [],
    onerilenSonrakiTarih: onerilen,
    ileriAnneYasi: (() => {
      const dob = coz(hastaRow?.dob_encrypted)
      if (!dob) return null
      const d = new Date(dob); if (isNaN(d.getTime())) return null
      const anneYasi = Math.floor((Date.now() - d.getTime()) / (365.25 * 86_400_000))
      return ileriAnneYasi(anneYasi)
    })(),
    yas,
    takvim: yas ? izlemDurumlari(yas.hafta, izlemGirdileri.map((i) => i.hafta)) : [],
    uyarilar: gebelikUyarilari(yas, son, !!gebelik.rh_negatif, izlemGirdileri),
    kiloHedefi: kiloAlimHedefi(vki),
    gebelikOncesiVki: vki ? Math.round(vki * 10) / 10 : null,
  })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum); if (engel) return engel
  const { supabase, doktorId } = oturum
  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const action = String(body.action || '')
  const patientId = String(body.patientId || '')
  if (!patientId) return NextResponse.json({ error: 'patientId zorunludur.' }, { status: 400 })

  if (action === 'baslat') {
    const sat = body.sat ? String(body.sat) : null
    const tdtGirilen = body.tdt ? String(body.tdt) : null
    if (!sat && !tdtGirilen) return NextResponse.json({ error: 'Son adet tarihi veya tahmini doğum tarihi gerekli.' }, { status: 400 })
    const tdt = tdtGirilen || naegeleTahminiDogum(sat!)
    const { data: mevcutlar } = await supabase.from('gebelikler').select('id, sat, tdt, durum, dogum_tarihi')
      .eq('patient_id', patientId).eq('doctor_id', doktorId)
    const ayniBolum = (mevcutlar || []).find((g) => ayniGebelikBolumu(g, { sat, tdt }) && !g.dogum_tarihi)
    if (ayniBolum) {
      const { error } = await supabase.from('gebelikler').update({
        sat, tdt, tdt_kaynak: tdtGirilen ? 'usg' : 'sat',
        gravida: body.gravida ?? null, para: body.para ?? null, abortus: body.abortus ?? null, yasayan: body.yasayan ?? null,
        olu_dogum: body.oluDogum ?? null, ektopik: body.ektopik ?? null,
        onceki_sezaryen_sayisi: body.oncekiSezaryenSayisi ?? null,
        onceki_sezaryen_kesi_tipi: body.oncekiSezaryenKesiTipi ?? null,
        cogul_gebelik_tipi: body.cogulGebelikTipi ?? null,
        gebelik_oncesi_kilo: body.gebelikOncesiKilo ?? null, boy: body.boy ?? null,
        kan_grubu: body.kanGrubu ?? null, rh_negatif: !!body.rhNegatif,
        risk_faktorleri: Array.isArray(body.riskFaktorleri) ? body.riskFaktorleri : [],
        durum: 'aktif',
        updated_at: new Date().toISOString(),
      }).eq('id', ayniBolum.id).eq('doctor_id', doktorId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ gebelikId: ayniBolum.id, tdt })
    }
    const kapanacak = (mevcutlar || []).filter((g) => aktifGebelikDurumu(g.durum) && !ayniGebelikBolumu(g, { sat, tdt })).map((g) => g.id)
    if (kapanacak.length) {
      await supabase.from('gebelikler').update({ durum: 'sonlandi' }).eq('doctor_id', doktorId).in('id', kapanacak)
    }
    const { data, error } = await supabase.from('gebelikler').insert({
      patient_id: patientId, doctor_id: doktorId, sat, tdt, tdt_kaynak: tdtGirilen ? 'usg' : 'sat',
      gravida: body.gravida ?? null, para: body.para ?? null, abortus: body.abortus ?? null, yasayan: body.yasayan ?? null,
      olu_dogum: body.oluDogum ?? null, ektopik: body.ektopik ?? null,
      onceki_sezaryen_sayisi: body.oncekiSezaryenSayisi ?? null,
      onceki_sezaryen_kesi_tipi: body.oncekiSezaryenKesiTipi ?? null,
      cogul_gebelik_tipi: body.cogulGebelikTipi ?? null,
      gebelik_oncesi_kilo: body.gebelikOncesiKilo ?? null, boy: body.boy ?? null,
      kan_grubu: body.kanGrubu ?? null, rh_negatif: !!body.rhNegatif,
      risk_faktorleri: Array.isArray(body.riskFaktorleri) ? body.riskFaktorleri : [],
      durum: 'aktif',
    }).select('id').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ gebelikId: data.id, tdt })
  }

  if (action === 'izlem') {
    const gebelikId = String(body.gebelikId || '')
    const { data: gebelik } = await supabase.from('gebelikler').select('id, sat, tdt, risk_sinifi').eq('id', gebelikId).eq('doctor_id', doktorId).maybeSingle()
    if (!gebelik) return NextResponse.json({ error: 'Aktif gebelik bulunamadı.' }, { status: 404 })
    const tarih = body.tarih ? String(body.tarih) : new Date().toISOString().slice(0, 10)
    const yas = gebelikYasi(gebelik.sat, gebelik.tdt, new Date(tarih))
    const hafta = typeof body.hafta === 'number' ? body.hafta : (yas?.hafta ?? 0)
    const { data: kayit, error } = await supabase.from('gebelik_izlemleri').insert({
      gebelik_id: gebelikId, doctor_id: doktorId, tarih, hafta,
      kilo: body.kilo ?? null, tansiyon_sistolik: body.tansiyonSistolik ?? null, tansiyon_diastolik: body.tansiyonDiastolik ?? null,
      fundus_yuksekligi: body.fundusYuksekligi ?? null, fetal_kalp_atimi: body.fetalKalpAtimi ?? null, proteinuri: body.proteinuri ?? null,
      usg: body.usg ?? null, not_metni: body.notMetni ?? null,
      checklist: body.checklist && typeof body.checklist === 'object' ? body.checklist : {},
      ogtt: body.ogtt ?? null,
      gbs_kultur: body.gbsKultur ?? null,
      servikal_uzunluk: body.servikalUzunluk ?? null,
      tehlike_isaretleri: Array.isArray(body.tehlikeIsaretleri) ? body.tehlikeIsaretleri : [],
    }).select('id').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    let notEkleme = null
    if (body.muayeneFormunaEkle && yas) {
      const parcalar = [gebelikOzetSatiri(yas, gebelik.tdt)]
      const olc: string[] = []
      if (body.kilo) olc.push(`kilo ${body.kilo} kg`)
      if (body.tansiyonSistolik && body.tansiyonDiastolik) olc.push(`TA ${body.tansiyonSistolik}/${body.tansiyonDiastolik} mmHg`)
      if (body.fundusYuksekligi) olc.push(`fundus ${body.fundusYuksekligi} cm`)
      if (body.fetalKalpAtimi) olc.push(`FKA ${body.fetalKalpAtimi}/dk`)
      if (body.proteinuri) olc.push(`proteinüri ${body.proteinuri}`)
      if (olc.length) parcalar.push(`İzlem: ${olc.join(', ')}.`)
      notEkleme = await gununNotunaEkle(supabase, doktorId, patientId, parcalar.join(' '))
      if (notEkleme.notId) await supabase.from('gebelik_izlemleri').update({ not_id: notEkleme.notId }).eq('id', kayit.id).then(() => {}, () => {})
    }
    return NextResponse.json({
      izlemId: kayit.id,
      hafta,
      notEkleme,
      onerilenSonrakiTarih: yas ? onerilenSonrakiTarih({
        bugunIso: tarih,
        gaWeeks: yas.hafta,
        risk: gebelik.risk_sinifi === 'orta' || gebelik.risk_sinifi === 'yuksek' ? gebelik.risk_sinifi : 'dusuk',
      }) : null,
    })
  }

  if (action === 'sonlandir') {
    const gebelikId = String(body.gebelikId || '')
    const canliDogum = body.durum !== 'sonlandi' && body.dogumTarihi
    const { data: gebelikOnce } = await supabase.from('gebelikler').select('patient_id, sat, tdt').eq('id', gebelikId).eq('doctor_id', doktorId).maybeSingle()

    let yenidoganPatientId: string | null = null
    let dogumId: string | null = null
    if (canliDogum && gebelikOnce) {
      // Non-negotiable: canlı doğum MUST create Bebek kartı linked to anne.
      const yasDogum = gebelikYasi(gebelikOnce.sat, gebelikOnce.tdt, new Date(String(body.dogumTarihi)))
      try {
        const kart = await olusturCanliDogum(supabase, {
          doktorId,
          anneId: gebelikOnce.patient_id,
          gebelikId,
          dogumTarihi: String(body.dogumTarihi),
          dogumSekli: body.dogumSekli ? String(body.dogumSekli) : 'NSD',
          dogumNotu: body.dogumNotu ? String(body.dogumNotu) : null,
          apgar1: typeof body.apgar1 === 'number' ? body.apgar1 : (body.apgar1 != null ? Number(body.apgar1) : null),
          apgar5: typeof body.apgar5 === 'number' ? body.apgar5 : (body.apgar5 != null ? Number(body.apgar5) : null),
          kiloGram: typeof body.yenidoganKiloGram === 'number' ? body.yenidoganKiloGram : (body.yenidoganKiloGram != null ? Number(body.yenidoganKiloGram) : null),
          boyCm: typeof body.yenidoganBoyCm === 'number' ? body.yenidoganBoyCm : (body.yenidoganBoyCm != null ? Number(body.yenidoganBoyCm) : null),
          basCm: typeof body.yenidoganBasCevresiCm === 'number' ? body.yenidoganBasCevresiCm : (body.yenidoganBasCevresiCm != null ? Number(body.yenidoganBasCevresiCm) : null),
          gestHafta: typeof body.gestHafta === 'number' ? body.gestHafta : (yasDogum?.hafta ?? null),
          cinsiyet: body.yenidoganCinsiyet ? String(body.yenidoganCinsiyet) : null,
          bebekAdi: body.yenidoganAdi ? String(body.yenidoganAdi) : null,
          gkdRisk: Boolean(body.gkdRisk),
        })
        yenidoganPatientId = kart.bebekPatientId
        dogumId = kart.dogumId
      } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Bebek kartı oluşturulamadı.' }, { status: 500 })
      }
    }

    const { error } = await supabase.from('gebelikler').update({
      durum: body.durum === 'sonlandi' ? 'sonlandi' : 'tamamlandi',
      dogum_tarihi: body.dogumTarihi ?? null, dogum_sekli: body.dogumSekli ?? null, dogum_notu: body.dogumNotu ?? null,
      yenidogan_patient_id: yenidoganPatientId,
      updated_at: new Date().toISOString(),
    }).eq('id', gebelikId).eq('doctor_id', doktorId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, yenidoganPatientId, dogumId })
  }

  if (action === 'lohusa-izlem') {
    const gebelikId = String(body.gebelikId || '')
    const { data: gebelik } = await supabase.from('gebelikler').select('id, dogum_tarihi').eq('id', gebelikId).eq('doctor_id', doktorId).maybeSingle()
    if (!gebelik?.dogum_tarihi) return NextResponse.json({ error: 'Doğum kaydı bulunamadı.' }, { status: 404 })
    const tarih = body.tarih ? String(body.tarih) : new Date().toISOString().slice(0, 10)
    const gun = Math.floor((new Date(tarih).getTime() - new Date(gebelik.dogum_tarihi).getTime()) / 86_400_000)
    const { data: kayit, error } = await supabase.from('lohusa_izlemleri').insert({
      gebelik_id: gebelikId, doctor_id: doktorId, tarih, dogum_sonrasi_gun: gun,
      tansiyon_sistolik: body.tansiyonSistolik ?? null, tansiyon_diastolik: body.tansiyonDiastolik ?? null, ates: body.ates ?? null,
      kanama: body.kanama ?? null, uterus_involusyon: body.uterusInvolusyon ?? null, perine_insizyon: body.perineInsizyon ?? null,
      emzirme: body.emzirme ?? null, duygu_durumu: body.duyguDurumu ?? null, epds_puan: body.epdsPuan ?? null, not_metni: body.notMetni ?? null,
    }).select('id').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    let notEkleme = null
    if (body.muayeneFormunaEkle) {
      const parca = [`Lohusa izlemi (doğum sonrası ${gun}. gün, SB DSBYR).`]
      if (body.kanama) parca.push(`Loşi: ${body.kanama}.`)
      if (body.emzirme) parca.push(`Emzirme: ${body.emzirme}.`)
      if (body.tansiyonSistolik && body.tansiyonDiastolik) parca.push(`TA ${body.tansiyonSistolik}/${body.tansiyonDiastolik} mmHg.`)
      notEkleme = await gununNotunaEkle(supabase, doktorId, patientId, parca.join(' '))
      if (notEkleme.notId) await supabase.from('lohusa_izlemleri').update({ not_id: notEkleme.notId }).eq('id', kayit.id).then(() => {}, () => {})
    }
    return NextResponse.json({ izlemId: kayit.id, gun, notEkleme })
  }

  if (action === 'genetik-tarama') {
    const gebelikId = String(body.gebelikId || '')
    const { data: gebelik } = await supabase.from('gebelikler').select('id').eq('id', gebelikId).eq('doctor_id', doktorId).maybeSingle()
    if (!gebelik) return NextResponse.json({ error: 'Gebelik bulunamadı.' }, { status: 404 })
    const tur = String(body.tur || '')
    if (!['ikili', 'uclu-dortlu', 'nipt', 'invazif', 'risk-sorgu'].includes(tur)) return NextResponse.json({ error: 'Geçersiz tarama türü.' }, { status: 400 })
    const { data: kayit, error } = await supabase.from('genetik_taramalar').insert({
      gebelik_id: gebelikId, doctor_id: doktorId, tur, tarih: body.tarih || new Date().toISOString().slice(0, 10),
      hafta: body.hafta ?? null, veri: body.veri ?? {},
    }).select('id').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    let notEkleme = null
    if (body.muayeneFormunaEkle) {
      const etiketler: Record<string, string> = { ikili: 'İkili test', 'uclu-dortlu': 'Üçlü/dörtlü test', nipt: 'NIPT', invazif: 'İnvaziv test', 'risk-sorgu': 'Genetik risk sorgusu' }
      const v = (body.veri || {}) as { ntMm?: number; kombineRisk?: string; t21?: string }
      const parca = [`${etiketler[tur]} kaydedildi.`]
      if (v.ntMm != null) parca.push(`NT ${v.ntMm} mm.`)
      if (v.kombineRisk) parca.push(`Kombine risk (laboratuvar bildirimi): ${v.kombineRisk}.`)
      if (v.t21) parca.push(`NIPT T21: ${v.t21}.`)
      notEkleme = await gununNotunaEkle(supabase, doktorId, patientId, parca.join(' '))
      if (notEkleme.notId) await supabase.from('genetik_taramalar').update({ not_id: notEkleme.notId }).eq('id', kayit.id).then(() => {}, () => {})
    }
    return NextResponse.json({ taramaId: kayit.id, notEkleme })
  }

  if (action === 'klinik') {
    const gebelikId = String(body.gebelikId || '')
    const { data: gebelik } = await supabase.from('gebelikler').select('id').eq('id', gebelikId).eq('doctor_id', doktorId).maybeSingle()
    if (!gebelik) return NextResponse.json({ error: 'Gebelik bulunamadı.' }, { status: 404 })
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.riskFormu && typeof body.riskFormu === 'object') {
      const maddeler = Array.isArray((body.riskFormu as { maddeler?: string[] }).maddeler)
        ? (body.riskFormu as { maddeler: string[] }).maddeler
        : []
      patch.risk_formu = body.riskFormu
      patch.risk_sinifi = riskClassFromForm(maddeler)
    }
    if (body.vteFormu && typeof body.vteFormu === 'object') {
      const maddeler = Array.isArray((body.vteFormu as { maddeler?: string[] }).maddeler)
        ? (body.vteFormu as { maddeler: string[] }).maddeler
        : []
      patch.vte_formu = { ...(body.vteFormu as object), puan: vteScoreFromForm(maddeler) }
    }
    if (body.destekAsi && typeof body.destekAsi === 'object') patch.destek_asi = body.destekAsi
    if (body.labPanel && typeof body.labPanel === 'object') {
      patch.lab_panel = body.labPanel
      const lab = body.labPanel as { idc?: { sonuc?: string; tarih?: string }; kan_grubu?: { sonuc?: string } }
      if (lab.idc?.sonuc) {
        patch.indirekt_coombs = [{ tarih: lab.idc.tarih || new Date().toISOString().slice(0, 10), sonuc: lab.idc.sonuc }]
      }
      if (lab.kan_grubu?.sonuc) patch.kan_grubu = lab.kan_grubu.sonuc
    }
    if (Array.isArray(body.nstKayitlari)) patch.nst_kayitlari = body.nstKayitlari
    if (body.oluDogum !== undefined) patch.olu_dogum = body.oluDogum
    if (body.ektopik !== undefined) patch.ektopik = body.ektopik
    if (body.cogulGebelikTipi !== undefined) patch.cogul_gebelik_tipi = body.cogulGebelikTipi
    if (body.oncekiSezaryenSayisi !== undefined) patch.onceki_sezaryen_sayisi = body.oncekiSezaryenSayisi
    if (body.oncekiSezaryenKesiTipi !== undefined) patch.onceki_sezaryen_kesi_tipi = body.oncekiSezaryenKesiTipi
    if (body.antiDUygulamalari !== undefined) patch.anti_d_uygulamalari = body.antiDUygulamalari
    const { error } = await supabase.from('gebelikler').update(patch).eq('id', gebelikId).eq('doctor_id', doktorId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, riskSinifi: patch.risk_sinifi ?? null })
  }

  return NextResponse.json({ error: 'Geçersiz action.' }, { status: 400 })
}
