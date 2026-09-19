/**
 * NOTYA-AVATAR-01 / mobil — avatar HER kapta daire kalmalı.
 *
 * Kaan (2026-09-19): telefonda hekimin profil fotoğrafı ELİPS görünüyordu. Neden: avatar dar bir
 * flex satırında duruyordu ve yalnız width/height verilmişti; alan daralınca <img> yatayda
 * eziliyordu. Bu test ölçü kilidinin (minWidth/maxWidth/minHeight/maxHeight + aspectRatio +
 * flexShrink/flexGrow 0 + objectFit: cover) yerinde durduğunu doğrular — biri "sadeleştirmek"
 * için bunları kaldırırsa test kırılır ve nedenini söyler.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const KAYNAK = readFileSync('components/doktor/DoktorAvatar.tsx', 'utf8')

test('avatar ölçü kilidi: dar flex kabında ezilip elips olamaz', () => {
  for (const alan of ['minWidth: boyut', 'maxWidth: boyut', 'minHeight: boyut', 'maxHeight: boyut']) {
    assert.ok(KAYNAK.includes(alan), `${alan} kaldırılmış — dar ekranda avatar tekrar elips olur`)
  }
  assert.ok(KAYNAK.includes("aspectRatio: '1 / 1'"), 'aspectRatio yedeği kaldırılmış')
  assert.ok(KAYNAK.includes('flexShrink: 0'), 'flexShrink: 0 kaldırılmış — flex satırında sıkışır')
  assert.ok(KAYNAK.includes('flexGrow: 0'), 'flexGrow: 0 kaldırılmış — flex satırında uzayabilir')
})

test('fotoğraf orantısı korunur: objectFit cover + daire maskesi', () => {
  assert.ok(KAYNAK.includes("objectFit: 'cover'"), 'objectFit: cover yok — fotoğraf orantısız gerilir')
  assert.ok(KAYNAK.includes("borderRadius: '50%'"), 'daire maskesi yok')
  assert.ok(KAYNAK.includes("overflow: 'hidden'"), 'overflow: hidden yok — fotoğraf daireden taşar')
})

test('fotoğraf yoksa baş harf gösterilir (kırık görsel ya da boşluk değil)', () => {
  assert.ok(KAYNAK.includes('doktorBasHarfleri'), 'baş harf yedeği kaldırılmış')
})
