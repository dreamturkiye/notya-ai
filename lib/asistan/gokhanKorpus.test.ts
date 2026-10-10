/**
 * NOTYA-GOKHAN-KORPUS-01 — the complaint corpus, its loader, its assertion helpers, its fixture and its runner.
 *
 * What is proved here, without a model:
 *   • every entry has a source that EXISTS, the source id is found in it, and the sentence is found in it too —
 *     unless the entry says it is derived (`turetilmis`) and explains how. Nothing is invented.
 *   • ids are unique; sessions are contiguous; patterns compile; no real patient name is repeated.
 *   • the assertion helpers grade each part (text, route, tool, card, patient, refusal) and treat a stand-in
 *     answer as "not judged" instead of a pass.
 *   • the synthetic charts hold what the assertions quote.
 *   • the runner drives all three real routes with a stand-in for OpenRouter and records what happened.
 * What Luna answers is measured by `npm run denetim:korpus`, not here.
 */
import { gercekModelAc, sahneHazirla } from './tests/ayseSahne'
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { EYLEM_CUMLELERI, vekilOpenRouter } from './tests/eylemDenetimi'
import { GERCEKCI_HASTA_ADI } from './tests/gercekciHasta'
import { HASTA_ESLEME, KORPUS_ADLARI, KORPUS_AYSE, KORPUS_KIMLIK_DEGERLERI, KORPUS_TARIK, PANEL_SAYISI, YABANCI_HASTALAR, korpusDosyasiYaz } from './tests/gokhanKorpusHastalari'
import { fiksturTarihleri, kaliteBolumu, korpusRaporu, korpusuKos, ozetle, type KorpusSatiri } from './tests/gokhanKorpusKosucu'
import {
  ALTIN_ON_EKI, GOKHAN_SIKAYET_KORPUSU, KAPSAM_DISI_SIKAYETLER, KAPSAM_RED_BASI, KORPUS_KAYNAKLARI, KORPUS_PANEL_SAYISI,
  beklentiDegerlendir, kaliteGirdisiKur, korpusBaglami, korpusDenetle, korpusYukle, oturumlaraBol, tarihDeseni, yerlestir, yuzeyBeklentisi,
  type Beklenti, type KorpusGirdisi, type TurGozlemi,
} from './tests/gokhanSikayetKorpusu'
import { KORPUS_BEBEK, KORPUS_BEBEK_ADI, KORPUS_ERISKIN, KORPUS_GEC_GIRIS, KORPUS_GEC_GIRIS_ADI, DENETIM_BUGUN, korpusBebek, korpusBebekDogum, korpusEriskin, korpusGecGiris, korpusGecGirisDogum } from './dosyaSorgu/denetim/fikstur'
import { SahteVeritabani } from '../security/testing/sahteSupabase'
import { olaylariKur, hastaKur } from '@/lib/doktor/dosyaOlaylari'
import { kayitCevabi, kayitIstegiBul } from './kayitTablosu'
import { kanitBlogu } from './dosyaSorgu/kanit'
import { KAPSAM_RED } from './kapsamRed'
import { aracZorlamaKapali } from './ayseCevapla'

const KOK = process.cwd()
const oku = (dosya: string) => fs.readFileSync(path.join(KOK, dosya), 'utf8')
/** Source text as written: escaped quotes and \uXXXX letters decoded, typographic apostrophes and white space folded. */
const duz = (s: string) => s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16))).replace(/\\'/g, "'").replace(/[’‘]/g, "'").replace(/\s+/g, ' ')

/** Word stems of the synthetic names (and of their mis-heard forms) — the only words a sentence may differ in from its source. */
const AD_KOKLERI = ['emircan', 'emirçan', 'emircn', 'emirhan', 'karaoğlu', 'karaoglu', 'kara', 'oğlu', 'bozkurt', 'tarık', 'tarik', 'taırk', 'özdemir', 'ozdemir', 'olcay', 'santoro', 'santor', 'selim', 'erkoç', 'kemal', 'sarıtaş']
const adMi = (kelime: string) => { const k = kelime.toLocaleLowerCase('tr-TR').replace(/^[^\p{L}]+/u, ''); return AD_KOKLERI.some((a) => k.startsWith(a)) }
const kacis = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** The sentence as a pattern in which every synthetic-name word stands for "some name" (one to three words). */
function adsizDesen(cumle: string): RegExp {
  const parca: string[] = []
  for (const k of duz(cumle).trim().split(' ')) {
    if (!adMi(k)) parca.push(kacis(k))
    else if (parca[parca.length - 1] !== '\u0000') parca.push('\u0000')
  }
  return new RegExp(parca.map((p) => (p === '\u0000' ? '\\S+(?:\\s\\S+){0,2}' : p)).join('\\s+'), 'iu')
}

type SoruSatiri = { no: number; soru: string }
const jsonSet = (dosya: string): SoruSatiri[] => JSON.parse(oku(dosya)) as SoruSatiri[]
/** The follow-up set carries {{A}} / {{U1in}} … placeholders: each stands for one name word ({{A}} is "Ayşe <surname>"). */
const takipAc = (s: string) => s.replace(/\{\{A\}\}/g, 'Ayşe Soyad').replace(/\{\{[A-Za-z0-9_]+\}\}/g, 'Ad')

/** The text of a source in which the sentence must be found: the one row for the question sets, the file otherwise. */
function kaynakMetni(k: { dosya: string; kimlik: string }): string | null {
  const no = /^#(\w+)$/.exec(k.kimlik)?.[1]
  if (k.dosya.endsWith('.json')) {
    const satir = jsonSet(k.dosya).find((x) => String(x.no) === no)
    return satir ? (k.dosya.includes('takip') ? takipAc(satir.soru) : satir.soru) : null
  }
  const metin = oku(k.dosya)
  if (no) return metin.split('\n').find((l) => l.startsWith(`| ${no} |`)) ?? null
  return metin
}

describe('Gökhan korpusu — girdiler', () => {
  it('korpus yalnız büyür (Q-40): en az 436 girdi; yapısal denetim temiz; id tekil', () => {
    // A floor, not a window: an entry is never removed to make a run green. Raise the floor when entries are added.
    assert.ok(GOKHAN_SIKAYET_KORPUSU.length >= 436, String(GOKHAN_SIKAYET_KORPUSU.length))
    assert.deepEqual(korpusDenetle(GOKHAN_SIKAYET_KORPUSU), [])
    assert.equal(new Set(GOKHAN_SIKAYET_KORPUSU.map((g) => g.id)).size, GOKHAN_SIKAYET_KORPUSU.length)
  })

  it('her girdinin kaynağı var: dosya depoda, kaynak kimliği dosyada', () => {
    const eksik: string[] = []
    for (const g of GOKHAN_SIKAYET_KORPUSU) {
      assert.ok(g.kaynak.length >= 1, g.id)
      for (const k of g.kaynak) {
        if (!fs.existsSync(path.join(KOK, k.dosya))) { eksik.push(`${g.id}: dosya yok ${k.dosya}`); continue }
        if (k.kimlik.startsWith('#')) { if (kaynakMetni(k) === null) eksik.push(`${g.id}: ${k.dosya} ${k.kimlik} yok`); continue }
        const metin = duz(oku(k.dosya))
        if (!metin.includes(duz(k.kimlik)) && !adsizDesen(k.kimlik).test(metin)) eksik.push(`${g.id}: "${k.kimlik}" ${k.dosya} içinde yok`)
      }
    }
    assert.deepEqual(eksik, [])
  })

  it('hiçbir cümle uydurulmadı: cümle kaynaklarından birinde geçer (yalnız hasta adı değişir) ya da girdi türetildiğini söyler', () => {
    const bulunamayan: string[] = []
    for (const g of GOKHAN_SIKAYET_KORPUSU) {
      if (g.turetilmis) { assert.ok(g.not && g.not.length > 20, `${g.id}: türetilmiş girdi açıklama ister`); continue }
      const desen = adsizDesen(g.soz)
      const var_ = g.kaynak.some((k) => { const m = kaynakMetni(k); return m !== null && desen.test(duz(m)) })
      if (!var_) bulunamayan.push(`${g.id}: ${g.soz}`)
    }
    assert.deepEqual(bulunamayan, [])
  })

  it('soru setleri eksiksiz: 100 seti 103, takip seti 101, canlı 09-30 seti 6, günlük set 1–50 ve K1–K11, İlk-10, 33 eylem', () => {
    const kaynakli = (dosya: string) => new Set(GOKHAN_SIKAYET_KORPUSU.flatMap((g) => g.kaynak.filter((k) => k.dosya === dosya).map((k) => k.kimlik)))
    for (const [dosya, adet] of [['scripts/ayse-denetim/sorular-100.json', 103], ['scripts/ayse-denetim/sorular-takip.json', 101], ['scripts/ayse-denetim/sorular-canli-0930.json', 6]] as const) {
      const set = jsonSet(dosya)
      assert.equal(set.length, adet, dosya)
      const var_ = kaynakli(dosya)
      assert.deepEqual(set.filter((s) => !var_.has(`#${s.no}`)).map((s) => s.no), [], `${dosya}: korpusta olmayan sorular`)
    }
    const gunluk = kaynakli('docs/qa/gokhan-gunluk-sorular.md')
    // #51 is the cross-patient audio incident (not a sentence); K12 is the opening greeting — both listed as out of scope.
    const beklenen = [...Array.from({ length: 55 }, (_, n) => `#${n + 1}`).filter((x) => x !== '#51'), ...Array.from({ length: 11 }, (_, n) => `#K${n + 1}`)]
    assert.deepEqual(beklenen.filter((x) => !gunluk.has(x)), [])
    assert.ok(KAPSAM_DISI_SIKAYETLER.some((k) => k.kaynak.includes('#51')) && KAPSAM_DISI_SIKAYETLER.some((k) => k.kaynak.includes('K12')))
    assert.equal(GOKHAN_SIKAYET_KORPUSU.filter((g) => g.id.startsWith('I-')).length, 10)
    // The action sentences are the audit's own, same order, same expected tool.
    const eylem = GOKHAN_SIKAYET_KORPUSU.filter((g) => g.id.startsWith('E-'))
    assert.equal(eylem.length, EYLEM_CUMLELERI.length)
    for (const [n, c] of EYLEM_CUMLELERI.entries()) {
      const g = eylem[n]
      assert.equal(g.soz, c.sozler[c.sozler.length - 1], `eylem ${c.no}`)
      assert.deepEqual(g.kurulum || [], c.sozler.slice(0, -1), `eylem ${c.no} kurulum`)
      assert.equal((g.beklenti as Beklenti).arac, c.beklenen, `eylem ${c.no} araç`)
      assert.equal(g.acik === 'deniz', c.hasta === 'acik', `eylem ${c.no} açık hasta`)
    }
  })

  it('kaynak listesi girdilerin kullandığı her dosyayı sayar; korpus üretim hasta adı taşımaz', () => {
    const listede = new Set(KORPUS_KAYNAKLARI.map((k) => k.dosya))
    for (const g of GOKHAN_SIKAYET_KORPUSU) for (const k of g.kaynak) assert.ok(listede.has(k.dosya), `${g.id}: ${k.dosya}`)
    // The names the sources carry are never typed here: the four mapped charts are known by their initials, and a
    // capitalised word pair in a corpus sentence is either a synthetic name or one of the probe names of the audit.
    assert.deepEqual(HASTA_ESLEME.map((h) => h.kaynak.slice(0, 4)), ['U.T.', 'A.Y.', 'R.D.', 'O.B.', 'QA /'])
    const kendi = oku('lib/asistan/tests/gokhanSikayetKorpusu.ts') + oku('lib/asistan/tests/gokhanKorpusHastalari.ts')
    const kaynakAdlari = new Set<string>()
    for (const s of jsonSet('scripts/ayse-denetim/sorular-100.json')) for (const m of s.soru.matchAll(/\p{Lu}\p{Ll}+ \p{Lu}\p{Ll}+/gu)) kaynakAdlari.add(m[0])
    const izinli = new Set([...Object.values(KORPUS_ADLARI), 'Mehmet Yılmaz', 'Test Hasta'])
    for (const ad of kaynakAdlari) if (!izinli.has(ad)) assert.ok(!kendi.includes(ad), `kaynaktaki ad korpusta yinelenmiş: ${ad}`)
  })

  it('sabitler fikstürle aynı: panel sayısı, eylem hastası, ret cümlesi', () => {
    assert.equal(KORPUS_PANEL_SAYISI, PANEL_SAYISI)
    assert.ok(GOKHAN_SIKAYET_KORPUSU.some((g) => g.soz.includes(GERCEKCI_HASTA_ADI)))
    assert.ok(KAPSAM_RED.includes(KAPSAM_RED_BASI), KAPSAM_RED)
  })
})

describe('Gökhan korpusu — yükleyici', () => {
  const ornek = (id: string, ek: Partial<KorpusGirdisi> = {}): KorpusGirdisi => ({ id, kat: 'dosya', soz: 'Kan grubu ne?', kaynak: [{ dosya: 'docs/x.md', kimlik: 'X-01' }], yuzeyler: ['yazi'], beklenti: { icerir: ['Rh'] }, ...ek })

  it('yapısal hataları adıyla söyler', () => {
    const sorun = korpusDenetle([
      ornek('A-1'), ornek('A-1'),
      ornek('A-2', { kaynak: [] }),
      ornek('A-3', { kaynak: [{ dosya: 'docs/x.md', kimlik: ' ' }] }),
      ornek('A-4', { beklenti: { icerir: ['(açık'] } }),
      ornek('A-5', { yuzeyler: ['panel'] }),
      ornek('A-6', { turetilmis: true }),
      ornek('A-7', { beklenti: {} }),
      ornek('A-8', { soz: ' ' }),
      ornek('a-9'),
      ornek('B-1', { oturum: 'S' }), ornek('B-2'), ornek('B-3', { oturum: 'S' }),
    ]).join('\n')
    for (const beklenen of ['A-1: yinelenen id', 'A-2: kaynak eksik', 'A-3: kaynak eksik', 'A-4: bozuk desen', 'A-5: panel yüzeyi açık hasta ister', 'A-6: türetilmiş cümle açıklama', 'A-7: boş beklenti', 'A-8: cümle boş', 'a-9: geçersiz id', 'B-3: oturum S bölünmüş']) {
      assert.ok(sorun.includes(beklenen), `${beklenen}\n---\n${sorun}`)
    }
    assert.throws(() => korpusYukle({}, [ornek('A-1'), ornek('A-1')]), /yinelenen id/)
  })

  it('süzgeç: id, id öneki, kategori, kaynak, yüzey; oturumun önceki turları korunur', () => {
    assert.equal(korpusYukle().length, GOKHAN_SIKAYET_KORPUSU.length)
    assert.deepEqual(korpusYukle({ idler: ['L-KIMLIK-ANNE'] }).map((g) => g.id), ['L-KIMLIK-ANNE'])
    assert.equal(korpusYukle({ idler: ['I-'] }).length, 10)
    // T-004 is the fourth turn of its session: the three before it bind the topic and come along.
    assert.deepEqual(korpusYukle({ idler: ['T-004'] }).map((g) => g.id), ['T-001', 'T-002', 'T-003', 'T-004'])
    assert.ok(korpusYukle({ kat: ['kimlik'] }).every((g) => g.kat === 'kimlik' || g.oturum))
    const ledger = korpusYukle({ kaynak: 'NOTYA-BETA-0925' })
    assert.ok(ledger.some((g) => g.id === 'L-KIMLIK-ANNE') && ledger.length < 40, String(ledger.length))
    const paneller = korpusYukle({ yuzeyler: ['panel'] })
    assert.ok(paneller.length >= 12 && paneller.every((g) => g.yuzeyler.length === 1 && g.yuzeyler[0] === 'panel' && g.acik))
  })

  it('oturumlara bölme: aynı anahtar tek oturum, anahtarsız girdi kendi oturumu', () => {
    const b = oturumlaraBol(korpusYukle({ idler: ['C-'] }))
    assert.deepEqual(b.map((x) => x.map((g) => g.id)), [['C-2', 'C-3'], ['C-4', 'C-5'], ['C-6']])
    const s1 = oturumlaraBol(GOKHAN_SIKAYET_KORPUSU).find((x) => x[0].oturum === 'Y-S1')!
    assert.equal(s1.length, 24)
  })
})

describe('Gökhan korpusu — yer tutucular', () => {
  const tarih = fiksturTarihleri('2026-09-30')

  it('tarih deseni iki yazımı da tanır', () => {
    const d = new RegExp(tarihDeseni('2026-10-02'))
    assert.ok(d.test('2 Ekim 2026 Cuma takviminde') && d.test('02.10.2026 muayene'))
    assert.ok(!d.test('12 Ekim 2026') && !d.test('22.10.2026'), 'bir başka günün son hanesiyle eşleşmez')
    assert.ok(new RegExp(tarihDeseni('2026-10-05', false)).test('Haftaya (5 Ekim – 11 Ekim)'))
  })

  it('kaynak setlerinin koşulduğu gün (Çarşamba 30.09.2026) aynı tarihleri verir: cuma 2 Ekim, perşembe 1 Ekim, haftaya 5 Ekim, bu hafta 28 Eylül', () => {
    const b = korpusBaglami('2026-09-30', tarih)
    const uyar = (ad: string, metin: string) => assert.ok(new RegExp(b[ad]).test(metin), `${ad}: ${b[ad]} ≠ ${metin}`)
    uyar('BUGUN', '30 Eylül 2026'); uyar('YARIN', '1 Ekim 2026'); uyar('OBURGUN', '2 Ekim 2026'); uyar('DUN', '29 Eylül 2026')
    uyar('CUMA', '2 Ekim 2026'); uyar('PERSEMBE', '1 Ekim 2026'); uyar('HAFTAYA_PZT', '5 Ekim'); uyar('BUHAFTA_PZT', '28 Eylül')
  })

  it('adı geçen gün bugünse bugündür; bilinmeyen yer tutucu hata verir; korpustaki her yer tutucu tanımlı', () => {
    assert.ok(new RegExp(korpusBaglami('2026-10-02', fiksturTarihleri('2026-10-02')).CUMA).test('2 Ekim 2026'))
    assert.throws(() => yerlestir('{YOK}', {}), /bilinmeyen yer tutucu/)
    const b = korpusBaglami('2026-09-30', tarih)
    for (const g of GOKHAN_SIKAYET_KORPUSU) {
      if (g.beklenti === 'MANUAL') continue
      for (const d of [...(g.beklenti.icerir || []), ...(g.beklenti.icermez || []), ...(g.ses?.icerir || []), ...(g.ses?.icermez || [])]) assert.doesNotThrow(() => new RegExp(yerlestir(d, b), 'iu'), `${g.id}: ${d}`)
    }
  })

  it('fikstür tarihleri dosyadan okunur: KKK 12. ayda, sonraki randevu 7 gün sonra, son vizit 2 gün önce, son tahlil 12 gün önce', () => {
    assert.equal(tarih.pDogum, korpusBebekDogum('2026-09-30'))
    assert.equal(tarih.pKkk.slice(0, 7), `${Number(tarih.pDogum.slice(0, 4)) + 1}${tarih.pDogum.slice(4, 7)}`)
    assert.deepEqual([tarih.pRandevu, tarih.pSonVizit, tarih.pSonLab, tarih.aVizit], ['2026-10-07', '2026-09-28', '2026-09-18', '2026-09-22'])
  })
})

describe('Gökhan korpusu — değerlendirme yardımcıları', () => {
  const B = korpusBaglami('2026-09-30', fiksturTarihleri('2026-09-30'))
  const AD = { ...KORPUS_ADLARI, deniz: GERCEKCI_HASTA_ADI }
  const tur = (ek: Partial<TurGozlemi> = {}): TurGozlemi => ({ yuzey: 'yazi', ekran: '', soz: '', rota: 'hizli-kart', modeleGitti: false, cagrilan: [], kartlar: [], hasta: null, hata: '', ...ek })
  const karar = (b: Beklenti | 'MANUAL', t: Partial<TurGozlemi>, vekil = false) => beklentiDegerlendir(b, tur(t), B, AD, { vekil })

  it('metin: içermeli hepsi, içermemeli hiçbiri; yer tutucu doldurulur', () => {
    assert.equal(karar({ icerir: ['0 Rh\\+', 'kan grubu'] }, { ekran: 'Emircan Karaoğlu — dosyada kan grubu: 0 Rh+.' }).karar, 'PASS')
    const eksik = karar({ icerir: ['0 Rh\\+', 'Elif'] }, { ekran: 'dosyada kan grubu: 0 Rh+.' })
    assert.equal(eksik.karar, 'FAIL'); assert.match(eksik.nedenler.join(), /içermeli: Elif/)
    assert.match(karar({ icermez: ['Kayıtlarda \\d+ hasta'] }, { ekran: 'Kayıtlarda 0 hasta.' }).nedenler.join(), /içermemeli/)
    assert.equal(karar({ icerir: ['{YARIN}'] }, { ekran: '1 Ekim 2026 Perşembe takviminde randevu yok.' }).karar, 'PASS')
    assert.equal(karar({ icerir: ['{YARIN}'] }, { ekran: '30 Eylül 2026 Çarşamba takviminde randevu yok.' }).karar, 'FAIL')
  })

  it('rota: beklenen rota, olmaması gereken rota (hasta sayımı şablonu = arama)', () => {
    assert.equal(karar({ rota: ['kimlik'] }, { rota: 'kimlik' }).karar, 'PASS')
    assert.match(karar({ rota: ['kimlik'] }, { rota: 'model', modeleGitti: true }).nedenler.join(), /rota model ≠ kimlik/)
    assert.match(karar({ rotaDegil: ['arama', 'kapsam'] }, { rota: 'arama', ekran: 'Kayıtlarda 0 hasta.' }).nedenler.join(), /rota arama \(olmamalı\)/)
    // The panel has no router: a route expectation is not applied there.
    assert.equal(karar({ rota: ['kayit'] }, { yuzey: 'panel', rota: 'panel', modeleGitti: true }).karar, 'PASS')
  })

  it('araç ve kart: adı verilen araç çağrılır, kart hazırlanır; null = hiçbiri olmamalı; uyarılı kart', () => {
    const kart = { eylem: 'alerji_ekle', eksik: 0, uyari: 0 }
    assert.equal(karar({ arac: 'alerji_ekle', kart: 'alerji_ekle' }, { rota: 'model', modeleGitti: true, cagrilan: ['alerji_ekle'], kartlar: [kart] }).karar, 'PASS')
    assert.match(karar({ arac: 'alerji_ekle' }, { cagrilan: ['dosya_notu_ekle'] }).nedenler.join(), /araç alerji_ekle çağrılmadı \(çağrılan: dosya_notu_ekle\)/)
    assert.match(karar({ arac: null }, { cagrilan: ['alerji_ekle'] }).nedenler.join(), /araç çağrıldı/)
    assert.match(karar({ kart: null }, { kartlar: [kart] }).nedenler.join(), /kart hazırlandı/)
    assert.match(karar({ kart: 'ilac_ekle' }, { kartlar: [kart] }).nedenler.join(), /kart ilac_ekle yok/)
    assert.match(karar({ kart: 'alerji_ekle', kartUyari: true }, { kartlar: [kart] }).nedenler.join(), /kartta uyarı yok/)
    assert.equal(karar({ kart: 'alerji_ekle', kartUyari: true }, { kartlar: [{ ...kart, uyari: 1 }] }).karar, 'PASS')
  })

  it('hasta: turun bağlandığı hasta; null = hiçbiri; panelde gözlenemez', () => {
    assert.equal(karar({ hasta: 'bebek' }, { hasta: KORPUS_BEBEK_ADI }).karar, 'PASS')
    assert.match(karar({ hasta: 'bebek' }, { hasta: 'Ayşe Bozkurt' }).nedenler.join(), /hasta Ayşe Bozkurt ≠ Emircan Karaoğlu/)
    assert.match(karar({ hasta: null }, { hasta: 'Ayşe Bozkurt' }).nedenler.join(), /hasta Ayşe Bozkurt ≠ —/)
    assert.equal(karar({ hasta: 'bebek' }, { yuzey: 'panel', hasta: undefined }).karar, 'PASS')
  })

  it('ret: beklenen yerde gelmeli, beklenmeyen yerde gelmemeli; yasak cümleler ve geri soru', () => {
    assert.equal(karar({ ret: true, rota: ['kapsam'] }, { rota: 'kapsam', ekran: KAPSAM_RED }).karar, 'PASS')
    assert.match(karar({ ret: true }, { ekran: 'Tesla iyi bir araba Hocam.' }).nedenler.join(), /kapsam reddi bekleniyordu/)
    assert.match(karar({ icerir: ['otit'] }, { ekran: KAPSAM_RED }).nedenler.join(), /kapsam reddi geldi/)
    for (const [cumle, ad] of [['Takvimden kontrol etmek gerekir Hocam.', 'deflection'], ['Önceki listeyi uydurdum.', 'false confession'], ['Bakıyorum Hocam.', 'filler'], ['Ben veri girişi yapabilen bir araç değilim.', 'cannot record'], ['Bu bilgi özetimde yok.', 'short-chart miss'], ['"undefined" dosyada kayıtlı değil.', 'template leak']] as const) {
      assert.match(karar({ rotaDegil: ['arama'] }, { ekran: cumle }).nedenler.join(), new RegExp(`yasak cümle \\(${ad}\\)`), cumle)
    }
    assert.match(karar({ soruSormaz: true }, { ekran: 'Hangi hastanın dozunu soruyorsunuz?' }).nedenler.join(), /geri soru sordu/)
    assert.equal(karar({ soruSormaz: true }, { ekran: '1 Ekim 2026 Perşembe takviminde randevu yok.' }).karar, 'PASS')
  })

  it('tablo ekranda aranır; seste ekran ile söz birlikte okunur, ses beklentisi tabanın üstüne biner; okunuş', () => {
    const tablo = '**Emircan Karaoğlu — Aşı Karnesi** (16 kayıt)\n\n| Aşı | Tarih |\n| --- | --- |\n| Hepatit B | 30.08.2024 |'
    assert.equal(karar({ tablo: true, icerir: ['Hepatit B'] }, { rota: 'kayit', ekran: tablo }).karar, 'PASS')
    assert.match(karar({ tablo: true }, { ekran: 'Aşı karnesi ekranda.' }).nedenler.join(), /ekranda tablo yok/)
    assert.equal(karar({ icerir: ['Hepatit B', 'ekrana getirdim'] }, { yuzey: 'ses', ekran: tablo, soz: 'Aşı karnesini ekrana getirdim Hocam; 16 kayıt var.' }).karar, 'PASS')
    const kimlik: KorpusGirdisi = { id: 'X-1', kat: 'kimlik', soz: 'Annesinin adı ne?', kaynak: [{ dosya: 'x', kimlik: 'x' }], yuzeyler: ['yazi', 'ses'], beklenti: { rota: ['kimlik'], icerir: ['Elif'] }, ses: { icerir: ['ekran'], icermez: ['Elif'] } }
    assert.deepEqual(yuzeyBeklentisi(kimlik, 'yazi'), kimlik.beklenti)
    assert.deepEqual(yuzeyBeklentisi(kimlik, 'ses'), { rota: ['kimlik'], icerir: ['ekran'], icermez: ['Elif'] })
    assert.equal(beklentiDegerlendir(yuzeyBeklentisi(kimlik, 'ses'), tur({ yuzey: 'ses', rota: 'kimlik', soz: 'İstediğiniz bilgiyi ekranınıza yazdım Hocam.' }), B, AD).karar, 'PASS')
    assert.equal(beklentiDegerlendir(yuzeyBeklentisi(kimlik, 'ses'), tur({ yuzey: 'ses', rota: 'kimlik', soz: 'Annesinin adı Elif.' }), B, AD).karar, 'FAIL')
    assert.equal(karar({ okunus: { icerir: ['derece'], icermez: ['°'] } }, { yuzey: 'ses', soz: 'Ateş: 38,7 °C', okunus: 'Ateş: otuz sekiz virgül yedi derece' }).karar, 'PASS')
    assert.match(karar({ okunus: { icermez: ['°'] } }, { yuzey: 'ses', soz: 'Ateş: 38,7 °C', okunus: 'Ateş: 38,7 °C' }).nedenler.join(), /okunuş içermemeli/)
  })

  it('MANUAL: koşar, cevap kaydedilir, yargılanmaz — ama tur hata verdiyse FAIL', () => {
    assert.deepEqual(karar('MANUAL', { ekran: 'herhangi bir cevap' }), { karar: 'MANUAL', nedenler: [] })
    assert.equal(karar('MANUAL', { hata: 'HTTP 502' }).karar, 'FAIL')
    assert.equal(karar({ icerir: ['x'] }, { ekran: 'x', hata: 'luna_fail:transport:http_502' }).karar, 'FAIL')
  })

  it('vekil koşumu: modelin yazdığı söz yargılanmaz (VEKIL), yapı yargılanır; modelsiz cevap tam yargılanır', () => {
    // The stand-in wrote the answer: its words say nothing about the product.
    assert.deepEqual(karar({ icerir: ['otit'], hasta: 'bebek' }, { rota: 'model', modeleGitti: true, ekran: 'Vekil yanıt Hocam.', hasta: KORPUS_BEBEK_ADI }, true), { karar: 'VEKIL', nedenler: [] })
    // …but the wrong patient, the wrong route or a missing card is a failure whoever wrote the words.
    assert.equal(karar({ icerir: ['otit'], hasta: 'bebek' }, { rota: 'model', modeleGitti: true, ekran: 'Vekil yanıt Hocam.', hasta: null }, true).karar, 'FAIL')
    assert.equal(karar({ icerir: ['Elif'], rota: ['kimlik'] }, { rota: 'model', modeleGitti: true, ekran: 'Vekil yanıt Hocam.' }, true).karar, 'FAIL')
    assert.equal(karar({ arac: 'alerji_ekle', kart: 'alerji_ekle' }, { rota: 'model', modeleGitti: true, cagrilan: ['alerji_ekle'], kartlar: [] }, true).karar, 'FAIL')
    // Nothing but structure was expected and it held: a real pass, also in a dry run.
    assert.equal(karar({ rotaDegil: ['arama'], hasta: null }, { rota: 'model', modeleGitti: true, ekran: 'Vekil yanıt Hocam.' }, true).karar, 'PASS')
    // A model-free handler answered: graded in full in a dry run too.
    assert.equal(karar({ icerir: ['Elif'] }, { rota: 'kimlik', ekran: 'Anne adı: kayıtlı değil.' }, true).karar, 'FAIL')
    assert.equal(karar({ icerir: ['Elif'] }, { rota: 'kimlik', ekran: 'Anne adı: Elif (Hasta Bilgi Formu)' }, true).karar, 'PASS')
    // Text the server guarantees whatever the model writes is graded although the turn passed through the stand-in.
    assert.equal(karar({ icerir: ['9,8 kg'], sunucuYazar: true }, { yuzey: 'panel', rota: 'panel', modeleGitti: true, ekran: 'Kayıt — 12 aylık muayene: kilo 9,8 kg.' }, true).karar, 'PASS')
    assert.equal(karar({ icerir: ['9,8 kg'], sunucuYazar: true }, { yuzey: 'panel', rota: 'panel', modeleGitti: true, ekran: 'Yaklaşık 9,35 kg olmalı.' }, true).karar, 'FAIL')
    // An expected refusal that did not come is structural: the gate is model-free.
    assert.equal(karar({ ret: true }, { rota: 'model', modeleGitti: true, ekran: 'Vekil yanıt Hocam.' }, true).karar, 'FAIL')
  })
})

describe('Gökhan korpusu — kalite rubriği girdisi (NOTYA-KALITE-STANDART-01)', () => {
  const girdi = (ek: Partial<KorpusGirdisi> = {}): KorpusGirdisi => ({ id: 'X-1', kat: 'olcum', soz: 'Kilosu kaç?', kaynak: [{ dosya: 'x', kimlik: 'x' }], yuzeyler: ['yazi', 'ses'], beklenti: { hasta: 'bebek' }, ...ek })
  const tur = (ek: Partial<TurGozlemi> = {}): TurGozlemi => ({ yuzey: 'yazi', ekran: 'Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg.', soz: '', rota: 'hizli-kart', modeleGitti: false, cagrilan: [], kartlar: [], hasta: KORPUS_BEBEK_ADI, hata: '', ...ek })

  it('vekilin yazdığı cevap yargılanmaz; modelsiz cevap ve canlı koşum yargılanır', () => {
    assert.equal(kaliteGirdisiKur(girdi(), tur({ rota: 'model', modeleGitti: true }), { vekil: true }), null)
    assert.ok(kaliteGirdisiKur(girdi(), tur(), { vekil: true }))
    assert.ok(kaliteGirdisiKur(girdi(), tur({ rota: 'model', modeleGitti: true }), { vekil: false }))
  })

  it('tek ölçüm ve tek bilgi cümleden; hasta adı kuralı yalnız dosya cevabında; seste söz ve okunuş ayrı verilir', () => {
    const y = kaliteGirdisiKur(girdi(), tur())!
    assert.deepEqual([y.olcum, y.olgu, y.hastaAdi, y.yapi, y.soz], ['kilo', true, KORPUS_BEBEK_ADI, null, undefined])
    const s = kaliteGirdisiKur(girdi(), tur({ yuzey: 'ses', soz: 'Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg.', okunus: 'on iki virgül sekiz kilogram' }), { kimlikDegerleri: KORPUS_KIMLIK_DEGERLERI, yabanciAdlar: YABANCI_HASTALAR })!
    assert.deepEqual([s.soz, s.okunus, s.kimlikDegerleri?.length, s.yabanciAdlar], ['Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg.', 'on iki virgül sekiz kilogram', KORPUS_KIMLIK_DEGERLERI.length, [...YABANCI_HASTALAR]])
    // A calendar or practice answer is not about one chart: no patient-name rule, no file structure.
    const t = kaliteGirdisiKur(girdi({ kat: 'takvim', soz: 'Bugün hiçbir randevumuz var mı?', beklenti: { rota: ['takvim'] } }), tur({ rota: 'takvim', hasta: KORPUS_BEBEK_ADI }))!
    assert.deepEqual([t.hastaAdi, t.yapi, t.olgu], [null, null, false])
    // The entry expects no bound patient: the name rule does not apply although a chart was bound.
    assert.equal(kaliteGirdisiKur(girdi({ beklenti: { hasta: null } }), tur())!.hastaAdi, null)
  })

  it('yapı: dosya sorusu model ya da hızlı kart cevabında aranır; kayıt tablosu isteğinde aranmaz; girdi kendi yapısını söyleyebilir', () => {
    const ozet = girdi({ kat: 'ilk10', soz: 'Bu hastayı bana kısaca özetler misin?' })
    assert.equal(kaliteGirdisiKur(ozet, tur({ rota: 'model', modeleGitti: true }))!.yapi, 'ozet')
    assert.equal(kaliteGirdisiKur(ozet, tur({ yuzey: 'panel', rota: 'panel', modeleGitti: true, hasta: undefined }))!.yapi, 'ozet')
    assert.equal(kaliteGirdisiKur(ozet, tur({ rota: 'model', modeleGitti: true, hasta: null }))!.yapi, null, 'açık hasta yokken dosya yapısı aranmaz')
    assert.equal(kaliteGirdisiKur(girdi({ kat: 'asi', soz: 'Aşı karnesini tablo olarak göster' }), tur({ rota: 'kayit' }))!.yapi, null)
    assert.equal(kaliteGirdisiKur(girdi({ kat: 'asi', soz: 'Aşı karnesini tablo olarak göster', kalite: { yapi: 'asi' } }), tur({ rota: 'kayit' }))!.yapi, 'asi')
    assert.equal(kaliteGirdisiKur(girdi({ kalite: { olcum: null } }), tur())!.olcum, null)
  })

  it('beklenen kapsam reddi, gürültü, okuma isteği ve seste kimlik cevabının ekranı', () => {
    assert.equal(kaliteGirdisiKur(girdi({ kat: 'kapsam', soz: 'Bitcoin almalı mıyım?', beklenti: { ret: true } }), tur({ rota: 'kapsam', hasta: null }))!.ret, true)
    assert.equal(kaliteGirdisiKur(girdi(), tur({ yuzey: 'ses', rota: 'gurultu' }))!.gurultu, true)
    assert.equal(kaliteGirdisiKur(girdi({ kat: 'ses', soz: 'Hastanın özetini oku' }), tur({ yuzey: 'ses', rota: 'model', modeleGitti: true }))!.okuIstegi, true)
    assert.equal(kaliteGirdisiKur(girdi(), tur({ yuzey: 'ses', rota: 'oku' }))!.okuIstegi, true)
    // The identity reader stores a value-less note on voice; it is not what the screen shows and is not judged as one.
    assert.equal(kaliteGirdisiKur(girdi({ kat: 'kimlik', soz: 'Annesinin adı ne?' }), tur({ yuzey: 'ses', rota: 'kimlik', ekran: 'saklanan not', soz: 'Emircan Karaoğlu için istediğiniz bilgiyi ekranınıza yazdım Hocam.' }))!.ekran, '')
  })

  it('panelin kimlik değerleri dosyalardadır; bozuk kalite deseni adıyla söylenir', () => {
    const formlar = JSON.stringify([korpusBebek(DENETIM_BUGUN).form]) + oku('lib/asistan/tests/gokhanKorpusHastalari.ts')
    for (const d of KORPUS_KIMLIK_DEGERLERI) assert.ok(formlar.includes(d), d)
    assert.match(korpusDenetle([girdi({ kalite: { kanit: { planli: ['(açık'] } } })]).join(), /X-1: bozuk kalite deseni/)
  })
})

describe('Gökhan korpusu — kalite standardının altın vakaları (NOTYA-KALITE-STANDART-01)', () => {
  const altin = GOKHAN_SIKAYET_KORPUSU.filter((g) => g.id.startsWith(ALTIN_ON_EKI))
  const standart = oku('docs/AYSE-KALITE-STANDARDI.md')
  const ILK10 = ['Bu hastayı bana kısaca özetler misin?', 'Son muayeneden bu yana neler değişmiş?', 'Büyümesi nasıl gidiyor?', 'Aşıları yaşına göre tam mı? Eksik aşısı var mı?', 'Son lab sonuçlarında dikkat etmem gereken bir şey var mı?', 'Şu anda kullandığı ilaçlar neler ve dozları nedir?', 'Daha önce aynı şikayetle geldi mi?', 'Gelişimi yaşına uygun mu?', 'Bugün yapmam veya takip etmem gereken bir şey var mı?', 'Gözümden kaçabilecek önemli bir şey var mı?']

  it('on soru geç girilmiş dosyada yazı ve seste; muayene özeti, tek ölçüm ve vizit tarihi vakaları var', () => {
    const on = altin.filter((g) => /^K-G\d\d$/.test(g.id))
    assert.deepEqual(on.map((g) => g.soz), ILK10)
    for (const g of on) assert.deepEqual([g.acik, g.yuzeyler, g.kat], ['doruk', ['yazi', 'ses'], 'ilk10'], g.id)
    // Every structured question states its structure, so the rubric does not depend on the classifier for a golden case.
    assert.deepEqual(on.map((g) => g.kalite?.yapi), ['ozet', 'degisim', 'buyume', 'asi', 'lab', 'ilac', 'benzer', 'gelisim', 'takip', 'gozden-kacan'])
    assert.deepEqual(altin.filter((g) => g.kalite?.yapi === 'vizit-ozeti').map((g) => g.id), ['K-VIZIT-B12', 'K-VIZIT-G18'])
    assert.deepEqual(altin.filter((g) => g.id.startsWith('K-OLCUM-')).map((g) => g.soz), ['Kilosu kaç?', 'Kilosu kaç?', 'Boyu kaç?', 'Baş çevresi kaç?', 'Son muayenede ateşi kaçtı?'])
    assert.ok(altin.some((g) => g.id === 'K-TARIH-SON') && altin.some((g) => g.id === 'K-TARIH-G18'))
    assert.ok(altin.every((g) => g.yuzeyler.includes('yazi') && g.yuzeyler.includes('ses')))
  })

  it('her altın vaka standardın tablosunda; tablodaki her vaka korpusta; bilinen kusur defterde adıyla duruyor', () => {
    const tabloda = new Set([...standart.matchAll(/K-[A-Z0-9-]+/g)].map((m) => m[0]))
    assert.deepEqual(altin.map((g) => g.id).filter((id) => !tabloda.has(id)), [])
    assert.deepEqual([...tabloda].filter((id) => !altin.some((g) => g.id === id)), [])
    const defter = oku('docs/OPEN-COMMITMENTS.md')
    for (const g of altin) if (g.acikKusur) assert.ok(defter.includes(`| ${g.acikKusur} |`), `${g.id}: ${g.acikKusur} defterde satır değil`)
  })

  it('İlk-10 girdileri (15 vizitli dosya) planlanan / uygulanan kanıtını taşır; planlanan doz dosyada yalnız planlıdır', () => {
    const i = GOKHAN_SIKAYET_KORPUSU.filter((g) => g.id.startsWith('I-'))
    assert.ok(i.length === 10 && i.every((g) => g.kalite?.kanit?.planli?.[0] === 'Hepatit A 2\\. doz'))
    const bebek = korpusBebek(DENETIM_BUGUN)
    assert.ok(!bebek.asilar!.some((a) => a.asi_adi === 'Hepatit A' && a.doz_no === 2) && bebek.asilar!.filter((a) => a.asi_adi === 'Hepatit B').length === 3)
  })

  it('geç girilmiş dosya: 19 aylık, üç vizit; seans satırları giriş gününde, notlar muayene gününde', () => {
    const ham = korpusGecGiris(DENETIM_BUGUN)
    const dogum = korpusGecGirisDogum(DENETIM_BUGUN)
    assert.equal(ham.hasta.ad, KORPUS_GEC_GIRIS_ADI)
    assert.equal(ham.vizitler.length, KORPUS_GEC_GIRIS.vizitSayisi)
    const ay = (Number(DENETIM_BUGUN.slice(0, 4)) - Number(dogum.slice(0, 4))) * 12 + Number(DENETIM_BUGUN.slice(5, 7)) - Number(dogum.slice(5, 7))
    assert.ok(ay === 19 || ay === 20, String(ay))
    const db = new SahteVeritabani()
    const id = korpusDosyasiYaz(db, (s) => s, 'hekim-1', ham)
    const seanslar = db.tablo('sessions').filter((s) => s.patient_id === id)
    const notlar = db.tablo('notes').filter((n) => n.patient_id === id)
    const giris = fiksturTarihleri(DENETIM_BUGUN).gGiris
    assert.deepEqual(seanslar.map((s) => String(s.created_at).slice(0, 10)), [giris, giris, giris])
    const t = fiksturTarihleri(DENETIM_BUGUN)
    assert.deepEqual(notlar.map((n) => String(n.created_at).slice(0, 10)), [t.gV12, t.gV15, t.gV18])
    assert.ok(t.gV18 < giris && giris < DENETIM_BUGUN, 'son muayene girişten önce, giriş bugünden önce')
    // The two-week control window of the 18-month visit has passed counted from the note, not counted from the entry.
    const gunFarki = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)
    assert.ok(gunFarki(t.gV18, DENETIM_BUGUN) > 14 && gunFarki(giris, DENETIM_BUGUN) < 14)
  })

  it('geç girilmiş dosya: beklentilerin andığı değerler dosyada — yalnız planlı tarama ve aşı, istenmiş konsültasyon, düşük Hb, çelişen kilo', () => {
    const ham = korpusGecGiris(DENETIM_BUGUN)
    const son = ham.vizitler[2]
    assert.deepEqual([son.vitaller!.kilo, son.vitaller!.boy, son.vitaller!.basCevresi], [KORPUS_GEC_GIRIS.sonKilo, KORPUS_GEC_GIRIS.sonBoy, KORPUS_GEC_GIRIS.sonBas])
    for (const p of KORPUS_GEC_GIRIS.yalnizPlanli) assert.ok(String(son.plan).includes(p), p)
    assert.ok(String(son.plan).includes('KBB konsültasyonu istendi') && String(son.plan).includes(KORPUS_GEC_GIRIS.kontrolPenceresi))
    assert.ok(!ham.asilar!.some((a) => a.asi_adi === 'Hepatit A') && ham.asilar!.filter((a) => a.asi_adi === 'Hepatit B').length === 3 && !ham.mchat)
    assert.ok(String(ham.vizitler[1].objektif).includes('Kilo 14,1 kg') && ham.vizitler[1].vitaller === undefined)
    const hb = ham.lablar!.find((l) => l.canonical_key === 'Hb')!
    assert.ok(hb.kanonik_deger === KORPUS_GEC_GIRIS.hb && hb.kanonik_deger < hb.ref_low! && ham.lablar!.filter((l) => l.canonical_key === 'Hb').length === 1)
    assert.equal(hb.numune_tarihi, fiksturTarihleri(DENETIM_BUGUN).gLab)
    assert.ok(!('anneAdi' in ham.intake!) && ham.form.anneAdi === KORPUS_GEC_GIRIS.anneAdi && (ham.randevular || []).length === 0)
    for (const d of [KORPUS_GEC_GIRIS.anneAdi, KORPUS_GEC_GIRIS.babaAdi, KORPUS_GEC_GIRIS.telefon]) assert.ok(KORPUS_KIMLIK_DEGERLERI.includes(d), d)
  })
})

describe('Gökhan korpusu — sentetik dosyalar', () => {
  const ham = korpusBebek(DENETIM_BUGUN)
  const olaylar = olaylariKur(ham, DENETIM_BUGUN)
  const olcum = (vizitId: string, tur: string) => olaylar.find((o) => o.kaynak === 'olcum' && o.vizitId === vizitId && o.tur === tur)?.deger

  it('bebek: 2 yaşında erkek, 15 vizit, 6-12-15-18-24 ay sağlam çocuk vizitleri; ölçümler iki ayrı yerde', () => {
    assert.equal(hastaKur(ham, DENETIM_BUGUN).ad, KORPUS_BEBEK_ADI)
    assert.equal(ham.hasta.cinsiyet, 'Erkek')
    const ay = (Number(DENETIM_BUGUN.slice(0, 4)) - Number(ham.hasta.dogumIso!.slice(0, 4))) * 12 + Number(DENETIM_BUGUN.slice(5, 7)) - Number(ham.hasta.dogumIso!.slice(5, 7))
    assert.ok(ay === 25 || ay === 26, String(ay))
    assert.equal(ham.vizitler.length, KORPUS_BEBEK.vizitSayisi)
    assert.equal(olaylar.filter((o) => o.kaynak === 'not' && o.tur === 'vizit').length, 15)
    for (const [aylik, v] of Object.entries(KORPUS_BEBEK.saglamCocuk)) {
      const vizit = ham.vizitler.find((x) => String(x.subjektif).startsWith(`${aylik} aylık`))
      assert.ok(vizit && /sağlam çocuk/.test(String(vizit.subjektif)), `${aylik} aylık vizit`)
      if (v.yer === 'vitaller') {
        assert.deepEqual([olcum(vizit!.id, 'kilo'), olcum(vizit!.id, 'boy'), olcum(vizit!.id, 'basCevresi')], [v.kilo, v.boy, v.bas], `${aylik} ay vitaller`)
      } else {
        // In the note text only: not a structured measurement, but written in the exam findings.
        assert.equal(vizit!.vitaller, undefined, `${aylik} ay: vitaller boş olmalı`)
        assert.ok(String(vizit!.objektif).includes(`Kilo ${String(v.kilo).replace('.', ',')} kg`), String(vizit!.objektif))
      }
    }
    assert.ok(ham.vizitler.some((v) => /otitis media/i.test(String(v.tani)) && v.ilaclar?.some((i) => /Augmentin/.test(String(i.ad)))), 'akut otit viziti ve antibiyotik')
  })

  it('bebek: 16 aşı satırı (Hepatit A 2. doz yalnız planlı), aktif ilaçlar, antibiyotik öyküsü, lab, belge, randevu; alerji yok; anne-baba adı yalnız formda', () => {
    assert.equal(ham.asilar!.length, KORPUS_BEBEK.asiSatiri)
    assert.ok(!ham.asilar!.some((a) => a.asi_adi === 'Hepatit A' && a.doz_no === 2))
    assert.ok(ham.vizitler.some((v) => String(v.plan).includes('Hepatit A 2. doz planlandı')))
    for (const ad of [...KORPUS_BEBEK.aktifIlaclar, ...KORPUS_BEBEK.antibiyotikler]) assert.ok(ham.ilaclar!.some((i) => i.ilac_adi.includes(ad)), ad)
    assert.deepEqual(ham.lablar!.filter((l) => l.canonical_key === 'Hb').map((l) => l.kanonik_deger), [...KORPUS_BEBEK.hb])
    assert.deepEqual(ham.lablar!.filter((l) => l.canonical_key === 'Ferritin').map((l) => l.kanonik_deger), [...KORPUS_BEBEK.ferritin])
    assert.ok(ham.belgeDosyalari.length >= 3 && ham.randevular!.length === 2 && ham.randevular!.every((r) => r.baslangic.slice(0, 10) > DENETIM_BUGUN))
    assert.equal(ham.form.alerjiVarMi, 'Hayır')
    assert.deepEqual([ham.form.anneAdi, ham.form.babaAdi, ham.form.kanGrubu], [KORPUS_BEBEK.anneAdi, KORPUS_BEBEK.babaAdi, KORPUS_BEBEK.kanGrubu])
    // The chart reader never sees identity keys; the identity reader gets them from the form.
    assert.ok(!('anneAdi' in ham.intake!) && !('telefon' in ham.intake!) && ham.intake!.kanGrubu === KORPUS_BEBEK.kanGrubu)
    assert.ok(!olaylar.some((o) => o.tur === 'alerji'))
  })

  it('bebek: kayıt tabloları ve kanıt bloğu beklentilerin andığı değerleri taşır', () => {
    const kilo = kayitCevabi(kayitIstegiBul('Bütün muayenelerdeki kilo ölçümlerini sırayla göster')!, olaylar, KORPUS_BEBEK_ADI).ekran
    for (const d of ['7,9', '9,8', '11,3', '12,6', '12,8']) assert.ok(kilo.includes(`| ${d} |`), `${d}\n${kilo}`)
    // The 9- and 15-month visits carry their weight only in the note text: read from there and marked as such.
    for (const d of ['8,9 (not metni)', '10,6 (not metni)']) assert.ok(kilo.includes(d), `${d}\n${kilo}`)
    const son3 = kayitCevabi(kayitIstegiBul('Son üç muayenesini özetle')!, olaylar, KORPUS_BEBEK_ADI).ekran
    assert.ok(son3.includes('son 3 muayene') && son3.includes('toplam 15 onaylı muayene') && /24 aylık/.test(son3) && /[Oo]tit/.test(son3), son3)
    const asi = kanitBlogu('asi', olaylar, hastaKur(ham, DENETIM_BUGUN), {})
    assert.ok(asi.includes('Hepatit A 2. doz — planlandı'), asi)
  })

  it('erişkin ve panel: 46 yaşında kadın, 4 vizit, tansiyon, üç aktif ilaç; küçük dosyaların değerleri', () => {
    const e = korpusEriskin(DENETIM_BUGUN)
    assert.equal(e.vizitler.length, KORPUS_ERISKIN.vizitSayisi)
    assert.equal(e.vizitler[3].vitaller!.tansiyon, KORPUS_ERISKIN.sonTansiyon)
    assert.equal(Number(DENETIM_BUGUN.slice(0, 4)) - Number(e.hasta.dogumIso!.slice(0, 4)), 46)
    for (const ad of KORPUS_ERISKIN.aktifIlaclar) assert.ok(e.ilaclar!.some((i) => i.ilac_adi.startsWith(ad)), ad)
    assert.equal(e.randevular![0].baslangic.slice(0, 10), DENETIM_BUGUN, 'bugünün tek randevusu')
    assert.deepEqual(Object.keys(KORPUS_ADLARI), ['bebek', 'ayse', 'tarik', 'olcay', 'eriskin'])
    assert.equal(YABANCI_HASTALAR.length, 2)
    assert.deepEqual([KORPUS_AYSE.yas, KORPUS_AYSE.kanGrubu, KORPUS_TARIK.kanGrubu], [5, 'AB Rh+', 'A Rh-'])
  })
})

describe('Gökhan korpusu — koşum (vekil model, gerçek rotalar)', () => {
  let satirlar: KorpusSatiri[] = []
  const SECILEN = ['L-KIMLIK-ANNE', 'C-2', 'C-3', 'R-ASI-2', 'E-01', 'L-EYLEM-HEPB', 'Y-097', 'I-01', 'L-SAYFA-KILO', 'T-088', 'T-089', 'L-AKTIF-TANSIYON', 'L-BIRIM-02', 'G-K1', 'G-K2', 'L-DANIS-12AY', 'L-DANIS-15AY', 'L-TUR-15AY', 'L-TUR-18AY', 'L-TUR-24AY', 'L-TUR-6AY-PANEL', 'L-OZET-12AY', 'L-OZET-15AY', 'L-OZET-24AY-DEVAM', 'L-OZET-ERISKIN', 'L-OZET-YABANCI', 'K-G01', 'K-OLCUM-ATES', 'K-TARIH-SON']
  before(async () => {
    await sahneHazirla()
    assert.equal(gercekModelAc(vekilOpenRouter), true)
    satirlar = await korpusuKos(korpusYukle({ idler: SECILEN }), { vekil: true })
  })
  after(() => { delete process.env.OPENROUTER_API_KEY })
  const bul = (id: string, yuzey: KorpusSatiri['yuzey']) => { const s = satirlar.find((x) => x.id === id && x.yuzey === yuzey); assert.ok(s, `${id}/${yuzey} koşmadı`); return s! }

  it('her girdi listelediği her yüzeyde bir kez koşar; denetim anahtarları koşumdan sonra temizdir', () => {
    const beklenen = korpusYukle({ idler: SECILEN }).reduce((t, g) => t + g.yuzeyler.length, 0)
    assert.equal(satirlar.length, beklenen)
    assert.equal(new Set(satirlar.map((s) => `${s.id}/${s.yuzey}`)).size, satirlar.length)
    assert.notEqual(process.env.NOTYA_KORUYUCU_KAPALI, '1')
    assert.equal(aracZorlamaKapali(), false)
    for (const s of satirlar) assert.equal(s.hata, '', `${s.id}/${s.yuzey}: ${s.hata}`)
  })

  it('modelsiz cevap vekil koşumunda da tam yargılanır: kimlik (yazıda değer, seste değersiz cümle), takvim, tablo, kapsam reddi', () => {
    const y = bul('L-KIMLIK-ANNE', 'yazi')
    assert.deepEqual([y.rota, y.karar, y.modeleGitti, y.hasta], ['kimlik', 'PASS', false, KORPUS_BEBEK_ADI])
    assert.ok(y.cevap.includes(KORPUS_BEBEK.anneAdi), y.cevap)
    const s = bul('L-KIMLIK-ANNE', 'ses')
    assert.deepEqual([s.rota, s.karar], ['kimlik', 'PASS'])
    assert.ok(!s.sozlu.includes(KORPUS_BEBEK.anneAdi) && /ekran/.test(s.sozlu), s.sozlu)
    for (const yuzey of ['yazi', 'ses'] as const) {
      assert.deepEqual([bul('C-2', yuzey).rota, bul('C-2', yuzey).karar], ['takvim', 'PASS'])
      const t = bul('R-ASI-2', yuzey)
      assert.deepEqual([t.rota, t.karar], ['kayit', 'PASS'], t.nedenler.join())
      assert.match(t.cevap, /^\| Hepatit B \|/m, 'tablo ekranda (seste de saklanan ekran cevabı)')
      assert.deepEqual([bul('G-K1', yuzey).rota, bul('G-K2', yuzey).rota, bul('G-K2', yuzey).karar], ['kapsam', 'kapsam', 'PASS'])
    }
    assert.match(bul('R-ASI-2', 'ses').sozlu, /16 kayıt/)
    assert.match(bul('L-BIRIM-02', 'ses').sozlu, /38,7 °C/, 'söz olayında birim ham; okunuşu fishMetni yazar')
    assert.equal(bul('L-BIRIM-02', 'ses').karar, 'PASS')
  })

  it('oturum: önceki tur bağlamı taşır; kaydın eskitilmesi takvim devamını keser; sayfa geçişi hastayı değiştirir', () => {
    const takip = bul('C-3', 'yazi')
    assert.deepEqual([takip.rota, takip.karar, takip.onceki], ['takvim', 'PASS', ['Bugün hiçbir randevumuz var mı?']])
    assert.equal(bul('T-088', 'yazi').rota, 'takvim')
    const eski = bul('T-089', 'yazi')
    assert.notEqual(eski.rota, 'takvim', 'on bir dakika önceki takvim sorusu artık bağlam değil')
    for (const yuzey of ['yazi', 'ses'] as const) {
      const s = bul('L-SAYFA-KILO', yuzey)
      assert.deepEqual([s.karar, s.hasta], ['PASS', KORPUS_BEBEK_ADI], `${yuzey}: ${s.nedenler.join()} ${s.cevap}`)
    }
  })

  it('araç ve kart: yazıda, seste ve dosya panelinde (konsult) telden okunur', () => {
    for (const yuzey of ['yazi', 'ses'] as const) {
      const s = bul('E-01', yuzey)
      assert.deepEqual([s.rota, s.zorlanan, s.cagrilan, s.kartlar.map((k) => k.eylem), s.hasta, s.karar], ['model', 'alerji_ekle', ['alerji_ekle'], ['alerji_ekle'], GERCEKCI_HASTA_ADI, 'PASS'])
    }
    const p = bul('L-EYLEM-HEPB', 'panel')
    assert.deepEqual([p.rota, p.cagrilan, p.kartlar.map((k) => k.eylem), p.hasta], ['panel', ['asi_kaydi_ekle'], ['asi_kaydi_ekle'], undefined])
    // The card is real; whether the model would have refused in words is not something a stand-in can show.
    assert.equal(p.karar, 'VEKIL')
  })

  it('adı geçen muayenenin ölçümü üç yüzeyde kayıttan gelir — panelde vekil ne yazarsa yazsın (NOTYA-DANIS-OLCUM)', () => {
    for (const yuzey of ['yazi', 'ses', 'panel'] as const) {
      const s = bul('L-DANIS-12AY', yuzey)
      assert.equal(s.karar, 'PASS', `${yuzey}: ${s.nedenler.join()} | ${s.cevap}`)
      assert.match(yuzey === 'ses' ? s.sozlu : s.cevap, /9,8 kg/)
      // The 15-month weight is written only in the note text.
      assert.equal(bul('L-DANIS-15AY', yuzey).karar, 'PASS', yuzey)
    }
    assert.deepEqual([bul('L-DANIS-12AY', 'yazi').rota, bul('L-DANIS-12AY', 'yazi').modeleGitti, bul('L-DANIS-12AY', 'panel').modeleGitti], ['kayit', false, true])
  })

  it('bir muayenenin özeti yazıda ve seste kayıttan güvenceye alınır: sekiz bölüm, vekil ne yazarsa yazsın — PASS, VEKIL değil (NOTYA-AYSE-OZET-01)', () => {
    for (const yuzey of ['yazi', 'ses'] as const) {
      for (const id of ['L-TUR-15AY', 'L-TUR-18AY', 'L-TUR-24AY', 'L-OZET-12AY', 'L-OZET-15AY', 'L-OZET-ERISKIN']) {
        const s = bul(id, yuzey)
        assert.deepEqual([s.karar, s.rota, s.modeleGitti], ['PASS', 'model', true], `${id}/${yuzey}: ${s.nedenler.join('; ')} | ${s.cevap.slice(0, 200)}`)
        assert.ok(!s.cevap.includes('Vekil yanıt'), `${id}/${yuzey}: vekilin cevabı hekime gitmedi`)
      }
      // The live sentence: vaccines and the three measurements are in the answer.
      const o = bul('L-OZET-12AY', yuzey)
      assert.match(o.cevap, /\*\*Aşı:\*\* Yapılmış .*KKK/)
      assert.match(o.cevap, /kilo 9,8 kg; boy 76 cm; baş çevresi 46,4 cm/)
      assert.equal(bul('L-OZET-ERISKIN', yuzey).hasta, KORPUS_ADLARI.eriskin)
      // Another doctor's patient: no chart is bound, no summary is written. Since NOTYA-IKI-BEYIN-BIRDE (3f8ca065) the
      // empty count template ("Kayıtlarda 0 hasta. Filtre: 12 aylık.") is no longer the answer — an empty search falls
      // through to the model with no chart — so the stand-in answers and the turn is VEKIL (not judged), no longer PASS.
      const y = bul('L-OZET-YABANCI', yuzey)
      assert.deepEqual([y.karar, y.hasta, y.modeleGitti], ['VEKIL', null, true], `${yuzey}: ${y.nedenler.join('; ')}`)
      assert.ok(!/\*\*Muayene:\*\*|9,8|Filtre:/.test(`${y.cevap} ${y.sozlu}`))
    }
    // Voice: the summary is HEARD — the narrative from the record, not "Dayanak. N madde, ekranınızda.".
    const ses = bul('L-OZET-12AY', 'ses')
    assert.match(ses.sozlu, /Aşı yapılmış: KPA 3\. doz, KKK 1\. doz ve Suçiçeği 1\. doz\./)
    assert.match(ses.sozlu, /kilo 9,8 kg, persentil \d+; Boy 76 cm, persentil \d+; Baş çevresi 46,4 cm, persentil \d+/)
    assert.doesNotMatch(ses.sozlu, /madde, ekranınızda|Dayanak|Vekil/)
    // NOTYA-KADEMELI-01d: the 24-month narrative no longer carries a "shift" measured from the birth value, so its
    // seven sentences are all heard in the turn — the plan sentence does not wait for "devam et" any more.
    const devam = bul('L-OZET-24AY-DEVAM', 'ses')
    assert.deepEqual([devam.karar, devam.modeleGitti], ['PASS', true], devam.nedenler.join('; '))
    assert.match(devam.sozlu, /Reçete yazılmamış; plan: Hepatit A 2\. doz planlandı/)
    assert.doesNotMatch(devam.sozlu, /persentil kayması var/)
    // The file panel has no such check: the stand-in's words are not judged there.
    assert.equal(bul('L-TUR-6AY-PANEL', 'panel').karar, 'VEKIL')
  })

  it('modelin yazdığı cevap yargılanmaz (VEKIL); yapı tuttuğu sürece FAIL değildir; başka hekimin hastası açılmaz', () => {
    for (const yuzey of ['yazi', 'ses', 'panel'] as const) {
      const s = bul('I-01', yuzey)
      assert.deepEqual([s.karar, s.modeleGitti], ['VEKIL', true], `${yuzey}: ${s.nedenler.join()}`)
    }
    assert.equal(bul('I-01', 'yazi').hasta, KORPUS_BEBEK_ADI)
    for (const yuzey of ['yazi', 'ses'] as const) {
      const s = bul('Y-097', yuzey)
      assert.deepEqual([s.karar, s.hasta], ['PASS', null])
      assert.match(yuzey === 'ses' ? s.sozlu : s.cevap, /bulamadım/)
    }
    // Adult chart, dahiliye scene: the open chart answers, on every surface.
    assert.equal(bul('L-AKTIF-TANSIYON', 'yazi').hasta, KORPUS_ADLARI.eriskin)
    assert.equal(bul('L-AKTIF-TANSIYON', 'yazi').karar, 'PASS')
    assert.equal(bul('L-AKTIF-TANSIYON', 'panel').karar, 'VEKIL')
  })

  it('kalite: her satır rubrik kararlarını taşır — modelsiz cevap yargılanır, vekilin cevabı yargılanmaz (NOTYA-KALITE-STANDART-01)', () => {
    const denetimler = (id: string, yuzey: KorpusSatiri['yuzey']) => (bul(id, yuzey).kalite || []).map((k) => `${k.kural} ${k.denetim}@${k.hedef}`)
    // The stand-in wrote these answers: no verdict, on any surface.
    for (const yuzey of ['yazi', 'ses', 'panel'] as const) assert.equal(bul('I-01', yuzey).kalite, null, yuzey)
    // A model-free written answer: wording checks on the screen text, each with its rule id.
    const yazi = denetimler('L-KIMLIK-ANNE', 'yazi')
    for (const d of ['Q-01 cevap-once@ekran', 'Q-07 hasta-adi@ekran', 'Q-11 yasak-ifade@ekran', 'Q-20 uzunluk@ekran', 'Q-32 sessiz-degil@ekran']) assert.ok(yazi.includes(d), `${d}\n${yazi.join('\n')}`)
    assert.ok(bul('L-KIMLIK-ANNE', 'yazi').kalite!.every((k) => k.gecti), JSON.stringify(bul('L-KIMLIK-ANNE', 'yazi').kalite!.filter((k) => !k.gecti)))
    // The same question on voice: the spoken sentence is judged, and no identity value was spoken.
    const ses = bul('L-KIMLIK-ANNE', 'ses').kalite!
    assert.ok(ses.some((k) => k.denetim === 'ses-kimlik' && k.hedef === 'soz' && k.gecti) && ses.some((k) => k.denetim === 'cevap-once' && k.hedef === 'soz'))
    // A single-measurement question is checked for that measurement on both surfaces; voice adds the speakable checks.
    assert.ok(denetimler('L-SAYFA-KILO', 'yazi').includes('Q-02 tek-olcum@ekran'))
    for (const d of ['Q-02 tek-olcum@soz', 'Q-31 ses-tarih@soz', 'Q-31 ses-birim@soz', 'Q-30 ses-uzunluk@soz']) assert.ok(denetimler('L-DANIS-12AY', 'ses').includes(d), d)
    // An expected refusal is the gate's fixed sentence: only "never silent" applies.
    assert.deepEqual(denetimler('G-K2', 'yazi'), ['Q-32 sessiz-degil@ekran'])
  })

  it('altın vakalar: geç girilmiş dosya yalnız kendi oturumuna eklenir; tek ölçüm sorusu tarihiyle cevaplanır; vizit tarihi vakası ya geçer ya da kusurunu adıyla söyler', () => {
    for (const yuzey of ['yazi', 'ses'] as const) {
      const ozet = bul('K-G01', yuzey)
      assert.deepEqual([ozet.karar, ozet.modeleGitti, ozet.hasta, ozet.kalite], ['VEKIL', true, KORPUS_GEC_GIRIS_ADI, null], yuzey)
      const ates = bul('K-OLCUM-ATES', yuzey)
      assert.deepEqual([ates.karar, ates.hasta], ['PASS', KORPUS_ADLARI.tarik], `${yuzey}: ${ates.nedenler.join()}`)
      assert.ok(ates.kalite!.some((k) => k.denetim === 'tek-olcum' && k.gecti), yuzey)
      // Q-06: the last visit is the day of the 18-month NOTE. Until NOTYA-VIZIT-TARIH-01 is fixed the answer gives
      // the day the visits were entered; the entry says so. When the fix lands, drop the entry's acikKusur.
      const son = bul('K-TARIH-SON', yuzey)
      assert.equal(son.hasta, KORPUS_GEC_GIRIS_ADI)
      assert.ok(son.karar === 'PASS' || (son.karar === 'FAIL' && son.acikKusur === 'NOTYA-VIZIT-TARIH-01'), `${yuzey}: ${son.karar} ${son.nedenler.join()}`)
    }
    // The panel of every other session still has five charts.
    assert.match(bul('Y-097', 'yazi').cevap, /bulamadım/)
  })

  it('kalite bölümü: puan, kural ve kategori başına geçme oranı, ihlal listesi; kuru koşum neyin ölçülmediğini söyler', () => {
    const b = kaliteBolumu(satirlar, true).join('\n')
    assert.match(b, /## Quality — measured against docs\/AYSE-KALITE-STANDARDI\.md/)
    assert.match(b, /Stand-in run: only the checks that need no model answer are comparable/)
    assert.match(b, /Quality score: \*\*\d+(\.\d)?\*\* \(\d+ of \d+ verdicts passed\)/)
    assert.match(b, /\| Q-01 \| Answer first \| \d+ \| \d+ \|/)
    assert.match(b, /\| Q-05 \| Never invent \| — \| — \| — \| not checked by the rubric \|/)
    assert.match(b, /### By check/); assert.match(b, /### By category/); assert.match(b, /### By surface/)
    assert.match(b, /### Violations — \d+ failed verdict\(s\)/)
    assert.ok(!/### Latency/.test(b), 'gecikme yalnız canlı koşumda')
    const sahte: KorpusSatiri = { ...bul('L-KIMLIK-ANNE', 'ses'), kalite: [{ kural: 'Q-31', denetim: 'ses-kimlik', hedef: 'soz', gecti: false, neden: 'kimlik değeri seslendirildi: "Elif"' }] }
    const canli = kaliteBolumu([...satirlar, sahte], false).join('\n')
    assert.match(canli, /\| L-KIMLIK-ANNE \| voice \| Q-31 \| ses-kimlik \| spoken \| kimlik değeri seslendirildi: "Elif" \|/)
    assert.match(canli, /### Latency \(Q-33\) — an indication, not a gate/)
    assert.match(canli, /\| fast \(no model\) \| \d+ \|/)
  })

  it('özet ve rapor: kaynak ve kategoriye göre döküm, FAIL listesi, kuru koşum açıkça yazar', () => {
    const o = ozetle(satirlar)
    assert.equal(o.toplam.toplam, satirlar.length)
    assert.equal(o.toplam.PASS + o.toplam.FAIL + o.toplam.MANUAL + o.toplam.VEKIL, satirlar.length)
    // A golden case that documents an open defect may fail until its fix lands (Q-40); nothing else may.
    const beklenmeyen = satirlar.filter((s) => s.karar === 'FAIL' && !s.acikKusur)
    assert.deepEqual(beklenmeyen.map((s) => `${s.id}/${s.yuzey}: ${s.nedenler.join('; ')}`), [])
    assert.ok(o.kaynak['docs/OPEN-COMMITMENTS.md'].toplam >= 10 && o.kat.kimlik.toplam === 2 && o.yuzey.panel.toplam >= 3)
    const sahte: KorpusSatiri = { ...bul('L-KIMLIK-ANNE', 'yazi'), karar: 'FAIL', nedenler: ['içermeli: Elif'], cevap: 'Anne adı kayıtlı değil.' }
    const bilinen: KorpusSatiri = { ...sahte, id: 'G-24', acikKusur: 'NOTYA-ARAMA-DOGUM-NEGASYON-01' }
    // The run's own known-defect rows (golden cases, Q-40) are left out so the two lists below hold exactly one row each.
    const rapor = korpusRaporu({ tarih: '2026-10-02', model: 'vekil', satirlar: [...satirlar.filter((s) => s.karar !== 'FAIL'), sahte, bilinen], girdiSayisi: SECILEN.length, kuru: true })
    assert.match(rapor, /DRY RUN/)
    assert.match(rapor, /live run against Luna was NOT done/)
    assert.match(rapor, /## FAIL — 1 turn\(s\)/)
    assert.match(rapor, /## FAIL on a defect the ledger already lists as OPEN — 1 turn\(s\)/)
    assert.match(rapor, /\| L-KIMLIK-ANNE \| chat \| Annesinin adı ne\? \| docs\/OPEN-COMMITMENTS\.md: NOTYA-BETA-0925/)
    assert.match(rapor, /### By source/); assert.match(rapor, /### By category/); assert.match(rapor, /## Every turn/)
    assert.ok(!/undefined|NaN/.test(rapor.replace(/"undefined"|\\bundefined\\b/g, '')), 'raporda sızıntı yok')
    const canli = korpusRaporu({ tarih: '2026-10-02', model: 'birincil-model', satirlar, girdiSayisi: SECILEN.length })
    // A live report has no stand-in banner and no "not judged" column in its summary tables.
    assert.ok(!/DRY RUN/.test(canli) && /guard disabled/.test(canli) && !/\| MANUAL \| not judged \|/.test(canli))
  })
})
