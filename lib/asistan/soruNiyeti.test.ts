import { test } from 'node:test'
import assert from 'node:assert/strict'
import { genelTibbiSoruMu } from './soruNiyeti'

// AKKS GO A (Kaan 2026-11-24): textbook questions are answered, not sent to the records search ("Kayıtlarda 0 hasta").
test('textbook phrasings are general medical questions', () => {
  for (const q of [
    'Hangi hastalara MMR aşısı uygulanmamalı?',
    'Kimlere demir profilaksisi verilir?',
    'Akut otitte antibiyotik ne zaman başlanmalı?',
    'Bu tabloda tonsillektomi endike mi?',
    'Gebelikte hangi taramalar önerilir?',
    'Kawasaki tanı kriterleri nelerdir?',
  ]) assert.equal(genelTibbiSoruMu(q), true, q)
})

test("the doctor's own patients / practice still go to the records search", () => {
  for (const q of [
    'Hastalarımdan kimler MMR olmadı?',
    'Bu ay en çok yazdığım antibiyotik hangisi?',
    'Bu hastaya amoksisilin verilir mi?',
    'Hastamın kilosuna göre doz ne olmalı?',
  ]) assert.equal(genelTibbiSoruMu(q), false, q)
})
