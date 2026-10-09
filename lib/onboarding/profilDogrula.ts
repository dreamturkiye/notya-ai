/**
 * NOTYA-ONBOARDING-01 (Kaan, 2026-10-09) — onboarding profil alanlarının doğrulaması ve users satırındaki yazıma
 * eşlenmesi. Pure, client-safe: ekran (app/onboarding/page.tsx) ve sunucu (app/api/users/profile/route.ts) aynı
 * kuralı kullanır; sunucu tarayıcının denetimine güvenmez.
 *
 * Neden eşleme tabloları var: canlı `public.users` tablosundaki CHECK kısıtları ekrandaki seçeneklerle AYNI
 * yazımda değil. Ekran "Uzm.Dr." gönderir, kısıt 'Uzm. Dr.' ister; ekran "Erkek" gönderir, kısıt 'male' ister;
 * ekran "[isim] Hocam" gönderir, kısıt 'named_hocam' ister. Eşlemeden yazmak kısıtı ihlal ederdi — bu yüzden
 * bu alanlar bugüne kadar yalnız auth metadata'ya yazılıyor, ürünün okuduğu users satırına hiç ulaşmıyordu.
 */
import type { AddressingPreference, DoctorTitle, Gender } from '../address'
import { doktorCepTelefonu } from './cepTelefonu'
import { KVKK_ONAY_HATASI, KVKK_ONAY_KODU, kvkkKarari } from './kvkkOnay'

/** Ekrandaki unvan seçenekleri (boşluksuz) → users.title CHECK kısıtının yazımı. TEK eşleme tablosu. */
export const UNVAN_ESLEME: Readonly<Record<string, DoctorTitle>> = {
  'Dr.': 'Dr.',
  'Uzm.Dr.': 'Uzm. Dr.',
  'Doç.Dr.': 'Doç. Dr.',
  'Prof.Dr.': 'Prof. Dr.',
}

/** Boşluk farkını yok sayar: "Uzm.Dr." da "Uzm. Dr." da 'Uzm. Dr.' olur; tabloda olmayan her şey null. */
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

/** Onboarding 1. adımdaki meslekler + eski kayıtlarda görülen 'mali_musavirlik'. */
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
/** Ad alanına yazılmış unvan — title + first_name + last_name birleştiren okuyucularda "Dr. Dr. …" çiftlemesin. */
const AD_UNVAN = /^(prof|doç|doc|uzm|op|dr|dt)\.?(\s|$)/i
const AD_AZAMI = 60

export type AlanSonucu = { ok: true; deger: string } | { ok: false; hata: string }

/** Baştaki/sondaki boşluk atılır, iç boşluklar teke iner; en az iki harf; harf, boşluk, tire, kesme, nokta. */
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
  /** Hesap onboarding'i İLK KEZ bitiriyor (users satırı yok ya da onboarding_completed değil). */
  ilkKayit: boolean
  /** Kayıtlı KVKK rızası var (bkz. kvkkKayitliMi). */
  kvkkKayitli: boolean
}

/** Doğrulanmış, users satırının yazımına çevrilmiş alanlar. Olmayan alan = gövdede gelmedi, yazılmaz. */
export type ProfilDegerleri = {
  firstName?: string
  lastName?: string
  title?: DoctorTitle
  hospital?: string
  gender?: Gender
  addressingPreference?: AddressingPreference
  /** +905XXXXXXXXX */
  cepTelefonu?: string
  /** Bu istek KVKK rızasını kaydetmeli (kayıt yoktu, hekim işaretledi). */
  kvkkDamgala: boolean
}

export type ProfilSonucu =
  | { ok: true; deger: ProfilDegerleri }
  | { ok: false; hata: string; alan: string; kod?: string }

/**
 * POST /api/users/profile gövdesi.
 *
 * İki kip:
 *  • ilkKayit — onboarding'in tek çağıranı (app/onboarding/page.tsx): her alan ZORUNLU ve geçerli olmalı.
 *  • ilkKayit değil — onboarding'i bitmiş hesabın çağrısı (ör. branş değiştirebilen iki süper kullanıcı):
 *    bugüne kadarki gibi hiçbir alan zorunlu değil; yalnız GÖNDERİLEN alan doğrulanır.
 */
export function profilGovdesiDogrula(govde: unknown, baglam: ProfilBaglami): ProfilSonucu {
  if (!govde || typeof govde !== 'object' || Array.isArray(govde)) return { ok: false, hata: PROFIL_MESAJ.govde, alan: 'govde' }
  const b = govde as Record<string, unknown>
  const zorunlu = baglam.ilkKayit
  const deger: ProfilDegerleri = { kvkkDamgala: false }

  // Meslek
  if (dolu(b.profession_type)) {
    if (typeof b.profession_type !== 'string' || !MESLEK_TURLERI.includes(b.profession_type)) return { ok: false, hata: PROFIL_MESAJ.meslek, alan: 'profession_type' }
  } else if (zorunlu) return { ok: false, hata: PROFIL_MESAJ.meslek, alan: 'profession_type' }
  const doktor = b.profession_type === 'doktor'

  // Uzmanlık — içerik (hangi branşlar) burada denetlenmez; yalnız biçim. Eski gövde adları da sayılır.
  const uzmanliklar = [b.specialty, b.uzmanlik_alani, b.uzmanlik].filter(dolu)
  for (const u of uzmanliklar) {
    if (typeof u !== 'string' || u.trim().length > 200) return { ok: false, hata: PROFIL_MESAJ.uzmanlikGecersiz, alan: 'specialty' }
  }
  if (zorunlu && !uzmanliklar.length) return { ok: false, hata: PROFIL_MESAJ.uzmanlik, alan: 'specialty' }

  // Unvan (yalnız hekimde zorunlu)
  if (dolu(b.title)) {
    const t = unvanEsle(b.title)
    if (!t) return { ok: false, hata: PROFIL_MESAJ.unvanGecersiz, alan: 'title' }
    deger.title = t
  } else if (zorunlu && doktor) return { ok: false, hata: PROFIL_MESAJ.unvan, alan: 'title' }

  // Klinik / hastane adı (isteğe bağlı)
  if (dolu(b.hospital)) {
    const h = metin(b.hospital)
    if (h == null || h.length > 160) return { ok: false, hata: PROFIL_MESAJ.kurum, alan: 'hospital' }
    deger.hospital = h.replace(/\s+/g, ' ')
  }

  // Ad, soyad
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
  // Eski gövde: tek alan full_name (bugün hiçbir ekran göndermiyor) — yalnız biçim.
  if (dolu(b.full_name) && (typeof b.full_name !== 'string' || b.full_name.trim().length > 120)) return { ok: false, hata: PROFIL_MESAJ.adSoyad, alan: 'full_name' }

  // Cep telefonu
  const hamTelefon = dolu(b.cepTelefonu) ? b.cepTelefonu : b.cep_telefonu
  if (dolu(hamTelefon) || zorunlu) {
    const s = doktorCepTelefonu(hamTelefon)
    if (!s.ok) return { ok: false, hata: s.hata, alan: 'cepTelefonu' }
    deger.cepTelefonu = s.deger
  }

  // Cinsiyet
  if (dolu(b.gender)) {
    const g = cinsiyetEsle(b.gender)
    if (!g) return { ok: false, hata: PROFIL_MESAJ.cinsiyet, alan: 'gender' }
    deger.gender = g
  } else if (zorunlu) return { ok: false, hata: PROFIL_MESAJ.cinsiyet, alan: 'gender' }

  // Hitap tercihi — iki gövde adı da (addressingPreference: onboarding; addressing_preference: eski)
  const hamHitap = dolu(b.addressingPreference) ? b.addressingPreference : b.addressing_preference
  if (dolu(hamHitap)) {
    const h = hitapEsle(hamHitap)
    if (!h) return { ok: false, hata: PROFIL_MESAJ.hitap, alan: 'addressingPreference' }
    deger.addressingPreference = h
  } else if (zorunlu) return { ok: false, hata: PROFIL_MESAJ.hitap, alan: 'addressingPreference' }

  // KVKK — en sonda: önce düzeltilebilir alan hataları gösterilsin.
  const karar = kvkkKarari({ kayitli: baglam.kvkkKayitli, ilkKayit: baglam.ilkKayit, isaretlendi: b.kvkk_onay })
  if (karar.reddet) return { ok: false, hata: KVKK_ONAY_HATASI, alan: 'kvkk_onay', kod: KVKK_ONAY_KODU }
  deger.kvkkDamgala = karar.damgala

  return { ok: true, deger }
}

/**
 * users.cep_telefonu kolonu henüz yok mu (migration 150 uygulanmadan deploy)? PostgREST şema önbelleği
 * (PGRST204) ya da Postgres "undefined column" (42703) — ve hata bu kolonu adıyla anıyorsa. Başka hiçbir hata
 * bu yola girmez.
 */
export function cepTelefonuKolonuYokMu(hata: unknown): boolean {
  const e = (hata && typeof hata === 'object' ? hata : null) as { code?: unknown; message?: unknown } | null
  if (!e) return false
  const kod = String(e.code ?? '')
  return (kod === 'PGRST204' || kod === '42703') && String(e.message ?? '').includes('cep_telefonu')
}
