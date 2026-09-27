import { test } from 'node:test'
import assert from 'node:assert/strict'
import { HEKIM_PROFIL_AZAMI, HEKIM_PROFIL_TTL_MS, hekimProfilDusur, hekimProfilOku, hekimProfilYaz } from './hekimProfilOnbellek'

test('profil 60 sn içinde aynı hekime döner, başkasına sızmaz', () => {
  hekimProfilDusur('dok-a')
  hekimProfilDusur('dok-b')
  hekimProfilYaz('dok-a', { specialty: 'pediatri' }, 1_000)
  hekimProfilYaz('dok-b', { specialty: 'dahiliye' }, 1_000)
  assert.deepEqual(hekimProfilOku('dok-a', 1_000 + HEKIM_PROFIL_TTL_MS), { specialty: 'pediatri' })
  assert.deepEqual(hekimProfilOku('dok-b', 1_500), { specialty: 'dahiliye' })
  assert.equal(hekimProfilOku('dok-a', 1_000 + HEKIM_PROFIL_TTL_MS + 1), null)
  hekimProfilDusur('dok-b')
  assert.equal(hekimProfilOku('dok-b', 1_500), null)
})

test('bellek üst sınırı aşılmaz; en eski kayıt düşer', () => {
  const t0 = 50_000
  for (let i = 0; i < HEKIM_PROFIL_AZAMI + 25; i++) {
    hekimProfilYaz(`sinir-${i}`, { i }, t0 + i)
  }
  assert.equal(hekimProfilOku('sinir-0', t0 + HEKIM_PROFIL_AZAMI), null)
  assert.deepEqual(hekimProfilOku(`sinir-${HEKIM_PROFIL_AZAMI + 24}`, t0 + HEKIM_PROFIL_AZAMI + 24), { i: HEKIM_PROFIL_AZAMI + 24 })
})
