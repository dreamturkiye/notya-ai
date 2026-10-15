export const dynamic = 'force-dynamic'

/**
 * NOTYA-ACCOUNTING-01 — e-belge integrator setup (docs/ARCH-NOTYA-ACCOUNTING.md §2.3.1).
 * Doktor-only (sekreter cannot read or write integrator credentials, ever — enforced here AND in
 * lib/accounting/rbac.ts, belt and suspenders because this is the module's single most sensitive
 * surface). GET returns masked fields only; POST encrypts and stores; raw secrets never logged.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { encryptSecrets, decryptSecrets, maskSecrets } from '@/lib/accounting/vault'
import { getEbelgeAdapter } from '@/lib/accounting/ebelge'
import { writeAuditLog } from '@/lib/accounting/audit'
import type { EbelgeVendor } from '@/lib/accounting/types'

const VENDORS: EbelgeVendor[] = ['generic_rest', 'parasut', 'nes', 'qnb_esolutions', 'logo', 'other']

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const { data } = await supabase
    .from('accounting_ebelge_credentials')
    .select('id, vendor, environment, is_active, last_tested_at, last_test_ok, last_test_detail, secrets_enc')
    .eq('doctor_id', user.id)
    .eq('is_active', true)
    .maybeSingle()
  if (!data) return NextResponse.json({ success: true, data: null })
  const { secrets_enc, ...rest } = data
  let maskedFields: Record<string, string> = {}
  try {
    maskedFields = maskSecrets(decryptSecrets(secrets_enc))
  } catch {
    maskedFields = {}
  }
  return NextResponse.json({ success: true, data: { ...rest, maskedFields } })
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const body = await req.json().catch(() => ({}))
  const vendor = VENDORS.includes(body.vendor) ? (body.vendor as EbelgeVendor) : null
  const environment = body.environment === 'live' ? 'live' : 'test'
  const fields = body.fields && typeof body.fields === 'object' ? (body.fields as Record<string, string>) : null
  if (!vendor || !fields) {
    return NextResponse.json({ success: false, error: 'Entegratör ve kimlik bilgileri zorunludur.' }, { status: 400 })
  }

  // Deactivate any previously-active integrator (one active per practice for now, per §2.3.1 item 2).
  await supabase.from('accounting_ebelge_credentials').update({ is_active: false }).eq('doctor_id', user.id).eq('is_active', true)

  const { data, error } = await supabase
    .from('accounting_ebelge_credentials')
    .insert({
      doctor_id: user.id,
      vendor,
      environment,
      secrets_enc: encryptSecrets(fields),
      is_active: true,
    })
    .select('id, vendor, environment, is_active')
    .single()
  if (error) return NextResponse.json({ success: false, error: 'Kaydedilemedi.' }, { status: 500 })

  const adapter = getEbelgeAdapter(vendor)
  await writeAuditLog(supabase, {
    doctorId: user.id,
    actorId: user.id,
    actorRole: 'doktor',
    entityType: 'accounting_ebelge_credentials',
    entityId: data.id,
    action: 'create',
    after: { vendor, environment, isReal: adapter.isReal, maskedFields: maskSecrets(fields) },
  })
  return NextResponse.json({ success: true, data: { ...data, isReal: adapter.isReal } })
}
