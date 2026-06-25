export interface SOAPTemplate {
  subjektifFields: string[];
  objektifFields: string[];
  degerlendirmeFields: string[];
  planFields: string[];
}

export const SOAP_TEMPLATES: Record<string, SOAPTemplate> = {
  pediatri: {
    subjektifFields: ["ates", "kilo", "boy", "vucut-agirlik-persentil", "beslenme", "uyku"],
    objektifFields: ["gelisim-kilometre-taslari", "cocuk-asisi-takvimi", "vital-bulgu", "fizik-muayene"],
    degerlendirmeFields: ["buyume-degerlendirmesi", "gelisimsel-takip"],
    planFields: ["asilar", "takip", "aile-egitimi"]
  },
  kardiyoloji: {
    subjektifFields: ["gogus-agrisi", "nefes-darligi", "palpitasyon", "NYHA-sinifi"],
    objektifFields: ["EKG-yorumu", "ejeksiyon-fraksiyonu", "kan-basinci", "kalp-sesi"],
    degerlendirmeFields: ["risk-skoru", "koroner-hastalik-olasiligi"],
    planFields: ["ilaç-titrasyonu", "ekg-takibi", "egzersiz-testi"]
  },
  ortopedi: {
    subjektifFields: ["travma-mekanizmasi", "VAS-agri-skoru", "hareket-kisitliligi", "gece-agrisi"],
    objektifFields: ["ROM-eklem-hareket-acisi", "X-ray-bulgusu", "kirli-siniflandirmasi", "kas-gucu"],
    degerlendirmeFields: ["fraktur-tipi", "stabilite"],
    planFields: ["alci", "fizik-tedavi", "cerrahi-plan"]
  },
  dermatoloji: {
    subjektifFields: ["pruritus", "süre", "yayilim", "tetikleyici"],
    objektifFields: ["lezyon-tanimlamasi-makul-papul-vezikul", "efflorescence-dagilimi", "dermoskopi-bulgusu", "cilt-rengi"],
    degerlendirmeFields: ["differential-tani", "ciddiyet"],
    planFields: ["topikal-tedavi", "biyopsi", "takip"]
  },
  default: {
    subjektifFields: ["şikayet", "öykü", "süre"],
    objektifFields: ["vital", "muayene"],
    degerlendirmeFields: ["tanı"],
    planFields: ["tedavi", "takip"]
  }
};
