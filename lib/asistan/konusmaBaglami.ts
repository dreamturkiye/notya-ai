/**
 * NOTYA-KONUSMA-BAGLAMI-01 (Kaan, 2026-09-30) — deterministic conversation continuity for the tek-beyin path
 * (voice fish-tur and text chat share ayseCevapla, so both channels get it).
 *
 * Witnessed with Dr. Gökhan after the Sonnet → Luna switch: "Bugün randevum var mı?" → correct; "Peki yarın var mı?"
 * → no longer understood as a calendar question. Sonnet had been tracking the running topic implicitly; Luna does
 * not. Topic tracking, search scoping and session memory must not depend on the model.
 *
 * Three pieces, all model-independent:
 *  1. After every turn the session records `konusma` (asistan_sessions.active_context.konusma): last intent, the
 *     entities it carried (patient, date, drug, lab test, vaccine), a one-line answer summary, the effective question
 *     and the time.
 *  2. BEFORE intent matching an elliptical utterance ("peki yarın?", "dozu?", "kimler?", "ya Rıdvan'ın?") is rewritten
 *     into a full question by inheriting the missing slots from the previous turn. The rewritten question goes to the
 *     deterministic matchers (calendar, chart card, kanıt yolu, search) AND to the model ("DOKTORUN KASTI").
 *  3. The model prompt tail carries a compact KONUŞMA BAĞLAMI block for the residual model-path questions.
 *
 * A patient named in the new utterance always overrides the inherited patient; an intent word in the new utterance
 * overrides the inherited intent; a full question resets the context; the context expires after 10 minutes.
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'
import { takvimSorusuMu } from '@/lib/randevu/takvimSorusu'
import { goreliTarihCoz, haftaAraligiCoz, saatDilimiSec } from '@/lib/randevu/tarihCozumle'
import { kayitNiyetiMi } from '@/core/eylemler/oneri'
import { dosyaAcmaIstegiMi } from '@/lib/asistan/aktifHasta'

export type Niyet =
  | 'takvim' | 'hasta-dosya' | 'recete' | 'tahlil' | 'asi' | 'buyume' | 'muayene' | 'not' | 'mesaj-belge' | 'hasta-sayim' | 'genel'

export type TakvimTipi = 'varmi' | 'kac' | 'kimler' | 'bosluk'

export interface Varliklar {
  hastaId?: string | null
  hastaAd?: string | null
  /** The date phrase as said, normalized ("yarin", "cuma", "haftaya", "2026-10-02", "son 30 gun"). */
  tarihSozu?: string | null
  /** ISO day the phrase resolved to (single day), if any. */
  tarih?: string | null
  tarihAralik?: { bas: string; bit: string } | null
  saat?: string | null
  takvimTipi?: TakvimTipi | null
  ilac?: string | null
  tahlil?: string | null
  asi?: string | null
}

export interface KonusmaBaglami {
  sonNiyet: Niyet
  sonVarliklar: Varliklar
  sonCevapOzeti: string
  sonSoru: string
  zaman: string
}

export interface TakipSonucu {
  /** The full question the matchers and the model get. */
  soru: string
  niyet: Niyet
  varliklar: Varliklar
  /** Which slots were inherited (logs / tests). */
  miras: string[]
}

export const BAGLAM_OMRU_MS = 10 * 60 * 1000

const DOSYA_NIYETLERI: ReadonlySet<Niyet> = new Set<Niyet>(['hasta-dosya', 'recete', 'tahlil', 'asi', 'buyume', 'muayene', 'not', 'mesaj-belge'])

/* ---------- lexicons (normalized: lowercase ASCII, trAramaNormalize) ---------- */

const TAHLIL_LISTE = ['crp', 'hemogram', 'ferritin', 'hemoglobin', 'hb', 'hct', 'wbc', 'lokosit', 'trombosit', 'plt', 'mcv', 'demir', 'b12', 'folat', 'tsh', 't4', 't3', 'glukoz', 'glikoz', 'hba1c', 'kreatinin', 'ure', 'alt', 'ast', 'bilirubin', 'sedim', 'sedimantasyon', 'prokalsitonin', 'idrar', 'kultur', 'kan sayimi', 'tam kan', 'biyokimya', 'kan gazi', 'sodyum', 'potasyum', 'kalsiyum', 'fosfor', 'alp', 'ldh', 'inr', 'lipid', 'kolesterol', 'trigliserid', 'hdl', 'ldl', 'cinko', 'vitamin d', '25 oh', 'ige', 'total ige', 'strep', 'bogaz kulturu', 'ttg', 'celyak', 'amilaz', 'lipaz', 'ggt', 'albumin', 'esr', 'retikulosit', 'transferrin']
const ASI_LISTE = ['kkk', 'hepatit a', 'hepatit b', 'bcg', 'dabt', 'ipa', 'hib', 'kpa', 'opa', 'sucicegi', 'su cicegi', 'meningokok', 'menengokok', 'rotavirus', 'grip', 'hpv', 'tetanoz', 'kizamik', 'kabakulak', 'kizamikcik', 'difteri', 'bogmaca', 'polio', 'pnomokok', 'besli karma', 'dortlu karma', 'karma', 'zaturre']
const ILAC_LISTE = ['amoksisilin', 'augmentin', 'klacid', 'klaritromisin', 'calpol', 'parasetamol', 'ibuprofen', 'nurofen', 'dolven', 'sefuroksim', 'azitromisin', 'd vitamini', 'demir damlasi', 'ferro', 'probiyotik', 'ventolin', 'salbutamol', 'prednol', 'prednizolon', 'antibiyotik', 'cinko surubu', 'sefiksim', 'sefaklor', 'benzatin', 'penisilin', 'antihistaminik', 'zyrtec', 'setirizin', 'aerius', 'montelukast', 'singulair', 'ondansetron', 'zofran', 'flixotide', 'pulmicort', 'budesonid', 'rhinocort', 'wellcare']

function esc(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
const listeRe = (l: string[]) => new RegExp(`\\b(${[...l].sort((a, b) => b.length - a.length).map(esc).join('|')})\\b`)
const TAHLIL_RE = listeRe(TAHLIL_LISTE)
const ASI_RE = listeRe(ASI_LISTE)
const ILAC_RE = listeRe(ILAC_LISTE)

/** Date phrases the calendar AND the search windows understand. */
const TARIH_RE = /\b(bugun|yarin|dun|obur gun|oburgun|ertesi gun|haftaya|gelecek hafta|onumuzdeki hafta|bu hafta|gecen hafta|bu ay|gecen ay|bu yil|son \d+ gun|son \d+ ay|pazartesi|sali|carsamba|persembe|cuma|cumartesi|pazar|20\d{2}-\d{2}-\d{2}|\d{1,2} (?:ocak|subat|mart|nisan|mayis|haziran|temmuz|agustos|eylul|ekim|kasim|aralik)(?: 20\d{2})?)\b/
const SAAT_SOZ_RE = /\b(?:saat\s+)?([01]?\d|2[0-3])\s*(?:['’]?\s*(?:te|de|ta|da)\b|(?:gibi|civari|sularinda)\b)/
const GUN_PARCASI_RE = /\b(sabah|ogleden sonra|oglen|ogle|aksam|aksamustu|ikindi)\b/

/** Follow-up markers: the utterance leans on the previous turn. */
const TAKIP_RE = /(^|\s)(peki|ya|e|ee|o zaman|ozaman|ayni|onun|bunun|o|kendisi|kendisinin|obur|bir de|birde|bir daha|ondan|bundan)(\s|$)/
const ISARET_KELIMELERI = new Set(['peki', 'ya', 'e', 'ee', 'o', 'zaman', 'ozaman', 'ayni', 'onun', 'bunun', 'kendisi', 'kendisinin', 'obur', 'birde', 'ondan', 'bundan', 'hocam', 'ayse', 'acaba', 'bir', 'de', 'da', 'daha'])
/** Words that carry no slot. */
const DOLGU = new Set(['peki', 'ya', 'e', 'ee', 'o', 'zaman', 'ozaman', 'ayni', 'sey', 'onun', 'bunun', 'kendisi', 'kendisinin', 'obur', 'bir', 'de', 'da', 'daha', 'birde', 'ondan', 'bundan', 'hocam', 'ayse', 'acaba', 'bakalim', 'bakar', 'misin', 'misiniz', 'soyle', 'soyler', 'soylesene', 'bana', 'bi', 'simdi', 'ki', 'hani', 'yani', 'tamam', 'iyi', 've', 'ile', 'lutfen', 'su', 'bu', 'hasta', 'hastanin', 'hastam', 'hastamin', 'mi', 'mu', 'ne', 'nedir', 'neydi', 'kac', 'kacti', 'var', 'yok', 'nasil', 'nasildi', 'hangisi', 'hangi', 'neler', 'nelerdi', 'kim', 'kimdi', 'kimler', 'olan', 'oldu', 'olmus', 'idi', 'di', 'ti', 'icin'])
/** Slot words an elliptical utterance may consist of besides intent words, entities, dates, names and fillers. */
const SLOT_RE = /^(doz\w*|gun|gunluk|sure\w*|kilo\w*|boy|boyu|boyunu|bas|cevresi|persentil\w*|sonuc\w*|sonuclar\w*|eksik\w*|tam|tamam|onceki\w*|once|ondan|siradaki|sirada|verdik|verildi|yazdik|yazildi|yazilmis|yaptik|yapildi|yapilmis|olmus|oldu|geldi|gelmis|bakildi|bakilmis|cikmis|cikti|kaldi|kalan|son|en|ilk|tarih\w*|zaman|saat\w*|sabah\w*|ogle\w*|ogleden|sonra|aksam\w*|ikindi|bosluk\w*|yer|bos|musait\w*|uygun|hasta\w*|randevu\w*|kadar\w*|geliyor|gelecek|gelen|gelenler|gordum|program\w*|durum\w*|dolu\w*|kac|kacti|ne|neydi|nedir|neler|nasil|nasildi|kim|kimdi|kimler|hangi|hangisi|var|yok|mi|mu|mu|degeri|degerleri|seviyesi|duzeyi|karnesi|listesi|dozlari|dozu|gunu|kan|grubu|yas\w*|alerji\w*|kronik\w*|cinsiyet\w*|anne\w*|baba\w*|veli\w*|telefon\w*|adres\w*|dogum\w*|dosya\w*|ozet\w*)$/
const SORU_RE = /\b(var mi|yok mu|ne zaman|kim|kimler|kimdi|kac|kacti|hangisi|hangi|neler|nedir|neydi|ne|nasil|nasildi|mi|mu)\b/

function normalize(mesaj: string | null | undefined): string {
  return trAramaNormalize(String(mesaj || '')).replace(/['’]/g, '').replace(/[?!.,;:"“”]+/g, ' ').replace(/\s+/g, ' ').trim()
}

/** "Rıdvan Dilmen'in" — the name with the apostrophe genitive as written; ASR "ridvanin" when it is the only word. */
export function adCikar(mesaj: string): string | null {
  const ham = String(mesaj || '').trim()
  const m = ham.match(/(\p{L}{2,}(?:\s+\p{L}{2,})?)\s?['’](?:n[ıiuü]n|[ıiuü]n)\b/u)
  if (m) {
    const parcalar = m[0].split(/\s+/)
    while (parcalar.length > 1 && DOLGU.has(normalize(parcalar[0])) && normalize(parcalar[0]) !== 'ayse') parcalar.shift()
    return parcalar.join(' ')
  }
  // ASR (no apostrophe): a single non-filler token in the genitive.
  const kelimeler = normalize(ham).split(' ').filter((k) => k && !DOLGU.has(k))
  if (kelimeler.length === 1 && /(n[iu]n|[iu]n)$/.test(kelimeler[0]) && kelimeler[0].length >= 6 && !SORU_RE.test(` ${kelimeler[0]} `) && !TARIH_RE.test(` ${kelimeler[0]} `)) {
    const orijinal = ham.split(/\s+/).find((w) => normalize(w) === kelimeler[0])
    return orijinal || null
  }
  return null
}

/** Turkish genitive with apostrophe: Ali'nin, Ayşe'nin, Umut'un, Rıdvan'ın, Gökçe'nin, Umutcan Türkoğlu'nun. */
export function genitif(ad: string): string {
  const a = String(ad || '').trim()
  if (!a) return ''
  if (/['’]/.test(a)) return a
  const son = a.split(/\s+/).pop() || a
  const unluler = son.toLocaleLowerCase('tr-TR').match(/[aeıioöuü]/g)
  const u = unluler ? unluler[unluler.length - 1] : 'i'
  const ek = 'aı'.includes(u) ? 'ın' : 'ei'.includes(u) ? 'in' : 'ou'.includes(u) ? 'un' : 'ün'
  const unluBiter = /[aeıioöuüAEIİOÖUÜ]$/.test(son)
  return `${a}'${unluBiter ? 'n' : ''}${ek}`
}

/** Explicit intent word in the message, or null. */
export function niyetBul(mesaj: string): Niyet | null {
  const n = ` ${normalize(mesaj)} `
  if (!n.trim()) return null
  if (takvimSorusuMu(mesaj)) return 'takvim'
  if (/\b(randevu\w*|takvim\w*|bosluk\w*|musait\w*)\b/.test(n)) return 'takvim'
  if (/\b(kac hasta\w*|hastalarim\w*|kac kisi|kac cocuk|kac vaka|hasta listesi|listele|toplam hasta|kac tane hasta)\b/.test(n)) return 'hasta-sayim'
  if ((/\basi(lar|lari|larini|larinda|larindan|larinin|si|sini|sinin|nin|ya|yi|lariyla)?\b|asi karnesi|asisi|asilari/.test(n) || (ASI_RE.test(n) && /\basi|doz|yapildi|yaptik|ne zaman|olmus/.test(n))) && !/antibiyoti/.test(n)) return 'asi'
  if (/\b(tahlil\w*|tetkik\w*|lab|laboratuvar\w*|sonuc\w*|kan (degeri|degerleri|sayimi|testi|tetkiki))\b/.test(n) || TAHLIL_RE.test(n)) return 'tahlil'
  // "doz" alone is not an intent word — "kaç doz?" after an aşı turn stays aşı, "dozu?" after a reçete turn stays reçete.
  if (/\b(recete\w*|ilac\w*|surup\w*|tablet\w*|damla\w*|antibiyoti\w*)\b/.test(n) || ILAC_RE.test(n)) return 'recete'
  if (/\b(kilo\w*|boy|boyu|boyunu|bas cevresi|persentil\w*|buyume\w*|tarti\w*|kac aylik)\b/.test(n)) return 'buyume'
  if (/\b(muayene\w*|soap|vizit\w*|tani\w*|teshis\w*|bulgu\w*|ates\w*|tansiyon\w*|nabiz\w*|nabzi|sikayet\w*|kontrol\w*|spo2)\b/.test(n)) return 'muayene'
  if (/\bnot\b|\bnotlar\w*|not dus\w*|not al\w*/.test(n)) return 'not'
  if (/\b(belge\w*|mesaj\w*|whatsapp|e ?posta|mail|e ?nabiz\w*|enabiz|rapor\w*)\b/.test(n)) return 'mesaj-belge'
  if (/\b(dosya\w*|ozet\w*|alerji\w*|kan grubu|kronik\w*|yas|yasinda|yasi|gelisim\w*|anne\w*|baba\w*|veli\w*|telefon\w*|adres\w*|dogum\w*|cinsiyet\w*)\b/.test(n)) return 'hasta-dosya'
  return null
}

/** Slots present in the message itself (no inheritance). */
export function varliklariCikar(mesaj: string, secenek: { tz?: string | null; simdi?: Date } = {}): Varliklar {
  const n = ` ${normalize(mesaj)} `
  const tz = saatDilimiSec(secenek.tz)
  const v: Varliklar = {}
  const tm = n.match(TARIH_RE)
  if (tm) {
    v.tarihSozu = tm[1]
    v.tarih = goreliTarihCoz(tm[1], tz, secenek.simdi)
    v.tarihAralik = haftaAraligiCoz(tm[1], tz, secenek.simdi)
  }
  const sm = String(mesaj || '').match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/)
  if (sm) v.saat = `${String(sm[1]).padStart(2, '0')}:${sm[2]}`
  else {
    const s2 = n.match(SAAT_SOZ_RE)
    if (s2 && s2[1]) {
      let saat = Number(s2[1])
      if (saat >= 1 && saat <= 7 && !/\b(sabah|gece|sabahi)\b/.test(n)) saat += 12 // clinic hours: "saat 3" is 15:00
      v.saat = `${String(saat).padStart(2, '0')}:00`
    }
  }
  if (/\bkac (hasta\w*|kisi|cocuk|randevu\w*)\b/.test(n)) v.takvimTipi = 'kac'
  else if (/\b(kimler|kim geliyor|kim gelecek|kim geldi|kimlerdi|hangi hastalar)\b/.test(n)) v.takvimTipi = 'kimler'
  else if (/\b(bosluk\w*|bos mu|yer var|musait\w*|uygun mu)\b/.test(n)) v.takvimTipi = 'bosluk'
  else if (/\b(var mi|yok mu|randevu\w*)\b/.test(n)) v.takvimTipi = 'varmi'
  const t = n.match(TAHLIL_RE); if (t) v.tahlil = t[1]
  const a = n.match(ASI_RE); if (a) v.asi = a[1]
  const i = n.match(ILAC_RE)
  if (i) v.ilac = i[1]
  else {
    // "<ilaç> dozu" — the word before doz is the drug when it is not a function word.
    const dm = n.match(/\b([a-z][a-z0-9-]{3,}) doz\w*\b/)
    if (dm && !/^(ilac|ilacin|ilaclarin|kac|son|hangi|toplam|gunluk|asi|asinin|peki)$/.test(dm[1])) v.ilac = dm[1]
  }
  return v
}

/** The record stored after a turn. */
export function baglamKur(g: {
  soru: string
  cevap: string
  niyet: Niyet
  varliklar?: Varliklar
  hasta?: { id: string; ad: string } | null
  zaman?: Date
}): KonusmaBaglami {
  const ozet = String(g.cevap || '').replace(/\*\*|__|`/g, '').split('\n').map((s) => s.trim()).find(Boolean) || ''
  const varliklar: Varliklar = { ...(g.varliklar || {}) }
  if (g.hasta) { varliklar.hastaId = g.hasta.id; varliklar.hastaAd = g.hasta.ad }
  for (const k of Object.keys(varliklar) as (keyof Varliklar)[]) if (varliklar[k] == null) delete varliklar[k]
  return {
    sonNiyet: g.niyet,
    sonVarliklar: varliklar,
    sonCevapOzeti: ozet.length > 160 ? `${ozet.slice(0, 157)}…` : ozet,
    sonSoru: String(g.soru || '').trim().slice(0, 200),
    zaman: (g.zaman || new Date()).toISOString(),
  }
}

/** Validate a stored record; null when absent / malformed / expired (10 min). */
export function baglamOku(ham: unknown, simdi: Date = new Date()): KonusmaBaglami | null {
  if (!ham || typeof ham !== 'object') return null
  const b = ham as Partial<KonusmaBaglami>
  if (typeof b.sonNiyet !== 'string' || typeof b.zaman !== 'string') return null
  const t = Date.parse(b.zaman)
  if (!Number.isFinite(t) || simdi.getTime() - t > BAGLAM_OMRU_MS || t - simdi.getTime() > 60_000) return null
  return {
    sonNiyet: b.sonNiyet as Niyet,
    sonVarliklar: (b.sonVarliklar && typeof b.sonVarliklar === 'object' ? b.sonVarliklar : {}) as Varliklar,
    sonCevapOzeti: String(b.sonCevapOzeti || ''),
    sonSoru: String(b.sonSoru || ''),
    zaman: b.zaman,
  }
}

const TARIH_ETIKET: Record<string, string> = { bugun: 'bugün', yarin: 'yarın', dun: 'dün', 'obur gun': 'öbür gün', oburgun: 'öbür gün', 'ertesi gun': 'ertesi gün', haftaya: 'haftaya', 'gelecek hafta': 'gelecek hafta', 'onumuzdeki hafta': 'önümüzdeki hafta', 'bu hafta': 'bu hafta', 'gecen hafta': 'geçen hafta', 'bu ay': 'bu ay', 'gecen ay': 'geçen ay', 'bu yil': 'bu yıl', pazartesi: 'pazartesi', sali: 'salı', carsamba: 'çarşamba', persembe: 'perşembe', cuma: 'cuma', cumartesi: 'cumartesi', pazar: 'pazar', sabah: 'sabah', 'ogleden sonra': 'öğleden sonra', oglen: 'öğlen', ogle: 'öğle', aksam: 'akşam', aksamustu: 'akşamüstü', ikindi: 'ikindi' }
function tarihYaz(sozu: string): string { return TARIH_ETIKET[sozu] || sozu.replace(/\bgun\b/, 'gün') }

const NIYET_ETIKET: Record<Niyet, string> = { takvim: 'takvim / randevu', 'hasta-dosya': 'hasta dosyası', recete: 'reçete / ilaç', tahlil: 'tahlil / lab', asi: 'aşı', buyume: 'büyüme', muayene: 'muayene / SOAP', not: 'not', 'mesaj-belge': 'mesaj / belge', 'hasta-sayim': 'hasta sayımı / arama', genel: 'genel' }

/** Replace the token span of `soru` whose normalized form equals `hedefN` (phrase) with `yeni`; null when absent. */
function cerceveDegistir(soru: string, hedefN: string, yeni: string, sonEkToleransi = false): string | null {
  const kelimeler = soru.split(/\s+/)
  const hedef = hedefN.split(' ')
  for (let i = 0; i + hedef.length <= kelimeler.length; i++) {
    let uydu = true
    for (let j = 0; j < hedef.length; j++) {
      const kNorm = normalize(kelimeler[i + j])
      const son = j === hedef.length - 1
      if (!(kNorm === hedef[j] || (son && sonEkToleransi && kNorm.startsWith(hedef[j])))) { uydu = false; break }
    }
    if (uydu) return [...kelimeler.slice(0, i), yeni, ...kelimeler.slice(i + hedef.length)].join(' ')
  }
  return null
}

const kisalt = (s: string) => (s.length <= 4 ? s.toUpperCase() : s)

/**
 * Elliptical follow-up → full question. Null when the utterance is a full question, a record/open request, or
 * nothing can be inherited.
 */
export function takipCoz(
  mesaj: string,
  baglam: KonusmaBaglami | null | undefined,
  secenek: { tz?: string | null; simdi?: Date } = {},
): TakipSonucu | null {
  const simdi = secenek.simdi || new Date()
  const b = baglam ? baglamOku(baglam, simdi) : null
  if (!b) return null
  const ham = String(mesaj || '').trim()
  if (!ham || ham.replace(/[.\s…]+/g, '').length < 2) return null
  if (kayitNiyetiMi(ham) || dosyaAcmaIstegiMi(ham)) return null
  const n = normalize(ham)
  const nn = ` ${n} `
  const isaret = TAKIP_RE.test(nn)
  const yeniNiyet = niyetBul(ham)
  const v = varliklariCikar(ham, secenek)
  const adYazili = adCikar(ham)
  const adN = adYazili ? normalize(adYazili).split(' ') : []
  const kelimeler = n.split(' ').filter((k) => k && !DOLGU.has(k))
  const icerik = kelimeler.filter((k) => !SORU_RE.test(` ${k} `))
  const ozneVar = Boolean(v.tarihSozu || adYazili)
  const miras: string[] = []

  // A full question is not rewritten — it resets the topic by itself.
  if (yeniNiyet && ozneVar) return null
  if (yeniNiyet && !ozneVar && !isaret) {
    // "Kaç hastam var?" / "Hastalarımı listele" are complete on their own; only a chart intent without a subject
    // ("aşıları?", "ilaçları?", "CRP kaç?") leans on the open patient.
    if (!DOSYA_NIYETLERI.has(yeniNiyet) || icerik.length > 3) return null
  }
  if (!yeniNiyet && !isaret && icerik.length > 4) return null

  const onceki = b.sonVarliklar
  const niyet: Niyet = yeniNiyet || b.sonNiyet
  const dosyaNiyeti = DOSYA_NIYETLERI.has(niyet)
  const tarihKelimesi = (k: string) => TARIH_RE.test(` ${k} `) || /^\d+$/.test(k) || /^(gun|ay|son|hafta)$/.test(k)

  // Only a date after a chart question: the calendar-specific follow-up already ran; leave the rest to the model.
  if (!yeniNiyet && v.tarihSozu && !adYazili && icerik.every(tarihKelimesi) && DOSYA_NIYETLERI.has(b.sonNiyet)) return null

  // Truly elliptical only: every remaining word is a slot word, an intent word, an entity, a date or the name. Free
  // text ("peki öksürüğü için ne önerirsin?") is not rewritten — the open-patient rule and the prompt block carry it.
  {
    let kalanMetin = ` ${icerik.join(' ')} `
    for (const re of [TARIH_RE, TAHLIL_RE, ASI_RE, ILAC_RE]) kalanMetin = kalanMetin.replace(new RegExp(re.source, 'g'), ' ')
    const serbest = kalanMetin.split(' ').filter((k) => k && !adN.includes(k))
    if (!serbest.every((k) => SLOT_RE.test(k) || tarihKelimesi(k) || niyetBul(k) !== null)) return null
  }
  const kalan = icerik.filter((k) => !tarihKelimesi(k) && !adN.includes(k) && !GUN_PARCASI_RE.test(` ${k} `) && k !== 'sonra').join(' ')

  // Only a patient ("peki Rıdvan'ın?"): the previous question, other patient — whatever the topic was.
  if (adYazili && !kalan && !yeniNiyet && !v.tarihSozu && b.sonSoru) {
    const yeniAd = adYazili.replace(/\s?['’].*$/, '').replace(/(n[ıiuü]n|[ıiuü]n)$/, '')
    const varliklar: Varliklar = { ...onceki, hastaAd: yeniAd, hastaId: null }
    let soru: string | null = null
    if (onceki.hastaAd) {
      const adParcalari = normalize(onceki.hastaAd).split(' ')
      soru = cerceveDegistir(b.sonSoru, adParcalari.join(' '), adYazili, true) || cerceveDegistir(b.sonSoru, adParcalari[0], adYazili, true)
    }
    if (soru) { miras.push('cerceve'); return { soru, niyet: b.sonNiyet, varliklar, miras } }
    if (b.sonNiyet === 'takvim') return { soru: `${adYazili} randevusu ne zaman?`, niyet: 'hasta-dosya', varliklar, miras }
    if (DOSYA_NIYETLERI.has(b.sonNiyet)) { miras.push('cerceve'); return { soru: `${adYazili} ${b.sonSoru.replace(/^\s*(peki|ya|e)\s+/i, '')}`, niyet: b.sonNiyet, varliklar, miras } }
    return null
  }

  if (niyet === 'takvim') {
    const tarihSozu = v.tarihSozu || onceki.tarihSozu
    if (!tarihSozu) return null
    if (!v.tarihSozu) miras.push('tarih')
    const tip: TakvimTipi = v.takvimTipi || onceki.takvimTipi || 'varmi'
    if (!v.takvimTipi && onceki.takvimTipi) miras.push('soru-tipi')
    const saat = v.saat || (tip === 'bosluk' ? onceki.saat : null) || null
    if (!v.saat && saat) miras.push('saat')
    const parca = nn.match(GUN_PARCASI_RE)?.[1] || ''
    const ek = [parca ? tarihYaz(parca) : '', saat ? `saat ${saat}` : ''].filter(Boolean).join(' ')
    const govde = tip === 'kac' ? 'kaç hastam var' : tip === 'kimler' ? 'kimler geliyor' : tip === 'bosluk' ? 'boşluk var mı' : 'randevum var mı'
    const soru = `${tarihYaz(tarihSozu)}${ek ? ` ${ek}` : ''} ${govde}?`
    const varliklar: Varliklar = {
      ...onceki, ...v, tarihSozu, takvimTipi: tip, saat,
      tarih: v.tarihSozu ? v.tarih ?? null : onceki.tarih ?? null,
      tarihAralik: v.tarihSozu ? v.tarihAralik ?? null : onceki.tarihAralik ?? null,
    }
    return { soru, niyet, varliklar, miras }
  }

  if (niyet === 'hasta-sayim' || niyet === 'genel') {
    // Frame substitution: swap the date phrase of the previous question ("bu hafta kaç hasta …" → "son 30 gün …").
    if (v.tarihSozu && !yeniNiyet && b.sonSoru) {
      const om = normalize(b.sonSoru).match(TARIH_RE)
      miras.push('cerceve')
      const soru = om ? cerceveDegistir(b.sonSoru, om[1], tarihYaz(v.tarihSozu)) : null
      if (soru) return { soru, niyet, varliklar: { ...onceki, ...v }, miras }
      if (niyet === 'hasta-sayim') return { soru: `${tarihYaz(v.tarihSozu)} kaç hasta muayene ettim?`, niyet, varliklar: { ...onceki, ...v }, miras }
    }
    return null
  }

  if (!dosyaNiyeti) return null

  // Chart intents: the patient comes from the message or is inherited.
  const hastaAdi = adYazili || (onceki.hastaAd ? genitif(onceki.hastaAd) : '')
  if (!hastaAdi) return null
  if (!adYazili) miras.push('hasta')
  const varliklar: Varliklar = { ...onceki, ...v }
  if (adYazili) { varliklar.hastaAd = adYazili.replace(/\s?['’].*$/, '').replace(/(n[ıiuü]n|[ıiuü]n)$/, ''); varliklar.hastaId = null }

  const G = hastaAdi
  const oncekiSoru = /\b(bir onceki\w*|onceki\w*|bir once|ondan onceki\w*)\b/.test(nn)
  let soru = ''
  switch (niyet) {
    case 'tahlil': {
      const tahlil = v.tahlil || onceki.tahlil || null
      if (!v.tahlil && tahlil && oncekiSoru) miras.push('tahlil')
      const T = tahlil ? kisalt(tahlil) : ''
      if (oncekiSoru) soru = `${G} bir önceki ${T || 'tahlil'} sonucu ne?`
      else if (v.tahlil && /\bkac\b|\bkacti\b/.test(nn)) soru = `${G} son tahlilinde ${T} kaç?`
      else if (v.tahlil && kalan === v.tahlil) soru = `${G} son ${T} sonucu ne?`
      else if (/ne zaman/.test(nn)) soru = `${G} son tahlili ne zaman yapılmış?`
      else if (!kalan || /^sonuc\w*$/.test(kalan)) soru = `${G} son tahlil sonuçları ne?`
      else soru = `${G} son tahlilinde ${kalan}?`
      varliklar.tahlil = tahlil
      break
    }
    case 'recete': {
      const ilac = v.ilac || onceki.ilac || null
      if (!v.ilac && ilac) miras.push('ilac')
      if (/\bkac gun\b/.test(nn)) soru = ilac ? `${G} reçetesinde ${ilac} kaç gün yazılmış?` : `${G} reçetesindeki ilaçlar kaç gün yazılmış?`
      else if (/\bdoz/.test(nn)) soru = ilac ? `${G} reçetesinde ${ilac} dozu ne?` : `${G} reçetesindeki ilaçların dozları neler?`
      else if (/\bilac(lar|lari)?\b/.test(nn) && icerik.length <= 2) soru = `${G} ilaçları neler?`
      else if (!kalan) soru = `${G} son reçetesi ne?`
      else soru = `${G} son reçetesinde ${kalan}?`
      varliklar.ilac = ilac
      break
    }
    case 'asi': {
      const asi = v.asi || onceki.asi || null
      if (!v.asi && asi && /\bkac doz|ne zaman|doz\b/.test(nn)) miras.push('asi')
      if (/\bkac doz|doz\b/.test(nn) && asi) soru = `${G} ${kisalt(asi)} aşısı kaç doz yapılmış?`
      else if (v.asi) soru = `${G} ${kisalt(v.asi)} aşısı ne zaman yapılmış?`
      else if (/\beksik/.test(nn)) soru = `${G} aşılarında eksik olan var mı?`
      else if (/\bsirada/.test(nn)) soru = `${G} sıradaki aşısı hangisi?`
      else if (!kalan || /^asi\w*$/.test(kalan) || /tam mi/.test(nn)) soru = `${G} aşıları tam mı?`
      else soru = `${G} aşılarında ${kalan}?`
      varliklar.asi = asi
      break
    }
    case 'buyume': {
      if (/\bkilo/.test(nn)) soru = `${G} kilosu kaç?`
      else if (/\bbas cevresi/.test(nn)) soru = `${G} baş çevresi kaç?`
      else if (/\bboy/.test(nn)) soru = `${G} boyu kaç?`
      else if (/\bpersentil/.test(nn)) soru = `${G} persentili kaç?`
      else soru = kalan ? `${G} büyümesinde ${kalan}?` : `${G} büyümesi nasıl gidiyor?`
      break
    }
    case 'muayene': {
      if (oncekiSoru) soru = `${G} bir önceki muayenesinde ne bulduk?`
      else if (/\btani/.test(nn)) soru = `${G} son tanısı neydi?`
      else if (/\bates/.test(nn)) soru = `${G} son muayenesinde ateşi kaçtı?`
      else if (/\bsoap\b/.test(nn)) soru = `${G} son SOAP notunu oku`
      else soru = kalan ? `${G} son muayenesinde ${kalan}?` : `${G} son muayenesinde ne bulduk?`
      break
    }
    case 'not': {
      soru = oncekiSoru ? `${G} bir önceki vizitte ne not düşmüşüm?` : kalan && !/^not\w*$/.test(kalan) ? `${G} notlarında ${kalan}?` : `${G} son vizitte ne not düşmüşüm?`
      break
    }
    case 'mesaj-belge': {
      soru = kalan && !/^belge\w*$/.test(kalan) ? `${G} gelen belgelerinde ${kalan}?` : `${G} gelen belgeler kutusunda bir şey var mı?`
      break
    }
    default: {
      // hasta-dosya: attribute questions the card answers ("kaç yaşında", "kan grubu", "alerjisi") keep their words.
      const sozler = ham.replace(/[?!.,;:"“”]+/g, ' ').split(/\s+/).filter((w) => { const k = normalize(w); return k && !adN.includes(k) && !ISARET_KELIMELERI.has(k) }).join(' ')
      soru = sozler ? `${G} ${sozler}?` : `${G} dosyasını özetler misin?`
    }
  }
  return { soru, niyet, varliklar, miras }
}

/** Compact prompt block (≈ 150–250 tokens) for the residual model-path questions. Empty when expired. */
export function baglamBlogu(baglam: KonusmaBaglami | null | undefined, simdi: Date = new Date()): string {
  const b = baglam ? baglamOku(baglam, simdi) : null
  if (!b) return ''
  const v = b.sonVarliklar
  const parcalar = [`Konu: ${NIYET_ETIKET[b.sonNiyet] || b.sonNiyet}`]
  if (v.hastaAd) parcalar.push(`Hasta: ${v.hastaAd}`)
  if (v.tarihSozu) parcalar.push(`Tarih: ${tarihYaz(v.tarihSozu)}${v.tarih ? ` (${v.tarih})` : ''}`)
  if (v.saat) parcalar.push(`Saat: ${v.saat}`)
  if (v.ilac) parcalar.push(`İlaç: ${v.ilac}`)
  if (v.tahlil) parcalar.push(`Tahlil: ${v.tahlil}`)
  if (v.asi) parcalar.push(`Aşı: ${v.asi}`)
  return `\n\n[KONUŞMA BAĞLAMI — önceki tur] ${parcalar.join(' · ')}\nSon soru: ${b.sonSoru.slice(0, 120)}\nSon cevap: ${b.sonCevapOzeti.slice(0, 160)}\nDoktorun kısa / eksik sorusu ("peki yarın?", "dozu?", "kimler?", "ya Rıdvan'ın?") bu konunun devamıdır: eksik öğeyi (hasta, tarih, ilaç, tahlil, aşı) buradan tamamla ve doğrudan cevapla; mesajda "DOKTORUN KASTI" satırı varsa ona cevap ver. Bağlamdan tamamlanabiliyorsa netleştirme SORMA; yalnız hiçbir karşılığı yoksa tek cümleyle sor.`
}
