/**
 * NOTYA-MEDULA — SGK Medula e-Reçete tipleri.
 *
 * Kaynak: SGK "Medula Eczane Reçete ve Rapor Web Servisleri Kullanım Kılavuzu" v1.122 (03.09.2026)
 * ve imzalı reçete XML şeması https://medeczane.sgk.gov.tr/doktor/faces/ornek/erecete.s1.xsd
 * (alan adları ve sırası şemadan birebir alındı — 2026-09-09).
 *
 * Kılavuzda zorunlu alanlar (EreceteDVO): tesisKodu, tcKimlikNo, takipNo*, provizyonTipi, receteTarihi,
 * receteAltTuru, protokolNo, doktorTcKimlikNo, doktorBransKodu, doktorSertifikaKodu, ereceteIlacListesi,
 * ereceteTaniListesi. İlaç: barkod, adet, kullanimDoz1, kullanimDoz2, kullanimPeriyot, kullanimPeriyotBirimi.
 * (*takipNo aile/işyeri/kurum hekimliklerinde gönderilmez.)
 *
 * KOD TABLOLARI: kılavuzun Tablo 9 bölümü (kullanım şekli, periyot birimi, provizyon, alt tür) PDF'in
 * çekilen kısmında yer almadı. Aşağıdaki değerler HBYS entegrasyonlarında yaygın kullanılan değerlerdir;
 * her biri TEST ORTAMI cevabıyla (sonucKodu/sonucMesaji) doğrulanacak — bkz. docs/MEDULA-KILAVUZ.md.
 * Doğrulanmamış bir kodu "kesin" diye gösterme.
 */

export interface MedulaKisi {
  tcKimlikNo: number | null   // Notya TC'yi hash-only tutar — gönderim anında doktor girer, asla saklanmaz
  adi: string
  soyadi: string
  cinsiyeti?: 'E' | 'K'
  dogumTarihi?: string        // dd.MM.yyyy
}

export interface MedulaIlac {
  barkod: number | null       // SGK ilaç listesi barkodu (EAN-13). null = eşleşmedi, doktor Medula'da seçer
  ilacAdi: string
  adet: number                // kutu
  kullanimDoz1: number        // günde kaç kez (2x1 → 2)
  kullanimDoz2: number        // her seferde kaç birim (2x1 → 1; 2x½ → 0.5)
  kullanimPeriyot: number     // periyot sayısı (1 = her 1 gün)
  kullanimPeriyotBirimi: number
  kullanimSekli: number
  aciklamalar?: { aciklamaTuru: number; aciklama: string }[]
}

export interface MedulaTani { taniKodu: string; taniAdi?: string }

export interface MedulaEreceteBilgisi {
  tesisKodu: number | null
  tcKimlikNo: number | null
  protokolNo: string
  provizyonTipi: number
  receteAltTuru: number
  receteTarihi: string        // dd.MM.yyyy
  receteTuru: number
  seriNo?: string
  takipNo?: string
  doktorTcKimlikNo: number | null
  doktorAdi: string
  doktorSoyadi: string
  doktorBransKodu: number | null
  doktorSertifikaKodu: number
  kisiBilgisi: MedulaKisi
  ereceteIlacBilgisi: MedulaIlac[]
  ereceteTaniBilgisi: MedulaTani[]
  ereceteAciklamaBilgisi: { aciklamaTuru: number; aciklama: string }[]
}

/** Reçete türü — kılavuzda geçen beş renk (1.07 / 2012). Sıra sektör standardı. */
export const RECETE_TURU = { normal: 1, kirmizi: 2, yesil: 3, turuncu: 4, mor: 5 } as const

/** DOĞRULANACAK (Tablo 9) — yaygın HBYS eşlemesi. */
export const RECETE_ALT_TURU = { ayaktan: 1, yatan: 2, taburcu: 3, gunubirlik: 4, evdeBakim: 5 } as const
export const PROVIZYON_TIPI = { normal: 1, isKazasi: 2, meslekHastaligi: 3, trafikKazasi: 4, adliVaka: 5, acil: 6, analik: 7 } as const
export const PERIYOT_BIRIMI = { saat: 1, gun: 3, hafta: 4, ay: 5, yil: 6 } as const
export const KULLANIM_SEKLI = { agizdan: 1, inhalasyon: 6, intramuskuler: 8, intravenoz: 9, nazal: 10, oftalmik: 11, rektal: 12, subkutan: 13, topikal: 14, vajinal: 15 } as const

/** SGK branş kodları (kılavuz değişiklik notlarından doğrulananlar). Diğerleri Tablo 9'dan tamamlanacak. */
export const SGK_BRANS_KODU: Record<string, number> = {
  'cocuk-sagligi': 1500,       // Çocuk Sağlığı ve Hastalıkları (alt branşlar 15xx)
  'aile-hekimligi': 4800,      // kılavuz: aile hekimi uzmanı 4800
  'deri-zuhrevi': 1700,        // kılavuz 1.90: 1700 zorunlu
  'ruh-sagligi': 1400,         // kılavuz 1.67
  'cocuk-ergen-ruh': 1600,     // kılavuz 1.67
  'enfeksiyon': 1200,          // kılavuz 1.101
  'immunoloji-alerji': 1069,   // kılavuz 1.109
  'dis-hekimi-uzmansiz': 9999, // kılavuz: uzmanlık branşı yoksa 9999
}

export const TEST_ORTAMI = {
  receteWs: 'https://sgkt.sgk.gov.tr/medula/eczane/saglikTesisiReceteIslemleriWS',
  kullanici: '99999999990', sifre: '99999999990', tesisKodu: 11068891, doktorTc: 99999999990, hastaTc: 99999999990,
} as const
export const GERCEK_ORTAM = {
  receteWs: 'https://medeczane.sgk.gov.tr/medula/eczane/saglikTesisiReceteIslemleriWS',
} as const
export const SOAP_NS = 'http://servisler.ws.eczane.gss.sgk.gov.tr'
