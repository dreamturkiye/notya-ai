/**
 * NOTYA-ASISTAN-SABLON — Uzbekistan: every role of the pack has the shared assistant, and the visit note does not.
 *
 * The chart rules are the shared list. The two international titles are the shared list. The national line is this
 * country's ministry protocols for this role's own name. No personal name is written into the instruction.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { UZ_ASISTAN_ADLARI } from '../klinik/asistanAdlari'
import { uzNotTalimati } from '../klinik/talimatlar'
import { UZ_ROL_ADLARI } from '../klinik/rolAdlari'
import { UZ_ROL_SATIRLARI } from '../klinik/rolListesi'
import { uzAsistanTalimati } from './talimat'

const FORMLAR = ['uz-Latn', 'uz-Cyrl', 'ru'] as const
const TURKCE = /[çğıöşüİĞŞÇÖÜ]/

describe('Uzbekistan assistant: every role, the shared core, three references', () => {
  it('42 roles, three forms, and nothing for a language or a key that is not this pack', () => {
    assert.equal(UZ_ROL_SATIRLARI.length, 42)
    for (const rol of ['genel', 'sac-ekimi', 'yok']) for (const f of FORMLAR) assert.equal(uzAsistanTalimati(f, rol), null, `${rol}/${f}`)
    assert.equal(uzAsistanTalimati('tr', 'kardiyoloji'), null)
    assert.equal(uzAsistanTalimati('en', 'pediatri'), null)
  })

  for (const satir of UZ_ROL_SATIRLARI) {
    it(`${satir.anahtar}: the instruction names this specialty, the core rules and exactly three references`, () => {
      for (const f of FORMLAR) {
        const t = uzAsistanTalimati(f, satir.anahtar)
        assert.ok(t && t.length > 200, f)
        assert.doesNotMatch(t!, TURKCE, f)
        assert.ok(t!.includes(UZ_ROL_ADLARI[satir.anahtar][f]), `${f}: this role's own name`)
        assert.equal((t!.match(/\(1\) |\(2\) |\(3\) /g) ?? []).length, 3, f)
        const cekirdek = f === 'ru' ? 'Не называйте число, которого нет в карте.' : f === 'uz-Cyrl' ? 'Ёзувда йўқ сонни айтманг.' : "Yozuvda yo'q sonni aytmang."
        assert.ok(t!.includes(cekirdek), f)
        if (satir.taraf === 'klinik-muttefik') {
          assert.match(t!, f === 'ru' ? /Вы не врач/ : f === 'uz-Cyrl' ? /шифокор эмассиз/ : /shifokor emassiz/, f)
        }
        for (const a of UZ_ASISTAN_ADLARI) assert.ok(!t!.includes(a.kisaAd) && !t!.includes(a.soyad), `${f}: ${a.bransAnahtari}'s name`)
      }
    })
  }

  it('paediatrics keeps Nelson and cardiology keeps Braunwald; neither instruction carries the other book', () => {
    const ped = uzAsistanTalimati('uz-Latn', 'pediatri')!
    const kalp = uzAsistanTalimati('uz-Latn', 'kardiyoloji')!
    assert.match(ped, /Nelson Textbook of Pediatrics/)
    assert.doesNotMatch(ped, /Braunwald/)
    assert.match(kalp, /Braunwald/)
    assert.doesNotMatch(kalp, /Nelson Textbook of Pediatrics/)
  })

  it('the visit-note instruction still cites no textbook', () => {
    for (const f of FORMLAR) {
      const t = uzNotTalimati(f, 'pediatri')!
      assert.doesNotMatch(t, /Nelson|Braunwald|Harrison/)
      assert.match(t, f === 'ru' ? /Не ссылайтесь ни на какие источники/ : f === 'uz-Cyrl' ? /Ҳеч қандай манбага ҳавола қилманг/ : /Hech qanday manbaga havola qilmang/)
    }
  })
})
