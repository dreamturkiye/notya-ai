/**
 * AU-PMS — vendor adapters.
 * - Cliniko: live REST when clinic API key is present (self-serve; disable with NOTYA_PMS_CLINIKO_ETKIN=0).
 * - Genie / Gentu: Magentus Partner API when OAuth + x-api-key are complete AND env flag is on.
 * - Best Practice: back burner — PARTNER_YOK until Bp Partner Network + flag.
 * Never invents a successful write-back.
 */
import type { PmsExportPaket } from '@/lib/ulke/mektup/tipler'
import { clinikoDogrula, clinikoYaz, type ClinikoKimlik } from './cliniko'
import { magentusDogrula, magentusYaz, type MagentusKimlik } from './magentus'
import type { PmsRetKodu, PmsSaglayici } from './tipler'

const BAYRAK: Record<PmsSaglayici, string> = {
  'best-practice': 'NOTYA_PMS_BEST_PRACTICE_ETKIN',
  genie: 'NOTYA_PMS_GENIE_ETKIN',
  gentu: 'NOTYA_PMS_GENTU_ETKIN',
  cliniko: 'NOTYA_PMS_CLINIKO_ETKIN',
}

/**
 * Cliniko defaults ON (clinic owns the key) unless explicitly `0`.
 * Bp / Magentus vendors require explicit `1`.
 */
export function pmsAdapterEtkin(saglayici: PmsSaglayici, ortam: NodeJS.ProcessEnv = process.env): boolean {
  const v = String(ortam[BAYRAK[saglayici]] || '').trim()
  if (saglayici === 'cliniko') return v !== '0'
  return v === '1'
}

export type PmsAdapterSonuc =
  | { tamam: true; ref: string }
  | { tamam: false; kod: PmsRetKodu }

function kimlikOku(ham: Record<string, unknown>): ClinikoKimlik & MagentusKimlik {
  const s = (k: string) => (typeof ham[k] === 'string' ? (ham[k] as string) : undefined)
  return {
    anahtar: typeof ham.anahtar === 'string' ? ham.anahtar : '',
    hastaId: s('hastaId'),
    shard: s('shard'),
    clientId: s('clientId'),
    clientSecret: s('clientSecret'),
    tokenUrl: s('tokenUrl'),
    apiUrl: s('apiUrl'),
    scopes: s('scopes'),
  }
}

export async function pmsYaz(
  saglayici: PmsSaglayici,
  kimlikHam: Record<string, unknown>,
  paket: PmsExportPaket,
  ortam: NodeJS.ProcessEnv = process.env,
): Promise<PmsAdapterSonuc> {
  if (!pmsAdapterEtkin(saglayici, ortam)) return { tamam: false, kod: 'PARTNER_YOK' }
  const kimlik = kimlikOku(kimlikHam)
  if (saglayici === 'cliniko') return clinikoYaz(kimlik, paket)
  if (saglayici === 'genie' || saglayici === 'gentu') return magentusYaz(kimlik, paket, ortam)
  // best-practice — Vanessa Partner Network; back burner.
  return { tamam: false, kod: 'PARTNER_YOK' }
}

export async function pmsDogrula(
  saglayici: PmsSaglayici,
  kimlikHam: Record<string, unknown>,
  ortam: NodeJS.ProcessEnv = process.env,
): Promise<PmsAdapterSonuc> {
  if (!pmsAdapterEtkin(saglayici, ortam)) return { tamam: false, kod: 'PARTNER_YOK' }
  const kimlik = kimlikOku(kimlikHam)
  if (saglayici === 'cliniko') return clinikoDogrula(kimlik)
  if (saglayici === 'genie' || saglayici === 'gentu') return magentusDogrula(kimlik, ortam)
  return { tamam: false, kod: 'PARTNER_YOK' }
}
