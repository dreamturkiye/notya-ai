/**
 * NOTYA-ULKE-01 · NOTYA-UZ-FIYAT-UNVAN-01 — Uzbekistan: the assistant's name for each specialty and clinic role.
 *
 * THE SINGLE SOURCE of the 40 names the owner gave. No other file of the pack or of the kit repeats one. IT IS NO
 * LONGER THE LIST OF ROLES (NOTYA-ULKE-UYGULA-UZ, 2026-10-10): the roles are ./rolListesi.ts. Five entries below are
 * of roles the audit took out (sac-ekimi, longevity, ergoterapi, diyetisyen, odyoloji): the owner's names for them
 * are kept, and no screen shows them (./asistanKimligi.ts answers only for a role of the pack). Seven roles of the
 * pack have no entry here and show the neutral assistant until the owner names them. Every form a screen shows
 * (with the title, without it, in Cyrillic, in Russian) is made from an entry here by ./asistanKimligi.ts.
 *
 * CLOSED 2026-10-19 (docs/OPEN-COMMITMENTS.md, same date; decision owner Claude, per Kaan's "close all the open
 * items... decide this yourself"): of the five removed-role entries above, sac-ekimi, longevity and ergoterapi are
 * RETIRED — final, not a pending choice. Reassigning Shohruh Karimov, Asal Qodirova or Oybek Holmatov to a
 * different branş key, or giving the role a new name, would both violate the regulatory-recognition gate
 * (`.cursor/rules/ulke-paritesi-duzeltme.mdc`: a branş Uzbekistan's regulator does not recognise is never offered
 * there — and sac-ekimi/longevity/ergoterapi are exactly that, per ./rolListesi.ts's own sourcing) and break
 * ./asistanAdlari.test.ts's sha256 fingerprint of the owner's frozen 40-name list, which no job may edit around.
 * The only correct, consistent outcome is what the code already does: the three names stay in this file as a
 * historical record of the owner's original 2026-10-08 list, unused by any screen, with no successor branş and no
 * new name. (The other two removed-role entries, diyetisyen and odyoloji, are a different case — not retired, they
 * were already reconciled onto `diyetoloji`/`surdoloji` below, same owner, same identity, new key.)
 *
 * NAMES: the owner's list (Kaan, 2026-10-08). Given name and family name exactly as he wrote them, in Uzbek Latin.
 * `bransAnahtari` is the product's internal specialty key: an identifier, never shown on a screen.
 *
 * RECONCILED 2026-10-18 (docs/OPEN-COMMITMENTS.md, same date): diyetisyen and odyoloji are not new keys that lost
 * their name — they are the SAME two professions, carried to the doctor side under new keys by the audit of
 * 2026-10-10 (./rolListesi.ts, "MOVED TO THE DOCTOR SIDE": `diyetoloji` behaves like `diyetisyen`, `surdoloji` like
 * `odyoloji`). The owner never typed "diyetoloji" or "surdoloji" himself, so this file's frozen list below is NOT
 * touched or re-fingerprinted; `uzAsistanAdi()` instead looks a renamed key up under its old one (`UZ_YENIDEN_ADLANDIRILAN`,
 * at the bottom). This is reconciliation, not invention: the exact names the owner already gave diyetisyen and
 * odyoloji now also answer for diyetoloji and surdoloji. It does NOT extend to a role the audit merely ADDED
 * (alerji-immunoloji, reproduktoloji, cocuk-norolojisi, narkoloji): those stay nameless until the owner names them,
 * per ./asistanKimligi.ts.
 *
 * TITLES: the owner, 2026-10-09: "If prof. is used then follow the same turkish naming convention." So the title of a
 * role is the title its counterpart carries in the Turkish product, role by role (read there, never imported:
 * lib/asistan/specialistsCatalog.ts for the 30 doctor specialties, lib/ai/personas/klinik_uzmanlar.ts for the 10
 * clinic roles; ./asistanAdlari.test.ts compares the two lists on every run):
 *
 *   Turkish counterpart                        here            full form                    short form
 *   "Prof. Dr. <given> <family>"               'prof-dr'       Prof. Dr. Malika Nazarova    Prof. Malika
 *     the 30 doctor specialties, and the clinic's aesthetic surgery
 *   "Dr. <given> <family>"                     'dr'            Dr. Shohruh Karimov          Dr. Shohruh
 *     hair transplant, medical aesthetics, clinic dermatology, longevity, and the clinical psychologist
 *   "Uzm. <given> <family>" + the profession   'meslek'        Fizioterapevt Jasmina …      Fizioterapevt Jasmina
 *     physiotherapist, dietitian, occupational therapist, audiologist
 *
 * "Uzm." has no natural equivalent in Uzbek or Russian, so those four keep the closest common form: the profession's
 * own title, as the owner wrote it (`meslekUnvani`; "Fizioterapevt" is his correction of 2026-10-09, "Use the common
 * name"). The words of 'prof-dr' and 'dr' in each text form are in ./asistanUnvanlari.ts.
 *
 * Before 2026-10-09 every doctor carried "Dr." and the clinical psychologist "Psixolog": that was the owner's first
 * list, replaced by his instruction above. No biography follows from a title: nothing anywhere says how long an
 * assistant has practised, where, or with what degree (docs/COUNTRY-PACK-UZBEKISTAN.md).
 */
export type AsistanTarafi = 'doktor' | 'klinik-hekim' | 'klinik-muttefik'

/** Which title the role's assistant carries: the Turkish product's convention for the same role (table above). */
export type AsistanUnvani = 'prof-dr' | 'dr' | 'meslek'

export type AsistanAdi = {
  taraf: AsistanTarafi
  bransAnahtari: string
  unvan: AsistanUnvani
  /** Only with `unvan: 'meslek'`: the profession's own title, in Uzbek Latin, as the owner wrote it. */
  meslekUnvani?: string
  /** Given name, exactly as the owner wrote it. Also what the assistant is called briefly. */
  kisaAd: string
  /** Family name, exactly as the owner wrote it. */
  soyad: string
}

export const UZ_ASISTAN_ADLARI: readonly AsistanAdi[] = [
  { taraf: 'doktor', bransAnahtari: 'acil-tip', unvan: 'prof-dr', kisaAd: 'Jasur', soyad: 'Tursunov' },
  { taraf: 'doktor', bransAnahtari: 'aile-hekimligi', unvan: 'prof-dr', kisaAd: 'Nilufar', soyad: 'Karimova' },
  { taraf: 'doktor', bransAnahtari: 'anestezi', unvan: 'prof-dr', kisaAd: 'Bekzod', soyad: 'Yusupov' },
  { taraf: 'doktor', bransAnahtari: 'beyin-cerrahisi', unvan: 'prof-dr', kisaAd: 'Alisher', soyad: 'Ergashev' },
  { taraf: 'doktor', bransAnahtari: 'cocuk-cerrahisi', unvan: 'prof-dr', kisaAd: 'Sardor', soyad: 'Abdullayev' },
  { taraf: 'doktor', bransAnahtari: 'dahiliye', unvan: 'prof-dr', kisaAd: 'Madina', soyad: 'Rahimova' },
  { taraf: 'doktor', bransAnahtari: 'dermatoloji', unvan: 'prof-dr', kisaAd: 'Sevara', soyad: 'Ismailova' },
  { taraf: 'doktor', bransAnahtari: 'endokrinoloji', unvan: 'prof-dr', kisaAd: 'Dilnoza', soyad: 'Nazarova' },
  { taraf: 'doktor', bransAnahtari: 'enfeksiyon-hastaliklari', unvan: 'prof-dr', kisaAd: 'Otabek', soyad: 'Qodirov' },
  { taraf: 'doktor', bransAnahtari: 'gastroenteroloji', unvan: 'prof-dr', kisaAd: 'Jamshid', soyad: 'Mirzayev' },
  { taraf: 'doktor', bransAnahtari: 'genel-cerrahi', unvan: 'prof-dr', kisaAd: 'Sherzod', soyad: 'Saidov' },
  { taraf: 'doktor', bransAnahtari: 'gogus-cerrahisi', unvan: 'prof-dr', kisaAd: 'Farrux', soyad: 'Holmatov' },
  { taraf: 'doktor', bransAnahtari: 'gogus-hastaliklari', unvan: 'prof-dr', kisaAd: 'Gulnoza', soyad: 'Alimova' },
  { taraf: 'doktor', bransAnahtari: 'goz-hastaliklari', unvan: 'prof-dr', kisaAd: 'Aziza', soyad: 'Sodiqova' },
  { taraf: 'doktor', bransAnahtari: 'kadin-hastaliklari-dogum', unvan: 'prof-dr', kisaAd: 'Shahnoza', soyad: 'Rasulova' },
  { taraf: 'doktor', bransAnahtari: 'kalp-damar-cerrahisi', unvan: 'prof-dr', kisaAd: 'Temur', soyad: 'Karimov' },
  { taraf: 'doktor', bransAnahtari: 'kardiyoloji', unvan: 'prof-dr', kisaAd: 'Kamola', soyad: 'Yusupova' },
  { taraf: 'doktor', bransAnahtari: 'kulak-burun-bogaz', unvan: 'prof-dr', kisaAd: 'Nodir', soyad: 'Ergashev' },
  { taraf: 'doktor', bransAnahtari: 'nefroloji', unvan: 'prof-dr', kisaAd: 'Mohira', soyad: 'Abdullayeva' },
  { taraf: 'doktor', bransAnahtari: 'noroloji', unvan: 'prof-dr', kisaAd: 'Bobur', soyad: 'Rahimov' },
  { taraf: 'doktor', bransAnahtari: 'onkoloji', unvan: 'prof-dr', kisaAd: 'Nigora', soyad: 'Tursunova' },
  { taraf: 'doktor', bransAnahtari: 'ortopedi', unvan: 'prof-dr', kisaAd: 'Ulugbek', soyad: 'Ismailov' },
  { taraf: 'doktor', bransAnahtari: 'pediatri', unvan: 'prof-dr', kisaAd: 'Malika', soyad: 'Nazarova' },
  { taraf: 'doktor', bransAnahtari: 'plastik-cerrahi', unvan: 'prof-dr', kisaAd: 'Barno', soyad: 'Mirzayeva' },
  { taraf: 'doktor', bransAnahtari: 'psikiyatri', unvan: 'prof-dr', kisaAd: 'Zulfiya', soyad: 'Saidova' },
  { taraf: 'doktor', bransAnahtari: 'radyoloji', unvan: 'prof-dr', kisaAd: 'Akmal', soyad: 'Qodirov' },
  { taraf: 'doktor', bransAnahtari: 'romatoloji', unvan: 'prof-dr', kisaAd: 'Saodat', soyad: 'Holmatova' },
  { taraf: 'doktor', bransAnahtari: 'uroloji', unvan: 'prof-dr', kisaAd: 'Javohir', soyad: 'Alimov' },
  { taraf: 'doktor', bransAnahtari: 'spor-hekimligi', unvan: 'prof-dr', kisaAd: 'Sanjar', soyad: 'Sodiqov' },
  { taraf: 'doktor', bransAnahtari: 'fizik-tedavi', unvan: 'prof-dr', kisaAd: 'Laziz', soyad: 'Rahimov' },
  { taraf: 'klinik-hekim', bransAnahtari: 'sac-ekimi', unvan: 'dr', kisaAd: 'Shohruh', soyad: 'Karimov' },
  { taraf: 'klinik-hekim', bransAnahtari: 'estetik-cerrahi', unvan: 'prof-dr', kisaAd: 'Lobar', soyad: 'Yusupova' },
  { taraf: 'klinik-hekim', bransAnahtari: 'medikal-estetik', unvan: 'dr', kisaAd: 'Feruza', soyad: 'Rasulova' },
  { taraf: 'klinik-hekim', bransAnahtari: 'klinik-dermatoloji', unvan: 'dr', kisaAd: 'Dilbar', soyad: 'Ergasheva' },
  { taraf: 'klinik-hekim', bransAnahtari: 'longevity', unvan: 'dr', kisaAd: 'Asal', soyad: 'Qodirova' },
  { taraf: 'klinik-muttefik', bransAnahtari: 'fizyoterapi', unvan: 'meslek', meslekUnvani: 'Fizioterapevt', kisaAd: 'Jasmina', soyad: 'Abdullayeva' },
  { taraf: 'klinik-muttefik', bransAnahtari: 'klinik-psikolog', unvan: 'dr', kisaAd: 'Doniyor', soyad: 'Saidov' },
  { taraf: 'klinik-muttefik', bransAnahtari: 'diyetisyen', unvan: 'meslek', meslekUnvani: 'Diyetolog', kisaAd: 'Mahliyo', soyad: 'Tursunova' },
  { taraf: 'klinik-muttefik', bransAnahtari: 'ergoterapi', unvan: 'meslek', meslekUnvani: 'Ergoterapevt', kisaAd: 'Oybek', soyad: 'Holmatov' },
  { taraf: 'klinik-muttefik', bransAnahtari: 'odyoloji', unvan: 'meslek', meslekUnvani: 'Audiolog', kisaAd: 'Rayhon', soyad: 'Alimova' },
]

const ANAHTARA_GORE: ReadonlyMap<string, AsistanAdi> = new Map(UZ_ASISTAN_ADLARI.map((a) => [a.bransAnahtari, a]))

/**
 * A key the audit of 2026-10-10 renamed onto the doctor side → the owner's own key for the same profession
 * (./rolListesi.ts, karar `moved`). Reconciliation only: no other key of the pack is in here.
 */
const UZ_YENIDEN_ADLANDIRILAN: ReadonlyMap<string, string> = new Map([
  ['diyetoloji', 'diyetisyen'],
  ['surdoloji', 'odyoloji'],
])

/**
 * The assistant for a specialty key, or null. Never falls back to another specialty or another country — except
 * the two keys above, which are not "another" specialty: they are the one the owner named, under the name the
 * 2026-10-10 audit gave it.
 */
export function uzAsistanAdi(bransAnahtari: string): AsistanAdi | null {
  const dogrudan = ANAHTARA_GORE.get(bransAnahtari)
  if (dogrudan) return dogrudan
  const eskiAnahtar = UZ_YENIDEN_ADLANDIRILAN.get(bransAnahtari)
  return eskiAnahtar ? ANAHTARA_GORE.get(eskiAnahtar) ?? null : null
}
