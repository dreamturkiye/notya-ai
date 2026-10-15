/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: what an English-speaking pack brings for the country kit's shared
 * screens (lib/ulke/arayuz/tipler.ts → UlkeArayuzu), assembled from the set and from what the country states.
 * CONTENT ONLY, client-safe. The instructions to the model and the intake questions are the server half
 * (./klinik/index.ts) and are not imported here.
 *
 * THE ASSISTANT is one professor per role (a senior professional for an allied role), named by title until the
 * owner gives her a personal name. The chart core is shared; the national reference is the country's.
 */
import type { UlkeArayuzu } from '@/lib/ulke/arayuz/tipler'
import { EN_CAPA, EN_FONT_HREF, enAcilis } from './acilis'
import { enAraclar } from './araclar'
import { enForm } from './form'
import type { EnUlkeGirdisi } from './girdi'
import { enNotSablonlari } from './klinik/notSablonlari'
import { enRolTanimlari } from './klinik/roller'
import { asistanKimligiKur } from '@/lib/ulke/asistan/kimlik'
import { enKlinikMetinleri } from './klinikMetinleri'
import { enMesaj } from './mesaj'
import { enPortal } from './portal'
import { enRandevu } from './randevu'
import { enUygulama } from './uygulama'

export function enArayuz(g: EnUlkeGirdisi): UlkeArayuzu {
  const bicim = g.sozler.bicim
  // `g.roller`: where this country's role list differs from the shared forty (NOTYA-ULKE-OZEL-01); absent = the forty.
  const roller = enRolTanimlari(bicim, g.rolAdlari, g.roller)
  return {
    marka: g.sozler.marka,
    metinler: { [bicim]: enUygulama(g.sozler) },
    randevuMetinleri: { [bicim]: enRandevu(g.sozler) },
    portalMetinleri: { [bicim]: enPortal(g.sozler) },
    // Messages and clinic accounts. Templates and consultation stay off: those catalogues are not assembled.
    mesajMetinleri: { [bicim]: enMesaj(bicim) },
    klinikMetinleri: { [bicim]: enKlinikMetinleri(bicim) },
    formMetinleri: { [bicim]: enForm(g.sozler) },
    araclar: enAraclar({ sozler: g.sozler, ulke: g.ulkeAdi, birimler: g.birimler, ...g.araclar, ...(g.roller ? { roller } : {}) }),
    roller,
    // One assistant for every role of the pack, including clinic doctors and allied professions. The title only:
    // the three references are the server instruction, not this screen. A key that is not a role has none.
    asistan: (rol) => {
      const r = roller.find((x) => x.anahtar === rol)
      return r ? asistanKimligiKur({ uzmanlik: r.ad[bicim] ?? rol, taraf: r.taraf }) : null
    },
    notSablonlari: enNotSablonlari(bicim, g.roller),
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
