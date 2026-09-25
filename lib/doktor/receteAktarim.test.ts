import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { ilacAdiniSadelestir, ilacListeleriAyniMi, ilacOnerisiCoz, nottanIlaclariCikar, planIlacTutarsizMi } from './receteAktarim'

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

test('planIlacTutarsizMi: canlı vaka — plan "Augmentin ES" der, yapılandırılmış liste "Amoksisilin" — uyuşmazlık yakalanır', () => {
  // Kaan (2026-09-24): gerçek olay — hekim Plan metnindeki 1. TEDAVİ bölümünü elle
  // "Augmentin ES süspansiyon sabah akşam 7.5 ml. 10 gün" olarak değiştirdi, ama ayrı
  // İlaçlar listesi hiç dokunulmadan "Amoksisilin 400 mg/5 mL süspansiyon" olarak kaldı.
  const plan = '1. TEDAVİ:\na) Augmentin ES süspansiyon sabah akşam 7.5 ml. 10 gün\nb) Calpol şurup en sık 4 st ara ile 5ml lüzümlü halde.'
  const ilaclar = [{ ad: 'Amoksisilin 400 mg/5 mL süspansiyon' }, { ad: 'Parasetamol süspansiyon (160 mg/5 mL)' }]
  assert.equal(planIlacTutarsizMi(plan, ilaclar), true)
})

test('planIlacTutarsizMi: listedeki her ilaç Plan metninde geçiyorsa uyuşmazlık yok', () => {
  const plan = '1. TEDAVİ:\na) Amoksisilin 400 mg/5 mL süspansiyon — 7,5 mL (600 mg) 12 saatte bir, 7 gün.\nb) Parasetamol süspansiyon lüzumlu halde.'
  const ilaclar = [{ ad: 'Amoksisilin 400 mg/5 mL süspansiyon' }, { ad: 'Parasetamol süspansiyon (160 mg/5 mL)' }]
  assert.equal(planIlacTutarsizMi(plan, ilaclar), false)
})

test('planIlacTutarsizMi: yalnız bir ilaç değişmişse de yakalanır (Amoksisilin→Augmentin, Parasetamol aynı)', () => {
  const plan = '1. TEDAVİ:\na) Augmentin ES süspansiyon sabah akşam 7.5 ml. 10 gün\nb) Parasetamol süspansiyon lüzumlu halde.'
  const ilaclar = [{ ad: 'Amoksisilin 400 mg/5 mL süspansiyon' }, { ad: 'Parasetamol süspansiyon (160 mg/5 mL)' }]
  assert.equal(planIlacTutarsizMi(plan, ilaclar), true)
})

test('planIlacTutarsizMi: listedeki bir ilaç Plan metninden çıkarılmışsa da yakalanır', () => {
  const plan = '1. TEDAVİ:\na) Amoksisilin 400 mg/5 mL süspansiyon — 7,5 mL 12 saatte bir, 7 gün.'
  const ilaclar = [{ ad: 'Amoksisilin 400 mg/5 mL süspansiyon' }, { ad: 'Parasetamol süspansiyon (160 mg/5 mL)' }]
  assert.equal(planIlacTutarsizMi(plan, ilaclar), true)
})

test('ilacListeleriAyniMi: yazım farkları (virgül/nokta, boşluk, büyük harf, sıra) aynı sayılır', () => {
  const a = [{ ad: 'Amoksisilin 400 mg/5 mL süspansiyon', doz: '7,5 mL', kullanim: '12 saatte bir', sure: '7 gün' }, { ad: 'Parasetamol', doz: '5 ml', kullanim: 'lüzumlu halde', sure: '' }]
  const b = [{ ad: 'Parasetamol şurup', doz: '5ml', kullanim: 'Lüzumlu halde', sure: '' }, { ad: 'Amoksisilin süspansiyon', doz: '7.5 ml', kullanim: '12 saatte bir', sure: '7 gün' }]
  assert.equal(ilacListeleriAyniMi(a, b), true)
})

test('ilacListeleriAyniMi: canlı vaka — farklı ilaç ya da farklı süre aynı sayılmaz', () => {
  const mevcut = [{ ad: 'Amoksisilin 400 mg/5 mL süspansiyon', doz: '7,5 mL', kullanim: '12 saatte bir', sure: '7 gün' }]
  assert.equal(ilacListeleriAyniMi(mevcut, [{ ad: 'Augmentin ES süspansiyon', doz: '7,5 mL', kullanim: 'sabah-akşam', sure: '10 gün' }]), false)
  assert.equal(ilacListeleriAyniMi(mevcut, [{ ...mevcut[0], sure: '10 gün' }]), false)
  assert.equal(ilacListeleriAyniMi(mevcut, []), false)
})

test('ilacOnerisiCoz: nesne ve metin satırlarını okur, boş/geçersiz yanıtta null döner', () => {
  assert.deepEqual(ilacOnerisiCoz([{ ad: 'Augmentin ES', doz: '7,5 mL', kullanim: 'sabah-akşam', sure: '10 gün' }, 'Calpol şurup — 5 mL — lüzumlu halde']), [
    { ad: 'Augmentin ES', doz: '7,5 mL', kullanim: 'sabah-akşam', sure: '10 gün' },
    { ad: 'Calpol şurup', doz: '5 mL', kullanim: 'lüzumlu halde', sure: '' },
  ])
  assert.equal(ilacOnerisiCoz(undefined), null)
  assert.equal(ilacOnerisiCoz([]), null)
  assert.equal(ilacOnerisiCoz([{ doz: '5 mL' }, '  ']), null)
})

test('planIlacTutarsizMi: boş İlaçlar listesi ya da boş plan metni uyarı üretmez', () => {
  assert.equal(planIlacTutarsizMi('1. TEDAVİ: Augmentin ES 10 gün', []), false)
  assert.equal(planIlacTutarsizMi('', [{ ad: 'Amoksisilin' }]), false)
  assert.equal(planIlacTutarsizMi(null, [{ ad: 'Amoksisilin' }]), false)
  assert.equal(planIlacTutarsizMi(undefined, [{ ad: 'Amoksisilin' }]), false)
})
