/**
 * NOTYA-HASTA-RAPORLARI-UNIFIED-01 — Çocuk Hasta Raporları (Araçlar → Hasta Raporları,
 * Pediatri + Çocuk Cerrahisi only; brans-alan-sızması gate: `cocukHastaRaporuBransiMi` /
 * `belgeTuruIzinliMi` in `belgeTurleri.ts`).
 *
 * Four report types the spec asks for:
 *   1. İstirahat Raporu       — okul/kreş devamsızlık raporu (adjustable rest days)
 *   2. Spor Yapabilir Raporu  — spor faaliyetine tıbbi sakınca yok kararı
 *   3. Kreşe Başlayabilir R.  — kreşe/gündüz bakıma başlama kararı
 *   4. Okul Raporu            — okula/derse/okul faaliyetine katılım kararı
 *
 * Wording follows the standard Turkish medical-report convention already used elsewhere
 * in this codebase for administrative clinical decisions (lib/sgk/raporTipleri.ts:
 * "istirahatlidir", "SUT'a göre...", "tıbbi sakınca yoktur" family of phrases). No single
 * official nationwide template for "Spor Yapabilir" / "Kreşe Başlayabilir" / "Okul Raporu"
 * exists to copy verbatim (checked: Sporcu Sağlık Raporları Yönetmeliği and MEB/okul
 * sağlık circulars describe WHO issues these and when, not a mandated sentence) — these
 * four wordings are the standard clinical-decision phrasing pattern, not a verbatim
 * government form. Flag for Dr. Gökhan's clinical sign-off before a doctor relies on the
 * exact sentence in production, the same way `onko-sut` already tells doctors "güncel
 * madde hekim doğrular" for its own drafted text.
 *
 * "Çocuğun" vs "hastanın" and the Anne/Baba Adı block: decided by patient AGE via the
 * shared gate (`veliOnamGerekliMi`, VELI-YASAL-ONAM) — never a branch check. A pediatri
 * patient is a minor by construction almost always, but the rule still reads the age.
 */
import { veliOnamGerekliMi } from '@/lib/specialties/kapsam'
import {
  COCUK_ISTIRAHAT_RAPORU,
  COCUK_KRESE_RAPORU,
  COCUK_OKUL_RAPORU,
  COCUK_SPOR_RAPORU,
} from '@/lib/doktor/belgeTurleri'

export type CocukRaporTipiId = 'istirahat' | 'spor' | 'krese' | 'okul'

export type CocukRaporTipiMeta = {
  id: CocukRaporTipiId
  label: string
  aciklama: string
  /** lib/doktor/belgeTurleri.ts — vault `category` ve branş kapısı aynı string. */
  belgeTuru: string
  /** Doktorun ayarlayabildiği değişken alan (spec: "adjustable fields (e.g. rest days)"). */
  gunAyarlanabilir: boolean
  gunMin: number
  gunMax: number
  gunVarsayilan: number
}

export const COCUK_RAPOR_TIPLERI: readonly CocukRaporTipiMeta[] = [
  {
    id: 'istirahat',
    label: 'İstirahat Raporu',
    aciklama: 'Okul/kreş devamsızlık raporu — başlangıç tarihi ve gün sayısı hekim tarafından ayarlanır.',
    belgeTuru: COCUK_ISTIRAHAT_RAPORU,
    gunAyarlanabilir: true,
    gunMin: 1,
    gunMax: 14,
    gunVarsayilan: 3,
  },
  {
    id: 'spor',
    label: 'Spor Yapabilir Raporu',
    aciklama: 'Spor faaliyetine katılımda tıbbi sakınca olmadığını bildiren karar raporu.',
    belgeTuru: COCUK_SPOR_RAPORU,
    gunAyarlanabilir: false,
    gunMin: 0,
    gunMax: 0,
    gunVarsayilan: 0,
  },
  {
    id: 'krese',
    label: 'Kreşe Başlayabilir Raporu',
    aciklama: 'Kreşe / gündüz bakım evine başlamada tıbbi sakınca olmadığını bildiren karar raporu.',
    belgeTuru: COCUK_KRESE_RAPORU,
    gunAyarlanabilir: false,
    gunMin: 0,
    gunMax: 0,
    gunVarsayilan: 0,
  },
  {
    id: 'okul',
    label: 'Okul Raporu',
    aciklama: 'Okula / derslere / okul faaliyetlerine katılımda tıbbi sakınca olmadığını bildiren karar raporu.',
    belgeTuru: COCUK_OKUL_RAPORU,
    gunAyarlanabilir: false,
    gunMin: 0,
    gunMax: 0,
    gunVarsayilan: 0,
  },
] as const

export function cocukRaporTipiById(id: string): CocukRaporTipiMeta | undefined {
  return COCUK_RAPOR_TIPLERI.find((t) => t.id === id)
}

/** 1–gunMax aralığına kilitle (tip.gunMin/gunMax). `|| tip.gunVarsayilan` would treat 0 as missing — it must clamp to gunMin instead. */
export function istirahatGunSinirla(tip: CocukRaporTipiMeta, n: number): number {
  const num = Number(n)
  const r = Number.isFinite(num) ? Math.round(num) : tip.gunVarsayilan
  return Math.min(tip.gunMax, Math.max(tip.gunMin, r))
}

/** Başlangıç + (gün − 1) → bitiş (YYYY-MM-DD, UTC takvim günü) — raporHesap.ts/istirahatRaporu ile aynı yöntem. */
export function istirahatBitisTarihi(baslangicIso: string, gunSayisi: number): string {
  const d = new Date(`${baslangicIso}T00:00:00Z`)
  if (isNaN(d.getTime())) return baslangicIso
  d.setUTCDate(d.getUTCDate() + Math.max(0, Math.round(gunSayisi) - 1))
  return d.toISOString().slice(0, 10)
}

export type CocukRaporHasta = {
  adSoyad: string
  dogumTarihiIso: string | null
  anneAdi?: string | null
  babaAdi?: string | null
}

/** veliOnamGerekliMi (VELI-YASAL-ONAM, yaş bazlı — branş değil): "çocuğun" mu "hastanın" mı, Anne/Baba Adı gösterilsin mi. */
export function veliGerekliMi(hasta: CocukRaporHasta, nowMs?: number): boolean {
  return veliOnamGerekliMi(hasta.dogumTarihiIso, nowMs)
}

function konu(hasta: CocukRaporHasta, nowMs?: number): string {
  return veliGerekliMi(hasta, nowMs) ? 'çocuğun' : 'hastanın'
}

function trTarih(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('tr-TR')
}

export type IstirahatDegiskenler = { baslangicTarihi: string; gunSayisi: number }
export type KararTarihDegiskenler = { tarih: string }

/** "… tarihinden … tarihine kadar istirahatlidir." */
export function istirahatRaporuMetni(hasta: CocukRaporHasta, d: IstirahatDegiskenler, nowMs?: number): string {
  const bitis = istirahatBitisTarihi(d.baslangicTarihi, d.gunSayisi)
  return `Yukarıda kimlik bilgileri yazılı ${konu(hasta, nowMs)} ${trTarih(d.baslangicTarihi)} tarihinden ${trTarih(bitis)} tarihine kadar (${d.gunSayisi} gün) istirahatlidir.`
}

/** "Spor yapmasında/faaliyetlerine katılmasında tıbbi bir sakınca yoktur." */
export function sporRaporuMetni(hasta: CocukRaporHasta, d: KararTarihDegiskenler, nowMs?: number): string {
  return `Yukarıda kimlik bilgileri yazılı ${konu(hasta, nowMs)} ${trTarih(d.tarih)} tarihi itibarıyla spor yapmasında ve spor faaliyetlerine katılmasında tıbbi bir sakınca yoktur.`
}

/** "Kreşe / gündüz bakım evine başlamasında tıbbi bir sakınca yoktur." */
export function kreseRaporuMetni(hasta: CocukRaporHasta, d: KararTarihDegiskenler, nowMs?: number): string {
  return `Yukarıda kimlik bilgileri yazılı ${konu(hasta, nowMs)} ${trTarih(d.tarih)} tarihi itibarıyla kreşe / gündüz bakım evine başlamasında tıbbi bir sakınca yoktur.`
}

/** "Okula / derslere / okul faaliyetlerine katılmasında tıbbi bir sakınca yoktur." */
export function okulRaporuMetni(hasta: CocukRaporHasta, d: KararTarihDegiskenler, nowMs?: number): string {
  return `Yukarıda kimlik bilgileri yazılı ${konu(hasta, nowMs)} ${trTarih(d.tarih)} tarihi itibarıyla okula, derslere ve okul faaliyetlerine katılmasında tıbbi bir sakınca yoktur.`
}

export function cocukRaporuMetniUret(
  tip: CocukRaporTipiMeta,
  hasta: CocukRaporHasta,
  d: IstirahatDegiskenler | KararTarihDegiskenler,
  nowMs?: number
): string {
  switch (tip.id) {
    case 'istirahat':
      return istirahatRaporuMetni(hasta, d as IstirahatDegiskenler, nowMs)
    case 'spor':
      return sporRaporuMetni(hasta, d as KararTarihDegiskenler, nowMs)
    case 'krese':
      return kreseRaporuMetni(hasta, d as KararTarihDegiskenler, nowMs)
    case 'okul':
      return okulRaporuMetni(hasta, d as KararTarihDegiskenler, nowMs)
    default:
      return ''
  }
}
