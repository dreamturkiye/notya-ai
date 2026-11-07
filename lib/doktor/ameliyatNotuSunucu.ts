/**
 * AMELIYAT-NOTU-01 — server side of the operation note: which TEMPLATES a doctor receives (by the doctor's OWN branch,
 * never by a request parameter), and the encrypted storage of a note.
 *
 * brans-alan-sizmasi: a branch's templates are its chapter content. The registry below maps a branch to a loader of its
 * own template file; every other branch gets an empty list. Adding a branch's templates = one line here + that branch's
 * own file under specialties/<slug>/ — never a template in the core.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { klinikSlugCoz, type KlinikYeniSlug } from '@/lib/specialties/klinikDikey'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { ameliyatNotuOku, type AmeliyatNotuVeri, type AmeliyatSablonu } from './ameliyatNotu'

const SABLON_SAGLAYICILARI: Partial<Record<SpecialtyKey, () => Promise<readonly AmeliyatSablonu[]>>> = {
  'kadin-hastaliklari-dogum': () => import('@/specialties/kadin-dogum/engines/ameliyatSablonlari').then((m) => m.KD_AMELIYAT_SABLONLARI),
  // GENITAL-ESTETIK-01 (Kaan, 2026-11-06): the four genital-aesthetic templates (lib/doktor/genitalEstetikBrans.ts, scope 'cerrahi')
  'plastik-cerrahi': () => import('@/specialties/kadin-dogum/engines/genitalEstetikSablonlari').then((m) => m.GE_AMELIYAT_SABLONLARI),
}
/** Özel Branşlar with templates of their own, written out (an Özel Branş never falls through to a medical branch's list). */
const OZEL_SABLON_SAGLAYICILARI: Partial<Record<KlinikYeniSlug, () => Promise<readonly AmeliyatSablonu[]>>> = {
  'estetik-cerrahi': () => import('@/specialties/kadin-dogum/engines/genitalEstetikSablonlari').then((m) => m.GE_AMELIYAT_SABLONLARI),
}

/** The templates of THIS doctor's branch (users.specialty, any stored spelling — 'kadin-dogum' included). Unknown = none. */
export async function ameliyatSablonlariBransIcin(specialtyHam: string | null | undefined): Promise<readonly AmeliyatSablonu[]> {
  const ozel = klinikSlugCoz(specialtyHam)
  if (ozel) { const y = OZEL_SABLON_SAGLAYICILARI[ozel]; return y ? y() : [] }
  const k = bransAnahtari(specialtyHam)
  const yukle = k ? SABLON_SAGLAYICILARI[k] : undefined
  return yukle ? yukle() : []
}

/** The template a note may name: only one of the doctor's own branch. */
export async function sablonGecerliMi(specialtyHam: string | null | undefined, kod: unknown): Promise<string | null> {
  if (typeof kod !== 'string' || !kod) return null
  const liste = await ameliyatSablonlariBransIcin(specialtyHam)
  return liste.some((s) => s.kod === kod) ? kod : null
}

export const notuSifrele = (v: AmeliyatNotuVeri): string => encrypt(JSON.stringify(v))
export function notuCoz(sifreli: unknown): AmeliyatNotuVeri {
  try { return ameliyatNotuOku(JSON.parse(decrypt(String(sifreli || '')))) } catch { return ameliyatNotuOku(null) }
}

/** The doctor's specialty (users.specialty) — the ONLY input of the template choice. */
export async function doktorBransiOku(sb: SupabaseClient, doktorId: string): Promise<string | null> {
  const { data } = await sb.from('users').select('specialty').eq('id', doktorId).maybeSingle()
  return data?.specialty ? String(data.specialty) : null
}

/**
 * The letterhead every printout of the patient file uses (the gebelik print's rule, NOTYA-KHD-04): the doctor's name with
 * the STORED title (hekimAdi, OP-DR-01), the doctor's own letterhead lines, logo and diploma number, and the patient's
 * name and birth date — patient read with doctor_id (hasta-izolasyon).
 */
export async function yazdirmaBasligi(sb: SupabaseClient, doktorId: string, patientId: string): Promise<{ hastaAd: string; dogumTarihi: string | null; hekim: string; satirlar: string[]; logoDataUrl: string; diplomaNo: string }> {
  const { hekimAdi } = await import('@/lib/doktor/hekimAdi')
  const [{ data: hasta }, { data: user }, hekim] = await Promise.all([
    sb.from('patients').select('name_encrypted, dob_encrypted').eq('id', patientId).eq('doctor_id', doktorId).maybeSingle(),
    sb.from('users').select('recete_baslik').eq('id', doktorId).maybeSingle(),
    hekimAdi(sb, doktorId),
  ])
  const coz = (v: unknown) => { try { return v ? decrypt(String(v)) : '' } catch { return '' } }
  let hastaAd = ''
  try { const n = JSON.parse(coz(hasta?.name_encrypted)); hastaAd = [n.ad, n.soyad].filter(Boolean).join(' ') } catch { /* ad çözülemedi */ }
  const rb = (user?.recete_baslik && typeof user.recete_baslik === 'object' ? user.recete_baslik : {}) as { satirlar?: unknown; logoDataUrl?: unknown; diplomaNo?: unknown }
  return {
    hastaAd,
    dogumTarihi: coz(hasta?.dob_encrypted) || null,
    hekim,
    satirlar: Array.isArray(rb.satirlar) ? rb.satirlar.map((x) => String(x ?? '')).filter(Boolean) : [],
    logoDataUrl: String(rb.logoDataUrl || ''),
    diplomaNo: String(rb.diplomaNo || ''),
  }
}
