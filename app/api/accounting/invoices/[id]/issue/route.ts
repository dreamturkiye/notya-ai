export const dynamic = 'force-dynamic'

/**
 * NOTYA-ACCOUNTING-01 — validate + submit a draft invoice.
 *
 * NOTYA-ACCOUNTING-GIB-PORTAL-01 (2026-10-16): this route now branches on
 * `accounting_module_settings.ebelgeMode`. Default (`gib_portal`, free, no integrator) ->
 * `prepareGibPortalInvoice`, which computes amount/KDV/stopaj and returns a copy-ready field list
 * for GİB's own portal instead of calling any adapter; the doctor then pastes the resulting
 * document number back via `POST .../gib-confirm`. Optional (`integrator`) -> the existing
 * `issueInvoice`, unchanged, which submits through whichever `EbelgeAdapter` the doctor connected
 * (e.g. Paraşüt) with their own credentials.
 *
 * Body (gib_portal mode only, both optional): `{ buyerIsKurumsal?: boolean, stopajRateBpOverride?:
 * number }` — see lib/accounting/stopaj.ts for what these mean; omitted means "buyer is a gerçek
 * kişi", the overwhelmingly common case for this module, so stopaj defaults to not applicable.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { getModuleSettings } from '@/lib/accounting/module'
import { issueInvoice, prepareGibPortalInvoice, InvoiceNotFoundError } from '@/lib/accounting/invoices/engine'
import { AccountingForbiddenError } from '@/lib/accounting/rbac'
import { InvalidInvoiceTransitionError } from '@/lib/accounting/invoices/stateMachine'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, user } = oturum
  const actor = { userId: user.id, doktorId, role: rol }
  try {
    const settings = await getModuleSettings(supabase, doktorId)
    if (settings.ebelgeMode === 'gib_portal') {
      const body = await req.json().catch(() => ({}))
      const result = await prepareGibPortalInvoice(supabase, actor, params.id, {
        buyerIsKurumsal: body?.buyerIsKurumsal === true,
        stopajRateBpOverride: typeof body?.stopajRateBpOverride === 'number' ? body.stopajRateBpOverride : undefined,
      })
      return NextResponse.json({
        success: true,
        data: result.invoice,
        gibPortal: { fields: result.fields, stopaj: result.stopaj },
      })
    }
    const invoice = await issueInvoice(supabase, actor, params.id)
    return NextResponse.json({ success: true, data: invoice })
  } catch (err) {
    if (err instanceof InvoiceNotFoundError) return NextResponse.json({ success: false, error: err.message }, { status: 404 })
    if (err instanceof AccountingForbiddenError) return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 })
    if (err instanceof InvalidInvoiceTransitionError) return NextResponse.json({ success: false, error: 'Bu fatura şu an kesilemez.' }, { status: 409 })
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Fatura kesilemedi.' }, { status: 400 })
  }
}
