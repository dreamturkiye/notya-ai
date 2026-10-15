export const dynamic = 'force-dynamic'

/**
 * NOTYA-ACCOUNTING-COMPLIANCE-01 — list pending payment-reminder DRAFTS for this doctor's
 * practice, with the invoice context the generic iletisim queue list doesn't carry (amount, doc
 * reference, tier, patient name). Read-only. Opening/editing/SENDING a draft happens through the
 * existing `/api/doktor/iletisim/{hazirla,kayit}` flow — on purpose, see
 * lib/accounting/ar/reminders.ts's header — this endpoint exists so the Faturalama & Tahsilat
 * panel can show "N ödeme hatırlatması bekliyor" with real amounts without re-implementing that
 * flow. Gated by `ar.reminder.view` (sekreter has it by default, same tier as invoice.issue).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { assertCan, AccountingForbiddenError } from '@/lib/accounting/rbac'
import { loadGrants } from '@/lib/accounting/grants'
import { hastaAdiCoz } from '@/lib/iletisim/sunucu'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, personelId } = oturum
  try {
    assertCan(rol, 'ar.reminder.view', await loadGrants(supabase, { userId: '', doktorId, role: rol, personelId }))
  } catch (err) {
    if (err instanceof AccountingForbiddenError) {
      return NextResponse.json({ success: false, error: 'Ödeme hatırlatmalarını görmek için yetkiniz yok.' }, { status: 403 })
    }
    throw err
  }

  const durum = req.nextUrl.searchParams.get('durum') // 'bekliyor' (default) | 'gonderildi' | 'atlandi' | 'hepsi'
  let q = supabase
    .from('iletisim_kuyrugu')
    .select('id, patient_id, invoice_id, odeme_tutar_kurus, odeme_fatura_ref, odeme_kademe, durum, created_at')
    .eq('doctor_id', doktorId)
    .eq('tur', 'odeme_hatirlatma')
  if (!durum || durum === 'bekliyor') q = q.eq('durum', 'bekliyor')
  else if (durum !== 'hepsi') q = q.eq('durum', durum)
  const { data, error } = await q.order('odeme_kademe', { ascending: false }).order('created_at', { ascending: true }).limit(300)
  if (error) return NextResponse.json({ success: true, data: [], toplamKurus: 0 })

  const rows = data || []
  const patientIds = Array.from(new Set(rows.map((r) => String(r.patient_id))))
  const { data: hastalar } = patientIds.length
    ? await supabase.from('patients').select('id, name_encrypted').eq('doctor_id', doktorId).in('id', patientIds)
    : { data: [] as Array<{ id: string; name_encrypted: string }> }
  const adMap = new Map((hastalar || []).map((p) => [String(p.id), hastaAdiCoz(p.name_encrypted)]))

  const sonuc = rows.map((r) => ({
    id: String(r.id),
    patientId: String(r.patient_id),
    hastaAdi: adMap.get(String(r.patient_id)) || 'Hasta',
    invoiceId: r.invoice_id ? String(r.invoice_id) : null,
    tutarKurus: typeof r.odeme_tutar_kurus === 'number' ? r.odeme_tutar_kurus : 0,
    faturaRef: r.odeme_fatura_ref ? String(r.odeme_fatura_ref) : '',
    kademe: r.odeme_kademe === 1 || r.odeme_kademe === 2 ? r.odeme_kademe : 1,
    durum: r.durum,
    olusturulma: r.created_at,
  }))
  const toplamKurus = sonuc.reduce((s, r) => s + r.tutarKurus, 0)
  return NextResponse.json({ success: true, data: sonuc, toplamKurus })
}
