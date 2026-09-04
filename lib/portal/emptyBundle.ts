import type { PortalBundle } from './types'

export function emptyPortalBundle(): PortalBundle {
  return {
    summary: {
      aktifIlac: 0,
      bekleyenMesaj: 0,
      sonLabOzet: 'Henüz lab sonucu yok',
      yaklasanKontrol: null,
      sonAktivite: [],
    },
    messages: [],
    visits: [],
    results: [],
    medications: [],
    medicationHistory: [],
    history: {
      kronikHastaliklar: [],
      alerjiler: [],
      ameliyatlar: [],
      aileOykusu: [],
      asilar: [],
    },
    tracking: {
      tansiyon: [],
      kilo: [],
      nabiz: [],
      spo2: [],
    },
  }
}
