export const dynamic = 'force-dynamic'

/** NOTYA-ACCOUNTING-01 — one invoice's detail, with its lines. Ownership scoped by doctor_id. */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum
  const { data: invoice, error } = await supabase
    .from('accounting_invoices')
    .select('*')
    .eq('id', params.id)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (error || !invoice) return NextResponse.json({ success: false, error: 'Fatura bulunamadı.' }, { status: 404 })
  const { data: lines } = await supabase.from('accounting_invoice_lines').select('*').eq('invoice_id', invoice.id).order('created_at')
  return NextResponse.json({ success: true, data: { invoice, lines: lines || [] } })
}
