/**
 * HASTA-PORTALI-GUNLUK — web push subscription of this browser (closes ESNEK-B-BILDIRIM for the portal). PIN unlock required.
 *   GET    → { acik: <VAPID public key> | null }   (null = push not configured)
 *   POST   { endpoint, p256dh, auth }  → store / move the subscription to this token's (doctor, patient)
 *   DELETE { endpoint }                → remove it (only within this scope)
 * HASTA-IZOLASYON: rows carry the token's doctor_id + patient_id; delete is scoped by both.
 */
import { NextRequest, NextResponse } from 'next/server'
import { portalKapsami } from '@/lib/saglikEvi/portalKapisi'
import { abonelikGecerliMi, vapidAnahtarlari } from '@/lib/saglikEvi/push/webPush'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const g = await portalKapsami(req, params.token)
  if ('hata' in g) return g.hata
  return NextResponse.json({ acik: vapidAnahtarlari()?.acik ?? null })
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const g = await portalKapsami(req, params.token)
  if ('hata' in g) return g.hata
  const b = await req.json().catch(() => null)
  if (!abonelikGecerliMi(b)) return NextResponse.json({ error: 'Bildirim aboneliği geçersiz.' }, { status: 422 })
  const { count } = await g.sb.from('ev_push_abonelikleri').select('id', { count: 'exact', head: true }).eq('doctor_id', g.kapsam.doktorId).eq('patient_id', g.kapsam.patientId)
  if ((count || 0) >= 10) return NextResponse.json({ error: 'En fazla 10 cihazda bildirim açılabilir.' }, { status: 429 })
  const { error } = await g.sb.from('ev_push_abonelikleri').upsert({ doctor_id: g.kapsam.doktorId, patient_id: g.kapsam.patientId, endpoint: b.endpoint, p256dh: b.p256dh, auth: b.auth, hata_sayisi: 0 }, { onConflict: 'endpoint' })
  if (error) return NextResponse.json({ error: 'Bildirim açılamadı.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { token: string } }) {
  const g = await portalKapsami(req, params.token)
  if ('hata' in g) return g.hata
  const b = (await req.json().catch(() => null)) as { endpoint?: unknown } | null
  if (typeof b?.endpoint !== 'string') return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  await g.sb.from('ev_push_abonelikleri').delete().eq('endpoint', b.endpoint).eq('doctor_id', g.kapsam.doktorId).eq('patient_id', g.kapsam.patientId)
  return NextResponse.json({ ok: true })
}
