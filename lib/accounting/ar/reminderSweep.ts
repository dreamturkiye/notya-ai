/**
 * NOTYA-ACCOUNTING-COMPLIANCE-01 — server wrapper: real open receivables → draft reminder rows in
 * `iletisim_kuyrugu`. Pure decision logic is lib/accounting/ar/reminders.ts; read that file's
 * header first. This file only does I/O: load receivables, resolve contact/display data by
 * REUSING lib/iletisim/sunucu.ts (never re-deriving patient name/consent/phone parsing here), and
 * insert de-duplicated drafts via that same module's `kuyrugaEkle`.
 *
 * Called by: `POST /api/accounting/reminders/sweep` (manual trigger) and
 * `GET /api/cron/odeme-hatirlatma` (daily, vercel.json). Safe to call as often as you like — all
 * idempotency is the de-dup key, nothing here tracks "did I already run today."
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { subtractKurus } from '../ledger/money'
import { isAccountingEnabled } from '../module'
import { buildReminderCandidates, toplamTutarKurus, type ReminderReceivable } from './reminders'
import { tekilAnahtar, type KuyrukAdayi } from '@/lib/iletisim/kuyruk'
import { kuyrugaEkle, hastaIletisimi, doktorIletisimAyari } from '@/lib/iletisim/sunucu'
import { bugunTrIso } from '@/lib/iletisim/sablonlar'

type Sb = SupabaseClient

async function listReminderReceivables(supabase: Sb, doctorId: string): Promise<ReminderReceivable[]> {
  const { data, error } = await supabase
    .from('accounting_invoices')
    .select('id, patient_id, issued_at, total_kurus, paid_kurus, ebelge_doc_number')
    .eq('doctor_id', doctorId)
    .in('status', ['issued', 'partially_paid'])
    .not('issued_at', 'is', null)
  if (error) throw new Error(`listReminderReceivables failed: ${error.message}`)
  return (data || [])
    .map((r) => ({
      invoiceId: String(r.id),
      doctorId,
      patientId: r.patient_id ? String(r.patient_id) : null,
      issuedAt: String(r.issued_at),
      openBalanceKurus: subtractKurus(r.total_kurus, r.paid_kurus),
      faturaRef: r.ebelge_doc_number ? String(r.ebelge_doc_number) : `#${String(r.id).slice(0, 8)}`,
    }))
    .filter((r) => r.openBalanceKurus > 0)
}

export interface ReminderSweepSummary {
  doctorsSwept: number
  draftsCreated: number
  /** Candidates found that were skipped: no patient record, or no ready contact info. */
  skippedNoContact: number
}

/**
 * Sweeps one doctor: finds new tier-1/tier-2 candidates and inserts draft queue rows for them.
 * Never throws — a problem with one doctor (missing module settings, a DB hiccup) must not stop a
 * multi-doctor cron run; it is swallowed and counted as 0 drafts for that doctor.
 */
async function sweepOneDoctor(supabase: Sb, doctorId: string, asOf: string): Promise<{ created: number; skippedNoContact: number }> {
  try {
    const receivables = await listReminderReceivables(supabase, doctorId)
    if (!receivables.length) return { created: 0, skippedNoContact: 0 }

    const { data: existing, error } = await supabase
      .from('iletisim_kuyrugu')
      .select('tekil_anahtar')
      .eq('doctor_id', doctorId)
      .like('tekil_anahtar', 'odeme_hatirlatma:%')
    if (error) return { created: 0, skippedNoContact: 0 } // table/column not applied yet — fail soft
    const existingKeys = new Set((existing || []).map((r) => String(r.tekil_anahtar)))

    const candidates = buildReminderCandidates(receivables, existingKeys, asOf)
    if (!candidates.length) return { created: 0, skippedNoContact: 0 }

    const ayar = await doktorIletisimAyari(supabase, doctorId)
    const bugun = bugunTrIso(new Date(asOf))
    const adaylar: KuyrukAdayi[] = []
    let skippedNoContact = 0
    for (const c of candidates) {
      // Reuse the SAME contact/consent resolver every other message type uses — never a bespoke
      // "does this patient have a phone" check here.
      const hasta = await hastaIletisimi(supabase, doctorId, c.patientId, ayar.brans)
      if (!hasta || (!hasta.telefon && !hasta.eposta)) { skippedNoContact++; continue }
      adaylar.push({
        doctor_id: doctorId,
        patient_id: c.patientId,
        tur: 'odeme_hatirlatma',
        planlanan_gun: bugun,
        tekil_anahtar: tekilAnahtar.odemeHatirlatma(c.invoiceId, c.bucket),
        invoice_id: c.invoiceId,
        odeme_tutar_kurus: c.tutarKurus,
        odeme_fatura_ref: c.faturaRef,
        odeme_kademe: c.tier,
      })
    }
    const created = await kuyrugaEkle(supabase, adaylar)
    return { created, skippedNoContact }
  } catch {
    // One doctor's surprise never stops the sweep for the others (same rule as otomatikGonderim.ts).
    return { created: 0, skippedNoContact: 0 }
  }
}

/**
 * Sweeps either the given doctors or, by default, every doctor with the accounting module
 * enabled. `asOf` is a test seam (defaults to now).
 */
export async function sweepPaymentReminders(
  supabase: Sb,
  opts: { doctorIds?: string[]; asOf?: string } = {}
): Promise<ReminderSweepSummary> {
  const asOf = opts.asOf ?? new Date().toISOString()
  let doctorIds = opts.doctorIds
  if (!doctorIds) {
    const { data, error } = await supabase.from('accounting_module_settings').select('doctor_id').eq('enabled', true)
    if (error) return { doctorsSwept: 0, draftsCreated: 0, skippedNoContact: 0 }
    doctorIds = (data || []).map((r) => String(r.doctor_id))
  } else {
    // Explicit list (e.g. from an API caller): still honor the module flag, never sweep a doctor
    // who has the module off.
    const checks = await Promise.all(doctorIds.map((id) => isAccountingEnabled(supabase, id)))
    doctorIds = doctorIds.filter((_, i) => checks[i])
  }

  let draftsCreated = 0
  let skippedNoContact = 0
  for (const doctorId of doctorIds) {
    const r = await sweepOneDoctor(supabase, doctorId, asOf)
    draftsCreated += r.created
    skippedNoContact += r.skippedNoContact
  }
  return { doctorsSwept: doctorIds.length, draftsCreated, skippedNoContact }
}

/** Exposed for the reminders list API (`/api/accounting/reminders`): a quick total of what sweeping
 *  would find right now, without writing anything — used to show "would create N drafts" in a dry run. */
export async function previewReminderTotal(supabase: Sb, doctorId: string, asOf: string = new Date().toISOString()): Promise<{ candidateCount: number; totalKurus: number }> {
  const receivables = await listReminderReceivables(supabase, doctorId)
  const { data: existing } = await supabase
    .from('iletisim_kuyrugu')
    .select('tekil_anahtar')
    .eq('doctor_id', doctorId)
    .like('tekil_anahtar', 'odeme_hatirlatma:%')
  const existingKeys = new Set((existing || []).map((r) => String(r.tekil_anahtar)))
  const candidates = buildReminderCandidates(receivables, existingKeys, asOf)
  return { candidateCount: candidates.length, totalKurus: toplamTutarKurus(candidates) }
}
