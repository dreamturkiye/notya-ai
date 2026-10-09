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

/**
 * NOTYA-ULKE-INTAKE-01 — the INTAKE FORM's catalogue (feature `hastaFormu`), once per language form. THE SCREENS' OWN
 * WORDS ONLY: the questions are clinical content and live in the pack's clinical half (lib/ulke/intake/tipler.ts).
 *
 *   hekim   the DOCTOR's controls: asking for the form, the invitation, the answers. Read in the account's form.
 *   davet   the INVITATION the doctor copies and sends: read by the PATIENT, written in the patient's form.
 *   hasta   the form as the PATIENT sees it on their own page. Read in the patient's form.
 *           davet and hasta are PATIENT-FACING: a native reader reads these first.
 *   birim   the name of each unit of measure the pack uses (key: the unit's code — cm, in, kg, lb, C, F).
 *
 * Placeholders: '%' where a sentence carries one value, '%1' '%2' where it carries two (see each key).
 */
export type FormMetni = {
  readonly hekim: {
    readonly baslik: string
    readonly aciklama: string
    readonly durumYok: string
    /** % the day the form was asked for */
    readonly durumBekliyor: string
    /** % the day the patient last saved */
    readonly durumTaslak: string
    /** % the day the patient submitted */
    readonly durumGonderildi: string
    readonly iste: string
    readonly bekliyor: string
    readonly yapilamadi: string
    readonly istendi: string
    readonly acikVar: string
    readonly davetBaslik: string
    readonly davetDil: string
    readonly davetIzoh: string
    /** The patient already has a link: it cannot be shown again, and the text refers to it. */
    readonly baglantiVar: string
    readonly yeniBaglanti: string
    /** What a new link does to the old one — shown BEFORE the doctor confirms. */
    readonly yeniBaglantiUyari: string
    readonly yeniBaglantiOnay: string
    readonly vazgec: string
    readonly cevaplar: string
    /** "Said by the patient. Not verified." */
    readonly beyan: string
    /** The same, for a form a parent or guardian filled in. */
    readonly veliBeyani: string
    /** The answers are not used when the note is written. */
    readonly notaGirmez: string
    /** The pack's questions changed after this form was asked for. */
    readonly surumFarkli: string
    readonly yenidenAc: string
    readonly yenidenAcUyari: string
    readonly yenidenAcildi: string
    readonly geriCek: string
    readonly geriCekildi: string
    readonly oncekiler: string
  }
  readonly davet: {
    /** %1 the doctor's name, %2 the address of the patient's page */
    readonly metin: string
    /** % the address of the patient's page */
    readonly metinAdsiz: string
    /** % the doctor's name. For a patient who already has the link: names no address. */
    readonly baglantisiz: string
    readonly baglantisizAdsiz: string
  }
  readonly hasta: {
    readonly bekliyorBaslik: string
    readonly bekliyorAciklama: string
    /** The same, for a parent or guardian. */
    readonly veliAciklama: string
    readonly baslat: string
    readonly devam: string
    readonly yenidenAcildi: string
    readonly rizaBaslik: string
    readonly rizaKabul: string
    readonly rizaGerekli: string
    readonly zorunlu: string
    readonly evet: string
    readonly hayir: string
    readonly kaydediliyor: string
    readonly kaydedildi: string
    readonly kaydedilemedi: string
    readonly ileri: string
    readonly geri: string
    /** %1 the number of this part, %2 how many parts there are */
    readonly bolum: string
    readonly gonder: string
    readonly gonderiliyor: string
    readonly gonderilemedi: string
    readonly gonderUyari: string
    readonly eksik: string
    /** %1 the smallest, %2 the largest number the question accepts */
    readonly sayiGecersiz: string
    readonly gonderildiBaslik: string
    /** % the day the form was submitted */
    readonly gonderildi: string
    readonly cevaplarim: string
    readonly degistirilemez: string
    readonly kapat: string
  }
  /** Key: a unit code of the pack's `uygulama.birimler`. */
  readonly birim: Readonly<Record<string, string>>
}

/**
 * NOTYA-ULKE-ARACLAR-01 — THE TOOLS AREA's own words (feature `araclar`): the grid, the search, and what every tool
 * screen shares. The words of each TOOL (its title, its fields, its bands) are not here: they sit with the tool in
 * the pack's list (lib/ulke/araclar/tipler.ts → AracMetni), in every form at once.
 */
export type AraclarMetni = {
  readonly kabuk: {
    /** The link in the application's navigation. */
    readonly araclar: string
  }
  readonly izgara: {
    readonly baslik: string
    readonly aciklama: string
    readonly ara: string
    readonly araOrnek: string
    /** Heading of the tools every role has. */
    readonly temel: string
    /** Heading of the tools of the account's own role. % the role's name */
    readonly rol: string
    /** No tool is switched on for this account. */
    readonly bos: string
    readonly sonucYok: string
    /** On the home screen: the link that opens the tools. */
    readonly ac: string
  }
  readonly arac: {
    /** Back to the grid. */
    readonly geri: string
    readonly girdiler: string
    readonly sonuc: string
    /** Shown instead of a result while something required is missing or out of range. */
    readonly eksik: string
    /** The label of an item of a published questionnaire the pack does not word. % the item's number */
    readonly madde: string
    /** Under a number field. %1 the smallest, %2 the largest value it accepts */
    readonly aralik: string
    /** "n of m" for a count. %1 the count, %2 the maximum */
    readonly oran: string
    readonly kopyala: string
    readonly kopyalandi: string
    readonly kopyalanamadi: string
    readonly temizle: string
    /** % the published source of the arithmetic */
    readonly kaynak: string
    /** Nothing is stored: what is entered here is gone when the page is left. */
    readonly saklanmaz: string
    /** The address names a tool this account does not have. */
    readonly yok: string
  }
  /** The patient portal's tile: how access is given, said in one or two sentences above the patient search. */
  readonly portal: {
    readonly nasil: string
  }
  /** Keeping a tool's result on a patient (migration 139). A tool keeps nothing unless the doctor presses "keep". */
  readonly kayit: {
    /** Above the tools when they were opened from a patient's file. % the patient's name */
    readonly hastaIcin: string
    /** The address names a patient this account does not have. */
    readonly hastaBulunamadi: string
    /** On a tool opened without a patient: how a result is kept. */
    readonly hastasiz: string
    /** Heading of the part of a tool's screen that keeps the result. */
    readonly baslik: string
    /** What is kept, where, and that nothing is sent to anybody. */
    readonly aciklama: string
    /** The follow-up day. The doctor enters it; the application proposes none. */
    readonly takipTarihi: string
    readonly takipIpucu: string
    readonly kaydet: string
    readonly kaydedildi: string
    readonly dosyayaGit: string
    /** The tool has no result yet. */
    readonly eksik: string
    /** The follow-up day is not a day from today on. */
    readonly takipGecersiz: string
    readonly yapilamadi: string
    /** The card on the patient's file. */
    readonly dosyaBaslik: string
    readonly dosyaAciklama: string
    readonly dosyaBos: string
    readonly araclariAc: string
    /** % the day */
    readonly takipGunu: string
    /** % the day */
    readonly takipKapandi: string
    /** A kept result whose stored value cannot be read. */
    readonly okunamadi: string
    /** A kept result of a tool the application no longer has. */
    readonly aracYok: string
  }
  /** The follow-up list (the tile `takip-paneli`). */
  readonly takip: {
    readonly aciklama: string
    readonly bos: string
    readonly gecikti: string
    readonly bugun: string
    readonly kapat: string
    readonly kapatildi: string
    readonly yapilamadi: string
    readonly okunamadi: string
  }
}

/**
 * NOTYA-ULKE-MESAJ-01 — MESSAGES BETWEEN A DOCTOR AND A PATIENT (feature `hastaMesajlari`), once per language form.
 *
 *   hekim   the DOCTOR's card on the patient's file and the list of unread messages on the home screen. Read in the
 *           account's form.
 *   hasta   what the PATIENT reads on their own page. Read in the patient's form.
 *           PATIENT-FACING: a native reader reads these first.
 *
 * `hasta.acil` and `hasta.acilNumara` are the notice that messages are NOT FOR EMERGENCIES. It is shown ALWAYS, also
 * when no conversation is open. The number is the pack's setting (`uygulama.portal.acilNumara`), never text: a
 * sentence with a digit in it fails the pack check.
 *
 * Placeholders: '%' where a sentence carries one value (see each key).
 */
export type MesajMetni = {
  readonly hekim: {
    readonly baslik: string
    /** What this is: the patient reads and answers on their own page, after signing in with their link and PIN. */
    readonly aciklama: string
    /** Nothing tells the patient that a message is waiting: the doctor does. (The outbound channel is a slot of the pack.) */
    readonly bildirimYok: string
    /** The patient has no link that works: they cannot read a message until the doctor gives access. */
    readonly erisimYok: string
    readonly bos: string
    readonly yaz: string
    readonly gonder: string
    readonly gonderiliyor: string
    readonly gonderilemedi: string
    readonly bosMesaj: string
    /** % the most characters a message holds */
    readonly cokUzun: string
    /** Too many messages in one day. */
    readonly limit: string
    /** Who wrote a message: the doctor ("you"), the patient. */
    readonly siz: string
    readonly hasta: string
    /** Under a message of the doctor's: the patient has read it / has not yet. */
    readonly okundu: string
    readonly okunmadi: string
    /** On a message of the patient's the doctor has not read yet. */
    readonly yeni: string
    readonly acik: string
    /** % the day the conversation was closed */
    readonly kapali: string
    readonly kapat: string
    /** What closing does — shown BEFORE the doctor confirms. */
    readonly kapatUyari: string
    readonly kapatOnay: string
    readonly vazgec: string
    readonly kapatildi: string
    readonly yapilamadi: string
    readonly yuklenemedi: string
    /** On the home screen: the heading of the patients whose messages are unread. */
    readonly okunmamisBaslik: string
    /** % how many messages of that patient are unread */
    readonly okunmamisAdet: string
  }
  readonly hasta: {
    readonly baslik: string
    readonly aciklama: string
    /** "Messages are not for emergencies." ALWAYS shown. Names no number. */
    readonly acil: string
    /** % the pack's ambulance number. Shown only where the pack states one; the sentence itself holds no number. */
    readonly acilNumara: string
    /** No answer time is promised. */
    readonly yanitSuresi: string
    /** A patient cannot start a conversation: said plainly wherever none is open. */
    readonly baslatamaz: string
    /** The doctor has not written yet. */
    readonly yok: string
    /** The doctor closed the conversation: it can be read, not written in. */
    readonly kapali: string
    /** % the day a conversation was closed */
    readonly kapandi: string
    readonly yaz: string
    readonly gonder: string
    readonly gonderiliyor: string
    readonly gonderilemedi: string
    readonly bosMesaj: string
    /** % the most characters a message holds */
    readonly cokUzun: string
    readonly limit: string
    /** Who wrote a message: the doctor, the patient ("you"). */
    readonly hekim: string
    readonly siz: string
    /** On a message of the doctor's the patient has not read yet. */
    readonly yeni: string
    /** % how many messages are unread */
    readonly okunmamis: string
    readonly yuklenemedi: string
  }
}

/**
 * NOTYA-ULKE-MESAJ-01 — "MY TEMPLATES" (feature `hekimSablonlari`), once per language form: the screen where a doctor
 * keeps their own reusable text blocks, and the small picker that puts one into a section of a note or into a
 * message. The tile's own name and description sit with the tool in the pack's list, like every other tile.
 *
 * Placeholders: '%' where a sentence carries one value (see each key).
 */
export type SablonMetni = {
  /** A template is used for many patients: no patient's name or data belongs in one. Always shown on the screen. */
  readonly uyari: string
  readonly bos: string
  readonly yeni: string
  readonly duzenleBaslik: string
  readonly ad: string
  readonly metin: string
  /** Where the template is offered. */
  readonly kapsamEtiketi: string
  readonly kapsam: { readonly not: string; readonly mesaj: string; readonly hepsi: string }
  readonly kaydet: string
  readonly kaydediliyor: string
  readonly kaydedildi: string
  readonly kaydedilemedi: string
  readonly adGerekli: string
  readonly metinGerekli: string
  /** % the most characters a template's text holds */
  readonly cokUzun: string
  /** % the most templates an account keeps */
  readonly cokFazla: string
  readonly duzenle: string
  readonly sil: string
  /** What deleting does — shown BEFORE the doctor confirms. */
  readonly silUyari: string
  readonly silOnay: string
  readonly vazgec: string
  readonly silindi: string
  readonly yuklenemedi: string
  /** The picker under a section of a note and under a message: its name, what it does, and what it says with no template. */
  readonly seciciEkle: string
  /** The text is added at the end of what is already written; nothing is replaced. */
  readonly seciciNot: string
  readonly seciciBos: string
  /** The link from the picker to the screen where templates are kept. */
  readonly yonet: string
}
