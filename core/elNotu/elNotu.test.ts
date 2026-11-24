/**
 * ESNEK-MUAYENE-A — El Notu Okuyucu: privacy guards, protected items, never-invent, self-consistency, lexicon, compiler,
 * time meter, layout and preprocessing. Synthetic data only (no real page, no real identity).
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { gizlilikKarari, maskeliMi, maskeyiBoya, SABLON_ESIK } from './gizlilik'
import { sayfaPaketiHazirla, basiliSatirMi, sayfaParcalari, type TuvalAdaptoru } from './sayfaPaketi'
import { korumaliSiniflar, kabulEdilirMi, satirKorumali, KORUMALI_ESIK } from './korumali'
import { uzlastir, benzerlik, yakinMi, cokluUzlastir, satirBenzerligi } from './uzlastir'
import { sozlukKur, coz, yasCinsiyet, genislet, bilinmeyenKisaltmaMi } from './sozluk'
import { GENEL_TR_TOHUM } from './tohum/genelTr'
import { KBB_TR_TOHUM } from './tohum/kbbTr'
import { tohumlarTr, anahatTr } from './tohum'
import { anahatOgren, anahatBlogu, alanBul } from './anahat'
import { maskeKaniti } from './maskeKaniti'
import { sayfaPuanla, toplamPuan, icerir } from './degerlendirme'
import { uydurmaDenetimi, okumaSozcukleri, sayfayiOku, sayiEkiBirlestir, kaynakMetni, yerTutuculariDoldur, acikYerTutucular, deterministikNormal, metinSatirKonumlari, satirGrupla, DOGRULA_BUTCESI, type ModelKapisi, type SayfaPaketi, type IstemParcasi } from './okuyucu'
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

test('privacy guard: no pixel of the identity region ever leaves — masked page, every tile, every region crop', async () => {
  // OCR "finds" the printed labels next to the red values
  const ocr = async (): Promise<OcrSatir[]> => [satir(kelime('ADI-SOYADI', 20, 212, 110, 238)), satir(kelime('GSM', 20, 262, 60, 288)), satir(kelime('ŞİKAYETİ', 20, 330, 110, 350))]
  const sablon: Sablon = { id: 't', ad: 'f', tur: 'formlu', brans: null, enBoy: 1100 / 1500, baslikBolgeleri: [], cizimBolgeleri: [{ id: 'b1', anatomi: 'boyun', etiket: 'Boyun', taraf: 'sag', kutu: { x0: 0.6, y0: 0.1, x1: 0.95, y1: 0.25 } }], parmakIzi: null }
  const s = await sayfaPaketiHazirla({ foto: sentetikSayfa(), sayfa: 1, sablonlar: [sablon], serbestBeyan: false, tuval: hamTuval, ocr, kenarOcrAtla: true })
  assert.equal(s.durum, 'hazir')
  if (s.durum !== 'hazir') return
  assert.ok(!kirmiziVarMi(s.maskeliSayfa.base64), 'masked page shows identity pixels')
  for (const t of s.paket.parcalar || []) assert.ok(!kirmiziVarMi(t.gorsel.base64), 'page tile')
  assert.ok(s.paket.gizlilikKutulari?.length, 'the package declares the boxes it painted (the server re-checks them)')
  const ham = JSON.parse(Buffer.from(s.maskeliSayfa.base64, 'base64').toString()) as { w: number; h: number; d: number[] }
  assert.deepEqual(maskeKaniti({ w: ham.w, h: ham.h, d: Uint8ClampedArray.from(ham.d) }, s.paket.gizlilikKutulari!), { tamam: true }, 'masking proof holds on the outbound page')
  for (const b of s.paket.bolgeler) if (b.gorsel) assert.ok(!kirmiziVarMi(b.gorsel.base64), `region ${b.id}`)
  assert.ok(s.paket.satirlar.length >= 4, 'handwriting lines were found')
})

test('privacy guard: page tiles are cut from the MASKED raster only; a small page gets no tiles', async () => {
  const w = 2400, h = 3400
  const r: Rgba = { w, h, d: new Uint8ClampedArray(w * h * 4).fill(235) }
  for (let y = 300; y < 600; y++) for (let x = 100; x < 2300; x++) { const i = (y * w + x) * 4; r.d[i] = 220; r.d[i + 1] = 20; r.d[i + 2] = 20 }
  const kutu = { x0: 0.03, y0: 0.08, x1: 0.97, y1: 0.18 }
  maskeyiBoya(r, [kutu])
  const t = await sayfaParcalari(r, hamTuval)
  assert.equal(t.length, 4, 'a large page → bands of ≤ ~1 MP')
  for (const p of t) {
    assert.ok(!kirmiziVarMi(p.gorsel.base64))
    const ham = JSON.parse(Buffer.from(p.gorsel.base64, 'base64').toString()) as { w: number; h: number; d: number[] }
    assert.deepEqual(maskeKaniti({ w: ham.w, h: ham.h, d: Uint8ClampedArray.from(ham.d) }, [kutu], { bant: { y0: p.y0, y1: p.y1 } }), { tamam: true })
  }
  assert.equal((await sayfaParcalari({ w: 800, h: 1100, d: new Uint8ClampedArray(800 * 1100 * 4) }, hamTuval)).length, 0, 'a page a model reads whole at full resolution gets no tiles')
  assert.equal((await sayfaParcalari({ w: 1131, h: 1599, d: new Uint8ClampedArray(1131 * 1599 * 4) }, hamTuval)).length, 4, 'a phone photo → bands ≤ PARCA_YUKSEKLIK tall')
  assert.ok(okumaSozcukleri(SOZLUK).some((x) => x.startsWith('SD (septum')))
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
    for (const t of isaretli.paket.parcalar || []) assert.ok(!kirmiziVarMi(t.gorsel.base64))
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

type SayfaYaniti = { satirlar: { y0: number; y1: number; alan?: string | null; kelimeler: { m: string; g: number; alt?: string[] }[] }[] }
function sahteModel(o: { oku: (SayfaYaniti | Error)[]; cizim?: unknown; normal?: unknown }): ModelKapisi & { cagri: { etiket: string; parcalar: IstemParcasi[]; sistem: string }[] } {
  const cagri: { etiket: string; parcalar: IstemParcasi[]; sistem: string }[] = []
  return {
    cagri,
    async gorselJson({ etiket, parcalar, sistem }) {
      cagri.push({ etiket, parcalar, sistem })
      const m = /^el-notu-sayfa-(\d)$/.exec(etiket)
      if (m) { const y = o.oku[Number(m[1]) - 1]; if (y instanceof Error) throw y; return y ?? { satirlar: [] } }
      return o.cizim ?? { bulgular: [] }
    },
    async metinJson({ etiket }) { cagri.push({ etiket, parcalar: [], sistem: '' }); return o.normal ?? { satirlar: [] } },
  }
}
const GORSEL = { mime: 'image/jpeg', base64: 'TUFTS0VE' }
const paket = (bolgeler: SayfaPaketi['bolgeler'] = []): SayfaPaketi => ({
  sayfa: 1, sablonId: 's', kalite: kaliteKarari({ bulaniklik: 500, parlama: 0, parlaklik: 160, kisaKenar: 1100, sayfaOrani: 0.9 }),
  satirlar: [
    { no: 1, kutu: { x0: 0.1, y0: 0.4, x1: 0.9, y1: 0.43 }, kelimeler: [], tanimlar: [], bolgeId: null },
    { no: 2, kutu: { x0: 0.1, y0: 0.45, x1: 0.9, y1: 0.48 }, kelimeler: [], tanimlar: [], bolgeId: 'b1' },
  ],
  bolgeler,
  parcalar: [{ gorsel: GORSEL, y0: 0, y1: 0.54 }, { gorsel: GORSEL, y0: 0.46, y1: 1 }],
  gizlilikKutulari: [{ x0: 0, y0: 0, x1: 1, y1: 0.1 }],
})
const baglam = () => ({ bransAdi: 'KBB', dil: EL_NOTU_TR.dil, sozluk: SOZLUK, hafiza: [], dagarcik: new Map<string, number>(), sorulmusKisaltmalar: new Set<string>(), sozcukMu: () => false, sayfaGorseli: GORSEL, anahat: anahatOgren([], anahatTr('kulak-burun-bogaz')) })
const L = (y0: number, ...k: [string, number][]) => ({ y0, y1: y0 + 30, kelimeler: k.map(([m, g]) => ({ m, g })) })

test('reader v2: three independent page reads; unanimous words accepted; a side the reads disagree on is asked, crop snapped to the device line; invented normalisation falls back', async () => {
  const m = sahteModel({
    oku: [
      { satirlar: [L(400, ['Sigara', 0.95], ['Ø', 0.95]), L(450, ['SD', 0.95], ['sağa', 0.9])] },
      { satirlar: [L(402, ['Sigara', 0.9], ['Ø', 0.97]), L(452, ['SD', 0.9], ['sola', 0.9])] },
      { satirlar: [L(398, ['Sigara', 0.9], ['Ø', 0.96]), L(449, ['SD', 0.9], ['sağa', 0.8])] },
    ],
    normal: { satirlar: [{ no: 1, normal: 'Sigara yok, alkol yok' }, { no: 2, normal: 'septum deviasyonu ⟦s1-l2-w1|sağa?⟧' }] },
  })
  const s = await sayfayiOku(paket(), baglam(), m)
  const okumalar = m.cagri.filter((c) => c.etiket.startsWith('el-notu-sayfa'))
  assert.deepEqual(okumalar.map((c) => c.etiket).sort(), ['el-notu-sayfa-1', 'el-notu-sayfa-2', 'el-notu-sayfa-3'])
  const gorsel = (c: { parcalar: IstemParcasi[] }) => c.parcalar.filter((p) => p.tur === 'gorsel').length
  assert.equal(gorsel(okumalar.find((c) => c.etiket === 'el-notu-sayfa-1')!), 3, 'read 1: the page + 2 tiles')
  const r3 = okumalar.find((c) => c.etiket === 'el-notu-sayfa-3')!
  assert.equal(gorsel(r3), 2, 'read 3: the tiles alone')
  assert.ok(!r3.parcalar.some((p) => p.tur === 'metin' && p.metin === 'The whole page:'), 'read 3: no shrunk whole-page picture')
  const r2 = okumalar.find((c) => c.etiket === 'el-notu-sayfa-2')!
  assert.equal((r2.parcalar.find((p) => p.tur === 'gorsel') as { gorsel: { base64: string } }).gorsel, paket().parcalar![0].gorsel, 'read 2: tiles first')
  assert.ok(!r2.sistem.includes('usually follow this outline') && r2.parcalar.some((p) => p.tur === 'metin' && p.metin.includes('usually follow this outline')), 'read 2: the outline after the images')
  assert.ok(okumalar.every((c) => c.sistem.includes('Vocabulary')), 'every read gets the vocabulary aid')
  assert.equal(s.satirlar[0].kelimeler.every((k) => k.kabul), true, 'unanimous words (Ø included) accepted')
  const taraf = s.dogrula.find((d) => d.anahtar === 's1-l2-w1')
  assert.ok(taraf, 'the side 2 of 3 reads give is still asked (protected: every read must agree)')
  assert.equal(taraf!.sinif, 'korumali')
  assert.equal(taraf!.korumaliTur, 'taraf')
  assert.deepEqual(taraf!.kutu, paket().satirlar[1].kutu, 'crop = the device line box')
  assert.equal(s.satirlar[1].bolgeId, 'b1')
  assert.equal(s.satirlar[0].normal, 'Sigara yok', '"alkol yok" is not on the page → deterministic expansion')
  assert.equal(s.satirlar[1].normal, 'septum deviasyonu ⟦s1-l2-w1|sağa?⟧')
})

test('reader v2: Doğrula budget — protected always asked; non-clinical noise → "[okunamadı]" without a question; clinical words beyond the budget stay visible with "(?)"', async () => {
  const klinik = [['rinit', 'otit', 'sinüzit'], ['polip', 'kist', 'nodül'], ['larenjit', 'tonsillit', 'adenoidit'], ['otoskopi', 'endoskopi', 'rinoskopi'], ['hipertrofi', 'atrofi', 'distrofi'], ['sialolit', 'kolelit', 'nefrolit'], ['efüzyon', 'perforasyon', 'retraksiyon']]
  const oku = [0, 1, 2].map((r) => ({ satirlar: [
    L(100, ['Şikayet', 0.9], [['qwzx', 'brvt', 'plmk'][r], 0.4]),
    ...klinik.map((k, i) => L(150 + i * 50, ['Bulgu', 0.9], [k[r], 0.5])),
    L(600, ['Sigara', 0.9], [['5', '3', '5'][r], 0.9]),
  ] }))
  const s = await sayfayiOku(paket(), baglam(), sahteModel({ oku }))
  const korumali = s.dogrula.filter((d) => d.sinif === 'korumali')
  assert.equal(korumali.length, 1, 'the number the reads disagree on is asked')
  assert.equal(s.dogrula.length, DOGRULA_BUTCESI, 'protected first, then clinical words up to the budget')
  assert.equal(s.butceDisi, klinik.length - (DOGRULA_BUTCESI - 1))
  assert.equal(s.okunamadi, 1)
  const metin = kaynakMetni([s], EL_NOTU_TR.dil, () => '')
  assert.ok(metin.includes('[okunamadı]'), 'noise marked')
  assert.ok(!s.dogrula.some((d) => ['qwzx', 'brvt', 'plmk'].includes(d.okunan)), 'noise never asked')
  assert.equal((metin.match(/\(\?\)/g) || []).length, 0, 'an over-budget word only one read gave is never shown (it may be a guess)')
  assert.equal(metin.split('[okunamadı]').length - 1, 1 + klinik.length - (DOGRULA_BUTCESI - 1))
  // the same over-budget word given by two of three reads is shown, flagged
  const iki = [0, 1, 2].map((r) => ({ satirlar: [...[0, 1, 2, 3, 4, 5].map((i) => L(100 + i * 50, ['Bulgu', 0.9], [klinik[i][r], 0.5])), L(500, ['Bulgu', 0.9], [r === 2 ? 'kist' : 'polip', 0.3])] }))
  const s2 = await sayfayiOku(paket(), baglam(), sahteModel({ oku: iki }))
  assert.ok(kaynakMetni([s2], EL_NOTU_TR.dil, () => '').includes('polip(?)'))
})

test('reader v2: several doubtful words on one line → ONE line question whose candidates are the reads\' line texts', async () => {
  const oku = [['sağ', 'KZ', '3'], ['sol', 'KZ', '5'], ['sağ', 'KZ', '8']].map((w) => ({ satirlar: [L(450, [w[0], 0.7], [w[1], 0.9], [w[2], 0.5])] }))
  const s = await sayfayiOku(paket(), baglam(), sahteModel({ oku }))
  assert.equal(s.dogrula.length, 1)
  assert.equal(s.dogrula[0].anahtar, 's1-l1')
  assert.equal(s.dogrula[0].sinif, 'korumali')
  assert.ok(s.dogrula[0].adaylar.includes('sol KZ 5') && s.dogrula[0].adaylar.includes('sağ KZ 3'))
})

test('reader v2: a read that fails twice does not vote; the answering reads must all agree on a protected word', async () => {
  const iyi = { satirlar: [L(450, ['sağ', 0.97], ['kulak', 0.95])] }
  const m = sahteModel({ oku: [iyi, new Error('json'), iyi] })
  const s = await sayfayiOku(paket(), baglam(), m)
  assert.equal(s.satirlar[0].kelimeler[0].kabul, true)
  assert.equal(s.okumaSayisi, 1 + 2 + 1 + 1, 'read 1 + read 2 twice + read 3 + normalisation')
  const tek = await sayfayiOku(paket(), { ...baglam(), okumaSayisi: 1 }, sahteModel({ oku: [iyi] }))
  assert.equal(tek.satirlar[0].kelimeler[0].kabul, false, 'one read alone never accepts a protected word')
})

test('reader v2: a drawing finding for an UNMARKED region is dropped; the side always comes from the template region', async () => {
  const bolgeler: SayfaPaketi['bolgeler'] = [
    { id: 'b1', anatomi: 'kulak_zari', etiket: 'Kulak zarı', taraf: 'sag', kutu: { x0: 0.3, y0: 0.35, x1: 0.45, y1: 0.48 }, murekkep: 0.002, gorsel: GORSEL },
    { id: 'b2', anatomi: 'kulak_zari', etiket: 'Kulak zarı', taraf: 'sol', kutu: { x0: 0.55, y0: 0.35, x1: 0.7, y1: 0.48 }, murekkep: 0, gorsel: GORSEL },
  ]
  const m = sahteModel({ oku: [], cizim: { bulgular: [{ bolgeId: 'b1', bulgu: 'normal (N)', isaret: 'normal_isareti', g: 0.95 }, { bolgeId: 'b2', bulgu: 'perforasyon', isaret: 'daire', g: 0.99 }] } })
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

test('reader v2: an unknown abbreviation is asked once; never again once asked', async () => {
  const oku = [0, 1, 2].map(() => ({ satirlar: [L(400, ['QZK', 0.98], ['normal', 0.98])] }))
  const p = paket(); p.satirlar = [p.satirlar[0]]
  const s1 = await sayfayiOku(p, baglam(), sahteModel({ oku }))
  assert.ok(s1.dogrula.some((d) => d.sinif === 'kisaltma' && d.okunan === 'QZK'))
  const b = baglam(); b.sorulmusKisaltmalar = new Set(['kis-qzk'])
  const s2 = await sayfayiOku(p, b, sahteModel({ oku }))
  assert.ok(!s2.dogrula.some((d) => d.sinif === 'kisaltma'))
})

test('self-consistency over N reads: majority wins, near-identical plain words agree, protected words count exact votes only, insertions need support', () => {
  const k = (m: string, g = 0.9) => ({ m, g })
  const r = cokluUzlastir([[k('sol'), k('submandibuler'), k('gland')], [k('sol'), k('submandibular'), k('gland')], [k('sağ'), k('submandibuler'), k('gland'), k('taş', 0.3)]])
  assert.deepEqual(r.map((x) => x.metin), ['sol', 'submandibuler', 'gland'], 'a low-confidence word one read alone saw is not inserted')
  assert.equal(r[0].tamOy, 2)
  assert.equal(r[1].oy, 3, 'near-identical spelling counts as agreement')
  assert.equal(r[1].tamOy, 2)
  const ek = cokluUzlastir([[k('multipl'), k('taş')], [k('multipl'), k('küçük'), k('taş')], [k('multipl'), k('küçük'), k('taş')]])
  assert.deepEqual(ek.map((x) => x.metin), ['multipl', 'küçük', 'taş'])
  assert.equal(cokluUzlastir([null, [k('x')], null], 3)[0].oy, 1, 'reads that missed the line count against it')
  assert.equal(yakinMi('sialendoskopik', 'sialendoskopic'), true)
  assert.equal(yakinMi('sağda', 'solda'), false)
  assert.equal(yakinMi('12,5', '12,6'), false)
  const iki = uzlastir({ no: 1, kelimeler: [{ m: 'submandibuler', g: 0.85 }] }, { no: 1, kelimeler: [{ m: 'submandibular', g: 0.85 }] })
  assert.equal(iki[0].yakin, true)
  assert.ok(satirBenzerligi(['Sigara', '2', 'aydır', 'yok'], ['Sigara', '2', 'aydir', 'yok']) > 0.9)
})

test('line grouping: the same written line across reads is grouped by text and position; a line one read missed stays its own group in order', () => {
  const l = (y: number, t: string) => ({ y0: y, y1: y + 20, alan: null, kelimeler: t.split(' ').map((m) => ({ m, g: 0.9 })) })
  const g = satirGrupla([
    [l(100, '37 K sol çene altı'), l(200, 'sistemik hastalık Ø'), l(300, 'sigara 4-5 / gün')],
    [l(110, '37 K sol cene alti'), l(310, 'sigara 4-5/gün')],
    [l(95, '37 K sol çene altı'), l(205, 'sist hast Ø'), l(250, 'tiroid nodül bx'), l(305, 'sigara 4-5 / gün')],
  ])
  assert.equal(g.length, 4)
  assert.deepEqual(g.map((x) => x.uyeler.filter(Boolean).length), [3, 2, 1, 3])
  assert.equal(g[2].uyeler[2]?.kelimeler[0].m, 'tiroid')
})

test('structure prior: the outline is learned from confirmed texts in the doctor\'s order; too few texts → the branş default', () => {
  const v = anahatTr('kulak-burun-bogaz')
  assert.equal(anahatOgren(['kısa'], v).kaynak, 'varsayilan')
  assert.ok(v.some((a) => a.ad === 'Kulak') && !anahatTr('kardiyoloji').some((a) => a.ad === 'Kulak'), 'KBB fields only in KBB (no leak)')
  const metin = (i: number) => `40 E burun tıkanıklığı ${i} yıl\nSigara: 1 pk\nSist hast: Ø\nİlaç alj: Ø\nKontrol tarihi: 2 hf sonra`
  const a = anahatOgren([1, 2, 3, 4].map(metin), v)
  assert.equal(a.kaynak, 'hekim')
  const adlar = a.alanlar.map((x) => x.ad)
  assert.ok(adlar.indexOf('Sigara') < adlar.indexOf('Sistemik hastalık') && adlar.indexOf('Sistemik hastalık') < adlar.indexOf('İlaç alerjisi'), 'his own order')
  assert.ok(adlar.includes('Kontrol tarihi'), 'his own heading kept')
  assert.equal(alanBul('sist. hast.', v)?.tur, 'sistemik')
  assert.ok(anahatBlogu(a).includes('THIS physician'))
})

test('masking proof: every declared identity box must be black on the picture and on each tile; no box only under the plain-sheet declaration', () => {
  const r: Rgba = { w: 100, h: 200, d: new Uint8ClampedArray(100 * 200 * 4).fill(240) }
  const kutu = { x0: 0, y0: 0, x1: 1, y1: 0.2 }
  assert.deepEqual(maskeKaniti(r, [kutu]), { tamam: false, neden: 'kutu_acik' })
  maskeyiBoya(r, [kutu])
  assert.deepEqual(maskeKaniti(r, [kutu]), { tamam: true })
  assert.deepEqual(maskeKaniti(r, []), { tamam: false, neden: 'kutu_yok' })
  assert.deepEqual(maskeKaniti(r, [], { serbest: true }), { tamam: true })
  // a tile covering the lower half does not contain the box → nothing to check there; one covering the top must show it black
  const alt: Rgba = { w: 100, h: 100, d: new Uint8ClampedArray(100 * 100 * 4).fill(240) }
  assert.deepEqual(maskeKaniti(alt, [kutu], { bant: { y0: 0.5, y1: 1 } }), { tamam: true })
  assert.deepEqual(maskeKaniti(alt, [kutu], { bant: { y0: 0, y1: 0.5 } }), { tamam: false, neden: 'kutu_acik' })
})

test('scoring: facts by stage (accepted / Doğrula reading / candidate / flagged), invented words of the accepted text', () => {
  const p = sayfaPuanla({
    metin: 'Sigara 2 aydır yok\nSistemik ⟦s1-l2-w1|hastalk?⟧ Ø\neritromisin(?)\nplan uydurmaca',
    dogrula: [{ okunan: 'hastalk', adaylar: ['hastalık'], sinif: 'kelime' }],
    gercekler: [
      { id: 'a', metin: 'Sigara 2 aydır yok', anahtarlar: [['sigara'], ['2']] },
      { id: 'b', metin: 'Sistemik hastalık yok', anahtarlar: [['sistemik'], ['hastalık']] },
      { id: 'c', metin: 'alerji eritromisin', anahtarlar: [['eritromisin']], korumali: true },
      { id: 'd', metin: 'Submandibuler', anahtarlar: [['submand']] },
    ],
    hamKelimeler: ['Sigara', '2', 'aydır', 'yok', 'Sistemik', 'hastalk', 'Ø', 'eritromisin', 'plan'],
    izinli: ['plan'],
  })
  assert.deepEqual(p.gercekler.map((x) => x.asama), ['kesin', 'dogrulamada', 'isaretli', 'kacan'], 'a reading one letter off the fact still counts once confirmed')
  assert.deepEqual(p.uydurma, ['uydurmaca'])
  assert.equal(toplamPuan([p]).dogrulaIleYuzde, 50)
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

test('layout: a line the device OCR reads as print is not a handwriting line', () => {
  const basili = [satir(kelime('Kulak-Burun-Boğaz', 100, 100, 400, 120, 93), kelime('Uzmanı', 410, 100, 520, 120, 91))]
  assert.equal(basiliSatirMi({ x0: 0.09, y0: 0.095, x1: 0.55, y1: 0.125 }, basili, 1000, 1000), true)
  const el = [satir(kelime('Sağ', 100, 100, 140, 120, 92), kelime('mukz', 150, 100, 400, 120, 40))]
  assert.equal(basiliSatirMi({ x0: 0.09, y0: 0.095, x1: 0.55, y1: 0.125 }, el, 1000, 1000), false, 'a printed label beside handwriting keeps the line')
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

test('ESNEK-A-EVAL (Luna-Pro tuning): "?" abstains in the vote; number suffixes merge; a range carries both ends in scoring', () => {
  const k = (m: string, g = 0.8) => ({ m, g })
  const o = cokluUzlastir([[k('sol', 0.9), k('çene', 0.6)], [k('sol', 0.85), k('?', 0.2)], [k('sol', 0.9), k('?', 0.15)]], 3)
  assert.equal(o[1].metin, 'çene', 'a real reading is not outvoted by two "?"')
  assert.equal(o[1].oy, 1, '… but it is a single-read reading (never accepted on that basis)')
  assert.equal(cokluUzlastir([[k('?', 0.1)], [k('?', 0.2)]], 2)[0].metin, '?', 'only "?" → still unreadable')
  const b = (l: string[]) => sayiEkiBirlestir(l.map((m) => k(m)), EL_NOTU_TR.dil.sayiEkleri).map((x) => x.m)
  assert.deepEqual(b(['2017', 'de', 'ağrı']), ["2017'de", 'ağrı'])
  assert.deepEqual(b(['2023’te']), ["2023'te"])
  assert.deepEqual(b(['ben', 'de', '5', 'lt']), ['ben', 'de', '5', 'lt'], 'only after a number, only the language suffixes')
  assert.deepEqual(sayiEkiBirlestir([k('2017'), k('de')], undefined).map((x) => x.m), ['2017', 'de'], 'a language without suffixes: untouched')
  assert.equal(icerir('Su 2,5-3 lt', '2,5'), true)
  assert.equal(icerir('Su 2,5-3 lt', '2,5-3'), true)
  assert.equal(icerir('Su 2,6-3 lt', '2,5'), false)
})

test('ESNEK-A-EVAL: a printed form carries the row label of a short entry when ≥ 2 reads agree on the field; drawings first on forms', async () => {
  const S = (y0: number, alan: string | null, ...k: [string, number][]) => ({ ...L(y0, ...k), alan })
  const m = sahteModel({
    oku: [
      { satirlar: [S(402, 'Boyun', ['N', 0.9])] },
      { satirlar: [S(400, 'Boyun', ['N', 0.9])] },
      { satirlar: [S(401, null, ['N', 0.9])] },
    ],
    normal: { satirlar: [] },
  })
  const s = await sayfayiOku(paket(), baglam(), m)
  assert.equal(s.satirlar[0].normal, 'Boyun: normal', 'label + lexicon expansion (N = normal)')
  const anlati = await sayfayiOku({ ...paket(), sablonId: null }, baglam(), sahteModel({ oku: [{ satirlar: [S(402, 'Boyun', ['N', 0.9])] }, { satirlar: [S(400, 'Boyun', ['N', 0.9])] }, { satirlar: [S(401, 'Boyun', ['N', 0.9])] }] }))
  assert.ok(!anlati.satirlar[0].normal.startsWith('Boyun'), 'a narrative page writes its own headings: nothing added')
  const tek = await sayfayiOku(paket(), baglam(), sahteModel({ oku: [{ satirlar: [S(402, 'Boyun', ['N', 0.9])] }, { satirlar: [S(400, null, ['N', 0.9])] }, { satirlar: [S(401, null, ['N', 0.9])] }] }))
  assert.ok(!tek.satirlar[0].normal.startsWith('Boyun'), 'one read alone does not decide the field')
})

test('ESNEK-A-EVAL: on a printed form an uncertain drawing finding is asked before non-protected words; on a narrative page after them', async () => {
  const bolgeler: SayfaPaketi['bolgeler'] = [{ id: 'b1', anatomi: 'kulak_zari', etiket: 'Kulak zarı', taraf: 'sag', kutu: { x0: 0.3, y0: 0.35, x1: 0.45, y1: 0.48 }, murekkep: 0.002, gorsel: GORSEL }]
  // five lines, each with one clinical word the reads disagree on (non-protected) → five word questions compete
  const satir = (i: number, w: string) => ({ ...L(100 + i * 40, ['hasta', 0.9], [w, 0.6]), alan: 'Tanı' })
  const oku = [['otit', 'kist', 'polip', 'apse', 'nodül'], ['otalji', 'kanama', 'ödem', 'lezyon', 'tümör'], ['ateş', 'ağrı', 'sinüzit', 'plak', 'kitle']].map((ws) => ({ satirlar: ws.map((w, i) => satir(i, w)) }))
  const cizim = { bulgular: [{ bolgeId: 'b1', bulgu: 'perforasyon', isaret: 'daire', g: 0.4 }] }
  const p = paket(bolgeler)
  const form = await sayfayiOku(p, baglam(), sahteModel({ oku, cizim }))
  assert.ok(form.dogrula.some((d) => d.sinif === 'cizim'), 'form: the drawing finding gets a question')
  assert.ok(form.dogrula.length <= DOGRULA_BUTCESI)
  const anlati = await sayfayiOku({ ...p, sablonId: null }, baglam(), sahteModel({ oku, cizim }))
  assert.ok(!anlati.dogrula.some((d) => d.sinif === 'cizim'), 'narrative: the words take the budget, the drawing is shown with "(?)"')
})
