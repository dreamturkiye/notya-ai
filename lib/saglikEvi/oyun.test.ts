/**
 * HASTA-PORTALI-GUNLUK — gamification: streak with kalkan (freezes), badge unlocks + applicability, karne grades (never
 * punishing), the composed Bugün state (rings, next dose, smart context prefill, no doctor text to the patient), and the
 * per-branş configuration for all 30 branches + 10 Özel Branşlar (brans-alan-sizmasi gates).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { DozKaydi, DozPlani, EvOlcum } from './tipler'
import { seriHesapla } from './seri'
import { rozetDurumlari, uygunRozetler, ROZETLER } from './rozetler'
import { karneHesapla, notVer } from './karne'
import { gunlukOzeti, kontrolOncesiOzet } from './ozet'
import { gunlukDemoHam, evVerisiDemoGirdisi } from './demo'
import { evVerisiHesapla } from './evVerisi'
import { hastaModulleri } from './moduller'
import { bransGunlukAyari, hedefProfili, OZEL_BRANS_AYARLARI, TIBBI_BRANS_AYARLARI } from './bransAyari'
import { onerilenBaglam, olcumDogrula, saateGoreBaglam } from './olcumler'
import { varsayilanEsikler } from './hedefler'
import { KLINIK_YENI_SLUGS } from '@/lib/specialties/klinikDikey'
import { gunEkle, trGun, trSaatAni } from './zaman'

const SIMDI = '2026-11-24T10:00:00Z'
const BUGUN = trGun(SIMDI)
const gunler = (...onceler: number[]) => onceler.map((i) => gunEkle(BUGUN, -i))
const ardisik = (bas: number, bit: number) => Array.from({ length: bas - bit + 1 }, (_, i) => gunEkle(BUGUN, -(bas - i)))

describe('seri + kalkan', () => {
  it('counts consecutive days; today not logged yet does not break it', () => {
    assert.equal(seriHesapla(ardisik(5, 1), BUGUN).seri, 5)
    assert.equal(seriHesapla(ardisik(5, 0), BUGUN).seri, 6)
    assert.equal(seriHesapla([], BUGUN).seri, 0)
  })
  it('7 consecutive days earn a kalkan; a missed day spends it and the streak survives', () => {
    const r = seriHesapla([...ardisik(15, 9), ...ardisik(7, 0)], BUGUN) // day 8 missed
    assert.equal(r.kalkanKazanildi, true); assert.deepEqual(r.kalkanGunleri, gunler(8)); assert.equal(r.seri, 15)
  })
  it('a miss without a kalkan restarts quietly; the best streak is kept', () => {
    const r = seriHesapla([...ardisik(10, 6), ...ardisik(3, 0)], BUGUN) // 5 days, gap of 2, 4 days
    assert.equal(r.seri, 4); assert.equal(r.enUzun, 5); assert.equal(r.kalkan, 0)
  })
  it('kalkan is capped at 2', () => {
    assert.equal(seriHesapla(ardisik(40, 0), BUGUN).kalkan, 2)
  })
})

const plan = (o: Partial<DozPlani> = {}): DozPlani => ({ id: 'p1', ilacId: null, ad: 'A', doz: null, saatler: ['08:00'], gerektikce: false, haftaGunu: null, kaynak: 'hekim', kritik: false, minAralikSaat: null, aktif: true, baslangic: null, bitis: null, ...o })
let n = 0
const olc = (tip: EvOlcum['tip'], gunOnce: number, saat: string, deger: number, deger2: number | null = null, baglam: EvOlcum['baglam'] = null): EvOlcum => ({ id: `o${++n}`, tip, deger, deger2, baglam, olcumAt: trSaatAni(gunEkle(BUGUN, -gunOnce), saat), kaynak: 'portal' })

describe('rozetler', () => {
  const temel = { olcumler: [] as EvOlcum[], toplamOlcum: 0, fotoOlcum: 0, planlar: [] as DozPlani[], kayitlar: [] as DozKaydi[], esikler: varsayilanEsikler(), olcumTipleri: ['kb', 'glukoz'] as EvOlcum['tip'][], gunlukHedef: { kb: 2, glukoz: 2 } as Partial<Record<EvOlcum['tip'], number>>, seri: { enUzun: 0, kalkanKazanildi: false }, aktifGunSayisi: 0, simdi: SIMDI }
  const durum = (g: Partial<typeof temel>) => Object.fromEntries(rozetDurumlari({ ...temel, ...g }).map((r) => [r.id, r]))
  it('count and streak badges unlock at their thresholds, with progress before', () => {
    const d = durum({ toplamOlcum: 99, aktifGunSayisi: 3, seri: { enUzun: 7, kalkanKazanildi: true } })
    assert.equal(d['ilk-adim'].kazanildi, true); assert.equal(d['seri-7'].kazanildi, true); assert.equal(d['seri-30'].kazanildi, false); assert.equal(d['seri-30'].deger, 7)
    assert.equal(d['olcum-25'].kazanildi, true); assert.equal(d['olcum-100'].kazanildi, false); assert.equal(d['olcum-100'].deger, 99)
    assert.equal(d['seri-kalkani'].kazanildi, true)
  })
  it('Şeker Ustası needs açlık AND tokluk on the same day, 14 days', () => {
    const l: EvOlcum[] = []
    for (let i = 0; i < 14; i++) { l.push(olc('glukoz', i, '07:30', 110, null, 'aclik')); if (i < 13) l.push(olc('glukoz', i, '14:30', 140, null, 'tokluk2')) }
    assert.equal(durum({ olcumler: l })['seker-ustasi'].deger, 13)
    l.push(olc('glukoz', 13, '14:30', 140, null, 'tokluk2'))
    assert.equal(durum({ olcumler: l })['seker-ustasi'].kazanildi, true)
  })
  it('Tansiyon Takipçisi: morning + evening BP for 7 consecutive days (ESH home protocol)', () => {
    const l: EvOlcum[] = []
    for (let i = 1; i <= 7; i++) { l.push(olc('kb', i, '07:30', 125, 80)); l.push(olc('kb', i, '21:00', 122, 78)) }
    assert.equal(durum({ olcumler: l })['tansiyon-takipcisi'].kazanildi, true)
    assert.equal(durum({ olcumler: l.filter((x) => !x.olcumAt.includes(gunEkle(BUGUN, -4))) })['tansiyon-takipcisi'].kazanildi, false)
  })
  it('Hedefte Bir Hafta counts recorded readings in range — 7 days', () => {
    const l = ardisik(7, 1).map((_, i) => olc('kb', i + 1, '08:00', 124, 78))
    assert.equal(durum({ olcumler: l })['hedefte-hafta'].kazanildi, true)
  })
  it('Uyum Haftası: ≥90 % of a week\'s doses taken', () => {
    const p = plan()
    const k: DozKaydi[] = ardisik(7, 1).map((g, i) => ({ id: `k${i}`, planId: 'p1', planlananAt: trSaatAni(g, '08:00'), durum: 'alindi', kayitAt: trSaatAni(g, '08:10'), erteleUntil: null }))
    const d = durum({ planlar: [p], kayitlar: k })
    assert.equal(d['uyum-haftasi'].kazanildi, true); assert.equal(d['sabah-duzeni'].kazanildi, true)
    assert.equal(d['tam-gun'].kazanildi, false) // the daily measurement goal (kb 2, glukoz 2) was not met
    assert.equal(durum({ planlar: [p], kayitlar: k, gunlukHedef: {} })['tam-gun'].kazanildi, true)
  })
  it('only applicable badges are offered (no glucose badge without glucose, no adherence badge without a plan)', () => {
    const ids = uygunRozetler({ olcumTipleri: ['kilo'], planlar: [] }).map((r) => r.id)
    assert.ok(!ids.includes('seker-ustasi') && !ids.includes('tansiyon-takipcisi') && !ids.includes('uyum-haftasi') && !ids.includes('sabah-duzeni'))
    assert.ok(ids.includes('seri-7') && ids.includes('olcum-25'))
  })
  it('badge texts celebrate habits, never a medical result', () => {
    for (const r of ROZETLER) assert.doesNotMatch(`${r.ad} ${r.aciklama} ${r.kosul}`.toLocaleLowerCase('tr-TR'), /iyileşti|düzeldi|tedavi başarı|kontrol altında|normale döndü/)
    assert.match(ROZETLER.find((r) => r.id === 'hedefte-hafta')!.aciklama, /doktorunuz/)
  })
})

describe('karne', () => {
  it('grades follow the Turkish karne bands and never fail', () => {
    assert.deepEqual([95, 80, 65, 45, 10].map((x) => notVer(x).ad), ['Pekiyi', 'İyi', 'Orta', 'Geçer', 'Yolun başında'])
  })
  it('subjects without data say so instead of showing zero', () => {
    const k = karneHesapla({ olcumler: [], planlar: [], kayitlar: [], esikler: varsayilanEsikler(), olcumTipleri: [], gunlukHedef: {}, aktifGunler: new Set(), ilkGun: null, simdi: SIMDI }, 'hafta')
    assert.ok(k.dersler.every((d) => d.yuzde === null && d.not === null))
    assert.equal(k.gunler.length, 7)
  })
  it('weekly karne of the demo patient has all three grades', () => {
    const d = gunlukOzeti(gunlukDemoHam(SIMDI))
    assert.ok(d.karne.hafta.dersler.every((x) => x.not != null), JSON.stringify(d.karne.hafta.dersler))
    assert.equal(d.karne.ay.gunler.length, 30)
  })
})

describe('Bugün durumu (composer)', () => {
  const d = gunlukOzeti(gunlukDemoHam(SIMDI))
  it('rings, dial markers and the next dose group', () => {
    assert.equal(d.halkalar.ilac.toplam, 6); assert.ok(d.halkalar.olcum.toplam >= 4)
    assert.ok(d.kadran.some((k) => k.tur === 'doz') && d.kadran.some((k) => k.tur === 'olcum'))
    assert.equal(d.siradaki?.saat, '20:00'); assert.deepEqual([...(d.siradaki?.adlar || [])].sort(), ['Amlodipin', 'Metformin'])
  })
  it('the trend alert of the design persona reaches the patient view — patient text only', () => {
    assert.ok(d.uyarilar.some((u) => u.metrik === 'glukoz:tokluk2' && u.duzey === 'hekime_bildir'))
    assert.ok(d.uyarilar.every((u) => !('hekimMetni' in u)))
  })
  it('glucose context is pre-selected from habit; prefill is the last value of that context', () => {
    const k = gunlukOzeti(gunlukDemoHam('2026-11-24T10:30:00Z')).olcumKartlari.find((x) => x.tip === 'glukoz')!
    assert.equal(k.onBaglam, 'tokluk2') // 13:30 TR: the patient measures after lunch (14:35) every day
    assert.ok(k.onDeger >= 150)
  })
  it('time-of-day defaults without history; validation guards typos and swapped BP', () => {
    assert.equal(saateGoreBaglam(7 * 60), 'aclik'); assert.equal(saateGoreBaglam(15 * 60), 'tokluk2'); assert.equal(saateGoreBaglam(23 * 60), 'yatmadan')
    assert.equal(onerilenBaglam([], SIMDI), saateGoreBaglam(13 * 60))
    assert.equal(olcumDogrula({ tip: 'kb', deger: 80, deger2: 120 }).ok, false)
    assert.equal(olcumDogrula({ tip: 'glukoz', deger: 1100 }).ok, false)
    assert.deepEqual(olcumDogrula({ tip: 'ates', deger: '37,46' }), { ok: true, tip: 'ates', deger: 37.5, deger2: null, baglam: null })
  })
  it('Kontrol Öncesi Özet: 4 weeks, adherence, alerts and the patient question in one text', () => {
    const g = evVerisiDemoGirdisi(SIMDI)
    const o = kontrolOncesiOzet({ olcumler: g.olcumler, planlar: g.planlar, kayitlar: g.kayitlar, uyarilar: g.uyarilar, sorular: g.sorular.map((s) => ({ metin: s.metin, createdAt: s.tarih })), esikler: varsayilanEsikler(), simdi: SIMDI, randevuAt: null })
    assert.match(o.metin, /son 4 hafta/); assert.match(o.metin, /Tokluk 2\. saat/); assert.match(o.metin, /İlaç uyumu/); assert.match(o.metin, /Metformin/); assert.match(o.metin, /Hastanın soruları/)
    assert.equal(o.donemBas, gunEkle(BUGUN, -27))
  })
  it('Ev verisi card: without consent no home data at all', () => {
    const g = evVerisiDemoGirdisi(SIMDI)
    const acik = evVerisiHesapla(g)
    assert.ok(acik.metrikler.length > 0 && acik.uyarilar.length > 0)
    const kapali = evVerisiHesapla({ ...g, tercih: { ...g.tercih, paylasimOnayi: false } })
    assert.deepEqual([kapali.metrikler.length, kapali.uyarilar.length, kapali.sorular.length, kapali.uyum.ilaclar.length], [0, 0, 0, 0])
    assert.equal(kapali.kullaniyor, true)
  })
})

describe('branş ayarı — 30 branş + 10 Özel Branşlar, sızıntı yok', () => {
  const kaynak = readFileSync(join(__dirname, '../doktor/specialties.ts'), 'utf8')
  const tibbi = [...kaynak.matchAll(/\{ key: "([a-z-]+)"/g)].map((m) => m[1])
  it('every medical branch and every Özel Branş has its own config (core: nobody is left out)', () => {
    assert.equal(tibbi.length, 30)
    for (const b of tibbi) assert.ok(TIBBI_BRANS_AYARLARI[b], `config missing: ${b}`)
    assert.equal(KLINIK_YENI_SLUGS.length, 10)
    for (const k of KLINIK_YENI_SLUGS) assert.ok(OZEL_BRANS_AYARLARI[k], `config missing: ${k}`)
  })
  it('free-text specialties resolve (labels, Özel Branş slugs); unknown → general default', () => {
    assert.equal(bransGunlukAyari('İç Hastalıkları').anahtar, 'dahiliye')
    assert.equal(bransGunlukAyari('diyetisyen').anahtar, 'diyetisyen')
    assert.equal(bransGunlukAyari(null).anahtar, 'genel')
  })
  it('defaults per brief: cardiometabolic BP+glucose, pediatri fever, KD BP+weight, diyetisyen weight/waist/water, derm/KBB adherence', () => {
    for (const b of ['dahiliye', 'endokrinoloji', 'kardiyoloji']) { const a = TIBBI_BRANS_AYARLARI[b]; assert.ok(a.olcumler.includes('kb') && a.olcumler.includes('glukoz') && a.kartlar.includes('ldl')) }
    assert.deepEqual(TIBBI_BRANS_AYARLARI.pediatri.olcumler, ['ates', 'kilo'])
    assert.deepEqual(TIBBI_BRANS_AYARLARI['kadin-hastaliklari-dogum'].olcumler, ['kb', 'kilo'])
    assert.deepEqual(OZEL_BRANS_AYARLARI.diyetisyen.olcumler, ['kilo', 'bel', 'su'])
    for (const b of ['dermatoloji', 'kulak-burun-bogaz']) assert.equal(TIBBI_BRANS_AYARLARI[b].vurgu, 'uyum')
  })
  it('brans-alan-sizmasi: the fever-medicine card only in pediatri / çocuk cerrahisi; LDL only cardiometabolic; pregnancy thresholds only KD with an active pregnancy', () => {
    const tum = { ...TIBBI_BRANS_AYARLARI, ...OZEL_BRANS_AYARLARI }
    assert.deepEqual(Object.entries(tum).filter(([, a]) => a.kartlar.includes('ates_ilac')).map(([k]) => k).sort(), ['cocuk-cerrahisi', 'pediatri'])
    assert.deepEqual(Object.entries(tum).filter(([, a]) => a.kartlar.includes('ldl')).map(([k]) => k).sort(), ['aile-hekimligi', 'dahiliye', 'endokrinoloji', 'kardiyoloji', 'longevity', 'nefroloji'])
    assert.equal(hedefProfili('kadin-hastaliklari-dogum', true), 'gebelik')
    assert.equal(hedefProfili('kadin-hastaliklari-dogum', false), 'genel')
    assert.equal(hedefProfili('dahiliye', true), 'genel')
  })
  it('the doctor can add / remove kinds per patient (older olcumler / kapali fields read as switches — HASTA-MODULLERI)', () => {
    const m = (b: string, hekim: Record<string, unknown>) => hastaModulleri({ bransAnahtar: b, ayar: TIBBI_BRANS_AYARLARI[b], hekim }).olcumler
    assert.deepEqual(m('dermatoloji', { olcumler: ['kilo'] }), ['kilo'])
    // a kind the patient logged without an active module no longer brings its tile back (it is stored, not prompted)
    assert.deepEqual(m('dahiliye', { kapali: ['nabiz'] }), ['kb', 'glukoz', 'kilo'])
  })
  it('a pediatri patient\'s Bugün shows the as-needed fever medicine with the doctor\'s interval', () => {
    const d = gunlukOzeti(gunlukDemoHam(SIMDI, 'pediatri'))
    assert.ok(d.kartlar.includes('ates_ilac'))
    assert.equal(d.gerektikce[0]?.minAralikSaat, 6)
    assert.ok(!d.olcumKartlari.some((k) => k.tip === 'glukoz'))
  })
})
