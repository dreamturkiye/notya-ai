/**
 * Araçlar › KD kohort paneli API.
 * GET → { satirlar, toplamHasta } (hekimin gebelik / lohusa / kadın sağlığı kaydı olan hastaları; lohusa 1. ve 6. hafta,
 *       kapanmak üzere tarama penceresi, geciken DÖBYR izlemi, OGTT / anti-D / GBS zamanı, smear / HPV gecikmesi).
 * POST { patientIds[] } → her hasta için hasta-güvenli hatırlatma (Sağlığım › Mesajlar + e-posta bildirimi).
 * Kimlikler kdKohortVerisi(doctorId) süzgecinden geçmeden hiçbir mesaj yazılmaz (hasta-izolasyon).
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { kdKohortVerisi } from '../_kohort'
import { kdHatirlatmaGonder } from '../_kohortHatirlatma'

export const dynamic = 'force-dynamic'
const bugun = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10)

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  return NextResponse.json(await kdKohortVerisi(oturum.supabase, oturum.user.id, bugun()))
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const b = (await req.json().catch(() => null)) as { patientIds?: unknown } | null
  const ids = (Array.isArray(b?.patientIds) ? b!.patientIds : []).map(String).slice(0, 50)
  if (!ids.length) return NextResponse.json({ error: 'Hasta seçin.' }, { status: 400 })
  const { satirlar } = await kdKohortVerisi(sb, user.id, bugun(), ids)
  let gonderilen = 0, atlanan = 0
  for (const s of satirlar) {
    const r = await kdHatirlatmaGonder(sb, user.id, s.patientId, s.bayraklar)
    if (r === 'gonderildi') gonderilen++; else atlanan++
  }
  // Seçilip kohortta olmayan (bayraksız / başka hekimin) kimlikler sessizce atlanır.
  atlanan += ids.length - satirlar.length
  return NextResponse.json({ ok: true, gonderilen, atlanan })
}
