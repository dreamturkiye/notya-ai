/**
 * NOTYA-ULKE-SABLON-01 — THE KEYS of the signed-in application's text. Types only: this file holds NO text of any
 * country. Every country's catalogue (countries/<code>/uygulama/metinler.ts, randevuMetinleri.ts) is typed against
 * these, once per language form, so a missing or misspelled key in any pack is a type error and fails that country's
 * build. Where a key depends on the country's own languages or scripts it is a record keyed by their codes; the pack
 * check (lib/ulke/paketDenetimi.ts) requires an entry for each of them.
 *
 * 144 fixed entries + per-language entries in `UygulamaMetni`; 112 fixed + per-language in `RandevuMetni`.
 * Placeholders inside a sentence are written %, %1, %2, %3 and are named where the catalogue is written.
 */

/** First-login questions, settings, home, patients, visit, note, assistant line, role question. */
export type UygulamaMetni = {
  readonly kabuk: {
    readonly bugun: string
    readonly hastalar: string
    readonly ayarlar: string
    readonly cikis: string
    readonly menu: string
    readonly yukleniyor: string
    readonly hata: string
    readonly baglanti: string
    readonly geri: string
  }
  /** The name of each language of the country (key: the language's code in the pack's `dilGruplari`, e.g. 'uz', 'en'). */
  readonly diller: Readonly<Record<string, string>>
  /** The name of each script, where a language of the country has more than one (key: the script code, e.g. 'Latn'). Empty otherwise. */
  readonly yazilar: Readonly<Record<string, string>>
  readonly baslangic: {
    readonly baslik: string
    readonly aciklama: string
    readonly dil: string
    readonly yazi: string
    readonly devam: string
    readonly kaydediliyor: string
    readonly kaydedilemedi: string
  }
  readonly ayarlar: {
    /** Time zone of the account. REQUIRED where the pack lists more than one zone; not read otherwise. */
    readonly saatDilimi?: string
    readonly saatDilimiIzoh?: string
    readonly baslik: string
    readonly dilBolumu: string
    readonly arayuzDili: string
    readonly notDili: string
    readonly yazi: string
    readonly yaziIzoh: string
    readonly kaydet: string
    readonly kaydediliyor: string
    readonly kaydedildi: string
    readonly kaydedilemedi: string
  }
  readonly arama: {
    readonly etiket: string
    readonly ornek: string
    readonly dugme: string
    readonly sonucYok: string
  }
  readonly durum: {
    readonly taslak: string
    readonly onayli: string
  }
  readonly bugun: {
    readonly selam: string
    readonly baslik: string
    readonly bos: string
    readonly yeniHasta: string
    readonly muayeneBaslat: string
    readonly hastasiz: string
    readonly tumHastalar: string
  }
  readonly hastalar: {
    readonly baslik: string
    readonly bos: string
    readonly dosya: string
  }
  readonly yeniHasta: {
    readonly baslik: string
    readonly ad: string
    /** Label of the second name field (patronymic, middle name). REQUIRED where the pack has `adAlanlari.ikinciAd`; not read otherwise. */
    readonly otaIsmi?: string
    readonly istegeBagli: string
    readonly dogumTarihi: string
    readonly cinsiyet: string
    readonly erkek: string
    readonly kadin: string
    readonly telefon: string
    readonly dil: string
    /** Label of the national identity number. REQUIRED where the pack has `ulusalKimlik`; not read otherwise. */
    readonly ulusalKimlik?: string
    readonly kaydet: string
    readonly kaydediliyor: string
    readonly iptal: string
    readonly adGerekli: string
    readonly dogumGecersiz: string
    readonly dilGerekli: string
    readonly kaydedilemedi: string
  }
  readonly hasta: {
    readonly baslik: string
    readonly yas: string
    readonly ay: string
    readonly bulunamadi: string
    readonly notlar: string
    readonly notYok: string
    readonly taslaklar: string
    readonly notsuzlar: string
    readonly notsuz: string
    readonly ac: string
  }
  readonly muayene: {
    readonly baslik: string
    readonly hasta: string
    readonly sablon: string
    readonly sablonGenel: string
    readonly sablonPediatri: string
    readonly riza: string
    readonly rizaGerekli: string
    readonly kayitBaslat: string
    readonly kayitDurdur: string
    readonly kaydediliyor: string
    readonly vazgec: string
    readonly mikrofonYok: string
    readonly yukleniyor: string
    readonly isleniyor: string
    readonly kisaKayit: string
    readonly sesOkunamadi: string
    readonly notYazilamadi: string
    readonly yenidenDene: string
    readonly limit: string
    readonly hazirDegil: string
    readonly taninanDil: string
    /** "the visit was in …": each language of the country, as it reads inside a sentence (key: the language's code). */
    readonly konusmaDili: Readonly<Record<string, string>>
    readonly dilKarma: string
    readonly dilBaska: string
    readonly ikinciGecis: string
    readonly dusukGuven: string
    readonly metinKaydedildi: string
    readonly bulunamadi: string
    readonly yeniHasta: string
    readonly notHazirla: string
    readonly notYaziliyor: string
    readonly notuAc: string
    readonly hastaSec: string
  }
  readonly not: {
    readonly baslik: string
    readonly uyari: string
    readonly s: string
    readonly o: string
    readonly a: string
    readonly p: string
    readonly notDili: string
    /** The button that rewrites the note in another language of the country (key: the TARGET language's code). Empty where the country has one language. */
    readonly cevir: Readonly<Record<string, string>>
    readonly cevriliyor: string
    readonly cevrilemedi: string
    readonly kaydet: string
    readonly kaydedildi: string
    readonly onayla: string
    readonly onaylaniyor: string
    readonly onaylandi: string
    readonly bosNot: string
    readonly transkript: string
    readonly dosyayaDon: string
    readonly bulunamadi: string
    readonly kaydedilemedi: string
    readonly onaylanamadi: string
    readonly zatenOnayli: string
    readonly ikinciTaslak: string
  }
  readonly asistan: {
    readonly etiket: string
    readonly notr: string
    readonly satir: string
    readonly qayd: string
    readonly qoralama: string
  }
  readonly rol: {
    readonly baslik: string
    readonly aciklama: string
    readonly etiket: string
    readonly sec: string
    readonly grupDoktor: string
    readonly grupKlinikHekim: string
    readonly grupKlinikMuttefik: string
    readonly devam: string
    readonly kaydediliyor: string
    readonly kaydedilemedi: string
    readonly gerekli: string
    readonly ayarBaslik: string
    readonly ayarIzoh: string
    readonly kaydet: string
    readonly kaydedildi: string
  }
}

/** Appointments: calendar, booking form, one appointment, reminder, working pattern, home list, patient file. */
export type RandevuMetni = {
  readonly kabuk: {
    readonly takvim: string
  }
  readonly gunKisa: {
    readonly "1": string
    readonly "2": string
    readonly "3": string
    readonly "4": string
    readonly "5": string
    readonly "6": string
    readonly "7": string
  }
  readonly gunUzun: {
    readonly "1": string
    readonly "2": string
    readonly "3": string
    readonly "4": string
    readonly "5": string
    readonly "6": string
    readonly "7": string
  }
  readonly durum: {
    readonly planlandi: string
    readonly geldi: string
    readonly tamamlandi: string
    readonly gelmedi: string
    readonly iptal: string
  }
  readonly takvim: {
    readonly baslik: string
    readonly gun: string
    readonly hafta: string
    readonly bugun: string
    readonly onceki: string
    readonly sonraki: string
    readonly yeni: string
    readonly duzen: string
    readonly bos: string
    readonly bosSaat: string
    readonly mola: string
    readonly isGunuDegil: string
    readonly mesaiDisi: string
    readonly gunuAc: string
  }
  readonly form: {
    readonly baslik: string
    readonly hasta: string
    readonly hastaSec: string
    readonly hastaDegistir: string
    readonly tarih: string
    readonly tarihOrnek: string
    readonly saat: string
    readonly sure: string
    readonly dakika: string
    readonly neden: string
    readonly nedenOrnek: string
    readonly kaydet: string
    readonly kaydediliyor: string
    readonly vazgec: string
    readonly dolu: string
    readonly mesaiDisi: string
    readonly yineDe: string
    readonly tarihGecersiz: string
    readonly saatGecersiz: string
    readonly sureGecersiz: string
    readonly kaydedilemedi: string
  }
  readonly randevu: {
    readonly baslik: string
    readonly durum: string
    readonly vakit: string
    readonly geldi: string
    readonly tamamla: string
    readonly gelmedi: string
    readonly iptalEt: string
    readonly planaAl: string
    readonly geldiyeAl: string
    readonly muayeneyiAc: string
    readonly tasi: string
    readonly tasiKaydet: string
    readonly tasiYineDe: string
    readonly tasindi: string
    readonly tasiMesaiDisi: string
    readonly bulunamadi: string
    readonly gecisYok: string
    readonly mesaiDisiIsareti: string
    readonly degistirilemedi: string
    readonly yenidenYaz: string
    readonly takvimeDon: string
    readonly dosya: string
  }
  readonly hatirlatma: {
    readonly baslik: string
    readonly kopyala: string
    readonly kopyalandi: string
    readonly kopyalanamadi: string
    readonly izoh: string
    readonly dil: string
    /** The language a reminder is written in, by name (key: the language's code). */
    readonly dilAdi: Readonly<Record<string, string>>
    readonly metin: string
    readonly metinAdsiz: string
  }
  readonly duzen: {
    readonly baslik: string
    readonly aciklama: string
    readonly gunler: string
    readonly baslangic: string
    readonly bitis: string
    readonly sure: string
    readonly molalar: string
    readonly molaBas: string
    readonly molaBit: string
    readonly molaEkle: string
    readonly molaSil: string
    readonly kaydet: string
    readonly kaydediliyor: string
    readonly kaydedildi: string
    readonly kaydedilemedi: string
    readonly gunGerekli: string
    readonly saatGecersiz: string
    readonly sureGecersiz: string
    readonly molaGecersiz: string
    readonly saatDilimi: string
    readonly tatilNotu: string
    readonly varsayilan: string
  }
  readonly bugun: {
    readonly randevular: string
    readonly randevuYok: string
    readonly takvimiAc: string
  }
  readonly hasta: {
    readonly randevular: string
    readonly randevuAl: string
  }
}

/**
 * NOTYA-ULKE-PORTAL-01 — the PATIENT PORTAL's catalogue (feature `hastaPortali`), once per language form.
 *
 *   erisim, ozet, istek   the DOCTOR's controls: access on the patient's file, the summary on an approved note, the
 *                         patients' appointment requests on the calendar. Read in the account's form.
 *   giris, sayfa          what the PATIENT reads: the PIN page and their own page. Read in the patient's form.
 *                         PATIENT-FACING: a native reader reads these first.
 *
 * Placeholders: '%' where a sentence carries one value, '%1' '%2' where it carries two (see each key).
 */
export type PortalMetni = {
  readonly erisim: {
    readonly baslik: string
    readonly aciklama: string
    readonly durumYok: string
    /** % the day the link stops working */
    readonly durumAcik: string
    readonly durumKilitli: string
    readonly durumBitti: string
    /** % the day and time of the patient's last sign-in */
    readonly sonGiris: string
    readonly sonGirisYok: string
    readonly ver: string
    readonly yenile: string
    readonly yenileUyari: string
    readonly iptal: string
    readonly iptalEdildi: string
    readonly bekliyor: string
    readonly yapilamadi: string
    readonly birKez: string
    readonly baglanti: string
    readonly pin: string
    readonly kopyala: string
    readonly kopyalandi: string
    readonly kopyalanamadi: string
    readonly nasil: string
    readonly kayitlar: string
    readonly kayitYok: string
    /** What the record calls each event (keys: the events of lib/ulke/portal/erisim.ts → PortalOlayi). */
    readonly olay: {
      readonly erisim: string
      readonly iptal: string
      readonly giris: string
      readonly kilit: string
      readonly paylasim: string
      readonly geriAlma: string
    }
  }
  readonly ozet: {
    readonly baslik: string
    readonly aciklama: string
    /** % the language the summary is written in, by name */
    readonly dil: string
    readonly yaz: string
    readonly yenidenYaz: string
    readonly yaziliyor: string
    readonly yazilamadi: string
    readonly makine: string
    readonly etiket: string
    readonly kaydet: string
    readonly kaydedildi: string
    readonly kaydedilemedi: string
    readonly bos: string
    readonly paylas: string
    /** % the day it was shared */
    readonly paylasildi: string
    readonly paylasilmadi: string
    readonly geriAl: string
    readonly geriAlindi: string
    readonly degistirmekIcin: string
    readonly yapilamadi: string
    readonly erisimIpucu: string
  }
  readonly istek: {
    readonly baslik: string
    readonly gunler: string
    readonly neden: string
    readonly sec: string
    readonly reddet: string
    readonly reddedildi: string
    readonly formBaslik: string
    readonly kabul: string
    readonly cevaplandi: string
    readonly yapilamadi: string
    /** % the day the patient sent the request */
    readonly istekTarihi: string
  }
  readonly giris: {
    readonly baslik: string
    readonly aciklama: string
    readonly pin: string
    readonly gonder: string
    readonly gonderiliyor: string
    readonly pinBicimi: string
    /** % tries left */
    readonly pinYanlis: string
    readonly kilitli: string
    readonly yavas: string
    readonly gecersiz: string
    readonly hata: string
    readonly baglanti: string
    readonly gizlilik: string
    readonly yukleniyor: string
  }
  readonly sayfa: {
    /** % the patient's name */
    readonly selam: string
    readonly hekim: string
    readonly cikis: string
    readonly oturumBitti: string
    readonly randevular: string
    readonly randevuYok: string
    /** % the name of the doctor's time zone. Required where the country has more than one zone; never shown elsewhere. */
    readonly saatDilimi?: string
    readonly ozetler: string
    readonly ozetYok: string
    /** % the day of the visit */
    readonly muayene: string
    readonly istekBaslik: string
    /** % the most days a request may name */
    readonly istekAciklama: string
    readonly istekNeden: string
    readonly istekGonder: string
    readonly istekGonderiliyor: string
    readonly istekGunGerekli: string
    /** % the most days a request may name */
    readonly istekCokGun: string
    readonly istekGonderilemedi: string
    readonly istekBekliyor: string
    /** % the days the patient asked for */
    readonly istekGunler: string
    /** %1 the day, %2 the time of the appointment the doctor booked */
    readonly istekKabul: string
    readonly istekRed: string
    /** "This page is not for emergencies." Always shown. Names no number. */
    readonly acil: string
    /** % the pack's ambulance number (`uygulama.portal.acilNumara`). Shown only where the pack states one; the sentence itself holds no number. */
    readonly acilNumara: string
    readonly yalniz: string
  }
}
