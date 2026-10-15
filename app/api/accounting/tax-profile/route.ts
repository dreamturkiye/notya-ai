export const dynamic = 'force-dynamic'

/**
 * NOTYA-ACCOUNTING-01 — doctor/clinic tax identity (e-belge issuer). Doktor-only (sekreter cannot
 * view or edit the TCKN/VKN that documents are issued under). TCKN/VKN encrypted at rest with
 * the same primitive as other Notya PII (lib/security/encryption.ts), never returned in clear.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { encryptPII } from '@/lib/security/encryption'
import { writeAuditLog } from '@/lib/accounting/audit'

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const { data } = await supabase
    .from('accounting_tax_profiles')
    .select('doctor_id, id_type, unvan, address, vergi_dairesi, created_at, updated_at')
    .eq('doctor_id', user.id)
    .maybeSingle()
  // id_value_enc never selected here — this route only ever returns the fact that a TCKN/VKN is
  // on file, not its value.
  return NextResponse.json({ success: true, data: data ? { ...data, idConfigured: true } : null })
}

export async function PUT(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const body = await req.json().catch(() => ({}))
  const idType = body.idType === 'vkn' ? 'vkn' : 'tckn'
  const idValue = String(body.idValue || '').trim()
  const unvan = String(body.unvan || '').trim()
  const address = String(body.address || '').trim()
  if (!idValue || !unvan || !address) {
    return NextResponse.json({ success: false, error: 'TCKN/VKN, unvan ve adres zorunludur.' }, { status: 400 })
  }
  const { data, error } = await supabase
    .from('accounting_tax_profiles')
    .upsert(
      {
        doctor_id: user.id,
        id_type: idType,
        id_value_enc: encryptPII(idValue),
        unvan,
        address,
        vergi_dairesi: body.vergiDairesi ? String(body.vergiDairesi).trim() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'doctor_id' }
    )
    .select('doctor_id, id_type, unvan, address, vergi_dairesi')
    .single()
  if (error) return NextResponse.json({ success: false, error: 'Vergi profili kaydedilemedi.' }, { status: 500 })

  await writeAuditLog(supabase, {
    doctorId: user.id,
    actorId: user.id,
    actorRole: 'doktor',
    entityType: 'accounting_tax_profile',
    entityId: user.id,
    action: 'upsert',
    after: { idType, unvan, address }, // id value itself never audited in clear
  })
  return NextResponse.json({ success: true, data })
}
