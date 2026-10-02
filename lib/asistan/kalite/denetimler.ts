/**
 * NOTYA-KALITE-STANDART-01 — the mechanical checks of the answer quality standard (docs/AYSE-KALITE-STANDARDI.md).
 *
 * PURE: no model call, no database, no product import. Each check reads one text (the screen answer or the spoken
 * answer) and returns the rule id, pass or fail and a short reason — or null when the check does not apply to that
 * answer. The checks measure form and wording. None of them can tell whether a value is TRUE: that is what the corpus
 * assertions on fixture values, the live pass and a human reader are for.
 *
 * Which check runs on which text is decided by rubrik.ts.
 */
import { DENETIM_KURALI, type DenetimAdi, type KuralId } from './kurallar'

export type KaliteYuzeyi = 'yazi' | 'ses' | 'panel'
/** Structures of Q-21. The five İlk-10 types without a required structure are listed so a narrative voice answer is recognised. */
export type YapiTuru = 'ozet' | 'degisim' | 'buyume' | 'asi' | 'lab' | 'ilac' | 'benzer' | 'gelisim' | 'takip' | 'gozden-kacan' | 'vizit-ozeti'
export type OlcumTuru = 'kilo' | 'boy' | 'bas' | 'ates' | 'tansiyon' | 'nabiz'

/** What the entry's fixture says, for the checks that compare wording with the record (regex sources, flags iu). */
export interface KaliteKaniti {
  /** Items the record only PLANS: the answer must not call them given, done or normal. */
  planli?: string[]
  /** Items the record documents as given: the answer must not call them missing. */
  uygulanan?: string[]
  /** Follow-up items whose window has passed as of today: the answer must say so. */
  gecenTakip?: string[]
}

export interface KaliteGirdisi {
  /** The doctor's sentence. */
  soru: string
  yuzey: KaliteYuzeyi
  /** Screen text (on voice: the stored screen message). */
  ekran: string
  /** Spoken text (voice only). */
  soz?: string
  /** The spoken text as handed to the speech engine (voice only). */
  okunus?: string
  /** Patient the answer is about, when the answer states a fact of that patient's chart. */
  hastaAdi?: string | null
  yapi?: YapiTuru | null
  /** The one measurement the question asks for. */
  olcum?: OlcumTuru | null
  /** A single-fact answer (Q-20: at most two sentences before the supporting lines). */
  olgu?: boolean
  kanit?: KaliteKaniti
  /** Identity / contact values of the fixture that must never be spoken. */
  kimlikDegerleri?: string[]
  /** Names of other doctors' patients in the scene. */
  yabanciAdlar?: string[]
  /** The doctor asked to have the answer read aloud ("oku", "bana anlat", "devam et"): no spoken length cap. */
  okuIstegi?: boolean
  /** The fixed out-of-scope refusal is the expected answer: only Q-32 applies. */
  ret?: boolean
  /** Recogniser noise dropped by design: no answer is expected. */
  gurultu?: boolean
}

export interface KaliteKarari {
  kural: KuralId
  denetim: DenetimAdi
  /** The text the verdict is about. */
  hedef: 'ekran' | 'soz'
  gecti: boolean
  neden: string
}

type Sonuc = { gecti: boolean; neden: string } | null
const tamam = (neden = ''): Sonuc => ({ gecti: true, neden })
const kusur = (neden: string): Sonuc => ({ gecti: false, neden })

export function karar(denetim: DenetimAdi, hedef: 'ekran' | 'soz', s: Sonuc): KaliteKarari | null {
  return s ? { kural: DENETIM_KURALI[denetim], denetim, hedef, gecti: s.gecti, neden: s.neden } : null
}

/* ───────────────────────────── text helpers ───────────────────────────── */

const kucuk = (s: string) => String(s || '').toLocaleLowerCase('tr-TR')
const kisalt = (s: string, n = 70) => { const t = s.replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n)}…` : t }
const BUYUK = 'A-ZÇĞİÖŞÜ'
const CUMLE_SINIRI = new RegExp(`(?<=[.!?…])\\s+(?=["“'(]?[${BUYUK}\\d])`, 'u')
const TABLO_SATIRI = /^\s*\|/
const AYIRAC = /^\s*(?:\|?\s*:?-{3,}.*|\*{3,}|_{3,})\s*$/
const MADDE = /^\s*(?:[-*•]\s+|\d{1,2}[.)]\s+)/

/** Markdown markers off: list bullets, heading marks, emphasis. */
export function sade(s: string): string {
  return String(s || '')
    .replace(/^\s*(?:[-*•>]\s+|#{1,6}\s+|\d{1,2}[.)]\s+)/, '')
    .replace(/\*\*|__|`/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const satirlar = (metin: string) => String(metin || '').split(/\n/).map((s) => s.trimEnd()).filter((s) => s.trim())

/** Sentences and list lines of a text, table rows and separators left out. */
export function cumleler(metin: string): string[] {
  return satirlar(metin)
    .filter((s) => !TABLO_SATIRI.test(s) && !AYIRAC.test(s))
    .flatMap((s) => sade(s).split(CUMLE_SINIRI))
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Units a statement can be read in: every sentence and every table row. */
function birimler(metin: string): string[] {
  return [...cumleler(metin), ...satirlar(metin).filter((s) => TABLO_SATIRI.test(s) && !AYIRAC.test(s))]
}

export const kelimeSayisi = (metin: string) => sade(String(metin || '').replace(/[|#*_>`-]+/g, ' ')).split(/\s+/).filter((k) => /[\p{L}\d]/u.test(k)).length

const AY = '(?:ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)'
const NOKTALI_TARIH = /(?<!\d)\d{1,2}[./]\d{1,2}[./](?:\d{4}|\d{2})(?!\d)/
const AYLI_TARIH = new RegExp(`(?<!\\d)\\d{1,2}\\s+${AY}\\s+\\d{4}`, 'u')
const tarihVar = (s: string) => NOKTALI_TARIH.test(s) || AYLI_TARIH.test(kucuk(s))
function tarihSayisi(metin: string): number {
  const k = kucuk(metin)
  return new Set([...k.matchAll(new RegExp(NOKTALI_TARIH.source, 'g')), ...k.matchAll(new RegExp(AYLI_TARIH.source, 'gu'))].map((m) => m[0])).size
}

/** Line index of the closing safety block ("⚠ …", "Dikkat …" as a heading), or -1. */
const GUVENLIK_BASLIGI = /^(?:⚠|dikkat(?!\p{L})|eksik kayıt|takip gereken)/u
const BILINEN_BASLIK = /^(?:dayanak|kayıt|yorum|özet|genel değerlendirme|güçlü alanlar|izlenmesi gereken alanlar|tarama durumu|önerilen sonraki adım|bulgular|tedavi|plan)\s*:?/u
function guvenlikSatiri(metin: string): number {
  return satirlar(metin).findIndex((s) => GUVENLIK_BASLIGI.test(kucuk(sade(s))))
}
/** The answer without its closing safety block. */
function guvenliksiz(metin: string): string {
  const s = satirlar(metin)
  const i = guvenlikSatiri(metin)
  return i <= 0 ? metin : s.slice(0, i).join('\n')
}

const derle = (desen: string) => new RegExp(desen, 'iu')

/* ───────────────────────────── Q-01 answer first ───────────────────────────── */

const ON_SOZ = /^(?:hocam[,!]?\s*)?(?:elbette|tabii|tabi(?!\p{L})|memnuniyetle|harika|güzel (?:bir )?soru|çok iyi (?:bir )?soru|bakıyorum|bakayım|bir bakayım|bir saniye|bir dakika|hemen (?:bak|kontrol|incel)|şimdi (?:bak|kontrol|incel)|dosyaya bak|dosyayı incel|inceliyorum|kontrol ediyorum)/u
const DUYURU = /(?:aşağıda|şöyle özetleyebilirim|özetleyecek olursam|özetleyeyim|şu şekilde|şunları söyleyebilirim|şöyle(?: sıralayabilirim)?|sunuyorum|paylaşıyorum|işte)\s*[:.]?$/u
const CIPLAK_BASLIK = /^(?:dayanak|kayıt|yorum|özet|cevap|yanıt|sonuç)\s*[:.]?$/u

/** The first sentence answers: it is not a filler opener, an announcement of what follows, or a bare heading. */
export function cevapOnce(metin: string): Sonuc {
  const ilk = cumleler(metin)[0]
  if (!ilk) return null
  const k = kucuk(ilk)
  if (ON_SOZ.test(k)) return kusur(`ön söz ile açılıyor: "${kisalt(ilk, 50)}"`)
  if (CIPLAK_BASLIK.test(k)) return kusur(`başlıkla açılıyor: "${kisalt(ilk, 30)}"`)
  if (DUYURU.test(k)) return kusur(`duyuru ile açılıyor: "${kisalt(ilk, 50)}"`)
  return tamam()
}

/* ───────────────────────────── Q-02 specific ───────────────────────────── */

const OLCUM_ADI: Record<OlcumTuru | 'spo2' | 'solunum' | 'vki', string> = {
  kilo: 'kilo', boy: 'boy', bas: 'baş çevresi', ates: 'ateş', tansiyon: 'tansiyon', nabiz: 'nabız', spo2: 'SpO₂', solunum: 'solunum sayısı', vki: 'VKİ',
}
/** Traces of a measurement in an answer, on the lower-cased text. A bare "cm" is not a trace: height and head circumference share it. */
const OLCUM_IZI: Record<keyof typeof OLCUM_ADI, RegExp> = {
  kilo: /(?<!\p{L})(?:kilo(?!metre)\p{L}*|ağırlı\p{L}*|tartı\p{L}*)|\d\s*(?:kg|kilogram)(?![\p{L}/])/u,
  boy: /(?<!\p{L})boy(?:u|un|unu|unun|ları)?(?!\p{L})/u,
  bas: /baş çevre\p{L}*/u,
  ates: /(?<!\p{L})ateş\p{L}*|\d\s*°\s*c|\d\s*derece/u,
  tansiyon: /(?<!\p{L})tansiyon\p{L}*|mmhg|kan basınc\p{L}*/u,
  nabiz: /(?<!\p{L})nab[ıi]z\p{L}*|nabz\p{L}*|atım\/dk/u,
  spo2: /spo|satürasyon/u,
  solunum: /solunum sayı\p{L}*/u,
  vki: /(?<!\p{L})vki(?!\p{L})|vücut kitle/u,
}
const KAYIT_YOK = /kay[ıi]t\p{L}* (?:\p{L}+ ){0,3}(?:yok|bulamadım|bulunmuyor|görünmüyor|göremiyorum)|kayıtlı (?:\p{L}+ ){0,3}yok|ölçümü? (?:yok|bulunmuyor)|not edilmemiş|yazılmamış|bulamadım/u
const GUN_SOZU = /(?<!\p{L})(?:bugün|dün)(?!\p{L})/u

/** A single-measurement question gets that measurement and its date, and no other vital sign outside the closing safety block. */
export function tekOlcum(metin: string, istenen: OlcumTuru | null | undefined): Sonuc {
  if (!istenen || !metin.trim()) return null
  const govde = kucuk(guvenliksiz(metin))
  const yok = KAYIT_YOK.test(govde)
  if (!OLCUM_IZI[istenen].test(govde)) return kusur(`sorulan ölçüm (${OLCUM_ADI[istenen]}) cevapta yok`)
  const diger = (Object.keys(OLCUM_IZI) as (keyof typeof OLCUM_IZI)[]).filter((t) => t !== istenen && OLCUM_IZI[t].test(govde))
  if (diger.length) return kusur(`sorulmayan ölçüm de verilmiş: ${diger.map((t) => OLCUM_ADI[t]).join(', ')}`)
  if (!yok && !tarihVar(govde) && !GUN_SOZU.test(govde)) return kusur(`${OLCUM_ADI[istenen]} değerinin tarihi yok`)
  return tamam()
}

/* ───────────────────────────── Q-03 source versus interpretation ───────────────────────────── */

/** An interpretation heading ("Yorum:") is preceded by a record heading ("Dayanak:" / "Kayıt:"). */
export function dayanakYorum(metin: string): Sonuc {
  const s = satirlar(metin).map((x) => kucuk(sade(x)))
  const yorum = s.findIndex((x) => /^yorum\s*:/u.test(x))
  if (yorum === -1) return null
  const kayit = s.findIndex((x) => /^(?:dayanak|kayıt)\s*:?/u.test(x))
  return kayit !== -1 && kayit < yorum ? tamam() : kusur('"Yorum:" var, öncesinde "Dayanak:" / "Kayıt:" yok')
}

/* ───────────────────────────── Q-04 planned is not given ───────────────────────────── */

const YAPILMADI = /(?<!\p{L})(?:yapılmadı|yapılmamış(?:tır)?|uygulanmadı|uygulanmamış(?:tır)?|verilmedi|verilmemiş(?:tir)?|bakılmadı|bakılmamış(?:tır)?|sonuçlanmadı|sonuçlanmamış(?:tır)?|alınmadı|alınmamış(?:tır)?)(?!\p{L})/u
const KAYIT_ADI = /(?<!\p{L})(?:not\p{L}*|kay[ıi]t\p{L}*|epikriz\p{L}*|rapor\p{L}*|belge\p{L}*|karne\p{L}*|form\p{L}*)/u
const ATIF = /(?<!\p{L})(?:yazıyor|yazılı|yazılmış|yazmış|belirtilmiş|belirtiliyor|not edilmiş|işaretlenmiş|geçiyor|olarak (?:kayıtlı|kaydedilmiş|girilmiş))/u
const TIRNAKLI = new RegExp(`["“'‘][^"”'’]{0,60}${YAPILMADI.source}[^"”'’]{0,60}["”'’]`, 'u')

/** "yapılmadı / uygulanmadı / verilmedi" only when the record itself says so and the record is named. */
export function yapilmadi(metin: string): Sonuc {
  if (!metin.trim()) return null
  for (const c of birimler(metin)) {
    const k = kucuk(c)
    if (!YAPILMADI.test(k)) continue
    if (TIRNAKLI.test(k) || (KAYIT_ADI.test(k) && ATIF.test(k))) continue
    return kusur(`kayıt anılmadan "${YAPILMADI.exec(k)![0]}": "${kisalt(c, 70)}"`)
  }
  return tamam()
}

const TAMAMLANDI = /(?<!\p{L})(?:uygulandı|uygulanmış(?:tır)?|yapıldı|yapılmış(?:tır)?|tamamlandı|tamamlanmış(?:tır)?|verildi|verilmiş(?:tir)?|tam(?:dır)?|normal(?:dir)?|geçti)(?!\p{L})/u
const CEKINCE = /dair kay[ıi]t|kay[ıi]t\p{L}* (?:yok|bulamadım|göremiyorum|bulunmuyor|görünmüyor)|kaydına rastlamadım|belgelenmemiş|planlan|planlı|öneril|istendi|istenmiş|bekliyor|görünmüyor|sonuç\p{L}* yok|(?<!\p{L})eksik|zamanı (?:gelmiş|geçmiş)|gecikmiş|yapılacak|uygulanacak|henüz/u
const EKSIK = /(?<!\p{L})(?:eksik|gecikmiş|zamanı geçmiş)(?!\p{L})|kay[ıi]t\p{L}* (?:yok|bulamadım|bulunmuyor)/u
const EKSIK_DEGIL = /eksik\p{L}* (?:\p{L}+ ){0,2}(?:yok|değil)|eksiği yok/u

/**
 * Wording against the entry's evidence: an item the record only plans is not called given, done or normal; an item
 * the record documents as given is not called missing. Null when the answer mentions none of the items.
 */
export function planUygulandi(metin: string, kanit: KaliteKaniti | undefined): Sonuc {
  if (!kanit?.planli?.length && !kanit?.uygulanan?.length) return null
  const b = birimler(metin)
  let anilan = 0
  for (const oge of kanit.planli || []) {
    for (const c of b.filter((x) => derle(oge).test(x))) {
      anilan++
      const k = kucuk(c)
      if (TAMAMLANDI.test(k) && !CEKINCE.test(k)) return kusur(`planlanan "${oge}" yapılmış gibi anlatılmış: "${kisalt(c, 70)}"`)
    }
  }
  for (const oge of kanit.uygulanan || []) {
    for (const c of b.filter((x) => derle(oge).test(x))) {
      anilan++
      const k = kucuk(c)
      if (EKSIK.test(k) && !TAMAMLANDI.test(k) && !EKSIK_DEGIL.test(k)) return kusur(`uygulandığı belgelenen "${oge}" eksik gibi anlatılmış: "${kisalt(c, 70)}"`)
    }
  }
  return anilan ? tamam() : null
}

/* ───────────────────────────── Q-06 dates ───────────────────────────── */

const YILSIZ_TARIH = new RegExp(`(?<!\\d)\\d{1,2}\\s+${AY}(?!\\p{L})(?![^\\n]{0,24}(?<!\\d)(?:19|20)\\d{2}(?!\\d))`, 'u')

/** A day-and-month date carries its year (the year may follow within the same phrase: "5 Ekim – 11 Ekim 2026"). */
export function tamTarih(metin: string): Sonuc {
  if (!metin.trim()) return null
  const m = YILSIZ_TARIH.exec(kucuk(metin))
  return m ? kusur(`yılsız tarih: "${m[0]}"`) : tamam()
}

const SAYI_SOZU = '(?:\\d+(?:\\s*[-–]\\s*\\d+)?|bir|iki|üç|dört|beş|altı|on)'
const TAKIP_PENCERESI = new RegExp(`${SAYI_SOZU}\\s*(?:saat|gün|hafta|ay|yıl)\\s*(?:sonra|içinde)\\s*(?:\\p{L}+\\s+){0,3}?(?:kontrol|takip|tekrar|değerlendir)\\p{L}*`, 'u')
const BUGUNE_GORE = /(?<!\p{L})(?:geçti|geçmiş|gecik\p{L}*|doldu|dolmuş|doluyor|dolacak|kaldı|kalmış|aşıldı|henüz|bugün\p{L}*|vadesi)(?!\p{L})/u

/** A quoted follow-up window ("1 ay sonra kontrol") is placed against today: its date, or where it stands now. */
export function takipBugun(metin: string): Sonuc {
  if (!metin.trim()) return null
  let pencere = 0
  for (const c of birimler(metin)) {
    const k = kucuk(c)
    const m = TAKIP_PENCERESI.exec(k)
    if (!m) continue
    pencere++
    if (!BUGUNE_GORE.test(k) && !tarihVar(k)) return kusur(`takip süresi bugünle karşılaştırılmamış: "${kisalt(m[0], 50)}"`)
  }
  return pencere ? tamam() : null
}

const SURESI_GECTI = /(?<!\p{L})(?:geçti|geçmiş|gecik\p{L}*|doldu|dolmuş|aşıldı|aşılmış)(?!\p{L})/u

/** A follow-up the entry's evidence marks as overdue is said to be overdue. Null when the answer does not mention it. */
export function takipGecti(metin: string, kanit: KaliteKaniti | undefined): Sonuc {
  if (!kanit?.gecenTakip?.length) return null
  const b = birimler(metin)
  let anilan = 0
  for (const oge of kanit.gecenTakip) {
    const ilgili = b.filter((x) => derle(oge).test(x))
    if (!ilgili.length) continue
    anilan++
    if (!ilgili.some((c) => SURESI_GECTI.test(kucuk(c)))) return kusur(`süresi geçen "${oge}" için geçtiği söylenmemiş: "${kisalt(ilgili[0], 60)}"`)
  }
  return anilan ? tamam() : null
}

/* ───────────────────────────── Q-07 right patient ───────────────────────────── */

/** A patient-specific answer names the patient in its first sentence. */
export function hastaAdi(metin: string, ad: string | null | undefined): Sonuc {
  if (!ad || !metin.trim()) return null
  const ilk = kucuk(cumleler(metin)[0] || '')
  const on = kucuk(ad).split(/\s+/)[0]
  return ilk.includes(on) ? tamam() : kusur(`ilk cümlede hasta adı (${ad.split(/\s+/)[0]}) yok: "${kisalt(cumleler(metin)[0] || '', 50)}"`)
}

/** No name of another doctor's patient. Not applied when the doctor's own sentence carries that name. */
export function yabanciHasta(metin: string, soru: string, adlar: string[] | undefined): Sonuc {
  if (!adlar?.length || !metin.trim()) return null
  const k = kucuk(metin)
  const s = kucuk(soru)
  const aday = adlar.filter((a) => !s.includes(kucuk(a)))
  if (!aday.length) return null
  const sizan = aday.find((a) => k.includes(kucuk(a)))
  return sizan ? kusur(`başka hekimin hastası geçiyor: ${sizan}`) : tamam()
}

/* ───────────────────────────── Q-08 paediatrics ───────────────────────────── */

const PERSENTIL = /(?<!\p{L})p\s?\d{1,2}(?:[.,]\d)?(?![\p{L}\d])|\d{1,2}(?:[.,]\d)?\.?\s*persentil|persentil\p{L}*\s*[:=]?\s*%?\s*\d|z(?:-|\s)?skor\p{L}*\s*[:=]?\s*[-+−]?\d|(?<!\p{L})sds\s*[:=]?\s*[-+−]?\d|(?<!\p{L})z\s*[:=]\s*[-+−]?\d/u

/** A percentile or z-score is given with the date of its measurement, in the same sentence or table row. */
export function persentilTarih(metin: string): Sonuc {
  let adet = 0
  for (const c of birimler(metin)) {
    const k = kucuk(c)
    if (!PERSENTIL.test(k)) continue
    adet++
    if (!tarihVar(k)) return kusur(`persentil / z-skoru tarihsiz: "${kisalt(c, 70)}"`)
  }
  return adet ? tamam() : null
}

const KILO_DEGERI = /\d+(?:[.,]\d+)?\s*(?:kg|kilogram)(?![\p{L}/])/u

/** An mg/kg statement carries the weight it was calculated on and that weight's date. */
export function mgkgKilo(metin: string): Sonuc {
  const k = kucuk(metin)
  if (!/mg\s*\/\s*kg/u.test(k)) return null
  if (!KILO_DEGERI.test(k)) return kusur('mg/kg anılmış, kilo değeri yok')
  if (!tarihVar(k) && !/reçete tarih/u.test(k)) return kusur('mg/kg anılmış, kilonun tarihi yok')
  return tamam()
}

/* ───────────────────────────── Q-09 safety last ───────────────────────────── */

/** The safety block is the last block: no record or interpretation heading follows it. */
export function dikkatSonda(metin: string): Sonuc {
  const s = satirlar(metin)
  const i = guvenlikSatiri(metin)
  if (i === -1) return null
  const sonraki = s.slice(i + 1).find((x) => !MADDE.test(x) && !TABLO_SATIRI.test(x) && BILINEN_BASLIK.test(kucuk(sade(x))))
  return sonraki ? kusur(`güvenlik başlığından sonra "${kisalt(sade(sonraki), 30)}" geliyor`) : tamam()
}

/* ───────────────────────────── Q-11 tone ───────────────────────────── */

const YASAK: { ad: string; re: RegExp }[] = [
  { ad: 'dolgu', re: /(?<!\p{L})(?:elbette|tabii ki|tabi ki|memnuniyetle|harika bir soru|güzel (?:bir )?soru|çok iyi (?:bir )?soru|size yardımcı olmaktan|yardımcı olabildiysem|umarım yardımcı)(?!\p{L})|^(?:hocam[,!]?\s*)?tabii(?!\p{L})/u },
  { ad: 'bekletme', re: /bakıyorum hocam|bir saniye hocam|hemen bakıyorum|lütfen bekleyin/u },
  { ad: 'hitap', re: /(?<!\p{L})(?:doktor bey|doktor hanım|sayın doktor|sayın hekim|efendim)(?!\p{L})/u },
  { ad: 'model kimliği', re: /bir yapay zek[aâ] (?:olarak|model)|dil modeli/u },
]

/** No filler, no waiting phrase, no address other than "Hocam", no talk about being a model. */
export function yasakIfade(metin: string): Sonuc {
  if (!metin.trim()) return null
  const k = kucuk(metin).trim()
  const y = YASAK.find((x) => x.re.test(k))
  return y ? kusur(`yasak ifade (${y.ad}): "${y.re.exec(k)![0]}"`) : tamam()
}

const SAVUSTURMA = /(?<!\p{L})(?:bilemedim|bilemiyorum|bilmiyorum|emin değilim|yardımcı olamıyorum|yardımcı olamam|cevap veremiyorum|yanıt veremiyorum|söyleyemem|söyleyemiyorum|anlayamadım)(?!\p{L})/u
const SONRAKI_ADIM = /\?|(?<!\p{L})(?:isterseniz|dilerseniz|gerek\p{L}*|lazım|netleş\p{L}*)(?!\p{L})|\p{L}+[ae]bilirim(?!\p{L})|\p{L}+[ıiuü]rs[ae]n[ıi]z(?!\p{L})|\p{L}+[ıiuü]rse(?!\p{L})|\p{L}+[dt][ıiuü]ğ[ıi]nd[ae](?!\p{L})/u

/** "bilemedim" is not an answer unless it comes with a next step (a question back, or what would settle it). */
export function bosSavusturma(metin: string): Sonuc {
  if (!metin.trim()) return null
  const k = kucuk(metin)
  const m = SAVUSTURMA.exec(k)
  if (!m) return tamam()
  return SONRAKI_ADIM.test(k) ? tamam() : kusur(`sonraki adım söylenmeden "${m[0]}"`)
}

const ARTIK: { ad: string; re: RegExp }[] = [
  { ad: 'kimlik numarası (uuid)', re: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i },
  { ad: 'alan / araç adı', re: /(?<![\p{L}\d_@.])[a-z]{2,}_[a-z_]{2,}(?![\p{L}\d@])/u },
  { ad: 'JSON', re: /\{\s*"[\w-]+"\s*:|"speech"\s*:/ },
  { ad: 'şablon sızıntısı', re: /\bundefined\b|\bNaN\b|\bnull\b|\[object Object\]|\{\{[^}\n]{1,40}\}\}|\{[A-Z][A-Z0-9_]{2,}\}/ },
  { ad: 'kod bloğu / HTML', re: /```|<\/?(?:br|p|div|span|b|i|strong|em|ul|ol|li|table|tr|td)\b[^>]*>|\\n/ },
]

/** No raw ids, field or tool names, JSON, template leaks, code fences, HTML or unbalanced emphasis marks. */
export function hamArtik(metin: string): Sonuc {
  if (!metin.trim()) return null
  const a = ARTIK.find((x) => x.re.test(metin))
  if (a) return kusur(`ham artık (${a.ad}): "${kisalt(a.re.exec(metin)![0], 40)}"`)
  if ((metin.match(/\*\*/g) || []).length % 2 === 1) return kusur('ham artık (kapanmamış ** işareti)')
  return tamam()
}

const INGILIZCE = /(?<![\p{L}'])(?:sorry|cannot|can't|unfortunately|however|please|patient|according to|i am|i'm|i can|i don't|here is|here are|the following|as an ai)(?![\p{L}'])/iu

/** The answer is Turkish: no English sentence fragments. */
export function turkce(metin: string): Sonuc {
  if (!metin.trim()) return null
  const m = INGILIZCE.exec(metin)
  return m ? kusur(`İngilizce ifade: "${m[0]}"`) : tamam()
}

/* ───────────────────────────── Q-20 length ───────────────────────────── */

export const OZET_KELIME_SINIRI = 275
export const OLGU_CUMLE_SINIRI = 2

/** The direct answer: the text before the first blank line, list item, table row or heading line. */
function dogrudanCevap(metin: string): string {
  const out: string[] = []
  for (const s of String(metin || '').split(/\n/)) {
    if (!s.trim()) { if (out.length) break; continue }
    if (out.length && (MADDE.test(s) || TABLO_SATIRI.test(s) || /^\s*(?:#{1,6}\s|\*\*[^*]+\*\*\s*:?\s*$|\*\*[^*]+:\*\*)/.test(s))) break
    out.push(s)
  }
  return out.join('\n')
}

/** A summary is at most about 250 words (250 + 10 %); a single-fact answer is at most two sentences before its supporting lines. */
export function uzunluk(metin: string, g: Pick<KaliteGirdisi, 'yapi' | 'olgu'>): Sonuc {
  if (!metin.trim()) return null
  if (g.yapi === 'ozet' || g.yapi === 'vizit-ozeti') {
    const n = kelimeSayisi(metin)
    return n > OZET_KELIME_SINIRI ? kusur(`özet ${n} kelime (sınır ${OZET_KELIME_SINIRI})`) : tamam(`${n} kelime`)
  }
  if (g.olgu) {
    const n = cumleler(dogrudanCevap(metin)).length
    return n > OLGU_CUMLE_SINIRI ? kusur(`tek bilgilik cevap ${n} cümle (sınır ${OLGU_CUMLE_SINIRI})`) : tamam(`${n} cümle`)
  }
  return null
}

const BIRIMLI_DEGER = /\d+(?:[.,]\d+)?\s*(?:kg|cm|g\/dl|mg\/dl|ng\/ml|mmhg|°\s*c|fl|iu)(?!\p{L})/u
export const SERI_ESIGI = 4

/** Four or more dated values are a table, not a list or a paragraph. */
export function seriTablo(metin: string): Sonuc {
  const s = satirlar(metin)
  const tablo = s.filter((x) => TABLO_SATIRI.test(x) && !AYIRAC.test(x))
  const dizi = s.filter((x) => !TABLO_SATIRI.test(x) && tarihVar(x) && BIRIMLI_DEGER.test(kucuk(x)))
  const paragraf = cumleler(metin).filter((c) => tarihSayisi(c) >= SERI_ESIGI && BIRIMLI_DEGER.test(kucuk(c)))
  if (dizi.length >= SERI_ESIGI) return kusur(`${dizi.length} tarihli değer tablo yerine satır satır yazılmış`)
  if (paragraf.length) return kusur('tarihli değer serisi tek cümlede, tablo değil')
  return tablo.length >= SERI_ESIGI ? tamam('tablo') : null
}

/* ───────────────────────────── Q-21 structure by question ───────────────────────────── */

const YAS = /\d+\s*(?:yaş\p{L}*|aylık|günlük|haftalık)|\d+\s*yıl\s*\d+\s*ay/u
const ACIK_IS_YOK = /saptamadım|açık iş\p{L}* (?:yok|saptanmadı|görünmüyor|bulunmuyor)/u
export const OZET_TARIH_SINIRI = 10

/** Required parts per structured question, as patterns on the lower-cased screen text. */
export const YAPI_BOLUMLERI: Partial<Record<YapiTuru, { ad: string; re: RegExp }[]>> = {
  ozet: [
    { ad: 'yaş', re: YAS },
    { ad: 'alerji', re: /alerji/u },
    { ad: 'aktif ilaç / süren tedavi', re: /ilaç|tedavi/u },
    { ad: 'aşı durumu', re: /aşı/u },
    { ad: 'büyüme ve gelişim', re: /büyüme|gelişim|persentil|(?<!\p{L})kilo/u },
    { ad: 'takip', re: /takip|kontrol|dikkat|saptamadım/u },
  ],
  buyume: [
    { ad: 'birimli ölçüm değeri', re: /\d+(?:[.,]\d+)?\s*(?:kg|cm|g)(?![\p{L}/])/u },
    { ad: 'ölçüm tarihi', re: new RegExp(`${NOKTALI_TARIH.source}|${AYLI_TARIH.source}`, 'u') },
    { ad: 'persentil ya da z-skoru (ya da hesaplanamadığı)', re: /persentil|(?<!\p{L})p\s?\d{1,2}(?![\p{L}\d])|z(?:-|\s)?skor|(?<!\p{L})sds(?!\p{L})|hesaplanam|tek ölçüm/u },
    { ad: 'hız / eğilim', re: /(?<!\p{L})hız|artış|eğilim|seyir|kayma|kaymış|izliyor|yavaşla|hızlan|düşüş|paralel|tek ölçüm/u },
  ],
  asi: [
    { ad: 'kesin yaş', re: YAS },
    { ad: 'uygulandığı belgelenenler', re: /uygulan|belgelen|kay[ıi]t/u },
    { ad: 'eksik / zamanı gelen (ya da tam)', re: /(?<!\p{L})eksik|zamanı (?:gelmiş|geçmiş)|gecikmiş|telafi|(?<!\p{L})tam(?!\p{L})/u },
    { ad: 'yaklaşan / planlanan', re: /yaklaşan|sıradaki|sonraki|önümüzdeki|planlan|randevu/u },
  ],
  gelisim: [
    { ad: 'Genel değerlendirme', re: /genel değerlendirme/u },
    { ad: 'Güçlü alanlar', re: /güçlü alan/u },
    { ad: 'İzlenmesi gereken alanlar', re: /izlenmesi gereken alan/u },
    { ad: 'Gelişimsel risk ve koruyucu etmenler', re: /risk ve koruyucu etmen/u },
    { ad: 'Tarama durumu', re: /tarama durumu/u },
    { ad: 'Önerilen sonraki adım', re: /önerilen sonraki adım/u },
  ],
  takip: [
    { ad: 'Bugün', re: /(?<!\p{L})bugün/u },
    { ad: 'Yakın zamanda', re: /yakın zamanda|yakında/u },
    { ad: 'Daha sonra / rutin', re: /daha sonra|rutin/u },
  ],
  'vizit-ozeti': [
    { ad: 'tarih', re: new RegExp(`${NOKTALI_TARIH.source}|${AYLI_TARIH.source}`, 'u') },
    { ad: 'yaş', re: YAS },
    { ad: 'şikayet', re: /şik[aâ]yet|yakınma|başvur/u },
    { ad: 'bulgular', re: /bulgu|fizik muayene|muayenede/u },
    { ad: 'tahlil', re: /(?<!\p{L})lab|tahlil|tetkik|hemogram/u },
    { ad: 'aşı', re: /aşı/u },
    { ad: 'kilo / boy / baş çevresi', re: /(?<!\p{L})kilo|(?<!\p{L})boy(?!\p{L}{3})|baş çevre/u },
    { ad: 'tedavi', re: /tedavi|ilaç|reçete/u },
    { ad: 'plan', re: /(?<!\p{L})plan|kontrol|öneri/u },
  ],
}

/** The required parts of a structured question are present; the snapshot is not a visit-by-visit list. */
export function bolumler(metin: string, yapi: YapiTuru | null | undefined): Sonuc {
  const gereken = yapi ? YAPI_BOLUMLERI[yapi] : undefined
  if (!gereken || !metin.trim()) return null
  const k = kucuk(metin)
  // "No open item" is a complete answer to the open-items question.
  if (yapi === 'takip' && ACIK_IS_YOK.test(k)) return tamam('açık iş yok cümlesi')
  const eksik = gereken.filter((b) => !b.re.test(k)).map((b) => b.ad)
  if (yapi === 'ozet') {
    const n = tarihSayisi(metin)
    if (n > OZET_TARIH_SINIRI) eksik.push(`her vizit anlatılmış (${n} ayrı tarih)`)
  }
  return eksik.length ? kusur(`eksik: ${eksik.join('; ')}`) : tamam()
}

/* ───────────────────────────── Q-30 the doctor must hear the answer ───────────────────────────── */

export const SES_CUMLE_SINIRI = 7
export const SES_ANLATI_TABANI = 5
/** About 25 seconds of Turkish speech. A proxy: the real duration is measured in the live spot check. */
export const SES_KELIME_SINIRI = 65

const EKRANA_ISARET = /^(?:\d+ madde, ekranınızda|tabloyu ekranınıza yazdım|devamı ekranınızda(?: hocam)?|ayrıntıları ekranınıza yazdım(?: hocam)?|iletişim bilgisini ekranınıza yazdım)[.!]?$/u
const SOZ_BASLIGI = /^(?:dayanak|kayıt|yorum|dikkat|takip|eksik kayıt|dikkat \/ eksik kayıt \/ takip)[.:]?$/u

/** Spoken sentences that carry content: pointers to the screen and bare headings left out. */
export function sozIcerigi(soz: string): string[] {
  return cumleler(soz).filter((c) => { const k = kucuk(c); return !EKRANA_ISARET.test(k) && !SOZ_BASLIGI.test(k) })
}
/** Content units of a screen answer: sentences, list items and table rows; headings left out. */
function ekranBirimi(ekran: string): number {
  return birimler(ekran).filter((c) => !SOZ_BASLIGI.test(kucuk(sade(c)).replace(/[*_]/g, ''))).length
}

/** At most seven sentences and about 25 seconds, unless the doctor asked to have the answer read. */
export function sesUzunluk(soz: string, okuIstegi: boolean | undefined): Sonuc {
  if (!soz.trim() || okuIstegi) return null
  const c = sozIcerigi(soz).length
  const k = kelimeSayisi(soz)
  if (c > SES_CUMLE_SINIRI) return kusur(`${c} cümle söylendi (sınır ${SES_CUMLE_SINIRI})`)
  if (k > SES_KELIME_SINIRI) return kusur(`${k} kelime söylendi (sınır ${SES_KELIME_SINIRI}, yaklaşık 25 sn)`)
  return tamam(`${c} cümle, ${k} kelime`)
}

/**
 * The spoken answer carries content: not only pointers to the screen. A narrative answer (an İlk-10 question or a
 * visit summary) has five content sentences, or as many as the screen answer has when that is fewer.
 */
export function sesAnlati(soz: string, ekran: string, yapi: YapiTuru | null | undefined): Sonuc {
  if (!soz.trim()) return null
  const c = sozIcerigi(soz).length
  if (c === 0) return kusur(`yalnız ekrana işaret edildi: "${kisalt(soz, 60)}"`)
  if (!yapi) return tamam()
  const taban = Math.min(SES_ANLATI_TABANI, Math.max(1, ekranBirimi(ekran)))
  return c < taban ? kusur(`anlatı ${c} cümle (en az ${taban}); "${kisalt(soz, 60)}"`) : tamam(`${c} cümle`)
}

/* ───────────────────────────── Q-31 speakable ───────────────────────────── */

/** Dates are said as "15 Mayıs 2025": no dd.mm.yyyy in the spoken text. */
export function sesTarih(soz: string): Sonuc {
  if (!soz.trim()) return null
  const m = NOKTALI_TARIH.exec(soz)
  return m ? kusur(`rakamla tarih: "${m[0]}"`) : tamam()
}

const SES_BICIM = /\||\*\*|__|`|^\s*#{1,6}\s|^\s*[-*•]\s|\[[^\]\n]+\]\([^)\n]+\)|\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/im

/** No markdown, table, pipe, link or id in the spoken text. */
export function sesBicim(soz: string): Sonuc {
  if (!soz.trim()) return null
  const m = SES_BICIM.exec(soz)
  return m ? kusur(`biçim işareti: "${kisalt(m[0], 20)}"`) : tamam()
}

const BIRIM_ARTIGI = /°|µ|%|(?<![\p{L}\d])(?:kg|cm|mm|mg|mcg|ml|gr|dl|fl|iu|mmhg)(?![\p{L}\d])|\p{L}\s*\/\s*\p{L}/iu

/** Numbers are said with their units: no unit symbol or abbreviation is left in the text handed to the speech engine. */
export function sesBirim(okunus: string | undefined): Sonuc {
  if (okunus === undefined || !okunus.trim()) return null
  const metin = okunus.replace(/\[break\]/g, ' ')
  const m = BIRIM_ARTIGI.exec(metin)
  return m ? kusur(`okunmayan birim: "${kisalt(metin.slice(Math.max(0, m.index - 12), m.index + m[0].length + 4), 30)}"`) : tamam()
}

const TELEFON = /(?<!\d)(?:\+?90[\s-]?)?\(?0?5\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}(?!\d)|(?<!\d)0\d{3}[\s-]\d{3}[\s-]\d{2}[\s-]\d{2}(?!\d)/
const EPOSTA = /[\w.+-]+@[\w-]+\.[\w.]+/
const TC_NO = /(?<!\d)[1-9]\d{10}(?!\d)/
const DOGUM_TARIHI = /d\.\s?t\.|doğum tarihi\s*:?\s*\d/iu

/** No identity or contact value in the spoken text: telephone, e-mail, national id, birth date, and the fixture's own values. */
export function sesKimlik(soz: string, degerler: string[] | undefined): Sonuc {
  if (!soz.trim()) return null
  if (TELEFON.test(soz)) return kusur('telefon numarası seslendirildi')
  if (EPOSTA.test(soz)) return kusur('e-posta seslendirildi')
  if (TC_NO.test(soz)) return kusur('kimlik numarası seslendirildi')
  if (DOGUM_TARIHI.test(soz)) return kusur('doğum tarihi seslendirildi')
  const k = kucuk(soz)
  const sizan = (degerler || []).find((d) => d.trim() && k.includes(kucuk(d)))
  return sizan ? kusur(`kimlik değeri seslendirildi: "${kisalt(sizan, 20)}"`) : tamam()
}

/* ───────────────────────────── Q-32 never silent ───────────────────────────── */

/** The turn produced an answer. Recogniser noise that is dropped by design expects none. */
export function sessizDegil(g: Pick<KaliteGirdisi, 'yuzey' | 'ekran' | 'soz' | 'gurultu'>): Sonuc {
  if (g.gurultu) return null
  const metin = g.yuzey === 'ses' ? g.soz || '' : g.ekran
  return metin.trim() ? tamam() : kusur(g.yuzey === 'ses' ? 'sesli tur cevapsız kaldı' : 'cevap boş')
}
