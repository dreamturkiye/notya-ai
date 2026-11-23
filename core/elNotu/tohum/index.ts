/**
 * ESNEK-MUAYENE-A — seed lexicons per branş (data). Türkiye build: the general Turkish seed for every one of the 40
 * branches, plus the branş seed where one exists. A branş without its own seed still gets the general seed and learns the
 * doctor's own abbreviations through Doğrula — no branch is left out (cross-specialty parity is a data question here).
 */
import type { SozlukGirdisi } from '../tipler'
import { GENEL_TR_TOHUM } from './genelTr'
import { KBB_TR_TOHUM } from './kbbTr'

const BRANS_TR: Record<string, SozlukGirdisi[]> = {
  'kulak-burun-bogaz': KBB_TR_TOHUM,
  kbb: KBB_TR_TOHUM,
}

export function tohumlarTr(brans: string | null | undefined): { brans: SozlukGirdisi[]; genel: SozlukGirdisi[] } {
  return { brans: (brans && BRANS_TR[brans]) || [], genel: GENEL_TR_TOHUM }
}
