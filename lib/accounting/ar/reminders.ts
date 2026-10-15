/**
 * NOTYA-ACCOUNTING-COMPLIANCE-01 (Kaan, 2026-10-15) — late-payment reminder DRAFT generation.
 *
 * Pure logic only (no Supabase here, same split as lib/accounting/ar/aging.ts) — the server
 * wrapper that loads real receivables and writes drafts is lib/accounting/ar/reminderSweep.ts.
 *
 * Design, read this before changing anything here:
 *
 * 1. MANDATORY HUMAN REVIEW, NO AUTO-SEND — not a policy, a structural fact. This module writes
 *    rows into `iletisim_kuyrugu` with `tur: 'odeme_hatirlatma'`. That type is deliberately ABSENT
 *    from `OTOMATIK_TURLER` (lib/iletisim/otomatik.ts) and therefore from the automatic
 *    dispatcher's own DB query (lib/iletisim/otomatikGonderim.ts filters
 *    `.in('tur', [...OTOMATIK_TURLER])` before it ever reads a row) — a payment-reminder draft is
 *    never even SELECTed by the code path that sends things unattended, let alone sent by it.
 *    The only way one of these messages leaves is a human opening it in the existing "Hazır
 *    mesajlar" flow (GonderDugmesi / POST /api/doktor/iletisim/hazirla) and tapping send inside
 *    their OWN WhatsApp or mail app, exactly like every other message type in this product. This
 *    also means the "doctor's own connected account, never a Notya-owned sender" rule is inherited
 *    for free — there is no other sender in this codebase a queue item could possibly use.
 *
 * 2. REUSES EXISTING INFRASTRUCTURE, NOT A PARALLEL PIPELINE. `lib/iletisim/*` already has: the
 *    draft queue + de-dup keys (`iletisim_kuyrugu`, `tekilAnahtar`), consent gating
 *    (`gonderilebilirMi`), link building from the sender's own accounts (`whatsappLinki`,
 *    `epostaLinki`), RBAC for staff (`PERSONEL_TURLERI`/`turIzinliMi`), and the send/open log
 *    (`iletisim_kayitlari`). This feature adds a new `tur` to that system (see
 *    `lib/iletisim/tipler.ts`, `kuyruk.ts`, `sablonlar.ts`, `hazirlik.ts` — all small, additive
 *    diffs, each commented at the point of change with this same tag) instead of building a
 *    second queue/send/log/consent system. The ONE piece that doesn't fit the generic queue as-is
 *    is per-item financial data (amount, invoice, tier) — `iletisim_kuyrugu` gained four nullable
 *    columns for exactly that (migration 157), set once at draft-generation time here.
 *
 * 3. TWO ESCALATION TIERS, FROM THE AGING BUCKETS THAT ALREADY EXIST — not invented. `aging.ts`
 *    already buckets every open receivable into 0-30 / 31-60 / 61-90 / 90+. `0-30` is normal /
 *    grace-period open balance and gets no reminder. `31-60` is tier 1 (gentle, first reminder).
 *    `61-90` and `90+` are both tier 2 (firm follow-up) — not three tiers, because the brief asked
 *    not to invent a ladder beyond two unless the buckets themselves suggested more, and merging
 *    the two oldest buckets into one "firm" tier is the natural reading of four buckets → two
 *    reminder tiers (one grace tier that sends nothing, one gentle, one firm absorbing both old
 *    buckets).
 *
 * 4. IDEMPOTENT BY DESIGN, NOT BY A SEPARATE "ALREADY SENT" TABLE. A draft's de-dup key
 *    (`tekilAnahtar.odemeHatirlatma(invoiceId, bucket)`) includes the BUCKET, not just the invoice
 *    and not a date. Running the sweep daily never creates a second tier-1 draft for an invoice
 *    that already has one sitting in `iletisim_kuyrugu` (regardless of its status — bekliyor,
 *    gonderildi or atlandi: `kuyrugaEkle`'s existing de-dup checks the key against ALL existing
 *    rows, not just pending ones) — but DOES create a new tier-2 draft once that same invoice's
 *    balance ages into 61-90, because the key's bucket component changes. If a partially-paid
 *    invoice ever aged BACKWARDS (it can't — age only increases with time — but a brand new
 *    invoice for the same patient obviously starts its own aging clock), that would independently
 *    get its own candidate; nothing here conflates two different invoices.
 */
import { addKurus } from '../ledger/money'
import type { Money } from '../types'
import { bucketFor, type AgingBucketLabel } from './aging'

/** 0 = no reminder yet (grace period), 1 = gentle first reminder, 2 = firm follow-up. */
export type ReminderTier = 0 | 1 | 2

export const REMINDER_TIER_BY_BUCKET: Record<AgingBucketLabel, ReminderTier> = {
  '0-30': 0,
  '31-60': 1,
  '61-90': 2,
  '90+': 2,
}

export function reminderTierForAgeDays(ageDays: number): ReminderTier {
  return REMINDER_TIER_BY_BUCKET[bucketFor(ageDays)]
}

export interface ReminderReceivable {
  invoiceId: string
  doctorId: string
  patientId: string | null
  issuedAt: string // ISO
  openBalanceKurus: Money
  /** Short display reference — doc number when issued (ebelge_doc_number), else the invoice id's tail. */
  faturaRef: string
}

export interface ReminderCandidate {
  doctorId: string
  patientId: string
  invoiceId: string
  tier: 1 | 2
  bucket: AgingBucketLabel
  tutarKurus: Money
  faturaRef: string
  tekilAnahtar: string
}

/**
 * Which open receivables need a NEW draft reminder right now, given `asOf` and the set of
 * de-dup keys that already exist for this doctor (so this stays usable without a DB round trip
 * per receivable — the caller fetches existing keys once, same pattern as
 * lib/iletisim/kuyruk.ts's `yeniAdaylar`). Receivables with no `patientId` are skipped — there is
 * no one to message (consistent with lib/iletisim's existing "serbest randevu" rule: no patient
 * record, no consent record, no message).
 */
export function buildReminderCandidates(
  receivables: ReminderReceivable[],
  existingTekilAnahtarlar: ReadonlySet<string>,
  asOf: string = new Date().toISOString()
): ReminderCandidate[] {
  const out: ReminderCandidate[] = []
  for (const r of receivables) {
    if (!r.patientId) continue
    if (r.openBalanceKurus <= 0) continue
    const ageDays = Math.floor((Date.parse(asOf) - Date.parse(r.issuedAt)) / 86_400_000)
    const bucket = bucketFor(ageDays)
    const tier = REMINDER_TIER_BY_BUCKET[bucket]
    if (tier === 0) continue
    const key = odemeHatirlatmaAnahtari(r.invoiceId, bucket)
    if (existingTekilAnahtarlar.has(key)) continue
    out.push({
      doctorId: r.doctorId,
      patientId: r.patientId,
      invoiceId: r.invoiceId,
      tier,
      bucket,
      tutarKurus: r.openBalanceKurus,
      faturaRef: r.faturaRef,
      tekilAnahtar: key,
    })
  }
  return out
}

/** Mirrors lib/iletisim/kuyruk.ts's `tekilAnahtar.odemeHatirlatma` exactly — kept in sync by hand
 *  (this file cannot import from lib/iletisim without creating a circular module dependency, since
 *  lib/iletisim/hazirlik.ts reads the columns THIS module's sweep writes). Covered by a test that
 *  asserts both functions produce the identical string for the same inputs. */
export function odemeHatirlatmaAnahtari(invoiceId: string, bucket: AgingBucketLabel): string {
  return `odeme_hatirlatma:${invoiceId}:${bucket}`
}

/** Total of all candidates' amounts, for a sweep summary line — never used for ledger posting. */
export function toplamTutarKurus(candidates: ReminderCandidate[]): Money {
  return addKurus(...candidates.map((c) => c.tutarKurus))
}
