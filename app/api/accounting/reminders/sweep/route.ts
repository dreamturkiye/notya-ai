export const dynamic = 'force-dynamic'

/**
 * NOTYA-ACCOUNTING-COMPLIANCE-01 — manual trigger for this ONE doctor's own reminder sweep (the
 * cron, `/api/cron/odeme-hatirlatma`, does this for every doctor with the module on automatically;
 * this route is for "check now" from the panel, or for testing). Only ever CREATES draft rows in
 * the existing iletisim queue — see lib/accounting/ar/reminders.ts's header for why that can never
 * send anything. Gated the same as the list endpoint (`ar.reminder.view` — generating a draft to
 * review is not a send action, so it does not need `ar.reminder.send`).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { assertCan, AccountingForbiddenError } from '@/lib/accounting/rbac'
import { loadGrants } from '@/lib/accounting/grants'
import { sweepPaymentReminders } from '@/lib/accounting/ar/reminderSweep'

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, personelId } = oturum
  try {
    assertCan(rol, 'ar.reminder.view', await loadGrants(supabase, { userId: '', doktorId, role: rol, personelId }))
  } catch (err) {
    if (err instanceof AccountingForbiddenError) {
      return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 })
    }
    throw err
  }
  const ozet = await sweepPaymentReminders(supabase, { doctorIds: [doktorId] })
  return NextResponse.json({ success: true, data: ozet })
}
