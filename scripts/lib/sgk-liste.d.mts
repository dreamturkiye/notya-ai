/** Types for scripts/lib/sgk-liste.mjs (plain Node module used by scripts/import-sgk-ilac.mjs; tested from TypeScript). */
export interface KatalogKaydi {
  kamuNo?: string
  barkod: string
  ad: string
  marka: string
  esdegerGrubu?: string
  sgk?: boolean
  sgkDurum?: 'pasif' | 'cikarildi'
  sgkDurumTarihi?: string
  etkenMadde?: string
  atc?: string
  etkenKaynak?: string
  ruhsatAskida?: number
}
export interface ListeSatiri {
  kamuNo: string
  barkod: string
  ad: string
  esdegerGrubu: string
  eskiBarkodlar: string[]
  aktiflenme: string[]
  pasiflenme: string[]
  cikarma: boolean
}
export interface ListeRaporu {
  oncekiKayit: number
  eklenen: { barkod: string; ad: string }[]
  cikarilan: { barkod: string; ad: string }[]
  yenidenBarkodlanan: { eskiBarkod: string; barkod: string; ad: string }[]
  pasif: { barkod: string; ad: string; tarih: string }[]
  pasifBelirsiz: { barkod: string; ad: string; tarih: string }[]
  adiDegisen: { barkod: string; once: string; sonra: string }[]
  esdegerDegisen: { barkod: string; ad: string; once: string; sonra: string }[]
  yenidenOdenen: { barkod: string; ad: string }[]
  etkenKorunan: number
  etkensizYeni: { barkod: string; ad: string }[]
  toplam: number
  odenen: number
  odenmeyen: number
  etkenli: number
}
export const TITCK_ALANLARI: string[]
export function parcala(ilacAdi: unknown): { ad: string; marka: string }
export function esdegerGrubuTemizle(v: unknown): string
export function tarihleriCoz(hucre: unknown): string[]
export function pasifDurumu(aktiflenme: string[], pasiflenme: string[], listeTarihi?: string | null): { pasif: boolean; belirsiz: boolean; tarih: string | null }
export function barkodlar(hucre: unknown): string[]
export function listeyiBirlestir(
  mevcut: KatalogKaydi[],
  satirlar: ListeSatiri[],
  secenek?: { tamListe?: boolean; listeTarihi?: string | null },
): { ilaclar: KatalogKaydi[]; rapor: ListeRaporu }
