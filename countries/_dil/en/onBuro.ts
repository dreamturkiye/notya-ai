/**
 * WHATSAPP-ONBURO-01 — THE ENGLISH LANGUAGE SET: the front-desk pack ("a new appointment by chat" and "answers from the
 * practice sheet", lib/iletisim/onburo). Rules and sentences for English as patients type it in a chat.
 *
 * MACHINE-WRITTEN. No native editor and no clinician of any of the five countries has read it. Every sentence here is
 * PATIENT-FACING, and the two guard lists (`ACIL`, `TIBBI`) decide when the assistant must stay silent on a medical
 * matter — both come first for the native reader and for clinical review (docs/OPEN-COMMITMENTS.md WHATSAPP-ONBURO-01).
 *
 * The set belongs to no country: it holds NO emergency number and no payer's or authority's name. A country pack gives
 * its own number and its own extra words (`EnOnBuroUlke`). Sentences are written in en-GB and passed through `enYaz`.
 *
 * NOT WIRED TO A CHANNEL in the country builds yet: they carry no inbound message pipeline. This file is the language
 * half of the feature, tested on its own; the pipeline port (HASTA-ILETISIMI-ULKE-01) is what connects it.
 *
 * Matching: the text is folded (lower case, apostrophes dropped — "can't" → "cant" —, punctuation to spaces) and compared
 * on whole words or space-anchored phrases. The guard lists are deliberately broad: a false positive costs one holding
 * sentence and a card for the doctor.
 */
import type { BilgiAlani, OnBuroDili, RandevuNiyeti, SlotTercihi } from '@/lib/iletisim/onburo/dil/tipler'
import { enYaz, type EnBicim } from './varyant'

export interface EnOnBuroUlke {
  bicim: EnBicim
  /** The country's emergency number, from the pack's own setting. */
  acilNumara: string
  /** true where a day is typed month first (4/7 = 7 April). */
  ayOnce?: boolean
  /** Extra words of THIS country for the "fees" and "insurance" sheet rules (a payer's or a scheme's everyday name). */
  ucretSozleri?: string[]
  sigortaSozleri?: string[]
}

export function enKatla(metin: string): string {
  return String(metin || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function mesafe(a: string, b: string): number {
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

const MAKSIMUM_KELIME = 18
/** appointment, appointments, appt, and the typos apointment, appoinment, appointmnt, appontment. */
export function enRandevuKelimesiMi(t: string): boolean {
  if (/^(appointments?|appts?|apptmnts?|bookings?)$/.test(t)) return true
  if (!t.startsWith('ap') || t.length < 9 || t.length > 13) return false
  return mesafe(t.replace(/s$/, ''), 'appointment') <= 2
}

const ISTEK = /(^| )(book|make|schedule|get|have|need|want|arrange|request|set up|fit me in|squeeze me in|id like|i would like|like to|looking to|looking for|hoping to|wanting to|can i|could i|may i|can we|could we|is there|are there|do you have|have you got|any|available|availability|please|new)( |$)/
const UYGUNLUK = /(^| )(do you have (any )?(availability|openings|slots|free times?|anything (free|available))|any (availability|openings|free slots|slots|appointments?) |next available|earliest (available|you have|i can)|when can i (come in|be seen|see (the |a )?(doctor|dr|clinician|nurse))|when could i (come in|be seen)|can i (come in|be seen|see (the |a )?(doctor|dr|clinician|nurse))|could i (come in|be seen|see (the |a )?(doctor|dr|clinician|nurse))|(need|want|like) to (see|be seen by) (the |a )?(doctor|dr|clinician|nurse)|book me in|get me in|fit me in)( |$)/
const YALIN = new Set(['appointment', 'appt', 'booking', 'book', 'new appointment', 'appointment please', 'an appointment', 'an appointment please', 'book an appointment', 'book appointment', 'make an appointment', 'i need an appointment', 'i want an appointment'])
const OLUMSUZ = /(^| )(dont|do not|doesnt|didnt|not|no longer|never|wont|cant make|cannot make|unable|no need|changed my mind|forget it|never mind|nevermind)( |$)/
const IPTAL_ERTELEME = /(^| )(cancel\w*|reschedul\w*|postpon\w*|push (it )?back|move (my|the|our)|change (my|the|our)|rearrange|rebook|swap|running late|cant come|cannot come|cant attend|cannot attend|wont be able)( |$)/
const BELIRSIZ = /(^| )(maybe|might|perhaps|thinking (about|of)|not sure|possibly|at some point|some time)( |$)/
const GECMIS = /(^| )(i booked|i made|i had|we booked|we made|we had|already (booked|made|have|got)|was booked|were booked|you booked|you gave)( |$)/
/** Information questions that are not a booking: price, how-to, where. They go to the practice sheet instead. */
const BILGI_SORUSU = /(^| )(how much|cost\w*|price\w*|fees?|charge\w*|where|address|how do i|how does|how long)( |$)/
/** Talk about an existing appointment: "when is my appointment", "do I have an appointment", "is my appointment confirmed". */
const MEVCUT = /(^| )(when is|whens|what time is|what day is|do i have|have i got|is my|was my|confirm\w* my|remind me|still on|still booked)( |$)/
const SAHIPLIK = /(^| )(my|our) (next |upcoming )?(appointment|appt|booking)( |$)/
const EDINME = /(^| )(book|make|schedule|get|arrange|request|new|another)( |$)/

function randevuNiyeti(metin: string): RandevuNiyeti {
  const k = enKatla(metin)
  if (!k) return 'yok'
  const kelimeler = k.split(' ')
  if (kelimeler.length > MAKSIMUM_KELIME) return 'yok'
  const b = ' ' + k + ' '
  const isim = kelimeler.some(enRandevuKelimesiMi)
  const uygunluk = UYGUNLUK.test(b)
  if (!isim && !uygunluk) return 'yok'
  if (IPTAL_ERTELEME.test(b) || OLUMSUZ.test(b) || BELIRSIZ.test(b) || GECMIS.test(b)) return 'degil'
  if (BILGI_SORUSU.test(b)) return 'degil'
  if (uygunluk) return 'istek'
  if (YALIN.has(k)) return 'istek'
  if (MEVCUT.test(b)) return 'degil'
  if (SAHIPLIK.test(b) && !EDINME.test(b)) return 'degil'
  return ISTEK.test(b) ? 'istek' : 'degil'
}

const BASKA_GUN = /(^| )(another (day|time|date)|a different (day|time|date)|different (day|time|date)|other (day|days|times|options)|none of (these|those|them)|neither|doesnt (work|suit)|dont (work|suit)|not suitable|cant do (any|those|these)|no good|anything else)( |$)/
const DAHA_GEC = /(^| )(later|a later (date|day|time)|the following week|the week after|after that|further out)( |$)/
const DAHA_ERKEN = /(^| )(earlier|sooner|soonest|earliest|asap|as soon as possible|anything (sooner|earlier))( |$)/
const SABAH = /(^| )(morning\w*|before (noon|lunch|midday)|first thing|am)( |$)/
const OGLEDEN_SONRA = /(^| )(afternoon\w*|evening\w*|after (lunch|work|school|noon|midday)|pm|late in the day)( |$)/
const HAFTA_GUNU: Array<[RegExp, number]> = [
  [/(^| )(sunday|sun)( |$)/, 0], [/(^| )(monday|mon)( |$)/, 1], [/(^| )(tuesday|tues|tue)( |$)/, 2], [/(^| )(wednesday|weds|wed)( |$)/, 3],
  [/(^| )(thursday|thurs|thur|thu)( |$)/, 4], [/(^| )(friday|fri)( |$)/, 5], [/(^| )(saturday|sat)( |$)/, 6],
]
const AYLAR = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
const AY_DESENI = '(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)'
const ayNo = (ad: string): number => AYLAR.findIndex((a) => a.startsWith(ad.slice(0, 3))) + 1

/** Calendar day (YYYY-MM-DD) and weekday (0 = Sunday) of an instant in a time zone. */
function yerelGun(simdi: Date, saatDilimi: string): { gun: string; haftaGunu: number } {
  const p: Record<string, string> = {}
  for (const x of new Intl.DateTimeFormat('en-GB', { timeZone: saatDilimi, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(simdi)) p[x.type] = x.value
  const gun = `${p.year}-${p.month}-${p.day}`
  return { gun, haftaGunu: new Date(`${gun}T12:00:00Z`).getUTCDay() }
}
const gunEkle = (gun: string, n: number): string => new Date(Date.parse(`${gun}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
const iso = (y: number, a: number, g: number): string => `${y}-${String(a).padStart(2, '0')}-${String(g).padStart(2, '0')}`

function tercihKur(ulke: EnOnBuroUlke) {
  return (metin: string, simdi: Date, saatDilimi: string): SlotTercihi | null => {
    const k = ' ' + enKatla(metin) + ' '
    const t: SlotTercihi = {}
    if (SABAH.test(k)) t.dilim = 'sabah'
    else if (OGLEDEN_SONRA.test(k)) t.dilim = 'ogleden_sonra'
    const { gun: bugun, haftaGunu } = yerelGun(simdi, saatDilimi)
    const yil = Number(bugun.slice(0, 4))
    const ileri = (aday: string): string => (aday < bugun ? `${yil + 1}${aday.slice(4)}` : aday)
    const gunAy = k.match(new RegExp(`(^| )(\\d{1,2})(st|nd|rd|th)?( of)? ${AY_DESENI}( |$)`))
    const ayGun = k.match(new RegExp(`(^| )${AY_DESENI} (\\d{1,2})(st|nd|rd|th)?( |$)`))
    const sayisal = String(metin || '').match(/(^|\s)(\d{1,2})[./](\d{1,2})(\s|$)/)
    if (gunAy) t.gun = ileri(iso(yil, ayNo(gunAy[5]), Number(gunAy[2])))
    else if (ayGun) t.gun = ileri(iso(yil, ayNo(ayGun[2]), Number(ayGun[3])))
    else if (sayisal) {
      const a = Number(sayisal[2]), c = Number(sayisal[3])
      const [g, ay] = ulke.ayOnce ? [c, a] : [a, c]
      if (g >= 1 && g <= 31 && ay >= 1 && ay <= 12) t.gun = ileri(iso(yil, ay, g))
    } else if (/(^| )day after tomorrow( |$)/.test(k)) t.gun = gunEkle(bugun, 2)
    else if (/(^| )(tomorrow|tmrw|tomoz)( |$)/.test(k)) t.gun = gunEkle(bugun, 1)
    else if (/(^| )today( |$)/.test(k)) t.gun = bugun
    else {
      for (const [re, hedef] of HAFTA_GUNU) {
        if (!re.test(k)) continue
        let fark = (hedef - haftaGunu + 7) % 7
        // "next Tuesday" said on a Monday means the Tuesday of the following week.
        if (/(^| )next (week )?(sun|mon|tue|wed|thu|fri|sat)/.test(k) && fark < 7 - haftaGunu) fark += 7
        t.gun = gunEkle(bugun, fark)
        break
      }
      if (!t.gun && /(^| )next week( |$)/.test(k)) t.gun = gunEkle(bugun, 7 - ((haftaGunu + 6) % 7))
    }
    if (!t.gun) {
      if (BASKA_GUN.test(k)) t.baskaGun = true
      if (DAHA_GEC.test(k)) t.dahaGec = true
      else if (DAHA_ERKEN.test(k)) t.dahaErken = true
    }
    return Object.keys(t).length ? t : null
  }
}

function secim(metin: string): number | null {
  const k = enKatla(metin)
  const m = k.match(/^(option |number |no |choice )?([1-3])(st|nd|rd)?( one)?( please| works| is fine| is good| thanks| thank you)?$/)
  if (m) return Number(m[2])
  const s = k.match(/^(the )?(first|second|third)( one| option)?( please| works| is fine| is good)?$/)
  return s ? ['first', 'second', 'third'].indexOf(s[2]) + 1 : null
}

// ── Guards (folded text; every entry starts at a word boundary) ───────────────────────────────────────────────────────
const ACIL = [
  /chest (pain|pains|tightness|pressure)|pain in (my|his|her|the) chest|pressure (in|on) (my|his|her) chest|heart attack/,
  /cant breathe|cannot breathe|not breathing|isnt breathing|stopped breathing|struggling to breathe|trouble breathing|difficulty breathing|hard to breathe|short of breath|shortness of breath|gasping|choking|turning blue|blue lips/,
  /bleeding (heavily|a lot|badly|wont stop|will not stop|profusely)|heavy bleeding|severe bleeding|wont stop bleeding|coughing (up )?blood|vomiting blood|throwing up blood/,
  /suicid\w*|kill (myself|himself|herself)|end (my|his|her) life|end it all|want to die|dont want to live|do not want to live|self harm\w*|hurt myself|harm myself/,
  /seizure\w*|fitting|having a fit|convuls\w*/,
  /unconscious|passed out|collapsed|unresponsive|not responding|wont wake( up)?|cant wake (him|her|them)|fainted and/,
  /stroke|face (is )?droop\w*|slurred speech|slurring|cant move (my|his|her) (arm|leg|face)|sudden weakness/,
  /overdos\w*|took too (many|much)|taken too (many|much)|swallowed|poison\w*/,
  /anaphyla\w*|throat (is )?(closing|swelling)|tongue (is )?swelling|lips (are )?swelling|severe allergic/,
  /emergency|ambulance|urgent help|life threatening|dying/,
]
const TIBBI = [
  /medication\w*|medicine\w*|meds|tablet\w*|pill\w*|capsule\w*|antibiotic\w*|painkiller\w*|pain relief|inhaler\w*|insulin|ointment|eye drops|ear drops|vaccin\w*|injection\w*|jab|booster/,
  /dose\w*|dosage\w*|\d+ ?(mg|ml|mcg)|how (much|many|often) (should|do|can) (i|he|she|we|they) (take|give|use)|should (i|he|she|we) (take|stop|keep|continue|give|use|increase|reduce)|can (i|he|she|we) (take|give|use|drink|eat|mix)|is it (ok|okay|safe) to|with food|empty stomach|side effect\w*/,
  /fever\w*|temperature|cough\w*|vomit\w*|throwing up|diarrh\w*|nause\w*|pain|pains|painful|hurt|hurts|hurting|ache|aches|aching|sore|rash\w*|itch\w*|swelling|swollen|lump|bleed\w*|bruis\w*|dizz\w*|faint\w*|headache\w*|migraine\w*|breath\w*|wheez\w*|infect\w*|flu|covid|symptom\w*|discharge|numb\w*|tingling|burning/,
  /test results?|results?|blood test\w*|bloods|blood (pressure|sugar|count)|scan|scans|x ?ray\w*|mri|ultrasound|biopsy|pathology|levels?/,
  /is (this|that|it) normal|normal for|should i (be )?worr\w*|is (it|this|that) serious|is (it|this|that) dangerous|what should i do|what do i do|what can i do|will it (go away|get better)|getting worse|not getting better/,
  /pregnan\w*|breastfeed\w*|breast feeding|period|periods|miscarr\w*|my (baby|child|son|daughter|toddler|newborn|kid) (is|has|wont|isnt|keeps|cant|doesnt)|not feeding|not eating|not sleeping|losing weight|lost weight/,
  /diagnos\w*|treatment\w*|prescription\w*|script|scripts|refill\w*|repeat|surgery|operation|procedure|allerg\w*|cholesterol|thyroid|diabet\w*|asthma|anxiety|depress\w*|referral for/,
]
const basta = (r: RegExp) => new RegExp('(^| )(' + r.source + ')( |$)')
const ACIL_K = ACIL.map(basta)
const TIBBI_K = TIBBI.map(basta)

const KONTROL = /(^| )(follow up|followup|review|check up|checkup|recheck|repeat visit)( |$)/
const ILK = /(^| )(first (visit|time|appointment)|new patient|initial (visit|consult\w*|appointment)|never been)( |$)/
const HAZIRLIK = /(^| )(prepar\w*|fasting|fast before|need to fast|before (my|the|our) (appointment|visit|consult\w*)|anything (i|we) (should|need to) do before|do i need to (do|bring) anything)( |$)/

function bilgiKurallari(ulke: EnOnBuroUlke): Array<{ alan: BilgiAlani; desen: RegExp }> {
  const ek = (l?: string[]) => (l?.length ? '|' + l.join('|') : '')
  return [
    { alan: 'adres', desen: /(^| )(address|where are you( located| based)?|where is (the|your) (clinic|practice|surgery|office|rooms)|where (do|can) i (go|find you)|how do i (get|find) (there|you|to you)|directions|which (street|building|floor|suite|level))( |$)/ },
    { alan: 'harita', desen: /(^| )(map|maps|location pin|pin|send (me )?(the |your )?location|directions|navigation)( |$)/ },
    { alan: 'calismaSaatleri', desen: /(^| )(opening (hours|times)|business hours|office hours|your hours|hours of operation|what time do you (open|close)|when do you (open|close)|are you open|open (on|at) |open today|open tomorrow|open (saturdays?|sundays?|weekends?)|closed (on|today)|what days)( |$)/ },
    { alan: 'otopark', desen: /(^| )(parking|car ?park|park (my|the|a) car|where (can|do) i park|street parking|valet)( |$)/ },
    { alan: 'ulasim', desen: /(^| )(public transport\w*|transit|bus|buses|train|trains|tram|subway|underground|metro|nearest (station|stop)|by (bus|train))( |$)/ },
    { alan: 'ucretler', desen: new RegExp(`(^| )(fee|fees|cost|costs|price|prices|pricing|how much|charge|charges|rates?|out of pocket${ek(ulke.ucretSozleri)})( |$)`) },
    { alan: 'odeme', desen: /(^| )(pay|paying|payment|payments|card|cards|credit card|debit card|cash|contactless|instal?ments?|payment plan|bank transfer|invoice)( |$)/ },
    { alan: 'sigorta', desen: new RegExp(`(^| )(insurance|insurer|insured|coverage|covered|cover|rebate|claim|health fund|private health${ek(ulke.sigortaSozleri)})( |$)`) },
    { alan: 'getirilecekler', desen: /(^| )(what (should|do|shall) (i|we) (need to )?bring|bring with (me|us)|need to bring|anything to bring|which documents|what documents|paperwork|do i need (id|a referral|my))( |$)/ },
    { alan: 'iptalPolitikasi', desen: /(^| )(cancellation (policy|fee|terms|charge)|cancel\w* policy|late cancel\w*|no show\w*|if i (miss|cant make|cannot make)|how much notice)( |$)/ },
    { alan: 'telefon', desen: /(^| )(phone number|your number|contact number|landline|telephone|number to call|can i (call|ring|phone)|what number)( |$)/ },
  ]
}

const SORU_BASI = /^(what|whats|when|whens|where|wheres|which|who|how|why|do you|does|is there|are there|are you|is it|can i|can you|can we|could i|could you|would|will you|have you|any |may i|should i)( |$)/
const SORU_ICI = /(^| )(i was wondering|wondering if|let me know|tell me|i need to know|id like to know|i would like to know|do you know)( |$)/
const AD_DEGIL = new Set([
  'hello', 'hi', 'hey', 'thanks', 'thank', 'you', 'please', 'yes', 'no', 'ok', 'okay', 'good', 'morning', 'afternoon', 'evening', 'night', 'book', 'tomorrow', 'today',
  'sure', 'great', 'cheers', 'sorry', 'bye', 'fine', 'perfect', 'that', 'works', 'for', 'the', 'and', 'want', 'need', 'help', 'doctor', 'dr', 'see', 'soon', 'later', 'not',
])
const GUNLER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function enOnBuro(ulke: EnOnBuroUlke): OnBuroDili {
  const y = (t: string) => enYaz(t, ulke.bicim)
  const n = ulke.acilNumara
  // A pack without a confirmed number names none (lib/ulke/tipler.ts: "there is no default").
  const ara = n ? `call ${n}` : 'call an ambulance'
  const kurallar = bilgiKurallari(ulke)
  return {
    kod: ulke.bicim,
    acilNumara: n,
    randevuNiyeti,
    tercih: tercihKur(ulke),
    secim,
    acilMi: (metin) => { const k = ' ' + enKatla(metin) + ' '; return ACIL_K.some((r) => r.test(k)) },
    tibbiMi: (metin) => { const k = ' ' + enKatla(metin) + ' '; return TIBBI_K.some((r) => r.test(k)) },
    soruMu: (metin) => { const k = enKatla(metin); return /\?/.test(String(metin || '')) || SORU_BASI.test(k) || SORU_ICI.test(' ' + k + ' ') },
    bilgiAlanlari: (metin) => {
      const k = ' ' + enKatla(metin) + ' '
      const alanlar: BilgiAlani[] = kurallar.filter((x) => x.desen.test(k)).map((x) => x.alan)
      if (HAZIRLIK.test(k)) alanlar.push(KONTROL.test(k) ? 'hazirlik.kontrol' : ILK.test(k) ? 'hazirlik.ilk_muayene' : 'hazirlik.muayene')
      return Array.from(new Set(alanlar))
    },
    ziyaretTuru: (metin) => { const k = ' ' + enKatla(metin) + ' '; return KONTROL.test(k) ? 'kontrol' : ILK.test(k) ? 'ilk_muayene' : null },
    adSoyad: (metin) => {
      const ham = String(metin || '').replace(/^\s*(my name is|my name's|name is|name:|i am|i'm|im|this is|it's|its)\s+/i, '').replace(/[.,!]+$/g, '').trim()
      if (ham.length < 4 || ham.length > 60 || /\d/.test(ham)) return null
      const parcalar = ham.split(/\s+/)
      if (parcalar.length < 2 || parcalar.length > 4) return null
      if (!parcalar.every((p) => /^[A-Za-zÀ-ÖØ-öø-ÿĀ-ž'’-]{2,}$/.test(p))) return null
      if (enKatla(ham).split(' ').some((t) => AD_DEGIL.has(t) || enRandevuKelimesiMi(t))) return null
      return parcalar.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
    },
    zamanEtiketi: (isoZaman, saatDilimi) => {
      const d = new Date(isoZaman)
      const gun = new Intl.DateTimeFormat(ulke.bicim, { timeZone: saatDilimi, weekday: 'long', day: 'numeric', month: 'long' }).format(d)
      const saat = new Intl.DateTimeFormat(ulke.bicim, { timeZone: saatDilimi, hour: 'numeric', minute: '2-digit' }).format(d)
      return `${gun}, ${saat}`
    },
    alanEtiketi: {
      adres: y('Address'), harita: y('Map'), calismaSaatleri: y('Opening hours'), otopark: y('Parking'), ulasim: y('Getting here'), ucretler: y('Fees'),
      odeme: y('Payment'), sigorta: y('Insurance'), getirilecekler: y('What to bring'), iptalPolitikasi: y('Cancellations'), telefon: y('Phone'),
      'hazirlik.ilk_muayene': y('Before a first visit'), 'hazirlik.muayene': y('Before your visit'), 'hazirlik.kontrol': y('Before a follow-up visit'),
    },
    calismaSaatiMetni: (gunler) => ['1', '2', '3', '4', '5', '6', '0'].filter((g) => gunler[g]?.acik).map((g) => `${GUNLER[Number(g)]} ${gunler[g].baslangic}–${gunler[g].bitis}`).join(', '),
    metin: {
      oneri: (satirlar, onayli) => y(`These times are free:\n${satirlar.map((s, i) => `${i + 1}) ${s}`).join('\n')}\nReply with the number to choose one${onayli ? '; the clinic will then confirm it' : ''}. If you would like another day or time, just say so (for example "Tuesday" or "afternoon").`),
      slotYok: y('We could not find a free time to offer you right now. The clinic will contact you.'),
      tercihYok: y('Nothing is free at the time you asked for. The nearest free times are:'),
      slotDoldu: y('That time has just been taken.'),
      talepAlindi: (zaman) => y(`Your appointment request has been received: ${zaman}. It is waiting for the clinic to confirm it; you will be told when it is confirmed.`),
      randevuOlustu: (zaman) => y(`Your appointment is booked: ${zaman}. If you need to change it, please contact the clinic.`),
      talepOnaylandi: (zaman) => y(`Your appointment is confirmed: ${zaman}. See you then.`),
      talepReddedildi: y('We could not confirm your appointment request for that time. Reply "appointment" to see other times, or call the clinic.'),
      randevuGeriAlindi: (zaman) => y(`The clinic could not keep your appointment on ${zaman}; it has been removed. They will contact you about another time.`),
      istekBirakildi: y('Understood - nothing has been booked. Reply "appointment" whenever you would like to book.'),
      oneriSiniri: y('Let us find a time together: the clinic will contact you.'),
      kimIcin: (adlar) => y(`Who is the appointment for?\n${adlar.map((a, i) => `${i + 1}) ${a}`).join('\n')}\nJust reply with the number.`),
      adSor: y('To request an appointment, please send your full name.'),
      adAnlasilmadi: y('Could you send your first name and surname in one message? (for example: Alex Morgan)'),
      yeniHastaTalebi: (zaman) => y(`Thank you. Your appointment request${zaman ? ` (${zaman})` : ''} has been passed to the clinic; you will be told when it is confirmed.`),
      bekleme: y('Your question has been passed to the clinic. Someone will get back to you as soon as possible.'),
      tibbi: y(`Your question has been passed to the doctor. We cannot give a diagnosis or treatment advice by message; the doctor or the clinic will get back to you. In an emergency ${ara}.`),
      acil: y(`This channel is not for emergencies. Please ${ara} now or go to the nearest emergency department.`),
      // A plain statement of what is recorded — NOT a privacy notice with a legal basis. The country's own notice
      // wording is the country lawyer's (docs/OPEN-COMMITMENTS.md WHATSAPP-ONBURO-01).
      gizlilik: (doktorAdi) => y(`${doktorAdi ? `The clinic of ${doktorAdi}` : 'The clinic'} will record your name and this phone number to handle your appointment request.`),
      yanitOnEki: '',
    },
  }
}
