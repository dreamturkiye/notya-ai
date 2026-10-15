/**
 * NOTYA-ACCOUNTING-01 — module on/off flag + defaults (Entegrasyonlar → Faturalama & Tahsilat).
 * Every other accounting route checks `isAccountingEnabled` first: off means no billing nav, no
 * payment links, no e-belge jobs, no AR UI (docs/ARCH-NOTYA-ACCOUNTING.md §2.1).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { KDV_RATE_BP_HEALTH_DEFAULT } from './types'

export interface AccountingModuleSettings {
  doctorId: string
  enabled: boolean
  defaultKdvRateBp: number
  defaultDocType: 'esmm' | 'efatura' | 'earsiv'
  portalVisibleDefault: boolean
}

const DEFAULTS: Omit<AccountingModuleSettings, 'doctorId'> = {
  enabled: false,
  defaultKdvRateBp: KDV_RATE_BP_HEALTH_DEFAULT,
  defaultDocType: 'esmm',
  portalVisibleDefault: false,
}

export async function getModuleSettings(
  supabase: SupabaseClient,
  doctorId: string
): Promise<AccountingModuleSettings> {
  const { data } = await supabase
    .from('accounting_module_settings')
    .select('doctor_id, enabled, default_kdv_rate_bp, default_doc_type, portal_visible_default')
    .eq('doctor_id', doctorId)
    .maybeSingle()
  if (!data) return { doctorId, ...DEFAULTS }
  return {
    doctorId,
    enabled: !!data.enabled,
    defaultKdvRateBp: data.default_kdv_rate_bp,
    defaultDocType: data.default_doc_type,
    portalVisibleDefault: !!data.portal_visible_default,
  }
}

export async function isAccountingEnabled(supabase: SupabaseClient, doctorId: string): Promise<boolean> {
  const settings = await getModuleSettings(supabase, doctorId)
  return settings.enabled
}

export async function setModuleSettings(
  supabase: SupabaseClient,
  doctorId: string,
  patch: Partial<Omit<AccountingModuleSettings, 'doctorId'>>
): Promise<AccountingModuleSettings> {
  const current = await getModuleSettings(supabase, doctorId)
  const next = { ...current, ...patch }
  await supabase
    .from('accounting_module_settings')
    .upsert(
      {
        doctor_id: doctorId,
        enabled: next.enabled,
        default_kdv_rate_bp: next.defaultKdvRateBp,
        default_doc_type: next.defaultDocType,
        portal_visible_default: next.portalVisibleDefault,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'doctor_id' }
    )
  return next
}
