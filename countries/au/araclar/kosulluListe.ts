/**
 * A checklist whose ticks appear only after a choice. Hidden ticks are not counted, so the total on the screen
 * is the number of ticks the choice shows, not the number stored in the file.
 */
import type { AracAlani, AracGirdisi, AracTanimi } from '@/lib/ulke/araclar/tipler'
import { alanVarMi, BOS_SONUC } from '@/lib/ulke/araclar/yardimci'

export function kosulluListe(t: {
  anahtar: string
  alanlar: readonly AracAlani[]
  uyarilar: readonly string[]
  uyari: (secili: readonly string[], g: AracGirdisi) => readonly string[]
  kaynak: string
}): AracTanimi {
  return {
    anahtar: t.anahtar,
    tur: 'liste',
    alanlar: t.alanlar,
    cikti: { sayilar: ['isaretli'], bantlar: [], uyarilar: t.uyarilar, tarihler: [] },
    kaynak: t.kaynak,
    hesapla: (g) => {
      const gorunen = t.alanlar.filter((a) => a.tur === 'isaret' && alanVarMi(a, g)).map((a) => a.anahtar)
      const secili = gorunen.filter((k) => g[k] === true)
      if (!secili.length) return BOS_SONUC
      return {
        tamam: true,
        sayilar: [{ anahtar: 'isaretli', deger: secili.length, ondalik: 0, enCok: gorunen.length }],
        bant: null,
        uyarilar: t.uyari(secili, g),
        tarihler: [],
      }
    },
  }
}
