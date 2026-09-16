/**
 * NOTYA-JINE-01 — Office gynecology spine API (kadın-doğum, non-pregnant home).
 * GET ?patientId= → due list (engine), serviks history, cybh, pcos, lezyonlar, kontrasepsiyon, hrt, açık görevler, vizitler
 * POST adim (every write is a doctor action; AI drafts only):
 *   kadin_sagligi {patientId, alanlar}                      → screening dates (son_pap/son_hpv/son_mamografi/son_dxa/son_kolorektal/histerektomi/hrt…)
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
import { dueHesapla, serviksAksiyonu, partnerTedaviGerekli, ilkUlserKontrolListesi, akintiOnTani, hsvGebelikGorevleri, pcosDegerlendir, riaTakvimi, hrtOnDegerlendirme, HRT_YILLIK_GOREVLER, INFERTILITE_ADIM1, kirmiziBayraklar, YILLIK_KONTROL_ALANLARI, CYBH_ETKENLERI, type Etken, type PapSonuc, type HpvSonuc, type HsvKarti, type HrtOnKontrol } from '@/specialties/kadin-dogum/engines/jinekoloji-spine'

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
    sb.from('jine_vizitler').select('id, tur, alanlar, created_at').eq('patient_id', hasta.id).order('created_at', { ascending: false }).limit(5),
    aktifGebeMi(sb, hasta.id),
  ])
  const k = ks.data as Record<string, unknown> | null
  const aktifKontr = (kontr.data || []).find((x) => x.aktif) || null
  const ria = aktifKontr && String(aktifKontr.yontem).startsWith('ria_') ? (String(aktifKontr.yontem).slice(4) as 'cu5' | 'cu10' | 'lng5' | 'lng8') : null
  const due = dueHesapla({ dob: hasta.dob, bugun: bugun(), sonPap: (k?.son_pap as string) || null, sonHpv: (k?.son_hpv as string) || null, sonMamografi: (k?.son_mamografi as string) || null, sonDxa: (k?.son_dxa as string) || null, sonGgk: (k?.son_kolorektal as string) || null, hrt: !!k?.hrt, hrtBaslangic: (k?.hrt_baslangic as string) || null, riaTakildi: ria ? String(aktifKontr!.baslangic) : null, riaTipi: ria, histerektomi: !!k?.histerektomi, gebe })
  return NextResponse.json({ kadinSagligi: k, due, serviks: serviks.data || [], cybh: cybh.data || [], pcos: pcos.data, lezyonlar: lezyonlar.data || [], kontrasepsiyon: kontr.data || [], hrt: hrt.data, gorevler: gorevler.data || [], vizitler: vizitler.data || [], gebe, kutuphane: { etkenler: CYBH_ETKENLERI, hrtYillik: HRT_YILLIK_GOREVLER, infertilite: INFERTILITE_ADIM1, vizitAlanlari: YILLIK_KONTROL_ALANLARI } })
}
