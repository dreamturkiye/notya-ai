/**
 * NOTYA-UZ-MUAYENE-01 — the language choices as people think of them: Uzbek or Russian, and for Uzbek, Latin or
 * Cyrillic script. Used by the first-login question (one language for everything) and by the settings page
 * (interface language and note language separately, one script for both). Pure: state lives in the caller.
 *
 * Each choice is written in ITS OWN language and script, whatever the screen's language is — a doctor who cannot
 * read the current screen must still be able to find their own.
 */
import React from 'react'
import { Secim } from './Kabuk'
import { UZ_UYGULAMA_METINLERI, type TemelDil, type UygulamaMetni, type Yazi } from './metinler'

/** "Oʻzbekcha" for Uzbek in the given script, "Русский" for Russian: each in its own language. */
export function dilSecenekleri(yazi: Yazi): { deger: TemelDil; ad: string; dil: string }[] {
  const uz = yazi === 'Cyrl' ? 'uz-Cyrl' : 'uz-Latn'
  return [
    { deger: 'uz', ad: UZ_UYGULAMA_METINLERI[uz].diller.uz, dil: uz },
    { deger: 'ru', ad: UZ_UYGULAMA_METINLERI.ru.diller.ru, dil: 'ru' },
  ]
}

/** Each script named in that script. */
export const YAZI_SECENEKLERI: { deger: Yazi; ad: string; dil: string }[] = [
  { deger: 'Latn', ad: UZ_UYGULAMA_METINLERI['uz-Latn'].diller.latin, dil: 'uz-Latn' },
  { deger: 'Cyrl', ad: UZ_UYGULAMA_METINLERI['uz-Cyrl'].diller.kiril, dil: 'uz-Cyrl' },
]

export function DilSecimi({ etiket, ad, deger, yazi, sec }: { etiket: string; ad: string; deger: TemelDil; yazi: Yazi; sec: (d: TemelDil) => void }) {
  return <Secim etiket={etiket} ad={ad} deger={deger} secenekler={dilSecenekleri(yazi)} sec={sec} />
}

export function YaziSecimi({ m, etiket, deger, sec }: { m: UygulamaMetni; etiket?: string; deger: Yazi; sec: (y: Yazi) => void }) {
  return <Secim etiket={etiket ?? m.baslangic.yazi} ad="yazi" deger={deger} secenekler={YAZI_SECENEKLERI} sec={sec} />
}
