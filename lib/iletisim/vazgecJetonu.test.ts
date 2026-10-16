import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { vazgecJetonu, vazgecJetonuCoz, vazgecBaglantisi, vazgecKelimesiMi } from './vazgecJetonu'

const GIZLI = 'qa-sentetik-portal-sirri'
process.env.PORTAL_TOKEN_SECRET = GIZLI
const DOKTOR = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const HASTA = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const BASKA_HASTA = 'cccccccc-cccc-cccc-cccc-cccccccccccc'

describe('vazgecJetonu — imzalı, süresiz abonelikten çıkma bağlantısı', () => {
  it('imzalanan jeton aynen çözülür', () => {
    const j = vazgecJetonu(DOKTOR, HASTA, 'eposta', GIZLI)!
    assert.ok(j)
    assert.deepEqual(vazgecJetonuCoz(j, GIZLI), { doktorId: DOKTOR, patientId: HASTA, kanal: 'eposta' })
  })
  it('gizli anahtar yoksa jeton üretilmez (sahte secret fallback yok)', () => {
    assert.equal(vazgecJetonu(DOKTOR, HASTA, 'eposta', ''), null)
    assert.equal(vazgecJetonuCoz('x.y.eposta.z', ''), null)
  })
  it('kanal değiştirilirse (whatsapp jetonu eposta diye sunulursa) imza tutmaz', () => {
    const j = vazgecJetonu(DOKTOR, HASTA, 'whatsapp', GIZLI)!
    const parcalar = j.split('.')
    const sahte = `${parcalar[0]}.${parcalar[1]}.eposta.${parcalar[3]}`
    assert.equal(vazgecJetonuCoz(sahte, GIZLI), null)
  })
  it('başka hastanın jetonu başka hastaya geçmez', () => {
    const j = vazgecJetonu(DOKTOR, HASTA, 'sms', GIZLI)!
    const parcalar = j.split('.')
    const sahte = `${parcalar[0]}.${BASKA_HASTA}.sms.${parcalar[3]}`
    assert.equal(vazgecJetonuCoz(sahte, GIZLI), null)
  })
  it('vazgecBaglantisi tam URL üretir (process.env.PORTAL_TOKEN_SECRET üzerinden)', () => {
    const url = vazgecBaglantisi(DOKTOR, HASTA, 'eposta')
    assert.match(String(url ?? ''), /^https:\/\/www\.notya\.io\/api\/iletisim\/vazgec\/.+/)
  })
})

describe('vazgecKelimesiMi — STOP/DUR/İPTAL', () => {
  it('tanınan kelimeler (boşluk ve büyük/küçük harf duyarsız)', () => {
    for (const k of ['stop', 'STOP', ' Stop ', 'dur', 'DUR', 'iptal', 'İPTAL']) assert.equal(vazgecKelimesiMi(k), true, k)
  })
  it('başka her şey hayır sayılır', () => {
    for (const k of ['', 'merhaba', 'durdur', 'stopp', 'evet']) assert.equal(vazgecKelimesiMi(k), false, k)
  })
})
