/**
 * PLASTIK-CERRAHI-EXCEPTIONAL-01 — Plastik Cerrahi API. Ayaktan muayenehane akışı.
 * HASTA-İZOLASYON: her istek hastaSahibiMi kapısından geçer.
 * GET  ?patientId= → şerit, yara, foto, acil, görevler
 * POST adim: yara | foto | onam | risk | gorev | kontrol | goruntu_okuma
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { yaraSkorla, yaraGorevleri, yaraNormalize, YARA_TIP_AD } from '@/specialties/plastik-cerrahi/engines/yara'
import { fotoSkorla, fotoGorevleri, fotoNormalize } from '@/specialties/plastik-cerrahi/engines/foto'
import { onamSkorla } from '@/specialties/plastik-cerrahi/engines/onam'
import {
  acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, ACIL_KONTROL_LISTESI, HASTA_ACIL_METNI, type AcilKod,
} from '@/specialties/plastik-cerrahi/engines/acil'
import { plastikSeridi } from '@/specialties/plastik-cerrahi/engines/serit'
import {
  REF_ACIKLAMA, HEKIM_KILIT_METNI, ACIL_YONLENDIRME_METNI, KAPSAM_NOTU, ISO_GUN, dozVeyaTaniKilidiIceriyorMu,
} from '@/specialties/plastik-cerrahi/engines/plastik'
import { PLASTIK_GORUNTU_DISCLAIMER, okumaGecisi as plastikOkumaGecisi, taslakTaniDiliUyarisi as plastikTaslakTaniDiliUyarisi, PLASTIK_GORUNUMLER, type PlastikGorunum } from '@/specialties/plastik-cerrahi/imaging/dualSign'
import {
  analizKopruyeUygun as plastikAnalizKopruyeUygun, belgeModalitePlastik, belgeTaslakMetni as plastikBelgeTaslakMetni,
  guvenUst as plastikGuvenUst, kopruGorunumDogrula, taslakSonrakiAdim as plastikTaslakSonrakiAdim,
} from '@/specialties/plastik-cerrahi/imaging/belgeKopru'
import { tierAYazVeFuzyonla } from '@/core/belgeler/tierA'
import { bransKurali } from '@/core/belgeler/router'
import type { BelgeRaporu } from '@/core/belgeler/types'

export const dynamic = 'force-dynamic'

const bugun = () => new Date().toISOString().slice(0, 10)

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: Array<{ kod: string; ad: string; due?: string | null; kaynak: string }>) {
  let eklenen = 0
  for (const x of g) {
    const { data } = await sb.from('plastik_gorevleri').select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle()
    if (data) continue
    await sb.from('plastik_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak })
    eklenen++
  }
  return eklenen
}

async function bolumKaydi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('hasta_plastik').select('id, next_kontrol, yara, foto, notes').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (data) return data
  const { data: yeni } = await sb.from('hasta_plastik').insert({ patient_id: patientId, doctor_id: doctorId }).select('id, next_kontrol, yara, foto, notes').maybeSingle()
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

  if (adim === 'yara') {
    const s = yaraSkorla(b.yara ?? b)
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('plastik_yara').insert({
      patient_id: patientId, doctor_id: user.id, hasta_plastik_id: kayit?.id || null,
      tarih: T, tip: s.kart.tip, maddeler: s.kart, hekim_kilit: b.hekimKilit === true, not_hekim: s.kart.not,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await sb.from('hasta_plastik').update({ yara: s.kart, updated_at: new Date().toISOString() }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    await gorevEkle(sb, user.id, patientId, yaraGorevleri(s.kart).map((g) => ({ ...g, kaynak: 'yara' })))
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, kart: s.kart, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'foto') {
    const s = fotoSkorla(b.foto ?? b)
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('plastik_foto').insert({
      patient_id: patientId, doctor_id: user.id, hasta_plastik_id: kayit?.id || null,
      tarih: s.kart.tarih!, etiket: s.kart.etiket!, hekim_kilit: b.hekimKilit === true, not_hekim: s.kart.not,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const fotoOzet = { sonraki: s.kart.sonrakiKontrol, etiket: s.kart.etiket, sonTarih: s.kart.tarih }
    await sb.from('hasta_plastik').update({ foto: fotoOzet, updated_at: new Date().toISOString() }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    await gorevEkle(sb, user.id, patientId, fotoGorevleri(s.kart).map((g) => ({ ...g, kaynak: 'foto' })))
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.ozet)
    return NextResponse.json({ ok: true, kart: s.kart, notId: rn.eklendi ? rn.notId : null })
  }

  if (adim === 'onam') {
    const s = onamSkorla(b.secilen, b.not ? String(b.not) : null)
    if (!s.tamamMi) return NextResponse.json({ error: s.ozet, sonuc: s }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const notes = { ...(typeof kayit?.notes === 'object' && kayit.notes ? kayit.notes as object : {}), onam: { secilen: s.secilen, tarih: T } }
    await sb.from('hasta_plastik').update({ notes, updated_at: new Date().toISOString() }).eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    await gorevEkle(sb, user.id, patientId, s.gorevOnerileri.map((g) => ({ ...g, due: null, kaynak: 'onam' })))
    const rn = await gununNotunaEkle(sb, user.id, patientId, s.taslak)
    return NextResponse.json({ ok: true, secilen: s.secilen, notId: rn.eklendi ? rn.notId : null })
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
    const { error } = await sb.from('plastik_acil').insert({
      patient_id: patientId, doctor_id: user.id, hasta_plastik_id: kayit?.id || null,
      tarih: T, bayraklar: bayraklar.map((x) => x.kod), eylem, hekim_onay: b.hekimOnay === true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (bayraklar.length) {
      const rn = await gununNotunaEkle(sb, user.id, patientId, `⚑ Plastik acil bayrak: ${bayraklar.map((x) => x.ad).join('; ')} — hekim onayı verildi${eylem ? `: ${eylem}` : ''}. ${ACIL_YONLENDIRME_METNI}`)
      return NextResponse.json({ ok: true, bayraklar, notId: rn.eklendi ? rn.notId : null })
    }
    return NextResponse.json({ ok: true, bayraklar })
  }

  if (adim === 'gorev') {
    const { error } = await sb.from('plastik_gorevleri')
      .update({ durum: b.durum === 'acik' ? 'acik' : 'tamam', tamam_at: b.durum === 'acik' ? null : new Date().toISOString() })
      .eq('id', String(b.gorevId || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }

  if (adim === 'kontrol') {
    const tarih = String(b.tarih || '')
    if (!ISO_GUN.test(tarih)) return NextResponse.json({ error: 'Kontrol tarihi YYYY-AA-GG olmalı' }, { status: 400 })
    const kayit = await bolumKaydi(sb, user.id, patientId)
    const { error } = await sb.from('hasta_plastik')
      .update({ next_kontrol: tarih, updated_at: new Date().toISOString() })
      .eq('id', String(kayit?.id || '')).eq('doctor_id', user.id).eq('patient_id', patientId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await gorevEkle(sb, user.id, patientId, [{ kod: 'kontrol_randevu', ad: 'Kontrol randevusu', due: tarih, kaynak: 'kontrol' }])
    return NextResponse.json({ ok: true })
  }

  // dermatoloji/göz/KBB'nin taslak metnini/alanlarını kullanmaz — standart önce/sonra görünüm + işlem kategorisi + gün
  // sayısı kendi alanları, kendi disclaimer'ı, kendi tablosu (plastik_goruntu_okumalari). TANI/KOMPLİKASYON ADI YAZILMAZ
  // (dozVeyaTaniKilidiIceriyorMu taslağı da tarar — plastik.ts'in var olan kilidi burada gevşetilmedi, genişletildi).
  if (adim === 'goruntu_okuma') {
    const eylem = String(b.eylem || '')
    const gorunumR = kopruGorunumDogrula(b.gorunum)
    if (!gorunumR.ok) return NextResponse.json({ error: gorunumR.hata }, { status: 400 })
    const gorunum: PlastikGorunum = gorunumR.gorunum
    const procedureKategori = b.procedureKategori ? String(b.procedureKategori).slice(0, 80) : null
    const gunSayisi = b.gunSayisi != null && Number.isFinite(Number(b.gunSayisi)) ? Math.max(0, Math.round(Number(b.gunSayisi))) : null
    if (procedureKategori && dozVeyaTaniKilidiIceriyorMu(procedureKategori)) {
      return NextResponse.json({ error: 'İşlem kategorisinde doz/tanı dili yazılamaz.' }, { status: 400 })
    }

    if (eylem === 'belge_taslak') {
      const { data: a } = await sb.from('belge_analizleri').select('id, belge_id, modality_final, durum, sonuc, fusion')
        .eq('id', String(b.analizId || '')).eq('doctor_id', user.id).eq('patient_id', patientId).maybeSingle()
      if (!a) return NextResponse.json({ error: 'Analiz bulunamadı.' }, { status: 404 })
      if (!belgeModalitePlastik(String(a.modality_final))) return NextResponse.json({ error: 'Yalnız yara / foto izlem analizi plastik cerrahi okumasına aktarılır.' }, { status: 400 })
      const rapor = a.sonuc as BelgeRaporu | null
      const uygun = plastikAnalizKopruyeUygun(String(a.durum), rapor)
      if (!uygun.ok) return NextResponse.json({ error: uygun.hata }, { status: 400 })
      const ust = plastikGuvenUst((a.fusion as { capPct?: number } | null)?.capPct)
      const taslak = plastikBelgeTaslakMetni({ rapor: rapor!, gorunum, procedureKategori, gunSayisi, guvenUstPct: ust })
      const { data: eklenen, error } = await sb.from('plastik_goruntu_okumalari').insert({
        patient_id: patientId, doctor_id: user.id, goruntu_id: null, belge_id: a.belge_id, belge_analiz_id: a.id,
        gorunum, procedure_kategori: procedureKategori, gun_sayisi: gunSayisi, kaynak: 'belge_tier_a',
        guven_ust_pct: ust, asistan_rapor: rapor, taslak, taslak_yazan: 'asistan', durum: 'draft', disclaimer: PLASTIK_GORUNTU_DISCLAIMER,
      }).select('id').single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, guvenUst: ust, visionReadId: eklenen?.id ?? null, taslak, uyari: plastikTaslakTaniDiliUyarisi(taslak) })
    }

    if (eylem === 'asistana_raporla') {
      const { data: img } = await sb.from('hasta_goruntulemeler').select('id').eq('id', String(b.goruntuId || '')).eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle()
      if (!img) return NextResponse.json({ error: 'Görüntü bulunamadı.' }, { status: 404 })
      if (b.kimlikYok !== true) return NextResponse.json({ error: 'Göndermeden önce görüntüde hasta adı / T.C. / doğum tarihi olmadığını onaylayın (KVKK).' }, { status: 400 })
      const d = (b.deid || {}) as { mime?: string; base64?: string }
      if (!d.base64 || typeof d.base64 !== 'string' || d.base64.length > 12_000_000) return NextResponse.json({ error: 'Kimliksizleştirilmiş görüntü gerekli.' }, { status: 400 })
      const mime = (['image/jpeg', 'image/png', 'image/webp'].includes(String(d.mime)) ? d.mime : 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp'
      const kural = bransKurali('plastik')
      const iskelet = async (neden: string) => {
        const yedek = `Foto izlem gözlem taslağı (${gorunum}) — ${PLASTIK_GORUNTU_DISCLAIMER}`
        const { data: eklenen } = await sb.from('plastik_goruntu_okumalari').insert({
          patient_id: patientId, doctor_id: user.id, goruntu_id: img.id, gorunum, procedure_kategori: procedureKategori, gun_sayisi: gunSayisi,
          kaynak: 'ayse_iskelet', taslak: yedek, taslak_yazan: 'asistan', durum: 'draft', disclaimer: PLASTIK_GORUNTU_DISCLAIMER,
        }).select('id').single()
        return NextResponse.json({ ok: true, yedek: true, uyari: `${neden} — gözlem taslağı eklendi.`, visionReadId: eklenen?.id ?? null, taslak: yedek })
      }
      let sonuc
      try {
        sonuc = await tierAYazVeFuzyonla({
          persona: kural.persona,
          girdi: { brans: kural.ad, modality_final: 'yara', yasAy: null, cinsiyet: null, klinikNot: [`Görünüm: ${gorunum}.`, procedureKategori ? `İşlem: ${procedureKategori}.` : '', b.klinikNot ? String(b.klinikNot).slice(0, 300) : ''].filter(Boolean).join(' ') },
          gorsel: { tip: 'image', mime, base64: d.base64 }, tierB: [], modalite: 'yara', yasAy: null, fitzpatrickBilinmiyor: false, doctorId: user.id,
        })
      } catch { return iskelet('Görüntü asistan tarafından okunamadı') }
      const uygun = plastikAnalizKopruyeUygun('taslak', sonuc.rapor)
      if (!uygun.ok) return iskelet('Görüntü kalitesi düşük')
      const ust = plastikGuvenUst(sonuc.fusion.capPct)
      const taslak = plastikBelgeTaslakMetni({ rapor: sonuc.rapor, gorunum, procedureKategori, gunSayisi, guvenUstPct: ust })
      const { data: eklenen, error } = await sb.from('plastik_goruntu_okumalari').insert({
        patient_id: patientId, doctor_id: user.id, goruntu_id: img.id, gorunum, procedure_kategori: procedureKategori, gun_sayisi: gunSayisi,
        kaynak: 'belge_tier_a', guven_ust_pct: ust, asistan_rapor: sonuc.rapor, taslak, taslak_yazan: 'asistan', durum: 'draft', disclaimer: PLASTIK_GORUNTU_DISCLAIMER,
      }).select('id').single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, guvenUst: ust, visionReadId: eklenen?.id ?? null, taslak, uyari: plastikTaslakTaniDiliUyarisi(taslak), nextStep: plastikTaslakSonrakiAdim(sonuc.rapor) })
    }

    if (['onayla', 'duzelt', 'reddet'].includes(eylem)) {
      const { data: ok } = await sb.from('plastik_goruntu_okumalari').select('*').eq('id', String(b.id || '')).eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle()
      if (!ok) return NextResponse.json({ error: 'Okuma bulunamadı.' }, { status: 404 })
      if (eylem === 'duzelt' && b.uzmanMetin && dozVeyaTaniKilidiIceriyorMu(String(b.uzmanMetin))) {
        return NextResponse.json({ error: 'Düzeltme metninde doz/tanı dili yazılamaz.' }, { status: 400 })
      }
      const g = plastikOkumaGecisi({ taslak: ok.taslak, taslakYazan: ok.taslak_yazan, durum: ok.durum, uzmanMetin: ok.uzman_metin }, eylem as 'onayla' | 'duzelt' | 'reddet', 'uzman', b.uzmanMetin ? String(b.uzmanMetin) : undefined)
      if (!g.ok) return NextResponse.json({ error: g.hata }, { status: 403 })
      await sb.from('plastik_goruntu_okumalari').update({ durum: g.okuma.durum, uzman_metin: g.okuma.uzmanMetin, onay_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', ok.id)
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: 'Bilinmeyen görüntü okuma eylemi.' }, { status: 400 })
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

  const [bolum, riskQ, gorevQ] = await Promise.all([
    sb.from('hasta_plastik').select('id, next_kontrol, yara, foto, notes').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle(),
    sb.from('plastik_acil').select('id, tarih, bayraklar, eylem, hekim_onay').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(10),
    sb.from('plastik_gorevleri').select('id, kod, ad, due, durum, kaynak').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }),
  ])

  const yara = yaraNormalize(bolum.data?.yara)
  const foto = fotoNormalize(bolum.data?.foto ? { ...bolum.data.foto as object, tarih: (bolum.data.foto as { sonTarih?: string }).sonTarih, sonrakiKontrol: (bolum.data.foto as { sonraki?: string }).sonraki } : null)
  const acikRisk = (riskQ.data || []).filter((r) => (r.bayraklar || []).length && !r.hekim_onay)
  const sonRisk = riskQ.data?.[0] || null
  const gorevler = (gorevQ.data || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad), due: g.due ? String(g.due) : null }))

  const planlar: Array<{ kaynak: string; madde: string }> = []
  if (yara.tip) planlar.push({ kaynak: 'Yara/greft', madde: `${YARA_TIP_AD[yara.tip]}${yara.bolge ? ' · ' + yara.bolge : ''}` })
  if (yara.pansumanTarihi) planlar.push({ kaynak: 'Pansuman', madde: yara.pansumanTarihi })
  if (foto.sonrakiKontrol || (bolum.data?.foto as { sonraki?: string } | null)?.sonraki) {
    planlar.push({ kaynak: 'Foto', madde: String(foto.sonrakiKontrol || (bolum.data?.foto as { sonraki?: string }).sonraki) })
  }

  const serit = plastikSeridi({
    bugun: T,
    yaraTip: yara.tip ? YARA_TIP_AD[yara.tip] : null,
    yaraBolge: yara.bolge,
    riskBayraklari: acikRisk.flatMap((r) => (r.bayraklar || []).map(String)),
    riskHekimOnay: !acikRisk.length,
    sonrakiKontrol: bolum.data?.next_kontrol ? String(bolum.data.next_kontrol) : null,
    fotoSonraki: (bolum.data?.foto as { sonraki?: string } | null)?.sonraki || foto.sonrakiKontrol || null,
    gorevler,
    planlar,
  })

  return NextResponse.json({
    serit,
    bolum: { nextKontrol: bolum.data?.next_kontrol || null, yara: bolum.data?.yara || null, foto: bolum.data?.foto || null },
    risk: { son: sonRisk, acik: acikRisk, gecmis: riskQ.data || [] },
    gorevler: gorevQ.data || [],
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
