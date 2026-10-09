/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: what an English-speaking pack brings for the country kit's shared
 * screens (lib/ulke/arayuz/tipler.ts → UlkeArayuzu), assembled from the set and from what the country states.
 * CONTENT ONLY, client-safe. The instructions to the model and the intake questions are the server half
 * (./klinik/index.ts) and are not imported here.
 *
 * NO ASSISTANT IS NAMED. An English-speaking pack brings no persona name (the owner's decision per country,
 * checklist D1; none has been proposed): every role shows the neutral assistant line.
 */
import type { UlkeArayuzu } from '@/lib/ulke/arayuz/tipler'
import { EN_CAPA, EN_FONT_HREF, enAcilis } from './acilis'
import { enAraclar } from './araclar'
import { enForm } from './form'
import type { EnUlkeGirdisi } from './girdi'
import { enNotSablonlari } from './klinik/notSablonlari'
import { enRolTanimlari } from './klinik/roller'
import { enPortal } from './portal'
import { enRandevu } from './randevu'
import { enUygulama } from './uygulama'

export function enArayuz(g: EnUlkeGirdisi): UlkeArayuzu {
  const bicim = g.sozler.bicim
  const roller = enRolTanimlari(bicim, g.rolAdlari)
  return {
    marka: g.sozler.marka,
    metinler: { [bicim]: enUygulama(g.sozler) },
    randevuMetinleri: { [bicim]: enRandevu(g.sozler) },
    portalMetinleri: { [bicim]: enPortal(g.sozler) },
    formMetinleri: { [bicim]: enForm(g.sozler) },
    araclar: enAraclar({ sozler: g.sozler, ulke: g.ulkeAdi, birimler: g.birimler, ...g.araclar }),
    roller,
    // No persona is named in an English-speaking pack: the screens show the neutral line for every role.
    asistan: () => null,
    notSablonlari: enNotSablonlari(bicim),
    acilis: {
      diller: [bicim],
      icerik: { [bicim]: enAcilis({ sozler: g.sozler, roller, telefonOrnegi: g.acilis.telefonOrnegi, aylikTutarKalibi: g.acilis.aylikTutarKalibi }) },
      dilAdlari: { [bicim]: { ad: 'English', kisa: 'En' } },
      capalar: EN_CAPA,
      fontHref: EN_FONT_HREF,
      markaYazisi: g.sozler.marka.toLowerCase(),
      fiyatlar: g.acilis.fiyatlar,
    },
  }
}
