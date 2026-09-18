/**
 * BRANS-ALAN-SIZMASI (Kaan 2026-09-17) — branşa özgü içerik yalnız o branşta görünür.
 *
 * Canlı hatalar (KD hekimi hesabı): Yaşamsal Bulgular formunda "Baş Çevresi" (pediatri ölçümü) ve
 * portala giden özette "Hasta/veli özeti" (pediatri hitabı). İkisi de ortak omurga bileşenlerine
 * koşulsuz yazılmıştı; SpecialtyProfile.olcumler ölçüm setini doğru ilan ediyordu ama hiçbir ekran
 * onu okumuyordu.
 *
 * Bu modül ortak omurganın (İnceleme, not sayfası, yazdır, SOAP üretimi, not-konsult) branşa göre
 * dallanan TEK karar noktasıdır. Çağıranlar branş anahtarına kendileri bakmaz:
 *   - pediatrikBaglamMi()  → veli dili, baş çevresi, Neyzi persentili, pediatrik prompt satırları
 *   - notOlcumleri()       → Yaşamsal Bulgular formunun alanları (profil.olcumler'den)
 *   - bransKapsami()       → sunucunun istemciye gönderdiği hazır paket (ölçümler + hitap metinleri)
 * Kural ve kontrol listesi: .cursor/skills/brans-alan-sizmasi/SKILL.md
 */
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { findSpecialistForSpecialty } from '@/lib/asistan/specialistsCatalog'
import { yasYilKesir } from '@/lib/doktor/hastaDosyaSekmeleri'
import { specialtyProfile } from './registry'
import { BRANSSIZ_PEDIATRIK_BAGLAM, PEDIATRIK_OLCUMLER, type OlcumAnahtari, type OlcumTanimi, type PediatrikBaglamKurali } from './profile'
import { hitapMetinleri, type HitapMetinleri } from './hitap'

/**
 * SOAP notunun `vitaller` hattının (çıkarım promptu → İnceleme → onay → yazdır/portal) taşıdığı anahtarlar.
 * Bölümün kendi ölçümleri (göz VA/GİB, KD SAT/fundus) kendi tablolarında yaşar; profil onları ilan etse de
 * not formuna bu set dışında alan girmez (bkz. OPEN: BRANS-ALAN-SIZMASI).
 */
export const NOT_VITAL_ANAHTARLARI: readonly OlcumAnahtari[] = ['ates', 'tansiyon', 'nabiz', 'solunum', 'spo2', 'kilo', 'boy', 'basCevresi']

const PEDIATRIK_ANAHTARLAR: ReadonlySet<string> = new Set(PEDIATRIK_OLCUMLER.map((o) => o.anahtar))

export interface KapsamGirdisi {
  /** sessions.specialty — muayenenin kendi branşı; gerçek bir branşsa kazanır (not, kaydedildiği bağlamda kalır) */
  seansBransi?: string | null
  /** users.specialty — seans branşı yok / "genel" ise yedek ('kadin-dogum' gibi eski değerler de çözülür) */
  doktorBransi?: string | null
  /** patients.dob (çözülmüş ISO) — yalnız 'cocuk-hastada' kuralında okunur */
  hastaDogumIso?: string | null
  nowMs?: number
}

/** Ham değer ('kadin-dogum', 'Kadın Hastalıkları ve Doğum', 'genel-cerrahi') → kanonik anahtar; "genel"/boş/bilinmeyen → null. */
export function bransAnahtari(ham: string | null | undefined): SpecialtyKey | null {
  if (!ham || !String(ham).trim()) return null
  return findSpecialistForSpecialty(String(ham))?.specialtyKey ?? null
}

/** Notun branşı: seans branşı (gerçek branşsa), yoksa hekimin branşı, yoksa null (branşsız). */
export function etkinBrans(g: KapsamGirdisi): SpecialtyKey | null {
  return bransAnahtari(g.seansBransi) ?? bransAnahtari(g.doktorBransi)
}

export function pediatrikBaglamKurali(brans: SpecialtyKey | null): PediatrikBaglamKurali {
  return brans ? specialtyProfile(brans).pediatrikBaglam : BRANSSIZ_PEDIATRIK_BAGLAM
}

/** Yaşı BİLİNEN ve 18'den küçük hasta. Bilinmeyen yaş çocuk sayılmaz — varsayılan sızmaz. */
export function cocukHastaMi(dogumIso: string | null | undefined, nowMs = Date.now()): boolean {
  const y = yasYilKesir(dogumIso, nowMs)
  return y != null && y >= 0 && y < 18
}

/** Veli dili / baş çevresi / Neyzi / pediatrik prompt satırları bu notta görünür mü? Tek karar noktası. */
export function pediatrikBaglamMi(g: KapsamGirdisi): boolean {
  const kural = pediatrikBaglamKurali(etkinBrans(g))
  if (kural === 'her-zaman') return true
  if (kural === 'asla') return false
  return cocukHastaMi(g.hastaDogumIso, g.nowMs)
}

export type NotOlcumu = Pick<OlcumTanimi, 'anahtar' | 'etiket' | 'birim'>

/** Yaşamsal Bulgular formunun alanları, sırasıyla — branş profilinden (ateş ilk), pediatrik ölçüm yalnız pediatrik bağlamda. */
export function notOlcumleri(g: KapsamGirdisi): NotOlcumu[] {
  const pediatrik = pediatrikBaglamMi(g)
  const profil = specialtyProfile(etkinBrans(g) ?? 'genel')
  return profil.olcumler
    .filter((o) => NOT_VITAL_ANAHTARLARI.includes(o.anahtar))
    .filter((o) => o.kosul !== 'pediatrik' || pediatrik)
    .map(({ anahtar, etiket, birim }) => ({ anahtar, etiket, birim }))
}

export interface BransKapsami {
  brans: SpecialtyKey | null
  pediatrik: boolean
  olcumler: NotOlcumu[]
  hitap: HitapMetinleri
}

/** Sunucu hesaplar, istemci yalnız çizer (not listesi / tek not / yazdır). */
export function bransKapsami(g: KapsamGirdisi): BransKapsami {
  const pediatrik = pediatrikBaglamMi(g)
  return { brans: etkinBrans(g), pediatrik, olcumler: notOlcumleri(g), hitap: hitapMetinleri(pediatrik) }
}

/**
 * Model çıktısı süzgeci: pediatrik olmayan bir not, modelin doldurduğu pediatrik ölçümü tutmaz
 * (ör. KD muayenesinde dikte edilen FETAL "baş çevresi" annenin vitaline yazılmasın). Yalnız pediatrik
 * anahtarları siler; diğer anahtarlara dokunmaz.
 */
export function vitalleriKapsamaGoreSuz<T>(vitaller: T, kapsam: Pick<BransKapsami, 'olcumler'>): T {
  if (!vitaller || typeof vitaller !== 'object' || Array.isArray(vitaller)) return vitaller
  const izinli = new Set(kapsam.olcumler.map((o) => o.anahtar as string))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(vitaller as Record<string, unknown>)) {
    if (PEDIATRIK_ANAHTARLAR.has(k) && !izinli.has(k)) continue
    out[k] = v
  }
  return out as T
}
