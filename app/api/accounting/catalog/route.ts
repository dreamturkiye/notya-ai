export const dynamic = 'force-dynamic'

/**
 * NOTYA-ACCOUNTING-01 — service catalog. Open-ended muayene/aşı/hizmet/paket list (CEO
 * requirement — no fixed count anywhere in this route or lib/accounting/catalog/service.ts).
 * GET  ?kind=muayene|asi|hizmet|paket&includeInactive=1
 * POST { kind, name, description?, priceKurus, kdvRateBp? }
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { listServices, createService } from '@/lib/accounting/catalog/service'
import type { ServiceKind } from '@/lib/accounting/types'
import { AccountingForbiddenError } from '@/lib/accounting/rbac'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum
  const kind = req.nextUrl.searchParams.get('kind') as ServiceKind | null
  const includeInactive = req.nextUrl.searchParams.get('includeInactive') === '1'
  const data = await listServices(supabase, doktorId, { kind: kind ?? undefined, includeInactive })
  return NextResponse.json({ success: true, data })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, user } = oturum
  const body = await req.json().catch(() => ({}))
  try {
    const service = await createService(
      supabase,
      { userId: user.id, doktorId, role: rol },
      {
        kind: body.kind,
        name: body.name,
        description: body.description ?? null,
        priceKurus: body.priceKurus,
        kdvRateBp: body.kdvRateBp,
      }
    )
    return NextResponse.json({ success: true, data: service })
  } catch (err) {
    if (err instanceof AccountingForbiddenError) {
      return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Hizmet oluşturulamadı.' }, { status: 400 })
  }
}
