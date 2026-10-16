/**
 * NOTYA-ACCOUNTING-01 — invoice engine: draft -> validate/compute -> submit -> lifecycle.
 *
 * This is the ONLY place that writes `accounting_invoices.status` (via lib/accounting/invoices/
 * stateMachine.ts) and the only place that calls an EbelgeAdapter to issue/cancel/credit a
 * document. API routes call these functions; they never touch the state machine or an adapter
 * directly, so every transition is auditable and provably legal.
 *
 * Patient isolation: every function that touches an existing invoice re-derives it scoped by
 * `doctor_id` in the same query (hasta-izolasyon pattern #2) — a caller never gets to operate on
 * an invoice id without proving the acting doctor owns it first.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActingUser, DiscountInput, EbelgeDocType, Invoice, Money, ServiceKind } from '../types'
import { assertCan } from '../rbac'
import { loadGrants } from '../grants'
import { computeLine, computeInvoiceTotals, type LineComputationResult } from '../ledger/money'
import { nextInvoiceStatus } from './stateMachine'
import { writeAuditLog } from '../audit'
import { hastaSahibiMi, seansSahibi } from '@/lib/doktor/hastaSahipligi'
import { getModuleSettings } from '../module'
import { getEbelgeAdapter } from '../ebelge'
import type { EbelgeCredentials, EbelgeInvoiceDto, SellerIdentity } from '../ebelge/types'
import { decryptSecrets } from '../vault'
import { decryptPII } from '@/lib/security/encryption'
import { hastaAdSoyad } from '@/lib/portal/hastaAdi'
import { postArCharge, postArCredit } from '../ar/ledger'

export interface DraftLineInput {
  serviceId?: string
  description: string
  quantity: number
  unitPriceKurus: Money
  discountKurus?: Money
  kdvRateBp: number
}

export interface CreateDraftInput {
  patientId?: string | null
  /**
   * NOTYA-ACCOUNTING-ENCOUNTER-01 — the muayene (sessions.id) this draft is raised from, when
   * created via the "Faturala" entry point at the end of a visit. Ownership is re-derived here
   * (seansSahibi), never trusted from the caller — same hasta-izolasyon pattern as every other
   * patient-derived id in this file.
   */
  encounterId?: string | null
  docType?: EbelgeDocType
  lines: DraftLineInput[]
  invoiceDiscount?: { type: 'percent' | 'fixed'; value: number; reason: string }
  portalVisible?: boolean
}

function rowToInvoice(row: Record<string, any>): Invoice {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    patientId: row.patient_id,
    encounterId: row.encounter_id ?? null,
    status: row.status,
    docType: row.doc_type,
    subtotalKurus: row.subtotal_kurus,
    discountKurus: row.discount_kurus,
    kdvKurus: row.kdv_kurus,
    totalKurus: row.total_kurus,
    paidKurus: row.paid_kurus,
    portalVisible: row.portal_visible,
    ebelgeVendor: row.ebelge_vendor,
    ebelgeEnvironment: row.ebelge_environment,
    ebelgeUuid: row.ebelge_uuid,
    ebelgeDocNumber: row.ebelge_doc_number,
    ebelgePdfUrl: row.ebelge_pdf_url,
    ebelgeLastError: row.ebelge_last_error,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    issuedAt: row.issued_at,
    cancelledAt: row.cancelled_at,
  }
}

async function loadOwnedInvoice(supabase: SupabaseClient, doctorId: string, invoiceId: string) {
  const { data, error } = await supabase
    .from('accounting_invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('doctor_id', doctorId) // ownership scoped in the same query
    .maybeSingle()
  if (error || !data) throw new InvoiceNotFoundError(invoiceId)
  return data
}

export class InvoiceNotFoundError extends Error {
  constructor(invoiceId: string) {
    super(`Fatura bulunamadı: ${invoiceId}`)
    this.name = 'InvoiceNotFoundError'
  }
}

/** Create a draft invoice with computed line totals. Does not submit anything. */
export async function createDraftInvoice(
  supabase: SupabaseClient,
  actor: ActingUser,
  input: CreateDraftInput
): Promise<Invoice> {
  assertCan(actor.role, 'invoice.draft.create')

  // NOTYA-ACCOUNTING-ENCOUNTER-01: an encounter id is attacker-controlled input like any other
  // patient-derived id (hasta-izolasyon pattern #1/#4) — re-derive ownership here, never trust it.
  // When the caller also passed an explicit patientId, that one wins (a doctor may re-point a
  // visit-born draft at a different billing patient); otherwise the encounter's own patient is used.
  let patientId = input.patientId ?? null
  let encounterId: string | null = null
  if (input.encounterId) {
    const encounter = await seansSahibi(supabase, actor.doktorId, input.encounterId)
    if (!encounter) throw new Error('Muayene bulunamadı.')
    encounterId = encounter.id
    if (!patientId) patientId = encounter.patient_id
  }
  if (patientId) {
    if (!(await hastaSahibiMi(supabase, actor.doktorId, patientId))) {
      throw new Error('Hasta bulunamadı.')
    }
  }
  if (!input.lines.length) throw new Error('En az bir satır gerekli.')

  const computed: LineComputationResult[] = input.lines.map((l) =>
    computeLine({ quantity: l.quantity, unitPriceKurus: l.unitPriceKurus, discountKurus: l.discountKurus, kdvRateBp: l.kdvRateBp })
  )
  const totals = computeInvoiceTotals(
    computed,
    input.invoiceDiscount ? { type: input.invoiceDiscount.type, value: input.invoiceDiscount.value } : undefined
  )

  const settings = await getModuleSettings(supabase, actor.doktorId)
  const { data: invoiceRow, error } = await supabase
    .from('accounting_invoices')
    .insert({
      doctor_id: actor.doktorId,
      patient_id: patientId,
      encounter_id: encounterId,
      status: 'draft',
      doc_type: input.docType ?? settings.defaultDocType,
      subtotal_kurus: totals.subtotalKurus,
      discount_kurus: totals.discountKurus,
      kdv_kurus: totals.kdvKurus,
      total_kurus: totals.totalKurus,
      paid_kurus: 0,
      portal_visible: input.portalVisible ?? settings.portalVisibleDefault,
      created_by: actor.userId,
    })
    .select('*')
    .single()
  if (error || !invoiceRow) throw new Error(`createDraftInvoice failed: ${error?.message}`)

  const lineRows = input.lines.map((l, i) => ({
    invoice_id: invoiceRow.id,
    service_id: l.serviceId ?? null,
    description: l.description,
    quantity: l.quantity,
    unit_price_kurus: l.unitPriceKurus,
    discount_kurus: computed[i].discountKurus,
    kdv_rate_bp: l.kdvRateBp,
    kdv_kurus: computed[i].kdvKurus,
    line_total_kurus: computed[i].lineTotalKurus,
  }))
  const { error: lineErr } = await supabase.from('accounting_invoice_lines').insert(lineRows)
  if (lineErr) throw new Error(`createDraftInvoice line insert failed: ${lineErr.message}`)

  if (input.invoiceDiscount) {
    await supabase.from('accounting_discounts').insert({
      invoice_id: invoiceRow.id,
      scope: 'invoice',
      disc_type: input.invoiceDiscount.type,
      value: input.invoiceDiscount.value,
      amount_kurus: totals.discountKurus,
      reason: input.invoiceDiscount.reason,
      actor_id: actor.userId,
    })
  }

  const invoice = rowToInvoice(invoiceRow)
  await writeAuditLog(supabase, {
    doctorId: actor.doktorId,
    actorId: actor.userId,
    actorRole: actor.role,
    entityType: 'accounting_invoice',
    entityId: invoice.id,
    action: 'create_draft',
    after: invoice,
  })
  return invoice
}

export interface EncounterInvoiceSuggestion {
  patientId: string | null
  lines: DraftLineInput[]
  /** Aşı names the doctor administered this visit that have no matching catalog price — cannot be
   *  invented, so they are surfaced for the doctor to add manually or price in the Katalog tab. */
  unmatchedAsiNames: string[]
}

/**
 * NOTYA-ACCOUNTING-ENCOUNTER-01 — read-only preview for the "Faturala" entry point at the end of a
 * muayene (app/dashboard/doktor/notlar/[id]/faturala/page.tsx). Suggests, never writes:
 *  - the encounter's own active muayene-kind catalog service (first one, if the doctor has defined
 *    any — never a fabricated price for an undefined one), and
 *  - a line for every administered aşı name that matches an active 'asi'-kind catalog service by
 *    name (case/whitespace-insensitive); names with no catalog match are returned separately rather
 *    than silently dropped or priced at a guess.
 */
export async function suggestEncounterInvoiceLines(
  supabase: SupabaseClient,
  actor: ActingUser,
  encounterId: string,
  administeredAsiNames: string[] = []
): Promise<EncounterInvoiceSuggestion> {
  assertCan(actor.role, 'invoice.draft.create')
  const encounter = await seansSahibi(supabase, actor.doktorId, encounterId)
  if (!encounter) throw new Error('Muayene bulunamadı.')

  const { data: serviceRows } = await supabase
    .from('accounting_services')
    .select('id, kind, name, price_kurus, kdv_rate_bp')
    .eq('doctor_id', actor.doktorId)
    .eq('active', true)

  const services = serviceRows || []
  const lines: DraftLineInput[] = []

  const muayeneService = services.filter((s) => s.kind === 'muayene').sort((a, b) => String(a.name).localeCompare(String(b.name)))[0]
  if (muayeneService) {
    lines.push({
      serviceId: muayeneService.id,
      description: muayeneService.name,
      quantity: 1,
      unitPriceKurus: muayeneService.price_kurus,
      kdvRateBp: muayeneService.kdv_rate_bp,
    })
  }

  const asiServices = services.filter((s) => s.kind === 'asi')
  const normalize = (s: string) => s.trim().toLocaleLowerCase('tr-TR')
  const unmatchedAsiNames: string[] = []
  const seenAsi = new Set<string>()
  for (const rawName of administeredAsiNames) {
    const name = String(rawName || '').trim()
    if (!name || seenAsi.has(normalize(name))) continue
    seenAsi.add(normalize(name))
    const match = asiServices.find((s) => normalize(String(s.name)) === normalize(name))
    if (match) {
      lines.push({
        serviceId: match.id,
        description: match.name,
        quantity: 1,
        unitPriceKurus: match.price_kurus,
        kdvRateBp: match.kdv_rate_bp,
      })
    } else {
      unmatchedAsiNames.push(name)
    }
  }

  return { patientId: encounter.patient_id, lines, unmatchedAsiNames }
}

/**
 * NOTYA-ACCOUNTING-COMPLIANCE-01 (2026-10-15 audit §4.6.2) — the buyer's real name/email, resolved
 * from the owned patient record when one is attached. A generic "Hasta" placeholder name is not a
 * GİB-valid alıcı tanımı even on the e-Arşiv final-consumer (nihai tüketici) path, which still
 * requires the buyer's actual name. Buyer TCKN/VKN capture is NOT in the patient schema anywhere in
 * this codebase (no TCKN/national-id column on `patients`), so idType stays 'unknown' here — that
 * remains ACCOUNTING-11, an open gap needing Kaan's decision, not something to fabricate.
 * Extracted (2026-10-15, encounter-invoicing round) so the invoice PDF generator
 * (lib/accounting/invoices/invoicePdf.tsx) shows the exact same buyer name `issueInvoice` submits
 * to the integrator — one resolver, not two copies that could drift.
 */
export async function resolveBuyerIdentity(
  supabase: SupabaseClient,
  doctorId: string,
  patientId: string | null
): Promise<EbelgeInvoiceDto['buyer']> {
  let buyer: EbelgeInvoiceDto['buyer'] = { idType: 'unknown', name: 'Hasta' }
  if (!patientId) return buyer
  const { data: patientRow } = await supabase
    .from('patients')
    .select('name_encrypted, email_encrypted')
    .eq('id', patientId)
    .eq('doctor_id', doctorId) // ownership scoped in the same query — hasta-izolasyon
    .maybeSingle()
  if (patientRow) {
    // Fail soft: a legacy/malformed encrypted value must never break invoice issuance/PDF render.
    const coz = (v: unknown): string | null => {
      if (!v) return null
      try { return decryptPII(String(v)) } catch { return null }
    }
    const ad = hastaAdSoyad(coz(patientRow.name_encrypted))
    const eposta = coz(patientRow.email_encrypted)
    buyer = {
      idType: 'unknown',
      name: ad || 'Hasta',
      ...(eposta && /@/.test(eposta) ? { email: eposta } : {}),
    }
  }
  return buyer
}

/**
 * Validate + submit: draft -> pending_issue -> (issued | issue_failed) via the practice's active
 * e-belge integrator. Seller identity always comes from the doctor's own tax profile — never a
 * Notya constant (docs/ARCH-NOTYA-ACCOUNTING.md §1, §2.3.1).
 */
export async function issueInvoice(supabase: SupabaseClient, actor: ActingUser, invoiceId: string): Promise<Invoice> {
  assertCan(actor.role, 'invoice.issue')
  const row = await loadOwnedInvoice(supabase, actor.doktorId, invoiceId)
  const before = rowToInvoice(row)
  nextInvoiceStatus(before.status, 'validate') // throws if draft isn't actually draft

  const { data: taxProfile } = await supabase
    .from('accounting_tax_profiles')
    .select('*')
    .eq('doctor_id', actor.doktorId)
    .maybeSingle()
  if (!taxProfile) throw new Error('Vergi profili tanımlı değil. Önce Faturalama & Tahsilat kurulumunu tamamlayın.')

  const { data: credRow } = await supabase
    .from('accounting_ebelge_credentials')
    .select('*')
    .eq('doctor_id', actor.doktorId)
    .eq('is_active', true)
    .maybeSingle()
  if (!credRow) throw new Error('Aktif bir e-belge entegratörü tanımlı değil.')

  await supabase.from('accounting_invoices').update({ status: 'pending_issue', updated_at: new Date().toISOString() }).eq('id', invoiceId)

  const { data: lineRows } = await supabase.from('accounting_invoice_lines').select('*').eq('invoice_id', invoiceId)
  const seller: SellerIdentity = {
    idType: taxProfile.id_type,
    idValue: decryptPII(taxProfile.id_value_enc),
    unvan: taxProfile.unvan,
    address: taxProfile.address,
    vergiDairesi: taxProfile.vergi_dairesi ?? undefined,
  }

  const buyer = await resolveBuyerIdentity(supabase, actor.doktorId, before.patientId)

  const dto: EbelgeInvoiceDto = {
    invoiceId: before.id,
    docType: before.docType,
    seller,
    buyer,
    lines: (lineRows || []).map((l) => ({
      description: l.description,
      quantity: Number(l.quantity),
      unitPriceKurus: l.unit_price_kurus,
      kdvRateBp: l.kdv_rate_bp,
      kdvKurus: l.kdv_kurus,
      lineTotalKurus: l.line_total_kurus,
    })),
    subtotalKurus: before.subtotalKurus,
    kdvKurus: before.kdvKurus,
    totalKurus: before.totalKurus,
    currency: 'TRY',
    issueDate: new Date().toISOString().slice(0, 10),
  }

  const credentials: EbelgeCredentials = {
    vendor: credRow.vendor,
    environment: credRow.environment,
    fields: decryptSecrets(credRow.secrets_enc),
  }
  const adapter = getEbelgeAdapter(credRow.vendor)

  try {
    const result = await adapter.issue(credentials, dto)
    const nowIso = new Date().toISOString()
    const { data: updated } = await supabase
      .from('accounting_invoices')
      .update({
        status: nextInvoiceStatus('pending_issue', 'issue_success'),
        ebelge_vendor: credRow.vendor,
        ebelge_environment: credRow.environment,
        ebelge_uuid: result.uuid,
        ebelge_doc_number: result.documentNumber,
        ebelge_pdf_url: result.pdfUrl,
        ebelge_last_error: null,
        issued_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', invoiceId)
      .select('*')
      .single()
    const invoice = rowToInvoice(updated)
    await postArCharge(supabase, { doctorId: actor.doktorId, patientId: invoice.patientId, invoiceId: invoice.id, amountKurus: invoice.totalKurus })
    await writeAuditLog(supabase, {
      doctorId: actor.doktorId,
      actorId: actor.userId,
      actorRole: actor.role,
      entityType: 'accounting_invoice',
      entityId: invoice.id,
      action: 'issue_success',
      before,
      after: invoice,
    })
    return invoice
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bilinmeyen entegratör hatası'
    const { data: updated } = await supabase
      .from('accounting_invoices')
      .update({ status: nextInvoiceStatus('pending_issue', 'issue_failure'), ebelge_last_error: message, updated_at: new Date().toISOString() })
      .eq('id', invoiceId)
      .select('*')
      .single()
    const invoice = rowToInvoice(updated)
    await writeAuditLog(supabase, {
      doctorId: actor.doktorId,
      actorId: actor.userId,
      actorRole: actor.role,
      entityType: 'accounting_invoice',
      entityId: invoice.id,
      action: 'issue_failed',
      before,
      after: invoice,
    })
    return invoice
  }
}

export async function cancelInvoice(
  supabase: SupabaseClient,
  actor: ActingUser,
  invoiceId: string,
  reason: string
): Promise<Invoice> {
  assertCan(actor.role, 'invoice.cancel', await loadGrants(supabase, actor))
  const row = await loadOwnedInvoice(supabase, actor.doktorId, invoiceId)
  const before = rowToInvoice(row)
  nextInvoiceStatus(before.status, 'request_cancel')

  let ok = true
  if (before.ebelgeUuid && before.ebelgeVendor) {
    const { data: credRow } = await supabase
      .from('accounting_ebelge_credentials')
      .select('*')
      .eq('doctor_id', actor.doktorId)
      .eq('is_active', true)
      .maybeSingle()
    if (credRow) {
      const adapter = getEbelgeAdapter(credRow.vendor)
      const credentials: EbelgeCredentials = { vendor: credRow.vendor, environment: credRow.environment, fields: decryptSecrets(credRow.secrets_enc) }
      const result = await adapter.cancel(credentials, before.ebelgeUuid)
      ok = result.ok
    }
  }
  const status = nextInvoiceStatus('cancel_pending', ok ? 'cancel_success' : 'cancel_failure')
  const { data: updated } = await supabase
    .from('accounting_invoices')
    .update({ status, cancelled_at: ok ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
    .eq('id', invoiceId)
    .select('*')
    .single()
  const invoice = rowToInvoice(updated)
  await writeAuditLog(supabase, {
    doctorId: actor.doktorId,
    actorId: actor.userId,
    actorRole: actor.role,
    entityType: 'accounting_invoice',
    entityId: invoice.id,
    action: ok ? 'cancel_success' : 'cancel_failure',
    before,
    after: { ...invoice, reason },
  })
  return invoice
}

/**
 * NOTYA-ACCOUNTING-COMPLIANCE-01 (2026-10-15 audit §4.6.5) — düzeltme/iade: credit note for an
 * already-issued invoice. This is a legally required capability under Turkish KDV/VUK rules (an
 * issued e-belge is corrected or reversed with its own linked document, never edited in place) and
 * was architecturally scaffolded (state machine `request_credit`/`credit_success`/`credit_failure`,
 * `EbelgeAdapter.credit()`, the `accounting_credits` table) but had no engine function actually
 * calling it before this pass — `cancelInvoice` existed, this did not. Mirrors `cancelInvoice`'s
 * shape exactly: integrator call under the SAME doctor-owned credentials/identity, full audit log,
 * AR ledger posting (a credit note reduces the patient's open balance just like a payment does).
 *
 * `amountKurus` may be less than the invoice total (partial credit note) — common for a line-item
 * correction — but never more.
 */
export async function creditInvoice(
  supabase: SupabaseClient,
  actor: ActingUser,
  invoiceId: string,
  amountKurus: Money,
  reason: string
): Promise<Invoice> {
  assertCan(actor.role, 'invoice.credit', await loadGrants(supabase, actor))
  const row = await loadOwnedInvoice(supabase, actor.doktorId, invoiceId)
  const before = rowToInvoice(row)
  nextInvoiceStatus(before.status, 'request_credit') // throws if not issued/partially_paid/paid
  if (!Number.isInteger(amountKurus) || amountKurus <= 0) throw new Error('İade/düzeltme tutarı geçersiz.')
  if (amountKurus > before.totalKurus) throw new Error('İade/düzeltme tutarı fatura toplamını aşamaz.')
  if (!before.ebelgeUuid || !before.ebelgeVendor) throw new Error('Bu fatura bir e-belge entegratörü üzerinden kesilmemiş; düzeltme uygulanamaz.')

  const { data: credRow } = await supabase
    .from('accounting_ebelge_credentials')
    .select('*')
    .eq('doctor_id', actor.doktorId)
    .eq('is_active', true)
    .maybeSingle()
  if (!credRow) throw new Error('Aktif bir e-belge entegratörü tanımlı değil.')

  await supabase.from('accounting_invoices').update({ status: 'credit_pending', updated_at: new Date().toISOString() }).eq('id', invoiceId)

  const adapter = getEbelgeAdapter(credRow.vendor)
  const credentials: EbelgeCredentials = { vendor: credRow.vendor, environment: credRow.environment, fields: decryptSecrets(credRow.secrets_enc) }

  let ok = true
  let creditUuid: string | null = null
  try {
    const result = await adapter.credit(credentials, before.ebelgeUuid, amountKurus, reason)
    creditUuid = result.creditUuid
  } catch {
    ok = false
  }

  const status = nextInvoiceStatus('credit_pending', ok ? 'credit_success' : 'credit_failure')
  const { data: updated } = await supabase
    .from('accounting_invoices')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', invoiceId)
    .select('*')
    .single()
  const invoice = rowToInvoice(updated)

  if (ok) {
    await supabase.from('accounting_credits').insert({
      doctor_id: actor.doktorId,
      patient_id: invoice.patientId,
      invoice_id: invoice.id,
      kind: 'credit_note',
      amount_kurus: amountKurus,
      remaining_kurus: amountKurus,
      reason,
      status: 'active',
    })
    await postArCredit(supabase, { doctorId: actor.doktorId, patientId: invoice.patientId, invoiceId: invoice.id, amountKurus })
  }

  await writeAuditLog(supabase, {
    doctorId: actor.doktorId,
    actorId: actor.userId,
    actorRole: actor.role,
    entityType: 'accounting_invoice',
    entityId: invoice.id,
    action: ok ? 'credit_success' : 'credit_failure',
    before,
    after: { ...invoice, amountKurus, reason, creditUuid },
  })
  return invoice
}
