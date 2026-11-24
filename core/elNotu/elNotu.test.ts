/**
 * ESNEK-MUAYENE-A — El Notu Okuyucu: privacy guards, protected items, never-invent, self-consistency, lexicon, compiler,
 * time meter, layout and preprocessing. Synthetic data only (no real page, no real identity).
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { gizlilikKarari, maskeliMi, SABLON_ESIK } from './gizlilik'
import { sayfaPaketiHazirla, baglamiSoldur, basiliSatirMi, type TuvalAdaptoru } from './sayfaPaketi'
import { korumaliSiniflar, kabulEdilirMi, satirKorumali, KORUMALI_ESIK } from './korumali'
import { uzlastir, benzerlik, yakinMi } from './uzlastir'
import { sozlukKur, coz, yasCinsiyet, genislet, bilinmeyenKisaltmaMi } from './sozluk'
import { GENEL_TR_TOHUM } from './tohum/genelTr'
import { KBB_TR_TOHUM } from './tohum/kbbTr'
import { tohumlarTr } from './tohum'
import { uydurmaDenetimi, okumaSozcukleri, sayfayiOku, kaynakMetni, yerTutuculariDoldur, acikYerTutucular, deterministikNormal, metinSatirKonumlari, type ModelKapisi, type SayfaPaketi } from './okuyucu'
import { izleriAyikla, celiskileriAyikla, bolumleriBirlestir, kaynakBlogu, dosyaOnerileriniAyikla, ETKILEDIGI_ALANLAR, ozet } from './derleyici'
import { gunlukOzet, gunlukSatir, AktifSure } from './zaman'
import { parmakIzi, eslesmeSkoru, sablonBul, sablonTaslagi, PARMAK_IZI_SATIR, PARMAK_IZI_SUTUN } from './sablon'
import { homografi, noktaDonustur, kaliteKarari, egimBul, bulaniklikOlc, sayfaBul } from './onisleme'
import { tanimlayici, sekilBenzerligi, yenidenSirala, benzerOrnekler } from './hafiza'
import { bulgulariDogrula, isaretliMi } from './cizim'
import { satirlariCikar, bolgeyeBagla } from './satir'
import { EL_NOTU_TR } from './metinTr'
import type { OcrSatir } from '@/core/belgeler/kimlikMaske'
import type { Gri, Maske, Rgba, Sablon } from './tipler'

const kelime = (text: string, x0: number, y0: number, x1: number, y1: number, conf = 90) => ({ text, x0, y0, x1, y1, conf })
const satir = (...k: ReturnType<typeof kelime>[]): OcrSatir => ({ kelimeler: k })
const SOZLUK = sozlukKur([], KBB_TR_TOHUM, GENEL_TR_TOHUM)

// ─── privacy gate ────────────────────────────────────────────────────────────────────────────────────────
test('privacy: printed identity labels → every label row to the page edge + the whole block, never the complaint line', () => {
  const ocr: OcrSatir[] = [
    satir(kelime('T.C.', 50, 200, 80, 220), kelime('KİMLİK', 85, 200, 150, 220), kelime('NO', 155, 200, 180, 220)),
    satir(kelime('ADI-SOYADI', 50, 240, 160, 260)),
    satir(kelime('GSM', 600, 280, 640, 300)),
    satir(kelime('EV', 50, 320, 70, 340), kelime('ADRESİ', 75, 320, 150, 340)),
    satir(kelime('ŞİKAYETİ', 50, 420, 150, 440)),
  ]
  const k = gizlilikKarari({ w: 1000, h: 1400, ocr, sablon: null, sablonEslesmesi: 0, serbestBeyan: false })
  assert.equal(k.durum, 'maskelendi')
  assert.equal(k.neden, 'etiket')
  // the handwritten value right of a label (unreadable to OCR) is covered
  assert.ok(maskeliMi({ x0: 0.3, y0: 0.145, x1: 0.6, y1: 0.155 }, k.kutular, 0.95), 'T.C. value')
  assert.ok(maskeliMi({ x0: 0.7, y0: 0.2, x1: 0.95, y1: 0.212 }, k.kutular, 0.95), 'GSM value')
  // an address second line under its label is inside the block
  assert.ok(maskeliMi({ x0: 0.1, y0: 0.27, x1: 0.8, y1: 0.285 }, k.kutular, 0.95), 'address line 2')
  // the complaint line stays readable
  assert.ok(!maskeliMi({ x0: 0.2, y0: 0.302, x1: 0.8, y1: 0.312 }, k.kutular, 0.2), 'complaint must stay visible')
})

test('privacy: a matched template blacks out its header band by position even with no OCR label', () => {
  const sablon: Sablon = { id: 's', ad: 'KBB', tur: 'formlu', brans: 'kulak-burun-bogaz', enBoy: 0.707, baslikBolgeleri: [{ x0: 0, y0: 0.1, x1: 1, y1: 0.3 }], cizimBolgeleri: [], parmakIzi: [] }
  const k = gizlilikKarari({ w: 1000, h: 1400, ocr: [], sablon, sablonEslesmesi: SABLON_ESIK + 0.1, serbestBeyan: false })
  assert.equal(k.durum, 'maskelendi')
  assert.ok(maskeliMi({ x0: 0.05, y0: 0.12, x1: 0.95, y1: 0.28 }, k.kutular, 0.99))
  const zayif = gizlilikKarari({ w: 1000, h: 1400, ocr: [], sablon, sablonEslesmesi: SABLON_ESIK - 0.2, serbestBeyan: false })
  assert.equal(zayif.durum, 'baslik_gerekli', 'a weak match is not trusted')
})

test('privacy: OCR failure without template / marked region → not sent; plain sheet only on the standing declaration', () => {
  assert.equal(gizlilikKarari({ w: 100, h: 100, ocr: null, sablon: null, sablonEslesmesi: 0, serbestBeyan: true }).durum, 'ocr_basarisiz')
  assert.equal(gizlilikKarari({ w: 100, h: 100, ocr: [], sablon: null, sablonEslesmesi: 0, serbestBeyan: false }).durum, 'baslik_gerekli')
  assert.equal(gizlilikKarari({ w: 100, h: 100, ocr: [], sablon: null, sablonEslesmesi: 0, serbestBeyan: true }).durum, 'maskelendi')
  // a printout (much printed text) is not "a plain sheet" even with the declaration
  const basili = Array.from({ length: 30 }, (_, i) => satir(kelime(`Sonuç${i}`, 10, i * 20, 90, i * 20 + 15, 92)))
  assert.equal(gizlilikKarari({ w: 1000, h: 1000, ocr: basili, sablon: null, sablonEslesmesi: 0, serbestBeyan: true }).durum, 'baslik_gerekli')
})

test('privacy: digit runs, e-mail and phone are masked anywhere; a foreign sheet at the margin is masked to the edge', () => {
  const ocr = [satir(kelime('Tel', 100, 900, 130, 920, 30), kelime('0532', 140, 900, 200, 920), kelime('123', 205, 900, 240, 920), kelime('45', 245, 900, 270, 920), kelime('67', 275, 900, 300, 920)), satir(kelime('x@y.com', 400, 950, 520, 970))]
  const k = gizlilikKarari({ w: 1000, h: 1000, ocr, kenarOcr: [{ kenar: 'sag', satirlar: [satir(kelime('Adı', 900, 50, 940, 70), kelime('Soyadı', 900, 80, 960, 100))] }], sablon: null, sablonEslesmesi: 0, serbestBeyan: true })
  assert.ok(maskeliMi({ x0: 0.14, y0: 0.9, x1: 0.2, y1: 0.92 }, k.kutular, 0.9), 'phone digits')
  assert.ok(maskeliMi({ x0: 0.4, y0: 0.95, x1: 0.52, y1: 0.97 }, k.kutular, 0.9), 'e-mail')
  assert.ok(maskeliMi({ x0: 0.9, y0: 0.05, x1: 1, y1: 0.1 }, k.kutular, 0.9), 'foreign label cluster to the right edge')
})

/** A synthetic page: white paper, a RED identity header (the "handwritten name"), blue handwriting lines below. */
function sentetikSayfa(): Rgba {
  const w = 1100, h = 1500, d = new Uint8ClampedArray(w * h * 4).fill(255)
  const boya = (x0: number, y0: number, x1: number, y1: number, r: number, g: number, b: number) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * w + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b } }
  boya(120, 210, 900, 240, 230, 10, 10) // identity value written in red, row 1
  boya(120, 260, 700, 290, 230, 10, 10) // row 2
  for (let i = 0; i < 6; i++) for (let x = 150; x < 950; x += 24) boya(x, 600 + i * 80, x + 16, 630 + i * 80, 30, 40, 160) // "handwriting" strokes
  return { w, h, d }
}

/** JPEG stand-in: the raw raster as base64 JSON (lets the test inspect every pixel that would leave the device). */
const hamTuval: TuvalAdaptoru = { async jpeg(r) { return Buffer.from(JSON.stringify({ w: r.w, h: r.h, d: Array.from(r.d) })).toString('base64') } }
const kirmiziVarMi = (b64: string) => { const r = JSON.parse(Buffer.from(b64, 'base64').toString()) as { d: number[] }; for (let i = 0; i < r.d.length; i += 4) if (r.d[i] > 180 && r.d[i + 1] < 60 && r.d[i + 2] < 60) return true; return false }

test('privacy guard: no pixel of the identity region ever leaves — masked page, every line crop A/B, every region crop', async () => {
  // OCR "finds" the printed labels next to the red values
  const ocr = async (): Promise<OcrSatir[]> => [satir(kelime('ADI-SOYADI', 20, 212, 110, 238)), satir(kelime('GSM', 20, 262, 60, 288)), satir(kelime('ŞİKAYETİ', 20, 330, 110, 350))]
  const sablon: Sablon = { id: 't', ad: 'f', tur: 'formlu', brans: null, enBoy: 1100 / 1500, baslikBolgeleri: [], cizimBolgeleri: [{ id: 'b1', anatomi: 'boyun', etiket: 'Boyun', taraf: 'sag', kutu: { x0: 0.6, y0: 0.1, x1: 0.95, y1: 0.25 } }], parmakIzi: null }
  const s = await sayfaPaketiHazirla({ foto: sentetikSayfa(), sayfa: 1, sablonlar: [sablon], serbestBeyan: false, tuval: hamTuval, ocr, kenarOcrAtla: true })
  assert.equal(s.durum, 'hazir')
  if (s.durum !== 'hazir') return
  assert.ok(!kirmiziVarMi(s.maskeliSayfa.base64), 'masked page shows identity pixels')
  for (const l of s.paket.satirlar) {
    assert.ok(!kirmiziVarMi(l.gorselA.base64), `line ${l.no} crop A`)
    assert.ok(!kirmiziVarMi(l.gorselB.base64), `line ${l.no} crop B`)
  }
  for (const b of s.paket.bolgeler) if (b.gorsel) assert.ok(!kirmiziVarMi(b.gorsel.base64), `region ${b.id}`)
  assert.ok(s.paket.satirlar.length >= 4, 'handwriting lines were found')
})

test('privacy guard: OCR failure → nothing is packaged (gizlenemedi); unknown form → only a masked preview for marking', async () => {
  const yok = await sayfaPaketiHazirla({ foto: sentetikSayfa(), sayfa: 1, sablonlar: [], serbestBeyan: true, tuval: hamTuval, ocr: async () => null, kenarOcrAtla: true })
  assert.equal(yok.durum, 'gizlenemedi')
  const bilinmeyen = await sayfaPaketiHazirla({ foto: sentetikSayfa(), sayfa: 1, sablonlar: [], serbestBeyan: false, tuval: hamTuval, ocr: async () => [], kenarOcrAtla: true })
  assert.equal(bilinmeyen.durum, 'baslik_gerekli')
  // the user marks the header → the region is masked before anything is cut
  const isaretli = await sayfaPaketiHazirla({ foto: sentetikSayfa(), sayfa: 1, sablonlar: [], serbestBeyan: false, kullaniciBolgeleri: [{ x0: 0.05, y0: 0.12, x1: 0.95, y1: 0.21 }], tuval: hamTuval, ocr: async () => [], kenarOcrAtla: true })
  assert.equal(isaretli.durum, 'hazir')
  if (isaretli.durum === 'hazir') {
    assert.ok(!kirmiziVarMi(isaretli.maskeliSayfa.base64))
    for (const l of isaretli.paket.satirlar) assert.ok(!kirmiziVarMi(l.gorselA.base64) && !kirmiziVarMi(l.gorselB.base64))
  }
})

// ─── protected items ────────────────────────────────────────────────────────────────────────────────────
test('protected classes: side, negation, numbers, doses, drugs, allergy (all build languages)', () => {
  assert.deepEqual(korumaliSiniflar('sağ'), ['taraf'])
  assert.deepEqual(korumaliSiniflar('Left'), ['taraf'])
  assert.deepEqual(korumaliSiniflar("o'ng"), ['taraf'])
  assert.ok(korumaliSiniflar('Ø').includes('olumsuzluk'))
  assert.ok(korumaliSiniflar('yok').includes('olumsuzluk'))
  assert.ok(korumaliSiniflar('NAD').includes('olumsuzluk'))
  assert.ok(korumaliSiniflar('500mg').includes('doz'))
  assert.ok(korumaliSiniflar('1x2').includes('doz'))
  assert.ok(korumaliSiniflar('8,8').includes('sayi'))
  const ilac = (t: string) => (t.toLowerCase() === 'eritromisin' ? { durum: 'tam' as const, ad: 'Eritromisin' } : null)
  assert.ok(korumaliSiniflar('Eritromisin', { ilac }).includes('ilac'))
  const s = satirKorumali(['ilaç', 'alerjisi', 'penisilin'])
  assert.ok(s[2].includes('alerji'), 'a word after the allergy keyword is protected')
})

test('protected items are never auto-accepted below high confidence, nor when the two reads disagree', () => {
  assert.equal(kabulEdilirMi({ guven: 0.99, uyum: true, korumali: [] }), true)
  assert.equal(kabulEdilirMi({ guven: KORUMALI_ESIK - 0.01, uyum: true, korumali: ['taraf'] }), false)
  assert.equal(kabulEdilirMi({ guven: 0.99, uyum: false, korumali: ['doz'] }), false)
  assert.equal(kabulEdilirMi({ guven: 0.99, uyum: true, korumali: ['ilac'], bilinenIlac: false }), false, 'an unknown drug name needs confirmation')
  assert.equal(kabulEdilirMi({ guven: 0.99, uyum: true, korumali: ['ilac'], bilinenIlac: true }), true)
})

// ─── self-consistency, lexicon, never invent ────────────────────────────────────────────────────────────
test('self-consistency: agreement raises confidence; disagreement keeps both readings and is never auto-resolved', () => {
  const r = uzlastir({ no: 1, kelimeler: [{ m: 'Septum', g: 0.8 }, { m: 'sağa', g: 0.7 }] }, { no: 1, kelimeler: [{ m: 'septum', g: 0.8 }, { m: 'sola', g: 0.75 }] })
  assert.equal(r[0].uyum, true)
  assert.ok(r[0].guven > 0.9)
  assert.equal(r[1].uyum, false)
  assert.deepEqual(new Set(r[1].adaylar), new Set(['sağa', 'sola']))
  assert.ok(benzerlik('tükürük', 'tukuruk') > 0.8)
})

test('lexicon: the doctor wins, the branş seed beats the general seed, ambiguous keys are not guessed, age/sex shorthand', () => {
  const s = sozlukKur([{ kisaltma: 'SD', anlam: 'sağ dudak', kaynak: 'hekim' }], KBB_TR_TOHUM, GENEL_TR_TOHUM)
  assert.deepEqual(coz(s, 'SD'), { anlam: 'sağ dudak', kaynak: 'hekim' })
  assert.deepEqual(coz(SOZLUK, 'SD'), { anlam: 'septum deviasyonu', kaynak: 'brans' })
  assert.deepEqual(coz(SOZLUK, 'Ø'), { anlam: 'yok', kaynak: 'genel' })
  assert.deepEqual(yasCinsiyet(SOZLUK, '37K'), { yas: 37, cinsiyet: 'kadın' })
  assert.deepEqual(yasCinsiyet(SOZLUK, '40E.'), { yas: 40, cinsiyet: 'erkek' })
  const amb = sozlukKur([], [], [{ kisaltma: 'X1', anlam: 'a', kaynak: 'genel' }, { kisaltma: 'X1', anlam: 'b', kaynak: 'genel' }])
  assert.ok(coz(amb, 'X1') && 'belirsiz' in (coz(amb, 'X1') as object))
  assert.equal(genislet(SOZLUK, 'Sigara Ø').metin, 'Sigara yok')
  assert.equal(bilinmeyenKisaltmaMi(SOZLUK, 'QRZ', () => false), true)
  assert.equal(bilinmeyenKisaltmaMi(SOZLUK, 'SD', () => false), false)
  assert.equal(tohumlarTr('kulak-burun-bogaz').brans.length > 20, true)
  assert.equal(tohumlarTr('kardiyoloji').brans.length, 0, 'a branş without its own seed still gets the general seed')
})

test('never invent: the normalisation guard refuses added words, numbers, or a dropped unconfirmed placeholder', () => {
  const bag = new Set(EL_NOTU_TR.dil.bagSozcukleri)
  const girdi = 'Sigara Ø ⟦s1-l2-w3|5mg?⟧ SD'
  assert.equal(uydurmaDenetimi(girdi, 'Sigara yok ⟦s1-l2-w3|5mg?⟧ septum deviasyonu', SOZLUK, bag), 'Sigara yok ⟦s1-l2-w3|5mg?⟧ septum deviasyonu')
  assert.equal(uydurmaDenetimi(girdi, 'Sigara yok ⟦s1-l2-w3|5mg?⟧ septum deviasyonu, tonsillektomi planlandı', SOZLUK, bag), null, 'added clinical fact')
  assert.equal(uydurmaDenetimi('Ateş 38', 'Ateş 39', SOZLUK, bag), null, 'changed number')
  assert.equal(uydurmaDenetimi(girdi, 'Sigara yok 5 mg septum deviasyonu', SOZLUK, bag), null, 'placeholder resolved by the model')
  assert.equal(deterministikNormal(girdi, SOZLUK), 'Sigara yok ⟦s1-l2-w3|5mg?⟧ septum deviasyonu')
})

function sahteModel(o: { okuA: unknown; okuB: unknown; cizim?: unknown; normal?: unknown }): ModelKapisi & { cagri: string[] } {
  const cagri: string[] = []
  return {
    cagri,
    async gorselJson({ etiket }) { cagri.push(etiket); return etiket === 'el-notu-okuma-A' ? o.okuA : etiket === 'el-notu-okuma-B' ? o.okuB : o.cizim ?? { bulgular: [] } },
    async metinJson({ etiket }) { cagri.push(etiket); return o.normal ?? { satirlar: [] } },
  }
}
const GORSEL = { mime: 'image/jpeg', base64: 'TUFTS0VE' }
const paket = (bolgeler: SayfaPaketi['bolgeler'] = []): SayfaPaketi => ({
  sayfa: 1, sablonId: 's', kalite: kaliteKarari({ bulaniklik: 500, parlama: 0, parlaklik: 160, kisaKenar: 1100, sayfaOrani: 0.9 }),
  satirlar: [
    { no: 1, kutu: { x0: 0.1, y0: 0.4, x1: 0.9, y1: 0.43 }, kelimeler: [], tanimlar: [], gorselA: GORSEL, gorselB: GORSEL, bolgeId: null },
    { no: 2, kutu: { x0: 0.1, y0: 0.45, x1: 0.9, y1: 0.48 }, kelimeler: [], tanimlar: [], gorselA: GORSEL, gorselB: GORSEL, bolgeId: 'b1' },
  ],
  bolgeler,
})
const baglam = () => ({ bransAdi: 'KBB', dil: EL_NOTU_TR.dil, sozluk: SOZLUK, hafiza: [], dagarcik: new Map<string, number>(), sorulmusKisaltmalar: new Set<string>(), sozcukMu: () => false })

test('reader: two independent reads; disagreement / low-confidence protected words → Doğrula with crop; invented normalisation falls back', async () => {
  const m = sahteModel({
    okuA: { satirlar: [{ no: 1, kelimeler: [{ m: 'Sigara', g: 0.95 }, { m: 'Ø', g: 0.95 }] }, { no: 2, kelimeler: [{ m: 'SD', g: 0.95 }, { m: 'sağa', g: 0.9 }] }] },
    okuB: { satirlar: [{ no: 1, kelimeler: [{ m: 'Sigara', g: 0.95 }, { m: 'Ø', g: 0.97 }] }, { no: 2, kelimeler: [{ m: 'SD', g: 0.95 }, { m: 'sola', g: 0.9 }] }] },
    normal: { satirlar: [{ no: 1, normal: 'Sigara yok, alkol yok' }, { no: 2, normal: 'septum deviasyonu ⟦s1-l2-w1|sağa?⟧' }] },
  })
  const s = await sayfayiOku(paket(), baglam(), m)
  assert.deepEqual(m.cagri.filter((c) => c.startsWith('el-notu-okuma')).sort(), ['el-notu-okuma-A', 'el-notu-okuma-B'])
  const taraf = s.dogrula.find((d) => d.anahtar === 's1-l2-w1')
  assert.ok(taraf, 'the side the reads disagree on is asked')
  assert.equal(taraf!.sinif, 'korumali')
  assert.equal(taraf!.korumaliTur, 'taraf')
  assert.ok(taraf!.kutu, 'question carries its crop box')
  // "alkol yok" is not on the page → the line falls back to the deterministic expansion
  assert.equal(s.satirlar[0].normal, 'Sigara yok')
  assert.equal(s.satirlar[1].normal, 'septum deviasyonu ⟦s1-l2-w1|sağa?⟧')
})

test('reader: a drawing finding for an UNMARKED region is dropped; the side always comes from the template region', async () => {
  const bolgeler: SayfaPaketi['bolgeler'] = [
    { id: 'b1', anatomi: 'kulak_zari', etiket: 'Kulak zarı', taraf: 'sag', kutu: { x0: 0.3, y0: 0.35, x1: 0.45, y1: 0.48 }, murekkep: 0.002, gorsel: GORSEL },
    { id: 'b2', anatomi: 'kulak_zari', etiket: 'Kulak zarı', taraf: 'sol', kutu: { x0: 0.55, y0: 0.35, x1: 0.7, y1: 0.48 }, murekkep: 0, gorsel: GORSEL },
  ]
  const m = sahteModel({
    okuA: { satirlar: [] }, okuB: { satirlar: [] },
    cizim: { bulgular: [{ bolgeId: 'b1', bulgu: 'normal (N)', isaret: 'normal_isareti', g: 0.95 }, { bolgeId: 'b2', bulgu: 'perforasyon', isaret: 'daire', g: 0.99 }] },
  })
  const p = paket(bolgeler)
  p.satirlar = []
  const s = await sayfayiOku(p, baglam(), m)
  assert.equal(s.cizimler.length, 1)
  assert.equal(s.cizimler[0].bolgeId, 'b1')
  assert.equal(s.cizimler[0].taraf, 'sag')
  const metin = kaynakMetni([s], EL_NOTU_TR.dil, () => 'Kulak zarı')
  assert.ok(metin.includes('Sağ Kulak zarı: normal (N)'))
  assert.ok(!metin.includes('perforasyon'), 'an unmarked region never gets a finding')
  assert.equal(isaretliMi({ murekkep: 0, bagliSatirlar: [] }), false)
  assert.equal(bulgulariDogrula({ bulgular: [{ bolgeId: 'zz', bulgu: 'x', g: 1 }] }, []).length, 0)
  assert.equal(metinSatirKonumlari([s]).length, metin.split('\n').length)
})

test('reader: an unknown abbreviation is asked once; never again once asked', async () => {
  const okuma = { satirlar: [{ no: 1, kelimeler: [{ m: 'QZK', g: 0.98 }, { m: 'normal', g: 0.98 }] }] }
  const p = paket(); p.satirlar = [p.satirlar[0]]
  const s1 = await sayfayiOku(p, baglam(), sahteModel({ okuA: okuma, okuB: okuma }))
  assert.ok(s1.dogrula.some((d) => d.sinif === 'kisaltma' && d.okunan === 'QZK'))
  const b = baglam(); b.sorulmusKisaltmalar = new Set(['kis-qzk'])
  const s2 = await sayfayiOku(p, b, sahteModel({ okuA: okuma, okuB: okuma }))
  assert.ok(!s2.dogrula.some((d) => d.sinif === 'kisaltma'))
})

test('privacy: another print of a templated form — the band is cut at "ŞİKAYETİ" when label rows sit above it; the rest stays masked', () => {
  const sablon: Sablon = { id: 's', ad: 'KBB', tur: 'formlu', brans: 'kulak-burun-bogaz', enBoy: 0.707, baslikBolgeleri: [{ x0: 0, y0: 0.08, x1: 1, y1: 0.31 }], cizimBolgeleri: [], parmakIzi: [] }
  const ocr: OcrSatir[] = [
    satir(kelime('T.C.', 50, 150, 80, 170), kelime('NO', 85, 150, 110, 170)),
    satir(kelime('GSM', 50, 210, 90, 230)),
    satir(kelime('E-Posta', 50, 260, 130, 280)),
    satir(kelime('ŞİKAYETİ', 50, 395, 150, 412)),
  ]
  const k = gizlilikKarari({ w: 1000, h: 1400, ocr, sablon, sablonEslesmesi: SABLON_ESIK + 0.1, serbestBeyan: false })
  assert.equal(k.durum, 'maskelendi')
  assert.ok(maskeliMi({ x0: 0.05, y0: 0.09, x1: 0.95, y1: 0.27 }, k.kutular, 0.99), 'identity rows stay masked')
  assert.ok(!maskeliMi({ x0: 0.2, y0: 0.284, x1: 0.8, y1: 0.296 }, k.kutular, 0.2), 'the complaint written on the ŞİKAYETİ row is visible')
  // without identity label rows above it, a "ŞİKAYETİ" alone never shortens the template band
  const tek = gizlilikKarari({ w: 1000, h: 1400, ocr: [ocr[3]], sablon, sablonEslesmesi: SABLON_ESIK + 0.1, serbestBeyan: false })
  assert.ok(maskeliMi({ x0: 0.2, y0: 0.284, x1: 0.8, y1: 0.296 }, tek.kutular, 0.99))
})

test('layout: a strip read as print by the device OCR is not sent; read B context is faded, the line band untouched', () => {
  const basili = [satir(kelime('Kulak-Burun-Boğaz', 100, 100, 400, 120, 93), kelime('Uzmanı', 410, 100, 520, 120, 91))]
  assert.equal(basiliSatirMi({ x0: 0.09, y0: 0.095, x1: 0.55, y1: 0.125 }, basili, 1000, 1000), true)
  const el = [satir(kelime('Sağ', 100, 100, 140, 120, 92), kelime('mukz', 150, 100, 400, 120, 40))]
  assert.equal(basiliSatirMi({ x0: 0.09, y0: 0.095, x1: 0.55, y1: 0.125 }, el, 1000, 1000), false, 'a printed label beside handwriting keeps the line')
  const r: Rgba = { w: 2, h: 10, d: new Uint8ClampedArray(2 * 10 * 4).fill(0) }
  baglamiSoldur(r, { y0: 3, y1: 7 })
  assert.ok(r.d[0] > 150, 'context row faded')
  assert.equal(r.d[(5 * 2) * 4], 0, 'line band unchanged')
})

test('self-consistency: a near-identical plain word counts as agreement; protected words still need an exact match', async () => {
  assert.equal(yakinMi('sialendoskopik', 'sialendoskopic'), true)
  assert.equal(yakinMi('sağda', 'solda'), false)
  assert.equal(yakinMi('12,5', '12,6'), false)
  const r = uzlastir({ no: 1, kelimeler: [{ m: 'submandibuler', g: 0.85 }] }, { no: 1, kelimeler: [{ m: 'submandibular', g: 0.85 }] })
  assert.equal(r[0].uyum, true)
  assert.equal(r[0].yakin, true)
  // reader: plain near-agreement accepted; a protected near-agreement (allergy context) is asked
  const m = sahteModel({
    okuA: { satirlar: [{ no: 1, kelimeler: [{ m: 'submandibuler', g: 0.9 }] }, { no: 2, kelimeler: [{ m: 'alerji', g: 0.95 }, { m: 'eritromisin', g: 0.95 }] }] },
    okuB: { satirlar: [{ no: 1, kelimeler: [{ m: 'submandibular', g: 0.9 }] }, { no: 2, kelimeler: [{ m: 'alerji', g: 0.95 }, { m: 'eritromycin', g: 0.95 }] }] },
  })
  const s = await sayfayiOku(paket(), baglam(), m)
  assert.equal(s.satirlar[0].kelimeler[0].kabul, true)
  assert.ok(s.dogrula.some((d) => d.anahtar === 's1-l2-w1' && d.sinif === 'korumali'), 'drug under an allergy is asked')
})

test('reader: a strip both reads call blank (no pen writing) is dropped; one read alone cannot drop it; read B gets the page and the vocabulary', async () => {
  const parcalar: { etiket: string; sistem: string; metinler: string[]; gorsel: number }[] = []
  const m: ModelKapisi = {
    async gorselJson({ etiket, sistem, parcalar: p }) {
      parcalar.push({ etiket, sistem, metinler: p.filter((x) => x.tur === 'metin').map((x) => (x as { metin: string }).metin), gorsel: p.filter((x) => x.tur === 'gorsel').length })
      return etiket === 'el-notu-okuma-A'
        ? { satirlar: [{ no: 1, kelimeler: [], bos: true }, { no: 2, kelimeler: [], bos: true }] }
        : { satirlar: [{ no: 1, kelimeler: [], bos: true }, { no: 2, kelimeler: [{ m: 'N', g: 0.6 }] }] }
    },
    async metinJson() { return { satirlar: [] } },
  }
  const s = await sayfayiOku(paket(), { ...baglam(), sayfaGorseli: GORSEL }, m)
  assert.deepEqual(s.satirlar.map((l) => l.no), [2])
  const a = parcalar.find((x) => x.etiket === 'el-notu-okuma-A')!, bb = parcalar.find((x) => x.etiket === 'el-notu-okuma-B')!
  assert.equal(a.gorsel, 2, 'read A: the strips only')
  assert.equal(bb.gorsel, 3, 'read B: the masked page + the strips')
  assert.ok(!a.sistem.includes('Vocabulary') && bb.sistem.includes('Vocabulary'), 'only read B gets the vocabulary aid')
  assert.ok(okumaSozcukleri(SOZLUK).some((w) => w.startsWith('SD (septum')))
})

test('reader: an unusable answer is asked once more before the batch counts as unread', async () => {
  let n = 0
  const m: ModelKapisi = {
    async gorselJson({ etiket }) { if (etiket === 'el-notu-okuma-B' && n++ === 0) throw new Error('json'); return { satirlar: [{ no: 1, kelimeler: [{ m: 'Septum', g: 0.95 }] }, { no: 2, kelimeler: [{ m: 'normal', g: 0.95 }] }] } },
    async metinJson() { return { satirlar: [] } },
  }
  const s = await sayfayiOku(paket(), baglam(), m)
  assert.equal(s.satirlar[0].kelimeler[0].kabul, true)
  assert.equal(s.okumaSayisi, 4, 'A + B + B retry + normalisation')
})

test('placeholders: answered ones are filled, open ones stay (and are listed)', () => {
  const t = 'Sağ ⟦s1-l2-w3|kulak?⟧ zarı ⟦s1-l2-w5|N?⟧'
  assert.equal(yerTutuculariDoldur(t, new Map([['s1-l2-w3', 'kulak']])), 'Sağ kulak zarı ⟦s1-l2-w5|N?⟧')
  assert.deepEqual(acikYerTutucular(t), ['s1-l2-w3', 's1-l2-w5'])
})

// ─── memory ─────────────────────────────────────────────────────────────────────────────────────────────
function kelimeResmi(desen: (x: number, y: number) => boolean): Gri {
  const w = 120, h = 40, d = new Uint8ClampedArray(w * h).fill(250)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (desen(x, y)) d[y * w + x] = 30
  return { w, h, d }
}
test('memory: the same handwritten shape matches itself; a confirmed crop re-ranks the reading', () => {
  const a = tanimlayici(kelimeResmi((x, y) => (x % 20 < 4 && y > 5 && y < 35) || (y > 18 && y < 22 && x > 10 && x < 110)), { x0: 0, y0: 0, x1: 1, y1: 1 })!
  const b = tanimlayici(kelimeResmi((x, y) => Math.hypot(x - 60, y - 20) < 15), { x0: 0, y0: 0, x1: 1, y1: 1 })!
  assert.ok(sekilBenzerligi(a, { tanimlayici: a.v, enBoy: a.enBoy }) > 0.99)
  assert.ok(sekilBenzerligi(a, { tanimlayici: b.v, enBoy: b.enBoy }) < 0.7)
  const hafiza = [{ id: 'h1', metin: 'tükürük', tanimlayici: a.v, enBoy: a.enBoy, korumali: false }]
  const r = yenidenSirala({ metin: 'türkük', guven: 0.6, adaylar: ['tükürük'], tanim: a }, new Map(), hafiza)
  assert.equal(r.metin, 'tükürük')
  assert.equal(r.hafizadan, true)
  assert.equal(benzerOrnekler([a], hafiza).length, 1)
})

// ─── compiler ───────────────────────────────────────────────────────────────────────────────────────────
test('compiler: provenance tags are stripped into the map; conflicts and file proposals parsed; nothing tagged is saved', () => {
  const { soap, izler } = izleriAyikla({ objektif: 'Sağ kulak zarı normal ‹K1.3›. Septum deviasyonu ‹K1.4,K2.7›.', plan: '1. Kontrol 1 ay sonra ‹K1.9›' })
  assert.equal(soap.objektif, 'Sağ kulak zarı normal. Septum deviasyonu.')
  assert.deepEqual(izler.objektif?.map((x) => x.etiketler), [['K1.3'], ['K1.4', 'K2.7']])
  assert.ok(!/‹|›/.test(String(soap.plan)))
  const c = celiskileriAyikla([{ konu: 'Septum deviasyonu tarafı', alan: 'objektif', secenekler: [{ deger: 'sağa', kaynak: 'K1.4' }, { deger: 'sola', kaynak: 'K2.7' }] }, { konu: 'tek', secenekler: [{ deger: 'a' }] }])
  assert.equal(c.length, 1)
  assert.equal(dosyaOnerileriniAyikla([{ tur: 'alerji', metin: 'Penisilin ‹K1.2›', kaynak: 'K1.2' }, { tur: 'x', metin: 'y' }])[0].metin, 'Penisilin')
  assert.ok(kaynakBlogu([{ id: 'a', tur: 'el_notu', baslik: 'El notu', metin: 'Satır 1\nSatır 2', isleme: 'x' }]).includes('[K1.2] Satır 2'))
})

test('compiler: a late source replaces only the sections its type may change, never a hand-edited one', () => {
  const r = bolumleriBirlestir({ subjektif: 'eski S', objektif: 'eski O', plan: 'elle P' }, { subjektif: 'yeni S', objektif: 'yeni O', plan: 'yeni P' }, ETKILEDIGI_ALANLAR.belge, new Set())
  assert.deepEqual(r.soap, { subjektif: 'eski S', objektif: 'yeni O', plan: 'elle P' })
  const r2 = bolumleriBirlestir({ objektif: 'elle O' }, { objektif: 'yeni O' }, ['objektif'], new Set(['objektif']))
  assert.equal(r2.soap.objektif, 'elle O')
  assert.deepEqual(r2.oneriler, [{ alan: 'objektif', metin: 'yeni O' }])
  assert.equal(ozet('a'), ozet('a'))
  assert.notEqual(ozet('a'), ozet('b'))
})

// ─── time meter ─────────────────────────────────────────────────────────────────────────────────────────
test('time meter: real measurements only; gain only against the doctor\'s baseline', () => {
  const o = gunlukOzet([{ sure_ms: 90000, patient_id: 'a' }, { sure_ms: 30000, patient_id: 'a' }, { sure_ms: 60000, patient_id: 'b' }], 6)
  assert.deepEqual(o, { hasta: 2, dokumantasyonDk: 3, kazancDk: 9, tabanDk: 6 })
  const k = { ...EL_NOTU_TR.zaman, ondalik: ',' }
  assert.equal(gunlukSatir(o, k), 'Bugün 2 hasta · dokümantasyon 3 dk · kazanç 9 dk')
  assert.equal(gunlukSatir(gunlukOzet([{ sure_ms: 60000, patient_id: 'a' }], null), k), 'Bugün 1 hasta · dokümantasyon 1 dk')
  assert.equal(gunlukSatir(gunlukOzet([], 5), k), null, 'no measurement → no line')
  let t = 0
  const s = new AktifSure(() => t, 60000)
  s.etkilesim(); t = 30000; s.etkilesim(); t = 500000
  assert.equal(s.al(), 90000, 'idle time after the last interaction is capped at 60 s')
})

// ─── templates, preprocessing, layout ───────────────────────────────────────────────────────────────────
function form(degisiklik = 0): Gri {
  const w = 480, h = 680, d = new Uint8ClampedArray(w * h).fill(250)
  const kutu = (x0: number, y0: number, x1: number, y1: number) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) d[y * w + x] = 60 }
  kutu(30, 60, 450, 64); kutu(30, 150, 450, 154); kutu(100, 250, 200, 350); kutu(280, 250, 380, 350); kutu(60, 450, 420, 600)
  if (degisiklik) for (let i = 0; i < degisiklik; i++) kutu(40 + i * 30, 380, 60 + i * 30, 395)
  return { w, h, d }
}
test('templates: the same printed form matches across different handwriting; a plain sheet does not', () => {
  const a = parmakIzi(form()), b = parmakIzi(form(8))
  const duz = parmakIzi({ w: 480, h: 680, d: new Uint8ClampedArray(480 * 680).map((_, i) => ((i * 7919) % 97 < 3 ? 80 : 250)) })
  assert.equal(a.length, PARMAK_IZI_SATIR * PARMAK_IZI_SUTUN)
  assert.ok(eslesmeSkoru(a, b) > SABLON_ESIK)
  assert.ok(eslesmeSkoru(a, duz) < SABLON_ESIK)
  const s: Sablon = sablonTaslagi({ id: 'x', ad: 'Form', tur: 'formlu', brans: null, enBoy: 480 / 680, baslik: [{ x0: 0, y0: 0.05, x1: 1, y1: 0.25 }], cizim: [], parmakIzi: a })
  assert.equal(sablonBul(b, 480 / 680, [s]).sablon?.id, 'x')
  assert.equal(sablonBul(b, 1.4, [s]).sablon, null, 'aspect ratio must agree')
  assert.throws(() => sablonTaslagi({ id: 'y', ad: 'F', tur: 'formlu', brans: null, enBoy: 0.7, baslik: [], cizim: [], parmakIzi: a }), /baslik_gerekli/)
})

test('preprocessing: homography round trip, deskew sign, quality gate, page found on a dark desk', () => {
  const src = [{ x: 10, y: 20 }, { x: 300, y: 15 }, { x: 310, y: 400 }, { x: 5, y: 390 }], dst = [{ x: 0, y: 0 }, { x: 299, y: 0 }, { x: 299, y: 399 }, { x: 0, y: 399 }]
  const H = homografi(src, dst)
  for (let i = 0; i < 4; i++) { const p = noktaDonustur(H, src[i]); assert.ok(Math.abs(p.x - dst[i].x) < 0.5 && Math.abs(p.y - dst[i].y) < 0.5) }
  // lines tilted by +3° → deskew finds about +3
  const w = 600, h = 400, m: Maske = { w, h, d: new Uint8Array(w * h) }
  for (let k = 0; k < 8; k++) for (let x = 20; x < 580; x++) { const y = Math.round(40 + k * 40 + Math.tan((3 * Math.PI) / 180) * (x - 300)); if (y >= 0 && y < h) m.d[y * w + x] = 1 }
  assert.ok(Math.abs(Math.abs(egimBul(m)) - 3) <= 0.5)
  assert.deepEqual(kaliteKarari({ bulaniklik: 10, parlama: 0.2, parlaklik: 40, kisaKenar: 500, sayfaOrani: 0.1 }).nedenler.sort(), ['bulanik', 'karanlik', 'kucuk', 'parlama', 'sayfa_yok'])
  assert.equal(kaliteKarari({ bulaniklik: 900, parlama: 0, parlaklik: 160, kisaKenar: 1100, sayfaOrani: 0.9 }).tamam, true)
  const duz: Gri = { w: 200, h: 200, d: new Uint8ClampedArray(200 * 200).fill(128) }
  assert.ok(bulaniklikOlc(duz) < 1)
  // white sheet on a dark desk
  const fw = 400, fh = 500, fd = new Uint8ClampedArray(fw * fh * 4)
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const i = (y * fw + x) * 4; const kagit = x > 60 && x < 340 && y > 50 && y < 450; fd[i] = fd[i + 1] = fd[i + 2] = kagit ? 235 : 40; fd[i + 3] = 255 }
  const b = sayfaBul({ w: fw, h: fh, d: fd })
  assert.equal(b.kenarBulundu, true)
  assert.ok(Math.abs(b.koseler[0].x - 60) < 12 && Math.abs(b.koseler[2].y - 450) < 12)
})

test('layout: lines found on a synthetic page; annotation linked to the nearest drawing region', () => {
  const w = 800, h = 1000, m: Maske = { w, h, d: new Uint8Array(w * h) }
  for (let k = 0; k < 5; k++) for (let x = 100; x < 700; x += 22) for (let y = 200 + k * 60; y < 220 + k * 60; y++) for (let xx = x; xx < x + 14; xx++) m.d[y * w + xx] = 1
  const y = satirlariCikar(m)
  assert.equal(y.satirlar.length, 5)
  assert.ok(y.satirlar.every((s, i) => i === 0 || s.kutu.y0 > y.satirlar[i - 1].kutu.y0))
  assert.equal(bolgeyeBagla({ x0: 0.1, y0: 0.5, x1: 0.2, y1: 0.52 }, [{ id: 'kulak', kutu: { x0: 0.21, y0: 0.45, x1: 0.3, y1: 0.55 } }, { id: 'boyun', kutu: { x0: 0.7, y0: 0.8, x1: 0.9, y1: 0.95 } }], []), 'kulak')
})
