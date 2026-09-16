/**
 * NOTYA-JINE-01 — Office gynecology spine API (kadın-doğum, non-pregnant home).
 * GET ?patientId= → due list (engine), serviks history, cybh, pcos, lezyonlar, kontrasepsiyon, hrt, açık görevler, vizitler
 * POST adim (every write is a doctor action; AI drafts only):
 *   kadin_sagligi {patientId, alanlar}                      → screening dates (son_pap/son_hpv/son_mamografi/son_dxa/son_kolorektal/histerektomi/hrt…)
 *   ofis_vizit {patientId, soap, muayeneFormunaEkle?}      → jine_vizitler SOAP (clinic-fit jsonb) + kontrol görevi
 *   vizit {patientId, tur, alanlar}                          → jine_vizitler (+ kırmızı bayrak görevleri)
 *   serviks {patientId, tarih, pap, hpv, belgeId?}           → taslak aksiyon (engine) + kolposkopi görevi if needed
 *   serviks_onayla {kayitId, resmiPlan, sonrakiDue?}         → doctor locks the plan
 *   kolposkopi {kayitId, veri}
 *   cybh {patientId, sikayet, etkenler, ilkGenitalUlser, hsv?, labBelgeId?} → ön tanı + partner rule + görevler
 *   pcos {patientId, kriterler, dislama, metabolik?, amenoreGun?, hekimTanisi?} → Rotterdam evaluation (no lock)
 *   lezyon {patientId, tur, boyutMm, figoTip?, yer?, semptom?, sonrakiUs?, cerrahiNotu?}
 *   kontrasepsiyon {patientId, yontem, baslangic, stiTaramaOnaylandi} → RİA schedule + görevler; deactivates previous
 *   hrt {patientId, semptomSkoru?, onKontrol, hrtBasladi?, hrtBaslangic?, rejim?} → pre-check; start blocked on hard contraindication
 *   gorev {gorevId, durum}
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { decrypt } from '@/lib/security/encryption'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { aktifGebelikDurumu } from '@/lib/clinical/gebelikDurum'
import { bhcgSeriesTrend } from '@/specialties/kadin-dogum/protocols/gted-ektopik'
import { aubDegerlendir, pmpKapatilabilir, kokDegerlendir, endometriozisDegerlendir, rmDegerlendir, egkDegerlendir, REF_ACIKLAMA, type AubGirdi, type KokGirdi, type EndoGirdi, type RmGirdi, type EgkGirdi } from '@/specialties/kadin-dogum/engines/jinekoloji-v2'
import { dueHesapla, serviksAksiyonu, partnerTedaviGerekli, ilkUlserKontrolListesi, akintiOnTani, hsvGebelikGorevleri, pcosDegerlendir, riaTakvimi, hrtOnDegerlendirme, HRT_YILLIK_GOREVLER, INFERTILITE_ADIM1, kirmiziBayraklar, YILLIK_KONTROL_ALANLARI, CYBH_ETKENLERI, type Etken, type PapSonuc, type HpvSonuc, type HsvKarti, type HrtOnKontrol } from '@/specialties/kadin-dogum/engines/jinekoloji-spine'
import { flattenSoapAlanlar, jineSticky, normalizeSoap, ofisVizitOzet, soapFromVizitRow, taslakBugunkuVizit } from '@/specialties/kadin-dogum/engines/jine-ofis-vizit'
import { cybhTedaviPlani, hsvSupresyon36hf } from '@/specialties/kadin-dogum/engines/cybh-tedavi'
import { acilKontrasepsiyon, yontemMec, postpartumKontrasepsiyonBaslangic, type YontemKod } from '@/specialties/kadin-dogum/engines/kontrasepsiyon-mec'
import { menorajiTedaviBasamagi, antiDKapaliDongu, usgRaporTaslagi, eDogumSihirbaz, csSavunmaPaketi, paketDurum, VARSAYILAN_PAKET, infertiliteSevkPaketi, urojinePopqHizli, onkolojiIotaTriyaj, siddetTarama, kokYillikGuvenlik, type AntiDTetik, type UsgSablonKod } from '@/specialties/kadin-dogum/engines/kd-klinik-wow'
import { enabizUsgRapor } from '@/lib/enabiz/paket'
import { mapEDogumWizardToEnabizPaket } from '@/specialties/kadin-dogum/protocols/legal-forms'
export const dynamic = 'force-dynamic'
const bugun = () => new Date().toISOString().slice(0, 10)
const ekleAy = (t: string, ay: number) => { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }
const kisaKod = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/[^a-z0-9]+/g, '_').slice(0, 24)

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never
async function hastaDogrula(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('patients').select('id, dob_encrypted').eq('id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (!data) return null
  let dob: string | null = null; try { dob = data.dob_encrypted ? decrypt(String(data.dob_encrypted)).slice(0, 10) : null } catch { dob = null }
  return { id: data.id, dob }
}
async function aktifGebeMi(sb: Sb, patientId: string): Promise<boolean> {
  const { data } = await sb.from('gebelikler').select('durum').eq('patient_id', patientId)
  return (data || []).some((g) => aktifGebelikDurumu(g.durum))
}
async function gorevEkle(sb: Sb, doctorId: string, patientId: string, gorevler: { kod: string; ad: string; due?: string | null; kaynak: string }[]) {
  for (const g of gorevler) {
    const { data: var_ } = await sb.from('jine_gorevleri').select('id').eq('patient_id', patientId).eq('kod', g.kod).eq('durum', 'acik').maybeSingle()
    if (!var_) await sb.from('jine_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: g.kod, ad: g.ad, due: g.due || null, kaynak: g.kaynak })
  }
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b?.adim) return NextResponse.json({ error: 'adim gerekli' }, { status: 400 })
  const adim = String(b.adim)

  if (adim === 'gorev') {
    const durum = String(b.durum || ''); if (!['acik', 'tamam', 'iptal'].includes(durum)) return NextResponse.json({ error: 'durum geçersiz' }, { status: 400 })
    const { error } = await sb.from('jine_gorevleri').update({ durum, tamam_at: durum === 'tamam' ? new Date().toISOString() : null }).eq('id', String(b.gorevId || '')).eq('doctor_id', user.id)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }
  if (adim === 'serviks_onayla') {
    const { data: k } = await sb.from('serviks_taramalari').select('id, patient_id').eq('id', String(b.kayitId || '')).eq('doctor_id', user.id).maybeSingle()
    if (!k) return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 })
    const resmi = String(b.resmiPlan || '').trim(); if (!resmi) return NextResponse.json({ error: 'Resmi planı hekim yazar' }, { status: 400 })
    const { error } = await sb.from('serviks_taramalari').update({ resmi_plan: resmi, sonraki_due: b.sonrakiDue ? String(b.sonrakiDue).slice(0, 10) : null, hekim_onayladi: true, onay_at: new Date().toISOString() }).eq('id', k.id)
    if (error) return NextResponse.json({ error: 'Yazılamadı' }, { status: 500 })
    await gununNotunaEkle(sb, user.id, k.patient_id, `Serviks tarama planı (hekim): ${resmi}${b.sonrakiDue ? ` — sonraki: ${String(b.sonrakiDue).slice(0, 10)}` : ''}`)
    return NextResponse.json({ ok: true })
  }
  if (adim === 'kolposkopi') {
    const { error } = await sb.from('serviks_taramalari').update({ kolposkopi: (b.veri || {}) as object }).eq('id', String(b.kayitId || '')).eq('doctor_id', user.id)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }

  const hasta = await hastaDogrula(sb, user.id, String(b.patientId || ''))
  if (!hasta) return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })
  const yasHesap = () => { if (!hasta.dob) return null; const a = new Date(), d = new Date(hasta.dob); let y = a.getFullYear() - d.getFullYear(); if (a.getMonth() < d.getMonth() || (a.getMonth() === d.getMonth() && a.getDate() < d.getDate())) y--; return y }

  if (adim === 'kadin_sagligi') {
    const a = (b.alanlar || {}) as Record<string, unknown>
    const izinli = ['son_serviks_tarama', 'son_pap', 'son_hpv', 'son_mamografi', 'son_dxa', 'son_kolorektal', 'histerektomi', 'hrt', 'hrt_baslangic', 'kontrasepsiyon_yontemi', 'menopoz_durumu', 'menopoz_yasi', 'notlar']
    const guncel: Record<string, unknown> = { patient_id: hasta.id, doctor_id: user.id, updated_at: new Date().toISOString() }
    for (const k of izinli) if (k in a) guncel[k] = a[k] === '' ? null : a[k]
    const { error } = await sb.from('kadin_sagligi').upsert(guncel, { onConflict: 'patient_id' })
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }
  if (adim === 'ofis_vizit') {
    const soap = normalizeSoap(b.soap)
    const alanlar = flattenSoapAlanlar(soap)
    const kb = kirmiziBayraklar((b.kirmizi || {}) as Parameters<typeof kirmiziBayraklar>[0])
    const satir: Record<string, unknown> = {
      patient_id: hasta.id, doctor_id: user.id, tur: String(b.tur || 'ofis'),
      alanlar, soap, kontrol_tarihi: soap.kontrol.tarih, kontrol_neden: soap.kontrol.neden || null,
    }
    let { data, error } = await sb.from('jine_vizitler').insert(satir).select('id').single()
    if (error) {
      const fallback = await sb.from('jine_vizitler').insert({ patient_id: hasta.id, doctor_id: user.id, tur: String(b.tur || 'ofis'), alanlar }).select('id').single()
      data = fallback.data; error = fallback.error
    }
    if (error || !data) return NextResponse.json({ error: 'Yazılamadı' }, { status: 500 })
    const ksPatch: Record<string, unknown> = { patient_id: hasta.id, doctor_id: user.id, updated_at: new Date().toISOString() }
    if (soap.hikaye.lmp) ksPatch.son_adet_tarihi = soap.hikaye.lmp
    if (soap.hikaye.kontrasepsiyon) ksPatch.kontrasepsiyon_yontemi = soap.hikaye.kontrasepsiyon
    await sb.from('kadin_sagligi').upsert(ksPatch, { onConflict: 'patient_id' })
    const gorevler: { kod: string; ad: string; due?: string | null; kaynak: string }[] = kb.map((k) => ({ kod: `kb_${k.kod}`, ad: k.mesaj, due: bugun(), kaynak: 'vizit' }))
    if (soap.kontrol.tarih) gorevler.push({ kod: 'jine_kontrol', ad: soap.kontrol.neden ? `Kontrol: ${soap.kontrol.neden}` : 'Jinekoloji kontrol randevusu', due: soap.kontrol.tarih, kaynak: 'ofis' })
    await gorevEkle(sb, user.id, hasta.id, gorevler)
    let notEkleme = null
    if (b.muayeneFormunaEkle) notEkleme = await gununNotunaEkle(sb, user.id, hasta.id, ofisVizitOzet(soap))
    return NextResponse.json({ ok: true, vizitId: data.id, kirmiziBayraklar: kb, notEkleme, ozet: ofisVizitOzet(soap) })
  }
  if (adim === 'vizit') {
    const alanlar = (b.alanlar || {}) as Record<string, unknown>
    const temiz: Record<string, unknown> = {}; for (const k of YILLIK_KONTROL_ALANLARI) if (k in alanlar) temiz[k] = alanlar[k]
    const kb = kirmiziBayraklar((alanlar.kirmizi || {}) as Parameters<typeof kirmiziBayraklar>[0])
    temiz.kirmizi_bayraklar = kb
    const { error } = await sb.from('jine_vizitler').insert({ patient_id: hasta.id, doctor_id: user.id, tur: String(b.tur || 'yillik'), alanlar: temiz })
    if (error) return NextResponse.json({ error: 'Yazılamadı' }, { status: 500 })
    await gorevEkle(sb, user.id, hasta.id, kb.map((k) => ({ kod: `kb_${k.kod}`, ad: k.mesaj, due: bugun(), kaynak: 'vizit' })))
    await gununNotunaEkle(sb, user.id, hasta.id, `Jinekoloji ${String(b.tur || 'yıllık')} kontrol kaydı${kb.length ? ` — kırmızı bayrak: ${kb.map((k) => k.kod).join(', ')}` : ''}`)
    return NextResponse.json({ ok: true, kirmiziBayraklar: kb })
  }
  if (adim === 'serviks') {
    const pap = (b.pap || null) as PapSonuc, hpv = (b.hpv || null) as HpvSonuc
    const aksiyon = serviksAksiyonu(pap, hpv, yasHesap())
    const tarih = String(b.tarih || bugun()).slice(0, 10)
    const { data, error } = await sb.from('serviks_taramalari').insert({ patient_id: hasta.id, doctor_id: user.id, tarih, pap_sonuc: pap, hpv, belge_id: b.belgeId ? String(b.belgeId) : null, taslak_aksiyon: aksiyon, sonraki_due: aksiyon.sonrakiAy != null ? ekleAy(tarih, aksiyon.sonrakiAy) : null }).select('id').single()
    if (error || !data) return NextResponse.json({ error: 'Yazılamadı' }, { status: 500 })
    await sb.from('kadin_sagligi').upsert({ patient_id: hasta.id, doctor_id: user.id, ...(pap ? { son_pap: tarih } : {}), ...(hpv ? { son_hpv: tarih } : {}), son_serviks_tarama: tarih, updated_at: new Date().toISOString() }, { onConflict: 'patient_id' })
    if (aksiyon.kolposkopi) await gorevEkle(sb, user.id, hasta.id, [{ kod: 'kolposkopi', ad: `Kolposkopi görevi — ${aksiyon.gerekce}`, due: bugun(), kaynak: 'serviks' }])
    return NextResponse.json({ ok: true, kayitId: data.id, taslak: aksiyon })
  }
  if (adim === 'cybh') {
    const etkenler = (Array.isArray(b.etkenler) ? b.etkenler : []).map(String).filter((e) => (CYBH_ETKENLERI as readonly string[]).includes(e)) as Etken[]
    const sikayet = (b.sikayet || {}) as Record<string, unknown>
    const onTani = akintiOnTani({ ph: sikayet.ph == null || sikayet.ph === '' ? null : Number(sikayet.ph), whiff: !!sikayet.whiff, clueCell: !!sikayet.clue_cell, hif: !!sikayet.hif, hareketliTrichomonas: !!sikayet.trichomonas })
    const partnerGerekli = partnerTedaviGerekli(etkenler)
    const hsv = (b.hsv || null) as HsvKarti | null
    const gebe = await aktifGebeMi(sb, hasta.id)
    const { data, error } = await sb.from('cybh_episodlari').insert({ patient_id: hasta.id, doctor_id: user.id, sikayet, etkenler, on_tani: onTani, ilk_genital_ulser: !!b.ilkGenitalUlser, hsv, partner: { gerekli: partnerGerekli, bilgilendirildi: false }, lab_belge_id: b.labBelgeId ? String(b.labBelgeId) : null }).select('id').single()
    if (error || !data) return NextResponse.json({ error: 'Yazılamadı' }, { status: 500 })
    const gorevler: { kod: string; ad: string; due?: string | null; kaynak: string }[] = []
    if (partnerGerekli) gorevler.push({ kod: 'partner_tedavi', ad: 'Partner tedavisi / bilgilendirme (bakteriyel CYBH)', due: bugun(), kaynak: 'partner' })
    for (const m of ilkUlserKontrolListesi(!!b.ilkGenitalUlser)) gorevler.push({ kod: `ulser_${kisaKod(m)}`, ad: m, due: bugun(), kaynak: 'cybh' })
    if (hsv) for (const g of hsvGebelikGorevleri(hsv, gebe)) gorevler.push({ kod: `hsv_${kisaKod(g)}`, ad: g, due: null, kaynak: 'hsv' })
    await gorevEkle(sb, user.id, hasta.id, gorevler)
    return NextResponse.json({ ok: true, episodId: data.id, onTani, partnerGerekli, gorevler: gorevler.map((g) => g.ad) })
  }
  if (adim === 'pcos') {
    const kriterler = (b.kriterler || {}) as Record<string, unknown>, dislama = (b.dislama || {}) as Record<string, boolean>
    const deg = pcosDegerlendir({ oligoAnovulasyon: !!kriterler.oligoAnovulasyon, hiperandrojenizm: !!kriterler.hiperandrojenizm, pcomUs: !!kriterler.pcomUs, menarsYil: kriterler.menarsYil == null || kriterler.menarsYil === '' ? null : Number(kriterler.menarsYil), dislama })
    const amenoreGun = b.amenoreGun == null || b.amenoreGun === '' ? null : Number(b.amenoreGun)
    const etGorevi = amenoreGun != null && amenoreGun >= 90
    const { data: mevcut } = await sb.from('pcos_kartlari').select('id').eq('patient_id', hasta.id).maybeSingle()
    const satir = { patient_id: hasta.id, doctor_id: user.id, kriterler, dislama, metabolik: (b.metabolik || null) as object | null, degerlendirme: deg, amenore_gun: amenoreGun, et_kontrol_gorevi: etGorevi, hekim_tanisi: b.hekimTanisi ? String(b.hekimTanisi).slice(0, 200) : null, updated_at: new Date().toISOString() }
    const { error } = mevcut ? await sb.from('pcos_kartlari').update(satir).eq('id', mevcut.id) : await sb.from('pcos_kartlari').insert(satir)
    if (error) return NextResponse.json({ error: 'Yazılamadı' }, { status: 500 })
    if (etGorevi) await gorevEkle(sb, user.id, hasta.id, [{ kod: 'pcos_et', ad: 'Amenore ≥90 gün: endometriyum koruması / TVUS ET kontrolü', due: bugun(), kaynak: 'pcos' }])
    return NextResponse.json({ ok: true, degerlendirme: deg })
  }
  if (adim === 'lezyon') {
    const tur = String(b.tur || 'diger')
    const { error } = await sb.from('lezyon_myom_kist').insert({ patient_id: hasta.id, doctor_id: user.id, tur, boyut_mm: b.boyutMm == null || b.boyutMm === '' ? null : Number(b.boyutMm), figo_tip: b.figoTip ? String(b.figoTip) : null, yer: b.yer ? String(b.yer) : null, semptom: b.semptom ? String(b.semptom).slice(0, 300) : null, sonraki_us: b.sonrakiUs ? String(b.sonrakiUs).slice(0, 10) : null, cerrahi_notu: b.cerrahiNotu ? String(b.cerrahiNotu).slice(0, 500) : null })
    if (error) return NextResponse.json({ error: 'Yazılamadı' }, { status: 500 })
    if (b.sonrakiUs) await gorevEkle(sb, user.id, hasta.id, [{ kod: `lezyon_us_${tur}`, ad: `${tur} kontrol US`, due: String(b.sonrakiUs).slice(0, 10), kaynak: 'lezyon' }])
    return NextResponse.json({ ok: true })
  }
  if (adim === 'kontrasepsiyon') {
    const yontem = String(b.yontem || 'diger'); const baslangic = String(b.baslangic || bugun()).slice(0, 10)
    const ria = yontem.startsWith('ria_') ? (yontem.slice(4) as 'cu5' | 'cu10' | 'lng5' | 'lng8') : null
    if (ria && !b.stiTaramaOnaylandi) return NextResponse.json({ error: 'RİA takmadan önce CYBH taraması (klamidya/gonore) onaylanmalı.' }, { status: 409 })
    const takvim = ria ? riaTakvimi(baslangic, ria) : null
    await sb.from('kontrasepsiyon').update({ aktif: false }).eq('patient_id', hasta.id).eq('aktif', true)
    const { error } = await sb.from('kontrasepsiyon').insert({ patient_id: hasta.id, doctor_id: user.id, yontem, baslangic, son_kullanim: takvim?.sonKullanim || null, sti_tarama_onaylandi: !!b.stiTaramaOnaylandi, ria_notu: takvim ? { ip_kontrol_tarihi: takvim.ipKontrol, pid_uyari_bitis: takvim.pidUyariBitis, ip_kontrol_yapildi: false } : null, aktif: true })
    if (error) return NextResponse.json({ error: 'Yazılamadı' }, { status: 500 })
    await sb.from('kadin_sagligi').upsert({ patient_id: hasta.id, doctor_id: user.id, kontrasepsiyon_yontemi: yontem, updated_at: new Date().toISOString() }, { onConflict: 'patient_id' })
    if (takvim) await gorevEkle(sb, user.id, hasta.id, [{ kod: 'ria_ip', ad: 'RİA ip kontrolü (4–6 hafta)', due: takvim.ipKontrol, kaynak: 'ria' }, { kod: 'ria_son', ad: 'RİA son kullanım / değişim', due: takvim.sonKullanim, kaynak: 'ria' }])
    return NextResponse.json({ ok: true, takvim })
  }
  if (adim === 'hrt') {
    const y = yasHesap()
    const ok = (b.onKontrol || {}) as Record<string, unknown>
    const deg = hrtOnDegerlendirme({ mamografi12Ay: !!ok.mamografi12Ay, tvusEt: ok.tvusEt == null || ok.tvusEt === '' ? null : Number(ok.tvusEt), vteOykusu: !!ok.vteOykusu, memeCa: !!ok.memeCa, tanisizKanama: !!ok.tanisizKanama, karacigerHastaligi: !!ok.karacigerHastaligi, sigara: !!ok.sigara, yas: y, menopozYil: ok.menopozYil == null || ok.menopozYil === '' ? null : Number(ok.menopozYil) } as HrtOnKontrol)
    const basladi = b.hrtBasladi === true
    if (basladi && deg.engeller.length) return NextResponse.json({ error: `HRT başlatılamaz — engel: ${deg.engeller.join('; ')}`, degerlendirme: deg }, { status: 409 })
    const { data: mevcut } = await sb.from('menopoz_hrt').select('id').eq('patient_id', hasta.id).maybeSingle()
    const hrtBaslangic = basladi ? String(b.hrtBaslangic || bugun()).slice(0, 10) : null
    const satir = { patient_id: hasta.id, doctor_id: user.id, semptom_skoru: (b.semptomSkoru || null) as object | null, on_kontrol: ok, degerlendirme: deg, hrt_basladi: basladi, hrt_baslangic: hrtBaslangic, rejim: b.rejim ? String(b.rejim).slice(0, 120) : null, yillik_gorevler: Object.fromEntries(HRT_YILLIK_GOREVLER.map((g) => [g, false])), updated_at: new Date().toISOString() }
    const { error } = mevcut ? await sb.from('menopoz_hrt').update(satir).eq('id', mevcut.id) : await sb.from('menopoz_hrt').insert(satir)
    if (error) return NextResponse.json({ error: 'Yazılamadı' }, { status: 500 })
    await sb.from('kadin_sagligi').upsert({ patient_id: hasta.id, doctor_id: user.id, hrt: basladi, hrt_baslangic: hrtBaslangic, updated_at: new Date().toISOString() }, { onConflict: 'patient_id' })
    if (basladi && hrtBaslangic) await gorevEkle(sb, user.id, hasta.id, [{ kod: 'hrt_yillik', ad: 'HRT yıllık güvenlik kontrolü (MG, TVUS ET, TA, VTE)', due: ekleAy(hrtBaslangic, 12), kaynak: 'hrt' }])
    return NextResponse.json({ ok: true, degerlendirme: deg })
  }

  // ---------- V2 (NOTYA-JINE-02) ----------
  if (adim === 'aub') {
    const g = (b.girdi || {}) as Record<string, unknown>
    // latest APPROVED Hb / ferritin from the lab engine (never invented)
    const { data: labs } = await sb.from('lab_satirlar').select('canonical_key, kanonik_deger, numune_tarihi').eq('patient_id', hasta.id).eq('onayli', true).in('canonical_key', ['Hb', 'Ferritin']).order('numune_tarihi', { ascending: false }).limit(10)
    const hbLab = (labs || []).find((l) => l.canonical_key === 'Hb'), ferLab = (labs || []).find((l) => l.canonical_key === 'Ferritin')
    const hb = g.hb != null && g.hb !== '' ? Number(g.hb) : hbLab?.kanonik_deger != null ? Number(hbLab.kanonik_deger) : null
    const ferritin = g.ferritin != null && g.ferritin !== '' ? Number(g.ferritin) : ferLab?.kanonik_deger != null ? Number(ferLab.kanonik_deger) : null
    const girdi: AubGirdi = { yas: yasHesap(), postmenopoz: !!g.postmenopoz, palm: (g.palm || {}) as Record<string, boolean>, coein: (g.coein || {}) as Record<string, boolean>, sureGun: g.sureGun == null || g.sureGun === '' ? null : Number(g.sureGun), pedAdet: g.pedAdet == null || g.pedAdet === '' ? null : Number(g.pedAdet), pihti: !!g.pihti, hb, ferritin, obezite: !!g.obezite, anovulasyonOykusu: !!g.anovulasyon, kronikAub: !!g.kronik }
    const taslak = aubDegerlendir(girdi)
    const { data, error } = await sb.from('jine_aub').insert({ patient_id: hasta.id, doctor_id: user.id, palm: girdi.palm, coein: girdi.coein, menoraji: { sureGun: girdi.sureGun, pedAdet: girdi.pedAdet, pihti: girdi.pihti, hb, ferritin, hbKaynak: g.hb != null && g.hb !== '' ? 'elle' : hbLab ? `lab ${hbLab.numune_tarihi}` : null, anemi: taslak.anemi }, postmenopoz: girdi.postmenopoz, taslak, tvus_et: g.tvusEt == null || g.tvusEt === '' ? null : Number(g.tvusEt) }).select('id').single()
    if (error || !data) return NextResponse.json({ error: 'Yazılamadı' }, { status: 500 })
    const gorevler: { kod: string; ad: string; due?: string | null; kaynak: string }[] = []
    if (taslak.endometrialOrnekZorunlu) gorevler.push({ kod: 'endometrial_ornek', ad: girdi.postmenopoz ? 'PMP: TVUS ET + endometriyal örnekleme (pipelle/D&C) — sitoloji kapatmaz' : 'Endometriyal örnekleme (pipelle; başarısızsa D&C)', due: bugun(), kaynak: 'aub' })
    if (taslak.anemi === 'agir') gorevler.push({ kod: 'aub_agir_anemi', ad: 'Ağır anemi (Hb <8): acil değerlendirme', due: bugun(), kaynak: 'aub' })
    await gorevEkle(sb, user.id, hasta.id, gorevler)
    if (girdi.postmenopoz) await gununNotunaEkle(sb, user.id, hasta.id, 'Postmenopozal kanama: TVUS ET + endometriyal örnekleme görevi açıldı (sitoloji yeterli değil).')
    return NextResponse.json({ ok: true, aubId: data.id, taslak })
  }
  if (adim === 'aub_guncelle') {
    const { data: a } = await sb.from('jine_aub').select('id, postmenopoz, ornekleme, tvus_et').eq('id', String(b.aubId || '')).eq('doctor_id', user.id).maybeSingle()
    if (!a) return NextResponse.json({ error: 'AUB kaydı bulunamadı' }, { status: 404 })
    const ornekleme = b.ornekleme ? { ...((a.ornekleme as object) || {}), ...(b.ornekleme as object) } : a.ornekleme
    const tvusEt = b.tvusEt == null || b.tvusEt === '' ? a.tvus_et : Number(b.tvusEt)
    const alanlar: Record<string, unknown> = { ornekleme, tvus_et: tvusEt, hekim_plani: b.hekimPlani != null ? String(b.hekimPlani).slice(0, 1000) : undefined, updated_at: new Date().toISOString() }
    if (alanlar.hekim_plani === undefined) delete alanlar.hekim_plani
    if (b.pmpKapat === true) {
      const gate = pmpKapatilabilir({ tvusEt: tvusEt == null ? null : Number(tvusEt), ornekleme: { tur: (ornekleme as { tur?: 'pipelle' | 'dc' | 'histeroskopi' } | null)?.tur || null, sonuc: (ornekleme as { sonuc?: string } | null)?.sonuc || null }, sitolojiVar: !!b.sitolojiVar })
      if (!gate.kapatilabilir) return NextResponse.json({ error: `PMP yolu kapatılamaz — eksik: ${gate.eksik.join(', ')}. ${gate.not.join(' ')}`, gate }, { status: 409 })
      alanlar.pmp_kapatildi = true; alanlar.pmp_kapatildi_at = new Date().toISOString()
      await sb.from('jine_gorevleri').update({ durum: 'tamam', tamam_at: new Date().toISOString() }).eq('patient_id', hasta.id).eq('kod', 'endometrial_ornek').eq('durum', 'acik')
    }
    const { error } = await sb.from('jine_aub').update(alanlar).eq('id', a.id)
    if (error) return NextResponse.json({ error: 'Yazılamadı' }, { status: 500 })
    if (b.hekimPlani) await gununNotunaEkle(sb, user.id, hasta.id, `AUB planı (hekim): ${String(b.hekimPlani).slice(0, 300)}`)
    return NextResponse.json({ ok: true })
  }
  if (adim === 'kok') {
    const k = (b.kontrol || {}) as Record<string, unknown>
    const num = (v: unknown) => (v == null || v === '' ? null : Number(v))
    const girdi: KokGirdi = { yas: yasHesap(), sigaraGunluk: num(k.sigaraGunluk), vteOykusu: !!k.vteOykusu, migrenAura: !!k.migrenAura, migrenAurasiz35Ustu: !!k.migrenAurasiz, taSistolik: num(k.taSistolik), taDiastolik: num(k.taDiastolik), vaskulerHastalik: !!k.vaskulerHastalik, memeCa: !!k.memeCa, memeCaGecmis5YilUstu: !!k.memeCaGecmis, karacigerAgir: !!k.karacigerAgir, karacigerTumor: !!k.karacigerTumor, postpartumGun: num(k.postpartumGun), emziriyor: !!k.emziriyor, slePozitifApl: !!k.sleApl, dmVaskuler: !!k.dmVaskuler, buyukCerrahiImmobil: !!k.cerrahiImmobil, bilinmeyenKanama: !!k.bilinmeyenKanama, hiperlipidemi: !!k.hiperlipidemi, obeziteBmi: num(k.bmi) }
    const sonuc = kokDegerlendir(girdi)
    const karar = String(b.karar || 'beklemede')
    const override = karar === 'baslandi' && sonuc.kategori === 4
    if (override && !(b.overrideGerekce && String(b.overrideGerekce).trim().length >= 15)) return NextResponse.json({ error: `KOK başlatılamaz (MEC 4): ${sonuc.engeller.join('; ')}. Hekim override için ≥15 karakter gerekçe zorunlu; kayda geçer.`, sonuc }, { status: 409 })
    const { error } = await sb.from('jine_kok').insert({ patient_id: hasta.id, doctor_id: user.id, kontrol: girdi, sonuc, karar, override, override_gerekce: override ? String(b.overrideGerekce).slice(0, 500) : null, preparat: b.preparat ? String(b.preparat).slice(0, 120) : null })
    if (error) return NextResponse.json({ error: 'Yazılamadı' }, { status: 500 })
    if (karar === 'baslandi') await gununNotunaEkle(sb, user.id, hasta.id, `KOK başlandı (hekim) — MEC kategori ${sonuc.kategori}${override ? ` — OVERRIDE: ${String(b.overrideGerekce).slice(0, 200)}` : ''}${b.preparat ? ` — ${String(b.preparat)}` : ''}`)
    return NextResponse.json({ ok: true, sonuc, override })
  }
  if (adim === 'endometriozis') {
    const g = (b.girdi || {}) as Record<string, unknown>
    const girdi: EndoGirdi = { dismenore: !!g.dismenore, disparoni: !!g.disparoni, kronikPelvikAgri: !!g.kronikPelvikAgri, infertilite: !!g.infertilite, diskezi: !!g.diskezi, endometriomaCm: g.endometriomaCm == null || g.endometriomaCm === '' ? null : Number(g.endometriomaCm), ca125: g.ca125 == null || g.ca125 === '' ? null : Number(g.ca125), gebelikIstegi: !!g.gebelikIstegi, tedaviyeDirenc: !!g.tedaviyeDirenc }
    const taslak = endometriozisDegerlendir(girdi)
    const { data: mevcut } = await sb.from('jine_endometriozis').select('id').eq('patient_id', hasta.id).maybeSingle()
    const satir = { patient_id: hasta.id, doctor_id: user.id, girdi, taslak, hekim_plani: b.hekimPlani ? String(b.hekimPlani).slice(0, 1000) : null, sevk: taslak.sevk.length ? { maddeler: taslak.sevk } : null, updated_at: new Date().toISOString() }
    const { error } = mevcut ? await sb.from('jine_endometriozis').update(satir).eq('id', mevcut.id) : await sb.from('jine_endometriozis').insert(satir)
    if (error) return NextResponse.json({ error: 'Yazılamadı' }, { status: 500 })
    await gorevEkle(sb, user.id, hasta.id, taslak.sevk.map((sv, i) => ({ kod: `endo_sevk_${i}`, ad: sv, due: bugun(), kaynak: 'endometriozis' })))
    return NextResponse.json({ ok: true, taslak })
  }
  if (adim === 'rm') {
    const g = (b.girdi || {}) as Record<string, unknown>
    const girdi: RmGirdi = { klinikKayipSayisi: Number(g.klinikKayipSayisi) || 0, hekimEsigi3: !!g.hekimEsigi3, anneYas: yasHesap(), ardisik: !!g.ardisik }
    const taslak = rmDegerlendir(girdi)
    const { data: mevcut } = await sb.from('jine_rm').select('id, tetkik_durumu').eq('patient_id', hasta.id).maybeSingle()
    const tetkikDurumu = { ...((mevcut?.tetkik_durumu as object) || {}), ...((b.tetkikDurumu as object) || {}) }
    const satir = { patient_id: hasta.id, doctor_id: user.id, girdi, taslak, tetkik_durumu: tetkikDurumu, hekim_plani: b.hekimPlani ? String(b.hekimPlani).slice(0, 1000) : null, updated_at: new Date().toISOString() }
    const { error } = mevcut ? await sb.from('jine_rm').update(satir).eq('id', mevcut.id) : await sb.from('jine_rm').insert(satir)
    if (error) return NextResponse.json({ error: 'Yazılamadı' }, { status: 500 })
    if (taslak.kriterKarsilandi) await gorevEkle(sb, user.id, hasta.id, taslak.tetkikler.filter((t) => t.oneri === 'rutin').map((t) => ({ kod: `rm_${kisaKod(t.ad)}`, ad: t.ad, due: bugun(), kaynak: 'rm' })))
    return NextResponse.json({ ok: true, taslak })
  }
  if (adim === 'egk') {
    const g = (b.girdi || {}) as Record<string, unknown>
    const num = (v: unknown) => (v == null || v === '' ? null : Number(v))
    const bool = (v: unknown) => (v === true ? true : v === false ? false : null)
    const seri = (Array.isArray(b.bhcg) ? b.bhcg : []).map((x: { at?: string; value?: unknown }) => ({ at: String(x.at || bugun()), value: Number(x.value) })).filter((x) => Number.isFinite(x.value))
    // pull approved β-hCG from the lab engine too
    const { data: labs } = await sb.from('lab_satirlar').select('kanonik_deger, numune_tarihi').eq('patient_id', hasta.id).eq('onayli', true).eq('canonical_key', 'bHCG').order('numune_tarihi', { ascending: true }).limit(10)
    for (const l of labs || []) if (l.kanonik_deger != null && l.numune_tarihi && !seri.some((x) => x.at === String(l.numune_tarihi))) seri.push({ at: String(l.numune_tarihi), value: Number(l.kanonik_deger) })
    const trend = bhcgSeriesTrend(seri)
    const { data: ks } = await sb.from('kadin_sagligi').select('notlar').eq('patient_id', hasta.id).maybeSingle()
    const { data: gebQ } = await sb.from('gebelikler').select('id, kan_grubu, durum').eq('patient_id', hasta.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
    const rhNeg = g.rhNegatif === true || /-|neg/i.test(String(gebQ?.kan_grubu || ''))
    const girdi: EgkGirdi = { crlMm: num(g.crlMm), fhrVar: bool(g.fhrVar), msdMm: num(g.msdMm), embriyoVar: bool(g.embriyoVar), bhcg: seri, rhNegatif: rhNeg, hafta: num(g.hafta) }
    const taslak = egkDegerlendir(girdi, trend)
    const gebelikId = gebQ && aktifGebelikDurumu(gebQ.durum) && (girdi.hafta == null || girdi.hafta < 20) ? gebQ.id : null
    const { data, error } = await sb.from('jine_egk').insert({ patient_id: hasta.id, doctor_id: user.id, gebelik_id: gebelikId, girdi, bhcg_serisi: seri, taslak: { ...taslak, bhcgTrend: trend }, secenek: b.secenek ? String(b.secenek) : null }).select('id').single()
    if (error || !data) return NextResponse.json({ error: 'Yazılamadı' }, { status: 500 })
    await gorevEkle(sb, user.id, hasta.id, taslak.gorevler.map((gv) => ({ kod: `egk_${kisaKod(gv)}`, ad: gv, due: bugun(), kaynak: 'egk' })))
    void ks
    return NextResponse.json({ ok: true, egkId: data.id, taslak, bhcgTrend: trend })
  }
  if (adim === 'egk_guncelle') {
    const { error } = await sb.from('jine_egk').update({ secenek: b.secenek ? String(b.secenek) : null, anti_d_uygulandi: b.antiD === true ? true : b.antiD === false ? false : null, kapali: b.kapali === true, updated_at: new Date().toISOString() }).eq('id', String(b.egkId || '')).eq('doctor_id', user.id)
    if (error) return NextResponse.json({ error: 'Yazılamadı' }, { status: 500 })
    if (b.secenek) await gununNotunaEkle(sb, user.id, hasta.id, `Erken gebelik kaybı yönetimi (hekim): ${String(b.secenek)}`)
    return NextResponse.json({ ok: true })
  }

  // ---------- JINE-04 / KD-05 wow sprint ----------
  const wowKaydet = async (tur: string, veri: object) => {
    await sb.from('kd_wow_kayitlari').insert({ patient_id: hasta.id, doctor_id: user.id, tur, veri })
  }

  if (adim === 'cybh_tedavi') {
    const etkenler = (Array.isArray(b.etkenler) ? b.etkenler : []).map(String).filter((e) => (CYBH_ETKENLERI as readonly string[]).includes(e)) as Etken[]
    const plan = cybhTedaviPlani(etkenler, { gebe: !!b.gebe })
    await wowKaydet('cybh_tedavi', plan)
    await gorevEkle(sb, user.id, hasta.id, [
      ...plan.tocGorevleri.map((t) => ({ kod: `toc_${kisaKod(t)}`, ad: t, due: bugun(), kaynak: 'cybh' })),
      ...(plan.partnerGerekli ? [{ kod: 'partner_rx', ad: 'Partner tedavi notu / bilgilendirme', due: bugun(), kaynak: 'partner' }] : []),
      ...plan.naatOner.map((n) => ({ kod: `naat_${n.kod}`, ad: `NAAT: ${n.ad} (${n.ornek})`, due: bugun(), kaynak: 'cybh' })),
    ])
    if (b.partnerYazdir) await gununNotunaEkle(sb, user.id, hasta.id, plan.yazdirilabilirPartner.slice(0, 1500))
    return NextResponse.json({ ok: true, plan })
  }
  if (adim === 'acil_kb') {
    const plan = acilKontrasepsiyon({ iliskiSaatOnce: b.iliskiSaatOnce == null || b.iliskiSaatOnce === '' ? null : Number(b.iliskiSaatOnce), emziriyor: !!b.emziriyor, kokKullanıyor: !!b.kokKullanıyor })
    await wowKaydet('acil_kb', plan)
    await gorevEkle(sb, user.id, hasta.id, plan.sonrasi.map((s) => ({ kod: `ecil_${kisaKod(s)}`, ad: s, due: bugun(), kaynak: 'acil_kb' })))
    return NextResponse.json({ ok: true, plan })
  }
  if (adim === 'yontem_mec') {
    const k = (b.kontrol || {}) as Record<string, unknown>
    const num = (v: unknown) => (v == null || v === '' ? null : Number(v))
    const sonuc = yontemMec(String(b.yontem || 'kok') as YontemKod, {
      yas: yasHesap(), sigaraGunluk: num(k.sigaraGunluk), vteOykusu: !!k.vteOykusu, migrenAura: !!k.migrenAura,
      taSistolik: num(k.taSistolik), taDiastolik: num(k.taDiastolik), memeCa: !!k.memeCa, karacigerAgir: !!k.karacigerAgir,
      postpartumGun: num(k.postpartumGun), emziriyor: !!k.emziriyor, pidAktif: !!k.pidAktif, aciklanmamisKanama: !!k.aciklanmamisKanama,
      bmi: num(k.bmi), gebelikSupheli: !!k.gebelikSupheli,
    })
    await wowKaydet('yontem_mec', sonuc)
    return NextResponse.json({ ok: true, sonuc })
  }
  if (adim === 'postpartum_kb') {
    const liste = postpartumKontrasepsiyonBaslangic(Number(b.postpartumGun) || 42, !!b.emziriyor)
    await wowKaydet('postpartum_kb', { liste })
    return NextResponse.json({ ok: true, liste })
  }
  if (adim === 'menoraji_tedavi') {
    const g = (b.girdi || {}) as Record<string, unknown>
    const plan = menorajiTedaviBasamagi({
      menoraji: !!g.menoraji, anemi: (String(g.anemi || 'bilinmiyor') as 'yok' | 'hafif' | 'orta' | 'agir' | 'bilinmiyor'),
      gebelikIstegi: !!g.gebelikIstegi, myomBozucu: !!g.myomBozucu, adenomyozis: !!g.adenomyozis,
      medikalBasarisiz: !!g.medikalBasarisiz, orneklemeSonucRiskli: !!g.orneklemeSonucRiskli,
    })
    await wowKaydet('menoraji', plan)
    await gorevEkle(sb, user.id, hasta.id, plan.basamaklar.filter((x) => x.uygun && x.sira <= 2).map((x) => ({ kod: `hmb_${x.sira}`, ad: `HMB: ${x.baslik}`, due: bugun(), kaynak: 'aub' })))
    return NextResponse.json({ ok: true, plan })
  }
  if (adim === 'usg_rapor') {
    const sablon = String(b.sablon || 'dating') as UsgSablonKod
    const rapor = usgRaporTaslagi(sablon, (b.olcumler || {}) as Record<string, string>, b.hekimNotu ? String(b.hekimNotu) : undefined)
    const enabiz = enabizUsgRapor({
      baslik: rapor.baslik,
      govde: rapor.govde,
      sutOneri: rapor.sutOneri,
      bayraklar: rapor.bayraklar,
      sablonKod: sablon,
      hastaId: hasta.id,
    })
    const kayit = { ...rapor, enabiz }
    await wowKaydet('usg', kayit)
    await gununNotunaEkle(sb, user.id, hasta.id, `${rapor.baslik}\n${rapor.govde}`.slice(0, 2000))
    return NextResponse.json({ ok: true, rapor: kayit, enabiz })
  }
  if (adim === 'anti_d_loop') {
    const plan = antiDKapaliDongu({
      rhNegatif: !!b.rhNegatif, partnerRhPozitifVeyaBilinmiyor: !!b.partnerRhPozitifVeyaBilinmiyor,
      indirektCoombsNegatif: b.indirektCoombsNegatif !== false, tetikler: (Array.isArray(b.tetikler) ? b.tetikler : []) as AntiDTetik[],
      antenatalYapildi: !!b.antenatalYapildi, postpartumYapildi: !!b.postpartumYapildi,
    })
    await wowKaydet('anti_d', plan)
    await gorevEkle(sb, user.id, hasta.id, plan.gorevler.map((g) => ({ kod: g.kod, ad: g.ad, due: bugun(), kaynak: 'anti_d' })))
    return NextResponse.json({ ok: true, plan })
  }
  if (adim === 'e_dogum') {
    const paket = eDogumSihirbaz((b.payload || {}) as Record<string, unknown>)
    const enabiz = mapEDogumWizardToEnabizPaket(paket)
    const kayit = { ...paket, enabiz }
    await wowKaydet('e_dogum', kayit)
    return NextResponse.json({ ok: true, paket: kayit, enabiz })
  }
  if (adim === 'paket') {
    const kul = (b.kullanilan || {}) as Record<string, number>
    const kotalar = VARSAYILAN_PAKET.map((k) => ({ ...k, kullanilan: Number(kul[k.kod] || 0) }))
    const durum = paketDurum(kotalar)
    await wowKaydet('paket', durum)
    return NextResponse.json({ ok: true, durum })
  }
  if (adim === 'cs_savunma') {
    const paket = csSavunmaPaketi(Array.isArray(b.endikasyonlar) ? b.endikasyonlar.map(String) : [], b.kararAt ? String(b.kararAt) : null, !!b.fetalDistres)
    await wowKaydet('cs', paket)
    if (paket.metin) await gununNotunaEkle(sb, user.id, hasta.id, paket.metin.slice(0, 1500))
    return NextResponse.json({ ok: true, paket })
  }
  if (adim === 'urojine') {
    const kart = urojinePopqHizli({ stresInkontinans: !!b.stresInkontinans, sikilik: !!b.sikilik, prolapsusSikayet: !!b.prolapsusSikayet, residual: b.residual == null || b.residual === '' ? null : Number(b.residual) })
    await wowKaydet('urojine', kart)
    await gorevEkle(sb, user.id, hasta.id, kart.gorevler.map((g) => ({ kod: `uro_${kisaKod(g)}`, ad: g, due: bugun(), kaynak: 'urojine' })))
    return NextResponse.json({ ok: true, kart })
  }
  if (adim === 'onkoloji_iota') {
    const kart = onkolojiIotaTriyaj({ kistSolid: !!b.kistSolid, asit: !!b.asit, papiller: !!b.papiller, dopplerGuclu: !!b.dopplerGuclu, ca125: b.ca125 == null || b.ca125 === '' ? null : Number(b.ca125), menopoz: !!b.menopoz })
    await wowKaydet('onkoloji', kart)
    if (kart.sevk) await gorevEkle(sb, user.id, hasta.id, [{ kod: 'onk_sevk', ad: `Over kitle IOTA ${kart.risk} — onkolojik jinekoloji sevk`, due: bugun(), kaynak: 'onkoloji' }])
    return NextResponse.json({ ok: true, kart })
  }
  if (adim === 'infertilite_sevk') {
    const paket = infertiliteSevkPaketi(Array.isArray(b.tamamlanan) ? b.tamamlanan.map(String) : [])
    await wowKaydet('infertilite', paket)
    return NextResponse.json({ ok: true, paket })
  }
  if (adim === 'siddet') {
    const kart = siddetTarama(b.evet === true ? true : b.evet === false ? false : null)
    await wowKaydet('siddet', kart)
    await gorevEkle(sb, user.id, hasta.id, kart.gorevler.map((g) => ({ kod: `sid_${kisaKod(g)}`, ad: g, due: bugun(), kaynak: 'siddet' })))
    return NextResponse.json({ ok: true, kart })
  }
  if (adim === 'kok_yillik') {
    const bas = String(b.baslangic || bugun()).slice(0, 10)
    const kart = kokYillikGuvenlik(bas, bugun())
    await wowKaydet('kok_yillik', kart)
    await gorevEkle(sb, user.id, hasta.id, [{ kod: 'kok_yillik', ad: `KOK yıllık güvenlik: ${kart.maddeler.join(', ')}`, due: kart.due, kaynak: 'kok' }])
    return NextResponse.json({ ok: true, kart })
  }
  if (adim === 'hsv_36') {
    const gorevler = hsvSupresyon36hf(b.tip === 'hsv1' || b.tip === 'hsv2' ? b.tip : null)
    await gorevEkle(sb, user.id, hasta.id, gorevler.map((g) => ({ kod: `hsv36_${kisaKod(g)}`, ad: g, due: null, kaynak: 'hsv' })))
    return NextResponse.json({ ok: true, gorevler })
  }

  return NextResponse.json({ error: 'Geçersiz adim' }, { status: 400 })
}

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const patientId = req.nextUrl.searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId gerekli' }, { status: 400 })
  const hasta = await hastaDogrula(sb, user.id, patientId)
  if (!hasta) return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })
  const [ks, serviks, cybh, pcos, lezyonlar, kontr, hrt, gorevler, vizitler, gebe] = await Promise.all([
    sb.from('kadin_sagligi').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('serviks_taramalari').select('*').eq('patient_id', hasta.id).order('tarih', { ascending: false }).limit(10),
    sb.from('cybh_episodlari').select('*').eq('patient_id', hasta.id).order('tarih', { ascending: false }).limit(10),
    sb.from('pcos_kartlari').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('lezyon_myom_kist').select('*').eq('patient_id', hasta.id).order('created_at', { ascending: false }).limit(20),
    sb.from('kontrasepsiyon').select('*').eq('patient_id', hasta.id).order('created_at', { ascending: false }).limit(5),
    sb.from('menopoz_hrt').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('jine_gorevleri').select('*').eq('patient_id', hasta.id).eq('durum', 'acik').order('due'),
    sb.from('jine_vizitler').select('id, tur, alanlar, soap, kontrol_tarihi, kontrol_neden, created_at').eq('patient_id', hasta.id).order('created_at', { ascending: false }).limit(8),
    aktifGebeMi(sb, hasta.id),
  ])
  const [aub, kok, endo, rm, egk, wowRows] = await Promise.all([
    sb.from('jine_aub').select('*').eq('patient_id', hasta.id).order('created_at', { ascending: false }).limit(5),
    sb.from('jine_kok').select('*').eq('patient_id', hasta.id).order('created_at', { ascending: false }).limit(5),
    sb.from('jine_endometriozis').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('jine_rm').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('jine_egk').select('*').eq('patient_id', hasta.id).order('created_at', { ascending: false }).limit(5),
    sb.from('kd_wow_kayitlari').select('tur, veri, created_at').eq('patient_id', hasta.id).order('created_at', { ascending: false }).limit(40),
  ])
  let vizitSatirlari: Array<{ id?: string; tur?: string; alanlar?: Record<string, unknown> | null; soap?: unknown; kontrol_tarihi?: string | null; kontrol_neden?: string | null; created_at?: string }> = vizitler.data || []
  if (vizitler.error) {
    const tekrar = await sb.from('jine_vizitler').select('id, tur, alanlar, created_at').eq('patient_id', hasta.id).order('created_at', { ascending: false }).limit(8)
    vizitSatirlari = tekrar.data || []
  }
  const wowMap: Record<string, unknown> = {}
  const usg: unknown[] = []
  for (const row of wowRows.data || []) {
    if (row.tur === 'usg') usg.push(row.veri)
    else if (!(row.tur in wowMap)) wowMap[row.tur] = row.veri
  }
  const k = ks.data as Record<string, unknown> | null
  const aktifKontr = (kontr.data || []).find((x) => x.aktif) || null
  const ria = aktifKontr && String(aktifKontr.yontem).startsWith('ria_') ? (String(aktifKontr.yontem).slice(4) as 'cu5' | 'cu10' | 'lng5' | 'lng8') : null
  const due = dueHesapla({ dob: hasta.dob, bugun: bugun(), sonPap: (k?.son_pap as string) || null, sonHpv: (k?.son_hpv as string) || null, sonMamografi: (k?.son_mamografi as string) || null, sonDxa: (k?.son_dxa as string) || null, sonGgk: (k?.son_kolorektal as string) || null, hrt: !!k?.hrt, hrtBaslangic: (k?.hrt_baslangic as string) || null, riaTakildi: ria ? String(aktifKontr!.baslangic) : null, riaTipi: ria, histerektomi: !!k?.histerektomi, gebe })
  const yas = (() => { if (!hasta.dob) return null; const a = new Date(), d = new Date(hasta.dob); let y = a.getFullYear() - d.getFullYear(); if (a.getMonth() < d.getMonth() || (a.getMonth() === d.getMonth() && a.getDate() < d.getDate())) y--; return y })()
  const sonSoap = soapFromVizitRow(vizitSatirlari[0] as { soap?: unknown; alanlar?: Record<string, unknown> | null; kontrol_tarihi?: string | null; kontrol_neden?: string | null } | undefined)
  const taslak = taslakBugunkuVizit({ sonSoap, kadinSagligi: k, due, kontrasepsiyon: aktifKontr ? String(aktifKontr.yontem) : (k?.kontrasepsiyon_yontemi as string) || null })
  const sticky = jineSticky({ lmp: taslak.hikaye.lmp, yas, kontrasepsiyon: taslak.hikaye.kontrasepsiyon, due, sonrakiKontrol: taslak.kontrol.tarih, gebe })
  const acilBundle = {
    ...(typeof wowMap.acil_kb === 'object' && wowMap.acil_kb ? wowMap.acil_kb as object : {}),
    mec: wowMap.yontem_mec || null,
    postpartum: (wowMap.postpartum_kb as { liste?: unknown })?.liste || null,
  }
  return NextResponse.json({
    kadinSagligi: k, due, serviks: serviks.data || [], cybh: cybh.data || [], pcos: pcos.data, lezyonlar: lezyonlar.data || [],
    kontrasepsiyon: kontr.data || [], hrt: hrt.data, gorevler: gorevler.data || [], vizitler: vizitSatirlari, gebe, yas, taslak, sticky,
    v2: { aub: aub.data || [], kok: kok.data || [], endo: endo.data, rm: rm.data, egk: egk.data || [] },
    wow: {
      cybhTedavi: wowMap.cybh_tedavi || null,
      acil: Object.keys(acilBundle).length ? acilBundle : null,
      menoraji: wowMap.menoraji || null,
      usg,
      antiD: wowMap.anti_d || null,
      eDogum: wowMap.e_dogum || null,
      paket: wowMap.paket || null,
      cs: wowMap.cs || null,
      urojine: wowMap.urojine || null,
      onkoloji: wowMap.onkoloji || null,
      infertilite: wowMap.infertilite || null,
      siddet: wowMap.siddet || null,
      kokYillik: wowMap.kok_yillik || null,
    },
    kutuphane: { etkenler: CYBH_ETKENLERI, hrtYillik: HRT_YILLIK_GOREVLER, infertilite: INFERTILITE_ADIM1, vizitAlanlari: YILLIK_KONTROL_ALANLARI, refler: REF_ACIKLAMA },
  })
}
