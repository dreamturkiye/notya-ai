'use client'

/**
 * NOTYA-UZ-MUAYENE-01 · NOTYA-ULKE-SABLON-01 — the two choices behind a language form: WHICH LANGUAGE and, where
 * that language has more than one, WHICH SCRIPT. Shared by the first-login question and by the settings page.
 *
 * Which languages and scripts exist is the active pack's (`uygulama.dilGruplari`); their names are the pack's
 * catalogue (`diller`, `yazilar`), each shown in its own language and script. A country with one language shows no
 * language choice; a country without a second script shows no script choice.
 */
import React from 'react'
import { Secim } from './Kabuk'
import { dilAdi, dilBirlestir, dilGruplari, uygulamaMetni, type UygulamaMetni } from '@/lib/ulke/arayuz'

type Secenek = { deger: string; ad: string; dil: string }

/** Each language of the country, named in itself — a language with several scripts in the script given. */
export function dilSecenekleri(yazi: string | null): Secenek[] {
  return dilGruplari().map((g) => {
    const dil = dilBirlestir(g.temel, yazi)
    return { deger: g.temel, ad: dilAdi(uygulamaMetni(dil), g.temel), dil }
  })
}

/** Each script named in that script. Empty where no language of the country has more than one. */
export function yaziSecenekleri(): Secenek[] {
  const g = dilGruplari().find((x) => x.bicimler.length > 1)
  return g ? g.bicimler.flatMap((b) => (b.yazi ? [{ deger: b.yazi, ad: uygulamaMetni(b.dil).yazilar[b.yazi] ?? '', dil: b.dil }] : [])) : []
}

export function DilSecimi({ etiket, ad, deger, yazi, sec }: { etiket: string; ad: string; deger: string; yazi: string | null; sec: (d: string) => void }) {
  const secenekler = dilSecenekleri(yazi)
  return secenekler.length > 1 ? <Secim etiket={etiket} ad={ad} deger={deger} secenekler={secenekler} sec={sec} /> : null
}

export function YaziSecimi({ m, etiket, deger, sec }: { m: UygulamaMetni; etiket?: string; deger: string | null; sec: (y: string) => void }) {
  const secenekler = yaziSecenekleri()
  return secenekler.length > 1 ? <Secim etiket={etiket ?? m.baslangic.yazi} ad="yazi" deger={deger ?? ''} secenekler={secenekler} sec={sec} /> : null
}
