/**
 * NOTYA-HASTA-ILETISIMI-01 — inbound SMS webhook (android-sms-gateway can POST a received message
 * to a configured URL). Only job: recognise a STOP/DUR/İPTAL reply and opt the sender out of SMS.
 * Nothing else is done with inbound SMS content here (no Kalkan-style clinical echo for this
 * channel — bulk SMS carries no clinical content to begin with, lib/iletisim/toplu/sablonlar.ts).
 *
 * URL carries doktorId (set once, when the doctor pastes this URL into the gateway app) so the
 * patient lookup can be scoped without exposing the door to all doctors. Authenticated by a shared
 * secret the doctor also configures in the gateway app's webhook headers (X-Notya-Webhook-Secret) —
 * same encrypted-at-rest pattern as the gateway password (iletisim_sms_ayarlari.webhook_sirri_encrypted).
 * Always answers 200 (a gateway retries aggressively on anything else) — failures are logged, not surfaced.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { decryptPII, decrypt } from '@/lib/security/encryption'
import { vazgecKelimesiMi } from '@/lib/iletisim/vazgecJetonu'
import { vazgecUygula } from '@/lib/iletisim/vazgecUygula'
import { whatsappNumarasi } from '@/lib/iletisim/baglantilar'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Constant-time secret comparison (hash both sides so differing lengths do not leak via early exit). */
function sirEsitMi(gelen: string, beklenen: string): boolean {
  const a = createHash('sha256').update(gelen).digest()
  const b = createHash('sha256').update(beklenen).digest()
  return timingSafeEqual(a, b)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ doktorId: string }> }) {
  const { doktorId } = await params
  if (!UUID.test(doktorId)) return NextResponse.json({ ok: true })

  const supabase = servisSupabase()
  let ayar: { webhook_sirri_encrypted?: string | null } | null = null
  try {
    const sonuc = await supabase.from('iletisim_sms_ayarlari').select('webhook_sirri_encrypted').eq('doctor_id', doktorId).maybeSingle()
    ayar = sonuc.data
  } catch { ayar = null }
  if (!ayar?.webhook_sirri_encrypted) return NextResponse.json({ ok: true })

  let beklenenSir = ''
  try { beklenenSir = decryptPII(ayar.webhook_sirri_encrypted) } catch { return NextResponse.json({ ok: true }) }
  const gelenSir = req.headers.get('x-notya-webhook-secret') || ''
  if (!beklenenSir || !gelenSir || !sirEsitMi(gelenSir, beklenenSir)) return NextResponse.json({ ok: true })

  const govde = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!govde) return NextResponse.json({ ok: true })
  const gonderenHam = String(govde.phoneNumber || govde.from || govde.phone || '')
  const metin = String(govde.message || govde.text || govde.body || '')
  if (!gonderenHam || !vazgecKelimesiMi(metin)) return NextResponse.json({ ok: true })

  const gonderenNorm = whatsappNumarasi(gonderenHam)
  if (!gonderenNorm) return NextResponse.json({ ok: true })

  try {
    // Same "decrypt and compare, scoped to this doctor's active roster" pattern as
    // lib/iletisim/kalkan/isle.ts — there is no plaintext phone index to query by.
    const { data: adaylar } = await supabase
      .from('patients')
      .select('id, phone_encrypted')
      .eq('doctor_id', doktorId)
      .eq('is_active', true)
      .limit(2000)
    for (const p of adaylar || []) {
      let tel = ''
      try { tel = decrypt(String(p.phone_encrypted || '')) } catch { continue }
      if (tel && whatsappNumarasi(tel) === gonderenNorm) {
        await vazgecUygula(supabase, doktorId, p.id, 'sms')
        break
      }
    }
  } catch (e) {
    console.error('[sms-webhook] stop işlenemedi:', e instanceof Error ? e.message : e)
  }
  return NextResponse.json({ ok: true })
}
