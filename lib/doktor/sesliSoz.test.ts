import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { hitapsiz, sesliSozTokenlari, tumAdParcalariVar } from './hastaCozumleyici'

test('NOTYA-SES-DOLGU-01: dolgu sözcükleri ve ayrık ad (Dr. Gökhan)', () => {
  const t = sesliSozTokenlari('gokhan eee s umutcan eee turkoglu nun dosyasina bakmani istiyorum')
  assert.equal(tumAdParcalariVar('umutcan turkoglu', t), true)
  assert.equal(tumAdParcalariVar('umutcan turkoglu', sesliSozTokenlari('umut can turkoglu nun dosyasi')), true)
  assert.equal(tumAdParcalariVar('umutcan turkoglu', sesliSozTokenlari('turkoglu umutcan kac kilo')), true)
  assert.equal(tumAdParcalariVar('umutcan turkoglu', sesliSozTokenlari('umutcan kac yasinda')), false)
})

test('NOTYA-SES-DOLGU-01: asistana hitap hasta adı sayılmaz', () => {
  assert.doesNotMatch(hitapsiz('Merhaba Ayşe, bu hafta ateşli hasta var mı'), /Ayşe/)
  assert.doesNotMatch(hitapsiz('Ayşe, en son ne zaman geldi'), /Ayşe/)
  assert.match(hitapsiz('Merhaba Ayşe. Bizim bir hastamız vardı, Ayşe Yeşil adında'), /Ayşe Yeşil/)
})
