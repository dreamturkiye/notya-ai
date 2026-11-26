/**
 * DOZ-KAYDI-ISTEGE-BAGLI (Kaan, 2026-11-26) — reminders are the core, logging and reminders are both optional, and an
 * unlogged dose is never shown to the doctor as "alınmadı". Pins:
 *   - unlogged slot → 'kayit_yok', never "missed" / "alınmadı" on the doctor's card, strip, summary or alert
 *   - only an explicit "Atladım" counts as a dose not taken
 *   - adherence % is null without real logging data; kritik medicines default to logging requested
 *   - Sağlık Karnesi never grades a patient who does not log
 *   - the kritik alert / patient push say "kayıt yok"
 *   - reminders off (per medicine / global) → no push; kritik off → neutral note for the doctor; before the answer →
 *     reminders on and "Hatırlatmaları kapat" on the push and the card
 *   - founder usage metrics are counts only
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import type { DozKaydi, DozPlani, EvTercihler } from './tipler'
import { VARSAYILAN_TERCIHLER } from './tipler'
import { ikiGunKacirdiMi, kayitAcikMi, slotDurumu, kayitHaritasi, uyum } from './dozPlani'
import { dozHatirlatmaMetni, dozKaydiKullanimiHesapla, dozSecimiEtkisi, etkinKayit, hastaIkiGunPushMetni, hatirlatmaAcikMi, HATIRLATMA_KAPAT_EYLEMI, kayitSorusuGosterilsinMi, kayitTercihiUygula, kritikIlacKurali } from './dozKaydi'
import { evVerisiHesapla, type EvVerisiGirdisi } from './evVerisi'
import { durumCumlesi, haftaninEksikDozlari, hatirlatmasiKapaliKritikler, ilacOzetDurumu } from './evVerisiGorunum'
import { kontrolOncesiOzet, gunlukOzeti } from './ozet'
import { karneHesapla } from './karne'
import { eksikDozlar, gunHalkalari, siradakiAdim } from './bugunGorunum'
import { planSatiri } from './sunucu'
import { gunlukDemoHam, demoDurumuUygula } from './demo'
import { dozHatirlatmalari, gunlukIsler } from './hatirlatmaCron'
import { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'
import type { PushIcerigi } from './push/webPush'
import { gunEkle, trGun, trSaatAni } from './zaman'

const SIMDI = '2026-11-24T10:00:00Z' // 13:00 Türkiye
const SIMDI_MS = Date.parse(SIMDI)
const BUGUN = trGun(SIMDI)
const plan = (o: Partial<DozPlani> = {}): DozPlani => ({ id: 'p1', ilacId: 'i1', ad: 'Metformin', doz: '1000 mg', saatler: ['08:00', '20:00'], gerektikce: false, haftaGunu: null, kaynak: 'hekim', kritik: false, minAralikSaat: null, aktif: true, baslangic: null, bitis: null, ...o })
let n = 0
const kayit = (planId: string, gunOnce: number, saat: string, durum: DozKaydi['durum']): DozKaydi => {
  const at = trSaatAni(gunEkle(BUGUN, -gunOnce), saat)
  return { id: `k${++n}`, planId, planlananAt: at, durum, kayitAt: at, erteleUntil: null }
}
const tercih = (o: Partial<EvTercihler> = {}): EvTercihler => ({ ...VARSAYILAN_TERCIHLER, paylasimOnayi: true, onayAt: SIMDI, ...o })
const kart = (planlar: DozPlani[], kayitlar: DozKaydi[], t: Partial<EvTercihler> = {}, uyarilar: EvVerisiGirdisi['uyarilar'] = []) =>
  evVerisiHesapla({ simdiMs: SIMDI_MS, brans: 'dahiliye', gebelikAktif: false, tercih: tercih(t), hekimAyarHam: null, olcumler: [], planlar, kayitlar, uyarilar, kontrolOzeti: null, sorular: [] })
const metinleri = (v: unknown) => JSON.stringify(v)

describe('unlogged ≠ missed (doctor side)', () => {
  it('a slot with no record after its window is kayit_yok — never kacirildi', () => {
    assert.equal(slotDurumu('p1', trSaatAni(gunEkle(BUGUN, -1), '08:00'), kayitHaritasi([]), SIMDI), 'kayit_yok')
  })
  it('reminder-only patient with no marks: no %, "Hasta doz kaydı tutmuyor", nothing says "alınmadı" or "düşük"', () => {
    const v = kart([plan()], [])
    assert.equal(v.uyum.kayitTutan, false)
    assert.equal(v.uyum.hafta.yuzde, null)
    assert.deepEqual(ilacOzetDurumu(v), { tur: 'tutmuyor' })
    assert.equal(haftaninEksikDozlari(v).toplam, 0)
    const c = durumCumlesi(v, SIMDI_MS)
    assert.equal(c.ton, 'sakin')
    assert.doesNotMatch(c.baslik + c.alt, /alınmadı|düşük|%0/)
    assert.match(c.alt, /hasta doz kaydı tutmuyor/)
    assert.ok(v.uyum.ilaclar[0].gunler.slice(0, 13).every((g) => g === 'kayit_yok'), 'strip: kayıt yok, not alınmadı')
  })
  it('logging patient who has not marked this week: "Kayıt yok", still no "alınmadı"', () => {
    const v = kart([plan({ kayitTutma: 'acik' })], [])
    assert.deepEqual(ilacOzetDurumu(v), { tur: 'kayit_yok' })
    assert.doesNotMatch(metinleri(durumCumlesi(v, SIMDI_MS)), /alınmadı|düşük/)
  })
  it('the pre-visit summary never prints a fake 0 %', () => {
    const oz = kontrolOncesiOzet({ olcumler: [], planlar: [plan()], kayitlar: [], uyarilar: [], sorular: [], esikler: {}, simdi: SIMDI, randevuAt: null })
    assert.match(oz.metin, /Hasta doz kaydı tutmuyor/)
    assert.doesNotMatch(oz.metin, /%0|alınmadı/)
    const oz2 = kontrolOncesiOzet({ olcumler: [], planlar: [plan()], kayitVarsayilan: 'acik', kayitlar: [], uyarilar: [], sorular: [], esikler: {}, simdi: SIMDI, randevuAt: null })
    assert.match(oz2.metin, /İlaç uyumu: Kayıt yok/)
  })
})

describe('explicit "Atladım" counts', () => {
  it('logged medicine: taken ÷ (taken + Atladım); "N doz alınmadı" = Atladım only', () => {
    const p = plan({ kayitTutma: 'acik' })
    const k = [kayit('p1', 1, '08:00', 'atlandi'), kayit('p1', 1, '20:00', 'atlandi'), kayit('p1', 2, '08:00', 'alindi')] // 2-day-ago 20:00 unmarked
    const v = kart([p], k)
    assert.deepEqual(v.uyum.hafta, { alinan: 1, beklenen: 3, yuzde: 33 })
    assert.equal(haftaninEksikDozlari(v).toplam, 2)
    const c = durumCumlesi(v, SIMDI_MS)
    assert.equal(c.ton, 'uyum')
    assert.match(c.alt, /^2 doz alınmadı \(hasta “Atladım” işaretledi\)/)
    assert.equal(v.uyum.ilaclar[0].gunler[12], 'alinmadi') // yesterday: both skipped
  })
  it('two days of explicit skips raise the rule even for a reminder-only medicine; silence alone never does', () => {
    const p = plan()
    assert.equal(ikiGunKacirdiMi(p, [], SIMDI), null)
    assert.equal(ikiGunKacirdiMi(p, [kayit('p1', 1, '08:00', 'atlandi'), kayit('p1', 2, '20:00', 'atlandi')], SIMDI), 'atlandi')
  })
})

describe('uyum null without logging · kritik default', () => {
  it('a reminder-only medicine is never graded, even when it carries marks', () => {
    assert.equal(uyum([plan()], [kayit('p1', 1, '08:00', 'alindi')], gunEkle(BUGUN, -1), BUGUN, SIMDI).yuzde, null)
    assert.equal(uyum([plan({ kayitTutma: 'acik' })], [kayit('p1', 1, '08:00', 'alindi')], gunEkle(BUGUN, -1), BUGUN, SIMDI).yuzde, 100)
  })
  it('a doctor-flagged kritik medicine defaults to logging requested; the patient\'s own choice wins', () => {
    assert.equal(etkinKayit(null, true, null), true)
    assert.equal(etkinKayit(null, true, 'kapali'), true)
    assert.equal(etkinKayit('kapali', true, 'acik'), false)
    assert.equal(etkinKayit(null, false, null), false) // unanswered → reminder only
    assert.equal(etkinKayit(null, false, 'acik'), true)
    assert.equal(kayitAcikMi(planSatiri({ id: 'x', ad: 'Varfarin', kritik: true, saatler: ['20:00'] })), true)
    assert.equal(kayitAcikMi(planSatiri({ id: 'x', ad: 'Varfarin', kritik: true, kayit_tutma: 'kapali', saatler: ['20:00'] })), false)
    const [a, b] = kayitTercihiUygula([plan({ id: 'a', kritik: true }), plan({ id: 'b' })], 'kapali')
    assert.equal(a.kayitAcik, true); assert.equal(b.kayitAcik, false)
  })
})

describe('patient side', () => {
  const ham = (durum: string | null) => demoDurumuUygula(gunlukDemoHam(SIMDI, 'dahiliye'), durum)
  it('Karne: no İlaç uyumu subject for a patient who does not log — never a low grade', () => {
    const k = karneHesapla({ olcumler: [], planlar: [plan()], kayitlar: [], esikler: {}, olcumTipleri: [], gunlukHedef: {}, aktifGunler: new Set(), ilkGun: null, simdi: SIMDI }, 'hafta')
    assert.ok(!k.dersler.some((d) => d.anahtar === 'uyum'))
    const k2 = karneHesapla({ olcumler: [], planlar: [plan({ kayitTutma: 'acik' })], kayitlar: [], esikler: {}, olcumTipleri: [], gunlukHedef: {}, aktifGunler: new Set(), ilkGun: null, simdi: SIMDI }, 'hafta')
    const u = k2.dersler.find((d) => d.anahtar === 'uyum')!
    assert.equal(u.not, null); assert.equal(u.yuzde, null)
  })
  it('reminder-only patient: no İlaç ring, no "fix this" rows, next dose without "Aldım"', () => {
    const d = gunlukOzeti(ham('hatirlatma'))
    assert.equal(d.kayit.kayitliIlac, 0)
    assert.ok(!gunHalkalari(d).some((h) => h.anahtar === 'ilac'))
    assert.equal(eksikDozlar(d).length, 0)
    assert.equal(d.hafta.planlar.length, 0)
    const a = siradakiAdim(d, SIMDI_MS)
    if (a.tur === 'doz') assert.deepEqual(a.kayitPlanIds, [])
    assert.ok(!d.karne.hafta.dersler.some((x) => x.anahtar === 'uyum'))
  })
  it('logging patient keeps the ring and the one-tap group "Aldım"', () => {
    const d = gunlukOzeti(ham(null))
    assert.ok(gunHalkalari(d).some((h) => h.anahtar === 'ilac'))
    assert.ok(d.kayit.kayitliIlac > 0)
  })
  it('the one-time question shows only while unanswered, and closes on any answer or on reminders switched off', () => {
    assert.equal(gunlukOzeti(ham('secim')).kayit.soruGoster, true)
    assert.equal(gunlukOzeti(ham(null)).kayit.soruGoster, false)
    assert.equal(kayitSorusuGosterilsinMi([plan()], { dozKaydi: null, dozSecimi: null, hatirlatmaAcik: false }), false)
    assert.deepEqual(dozSecimiEtkisi('hatirlat_isaretle'), { dozKaydi: 'acik', hatirlatmaAcik: true })
    assert.deepEqual(dozSecimiEtkisi('sadece_hatirlat'), { dozKaydi: 'kapali', hatirlatmaAcik: true })
    assert.deepEqual(dozSecimiEtkisi('istemiyorum'), { dozKaydi: 'kapali', hatirlatmaAcik: false })
  })
})

describe('texts say "kayıt yok"', () => {
  it('kritik alert: doctor + patient text, card sentence', () => {
    const k = kritikIlacKurali({ id: 'p1', ad: 'Varfarin' }, 'kayit_yok')
    assert.match(k.hekimMetni, /2 gündür kayıt yok/); assert.match(k.hastaMetni, /iki gündür kayıt yok/)
    for (const m of [k.hekimMetni, k.hastaMetni]) assert.doesNotMatch(m, /almadı|alınmadı|işaretlenmedi/)
    assert.equal(k.veri.neden, 'kayit_yok')
    const v = kart([plan({ kritik: true })], [], {}, [{ id: 'u1', kural: k.kural, anahtar: k.anahtar, duzey: k.duzey, metrik: k.metrik, hastaMetni: k.hastaMetni, hekimMetni: k.hekimMetni, olusturmaAt: SIMDI, hastaGorduAt: null, hekimGorduAt: null, veri: k.veri }])
    assert.equal(durumCumlesi(v, SIMDI_MS).baslik, 'Kritik ilaç: 2 gündür kayıt yok')
    assert.match(kritikIlacKurali({ id: 'p1', ad: 'Varfarin' }, 'atlandi').hekimMetni, /“?"?Atladım/)
  })
  it('patient pushes: "kayıt yok", no drug name; reminder-only push does not ask to mark', () => {
    assert.match(hastaIkiGunPushMetni(1), /kayıt yok/)
    assert.doesNotMatch(dozHatirlatmaMetni({ saat: '08:00', sayi: 1, kayitli: 0, ertele: false }).govde, /Aldım/)
    assert.match(dozHatirlatmaMetni({ saat: '08:00', sayi: 2, kayitli: 1, ertele: false }).govde, /Aldım/)
  })
})

describe('reminders optional (stand-in database)', () => {
  let db: SahteVeritabani
  let giden: Array<{ endpoint: string; icerik: PushIcerigi }>
  const D = 'doktor-a', H = 'hasta-a'
  const gonder = async (a: { endpoint: string }, icerik: PushIcerigi) => { giden.push({ endpoint: a.endpoint, icerik }); return { ok: true as const } }
  const sb = () => db.istemci() as never
  const SAAT08 = Date.parse('2026-11-24T05:05:00Z') // 08:05 TR
  beforeEach(() => {
    db = new SahteVeritabani(); giden = []
    db.ekle('ev_push_abonelikleri', { doctor_id: D, patient_id: H, endpoint: 'https://fcm.googleapis.com/a', p256dh: 'x', auth: 'y' })
    db.ekle('ev_ilac_planlari', { doctor_id: D, patient_id: H, ad: 'Ramipril', saatler: ['08:00'], gerektikce: false, aktif: true, kaynak: 'hekim', kritik: true, hatirlatma_acik: true })
    db.ekle('ev_ilac_planlari', { doctor_id: D, patient_id: H, ad: 'Amlodipin', saatler: ['08:00'], gerektikce: false, aktif: true, kaynak: 'hekim', kritik: false, hatirlatma_acik: true })
  })
  it('default before the answer: reminders on, and the push carries "Hatırlatmaları kapat"', async () => {
    await dozHatirlatmalari(sb(), gonder, SAAT08)
    assert.equal(giden.length, 1)
    assert.deepEqual(giden[0].icerik.eylemler, [HATIRLATMA_KAPAT_EYLEMI])
    assert.match(giden[0].icerik.govde, /2 ilacınız/)
  })
  it('after the answer the action is gone', async () => {
    db.ekle('ev_tercihler', { doctor_id: D, patient_id: H, hatirlatma_acik: true, doz_secimi: 'sadece_hatirlat', doz_kaydi: 'kapali', sessiz_bas: '23:00', sessiz_bit: '07:00' })
    await dozHatirlatmalari(sb(), gonder, SAAT08)
    assert.equal(giden.length, 1); assert.equal(giden[0].icerik.eylemler, undefined)
  })
  it('one medicine switched off → no push for it; the other still reminds', async () => {
    db.tablo('ev_ilac_planlari').find((p) => p.ad === 'Amlodipin')!.hatirlatma_acik = false
    await dozHatirlatmalari(sb(), gonder, SAAT08)
    assert.equal(giden.length, 1); assert.match(giden[0].icerik.govde, /^İlacınızın zamanı geldi/)
    db.tablo('ev_ilac_planlari').find((p) => p.ad === 'Ramipril')!.hatirlatma_acik = false
    giden = []
    const r = await dozHatirlatmalari(sb(), gonder, SAAT08 + 2 * 60_000)
    assert.equal(r.aday, 0); assert.equal(giden.length, 0)
  })
  it('global switch off ("Hatırlatma istemiyorum") → no push at all, and no two-day nudge; the plan is kept', async () => {
    db.ekle('ev_tercihler', { doctor_id: D, patient_id: H, hatirlatma_acik: false, doz_secimi: 'istemiyorum', doz_kaydi: 'kapali', paylasim_onayi: true, sessiz_bas: '23:00', sessiz_bit: '07:00' })
    await dozHatirlatmalari(sb(), gonder, SAAT08)
    await gunlukIsler(sb(), gonder, Date.parse('2026-11-24T09:10:00Z'))
    assert.equal(giden.length, 0)
    assert.equal(db.tablo('ev_ilac_planlari').filter((p) => p.aktif).length, 2)
  })
  it('kritik medicine with its reminder off: no patient nudge, but the doctor still gets "2 gündür kayıt yok"', async () => {
    db.ekle('ev_tercihler', { doctor_id: D, patient_id: H, hatirlatma_acik: true, paylasim_onayi: true, sessiz_bas: '23:00', sessiz_bit: '07:00' })
    db.tablo('ev_ilac_planlari').find((p) => p.ad === 'Ramipril')!.hatirlatma_acik = false
    const r = await gunlukIsler(sb(), gonder, Date.parse('2026-11-24T09:10:00Z'))
    assert.equal(r.kritik, 1); assert.equal(giden.length, 0)
    const u = db.tablo('ev_uyarilar')[0]
    assert.match(String(u.hekim_metni), /2 gündür kayıt yok/); assert.equal((u.veri as { neden: string }).neden, 'kayit_yok')
  })
  it('kritik off → the doctor\'s card shows the neutral note (consented only)', () => {
    const p = plan({ id: 'r', ad: 'Ramipril', kritik: true, hatirlatmaAcik: false })
    assert.deepEqual(hatirlatmasiKapaliKritikler(kart([p], [])), ['Ramipril'])
    assert.deepEqual(hatirlatmasiKapaliKritikler(kart([plan({ id: 'r', ad: 'Ramipril', kritik: true })], [], { hatirlatmaAcik: false })), ['Ramipril'])
    assert.deepEqual(hatirlatmasiKapaliKritikler(kart([p], [], { paylasimOnayi: false })), [])
    assert.equal(hatirlatmaAcikMi({}, null), true)
  })
})

describe('founder usage metrics', () => {
  it('counts only — no id leaves; options, logging and reminders-off are counted', () => {
    const r = dozKaydiKullanimiHesapla({
      planlar: [
        { doctor_id: 'd', patient_id: 'h1', kritik: true, kayit_tutma: null, hatirlatma_acik: false },
        { doctor_id: 'd', patient_id: 'h1', kritik: false, kayit_tutma: null },
        { doctor_id: 'd', patient_id: 'h2', kritik: false, kayit_tutma: null },
      ],
      tercihler: [{ doctor_id: 'd', patient_id: 'h2', doz_kaydi: 'kapali', doz_secimi: 'istemiyorum', hatirlatma_acik: false }],
      kayitlar: [{ doctor_id: 'd', patient_id: 'h1', durum: 'alindi', kayit_at: SIMDI }, { doctor_id: 'd', patient_id: 'h1', durum: 'atlandi', kayit_at: SIMDI }],
      ilkKayit: SIMDI, simdiMs: SIMDI_MS,
    })
    assert.equal(r.hastaSayisi, 2); assert.equal(r.kayitTutanHasta, 1)
    assert.deepEqual(r.secim, { hatirlat_isaretle: 0, sadece_hatirlat: 0, istemiyorum: 1, secilmedi: 1 })
    assert.deepEqual(r.hatirlatma, { globalKapali: 1, ilacKapaliHasta: 1, ilacKapali: 1, kritikKapali: 1 })
    const son = r.haftalar[r.haftalar.length - 1]
    assert.equal(son.alindi, 1); assert.equal(son.atlandi, 1); assert.equal(son.isaretleyenHasta, 1)
    assert.doesNotMatch(JSON.stringify(r), /"h1"|"h2"|"d"/)
  })
})
