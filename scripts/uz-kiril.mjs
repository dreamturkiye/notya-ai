#!/usr/bin/env node
/**
 * NOTYA-ULKE-ARACLAR-01 — AUTHORING AID for the Uzbek pack: Uzbek in Latin script → Uzbek in Cyrillic script, BY RULE.
 *
 * COUNTRY TOOLING ONLY. No build runs this file and nothing imports it but its test
 * (countries/uz/uygulama/araclar/kiril.test.ts). It is here so that the Cyrillic form of the tool texts can be made
 * again: by the next job that adds a tool to the Uzbek pack, and as a model for the next country with two scripts.
 *
 * WHAT IT DOES. A text of the Uzbek pack's tools is written once in Latin script and once in Russian:
 *     u('Keyingi nazorat', '', 'Следующий контроль')
 * and this script fills the empty middle argument from the first, letter by letter, by the rule below:
 *     node scripts/uz-kiril.mjs countries/uz/uygulama/araclar/rol5.ts
 * It only fills an EMPTY argument: a Cyrillic text that is already there (corrected by hand, or by a native reader)
 * is never overwritten. The result is stored in the pack as static text; nothing is converted while the product runs.
 *
 * WHAT IT IS NOT. A rule cannot know the Cyrillic spelling of every loan word (ц, ь, ю and я after a consonant):
 * the short list SOZLUK holds the ones the tool texts use, and any other is spelled as it sounds. THE OUTPUT IS
 * MACHINE-WRITTEN AND AWAITS A NATIVE READER (docs/OPEN-COMMITMENTS.md); the pack says so at the top of its tools
 * folder. International abbreviations the profession writes in Latin letters (KORU) are left as they are.
 *
 * THE RULE: the official Uzbek Latin alphabet of 1995 mapped back to the Cyrillic alphabet in use before it —
 * oʻ → ў, gʻ → ғ, sh → ш, ch → ч, q → қ, h → ҳ, x → х, the tutuq belgisi ʼ → ъ, yo/yu/ya → ё/ю/я ("yoʻ" is й + ў),
 * ye → е, and e → э at the start of a word or after a vowel.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const TEK = { a: 'а', b: 'б', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', q: 'қ', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', x: 'х', y: 'й', z: 'з', c: 'ц', w: 'в' }
const CIFT = { sh: 'ш', ch: 'ч', yo: 'ё', yu: 'ю', ya: 'я', ye: 'е' }
const UNLU = new Set(['a', 'e', 'i', 'o', 'u', 'ʻ'])
// Latin tokens kept as they are (international abbreviations and symbols).
const KORU = /(?<![A-Za-zʻʼ])(ESI|ASA(?: (?:I{1,3}|IV|V|E))?|ABCDE|ST|IPSS|PSA|MIDAS|PHQ-9|GAD-7|CAT|mMRC|GOLD|DAS28|BASDAI|PASI|EASI|SCORAD|ODI|VAS|KDIGO|eGFR|HbA1c|TSH|DXA|INR|CHA₂DS₂-VASc|HAS-BLED|STOPP|START|NYHA|HBV|HCV|HIV|IBS-SSS|HBI|BI-RADS|logMAR|ETDRS|MED|UVB|PUVA|M-CHAT-R\/F|M-CHAT|WHO|MEC|CRP|RF|TJC|SJC|RTP|ICF|pH|I{1,3}|IV|V|VI|A|B|C|D|E|GCS|NRS|AF|DOAK|UACR|G[1-5][ab]?|A[1-3]|[A-Z]{1,3}\d+)(?![A-Za-zʻʼ])/g
// Loan words whose Cyrillic spelling a letter-by-letter rule gets wrong (ц, ь, я/ю after consonant).
const SOZLUK = [[/C-reaktiv/g, 'С-реактив'], [/dB/g, 'дБ'], [/kHz/g, 'кГц'], [/gers/g, 'герц'], [/konsultatsiya/gi, 'консультация'], [/ingalyatsiya/gi, 'ингаляция'], [/tsiya/g, 'ция'], [/Tsiya/g, 'Ция'], [/infeksiya/gi, 'инфекция'], [/reaksiya/gi, 'реакция'], [/funksiya/gi, 'функция'], [/inyeksiya/gi, 'инъекция'], [/insult/gi, 'инсульт'], [/konsultant/gi, 'консультант'], [/retsept/gi, 'рецепт'], [/protsedura/gi, 'процедура'], [/protsent/gi, 'процент'], [/sentabr/gi, 'сентябрь'], [/oktabr/gi, 'октябрь'], [/noyabr/gi, 'ноябрь'], [/dekabr/gi, 'декабрь'], [/aprel/gi, 'апрель'], [/iyun/gi, 'июнь'], [/iyul/gi, 'июль'], [/albumin/gi, 'альбумин'], [/filtr/gi, 'фильтр'], [/puls/gi, 'пульс'], [/dializ/gi, 'диализ'], [/sikl/gi, 'цикл'], [/vaksina/gi, 'вакцина'], [/kalsiy/gi, 'кальций'], [/shprits/gi, 'шприц'], [/ingalyator/gi, 'ингалятор'], [/kreatinin/gi, 'креатинин'], [/gemoglobin/gi, 'гемоглобин'], [/rentgen/gi, 'рентген'], [/ultratovush/gi, 'ультратовуш'], [/biopsiya/gi, 'биопсия'], [/sirkul/gi, 'циркул'], [/sirroz/gi, 'цирроз'], [/sistoskop/gi, 'цистоскоп'], [/pulmonolog/gi, 'пульмонолог'], [/alternativ/gi, 'альтернатив'], [/detal/gi, 'деталь'], [/model/gi, 'модель'], [/kontrol/gi, 'контроль'], [/nol(?![a-zʻ])/gi, 'ноль'], [/sellyulit/gi, 'целлюлит'], [/gelmint/gi, 'гельминт'], [/tsikl/gi, 'цикл']]
const buyuk = (h) => h !== h.toLowerCase() && h === h.toUpperCase()
const harf = (h) => !!h && /[\p{L}ʻʼ]/u.test(h)
function cevir(s) {
  let c = ''
  for (let i = 0; i < s.length;) {
    const h = s[i], k = h.toLowerCase(), n = s[i + 1] ?? '', n2 = s[i + 2] ?? ''
    const yaz = (kir, uz) => { c += buyuk(h) ? kir[0].toUpperCase() + kir.slice(1) : kir; i += uz }
    if ((k === 'o' || k === 'g') && /[ʻ'`‘’]/.test(n)) { yaz(k === 'o' ? 'ў' : 'ғ', 2); continue }
    if (h === 'ʼ') { c += 'ъ'; i++; continue }
    // "yoʻ" is й + ў, never ё
    if (k === 'y' && n.toLowerCase() === 'o' && /[ʻ'`‘’]/.test(n2)) { yaz('й', 1); continue }
    const cift = CIFT[k + n.toLowerCase()]
    if (cift) { yaz(cift, 2); continue }
    if (k === 'e') { const o = s[i - 1]?.toLowerCase(); yaz(!harf(o) || UNLU.has(o) ? 'э' : 'е', 1); continue }
    if (k in TEK) { yaz(TEK[k], 1); continue }
    c += h; i++
  }
  return c
}
export function kirill(latin) {
  // Loan words first (one of them begins with a letter that is also an abbreviation), then the protected abbreviations.
  const sozluk = []
  let s = latin
  for (const [re, kir] of SOZLUK) s = s.replace(re, (m) => { sozluk.push(buyuk(m[0]) ? kir[0].toUpperCase() + kir.slice(1) : kir); return `\u0003${sozluk.length - 1}\u0004` })
  const korunan = []
  s = s.replace(KORU, (m) => { korunan.push(m); return `\u0001${korunan.length - 1}\u0002` })
  s = cevir(s)
  s = s.replace(/\u0003(\d+)\u0004/g, (_, n) => sozluk[Number(n)]).replace(/\u0001(\d+)\u0002/g, (_, n) => korunan[Number(n)])
  return s.replace(/PIN-/g, 'ПИН-').replace(/ПИН-kod/g, 'ПИН-код').replace(/ЭКГ|EKG/g, 'ЭКГ')
}
/** Fills every empty Cyrillic argument of a pack file's text. Returns the new text and how many were filled. */
export function dosyayiDoldur(eski) {
  let n = 0
  const yeni = eski.replace(/\b(u|vazifa)\('((?:[^'\\]|\\.)*)', '', '/g, (_, f, latin) => { n++; return `${f}('${latin}', '${kirill(latin)}', '` })
  return { yeni, n }
}

/**
 * NOTYA-ULKE-KLINIK-01 — a whole CATALOGUE at once: every text of a Latin catalogue (an object of objects of
 * strings) through the rule, keys untouched. For a catalogue that is written as one object per language form.
 */
export function katalogCevir(latin) {
  if (typeof latin === 'string') return kirill(latin)
  if (Array.isArray(latin)) return latin.map(katalogCevir)
  if (latin && typeof latin === 'object') return Object.fromEntries(Object.entries(latin).map(([k, v]) => [k, katalogCevir(v)]))
  return latin
}
/**
 * The SOURCE TEXT of the file that stores a derived Cyrillic catalogue: a header that says it is derived, then the
 * object. The stored file must be exactly this (its test compares them); it is made again by running that test with
 * UZ_KIRIL_YAZ=1, never by editing the file.
 */
export function katalogKaynagi(latin, { ustYazi, ithalat, bildirim }) {
  return `${ustYazi}\n${ithalat}\n\n${bildirim} ${JSON.stringify(katalogCevir(latin), null, 2)}\n`
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  for (const d of process.argv.slice(2)) {
    const { yeni, n } = dosyayiDoldur(readFileSync(d, 'utf8'))
    writeFileSync(d, yeni)
    console.log(`${d}: ${n} filled`)
  }
}
