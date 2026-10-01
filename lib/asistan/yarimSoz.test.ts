/**
 * NOTYA-SES-YARIM-01 (Kaan, 2026-10-01) — "Ayşe lütfen bana Umutcan [pause] Türkoğlu…" closed after "Umutcan";
 * "Ayşe lütfen bana." was answered as a complete message.
 *
 * 1. The silence tail survives a name-surname pause (fixture below) without growing past 800 ms.
 * 2. The words decide what the tail cannot: an unfinished request is held (yarimSozCoz), never answered.
 * 3. The held clip and the continuation go out as ONE utterance (fishTurSirasi `yarim`).
 * The route-level proof (no brain call, nothing spoken, nothing stored) is in tekBeyin.test.ts.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FISH_SES_SIZLIGI_MS, FISH_SES_SIZLIGI_SILERO_MS, klipGonderilirMi, turAdimi, turBaslat } from './fishVad'
import { yarimSozCoz } from './yarimSoz'
import {
  FISH_YARIM_AZAMI_KLIP, FISH_YARIM_BEKLEME_MS, klipGeldi, sesBasladi, sttGeldi, turBitti, turSirasiBaslat, yarimKaldi, type TurSirasi,
} from './fishTurSirasi'

/** The tail before this fix (NOTYA-VAD-TAIL-01, #505). */
const ONCEKI_KUYRUK_MS = 500

/** Drive the turn machine frame by frame (ScriptProcessor 2048 @ 48 kHz ≈ 42.7 ms). Returns every turn it closed. */
function kaydet(parcalar: { ses: boolean; ms: number }[], kaynak: 'rms' | 'silero' = 'rms', kareMs = (2048 / 48000) * 1000) {
  const turlar: { bitisMs: number; sesliMs: number }[] = []
  let tur = turBaslat()
  let t = 0
  const bas = 1_000_000
  for (const p of parcalar) {
    for (const son = t + p.ms; t < son; ) {
      t += kareMs
      const adim = turAdimi(tur, { ses: p.ses, kaynak, simdi: bas + t, kareMs })
      tur = adim.durum
      if (adim.bitir) { turlar.push({ bitisMs: t, sesliMs: tur.sesliMs }); tur = turBaslat() }
    }
  }
  return turlar
}

test('fixture — pause between name and surname: "… bana Umutcan" [650 ms] "Türkoğlu\'nun aşılarını göster" is ONE turn', () => {
  const soz = [
    { ses: true, ms: 1100 },  // "Ayşe lütfen bana Umutcan"
    { ses: false, ms: 650 },  // the pause before the surname
    { ses: true, ms: 1400 },  // "Türkoğlu'nun aşılarını göster"
    { ses: false, ms: 1500 }, // the doctor stopped
  ]
  assert.ok(650 > ONCEKI_KUYRUK_MS, 'the old 500 ms tail closed the turn inside this pause')
  for (const kaynak of ['rms', 'silero'] as const) {
    const turlar = kaydet(soz, kaynak)
    assert.equal(turlar.length, 1, `${kaynak}: ${JSON.stringify(turlar)}`)
    // Both halves are in the clip, and it closes one tail after the last word — not later.
    assert.ok(turlar[0].sesliMs >= 2400, `${kaynak} sesli ${turlar[0].sesliMs}`)
    const sonSoz = 1100 + 650 + 1400
    assert.ok(turlar[0].bitisMs >= sonSoz + FISH_SES_SIZLIGI_MS && turlar[0].bitisMs <= sonSoz + FISH_SES_SIZLIGI_MS + 150, `${kaynak} bitis ${turlar[0].bitisMs}`)
    assert.deepEqual(klipGonderilirMi({ toplamMs: turlar[0].bitisMs, sesliMs: turlar[0].sesliMs }), { gonder: true, neden: null })
  }
})

test('tail: 500 → 700 ms on both engines; replies do not wait longer than 800 ms of silence', () => {
  assert.equal(FISH_SES_SIZLIGI_MS, 700)
  assert.equal(FISH_SES_SIZLIGI_SILERO_MS, 700)
  assert.ok(FISH_SES_SIZLIGI_MS <= 800 && FISH_SES_SIZLIGI_SILERO_MS <= 800)
  // A pause longer than the tail still splits the audio — that case is the hold + merge below, not more tail.
  assert.equal(kaydet([{ ses: true, ms: 1100 }, { ses: false, ms: 1200 }, { ses: true, ms: 1400 }, { ses: false, ms: 1500 }]).length, 2)
})

test('unfinished request: only request words after the address → held (askida)', () => {
  for (const m of ['Ayşe lütfen bana.', 'Ayşe lütfen bana', 'Ayşe, lütfen', 'Lütfen.', 'Bana', 'Ayşe Hanım bana bir', 'ayşe lütfen bana...', 'Hocam lütfen bize']) {
    assert.deepEqual(yarimSozCoz(m), { tur: 'yarim', neden: 'askida' }, m)
  }
})

test('unfinished request: a bare word after a request word / verb is a name candidate (the caller checks the name index)', () => {
  for (const [m, ad] of [
    ['Ayşe lütfen bana Umutcan', 'Umutcan'],
    ['Ayşe lütfen bana Umutcan.', 'Umutcan'],
    ['Bana Umutcan', 'Umutcan'],
    ['Aç Umutcan', 'Umutcan'],
    ['Ayşe göster bana Umutcan', 'Umutcan'],
    ['Lütfen devam', 'devam'],
  ] as const) {
    const y = yarimSozCoz(m)
    assert.equal(y.tur, 'ad-adayi', m)
    if (y.tur === 'ad-adayi') assert.equal(y.ad, ad, m)
  }
  const buyuk = yarimSozCoz('Ayşe lütfen bana Umutcan')
  const kucuk = yarimSozCoz('Lütfen devam')
  assert.equal(buyuk.tur === 'ad-adayi' && buyuk.buyukHarf, true)
  assert.equal(kucuk.tur === 'ad-adayi' && kucuk.buyukHarf, false)
})

test('complete turns are never held', () => {
  for (const m of [
    'Ayşe lütfen bana Umutcan Türkoğlu\'nun aşılarını göster.',
    'Umutcan\'ın aşılarını göster',
    'Bana Umutcan\'ı aç',
    'Bana Umutcan aç',
    'Umutcan',
    'Umutcan Türkoğlu',
    'Bana Umutcan Türkoğlu',
    'Ayşe',
    'Merhaba Ayşe',
    'Teşekkürler Ayşe',
    'Evet lütfen',
    'Evet',
    'Hayır',
    'Tamam',
    'Dosyayı aç lütfen',
    'Bana anlat',
    'Lütfen tekrar söyler misin',
    'Bugün randevum var mı?',
    'Rica ederim',
    'Devam et',
    'Ayşe bana bugünkü randevuları söyle',
    'Bana 2',
    '',
  ]) {
    assert.deepEqual(yarimSozCoz(m), { tur: 'tam' }, m)
  }
})

test('address: the active colleague\'s first name is stripped like "Ayşe"; another first name is content', () => {
  assert.deepEqual(yarimSozCoz('Fatma lütfen bana', ['Ayşe', 'Fatma']), { tur: 'yarim', neden: 'askida' })
  assert.deepEqual(yarimSozCoz('Fatma lütfen bana'), { tur: 'tam' })
})

type K = { ad: string; konusmaBas: number; bitis: number; sesliMs: number; toplamMs?: number }
const klip = (ad: string, konusmaBas: number, bitis: number, sesliMs = 900): K => ({ ad, konusmaBas, bitis, sesliMs })
const adlar = (k: K[]) => k.map((x) => x.ad)

test('hold + merge: "… bana Umutcan" [1.2 s] "Türkoğlu\'nun aşılarını göster" → no reply to the fragment, ONE merged utterance', () => {
  // clip 1 closes on the tail; the server transcribes it and answers `bekle` (no brain call)
  let d: TurSirasi<K> = klipGeldi(turSirasiBaslat<K>(), klip('k1', 0, 1800)).durum
  d = sttGeldi(d, 'Ayşe lütfen bana Umutcan.')
  assert.equal(yarimSozCoz('Ayşe lütfen bana Umutcan.').tur, 'ad-adayi')
  d = yarimKaldi(d)
  assert.equal(d.aktif?.yarim, true)
  assert.equal(d.aktif?.sesBasladi, false, 'nothing was spoken')
  // the surname arrives 1.2 s later — far outside the 700 ms tail, inside the hold window
  const r = klipGeldi(d, klip('k2', 3000, 5200))
  assert.equal(r.karar.k, 'gonder')
  if (r.karar.k !== 'gonder') return
  assert.deepEqual(adlar(r.karar.klipler), ['k1', 'k2'])
  assert.equal(r.karar.birlesik, true)
  assert.equal(r.karar.iptal, 'devam')
  assert.equal(r.durum.aktif?.yarim, undefined, 'the merged turn is a normal turn in flight')
  // the fragment's transcript is what the merged bubble replaces
  assert.equal(d.aktif?.stt, 'Ayşe lütfen bana Umutcan.')
})

test('hold: a short surname still continues it; a second unfinished merge is held again; clip count is bounded', () => {
  let d: TurSirasi<K> = yarimKaldi(sttGeldi(klipGeldi(turSirasiBaslat<K>(), klip('k1', 0, 1000)).durum, 'Ayşe lütfen.'))
  // "bana Ak" — 250 ms voiced would be ignored as a cough while a brain call is in flight; a held turn takes it
  const r2 = klipGeldi(d, klip('k2', 1900, 2600, 250))
  assert.equal(r2.karar.k === 'gonder' && r2.karar.iptal, 'devam')
  d = yarimKaldi(sttGeldi(r2.durum, 'Ayşe lütfen bana Ak.'))
  const r3 = klipGeldi(d, klip('k3', 3400, 4800))
  assert.equal(r3.karar.k === 'gonder' && r3.karar.klipler.length, 3)
  d = yarimKaldi(r3.durum)
  const r4 = klipGeldi(d, klip('k4', 5600, 6400))
  assert.equal(r4.karar.k === 'gonder' && r4.karar.klipler.length, FISH_YARIM_AZAMI_KLIP)
  d = yarimKaldi(r4.durum)
  const r5 = klipGeldi(d, klip('k5', 7000, 8000))
  assert.equal(r5.karar.k === 'gonder' && r5.karar.birlesik, false, 'a fifth clip starts over')
  assert.deepEqual(r5.karar.k === 'gonder' && adlar(r5.karar.klipler), ['k5'])
})

test('hold: after the window the fragment is stale — the next clip is a plain new turn and the fragment is never sent again', () => {
  const d: TurSirasi<K> = yarimKaldi(sttGeldi(klipGeldi(turSirasiBaslat<K>(), klip('k1', 0, 1000)).durum, 'Ayşe lütfen bana.'))
  const gec = klipGeldi(d, klip('k2', 1000 + FISH_YARIM_BEKLEME_MS + 1, 1000 + FISH_YARIM_BEKLEME_MS + 1500))
  assert.equal(gec.karar.k, 'gonder')
  if (gec.karar.k !== 'gonder') return
  assert.deepEqual(adlar(gec.karar.klipler), ['k2'])
  assert.equal(gec.karar.birlesik, false)
  assert.equal(gec.karar.iptal, 'yok', 'nothing is in flight — nothing to abort')
  // non-WAV recorder: clips cannot be joined → new turn
  const webm = klipGeldi(d, klip('k2', 1500, 2500), false)
  assert.equal(webm.karar.k === 'gonder' && webm.karar.birlesik, false)
  // merged audio that would exceed the clip limit is not joined
  const uzun = yarimKaldi(klipGeldi(turSirasiBaslat<K>(), { ...klip('k1', 0, 15_000), toplamMs: 15_000 }).durum)
  const r = klipGeldi(uzun, { ...klip('k2', 16_000, 28_000), toplamMs: 12_000 })
  assert.equal(r.karar.k === 'gonder' && r.karar.birlesik, false)
})

test('a held turn does not change the existing paths: barge-in, in-flight merge, turBitti', () => {
  let d: TurSirasi<K> = klipGeldi(turSirasiBaslat<K>(), klip('k1', 0, 1000)).durum
  d = sesBasladi(d)
  const barge = klipGeldi(d, klip('k2', 1200, 2000))
  assert.equal(barge.karar.k === 'gonder' && barge.karar.iptal, 'barge')
  assert.equal(turBitti(yarimKaldi(d)).aktif, null)
  assert.equal(yarimKaldi(turSirasiBaslat<K>()).aktif, null)
})
