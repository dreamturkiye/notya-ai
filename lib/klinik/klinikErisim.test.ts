import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { klinikYuzuAcikMi } from './klinikErisim'
import { bransDegistirebilir, SUPERUSER_BRANS_IDS } from '@/lib/auth/superuserBranslar'

const KAAN = 'c4989e29-a219-45b6-bf17-18e260e3c7f9'

test('Klinik yüzü yalnız süper kullanıcı listesi — Doktor hesabı clinic_members olmadan da girer', () => {
  assert.equal(klinikYuzuAcikMi(KAAN), true)
  assert.equal(klinikYuzuAcikMi('419386d9-88b6-455b-a12a-ac422b0cd296'), false)
  for (const id of SUPERUSER_BRANS_IDS) assert.equal(klinikYuzuAcikMi(id), bransDegistirebilir(id))
})

test('Profesyonel giriş listesinde Notya Klinik var; /giris/notya-klinik aynı oturumla /dashboard/notya-klinik açar', () => {
  const chooser = readFileSync('app/giris/page.tsx', 'utf8')
  assert.match(chooser, /href="\/giris\/notya-klinik"/)
  assert.match(chooser, />Notya Klinik</)
  const sayfa = readFileSync('app/giris/notya-klinik/page.tsx', 'utf8')
  assert.match(sayfa, /\/dashboard\/notya-klinik/)
  assert.match(sayfa, /auth-token/)
  assert.doesNotMatch(sayfa, /profession_type\s*!==\s*'klinik/)
  const me = readFileSync('app/api/klinik/me/route.ts', 'utf8')
  assert.match(me, /klinikYuzuAcikMi/)
  const kabuk = readFileSync('components/klinik/KlinikAracKabugu.tsx', 'utf8')
  assert.match(kabuk, /klinik_erisim/)
})
