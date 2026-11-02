/**
 * AU-GAP-CLOSE-02 — vendor adapters. Until a partner API is live AND the env flag is on,
 * every call returns PARTNER_YOK. Never invents a successful write-back.
 */
import type { PmsExportPaket } from '@/lib/ulke/mektup/tipler'
import type { PmsRetKodu, PmsSaglayici } from './tipler'

const BAYRAK: Record<PmsSaglayici, string> = {
  'best-practice': 'NOTYA_PMS_BEST_PRACTICE_ETKIN',
  genie: 'NOTYA_PMS_GENIE_ETKIN',
  gentu: 'NOTYA_PMS_GENTU_ETKIN',
}

/** true only when the deployment explicitly enables a real partner adapter. */
export function pmsAdapterEtkin(saglayici: PmsSaglayici, ortam: NodeJS.ProcessEnv = process.env): boolean {
  return String(ortam[BAYRAK[saglayici]] || '').trim() === '1'
}

export type PmsAdapterSonuc =
  | { tamam: true; ref: string }
  | { tamam: false; kod: PmsRetKodu }

/**
 * Attempt a live write. Without the env flag this ALWAYS returns PARTNER_YOK —
 * credentials alone never produce a fake "synced" outcome.
 */
export async function pmsYaz(
  saglayici: PmsSaglayici,
  _kimlik: Record<string, unknown>,
  _paket: PmsExportPaket,
  ortam: NodeJS.ProcessEnv = process.env,
): Promise<PmsAdapterSonuc> {
  if (!pmsAdapterEtkin(saglayici, ortam)) return { tamam: false, kod: 'PARTNER_YOK' }
  // Real partner HTTP would go here when the flag is on and credentials are partner-issued.
  return { tamam: false, kod: 'PARTNER_YOK' }
}

export async function pmsDogrula(
  saglayici: PmsSaglayici,
  _kimlik: Record<string, unknown>,
  ortam: NodeJS.ProcessEnv = process.env,
): Promise<PmsAdapterSonuc> {
  if (!pmsAdapterEtkin(saglayici, ortam)) return { tamam: false, kod: 'PARTNER_YOK' }
  return { tamam: false, kod: 'PARTNER_YOK' }
}
