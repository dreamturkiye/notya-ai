/**
 * EKO-ASE — ekokardiyografi rapor metninden erişkin ölçüm dökümü.
 *
 * Girdi: metin katmanı olan TTE/TEE raporu (PDF). Durağan kare ve sine döngüsünden
 * EF, kapak alanı veya gradyan üretilmez. EchoNet-Dynamic, PanEcho, EchoCLIP ve
 * EchoJEPA ağırlıkları ticari ürüne girmez (bkz. docs/README_BELGELER.md).
 *
 * Bantlar (erişkin, ≥16 yaş): Lang ve ark. 2015 (EF, duvar, LAVI), TAPSE <17 mm,
 * Nagueh 2016 ortalama E/e′ >14, PASP ≥40 mmHg, ESC ileri aort darlığı
 * (alan ≤1,0 cm² veya ortalama gradyan ≥40 mmHg veya Vmax ≥4 m/s).
 * Tanı ve tedavi kararı hekime aittir. Bu motor motor_kayit satırı değildir:
 * ağırlık, sha256 ve ONNX yoktur; doğrulama yayınlanmış eşiktir.
 */
import { BULGULAR, gecerliKod, type BulguKodu } from './ontoloji'
import { bant, capHesapla } from './fusion'
import type { BelgeRaporu, MotorCiktisi, Tani } from './types'

export const EKO_ASE_MOTOR = 'eko-ase'

export type EkoGirdiTuru = 'pdf' | 'goruntu' | 'video'

const P_OLCUM = 0.88
const P_ILERI = 0.9
const P_TAMPONAD = 0.95
const YETISKIN_AY = 16 * 12

type Olcum = {
  satirlar: string[]
  etiketler: { kod: BulguKodu; p: number }[]
  sayac: number
  bant: boolean
  girdi: string
  tekAs: boolean
}

function kucuk(s: string): string {
  return s
    .replace(/\u00a0/g, ' ')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/Ş/g, 'ş')
    .replace(/Ğ/g, 'ğ')
    .replace(/Ü/g, 'ü')
    .replace(/Ö/g, 'ö')
    .replace(/Ç/g, 'ç')
    .toLowerCase()
    .replace(/[ \t]+/g, ' ')
}

function sayi(ham: string | undefined): number | null {
  if (!ham) return null
  const n = Number(ham.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function trSayi(n: number): string {
  const r = Math.round(n * 10) / 10
  const s = Number.isInteger(r) ? String(r) : r.toFixed(1)
  return s.replace('.', ',')
}

function cinsiyetAd(c: 'K' | 'E' | null | undefined): string {
  if (c === 'E') return 'erkek'
  if (c === 'K') return 'kadın'
  return 'cinsiyet yazılmamış'
}

/** Duvar kalınlığı: ≥5 birimsiz değer mm kabul edilir. */
function cmYap(n: number, birim?: string): number {
  if (birim === 'mm') return n / 10
  if (birim === 'cm') return n
  return n >= 5 ? n / 10 : n
}

function tapseMm(n: number, birim?: string): number {
  if (birim === 'cm') return n * 10
  if (birim === 'mm') return n
  return n < 5 ? n * 10 : n
}

export function ekoMetniMi(metin: string | null | undefined): boolean {
  const t = kucuk(metin || '')
  return /ekokardiyograf|transtorasik|trans[öo]zofaj|\btapse\b|perikardiyal ef|ejeksiyon fraksiyon|\blvef\b|\btte\b|\btee\b/.test(t)
}

function fetalMi(t: string): boolean {
  return /fetal\s*(?:eko|ekokardiyograf)|fet[üu]s(?:te|un|ün)?\b|gebeli[ğg]in\s+\d+\s*\.?\s*hafta|gebe hasta|obstetrik eko/.test(t)
}

function ekle(o: Olcum, kod: BulguKodu, p: number) {
  if (!o.etiketler.some((e) => e.kod === kod)) o.etiketler.push({ kod, p })
}

function efOku(t: string): { alt: number; basili: string } | null {
  const re = /(?:lvef|ejeksiyon fraksiyonu|ejection fraction|(?<![a-z])ef)(?!\w)\s*(?:\([^)]{0,48}\))?\s*[:=]?\s*%?\s*(\d{1,2}(?:[.,]\d+)?)(?:\s*[-–—]\s*%?\s*(\d{1,2}(?:[.,]\d+)?))?\s*%?/gi
  let secim: { alt: number; basili: string; tercih: boolean } | null = null
  for (const m of t.matchAll(re)) {
    const i = m.index ?? 0
    const once = t.slice(Math.max(0, i - 36), i)
    if (/normal|referans|aral[ıi]k/.test(once)) continue
    const a = sayi(m[1])
    const b = m[2] ? sayi(m[2]) : null
    if (a === null || a < 10 || a > 90) continue
    if (b !== null && (b < 10 || b > 90)) continue
    const alt = b !== null ? Math.min(a, b) : a
    const basili = b !== null ? `${trSayi(Math.min(a, b))}-${trSayi(Math.max(a, b))}` : trSayi(a)
    const tercih = /simpson|lvef/.test(once + m[0].toLowerCase())
    if (!secim || (tercih && !secim.tercih)) secim = { alt, basili, tercih }
  }
  return secim ? { alt: secim.alt, basili: secim.basili } : null
}

function duvarOku(t: string, re: RegExp): number | null {
  const m = re.exec(t)
  if (!m) return null
  const n = sayi(m[1])
  if (n === null || n <= 0 || n > 40) return null
  return cmYap(n, m[2]?.toLowerCase())
}

function laviOku(t: string): number | null {
  const m = /(?:lavi|la vol[üu]m indeksi|sol atriyum vol[üu]m indeksi|left atrial volume index)\s*(?:\([^)]{0,24}\))?\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i.exec(t)
  const n = sayi(m?.[1])
  if (n === null || n < 5 || n > 200) return null
  return n
}

function tapseOku(t: string): number | null {
  const m = /tapse\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(mm|cm)?/i.exec(t)
  const n = sayi(m?.[1])
  if (n === null || n <= 0 || n > 50) return null
  return tapseMm(n, m?.[2]?.toLowerCase())
}

function paspOku(t: string): number | null {
  const m = /(?:pasp|spap|rvsp|pulmoner arter sistolik(?: bas[ıi]nc[ıi])?)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i.exec(t)
  const n = sayi(m?.[1])
  if (n === null || n < 8 || n > 150) return null
  return n
}

function eeOku(t: string): number | null {
  const m = /(?:ortalama\s+)?e\s*\/\s*e\s*['′ʼ]?\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i.exec(t)
  const n = sayi(m?.[1])
  if (n === null || n < 1 || n > 60) return null
  return n
}

function aortBolumu(t: string): string {
  const m = /aort\s*kapak|aort\s*darl|aort\s*stenoz|aortik\s*stenoz/.exec(t)
  if (!m || m.index === undefined) return ''
  const rest = t.slice(m.index, m.index + 700)
  const bit = rest.slice(20).search(/mitral|trik[üu]sp|pulmoner kapak|perikard/)
  return bit === -1 ? rest : rest.slice(0, 20 + bit)
}

type AsSinif = 'uyumlu' | 'tek' | 'uyumsuz' | 'bilgi'

function asOku(t: string): { sinif: AsSinif; not: string } | null {
  const bolum = aortBolumu(t)
  if (!bolum) return null
  const alanM = /(?:ava|kapak alan[ıi]|aort kapak alan[ıi]|alan)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i.exec(bolum)
  const gradM = /(?:ortalama|mean|ort\.?)\s*grad\w*\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i.exec(bolum)
  const vmaxM = /(?:v\s*max|maks(?:imum)?\s*h[ıi]z|pik\s*h[ıi]z|peak\s*velocity)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i.exec(bolum)
  const alan = sayi(alanM?.[1])
  const grad = sayi(gradM?.[1])
  const vmax = sayi(vmaxM?.[1])
  const parca: string[] = []
  const alanOk = alan !== null && alan > 0 && alan <= 6
  const gradOk = grad !== null && grad > 0 && grad < 200
  const vmaxOk = vmax !== null && vmax > 0 && vmax < 10
  if (alanOk) parca.push(`alan ${trSayi(alan!)} cm²`)
  if (gradOk) parca.push(`ortalama gradyan ${trSayi(grad!)} mmHg`)
  if (vmaxOk) parca.push(`Vmax ${trSayi(vmax!)} m/s`)
  if (!parca.length) return null
  const sAlan = alanOk && alan! <= 1
  const sGrad = gradOk && grad! >= 40
  const sVmax = vmaxOk && vmax! >= 4
  const ciddiN = [sAlan, sGrad, sVmax].filter(Boolean).length
  const gradDusuk = !gradOk || grad! < 40
  const vmaxDusuk = !vmaxOk || vmax! < 4
  // Alan ileri, basılı gradyan/Vmax ise ileri değil: düşük akım / uyumsuz darlık.
  const uyumsuz = Boolean(sAlan && (gradOk || vmaxOk) && gradDusuk && vmaxDusuk)
  let sinif: AsSinif = 'bilgi'
  if (uyumsuz) sinif = 'uyumsuz'
  else if (ciddiN >= 2) sinif = 'uyumlu'
  else if (ciddiN === 1) sinif = 'tek'
  return { sinif, not: parca.join(', ') }
}

function mmYap(n: number, birim?: string): number {
  if (birim === 'cm') return n * 10
  if (birim === 'mm') return n
  return n < 8 ? n * 10 : n
}

function olcuMm(t: string, re: RegExp): number | null {
  const m = re.exec(t)
  const n = sayi(m?.[1])
  if (n === null || n <= 0 || n > 80) return null
  return mmYap(n, m?.[2]?.toLowerCase())
}

function ifadeVar(t: string, re: RegExp): boolean {
  const bayrak = new RegExp(re.source, 'gi')
  for (const m of t.matchAll(bayrak)) {
    const i = m.index ?? 0
    const w = `${t.slice(Math.max(0, i - 18), i)}${t.slice(i, i + m[0].length + 36).split(/[.\n]/)[0]}`
    if (/izlenmedi|saptanmad|yoktur|\byok\b|normal|değil|degil/.test(w)) continue
    return true
  }
  return false
}

function kapakDerece(t: string, kapak: RegExp): 'ileri' | 'orta' | 'hafif' | null {
  const bayrak = new RegExp(kapak.source, 'gi')
  for (const m of t.matchAll(bayrak)) {
    const i = m.index ?? 0
    const hamOnce = t.slice(Math.max(0, i - 18), i)
    const satir = hamOnce.lastIndexOf('\n')
    const oncesi = (satir >= 0 ? hamOnce.slice(satir + 1) : hamOnce).replace(/ileri\s+derecede\s+sol/g, '')
    const sonrasi = t.slice(i, i + m[0].length + 40).split(/[.\n]/)[0].replace(/ileri\s+derecede\s+sol/g, '')
    const pencere = `${oncesi}${sonrasi}`
    if (CIDDI.test(pencere) && !DEGIL.test(pencere)) return 'ileri'
    if (/\borta\b|moderate|2\s*\/\s*4/.test(pencere)) return 'orta'
    if (/hafif|mild|eser|trace|1\s*\/\s*4/.test(pencere)) return 'hafif'
  }
  return null
}

const CIDDI = /a[ğg][ıi]r|severe|ciddi|3\s*\/\s*4|4\s*\/\s*4|grade\s*[34]\b|[34]\s*\+|\bileri\b/
const DEGIL = /hafif|orta|mild|moderate|eser|trace|1\s*\/\s*4|2\s*\/\s*4|grade\s*[12]\b|[12]\s*\+/

function tamponadVar(t: string): boolean {
  const i = t.search(/tamponad/)
  if (i < 0) return false
  const w = t.slice(i, i + 48)
  return !/izlenmedi|saptanmad|yoktur|\byok\b/.test(w)
}

function efuzyonSinif(t: string): 'yok' | 'var' {
  const re = /perikard[a-zçğıöşü ]{0,24}ef[üu]zyon|ef[üu]zyon[a-zçğıöşü ]{0,20}perikard|pericardial effusion/gi
  let varMi = false
  for (const m of t.matchAll(re)) {
    const i = m.index ?? 0
    const oncesi = t.slice(Math.max(0, i - 24), i)
    const sonrasi = t.slice(i, i + m[0].length + 42)
    if (/izlenmedi|saptanmad|yoktur|\byok\b|normal|izlenmem|değil|degil/.test(sonrasi)) continue
    if (/eser|trace|minimal|fizyolojik|[öo]nemsiz/.test(oncesi + sonrasi)) continue
    varMi = true
  }
  return varMi ? 'var' : 'yok'
}

function bosMotor(girdi: string, rapor: string, kalite: MotorCiktisi['kalite'] = 'orta'): MotorCiktisi {
  return {
    motor: EKO_ASE_MOTOR,
    surum: 'ase-2015',
    tier: 'B',
    dogrulanmis: false,
    labels: [],
    metrikler: { olcumSayisi: 0, bantUygulandi: 0, girdi, satirlar: '' },
    rapor,
    kalite,
    modaliteTahmini: 'eko',
  }
}

function motorYap(o: Olcum, rapor: string): MotorCiktisi {
  return {
    motor: EKO_ASE_MOTOR,
    surum: 'ase-2015',
    tier: 'B',
    dogrulanmis: false,
    labels: o.etiketler.map((e) => ({ kod: e.kod, p: e.p })),
    metrikler: {
      olcumSayisi: o.sayac,
      bantUygulandi: o.bant ? 1 : 0,
      girdi: o.girdi,
      satirlar: o.satirlar.join('\n'),
      tekAs: o.tekAs ? 1 : 0,
    },
    rapor,
    kalite: 'iyi',
    modaliteTahmini: 'eko',
  }
}

/**
 * Yayınlanmış erişkin eşiklerini rapor metnine uygular.
 * `dogrulanmis` burada false kalır; analiz rotası ölçüm varsa açar
 * (istemci motor_kayit üzerinden bunu iddia edemez).
 */
export function ekoAseDegerlendir(opts: {
  metin?: string | null
  yasAy?: number | null
  cinsiyet?: 'K' | 'E' | null
  girdi: EkoGirdiTuru
}): MotorCiktisi {
  if (opts.girdi === 'video') {
    return bosMotor('video', 'Sine döngüsünden EF, kapak alanı veya gradyan üretilmez. Metin katmanı olan ekokardiyografi raporu PDF’ini veya bir JPEG kare ekleyin.', 'dusuk')
  }
  if (opts.girdi === 'goruntu' || !(opts.metin || '').trim()) {
    return bosMotor('goruntu', 'Durağan kareden sayısal EF üretilmez. Metin katmanı olan ekokardiyografi raporu PDF’ini ekleyin; makine ölçümleri o rapordadır.')
  }
  const t = kucuk(opts.metin || '')
  if (fetalMi(t)) {
    return bosMotor('fetal', 'Fetal veya gebelik ekokardiyografisi erişkin TTE bantlarıyla değerlendirilmez. Sayı üretilmedi.')
  }
  if (!ekoMetniMi(t)) {
    return bosMotor('ekoyok', 'Metin ekokardiyografi raporu gibi görünmüyor. Transtorasik veya transözofageal eko raporunun metin katmanını ekleyin.')
  }

  const cocuk = typeof opts.yasAy === 'number' && opts.yasAy < YETISKIN_AY
  const o: Olcum = { satirlar: [], etiketler: [], sayac: 0, bant: !cocuk, girdi: cocuk ? 'cocuk' : 'pdf', tekAs: false }
  const cins = cinsiyetAd(opts.cinsiyet)

  const lv: string[] = []
  const diast: string[] = []
  const sag: string[] = []
  const kapak: string[] = []
  const perikard: string[] = []
  const yorum: string[] = []
  let efSinif = ''

  const ef = efOku(t)
  if (ef) {
    o.sayac++
    efSinif = 'bant uygulanmadı'
    if (!cocuk) {
      if (ef.alt < 30) { ekle(o, 'ECHO.EF_SEVERE', P_ILERI); efSinif = 'ileri düşük' }
      else if (opts.cinsiyet === 'E' && ef.alt < 52) { ekle(o, 'ECHO.EF_LOW', P_OLCUM); efSinif = 'düşük' }
      else if (opts.cinsiyet === 'K' && ef.alt < 54) { ekle(o, 'ECHO.EF_LOW', P_OLCUM); efSinif = 'düşük' }
      else if (!opts.cinsiyet && ef.alt < 50) { ekle(o, 'ECHO.EF_LOW', P_OLCUM); efSinif = 'düşük' }
      else if (opts.cinsiyet === 'E' || opts.cinsiyet === 'K' || ef.alt >= 54) efSinif = 'korunmuş'
      else efSinif = 'cinsiyet olmadan düşük denmedi'
    }
    lv.push(`EF %${ef.basili} (${cins}; ${efSinif})`)
  }

  const edd = olcuMm(t, /(?:lvedd|lvdd|diyastol sonu (?:çap|cap)|(?<![a-z])edd)(?!\w)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(mm|cm)?/i)
  if (edd !== null) {
    o.sayac++
    const esik = opts.cinsiyet === 'K' ? 52 : 58
    const dilate = !cocuk && edd > esik
    if (dilate) ekle(o, 'ECHO.LV_DIL', P_OLCUM)
    lv.push(`LVEDD ${trSayi(edd)} mm${dilate ? ` (eşik >${esik})` : ''}`)
  }

  const ivs = duvarOku(t, /(?:ivsd?|interventrik[üu]ler septum|septum kal[ıi]nl[ıi][ğg][ıi])\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(mm|cm)?/i)
  const pw = duvarOku(t, /(?:pwd?|arka duvar|posterior wall|(?<![a-z])pw)(?!\w)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(mm|cm)?/i)
  if (ivs !== null) o.sayac++
  if (pw !== null) o.sayac++
  if (ivs !== null || pw !== null) {
    const esik = opts.cinsiyet === 'K' ? 0.9 : 1.0
    const lvh = !cocuk && ((ivs !== null && ivs > esik) || (pw !== null && pw > esik))
    if (lvh) ekle(o, 'ECHO.LVH', P_OLCUM)
    const parca = [ivs !== null ? `IVS ${trSayi(ivs)} cm` : '', pw !== null ? `PW ${trSayi(pw)} cm` : ''].filter(Boolean).join(', ')
    lv.push(`${parca} (${cins}; eşik >${trSayi(esik)} cm${lvh ? '; hipertrofi' : ''})`)
  }
  if (!cocuk && ifadeVar(t, /hipokinezi|akinezi|diskinezi|duvar hareket bozuklu/)) {
    ekle(o, 'ECHO.WMA', P_OLCUM)
    lv.push('Duvar hareket bozukluğu ifadesi var')
  }

  const lavi = laviOku(t)
  if (lavi !== null) {
    o.sayac++
    const genis = !cocuk && lavi > 34
    if (genis) ekle(o, 'ECHO.LAE', P_OLCUM)
    diast.push(`LAVI ${trSayi(lavi)} mL/m²${genis ? ' (eşik >34)' : ''}`)
  }
  const ea = (() => {
    const m = /e\s*\/\s*a\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i.exec(t)
    const n = sayi(m?.[1])
    return n !== null && n > 0 && n < 6 ? n : null
  })()
  if (ea !== null) { o.sayac++; diast.push(`E/A ${trSayi(ea)}`) }
  const ee = eeOku(t)
  if (ee !== null) {
    o.sayac++
    const yuksek = !cocuk && ee > 14
    if (yuksek) ekle(o, 'ECHO.DIASTOLIK', P_OLCUM)
    diast.push(`Ortalama E/e′ ${trSayi(ee)}${yuksek ? ' (eşik >14)' : ''}`)
  }

  const tapse = tapseOku(t)
  if (tapse !== null) {
    o.sayac++
    const dusuk = !cocuk && tapse < 17
    if (dusuk) ekle(o, 'ECHO.TAPSE_LOW', P_OLCUM)
    sag.push(`TAPSE ${trSayi(tapse)} mm${dusuk ? ' (eşik <17)' : ''}`)
  }
  const pasp = paspOku(t)
  if (pasp !== null) {
    o.sayac++
    const yuksek = !cocuk && pasp >= 40
    if (yuksek) ekle(o, 'ECHO.PH', P_OLCUM)
    sag.push(`PASP ${trSayi(pasp)} mmHg${yuksek ? ' (eşik ≥40)' : ''}`)
  }
  const trv = (() => {
    const m = /(?:trv|tr h[ıi]z[ıi]|reg[üu]rjitan h[ıi]z)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(m\/s|cm\/s)?/i.exec(t)
    const n = sayi(m?.[1])
    if (n === null || n <= 0 || n > 600) return null
    const birim = m?.[2]?.toLowerCase()
    return birim === 'cm/s' || (!birim && n > 10) ? n / 100 : n
  })()
  if (trv !== null) {
    o.sayac++
    sag.push(`TR hızı ${trSayi(trv)} m/s`)
    if (!cocuk && trv >= 3.4 && pasp === null) ekle(o, 'ECHO.PH', P_OLCUM)
  }
  const ivc = olcuMm(t, /(?:ivc|inferior vena kava|(?<![a-z])vci)(?!\w)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(mm|cm)?/i)
  if (ivc !== null) {
    o.sayac++
    const genis = ivc > 21
    const pletora = genis && /kollaps[^\n]{0,24}(?:az|<%?\s*50|yok)|pletorik/.test(t)
    if (!cocuk && pletora) ekle(o, 'ECHO.IVC', P_OLCUM)
    sag.push(`IVC ${trSayi(ivc)} mm${pletora ? ' (pletorik)' : ''}`)
  }

  const as = asOku(t)
  if (as) {
    o.sayac++
    let ek = ''
    if (!cocuk && as.sinif === 'uyumlu') { ekle(o, 'ECHO.AS_SEVERE', P_ILERI); ek = ' — uyumlu ileri darlık' }
    else if (!cocuk && as.sinif === 'tek') { ekle(o, 'ECHO.AS_SEVERE', P_ILERI); o.tekAs = true; ek = ' — tek ölçütle ileri darlık' }
    else if (!cocuk && as.sinif === 'uyumsuz') { ekle(o, 'ECHO.AS_LOWFLOW', P_ILERI); ek = ' — düşük gradyanlı, ileri denmedi' }
    kapak.push(`Aort kapak: ${as.not}${ek}`)
  }
  const mva = (() => {
    const bolumM = /mitral\s*darl|mitral\s*stenoz/.exec(t)
    if (!bolumM) return null
    const bolum = t.slice(bolumM.index, bolumM.index + 280)
    const m = /(?:mva|mitral kapak alan[ıi]|kapak alan[ıi])\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i.exec(bolum)
    const n = sayi(m?.[1])
    return n !== null && n > 0 && n <= 6 ? n : null
  })()
  if (mva !== null) {
    o.sayac++
    const ileri = !cocuk && mva <= 1.5
    if (ileri) ekle(o, 'ECHO.MS_SEVERE', P_ILERI)
    kapak.push(`Mitral darlık alanı ${trSayi(mva)} cm²${ileri ? ' (eşik ≤1,5)' : ''}`)
  }
  const my = kapakDerece(t, /mitral\s*(?:kapak\s*)?yetmezli(?:k|[ğg]i)|mitral\s*yetersizli(?:k|[ğg]i)|mitral\s*reg[üu]rg|(?<![a-z])my(?!\w)/)
  const ay = kapakDerece(t, /aort(?:ik)?\s*yetmezli(?:k|[ğg]i)|aort(?:ik)?\s*yetersizli(?:k|[ğg]i)|aort(?:ik)?\s*reg[üu]rg/)
  const ty = kapakDerece(t, /trik[üu]spid\s*yetmezli(?:k|[ğg]i)|trik[üu]spid\s*yetersizli(?:k|[ğg]i)|(?<![a-z])ty(?!\w)/)
  if (my) { if (!cocuk && my === 'ileri') ekle(o, 'ECHO.MR_SEVERE', P_ILERI); kapak.push(`Mitral yetmezlik: ${my}`) }
  if (ay) { if (!cocuk && ay === 'ileri') ekle(o, 'ECHO.AR_SEVERE', P_ILERI); kapak.push(`Aort yetmezliği: ${ay}`) }
  if (ty) { if (!cocuk && ty === 'ileri') ekle(o, 'ECHO.TR_SEVERE', P_ILERI); kapak.push(`Triküspid yetmezlik: ${ty}`) }

  const aorta = olcuMm(t, /(?:asendan aorta|çıkan aorta|cikan aorta|ascending aorta|aort k[öo]k[üu])\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(mm|cm)?/i)
  if (aorta !== null) {
    o.sayac++
    const genis = !cocuk && aorta >= 40
    if (genis) ekle(o, 'ECHO.AORTA', P_OLCUM)
    perikard.push(`Aort ${trSayi(aorta)} mm${genis ? ' (eşik ≥40)' : ''}`)
  }
  if (efuzyonSinif(t) === 'var') {
    ekle(o, 'ECHO.EFF', P_OLCUM)
    perikard.push('Perikardiyal efüzyon')
  } else if (/perikard/.test(t)) perikard.push('Perikard: efüzyon kodu yok')
  const fizyoloji = ifadeVar(t, /sağ atriyum[^\n]{0,40}çök|diyastolik[^\n]{0,24}kolaps|chamber collapse/)
  if (tamponadVar(t) || fizyoloji) {
    ekle(o, 'ECHO.TAMPONAD', P_TAMPONAD)
    perikard.push(fizyoloji && !tamponadVar(t) ? 'Çökme / kollaps ifadesi var' : 'Tamponad ifadesi geçiyor')
  }
  if (!cocuk && ifadeVar(t, /vejetasyon|vegetation/)) { ekle(o, 'ECHO.VEG', P_ILERI); perikard.push('Vejetasyon ifadesi var') }
  if (!cocuk && ifadeVar(t, /tromb[uü]s|thrombus/)) { ekle(o, 'ECHO.THROMBUS', P_ILERI); perikard.push('Trombus ifadesi var') }

  const efKorunmus = efSinif === 'korunmuş'
  const efDusuk = efSinif === 'düşük' || efSinif === 'ileri düşük'
  if (!cocuk && as?.sinif === 'uyumlu') yorum.push('Aort darlığı ölçütleri birbiriyle uyumlu.')
  if (!cocuk && as?.sinif === 'uyumsuz') yorum.push('Aort alanı küçük, gradyan ve Vmax ileri eşikte değil; düşük gradyanlı darlık denir, ileri darlık denmez.')
  if (!cocuk && as?.sinif === 'tek') yorum.push('İleri aort darlığı tek ölçüte dayanıyor; düşük akımlı darlıkta hekim doğrular.')
  if (!cocuk && efDusuk && ee !== null && ee > 14) yorum.push('Sistolik fonksiyon azalmış ve ortalama E/e′ yüksek.')
  if (!cocuk && efKorunmus && ee !== null && ee > 14 && lavi !== null && lavi > 34) yorum.push('EF korunmuş; geniş sol atriyum ve yüksek E/e′ doluş basıncı açısından birlikte duruyor.')
  if (!cocuk && tapse !== null && tapse < 17 && pasp !== null && pasp >= 40) yorum.push('TAPSE azalmış ve pulmoner basınç yüksek.')
  if (o.etiketler.some((e) => e.kod === 'ECHO.TAMPONAD')) yorum.push('Tamponad fizyolojisi raporda geçiyor.')
  if (o.etiketler.some((e) => e.kod === 'ECHO.VEG')) yorum.push('Vejetasyon ifadesi var; enfeksiyon kararı hekimde.')
  if (o.etiketler.some((e) => e.kod === 'ECHO.THROMBUS')) yorum.push('Trombus ifadesi var; antikoagülan kararı hekimde.')

  const anormal = o.etiketler.some((e) => e.kod !== 'ECHO.NORM')
  const normalIfade = /normal s[ıi]n[ıi]r|normal ekokardiyograf|ekokardiyograf(?:i|ik inceleme)?[^.\n]{0,60}normal/.test(t)
  if (!cocuk && !anormal && normalIfade && (efKorunmus || /normal s[ıi]n[ıi]r/.test(t))) {
    ekle(o, 'ECHO.NORM', P_OLCUM)
    yorum.push('Basılı ölçüler ve rapor dili normal sınırda.')
  }

  const eksik: string[] = []
  if (!cocuk) {
    if (!ef) eksik.push('EF')
    if (ivs === null && pw === null) eksik.push('duvar kalınlığı')
    if (tapse === null) eksik.push('TAPSE')
    if (!as && !my && !ay && !ty && mva === null) eksik.push('kapak')
    if (!/perikard/.test(t)) eksik.push('perikard')
  }

  const calisma = /trans[öo]zofaj|\btee\b/.test(t) ? 'Transözofageal ekokardiyografi' : /transtorasik|\btte\b/.test(t) ? 'Transtorasik ekokardiyografi' : 'Ekokardiyografi'
  if (yorum.length) o.satirlar.push(`Yorum: ${yorum.join(' ')}`)
  o.satirlar.push(`Çalışma: ${calisma}`)
  if (lv.length) o.satirlar.push(`Sol ventrikül: ${lv.join('. ')}`)
  if (diast.length) o.satirlar.push(`Sol atriyum / diyastol: ${diast.join('. ')}`)
  if (sag.length) o.satirlar.push(`Sağ kalp: ${sag.join('. ')}`)
  if (kapak.length) o.satirlar.push(`Kapaklar: ${kapak.join('. ')}`)
  if (perikard.length) o.satirlar.push(`Perikard / aort: ${perikard.join('. ')}`)
  if (eksik.length) o.satirlar.push(`Eksik: ${eksik.join(', ')} raporda yok.`)
  if (cocuk) o.satirlar.push('Hasta 16 yaş altında — erişkin ASE bantları uygulanmadı. Basılı sayılar yukarıdadır.')

  const giris = cocuk
    ? 'Ekokardiyografi metnindeki sayılar okundu. Erişkin bant uygulanmadı.'
    : 'Ekokardiyografi rapor metnindeki ölçümler okundu. Sine döngüsünden yeniden ölçülmedi.'
  const rapor = [giris, ...o.satirlar].join('\n')
  return motorYap(o, rapor)
}

/** Analiz rotası, motor_kayit döngüsünden sonra çağırır. */
export function ekoDogrulamayiUygula(motor: MotorCiktisi): void {
  if (motor.motor !== EKO_ASE_MOTOR) return
  const olcum = Number(motor.metrikler?.olcumSayisi || 0)
  const bantAcik = Number(motor.metrikler?.bantUygulandi || 0) === 1
  const tamponad = motor.labels.some((l) => l.kod === 'ECHO.TAMPONAD')
  motor.dogrulanmis = tamponad || (bantAcik && (olcum > 0 || motor.labels.length > 0))
}

export function ekoOlcumSatirlari(motor: MotorCiktisi): string[] {
  return String(motor.metrikler?.satirlar || '').split('\n').map((s) => s.trim()).filter(Boolean)
}

function ekoTanilari(motor: MotorCiktisi, capPct: number): Tani[] {
  const out: Tani[] = []
  for (const l of motor.labels) {
    if (!gecerliKod(l.kod)) continue
    const yuzde = Math.max(0, Math.min(capPct, Math.round(l.p * 100)))
    const tanim = BULGULAR[l.kod]
    out.push({
      ad: tanim.tr,
      icd10: 'icd10' in tanim ? tanim.icd10 : null,
      guven_pct: yuzde,
      guven_bant: bant(yuzde),
      destek: ['rapor metnindeki ölçüm'],
      karsi: [],
    })
  }
  return out
}

const EKO_SINIR = 'Sayılar rapor metninden okundu; sine döngüsünden yeniden ölçülmedi. Tanı hekime aittir.'

/** Yazar ölçüm satırlarını düşürürse veya kaliteyi düşüğe çekerse dökümü geri koyar. */
export function ekoRaporunuZenginlestir(rapor: BelgeRaporu, motor: MotorCiktisi, yasAy?: number | null): BelgeRaporu {
  const satirlar = ekoOlcumSatirlari(motor)
  const eksik = satirlar.filter((s) => !rapor.bulgular.some((b) => b.replace(/\s/g, '').includes(s.slice(0, 18).replace(/\s/g, ''))))
  const yeni: BelgeRaporu = {
    ...rapor,
    bulgular: [...eksik, ...rapor.bulgular],
    tanilar: [...(rapor.tanilar || [])],
    sinirlar: [...(rapor.sinirlar || [])],
  }
  const girdi = String(motor.metrikler?.girdi || '')
  if (girdi === 'fetal') {
    yeni.tanilar = []
    yeni.acil_bayrak = false
    yeni.kalite = 'orta'
    const not = 'Fetal veya gebelik ekokardiyografisi erişkin bantlarıyla değerlendirilmez.'
    if (!yeni.sinirlar.includes(not)) yeni.sinirlar.push(not)
    return yeni
  }
  const bantAcik = Number(motor.metrikler?.bantUygulandi || 0) === 1
  const olcum = Number(motor.metrikler?.olcumSayisi || 0)
  if (bantAcik && (olcum > 0 || motor.labels.length > 0) && yeni.kalite === 'dusuk') {
    yeni.kalite = 'orta'
    const cap = capHesapla({ modalite: 'eko', yasAy, motorlar: [motor], fused: [], kalite: 'orta' }).cap
    if (!yeni.tanilar.length) yeni.tanilar = ekoTanilari(motor, cap)
  }
  if (motor.labels.some((l) => l.kod === 'ECHO.TAMPONAD')) yeni.acil_bayrak = true
  if (Number(motor.metrikler?.tekAs || 0) === 1) {
    const not = 'İleri aort darlığı tek ölçüte dayanıyor; düşük akımlı darlıkta hekim doğrular.'
    if (!yeni.sinirlar.includes(not)) yeni.sinirlar.push(not)
  }
  if (!yeni.sinirlar.includes(EKO_SINIR)) yeni.sinirlar.push(EKO_SINIR)
  return yeni
}

/** Yazar modeli düşerse ölçüm dökümü yine taslak olarak kalır. */
export function ekoMotorRaporu(motor: MotorCiktisi, capPct: number): BelgeRaporu {
  const satirlar = ekoOlcumSatirlari(motor)
  const tamponad = motor.labels.some((l) => l.kod === 'ECHO.TAMPONAD')
  return {
    modalite: 'Ekokardiyografi',
    kalite: 'orta',
    ozet: (satirlar.find((s) => s.startsWith('Yorum:')) || 'Ekokardiyografi rapor metnindeki ölçümler okundu. Sine döngüsünden yeniden ölçülmedi.').replace(/^Yorum:\s*/, ''),
    bulgular: satirlar,
    tanilar: ekoTanilari(motor, capPct),
    acil_bayrak: tamponad,
    oneri: 'Hekim onayından sonra bu taslak son muayenenin Objektif bölümüne eklenir.',
    sinirlar: ['Yazar modeli yanıt vermedi; yalnız ölçüm dökümü kaydedildi.', EKO_SINIR],
    hekim_tanisi: [],
    engines_used: [EKO_ASE_MOTOR],
  }
}
