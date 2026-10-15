export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * NOTYA-ACCOUNTING-ENCOUNTER-01 — GET: downloadable invoice/makbuz PDF (lib/accounting/invoices/
 * invoicePdf.tsx). Works for ANY invoice status including `draft` (labelled "Taslak — resmî belge
 * değil" on the page itself) — this is the real-looking document a doctor can already hand a
 * patient or file with their müşavir today, independent of whether a live e-belge integrator is
 * connected yet (ARCH doc §4.9.9).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { resolveBuyerIdentity } from '@/lib/accounting/invoices/engine'
import { invoicePdf, type InvoicePdfLine } from '@/lib/accounting/invoices/invoicePdf'
import { decryptPII } from '@/lib/security/encryption'
import { decryptBytes } from '@/lib/vault/crypto'

const DOC_TYPE_ID_LABEL: Record<string, string> = { tckn: 'TCKN', vkn: 'VKN' }

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const { data: invoice, error } = await supabase
    .from('accounting_invoices')
    .select('*')
    .eq('id', params.id)
    .eq('doctor_id', doktorId) // ownership scoped in the same query — hasta-izolasyon
    .maybeSingle()
  if (error || !invoice) return NextResponse.json({ success: false, error: 'Fatura bulunamadı.' }, { status: 404 })

  const { data: lineRows } = await supabase.from('accounting_invoice_lines').select('*').eq('invoice_id', invoice.id).order('created_at')
  const { data: taxProfile } = await supabase.from('accounting_tax_profiles').select('*').eq('doctor_id', doktorId).maybeSingle()
  if (!taxProfile) {
    return NextResponse.json({ success: false, error: 'Vergi profili tanımlı değil. Önce Faturalama & Tahsilat kurulumunu tamamlayın.' }, { status: 400 })
  }

  const buyer = await resolveBuyerIdentity(supabase, doktorId, invoice.patient_id)

  let logoDataUrl: string | null = null
  if (taxProfile.logo_image_encrypted) {
    try {
      const bytes = decryptBytes(Buffer.from(String(taxProfile.logo_image_encrypted), 'base64'))
      logoDataUrl = `data:${taxProfile.logo_mime_type};base64,${bytes.toString('base64')}`
    } catch { logoDataUrl = null }
  }
  let iban: string | null = null
  if (taxProfile.iban_enc) {
    try { iban = decryptPII(taxProfile.iban_enc) } catch { iban = null }
  }

  const lines: InvoicePdfLine[] = (lineRows || []).map((l) => ({
    description: l.description,
    quantity: Number(l.quantity),
    unitPriceKurus: l.unit_price_kurus,
    kdvRateBp: l.kdv_rate_bp,
    kdvKurus: l.kdv_kurus,
    lineTotalKurus: l.line_total_kurus,
  }))

  const buf = await invoicePdf({
    isDraft: invoice.status === 'draft' || invoice.status === 'issue_failed',
    docType: invoice.doc_type,
    docNumber: invoice.ebelge_doc_number,
    ettn: invoice.ebelge_uuid,
    issueDateIso: invoice.issued_at,
    createdAtIso: invoice.created_at,
    seller: {
      unvan: taxProfile.unvan,
      idTypeLabel: DOC_TYPE_ID_LABEL[taxProfile.id_type] || taxProfile.id_type,
      idValue: decryptPII(taxProfile.id_value_enc),
      address: taxProfile.address,
      vergiDairesi: taxProfile.vergi_dairesi,
      iban,
    },
    logoDataUrl,
    buyerName: buyer.name,
    lines,
    subtotalKurus: invoice.subtotal_kurus,
    discountKurus: invoice.discount_kurus,
    kdvKurus: invoice.kdv_kurus,
    totalKurus: invoice.total_kurus,
    paidKurus: invoice.paid_kurus,
  })

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="fatura-${invoice.ebelge_doc_number || invoice.id}.pdf"`,
      'Content-Length': String(buf.length),
      'Cache-Control': 'private, no-store',
    },
  })
}
