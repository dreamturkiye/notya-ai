/**
 * NOTYA-SES-NORMAL-01 — DEV TOOL, not a production path: nothing under app/, components/ or the runtime code of lib/
 * imports this file (lib/ses/tibbiSeslendirme.test.ts checks it). Used by scripts/ayse-denetim/ses-kisaltma.mts.
 *
 * Lists the abbreviation-looking tokens that are still in a spoken text AFTER the medical speech layer ran — the
 * tokens the speech engine will spell letter by letter. The dictionary (lib/ses/tibbiSeslendirmeSozluk.ts) is
 * extended from this list, from real answers, and not from guesses.
 */
import { sozlukteVarMi } from '../tibbiSeslendirme'

export interface BilinmeyenKisaltma {
  yazi: string
  /** 'buyuk' = all capitals ("PDA"); 'karma' = a capital inside the word ("TdaP"). */
  tur: 'buyuk' | 'karma'
  adet: number
  /** One sentence it was seen in. */
  ornek: string
}

const BUYUK = String.raw`\p{Lu}[\p{Lu}\p{N}]*\p{Lu}[\p{Lu}\p{N}]*(?:[-/][\p{Lu}\p{N}]+)*`
const KARMA = String.raw`\p{L}*\p{Ll}\p{Lu}[\p{L}\p{N}]*`
const BELIRTEC = new RegExp(String.raw`(?<![\p{L}\p{N}])(?:(${BUYUK})|(${KARMA}))(?![\p{L}\p{N}])`, 'gu')

/** `okunuslar`: engine texts (the output of fishMetni). Most frequent first. */
export function bilinmeyenKisaltmalar(okunuslar: readonly string[]): BilinmeyenKisaltma[] {
  const sayim = new Map<string, BilinmeyenKisaltma>()
  for (const ham of okunuslar) {
    const metin = String(ham || '').replace(/\[break\]/g, ' ')
    for (const m of metin.matchAll(BELIRTEC)) {
      const yazi = m[0]
      // A written form that reads as itself ("BCG", "Hib") is known; everything else in capitals is not.
      if (sozlukteVarMi(yazi)) continue
      const onceki = sayim.get(yazi)
      if (onceki) { onceki.adet++; continue }
      const bas = Math.max(0, (m.index ?? 0) - 40)
      sayim.set(yazi, { yazi, tur: m[1] ? 'buyuk' : 'karma', adet: 1, ornek: metin.slice(bas, (m.index ?? 0) + yazi.length + 40).replace(/\s+/g, ' ').trim() })
    }
  }
  return [...sayim.values()].sort((a, b) => b.adet - a.adet || a.yazi.localeCompare(b.yazi, 'tr'))
}
