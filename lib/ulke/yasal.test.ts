/**
 * NOTYA-ULKE-YASAL-01 — policy drafts stay inside their own country, name that country's statute,
 * carry the six addresses, and stay marked unread by a lawyer. The leak harness is unchanged.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { TUM_ULKELER, YASAL_PAKETLERI } from '../../countries/tumu'
import { sizintiYok } from './testing/sizintiTarayici'
import { YASAL_EPOSTA } from './yasal/eposta'
import { securityTxt } from './yasal/securityTxt'
import { YASAL_ANAHTARLARI, YASAL_YOLLAR, type YasalKapisi } from './yasal/tipler'

const PAKETLER = YASAL_PAKETLERI

function duz(k: YasalKapisi): string {
  return k.diller.flatMap((d) => [d.ad, d.geri, ...d.belgeler.flatMap((b) => [b.baslik, b.inceleme, ...b.bolumler.flatMap((s) => [s.baslik, ...s.paragraflar])])]).join('\n')
}

describe('country policy pages', () => {
  it('security.txt names security@ and does not name kvkk@', () => {
    const t = securityTxt()
    assert.match(t, /^Contact: mailto:security@notya\.io\nExpires: 2027-10-13T00:00:00\.000Z\n/)
    assert.doesNotMatch(t, /kvkk@/i)
    assert.match(readFileSync(join(__dirname, 'yasal/eposta.ts'), 'utf8'), /privacy@notya\.io/)
    assert.doesNotMatch(readFileSync(join(__dirname, 'yasal/eposta.ts'), 'utf8'), /kvkk@/)
  })

  it('every country build lists the seven pages, and each draft names a lawyer and the six addresses', () => {
    const yollar = Object.values(YASAL_YOLLAR)
    for (const kod of Object.keys(PAKETLER) as (keyof typeof PAKETLER)[]) {
      const izin = TUM_ULKELER[kod].paket.rotalar
      assert.notEqual(izin, 'hepsi', kod)
      if (izin === 'hepsi') continue
      for (const y of yollar) assert.ok(izin.sayfalar.includes(y), `${kod} does not list ${y}`)
      const metin = duz(PAKETLER[kod])
      assert.match(metin, /lawyer|huquqshunos|юрист/i, kod)
      for (const adres of Object.values(YASAL_EPOSTA)) assert.ok(metin.includes(adres), `${kod} missing ${adres}`)
      assert.doesNotMatch(metin, /kvkk@/i, kod)
      // AU-MKT-AUDIT 2026-10-22: the owner-mandated draft label "Initial compliance draft – external legal review later" is the one allowed use of the word.
      assert.doesNotMatch(metin.replace(/Initial compliance draft/gi, ''), /\b(compliant|compliance|certified|certification)\b/i, kod)
      for (const d of PAKETLER[kod].diller) {
        assert.deepEqual(d.belgeler.map((b) => b.anahtar), [...YASAL_ANAHTARLARI], `${kod} ${d.kod}`)
      }
      sizintiYok(metin, { hedefUlke: kod, kaynak: `${kod} policy pages` })
    }
  })

  it('each statute is named only in its own country', () => {
    const kendi: Record<keyof typeof PAKETLER, RegExp> = {
      us: /\bHIPAA\b/,
      gb: /UK GDPR/,
      ca: /\bPIPEDA\b/,
      au: /Privacy Act 1988/,
      nz: /Health Information Privacy Code/,
      uz: /ZRU-547|ЗРУ-547/,
    }
    for (const kod of Object.keys(kendi) as (keyof typeof kendi)[]) {
      const metin = duz(PAKETLER[kod])
      assert.match(metin, kendi[kod], kod)
      for (const baska of Object.keys(kendi) as (keyof typeof kendi)[]) {
        if (baska === kod) continue
        assert.doesNotMatch(metin, kendi[baska], `${kod} names ${baska}`)
      }
    }
    assert.match(duz(PAKETLER.gb), /Data Protection Act 2018/)
    assert.match(duz(PAKETLER.gb), /\bPECR\b/)
    assert.match(duz(PAKETLER.au), /Australian Privacy Principles/)
    assert.match(duz(PAKETLER.nz), /Privacy Act 2020/)
  })
})
