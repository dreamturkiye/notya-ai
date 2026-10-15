export const dynamic = 'force-dynamic'

/** NOTYA-ACCOUNTING-01 — "Test connection" button for the e-belge setup wizard. Doktor-only. */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { decryptSecrets } from '@/lib/accounting/vault'
import { getEbelgeAdapter } from '@/lib/accounting/ebelge'

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const { data: cred } = await supabase
    .from('accounting_ebelge_credentials')
    .select('*')
    .eq('doctor_id', user.id)
    .eq('is_active', true)
    .maybeSingle()
  if (!cred) return NextResponse.json({ success: false, error: 'Önce bir entegratör tanımlayın.' }, { status: 400 })

  const adapter = getEbelgeAdapter(cred.vendor)
  const result = await adapter.testConnection({ vendor: cred.vendor, environment: cred.environment, fields: decryptSecrets(cred.secrets_enc) })

  await supabase
    .from('accounting_ebelge_credentials')
    .update({ last_tested_at: new Date().toISOString(), last_test_ok: result.ok, last_test_detail: result.detail ?? null })
    .eq('id', cred.id)

  return NextResponse.json({ success: true, data: { ok: result.ok, detail: result.detail, isReal: adapter.isReal } })
}
