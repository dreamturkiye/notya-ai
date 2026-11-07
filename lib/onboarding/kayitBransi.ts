/**
 * KAYIT-BRANS-01 (Kaan, 2026-11-07) — "Ensure that when doktors sign up to the free trial in the turkish site they need
 * to choose their specialty." CORE: the same list and the same rule for every one of the 40 branches.
 *
 * The ONE list a doctor chooses a branch from when the account is created: the 30 medical branches
 * (lib/doktor/specialties.ts / BRANS_ETIKETLERI) and the 10 Özel Branşlar (lib/specialties/klinikDikey.ts), in two groups.
 * Used by /kayit, onboarding step 2, the "Branşınızı seçin" gate of the doctor app (components/doktor/BransSecimKapisi.tsx)
 * and, on the server, by POST /api/users/profile and POST /api/users/brans. The option VALUE is the canonical key —
 * never a display label, never a default.
 *
 * Pure and client-safe on purpose (it is bundled into /kayit): it does not import the heavy specialty catalogue. The 30
 * labels are therefore written here; lib/onboarding/kayitBransi.test.ts proves on every run that keys and labels are
 * exactly those of BRANS_ETIKETLERI and KLINIK_ETIKET, so this can never drift into a second list.
 */
import { KLINIK_ETIKET, KLINIK_MUTTEFIK_SLUGS, KLINIK_YENI_SLUGS, klinikUzmanlikNorm, OZEL_BRANS_KATEGORI } from '@/lib/specialties/klinikDikey'

export type KayitBransSecenegi = { anahtar: string; ad: string }
export type KayitBransGrubu = { baslik: string; secenekler: readonly KayitBransSecenegi[] }

/** The 30 medical branches, in the order of lib/doktor/specialties.ts. Labels = BRANS_ETIKETLERI (test-locked). */
const TIP_BRANSLARI: readonly KayitBransSecenegi[] = [
  { anahtar: 'pediatri', ad: 'Pediatri (Çocuk Sağlığı)' },
  { anahtar: 'kardiyoloji', ad: 'Kardiyoloji' },
  { anahtar: 'noroloji', ad: 'Nöroloji' },
  { anahtar: 'dahiliye', ad: 'İç Hastalıkları (Dahiliye)' },
  { anahtar: 'psikiyatri', ad: 'Psikiyatri' },
  { anahtar: 'genel-cerrahi', ad: 'Genel Cerrahi' },
  { anahtar: 'ortopedi', ad: 'Ortopedi ve Travmatoloji' },
  { anahtar: 'dermatoloji', ad: 'Dermatoloji' },
  { anahtar: 'kulak-burun-bogaz', ad: 'Kulak Burun Boğaz' },
  { anahtar: 'goz-hastaliklari', ad: 'Göz Hastalıkları' },
  { anahtar: 'kadin-hastaliklari-dogum', ad: 'Kadın Hastalıkları ve Doğum' },
  { anahtar: 'uroloji', ad: 'Üroloji' },
  { anahtar: 'radyoloji', ad: 'Radyoloji' },
  { anahtar: 'anestezi', ad: 'Anesteziyoloji ve Reanimasyon' },
  { anahtar: 'acil-tip', ad: 'Acil Tıp' },
  { anahtar: 'fizik-tedavi', ad: 'Fiziksel Tıp ve Rehabilitasyon' },
  { anahtar: 'enfeksiyon-hastaliklari', ad: 'Enfeksiyon Hastalıkları' },
  { anahtar: 'endokrinoloji', ad: 'Endokrinoloji ve Metabolizma' },
  { anahtar: 'gastroenteroloji', ad: 'Gastroenteroloji' },
  { anahtar: 'nefroloji', ad: 'Nefroloji' },
  { anahtar: 'romatoloji', ad: 'Romatoloji' },
  { anahtar: 'onkoloji', ad: 'Tıbbi Onkoloji' },
  { anahtar: 'gogus-hastaliklari', ad: 'Göğüs Hastalıkları' },
  { anahtar: 'gogus-cerrahisi', ad: 'Göğüs Cerrahisi' },
  { anahtar: 'plastik-cerrahi', ad: 'Plastik, Rekonstrüktif ve Estetik Cerrahi' },
  { anahtar: 'beyin-cerrahisi', ad: 'Beyin ve Sinir Cerrahisi' },
  { anahtar: 'kalp-damar-cerrahisi', ad: 'Kalp ve Damar Cerrahisi' },
  { anahtar: 'cocuk-cerrahisi', ad: 'Çocuk Cerrahisi' },
  { anahtar: 'aile-hekimligi', ad: 'Aile Hekimliği' },
  { anahtar: 'spor-hekimligi', ad: 'Spor Hekimliği' },
]

const OZEL_BRANSLAR: readonly KayitBransSecenegi[] = KLINIK_YENI_SLUGS.map((anahtar) => ({ anahtar, ad: KLINIK_ETIKET[anahtar] }))

export const TIP_BRANSLARI_BASLIGI = 'Tıp Branşları'

/** The two groups of the select, in this order. */
export const KAYIT_BRANS_GRUPLARI: readonly KayitBransGrubu[] = [
  { baslik: TIP_BRANSLARI_BASLIGI, secenekler: TIP_BRANSLARI },
  { baslik: OZEL_BRANS_KATEGORI, secenekler: OZEL_BRANSLAR },
]

/** All 40 keys. */
export const KAYIT_BRANS_ANAHTARLARI: readonly string[] = [...TIP_BRANSLARI, ...OZEL_BRANSLAR].map((s) => s.anahtar)
const ANAHTAR_SET = new Set(KAYIT_BRANS_ANAHTARLARI)
const OZEL_SET = new Set<string>(KLINIK_YENI_SLUGS)
const MUTTEFIK_SET = new Set<string>(KLINIK_MUTTEFIK_SLUGS)

export const KAYIT_BRANS_MESAJ = {
  /** Shown when nothing is chosen (the browser check and the server answer are the same sentence). */
  gerekli: 'Lütfen branşınızı seçin.',
  /** Shown when the value is not one of the 40 (the form was bypassed). */
  gecersiz: 'Branş anlaşılamadı. Lütfen listeden seçin.',
  /** POST /api/users/brans on an account that already has a branch: that route records a missing branch, it does not switch one. */
  zatenKayitli: 'Branşınız zaten kayıtlı. Değiştirmek için bizimle iletişime geçin.',
} as const

/** true = exactly one of the 40 canonical keys (no label, no alias, no "Diğer", no "genel"). */
export function kayitBransiMi(ham: unknown): ham is string {
  return typeof ham === 'string' && ANAHTAR_SET.has(ham)
}

/** The display name of a key, or null. */
export function kayitBransAdi(anahtar: string): string | null {
  for (const g of KAYIT_BRANS_GRUPLARI) for (const s of g.secenekler) if (s.anahtar === anahtar) return s.ad
  return null
}

/** Which onboarding profession a key belongs to: a medical branch → doktor; a clinic doctor → klinik-uzman; allied → saglik-uzmani. */
export function kayitBransMeslegi(anahtar: string): 'doktor' | 'klinik-uzman' | 'saglik-uzmani' | null {
  if (!ANAHTAR_SET.has(anahtar)) return null
  if (!OZEL_SET.has(anahtar)) return 'doktor'
  return MUTTEFIK_SET.has(anahtar) ? 'saglik-uzmani' : 'klinik-uzman'
}

/** Onboarding professions whose account works in the doctor application and therefore MUST carry one of the 40. */
export const HEKIM_MESLEKLERI: readonly string[] = ['doktor', 'klinik-uzman', 'saglik-uzmani', 'psikolog']

/**
 * The branch a profile body names, as a canonical key, or null when it is not an acceptable one.
 *  • doktor — exactly one of the 40 keys (the onboarding select sends keys).
 *  • klinik-uzman / saglik-uzmani / psikolog — those screens send an Özel Branş slug (or the old "Psikoloji"); it is
 *    normalised the way the route always did (klinikUzmanlikNorm) and must then be one of the 10 Özel Branşlar.
 */
export function profilBransiCoz(meslek: unknown, ham: unknown): string | null {
  if (typeof ham !== 'string' || !ham.trim()) return null
  if (meslek === 'doktor') return kayitBransiMi(ham) ? ham : null
  const k = klinikUzmanlikNorm(ham)
  return OZEL_SET.has(k) ? k : null
}
