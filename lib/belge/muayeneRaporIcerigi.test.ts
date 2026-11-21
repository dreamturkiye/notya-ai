/** DEMO-1121 bug 4 — re-approving a note without a change must not create a "different from Rev. 0" state. */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { butunlukOzeti } from './belge'
import { muayeneRaporuKunyeIcerigi } from './muayeneRaporIcerigi'

const hasta = { ad: 'QA Bebek', dogum: '21.09.2026' }
const ilkOnay = {
  id: 'n1', createdAt: '2026-11-21T08:53:00Z', approvedAt: '2026-11-21T22:44:04.741Z', specialty: 'pediatri', protokolNo: 'P-1',
  basvuruYakinmasi: 'İki aylık kontrol', subjektif: 'Anne sütü alıyor.', objektif: 'Genel durum iyi.', degerlendirme: '1. İki aylık çocuk kontrolü.',
  plan: '1) D vitamini 400 ünite.', tani: 'Z00.1', receteOnerisi: [], icdKodlari: [{ code: 'Z00.1' }], alarmBulgulari: [],
  vitaller: { kilo: 5.3, boy: 58 }, hastaOzeti: 'Bebeğiniz sağlıklı.', buyumePersentilleri: { kilo: '49. persentil', aiYorum: 'x' }, eriskinVki: null,
  ilacUyumImza: 'abc', cek: { maddeler: [1], oncekiIdler: [], isaretler: {} }, uygulananKurallar: ['k1'], asiKart: [{ id: 'a1' }], arsivde: false,
  aiDegerlendirme: 'Ayşe metni', duzenlemeSayisi: 3,
}
const ozet = (not: unknown) => butunlukOzeti({ tur: 'muayene_raporu', kaynakId: 'n1', icerik: muayeneRaporuKunyeIcerigi(not, hasta) })

describe('DEMO-1121 bug 4 — muayene report stamp hashes printed content, not timestamps', () => {
  it('re-approval with identical content → same hash (new approvedAt, edit count, check-list / rule / card metadata ignored)', async () => {
    const yenidenOnay = {
      ...ilkOnay, approvedAt: '2026-11-21T23:10:00.000Z', ilacUyumImza: 'def', cek: { maddeler: [1, 2], oncekiIdler: ['x'], isaretler: { a: true } },
      uygulananKurallar: ['k1', 'k2'], asiKart: [], aiDegerlendirme: 'Ayşe metni (yeniden yazıldı)', duzenlemeSayisi: 4,
      buyumePersentilleri: { kilo: '49. persentil', aiYorum: 'farklı yorum' },
    }
    assert.equal(await ozet(yenidenOnay), await ozet(ilkOnay))
  })

  it('a real change in a printed field → a different hash (new revision, reason asked)', async () => {
    const ilk = await ozet(ilkOnay)
    assert.notEqual(await ozet({ ...ilkOnay, plan: '1) D vitamini 400 ünite.\n2) Aşı uygulandı.' }), ilk)
    assert.notEqual(await ozet({ ...ilkOnay, vitaller: { kilo: 5.4, boy: 58 } }), ilk)
    assert.notEqual(await ozet({ ...ilkOnay, approvedAt: null }), ilk, 'draft (prints TASLAK) ≠ approved')
  })

  it('the print page feeds the stamp from muayeneRaporuKunyeIcerigi (not the raw note object)', () => {
    const kaynak = readFileSync(join(__dirname, '../../app/dashboard/doktor/notlar/[id]/yazdir/page.tsx'), 'utf8')
    assert.match(kaynak, /icerik=\{muayeneRaporuKunyeIcerigi\(not, hasta\)\}/)
  })
})
