/**
 * NOTYA-DERM-02 — Derm spine API (dermatoloji only). Every write is a doctor action.
 * POST adim: lezyon_degerlendir | lezyon_tani | onam | islem | islem_patoloji | biyolojik_kapisi | biyolojik_basla | izotretinoin_basla | pediatrik | gorev
 * GET ?patientId= → lezyonlar (degerlendirme/resmi tanı), islemler, ilac guvenlik, görevler, onamlar, kutuphane
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { decrypt } from '@/lib/security/encryption'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { lezyonDegerlendir, islemGorevleri, DERM_ONAMLAR, ISLEM_SABLONLARI, RESMI_TANI_SECENEKLERI, biyolojikKapisi, izotretinoinKapisi, PEDIATRIK_SABLONLAR, type IslemTuru, type Abcde } from '@/specialties/dermatoloji/engines/derm-spine'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'

export const dynamic = 'force-dynamic'
const bugun = () => new Date().toISOString().slice(0, 10)
type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: { kod: string; ad: string; due?: string | null; kaynak: string }[]) {
  for (const x of g) { const { data } = await sb.from('derm_gorevleri').select('id').eq('patient_id', patientId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle(); if (!data) await sb.from('derm_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak }) }
}
async function onamOlustur(sb: Sb, doctorId: string, patientId: string, kod: string, onayli: boolean): Promise<string | null> {
  const s = DERM_ONAMLAR.find((o) => o.kod === kod); if (!s) return null
  const { data } = await sb.from('onamlar').insert({ patient_id: patientId, doctor_id: doctorId, gebelik_id: null, sablon_kodu: s.kod, sablon_adi: s.ad, icerik: { maddeler: s.maddeler, riskler: s.riskler }, hasta_onayladi: onayli, onay_at: onayli ? new Date().toISOString() : null }).select('id').single()
  return data?.id || null
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b?.adim) return NextResponse.json({ error: 'adım gerekli' }, { status: 400 })
  const adim = String(b.adim)
  const { data: hasta } = await sb.from('patients').select('id, gender_encrypted').eq('id', String(b.patientId || '')).eq('doctor_id', user.id).maybeSingle()
  if (!hasta) return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })
  const kadin = (() => { try { return hasta.gender_encrypted ? /^k|^f/i.test(decrypt(String(hasta.gender_encrypted))) : false } catch { return false } })()
  // HASTA-IZOLASYON-01: a lezyonId from the body must belong to THIS patient's (doctor-scoped) derm
  // episode. derm_lezyonlar has no doctor_id of its own — it was updated by bare id, so any doctor
  // could overwrite another doctor's lesion assessment or official diagnosis.
  const lezyonBu = async (id: unknown): Promise<string | null> => {
    const lid = String(id || ''); if (!lid) return null
    const { data: hd } = await sb.from('hasta_derm').select('id').eq('patient_id', hasta.id).eq('doctor_id', user.id).maybeSingle()
    if (!hd) return null
    const { data: lz } = await sb.from('derm_lezyonlar').select('id').eq('id', lid).eq('hasta_derm_id', hd.id).maybeSingle()
    return lz ? String(lz.id) : null
  }

  if (adim === 'gorev') { const { error } = await sb.from('derm_gorevleri').update({ durum: String(b.durum || 'tamam'), tamam_at: b.durum === 'tamam' ? new Date().toISOString() : null }).eq('id', String(b.gorevId || '')).eq('doctor_id', user.id); return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true }) }

  if (adim === 'lezyon_degerlendir') {
    const lezyonId = await lezyonBu(b.lezyonId)
    if (!lezyonId) return NextResponse.json({ error: 'Lezyon bulunamadı' }, { status: 404 })
    const a = (b.abcde || {}) as Partial<Abcde>
    const abcde: Abcde = { asimetri: !!a.asimetri, sinir: !!a.sinir, renk: !!a.renk, cap6mm: !!a.cap6mm, evrim: !!a.evrim }
    const boyut = b.boyutMm == null || b.boyutMm === '' ? null : Number(b.boyutMm)
    const d = lezyonDegerlendir(abcde, !!b.dermoskopUyari, !!b.cirkinOrdek, boyut)
    const { error } = await sb.from('derm_lezyonlar').update({ abcde, size_mm: boyut, dermoskop_notu: b.dermoskopNotu ? String(b.dermoskopNotu).slice(0, 1000) : null, dermoskop_uyari: !!b.dermoskopUyari, cirkin_ordek: !!b.cirkinOrdek, degerlendirme: d, acil: d.acil, updated_at: new Date().toISOString() }).eq('id', lezyonId)
    if (error) return NextResponse.json({ error: 'Lezyon güncellenemedi' }, { status: 500 })
    if (d.acil) { await gorevEkle(sb, user.id, hasta.id, [{ kod: `melanom_${String(b.lezyonId).slice(0, 8)}`, ad: 'MELANOM ŞÜPHESİ: eksizyonel biyopsi planı + dermatoonkoloji sevk (hekim kararı)', due: bugun(), kaynak: 'lezyon' }]); await gununNotunaEkle(sb, user.id, hasta.id, `Lezyon ABCDE ${d.abcdePuan}/5 — melanom şüphesi (acil bayrak); tanı histopatoloji ile.`) }
    return NextResponse.json({ ok: true, degerlendirme: d })
  }
  if (adim === 'lezyon_tani') {
    const tani = String(b.resmiTani || '')
    if (!(RESMI_TANI_SECENEKLERI as readonly string[]).includes(tani) && !tani.startsWith('Diğer')) return NextResponse.json({ error: 'Geçersiz tanı seçeneği' }, { status: 400 })
    const lezyonId = await lezyonBu(b.lezyonId)
    if (!lezyonId) return NextResponse.json({ error: 'Lezyon bulunamadı' }, { status: 404 })
    const { error } = await sb.from('derm_lezyonlar').update({ resmi_tani: tani, updated_at: new Date().toISOString() }).eq('id', lezyonId)
    if (error) return NextResponse.json({ error: 'Yazılamadı' }, { status: 500 })
    await gununNotunaEkle(sb, user.id, hasta.id, `Lezyon resmi tanısı (hekim): ${tani}`)
    return NextResponse.json({ ok: true })
  }
  if (adim === 'onam') { const id = await onamOlustur(sb, user.id, hasta.id, String(b.sablonKodu || ''), b.hastaOnayladi === true); return id ? NextResponse.json({ ok: true, onamId: id }) : NextResponse.json({ error: 'Onam şablonu bulunamadı' }, { status: 400 }) }
  if (adim === 'islem') {
    const tur = String(b.tur || '') as IslemTuru; const sab = ISLEM_SABLONLARI[tur]
    if (!sab) return NextResponse.json({ error: 'İşlem türü geçersiz' }, { status: 400 })
    const tarih = String(b.tarih || bugun()).slice(0, 10)
    const islemLezyonId = b.lezyonId ? await lezyonBu(b.lezyonId) : null
    if (b.lezyonId && !islemLezyonId) return NextResponse.json({ error: 'Lezyon bulunamadı' }, { status: 404 })
    const onamId = b.onamKaydet === true ? await onamOlustur(sb, user.id, hasta.id, sab.onamKodu, true) : null
    const { data, error } = await sb.from('derm_islemler').insert({ patient_id: hasta.id, doctor_id: user.id, lezyon_id: islemLezyonId, tur, tarih, onam_id: onamId, islem_notu: (b.islemNotu || {}) as object, yara_bakimi: sab.yaraBakimi }).select('id').single()
    if (error || !data) return NextResponse.json({ error: 'İşlem kaydedilemedi' }, { status: 500 })
    await gorevEkle(sb, user.id, hasta.id, islemGorevleri(tur, tarih).map((g) => ({ ...g, kod: `${g.kod}_${data.id.slice(0, 8)}`, kaynak: 'islem' })))
    await gununNotunaEkle(sb, user.id, hasta.id, `İşlem: ${sab.ad} — ${tarih}${onamId ? ' (onam alındı)' : ''}. Yara bakımı: ${sab.yaraBakimi.join('; ')}`)
    return NextResponse.json({ ok: true, islemId: data.id, onamId })
  }
  if (adim === 'islem_patoloji') {
    const { data: i } = await sb.from('derm_islemler').select('id, lezyon_id').eq('id', String(b.islemId || '')).eq('doctor_id', user.id).maybeSingle()
    if (!i) return NextResponse.json({ error: 'İşlem bulunamadı' }, { status: 404 })
    const sonuc = String(b.patolojiSonuc || '').slice(0, 1000)
    await sb.from('derm_islemler').update({ patoloji_sonuc: sonuc, patoloji_belge_id: b.belgeId ? String(b.belgeId) : null }).eq('id', i.id)
    if (i.lezyon_id) await sb.from('derm_lezyonlar').update({ patoloji_sonuc: sonuc, patoloji_belge_id: b.belgeId ? String(b.belgeId) : null, updated_at: new Date().toISOString() }).eq('id', i.lezyon_id)
    await sb.from('derm_gorevleri').update({ durum: 'tamam', tamam_at: new Date().toISOString() }).eq('patient_id', hasta.id).like('kod', `pat_%${i.id.slice(0, 8)}`).eq('durum', 'acik')
    await gununNotunaEkle(sb, user.id, hasta.id, `Patoloji sonucu (aynı lezyona bağlandı): ${sonuc.slice(0, 300)}`)
    return NextResponse.json({ ok: true })
  }
  if (adim === 'biyolojik_kapisi' || adim === 'biyolojik_basla') {
    const { data: labs } = await sb.from('lab_satirlar').select('canonical_key, kanonik_deger, value_text, numune_tarihi').eq('patient_id', hasta.id).eq('onayli', true).in('canonical_key', ['IGRA', 'HBsAg', 'AntiHBc', 'AntiHCV', 'HIV', 'Hb', 'ALT']).order('numune_tarihi', { ascending: false }).limit(60)
    const son = new Map<string, { key: string; deger: number | null; metin: string | null; tarih: string | null }>()
    for (const l of labs || []) if (!son.has(String(l.canonical_key))) son.set(String(l.canonical_key), { key: String(l.canonical_key), deger: l.kanonik_deger == null ? null : Number(l.kanonik_deger), metin: l.value_text, tarih: l.numune_tarihi ? String(l.numune_tarihi) : null })
    const { data: cxr } = await sb.from('belge_analizleri').select('id').eq('patient_id', hasta.id).eq('modality_final', 'cxr').in('durum', ['onaylandi', 'muayene_onaylandi']).limit(1).maybeSingle()
    if (cxr) son.set('CXR', { key: 'CXR', deger: null, metin: 'onaylı', tarih: null })
    const k = biyolojikKapisi([...son.values()], bugun())
    if (adim === 'biyolojik_kapisi') return NextResponse.json({ ok: true, kapisi: k })
    if (!k.hazir) return NextResponse.json({ error: `Biyolojik başlatılamaz — eksik: ${k.eksik.join(', ')}`, kapisi: k }, { status: 409 })
    const onamId = await onamOlustur(sb, user.id, hasta.id, 'derm_biyolojik', true)
    await sb.from('derm_ilac_guvenlik').insert({ patient_id: hasta.id, doctor_id: user.id, ilac: String(b.ilac || 'biyolojik'), kapisi: k, onam_id: onamId, baslangic: bugun() })
    await sb.from('hasta_derm').update({ tb_screen: true, hbv_screen: true, updated_at: new Date().toISOString() }).eq('patient_id', hasta.id)
    await gununNotunaEkle(sb, user.id, hasta.id, `Biyolojik başlangıcı (hekim): ${String(b.ilac || 'biyolojik')} — TB/HBV taraması onaylı labdan doğrulandı${k.uyari.length ? ` — uyarı: ${k.uyari.join('; ')}` : ''}`)
    return NextResponse.json({ ok: true, kapisi: k })
  }
  if (adim === 'izotretinoin_basla') {
    const { data: bhcg } = await sb.from('lab_satirlar').select('numune_tarihi, value_text, kanonik_deger').eq('patient_id', hasta.id).eq('onayli', true).eq('canonical_key', 'bHCG').order('numune_tarihi', { ascending: false }).limit(1).maybeSingle()
    const negatif = !!bhcg && (/negatif|negative/i.test(bhcg.value_text || '') || (bhcg.kanonik_deger != null && Number(bhcg.kanonik_deger) < 5))
    const onamId = b.onamKaydet === true ? await onamOlustur(sb, user.id, hasta.id, 'derm_izotretinoin', true) : b.onamId ? String(b.onamId) : null
    const k = izotretinoinKapisi(kadin, negatif && bhcg?.numune_tarihi ? String(bhcg.numune_tarihi) : null, onamId, bugun())
    if (!k.baslanabilir) return NextResponse.json({ error: `İzotretinoin başlatılamaz — eksik: ${k.eksik.join(', ')}`, kapisi: k }, { status: 409 })
    await sb.from('derm_ilac_guvenlik').insert({ patient_id: hasta.id, doctor_id: user.id, ilac: 'izotretinoin', kapisi: k, onam_id: onamId, baslangic: bugun(), aylik_due: k.aylikDue })
    if (kadin) {
      await gorevEkle(sb, user.id, hasta.id, [{ kod: 'izo_bhcg', ad: 'İzotretinoin: aylık β-hCG (Lab)', due: k.aylikDue, kaynak: 'ilac' }])
      const { data: var_ } = await sb.from('jine_gorevleri').select('id').eq('patient_id', hasta.id).eq('kod', 'izo_bhcg_derm').eq('durum', 'acik').maybeSingle()
      if (!var_) await sb.from('jine_gorevleri').insert({ patient_id: hasta.id, doctor_id: user.id, kod: 'izo_bhcg_derm', ad: 'Dermatoloji: izotretinoin altında — aylık β-hCG ve çift korunma (teratojen)', due: k.aylikDue, kaynak: 'derm_izotretinoin' })
    }
    await gununNotunaEkle(sb, user.id, hasta.id, `İzotretinoin başlandı (hekim)${kadin ? ' — negatif β-hCG + korunma onamı doğrulandı; aylık β-hCG görevi' : ''}`)
    return NextResponse.json({ ok: true, kapisi: k })
  }
  if (adim === 'pediatrik') {
    const s = PEDIATRIK_SABLONLAR[String(b.sablon || '') as keyof typeof PEDIATRIK_SABLONLAR]
    if (!s) return NextResponse.json({ error: 'Şablon geçersiz' }, { status: 400 })
    const { data: bebek } = await sb.from('bebek_kartlari').select('id, gorevler').eq('bebek_patient_id', hasta.id).maybeSingle()
    await gorevEkle(sb, user.id, hasta.id, [{ kod: `ped_${String(b.sablon)}`, ad: s.gorev, due: null, kaynak: 'pediatrik' }])
    if (bebek) await sb.from('bebek_kartlari').update({ gorevler: [...(bebek.gorevler || []), { kod: `derm_${String(b.sablon)}`, ad: `Dermatoloji: ${s.ad} — ${s.gorev}`, sahip: 'pediatri', tamam: false }] }).eq('id', bebek.id)
    await gununNotunaEkle(sb, user.id, hasta.id, `Pediatrik derm şablonu: ${s.ad} — ${s.maddeler.join('; ')}`)
    return NextResponse.json({ ok: true, bebekBagli: !!bebek })
  }
  return NextResponse.json({ error: 'Geçersiz adım' }, { status: 400 })
}

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const patientId = req.nextUrl.searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId gerekli' }, { status: 400 })
  if (!(await hastaSahibiMi(sb, user.id, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })
  const { data: hd } = await sb.from('hasta_derm').select('id').eq('patient_id', patientId).eq('doctor_id', user.id).maybeSingle()
  const lezQ = hd ? sb.from('derm_lezyonlar').select('id, region, morphology, body_map_node, size_mm, abcde, dermoskop_notu, degerlendirme, resmi_tani, acil, patoloji_sonuc, created_at').eq('hasta_derm_id', hd.id).order('created_at', { ascending: false }) : null
  const [lez, isl, ilac, gor, onam, bebek] = await Promise.all([
    lezQ ?? Promise.resolve({ data: [] as unknown[] }),
    sb.from('derm_islemler').select('*').eq('patient_id', patientId).eq('doctor_id', user.id).order('tarih', { ascending: false }).limit(20),
    sb.from('derm_ilac_guvenlik').select('*').eq('patient_id', patientId).eq('doctor_id', user.id).order('created_at', { ascending: false }).limit(10),
    sb.from('derm_gorevleri').select('*').eq('patient_id', patientId).eq('doctor_id', user.id).eq('durum', 'acik').order('due'),
    sb.from('onamlar').select('id, sablon_kodu, sablon_adi, hasta_onayladi, onay_at').eq('patient_id', patientId).eq('doctor_id', user.id).like('sablon_kodu', 'derm_%').order('created_at', { ascending: false }).limit(20),
    sb.from('bebek_kartlari').select('id').eq('bebek_patient_id', patientId).maybeSingle(),
  ])
  return NextResponse.json({ lezyonlar: lez.data || [], islemler: isl.data || [], ilacGuvenlik: ilac.data || [], gorevler: gor.data || [], onamlar: onam.data || [], bebekBagli: !!bebek.data, kutuphane: { islemler: Object.entries(ISLEM_SABLONLARI).map(([k, v]) => ({ kod: k, ad: v.ad, notAlanlari: v.notAlanlari, onamKodu: v.onamKodu })), onamlar: DERM_ONAMLAR.map((o) => ({ kod: o.kod, ad: o.ad })), taniSecenekleri: RESMI_TANI_SECENEKLERI, pediatrik: Object.entries(PEDIATRIK_SABLONLAR).map(([k, v]) => ({ kod: k, ad: v.ad, maddeler: v.maddeler })) } })
}
