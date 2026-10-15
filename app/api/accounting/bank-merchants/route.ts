export const dynamic = 'force-dynamic'

/**
 * NOTYA-ACCOUNTING-01 — bank sanal POS merchant accounts (docs/ARCH-NOTYA-ACCOUNTING.md §2.6).
 * Doktor-only. GET lists all configured merchants (masked); POST adds/updates one bank's merchant.
 * `isReal` tells the UI whether this bank is actually usable yet or still a stub — see
 * lib/accounting/banks/CHECKLIST.md.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { encryptSecrets, decryptSecrets, maskSecrets } from '@/lib/accounting/vault'
import { getBankAdapter, listBankAdapters } from '@/lib/accounting/banks'
import { ALL_BANK_KEYS, type BankKey } from '@/lib/accounting/types'
import { writeAuditLog } from '@/lib/accounting/audit'

const SELECTABLE_BANK_KEYS: BankKey[] = ['generic_hosted', ...ALL_BANK_KEYS]

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const { data } = await supabase
    .from('accounting_bank_merchants')
    .select('id, bank_key, environment, is_active, last_tested_at, last_test_ok, secrets_enc')
    .eq('doctor_id', user.id)

  const configured = (data || []).map((row) => {
    let maskedFields: Record<string, string> = {}
    try {
      maskedFields = maskSecrets(decryptSecrets(row.secrets_enc))
    } catch {
      maskedFields = {}
    }
    const { secrets_enc, ...rest } = row
    return { ...rest, maskedFields, isReal: getBankAdapter(row.bank_key as BankKey).isReal }
  })

  const catalog = listBankAdapters().map((a) => ({ bankKey: a.bankKey, isReal: a.isReal }))
  return NextResponse.json({ success: true, data: { configured, catalog } })
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const body = await req.json().catch(() => ({}))
  const bankKey = SELECTABLE_BANK_KEYS.includes(body.bankKey) ? (body.bankKey as BankKey) : null
  const environment = body.environment === 'live' ? 'live' : 'test'
  const fields = body.fields && typeof body.fields === 'object' ? (body.fields as Record<string, string>) : null
  if (!bankKey || !fields) {
    return NextResponse.json({ success: false, error: 'Banka ve sanal POS bilgileri zorunludur.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('accounting_bank_merchants')
    .upsert(
      { doctor_id: user.id, bank_key: bankKey, environment, secrets_enc: encryptSecrets(fields), is_active: true, updated_at: new Date().toISOString() },
      { onConflict: 'doctor_id,bank_key' }
    )
    .select('id, bank_key, environment, is_active')
    .single()
  if (error) return NextResponse.json({ success: false, error: 'Kaydedilemedi.' }, { status: 500 })

  const adapter = getBankAdapter(bankKey)
  await writeAuditLog(supabase, {
    doctorId: user.id,
    actorId: user.id,
    actorRole: 'doktor',
    entityType: 'accounting_bank_merchant',
    entityId: data.id,
    action: 'upsert',
    after: { bankKey, environment, isReal: adapter.isReal, maskedFields: maskSecrets(fields) },
  })
  if (!adapter.isReal) {
    return NextResponse.json({
      success: true,
      data: { ...data, isReal: false },
      warning: `"${bankKey}" henüz gerçek bir entegrasyon değil — bkz. lib/accounting/banks/CHECKLIST.md. Kimlik bilgileri kayıtlı ama ödeme oturumu açılamaz.`,
    })
  }
  return NextResponse.json({ success: true, data: { ...data, isReal: true } })
}
