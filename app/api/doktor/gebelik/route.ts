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
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum); if (engel) return engel
  const { supabase, doktorId } = oturum
  const patientId = req.nextUrl.searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId zorunludur.' }, { status: 400 })

  const { data: gebelik } = await supabase.from('gebelikler').select('*')
    .eq('patient_id', patientId).eq('doctor_id', doktorId).eq('durum', 'aktif')
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  const { data: gecmis } = await supabase.from('gebelikler').select('id, sat, tdt, durum, dogum_tarihi, dogum_sekli')
    .eq('patient_id', patientId).eq('doctor_id', doktorId).neq('durum', 'aktif').order('created_at', { ascending: false })
  if (!gebelik) return NextResponse.json({ gebelik: null, gecmis: gecmis || [] })

  const { data: izlemler } = await supabase.from('gebelik_izlemleri').select('*').eq('gebelik_id', gebelik.id).order('tarih', { ascending: true })
  const izlemGirdileri: IzlemGirdisi[] = (izlemler || []).map((i) => ({
    tarih: i.tarih, hafta: i.hafta, kilo: i.kilo, tansiyonSistolik: i.tansiyon_sistolik, tansiyonDiastolik: i.tansiyon_diastolik,
    fundusYuksekligi: i.fundus_yuksekligi, fetalKalpAtimi: i.fetal_kalp_atimi, proteinuri: i.proteinuri,
  }))
  const yas = gebelikYasi(gebelik.sat, gebelik.tdt)
  const son = izlemGirdileri.length ? izlemGirdileri[izlemGirdileri.length - 1] : null
  const vki = gebelik.gebelik_oncesi_kilo && gebelik.boy ? gebelik.gebelik_oncesi_kilo / Math.pow(gebelik.boy / 100, 2) : null

  return NextResponse.json({
    gebelik, izlemler: izlemler || [], gecmis: gecmis || [],
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
    // aynı hastada aktif gebelik varsa tamamlanmış say (tek aktif gebelik)
    await supabase.from('gebelikler').update({ durum: 'sonlandi' }).eq('patient_id', patientId).eq('doctor_id', doktorId).eq('durum', 'aktif')
    const { data, error } = await supabase.from('gebelikler').insert({
      patient_id: patientId, doctor_id: doktorId, sat, tdt, tdt_kaynak: tdtGirilen ? 'usg' : 'sat',
      gravida: body.gravida ?? null, para: body.para ?? null, abortus: body.abortus ?? null, yasayan: body.yasayan ?? null,
      gebelik_oncesi_kilo: body.gebelikOncesiKilo ?? null, boy: body.boy ?? null,
      kan_grubu: body.kanGrubu ?? null, rh_negatif: !!body.rhNegatif,
      risk_faktorleri: Array.isArray(body.riskFaktorleri) ? body.riskFaktorleri : [],
    }).select('id').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ gebelikId: data.id, tdt })
  }

  if (action === 'izlem') {
    const gebelikId = String(body.gebelikId || '')
    const { data: gebelik } = await supabase.from('gebelikler').select('id, sat, tdt').eq('id', gebelikId).eq('doctor_id', doktorId).maybeSingle()
    if (!gebelik) return NextResponse.json({ error: 'Aktif gebelik bulunamadı.' }, { status: 404 })
    const tarih = body.tarih ? String(body.tarih) : new Date().toISOString().slice(0, 10)
    const yas = gebelikYasi(gebelik.sat, gebelik.tdt, new Date(tarih))
    const hafta = typeof body.hafta === 'number' ? body.hafta : (yas?.hafta ?? 0)
    const { data: kayit, error } = await supabase.from('gebelik_izlemleri').insert({
      gebelik_id: gebelikId, doctor_id: doktorId, tarih, hafta,
      kilo: body.kilo ?? null, tansiyon_sistolik: body.tansiyonSistolik ?? null, tansiyon_diastolik: body.tansiyonDiastolik ?? null,
      fundus_yuksekligi: body.fundusYuksekligi ?? null, fetal_kalp_atimi: body.fetalKalpAtimi ?? null, proteinuri: body.proteinuri ?? null,
      usg: body.usg ?? null, not_metni: body.notMetni ?? null,
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
    return NextResponse.json({ izlemId: kayit.id, hafta, notEkleme })
  }

  if (action === 'sonlandir') {
    const gebelikId = String(body.gebelikId || '')
    const { error } = await supabase.from('gebelikler').update({
      durum: body.durum === 'sonlandi' ? 'sonlandi' : 'tamamlandi',
      dogum_tarihi: body.dogumTarihi ?? null, dogum_sekli: body.dogumSekli ?? null, dogum_notu: body.dogumNotu ?? null,
      updated_at: new Date().toISOString(),
    }).eq('id', gebelikId).eq('doctor_id', doktorId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Geçersiz action.' }, { status: 400 })
}
