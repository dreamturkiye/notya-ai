/**
 * ULKE-BRANS-DERINLIK-10 — specialty documents in the "add documents" step, against the ACTIVE pack (run once per country by
 * scripts/ulke-test.mjs). Each role is offered, read and labelled with the kinds its specialists assess, and no other
 * role's (brans-alan-sizmasi, both ways). Names no country.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { roller, uygulamaMetni } from '@/lib/ulke/arayuz'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { blokDili, EK_TEMEL_TURLERI, EK_TURLERI, ekTuruEtiketi, rolEkTurleri, turuOku } from './ekler'
import { belgeSonucunuOku, belgeTalimati, TUR_OKUMA } from './belgeTalimati'
import { EK_UZMANLIK_ROLLERI, EK_UZMANLIK_TURLERI } from './uzmanlikEkleri'

const KOK = join(__dirname, '../../..')
const paket = ulkePaketi()
const ROLLER = roller().map((r) => r.anahtar)
const DILLER = (paket.uygulama?.diller ?? [paket.varsayilanDil]) as readonly string[]

describe('specialty documents: the active pack', () => {
  it('every role keeps the shared seven; a specialty kind comes only from the role\'s own list', () => {
    for (const rol of ROLLER) {
      const t = rolEkTurleri(rol)
      for (const k of EK_TEMEL_TURLERI) assert.ok(t.includes(k), `${rol}/${k}`)
      assert.equal(t[t.length - 1], 'other')
      const uzman = t.filter((k) => !(EK_TEMEL_TURLERI as readonly string[]).includes(k))
      assert.deepEqual(uzman, [...(EK_UZMANLIK_ROLLERI[rol] ?? [])], rol)
    }
    // No role, or an unknown key: the shared seven only.
    assert.deepEqual([...rolEkTurleri(null)].sort(), [...EK_TEMEL_TURLERI].sort())
    assert.deepEqual([...rolEkTurleri('not-a-role')].sort(), [...EK_TEMEL_TURLERI].sort())
  })

  it('most of the pack\'s roles assess at least one specialty document, and every specialty kind used here has a reading line', () => {
    const olan = ROLLER.filter((r) => rolEkTurleri(r).length > EK_TEMEL_TURLERI.length)
    assert.ok(olan.length >= Math.floor(ROLLER.length / 2), `${olan.length}/${ROLLER.length}`)
    for (const k of EK_UZMANLIK_TURLERI) assert.ok((TUR_OKUMA[k] ?? '').length > 40, k)
  })

  it('every kind has a label in every form of the application and in the note\'s heading', () => {
    for (const dil of DILLER) {
      const m = uygulamaMetni(dil)
      for (const k of EK_TURLERI) assert.ok((m.ekler.turler[k] ?? '').trim().length > 1, `${dil}/${k}`)
      for (const k of EK_TURLERI) assert.ok(ekTuruEtiketi(blokDili(dil), k).trim().length > 1, `heading ${dil}/${k}`)
    }
  })

  it('leak both ways: the reader is told only the role\'s kinds, and a foreign specialty kind reads as a plain document', () => {
    for (const k of EK_UZMANLIK_TURLERI) {
      const sahip = ROLLER.filter((r) => rolEkTurleri(r).includes(k))
      const yabanci = ROLLER.filter((r) => !rolEkTurleri(r).includes(k))
      if (!sahip.length) continue
      assert.ok(yabanci.length > 0, `${k} is offered to every role`)
      const tS = belgeTalimati(paket.varsayilanDil, 'auto', rolEkTurleri(sahip[0]))
      const tY = belgeTalimati(paket.varsayilanDil, 'auto', rolEkTurleri(yabanci[0]))
      assert.match(tS, new RegExp(`\\|${k}\\|`), `${sahip[0]} names ${k}`)
      assert.doesNotMatch(tY, new RegExp(`\\b${k}\\b`), `${yabanci[0]} must not name ${k}`)
      assert.ok(tS.includes(TUR_OKUMA[k]!), `${k}: its reading line goes to its role`)
      assert.ok(!tY.includes(TUR_OKUMA[k]!), `${k}: its reading line never goes to another role`)
      const yanit = JSON.stringify({ kind: k, quality: 'good', exam_datetime: null, summary: 'x', findings: ['y'], urgent: false })
      assert.equal(belgeSonucunuOku(yanit, Date.now(), rolEkTurleri(sahip[0]))?.tur, k)
      assert.equal(belgeSonucunuOku(yanit, Date.now(), rolEkTurleri(yabanci[0]))?.tur, 'other')
      assert.equal(turuOku(k, rolEkTurleri(yabanci[0])), 'other')
    }
  })

  it('the clinician\'s own choice keeps its reading line and the copy-what-is-printed rule; no score, grade or diagnosis', () => {
    const rol = ROLLER.find((r) => rolEkTurleri(r).includes('audiogram'))
    if (!rol) return assert.ok(true)
    const t = belgeTalimati(paket.varsayilanDil, 'audiogram', rolEkTurleri(rol))
    assert.match(t, /The clinician says this is an audiogram/)
    assert.match(t, /do not calculate an average or a hearing-loss grade unless it is printed/)
    assert.match(t, /Do NOT state a definitive diagnosis/)
  })

  it('the screens and the server use the role: the choice list, the evaluation and the two places the step is drawn', () => {
    assert.match(readFileSync(join(KOK, 'components/ulke/uygulama/Ekler.tsx'), 'utf8'), /rolEkTurleri\(rol\)/)
    const s = readFileSync(join(KOK, 'lib/ulke/belgeler/belgeDegerlendir.ts'), 'utf8')
    assert.match(s, /hekimRolunuOku\(supabase, doktorId\)/)
    assert.match(s, /if \(tur !== 'auto' && !turler\.includes\(tur\)\) return \{ tamam: false, kod: 'GECERSIZ' \}/)
    assert.match(readFileSync(join(KOK, 'components/ulke/uygulama/Muayene.tsx'), 'utf8'), /<EklerAdimi [^>]*rol=\{/)
    assert.match(readFileSync(join(KOK, 'components/ulke/uygulama/Not.tsx'), 'utf8'), /<EklerNotKarti [^>]*rol=\{/)
  })
})
