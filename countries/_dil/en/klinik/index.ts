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
import type { HamBolum } from './hastaFormu/yardimci'
import { enNotSablonlari } from './notSablonlari'
import { enRolTanimlari } from './roller'
import { enAsistan } from '../asistan'
import { enTalimatlar } from './talimatlar'

export type EnKlinikEk = {
  /** Identifier, payer and consent sections. Only this country. */
  cekirdekEk?: readonly HamBolum[]
  /** The country's emergency sentence, written into red-flag help. Includes the local number. */
  acilCumle?: string
}

export function enKlinik(g: EnUlkeGirdisi & EnKlinikEk): UlkeKlinigi {
  const bicim = g.sozler.bicim
  // `g.roller`: where this country's role list differs from the shared forty (NOTYA-ULKE-OZEL-01); absent = the forty.
  const roller = enRolTanimlari(bicim, g.rolAdlari, g.roller)
  const t = enTalimatlar({ bicim, kidemliHekim: g.kidemliHekim, roller, sablonlar: enNotSablonlari(bicim, g.roller), veliYasi: g.veliYasi })
  const asistan = enAsistan({ bicim, ulkeAdi: g.ulkeAdi, ulusal: g.asistanUlusal, ...(g.asistanEkKitap ? { ekKitap: g.asistanEkKitap } : {}), roller })
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
    hastaFormu: enHastaFormu({
      bicim, surum: g.surum,
      ...(g.formRizasi ? { riza: g.formRizasi } : {}),
      ...(g.roller ? { rolDegisimi: g.roller } : {}),
      ...(g.cekirdekEk ? { cekirdekEk: g.cekirdekEk } : {}),
      ...(g.acilCumle ? { acilCumle: g.acilCumle } : {}),
    }),
    asistanTalimati: (dil, rol) => (dil === bicim ? asistan.talimat(rol) : null),
    yenidenYazimTalimati: () => null,
    yenidenYazimGirdisi: () => '',
    digerDil: () => null,
  }
}
