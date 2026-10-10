/**
 * NOTYA-ULKE-ARACLAR-01 — Uzbekistan: THE CYRILLIC FORM OF THE TOOL TEXTS CAN BE MADE AGAIN.
 *
 * The Uzbek Cyrillic text of every tool is derived from its Latin text by rule (scripts/uz-kiril.mjs), stored
 * static, and marked machine-written. This test holds the two together: every stored Cyrillic text of a tool, and
 * every unit name, is exactly what the rule gives for its Latin text today. A text corrected by a native reader
 * will differ from the rule on purpose — then it is named in ELLE_DUZELTILEN below, with who corrected it.
 */
process.env.NOTYA_COUNTRY = 'uz'

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { dosyayiDoldur, katalogCevir, katalogKaynagi, kirill } from '../../../../scripts/uz-kiril.mjs'
import { UZ_KLINIK_LATN, UZ_KLINIK_METINLERI } from '../klinikMetinleri'
import { UZ_ARACLAR } from './index'
import { UZ_MESAJ_AGACI } from '../mesajMetinleri'
import { UZ_SABLON_AGACI } from '../sablonMetinleri'
import { UZ_KONSULTASYON_AGACI } from '../konsultasyonMetinleri'

/**
 * NOTYA-ULKE-MESAJ-01 — catalogues of the pack that are written as one tree in the three forms (../uclu.ts): their
 * Cyrillic form is derived by the same rule and held to it here, exactly like the tool texts.
 */
const UC_BICIMLI_KATALOGLAR: readonly { ad: string; dosya: string; agac: unknown; enAz: number }[] = [
  { ad: 'mesaj', dosya: 'countries/uz/uygulama/mesajMetinleri.ts', agac: UZ_MESAJ_AGACI, enAz: 49 },
  { ad: 'sablon', dosya: 'countries/uz/uygulama/sablonMetinleri.ts', agac: UZ_SABLON_AGACI, enAz: 29 },
  { ad: 'konsultasyon', dosya: 'countries/uz/uygulama/konsultasyonMetinleri.ts', agac: UZ_KONSULTASYON_AGACI, enAz: 82 },
]

const KOK = resolve(__dirname, '../../../..')
/**
 * path of a text → who corrected its Cyrillic form by hand, and what.
 *
 * NO NATIVE READER HAS READ THE TEXTS YET. The entries below are NOT a native reader's: they are the country audit of
 * 2026-10-09 (docs/COUNTRY-AUDIT-UZBEKISTAN.md, fix D2). The rule spells a loan word letter by letter, and its list
 * of loan words (SOZLUK in scripts/uz-kiril.mjs) does not hold these stems, so the stored text read «тс» where Uzbek
 * in Cyrillic script writes «ц», and lacked «ъ» / «ь». Each word was corrected in the stored text only; the Latin
 * text is untouched. When the rule's list learns a stem, the entry here becomes unnecessary and the test below
 * ("every hand correction is still needed") fails by name until it is removed.
 */
const DENETIM = 'country audit 2026-10-09, machine, awaits a native reader'
const ELLE_DUZELTILEN: Readonly<Record<string, string>> = {
  'easi.aciklama': `${DENETIM}: коэффициент (the rule: коэффитсиент)`,
  'scorad.sayilar.c': `${DENETIM}: субъектив (the rule: субектив)`,
  'yama-okuma.ad': `${DENETIM}: аппликацион (the rule: аппликатсион)`,
  'toraks-preop.alanlar.goruntu_hazir': `${DENETIM}: компьютер (the rule: компютер)`,
  'otoskopi-notu.alanlar.sag_zar_tup_var': `${DENETIM}: вентиляцион (the rule: вентилятсион)`,
  'otoskopi-notu.alanlar.sol_zar_tup_var': `${DENETIM}: вентиляцион (the rule: вентилятсион)`,
  'vertigo-notu.ad': `${DENETIM}: позицион (the rule: позитсион)`,
  'vertigo-notu.bantlar.manevra_uygun_degil': `${DENETIM}: репозицион (the rule: репозитсион)`,
  'vertigo-notu.uyarilar.repozisyon_santral': `${DENETIM}: репозицион (the rule: репозитсион)`,
  'doz-hesabi.aciklama': `${DENETIM}: концентрация (the rule: консентрация)`,
  'doz-hesabi.alanlar.kons_mg': `${DENETIM}: концентрация (the rule: консентрация)`,
  'doz-hesabi.alanlar.kons_ml': `${DENETIM}: концентрация (the rule: консентрация)`,
  'tetkik-kuyrugu.secenekler.modalite.bt': `${DENETIM}: компьютер (the rule: компютер)`,
  'das28.alanlar.esr': `${DENETIM}: эритроцитлар (the rule: эритротситлар)`,
  'das28.secenekler.varyant.esr': `${DENETIM}: эритроцитлар (the rule: эритротситлар)`,
  'psa-hizi.ad': `${DENETIM}: специфик (the rule: спетсифик)`,
}
/** Letter sequences the rule leaves in a loan word and Uzbek in Cyrillic script does not write. Native words with «тс» (бахтсиз, ҳаракатсиз: -сиз after т) are not in this list. */
const KURALIN_BIRAKTIGI = /тсион|тсиент|ротсит|петсифик|субектив|обектив|компютер|консентрац/i

describe('Uzbek tools — Latin to Cyrillic by rule', () => {
  it('the rule: the letters of the 1995 Latin alphabet, the digraphs, the two apostrophes, e and the yo/yu/ya pairs', () => {
    const ornekler: [string, string][] = [
      ['Oʻzbekiston', 'Ўзбекистон'], ['gʻoz', 'ғоз'], ['shifokor', 'шифокор'], ['chap', 'чап'], ['qon', 'қон'], ['hafta', 'ҳафта'], ['xulosa', 'хулоса'],
      ['maʼlumot', 'маълумот'], ['yoʻq', 'йўқ'], ['yordam', 'ёрдам'], ['yurak', 'юрак'], ['yaxshi', 'яхши'], ['yetarli', 'етарли'],
      ['emas', 'эмас'], ['bemor', 'бемор'], ['aeroport', 'аэропорт'], ['Bemor sahifasi', 'Бемор саҳифаси'], ['Keyingi nazorat', 'Кейинги назорат'],
    ]
    for (const [latin, kiril] of ornekler) assert.equal(kirill(latin), kiril, latin)
  })

  it('loan words the rule alone would misspell are spelled from the list, and abbreviations the profession writes in Latin letters stay', () => {
    assert.equal(kirill('infeksiya'), 'инфекция')
    assert.equal(kirill('konsultatsiya'), 'консультация')
    assert.equal(kirill('Dializ sikli'), 'Диализ цикли')
    assert.equal(kirill('C-reaktiv oqsil'), 'С-реактив оқсил')
    assert.equal(kirill('KDIGO G3a, ASA III, DAS28'), 'KDIGO G3a, ASA III, DAS28')
    assert.equal(kirill('30 mg/g dan past'), '30 мг/г дан паст')
    assert.doesNotMatch(kirill('Belgilangan bandlar va keyingi nazorat sanasi'), /[A-Za-z]/)
  })

  it('EVERY stored Cyrillic text of a tool and every unit name is what the rule gives for its Latin text', () => {
    let sayi = 0
    const farkli: string[] = []
    const gez = (x: unknown, yol: string) => {
      if (!x || typeof x !== 'object') return
      const o = x as Record<string, unknown>
      if (typeof o['uz-Latn'] === 'string' && typeof o['uz-Cyrl'] === 'string') {
        sayi++
        if (kirill(o['uz-Latn']) !== o['uz-Cyrl'] && !ELLE_DUZELTILEN[yol]) farkli.push(`${yol}: stored "${o['uz-Cyrl']}", the rule gives "${kirill(o['uz-Latn'])}"`)
        return
      }
      for (const [k, v] of Object.entries(o)) gez(v, `${yol}.${k}`)
    }
    for (const a of UZ_ARACLAR.araclar) gez(a.metin, a.anahtar)
    gez(UZ_ARACLAR.birimler, 'birimler')
    assert.ok(sayi > 500, `only ${sayi} texts were compared`)
    assert.deepEqual(farkli, [])
  })

  // Country audit 2026-10-09 (docs/COUNTRY-AUDIT-UZBEKISTAN.md, fix D2).
  it('every hand correction is still needed, names a text that exists, and no stored Cyrillic text of a tool keeps a loan word spelled letter by letter', () => {
    const bulunan = new Map<string, { latin: string; kiril: string }>()
    const gez = (x: unknown, yol: string) => {
      if (!x || typeof x !== 'object') return
      const o = x as Record<string, unknown>
      if (typeof o['uz-Latn'] === 'string' && typeof o['uz-Cyrl'] === 'string') { bulunan.set(yol, { latin: o['uz-Latn'], kiril: o['uz-Cyrl'] }); return }
      for (const [k, v] of Object.entries(o)) gez(v, `${yol}.${k}`)
    }
    for (const a of UZ_ARACLAR.araclar) gez(a.metin, a.anahtar)
    for (const [yol, kim] of Object.entries(ELLE_DUZELTILEN)) {
      const t = bulunan.get(yol)
      assert.ok(t, `${yol}: listed as corrected by hand, and no such text exists`)
      assert.ok(kim.trim().length > 0, `${yol}: who corrected it is not stated`)
      assert.notEqual(kirill(t.latin), t.kiril, `${yol}: the rule now gives the stored text — remove it from ELLE_DUZELTILEN`)
      assert.doesNotMatch(t.kiril, /[A-Za-z]{4,}/, `${yol}: a Latin word is left in the corrected Cyrillic text`)
    }
    const kalan = [...bulunan].filter(([, t]) => KURALIN_BIRAKTIGI.test(t.kiril)).map(([yol, t]) => `${yol}: "${t.kiril}"`)
    assert.deepEqual(kalan, [])
  })

  it('EVERY stored Cyrillic text of the catalogues written in three forms side by side is what the rule gives for its Latin text, and none is left empty', () => {
    for (const k of UC_BICIMLI_KATALOGLAR) {
      let sayi = 0
      const farkli: string[] = []
      const gez = (x: unknown, yol: string) => {
        if (!x || typeof x !== 'object') return
        const o = x as Record<string, unknown>
        if (typeof o['uz-Latn'] === 'string' && typeof o['uz-Cyrl'] === 'string') {
          sayi++
          if (kirill(o['uz-Latn']) !== o['uz-Cyrl'] && !ELLE_DUZELTILEN[yol]) farkli.push(`${yol}: stored "${o['uz-Cyrl']}", the rule gives "${kirill(o['uz-Latn'])}"`)
          assert.doesNotMatch(o['uz-Cyrl'], /[A-Za-z]/, `${yol}: a Latin letter is left in the Cyrillic form`)
          return
        }
        for (const [ad, v] of Object.entries(o)) gez(v, `${yol}.${ad}`)
      }
      gez(k.agac, k.ad)
      assert.ok(sayi >= k.enAz, `${k.ad}: only ${sayi} texts were compared`)
      assert.deepEqual(farkli, [], k.ad)
      assert.equal(dosyayiDoldur(readFileSync(join(KOK, k.dosya), 'utf8')).n, 0, `${k.dosya} still has a text without its Cyrillic form`)
    }
  })

  it('filling a file: only an EMPTY Cyrillic argument is written; a text that is already there is never overwritten', () => {
    const once = `x: u('Keyingi nazorat', '', 'Следующий контроль'),\ny: u('Bemor', 'ЭЛДА ЁЗИЛГАН', 'Пациент'),\nz: vazifa('yara nazorati', '', 'контроль раны'),`
    const { yeni, n } = dosyayiDoldur(once)
    assert.equal(n, 2)
    assert.equal(yeni, `x: u('Keyingi nazorat', 'Кейинги назорат', 'Следующий контроль'),\ny: u('Bemor', 'ЭЛДА ЁЗИЛГАН', 'Пациент'),\nz: vazifa('yara nazorati', 'яра назорати', 'контроль раны'),`)
    assert.deepEqual(dosyayiDoldur(yeni), { yeni, n: 0 }, 'a second run changes nothing')
  })

  it('the pack\'s own files have no empty Cyrillic argument left', () => {
    const dizin = join(KOK, 'countries/uz/uygulama/araclar')
    for (const d of readdirSync(dizin).filter((x) => x.endsWith('.ts') && !x.endsWith('.test.ts'))) assert.equal(dosyayiDoldur(readFileSync(join(dizin, d), 'utf8')).n, 0, `${d} still has a text without its Cyrillic form`)
  })

  // NOTYA-ULKE-KLINIK-01 — the clinic accounts catalogue is written in Latin script and in Russian; its Cyrillic form is
  // a file of its own, derived whole. UZ_KIRIL_YAZ=1 makes that file again from the Latin text; without it the test
  // only compares.
  it('the CLINIC ACCOUNTS catalogue: the stored Cyrillic file is byte for byte what the rule gives for the Latin catalogue', () => {
    const yol = join(KOK, 'countries/uz/uygulama/klinikMetinleriKiril.ts')
    const beklenen = katalogKaynagi(UZ_KLINIK_LATN, {
      ustYazi: [
        '/**',
        ' * NOTYA-ULKE-KLINIK-01 — Uzbekistan: the CLINIC ACCOUNTS catalogue in UZBEK CYRILLIC.',
        ' *',
        ' * DERIVED BY RULE, NOT WRITTEN: every text here is its Latin text in ./klinikMetinleri.ts put through',
        ' * scripts/uz-kiril.mjs, letter by letter. DO NOT EDIT THIS FILE. Change the Latin text and make this file again:',
        ' *',
        ' *     UZ_KIRIL_YAZ=1 npx tsx --test countries/uz/uygulama/araclar/kiril.test.ts',
        ' *',
        ' * The same test fails when this file is not exactly what the rule gives.',
        ' * MACHINE-WRITTEN. AWAITS NATIVE REVIEW: a rule cannot know every Cyrillic spelling, and nobody who reads Uzbek',
        ' * in Cyrillic script has read this text yet (docs/COUNTRY-PACK-UZBEKISTAN.md, "Clinic accounts"; checklist E2, E11).',
        ' */',
      ].join('\n'),
      ithalat: "import type { KlinikMetni } from '@/lib/ulke/arayuz/metinTipleri'",
      bildirim: 'export const UZ_KLINIK_KIRIL: KlinikMetni =',
    })
    if (process.env.UZ_KIRIL_YAZ === '1') writeFileSync(yol, beklenen)
    assert.equal(readFileSync(yol, 'utf8'), beklenen, 'countries/uz/uygulama/klinikMetinleriKiril.ts is not what the rule gives: make it again (see the top of that file)')
    assert.deepEqual(UZ_KLINIK_METINLERI['uz-Cyrl'], katalogCevir(UZ_KLINIK_LATN))
    // No Latin letter is left in it, and every placeholder is where the Latin text has it.
    const duz = (x: unknown): string[] => (typeof x === 'string' ? [x] : x && typeof x === 'object' ? Object.values(x).flatMap(duz) : [])
    const latin = duz(UZ_KLINIK_LATN), kiril = duz(UZ_KLINIK_METINLERI['uz-Cyrl'])
    assert.ok(latin.length >= 170 && latin.length === kiril.length, `${latin.length} Latin texts, ${kiril.length} Cyrillic`)
    for (const [i, k] of kiril.entries()) {
      assert.doesNotMatch(k, /[A-Za-z]/, `"${k}" still holds a Latin letter`)
      assert.deepEqual(k.match(/%\d?/g) ?? [], latin[i].match(/%\d?/g) ?? [], `"${k}": its placeholders differ from the Latin text's`)
    }
  })

  it('COUNTRY TOOLING ONLY: no build step, no application file and no other script imports or runs it', () => {
    const pkg = readFileSync(join(KOK, 'package.json'), 'utf8')
    assert.doesNotMatch(pkg, /uz-kiril/)
    const gez = (dizin: string, cikti: string[] = []): string[] => {
      for (const ad of readdirSync(join(KOK, dizin), { withFileTypes: true })) {
        if (ad.name === 'node_modules' || ad.name.startsWith('.')) continue
        const yol = `${dizin}/${ad.name}`
        if (ad.isDirectory()) gez(yol, cikti)
        else if (/\.(ts|tsx|mjs|mts|js)$/.test(ad.name)) cikti.push(yol)
      }
      return cikti
    }
    const okuyan = ['app', 'components', 'lib', 'countries', 'scripts'].flatMap((d) => gez(d)).filter((d) => !/uz-kiril\.(mjs|d\.mts)$/.test(d) && !d.endsWith('araclar/kiril.test.ts') && /(from\s*|import\(\s*|require\(\s*|spawn\w*\([^)]*)['"`][^'"`]*uz-kiril/.test(readFileSync(join(KOK, d), 'utf8')))
    assert.deepEqual(okuyan, [])
  })
})
