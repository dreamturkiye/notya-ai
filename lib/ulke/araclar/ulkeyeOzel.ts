/**
 * NOTYA-ULKE-OZEL-01 — WHOSE A KEY IS. Pure; no country is named here.
 *
 * A tool, a placeholder or a quantity that ONLY ONE COUNTRY HAS carries that country's code in front of its key:
 * "ca-triage", "nz-claim-form". Three things follow, and each is checked somewhere a build cannot get past:
 *
 *   - the KIT holds no such key (lib/ulke/araclar/ulkeyeOzel.test.ts): a key of the kit belongs to every country;
 *   - a PACK may only use keys that carry ITS OWN code (lib/ulke/araclar/denetim.ts, in every country build): a key
 *     that carries another country's code reads as that country's tool and is refused, listed anywhere or not;
 *   - every such key is LISTED for its country in countries/yasak-araclar.json (lib/ulke/ulkeyeOzel.paket.test.ts),
 *     and wall rule D7 (scripts/ulke-duvarlari.mjs) then stops every other pack, every language set and the kit from
 *     naming it in their source.
 */
import { ULKE_KODLARI } from '../tipler'
import type { UlkeAraclari } from './tipler'

/** The shape the database keeps a tool's key in (migration 139: `arac`). A key outside it could never be kept. */
export const ARAC_ANAHTARI = /^[a-z0-9]+(-[a-z0-9]+)*$/
export const ARAC_ANAHTARI_AZAMI = 60

/**
 * The country a key belongs to ("ca" for "ca-triage"), or null: a key of the kit, or a plain key. A key belongs to a
 * country when it begins with the code of A COUNTRY THE PRODUCT HAS (lib/ulke/tipler.ts → ULKE_KODLARI) — or with
 * `kendiKodu`, the code of the pack that is asking — and a hyphen. Two letters that are no country's code are just
 * the beginning of a word ("kv-…" is not a country's key).
 */
export function anahtarUlkesi(anahtar: unknown, kendiKodu?: string): string | null {
  const onEk = typeof anahtar === 'string' ? /^([a-z]{2})-[a-z0-9]/.exec(anahtar)?.[1] ?? null : null
  if (onEk === null) return null
  return (ULKE_KODLARI as readonly string[]).includes(onEk) || onEk === kendiKodu ? onEk : null
}

/** true = the key is this country's own. */
export const ulkeyeOzelMi = (anahtar: unknown, kod: string): boolean => anahtarUlkesi(anahtar, kod) === kod

/**
 * Every key in a pack's tools area that carries a country's code: switched-on tools, placeholders, the pack's own
 * mechanisms. Sorted, each once. For a pack that has nothing of its own: an empty list.
 */
export function ulkeyeOzelAnahtarlar(icerik: UlkeAraclari | null | undefined, kod?: string): string[] {
  if (!icerik) return []
  const hepsi = [
    ...(Array.isArray(icerik.araclar) ? icerik.araclar : []).map((p) => p?.anahtar),
    ...(Array.isArray(icerik.yuvalar) ? icerik.yuvalar : []).map((y) => y?.anahtar),
    ...(icerik.kendiAraclari ?? []).map((t) => t?.anahtar),
  ]
  return [...new Set(hepsi.filter((k): k is string => anahtarUlkesi(k, kod) !== null))].sort()
}
