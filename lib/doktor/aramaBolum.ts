/**
 * Search chapters — one spine, closed specialty slices.
 * Do not statically import chapter engines (bundle leak).
 */
import { pediatrikBaglamMi } from '@/lib/specialties/kapsam'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import type { SorguAyik } from '@/lib/doktor/hastaAramaFiltre'

export type AramaBolumId = 'pediatri' | 'goz' | 'kd' | 'dahiliye' | 'derm'
export type AramaCevapTur = 'liste' | 'sayim' | 'pivot' | 'kohort' | 'sure' | 'kapali'

const SLICE_BRANS: Record<AramaBolumId, string[]> = {
  pediatri: ['pediatri', 'cocuk-cerrahisi'],
  goz: ['goz-hastaliklari'],
  kd: ['kadin-hastaliklari-dogum'],
  dahiliye: ['dahiliye'],
  derm: ['dermatoloji'],
}

export const BOLUM_AD: Record<AramaBolumId, string> = {
  pediatri: 'pediatri kohortu (M-CHAT, aşı planı, Neyzi, izlem)',
  goz: 'göz kohortu (OCT/GA, IVT, DR tarama)',
  kd: 'kadın hastalıkları kohortu (lohusa, OGTT, smear)',
  dahiliye: 'dahiliye kohortu (HbA1c, eGFR, LDL)',
  derm: 'dermatoloji kohortu (TBSE, yama, fototerapi)',
}

export function bolumBayraklari(q: SorguAyik): boolean {
  return q.bolumIstegi != null
}

export function aramaBolumuAc(q: SorguAyik, doktorBransi?: string | null): AramaBolumId | 'kapali' | null {
  const istenen = q.bolumIstegi
  if (!istenen) return null
  if (istenen === 'pediatri') return pediatrikBaglamMi({ doktorBransi }) ? 'pediatri' : 'kapali'
  const key = bransAnahtari(doktorBransi)
  if (key && SLICE_BRANS[istenen].includes(key)) return istenen
  return 'kapali'
}

export function cevapTuru(q: SorguAyik, bolum: ReturnType<typeof aramaBolumuAc>): AramaCevapTur {
  if (bolum === 'kapali') return 'kapali'
  if (bolum) return 'kohort'
  if (q.kirilim) return 'pivot'
  if (q.olcum === 'sure' || q.ucDeger || q.yasKirilim) return 'sure'
  if (q.olcum === 'asi' || q.olcum === 'ilac' || (q.sayim && !q.terimler.length && !q.veya.length)) return 'sayim'
  return 'liste'
}

export function kohortSatirUyar(
  s: { bayraklar: string[]; portalVar: boolean; patientId: string },
  q: SorguAyik,
  yakin: Set<string>,
): { ok: boolean; hatirlatilabilir: boolean } {
  if (q.portalYok && s.portalVar) return { ok: false, hatirlatilabilir: false }
  if (q.bayrakVe.length) {
    const kesisim = q.bayrakVe.filter((b) => s.bayraklar.includes(b))
    const ve = q.veya.length ? kesisim.length > 0 : q.bayrakVe.every((b) => s.bayraklar.includes(b))
    if (!ve) return { ok: false, hatirlatilabilir: false }
  }
  return { ok: true, hatirlatilabilir: !yakin.has(s.patientId) }
}
