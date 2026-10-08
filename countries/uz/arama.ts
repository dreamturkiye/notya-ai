/**
 * NOTYA-UZ-MUAYENE-01 — Uzbekistan: one spelling skeleton for finding a name whatever script it was typed in
 * (docs/COUNTRY-PACK-CHECKLIST.md E10). "Каримов", "Karimov" and "karimov" give the same skeleton; so do
 * "Gʻulomov", "G'ulomov" and "Ғуломов", and the Russian-style spellings "Khasanov" / "Xasanov" / "Ҳасанов".
 *
 * FOR MATCHING ONLY. The result is never shown or stored — it is not a transliteration anyone should read.
 * Rules are from general knowledge of the two Uzbek alphabets and Russian; a native reviewer should try it on a
 * real patient list (to verify).
 */
const KIRIL: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 's', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '',
  ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: 'o', қ: 'k', ғ: 'g', ҳ: 'h',
}

export function uzAramaKatla(ham: string): string {
  let s = String(ham ?? '').normalize('NFC').toLowerCase()
  // Apostrophe variants of oʻ / gʻ and the tutuq belgisi: U+02BB, U+02BC, ASCII, typographic quotes, backtick.
  s = s.replace(/[ʻʼ'`‘’´]/g, '')
  s = [...s].map((h) => (h in KIRIL ? KIRIL[h] : h)).join('')
  return s
    .replace(/kh/g, 'h').replace(/zh/g, 'j').replace(/ts/g, 's')
    .replace(/x/g, 'h').replace(/q/g, 'k')
    .replace(/(^|[^a-z])ye/g, '$1e')
    .replace(/\s+/g, ' ')
    .trim()
}
