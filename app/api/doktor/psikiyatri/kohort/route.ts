/**
 * PSIK-EXCEPTIONAL-01 — Araçlar › Psikiyatri kohort paneli API.
 * GET → { satirlar, toplamHasta } (hekimin psik_* kaydı olan hastaları; PHQ-9 yüksek, açık güvenlik bayrağı,
 * geciken kontrol, geciken Li/VPA düzeyi).
 * POST { patientIds[] } → hasta-güvenli hatırlatma (Sağlığım › Mesajlar + e-posta bildirimi + dönüş görevi).
 * Kimlikler psikKohortVerisi(doctorId) süzgecinden geçmeden hiçbir mesaj yazılmaz.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { psikKohortVerisi, psikHatirlatmaGonder } from '../_kohort'

export const dynamic = 'force-dynamic'
const bugun = () => new Date().toISOString().slice(0, 10)

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  return NextResponse.json(await psikKohortVerisi(oturum.supabase, oturum.user.id, bugun()))
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const b = (await req.json().catch(() => null)) as { patientIds?: unknown } | null
  const ids = (Array.isArray(b?.patientIds) ? b!.patientIds : []).map(String).slice(0, 50)
  if (!ids.length) return NextResponse.json({ error: 'Hasta seçin.' }, { status: 400 })
  const T = bugun()
  const { satirlar } = await psikKohortVerisi(sb, user.id, T, ids)
  let gonderilen = 0, atlanan = 0
  for (const s of satirlar) {
    const r = await psikHatirlatmaGonder(sb, user.id, s.patientId, s.bayraklar, T)
    if (r === 'gonderildi') gonderilen++; else atlanan++
  }
  // Seçilip kohortta olmayan (bayraksız / başka hekimin) kimlikler sessizce atlanır.
  atlanan += ids.length - satirlar.length
  return NextResponse.json({ ok: true, gonderilen, atlanan })
}
