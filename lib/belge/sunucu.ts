/**
 * BELGE-NO-01 — the SERVER side of document numbers: register a printed version, and answer the public verify page.
 * Server only. Shared by every build: the caller hands in the way it reaches the database (`Islev`), so the Türkiye
 * build calls the functions with its own country code ('tr') and a country build calls them through its one door
 * (lib/ulke/uygulama/tablolar.ts → ulkeIslevi, which adds the build's country). The functions (migration 188) do the
 * work in one transaction with a row lock: a document number per (country, doctor, type, source), a new revision only
 * when the content hash changes, a reason required from revision 1, and versions that can never be changed or removed.
 *
 * PATIENT ISOLATION (.cursor/skills/hasta-izolasyon): the caller has ALREADY checked that the source record belongs to
 * the authenticated doctor. The patient id is stored for that doctor's own lists and is never returned by the verify
 * function, which knows only the verify code.
 */
import { BELGE_NO_RE, DOGRULAMA_KODU_RE, belgeTuruMu, gerekceGecerli, yeniBelgeNo, yeniDogrulamaKodu, type BelgeKunyesi, type DogrulamaSonucu } from './belge'

/** One call of a database function: the build supplies it (with its country), the shared code never builds one. */
export type Islev = (ad: 'belge_surum_ekle' | 'belge_dogrula', argumanlar: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message?: string; code?: string } | null }>

export type KayitGirdisi = {
  doktorId: string
  hastaId: string | null
  tur: string
  kaynakId: string
  ozet: string
  /** The doctor's title and name as printed (not a patient's). */
  hekim: string
  gerekce?: string | null
}
export type KayitSonucu =
  | { durum: 'tamam'; kunye: BelgeKunyesi; yeni: boolean }
  | { durum: 'gerekce_gerekli'; kunye: BelgeKunyesi }
  | { durum: 'gecersiz' | 'hata' }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function kayitGirdisiGecerli(g: KayitGirdisi): boolean {
  return UUID.test(g.doktorId) && (g.hastaId === null || UUID.test(g.hastaId)) && belgeTuruMu(g.tur)
    && /^[A-Za-z0-9:_-]{1,80}$/.test(g.kaynakId) && /^[0-9a-f]{64}$/.test(g.ozet)
    && typeof g.hekim === 'string' && g.hekim.trim().length > 0 && g.hekim.length <= 160
    && (g.gerekce == null || (typeof g.gerekce === 'string' && g.gerekce.length <= 500))
}

type HamKayit = { durum?: string; belge_no?: string; rev?: number; tarih?: string; kod?: string; ozet?: string; yeni?: boolean }
const kunye = (r: HamKayit): BelgeKunyesi | null =>
  r.belge_no && BELGE_NO_RE.test(r.belge_no) && typeof r.rev === 'number' && r.tarih && r.kod && DOGRULAMA_KODU_RE.test(r.kod) && r.ozet
    ? { belgeNo: r.belge_no, rev: r.rev, tarih: r.tarih, dogrulamaKodu: r.kod, ozet: r.ozet }
    : null

/** Register what is about to be printed. A collision of a random number or code is retried (twice). */
export async function belgeKaydet(islev: Islev, g: KayitGirdisi): Promise<KayitSonucu> {
  if (!kayitGirdisiGecerli(g)) return { durum: 'gecersiz' }
  const gerekce = typeof g.gerekce === 'string' && g.gerekce.trim() ? g.gerekce.trim() : null
  for (let deneme = 0; deneme < 3; deneme++) {
    const { data, error } = await islev('belge_surum_ekle', {
      p_doctor_id: g.doktorId, p_patient_id: g.hastaId, p_tur: g.tur, p_kaynak_id: g.kaynakId, p_ozet: g.ozet,
      p_hekim: g.hekim.trim(), p_gerekce: gerekce, p_belge_no: yeniBelgeNo(), p_kod: yeniDogrulamaKodu(),
    })
    if (error) {
      if (error.code === '23505') continue // a random number or code that already exists: draw again
      return { durum: 'hata' }
    }
    const r = (Array.isArray(data) ? data[0] : data) as HamKayit | null
    const k = r ? kunye(r) : null
    if (!r || !k) return { durum: 'hata' }
    if (r.durum === 'gerekce_gerekli') return { durum: 'gerekce_gerekli', kunye: k }
    if (r.durum === 'tamam') return { durum: 'tamam', kunye: k, yeni: r.yeni === true }
    return { durum: 'hata' }
  }
  return { durum: 'hata' }
}

/** The public answer for a verify code: non-patient data only, or null. */
export async function belgeDogrula(islev: Islev, kod: unknown): Promise<DogrulamaSonucu | null> {
  if (typeof kod !== 'string' || !DOGRULAMA_KODU_RE.test(kod)) return null
  const { data, error } = await islev('belge_dogrula', { p_kod: kod })
  if (error) return null
  const r = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
  if (!r || typeof r.belge_no !== 'string') return null
  return {
    belgeNo: r.belge_no, rev: Number(r.rev), tarih: String(r.tarih), hekim: String(r.hekim || ''),
    guncel: r.guncel === true, guncelRev: Number(r.guncel_rev), ozet: String(r.ozet || ''),
  }
}

export { gerekceGecerli }
