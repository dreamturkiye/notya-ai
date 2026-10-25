/**
 * AU-BETA-01 (2026-10-22) — OPTIONAL PACK EXTENSIONS. A pack may bring any of these; a pack that brings none gets
 * none of the screens. The kit owns the mechanism (practice identity, consent record, access/correction requests,
 * invoices, reference lookups); the pack owns every word and every country rule (identifier formats, the notice, the
 * tax rate). Nothing here names a country. Client-safe: types only.
 *
 * LABEL on every text a pack brings through here: an INITIAL DRAFT. No lawyer and no clinician has reviewed it.
 */

// ───────────────────────── practice identity (doctor / clinic particulars) ─────────────────────────

export type MuayenehaneAlani = {
  anahtar: string
  etiket: string
  ipucu?: string
  azami: number
  /** A closed list (a state, a territory…). Empty value is always allowed. */
  secenekler?: readonly { deger: string; etiket: string }[]
}
export type MuayenehaneSonucu = {
  /** The values to keep: trimmed and normalised, empty fields left out. */
  temiz: Record<string, string>
  /** field key → sentence. A field with an error is not kept and the request answers 400. */
  hatalar: Record<string, string>
  /** field key → sentence. Does not block saving. */
  uyarilar: Record<string, string>
}
export type MuayenehaneTanimi = {
  baslik: string
  aciklama: string
  alanlar: readonly MuayenehaneAlani[]
  kaydet: string
  kaydediliyor: string
  kaydedildi: string
  kaydedilemedi: string
  /**
   * The pack keeps its professional registration number HERE, as the one store invoices read. The older free-text
   * account field (user_metadata.meslekKaydi) is then retired: a stored value moves into `alan` only when `bicim`
   * accepts it, otherwise it is dropped. Never invented. Packs without this keep the account field as it is.
   */
  meslekKaydiTasi?: { alan: string; bicim: (ham: string) => string | null }
  /** Pure. Empty optional fields are valid. Never throws. */
  dogrula: (girdi: Record<string, unknown>) => MuayenehaneSonucu
}

// ───────────────────────── privacy: collection notice, consent record, access/correction ─────────────────────────

export type GizlilikBolumu = { baslik: string; paragraflar: readonly string[] }
export type GizlilikMetni = {
  /** The version stamped on every consent record. Change it with any change of the words below. */
  surum: string
  /** "Initial compliance draft – external legal review later." — shown beside every text of this group. */
  taslakEtiketi: string
  bildirim: { baslik: string; giris: string; bolumler: readonly GizlilikBolumu[] }
  riza: {
    baslik: string
    /** What the patient agrees to, in full. */
    metin: string
    /** The checkbox label. An explicit action: never pre-ticked. */
    kutu: string
    gonder: string
    gerekli: string
    kaydedildi: string
    /** Contains %1 (date) and %2 (version): lib/ulke/arayuz/yerTutucu.ts. */
    kayitSatiri: string
    geriCek: string
    geriCekildi: string
    gonderiliyor: string
    hata: string
  }
  talep: {
    baslik: string
    aciklama: string
    erisim: string
    duzeltme: string
    ayrinti: string
    ayrintiIpucu: string
    gonder: string
    gonderiliyor: string
    gonderildi: string
    /** Contains % (date). */
    sonTarih: string
    hata: string
    bekleyenVar: string
    durumlar: Readonly<Record<'yeni' | 'islemde' | 'tamamlandi' | 'reddedildi', string>>
    /** AU-LAUNCH-01: label above the practitioner's response, shown to the patient once the request is answered or declined. */
    yanitBaslik: string
  }
  doktor: {
    baslik: string
    aciklama: string
    bos: string
    /** Contains % (days). */
    kalanGun: string
    /** Contains % (days). */
    gecikmisGun: string
    islemde: string
    tamamla: string
    reddet: string
    yanit: string
    yanitIpucu: string
    /** AU-LAUNCH-01: the button that downloads the patient's data as one JSON file (APP 12). */
    disaAktar: string
    disaAktarIpucu: string
    kaydet: string
    rizaBaslik: string
    rizaBos: string
    rizaGeri: string
    hasta: string
    tur: string
    alinan: string
    sonTarih: string
    kayitHatasi: string
  }
}

// ───────────────────────── invoices ─────────────────────────

export type FaturaMetni = {
  baslik: string
  aciklama: string
  yeni: string
  hasta: string
  hastaSec: string
  kalemAciklama: string
  kalemAciklamaIpucu: string
  kalemNo: string
  kalemNoIpucu: string
  kalemTutar: string
  kalemEkle: string
  kalemSil: string
  vergiMuaf: string
  vergiMuafIpucu: string
  vergiNotu: string
  altToplam: string
  toplam: string
  olustur: string
  olusturuluyor: string
  bos: string
  durumlar: Readonly<Record<'taslak' | 'odendi' | 'iptal', string>>
  ode: string
  odendi: string
  /** Said at the top of the screen: demo adapter, no real charge, not the merchant, no funds held. */
  demoNotu: string
  testNotu: string
  saticiEksik: string
  saticiKimlik: string
  hata: string
  baglantiBaslik: string
  baglantiAciklama: string
  /** Contains %1 (provider) and %2 (last four characters of the key). */
  baglantiVar: string
  baglantiSil: string
  baglantiSaglayici: string
  baglantiAnahtar: string
  baglantiKaydet: string
  /** The full-access secret key (`sk_…`) was pasted: refused, a restricted key is required. */
  sirAnahtar: string
  /** Badge next to a TEST connection. */
  modEtiketTest: string
  /** Badge next to a LIVE connection (real money). */
  modEtiketCanli: string
  /** Live flow: why the webhook secret is required and what to do first. */
  webhookGerekli: string
  /** Live confirmation step (shown before the first live connection is sent). */
  canliOnayBaslik: string
  canliOnayMetin: string
  canliOnayKutu: string
  canliOnayDugme: string
  canliOnayVazgec: string
  /** The connection was saved in live mode. */
  canliKaydedildi: string
  /** Shown when payments really run on the doctor's own connected account. */
  canliNotu: string
  /** Tyro saved but not active (needs Tyro onboarding). */
  tyroBekliyor: string
  izinler: string
  webhookEtiket: string
  webhookUrlEtiket: string
  webhookYok: string
  tyroIstemci: string
  tyroGizli: string
  tyroKonum: string
  anahtarReddedildi: string
  izinYok: string
  odemeYonlendiriliyor: string
  onayBekliyor: string
  uzlasmaDemoEtiketi: string
  uzlasmaGercekNotu: string
  uzlasmaAralik: string
  aralik7: string
  aralik30: string
  aralik90: string
  iadeTam: string
  iadeKismi: string
  iadeTutar: string
  uzlasmaBaslik: string
  uzlasmaNotu: string
  uzlasmaCalistir: string
  csv: string
  uzlasmaSonuclari: Readonly<Record<'eslesti' | 'uyusmadi' | 'saglayicida_yok' | 'odenmedi' | 'notya_yok' | 'iade_edildi', string>>
}
export type FaturaTanimi = {
  /** "GST" */
  vergiAdi: string
  /** Rate in whole per cent. A rule of the country, not a default of the kit. */
  oranYuzde: number
  /** true = a new line starts with the tax-free box ticked. Advice is not given; the doctor decides per line. */
  varsayilanMuaf: boolean
  paraKodu: string
  /** The key of the practice-identity field that holds the seller's tax identifier (printed on the invoice). Omitted = the pack has no practice-identity form (the seller line is not shown). */
  saticiKimlikAlani?: string
  /** The key of the field printed as the seller's name. */
  saticiAdAlani?: string
  /** Payment providers this country's build offers. Omitted = Stripe only. Tyro is Australian: only the AU pack lists it. */
  saglayicilar?: readonly ('stripe' | 'tyro')[]
  metin: FaturaMetni
}

// ───────────────────────── reference lookups and links ─────────────────────────

export type ReferansAramasi = {
  anahtar: string
  etiket: string
  yerTutucu: string
  /** The address with {q} where the URL-encoded term goes. The address is the official site's own search. */
  adresSablonu: string
  dugme: string
  /** "Check PBS schedule" style note shown beside the box. */
  not: string
  /** Where and when the address pattern was read. */
  kaynak: string
}
export type ReferansBaglantisi = { etiket: string; adres: string; aciklama: string; kaynak: string }
export type ReferansBolumu = { baslik: string; aciklama: string; taslakEtiketi: string; baglantilar: readonly ReferansBaglantisi[] }

/** A connection that is NOT made in this build. The interface is what a later integration will implement. */
export type BaglantiDurumu = { bagli: false; neden: string }
export type UlkeKayitSistemiBaglantisi = {
  /** "My Health Record" */
  ad: string
  durum: BaglantiDurumu
  baslik: string
  aciklama: string
  baglanmadi: string
  kaynak: string
}

export type UzantiBelgesi = { baslik: string; inceleme: string; bolumler: readonly { baslik: string; paragraflar: readonly string[] }[] }

// ───────────────────────── diagnosis-code lookup (open data, server-side) ─────────────────────────

/** Every word of the diagnosis-code screen. The pack writes them; the kit draws them. */
export type TaniKodlariMetni = {
  baslik: string
  aciklama: string
  /** Kicker above the title ("Tools"). */
  arac: string
  araEtiketi: string
  araOrnek: string
  ara: string
  araniyor: string
  /** "{n}" is the number of results. */
  sonucSayisi: string
  sonucYok: string
  /** Shown instead of results while no code data is loaded on the server. */
  veriYok: string
  /** The exact source label printed on the screen. */
  kaynakEtiketi: string
  /** Label of a WHO code with no mapped national code. */
  esleme_yok: string
  whoKodu: string
  esleme_etiketi: string
  /** "{surum}" is the ICD-10-AM edition the mapping row comes from. */
  surum: string
  hata: string
}

export type TaniKodlariTanimi = {
  metin: TaniKodlariMetni
  /** Which provider answers: 'acik' = open WHO list + open mapping files; 'lisansli' = the licensed code lists (not built yet). */
  saglayici: 'acik' | 'lisansli'
}

/** Every word of the procedure-code (MBS item -> ACHI) screen. The pack writes them; the kit draws them. */
export type IslemKodlariMetni = {
  baslik: string
  aciklama: string
  arac: string
  araEtiketi: string
  araOrnek: string
  ara: string
  araniyor: string
  /** "{n}" is the number of results. */
  sonucSayisi: string
  sonucYok: string
  veriYok: string
  kaynakEtiketi: string
  mbsEtiketi: string
  achiEtiketi: string
  /** Label of an MBS item with no ACHI code in the table. */
  esleme_yok: string
  /** "{surum}" is the ACHI edition of the mapping row. */
  surum: string
  hata: string
}

export type IslemKodlariTanimi = { metin: IslemKodlariMetni }

export type UlkeUzantisi = {
  /** Extra policy pages, by route slug (served at /<slug>, listed by the pack's route list). Not part of the shared policy-document set. */
  belgeler?: Readonly<Record<string, UzantiBelgesi>>
  /** The non-blocking note shown on clinical and consent screens. */
  ekNot?: string
  muayenehane?: MuayenehaneTanimi
  gizlilik?: GizlilikMetni
  fatura?: FaturaTanimi
  referansAramalari?: readonly ReferansAramasi[]
  referansBolumleri?: readonly ReferansBolumu[]
  kayitSistemi?: UlkeKayitSistemiBaglantisi
  /** Diagnosis-code lookup screen + API. Absent = the country has none. */
  taniKodlari?: TaniKodlariTanimi
  /** Procedure-code lookup (MBS item -> ACHI code). Absent = the country has none. */
  islemKodlari?: IslemKodlariTanimi
}
