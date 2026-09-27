import { test } from 'node:test'
import assert from 'node:assert/strict'
import { HEKIM_PROFIL_TTL_MS, hekimProfilDusur, hekimProfilOku, hekimProfilYaz } from './hekimProfilOnbellek'

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
