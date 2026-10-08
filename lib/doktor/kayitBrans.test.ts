import { test } from 'node:test'
import assert from 'node:assert/strict'
import { KAYIT_BRANSLARI, adSoyadBol, adSoyadTemiz, kayitBransiListeDegeri, kayitBransiNorm } from './kayitBrans'

test('kayıt branş listesi açılış formuyla aynı 31 değer', () => {
  assert.equal(KAYIT_BRANSLARI.length, 31)
  assert.equal(KAYIT_BRANSLARI[0], 'Pediatri')
  assert.equal(KAYIT_BRANSLARI[8], 'KBB')
  assert.equal(KAYIT_BRANSLARI.at(-1), 'Diğer')
  assert.equal(new Set(KAYIT_BRANSLARI).size, 31)
})

test('KBB onboarding değerine çözülür, diğer etiketler olduğu gibi kalır', () => {
  assert.equal(kayitBransiNorm('KBB'), 'Kulak Burun Boğaz')
  assert.equal(kayitBransiNorm('  Pediatri '), 'Pediatri')
  assert.equal(kayitBransiNorm('Diğer'), 'Diğer')
  assert.equal(kayitBransiNorm('Kulak Burun Boğaz'), 'Kulak Burun Boğaz')
  assert.equal(kayitBransiListeDegeri('Kulak Burun Boğaz'), 'KBB')
  assert.equal(kayitBransiNorm('Avukat'), null)
  assert.equal(kayitBransiNorm(''), null)
})

test('ad soyad en az iki kelime', () => {
  assert.deepEqual(adSoyadBol('Ayşe Yılmaz'), { ad: 'Ayşe', soyad: 'Yılmaz' })
  assert.deepEqual(adSoyadBol('  Ali  Rıza  Demir '), { ad: 'Ali', soyad: 'Rıza Demir' })
  assert.equal(adSoyadTemiz('  Ayşe   Yılmaz  '), 'Ayşe Yılmaz')
  assert.equal(adSoyadBol('Ayşe'), null)
  assert.equal(adSoyadTemiz('A Y'), null)
  assert.equal(adSoyadTemiz('12 34'), null)
})
