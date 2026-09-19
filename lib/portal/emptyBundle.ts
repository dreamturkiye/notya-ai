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
    yonlendirmeler: [],
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
    portal: { moduller: [], nav: [] },
    buyume: null,
    gebelik: null,
    jinekoloji: null,
    hedefBoy: null,
    goz: null,
    deri: null,
    kronik: null,
    psik: null,
    kulak: null,
    kalp: null,
    akciger: null,
    noro: null,
    uro: null,
    spor: null, // SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Sporum yalnız spor-hekimligi hekiminin token'ında
    eklem: null,
    ftr: null,
    aile: null,
    endo: null,
    enfeksiyon: null, // ENFEKSIYON-EXCEPTIONAL-01 — Enfeksiyon Takibim yalnız enfeksiyon hekiminin token'ında
    gastro: null, // GASTROENTEROLOJI-EXCEPTIONAL-01 — Sindirimim yalnız gastroenteroloji hekiminin token'ında
    nef: null, // NEFROLOJI-EXCEPTIONAL-01 — Böbreklerim yalnız nefroloji hekiminin token'ında
    roma: null, // ROMATOLOJI-EXCEPTIONAL-01 — Romatizmam yalnız romatoloji hekiminin token'ında
    onko: null, // ONKOLOJI-EXCEPTIONAL-01 — Tedavim yalnız onkoloji hekiminin token'ında
    gc: null, // GENEL-CERRAHI-EXCEPTIONAL-01 — Ameliyatım yalnız genel-cerrahi hekiminin token'ında
    plastik: null, // PLASTIK-CERRAHI-EXCEPTIONAL-01 — Yaram yalnız plastik-cerrahi hekiminin token'ında
    gogusCerrahi: null, // GOGUS-CERRAHISI-EXCEPTIONAL-01
    beyin: null, // BEYIN-CERRAHISI-EXCEPTIONAL-01 — Beyin Cerrahisi takibi yalnız beyin-cerrahisi hekiminin token'ında
    cc: null, // COCUK-CERRAHISI-EXCEPTIONAL-01
  }
}
