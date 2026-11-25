/**
 * EV-ACIL-SEKER (Kaan, 2026-11-25) — very high glucose becomes "acil"; glucometer HI / LO; the ketone reminder with an
 * active insulin; HI / LO kept out of every numeric computation; the stored rows (deger null, isaret flag); the hard safety
 * ceiling on the doctor's per-patient threshold; no dose words anywhere in the patient text. Synthetic QA data only.
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { etkinEsikler, varsayilanEsikler, GLUKOZ_ACIL_TAVAN, GLUKOZ_ACIL_UST } from './hedefler'
import { isaretKurallari, olcumKurallari, olcumSeviyesi, tekDegerKurallari, gurultuSuz } from './kurallar'
import { olcumDogrula } from './olcumler'
import { fotoCevabiniCoz } from './fotoOku'
import { insulinVarMi } from './ilacSinifi'
import { gunlukOzeti, kontrolOncesiOzet } from './ozet'
import { demoDurumuUygula, gunlukDemoHam, evVerisiDemoGirdisi } from './demo'
import { evVerisiHesapla } from './evVerisi'
import { SAGLIK_EVI_SOZLERI as S } from './sozler'
import { olcumKaydet, olcumSatirlari } from './sunucu'
import type { EvOlcum, IsaretliOlcum } from './tipler'
import { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'qa-sentetik-ev-acil-anahtari'
process.env.NOTYA_VAPID_PUBLIC_KEY = ''

const SIMDI = '2026-11-25T11:00:00.000Z' // 14:00 Türkiye
const MS = Date.parse(SIMDI)
const B = { yasAy: null, kiloHekimeBildir: false }
const glu = (deger: number, baglam: EvOlcum['baglam'] = 'tokluk2', id = 'g1'): EvOlcum => ({ id, tip: 'glukoz', deger, deger2: null, baglam, olcumAt: SIMDI, kaynak: 'portal' })
const hi = (isaret: 'hi' | 'lo' = 'hi', baglam: IsaretliOlcum['baglam'] = 'tokluk2'): IsaretliOlcum => ({ id: 'h1', tip: 'glukoz', isaret, baglam, olcumAt: SIMDI, kaynak: 'portal' })
/** Dose instructions are never given: no unit counts, no "increase / decrease your dose", no "take N". */
const DOZ_DILI = /\d+\s*(ünite|unite|iu\b|ml\b|mg\b(?!\/dl))|doz(unu|u)?\s*(artır|azalt|değiştir)|insülin(inizi)?\s*(yapın|vurun|artırın)|\bek doz\b/i

describe('EV-ACIL-SEKER — thresholds and the hard safety ceiling', () => {
  it('every glucose context: acil ≥ 400, hekime bildir stays ≥ 300', () => {
    const e = varsayilanEsikler('genel')
    for (const k of ['glukoz:aclik', 'glukoz:tokluk2', 'glukoz:yatmadan', 'glukoz:rastgele']) {
      assert.equal(e[k].acilUst, GLUKOZ_ACIL_UST, k)
      assert.equal(e[k].bildirUst, 300, k)
      assert.equal(e[k].acilAlt, 54, k)
    }
  })
  it('a doctor may lower the acil threshold, never raise it above 450, never drop acil-low below 54', () => {
    const e = etkinEsikler('genel', { esikler: { 'glukoz:tokluk2': { acilUst: 350 }, 'glukoz:aclik': { acilUst: 600, acilAlt: 40 }, 'glukoz:rastgele': { acilAlt: 60 } } })
    assert.equal(e['glukoz:tokluk2'].acilUst, 350)
    assert.equal(e['glukoz:aclik'].acilUst, GLUKOZ_ACIL_TAVAN)
    assert.equal(e['glukoz:aclik'].acilAlt, 54)
    assert.equal(e['glukoz:rastgele'].acilAlt, 60, 'a more sensitive low threshold is kept')
    assert.equal(tekDegerKurallari(glu(460, 'aclik'), e, B)[0].duzey, 'acil', '460 can never be non-urgent')
  })
})

describe('EV-ACIL-SEKER — the rules', () => {
  const e = etkinEsikler('genel', null)
  it('310 → hekime_bildir (unchanged); 400 and 452 → acil with the symptom-check flag', () => {
    assert.equal(tekDegerKurallari(glu(310), e, B)[0].duzey, 'hekime_bildir')
    for (const v of [400, 452, 590]) {
      const r = tekDegerKurallari(glu(v), e, B)
      assert.equal(r.length, 1); assert.equal(r[0].duzey, 'acil'); assert.equal(r[0].kural, 'cok_yuksek')
      assert.equal(r[0].veri.sekerAcil, 'yuksek'); assert.equal(r[0].veri.keton, false)
      assert.match(r[0].hastaMetni, /112/); assert.match(r[0].hastaMetni, /Doktorunuza da bildirdik/)
      assert.doesNotMatch(r[0].hastaMetni, /5 dakika oturup dinlenin/, 'the blood-pressure advice is not used for glucose')
    }
  })
  it('an active insulin → ketone reminder flag and the doctor text says so', () => {
    const r = tekDegerKurallari(glu(452), e, { ...B, insulinAktif: true })[0]
    assert.equal(r.veri.keton, true)
    assert.match(r.hekimMetni, /Aktif insülin var/)
  })
  it('HI → acil very-high (same dedupe key as a numeric ≥ 400), LO → acil very-low; no number invented', () => {
    const h = isaretKurallari(hi('hi'), B)[0]
    assert.equal(h.duzey, 'acil'); assert.equal(h.kural, 'cok_yuksek'); assert.equal(h.anahtar, 'cok_yuksek:glukoz:tokluk2')
    assert.equal(h.anahtar, tekDegerKurallari(glu(452), e, B)[0].anahtar)
    assert.equal(h.veri.deger, null); assert.equal(h.veri.isaret, 'hi'); assert.equal(h.veri.sekerAcil, 'yuksek')
    assert.doesNotMatch(h.hastaMetni.replace('112', ''), /\d/, 'HI text carries no number')
    const l = isaretKurallari(hi('lo'), B)[0]
    assert.equal(l.duzey, 'acil'); assert.equal(l.kural, 'cok_dusuk'); assert.equal(l.veri.sekerAcil, 'dusuk')
    assert.equal(isaretKurallari(hi('hi'), { ...B, insulinAktif: true })[0].veri.keton, true)
  })
  it('a HI then a numeric 452 inside the cool-down → one acil alert, not two', () => {
    const ilk = isaretKurallari(hi('hi'), B)
    const ikinci = olcumKurallari(glu(452), [glu(452)], e, MS, B, true)
    assert.equal(gurultuSuz(ikinci, ilk.map((r) => ({ anahtar: r.anahtar, duzey: r.duzey, olusturmaAt: SIMDI })), MS + 600_000).length, 0)
  })
  it('a not-followed glucose (module off) still raises the acil', () => {
    assert.equal(olcumKurallari(glu(452), [glu(452)], e, MS, B, false)[0].duzey, 'acil')
  })
  it('display level of one reading (UYARI-RENKLERI): acil / hekime_bildir / dikkat / in range; a flag is always acil', () => {
    assert.equal(olcumSeviyesi(glu(452), e), 'acil')
    assert.equal(olcumSeviyesi(glu(320), e), 'hekime_bildir')
    assert.equal(olcumSeviyesi(glu(65), e), 'dikkat')
    assert.equal(olcumSeviyesi(glu(120), e), null)
    assert.equal(olcumSeviyesi(hi('lo'), e), 'acil')
  })
  it('never a dose instruction: rule texts and every symptom-check word', () => {
    const metinler = [
      ...tekDegerKurallari(glu(452), e, { ...B, insulinAktif: true }).map((r) => r.hastaMetni),
      ...isaretKurallari(hi('hi'), { ...B, insulinAktif: true }).map((r) => r.hastaMetni),
      ...isaretKurallari(hi('lo'), B).map((r) => r.hastaMetni),
      S.sekerAcilBaslik, S.sekerAcilAlt, S.sekerAcil112Baslik, S.sekerAcil112Metin, S.sekerAcilSakinBaslik, ...S.sekerAcilSakin, S.sekerAcilKeton, S.sekerAcilTekrar, ...S.sekerAcilBelirtiler,
    ]
    for (const m of metinler) assert.doesNotMatch(m, DOZ_DILI, m)
    assert.deepEqual([...S.sekerAcilBelirtiler].length, 6)
    assert.match(S.sekerAcilSakin.join(' '), /15–30 dakika/)
    assert.match(S.sekerAcilSakin.join(' '), /aksini söylemediyse su için/)
    assert.match(S.sekerAcilKeton, /keton/i)
  })
})

describe('EV-ACIL-SEKER — entry, photo, insulin', () => {
  it('HI / LO accepted for glucose only, as a flag (no number)', () => {
    assert.deepEqual(olcumDogrula({ tip: 'glukoz', isaret: 'HI', baglam: 'aclik' }), { ok: true, tip: 'glukoz', isaret: 'hi', deger: null, deger2: null, baglam: 'aclik' })
    assert.equal(olcumDogrula({ tip: 'kb', isaret: 'hi' }).ok, false)
    assert.equal(olcumDogrula({ tip: 'glukoz', isaret: 'max' }).ok, false)
  })
  it('the photo reader returns HI / LO as a flag, never as a made-up number', () => {
    const r = fotoCevabiniCoz({ cihaz: 'seker', glukoz: null, glukozIsaret: 'HI', guven: 0.9 })
    assert.deepEqual(r.oneriler, [{ tip: 'glukoz', deger: null, deger2: null, isaret: 'hi' }])
    assert.equal(fotoCevabiniCoz({ glukoz: 999, glukozIsaret: 'LO' }).oneriler[0].isaret, 'lo')
    assert.equal(fotoCevabiniCoz({ glukoz: 140, glukozBirim: 'mg/dL' }).oneriler[0].deger, 140)
  })
  it('insulin found by class AND by the names the drug table misses (NovoRapid, Tresiba, "Levemir")', () => {
    for (const ad of ['NovoRapid', 'Tresiba', 'Levemir', 'Humalog Mix', 'insülin aspart']) assert.equal(insulinVarMi([{ ad, siniflar: [] }]), true, ad)
    assert.equal(insulinVarMi([{ ad: 'Lantus', siniflar: ['İnsülin'] }]), true)
    assert.equal(insulinVarMi([{ ad: 'Metformin', siniflar: ['Antidiyabetik'] }, { ad: 'Empagliflozin', siniflar: [] }]), false)
  })
})

describe('EV-ACIL-SEKER — HI / LO stay out of the numbers', () => {
  const h = demoDurumuUygula(gunlukDemoHam(SIMDI, 'dahiliye'), 'acil')
  const d = gunlukOzeti(h)
  it('the trend average is the numeric readings only; the day carries an off-scale marker', () => {
    const d0 = gunlukOzeti({ ...h, isaretliOlcumler: [] })
    const e = d.egilimler.find((x) => x.anahtar === 'glukoz:yatmadan') || d.egilimler.find((x) => x.anahtar === 'glukoz:tokluk2')!
    const e0 = d0.egilimler.find((x) => x.anahtar === e.anahtar)!
    assert.equal(e.hafta.ort, e0.hafta.ort)
    assert.ok(d.isaretliOlcumler.length === 1 && d.sonOlcumler.some((o) => 'isaret' in o))
  })
  it('the glucose tile shows the latest numeric acil value with its level; HI counts as a reading today if today', () => {
    const k = d.olcumKartlari.find((x) => x.tip === 'glukoz')!
    assert.equal(k.son?.deger, 452); assert.equal(k.son?.seviye, 'acil')
    const bugunHi = gunlukOzeti({ ...h, isaretliOlcumler: [{ ...hi('hi'), olcumAt: SIMDI }] })
    assert.equal(bugunHi.olcumKartlari.find((x) => x.tip === 'glukoz')!.bugunSayi, k.bugunSayi + 1)
  })
  it('the open acil alert carries the symptom-check + ketone flags (insulin persona)', () => {
    const u = d.uyarilar.find((x) => x.duzey === 'acil' && !x.hastaGorduAt)!
    assert.equal(u.sekerAcil, 'yuksek'); assert.equal(u.keton, true)
  })
  it('Kontrol Öncesi Özet names HI / LO apart and never averages them', () => {
    const o = kontrolOncesiOzet({ olcumler: h.olcumler, isaretliOlcumler: h.isaretliOlcumler, planlar: h.planlar, kayitlar: h.kayitlar, uyarilar: h.uyarilar, sorular: [], esikler: etkinEsikler('genel', null), simdi: SIMDI, randevuAt: null })
    assert.deepEqual(o.isaretler && { hi: o.isaretler.hi, lo: o.isaretler.lo }, { hi: 1, lo: 0 })
    assert.match(o.metin, /HI 1 kez/); assert.match(o.metin, /ortalamaya katılmadı/)
    assert.match(o.metin, /\[uyum\].*Kritik ilaç/, 'the kritik medicine lapse is listed as adherence')
  })
  it('doctor card: the glucose metric carries the HI marker and the alert keeps isaret', () => {
    const k = evVerisiHesapla(evVerisiDemoGirdisi(SIMDI, 'dahiliye', 'acil'))
    const m = k.metrikler.find((x) => (x.isaretler || []).length)!
    assert.equal(m.isaretler![0].isaret, 'hi')
    assert.ok(k.uyarilar.some((u) => u.isaret === 'hi'))
    assert.ok(m.esik?.acilUst === 400)
  })
  it('rows → numeric + flags (a null deger never becomes 0)', () => {
    const r = olcumSatirlari([{ id: '1', tip: 'glukoz', deger: null, isaret: 'hi', baglam: 'aclik', olcum_at: SIMDI, kaynak: 'portal' }, { id: '2', tip: 'glukoz', deger: 120, isaret: null, baglam: 'aclik', olcum_at: SIMDI, kaynak: 'portal' }])
    assert.equal(r.sayisal.length, 1); assert.equal(r.sayisal[0].deger, 120)
    assert.equal(r.isaretli.length, 1); assert.equal(r.isaretli[0].isaret, 'hi')
  })
})

describe('EV-ACIL-SEKER — saving through the data layer (stand-in database)', () => {
  let db: SahteVeritabani
  const D = '00000000-0000-4000-8000-0000000000a1', P = '00000000-0000-4000-8000-0000000000b1'
  beforeEach(() => {
    db = new SahteVeritabani()
    db.ekle('patients', { id: P, doctor_id: D })
    db.ekle('users', { id: D, specialty: 'dahiliye' })
    db.ekle('ev_tercihler', { doctor_id: D, patient_id: P, paylasim_onayi: true, sessiz_bas: '23:00', sessiz_bit: '07:00', hatirlatma_acik: true })
  })
  const sb = () => db.istemci() as never
  it('a meter HI is stored as a flag (deger null) and raises one acil alert with the symptom-check flag', async () => {
    const r = await olcumKaydet(sb(), { doktorId: D, patientId: P }, { tip: 'glukoz', isaret: 'hi', baglam: 'tokluk2' }, MS) as Record<string, any>
    assert.equal(r.ok, true)
    const satir = db.tablo('ev_olcumleri')[0]
    assert.equal(satir.deger, null); assert.equal(satir.isaret, 'hi')
    assert.equal(r.uyarilar.length, 1); assert.equal(r.uyarilar[0].duzey, 'acil'); assert.equal(r.uyarilar[0].sekerAcil, 'yuksek')
    assert.equal(db.tablo('ev_uyarilar')[0].veri.isaret, 'hi')
  })
  it('a patient-added "NovoRapid" plan turns the ketone reminder on', async () => {
    db.ekle('ev_ilac_planlari', { doctor_id: D, patient_id: P, ad: 'NovoRapid', saatler: ['08:00'], gerektikce: false, aktif: true, kaynak: 'hasta', kritik: false })
    const r = await olcumKaydet(sb(), { doktorId: D, patientId: P }, { tip: 'glukoz', deger: 452, baglam: 'tokluk2' }, MS) as Record<string, any>
    assert.equal(r.uyarilar[0].keton, true)
  })
})
