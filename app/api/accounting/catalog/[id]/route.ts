export const dynamic = 'force-dynamic'

/** NOTYA-ACCOUNTING-01 — update/archive one catalog item. PUT { name?, description?, priceKurus?, kdvRateBp?, active? } */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { updateService } from '@/lib/accounting/catalog/service'
import { AccountingForbiddenError } from '@/lib/accounting/rbac'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, user } = oturum
  const body = await req.json().catch(() => ({}))
  try {
    const service = await updateService(supabase, { userId: user.id, doktorId, role: rol }, params.id, body)
    return NextResponse.json({ success: true, data: service })
  } catch (err) {
    if (err instanceof AccountingForbiddenError) {
      return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Güncellenemedi.' }, { status: 400 })
  }
}
