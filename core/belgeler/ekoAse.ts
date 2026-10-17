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

function asOku(t: string): { ciddi: boolean; tek: boolean; not: string } | null {
  const bolum = aortBolumu(t)
  if (!bolum) return null
  const alanM = /(?:ava|kapak alan[ıi]|aort kapak alan[ıi]|alan)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i.exec(bolum)
  const gradM = /(?:ortalama|mean|ort\.?)\s*grad\w*\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i.exec(bolum)
  const vmaxM = /(?:v\s*max|maks(?:imum)?\s*h[ıi]z|pik\s*h[ıi]z|peak\s*velocity)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i.exec(bolum)
  const alan = sayi(alanM?.[1])
  const grad = sayi(gradM?.[1])
  const vmax = sayi(vmaxM?.[1])
  const parca: string[] = []
  let n = 0
  let ciddi = 0
  if (alan !== null && alan > 0 && alan <= 6) {
    n++; parca.push(`alan ${trSayi(alan)} cm²`)
    if (alan <= 1) ciddi++
  }
  if (grad !== null && grad > 0 && grad < 200) {
    n++; parca.push(`ortalama gradyan ${trSayi(grad)} mmHg`)
    if (grad >= 40) ciddi++
  }
  if (vmax !== null && vmax > 0 && vmax < 10) {
    n++; parca.push(`Vmax ${trSayi(vmax)} m/s`)
    if (vmax >= 4) ciddi++
  }
  if (!n) return null
  return { ciddi: ciddi > 0, tek: ciddi === 1 && n >= 1, not: parca.join(', ') }
}

const CIDDI = /a[ğg][ıi]r|severe|ciddi|3\s*\/\s*4|4\s*\/\s*4|grade\s*[34]\b|[34]\s*\+|\bileri\b/
const DEGIL = /hafif|orta|mild|moderate|eser|trace|1\s*\/\s*4|2\s*\/\s*4|grade\s*[12]\b|[12]\s*\+/

function kapakCiddi(t: string, kapak: RegExp): boolean {
  const bayrak = new RegExp(kapak.source, 'gi')
  for (const m of t.matchAll(bayrak)) {
    const i = m.index ?? 0
    // Önceki cümlenin “hafif”i bu kapağa yapışmasın; “ileri mitral” öneki kalsın.
    const hamOnce = t.slice(Math.max(0, i - 18), i)
    const satir = hamOnce.lastIndexOf('\n')
    const oncesi = (satir >= 0 ? hamOnce.slice(satir + 1) : hamOnce).replace(/ileri\s+derecede\s+sol/g, '')
    const sonrasi = t.slice(i, i + m[0].length + 40).split(/[.\n]/)[0].replace(/ileri\s+derecede\s+sol/g, '')
    const pencere = `${oncesi}${sonrasi}`
    if (CIDDI.test(pencere) && !DEGIL.test(pencere)) return true
  }
  return false
}

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

  const ef = efOku(t)
  if (ef) {
    o.sayac++
    let sinif = 'bant uygulanmadı'
    if (!cocuk) {
      if (ef.alt < 30) { ekle(o, 'ECHO.EF_SEVERE', P_ILERI); sinif = 'ileri düşük' }
      else if (opts.cinsiyet === 'E' && ef.alt < 52) { ekle(o, 'ECHO.EF_LOW', P_OLCUM); sinif = 'düşük' }
      else if (opts.cinsiyet === 'K' && ef.alt < 54) { ekle(o, 'ECHO.EF_LOW', P_OLCUM); sinif = 'düşük' }
      else if (!opts.cinsiyet && ef.alt < 50) { ekle(o, 'ECHO.EF_LOW', P_OLCUM); sinif = 'düşük' }
      else if (opts.cinsiyet === 'E' || opts.cinsiyet === 'K' || ef.alt >= 54) sinif = 'korunmuş'
      else sinif = 'cinsiyet olmadan düşük denmedi'
    }
    o.satirlar.push(`EF %${ef.basili} (${cins}; ${sinif})`)
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
    o.satirlar.push(`${parca} (${cins}; eşik >${trSayi(esik)} cm${lvh ? '; hipertrofi' : ''})`)
  }

  const lavi = laviOku(t)
  if (lavi !== null) {
    o.sayac++
    const genis = !cocuk && lavi > 34
    if (genis) ekle(o, 'ECHO.LAE', P_OLCUM)
    o.satirlar.push(`LAVI ${trSayi(lavi)} mL/m²${genis ? ' (eşik >34)' : ''}`)
  }

  const ee = eeOku(t)
  if (ee !== null) {
    o.sayac++
    const yuksek = !cocuk && ee > 14
    if (yuksek) ekle(o, 'ECHO.DIASTOLIK', P_OLCUM)
    o.satirlar.push(`Ortalama E/e′ ${trSayi(ee)}${yuksek ? ' (eşik >14)' : ''}`)
  }

  const tapse = tapseOku(t)
  if (tapse !== null) {
    o.sayac++
    const dusuk = !cocuk && tapse < 17
    if (dusuk) ekle(o, 'ECHO.TAPSE_LOW', P_OLCUM)
    o.satirlar.push(`TAPSE ${trSayi(tapse)} mm${dusuk ? ' (eşik <17)' : ''}`)
  }

  const as = asOku(t)
  if (as) {
    o.sayac++
    if (!cocuk && as.ciddi) {
      ekle(o, 'ECHO.AS_SEVERE', P_ILERI)
      if (as.tek) o.tekAs = true
    }
    o.satirlar.push(`Aort kapak: ${as.not}${!cocuk && as.ciddi ? ' — ileri darlık ölçütü' : ''}`)
  }

  if (!cocuk && kapakCiddi(t, /mitral\s*(?:kapak\s*)?yetmezli(?:k|[ğg]i)|mitral\s*yetersizli(?:k|[ğg]i)|mitral\s*reg[üu]rg|(?<![a-z])my(?!\w)/)) {
    ekle(o, 'ECHO.MR_SEVERE', P_ILERI)
    o.satirlar.push('Mitral yetmezlik: ileri')
  }
  if (!cocuk && kapakCiddi(t, /aort(?:ik)?\s*yetmezli(?:k|[ğg]i)|aort(?:ik)?\s*yetersizli(?:k|[ğg]i)|aort(?:ik)?\s*reg[üu]rg/)) {
    ekle(o, 'ECHO.AR_SEVERE', P_ILERI)
    o.satirlar.push('Aort yetmezliği: ileri')
  }
  if (!cocuk && kapakCiddi(t, /trik[üu]spid\s*yetmezli(?:k|[ğg]i)|trik[üu]spid\s*yetersizli(?:k|[ğg]i)|(?<![a-z])ty(?!\w)/)) {
    ekle(o, 'ECHO.TR_SEVERE', P_ILERI)
    o.satirlar.push('Triküspid yetmezlik: ileri')
  }

  const pasp = paspOku(t)
  if (pasp !== null) {
    o.sayac++
    const yuksek = !cocuk && pasp >= 40
    if (yuksek) ekle(o, 'ECHO.PH', P_OLCUM)
    o.satirlar.push(`PASP ${trSayi(pasp)} mmHg${yuksek ? ' (eşik ≥40)' : ''}`)
  }

  if (efuzyonSinif(t) === 'var') {
    ekle(o, 'ECHO.EFF', P_OLCUM)
    o.satirlar.push('Perikardiyal efüzyon')
  }
  if (tamponadVar(t)) {
    ekle(o, 'ECHO.TAMPONAD', P_TAMPONAD)
    o.satirlar.push('Tamponad ifadesi geçiyor')
  }

  const anormal = o.etiketler.some((e) => e.kod !== 'ECHO.NORM')
  const normalIfade = /normal s[ıi]n[ıi]r|normal ekokardiyograf|ekokardiyograf(?:i|ik inceleme)?[^.\n]{0,60}normal/.test(t)
  const efKorunmus = o.satirlar.some((s) => s.startsWith('EF ') && s.includes('korunmuş'))
  if (!cocuk && !anormal && normalIfade && (efKorunmus || /normal s[ıi]n[ıi]r/.test(t))) {
    ekle(o, 'ECHO.NORM', P_OLCUM)
    o.satirlar.push('Rapor metni normal sınırlarda')
  }

  if (cocuk) {
    o.satirlar.push('Hasta 16 yaş altında — erişkin ASE bantları uygulanmadı. Basılı sayılar yukarıdadır.')
  }
  if (o.tekAs) o.satirlar.push('İleri aort darlığı tek ölçüte dayanıyor; düşük akımlı darlıkta hekim doğrular.')
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
    ozet: 'Ekokardiyografi rapor metnindeki ölçümler okundu. Sine döngüsünden yeniden ölçülmedi.',
    bulgular: satirlar,
    tanilar: ekoTanilari(motor, capPct),
    acil_bayrak: tamponad,
    oneri: 'Hekim onayından sonra bu taslak son muayenenin Objektif bölümüne eklenir.',
    sinirlar: ['Yazar modeli yanıt vermedi; yalnız ölçüm dökümü kaydedildi.', EKO_SINIR],
    hekim_tanisi: [],
    engines_used: [EKO_ASE_MOTOR],
  }
}
