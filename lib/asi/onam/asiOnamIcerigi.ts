/**
 * NOTYA-ASI-ONAM-01 — static, vetted per-vaccine informed-consent reference dataset.
 *
 * IMPORTANT ARCHITECTURE DECISION (per the brief): this content is STRUCTURED DATA, never an LLM
 * call. A legal informed-consent document must not depend on model output at the point of use —
 * see .cursor/skills/ai-model-politikasi/SKILL.md (which this file deliberately does not import
 * anything from: no aiCagir, no model name, nothing). Every entry here is standard, well-established
 * information for a vaccine on Türkiye's childhood immunization schedule (T.C. Sağlık Bakanlığı
 * Ulusal Aşı Takvimi — lib/asi/ulusalAsiTakvimi.ts, which this file's `ad` values match exactly so
 * a muayene's selected vaccines resolve by name) plus the özel (non-schedule) vaccines pediatri
 * practice commonly offers.
 *
 * Content bar: name, what it protects against, COMMON side effects (not exhaustive — this is a
 * clinic consent aid, not a package insert/kullanma talimatı; the doctor's own verbal
 * explanation and the manufacturer's leaflet remain the clinical source of truth), and a standard
 * "Okudum, kabul ediyorum" statement. Sources noted per entry: WHO position papers, T.C. Sağlık
 * Bakanlığı Genişletilmiş Bağışıklama Programı materials, and the standard content of Turkish
 * aşı bilgilendirme/onam forms in clinical use. specialistReview (lib/specialties/pediatri.ts)
 * flags this dataset for Dr. Gökhan's sign-off before go-live — exact wording should be checked
 * against the current manufacturer kullanma talimatı for each product actually stocked.
 *
 * "Structured so new vaccines can be added as data, not code changes" — ADD_ASI_ONAM_ICERIGI is
 * the single array below; nothing elsewhere in the app branches on vaccine name.
 */
import type { Ceviri } from './dil'

export interface AsiOnamIcerigi {
  /** Must match a `TakvimAsisi.ad` (lib/asi/ulusalAsiTakvimi.ts) or OZEL_ASILAR `ad`, or a doctor's own free-text vaccine name entered on the aşı kartı. */
  ad: string
  /** What this vaccine protects against — one short sentence. */
  korur: Ceviri
  /** Common side effects, each a short phrase (not exhaustive). */
  yanEtkiler: Ceviri[]
  /** Standard consent sentence shown with the checkbox/button ("Okudum, kabul ediyorum"). */
  onamCumlesi: Ceviri
  kaynak: string
}

/**
 * KLİNİK ONAY BAYRAĞI (tek nokta) — bu veri setinin Dr. Gökhan Mamur tarafından klinik olarak
 * onaylanıp onaylanmadığı. VARSAYILAN: ONAYSIZ. Yapay zekâ bu bayrağı asla kendisi çevirmez;
 * Dr. Gökhan docs/audits/ASI-ONAM-ICERIK-INCELEME.md formunu imzaladıktan sonra tek değişiklik
 * `onayli: true` + `onaylayan` + `tarih` (ISO, YYYY-MM-DD) + `surum` olmalıdır.
 * Not: bu bayrak şu an hiçbir erişim kapısını AÇMAZ ya da KAPATMAZ (mevcut branş kapısı
 * asiOnamBransKapisi.ts aynen geçerli); yalnızca onay durumunu tek yerde kayıt altına alır.
 */
export interface AsiOnamKlinikOnayi {
  onayli: boolean
  onaylayan: string | null
  tarih: string | null
  /** Onaylanan içeriğin sürüm etiketi (değiştiği zaman onay yeniden alınmalı). */
  surum: string | null
}

export const ASI_ONAM_KLINIK_ONAYI: AsiOnamKlinikOnayi = {
  onayli: false,
  onaylayan: null,
  tarih: null,
  surum: null,
}

export function asiOnamKlinikOnayliMi(): boolean {
  return ASI_ONAM_KLINIK_ONAYI.onayli === true && !!ASI_ONAM_KLINIK_ONAYI.onaylayan && !!ASI_ONAM_KLINIK_ONAYI.tarih
}

const TR = (tr: string): Ceviri => ({ tr })
const TRL = (...items: string[]): Ceviri[] => items.map((t) => ({ tr: t }))

const ONAM_CUMLESI_STANDART: Ceviri = TR(
  'Bu aşı(lar) hakkında yukarıdaki bilgileri okudum / bana okundu, sorularım yanıtlandı. Aşının yapılmasını kendi isteğimle (veya velisi/yasal temsilcisi olduğum çocuk için) kabul ediyorum. İstediğim zaman aşıyı reddetme hakkım olduğu anlatıldı.'
)

const KAYNAK_STANDART = 'T.C. Sağlık Bakanlığı Genişletilmiş Bağışıklama Programı + WHO aşı bilgilendirme materyalleri (standart içerik; ürün bazlı kullanma talimatı ile birlikte doktor onayından geçmelidir — bkz. pediatri.ts specialistReview).'

export const ASI_ONAM_ICERIGI: AsiOnamIcerigi[] = [
  {
    ad: 'Hepatit B',
    korur: TR('Hepatit B virüsünün yol açtığı karaciğer iltihabı ve bu virüsün uzun dönemde yol açabileceği kronik karaciğer hastalığından korur.'),
    yanEtkiler: TRL('Enjeksiyon yerinde hassasiyet, kızarıklık veya şişlik', 'Hafif ateş', 'Huzursuzluk / uyku hali'),
    onamCumlesi: ONAM_CUMLESI_STANDART,
    kaynak: KAYNAK_STANDART,
  },
  {
    ad: 'BCG (Verem)',
    korur: TR('Tüberküloz (verem) hastalığının ağır/yaygın (menenjit, miliyer) biçimlerinden korur.'),
    yanEtkiler: TRL('Uygulama yerinde kızarıklık, küçük şişlik ve zamanla iz (skar) bırakan bir yara', 'Nadiren bölgesel lenf bezi şişliği'),
    onamCumlesi: ONAM_CUMLESI_STANDART,
    kaynak: KAYNAK_STANDART,
  },
  {
    ad: "6'lı Karma (DaBT-İPA-Hib-HepB)",
    korur: TR('Difteri, boğmaca (pertussis), tetanoz, çocuk felci (polio), Haemophilus influenzae tip b (Hib) menenjiti/zatürresi ve Hepatit B\'den korur.'),
    yanEtkiler: TRL('Enjeksiyon yerinde kızarıklık, şişlik, hassasiyet', 'Ateş', 'Huzursuzluk, iştahsızlık, uyku hali'),
    onamCumlesi: ONAM_CUMLESI_STANDART,
    kaynak: KAYNAK_STANDART,
  },
  {
    ad: 'KPA (Konjuge Pnömokok)',
    korur: TR('Pnömokok bakterisinin yol açtığı zatürre, kan zehirlenmesi (sepsis) ve menenjitten korur.'),
    yanEtkiler: TRL('Enjeksiyon yerinde kızarıklık, şişlik, hassasiyet', 'Ateş', 'Huzursuzluk, iştahsızlık'),
    onamCumlesi: ONAM_CUMLESI_STANDART,
    kaynak: KAYNAK_STANDART,
  },
  {
    ad: 'OPA (Oral Polio)',
    korur: TR('Çocuk felci (polio) hastalığından korur.'),
    yanEtkiler: TRL('Genellikle yan etkisi görülmez', 'Nadiren hafif ishal'),
    onamCumlesi: ONAM_CUMLESI_STANDART,
    kaynak: KAYNAK_STANDART,
  },
  {
    ad: 'KKK (Kızamık-Kızamıkçık-Kabakulak)',
    korur: TR('Kızamık, kızamıkçık (rubella) ve kabakulaktan korur.'),
    yanEtkiler: TRL('Uygulamadan 1-2 hafta sonra hafif ateş ve döküntü olabilir', 'Enjeksiyon yerinde hassasiyet', 'Nadiren eklem ağrısı (özellikle büyük çocuk/erişkinde)'),
    onamCumlesi: ONAM_CUMLESI_STANDART,
    kaynak: KAYNAK_STANDART,
  },
  {
    ad: 'Suçiçeği (Varisella)',
    korur: TR('Suçiçeği (varisella) hastalığından ve bu hastalığın nadir ama ağır komplikasyonlarından korur.'),
    yanEtkiler: TRL('Enjeksiyon yerinde kızarıklık, şişlik', 'Hafif ateş', 'Nadiren uygulama yerinde hafif döküntü'),
    onamCumlesi: ONAM_CUMLESI_STANDART,
    kaynak: KAYNAK_STANDART,
  },
  {
    ad: 'Hepatit A',
    korur: TR('Hepatit A virüsünün yol açtığı karaciğer iltihabından korur.'),
    yanEtkiler: TRL('Enjeksiyon yerinde hassasiyet, kızarıklık', 'Hafif ateş', 'Baş ağrısı, iştahsızlık'),
    onamCumlesi: ONAM_CUMLESI_STANDART,
    kaynak: KAYNAK_STANDART,
  },
  {
    ad: "DaBT-İPA (4'lü Karma)",
    korur: TR('Difteri, boğmaca (pertussis), tetanoz ve çocuk felcinden (polio) korumayı pekiştirir (rapel).'),
    yanEtkiler: TRL('Enjeksiyon yerinde kızarıklık, şişlik, hassasiyet', 'Ateş', 'Huzursuzluk'),
    onamCumlesi: ONAM_CUMLESI_STANDART,
    kaynak: KAYNAK_STANDART,
  },
  {
    ad: 'Td (Tetanoz-Difteri, erişkin tip)',
    korur: TR('Tetanoz ve difteriden korumayı pekiştirir (rapel); erişkin tip, boğmaca bileşeni içermez.'),
    yanEtkiler: TRL('Enjeksiyon yerinde ağrı, kızarıklık, şişlik', 'Nadiren hafif ateş'),
    onamCumlesi: ONAM_CUMLESI_STANDART,
    kaynak: KAYNAK_STANDART,
  },
  // Özel (ücretli, takvim dışı) aşılar — OZEL_ASILAR (lib/asi/ulusalAsiTakvimi.ts) ile aynı adlar.
  {
    ad: 'Rotavirüs',
    korur: TR('Rotavirüsün yol açtığı ağır ishal ve kusmadan korur.'),
    yanEtkiler: TRL('Geçici huzursuzluk, hafif ishal', 'Nadiren kusma'),
    onamCumlesi: ONAM_CUMLESI_STANDART,
    kaynak: KAYNAK_STANDART,
  },
  {
    ad: 'Meningokok ACWY (konjuge)',
    korur: TR('A, C, W, Y serogruplarına bağlı meningokok menenjiti ve kan zehirlenmesinden korur.'),
    yanEtkiler: TRL('Enjeksiyon yerinde ağrı, kızarıklık, şişlik', 'Hafif ateş', 'Baş ağrısı, huzursuzluk'),
    onamCumlesi: ONAM_CUMLESI_STANDART,
    kaynak: KAYNAK_STANDART,
  },
  {
    ad: 'Meningokok B',
    korur: TR('B serogrubuna bağlı meningokok menenjiti ve kan zehirlenmesinden korur.'),
    yanEtkiler: TRL('Enjeksiyon yerinde ağrı, kızarıklık, şişlik', 'Ateş (özellikle küçük bebekte sık)', 'Huzursuzluk, iştahsızlık'),
    onamCumlesi: ONAM_CUMLESI_STANDART,
    kaynak: KAYNAK_STANDART,
  },
  {
    ad: 'İnfluenza (Grip)',
    korur: TR('Mevsimsel grip (influenza) virüsünden ve komplikasyonlarından korur; her yıl güncellenir.'),
    yanEtkiler: TRL('Enjeksiyon yerinde hassasiyet', 'Hafif ateş, kas ağrısı', 'Halsizlik'),
    onamCumlesi: ONAM_CUMLESI_STANDART,
    kaynak: KAYNAK_STANDART,
  },
  {
    ad: 'HPV',
    korur: TR('İnsan papilloma virüsünün (HPV) yol açtığı rahim ağzı kanseri ve diğer HPV ile ilişkili kanserler ile genital siğillerden korur.'),
    yanEtkiler: TRL('Enjeksiyon yerinde ağrı, kızarıklık, şişlik', 'Baş ağrısı', 'Nadiren bayılma hissi (uygulama sonrası 15 dk gözlem önerilir)'),
    onamCumlesi: ONAM_CUMLESI_STANDART,
    kaynak: KAYNAK_STANDART,
  },
]

const ICERIK_ENDEKSI = new Map(ASI_ONAM_ICERIGI.map((i) => [i.ad.trim().toLocaleLowerCase('tr-TR'), i]))

/** Looks up by exact vaccine name (as recorded on the aşı kartı / takvim). Null when not in the dataset yet — caller must not invent content. */
export function asiOnamIcerigiBul(asiAdi: string): AsiOnamIcerigi | null {
  return ICERIK_ENDEKSI.get(String(asiAdi || '').trim().toLocaleLowerCase('tr-TR')) || null
}

/** Vaccine names the consent dataset actually covers — the picker only offers these (no free-text consent content). */
export const ASI_ONAM_ICERIGI_ADLARI: string[] = ASI_ONAM_ICERIGI.map((i) => i.ad)
