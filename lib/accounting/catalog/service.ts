/**
 * NOTYA-ACCOUNTING-01 — service catalog CRUD.
 *
 * CEO requirement, built with real care: the doctor can define an OPEN-ENDED number of muayene
 * (exam) types/packages and aşı (vaccine) line items, each with its own name, free-text
 * description and price — never a fixed 3/5-item list. `kind` just groups them for the catalog
 * UI; there is no cap anywhere in this file, the migration, or the UI on how many of each a
 * doctor can create.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AccountingService, ServiceKind, Money } from '../types'
import { KDV_RATE_BP_HEALTH_DEFAULT } from '../types'
import { writeAuditLog } from '../audit'
import type { ActingUser } from '../types'
import { assertCan } from '../rbac'

function rowToService(row: Record<string, any>): AccountingService {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    kind: row.kind,
    name: row.name,
    description: row.description ?? null,
    priceKurus: row.price_kurus,
    kdvRateBp: row.kdv_rate_bp,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listServices(
  supabase: SupabaseClient,
  doctorId: string,
  opts: { kind?: ServiceKind; includeInactive?: boolean } = {}
): Promise<AccountingService[]> {
  let q = supabase.from('accounting_services').select('*').eq('doctor_id', doctorId)
  if (opts.kind) q = q.eq('kind', opts.kind)
  if (!opts.includeInactive) q = q.eq('active', true)
  const { data, error } = await q.order('kind').order('name')
  if (error) throw new Error(`listServices failed: ${error.message}`)
  return (data || []).map(rowToService)
}

export interface CreateServiceInput {
  kind: ServiceKind
  name: string
  description?: string | null
  priceKurus: Money
  kdvRateBp?: number
}

export async function createService(
  supabase: SupabaseClient,
  actor: ActingUser,
  input: CreateServiceInput
): Promise<AccountingService> {
  assertCan(actor.role, 'catalog.write')
  if (!input.name.trim()) throw new Error('Hizmet/muayene/aşı adı boş olamaz.')
  if (!Number.isInteger(input.priceKurus) || input.priceKurus < 0) {
    throw new Error('Fiyat kuruş cinsinden tam sayı olmalı ve negatif olamaz.')
  }
  const { data, error } = await supabase
    .from('accounting_services')
    .insert({
      doctor_id: actor.doktorId,
      kind: input.kind,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      price_kurus: input.priceKurus,
      kdv_rate_bp: input.kdvRateBp ?? KDV_RATE_BP_HEALTH_DEFAULT,
      active: true,
    })
    .select('*')
    .single()
  if (error) throw new Error(`createService failed: ${error.message}`)
  const service = rowToService(data)
  await writeAuditLog(supabase, {
    doctorId: actor.doktorId,
    actorId: actor.userId,
    actorRole: actor.role,
    entityType: 'accounting_service',
    entityId: service.id,
    action: 'create',
    after: service,
  })
  return service
}

export interface UpdateServiceInput {
  name?: string
  description?: string | null
  priceKurus?: Money
  kdvRateBp?: number
  active?: boolean
}

export async function updateService(
  supabase: SupabaseClient,
  actor: ActingUser,
  serviceId: string,
  patch: UpdateServiceInput
): Promise<AccountingService> {
  assertCan(actor.role, 'catalog.write')
  const { data: existing, error: findErr } = await supabase
    .from('accounting_services')
    .select('*')
    .eq('id', serviceId)
    .eq('doctor_id', actor.doktorId) // ownership scoped in the same query — never a bare id
    .maybeSingle()
  if (findErr || !existing) throw new Error('Hizmet bulunamadı.')

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.name !== undefined) update.name = patch.name.trim()
  if (patch.description !== undefined) update.description = patch.description?.trim() || null
  if (patch.priceKurus !== undefined) {
    if (!Number.isInteger(patch.priceKurus) || patch.priceKurus < 0) throw new Error('Geçersiz fiyat.')
    update.price_kurus = patch.priceKurus
  }
  if (patch.kdvRateBp !== undefined) update.kdv_rate_bp = patch.kdvRateBp
  if (patch.active !== undefined) update.active = patch.active

  const { data, error } = await supabase
    .from('accounting_services')
    .update(update)
    .eq('id', serviceId)
    .eq('doctor_id', actor.doktorId)
    .select('*')
    .single()
  if (error) throw new Error(`updateService failed: ${error.message}`)
  const service = rowToService(data)
  await writeAuditLog(supabase, {
    doctorId: actor.doktorId,
    actorId: actor.userId,
    actorRole: actor.role,
    entityType: 'accounting_service',
    entityId: service.id,
    action: 'update',
    before: rowToService(existing),
    after: service,
  })
  return service
}
