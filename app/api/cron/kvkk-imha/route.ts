/**
 * NOTYA-KVKK-02 — periyodik imha (periodic destruction).
 *
 * KVKK requires more than a retention promise in a policy document: the Kişisel Verilerin
 * Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik expects a DEFINED,
 * RECURRING destruction cycle, and the audit on 2026-08-25 found none anywhere in the codebase —
 * no retention windows, no anonymisation, nothing scheduled. Data was kept forever by default,
 * which is the most common finding in KVKK health-sector enforcement.
 *
 * This job enforces the periods published in the aydınlatma metni. It is deliberately CONSERVATIVE
 * with clinical records: patient data is governed by health-record retention rules that outlive our
 * own convenience, so it is never auto-deleted here — only records the doctor has already
 * soft-deleted, and only after the grace period, are destroyed for real. Everything it removes is
 * something a user asked to be gone or an operational log nobody is entitled to keep.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const sb = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/** Retention windows, in days. These MUST match what the aydınlatma metni promises. */
const RETENTION = {
  soft_deleted_grace: 30,   // a record the doctor deleted: recoverable for 30 days, then destroyed
  access_logs: 730,         // 2 years — as published
  portal_tokens: 90,        // patient portal links: short-lived by design
  orphan_uploads: 7,        // uploads never attached to a patient
}

function cutoff(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export async function GET(req: Request) {
  // Cron-authenticated only: this destroys data and must never be reachable from a browser.
  const secret = new URL(req.url).searchParams.get('secret')
  const isCron = req.headers.get('x-vercel-cron') === '1'
  if (!isCron && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 })
  }

  const s = sb()
  const report: Record<string, number | string> = { calisma_zamani: new Date().toISOString() }

  async function purge(table: string, column: string, days: number, key: string) {
    try {
      const { data, error } = await s
        .from(table)
        .delete()
        .lt(column, cutoff(days))
        .select('id')
      report[key] = error ? `hata: ${error.message}` : (data?.length ?? 0)
    } catch (e: any) {
      report[key] = `hata: ${String(e?.message || e).slice(0, 80)}`
    }
  }

  // Records the doctor already deleted, past the recovery window.
  await purge('patients', 'deleted_at', RETENTION.soft_deleted_grace, 'silinen_hasta_kayitlari')
  await purge('hasta_belgeler', 'deleted_at', RETENTION.soft_deleted_grace, 'silinen_belgeler')
  await purge('hasta_goruntulemeler', 'deleted_at', RETENTION.soft_deleted_grace, 'silinen_goruntulemeler')

  // Expired patient-portal links: no reason to keep a usable token after it lapses.
  await purge('hasta_portal_tokens', 'expires_at', 0, 'suresi_dolmus_portal_baglantilari')

  // Operational logs, at the published 2-year window.
  await purge('access_logs', 'created_at', RETENTION.access_logs, 'erisim_kayitlari')

  console.log('[kvkk-imha]', JSON.stringify(report))
  return NextResponse.json({ ok: true, rapor: report })
}
