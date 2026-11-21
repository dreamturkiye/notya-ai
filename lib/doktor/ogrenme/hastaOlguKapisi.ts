/**
 * HASTA-KARISMA-01 (2026-11-20) — patient facts never cross from one patient's notes into another patient's note.
 *
 * Doctor-level text reaches EVERY note the doctor generates: learned rules (DOKTORUN KURALLARI), the distilled style
 * profile + memory lines (DOKTORUN ÖĞRENİLMİŞ TERCİHLERİ) and the style examples. Before this guard, that text could
 * carry another patient's clinical facts:
 *   - style examples were the first 400 characters of S and P of the doctor's last two approved notes — of ANY patient
 *     ("Veli beyanına göre yalnız anne sütü alıyor, 2–3 saatte bir emiyor" went into a 2-year-old's prompt);
 *   - `ekleme` / `yeniden_yazma` rules were whole sentences from one patient's note ("Şu satırı ekle: Büyüme (Neyzi):
 *     kilo 49. persentil", "Bebeğiniz 3 aydan küçük olduğu için…") — one "Uygula" click put them into every note.
 *
 * Contract (deterministic, no model):
 *   1. A learned rule carries ONLY a phrasing transformation. `ekleme` / `yeniden_yazma` are content, never rules.
 *      `terim` is short phrase → short phrase. Any rule text with a clinical quantity (digit, age, dose, percentile,
 *      temperature, frequency) is refused.
 *   2. Style examples are a de-patientised skeleton: section labels and plan numbering only, no content.
 *   3. Profile / memory lines with a clinical quantity are dropped before the prompt.
 * Applied where rules are created, promoted ("Uygula"), loaded, and — the hard guard — in soapSistemBloklari itself.
 */

/** Any digit: a style instruction never needs one (doz biçimi's fixed sentence has none). */
const RAKAM = /\d/
/** Turkish number word + a unit of age / time / frequency / quantity ("iki aylık", "üç saatte", "dört kez"). */
const SAYI_SOZCUK = /(?:^|[^\p{L}])(?:bir|iki|üç|uc|dört|dort|beş|bes|altı|alti|yedi|sekiz|dokuz|on|yirmi|otuz|kırk|elli|yarım)\s+(?:ay|aylık|aylik|aydan|yaş|yas|yaşında|yasinda|yaşındaki|hafta|haftalık|gün|gun|günlük|saat|saatte|saatlik|kez|kere|defa|kilo|kg|gram|santim|cm|mg|ml|damla|ölçek|tablet)(?![\p{L}])/iu
/** Clinical measurement vocabulary that only makes sense with a patient's own value. */
const OLCUM_SOZCUK = /(?:persentil|percentile|°\s*c|derece ateş|ateşi\s+\d|kilo(?:su)?\s*:|boy(?:u)?\s*:|baş çevresi\s*:|tansiyon\s*:|nabız\s*:|spo2|satürasyon\s*:)/iu

/** True when the text carries a clinical quantity / patient fact signal. Pure. */
export function klinikOlguIcerirMi(metin: string | null | undefined): boolean {
  const t = String(metin || '')
  if (!t.trim()) return false
  return RAKAM.test(t) || SAYI_SOZCUK.test(t) || OLCUM_SOZCUK.test(t)
}

const kelimeSayisi = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

/** Rule kinds that copy note content instead of describing phrasing — never a rule. */
const ICERIK_TURLERI = new Set(['ekleme', 'yeniden_yazma'])
const ICERIK_SLUG = /^(?:klinik:)?(?:ekleme|yeniden)-/

/** `"X" yerine "Y" yaz` — the two phrases, or null. */
function terimCifti(deger: string): [string, string] | null {
  const m = deger.match(/^"([^"]*)"\s+yerine\s+"([^"]*)"\s+yaz$/)
  return m ? [m[1], m[2]] : null
}

/**
 * Is this rule a pure phrasing transformation that may reach other patients' notes?
 * `tur` when known (creation); otherwise the slug prefix decides (stored rows, pooled clinic rules).
 */
export function uslupKuraliGuvenliMi(k: { slug?: string | null; anahtar?: string | null; deger?: string | null; satir?: string | null; tur?: string | null }): boolean {
  const slug = String(k.slug || k.anahtar || '').trim()
  const deger = String(k.deger ?? k.satir ?? '').trim()
  if (!deger) return false
  if (k.tur && ICERIK_TURLERI.has(k.tur)) return false
  if (ICERIK_SLUG.test(slug)) return false
  if (/^(Şu satırı ekle|Bu bölümü doktorun cümlesiyle yaz)\s*:/i.test(deger)) return false
  if (klinikOlguIcerirMi(deger)) return false
  const terim = terimCifti(deger)
  if (terim && (kelimeSayisi(terim[0]) > 4 || kelimeSayisi(terim[1]) > 4 || !terim[0].trim() || !terim[1].trim())) return false
  // "Şu kalıbı nottan çıkar: …" — only short boilerplate, never a clinical sentence.
  const silme = deger.match(/^Şu kalıbı nottan çıkar:\s*(.*)$/i)
  if (silme && kelimeSayisi(silme[1]) > 10) return false
  return true
}

/** Doctor-level free text (profile, memory lines, examples): keep only lines without a clinical quantity. */
export function doktorDuzeyiMetniSuz(metin: string | null | undefined): string {
  return String(metin || '')
    .split('\n')
    // A leading list number ("1. ", "2) ") is formatting, not a quantity.
    .filter((satir) => !klinikOlguIcerirMi(satir.replace(/^\s*(?:[-•*]\s*)?\d{1,2}[.)]\s+/, '')))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** The only line shapes a style-example block may contain (see stilOrnekleriDerle): header, S:/P:, "Label: …", "n. …". */
const ISKELET_SATIRI = /^(?:--- [^\n]{1,60} ---|[SP]:|[\p{Lu}][\p{L} ()/&-]{0,34}: …|\d{1,2}\. …)$/u

/** Hard guard for the style-example block: any line that is not skeleton-shaped (i.e. real note content) is dropped. */
export function iskeletSuz(metin: string | null | undefined): string {
  const satirlar = String(metin || '').split('\n').map((s) => s.trim()).filter((s) => ISKELET_SATIRI.test(s))
  return satirlar.some((s) => s.endsWith('…')) ? satirlar.join('\n') : ''
}

/** A section label worth keeping: short, starts with a letter, no digit ("Şikayet", "Şikayetin Hikayesi", "TEDAVİ"). */
const ETIKET = /^\s*([\p{Lu}][\p{L} ()/&-]{0,34}?)\s*:/u

/** One note section → its skeleton: labels kept with "…", numbered plan lines as "n. …", everything else dropped. */
export function bolumIskeleti(metin: string | null | undefined): string {
  const out: string[] = []
  for (const satir of String(metin || '').split('\n')) {
    const t = satir.trim()
    if (!t) continue
    const num = t.match(/^(\d{1,2})[.)]\s/)
    if (num) { out.push(`${num[1]}. …`); continue }
    const e = t.match(ETIKET)
    if (e && kelimeSayisi(e[1]) <= 4 && !klinikOlguIcerirMi(e[1])) out.push(`${e[1].trim()}: …`)
  }
  return [...new Set(out)].slice(0, 16).join('\n')
}
