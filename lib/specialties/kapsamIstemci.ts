/**
 * BRANS-ALAN-SIZMASI — istemci tarafı: sunucunun gönderdiği `bransKapsami` paketini okur.
 * Paket yoksa varsayılan BASELINE'dır (pediatrik alan yok, "hasta" dili) — varsayılan asla bir branşın
 * içeriğini taşımaz. Karar sunucuda: lib/specialties/kapsam.ts (bu dosya onu import etmez; istemci paketine
 * registry/katalog girmesin diye yalnız tip alınır).
 */
import { BASELINE_OLCUMLER } from './profile'
import { hitapMetinleri } from './hitap'
import type { BransKapsami } from './kapsam'

export function istemciKapsami(k: BransKapsami | null | undefined): BransKapsami {
  if (k && Array.isArray(k.olcumler) && k.hitap) return k
  return {
    brans: null,
    pediatrik: false,
    veliDili: false,
    olcumler: BASELINE_OLCUMLER.map(({ anahtar, etiket, birim }) => ({ anahtar, etiket, birim })),
    hitap: hitapMetinleri(false),
  }
}
