import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * HASTA-GORUNTU-GIZLILIK-01 (2026-10-26): `hasta-goruntuleme` is a PRIVATE storage bucket, like
 * every other patient-data bucket in this system (hasta-belgeler, mali-belgeler, ses-kayitlari) —
 * never public. `hasta_goruntulemeler.dosya_url` therefore stores only a storage REFERENCE
 * ("hasta-goruntuleme/<path>"), never a resolved URL (same convention as
 * app/api/doktor/belgeler/ingest/route.ts's `dosya_url = 'hasta-belgeler/' + uploadData.path`).
 * A short-lived signed URL is minted fresh on every read — never persisted, never public.
 */
const KOVA = 'hasta-goruntuleme'
const IMZALI_URL_SN = 1800 // 30 dk — galeri/değerlendirme ekranı açık kalsa da süre yetsin

/** Referanstan (veya eski bir tam public URL'den, geriye dönük) storage yolunu çözer. */
export function goruntuYolCoz(ref: string | null | undefined): string | null {
  const s = String(ref || '')
  if (!s) return null
  const prefix = `${KOVA}/`
  if (s.startsWith(prefix)) return s.slice(prefix.length)
  const marker = `/${KOVA}/`
  const idx = s.indexOf(marker)
  if (idx >= 0) return decodeURIComponent(s.slice(idx + marker.length))
  return null
}

/** Referansı kısa ömürlü imzalı URL'ye çevirir. Çözülemezse veya imzalama başarısızsa null döner —
 * hiçbir zaman ham referansı veya eski bir public URL'yi doğrudan geri vermez. */
export async function goruntuImzaliUrl(sb: SupabaseClient, ref: string | null | undefined): Promise<string | null> {
  const yol = goruntuYolCoz(ref)
  if (!yol) return null
  try {
    const { data, error } = await sb.storage.from(KOVA).createSignedUrl(yol, IMZALI_URL_SN)
    return error ? null : data?.signedUrl ?? null
  } catch {
    return null
  }
}
