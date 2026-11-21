/**
 * DIKTE-TIBBI-01 — medical dictation repair. The first case is the KBB doctor's dictation of 2026-11-21, verbatim as
 * the recogniser returned it.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'fs'
import path from 'path'
import { anahtar, hedefIndeksiKur, tibbiDuzelt } from './duzelt'
import { dikteBransKey, dikteSozluguYukle, DIKTE_BRANSLARI } from './sozluk'
import { anahtarTerimler, ANAHTAR_TERIM_AZAMI } from './anahtarTerim'
import { ciftBicimi, degisenParcalar, duzeltmedenCiftler, otomatikCiftMi } from './ogren'
import { ilacIndeksi } from './ilacSozlugu'
import { SPECIALTIES } from '@/lib/doktor/specialties'
import { KLINIK_YENI_SLUGS } from '@/lib/specialties/klinikDikey'

const DUYULAN =
  "Konak Mahallesi'nde tem panik membran intak boğazı Araf Fenk saf hiper amik ağız ve stubble iyi ağız tabağında Wirthon ofisleri açık salgı geliyor Nazan endoskopi de mukoza biraz soluk ortaya atışlardan hafif muko salgı Mopar ilerliyor sağ orta conta paradoks"

describe('KBB dictation of 2026-11-21', async () => {
  const sozluk = await dikteSozluguYukle('kulak-burun-bogaz')
  const { metin, degisiklikler } = tibbiDuzelt(DUYULAN, { sozluk, ilaclar: ilacIndeksi() })

  for (const beklenen of [
    'kulak muayenesinde', 'timpanik membran', 'intakt', 'orofarenks', 'hiperemik', 'ağız vestibülü', 'ağız tabanında',
    'Wharton orifisleri', 'nazal endoskopi', 'orta meatus', 'mukoid', 'nazofarenks', 'orta konka paradoks',
  ]) {
    // a sentence-initial term is capitalised ("Kulak muayenesinde …")
    it(`recovers "${beklenen}"`, () => assert.ok(metin.includes(beklenen) || metin.includes(beklenen[0].toLocaleUpperCase('tr-TR') + beklenen.slice(1)), metin))
  }

  it('leaves the broken words behind', () => {
    for (const kalmamali of ['Konak', 'Mahalle', 'tem panik', 'Araf', 'Fenk', 'stubble', 'tabağında', 'Wirthon', 'ofisleri', 'Nazan', 'ortaya', 'atış', 'Mopar', 'conta']) {
      assert.ok(!metin.includes(kalmamali), `${kalmamali} → ${metin}`)
    }
  })

  it('never touches laterality, findings or words it is not sure of', () => {
    assert.ok(metin.includes('saf'), 'a possible "sağ" is the doctor\'s to fix, never guessed')
    assert.ok(metin.includes('sağ orta konka'))
    for (const w of ['açık', 'salgı geliyor', 'mukoza biraz soluk', 'hafif', 'iyi']) assert.ok(metin.includes(w), w)
  })

  it('lists every change with the heard text kept', () => {
    assert.ok(degisiklikler.length >= 10)
    assert.ok(degisiklikler.some((d) => d.once === 'Wirthon' && d.sonra === 'Wharton'))
    for (const d of degisiklikler) assert.notEqual(anahtar(d.once), anahtar(d.sonra))
  })

  it('a history line with the same place name is left alone (context gate)', () => {
    const r = tibbiDuzelt("Hasta Konak Mahallesi'nde oturuyor, iki gündür ateşi var.", { sozluk })
    assert.equal(r.metin, "Hasta Konak Mahallesi'nde oturuyor, iki gündür ateşi var.")
  })

  it('is idempotent: a corrected transcript stays as it is', () => {
    assert.equal(tibbiDuzelt(metin, { sozluk, ilaclar: ilacIndeksi() }).metin, metin)
  })

  it('does not change a clean KBB dictation', () => {
    const temiz = 'Kulak muayenesinde timpanik membranlar intakt, orofarenks hiperemik, sağ orta konka paradoks. Septum deviasyonu yok.'
    assert.equal(tibbiDuzelt(temiz, { sozluk, ilaclar: ilacIndeksi() }).metin, temiz)
  })
})

describe('drug names', async () => {
  const sozluk = await dikteSozluguYukle('kulak-burun-bogaz')
  const ilaclar = ilacIndeksi()
  it('the SGK list is loaded', () => assert.ok(ilaclar && ilaclar.bilinen.size > 1000))

  it('repairs a misheard drug next to a dose', () => {
    const r = tibbiDuzelt('Augmantin 1000 mg günde iki kez, parasetamal 500 mg tablet.', { sozluk, ilaclar })
    assert.ok(/Augmentin 1000 mg/.test(r.metin), r.metin)
    assert.ok(/parasetamol 500 mg/.test(r.metin), r.metin)
  })

  it('never turns prose into a drug name', () => {
    const cumle = 'Augmantin gibi bir kelime ama doz yok.'
    assert.equal(tibbiDuzelt(cumle, { sozluk, ilaclar }).metin, cumle)
  })

  it('never changes a number or a dose', () => {
    const r = tibbiDuzelt('Amoksisilin 400 mg 2x1, 10 gün.', { sozluk, ilaclar })
    assert.ok(r.metin.includes('400 mg 2x1, 10 gün'))
  })
})

describe('personal pairs', async () => {
  const sozluk = await dikteSozluguYukle('kulak-burun-bogaz')
  it('the doctor\'s own pair wins and carries the suffix', () => {
    const r = tibbiDuzelt('sağ tarafta konka bülbül görüldü, polip ler yok', { sozluk, kisisel: [{ duyulan: 'konka bülbül', dogru: 'konka bülloza' }] })
    assert.ok(r.metin.includes('konka bülloza görüldü'), r.metin)
    assert.equal(r.degisiklikler[0].tur, 'kisisel')
  })
  it('pairs of one doctor are only what is passed in (no global state)', () => {
    const r = tibbiDuzelt('konka bülbül', { sozluk })
    assert.equal(r.metin, 'konka bülbül')
  })
})

describe('learning a pair from a correction', async () => {
  const sozluk = await dikteSozluguYukle('kulak-burun-bogaz')
  const lex = hedefIndeksiKur(sozluk.terimler).bilinen
  const bilinen = (k: string) => lex.has(k)

  it('finds word-level substitutions', () => {
    assert.deepEqual(degisenParcalar('ağız tabağında Wirthon ofisleri açık', 'ağız tabağında Wharton orifisleri açık'), [{ duyulan: 'Wirthon ofisleri', dogru: 'Wharton orifisleri' }])
  })
  it('learns a misheard term that sounds like the correct one', () => {
    assert.deepEqual(duzeltmedenCiftler('sağ orta conta paradoks', 'sağ orta konka paradoks', bilinen), [{ duyulan: 'conta', dogru: 'konka' }])
  })
  it('never learns laterality, negation or a changed finding', () => {
    assert.deepEqual(duzeltmedenCiftler('sağ orta konka paradoks', 'sol orta konka paradoks', bilinen), [])
    assert.deepEqual(duzeltmedenCiftler('septum deviasyonu var', 'septum deviasyonu yok', bilinen), [])
    assert.deepEqual(duzeltmedenCiftler('orofarenks hiperemik', 'orofarenks ödemli', bilinen), [], 'one term swapped for another is clinical')
  })
  it('never learns digits, doses or a patient name', () => {
    assert.equal(ciftBicimi('beş yüz', '500 mg'), null)
    assert.equal(ciftBicimi('amoksisilin', 'amoksisilin 500'), null)
    assert.equal(otomatikCiftMi({ duyulan: 'Ayşe', dogru: 'Ayşenur' }, bilinen), false)
    assert.equal(ciftBicimi('a'.repeat(60), 'konka'), null)
  })
})

describe('lexicons: all 40 branşlar, lazy', () => {
  it('every one of the 30 + 10 branşlar has a lexicon file and a loader', () => {
    const dosyalar = readdirSync(path.join(__dirname, 'sozluk', 'b')).map((f) => f.replace(/\.ts$/, ''))
    for (const s of SPECIALTIES) {
      assert.ok(DIKTE_BRANSLARI[s.key], `loader ${s.key}`)
      assert.ok(dosyalar.includes(s.key), `file ${s.key}`)
    }
    for (const s of KLINIK_YENI_SLUGS) {
      assert.ok(DIKTE_BRANSLARI[s], `loader ${s}`)
      assert.ok(dosyalar.includes(s), `file ${s}`)
    }
    assert.equal(Object.keys(DIKTE_BRANSLARI).length, 40)
  })
  it('every lexicon loads and has terms; branş files are dynamic imports only', async () => {
    for (const key of Object.keys(DIKTE_BRANSLARI)) {
      const s = await dikteSozluguYukle(key)
      assert.ok(s.terimler.length > 40, key)
    }
    const index = readFileSync(path.join(__dirname, 'sozluk', 'index.ts'), 'utf8')
    assert.ok(!/^import .*from '\.\/b\//m.test(index), 'no static import of a branş file')
  })
  it('branş names resolve', () => {
    assert.equal(dikteBransKey('KBB'), 'kulak-burun-bogaz')
    assert.equal(dikteBransKey('kulak-burun-bogaz'), 'kulak-burun-bogaz')
    assert.equal(dikteBransKey('sac-ekimi'), 'sac-ekimi')
    assert.equal(dikteBransKey('genel'), null)
  })
})

describe('Scribe keyterms', async () => {
  const sozluk = await dikteSozluguYukle('kulak-burun-bogaz')
  const t = anahtarTerimler({ sozluk, kisisel: [{ duyulan: 'konka bülbül', dogru: 'konka bülloza' }] })
  it('respects the provider limits', () => {
    assert.ok(t.length > 100 && t.length <= ANAHTAR_TERIM_AZAMI)
    for (const k of t) {
      assert.ok(k.length <= 50 && k.split(' ').length <= 5 && !/[<>{}[\]\\\d]/.test(k), k)
    }
    assert.equal(new Set(t.map(anahtar)).size, t.length)
  })
  it('puts the doctor\'s terms first, then the branş', () => {
    assert.equal(t[0], 'konka bülloza')
    assert.ok(t.indexOf('Wharton orifisleri') < t.indexOf('anamnez'))
  })
})

describe('performance', async () => {
  const sozluk = await dikteSozluguYukle('kulak-burun-bogaz')
  const ilaclar = ilacIndeksi()
  it('a typical exam dictation takes milliseconds; a long (≈ 2.000-word) one stays under half a second', () => {
    // best of three: the bound is about the algorithm, not a busy CI machine (measured ≈ 8 ms / ≈ 130 ms)
    const enIyi = (f: () => void) => Math.min(...[0, 1, 2].map(() => { const t0 = performance.now(); f(); return performance.now() - t0 }))
    const kisa = enIyi(() => tibbiDuzelt(DUYULAN, { sozluk, ilaclar }))
    assert.ok(kisa < 50, `${kisa.toFixed(1)} ms`)
    const uzun = Array.from({ length: 50 }, () => DUYULAN).join('. ')
    const sure = enIyi(() => tibbiDuzelt(uzun, { sozluk, ilaclar }))
    assert.ok(sure < 500, `${sure.toFixed(0)} ms`)
  })
})

describe('founder voice lock (ses-omurga-kilidi): the locked voice path never uses this module', () => {
  it('no file in lib/asistan/ses-kilit.json imports lib/dikte', () => {
    const kok = path.join(__dirname, '..', '..')
    const manifest = JSON.parse(readFileSync(path.join(kok, 'lib', 'asistan', 'ses-kilit.json'), 'utf8')) as { dosyalar: Record<string, string> }
    for (const f of Object.keys(manifest.dosyalar)) {
      if (!/\.(ts|tsx)$/.test(f)) continue
      assert.ok(!readFileSync(path.join(kok, f), 'utf8').includes('lib/dikte'), f)
    }
  })
})
