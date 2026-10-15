export const dynamic = 'force-dynamic'

/**
 * NOTYA-ACCOUNTING-01 — module on/off + defaults (Entegrasyonlar → Faturalama & Tahsilat).
 * GET  -> current settings (defaults if never configured)
 * PUT  { enabled?, defaultKdvRateBp?, defaultDocType?, portalVisibleDefault? } -> doktor-only
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { assertCan, AccountingForbiddenError } from '@/lib/accounting/rbac'
import { getModuleSettings, setModuleSettings } from '@/lib/accounting/module'
import { writeAuditLog } from '@/lib/accounting/audit'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum
  const settings = await getModuleSettings(supabase, doktorId)
  return NextResponse.json({ success: true, data: settings })
}

export async function PUT(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, user } = oturum
  try {
    assertCan(rol, 'module.toggle')
  } catch (err) {
    if (err instanceof AccountingForbiddenError) {
      return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 })
    }
    throw err
  }
  const body = await req.json().catch(() => ({}))
  const before = await getModuleSettings(supabase, doktorId)
  const next = await setModuleSettings(supabase, doktorId, {
    enabled: typeof body.enabled === 'boolean' ? body.enabled : undefined,
    defaultKdvRateBp: typeof body.defaultKdvRateBp === 'number' ? body.defaultKdvRateBp : undefined,
    defaultDocType: body.defaultDocType,
    portalVisibleDefault: typeof body.portalVisibleDefault === 'boolean' ? body.portalVisibleDefault : undefined,
  })
  await writeAuditLog(supabase, {
    doctorId: doktorId,
    actorId: user.id,
    actorRole: rol,
    entityType: 'accounting_module_settings',
    entityId: doktorId,
    action: 'update',
    before,
    after: next,
  })
  return NextResponse.json({ success: true, data: next })
}
