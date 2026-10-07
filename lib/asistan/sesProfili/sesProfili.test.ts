import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { KAYIT_CUMLELERI, SES_PROFILI_AYAR, profilGecerliMi, profilKarari, type ProfilKarari } from './ayar'
import { agirlikCoz, kosinus, melSpektrogram, normalize, parcaGomme, profilOrtalama, sesSeviyele, sozGomme, yenidenOrnekle } from './ge2e'
import { bolumSesi, dogrulamaAdimi, dogrulamaBaslat, puanGeldi, sayacBaslat, sayacEkle, tamponBaslat, tamponEkle } from './eslesme'
import { kayitKalitesi, sessizlikKirp } from './kalite'
import { RIZA_BAGLANTI_METNI, RIZA_KUTUSU_METNI, RIZA_TAM_GIRIS, RIZA_TAM_MADDELER } from './rizaMetni'
import { KAPI_ACMA_MS, kapiAdimi, kapiBaslat, type KapiDurumu } from '../konusmaKapisi'
import { bargeSayaci, FISH_BARGE_MS } from '../fishVad'

const KOK = join(__dirname, '../../..')

/* ---- Fixture embeddings (256-d, L2-normalised): a doctor, the same doctor again, someone else ---- */
function vektor(tohum: number): Float32Array {
  let s = tohum
  const v = new Float32Array(256)
  for (let i = 0; i < 256; i++) { s = (s * 1103515245 + 12345) % 2147483648; v[i] = Math.max(0, (s / 2147483648) - 0.3) }
  return normalize(v)
}
function karisim(a: Float32Array, b: Float32Array, k: number): Float32Array {
  return normalize(a.map((x, i) => x * (1 - k) + b[i] * k))
}
const DOKTOR = vektor(7)
const BASKA = vektor(99)

test('match: thresholds — same voice accepted, another voice rejected, the middle undecided', () => {
  const ayniKisi = karisim(DOKTOR, BASKA, 0.1)
  const baskaKisi = karisim(BASKA, DOKTOR, 0.05)
  assert.ok(kosinus(DOKTOR, ayniKisi) >= SES_PROFILI_AYAR.kabulEsik)
  assert.equal(profilKarari(kosinus(DOKTOR, ayniKisi)), 'kabul')
  assert.ok(kosinus(DOKTOR, baskaKisi) < SES_PROFILI_AYAR.redEsik, `${kosinus(DOKTOR, baskaKisi)}`)
  assert.equal(profilKarari(kosinus(DOKTOR, baskaKisi)), 'red')
  assert.equal(profilKarari((SES_PROFILI_AYAR.kabulEsik + SES_PROFILI_AYAR.redEsik) / 2), 'belirsiz')
  assert.equal(profilKarari(Number.NaN), 'belirsiz')
  assert.equal(profilKarari(null), 'belirsiz')
  // The profile is the normalised mean of the enrolment sentences.
  const p = profilOrtalama([DOKTOR, karisim(DOKTOR, BASKA, 0.1)])
  assert.ok(Math.abs(kosinus(p, p) - 1) < 1e-6)
  assert.ok(kosinus(p, DOKTOR) > 0.95)
})

/* ---- Verification state machine ---- */
function surDogrulama(kareler: boolean[], t0 = 1000) {
  let d = dogrulamaBaslat()
  let t = t0
  const istekler: number[] = []
  let sayac = sayacBaslat()
  for (const sesli of kareler) {
    t += 32
    const r = dogrulamaAdimi(d, { t, sesli })
    d = r.durum
    sayac = sayacEkle(sayac, r.bitti)
    if (r.puanla) istekler.push(d.sesliMs)
  }
  return { d, istekler, sayac, t }
}
const tekrar = <T,>(n: number, x: T): T[] => Array.from({ length: n }, () => x)

test('verify: a short word (dur ~350 ms) is never scored and counts as "kisa"', () => {
  const r = surDogrulama([...tekrar(11, true), ...tekrar(25, false)])
  assert.deepEqual(r.istekler, [])
  assert.equal(r.sayac.kisa, 1)
})

test('verify: a long segment is scored at ~800 ms, re-scored while undecided, and a final verdict sticks', () => {
  let r = surDogrulama(tekrar(30, true))
  assert.equal(r.istekler.length, 1)
  assert.ok(r.istekler[0] >= SES_PROFILI_AYAR.dogrulaMinMs && r.istekler[0] < SES_PROFILI_AYAR.dogrulaMinMs + 64)
  let d = puanGeldi(r.d, { bolum: r.d.bolum, skor: 0.65 })
  assert.equal(d.karar, 'belirsiz')
  // Undecided → scored again after yenidenPuanMs.
  let t = r.t
  let tekrarIstek = 0
  for (let i = 0; i < 12; i++) { t += 32; const a = dogrulamaAdimi(d, { t, sesli: true }); d = a.durum; if (a.puanla) tekrarIstek++ }
  assert.equal(tekrarIstek, 1)
  d = puanGeldi(d, { bolum: d.bolum, skor: 0.3 })
  assert.equal(d.karar, 'red')
  for (let i = 0; i < 30; i++) { t += 32; const a = dogrulamaAdimi(d, { t, sesli: true }); d = a.durum; assert.equal(a.puanla, false) }
  // Segment ends → counted once as 'red', verdict cleared for the next segment.
  let sayac = sayacBaslat()
  for (let i = 0; i < 25; i++) { t += 32; const a = dogrulamaAdimi(d, { t, sesli: false }); d = a.durum; sayac = sayacEkle(sayac, a.bitti) }
  assert.deepEqual(sayac, { kabul: 0, red: 1, belirsiz: 0, kisa: 0 })
  assert.equal(d.karar, null)
  r = surDogrulama([])
  assert.equal(r.d.karar, null)
})

test('verify: a late score for an older segment is ignored; an engine failure leaves no verdict', () => {
  const r = surDogrulama(tekrar(30, true))
  const eski = puanGeldi(r.d, { bolum: r.d.bolum - 1, skor: 0.2 })
  assert.equal(eski.karar, null)
  const hata = puanGeldi(r.d, { bolum: r.d.bolum, skor: null })
  assert.equal(hata.karar, null)
  assert.equal(hata.bekliyor, false)
})

test('verify: segment audio = pre-roll + newest frames, at most 1.6 s', () => {
  const b = tamponBaslat()
  for (let i = 0; i < 80; i++) tamponEkle(b, 1000 + i * 32, new Float32Array(512).fill(i))
  const ses = bolumSesi(b, 1000 + 20 * 32)
  assert.equal(ses.length, Math.floor(1.6 * 16000))
  assert.equal(ses[ses.length - 1], 79)
  const kisa = bolumSesi(b, 1000 + 75 * 32)
  assert.equal(kisa.length, (80 - 75 + Math.floor(SES_PROFILI_AYAR.onTamponMs / 32)) * 512)
})

/* ---- Gate with a profile (ElevenLabs) ---- */
function surKapi(kareler: Array<{ p: number; rms: number; karar?: ProfilKarari | null; profilYok?: boolean }>, d0: KapiDurumu = kapiBaslat(), t0 = 10_000) {
  let d = d0
  let t = t0
  const iz: boolean[] = []
  for (const k of kareler) {
    t += 32
    d = kapiAdimi(d, { t, ajanKonusuyor: true, p: k.p, rms: k.rms, profil: k.profilYok ? null : { karar: k.karar ?? null } })
    iz.push(d.acik)
  }
  return { d, iz, t }
}
const SUS = { p: 0.02, rms: 0.003 }
const KONUS = { p: 0.9, rms: 0.15 }

test('gate+profile: short word with no verdict yet opens on the speech-only rule (dur still stops her)', () => {
  const r = surKapi([SUS, ...tekrar(10, KONUS)])
  const ilk = r.iz.indexOf(true)
  assert.ok(ilk > 0 && (ilk - 1) * 32 <= KAPI_ACMA_MS + 64)
})

test('gate+profile: a rejected voice closes the gate for the rest of its segment, then a new segment is verified first', () => {
  let r = surKapi([SUS, ...tekrar(10, KONUS)])
  assert.equal(r.d.acik, true)
  r = surKapi([{ ...KONUS, karar: 'red' }, ...tekrar(20, { ...KONUS, karar: 'red' as ProfilKarari })], r.d, r.t)
  assert.ok(r.iz.every((a) => !a), 'red must close it')
  assert.equal(r.d.neden, 'profil_red')
  // Silence ends the segment; the next voice within redSonrasiMs waits for its verdict…
  r = surKapi(tekrar(25, SUS), r.d, r.t)
  r = surKapi(tekrar(12, KONUS), r.d, r.t)
  assert.ok(r.iz.every((a) => !a))
  assert.equal(r.d.neden, 'profil_bekle')
  // …and opens at once on 'kabul'.
  r = surKapi([{ ...KONUS, karar: 'kabul' }], r.d, r.t)
  assert.equal(r.d.acik, true)
})

test('gate+profile: never a hard lock — undecided after a rejection opens at dogrulaAzamiMs', () => {
  let r = surKapi([SUS, ...tekrar(30, { ...KONUS, karar: 'red' as ProfilKarari }), ...tekrar(25, SUS)])
  const adim = Math.ceil(SES_PROFILI_AYAR.dogrulaAzamiMs / 32) + 3
  r = surKapi(tekrar(adim, { ...KONUS, karar: 'belirsiz' as ProfilKarari }), r.d, r.t)
  assert.equal(r.d.acik, true)
})

test('gate+profile: engine gone (profil null) behaves exactly as without a profile', () => {
  const a = surKapi([SUS, ...tekrar(10, { ...KONUS, profilYok: true })])
  let d = kapiBaslat()
  let t = 10_000
  const iz: boolean[] = []
  for (const k of [SUS, ...tekrar(10, KONUS)]) { t += 32; d = kapiAdimi(d, { t, ajanKonusuyor: true, p: k.p, rms: k.rms }); iz.push(d.acik) }
  assert.deepEqual(a.iz, iz)
})

/* ---- Fish barge-in with a profile ---- */
test('fish+profile: rejected voice never barges; after a rejection a new voice waits for its verdict; kabul barges', () => {
  assert.deepEqual(bargeSayaci(1000, true, 0.3, 50, 0.9, { karar: 'red', redYeni: true }), { ms: 0, kes: false })
  let ms = 0
  let kes = false
  for (let i = 0; i < 10; i++) { const r = bargeSayaci(ms, true, 0.3, 50, 0.9, { karar: null, redYeni: true }); ms = r.ms; kes = kes || r.kes }
  assert.equal(kes, false)
  assert.equal(bargeSayaci(ms, true, 0.3, 50, 0.9, { karar: 'kabul', redYeni: true }).kes, true)
  // No recent rejection: speech-only rule (short words) at FISH_BARGE_MS.
  assert.equal(bargeSayaci(FISH_BARGE_MS - 50, true, 0.3, 50, 0.9, { karar: null, redYeni: false }).kes, true)
  assert.equal(bargeSayaci(SES_PROFILI_AYAR.dogrulaAzamiMs, true, 0.3, 50, 0.9, { karar: 'belirsiz', redYeni: true }).kes, true)
})

/* ---- Engine = resemblyzer reference ---- */
test('engine: the shipped model parses and the TypeScript encoder matches the NumPy/librosa reference', () => {
  const buf = readFileSync(join(KOK, 'public/ses-profili/ge2e-v1.bin'))
  const a = agirlikCoz(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
  assert.equal(a.katmanlar.length, 3)
  const ref = JSON.parse(readFileSync(join(__dirname, '__fixtures__/ge2e-referans.json'), 'utf8')) as { mel_kare10: number[]; kare: number; parca: number[]; soz: number[] }
  const n = Math.floor(16000 * 1.2)
  const x = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const v = 0.25 * Math.sin((2 * Math.PI * 180 * i) / 16000) + 0.12 * Math.sin((2 * Math.PI * 360 * i) / 16000 + 0.5)
      + 0.06 * Math.sin((2 * Math.PI * (700 + 0.02 * i) * i) / 16000) + 0.03 * Math.sin((2 * Math.PI * 2300 * i) / 16000)
    x[i] = v * (0.6 + 0.4 * Math.sin((2 * Math.PI * 3 * i) / 16000))
  }
  const { kare, mel } = melSpektrogram(sesSeviyele(x))
  assert.equal(kare, ref.kare)
  for (let m = 0; m < 40; m++) assert.ok(Math.abs(mel[10 * 40 + m] - ref.mel_kare10[m]) <= 1e-4 * Math.abs(ref.mel_kare10[m]) + 1e-7, `mel ${m}`)
  const p = parcaGomme(a, x)
  assert.equal(p.length, 256)
  assert.ok(kosinus(p, ref.parca) > 0.9999, `parca ${kosinus(p, ref.parca)}`)
  assert.ok(Math.abs(Math.hypot(...p) - 1) < 1e-4)
  assert.ok(p.every((v) => v >= 0))
  assert.ok(kosinus(sozGomme(a, x), ref.soz) > 0.9999)
  assert.throws(() => agirlikCoz(new ArrayBuffer(16)))
})

test('engine: resampling 48 kHz → 16 kHz keeps length and level', () => {
  const x = new Float32Array(48000).map((_, i) => 0.5 * Math.sin((2 * Math.PI * 300 * i) / 48000))
  const y = yenidenOrnekle(x, 48000)
  assert.equal(y.length, 16000)
  const rms = Math.sqrt(y.reduce((s, v) => s + v * v, 0) / y.length)
  assert.ok(rms > 0.33 && rms < 0.37, `${rms}`)
})

/* ---- Enrolment quality ---- */
function okuma(saniye: number, genlik: number, gurultu = 0): Float32Array {
  let s = 3
  const x = new Float32Array(Math.floor(16000 * saniye))
  for (let i = 0; i < x.length; i++) {
    s = (s * 1103515245 + 12345) % 2147483648
    const hece = Math.floor(i / 4000) % 4 !== 3 // 0.75 s voiced, 0.25 s pause
    const ses = hece ? genlik * Math.sin((2 * Math.PI * 160 * i) / 16000) * (0.6 + 0.4 * Math.sin((2 * Math.PI * 4 * i) / 16000)) : 0
    x[i] = ses + gurultu * ((s / 2147483648) * 2 - 1)
  }
  return x
}

test('enrolment quality: clean reading passes; too quiet / too noisy / too short are named', () => {
  assert.equal(kayitKalitesi(okuma(5, 0.2, 0.002)).sorun, null)
  assert.equal(kayitKalitesi(okuma(5, 0.008, 0.0001)).sorun, 'sessiz')
  assert.equal(kayitKalitesi(okuma(5, 0.2, 0.2)).sorun, 'gurultulu')
  assert.equal(kayitKalitesi(okuma(1.5, 0.2, 0.002)).sorun, 'kisa')
  assert.equal(kayitKalitesi(new Float32Array(32000)).tamam, false)
  const kirpik = sessizlikKirp(new Float32Array([...new Float32Array(32000), ...okuma(2, 0.2)]))
  assert.ok(kirpik.length < 2.5 * 16000)
})

test('enrolment: four phonetically varied Turkish sentences', () => {
  assert.equal(KAYIT_CUMLELERI.length, 4)
  const hepsi = KAYIT_CUMLELERI.join(' ')
  for (const harf of ['ç', 'ş', 'ğ', 'ı', 'ö', 'ü']) assert.ok(hepsi.includes(harf), harf)
})

/* ---- Consent texts and storage validation ---- */
test('consent: checkbox line is exactly Kaan\'s text; full text has the controller and contact from /kvkk', () => {
  assert.equal(`${RIZA_KUTUSU_METNI} ${RIZA_BAGLANTI_METNI}`, "Sesimden bir ses profili oluşturulmasına ve Ayşe'nin beni tanıması için kullanılmasına açık rıza veriyorum. Ses kaydım saklanmaz; profili dilediğim an silebilirim. Açık rıza metnini oku")
  assert.match(RIZA_TAM_GIRIS, /^Dream Türkiye \(Notya\)/)
  assert.equal(RIZA_TAM_MADDELER.length, 6)
  assert.match(RIZA_TAM_MADDELER[5], /kvkk@notya\.ai/)
  assert.ok(![RIZA_TAM_GIRIS, ...RIZA_TAM_MADDELER].some((m) => /\[[A-ZÇĞİÖŞÜ ]+\]/.test(m)), 'placeholder left')
  assert.ok(!/güvenlik/i.test(RIZA_TAM_GIRIS))
})

test('storage: only 256 finite numbers are accepted as a profile', () => {
  assert.equal(profilGecerliMi(Array.from(DOKTOR)), true)
  assert.equal(profilGecerliMi(Array.from(DOKTOR).slice(1)), false)
  assert.equal(profilGecerliMi([...Array.from(DOKTOR).slice(1), Number.NaN]), false)
  assert.equal(profilGecerliMi([...Array.from(DOKTOR).slice(1), 99]), false)
  assert.equal(profilGecerliMi('ses'), false)
})
