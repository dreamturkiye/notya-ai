/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: the CLINICAL half of an English-speaking pack (lib/ulke/tipler.ts →
 * UlkeKlinigi), assembled from the set and from what the country states. Reached only through
 * countries/active/klinik, and only on the server.
 *
 * NOTHING HERE HAS BEEN MEASURED OR REVIEWED IN ANY COUNTRY. The speech thresholds a pack states are starting values
 * to be tuned on real clinic audio (checklist A5, L1); the consent wording has not been read by a lawyer (A3, I1);
 * no template, instruction or question set has a local reviewer (C12, C13, C14).
 *
 * ONE LANGUAGE: a note cannot be rewritten in another, so the three "rewrite" entries answer "none". The one second
 * pass of speech recognition (on low confidence) repeats the SAME recording with the language set to English; there
 * is no pass in a second language.
 */
import type { UlkeKlinigi } from '@/lib/ulke/tipler'
import type { EnUlkeGirdisi } from '../girdi'
import { enHastaFormu } from './hastaFormu'
import { enNotSablonlari } from './notSablonlari'
import { enRolTanimlari } from './roller'
import { enTalimatlar } from './talimatlar'

export function enKlinik(g: EnUlkeGirdisi): UlkeKlinigi {
  const bicim = g.sozler.bicim
  const t = enTalimatlar({ bicim, kidemliHekim: g.kidemliHekim, roller: enRolTanimlari(bicim, g.rolAdlari), sablonlar: enNotSablonlari(bicim), veliYasi: g.veliYasi })
  return {
    konusma: g.konusma,
    // The sentence beside the box is the country's own (`sozler.kayitRizasi`). This stamp is stored with every visit,
    // so that a later, lawyer-reviewed wording can be told apart from the draft.
    riza: { surum: g.surum, hukukcuInceledi: false },
    sablonlar: t.sablonlar,
    gunlukMuayeneLimiti: g.gunlukMuayeneLimiti,
    notTalimati: t.notTalimati,
    notGirdisi: t.notGirdisi,
    notAlanlari: t.notAlanlari,
    hastaOzetiTalimati: t.hastaOzetiTalimati,
    hastaOzetiGirdisi: t.hastaOzetiGirdisi,
    hastaFormu: enHastaFormu({ bicim, surum: g.surum, ...(g.formRizasi ? { riza: g.formRizasi } : {}) }),
    yenidenYazimTalimati: () => null,
    yenidenYazimGirdisi: () => '',
    digerDil: () => null,
  }
}
