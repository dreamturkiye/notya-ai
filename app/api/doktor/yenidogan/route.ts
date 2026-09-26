/**
 * Taburcu + NTP + Bebek izlem API (doktor scope).
 * GET  ?patientId=           → anne ise doğum/taburcu/lohusa + bebek link; bebek ise kart + görev + NTP + aşı
 * GET  ?worklist=1           → yeni bebek iş listesi (pediatri)
 * POST { action, ... }
 *   taburcu-kaydet | taburcu-tamamla | red-kaydet | gorev-durum | lohusa-paket | asi-uygula
 *
 * Reads 029 shapes: bebek_kartlari.bebek_patient_id / anne_patient_id / yenidogan_tarama;
 * taburcu_checklist.maddeler + istisna + kapatildi. Calendar lives in 036 bebek_gorevleri.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { decrypt } from '@/lib/security/encryption'
import {
  NTP_DISCLAIMER,
  NTP2_SMS,
  gorevUrgency,
  redKaydi,
  taburcuGate,
} from '@/lib/clinical/yenidogan'
import {
  asObj,
  checksFromMaddeler,
  isoTs,
  istisnaFromRow,
  istisnaToDb,
  mergeTaburcuMaddeler,
  num,
  olusturCanliDogum,
  redlerFromJson,
  taburcuUiFromRow,
  tamamlaTaburcu,
  yolNorm,
} from '@/lib/doktor/yenidoganKayit'

export const dynamic = 'force-dynamic'

function adCoz(enc: string | null | undefined): string {
  try {
    if (!enc) return ''
    const n = JSON.parse(decrypt(enc)) as { ad?: string; soyad?: string }
    return [n.ad, n.soyad].filter(Boolean).join(' ')
  } catch {
    return ''
  }
}

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum); if (engel) return engel
  const { supabase, doktorId } = oturum

  if (req.nextUrl.searchParams.get('worklist')) {
    const { data: gorevler } = await supabase.from('bebek_gorevleri').select('*')
      .eq('doctor_id', doktorId).eq('kind', 'yeni_bebek')
      .order('created_at', { ascending: false }).limit(40)
    const bebekIds = [...new Set((gorevler || []).map((g) => g.bebek_id))]
    const { data: hastalar } = bebekIds.length
      ? await supabase.from('patients').select('id, name_encrypted, dob_encrypted').eq('doctor_id', doktorId).in('id', bebekIds)
      : { data: [] }
    const adMap = Object.fromEntries((hastalar || []).map((h) => [h.id, adCoz(h.name_encrypted)]))
    return NextResponse.json({
      disclaimer: NTP_DISCLAIMER,
      enabiz: 'Notya e-Nabız veya ulusal tarama kaydı yerine geçmez.',
      yeniBebekler: (gorevler || []).map((g) => ({
        ...g,
        bebekAd: adMap[g.bebek_id] || 'Yenidoğan',
      })),
    })
  }

  const patientId = req.nextUrl.searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId zorunludur.' }, { status: 400 })

  const { data: kartBebek } = await supabase.from('bebek_kartlari').select('*').eq('bebek_patient_id', patientId).eq('doctor_id', doktorId).maybeSingle()
  const { data: kartAnne } = kartBebek
    ? { data: null }
    : await supabase.from('bebek_kartlari').select('*').eq('anne_patient_id', patientId).eq('doctor_id', doktorId).order('created_at', { ascending: false }).limit(1).maybeSingle()

  const kart = kartBebek || kartAnne
  if (!kart) {
    return NextResponse.json({
      rol: null,
      disclaimer: NTP_DISCLAIMER,
      kart: null,
    })
  }

  const bebekId = kart.bebek_patient_id as string | null
  const anneId = kart.anne_patient_id as string
  const rol = kartBebek ? 'bebek' : 'anne'
  if (!bebekId) {
    return NextResponse.json({ rol, disclaimer: NTP_DISCLAIMER, kart, bebek: null })
  }

  const [{ data: dogum }, { data: taburcu }, { data: lohusa }, { data: gorevler }, { data: asilar }, { data: ntpPaneller }] = await Promise.all([
    supabase.from('dogum_olaylari').select('*').eq('id', kart.dogum_id).maybeSingle(),
    supabase.from('taburcu_checklist').select('*').eq('dogum_id', kart.dogum_id).maybeSingle(),
    supabase.from('lohusa_checklist').select('*').eq('dogum_id', kart.dogum_id).maybeSingle(),
    supabase.from('bebek_gorevleri').select('*').eq('bebek_id', bebekId).eq('doctor_id', doktorId).order('due_at', { ascending: true }),
    supabase.from('asi_dozlari').select('*').eq('bebek_id', bebekId).order('due_at', { ascending: true }),
    supabase.from('lab_paneller').select('id, belge_id, lab_adi, numune_tarihi, panel_type, sample_no, durum, created_at')
      .eq('patient_id', bebekId).eq('panel_type', 'yenidogan_tarama').order('created_at', { ascending: false }).limit(12),
  ])

  const panelIds = (ntpPaneller || []).map((p) => p.id)
  const { data: ntpSatirlar } = panelIds.length
    ? await supabase.from('lab_satirlar').select('panel_id, canonical_key, raw_name, flag, value_text, value_num').in('panel_id', panelIds)
    : { data: [] }

  const bugun = new Date().toISOString().slice(0, 10)
  const gorevUi = (gorevler || []).map((g) => ({
    ...g,
    urgency: g.status === 'yapildi' || g.status === 'red' ? 'ok' : gorevUrgency(g.due_at, bugun, g.due_end_at),
  }))
  const maddeler = asObj(taburcu?.maddeler)
  const tarama = asObj(kart.yenidogan_tarama)
  const gate = taburcuGate({
    checks: checksFromMaddeler(maddeler, tarama),
    redler: redlerFromJson(taburcu?.red_json),
    istisna: istisnaFromRow(taburcu?.istisna),
    dogumAt: String(dogum?.dogum_zamani || bugun),
  })

  const ntp2 = gorevUi.find((g) => g.kind === 'ntp2')
  const sonrakiIzlem = gorevUi.find((g) => g.kind === 'izlem' && g.status === 'bekliyor')
  const sonrakiAsi = (asilar || []).find((a) => !a.given_at)
  const taburcuUi = taburcuUiFromRow(taburcu)

  const [{ data: bebekRow }, { data: anneRow }] = await Promise.all([
    supabase.from('patients').select('id, name_encrypted, dob_encrypted').eq('id', bebekId).eq('doctor_id', doktorId).maybeSingle(),
    supabase.from('patients').select('id, name_encrypted').eq('id', anneId).eq('doctor_id', doktorId).maybeSingle(),
  ])

  const dogumAt = dogum?.dogum_zamani || kart.dogum_zamani
  const dogumUi = dogum ? {
    ...dogum,
    id: dogum.id,
    dogum_at: dogumAt,
    yol: yolNorm(dogum.dogum_sekli),
    kilo: kart.kilo_gram ?? null,
    apgar_1: kart.apgar1 ?? null,
    apgar_5: kart.apgar5 ?? null,
  } : null

  return NextResponse.json({
    rol,
    disclaimer: NTP_DISCLAIMER,
    enabiz: 'Notya e-Nabız veya ulusal tarama kaydı yerine geçmez.',
    bebek: {
      patientId: bebekId,
      ad: adCoz(bebekRow?.name_encrypted),
      dogumTarihi: bebekRow?.dob_encrypted ? (() => { try { return decrypt(bebekRow.dob_encrypted).slice(0, 10) } catch { return null } })() : null,
    },
    anne: { patientId: anneId, ad: adCoz(anneRow?.name_encrypted) },
    kart: { ...kart, patient_id: bebekId, anne_id: anneId },
    dogum: dogumUi,
    taburcu: taburcuUi,
    lohusa,
    gate: { ok: gate.ok, eksik: gate.eksik, neden: gate.neden, tamamlandi: Boolean(taburcu?.kapatildi) },
    gorevler: rol === 'anne' ? gorevUi.filter((g) => g.kind === 'lohusa_anne' || g.kind === 'yeni_bebek') : gorevUi,
    asilar: asilar || [],
    ntp: (ntpPaneller || []).map((p) => ({
      ...p,
      satirlar: (ntpSatirlar || []).filter((s) => s.panel_id === p.id),
    })),
    timeline: {
      ntp1: Boolean(maddeler.ntp1 || maddeler.ntp1_alindi_at || tarama.ntp1),
      ntp2: ntp2 ? { ...ntp2 } : null,
      isitme: maddeler.isitme_sonuc || tarama.isitme || null,
      hepb1: Boolean(maddeler.hepb1 || maddeler.hepb1_at || tarama.hepb1) || Boolean((asilar || []).find((a) => a.kod === 'HEPB1' && a.given_at)),
      dvit: Boolean(maddeler.dvit || maddeler.dvit_baslandi || tarama.dvit) || gorevUi.some((g) => g.kind === 'dvit' && g.status === 'yapildi'),
      sonrakiIzlem: sonrakiIzlem || null,
      sonrakiAsi: sonrakiAsi || null,
    },
    smsNtp2: ntp2 ? NTP2_SMS(ntp2.due_at, ntp2.due_end_at || ntp2.due_at) : null,
  })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum); if (engel) return engel
  const { supabase, doktorId, user } = oturum
  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const action = String(body.action || '')

  if (action === 'taburcu-kaydet') {
    const dogumId = String(body.dogumId || '')
    const { data: dogum } = await supabase.from('dogum_olaylari').select('id').eq('id', dogumId).eq('doctor_id', doktorId).maybeSingle()
    if (!dogum) return NextResponse.json({ error: 'Doğum bulunamadı.' }, { status: 404 })
    const { data: cl } = await supabase.from('taburcu_checklist').select('id, maddeler, bebek_id').eq('dogum_id', dogumId).eq('doctor_id', doktorId).maybeSingle()
    if (!cl) return NextResponse.json({ error: 'Taburcu listesi yok.' }, { status: 404 })
    const maddeler = mergeTaburcuMaddeler(asObj(cl.maddeler), body)
    const patch: Record<string, unknown> = { maddeler, updated_at: new Date().toISOString() }
    if (body.istisna && typeof body.istisna === 'object') {
      const i = body.istisna as { neden?: string; aciklama?: string }
      patch.istisna = istisnaToDb({
        neden: (i.neden === 'red' ? 'redd' : i.neden) as 'erken_taburcu' | 'redd' | 'sevk',
        aciklama: String(i.aciklama || ''),
        kaydeden: user.id,
        at: new Date().toISOString(),
      })
    }
    const { error } = await supabase.from('taburcu_checklist').update(patch).eq('id', cl.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Keep 029 yenidogan_tarama in sync so DogumSpine checkboxes stay consistent.
    if (cl.bebek_id) {
      const { data: bk } = await supabase.from('bebek_kartlari').select('id, yenidogan_tarama').eq('id', cl.bebek_id).maybeSingle()
      if (bk) {
        const tarama = {
          ...asObj(bk.yenidogan_tarama),
          ntp1: Boolean(maddeler.ntp1),
          hepb1: Boolean(maddeler.hepb1),
          vitk: Boolean(maddeler.vitk),
          isitme: maddeler.isitme_sonuc || Boolean(maddeler.isitme),
          pulseox: maddeler.pulseox_sonuc || Boolean(maddeler.pulseox),
          kirmizi_refleks: Boolean(maddeler.kirmizi_refleks),
          gkd: Boolean(maddeler.gkd),
          dvit: Boolean(maddeler.dvit),
          emzirme: Boolean(maddeler.emzirme),
          ntp2_randevu: Boolean(maddeler.ntp2_randevu),
        }
        await supabase.from('bebek_kartlari').update({ yenidogan_tarama: tarama }).eq('id', bk.id)
      }
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'taburcu-tamamla') {
    const dogumId = String(body.dogumId || '')
    let istisna = null
    if (body.istisna && typeof body.istisna === 'object') {
      const i = body.istisna as { neden?: string; aciklama?: string }
      istisna = {
        neden: i.neden as 'erken_taburcu' | 'redd' | 'sevk',
        aciklama: String(i.aciklama || ''),
        kaydeden: user.id,
        at: new Date().toISOString(),
      }
    }
    try {
      const r = await tamamlaTaburcu(supabase, { doktorId, dogumId, onaylayan: user.id, istisna })
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: 409 })
      return NextResponse.json({ ...r, disclaimer: NTP_DISCLAIMER })
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : 'Taburcu tamamlanamadı' }, { status: 500 })
    }
  }

  if (action === 'red-kaydet') {
    const dogumId = String(body.dogumId || '')
    const kalem = String(body.kalem || '')
    const neden = String(body.neden || '').trim()
    if (!dogumId || !kalem || !neden) return NextResponse.json({ error: 'kalem ve neden zorunludur.' }, { status: 400 })
    const { data: cl } = await supabase.from('taburcu_checklist').select('red_json').eq('dogum_id', dogumId).eq('doctor_id', doktorId).maybeSingle()
    if (!cl) return NextResponse.json({ error: 'Taburcu listesi yok.' }, { status: 404 })
    const kayit = redKaydi({ kalem, neden, imza: body.imza ? String(body.imza) : undefined, kaydeden: user.id })
    const maddeler = [...redlerFromJson(cl.red_json).filter((r) => r.kalem !== kalem), kayit]
    await supabase.from('taburcu_checklist').update({ red_json: { maddeler }, updated_at: new Date().toISOString() }).eq('dogum_id', dogumId)

    const bebekId = String(body.bebekId || '')
    if (bebekId) {
      // Refuse lives on the checklist. Do not remap ntp1→ntp2 or vitk→izlem (would mark the wrong row).
      const gorevFiltre: Record<string, string> | null =
        kalem === 'isitme' ? { kind: 'isitme_izlem' } :
        kalem === 'hepb1' ? { kind: 'asi', asi_kod: 'HEPB1' } :
        null
      if (gorevFiltre) {
        let q = supabase.from('bebek_gorevleri').update({
          status: 'red',
          red_at: kayit.at,
          red_kaydeden: user.id,
          notes: neden,
          updated_at: new Date().toISOString(),
        }).eq('bebek_id', bebekId).eq('doctor_id', doktorId).eq('status', 'bekliyor').eq('kind', gorevFiltre.kind)
        if (gorevFiltre.asi_kod) q = q.eq('asi_kod', gorevFiltre.asi_kod)
        await q
      }
    }
    return NextResponse.json({ ok: true, red: kayit })
  }

  if (action === 'gorev-durum') {
    const id = String(body.gorevId || '')
    const status = String(body.status || '')
    if (!['bekliyor', 'yapildi', 'red', 'gecikti'].includes(status)) {
      return NextResponse.json({ error: 'Geçersiz durum.' }, { status: 400 })
    }
    const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
    if (status === 'red') {
      patch.red_at = new Date().toISOString()
      patch.red_kaydeden = user.id
      patch.notes = body.neden ? String(body.neden) : null
    }
    const { error } = await supabase.from('bebek_gorevleri').update(patch).eq('id', id).eq('doctor_id', doktorId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'lohusa-paket') {
    const dogumId = String(body.dogumId || '')
    const { data: row } = await supabase.from('lohusa_checklist').select('id').eq('dogum_id', dogumId).eq('doctor_id', doktorId).maybeSingle()
    if (!row) return NextResponse.json({ error: 'Lohusa paketi yok.' }, { status: 404 })
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.kanama !== undefined) patch.kanama = body.kanama
    if (body.meme !== undefined) patch.meme = body.meme
    if (body.epizyoKesi !== undefined) patch.epizyo_kesi = body.epizyoKesi
    if (body.duyguDurum !== undefined) patch.duygu_durum = body.duyguDurum
    if (body.rhogamAt !== undefined) patch.rhogam_at = isoTs(body.rhogamAt)
    if (body.rhogamEndike !== undefined) patch.rhogam_endike = Boolean(body.rhogamEndike)
    if (body.demirDevam !== undefined) patch.demir_devam = Boolean(body.demirDevam)
    const { error } = await supabase.from('lohusa_checklist').update(patch).eq('id', row.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'asi-uygula') {
    const bebekId = String(body.bebekId || '')
    const kod = String(body.kod || '')
    if (!bebekId || !kod) return NextResponse.json({ error: 'bebekId ve kod zorunludur.' }, { status: 400 })
    const given = String(body.givenAt || new Date().toISOString().slice(0, 10)).slice(0, 10)
    const { error } = await supabase.from('asi_dozlari').update({
      given_at: given,
      lot: body.lot ? String(body.lot) : null,
      yer: body.yer ? String(body.yer) : null,
      updated_at: new Date().toISOString(),
    }).eq('bebek_id', bebekId).eq('kod', kod).eq('doctor_id', doktorId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await supabase.from('bebek_gorevleri').update({ status: 'yapildi', updated_at: new Date().toISOString() })
      .eq('bebek_id', bebekId).eq('asi_kod', kod).eq('doctor_id', doktorId)
    return NextResponse.json({ ok: true })
  }

  if (action === 'canli-dogum-onar') {
    const gebelikId = String(body.gebelikId || '')
    const anneId = String(body.patientId || '')
    if (!gebelikId || !anneId) return NextResponse.json({ error: 'gebelikId zorunludur.' }, { status: 400 })
    try {
      const r = await olusturCanliDogum(supabase, {
        doktorId,
        anneId,
        gebelikId,
        dogumTarihi: String(body.dogumTarihi || new Date().toISOString().slice(0, 10)),
        dogumSekli: body.dogumSekli ? String(body.dogumSekli) : 'NSD',
        apgar1: num(body.apgar1),
        apgar5: num(body.apgar5),
        kiloGram: num(body.kiloGram),
        boyCm: num(body.boyCm),
        basCm: num(body.basCm),
        gestHafta: num(body.gestHafta),
        cinsiyet: body.cinsiyet ? String(body.cinsiyet) : null,
        bebekAdi: body.bebekAdi ? String(body.bebekAdi) : null,
      })
      return NextResponse.json({ ok: true, ...r })
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : 'Kayıt başarısız' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Geçersiz action.' }, { status: 400 })
}
