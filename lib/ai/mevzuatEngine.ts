// lib/ai/mevzuatEngine.ts

export const MEVZUAT_DATABASE: Record<string, { kanun: string; madde: string; ozet: string; url: string; yururluk: string }> = {
  kdv: { kanun: "KDV Kanunu 3065", madde: "Md.1-29", ozet: "KDV matrah oran istisna 2026 genel oran %20", url: "gib.gov.tr", yururluk: "1984" },
  tevkifat: { kanun: "KDV GT 117", madde: "IV/A", ozet: "KDV tevkifat uygulamasi ve oranlari", url: "gib.gov.tr", yururluk: "2012" },
  stopaj: { kanun: "GVK 193", madde: "Md.94", ozet: "Gelir vergisi tevkifati zorunlulugu ve oranlari", url: "mevzuat.gov.tr", yururluk: "1961" },
  kurumlar_vergisi: { kanun: "KVK 5520", madde: "Md.1-36", ozet: "Kurumlar vergisi orani 2026: %25", url: "mevzuat.gov.tr", yururluk: "2006" },
  transfer_fiyatlandirmasi: { kanun: "KVK", madde: "Md.13", ozet: "Iliskili kisilerle yapilan islemlerde emsallere uygunluk", url: "gib.gov.tr", yururluk: "2006" },
  ar_ge_indirimi: { kanun: "KVK", madde: "Md.32A", ozet: "Ar-Ge harcamalari %100-%150 indirimi", url: "gib.gov.tr", yururluk: "2016" },
  enflasyon_muhasebesi: { kanun: "VUK Muk.Md.298", madde: "298/A-B", ozet: "TMS 29 enflasyon duzeltmesi 2023+ zorunlu", url: "kgk.gov.tr", yururluk: "2023" },
  nakit_tahsilat: { kanun: "VUK Muk.Md.257", madde: "Mukerrer Md.257", ozet: "30.000 TL uzeri tahsilat/odemelerde banka zorunlulugu 2026", url: "gib.gov.tr", yururluk: "2026" },
  efatura: { kanun: "VUK GT 509", madde: "2019/1 Teblig", ozet: "e-Fatura zorunluluk esigi ve uygulama kapsamlari", url: "ebelge.gib.gov.tr", yururluk: "2019" },
  edefter: { kanun: "VUK GT 509", madde: "2019/1 Teblig", ozet: "e-Fatura zorunluluk esigi ve uygulama kapsamlari", url: "ebelge.gib.gov.tr", yururluk: "2019" },
  sgk_ebildirge: { kanun: "SGK e-Bildirge", madde: "", ozet: "SGK e-Bildirge gonderimi", url: "sgk.gov.tr", yururluk: "2026" },
  beyanname: { kanun: "Beyanname", madde: "", ozet: "Yillik ve aylik beyanname gonderimi", url: "gib.gov.tr", yururluk: "2026" },
  muhtasar_beyanname: { kanun: "Muhtasar Beyanname", madde: "", ozet: "Muhtasar beyanname gonderimi", url: "gib.gov.tr", yururluk: "2026" },
  sgk_uzlasma: { kanun: "SGK Uzlasma", madde: "", ozet: "SGK uzlasma gonderimi", url: "sgk.gov.tr", yururluk: "2026" },
  kurumlar_gecici_vergi: { kanun: "Kurumlar Gecici Vergi", madde: "", ozet: "Kurumlar gecici vergi gonderimi", url: "gib.gov.tr", yururluk: "2026" },
  yapilandirma: { kanun: "Yapilandirma", madde: "", ozet: "Yapilandirma gonderimi", url: "gib.gov.tr", yururluk: "2026" },
  masak_eft_aciklama: { kanun: "MASAK EFT Aciklama", madde: "", ozet: "EFT aciklamasi 20 karakter", url: "masak.gov.tr", yururluk: "2026" },
  vuk_592: { kanun: "VUK 592", madde: "", ozet: "Vergi uygulama konusu 592", url: "gib.gov.tr", yururluk: "2026" },
};

export function detectDayOfWeek(year: number, month: number, day: number): number {
  const date = new Date(year, month - 1, day);
  let dayOfWeek = date.getDay();
  if (dayOfWeek === 0) dayOfWeek = 1; // Sunday -> Monday
  else if (dayOfWeek === 6) dayOfWeek = 2; // Saturday -> Monday
  return dayOfWeek;
}

export function advanceToNextWeekday(year: number, month: number, day: number): string {
  let date = new Date(year, month - 1, day);
  while (date.getDay() === 0 || date.getDay() === 6) { // Saturday or Sunday
    date.setDate(date.getDate() + 1);
  }
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
}

export function getBeyanTakvimi(year: number, month: number): Array<{ beyan: string; son_gun: string; aciklama: string; kanun: string }> {
  const beyanlar = [
    { beyan: "KDV1 Beyanname", son_gun: advanceToNextWeekday(year, month, 28), aciklama: "Aylık KDV beyanname", kanun: "KDV Kanunu" },
    { beyan: "Muhtasar Beyanname", son_gun: advanceToNextWeekday(year, month, 26), aciklama: "Yillık muhtasar beyanname", kanun: "Muhtasar Beyanname" },
    { beyan: "SGK e-Bildirge", son_gun: advanceToNextWeekday(year, month, 23), aciklama: "Aylık SGK bildirgesi", kanun: "SGK e-Bildirge" },
  ];

  if (month === 2) {
    beyanlar.push({ beyan: "4.Gecici Vergi", son_gun: advanceToNextWeekday(year, month, 17), aciklama: "Dorduncu gecici vergi", kanun: "Gecici Vergi" });
  } else if (month === 3) {
    beyanlar.push({ beyan: "Yillik GV", son_gun: advanceToNextWeekday(year, month, 31), aciklama: "Yillik genel vergi", kanun: "Genel Vergi" });
  } else if (month === 4) {
    beyanlar.push({ beyan: "Kurumlar Vergisi", son_gun: advanceToNextWeekday(year, month, 30), aciklama: "Kurumlar vergisi", kanun: "Kurumlar Vergisi" });
  } else if (month === 5) {
    beyanlar.push({ beyan: "1.Gecici Vergi", son_gun: advanceToNextWeekday(year, month, 17), aciklama: "Birinci gecici vergi", kanun: "Gecici Vergi" });
  } else if (month === 7) {
    beyanlar.push({ beyan: "SGK Uzlasma", son_gun: advanceToNextWeekday(year, month, 31), aciklama: "SGK uzlasma", kanun: "SGK Uzlasma" });
  } else if (month === 8) {
    beyanlar.push({ beyan: "2.Gecici Vergi", son_gun: advanceToNextWeekday(year, month, 17), aciklama: "Ikinci gecici vergi", kanun: "Gecici Vergi" });
  } else if (month === 10) {
    beyanlar.push({ beyan: "Kurumlar Gecici", son_gun: advanceToNextWeekday(year, month, 31), aciklama: "Kurumlar gecici vergi", kanun: "Kurumlar Vergisi" });
  } else if (month === 11) {
    beyanlar.push({ beyan: "3.Gecici Vergi", son_gun: advanceToNextWeekday(year, month, 17), aciklama: "Ucuncu gecici vergi", kanun: "Gecici Vergi" });
  }

  return beyanlar;
}

export function detectKeyword(text: string, keywordMap: Record<string, string[]>): string[] {
  const keywords = new Set<string>();
  for (const [keyword, synonyms] of Object.entries(keywordMap)) {
    if (synonyms.some(synonym => text.toLowerCase().includes(synonym.toLowerCase()))) {
      keywords.add(keyword);
    }
  }
  return Array.from(keywords);
}

export function getMevzuatReferences(keywords: string[]): Array<{ kanun: string; madde: string; ozet: string; url: string }> {
  const references = new Set<string>();
  for (const keyword of keywords) {
    if (MEVZUAT_DATABASE[keyword]) {
      references.add(JSON.stringify(MEVZUAT_DATABASE[keyword]));
    } else {
      for (const [key, value] of Object.entries(MEVZUAT_DATABASE)) {
        if (key.includes(keyword.toLowerCase())) {
          references.add(JSON.stringify(value));
        }
      }
    }
  }
  return Array.from(references).map(ref => JSON.parse(ref));
}

export function detectKeywords(text: string): string[] {
  const keywordMap = {
    kdv: ["kdv", "karbon dioksit vergisi"],
    tevkifat: ["tevkifat", "vergi indirimi"],
    stopaj: ["stopaj", "gelir vergisi"],
    kurumlar_vergisi: ["kurumlar vergisi", "kvy"],
    transfer_fiyatlandirmasi: ["transfer fiyatlandirma", "emsal uygunluk"],
    ar_ge_indirimi: ["ar-ge indirim", "ara geliştirme"],
    enflasyon_muhasebesi: ["enflasyon muhasebe", "tms 29"],
    nakit_tahsilat: ["nakit tahsilat", "30.000 tl siniri"],
    efatura: ["e-fatura", "elektronik fatura"],
    edefter: ["e-defter", "elektronik defter"],
    sgk_ebildirge: ["sgk bildirge", "sgk e-bildirge"],
    beyanname: ["beyanname", "yillık beyanname"],
    muhtasar_beyanname: ["muhtasar beyanname", "aylık beyanname"],
    sgk_uzlasma: ["sgk uzlasma", "sgk uygulama"],
    kurumlar_gecici_vergi: ["kurumlar gecici vergi", "kurumsal gecici vergi"],
    yapilandirma: ["yapilandirma", "vergi uygulama"],
    masak_eft_aciklama: ["masak eft aciklama", "eft aciklama"],
    vuk_592: ["vuk 592", "vergi uygulama konusu 592"],
  };

  return detectKeyword(text, keywordMap);
}

export function getMevzuatReferencesFromText(text: string): Array<{ kanun: string; madde: string; ozet: string; url: string }> {
  const keywords = detectKeywords(text);
  return getMevzuatReferences(keywords);
}