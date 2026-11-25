/**
 * HASTA-PORTALI-GUNLUK — "Fotoğrafla gir": POST { base64, mime } → proposed values read from the device screen. PIN
 * unlock required. Nothing is saved here (the patient confirms in the next step, POST gunluk { islem: 'olcum', foto: true }).
 * The photo is not stored. 20 reads per patient per day (idempotency log ev_bildirim_gunlugu, tur foto_okuma).
 * HASTA-IZOLASYON: token → (patient_id, doctor_id); the doctor id goes to the model gate only for usage metering.
 */
import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { portalKapsami } from '@/lib/saglikEvi/portalKapisi'
import { fotoGirdisiDogrula, fotoOku, FOTO_GUNLUK_SINIR } from '@/lib/saglikEvi/fotoOku'
import { rotaButcesiMs } from '@/lib/ai/cagir'
import { trGun, trGunBasi } from '@/lib/saglikEvi/zaman'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const g = await portalKapsami(req, params.token)
  if ('hata' in g) return g.hata
  const { sb, kapsam } = g
  const v = fotoGirdisiDogrula((await req.json().catch(() => ({}))) as Record<string, unknown>)
  if (!v.ok) return NextResponse.json({ error: v.hata }, { status: 422 })
  const { count } = await sb.from('ev_bildirim_gunlugu').select('id', { count: 'exact', head: true }).eq('doctor_id', kapsam.doktorId).eq('patient_id', kapsam.patientId).eq('tur', 'foto_okuma').gte('created_at', trGunBasi(trGun(Date.now())).toISOString())
  if ((count || 0) >= FOTO_GUNLUK_SINIR) return NextResponse.json({ error: 'Bugün için fotoğrafla giriş sınırına ulaşıldı. Değeri elle girebilirsiniz.' }, { status: 429 })
  await sb.from('ev_bildirim_gunlugu').insert({ doctor_id: kapsam.doktorId, patient_id: kapsam.patientId, tur: 'foto_okuma', anahtar: `foto:${kapsam.patientId}:${randomUUID()}` })
  try {
    const r = await fotoOku({ base64: v.base64, mime: v.mime, doctorId: kapsam.doktorId, butceMs: rotaButcesiMs(maxDuration) })
    return NextResponse.json(r)
  } catch (e) {
    console.error('[portal/gunluk/foto]', (e as Error).message)
    return NextResponse.json({ error: 'Fotoğraf şu an okunamadı. Değeri elle girebilirsiniz.' }, { status: 502 })
  }
}
