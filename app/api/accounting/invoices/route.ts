export const dynamic = 'force-dynamic'

/**
 * NOTYA-ACCOUNTING-01 — invoice list + draft creation.
 * GET  ?status=&patientId=  (patientId checked for ownership before it scopes anything)
 * POST { patientId?, encounterId?, docType?, lines:[{serviceId?,description,quantity,unitPriceKurus,discountKurus?,kdvRateBp}], invoiceDiscount?, portalVisible? }
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { createDraftInvoice } from '@/lib/accounting/invoices/engine'
import { AccountingForbiddenError } from '@/lib/accounting/rbac'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum
  const status = req.nextUrl.searchParams.get('status')
  const patientId = req.nextUrl.searchParams.get('patientId')
  if (patientId && !(await hastaSahibiMi(supabase, doktorId, patientId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }
  let q = supabase.from('accounting_invoices').select('*').eq('doctor_id', doktorId).order('created_at', { ascending: false }).limit(100)
  if (status) q = q.eq('status', status)
  if (patientId) q = q.eq('patient_id', patientId)
  const { data, error } = await q
  if (error) return NextResponse.json({ success: false, error: 'Listelenemedi.' }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, user } = oturum
  const body = await req.json().catch(() => ({}))
  try {
    const invoice = await createDraftInvoice(
      supabase,
      { userId: user.id, doktorId, role: rol },
      {
        patientId: body.patientId ?? null,
        encounterId: body.encounterId ?? null,
        docType: body.docType,
        lines: Array.isArray(body.lines) ? body.lines : [],
        invoiceDiscount: body.invoiceDiscount,
        portalVisible: body.portalVisible,
      }
    )
    return NextResponse.json({ success: true, data: invoice })
  } catch (err) {
    if (err instanceof AccountingForbiddenError) {
      return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Taslak oluşturulamadı.' }, { status: 400 })
  }
}
