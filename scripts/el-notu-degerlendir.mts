/**
 * ESNEK-MUAYENE-A — El Notu Okuyucu evaluation harness.
 *
 *   npx tsx scripts/el-notu-degerlendir.mts --klasor <dir> [--sablon <file>] [--serbest] [--model canli|karma|kayit|yok] [--sayfa id,id]
 *                                           [--kayit <dir>] [--cikti <dir>]
 *
 * <dir> holds page images (jpg / png / pdf pages as images) and `dogruluk.json` (clinical ground truth only — see
 * /home/claude/esnek-eval/dogruluk.json for the format). Real patient pages NEVER go into this repo: keep the folder
 * outside it. The harness runs the SAME device pipeline as the browser (core/elNotu/sayfaPaketi.ts, Node canvas + the
 * same self-hosted tesseract language data), then — when a model is available — the same reader (core/elNotu/okuyucu.ts)
 * through the production model path (lib/ai/cagir.ts, needs OPENROUTER_API_KEY or ANTHROPIC_API_KEY in the environment).
 *
 * Reports (numbers only; no identity is ever printed or written):
 *  - privacy: page verdict, masking reason, identity leak check (OCR of every outbound picture: identity labels, ≥ 9-digit
 *    runs, e-mail addresses must be absent), lines found;
 *  - reading (model runs only): clinical-fact accuracy (found / asked-to-confirm / missed), invented facts (output content
 *    words traceable to neither the page's ground truth nor the lexicon — must be 0), Doğrula questions per page,
 *    per-word accuracy when the ground truth carries a word transcription.
 * --model kayit replays recorded model answers from --kayit (written by a previous canli run) for deterministic re-runs.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import jpeg from 'jpeg-js'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { createWorker, type Worker } from 'tesseract.js'
import { sayfaPaketiHazirla, type TuvalAdaptoru } from '../core/elNotu/sayfaPaketi'
import { parmakIzi } from '../core/elNotu/sablon'
import { sayfayiHazirla } from '../core/elNotu/onisleme'
import { sayfayiOku, kaynakMetni, type ModelKapisi } from '../core/elNotu/okuyucu'
import { sozlukKur } from '../core/elNotu/sozluk'
import { tohumlarTr } from '../core/elNotu/tohum'
import { EL_NOTU_TR } from '../core/elNotu/metinTr'
import { benzerlik, kelimeAnahtari } from '../core/elNotu/uzlastir'
import type { OcrSatir } from '../core/belgeler/kimlikMaske'
import type { Rgba, Sablon } from '../core/elNotu/tipler'

const arg = (ad: string) => { const i = process.argv.indexOf(`--${ad}`); return i > 0 ? process.argv[i + 1] : undefined }
const bayrak = (ad: string) => process.argv.includes(`--${ad}`)
const klasor = arg('klasor')
if (!klasor || !fs.existsSync(klasor)) { console.error('--klasor <dir> gerekli'); process.exit(2) }
const KOK = path.resolve(new URL('.', import.meta.url).pathname, '..')
if (path.resolve(klasor).startsWith(KOK)) { console.error('Gerçek sayfalar repo içinde tutulamaz: klasörü repo dışına taşıyın.'); process.exit(2) }
const cikti = arg('cikti')
const modelTuru = (arg('model') || (process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY ? 'canli' : 'yok')) as 'canli' | 'karma' | 'kayit' | 'yok'
const kayitKlasoru = arg('kayit') || (cikti ? path.join(cikti, 'kayit') : undefined)

type Gercek = { id: string; metin: string; anahtarlar: string[][]; korumali?: boolean; belirsiz?: boolean }
type Dogruluk = { sayfalar: Record<string, { tur: 'anlati' | 'form'; kimlik: boolean; gercekler: Gercek[]; kelimeler?: string }> }
const dogruluk = JSON.parse(fs.readFileSync(path.join(klasor, 'dogruluk.json'), 'utf8')) as Dogruluk

const tuval: TuvalAdaptoru = {
  async jpeg(r, kalite) { const c = createCanvas(r.w, r.h); const ctx = c.getContext('2d'); const id = ctx.createImageData(r.w, r.h); id.data.set(r.d); ctx.putImageData(id, 0, 0); return (await c.encode('jpeg', Math.round(kalite * 100))).toString('base64') },
}
let isci: Worker | null = null
async function ocr(r: Rgba): Promise<OcrSatir[] | null> {
  try {
    if (!isci) isci = await createWorker('tur+eng', 1, { langPath: path.join(KOK, 'public/tesseract/lang'), gzip: true, cachePath: path.join(process.env.TMPDIR || '/tmp', 'el-notu-tess') })
    const c = createCanvas(r.w, r.h); const ctx = c.getContext('2d'); const id = ctx.createImageData(r.w, r.h); id.data.set(r.d); ctx.putImageData(id, 0, 0)
    const { data } = await isci.recognize(c.toBuffer('image/png'), {}, { blocks: true })
    const satirlar = ((data as unknown as { blocks?: { paragraphs?: { lines?: { words?: { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }[] }[] }[] }[] }).blocks || []).flatMap((b) => (b.paragraphs || []).flatMap((p) => p.lines || []))
    return satirlar.map((l) => ({ kelimeler: (l.words || []).filter((w) => w.text.trim()).map((w) => ({ text: w.text, x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1, conf: w.confidence })) }))
  } catch { return null }
}

async function raster(dosya: string): Promise<Rgba> {
  if (/\.jpe?g$/i.test(dosya)) { const im = jpeg.decode(fs.readFileSync(dosya), { useTArray: true, maxMemoryUsageInMB: 1024 }); return { w: im.width, h: im.height, d: new Uint8ClampedArray(im.data.buffer) } }
  const img = await loadImage(fs.readFileSync(dosya)); const c = createCanvas(img.width, img.height); const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0)
  return { w: img.width, h: img.height, d: new Uint8ClampedArray(ctx.getImageData(0, 0, img.width, img.height).data) }
}

/** Leak check of one outbound picture: identity labels, long digit runs or e-mails visible to OCR = leak. */
const ETIKET_SIZINTI = /\b(t\.?\s?c\.?\s?kimlik|ad[iı][\s-]*soyad|kimlik\s*no|passport|name\s*\/?\s*surname|date\s*of\s*birth|do[gğ]um\s*tarih|gsm|e-?posta|e-?mail|ev\s*adres|address|mobile\s*phone)/i
async function sizintiVarMi(b64: string): Promise<boolean> {
  const img = await loadImage(Buffer.from(b64, 'base64'))
  const c = createCanvas(img.width, img.height); const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0)
  const r: Rgba = { w: img.width, h: img.height, d: new Uint8ClampedArray(ctx.getImageData(0, 0, img.width, img.height).data) }
  const o = await ocr(r)
  if (!o) return false
  const metin = o.map((l) => l.kelimeler.filter((w) => w.conf >= 55).map((w) => w.text).join(' ')).join('\n')
  return ETIKET_SIZINTI.test(metin) || /\d[\d\s.\-/]{8,}\d/.test(metin) || /\S+@\S+\.\S+/.test(metin)
}

/** Token estimate of one live call (images: Anthropic's w·h/750 after the ≤1568 px / 1.15 MP resize; text: chars/3.5). */
const jeton = { girdi: 0, cikti: 0, cagri: 0 }
async function gorselJetonu(b64: string): Promise<number> {
  const img = await loadImage(Buffer.from(b64, 'base64'))
  let w = img.width, h = img.height
  const o = Math.min(1, 1568 / Math.max(w, h), Math.sqrt(1_150_000 / (w * h)))
  w *= o; h *= o
  return Math.ceil((w * h) / 750)
}
async function jetonSay(sistem: string, parcalar: { tur: string; metin?: string; gorsel?: { base64: string } }[] | string, y: unknown) {
  let g = sistem.length / 3.5
  if (typeof parcalar === 'string') g += parcalar.length / 3.5
  else for (const p of parcalar) g += p.tur === 'metin' ? (p.metin || '').length / 3.5 : await gorselJetonu(p.gorsel!.base64)
  jeton.girdi += Math.ceil(g); jeton.cikti += Math.ceil(JSON.stringify(y ?? '').length / 3); jeton.cagri++
}

function modelKapisi(sayfaAdi: string): ModelKapisi | null {
  // the replay key covers the system prompt and every input (images by their first bytes), so a prompt change re-asks
  const anahtar = (etiket: string, sistem: string, girdi: unknown) => `${sayfaAdi}-${etiket}-${crypto.createHash('sha256').update(JSON.stringify([sistem, girdi])).digest('hex').slice(0, 16)}.json`
  const gorselGirdi = (o: Parameters<ModelKapisi['gorselJson']>[0]) => o.parcalar.map((p) => (p.tur === 'metin' ? p.metin : p.gorsel.base64.slice(0, 64) + p.gorsel.base64.length))
  const kayittan = (f: string) => (kayitKlasoru && fs.existsSync(path.join(kayitKlasoru, f)) ? JSON.parse(fs.readFileSync(path.join(kayitKlasoru, f), 'utf8')) : undefined)
  const kaydet = (f: string, y: unknown) => { if (kayitKlasoru) { fs.mkdirSync(kayitKlasoru, { recursive: true }); fs.writeFileSync(path.join(kayitKlasoru, f), JSON.stringify(y)) } }
  if (modelTuru === 'kayit') {
    if (!kayitKlasoru) return null
    const oku = (f: string) => { const y = kayittan(f); if (y === undefined) throw new Error('kayıt yok'); return y }
    return { async gorselJson(o) { return oku(anahtar(o.etiket, o.sistem, gorselGirdi(o))) }, async metinJson(o) { return oku(anahtar(o.etiket, o.sistem, o.mesaj)) } }
  }
  if (modelTuru !== 'canli' && modelTuru !== 'karma') return null
  // the production path (lib/ai/cagir.ts → central model policy); answers recorded for replay. karma = replay what was
  // already asked with the same prompt and input, ask the model only for the rest (cheap re-runs while iterating)
  const sor = async (etiket: string, f: string, cagir: () => Promise<unknown>, say: (y: unknown) => Promise<void>) => {
    if (modelTuru === 'karma') { const y = kayittan(f); if (y !== undefined) return y }
    let y: unknown
    try { y = await cagir() } catch (e) { console.error(`[el-notu] ${sayfaAdi} ${etiket} call failed: ${e instanceof Error ? e.message.slice(0, 160) : 'error'}`); throw e }
    await say(y)
    kaydet(f, y)
    return y
  }
  return {
    async gorselJson(o) {
      const { elNotuModeli } = await import('../lib/elNotu/model')
      return sor(o.etiket, anahtar(o.etiket, o.sistem, gorselGirdi(o)), () => elNotuModeli({ doctorId: null }).gorselJson(o), (y) => jetonSay(o.sistem, o.parcalar as never, y))
    },
    async metinJson(o) {
      const { elNotuModeli } = await import('../lib/elNotu/model')
      return sor(o.etiket, anahtar(o.etiket, o.sistem, o.mesaj), () => elNotuModeli({ doctorId: null }).metinJson(o), (y) => jetonSay(o.sistem, o.mesaj, y))
    },
  }
}

const icerir = (metin: string, aday: string) => {
  const k = kelimeAnahtari(aday)
  if (!k) return false
  // a one- or two-letter key ("N", "E", "K", "SD") must be a whole token — as a substring it would match almost any text
  if (k.length <= 2) return metin.split(/[^\p{L}\p{N}]+/u).some((w) => kelimeAnahtari(w) === k)
  if (kelimeAnahtari(metin).includes(k)) return true
  return metin.split(/[^\p{L}\p{N},.\-]+/u).some((w) => kelimeAnahtari(w).length >= 3 && k.length >= 4 && benzerlik(w, aday) >= 0.8)
}

async function ana() {
  const yalniz = arg('sayfa')?.split(',')
  const dosyalar = fs.readdirSync(klasor!).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort()
  const sablonDosyasi = arg('sablon')
  const sablonlar: Sablon[] = []
  if (sablonDosyasi) {
    const s = JSON.parse(fs.readFileSync(sablonDosyasi, 'utf8')) as { sablonKaynagi: string; sablon: Sablon }
    const kaynak = dosyalar.find((f) => f.startsWith(s.sablonKaynagi))
    if (kaynak) {
      // the doctor marks the form once: its fingerprint comes from that first page
      const on = sayfayiHazirla(await raster(path.join(klasor!, kaynak)), { enBoy: s.sablon.enBoy })
      sablonlar.push({ ...s.sablon, parmakIzi: parmakIzi(on.normal, on.renkli) })
    }
  }
  if (bayrak('serbest')) sablonlar.push({ id: 'serbest', ad: 'Düz kağıt', tur: 'serbest', brans: null, enBoy: 0.707, baslikBolgeleri: [], cizimBolgeleri: [], parmakIzi: null })
  const tohum = tohumlarTr('kulak-burun-bogaz')
  const sozluk = sozlukKur([], tohum.brans, tohum.genel)
  // same "is this a word, not an abbreviation" test as production (lib/elNotu/okumaServisi.ts) with an empty vocabulary
  const anlamSozcukleri = new Set(sozluk.girdiler.flatMap((x) => x.anlam.split(/\s+/)).map(kelimeAnahtari))
  const satirlar: Record<string, unknown>[] = []
  const toplam = { sayfa: 0, gonderilen: 0, sizinti: 0, gercek: 0, bulunan: 0, dogrulamada: 0, adayda: 0, kacan: 0, uydurma: 0, dogrula: 0, okunanSayfa: 0 }
  for (const f of dosyalar) {
    if (yalniz && !yalniz.some((y) => f.startsWith(y))) continue
    const ad = f.replace(/-image\.(jpe?g|png)$/i, '').replace(/\.(jpe?g|png)$/i, '')
    const gt = dogruluk.sayfalar[ad]
    const t0 = Date.now()
    const sonuc = await sayfaPaketiHazirla({ foto: await raster(path.join(klasor!, f)), sayfa: 1, sablonlar, serbestBeyan: bayrak('serbest'), tuval, ocr })
    toplam.sayfa++
    const satir: Record<string, unknown> = { sayfa: ad, tur: gt?.tur ?? '?', durum: sonuc.durum, ms: Date.now() - t0 }
    if (sonuc.durum === 'hazir') {
      toplam.gonderilen++
      const resimler = [sonuc.maskeliSayfa.base64, ...sonuc.paket.satirlar.flatMap((l) => [l.gorselA.base64, l.gorselB.base64]), ...sonuc.paket.bolgeler.map((b) => b.gorsel?.base64 || '').filter(Boolean)]
      let sizinti = 0
      for (const r of resimler) if (await sizintiVarMi(r)) sizinti++
      toplam.sizinti += sizinti
      Object.assign(satir, { gizlilik: sonuc.gizlilik.neden, kutu: sonuc.gizlilik.kutular.length, sablon: Math.round(sonuc.sablonSkoru * 100) / 100, satir: sonuc.paket.satirlar.length, yerlesim: sonuc.yontem, bolge: sonuc.paket.bolgeler.filter((b) => b.murekkep >= 0.0004).length, sizinti })
      if (cikti) { fs.mkdirSync(cikti, { recursive: true }); fs.writeFileSync(path.join(cikti, `${ad}-maskeli.jpg`), Buffer.from(sonuc.maskeliSayfa.base64, 'base64')) }
      const model = modelKapisi(ad)
      if (model && gt) {
        try {
          const s = await sayfayiOku(sonuc.paket, { bransAdi: 'Kulak Burun Boğaz', dil: EL_NOTU_TR.dil, sozluk, hafiza: [], dagarcik: new Map(), sorulmusKisaltmalar: new Set(), sozcukMu: (t) => anlamSozcukleri.has(kelimeAnahtari(t)), sayfaGorseli: sonuc.maskeliSayfa }, model)
          const metin = kaynakMetni([s], EL_NOTU_TR.dil, (id) => sonuc.sablon?.cizimBolgeleri.find((b) => b.id === id)?.etiket || id)
          const kesin = metin.replace(/⟦[^⟧]*⟧/g, ' ')
          const bekleyen = [...metin.matchAll(/⟦[^|⟧]*\|([^⟧]*)⟧/g)].map((m) => m[1]).join(' ')
          // the tappable candidates of every Doğrula question (both reads + their alternatives, DogrulaPaneli shows them)
          const adaylar = s.dogrula.flatMap((d) => d.adaylar).join(' ')
          let bulunan = 0, dogrulamada = 0, adayda = 0, kacan = 0
          for (const g of gt.gercekler) {
            const kesinde = g.anahtarlar.every((grup) => grup.some((a) => icerir(kesin, a)))
            const toplamda = g.anahtarlar.every((grup) => grup.some((a) => icerir(`${kesin} ${bekleyen}`, a)))
            const secenekte = g.anahtarlar.every((grup) => grup.some((a) => icerir(`${kesin} ${bekleyen} ${adaylar}`, a)))
            if (kesinde) bulunan++; else if (toplamda) dogrulamada++; else if (secenekte) adayda++; else kacan++
          }
          // invented facts: content words of the accepted text that neither the page's ground truth nor the lexicon carries
          const izinli = new Set([...gt.gercekler.flatMap((g) => `${g.metin} ${g.anahtarlar.flat().join(' ')}`.split(/[^\p{L}\p{N}]+/u)), ...(gt.kelimeler || '').split(/[^\p{L}\p{N}]+/u), ...sozluk.girdiler.flatMap((x) => `${x.kisaltma} ${x.anlam}`.split(/[^\p{L}\p{N}]+/u)), ...EL_NOTU_TR.dil.bagSozcukleri,
            // the source text's own structure: the drawing heading, sides and region labels come from the template, not the model
            ...`${EL_NOTU_TR.dil.cizimBasligi} ${Object.values(EL_NOTU_TR.dil.taraf).join(' ')} ${(sonuc.sablon?.cizimBolgeleri || []).map((b) => b.etiket).join(' ')}`.split(/[^\p{L}\p{N}]+/u)].map(kelimeAnahtari).filter(Boolean))
          const literal = new Set(s.satirlar.flatMap((l) => l.kelimeler.map((k) => kelimeAnahtari(k.metin))))
          const uydurma = kesin.split(/[^\p{L}\p{N}]+/u).filter((w) => {
            const k = kelimeAnahtari(w)
            if (!k || k.length < 4 || /^\d/.test(k) || izinli.has(k) || literal.has(k)) return false
            return ![...izinli, ...literal].some((z) => z.length >= 4 && benzerlik(z, k) >= 0.75)
          })
          Object.assign(satir, { gercek: gt.gercekler.length, bulunan, dogrulamada, adayda, kacan, dogrula: s.dogrula.length, uydurmaAday: uydurma.length, okumaCagrisi: s.okumaSayisi })
          Object.assign(toplam, { gercek: toplam.gercek + gt.gercekler.length, bulunan: toplam.bulunan + bulunan, dogrulamada: toplam.dogrulamada + dogrulamada, adayda: toplam.adayda + adayda, kacan: toplam.kacan + kacan, uydurma: toplam.uydurma + uydurma.length, dogrula: toplam.dogrula + s.dogrula.length, okunanSayfa: toplam.okunanSayfa + 1 })
          if (cikti) fs.writeFileSync(path.join(cikti, `${ad}-okuma.txt`), metin)
        } catch (e) { satir.okumaHatasi = e instanceof Error ? e.message : 'hata' }
      }
    } else if (sonuc.durum === 'baslik_gerekli' || sonuc.durum === 'gizlenemedi') satir.gizlilik = sonuc.gizlilik.durum
    else if (sonuc.durum === 'tekrar') satir.kalite = sonuc.kalite.nedenler.join(',')
    satirlar.push(satir)
    console.log(JSON.stringify(satir))
  }
  const rapor = {
    tarih: new Date().toISOString(), model: modelTuru, sablon: sablonlar.map((s) => s.id),
    gizlilik: { sayfa: toplam.sayfa, gonderilen: toplam.gonderilen, sizintiResim: toplam.sizinti },
    okuma: toplam.okunanSayfa ? {
      sayfa: toplam.okunanSayfa, gercek: toplam.gercek,
      dogrulukKesin: Math.round((toplam.bulunan / toplam.gercek) * 1000) / 10,
      dogrulukDogrulamaIle: Math.round(((toplam.bulunan + toplam.dogrulamada) / toplam.gercek) * 1000) / 10,
      dogrulukAdayIle: Math.round(((toplam.bulunan + toplam.dogrulamada + toplam.adayda) / toplam.gercek) * 1000) / 10,
      korumaliGercek: dogruluk.sayfalar ? Object.values(dogruluk.sayfalar).flatMap((p) => p.gercekler).filter((g) => g.korumali).length : 0,
      kacan: toplam.kacan, uydurmaAday: toplam.uydurma, dogrulaSayfaBasina: Math.round((toplam.dogrula / toplam.okunanSayfa) * 10) / 10,
    } : 'ölçülmedi — model yok (OPENROUTER_API_KEY / ANTHROPIC_API_KEY ortamda değil, --model kayit için kayıt yok)',
    sayfalar: satirlar,
    ...(jeton.cagri ? { jetonTahmini: { ...jeton, not: 'estimate: images w·h/750 after resize, text chars/3.5, output JSON chars/3; prompt caching ignored' } } : {}),
  }
  console.log(JSON.stringify({ ozet: { gizlilik: rapor.gizlilik, okuma: rapor.okuma, jeton: jeton.cagri ? jeton : undefined } }, null, 2))
  if (cikti) fs.writeFileSync(path.join(cikti, 'rapor.json'), JSON.stringify(rapor, null, 2))
  if (isci) await isci.terminate()
  if (toplam.sizinti > 0) process.exitCode = 1
}

void ana()
