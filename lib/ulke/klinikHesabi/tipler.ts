/**
 * NOTYA-ULKE-KLINIK-01 — clinic accounts of a country build: the kit's constants and the shapes its routes answer
 * with. Client-safe: plain data and pure functions, no country's text.
 *
 * THE RULE THIS FILE WRITES DOWN ONCE: which position a capability may be given to. The database holds the same
 * table in a trigger (migration 145), and the server checks it again on every request (./yetki.ts).
 */
import { KLINIK_KONUMLARI, KLINIK_YETKI_TURLERI, type KlinikKonumu, type KlinikYetkiTuru } from '../tipler'
import type { RolTarafi } from '../arayuz/tipler'

export { KLINIK_KONUMLARI, KLINIK_YETKI_TURLERI, type KlinikKonumu, type KlinikYetkiTuru }

export const konumMu = (ham: unknown): ham is KlinikKonumu => typeof ham === 'string' && (KLINIK_KONUMLARI as readonly string[]).includes(ham)
export const yetkiTuruMu = (ham: unknown): ham is KlinikYetkiTuru => typeof ham === 'string' && (KLINIK_YETKI_TURLERI as readonly string[]).includes(ham)

/** Positions an invitation can give: every position but the owner's. */
export const DAVET_KONUMLARI: readonly KlinikKonumu[] = ['yonetici', 'hekim', 'muttefik', 'on-buro']

/** Capability → the positions of the member it may be GIVEN TO. */
export const YETKI_ALAN_KONUMLARI: Readonly<Record<KlinikYetkiTuru, readonly KlinikKonumu[]>> = {
  'on-buro-randevu': ['on-buro'],
  'on-buro-hasta': ['on-buro'],
  'on-buro-portal': ['on-buro'],
  paylasim: ['muttefik'],
  vekalet: ['hekim', 'sahip', 'yonetici'],
}

/**
 * Capability → the KIND OF ROLE the member must work as (the role an account chose, lib/ulke/uygulama/rol.ts), or
 * null where the capability needs none. A share is read by an allied professional; cover by a doctor. A member
 * without a role, or with a role of another kind, has no such capability — whatever their position.
 */
export const YETKI_ROL_TARAFLARI: Readonly<Record<KlinikYetkiTuru, readonly RolTarafi[] | null>> = {
  'on-buro-randevu': null,
  'on-buro-hasta': null,
  'on-buro-portal': null,
  paylasim: ['klinik-muttefik'],
  vekalet: ['doktor', 'klinik-hekim'],
}

/** A member whose patients a grant can be about: anybody but a front-desk member (who has none by position). */
export const hastaSahibiOlabilir = (konum: KlinikKonumu): boolean => konum !== 'on-buro'

/** true = a member in `yapan` may invite, remove or re-position a member in `hedef`. The owner: anybody but the owner. An administrator: doctors, allied professionals, front desk. */
export const yonetebilir = (yapan: KlinikKonumu, hedef: KlinikKonumu): boolean => hedef !== 'sahip' && (yapan === 'sahip' || (yapan === 'yonetici' && (hedef === 'hekim' || hedef === 'muttefik' || hedef === 'on-buro')))
export const yoneticiMi = (konum: KlinikKonumu): boolean => konum === 'sahip' || konum === 'yonetici'

export const KLINIK_ADI_AZAMI = 120
/** How many rows of the record one request answers with, newest first. */
export const KAYIT_LISTE_AZAMI = 200
/** How many patients a search through a grant answers with, and the fewest characters it takes. */
export const ARAMA_SONUC_AZAMI = 20
export const ARAMA_ASGARI_KARAKTER = 2

// ───────────────────────── what the routes answer with ─────────────────────────

export type KlinikUyesi = { hesapId: string; ad: string; konum: KlinikKonumu; /** A role key of the pack, or null. */ rol: string | null }
export type KlinikDaveti = { id: string; konum: KlinikKonumu; durum: 'acik' | 'kullanildi' | 'iptal' | 'suresi-doldu'; olusturuldu: string; sonGecerlilik: string }
export type KlinikGorunumu = { id: string; ad: string; konum: KlinikKonumu; uyeler: KlinikUyesi[] }

/** A grant as the doctor who gave it, or the member who holds it, sees it. Never a patient's data beyond the name of a shared patient, and that only for the doctor. */
export type KlinikYetkisi = {
  id: string
  tur: KlinikYetkiTuru
  hekimId: string
  alanId: string
  hastaId: string | null
  /** ISO instants, for cover only. */
  baslangic: string | null
  bitis: string | null
  kaydedenId: string
  olusturuldu: string
  /** ISO instant, or null while it stands. */
  iptal: string | null
  /** true = it opens something NOW: not withdrawn and, for cover, inside its period. */
  gecerli: boolean
}

export type ErisimOlayi = 'verildi' | 'geri-alindi' | 'bitti' | 'okuma' | 'yazma'
export const ERISIM_OLAYLARI: readonly ErisimOlayi[] = ['verildi', 'geri-alindi', 'bitti', 'okuma', 'yazma']
/** What a read or a write through a grant was, as the record names it. */
export const ERISIM_NELERI = [
  'randevu-listesi', 'hasta-arama', 'hasta-karti', 'hasta-olusturma', 'randevu-olusturma', 'randevu-degisiklik',
  'portal-baglantisi', 'form-istegi', 'not-listesi',
] as const
export type ErisimNesi = (typeof ERISIM_NELERI)[number]

export type ErisimKaydi = {
  id: string
  an: string
  olay: ErisimOlayi
  tur: KlinikYetkiTuru
  ne: ErisimNesi | null
  kisiId: string
  kisiAdi: string
  alanId: string
  alanAdi: string
  hastaId: string | null
  /** '' where the row names no patient, or the patient is no longer the doctor's. */
  hastaAdi: string
}

/** THE MINIMAL PATIENT CARD: everything a front-desk member ever sees of a patient. */
export type HastaKarti = { id: string; ad: string; otaIsmi: string; dogumTarihi: string; telefon: string }
export const HASTA_KARTI_ALANLARI: readonly (keyof HastaKarti)[] = ['id', 'ad', 'otaIsmi', 'dogumTarihi', 'telefon']

/** AN APPOINTMENT AS THE FRONT DESK SEES IT: time, patient name, status. No reason, no visit. */
export type OnBuroRandevusu = { id: string; hastaId: string; hastaAdi: string; baslangic: string; bitis: string; gun: string; saat: string; sureDk: number; durum: string; mesaiDisi: boolean }
export const ON_BURO_RANDEVU_ALANLARI: readonly (keyof OnBuroRandevusu)[] = ['id', 'hastaId', 'hastaAdi', 'baslangic', 'bitis', 'gun', 'saat', 'sureDk', 'durum', 'mesaiDisi']

/** A SLOT OF THE CLINIC'S SCHEDULE as the owner and an administrator see it: whose, when, whether it holds its time. No patient at all. */
export type KlinikTakvimDilimi = { hekimId: string; baslangic: string; bitis: string; gun: string; saat: string; sureDk: number; durum: string }
export const KLINIK_TAKVIM_ALANLARI: readonly (keyof KlinikTakvimDilimi)[] = ['hekimId', 'baslangic', 'bitis', 'gun', 'saat', 'sureDk', 'durum']
