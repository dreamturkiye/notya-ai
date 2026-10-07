/**
 * Branş listesi, açılış sayfasındaki deneme formu ile /kayit arasında ortaktır.
 * Kayıtlı değer, onboarding'deki hekim listesiyle aynı metindir (KBB → Kulak Burun Boğaz);
 * users.specialty ancak onboarding bitince yazılır, böylece sihirbaz atlanmaz.
 */

export const KAYIT_BRANSLARI = [
  'Pediatri',
  'Kardiyoloji',
  'Nöroloji',
  'Dahiliye',
  'Psikiyatri',
  'Genel Cerrahi',
  'Ortopedi',
  'Dermatoloji',
  'KBB',
  'Göz Hastalıkları',
  'Kadın Hastalıkları ve Doğum',
  'Üroloji',
  'Radyoloji',
  'Anestezi',
  'Acil Tıp',
  'Fizik Tedavi',
  'Enfeksiyon Hastalıkları',
  'Endokrinoloji',
  'Gastroenteroloji',
  'Nefroloji',
  'Romatoloji',
  'Onkoloji',
  'Göğüs Hastalıkları',
  'Göğüs Cerrahisi',
  'Plastik Cerrahi',
  'Beyin Cerrahisi',
  'Kalp Damar Cerrahisi',
  'Çocuk Cerrahisi',
  'Aile Hekimliği',
  'Spor Hekimliği',
  'Diğer',
] as const

/** Açılış etiketinden, onboarding seçeneğine. Yalnız KBB kısa yazılır. */
const ONBOARDING_KARSILIGI: Record<string, string> = {
  KBB: 'Kulak Burun Boğaz',
}

const LISTE = new Set<string>(KAYIT_BRANSLARI)

/** Açılış formundaki etiket. Normalize edilmiş değer de kabul edilir (KBB ↔ Kulak Burun Boğaz). */
export function kayitBransiListeDegeri(ham: string | null | undefined): string | null {
  const t = String(ham ?? '').trim()
  if (!t) return null
  if (LISTE.has(t)) return t
  const geri = Object.entries(ONBOARDING_KARSILIGI).find(([, deger]) => deger === t)?.[0]
  return geri && LISTE.has(geri) ? geri : null
}

/** Hesaba yazılan branş metni. Listede yoksa null. */
export function kayitBransiNorm(ham: string | null | undefined): string | null {
  const liste = kayitBransiListeDegeri(ham)
  if (!liste) return null
  return ONBOARDING_KARSILIGI[liste] ?? liste
}

export function adSoyadBol(adSoyad: string | null | undefined): { ad: string; soyad: string } | null {
  const parcalar = String(adSoyad ?? '').trim().split(/\s+/).filter(Boolean)
  if (parcalar.length < 2) return null
  const ad = parcalar[0]
  const soyad = parcalar.slice(1).join(' ')
  if (ad.length < 2 || soyad.length < 2) return null
  if (!/\p{L}/u.test(ad) || !/\p{L}/u.test(soyad)) return null
  return { ad, soyad }
}

/** Görünen ad: fazla boşluklar alınır, ad ve soyad zorunlu, 120 karakter sınırı. */
export function adSoyadTemiz(ham: string | null | undefined): string | null {
  const t = String(ham ?? '').replace(/\s+/g, ' ').trim()
  if (t.length < 3 || t.length > 120) return null
  return adSoyadBol(t) ? t : null
}
