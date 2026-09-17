import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { PERSONAS, VARSAYILAN_PERSONA, getPersonaForSpecialty, varsayilanPersonaId } from './personaEngine'

// ASISTAN-PERSONA-BRANS (KD-DERM-SAFETY-FINDINGS F2): a KD doctor with no persona picked was introduced as the pediatri colleague.
test('no persona picked: branch doctors get their branch colleague from users.specialty', () => {
  assert.equal(PERSONAS[varsayilanPersonaId('genel', 'kadin-dogum')].primarySpecialty, 'kadin-hastaliklari-dogum')
  assert.equal(PERSONAS[varsayilanPersonaId(undefined, 'Kadın Hastalıkları ve Doğum')].primarySpecialty, 'kadin-hastaliklari-dogum')
  assert.equal(PERSONAS[varsayilanPersonaId('genel', 'dermatoloji')].primarySpecialty, 'dermatoloji')
  assert.equal(PERSONAS[varsayilanPersonaId('genel', 'Deri ve Zührevi Hastalıklar')].primarySpecialty, 'dermatoloji')
  assert.equal(PERSONAS[varsayilanPersonaId('genel', 'dahiliye')].primarySpecialty, 'dahiliye')
  assert.equal(PERSONAS[varsayilanPersonaId(null, 'İç Hastalıkları')].primarySpecialty, 'dahiliye')
  for (const b of ['kadin-dogum', 'dermatoloji', 'dahiliye']) assert.notEqual(varsayilanPersonaId('genel', b), VARSAYILAN_PERSONA, b)
})

test('an explicit request branch wins over users.specialty', () => {
  assert.equal(PERSONAS[varsayilanPersonaId('kardiyoloji', 'kadin-dogum')].primarySpecialty, 'kardiyoloji')
})

test('genel / aile hekimliği / pediatri / unknown keep the flagship Ayşe (b9406a9)', () => {
  assert.equal(VARSAYILAN_PERSONA, getPersonaForSpecialty('pediatri'))
  for (const b of [null, undefined, '', 'genel', 'aile-hekimligi', 'Aile Hekimliği', 'pediatri', 'bilinmeyen-brans']) assert.equal(varsayilanPersonaId('genel', b), VARSAYILAN_PERSONA, String(b))
})

test('chat route and asistan page use the branch-aware default, not a hardcoded pediatri fallback', () => {
  const kok = path.join(import.meta.dirname, '..', '..')
  const rota = fs.readFileSync(path.join(kok, 'app/api/asistan/chat/route.ts'), 'utf8')
  assert.ok(rota.includes('varsayilanPersonaId(specialty, hekimBransi)')); assert.ok(!rota.includes('getPersonaForSpecialty(specialty || "pediatri")'))
  assert.ok(!rota.includes('prefs?.preferred_persona'), 'schema default elifsahin (nöroloji) is never a doctor pick')
  assert.ok(fs.readFileSync(path.join(kok, 'app/asistan/page.tsx'), 'utf8').includes('varsayilanPersonaId('))
})
