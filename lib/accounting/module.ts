/**
 * NOTYA-ACCOUNTING-01 — module on/off flag + defaults (Entegrasyonlar → Faturalama & Tahsilat).
 * Every other accounting route checks `isAccountingEnabled` first: off means no billing nav, no
 * payment links, no e-belge jobs, no AR UI (docs/ARCH-NOTYA-ACCOUNTING.md §2.1).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { KDV_RATE_BP_HEALTH_DEFAULT, type DoctorType, type EbelgeDocType, type EbelgeMode } from './types'

export interface AccountingModuleSettings {
  doctorId: string
  enabled: boolean
  defaultKdvRateBp: number
  defaultDocType: EbelgeDocType
  portalVisibleDefault: boolean
  /** NOTYA-ACCOUNTING-GIB-PORTAL-01 — which legal form this doctor bills under; determines
   *  which document type (and which document-prep flow) the rest of the product shows. */
  doctorType: DoctorType
  /** 'gib_portal' (default, free, manual) vs 'integrator' (optional, API-automated). */
  ebelgeMode: EbelgeMode
}

const DEFAULTS: Omit<AccountingModuleSettings, 'doctorId'> = {
  enabled: false,
  defaultKdvRateBp: KDV_RATE_BP_HEALTH_DEFAULT,
  defaultDocType: 'esmm',
  portalVisibleDefault: false,
  doctorType: 'serbest_meslek',
  ebelgeMode: 'gib_portal',
}

/**
 * NOTYA-ACCOUNTING-GIB-PORTAL-01 — single source of truth for "which document type does this
 * doctor type legally issue". A serbest meslek (solo) doctor issues e-SMM only; a şirket (Ltd/AŞ)
 * issues e-Fatura/e-Arşiv only — these must never be offered interchangeably (see
 * lib/accounting/types.ts's `DoctorType` doc comment). `earsiv` is the şirket default because it
 * needs no buyer e-Fatura mailbox lookup (ACCOUNTING-11 is still open); a şirket may still switch
 * to `efatura` explicitly when the buyer is itself an e-Fatura mükellefi.
 */
export function defaultDocTypeForDoctorType(doctorType: DoctorType): EbelgeDocType {
  return doctorType === 'sirket' ? 'earsiv' : 'esmm'
}

export function isDocTypeAllowedForDoctorType(docType: EbelgeDocType, doctorType: DoctorType): boolean {
  return doctorType === 'sirket' ? docType !== 'esmm' : docType === 'esmm'
}

export async function getModuleSettings(
  supabase: SupabaseClient,
  doctorId: string
): Promise<AccountingModuleSettings> {
  const { data } = await supabase
    .from('accounting_module_settings')
    .select('doctor_id, enabled, default_kdv_rate_bp, default_doc_type, portal_visible_default, doctor_type, ebelge_mode')
    .eq('doctor_id', doctorId)
    .maybeSingle()
  if (!data) return { doctorId, ...DEFAULTS }
  return {
    doctorId,
    enabled: !!data.enabled,
    defaultKdvRateBp: data.default_kdv_rate_bp,
    defaultDocType: data.default_doc_type,
    portalVisibleDefault: !!data.portal_visible_default,
    doctorType: (data.doctor_type as DoctorType) || DEFAULTS.doctorType,
    ebelgeMode: (data.ebelge_mode as EbelgeMode) || DEFAULTS.ebelgeMode,
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
  // Only merge patch keys that are actually defined — the route handler builds its patch object
  // with `key: typeof body.key === '...' ? body.key : undefined` for every optional field, which
  // means an own-property `undefined` is present for every field the caller did NOT intend to
  // touch. A plain `{ ...current, ...patch }` spread would still overwrite `current`'s real value
  // with that `undefined` (object spread does not skip own keys whose value is undefined), so a
  // doctor merely toggling the module on/off would wipe doctorType/ebelgeMode/etc. from this
  // function's in-memory return value (and the audit-log/API-response snapshot built from it) —
  // pre-existing behavior for the original fields, now load-bearing for doctorType/ebelgeMode
  // (NOTYA-ACCOUNTING-GIB-PORTAL-01), so fixed here rather than reproduced.
  const definedPatch = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined))
  const next = { ...current, ...definedPatch }

  // NOTYA-ACCOUNTING-GIB-PORTAL-01: changing doctorType re-locks defaultDocType to what that
  // legal form actually issues, unless the caller also passed an explicit (and allowed)
  // defaultDocType in the same patch — never leave esmm+şirket or efatura/earsiv+serbest meslek
  // as a possible combination coming out of this function.
  if (!isDocTypeAllowedForDoctorType(next.defaultDocType, next.doctorType)) {
    next.defaultDocType = defaultDocTypeForDoctorType(next.doctorType)
  }

  await supabase
    .from('accounting_module_settings')
    .upsert(
      {
        doctor_id: doctorId,
        enabled: next.enabled,
        default_kdv_rate_bp: next.defaultKdvRateBp,
        default_doc_type: next.defaultDocType,
        portal_visible_default: next.portalVisibleDefault,
        doctor_type: next.doctorType,
        ebelge_mode: next.ebelgeMode,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'doctor_id' }
    )
  return next
}
