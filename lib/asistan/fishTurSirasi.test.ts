import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  FISH_BIRLESTIR_ACIK_PENCERE_MS, FISH_BIRLESTIR_PENCERE_MS, birlestirPenceresiMs, cumleBittiMi, klipGeldi, sesBasladi, sttGeldi,
  turBitti, turSirasiBaslat, type TurSirasi,
} from './fishTurSirasi'

type K = { ad: string; konusmaBas: number; bitis: number; sesliMs: number }
const klip = (ad: string, konusmaBas: number, bitis: number, sesliMs = 900): K => ({ ad, konusmaBas, bitis, sesliMs })
const adlar = (k: K[]) => k.map((x) => x.ad)

test('single sentence: the brain call fires in the tick the clip ends, nothing waits for a merge window', () => {
  const r = klipGeldi(turSirasiBaslat<K>(), klip('k1', 0, 1000))
  assert.equal(r.karar.k, 'gonder')
  if (r.karar.k !== 'gonder') return
  assert.deepEqual(adlar(r.karar.klipler), ['k1'])
  assert.equal(r.karar.birlesik, false)
  assert.equal(r.karar.iptal, 'yok')
  assert.equal(turBitti(r.durum).aktif, null)
})

test('defect 2: second sentence before the first answer audio → one merged turn, first turn aborted', () => {
  let d: TurSirasi<K> = klipGeldi(turSirasiBaslat<K>(), klip('k1', 0, 1000)).durum
  d = sttGeldi(d, 'İyiyim teşekkür ederim.')
  const r = klipGeldi(d, klip('k2', 1400, 2600))
  assert.equal(r.karar.k, 'gonder')
  if (r.karar.k !== 'gonder') return
  assert.equal(r.karar.birlesik, true)
  assert.equal(r.karar.iptal, 'birlestir')
  assert.deepEqual(adlar(r.karar.klipler), ['k1', 'k2'])
  // one merge per turn: a third clip is ignored, the merged answer plays
  const r3 = klipGeldi(r.durum, klip('k3', 2900, 3800))
  assert.deepEqual(r3.karar, { k: 'yoksay', neden: 'birlesti' })
})

test('defect 1 sequence: turn played → turBitti → the next clip is a plain new turn (registered, no abort)', () => {
  let d: TurSirasi<K> = klipGeldi(turSirasiBaslat<K>(), klip('k1', 0, 1000)).durum
  d = sttGeldi(d, 'Merhaba Ayşe.')
  d = sesBasladi(d)
  d = turBitti(d)
  const r = klipGeldi(d, klip('k2', 6000, 7200))
  assert.equal(r.karar.k, 'gonder')
  if (r.karar.k !== 'gonder') return
  assert.deepEqual(adlar(r.karar.klipler), ['k2'])
  assert.equal(r.karar.iptal, 'yok')
})

test('barge-in still works: speech after the answer audio started is a new turn, never a merge', () => {
  let d: TurSirasi<K> = klipGeldi(turSirasiBaslat<K>(), klip('k1', 0, 1000)).durum
  d = sesBasladi(d)
  const r = klipGeldi(d, klip('k2', 1200, 2000))
  assert.equal(r.karar.k, 'gonder')
  if (r.karar.k !== 'gonder') return
  assert.equal(r.karar.iptal, 'barge')
  assert.deepEqual(adlar(r.karar.klipler), ['k2'])
  assert.equal(r.karar.birlesik, false)
})

test('merge window: 1.5 s after a finished sentence, 2.5 s when the transcript has no terminal cue', () => {
  assert.equal(cumleBittiMi('Bugün randevumuz var mı?'), true)
  assert.equal(cumleBittiMi('Bugün randevumuz var mı'), true)
  assert.equal(cumleBittiMi('İyiyim teşekkür ederim.'), true)
  assert.equal(cumleBittiMi('Bir de şu hastanın'), false)
  assert.equal(birlestirPenceresiMs(null), FISH_BIRLESTIR_PENCERE_MS)
  assert.equal(birlestirPenceresiMs('Bir de şu hastanın'), FISH_BIRLESTIR_ACIK_PENCERE_MS)
  const ilk = klipGeldi(turSirasiBaslat<K>(), klip('k1', 0, 1000)).durum
  // finished sentence, 1.6 s later → newer speech wins as a new turn
  const gec = klipGeldi(sttGeldi(ilk, 'İyiyim teşekkür ederim.'), klip('k2', 2600, 3600))
  assert.equal(gec.karar.k === 'gonder' && gec.karar.iptal, 'yeni')
  // open sentence, 1.6 s later → merge
  const acik = klipGeldi(sttGeldi(ilk, 'Bir de şu hastanın'), klip('k2', 2600, 3600))
  assert.equal(acik.karar.k === 'gonder' && acik.karar.birlesik, true)
})

test('guards: ≤ 40 known words, ≤ 16 s of audio, ≥ 350 ms voiced, WAV only', () => {
  const iptal = (r: ReturnType<typeof klipGeldi<K>>) => (r.karar.k === 'gonder' ? r.karar.iptal : r.karar.neden)
  const ilk = klipGeldi(turSirasiBaslat<K>(), klip('k1', 0, 1000)).durum
  const uzun = Array.from({ length: 41 }, (_, i) => `k${i}`).join(' ')
  assert.equal(iptal(klipGeldi(sttGeldi(ilk, uzun), klip('k2', 1300, 2300))), 'yeni')
  assert.equal(iptal(klipGeldi(ilk, klip('k2', 1300, 1700, 200))), 'kisa')
  assert.equal(iptal(klipGeldi(ilk, klip('k2', 1300, 2300), false)), 'yeni')
  const buyuk = klipGeldi(turSirasiBaslat<K>(), klip('k1', 0, 15_500)).durum
  assert.equal(iptal(klipGeldi(buyuk, klip('k2', 15_800, 17_000))), 'yeni')
})
