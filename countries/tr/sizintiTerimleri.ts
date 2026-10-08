/**
 * NOTYA-ULKE-01 — terms that mark content as Türkiye's. Declared here, hunted in every OTHER country's output by
 * lib/ulke/testing/sizintiTarayici.ts (checklist rule 7). Not part of the runtime pack: only tests and scripts read it
 * (through countries/tumu.ts).
 *
 * Whole-word, case-sensitive entries exist for a reason: "sut" is the Uzbek word for milk; "SUT" is the Turkish
 * reimbursement rulebook.
 */
import type { SizintiTerimi } from '@/lib/ulke/tipler'
import { TURKISH_REFS } from '@/lib/asistan/turkishSpecialtyRefs'
import { KLINIK_TURKISH_REFS } from '@/lib/klinik/klinikTurkishRefs'

const parca = (terim: string): SizintiTerimi => ({ terim, eslesme: 'parca' })
const kelime = (terim: string): SizintiTerimi => ({ terim, eslesme: 'kelime' })
const KELIME = (terim: string): SizintiTerimi => ({ terim, eslesme: 'kelime', buyukKucukDuyarli: true })

/** State systems, payers, law, identity, money, names. Matching folds case and the dotted / dotless i unless marked. */
const SABIT: SizintiTerimi[] = [
  parca('e-Nabız'), parca('enabız'), parca('e-Nabiz'), parca('enabiz'),
  KELIME('MBYS'), KELIME('SGK'), KELIME('SUT'), KELIME('KVKK'), KELIME('HBYS'), KELIME('TİTCK'), KELIME('TITCK'),
  parca('Medula'), parca('e-Reçete'), parca('e-Recete'), parca('e-İstirahat'), parca('e-Rapor'), parca('e-Devlet'),
  parca('MERNİS'), parca('MERNIS'),
  parca('TC kimlik'), parca('T.C. kimlik'), { terim: 'T.C.', eslesme: 'parca', buyukKucukDuyarli: true }, KELIME('TCKN'),
  parca('₺'), KELIME('TL'), KELIME('TRY'), kelime('lira'), parca('турецк'),
  parca('Sağlık Bakanlığı'), parca('Saglik Bakanligi'),
  parca('Türk'), parca('Turkiya'), parca('Turkey'), parca('Турци'),
  // The assistant's Turkish persona name: another country gets its own (checklist D1).
  parca('Ayşe'), kelime('Ayse'), parca('Айше'), parca('Hocam'),
]

const TURKCE_HARF = /[çğıöşüİĞŞÇÖÜ]/

/**
 * Clinical reference names (the lines Ayşe quotes as her sources). Each full line, plus its leading name when that
 * name carries a Turkish letter, "T.C." or "SGK" — an international name (KDIGO, ESC, WHO) is not Türkiye's and is
 * left out on purpose.
 */
function kaynakTerimleri(kaynaklar: Record<string, string[]>): SizintiTerimi[] {
  const out = new Set<string>()
  for (const satirlar of Object.values(kaynaklar)) {
    for (const satir of satirlar) {
      out.add(satir)
      const bas = satir.split(/ — | \(|;|:/)[0].trim()
      if (bas.length >= 12 && (TURKCE_HARF.test(bas) || bas.includes('T.C.') || /\bSGK\b/.test(bas))) out.add(bas)
    }
  }
  return [...out].map(parca)
}

export const TR_SIZINTI_TERIMLERI: readonly SizintiTerimi[] = [
  ...SABIT,
  ...kaynakTerimleri(TURKISH_REFS),
  ...kaynakTerimleri(KLINIK_TURKISH_REFS),
]

/** Letters of the Turkish alphabet that Uzbek (Latin or Cyrillic) and Russian do not use. A proxy, stated as one. */
export const TR_SIZINTI_HARFLERI = 'çğıöşüİĞŞÇÖÜ'
