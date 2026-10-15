/**
 * NOTYA-UZ-ASISTAN-PERSONA-DOKTOR-01 (release/uz ONLY, Kaan 2026-10-08/09 names): before falling
 * through to the TR Doktor roster below, this file now checks `uzAsistanAdi()`
 * (countries/uz/klinik/asistanAdlari.ts) for a Doktor entry. That file already names all 30 Doktor
 * specialties for Uzbekistan — it was wired only into the Klinik "uygulama" screen and the UZ
 * landing copy, never into this Doktor "Ayşe'ye Danış" panel lookup. `gender`/`voiceId` (fields this
 * module's return type requires) are NOT in asistanAdlari.ts by design (it is names-only, see its own
 * header) — they come from `uzDoktorPersonaSesi.ts`, a separate, clearly-flagged, Claude-inferred
 * file pending Kaan/Dr. Gökhan review. Klinik roster + unknown-branş flagship fallback are unchanged.
 *
 * NOTYA-ASISTAN-PERSONA-BRANS-LOOKUP-01 (Kaan, CEO düzeltmesi — BUG A GERÇEK, "by design" DEĞİL):
 * "Ayşe'ye Danış" paneli hekimin KENDİ branşının uzmanını göstermeli. CEO'nun açık talimatı:
 * "Ayşe Kaya Dermatoloji'de HİÇ görünmemeli — Dermatoloji'nin tamamında Selin Aksoy olmalı."
 * Ayşe yalnızca pediatrinin kendi uzmanıdır; başka hiçbir branşta "varsayılan kimlik" değildir.
 *
 * Bu dosya, repo'da ZATEN VAR olan İKİ TAM rosteri TEK genel arama noktasında birleştirir — hiçbiri
 * burada İCAT EDİLMEDİ:
 *
 *   1) `lib/asistan/specialistsCatalog.ts` — Doktor'un 30 branşının TAMAMI, boşluksuz:
 *      pediatri→Ayşe Kaya, kardiyoloji→Mehmet Demir, nöroloji→Elif Şahin, dahiliye→Zeynep Arslan,
 *      psikiyatri→Deniz Yılmaz, genel cerrahi→Hakan Öztürk, ortopedi→Burak Şen,
 *      dermatoloji→Selin Aksoy, KBB→Emre Aydın, göz→İrem Kaya, kadın hast. ve doğum→Fatma Çelik,
 *      üroloji→Murat Yıldız, radyoloji→Caner Koç, anestezi→Pınar Demir, acil tıp→Oğuz Kılıç,
 *      fizik tedavi→Aylin Erdem, enfeksiyon→Serkan Güneş, endokrin→Gülşah Tekin,
 *      gastroenteroloji→Volkan Arı, nefroloji→Mert Özkan, romatoloji→Nazlı Kara, onkoloji→Ece Yurt,
 *      göğüs hastalıkları→Barış Uysal, göğüs cerrahisi→Tolga Şimşek, plastik cerrahi→Melis Orhan,
 *      beyin cerrahisi→Kerem Ersoy, kalp damar cerrahisi→Sinan Acar, çocuk cerrahisi→Derya Polat,
 *      aile hekimliği→Yusuf Akın, spor hekimliği→Cemre Taş. Her biri `lib/doktor/specialties.ts`
 *      (`greeting`) ile 1:1 tutarlı — iki bağımsız dosyada aynı 30 isim, tesadüf değil.
 *
 *   2) `lib/ai/personas/klinik_uzmanlar.ts` — Klinik dikeyinin 10 dalının TAMAMI, boşluksuz:
 *      estetik-cerrahi→Leyla Arslan, saç ekimi→Emre Kaya, (Klinik) dermatoloji→Selin Çelik,
 *      medikal estetik→Ceren Yıldız, longevity→Alp Tekin, fizyoterapi→Aylin Doğan,
 *      klinik psikolog→Berk Yılmaz, diyetisyen→Deniz Şahin, ergoterapi→Fatma Kılıç,
 *      odyoloji→Can Demir. (Doktor'un dermatoloji'si TDD uzmanlığıdır; Klinik'in "dermatoloji" dalı
 *      AYRI bir ürün — `klinikDikey.ts`: "dermatoloji (TDD) ≠ klinik-dermatoloji". İki farklı isim
 *      — Selin Aksoy / Selin Çelik — bilerek, aynı kişi değil.)
 *
 * SONUÇ: 40/40 branş+dal isimli. Hiçbir branş "isimsiz" değil. Bilinmeyen/boş girişte (örn. henüz
 * hiçbir rosterde olmayan yeni bir Klinik dalı) bayrak gemisine (Ayşe/pediatri) düşülür — asla
 * çöker, asla yeni bir isim UYDURMAZ (CEO: "roster'ın kalanını ben/Dr. Gökhan veririm, icat etme").
 *
 * Herhangi bir yüzey (bugün: HastaKonsult.tsx "Ayşe'ye Danış" paneli) branşa göre çatallanan bir UI
 * dalı YAZMADAN bu TEK fonksiyonu çağırır. Roster büyüyünce (yeni isim) bu dosya ya da çağıran
 * yüzey DEĞİŞMEZ — sadece specialistsCatalog.ts / klinik_uzmanlar.ts'e veri eklenir.
 */
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { getSpecialistForSpecialty, SPECIALIST_BY_SPECIALTY, type SpecialtyKey } from '@/lib/asistan/specialistsCatalog'
import { KlinikUzmanPersonas } from '@/lib/ai/personas/klinik_uzmanlar'
import { formatColleagueDisplayName } from '@/lib/colleagueAddress'
import { uzAsistanAdi } from '@/countries/uz/klinik/asistanAdlari'
import { uzDoktorPersonaSesi } from '@/lib/asistan/uzDoktorPersonaSesi'

export type BransPersonaKaynagi = 'doktor-brans' | 'doktor-brans-uz' | 'klinik-dali' | 'varsayilan'

export interface BransAsistanPersonasi {
  /** Tam ad, unvanla — ör. "Prof. Dr. Selin Aksoy" / "Dr. Emre Kaya". */
  tamAd: string
  /** Kısa görünen ad — Doktor rosterinde tek isim (ör. "Selin"), Klinik rosterinde unvansız ad+soyad (ör. "Emre Kaya"). */
  kisaAd: string
  gender: 'female' | 'male'
  voiceId: string
  kaynak: BransPersonaKaynagi
}

/**
 * Raporlama için: bu branş/dal anahtarı iki rosterden BİRİNDE de yoksa true. ("isim yok — icat
 * etme, CEO'dan/Dr. Gökhan'dan iste" listesini otomatik üretmek için.)
 */
export function bransPersonasiBulunamadiMi(brans: string | null | undefined): boolean {
  if (!brans) return false
  const anahtar = bransAnahtari(brans)
  const doktordaVar = !!(anahtar && SPECIALIST_BY_SPECIALTY[anahtar as SpecialtyKey])
  const klinikteVar = !!KlinikUzmanPersonas[brans]
  return !doktordaVar && !klinikteVar
}

/**
 * TEK genel arama noktası. Önce Doktor'un 30 branşlık rosterini dener (kanonik anahtara çözerek —
 * `kadin-dogum` ↔ `kadin-hastaliklari-dogum` gibi takma adlar `bransAnahtari()` ile dahil), sonra
 * Klinik'in 10 dalını (ham slug ile — `/asistan/klinik` ve `klinik-signed-url` rotalarının
 * KlinikUzmanPersonas'ı okuduğu AYNI anahtar biçimiyle). İkisinde de yoksa bayrak gemisi
 * (pediatri/Ayşe) döner — asla çöker, asla isim üretmez.
 */
export function bransAsistanPersonasiBul(brans: string | null | undefined): BransAsistanPersonasi {
  const anahtar = brans ? bransAnahtari(brans) : null
  // UZ Doktor roster first (release/uz only) — see NOTYA-UZ-ASISTAN-PERSONA-DOKTOR-01 above.
  if (anahtar) {
    const uzAdi = uzAsistanAdi(anahtar)
    if (uzAdi && uzAdi.taraf === 'doktor') {
      const ses = uzDoktorPersonaSesi(anahtar)
      if (ses) {
        // All 30 UZ Doktor entries carry unvan 'prof-dr' today (countries/uz/klinik/asistanAdlari.ts) —
        // guarded by bransAsistanPersonasi.test.ts; a future non-'prof-dr' Doktor entry falls through
        // to the TR roster below rather than guessing a title.
        if (uzAdi.unvan === 'prof-dr') {
          return {
            tamAd: `Prof. Dr. ${uzAdi.kisaAd} ${uzAdi.soyad}`,
            kisaAd: uzAdi.kisaAd,
            gender: ses.gender,
            voiceId: ses.voiceId,
            kaynak: 'doktor-brans-uz',
          }
        }
      }
    }
  }
  if (anahtar && SPECIALIST_BY_SPECIALTY[anahtar as SpecialtyKey]) {
    const p = getSpecialistForSpecialty(anahtar)
    return { tamAd: p.name, kisaAd: p.shortName, gender: p.gender, voiceId: p.voice.voiceId, kaynak: 'doktor-brans' }
  }
  if (brans && KlinikUzmanPersonas[brans]) {
    const k = KlinikUzmanPersonas[brans]
    return { tamAd: k.name, kisaAd: formatColleagueDisplayName(k.name), gender: k.gender, voiceId: k.voiceId, kaynak: 'klinik-dali' }
  }
  const varsayilan = getSpecialistForSpecialty('pediatri')
  return { tamAd: varsayilan.name, kisaAd: varsayilan.shortName, gender: varsayilan.gender, voiceId: varsayilan.voice.voiceId, kaynak: 'varsayilan' }
}
