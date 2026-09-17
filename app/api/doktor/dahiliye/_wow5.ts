/**
 * NOTYA-DAH-WOW-NEXT — 7 kart sunucu katmanı: Polifarmasi (C1) · Hedef kartı + eğitim yaprakları (C2) · Sigara (C3) · Vit D/B12 (C4)
 * · e-Nabız geçmiş içe aktarma durumu (C5; yükleme/çıkarım belgeler/lab hattında) · Gut (C6) · Osteoporoz DXA (C7).
 * GET: wow5Verisi. POST adım: polifarmasi_karar | polifarmasi_nota | hedefkart | sigara | vitamin | gut | osteo | osteo_belge | kart_nota.
 * Kurallar: lab YALNIZ onaylı satır (labSerisi); hasta_ilaclar ASLA değiştirilmez; nota yalnız hekim adımıyla ve kilitli planla yazılır.
 */
import { NextResponse } from 'next/server'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { aktifGebelikDurumu } from '@/lib/clinical/gebelikDurum'
import { polifarmasiDegerlendir, kararDogrula, OVERRIDE_MIN, type PoliGirdi } from '@/specialties/dahiliye/engines/polifarmasi'
import { hedefKarti, yazdirHtml, EGITIM_YAPRAKLARI, type HedefKartGirdi } from '@/specialties/dahiliye/engines/hedefKart'
import { sigaraDegerlendir, BES_A, EVRE_AD, type DegisimEvresi } from '@/specialties/dahiliye/engines/sigara'
import { vitaminDegerlendir } from '@/specialties/dahiliye/engines/vitamin'
import { gutDegerlendir, DIYET_ONERILERI } from '@/specialties/dahiliye/engines/gut'
import { osteoDegerlendir, tSkoruCikar, BOLGE_AD, type OsteoRiskler, type DxaBolge } from '@/specialties/dahiliye/engines/osteoporoz'
import { kilitDegeri, type HekimKilit } from '@/specialties/dahiliye/engines/kart'
import { type Sb, type LabSatir, son, sonDeger, gorevEkle, hastaAdi, hekimKimlik } from './_ortak'

type Hasta = { id: string; yas: number | null; kadin: boolean }
type Ilac = { ilac_adi: string; etken_madde: string | null; baslangic_tarihi: string | null; aktif: boolean | null }
const RISK_BOS: OsteoRiskler = { kirilganlikKirigi: false, vertebraKalcaKirigi: false, glukokortikoid3Ay: false, erkenMenopoz: false, romatoidArtrit: false, sigara: false, alkol3Unite: false, ebeveynKalcaKirigi: false, aromatazInhibitoruAdt: false }
const KART_NOTA: Record<string, string> = { sigara: 'Sigara bırakma planı', vitamin: 'Vit D / B12 planı', gut: 'Gut / ürik asit planı', osteo: 'Osteoporoz planı', polifarmasi: 'Polifarmasi planı' }

async function baglam(sb: Sb, hasta: Hasta) {
  const [kvr, dm, ht, lipid, hf, ak, pulm, ckd, dusme, gebe, kilitQ, sigara, gut, osteo, vit, kararlar, kartlar, belgeler] = await Promise.all([
    sb.from('dahiliye_kvr').select('askvh, sigara').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_dm').select('hedef_hba1c').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_ht').select('sbp, dbp, tarih, degerlendirme').eq('patient_id', hasta.id).order('tarih', { ascending: false }).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    sb.from('dahiliye_lipid').select('hedef_ldl').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_hf').select('ef').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_antikoagulan').select('endikasyon').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_pulm').select('tani').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_ckd').select('uacr_manual').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_taramalar').select('pozitif').eq('patient_id', hasta.id).eq('tip', 'dusme').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    sb.from('gebelikler').select('durum').eq('patient_id', hasta.id),
    sb.from('dahiliye_kart_kilitleri').select('kart, alan, deger, created_at').eq('patient_id', hasta.id).in('kart', ['ht', 'dm', 'kvr', 'polifarmasi', 'hedef', 'sigara', 'vitamin', 'gut', 'osteo']).order('created_at', { ascending: false }).limit(200),
    sb.from('dahiliye_sigara').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_gut').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_osteoporoz').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_vitamin').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_polifarmasi_kararlari').select('kural_kod, karar, gerekce, baslik, engelleyici, created_at').eq('patient_id', hasta.id).order('created_at', { ascending: false }).limit(80),
    sb.from('dahiliye_hedef_kartlari').select('id, created_at').eq('patient_id', hasta.id).order('created_at', { ascending: false }).limit(3),
    sb.from('belge_analizleri').select('id, sonuc, hekim_ozet, onaylandi_at').eq('patient_id', hasta.id).not('onaylandi_at', 'is', null).neq('modality_final', 'lab').order('onaylandi_at', { ascending: false }).limit(20),
  ])
  return { kvr: kvr.data, dm: dm.data, ht: ht.data, lipid: lipid.data, hf: hf.data, ak: ak.data, pulm: pulm.data, ckd: ckd.data, dusmePozitif: !!dusme.data?.pozitif, gebe: (gebe.data || []).some((g) => aktifGebelikDurumu(g.durum)), kilitler: (kilitQ.data || []) as HekimKilit[], sigara: sigara.data, gut: gut.data, osteo: osteo.data, vit: vit.data, kararlar: kararlar.data || [], kartlar: kartlar.data || [], belgeler: belgeler.data || [] }
}
type Baglam = Awaited<ReturnType<typeof baglam>>

function hesapla(hasta: Hasta, labs: Map<string, LabSatir[]>, ilaclar: Ilac[], c: Baglam, T: string) {
  const aktif = ilaclar.filter((i) => i.aktif !== false)
  const metinler = aktif.map((i) => `${i.ilac_adi} ${i.etken_madde || ''}`)
  const var_ = (re: RegExp) => metinler.some((x) => re.test(x.toLocaleLowerCase('tr-TR')))
  const eGFR = sonDeger(labs, 'eGFR'), uacr = sonDeger(labs, 'UACR') ?? (c.ckd?.uacr_manual != null ? Number(c.ckd.uacr_manual) : null)
  const oR = { ...RISK_BOS, ...((c.osteo?.riskler || {}) as Partial<OsteoRiskler>) }
  const tSkorlari = { lomber: c.osteo?.t_lomber != null ? Number(c.osteo.t_lomber) : null, femurBoyun: c.osteo?.t_femur_boyun != null ? Number(c.osteo.t_femur_boyun) : null, totalKalca: c.osteo?.t_total_kalca != null ? Number(c.osteo.t_total_kalca) : null }
  const osteo = osteoDegerlendir({ yas: hasta.yas, kadin: hasta.kadin, vki: null, tSkorlari, dxaTarihi: c.osteo?.dxa_tarihi || null, riskler: { ...oR, sigara: oR.sigara || !!c.kvr?.sigara || c.sigara?.durum === 'iciyor' }, dusmePozitif: c.dusmePozitif, eGFR, ca: sonDeger(labs, 'Ca'), vitD: sonDeger(labs, 'VitD'), ilacMetinleri: metinler, bugun: T })
  const osteoTaniKilit = kilitDegeri<string>(c.kilitler, 'osteo', 'tani')
  const poliGirdi: PoliGirdi = { yas: hasta.yas, ilaclar: aktif.map((i) => ({ ad: i.ilac_adi, etken: i.etken_madde, baslangic: i.baslangic_tarihi })), eGFR, k: sonDeger(labs, 'K'), na: sonDeger(labs, 'Na'), dusmePozitif: c.dusmePozitif, bugun: T,
    tanilar: { askvh: !!c.kvr?.askvh, af: c.ak?.endikasyon === 'af', hf: c.hf != null, dm: c.dm != null, koah: c.pulm?.tani === 'koah', osteoporoz: /osteoporoz/i.test(osteoTaniKilit || '') || osteo.sinif === 'osteoporoz' || osteo.sinif === 'agir_osteoporoz' || osteo.klinikOsteoporoz, ckdAlbuminuri: uacr != null && uacr > 30 } }
  const poli = polifarmasiDegerlendir(poliGirdi)
  const sonKarar = (kod: string) => c.kararlar.find((k) => k.kural_kod === kod) || null
  const hb = son(labs, 'HbA1c'), ldl = son(labs, 'LDL')
  const htHedefTaslak = (c.ht?.degerlendirme as { hedef?: { hedefSbp?: number[]; hedefDbp?: number[] | null } } | null)?.hedef
  const hedefGirdi: HedefKartGirdi = {
    kbHedef: kilitDegeri<{ sbpUst: number; dbpUst: number | null }>(c.kilitler, 'ht', 'hedef'),
    hba1cHedef: kilitDegeri<number>(c.kilitler, 'dm', 'hedef_hba1c') ?? (c.dm?.hedef_hba1c != null ? Number(c.dm.hedef_hba1c) : null),
    ldlHedef: kilitDegeri<number>(c.kilitler, 'kvr', 'hedef_ldl') ?? (c.lipid?.hedef_ldl != null ? Number(c.lipid.hedef_ldl) : null),
    kvrKategori: kilitDegeri<string>(c.kilitler, 'kvr', 'kategori'), ht: c.ht != null, dm: c.dm != null, statin: var_(/atorvastatin|rosuvastatin|simvastatin|pravastatin|pitavastatin|fluvastatin|lovastatin/),
    son: { kb: c.ht ? { sbp: Number(c.ht.sbp), dbp: Number(c.ht.dbp), tarih: String(c.ht.tarih) } : null, hba1c: hb?.kanonik_deger != null ? { deger: hb.kanonik_deger, tarih: hb.numune_tarihi } : null, ldl: ldl?.kanonik_deger != null ? { deger: ldl.kanonik_deger, tarih: ldl.numune_tarihi } : null },
  }
  const sg = c.sigara
  const sigara = sigaraDegerlendir({ durum: (sg?.durum as 'iciyor' | 'birakti' | 'hic' | null) ?? (c.kvr?.sigara ? 'iciyor' : null), gunlukAdet: sg?.gunluk_adet ?? null, yil: sg?.yil ?? null, ilkSigaraDk: sg?.ilk_sigara_dk ?? null, evre: (sg?.evre as DegisimEvresi | null) ?? null, birakmaTarihi: sg?.birakma_tarihi ?? null, eGFR, nobetOyku: !!sg?.nobet_oyku, yemeBozuklugu: !!sg?.yeme_bozuklugu, gebe: c.gebe, psikiyatrikOyku: !!sg?.psikiyatrik_oyku, ilacMetinleri: metinler, koah: c.pulm?.tani === 'koah', askvh: !!c.kvr?.askvh, dm: c.dm != null, bugun: T })
  const vitamin = vitaminDegerlendir({ vitD: sonDeger(labs, 'VitD'), vitDTarih: son(labs, 'VitD')?.numune_tarihi || null, b12: sonDeger(labs, 'B12'), b12Tarih: son(labs, 'B12')?.numune_tarihi || null, folat: sonDeger(labs, 'Folate'), hb: sonDeger(labs, 'Hb'), mcv: sonDeger(labs, 'MCV'), ca: sonDeger(labs, 'Ca'), kadin: hasta.kadin, ilacMetinleri: metinler, noroSemptom: !!c.vit?.noro_semptom, malabsorpsiyon: !!c.vit?.malabsorpsiyon, vegan: !!c.vit?.vegan, bugun: T })
  const gt = c.gut
  const gut = gutDegerlendir({ urik: sonDeger(labs, 'Uric'), urikTarih: son(labs, 'Uric')?.numune_tarihi || null, eGFR, atakAktif: !!gt?.atak_aktif, ates: !!gt?.ates, kristalKanit: !!gt?.kristal_kanit, atakSayisi12Ay: Number(gt?.atak_sayisi_12ay || 0), tofus: !!gt?.tofus, radyografikHasar: !!gt?.radyografik_hasar, urolitiyazis: !!gt?.urolitiyazis, hf: c.hf != null, dm: c.dm != null, ilacMetinleri: metinler, bugun: T })
  // DXA T-skoru önerisi: yalnız hekim onaylı (onaylandi_at) belge analizlerinden; hekim "Belgeden al" demeden kaydedilmez.
  let dxaOneri: { analizId: string; tarih: string; t: Partial<Record<DxaBolge, number>> } | null = null
  for (const a of c.belgeler) {
    const so = (a.sonuc || {}) as { ozet?: string; bulgular?: string[] }
    const t = tSkoruCikar([a.hekim_ozet || '', so.ozet || '', ...(so.bulgular || [])].join('\n'))
    if (Object.keys(t).length) { dxaOneri = { analizId: String(a.id), tarih: String(a.onaylandi_at).slice(0, 10), t }; break }
  }
  return { poli, poliKararlar: poli.oneriler.map((o) => ({ kod: o.kod, karar: sonKarar(o.kod) })), hedef: hedefKarti(hedefGirdi), hedefGirdi, htHedefTaslak: htHedefTaslak?.hedefSbp ? { sbpUst: htHedefTaslak.hedefSbp[1], dbpUst: htHedefTaslak.hedefDbp?.[1] ?? null } : null, sigara, vitamin, gut, osteo, dxaOneri, tSkorlari }
}

export async function wow5Verisi(sb: Sb, hasta: Hasta, labs: Map<string, LabSatir[]>, ilaclar: Ilac[], T: string) {
  const c = await baglam(sb, hasta)
  const h = hesapla(hasta, labs, ilaclar, c, T)
  const kilit = (kart: 'polifarmasi' | 'hedef' | 'sigara' | 'vitamin' | 'gut' | 'osteo', alan: string) => kilitDegeri<string>(c.kilitler, kart, alan)
  const { data: enabiz } = await sb.from('lab_paneller').select('id, belge_id, numune_tarihi, durum, kimlik_uyari, created_at').eq('patient_id', hasta.id).eq('panel_type', 'enabiz_gecmis').order('created_at', { ascending: false }).limit(5)
  return {
    polifarmasi: { sonuc: h.poli, kararlar: h.poliKararlar, overrideMin: OVERRIDE_MIN, kilitPlan: kilit('polifarmasi', 'plan') },
    hedef: { sonuc: h.hedef, htHedefTaslak: h.htHedefTaslak, kbHedefKilit: h.hedefGirdi.kbHedef, yapraklar: Object.values(EGITIM_YAPRAKLARI).map((y) => ({ kod: y.kod, baslik: y.baslik })), sonKart: c.kartlar[0] || null },
    sigara: { kayit: c.sigara, sonuc: h.sigara, besA: BES_A, evreler: EVRE_AD, kilitPlan: kilit('sigara', 'plan') },
    vitamin: { kayit: c.vit, sonuc: h.vitamin, vitD: son(labs, 'VitD'), b12: son(labs, 'B12'), kilitPlan: kilit('vitamin', 'plan') },
    enabiz: { paneller: enabiz || [] },
    gut: { kayit: c.gut, sonuc: h.gut, urik: son(labs, 'Uric'), diyet: DIYET_ONERILERI, kilitTani: kilit('gut', 'tani'), kilitPlan: kilit('gut', 'plan') },
    osteo: { kayit: c.osteo, sonuc: h.osteo, tSkorlari: h.tSkorlari, dxaOneri: h.dxaOneri, bolgeAd: BOLGE_AD, kilitTani: kilit('osteo', 'tani'), kilitPlan: kilit('osteo', 'plan') },
  }
}
export type Wow5Veri = Awaited<ReturnType<typeof wow5Verisi>>

const num = (v: unknown) => (v == null || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null)
const tarih = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)

export async function wow5Post(adim: string, b: Record<string, unknown>, sb: Sb, user: { id: string; user_metadata?: Record<string, unknown> }, hasta: Hasta, T: string, labsYukle: () => Promise<Map<string, LabSatir[]>>): Promise<NextResponse | null> {
  const ADIMLAR = ['polifarmasi_karar', 'polifarmasi_nota', 'hedefkart', 'sigara', 'vitamin', 'gut', 'osteo', 'osteo_belge', 'kart_nota']
  if (!ADIMLAR.includes(adim)) return null
  const userId = user.id
  const hazirla = async () => { const [labs, ilaclar, c] = await Promise.all([labsYukle(), sb.from('hasta_ilaclar').select('ilac_adi, etken_madde, baslangic_tarihi, aktif').eq('patient_id', hasta.id).eq('aktif', true), baglam(sb, hasta)]); return { labs, c, h: hesapla(hasta, labs, (ilaclar.data || []) as Ilac[], c, T) } }

  if (adim === 'polifarmasi_karar') {
    // Öneri sunucuda yeniden hesaplanır (istemciye güvenilmez). hasta_ilaclar'a DOKUNULMAZ — karar yalnız kayıt + gerekçe.
    const { h } = await hazirla()
    const oneri = h.poli.oneriler.find((o) => o.kod === String(b.kuralKod || ''))
    if (!oneri) return NextResponse.json({ error: 'Öneri güncel değil (ilaç listesi / lab değişmiş olabilir) — sayfayı yenileyin' }, { status: 409 })
    const karar = b.karar === 'override' ? 'override' : 'kabul'
    const gerekce = String(b.gerekce || '').slice(0, 1000)
    const hata = kararDogrula(oneri, karar, gerekce); if (hata) return NextResponse.json({ error: hata }, { status: 409 })
    const { error } = await sb.from('dahiliye_polifarmasi_kararlari').insert({ patient_id: hasta.id, doctor_id: userId, kural_kod: oneri.kod, siddet: oneri.siddet, engelleyici: oneri.engelleyici, karar, gerekce: gerekce || null, ilaclar: oneri.ilaclar, baslik: oneri.baslik })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }
  if (adim === 'polifarmasi_nota') {
    const { h, c } = await hazirla()
    const satirlar = h.poli.oneriler.map((o) => ({ o, k: c.kararlar.find((x) => x.kural_kod === o.kod) })).filter((x) => x.k)
    if (!satirlar.length) return NextResponse.json({ error: 'Önce öneriler için hekim kararı verin (kabul / gerekçeli override)' }, { status: 409 })
    const metin = `Yaşlı polifarmasi gözden geçirme (≥65 yaş, STOPP/START v3 esinli kural taslağı; hekim kararları): ${satirlar.map(({ o, k }) => `${o.baslik} → ${k!.karar === 'kabul' ? 'hekim kabul etti' : `hekim uygulamadı (gerekçe: ${k!.gerekce || '—'})`}`).join('; ')}. İlaç değişikliği yalnız hekim reçetesiyle; ilaç listesi otomatik değiştirilmedi.`
    const r = await gununNotunaEkle(sb, userId, hasta.id, metin)
    return r.eklendi ? NextResponse.json({ ok: true, notId: r.notId }) : NextResponse.json({ error: `Nota eklenemedi: ${r.sebep || ''}` }, { status: 409 })
  }
  if (adim === 'hedefkart') {
    // Hekim onayı = bu adım: kart anlık görüntüsü kaydedilir + kilit (hedef/kart); yazdırma HTML'i ancak bundan sonra döner.
    const { h } = await hazirla()
    const secili = (Array.isArray(b.yapraklar) ? b.yapraklar.map(String) : h.hedef.yapraklar).filter((k): k is keyof typeof EGITIM_YAPRAKLARI => k in EGITIM_YAPRAKLARI)
    if (!h.hedef.satirlar.length && !secili.length) return NextResponse.json({ error: 'Kartta hedef yok — önce HT/DM/KVR hedeflerini kilitleyin' }, { status: 400 })
    const { data: kart, error } = await sb.from('dahiliye_hedef_kartlari').insert({ patient_id: hasta.id, doctor_id: userId, satirlar: h.hedef.satirlar, yapraklar: secili }).select('id').single()
    if (error || !kart) return NextResponse.json({ error: error?.message || 'Kaydedilemedi' }, { status: 500 })
    await sb.from('dahiliye_kart_kilitleri').insert({ patient_id: hasta.id, doctor_id: userId, kart: 'hedef', alan: 'kart', deger: { kartId: kart.id, eksikKilit: h.hedef.eksikKilit }, kaynak: 'hedefkart' })
    const [ad, hekim] = await Promise.all([hastaAdi(sb, userId, hasta.id), hekimKimlik(sb, user)])
    if (b.notaEkle) await gununNotunaEkle(sb, userId, hasta.id, `Hasta hedef kartı (hekim onaylı) ve eğitim yaprakları verildi: ${[...h.hedef.satirlar.filter((s) => s.durum !== 'hekim_belirleyecek').map((s) => `${s.ad} ${s.hedef}`), ...secili.map((k) => EGITIM_YAPRAKLARI[k].baslik)].join('; ')}.`)
    return NextResponse.json({ ok: true, kartId: kart.id, eksikKilit: h.hedef.eksikKilit, html: yazdirHtml(h.hedef, secili, { hastaAdi: ad, hekimAdi: hekim.adSoyad || 'Hekim', tarih: new Date(`${T}T12:00:00Z`).toLocaleDateString('tr-TR') }) })
  }
  if (adim === 'sigara') {
    const durum = ['iciyor', 'birakti', 'hic'].includes(String(b.durum)) ? String(b.durum) : null
    const evre = b.evre && String(b.evre) in EVRE_AD ? String(b.evre) : null
    const { error } = await sb.from('dahiliye_sigara').upsert({ patient_id: hasta.id, doctor_id: userId, durum, gunluk_adet: num(b.gunlukAdet), yil: num(b.yil), ilk_sigara_dk: num(b.ilkSigaraDk), evre, birakma_tarihi: tarih(b.birakmaTarihi), nobet_oyku: !!b.nobetOyku, yeme_bozuklugu: !!b.yemeBozuklugu, psikiyatrik_oyku: !!b.psikiyatrikOyku, danisma: Array.isArray(b.danisma) ? b.danisma.map(String).filter((k) => BES_A.some((x) => x.kod === k)) : null, updated_at: new Date().toISOString() }, { onConflict: 'patient_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (durum === 'iciyor' || durum === 'birakti') await sb.from('dahiliye_kvr').upsert({ patient_id: hasta.id, doctor_id: userId, sigara: durum === 'iciyor', updated_at: new Date().toISOString() }, { onConflict: 'patient_id' })
    if (b.gorevAc) { const { h } = await hazirla(); await gorevEkle(sb, userId, hasta.id, h.sigara.gorevler.map((g) => ({ ...g, kaynak: 'sigara' }))); return NextResponse.json({ ok: true, gorev: h.sigara.gorevler.length }) }
    return NextResponse.json({ ok: true })
  }
  if (adim === 'vitamin') {
    const { error } = await sb.from('dahiliye_vitamin').upsert({ patient_id: hasta.id, doctor_id: userId, noro_semptom: !!b.noroSemptom, malabsorpsiyon: !!b.malabsorpsiyon, vegan: !!b.vegan, updated_at: new Date().toISOString() }, { onConflict: 'patient_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (b.gorevAc) { const { h } = await hazirla(); await gorevEkle(sb, userId, hasta.id, h.vitamin.gorevler.map((g) => ({ ...g, kaynak: 'vitamin' }))); return NextResponse.json({ ok: true, gorev: h.vitamin.gorevler.length }) }
    return NextResponse.json({ ok: true })
  }
  if (adim === 'gut') {
    const { error } = await sb.from('dahiliye_gut').upsert({ patient_id: hasta.id, doctor_id: userId, atak_aktif: !!b.atakAktif, ates: !!b.ates, kristal_kanit: !!b.kristalKanit, atak_sayisi_12ay: Math.max(0, Math.min(52, Math.round(num(b.atakSayisi12Ay) ?? 0))), tofus: !!b.tofus, radyografik_hasar: !!b.radyografikHasar, urolitiyazis: !!b.urolitiyazis, updated_at: new Date().toISOString() }, { onConflict: 'patient_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const { h } = await hazirla()
    if (b.gorevAc) await gorevEkle(sb, userId, hasta.id, h.gut.gorevler.map((g) => ({ ...g, kaynak: 'gut' })))
    return NextResponse.json({ ok: true, kirmizi: h.gut.kirmizi })
  }
  if (adim === 'osteo' || adim === 'osteo_belge') {
    const satir: Record<string, unknown> = { patient_id: hasta.id, doctor_id: userId, updated_at: new Date().toISOString() }
    if (adim === 'osteo_belge') {
      // T-skoru yalnız hekim onaylı belge analizinden, sunucuda yeniden çıkarılır.
      const { data: a } = await sb.from('belge_analizleri').select('id, sonuc, hekim_ozet, onaylandi_at').eq('id', String(b.analizId || '')).eq('patient_id', hasta.id).eq('doctor_id', userId).not('onaylandi_at', 'is', null).maybeSingle()
      if (!a) return NextResponse.json({ error: 'Onaylı DXA belgesi bulunamadı' }, { status: 404 })
      const so = (a.sonuc || {}) as { ozet?: string; bulgular?: string[] }
      const t = tSkoruCikar([a.hekim_ozet || '', so.ozet || '', ...(so.bulgular || [])].join('\n'))
      if (!Object.keys(t).length) return NextResponse.json({ error: 'Belgede T-skoru bulunamadı' }, { status: 422 })
      Object.assign(satir, { t_lomber: t.lomber ?? null, t_femur_boyun: t.femurBoyun ?? null, t_total_kalca: t.totalKalca ?? null, t_kaynak: 'belge', belge_analiz_id: a.id, dxa_tarihi: tarih(b.dxaTarihi) || String(a.onaylandi_at).slice(0, 10) })
    } else {
      const tt = (v: unknown) => { const n = num(v); return n != null && n >= -6 && n <= 4 ? n : null }
      if (b.tLomber !== undefined || b.tFemurBoyun !== undefined || b.tTotalKalca !== undefined) Object.assign(satir, { t_lomber: tt(b.tLomber), t_femur_boyun: tt(b.tFemurBoyun), t_total_kalca: tt(b.tTotalKalca), t_kaynak: 'hekim', belge_analiz_id: null })
      if (b.dxaTarihi !== undefined) satir.dxa_tarihi = tarih(b.dxaTarihi)
      if (b.riskler && typeof b.riskler === 'object') satir.riskler = Object.fromEntries(Object.keys(RISK_BOS).map((k) => [k, !!(b.riskler as Record<string, unknown>)[k]]))
    }
    const { error } = await sb.from('dahiliye_osteoporoz').upsert(satir, { onConflict: 'patient_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (b.gorevAc) { const { h } = await hazirla(); await gorevEkle(sb, userId, hasta.id, h.osteo.gorevler.map((g) => ({ ...g, kaynak: 'osteo' }))) }
    return NextResponse.json({ ok: true })
  }
  if (adim === 'kart_nota') {
    // Nota yalnız hekimin KİLİTLEDİĞİ plan yazılır (kilitsiz taslak nota gitmez).
    const kart = String(b.kart || '')
    if (!KART_NOTA[kart]) return NextResponse.json({ error: 'Kart geçersiz' }, { status: 400 })
    const { data: k } = await sb.from('dahiliye_kart_kilitleri').select('deger, created_at').eq('patient_id', hasta.id).eq('kart', kart).eq('alan', 'plan').order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (!k?.deger) return NextResponse.json({ error: 'Önce planı kilitleyin (hekim)' }, { status: 409 })
    const r = await gununNotunaEkle(sb, userId, hasta.id, `${KART_NOTA[kart]} (hekim kilitli): ${String(k.deger).slice(0, 1500)}`)
    return r.eklendi ? NextResponse.json({ ok: true, notId: r.notId }) : NextResponse.json({ error: `Nota eklenemedi: ${r.sebep || ''}` }, { status: 409 })
  }
  return null
}
