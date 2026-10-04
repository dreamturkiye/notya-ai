/**
 * NOTYA-TAKIP-01 — patient-portal view of open follow-ups (no diagnosis / dose).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { bugunTrIso } from '@/lib/iletisim/sablonlar'
import { takipAcikListe, takipSirala } from './oku'
import { portalKontrolEtiketi } from './vade'

type Sb = SupabaseClient

/**
 * Earliest open kontrol (or gelmedi needing a rebook) → Sağlığım summary chip text.
 * Returns null when nothing is due — HomeHero shows "Planlanmadı".
 */
export async function portalYaklasanKontrol(
  sb: Sb,
  doktorId: string,
  patientId: string,
  bugunIso: string = bugunTrIso(),
): Promise<string | null> {
  const liste = takipSirala(
    await takipAcikListe(sb, doktorId, {
      patientId,
      turler: ['kontrol', 'gelmedi'],
      isimlerle: false,
      limit: 10,
    }),
    bugunIso,
  )
  const kontrol = liste.find((t) => t.tur === 'kontrol' && t.vade)
  if (kontrol?.vade) return portalKontrolEtiketi(kontrol.vade, bugunIso)
  if (liste.some((t) => t.tur === 'gelmedi')) return 'Yeni randevu önerisi bekleniyor'
  return null
}

/** ISO date for chapter modules that accept sonrakiKontrolIso — only non-conditional kontrol. */
export async function portalSonrakiKontrolIso(
  sb: Sb,
  doktorId: string,
  patientId: string,
): Promise<string | null> {
  const liste = await takipAcikListe(sb, doktorId, {
    patientId,
    turler: ['kontrol'],
    isimlerle: false,
    limit: 5,
  })
  const k = liste.find((t) => t.vade && !t.kosullu)
  return k?.vade || null
}
