/**
 * NOTYA-HASTA-RAPORLARI-UNIFIED-01 — ONE doctor/clinic block for every patient report
 * (Hasta Raporları: the 6 existing SGK/Medula + özel muayenehane types, and the 4 new
 * Çocuk Hasta Raporları). Spec requirement: "Mandatory doctor/clinic block on every
 * report ... pulled from the doctor's profile" — never placeholder text.
 *
 * Reuses the SAME columns/resolvers the rest of the product already reads the doctor's
 * identity from (PORTAL-HEKIM-01 `lib/portal/hekimKarti.ts`, NOTYA-RECETE-03
 * `recete_baslik`, NOTYA-UNVAN-01 `hekimUnvanli`, NOTYA-EPIKRIZ-04 `resmiUzmanlikAdi`) —
 * no second "doctor profile" source is invented for this feature.
 *
 * Diploma Tescil Numarası: the product has exactly one place a doctor types this in
 * today — the reçete letterhead (`users.recete_baslik.diplomaNo`, NOTYA-RECETE-03). The
 * SGK rapor route additionally reads a Medula-integration-only copy
 * (`doctor_integrations.meta.diplomaTescilNo`) for doctors who linked Medula. This
 * helper prefers the reçete letterhead value (every doctor can fill it, Medula or not)
 * and falls back to the Medula one so the two existing sources stay consistent instead
 * of forking a third.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { hekimUnvanli } from '@/lib/doktor/hekimAdi'
import { resmiUzmanlikAdi } from '@/lib/doktor/bransAdlari'
import { hekimKartindanSatirlar } from '@/lib/portal/hekimKarti'

export type RaporDoktorBlogu = {
  /** "Dr. Ad Soyad" / "Prof. Dr. Ad Soyad" — hekimUnvanli (NOTYA-UNVAN-01), never doubled. */
  unvanliAdSoyad: string
  /** Resmî uzmanlık adı ("Çocuk Sağlığı ve Hastalıkları") — boş branş için ''. */
  uzmanlik: string
  klinikAdi: string | null
  adres: string | null
  telefon: string | null
  eposta: string | null
  diplomaTescilNo: string | null
}

/** PostgREST "column/table does not exist" — a migration the row doesn't have yet. Soft fallback, never throw. */
function kolonYokMu(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { code?: string; message?: string }
  if (['42P01', '42703', 'PGRST204', 'PGRST205'].includes(String(e.code || ''))) return true
  return /does not exist|schema cache|could not find the/i.test(String(e.message || ''))
}

type DoktorBlokRow = {
  full_name?: string | null
  specialty?: string | null
  clinic_name?: string | null
  recete_baslik?: unknown
  email?: string | null
  iletisim_telefon_varsayilan?: string | null
  iletisim_telefon_muayenehane?: string | null
  iletisim_whatsapp_muayenehane?: string | null
}

/** Her raporda aynı hekim/klinik bloğu — doktorun kendi profilinden, asla yer tutucu metinden. */
export async function raporDoktorBlogu(sb: SupabaseClient, doctorId: string): Promise<RaporDoktorBlogu> {
  const secim = 'full_name, specialty, clinic_name, recete_baslik, email, iletisim_telefon_varsayilan, iletisim_telefon_muayenehane, iletisim_whatsapp_muayenehane'
  let row: DoktorBlokRow | null = null
  const q = await sb.from('users').select(secim).eq('id', doctorId).maybeSingle()
  if (q.error && kolonYokMu(q.error)) {
    const eski = await sb.from('users').select('full_name, specialty, clinic_name, recete_baslik, email').eq('id', doctorId).maybeSingle()
    row = eski.data as DoktorBlokRow | null
  } else {
    row = q.data as DoktorBlokRow | null
  }

  const rb = (row?.recete_baslik && typeof row.recete_baslik === 'object' ? row.recete_baslik : {}) as {
    satirlar?: unknown
    diplomaNo?: unknown
  }
  const satirlar = Array.isArray(rb.satirlar) ? rb.satirlar.map((x) => String(x ?? '').trim()).filter(Boolean) : []

  // NOTYA-RECETE-03 letterhead first; NOTYA-SGK-RAPOR-02 Medula meta is the fallback (not duplicated here —
  // the caller that already has it, e.g. the sgk-rapor route, may still prefer its own value for that one screen).
  let diplomaTescilNo: string | null = String(rb.diplomaNo || '').trim() || null
  if (!diplomaTescilNo) {
    const med = await sb
      .from('doctor_integrations')
      .select('meta')
      .eq('user_id', doctorId)
      .eq('provider', 'medula')
      .eq('is_active', true)
      .maybeSingle()
    const meta = (med.data?.meta || {}) as { diplomaTescilNo?: string; sicilNo?: string }
    diplomaTescilNo = String(meta.diplomaTescilNo || meta.sicilNo || '').trim() || null
  }

  // adres/telefon: the SAME resolver Sağlığım's hekim kartı uses (PORTAL-HEKIM-01) — one source of truth.
  const kart = hekimKartindanSatirlar({
    fullName: row?.full_name ?? null,
    specialty: row?.specialty ?? null,
    clinicName: row?.clinic_name ?? null,
    satirlar,
    varsayilanTelefon: row?.iletisim_telefon_varsayilan ?? null,
    muayenehaneTelefon: row?.iletisim_telefon_muayenehane ?? null,
    whatsappMuayenehane: row?.iletisim_whatsapp_muayenehane ?? null,
  })

  return {
    unvanliAdSoyad: hekimUnvanli(row?.full_name || '') || 'Dr.',
    uzmanlik: row?.specialty ? resmiUzmanlikAdi(String(row.specialty)) : '',
    klinikAdi: kart.klinik || null,
    adres: kart.adres || null,
    telefon: kart.telefon || null,
    eposta: row?.email ? String(row.email).trim() || null : null,
    diplomaTescilNo,
  }
}

/** Doldurulmamış bir alan "— (profilde tamamlayın)" ile gösterilir — hiçbir rapor sahte veri yazmaz. */
export function raporDoktorAlani(v: string | null | undefined): string {
  const t = String(v || '').trim()
  return t || '— (profilde tamamlayın)'
}
