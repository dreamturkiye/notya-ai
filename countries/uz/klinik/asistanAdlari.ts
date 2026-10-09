/**
 * NOTYA-ULKE-01 — Uzbekistan: the assistant's name for each specialty and clinic role.
 *
 * Source: the owner's list (Kaan, 2026-10-08), stored exactly as he gave it. `bransAnahtari` is the product's internal
 * specialty key: an identifier, never shown on a screen.
 *
 * NOT YET USED by any screen or model instruction. Open before it is: Cyrillic and Russian forms of each name, a native
 * reader's check of the spellings, and each assistant's background text (see docs/COUNTRY-PACK-UZBEKISTAN.md).
 */
export type AsistanTarafi = 'doktor' | 'klinik-hekim' | 'klinik-muttefik'

export type AsistanAdi = {
  taraf: AsistanTarafi
  bransAnahtari: string
  /** Full name with title, Uzbek Latin script, as the owner wrote it. */
  tamAd: string
  /** Given name, used where the assistant is addressed briefly. */
  kisaAd: string
}

export const UZ_ASISTAN_ADLARI: readonly AsistanAdi[] = [
  { taraf: 'doktor', bransAnahtari: 'acil-tip', tamAd: 'Dr. Jasur Tursunov', kisaAd: 'Jasur' },
  { taraf: 'doktor', bransAnahtari: 'aile-hekimligi', tamAd: 'Dr. Nilufar Karimova', kisaAd: 'Nilufar' },
  { taraf: 'doktor', bransAnahtari: 'anestezi', tamAd: 'Dr. Bekzod Yusupov', kisaAd: 'Bekzod' },
  { taraf: 'doktor', bransAnahtari: 'beyin-cerrahisi', tamAd: 'Dr. Alisher Ergashev', kisaAd: 'Alisher' },
  { taraf: 'doktor', bransAnahtari: 'cocuk-cerrahisi', tamAd: 'Dr. Sardor Abdullayev', kisaAd: 'Sardor' },
  { taraf: 'doktor', bransAnahtari: 'dahiliye', tamAd: 'Dr. Madina Rahimova', kisaAd: 'Madina' },
  { taraf: 'doktor', bransAnahtari: 'dermatoloji', tamAd: 'Dr. Sevara Ismailova', kisaAd: 'Sevara' },
  { taraf: 'doktor', bransAnahtari: 'endokrinoloji', tamAd: 'Dr. Dilnoza Nazarova', kisaAd: 'Dilnoza' },
  { taraf: 'doktor', bransAnahtari: 'enfeksiyon-hastaliklari', tamAd: 'Dr. Otabek Qodirov', kisaAd: 'Otabek' },
  { taraf: 'doktor', bransAnahtari: 'gastroenteroloji', tamAd: 'Dr. Jamshid Mirzayev', kisaAd: 'Jamshid' },
  { taraf: 'doktor', bransAnahtari: 'genel-cerrahi', tamAd: 'Dr. Sherzod Saidov', kisaAd: 'Sherzod' },
  { taraf: 'doktor', bransAnahtari: 'gogus-cerrahisi', tamAd: 'Dr. Farrux Holmatov', kisaAd: 'Farrux' },
  { taraf: 'doktor', bransAnahtari: 'gogus-hastaliklari', tamAd: 'Dr. Gulnoza Alimova', kisaAd: 'Gulnoza' },
  { taraf: 'doktor', bransAnahtari: 'goz-hastaliklari', tamAd: 'Dr. Aziza Sodiqova', kisaAd: 'Aziza' },
  { taraf: 'doktor', bransAnahtari: 'kadin-hastaliklari-dogum', tamAd: 'Dr. Shahnoza Rasulova', kisaAd: 'Shahnoza' },
  { taraf: 'doktor', bransAnahtari: 'kalp-damar-cerrahisi', tamAd: 'Dr. Temur Karimov', kisaAd: 'Temur' },
  { taraf: 'doktor', bransAnahtari: 'kardiyoloji', tamAd: 'Dr. Kamola Yusupova', kisaAd: 'Kamola' },
  { taraf: 'doktor', bransAnahtari: 'kulak-burun-bogaz', tamAd: 'Dr. Nodir Ergashev', kisaAd: 'Nodir' },
  { taraf: 'doktor', bransAnahtari: 'nefroloji', tamAd: 'Dr. Mohira Abdullayeva', kisaAd: 'Mohira' },
  { taraf: 'doktor', bransAnahtari: 'noroloji', tamAd: 'Dr. Bobur Rahimov', kisaAd: 'Bobur' },
  { taraf: 'doktor', bransAnahtari: 'onkoloji', tamAd: 'Dr. Nigora Tursunova', kisaAd: 'Nigora' },
  { taraf: 'doktor', bransAnahtari: 'ortopedi', tamAd: 'Dr. Ulugbek Ismailov', kisaAd: 'Ulugbek' },
  { taraf: 'doktor', bransAnahtari: 'pediatri', tamAd: 'Dr. Malika Nazarova', kisaAd: 'Malika' },
  { taraf: 'doktor', bransAnahtari: 'plastik-cerrahi', tamAd: 'Dr. Barno Mirzayeva', kisaAd: 'Barno' },
  { taraf: 'doktor', bransAnahtari: 'psikiyatri', tamAd: 'Dr. Zulfiya Saidova', kisaAd: 'Zulfiya' },
  { taraf: 'doktor', bransAnahtari: 'radyoloji', tamAd: 'Dr. Akmal Qodirov', kisaAd: 'Akmal' },
  { taraf: 'doktor', bransAnahtari: 'romatoloji', tamAd: 'Dr. Saodat Holmatova', kisaAd: 'Saodat' },
  { taraf: 'doktor', bransAnahtari: 'uroloji', tamAd: 'Dr. Javohir Alimov', kisaAd: 'Javohir' },
  { taraf: 'doktor', bransAnahtari: 'spor-hekimligi', tamAd: 'Dr. Sanjar Sodiqov', kisaAd: 'Sanjar' },
  { taraf: 'doktor', bransAnahtari: 'fizik-tedavi', tamAd: 'Dr. Laziz Rahimov', kisaAd: 'Laziz' },
  { taraf: 'klinik-hekim', bransAnahtari: 'sac-ekimi', tamAd: 'Dr. Shohruh Karimov', kisaAd: 'Shohruh' },
  { taraf: 'klinik-hekim', bransAnahtari: 'estetik-cerrahi', tamAd: 'Dr. Lobar Yusupova', kisaAd: 'Lobar' },
  { taraf: 'klinik-hekim', bransAnahtari: 'medikal-estetik', tamAd: 'Dr. Feruza Rasulova', kisaAd: 'Feruza' },
  { taraf: 'klinik-hekim', bransAnahtari: 'klinik-dermatoloji', tamAd: 'Dr. Dilbar Ergasheva', kisaAd: 'Dilbar' },
  { taraf: 'klinik-hekim', bransAnahtari: 'longevity', tamAd: 'Dr. Asal Qodirova', kisaAd: 'Asal' },
  { taraf: 'klinik-muttefik', bransAnahtari: 'fizyoterapi', tamAd: 'Fizyoterapevt Jasmina Abdullayeva', kisaAd: 'Jasmina' },
  { taraf: 'klinik-muttefik', bransAnahtari: 'klinik-psikolog', tamAd: 'Psixolog Doniyor Saidov', kisaAd: 'Doniyor' },
  { taraf: 'klinik-muttefik', bransAnahtari: 'diyetisyen', tamAd: 'Diyetolog Mahliyo Tursunova', kisaAd: 'Mahliyo' },
  { taraf: 'klinik-muttefik', bransAnahtari: 'ergoterapi', tamAd: 'Ergoterapevt Oybek Holmatov', kisaAd: 'Oybek' },
  { taraf: 'klinik-muttefik', bransAnahtari: 'odyoloji', tamAd: 'Audiolog Rayhon Alimova', kisaAd: 'Rayhon' },
]

const ANAHTARA_GORE: ReadonlyMap<string, AsistanAdi> = new Map(UZ_ASISTAN_ADLARI.map((a) => [a.bransAnahtari, a]))

/** The assistant for a specialty key, or null. Never falls back to another specialty or another country. */
export function uzAsistanAdi(bransAnahtari: string): AsistanAdi | null {
  return ANAHTARA_GORE.get(bransAnahtari) ?? null
}
