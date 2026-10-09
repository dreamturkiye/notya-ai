/**
 * NOTYA-ONBOARDING-01 (Kaan, 2026-10-09) — validation of the onboarding profile fields and their mapping to the
 * spellings the users row accepts. Pure and client-safe: the screen (app/onboarding/page.tsx) and the server
 * (app/api/users/profile/route.ts) apply the same rule; the server does not rely on the browser's checks.
 *
 * Why there are mapping tables: the CHECK constraints on the live `public.users` table do NOT use the spellings
 * of the options on the screen. The screen sends "Uzm.Dr.", the constraint wants 'Uzm. Dr.'; the screen sends
 * "Erkek", the constraint wants 'male'; the screen sends "[isim] Hocam", the constraint wants 'named_hocam'.
 * Writing them unmapped would violate the constraint — which is why these answers went only into auth metadata
 * until now and never reached the users row the product reads.
 */
import type { AddressingPreference, DoctorTitle, Gender } from '../address'
import { doktorCepTelefonu } from './cepTelefonu'
import { KVKK_ONAY_HATASI, KVKK_ONAY_KODU, kvkkKarari } from './kvkkOnay'

/** Title options on the screen (no spaces) → the spelling of the users.title CHECK constraint. The ONE mapping table. */
export const UNVAN_ESLEME: Readonly<Record<string, DoctorTitle>> = {
  'Dr.': 'Dr.',
  'Uzm.Dr.': 'Uzm. Dr.',
  'Doç.Dr.': 'Doç. Dr.',
  'Prof.Dr.': 'Prof. Dr.',
}

/** Ignores spacing: both "Uzm.Dr." and "Uzm. Dr." become 'Uzm. Dr.'; anything not in the table is null. */
export function unvanEsle(ham: unknown): DoctorTitle | null {
  if (typeof ham !== 'string') return null
  return UNVAN_ESLEME[ham.replace(/\s+/g, '')] ?? null
}

/** users.gender CHECK ('male','female'). */
export const CINSIYET_ESLEME: Readonly<Record<string, Gender>> = { Erkek: 'male', Kadın: 'female', male: 'male', female: 'female' }
export function cinsiyetEsle(ham: unknown): Gender | null {
  return typeof ham === 'string' ? CINSIYET_ESLEME[ham.trim()] ?? null : null
}

/** users.addressing_preference CHECK ('hocam','named_hocam','first_name_only'). */
export const HITAP_ESLEME: Readonly<Record<string, AddressingPreference>> = {
  Hocam: 'hocam',
  '[isim] Hocam': 'named_hocam',
  'First name only': 'first_name_only',
  hocam: 'hocam',
  named_hocam: 'named_hocam',
  first_name_only: 'first_name_only',
}
export function hitapEsle(ham: unknown): AddressingPreference | null {
  return typeof ham === 'string' ? HITAP_ESLEME[ham.trim()] ?? null : null
}

/** The professions of onboarding step 1, plus 'mali_musavirlik' seen in older rows. */
export const MESLEK_TURLERI: readonly string[] = ['doktor', 'klinik-uzman', 'saglik-uzmani', 'mali', 'avukat', 'psikolog', 'mali_musavirlik']

export const AD_MESAJ = {
  ad: {
    bos: 'Lütfen adınızı yazın.',
    kisa: 'Adınız en az iki harf olmalı.',
    karakter: 'Adınızda yalnızca harf kullanın.',
    uzun: 'Adınız çok uzun görünüyor. Lütfen kontrol edin.',
    unvan: 'Unvanınızı önceki adımda seçtiniz; buraya yalnızca adınızı yazın.',
  },
  soyad: {
    bos: 'Lütfen soyadınızı yazın.',
    kisa: 'Soyadınız en az iki harf olmalı.',
    karakter: 'Soyadınızda yalnızca harf kullanın.',
    uzun: 'Soyadınız çok uzun görünüyor. Lütfen kontrol edin.',
    unvan: 'Unvanınızı önceki adımda seçtiniz; buraya yalnızca soyadınızı yazın.',
  },
} as const

const AD_KARAKTER = /^[\p{L}][\p{L}\s.'’-]*$/u
/** A title typed into the name field — so readers that join title + first_name + last_name never show "Dr. Dr. …". */
const AD_UNVAN = /^(prof|doç|doc|uzm|op|dr|dt)\.?(\s|$)/i
const AD_AZAMI = 60

export type AlanSonucu = { ok: true; deger: string } | { ok: false; hata: string }

/** Trimmed, inner whitespace collapsed; at least two letters; letters, space, hyphen, apostrophe, full stop. */
export function adDogrula(ham: unknown, alan: 'ad' | 'soyad'): AlanSonucu {
  const m = AD_MESAJ[alan]
  if (ham != null && typeof ham !== 'string') return { ok: false, hata: m.karakter }
  const t = String(ham ?? '').replace(/\s+/g, ' ').trim()
  if (!t) return { ok: false, hata: m.bos }
  if (!AD_KARAKTER.test(t)) return { ok: false, hata: m.karakter }
  if ((t.match(/\p{L}/gu) || []).length < 2) return { ok: false, hata: m.kisa }
  if (t.length > AD_AZAMI) return { ok: false, hata: m.uzun }
  if (AD_UNVAN.test(t)) return { ok: false, hata: m.unvan }
  return { ok: true, deger: t }
}

export const PROFIL_MESAJ = {
  govde: 'Geçersiz istek gövdesi.',
  meslek: 'Lütfen çalıştığınız alanı seçin.',
  uzmanlik: 'Lütfen uzmanlık alanınızı seçin.',
  uzmanlikGecersiz: 'Uzmanlık alanı anlaşılamadı. Lütfen listeden seçin.',
  unvan: 'Lütfen unvanınızı seçin.',
  unvanGecersiz: 'Unvan anlaşılamadı. Lütfen listeden seçin.',
  kurum: 'Klinik / hastane adı çok uzun görünüyor. Lütfen kısaltın.',
  cinsiyet: 'Lütfen cinsiyet seçin.',
  hitap: 'Lütfen hitap tercihinizi seçin.',
  adSoyad: 'Ad soyad anlaşılamadı. Lütfen kontrol edin.',
} as const

const metin = (v: unknown): string | null => (typeof v === 'string' ? v.trim() : null)
const dolu = (v: unknown): boolean => v != null && !(typeof v === 'string' && !v.trim())

export type ProfilBaglami = {
  /** The account is finishing onboarding for the FIRST time (no users row, or onboarding_completed is not set). */
  ilkKayit: boolean
  /** KVKK consent is on record (see kvkkKayitliMi). */
  kvkkKayitli: boolean
}

/** Validated fields in the spelling of the users row. A missing field = not sent in the body, not written. */
export type ProfilDegerleri = {
  firstName?: string
  lastName?: string
  title?: DoctorTitle
  hospital?: string
  gender?: Gender
  addressingPreference?: AddressingPreference
  /** +905XXXXXXXXX */
  cepTelefonu?: string
  /** This request must record KVKK consent (none on record, the doctor ticked the box). */
  kvkkDamgala: boolean
}

export type ProfilSonucu =
  | { ok: true; deger: ProfilDegerleri }
  | { ok: false; hata: string; alan: string; kod?: string }

/**
 * The body of POST /api/users/profile.
 *
 * Two modes:
 *  • ilkKayit — the one caller, onboarding (app/onboarding/page.tsx): every field is REQUIRED and must be valid.
 *  • not ilkKayit — a call from an account that already finished onboarding (e.g. the two superusers who may
 *    switch branch): as before, no field is required; only a field that IS sent is validated.
 */
export function profilGovdesiDogrula(govde: unknown, baglam: ProfilBaglami): ProfilSonucu {
  if (!govde || typeof govde !== 'object' || Array.isArray(govde)) return { ok: false, hata: PROFIL_MESAJ.govde, alan: 'govde' }
  const b = govde as Record<string, unknown>
  const zorunlu = baglam.ilkKayit
  const deger: ProfilDegerleri = { kvkkDamgala: false }

  // Profession
  if (dolu(b.profession_type)) {
    if (typeof b.profession_type !== 'string' || !MESLEK_TURLERI.includes(b.profession_type)) return { ok: false, hata: PROFIL_MESAJ.meslek, alan: 'profession_type' }
  } else if (zorunlu) return { ok: false, hata: PROFIL_MESAJ.meslek, alan: 'profession_type' }
  const doktor = b.profession_type === 'doktor'

  // Specialty — the content (which branches exist) is not checked here, only the shape. Old body names count too.
  const uzmanliklar = [b.specialty, b.uzmanlik_alani, b.uzmanlik].filter(dolu)
  for (const u of uzmanliklar) {
    if (typeof u !== 'string' || u.trim().length > 200) return { ok: false, hata: PROFIL_MESAJ.uzmanlikGecersiz, alan: 'specialty' }
  }
  if (zorunlu && !uzmanliklar.length) return { ok: false, hata: PROFIL_MESAJ.uzmanlik, alan: 'specialty' }

  // Title (required for doctors only)
  if (dolu(b.title)) {
    const t = unvanEsle(b.title)
    if (!t) return { ok: false, hata: PROFIL_MESAJ.unvanGecersiz, alan: 'title' }
    deger.title = t
  } else if (zorunlu && doktor) return { ok: false, hata: PROFIL_MESAJ.unvan, alan: 'title' }

  // Clinic / hospital name (optional)
  if (dolu(b.hospital)) {
    const h = metin(b.hospital)
    if (h == null || h.length > 160) return { ok: false, hata: PROFIL_MESAJ.kurum, alan: 'hospital' }
    deger.hospital = h.replace(/\s+/g, ' ')
  }

  // First name, last name
  if (dolu(b.firstName) || zorunlu) {
    const s = adDogrula(b.firstName, 'ad')
    if (!s.ok) return { ok: false, hata: s.hata, alan: 'firstName' }
    deger.firstName = s.deger
  }
  if (dolu(b.lastName) || zorunlu) {
    const s = adDogrula(b.lastName, 'soyad')
    if (!s.ok) return { ok: false, hata: s.hata, alan: 'lastName' }
    deger.lastName = s.deger
  }
  // Old body: the single field full_name (no screen sends it today) — shape only.
  if (dolu(b.full_name) && (typeof b.full_name !== 'string' || b.full_name.trim().length > 120)) return { ok: false, hata: PROFIL_MESAJ.adSoyad, alan: 'full_name' }

  // Mobile number
  const hamTelefon = dolu(b.cepTelefonu) ? b.cepTelefonu : b.cep_telefonu
  if (dolu(hamTelefon) || zorunlu) {
    const s = doktorCepTelefonu(hamTelefon)
    if (!s.ok) return { ok: false, hata: s.hata, alan: 'cepTelefonu' }
    deger.cepTelefonu = s.deger
  }

  // Gender
  if (dolu(b.gender)) {
    const g = cinsiyetEsle(b.gender)
    if (!g) return { ok: false, hata: PROFIL_MESAJ.cinsiyet, alan: 'gender' }
    deger.gender = g
  } else if (zorunlu) return { ok: false, hata: PROFIL_MESAJ.cinsiyet, alan: 'gender' }

  // Form of address — both body names (addressingPreference: onboarding; addressing_preference: old)
  const hamHitap = dolu(b.addressingPreference) ? b.addressingPreference : b.addressing_preference
  if (dolu(hamHitap)) {
    const h = hitapEsle(hamHitap)
    if (!h) return { ok: false, hata: PROFIL_MESAJ.hitap, alan: 'addressingPreference' }
    deger.addressingPreference = h
  } else if (zorunlu) return { ok: false, hata: PROFIL_MESAJ.hitap, alan: 'addressingPreference' }

  // KVKK — last, so that fixable field errors are shown first.
  const karar = kvkkKarari({ kayitli: baglam.kvkkKayitli, ilkKayit: baglam.ilkKayit, isaretlendi: b.kvkk_onay })
  if (karar.reddet) return { ok: false, hata: KVKK_ONAY_HATASI, alan: 'kvkk_onay', kod: KVKK_ONAY_KODU }
  deger.kvkkDamgala = karar.damgala

  return { ok: true, deger }
}

/**
 * Is the users.cep_telefonu column missing (deployed before migration 150 was applied)? PostgREST's schema
 * cache (PGRST204) or Postgres "undefined column" (42703) — and only when the error names this column. No other
 * error takes this path.
 */
export function cepTelefonuKolonuYokMu(hata: unknown): boolean {
  const e = (hata && typeof hata === 'object' ? hata : null) as { code?: unknown; message?: unknown } | null
  if (!e) return false
  const kod = String(e.code ?? '')
  return (kod === 'PGRST204' || kod === '42703') && String(e.message ?? '').includes('cep_telefonu')
}
