/**
 * NOTYA-ULKE-MESAJ-01 — Uzbekistan: the text of THE MESSAGES BETWEEN A DOCTOR AND A PATIENT, and what the pack says
 * about them.
 *
 * What is Uzbekistan's own here (everything else is the kit's and is tested for every pack:
 * lib/ulke/mesaj/mesaj.paket.test.ts, components/ulke/mesajEkranlari.paket.test.ts):
 *
 *   1. LEAK TEST over every string, in the three forms: same keys, nothing empty, each form in its own script (Uzbek
 *      Latin with ʻ and ʼ, never a typewriter apostrophe; no Latin letter in the Cyrillic and Russian forms), no
 *      Turkish word or letter, and the three forms really are three texts.
 *   2. The catalogue says at its top that it is machine-written and patient-facing, and the pack says the same where
 *      it switches the feature on.
 *   3. THE OUTBOUND CHANNEL IS A SLOT, SWITCHED OFF, waiting on the owner; no text of the catalogue promises a
 *      notification, an integration or an answer time.
 *   4. THE EMERGENCY NUMBER is the pack's setting, unverified, and in no sentence.
 */
process.env.NOTYA_COUNTRY = 'uz'

import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { sizintiTara } from '@/lib/ulke/testing/sizintiTarayici'

const KOK = resolve(__dirname, '../../..')
const FORMLAR = ['uz-Latn', 'uz-Cyrl', 'ru'] as const
const temiz = (metin: string, kaynak: string) => assert.deepEqual(sizintiTara(metin, { hedefUlke: 'uz', kaynak }), [])
function yaprak(o: unknown, on = ''): [string, string][] {
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => (typeof v === 'string' ? [[`${on}${k}`, v] as [string, string]] : yaprak(v, `${on}${k}.`)))
}

/** The checks every catalogue of this job shares: three forms, same keys, own script, nothing of another country. */
export function ucBicimDenetle(katalog: Readonly<Record<(typeof FORMLAR)[number], unknown>>, ad: string, adet: number) {
  const [lat, kir, ru] = FORMLAR.map((f) => yaprak(katalog[f]))
  assert.equal(lat.length, adet, `the ${ad} catalogue has ${lat.length} entries per form`)
  assert.deepEqual(kir.map((x) => x[0]), lat.map((x) => x[0])); assert.deepEqual(ru.map((x) => x[0]), lat.map((x) => x[0]))
  for (let i = 0; i < lat.length; i++) {
    const k = lat[i][0]
    for (const [f, v] of [['uz-Latn', lat[i][1]], ['uz-Cyrl', kir[i][1]], ['ru', ru[i][1]]] as const) {
      assert.ok(v.trim().length > 0, `${ad} ${f}/${k} is empty`)
      temiz(v, `${ad} ${f}/${k}`)
      assert.doesNotMatch(v, /[çğıİşĞŞöüÖÜâîû]/, `${ad} ${f}/${k} has a Turkish letter`)
      assert.doesNotMatch(v, /'|`/, `${ad} ${f}/${k}: a typewriter apostrophe (Uzbek Latin uses ʻ and ʼ)`)
      assert.doesNotMatch(v, /hasta|randevu|doktor|hekim|muayene|özet|mesaj|şablon|sablon|konsült/i, `${ad} ${f}/${k} carries a Turkish word`)
    }
    assert.doesNotMatch(lat[i][1], /[Ѐ-ӿ]/, `${ad} uz-Latn/${k} has a Cyrillic letter`)
    assert.doesNotMatch(kir[i][1], /[A-Za-z]/, `${ad} uz-Cyrl/${k} has a Latin letter`)
    assert.doesNotMatch(ru[i][1], /[A-Za-zўқғҳЎҚҒҲ]/, `${ad} ru/${k} has a Latin or Uzbek-only letter`)
    // The three forms really are three texts: Cyrillic Uzbek is not the Russian line, nor the Latin one.
    if (/\p{L}{4,}/u.test(lat[i][1])) {
      assert.notEqual(kir[i][1], lat[i][1], `${ad} ${k}: the Cyrillic form is the Latin text`)
      assert.notEqual(kir[i][1], ru[i][1], `${ad} ${k}: the Cyrillic Uzbek form is the Russian text`)
    }
    // A sentence keeps its placeholders in every form.
    const yer = (s: string) => [...s.matchAll(/%\d?/g)].map((x) => x[0]).sort().join()
    assert.equal(yer(kir[i][1]), yer(lat[i][1]), `${ad} ${k}: placeholders differ (Cyrillic)`); assert.equal(yer(ru[i][1]), yer(lat[i][1]), `${ad} ${k}: placeholders differ (Russian)`)
  }
}

describe('Uzbekistan — messages between a doctor and a patient: text in three forms, and the pack\'s settings', () => {
  let MM: typeof import('./mesajMetinleri')
  let P: typeof import('../index')
  before(async () => { MM = await import('./mesajMetinleri'); P = await import('../index') })

  it('the catalogue says, at its top, that it is machine-written, patient-facing, awaits native review and has not been read by a lawyer', () => {
    const katalog = readFileSync(join(KOK, 'countries/uz/uygulama/mesajMetinleri.ts'), 'utf8').slice(0, 2400)
    assert.match(katalog, /MACHINE-WRITTEN\. AWAITS NATIVE REVIEW\./); assert.match(katalog, /PATIENT-FACING/)
    assert.match(katalog, /DERIVED FROM THE LATIN TEXT BY RULE/); assert.match(katalog, /has not been read by a lawyer/)
    assert.match(katalog, /THE NUMBER IS NOT IN THIS FILE/)
  })

  it('LEAK TEST over every string, in all three forms: same keys, nothing empty, each form in its own script, no Turkish word or letter', () => {
    ucBicimDenetle(MM.UZ_MESAJ_METINLERI, 'messages', 49)
  })

  it('THE OUTBOUND CHANNEL IS A SLOT: switched off, no provider, says what is missing and that it waits on the owner; the feature is on and says it is machine-written', () => {
    const p = P.UZ_PAKETI
    assert.equal(p.ozellikler.hastaMesajlari, true)
    assert.deepEqual([p.uygulama!.mesaj!.disBildirim.acik, p.uygulama!.mesaj!.disBildirim.saglayici], [false, null])
    assert.match(p.uygulama!.mesaj!.disBildirim.eksik, /no provider is contracted/)
    assert.match(p.uygulama!.mesaj!.disBildirim.kimden, /^Kaan \(provider and cost/)
    const kaynak = readFileSync(join(KOK, 'countries/uz/index.ts'), 'utf8')
    assert.match(kaynak, /hastaMesajlari: true/); assert.match(kaynak, /machine-written and no native reader\s+\/\/ has read them/)
    assert.match(kaynak, /A SLOT, SWITCHED OFF/)
  })

  it('NO PROMISE THE PRODUCT DOES NOT KEEP: no sentence says the patient is notified, names a messenger or an integration, or promises an answer time', () => {
    for (const f of FORMLAR) {
      const m = MM.UZ_MESAJ_METINLERI[f]
      for (const [k, v] of yaprak(m)) {
        assert.doesNotMatch(v, /SMS|СМС|Telegram|Телеграм|WhatsApp|e-mail|эл\.\s*почт|электрон|elektron pochta/i, `${f}/${k} names an outbound channel`)
        assert.doesNotMatch(v, /\d/, `${f}/${k} carries a digit`)
      }
      // The doctor is told plainly that nobody is notified; the patient that no answer time is promised and that they cannot start.
      assert.ok(m.hekim.bildirimYok.length > 30 && m.hasta.yanitSuresi.length > 30 && m.hasta.baslatamaz.length > 30)
    }
    assert.match(MM.UZ_MESAJ_METINLERI.ru.hekim.bildirimYok, /не оповещает/)
    assert.match(MM.UZ_MESAJ_METINLERI.ru.hasta.yanitSuresi, /не гарантируется/)
    assert.match(MM.UZ_MESAJ_METINLERI.ru.hasta.baslatamaz, /Начать переписку отсюда вы не можете/)
    assert.match(MM.UZ_MESAJ_METINLERI['uz-Latn'].hasta.acil, /shoshilinch holatlar uchun emas/)
  })

  it('THE EMERGENCY NUMBER is the pack\'s setting (unverified, said so where it is set) and stands in no sentence; each form has the place for it', () => {
    assert.equal(P.UZ_PAKETI.uygulama!.portal!.acilNumara, '103')
    assert.match(readFileSync(join(KOK, 'countries/uz/index.ts'), 'utf8'), /103 was written by Claude from general knowledge\s+\/\/ and is UNVERIFIED/)
    for (const f of FORMLAR) {
      const h = MM.UZ_MESAJ_METINLERI[f].hasta
      assert.doesNotMatch(`${h.acil} ${h.acilNumara}`, /103|\d/)
      assert.match(h.acilNumara, /%(?!\d)/)
    }
  })
})

describe('Uzbekistan — "my templates": text in three forms, and that the pack brings no template of its own', () => {
  let SM: typeof import('./sablonMetinleri')
  let P: typeof import('../index')
  let AR: typeof import('./araclar')
  before(async () => { SM = await import('./sablonMetinleri'); P = await import('../index'); AR = await import('./araclar') })

  it('the catalogue says, at its top, that it is machine-written and awaits native review', () => {
    const katalog = readFileSync(join(KOK, 'countries/uz/uygulama/sablonMetinleri.ts'), 'utf8').slice(0, 1800)
    assert.match(katalog, /MACHINE-WRITTEN\. AWAITS NATIVE REVIEW\./); assert.match(katalog, /DERIVED FROM THE LATIN TEXT BY RULE/); assert.match(katalog, /NO TEMPLATE IS IN THIS FILE/)
  })

  it('LEAK TEST over every string, in all three forms: same keys, nothing empty, each form in its own script, no Turkish word or letter', () => {
    ucBicimDenetle(SM.UZ_SABLON_METINLERI, 'templates', 29)
  })

  it('the feature is on, its tile is a BASE tool with its words in three forms, and THE PACK HOLDS NO READY-MADE TEMPLATE', () => {
    assert.equal(P.UZ_PAKETI.ozellikler.hekimSablonlari, true)
    const kutu = AR.UZ_ARACLAR.araclar.find((p) => p.anahtar === 'sablonlarim')
    assert.ok(kutu); assert.equal(kutu!.roller, null)
    ucBicimDenetle({ 'uz-Latn': { ad: kutu!.metin.ad['uz-Latn'], aciklama: kutu!.metin.aciklama['uz-Latn'], not: kutu!.metin.not['uz-Latn'] }, 'uz-Cyrl': { ad: kutu!.metin.ad['uz-Cyrl'], aciklama: kutu!.metin.aciklama['uz-Cyrl'], not: kutu!.metin.not['uz-Cyrl'] }, ru: { ad: kutu!.metin.ad.ru, aciklama: kutu!.metin.aciklama.ru, not: kutu!.metin.not.ru } }, 'templates tile', 3)
    // no file of the pack defines a template's text: the only strings about templates are the screen's own words
    const dosya = readFileSync(join(KOK, 'countries/uz/uygulama/sablonMetinleri.ts'), 'utf8')
    assert.doesNotMatch(dosya, /kapsam: '(not|mesaj|hepsi)'|icerik_encrypted|SABLONLAR\s*=/, 'the pack ships a template of its own')
    for (const f of FORMLAR) assert.ok(SM.UZ_SABLON_METINLERI[f].uyari.length > 40, `${f}: the notice that no patient's data belongs in a template`)
    assert.match(SM.UZ_SABLON_METINLERI.ru.uyari, /Не вносите в шаблон имя или данные пациента/)
    assert.match(SM.UZ_SABLON_METINLERI.ru.seciciNot, /в конец написанного; ничего не заменяется/)
  })
})

describe('Uzbekistan — consultation between doctors: text in three forms, the periods, and the consent sentence that awaits a lawyer', () => {
  let KM: typeof import('./konsultasyonMetinleri')
  let P: typeof import('../index')
  let KL: typeof import('../klinik')
  let AR: typeof import('./araclar')
  before(async () => { KM = await import('./konsultasyonMetinleri'); P = await import('../index'); KL = await import('../klinik'); AR = await import('./araclar') })

  it('the catalogue says, at its top, that it is machine-written, and that THE CONSENT SENTENCE HAS NOT BEEN READ BY A LAWYER', () => {
    const katalog = readFileSync(join(KOK, 'countries/uz/uygulama/konsultasyonMetinleri.ts'), 'utf8').slice(0, 2600)
    assert.match(katalog, /MACHINE-WRITTEN\. AWAITS NATIVE REVIEW\./); assert.match(katalog, /DERIVED FROM THE LATIN TEXT BY RULE/)
    assert.match(katalog, /IS A LEGAL SENTENCE AND HAS NOT BEEN READ BY A LAWYER/); assert.match(katalog, /CHANGE THE STAMP\s+\* WHENEVER THE SENTENCE CHANGES/)
  })

  it('LEAK TEST over every string, in all three forms: same keys, nothing empty, each form in its own script, no Turkish word or letter', () => {
    ucBicimDenetle(KM.UZ_KONSULTASYON_METINLERI, 'consultation', 82)
    const kutu = AR.UZ_ARACLAR.araclar.find((p) => p.anahtar === 'konsultasyonlar')
    assert.ok(kutu); assert.equal(kutu!.roller, null)
    ucBicimDenetle({ 'uz-Latn': { ad: kutu!.metin.ad['uz-Latn'], aciklama: kutu!.metin.aciklama['uz-Latn'], not: kutu!.metin.not['uz-Latn'] }, 'uz-Cyrl': { ad: kutu!.metin.ad['uz-Cyrl'], aciklama: kutu!.metin.aciklama['uz-Cyrl'], not: kutu!.metin.not['uz-Cyrl'] }, ru: { ad: kutu!.metin.ad.ru, aciklama: kutu!.metin.aciklama.ru, not: kutu!.metin.not.ru } }, 'consultation tile', 3)
  })

  it('THE PERIODS are the pack\'s, said to be starting values where they are set; THE CONSENT\'S STAMP is stated, and no lawyer has read the sentence', () => {
    assert.equal(P.UZ_PAKETI.ozellikler.konsultasyon, true)
    assert.deepEqual(P.UZ_PAKETI.uygulama!.konsultasyon, { acikGun: 30, kapanisSonrasiGun: 14 })
    assert.match(readFileSync(join(KOK, 'countries/uz/index.ts'), 'utf8'), /STARTING VALUES, NOT A LOCAL RULE: nobody has\s+\/\/ checked them against the country's law/)
    assert.deepEqual(KL.UZ_KLINIK.konsultasyonRizasi, { surum: 'uz-konsultatsiya-taslak-2026-10-09', hukukcuInceledi: false })
    assert.match(readFileSync(join(KOK, 'countries/uz/klinik/index.ts'), 'utf8'), /A DRAFT: no lawyer of the country has read the sentence/)
  })

  it('THE CONSENT SENTENCE says who agreed, to what and for what — and nothing in the catalogue claims a law, a state system or a notification', () => {
    for (const f of FORMLAR) {
      const k = KM.UZ_KONSULTASYON_METINLERI[f]
      assert.ok(k.iste.riza.length > 80, `${f}: the consent sentence`); assert.doesNotMatch(k.iste.riza, /%/)
      for (const [ad, v] of yaprak(k)) {
        assert.doesNotMatch(v, /SMS|СМС|Telegram|Телеграм|WhatsApp|e-mail|эл\.\s*почт|электрон|elektron pochta/i, `${f}/${ad} names an outbound channel`)
        assert.doesNotMatch(v, /qonunga muvofiq|қонунга мувофиқ|соответств\w* закон|в соответствии с|sertifikat|сертифи|litsenziya|лиценз|vazirli|вазирли|министерств/i, `${f}/${ad} claims compliance or names an authority`)
      }
      // the doctor is told that nobody is notified, that the colleague sees a copy and nothing else, and that there is no directory
      assert.ok(k.iste.bildirimYok.length > 30 && k.gelen.aciklama.length > 60 && k.kod.aciklama.length > 60)
    }
    assert.match(KM.UZ_KONSULTASYON_METINLERI.ru.iste.riza, /пациент \(или его законный представитель\) согласился/)
    assert.match(KM.UZ_KONSULTASYON_METINLERI.ru.kod.aciklama, /Списка врачей нет/)
    assert.match(KM.UZ_KONSULTASYON_METINLERI.ru.gelen.aciklama, /Остальная карта пациента вам не открыта/)
    assert.match(KM.UZ_KONSULTASYON_METINLERI['uz-Latn'].iste.riza, /rozi boʻlganini tasdiqlayman/)
  })
})

describe('Uzbekistan — THE RECORD: what a patient reads in the messages, and what a lawyer must read, exactly as it stands in the code', () => {
  let MM: typeof import('./mesajMetinleri')
  let KM: typeof import('./konsultasyonMetinleri')
  let P: typeof import('../index')
  let KL: typeof import('../klinik')
  before(async () => { MM = await import('./mesajMetinleri'); KM = await import('./konsultasyonMetinleri'); P = await import('../index'); KL = await import('../klinik') })
  const kayit = () => readFileSync(join(KOK, 'docs/COUNTRY-PACK-UZBEKISTAN.md'), 'utf8')

  it('FOR THE NATIVE READER: the country\'s record lists every patient-facing sentence of the messages, in three forms', () => {
    const belge = kayit()
    assert.match(belge, /^## Messages, "my templates" and consultation \(2026-10-09, NOTYA-ULKE-MESAJ-01\)$/m)
    assert.match(belge, /^### Patient-facing sentences of the messages, for the native reader$/m)
    let n = 0
    for (const [k] of yaprak(MM.UZ_MESAJ_METINLERI['uz-Latn'].hasta)) {
      for (const f of FORMLAR) {
        const v = (MM.UZ_MESAJ_METINLERI[f].hasta as unknown as Record<string, string>)[k]
        assert.ok(belge.includes(`| ${v.replace(/\|/g, '\\|')} |`), `docs/COUNTRY-PACK-UZBEKISTAN.md does not list ${f} hasta.${k}: "${v}" — the list in the record must be the text in countries/uz/uygulama/mesajMetinleri.ts`)
        n++
      }
    }
    assert.equal(n, 21 * 3, 'every patient-facing sentence of the messages, in three forms')
  })

  it('FOR THE LAWYER: the record carries the consent sentence of a consultation in three forms, its stamp, both periods, and says that all of it is unverified', () => {
    const belge = kayit()
    assert.match(belge, /^### The consent sentence of a consultation, for the lawyer$/m)
    for (const f of FORMLAR) for (const k of ['rizaBaslik', 'riza', 'rizaGerekli'] as const) assert.ok(belge.includes(KM.UZ_KONSULTASYON_METINLERI[f].iste[k]), `the record does not carry ${f} iste.${k} as it stands in the code`)
    assert.ok(belge.includes(`\`${KL.UZ_KLINIK.konsultasyonRizasi!.surum}\`, \`hukukcuInceledi: false\``), 'the stamp of the consent sentence, and that no lawyer has read it')
    const k = P.UZ_PAKETI.uygulama!.konsultasyon!
    assert.match(belge, new RegExp(`\\| A consultation stays open \\(\`uygulama\\.konsultasyon\\.acikGun\`\\) \\| ${k.acikGun} days \\| \\*\\*A starting value, not a local rule\\.\\*\\*`))
    assert.match(belge, new RegExp(`\\| The colleague may read it after the closing \\(\`kapanisSonrasiGun\`\\) \\| ${k.kapanisSonrasiGun} days \\| \\*\\*A starting value, not a local rule\\.\\*\\*`))
    assert.match(belge, /\| Outbound notification to a patient \(`uygulama\.mesaj\.disBildirim`\) \| \*\*off, no provider\*\* \| A slot\. Waits on Kaan/)
    assert.match(belge, /migrations 140, 141 and 142 are not applied to any database/)
  })
})
