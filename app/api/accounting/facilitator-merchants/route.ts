export const dynamic = 'force-dynamic'

/**
 * NOTYA-ACCOUNTING-01 — payment facilitator merchant accounts (hybrid model, docs/ARCH-
 * NOTYA-ACCOUNTING.md §2.6a). Doktor-only, parallel to app/api/accounting/bank-merchants/route.ts.
 * GET lists configured facilitators (masked); POST adds/updates one facilitator's merchant.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { encryptSecrets, decryptSecrets, maskSecrets } from '@/lib/accounting/vault'
import { getFacilitatorAdapter, listFacilitatorAdapters } from '@/lib/accounting/facilitators'
import { ALL_FACILITATOR_KEYS, type FacilitatorKey } from '@/lib/accounting/types'
import { writeAuditLog } from '@/lib/accounting/audit'

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const { data } = await supabase
    .from('accounting_facilitator_merchants')
    .select('id, facilitator_key, environment, is_active, last_tested_at, last_test_ok, secrets_enc')
    .eq('doctor_id', user.id)

  const configured = (data || []).map((row) => {
    let maskedFields: Record<string, string> = {}
    try {
      maskedFields = maskSecrets(decryptSecrets(row.secrets_enc))
    } catch {
      maskedFields = {}
    }
    const { secrets_enc, ...rest } = row
    const adapter = getFacilitatorAdapter(row.facilitator_key as FacilitatorKey)
    return { ...rest, maskedFields, isReal: adapter.isReal, verificationStatus: adapter.verificationStatus }
  })

  const catalog = listFacilitatorAdapters().map((a) => ({
    facilitatorKey: a.facilitatorKey,
    isReal: a.isReal,
    verificationStatus: a.verificationStatus,
    verificationNote: a.verificationNote,
    recommended: true,
  }))
  return NextResponse.json({ success: true, data: { configured, catalog } })
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const body = await req.json().catch(() => ({}))
  const facilitatorKey = ALL_FACILITATOR_KEYS.includes(body.facilitatorKey) ? (body.facilitatorKey as FacilitatorKey) : null
  const environment = body.environment === 'live' ? 'live' : 'test'
  const fields = body.fields && typeof body.fields === 'object' ? (body.fields as Record<string, string>) : null
  if (!facilitatorKey || !fields) {
    return NextResponse.json({ success: false, error: 'Ödeme kuruluşu ve API bilgileri zorunludur.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('accounting_facilitator_merchants')
    .upsert(
      {
        doctor_id: user.id,
        facilitator_key: facilitatorKey,
        environment,
        secrets_enc: encryptSecrets(fields),
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'doctor_id,facilitator_key' }
    )
    .select('id, facilitator_key, environment, is_active')
    .single()
  if (error) return NextResponse.json({ success: false, error: 'Kaydedilemedi.' }, { status: 500 })

  const adapter = getFacilitatorAdapter(facilitatorKey)
  await writeAuditLog(supabase, {
    doctorId: user.id,
    actorId: user.id,
    actorRole: 'doktor',
    entityType: 'accounting_facilitator_merchant',
    entityId: data.id,
    action: 'upsert',
    after: { facilitatorKey, environment, isReal: adapter.isReal, maskedFields: maskSecrets(fields) },
  })
  return NextResponse.json({ success: true, data: { ...data, isReal: adapter.isReal, verificationStatus: adapter.verificationStatus } })
}
