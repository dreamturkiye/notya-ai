/**
 * GENITAL-ESTETIK-01 (Kaan, 2026-11-06) — THE FOUR GENITAL-AESTHETIC OPERATION-NOTE TEMPLATES: labioplasti, labioplasti +
 * klitoral başlık redüksiyonu, vajinoplasti / kolpoperineorafi, perineoplasti / kolporafi. Each requires the cosmetic /
 * medically-indicated field; a cosmetic one is refused under 18 or without a recorded birth date (lib/clinical/genitalEstetik.ts,
 * enforced by app/api/doktor/ameliyat-notlari).
 *
 * WHO RECEIVES THEM (lib/doktor/genitalEstetikBrans.ts, chosen by the doctor's own branch in lib/doktor/ameliyatNotuSunucu.ts):
 * Kadın Hastalıkları ve Doğum (inside its full template list, ./ameliyatSablonlari.ts), plastik cerrahi and the Özel Branş
 * estetik & plastik cerrahi (owner's decision, 2026-11-06). No other branch.
 *
 * Same rules as every template: generic, EDITABLE steps; no dose, size or count (every number is "__"); no finding.
 */
import type { AmeliyatSablonu } from '@/lib/doktor/ameliyatNotu'

const ADIM = (satirlar: string[]) => satirlar.map((s, i) => `${i + 1}. ${s}`).join('\n')
const POSTOP_GENEL = 'Vital bulgu, ağrı ve kanama takibi. Erken mobilizasyon. Oral alım: hekim belirler. Tromboprofilaksi: risk değerlendirmesine göre. Sonda çıkarılma zamanı: __. Taburculuk ve kontrol: __.'

export const GE_AMELIYAT_SABLONLARI: readonly AmeliyatSablonu[] = [
  {
    kod: 'labioplasti', ad: 'Labioplasti (labia minora redüksiyonu)', grup: 'Genital estetik', endikasyonSinifiGerekli: true,
    kaynak: 'ACOG Committee Opinion No. 795, Elective Female Genital Cosmetic Surgery (Obstet Gynecol 2020;135:e36–e42): danışmanlık, beden algısı değerlendirmesi, beklenti ve kanıt düzeyi ayrıca belgelenmelidir.',
    veri: {
      islem: 'Labioplasti (__: kenar rezeksiyonu / kama rezeksiyonu / deepitelizasyon)',
      endikasyon: '__ (fonksiyonel yakınma / estetik talep). Danışmanlık, beden algısı taraması (araç ve sonuç: __) ve beklenti değerlendirmesi yapıldı; bilgilendirilmiş onam alındı.',
      teknik: ADIM([
        'Anestezi __; litotomi pozisyonu; antisepsi, steril örtüm.',
        'Rezeksiyon sınırları her iki tarafta simetrik olarak işaretlendi.',
        'Lokal infiltrasyon: __ (hekim belirler).',
        'İşaretli doku __ tekniği ile çıkarıldı; klitoral başlık ve frenulum korundu.',
        'Hemostaz __.',
      ]),
      patoloji: 'gonderilmedi',
      kapanis: 'Mukoza kenarları emilebilir sütürle __ kapatıldı.',
      postopOrderlar: 'Soğuk uygulama ve hijyen önerileri. Cinsel ilişki ve tampon kısıtlaması: hekim belirler. Kontrol: __. Artan şişlik, kanama, ateş veya akıntıda başvuru anlatıldı.',
    },
  },
  {
    kod: 'labioplasti_klitoral', ad: 'Labioplasti + klitoral başlık redüksiyonu', grup: 'Genital estetik', endikasyonSinifiGerekli: true,
    kaynak: 'ACOG Committee Opinion No. 795 (2020): klitoral başlık redüksiyonu kadın genital kozmetik işlemler arasında sayılır; etkinlik ve güvenlik için yüksek kaliteli veri yoktur. Klitoris gövdesine ve glansa dokunulmaz.',
    veri: {
      islem: 'Labioplasti (__: kenar / kama / deepitelizasyon) + klitoral başlık redüksiyonu (__: lateral başlık fazlası eksizyonu)',
      endikasyon: '__ (fonksiyonel yakınma / estetik talep). Danışmanlık, beden algısı taraması (araç ve sonuç: __) ve beklenti değerlendirmesi yapıldı; bilgilendirilmiş onam alındı.',
      teknik: ADIM([
        'Anestezi __; litotomi pozisyonu; antisepsi, steril örtüm.',
        'İç dudak rezeksiyon sınırları ve başlık fazlası ayakta ve litotomide simetrik işaretlendi; glans korunacak şekilde başlığın orta hattı bırakıldı.',
        'Lokal infiltrasyon: __ (hekim belirler).',
        'İç dudak dokusu __ tekniği ile çıkarıldı; frenulum korundu.',
        'Başlığın lateral fazlası __ ile eksize edildi; klitoris gövdesi, glans ve dorsal sinir bölgesine dokunulmadı.',
        'Hemostaz __; glans açıklığı ve simetri kontrol edildi.',
      ]),
      patoloji: 'gonderilmedi',
      kapanis: 'Mukoza ve başlık kenarları emilebilir sütürle __ kapatıldı.',
      postopOrderlar: 'Soğuk uygulama ve hijyen önerileri verildi; hasta talimat sayfası verildi. Cinsel ilişki ve tampon kısıtlaması: __ hafta. Kontrol: __. Artan şişlik, kanama, ateş veya akıntıda başvuru anlatıldı.',
    },
  },
  {
    kod: 'vajinoplasti_kolpoperineorafi', ad: 'Vajinoplasti / kolpoperineorafi (vajinal daraltma)', grup: 'Genital estetik', endikasyonSinifiGerekli: true,
    kaynak: 'ACOG Committee Opinion No. 795 (2020): kozmetik vajinoplasti tıbbi endikasyonsuzdur, güvenlik ve etkinliği belirlenmemiştir; NICE NG123 (2019) sarkma onarımında. Kozmetik amaçla yapılıyorsa ayrıca danışmanlık ve beden algısı taraması belgelenir.',
    veri: {
      islem: 'Vajinoplasti / kolpoperineorafi (__: posterior kolporafi + perineorafi / levator plikasyonu)',
      endikasyon: '__ (vajinal laksite yakınması / POP-Q evresi __ / doğum hasarı). Pelvik taban kas egzersizleri: __. Danışmanlık ve beklenti değerlendirmesi yapıldı; bilgilendirilmiş onam alındı.',
      teknik: ADIM([
        'Anestezi __; litotomi pozisyonu; antisepsi, steril örtüm, mesane sondası.',
        'Hedef introitus genişliği ilişki işlevi gözetilerek belirlendi (ölçüm: __ parmak / __ cm).',
        'Arka vajen duvarında ve perinede __ şeklinde (üçgen / elmas) mukoza işaretlendi ve insize edildi.',
        'Rektovajinal fasya disseke edildi; rektum korundu.',
        'Rektovajinal fasya / levator kenarları __ ile orta hatta plike edildi (aşırı daraltmadan kaçınıldı).',
        'Fazla mukoza eksize edildi; perineal cisim kasları (bulbokavernöz, transvers perineal) yeniden yaklaştırıldı.',
        'Rektal tuşe: sütür rektuma geçmedi: __. Son introitus genişliği: __.',
      ]),
      patoloji: 'gonderilmedi',
      kapanis: 'Vajinal mukoza ve perine cildi emilebilir sütürle kapatıldı; vajinal tampon: __.',
      postopOrderlar: POSTOP_GENEL + ' Kabızlıktan kaçınma; ağır kaldırma ve cinsel ilişki kısıtlaması: __ hafta. Hasta talimat sayfası verildi.',
    },
  },
  {
    kod: 'perineoplasti_kolporafi', ad: 'Perineoplasti / kolporafi (sarkma ve doğum hasarı onarımı)', grup: 'Genital estetik', endikasyonSinifiGerekli: true,
    kaynak: 'NICE NG123 Urinary incontinence and pelvic organ prolapse in women: management (2019); ACOG Committee Opinion No. 795 (2020) for cosmetic indications.',
    veri: {
      islem: '__ (posterior kolporafi + perineoplasti / anterior kolporafi)',
      endikasyon: '__ (POP-Q evresi __ / vajinal laksite yakınması). Bilgilendirilmiş onam alındı.',
      teknik: ADIM([
        'Anestezi __; litotomi pozisyonu; antisepsi, steril örtüm, mesane sondası.',
        'Perineal / vajinal mukozada __ insizyon; mukoza alttaki fasyadan disseke edildi.',
        'Rektovajinal / vezikovajinal fasya plikasyonu __ ile yapıldı (rektal / mesane bütünlüğü korundu; rektal tuşe: __).',
        'Fazla mukoza eksize edildi.',
        'Perineal cisim kasları (bulbokavernöz, transvers perineal) __ ile yeniden yaklaştırıldı.',
      ]),
      patoloji: 'gonderilmedi',
      kapanis: 'Vajinal mukoza ve perine cildi emilebilir sütürle kapatıldı; vajinal tampon: __.',
      postopOrderlar: POSTOP_GENEL + ' Kabızlıktan kaçınma; ağır kaldırma ve cinsel ilişki kısıtlaması: hekim belirler.',
    },
  },
]
