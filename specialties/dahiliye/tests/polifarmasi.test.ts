import { test } from 'node:test'
import assert from 'node:assert/strict'
import { polifarmasiDegerlendir, kararDogrula, OVERRIDE_MIN, type PoliGirdi, type PoliIlac } from '../engines/polifarmasi'

const tan = { askvh: false, af: false, hf: false, dm: false, koah: false, osteoporoz: false, ckdAlbuminuri: false }
const bos: PoliGirdi = { yas: 75, ilaclar: [], eGFR: 70, k: 4.5, na: 139, tanilar: tan, dusmePozitif: false, bugun: '2026-09-17' }
const il = (ad: string, etken?: string, baslangic?: string): PoliIlac => ({ ad, etken: etken ?? null, baslangic: baslangic ?? null })
const bul = (g: PoliGirdi, kod: string) => polifarmasiDegerlendir(g).oneriler.find((o) => o.kod === kod)

test('<65 yaş veya yaş yok: uygulanamaz, öneri yok', () => {
  const r = polifarmasiDegerlendir({ ...bos, yas: 60, ilaclar: [il('Voltaren', 'diklofenak')], eGFR: 20 })
  assert.equal(r.uygulanabilir, false); assert.equal(r.oneriler.length, 0); assert.match(r.not, /65/)
  assert.equal(polifarmasiDegerlendir({ ...bos, yas: null }).uygulanabilir, false)
})

test('NSAİİ + eGFR 40 → engelleyici durdur; eGFR 60 → yok; NSAİİ + warfarin → durdur; iki NSAİİ tekrar', () => {
  const o = bul({ ...bos, ilaclar: [il('Arveles', 'deksketoprofen')], eGFR: 40 }, 'stopp_nsaii_bobrek')
  assert.ok(o); assert.equal(o.siddet, 'durdur'); assert.equal(o.engelleyici, true); assert.deepEqual(o.ilaclar, ['Arveles']); assert.equal(o.dipnot.ref, 'STOPP_START_V3')
  assert.equal(bul({ ...bos, ilaclar: [il('Arveles', 'deksketoprofen')], eGFR: 60 }, 'stopp_nsaii_bobrek'), undefined)
  const w = bul({ ...bos, ilaclar: [il('Coumadin', 'warfarin sodyum'), il('Apranax', 'naproksen')] }, 'stopp_nsaii_oak')
  assert.ok(w); assert.equal(w.engelleyici, true); assert.deepEqual(w.ilaclar.sort(), ['Apranax', 'Coumadin'])
  assert.ok(bul({ ...bos, ilaclar: [il('Apranax', 'naproksen'), il('Majezik', 'flurbiprofen')] }, 'stopp_nsaii_tekrar'))
  assert.ok(bul({ ...bos, ilaclar: [il('Apranax', 'naproksen')], tanilar: { ...tan, hf: true } }, 'stopp_nsaii_ky'))
})

test('benzodiazepin: gözden geçir; düşme pozitif → engelleyici durdur', () => {
  const g = bul({ ...bos, ilaclar: [il('Xanax', 'alprazolam')] }, 'stopp_benzo')
  assert.equal(g?.siddet, 'gozden_gecir'); assert.equal(g?.engelleyici, false)
  const d = bul({ ...bos, ilaclar: [il('Xanax', 'alprazolam')], dusmePozitif: true }, 'stopp_benzo')
  assert.equal(d?.siddet, 'durdur'); assert.equal(d?.engelleyici, true)
})

test('metformin eGFR 25; K 5,8 + ramipril; Na 128 + HCTZ → durdur', () => {
  assert.equal(bul({ ...bos, ilaclar: [il('Glifor', 'metformin HCl')], eGFR: 25 }, 'stopp_metformin_bobrek')?.engelleyici, true)
  assert.equal(bul({ ...bos, ilaclar: [il('Glifor', 'metformin HCl')], eGFR: 35 }, 'stopp_metformin_bobrek'), undefined)
  assert.equal(bul({ ...bos, ilaclar: [il('Delix', 'ramipril')], k: 5.8 }, 'stopp_ras_hiperkalemi')?.siddet, 'durdur')
  assert.ok(bul({ ...bos, ilaclar: [il('Delix', 'ramipril'), il('Cozaar', 'losartan')] }, 'stopp_ikili_ras'))
  assert.equal(bul({ ...bos, ilaclar: [il('Hidroklorotiyazid')], na: 128 }, 'stopp_tiyazid_hiponatremi')?.siddet, 'durdur')
})

test('START: ASKVH statin yok → statin önerisi (statin varsa yok); opioid + laksatif yok → laksatif', () => {
  const s = bul({ ...bos, tanilar: { ...tan, askvh: true } }, 'start_statin_askvh')
  assert.equal(s?.tip, 'START'); assert.equal(s?.siddet, 'baslat'); assert.equal(s?.engelleyici, false)
  assert.equal(bul({ ...bos, ilaclar: [il('Lipitor', 'atorvastatin')], tanilar: { ...tan, askvh: true } }, 'start_statin_askvh'), undefined)
  assert.equal(bul({ ...bos, ilaclar: [il('Mikostatin', 'nistatin')], tanilar: { ...tan, askvh: true } }, 'start_statin_askvh')?.kod, 'start_statin_askvh')
  assert.deepEqual(bul({ ...bos, ilaclar: [il('Contramal', 'tramadol')] }, 'start_laksatif_opioid')?.ilaclar, ['Contramal'])
  assert.equal(bul({ ...bos, ilaclar: [il('Contramal', 'tramadol'), il('Duphalac', 'laktüloz')] }, 'start_laksatif_opioid'), undefined)
})

test('PPI >8 hafta gözden geçir; yeni başlanan veya başlangıç bilinmeyen yok', () => {
  assert.equal(bul({ ...bos, ilaclar: [il('Nexium', 'esomeprazol', '2026-05-01')] }, 'stopp_ppi_uzun')?.siddet, 'gozden_gecir')
  assert.equal(bul({ ...bos, ilaclar: [il('Nexium', 'esomeprazol', '2026-09-01')] }, 'stopp_ppi_uzun'), undefined)
  assert.equal(bul({ ...bos, ilaclar: [il('Nexium', 'esomeprazol')] }, 'stopp_ppi_uzun'), undefined)
})

test('sıralama durdur → gözden geçir → başlat; polifarmasi ≥5; dipnotlar', () => {
  const r = polifarmasiDegerlendir({ ...bos, ilaclar: [il('Contramal', 'tramadol'), il('Xanax', 'alprazolam'), il('Arveles', 'deksketoprofen'), il('Delix', 'ramipril'), il('Nexium', 'esomeprazol', '2025-01-01')], eGFR: 40, tanilar: { ...tan, af: true } })
  assert.equal(r.aktifSayi, 5); assert.equal(r.polifarmasi, true)
  const s = r.oneriler.map((o) => o.siddet); const sira = { durdur: 0, gozden_gecir: 1, baslat: 2 }
  assert.deepEqual(s, [...s].sort((a, b) => sira[a] - sira[b])); assert.equal(s[0], 'durdur'); assert.equal(s[s.length - 1], 'baslat')
  assert.ok(r.oneriler.every((o) => o.dipnot.ref === 'STOPP_START_V3' && o.engelleyici === (o.siddet === 'durdur')))
  assert.ok(r.dipnotlar.some((d) => d.ref === 'TIHUD2023'))
  assert.equal(new Set(r.oneriler.map((o) => o.kod)).size, r.oneriler.length)
})

test('kararDogrula: engelleyici override gerekçe ≥ OVERRIDE_MIN; kabul ve engelleyici olmayan serbest', () => {
  const e = { engelleyici: true, baslik: 'NSAİİ + oral antikoagülan' }
  assert.equal(OVERRIDE_MIN, 15)
  assert.equal(typeof kararDogrula(e, 'override', '0123456789'), 'string')
  assert.equal(typeof kararDogrula(e, 'override', '   kısa gerekçe      '), 'string')
  assert.equal(kararDogrula(e, 'override', 'Kardiyoloji ile konuşuldu, kısa süreli'), null)
  assert.equal(kararDogrula(e, 'kabul', ''), null)
  assert.equal(kararDogrula({ engelleyici: false, baslik: 'PPI' }, 'override', ''), null)
})

test('güvenlik: hiçbir çıktı metninde doz yok', () => {
  const hepsi: PoliIlac[] = ['diklofenak', 'ibuprofen', 'warfarin', 'metformin', 'ramipril', 'losartan', 'spironolakton', 'hidroklorotiyazid', 'alprazolam', 'zolpidem', 'amitriptilin', 'oksibutinin', 'glimepirid', 'digoksin', 'aspirin', 'doksazosin', 'ketiapin', 'tramadol'].map((x) => il(x.toUpperCase(), x, '2024-01-01')).concat(il('Pantpas', 'pantoprazol', '2024-01-01'))
  const r = polifarmasiDegerlendir({ ...bos, ilaclar: hepsi, eGFR: 20, k: 6.1, na: 125, dusmePozitif: true, tanilar: { askvh: true, af: true, hf: true, dm: true, koah: true, osteoporoz: true, ckdAlbuminuri: true } })
  assert.ok(r.oneriler.length >= 20)
  const doz = /\d+\s*(mg|mcg|µg|ünite|IU)/i
  for (const s of [r.not, ...r.oneriler.flatMap((o) => [o.baslik, o.gerekce, o.oneri, o.dipnot.not]), ...r.dipnotlar.map((d) => d.not)]) assert.doesNotMatch(s, doz)
})
