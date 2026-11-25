/**
 * ESNEK-KBB2 (2026-11-25) — plain-sheet name heading, identity running past its box, the template registry placed by
 * printed labels (anchors), drawing note areas and sides, the WhatsApp-quality capture gate. Synthetic data only: drawn
 * rectangles stand in for handwriting, an injected OCR stands in for the printed labels (no real page, no real identity).
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { serbestBaslikKutulari, tasmaKutulari, maskeliMi, type ElSatiri } from './gizlilik'
import { sayfaPaketiHazirla, type TuvalAdaptoru } from './sayfaPaketi'
import { sablonKaydi, sablonuYerlestir, kutuyuTasi, uygula, capaAnahtari } from './kayit'
import { kayitliSablonlarTr, KBB_ANATOMI_FORMU } from './tohum'
import { kaliteKarari } from './onisleme'
import { bolgeyeBagla } from './satir'
import { sayfayiOku, type ModelKapisi, type SayfaPaketi } from './okuyucu'
import { sozlukKur } from './sozluk'
import { tohumlarTr, anahatTr } from './tohum'
import { anahatOgren } from './anahat'
import { EL_NOTU_TR } from './metinTr'
import type { OcrSatir } from '@/core/belgeler/kimlikMaske'
import type { Kutu, Rgba } from './tipler'

const hamTuval: TuvalAdaptoru = { async jpeg(r) { return Buffer.from(JSON.stringify({ w: r.w, h: r.h, d: Array.from(r.d) })).toString('base64') } }
const ham = (b64: string) => JSON.parse(Buffer.from(b64, 'base64').toString()) as { w: number; h: number; d: number[] }
/** Any pixel of the given colour family in the box (normalised) of an encoded raster. */
function renkVar(b64: string, renk: 'kirmizi' | 'mavi', k: Kutu = { x0: 0, y0: 0, x1: 1, y1: 1 }): boolean {
  const r = ham(b64)
  for (let y = Math.floor(k.y0 * r.h); y < Math.ceil(k.y1 * r.h); y++) for (let x = Math.floor(k.x0 * r.w); x < Math.ceil(k.x1 * r.w); x++) {
    const i = (y * r.w + x) * 4, R = r.d[i], G = r.d[i + 1], B = r.d[i + 2]
    if (renk === 'kirmizi' ? R > 180 && G < 60 && B < 60 : B > 120 && R < 60 && G < 80) return true
  }
  return false
}
function sayfa(w: number, h: number, ciz: (boya: (x0: number, y0: number, x1: number, y1: number, c: [number, number, number]) => void) => void): Rgba {
  const d = new Uint8ClampedArray(w * h * 4).fill(255)
  const boya = (x0: number, y0: number, x1: number, y1: number, c: [number, number, number]) => { for (let y = Math.round(y0 * h); y < Math.round(y1 * h); y++) for (let x = Math.round(x0 * w); x < Math.round(x1 * w); x++) { const i = (y * w + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2] } }
  ciz(boya)
  return { w, h, d }
}
const KIRMIZI: [number, number, number] = [230, 10, 10], MAVI: [number, number, number] = [20, 30, 170]
/** "Handwritten words": short strokes across [x0, x1] at height y (word gaps every few strokes). */
const yazi = (boya: Parameters<Parameters<typeof sayfa>[2]>[0], x0: number, x1: number, y: number, c = MAVI) => { for (let x = x0; x < x1 - 0.012; x += 0.018) boya(x, y, x + 0.012, y + 0.018, c) }
const L = (x0: number, y0: number, x1: number, y1: number, kelimeler?: Kutu[]): ElSatiri => ({ kutu: { x0, y0, x1, y1 }, kelimeler: kelimeler || [{ x0, y0, x1, y1 }] })

// ─── plain sheet: the patient's name written as a heading ──────────────────────────────────────────────
test('plain sheet: a short centred heading in the first written row is blacked out — date and age at the margins stay', async () => {
  const foto = sayfa(1000, 1400, (boya) => {
    yazi(boya, 0.1, 0.24, 0.08) // date at the left margin
    yazi(boya, 0.45, 0.62, 0.075, KIRMIZI) // the NAME heading, centred
    for (let i = 0; i < 8; i++) yazi(boya, 0.18, 0.86, 0.16 + i * 0.06) // body lines
  })
  const s = await sayfaPaketiHazirla({ foto, sayfa: 1, sablonlar: [{ id: 'serbest', ad: 'Düz', tur: 'serbest', brans: null, enBoy: 0.707, baslikBolgeleri: [], cizimBolgeleri: [], parmakIzi: null }], serbestBeyan: true, tuval: hamTuval, ocr: async () => [], kenarOcrAtla: true })
  assert.equal(s.durum, 'hazir')
  if (s.durum !== 'hazir') return
  assert.equal(s.gizlilik.neden, 'serbest')
  assert.ok(!renkVar(s.maskeliSayfa.base64, 'kirmizi'), 'the heading name never leaves the device')
  for (const t of s.paket.parcalar || []) assert.ok(!renkVar(t.gorsel.base64, 'kirmizi'), 'nor in a tile')
  assert.ok(renkVar(s.maskeliSayfa.base64, 'mavi', { x0: 0.08, y0: 0.06, x1: 0.26, y1: 0.12 }), 'the date at the margin stays readable')
  assert.ok(renkVar(s.maskeliSayfa.base64, 'mavi', { x0: 0.15, y0: 0.15, x1: 0.9, y1: 0.2 }), 'the first body line stays readable')
})

test('plain sheet heading: a first body line, an insertion over a line, a left-margin age token are NOT headings', () => {
  // first line is body text (wide) → nothing
  assert.deepEqual(serbestBaslikKutulari([L(0.2, 0.1, 0.85, 0.13), L(0.2, 0.15, 0.8, 0.18)]), [])
  // a body line split by a wide gap (two body groups on one line) → nothing
  assert.deepEqual(serbestBaslikKutulari([L(0.28, 0.1, 0.8, 0.13, [{ x0: 0.28, y0: 0.1, x1: 0.55, y1: 0.13 }, { x0: 0.62, y0: 0.1, x1: 0.8, y1: 0.13 }]), L(0.2, 0.16, 0.8, 0.19)]), [])
  // an insertion written just above the next line ("doymadı" over "rahat değil") → nothing
  assert.deepEqual(serbestBaslikKutulari([L(0.45, 0.1, 0.6, 0.13), L(0.2, 0.124, 0.75, 0.156), L(0.2, 0.18, 0.8, 0.21)]), [])
  // age / sex at the left margin, a date at the right edge → nothing
  assert.deepEqual(serbestBaslikKutulari([L(0.12, 0.08, 0.2, 0.11), L(0.8, 0.09, 0.93, 0.12), L(0.2, 0.15, 0.85, 0.18)]), [])
  // a centred name with clear space below it → its box
  const k = serbestBaslikKutulari([L(0.1, 0.09, 0.25, 0.12), L(0.45, 0.08, 0.62, 0.11), L(0.2, 0.16, 0.85, 0.19)])
  assert.equal(k.length, 1)
  assert.ok(maskeliMi({ x0: 0.45, y0: 0.08, x1: 0.62, y1: 0.11 }, k, 0.99))
})

// ─── identity running past its box ─────────────────────────────────────────────────────────────────────
test('identity overflow: a line whose ink starts inside (or touches) the identity box is blacked out; the next row is not', () => {
  const kimlik = [{ x0: 0, y0: 0.15, x1: 1, y1: 0.3 }]
  const tasan = L(0.3, 0.29, 0.7, 0.33) // padded box; its ink starts inside the box and runs below it
  const deger = L(0.3, 0.296, 0.7, 0.336) // ink touching the box edge
  const sikayet = L(0.3, 0.33, 0.7, 0.37) // the complaint, clearly below
  const cizim = L(0.2, 0.28, 0.5, 0.45) // a printed drawing next to the block (too tall to be a handwriting line)
  const out = tasmaKutulari([tasan, deger, sikayet, cizim], kimlik)
  assert.ok(maskeliMi(tasan.kutu, out, 0.95))
  assert.ok(maskeliMi(deger.kutu, out, 0.95))
  assert.ok(!maskeliMi(sikayet.kutu, out, 0.5), 'the complaint line stays visible')
  assert.ok(!maskeliMi(cizim.kutu, out, 0.5), 'a drawing is never taken for an entry')
})

// ─── the template registry, placed by printed labels ─────────────────────────────────────────────────────
/** OCR of a photo of the registry form placed by x' = s·x + dx, y' = s·y + dy (pixels of a w × h page). */
function formOcr(w: number, h: number, s: number, dx: number, dy: number, atla: string[] = [], yanlis?: { anahtar: string; x: number; y: number }): OcrSatir[] {
  const yaz: Record<string, string> = { tarih: 'Tarih', tc: 'T.C.', kimlik: 'KİMLİK', adisoyadi: 'ADI-SOYADI', dogum: 'DOĞUM', meslegi: 'MESLEĞİ', gsm: 'GSM', tavsiye: 'TAVSİYE', eden: 'EDEN', guvencesi: 'GÜVENCESİ', adresi: 'ADRESİ', sikayeti: 'ŞİKAYETİ', sag: 'Sağ', sol: 'Sol' }
  return KBB_ANATOMI_FORMU.capalar!.filter((c) => !atla.includes(c.anahtar)).map((c) => {
    const p = yanlis && yanlis.anahtar === c.anahtar ? yanlis : c
    const x = (s * p.x + dx) * w, y = (s * p.y + dy) * h
    return { kelimeler: [{ text: yaz[c.anahtar], x0: x - 20, y0: y - 8, x1: x + 20, y1: y + 8, conf: 92 }] }
  })
}

test('registry form: placed by its printed labels (no fingerprint) — header band and every drawing region moved onto the photo', () => {
  const t = sablonKaydi(KBB_ANATOMI_FORMU, formOcr(1000, 1400, 0.9, 0.05, 0.04), 1000, 1400)
  assert.ok(t, 'registered')
  assert.ok(t!.capa >= 12 && t!.hata < 0.01)
  const p = uygula(t!.donusum, 0.5, 0.5)
  assert.ok(Math.abs(p.x - 0.5) < 0.01 && Math.abs(p.y - 0.49) < 0.01)
  const yer = sablonuYerlestir(KBB_ANATOMI_FORMU, t!.donusum, t!.cizimDonusumu)
  const kz = yer.cizimBolgeleri.find((b) => b.id === 'kz-sag')!
  assert.equal(kz.taraf, 'sag', 'the side stays the template region\'s')
  assert.ok(Math.abs(kz.kutu.x0 - (0.9 * 0.29 + 0.05)) < 0.01 && kz.notKutusu, 'drawing + its note area mapped')
  assert.equal(capaAnahtari('ADI-SOYADI'), 'adisoyadi')
  assert.equal(capaAnahtari('ŞİKAYETİ'), 'sikayeti')
})

test('registry form: another clinic\'s sheet (too few labels), a mirrored photo and a misread label are handled', () => {
  assert.equal(sablonKaydi(KBB_ANATOMI_FORMU, formOcr(1000, 1400, 1, 0, 0, ['tarih', 'tc', 'kimlik', 'adisoyadi', 'dogum', 'meslegi', 'gsm', 'tavsiye', 'eden', 'sag', 'sol']), 1000, 1400), null, '3 labels → not this form')
  const ayna = formOcr(1000, 1400, 1, 0, 0).map((l) => ({ kelimeler: l.kelimeler.map((k) => ({ ...k, x0: 1000 - k.x1, x1: 1000 - k.x0 })) }))
  assert.equal(sablonKaydi(KBB_ANATOMI_FORMU, ayna, 1000, 1400), null, 'mirrored → refused')
  const t = sablonKaydi(KBB_ANATOMI_FORMU, formOcr(1000, 1400, 1, 0, 0, [], { anahtar: 'gsm', x: 0.2, y: 0.9 }), 1000, 1400)
  assert.ok(t && t.hata < 0.01, 'the misplaced word is dropped as an outlier')
  // the drawing block of another print sits 3 % lower than its header: the drawings follow their own "Sağ" / "Sol"
  const ocr = formOcr(1000, 1400, 1, 0, 0).map((l) => (['Sağ', 'Sol'].includes(l.kelimeler[0].text) ? { kelimeler: l.kelimeler.map((k) => ({ ...k, y0: k.y0 + 42, y1: k.y1 + 42 })) } : l))
  const k = sablonKaydi(KBB_ANATOMI_FORMU, ocr, 1000, 1400)!
  assert.ok(k.cizimCapa >= 2)
  assert.ok(Math.abs(kutuyuTasi(k.cizimDonusumu, { x0: 0.5, y0: 0.5, x1: 0.6, y1: 0.6 }).y0 - 0.53) < 0.005)
  assert.equal(kayitliSablonlarTr('kulak-burun-bogaz')[0].id, KBB_ANATOMI_FORMU.id)
  assert.deepEqual(kayitliSablonlarTr('kardiyoloji'), [], 'a branş without registry forms gets none')
})

test('registry form end to end: the header band is blacked out on a photo the fingerprint cannot match; drawings carry their side', async () => {
  const w = 1000, h = 1400
  const foto = sayfa(w, h, (boya) => {
    // identity written in red over the header rows of the placed form (0.9 scale, shifted), handwriting near the eardrums
    yazi(boya, 0.2, 0.7, 0.9 * 0.18 + 0.04, KIRMIZI)
    yazi(boya, 0.2, 0.6, 0.9 * 0.26 + 0.04, KIRMIZI)
    yazi(boya, 0.9 * 0.3 + 0.05, 0.9 * 0.42 + 0.05, 0.9 * 0.5 + 0.04) // "N -4" under the right eardrum
    for (let i = 0; i < 3; i++) yazi(boya, 0.1, 0.9, 0.9 + i * 0.025)
  })
  const s = await sayfaPaketiHazirla({ foto, sayfa: 1, sablonlar: kayitliSablonlarTr('kulak-burun-bogaz'), serbestBeyan: false, tuval: hamTuval, ocr: async () => formOcr(w, h, 0.9, 0.05, 0.04), kenarOcrAtla: true })
  assert.equal(s.durum, 'hazir')
  if (s.durum !== 'hazir') return
  assert.equal(s.sablonYontemi, 'capa')
  assert.equal(s.paket.sablonId, KBB_ANATOMI_FORMU.id)
  assert.ok(!renkVar(s.maskeliSayfa.base64, 'kirmizi'), 'identity rows blacked out by the placed header band')
  for (const t of s.paket.parcalar || []) assert.ok(!renkVar(t.gorsel.base64, 'kirmizi'))
  for (const b of s.paket.bolgeler) if (b.gorsel) assert.ok(!renkVar(b.gorsel.base64, 'kirmizi'), `region crop ${b.id}`)
  assert.deepEqual(s.paket.bolgeler.filter((b) => b.anatomi === 'kulak_zari').map((b) => b.taraf).sort(), ['sag', 'sol'])
  const not = s.paket.satirlar.find((l) => l.bolgeId === 'kz-sag')
  assert.ok(not, 'the note written under the right eardrum belongs to the right eardrum')
})

test('note areas: a line inside a drawing\'s note area belongs to that drawing (before any proximity guess)', () => {
  const bolgeler = [{ id: 'kz-sag', kutu: { x0: 0.29, y0: 0.35, x1: 0.47, y1: 0.5 }, notKutusu: { x0: 0.26, y0: 0.47, x1: 0.5, y1: 0.56 } }, { id: 'kz-sol', kutu: { x0: 0.52, y0: 0.35, x1: 0.69, y1: 0.5 }, notKutusu: { x0: 0.5, y0: 0.47, x1: 0.76, y1: 0.56 } }]
  assert.equal(bolgeyeBagla({ x0: 0.46, y0: 0.5, x1: 0.55, y1: 0.53 }, bolgeler, []), 'kz-sol', 'centre in the left note area')
  assert.equal(bolgeyeBagla({ x0: 0.3, y0: 0.5, x1: 0.45, y1: 0.53 }, bolgeler, []), 'kz-sag')
})

test('drawing read: a sided region is read for its own half only (the side is never the model\'s)', async () => {
  const cagri: string[] = []
  const model: ModelKapisi = {
    async gorselJson(o) { cagri.push(o.parcalar.map((p) => (p.tur === 'metin' ? p.metin : '[img]')).join(' ')); return o.etiket === 'el-notu-cizim' ? { bulgular: [{ bolgeId: 'burun-sag', bulgu: 'deviasyon', isaret: 'yazi', g: 0.9 }] } : { satirlar: [] } },
    async metinJson() { return { satirlar: [] } },
  }
  const g = { mime: 'image/jpeg', base64: 'A'.repeat(40) }
  const p: SayfaPaketi = { sayfa: 1, sablonId: KBB_ANATOMI_FORMU.id, kalite: kaliteKarari({ bulaniklik: 500, parlama: 0, parlaklik: 160, kisaKenar: 1100, sayfaOrani: 0.9 }), satirlar: [], parcalar: [], bolgeler: KBB_ANATOMI_FORMU.cizimBolgeleri.filter((b) => b.anatomi === 'burun').map((b) => ({ ...b, murekkep: 0.01, gorsel: g })) }
  const t = tohumlarTr('kulak-burun-bogaz')
  const s = await sayfayiOku(p, { bransAdi: 'KBB', dil: EL_NOTU_TR.dil, sozluk: sozlukKur([], t.brans, t.genel), hafiza: [], dagarcik: new Map(), sorulmusKisaltmalar: new Set(), sozcukMu: () => false, sayfaGorseli: g, anahat: anahatOgren([], anahatTr('kulak-burun-bogaz')) }, model)
  const cizim = cagri.find((c) => c.includes('Region burun-sag'))!
  assert.match(cizim, /burun-sag \(Burun, RIGHT side only/)
  assert.match(cizim, /burun-sol \(Burun, LEFT side only/)
  assert.equal(s.cizimler[0].taraf, 'sag')
  assert.equal(s.cizimler[0].kabul, false, 'words only the single drawing read saw are not confirmed')
  // the same words also seen by a page read → confirmed
  const model2: ModelKapisi = { ...model, async gorselJson(o) { return o.etiket === 'el-notu-cizim' ? { bulgular: [{ bolgeId: 'burun-sag', bulgu: 'deviasyon', isaret: 'yazi', g: 0.9 }] } : { satirlar: [{ y0: 500, y1: 520, kelimeler: [{ m: 'deviasyon', g: 0.6 }] }] } } }
  const s2 = await sayfayiOku(p, { bransAdi: 'KBB', dil: EL_NOTU_TR.dil, sozluk: sozlukKur([], t.brans, t.genel), hafiza: [], dagarcik: new Map(), sorulmusKisaltmalar: new Set(), sozcukMu: () => false, sayfaGorseli: g, anahat: anahatOgren([], anahatTr('kulak-burun-bogaz')) }, model2)
  assert.equal(s2.cizimler[0].kabul, true)
})

test('capture gate: a WhatsApp standard-quality page (~700 px wide after de-warping) is accepted; a thumbnail is not', () => {
  assert.equal(kaliteKarari({ bulaniklik: 300, parlama: 0, parlaklik: 170, kisaKenar: 690, sayfaOrani: 0.8 }).tamam, true)
  assert.deepEqual(kaliteKarari({ bulaniklik: 300, parlama: 0, parlaklik: 170, kisaKenar: 480, sayfaOrani: 0.8 }).nedenler, ['kucuk'])
})

test('his own words: the frequent words of his approved notes, as he spells them, join the reads\' vocabulary after the lexicon', async () => {
  const { sikSozcukler } = await import('./hafiza')
  const { okumaSozcukleri } = await import('./okuyucu')
  const notlar = ['Flixonase 1x2, Avamys 1x1. Geniz akıntısı var.', 'Avamys 1x1 7 gün. Flixonase başlandı.', 'geniz akıntısı az, Nasidol 3x1', 'Sinüs Rinse 2x1/2']
  const w = sikSozcukler(notlar)
  assert.ok(w.includes('Avamys') && w.includes('Flixonase') && w.includes('geniz') && w.includes('akıntısı'))
  assert.ok(!w.includes('Nasidol'), 'seen once is not yet his word')
  assert.ok(!w.some((x) => /^\d/.test(x)), 'no doses / numbers')
  const t = tohumlarTr('kulak-burun-bogaz')
  const liste = okumaSozcukleri(sozlukKur([], t.brans, t.genel), 260, w)
  assert.ok(liste.includes('Avamys'))
  assert.ok(liste.indexOf('Avamys') > liste.findIndex((x) => x.startsWith('SD (')), 'after the lexicon')
  assert.deepEqual(okumaSozcukleri(sozlukKur([], t.brans, t.genel)), okumaSozcukleri(sozlukKur([], t.brans, t.genel), 260, []), 'nothing changes for a doctor with no approved notes')
})
