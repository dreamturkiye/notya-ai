/**
 * NOTYA-PEDI-ONERI-01 (Kaan, 2026-10-07) — the right-hand öneriler panel ("Bu muayenede yapılması önerilenler",
 * MuayeneCekListesi) on the muayene dikte page follows the visit type chosen at booking, in pediatrics only.
 *
 * Where the type lives: randevular.hasta_durumu (migration 010), set in the randevu form's "Hasta Durumu" boxes:
 *   'saglikli'  = Sağlam  → sağlam çocuk muayenesi → panel shown
 *   'sikayetli' = Hasta   → hasta çocuk muayenesi  → panel hidden
 *   null / anything else (walk-in, old record, no box ticked) → treated as hasta çocuk → panel hidden
 * How it reaches the page: "Muayeneyi Başlat" on the randevu screen puts it in the URL (`hastaDurumu`, below).
 * Other branşlar keep today's behaviour (panel always shown). Pure, client-safe.
 */
import { etkinBrans } from '@/lib/specialties/kapsam'

export type RandevuHastaDurumu = 'saglikli' | 'sikayetli'

export function randevuHastaDurumu(v: unknown): RandevuHastaDurumu | null {
  return v === 'saglikli' || v === 'sikayetli' ? v : null
}

export function onerilerPaneliGorunurMu(g: { seansBransi?: string | null; doktorBransi?: string | null; hastaDurumu?: unknown }): boolean {
  if (etkinBrans({ seansBransi: g.seansBransi, doktorBransi: g.doktorBransi }) !== 'pediatri') return true
  return randevuHastaDurumu(g.hastaDurumu) === 'saglikli'
}

/** The dikte page URL for "Muayeneyi Başlat" on an appointment. */
export function muayeneBaslatYolu(r: { patientId: string | null; baslangic: string; hastaDurumu?: string | null }): string {
  const durum = randevuHastaDurumu(r.hastaDurumu)
  return `/session/new?patientId=${encodeURIComponent(String(r.patientId))}&randevuBaslangic=${encodeURIComponent(r.baslangic)}${durum ? `&hastaDurumu=${durum}` : ''}`
}
