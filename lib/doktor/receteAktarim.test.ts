import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { ilacAdiniSadelestir, nottanIlaclariCikar } from './receteAktarim'

test('ilacAdiniSadelestir: alternatif ve açıklama kuyruğunu atar, dozu korur', () => {
  assert.equal(
    ilacAdiniSadelestir('Parol 120 mg/5 mL şurup veya Nurofen (ibuprofen) — ateş/ağrı için alternatif'),
    'Parol 120 mg/5 mL şurup'
  )
  assert.equal(
    ilacAdiniSadelestir('Augmentin BD 400/57 mg/5 mL süspansiyon (veya Amoksiklav Duo 400/57 mg/5 mL)'),
    'Augmentin BD 400/57 mg/5 mL süspansiyon'
  )
  assert.equal(
    ilacAdiniSadelestir('Sterimar Baby / Okyanus Bebek nazal salin sprey'),
    'Sterimar Baby'
  )
  assert.equal(
    ilacAdiniSadelestir('Amoksil 250 mg/5 mL süspansiyon'),
    'Amoksil 250 mg/5 mL süspansiyon'
  )
  // Etken madde içindeki tire korunur — bölme yalnızca boşluklu tirede olur.
  assert.equal(ilacAdiniSadelestir('Amoksisilin-klavulanat'), 'Amoksisilin-klavulanat')
})

test('nottanIlaclariCikar: generic + ticari aynı ilaç için tek satır üretir', () => {
  const ilaclar = nottanIlaclariCikar({
    content_ilaclar: [
      { ad: 'Amoksisilin', doz: '250 mg/5 mL', kullanim: '2x1', sure: '10 gün' },
      { ad: 'Parasetamol', doz: '120 mg/5 mL', kullanim: 'Gerektiğinde', sure: '3 gün' },
    ],
    recete_onerisi: [
      {
        etkenMadde: 'Amoksisilin',
        ticariOrnek: 'Largopen 250 mg/5 mL süspansiyon',
        sgkListesinde: true,
        sure: '10 gün',
      },
      {
        etkenMadde: 'Parasetamol',
        ticariOrnek: 'Parol 120 mg/5 mL şurup',
        sgkListesinde: false,
        not: 'Ateş 38.5 üzerinde verin.',
      },
    ],
  })

  assert.equal(ilaclar.length, 2, 'her ilaç için tek satır')
  assert.equal(ilaclar[0].ilac_adi, 'Amoksisilin')
  assert.equal(ilaclar[0].etken_madde, 'Amoksisilin')
  assert.equal(ilaclar[0].doz, '250 mg/5 mL')
  assert.equal(ilaclar[0].kullanim_sikli, '2x1')
  assert.match(String(ilaclar[0].notlar), /Süre: 10 gün/)
  assert.match(String(ilaclar[0].notlar), /Ticari örnek: Largopen/)

  // SGK kapsamı dışıysa hekime söylenir.
  assert.match(String(ilaclar[1].notlar), /SGK listesinde değil/)
  assert.match(String(ilaclar[1].notlar), /Ateş 38\.5/)
})

test('nottanIlaclariCikar: content_ilaclar otoritedir — öneri fazladan satır açmaz', () => {
  const ilaclar = nottanIlaclariCikar({
    content_ilaclar: [{ ad: 'Amoksisilin', doz: '250 mg', kullanim: '2x1' }],
    recete_onerisi: [
      { etkenMadde: 'Amoksisilin', ticariOrnek: 'Largopen 250 mg' },
      // Hekimin listesinde olmayan bir öneri — aktarılmamalı.
      { etkenMadde: 'İbuprofen', ticariOrnek: 'Nurofen 100 mg/5 mL' },
    ],
  })
  assert.equal(ilaclar.length, 1)
  assert.equal(ilaclar[0].ilac_adi, 'Amoksisilin')
})

test('nottanIlaclariCikar: content_ilaclar boşsa öneriye düşer', () => {
  const ilaclar = nottanIlaclariCikar({
    content_ilaclar: [],
    recete_onerisi: [{ etkenMadde: 'Amoksisilin', ticariOrnek: 'Largopen 250 mg/5 mL', sure: '7 gün' }],
  })
  assert.equal(ilaclar.length, 1)
  assert.equal(ilaclar[0].ilac_adi, 'Largopen 250 mg/5 mL')
  assert.equal(ilaclar[0].etken_madde, 'Amoksisilin')
})

test('nottanIlaclariCikar: form kelimeleri iki ayrı ilacı birleştirmez', () => {
  const ilaclar = nottanIlaclariCikar({
    content_ilaclar: [
      { ad: 'Amoksisilin süspansiyon' },
      { ad: 'Parasetamol süspansiyon' },
      { ad: 'İzotonik NaCl nazal damla' },
    ],
    recete_onerisi: [],
  })
  assert.equal(ilaclar.length, 3, '"süspansiyon" ortak olduğu için birleşmemeli')
})

test('nottanIlaclariCikar: reçetesiz not boş liste döner', () => {
  assert.deepEqual(nottanIlaclariCikar({}), [])
  assert.deepEqual(nottanIlaclariCikar({ content_ilaclar: null, recete_onerisi: null }), [])
  assert.deepEqual(nottanIlaclariCikar({ content_ilaclar: [{ ad: '  ' }] }), [])
})
