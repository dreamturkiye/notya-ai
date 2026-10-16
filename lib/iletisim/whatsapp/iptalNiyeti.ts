/**
 * WHATSAPP-API-01 / WHATSAPP-CANCEL-01 — "does this message cancel the appointment?" (Turkish, pure, no network).
 *
 * The patient writes however he writes: "iptal", "ıptall", "gelemiyorum maalesef", "işim çıktı gelemeyeceğim",
 * "vazgeçtim", "o saatte uygun değilim". This module turns that into ONE of five outcomes and the caller (niyet.ts →
 * yanit.ts) decides what each may do:
 *
 *   guclu     — a clear, first-person cancel: iptal family (typos included), "gelemiyorum / gelemeyeceğim /
 *               katılamayacağım" family, "vazgeçtim", "randevuyu sil/kapat" (an appointment noun is REQUIRED).
 *               May drive the AUTOMATIC cancel of the patient's next appointment.
 *   zayif     — ambiguous or hedged: "uygun değilim", "müsait değilim", "işim çıktı" alone, "hastalandım" alone,
 *               "şehir dışındayım" alone, or a strong phrase softened by "belki / sanırım / olursa". NEVER auto-cancels:
 *               it becomes a flagged card (and the existing propose-slots flow).
 *   yeniden   — reschedule wording ("ertelemek istiyorum", "başka güne alabilir miyiz"). Not a cancellation; wins over
 *               a cancel word in the same message ("iptal... ama başka güne alabilir miyiz" keeps the appointment).
 *   olumsuz / soru / celiski — negation ("iptal etmiyorum", "iptal değil", "iptal etmeyin", "gelemeyecek değilim"), a
 *               question ("iptal mi oldu?", "gelemiyor muyum"), or a contradiction ("iptalden vazgeçtim"). Never acts.
 *   yok       — nothing recognised (the LLM may label it for the card; it can never cancel).
 *
 * Folding (normalizeTr): ı/İ/I/i → i, ç→c, ğ→g, ö→o, ş→s, ü→u, lower-case, emoji and punctuation stripped, repeated
 * letters collapsed ("iptalll" → "iptal", "maalesef" → "malesef"). After folding the text is plain ASCII, so matching is
 * done on whole TOKENS — never with JS \b or the /i flag, which both mishandle Turkish dotted/dotless i.
 * Every vocabulary entry below is written in the folded + collapsed form.
 *
 * Opt-out (STOP / DUR) is NOT decided here: niyet.ts matches those exact words before this module is asked.
 * Language: Turkish only. Each country build needs its own phrase set (see OPEN-COMMITMENTS WHATSAPP-API-01).
 */

export type IptalTuru = 'guclu' | 'zayif' | 'yeniden' | 'olumsuz' | 'soru' | 'celiski' | 'yok'

export interface IptalSonucu {
  tur: IptalTuru
  /** Short machine reason for logs/tests — never message text. */
  neden: string
  /** The folded message is exactly "iptal" (the one word that keeps its SMS meaning when there is nothing to cancel). */
  yalinIptal: boolean
}

/** Turkish-aware fold. See the file header. */
export function normalizeTr(metin: string): string {
  return String(metin || '')
    .replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/([a-z])\1+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Optimal-string-alignment distance (insert / delete / substitute / adjacent swap). Inputs are short tokens. */
export function duzeltmeMesafesi(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const m = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + m)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  }
  return d[a.length][b.length]
}

/** iptal, iptali, iptalini … and the typos ıptl, iptl, ipatal, itpal (first letter must be i: "aptal" is an insult, not a cancel). */
export function iptalKelimesiMi(t: string): boolean {
  if (t.startsWith('iptal')) return t.length <= 12
  if (t[0] !== 'i' || t.length < 4 || t.length > 6) return false
  return duzeltmeMesafesi(t, 'iptal') <= 1
}

// "I cannot come" — first person only ("gelemiyor" = somebody else, left to the LLM / the doctor). Optional -i/-ı accusative
// ("gelemeyeceğimi bildirmek istiyorum"). Folded + collapsed spellings.
const GELEMEM = new RegExp(
  '^(' + [
    'gelemiyorum', 'gelemiyoruz', 'gelemiyom', 'gelemiycem', 'gelemiycez', 'gelemiycam', 'gelemeyecegim', 'gelemeyecegiz', 'gelemeyecem',
    'gelemeyecez', 'gelemem', 'gelemeyiz', 'gelemicem', 'gelemicez', 'gelemicam',
    'gelmeyecegim', 'gelmeyecegiz', 'gelmeyecem', 'gelmiyorum', 'gelmiyoruz', 'gelmiycem', 'gelmiycez', 'gelmicem', 'gelmicez',
    'katilamayacagim', 'katilamayacagiz', 'katilamiyorum', 'katilamiyoruz', 'katilamam', 'katilamicam', 'katilamicaz', 'katilamiycam',
    'gidemiyorum', 'gidemiyoruz', 'gidemem', 'gidemeyecegim', 'gidemiycem',
  ].join('|') + ')(i|yi)?$',
)
// Third-person / bare forms ("gelemiyor", "gelemeyecek"): never a cancel by themselves, but they let a negation or a
// question around them ("gelemeyecek değilim", "gelemiyor muyum") be recognised and labelled instead of ignored.
const GELEME_NOTR = /^(gelemiyor|gelemeyecek|gelemez|gelmiyor|gelmeyecek|katilamiyor|katilamayacak)$/
const VAZGECTIM = /^(vazgectim|vazgectik|vazgeciyorum|vazgeciyoruz|vazgecicem|vazgecicez|vazgecicam|vazgecmek|vazgecmeye)$/

// Reschedule wording (folded text, token-anchored phrases joined with spaces). NOTE: normalizeTr collapses doubled letters, so
// "saat" is "sat" here ("saatini degistir" → "satini degistir").
const YENIDEN_ILE = /(^| )(ertel\w*|kaydir\w*|yeniden planla\w*|ileri al\w*|one al\w*|degistirebil\w*|degistirmek|degistirelim|baska (bir )?(gun|sat|zaman|tarih)\w*|baska (bir )?zamana|(sat|sati|satini|tarih|tarihi|tarihini|gun|gunu|gununu) degistir\w*|randevuyu degistir\w*|randevumu degistir\w*|gec\w* gelebilir|erken gelebilir)( |$)/

// Ambiguous inability: stripped of their "degil" before the negation scan (otherwise "uygun degilim" would read as negation).
const ZAYIF_DEGIL = /(^| )(uygun|musait|mumkun|olanakli|elverisli) (degil\w*|olmay\w*|olama\w*)/g
const ZAYIF_IFADE = [
  /(^| )(uygun|musait|mumkun|olanakli|elverisli) (degil\w*|olmay\w*|olama\w*)/,
  /(^| )isim (cikti|cikmis|var)( |$)/,
  /(^| )(hastalandim|hastayim|rahatsizlandim|rahatsizim|ateslendim|ates(im)? var|grip oldum|grip(im)? var|covid)( |$)/,
  /(^| )(sehir disindayim|sehir disina|sehir disinda|seyahatteyim|seyahatim var|yoldayim|disardayim|tatildeyim|yurt disindayim)( |$)/,
  /(^| )(gelemeyebil|katilamayabil|gidemeyebil|yetisemeyebil)\w*( |$)/,
  /(^| )(yetisemiyorum|yetisemem|yetisemeyecegim|yetisemicem)( |$)/,
  /(^| )(olmaz|olamaz)( |$)/,
]

const OLUMSUZLAMA_TOKENLERI = new Set([
  'etmiyorum', 'etmiyoruz', 'etmeyin', 'etmeyiniz', 'etme', 'etmem', 'etmeyelim', 'edilmesin', 'edilmedi', 'edilmeyecek',
  'degil', 'degilim', 'degiliz', 'degildir', 'istemiyorum', 'istemiyoruz', 'olmasin', 'olmayacak', 'yapmayin', 'yapmayiniz',
  'vazgecmedim', 'vazgecmem', 'vazgecmiyorum', 'vazgecmiyoruz', 'vazgecmeyin', 'vazgecmeyiz',
])
const SORU_TOKENLERI = new Set([
  'mi', 'mu', 'miyim', 'muyum', 'miyiz', 'muyuz', 'midir', 'mudur', 'miydi', 'muydu', 'misin', 'musun', 'misiniz', 'musunuz',
  'neden', 'nasil', 'nerede', 'nezaman', 'hangi', 'kac', 'nedir', 'niye', 'nicin',
])
const NEZAMAN = /(^| )ne zaman( |$)/
// "iptal edebilir misiniz", "iptal eder misiniz", "iptal rica ediyorum": a polite request to the practice, not a question about it.
const NEZAKET = /(^| )(edebilir|eder|yapabilir|yapar|alabilir|silebilir|kapatabilir|kapatir|siler) (misiniz|misin|musunuz|musun)( |$)/
const IPTAL_DURUM_ANLATIMI = /(^| )iptal\w* (edildi|edilmis|edilen|ettiniz|ettiginiz|ettigini|olmus|oldu|olan|olacak mi)( |$)/
// Hedges / conditions: the strong phrase is softened, never executed on its own.
const BELIRSIZLIK_TOKENLERI = new Set([
  'belki', 'sanirim', 'galiba', 'herhalde', 'muhtemelen', 'olabilir', 'eger', 'olursa', 'cikarsa', 'gerekirse', 'durumunda',
  'takdirde', 'ihtimal', 'acaba', 'umarim', 'dilerim',
])
const BELIRSIZLIK_EKI = /^(gelemeyebil|yapamayabil|katilamayabil|gidemeyebil)\w*$/

const RANDEVU_ISMI = /^randevu(yu|mu|m|muzu|nu|su|lar\w*)?$/
const SIL_KAPAT = /^(sil|silin|silebil\w*|siler\w*|silsen\w*|kapat|kapatin|kapatabil\w*|kapatir\w*|kapatiniz|siliniz)$/

const MAKSIMUM_KELIME = 14

export function iptalSiniflandir(metin: string): IptalSonucu {
  const k = normalizeTr(metin)
  const yalinIptal = k === 'iptal'
  const sonuc = (tur: IptalTuru, neden: string): IptalSonucu => ({ tur, neden, yalinIptal })
  if (!k) return sonuc('yok', 'bos')
  const kelimeler = k.split(' ')
  if (kelimeler.length > MAKSIMUM_KELIME) return sonuc('yok', 'uzun_mesaj')

  // "vaz geçtim" typed with a space.
  const birlesik = kelimeler.join(' ').replace(/(^| )vaz gec/g, '$1vazgec').split(' ')

  const iptalVar = birlesik.some(iptalKelimesiMi)
  const gelemem = birlesik.some((t) => GELEMEM.test(t))
  const vazgec = birlesik.some((t) => VAZGECTIM.test(t))
  const randevuNesnesi = birlesik.some((t) => RANDEVU_ISMI.test(t))
  const silKapat = randevuNesnesi && birlesik.some((t) => SIL_KAPAT.test(t))
  const yeniden = YENIDEN_ILE.test(' ' + k + ' ')
  const zayifMetin = k.replace(ZAYIF_DEGIL, ' _zayif_ ')
  const zayifIfade = ZAYIF_IFADE.some((r) => r.test(' ' + k + ' '))

  const gucluAdayi = (iptalVar && !IPTAL_DURUM_ANLATIMI.test(' ' + k + ' ')) || gelemem || vazgec || silKapat
  const notr = birlesik.some((t) => GELEME_NOTR.test(t))
  const hicbiriYok = !gucluAdayi && !yeniden && !zayifIfade && !notr
  if (hicbiriYok) return sonuc('yok', 'sinyal_yok')

  // "iptalden vazgeçtim" / "iptal ettim vazgeçtim": the words fight each other — do nothing automatic.
  if (iptalVar && vazgec) return sonuc('celiski', 'iptal_ve_vazgec')

  const olumsuz = zayifMetin.split(' ').some((t) => OLUMSUZLAMA_TOKENLERI.has(t))
  if (olumsuz) return sonuc('olumsuz', 'olumsuzlama')

  // A reschedule wish keeps the appointment, even next to a cancel word.
  if (yeniden) return sonuc('yeniden', gucluAdayi ? 'iptal_ve_erteleme' : 'erteleme')

  const nezaket = NEZAKET.test(' ' + k + ' ')
  const soru = !nezaket && (birlesik.some((t) => SORU_TOKENLERI.has(t)) || NEZAMAN.test(' ' + k + ' '))
  if (soru) return sonuc('soru', 'soru')

  if (!gucluAdayi && !zayifIfade) return sonuc('yok', 'sinyal_yok')

  const belirsiz = birlesik.some((t) => BELIRSIZLIK_TOKENLERI.has(t) || BELIRSIZLIK_EKI.test(t))
  if (gucluAdayi && !belirsiz) return sonuc('guclu', iptalVar ? 'iptal' : gelemem ? 'gelemem' : vazgec ? 'vazgec' : 'randevu_sil')
  return sonuc('zayif', gucluAdayi ? 'belirsiz_ifade' : 'muglak_sinyal')
}

/**
 * "yeniden randevu / tekrar randevu almak istiyorum" — a patient asking to rebook after a cancellation. Used ONLY when the
 * patient has no active appointment and a recent automatic cancel (yanit.ts); with an active appointment the same words are a
 * new booking request and are left to the doctor.
 */
export function yenidenRandevuMu(metin: string): boolean {
  const k = ' ' + normalizeTr(metin) + ' '
  return /( yeniden| tekrar| yeni) randevu( |$)/.test(k) || /randevu (alabilir miyim|almak istiyorum|istiyorum|alayim|rica)/.test(k)
}
