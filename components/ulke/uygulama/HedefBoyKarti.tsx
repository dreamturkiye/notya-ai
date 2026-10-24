'use client'

/**
 * The target-height tool's live studio in a country build: Türkiye's own scene (components/hedefBoy/HedefBoyManken.tsx —
 * father, child and mother figures against a ruler) with the pack's words and the country's units injected. No Turkish
 * string and no Türkiye endpoint: the numbers come from the tool's own result, the words from the pack.
 */
import React from 'react'
import HedefBoyManken, { HedefBoySahneBos, type HedefBoyGorsel, type HedefBoyEnjeksiyon, type HedefBoySozler } from '@/components/hedefBoy/HedefBoyManken'
import { sayiMetni, type Yazici } from '@/lib/ulke/araclar/paket'
import type { AraclarMetni } from '@/lib/ulke/arayuz'
import { useHedefBoyGorselleri } from './bitki'
import { ulkeYolu } from '@/lib/ulke/yol'

type Sayi = { anahtar: string; deger: number; ondalik: number; olcu?: string; birim?: string }

export function HedefBoyKarti({ a, y, o, cinsiyet, anne, baba, sayilar }: {
  a: AraclarMetni; y: Yazici; o?: Parameters<typeof sayiMetni>[3]
  cinsiyet: unknown; anne: unknown; baba: unknown
  /** The tool's result numbers (hedef, alt, ust), or null while the fields are not valid. */
  sayilar: readonly Sayi[] | null
}) {
  const g = useHedefBoyGorselleri()
  const gorsel = g ?? { baba: ulkeYolu('/hedef-boy/baba.png'), anne: ulkeYolu('/hedef-boy/anne.png'), erkek: ulkeYolu('/hedef-boy/cocuk-erkek.png'), kiz: ulkeYolu('/hedef-boy/cocuk-kiz.png') }
  const yaz = (cm: number, ondalik: number) => sayiMetni({ anahtar: 'hedef', deger: cm, ondalik, olcu: 'boy' } as never, a, y, o)
  const enj: HedefBoyEnjeksiyon = { sozler: Object.fromEntries([['baba', a.arac.mankenBaba],['anne', a.arac.mankenAnne],['erkek', a.arac.mankenErkek],['kiz', a.arac.mankenKiz],['olcerBirim', a.arac.mankenOlcerBirim],['hedef', a.arac.mankenHedef],['tahmini', a.arac.mankenTahmini],['aralik', a.arac.mankenAralik],['sahneKicker', a.arac.mankenSahneKicker],['sahneBaslik', a.arac.mankenSahneBaslik],['sahneAlt', a.arac.mankenSahneAlt]]) as HedefBoySozler, gorsel, bicim: (cm) => yaz(cm, 1), bicimKisa: (cm) => yaz(cm, 0) }
  const hedef = sayilar?.find((s) => s.anahtar === 'hedef')
  const kiz = cinsiyet === 'kiz'
  if (!hedef || typeof anne !== 'number' || typeof baba !== 'number') return <HedefBoySahneBos cinsiyet={kiz ? 'Kız' : 'Erkek'} enjeksiyon={enj} />
  const alt = sayilar?.find((s) => s.anahtar === 'alt')?.deger ?? hedef.deger
  const ust = sayilar?.find((s) => s.anahtar === 'ust')?.deger ?? hedef.deger
  const sonuc: HedefBoyGorsel = { anneCm: anne, babaCm: baba, cocukCm: hedef.deger, altCm: alt, ustCm: ust, cinsiyet: kiz ? 'kiz' : 'erkek' }
  return <HedefBoyManken sonuc={sonuc} enjeksiyon={enj} />
}
