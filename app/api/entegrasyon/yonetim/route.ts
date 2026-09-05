export const dynamic = 'force-dynamic'
// NOTYA-FHIR-02 — Kurum entegrasyon yönetimi (P2). GET: kurumlar + kuyruk özetleri +
// son denetim kayıtları. PATCH: kurum aktif/pasif. Yetki: ADMIN_EMAILS env listesi
// (varsayılan: kurucu). Doktor hesapları bu ekranı GÖREMEZ — bu bir işletme paneli.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { pratikOturum } from '@/lib/doktor/pratikOturum'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function yetkili(req: NextRequest): Promise<boolean> {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return false
  const izinli = (process.env.ADMIN_EMAILS || 'kaanari@mac.com').split(',').map((e) => e.trim().toLowerCase())
  const email = oturum.user.email?.toLowerCase()
  return !!email && izinli.includes(email)
}

export async function GET(req: NextRequest) {
  if (!(await yetkili(req))) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  const sb = getSupabase()
  const { data: kurumlar } = await sb.from('kurum_entegrasyonlari').select('id, ad, fhir_base_url, hedef, aktif, created_at').order('created_at')
  const { data: kuyruk } = await sb.from('fhir_export_kuyruk').select('kurum_id, durum')
  const ozet: Record<string, { sent: number; failed: number; pending: number }> = {}
  for (const k of kuyruk || []) {
    ozet[k.kurum_id] = ozet[k.kurum_id] || { sent: 0, failed: 0, pending: 0 }
    const d = k.durum as 'sent' | 'failed' | 'pending'
    if (d in ozet[k.kurum_id]) ozet[k.kurum_id][d]++
  }
  const { data: denetim } = await sb.from('fhir_audit').select('islem, sonuc, detay, created_at, kurum_id').order('created_at', { ascending: false }).limit(12)
  return NextResponse.json({ success: true, kurumlar, ozet, denetim })
}

export async function PATCH(req: NextRequest) {
  if (!(await yetkili(req))) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  const { kurumId, aktif } = await req.json()
  if (!kurumId || typeof aktif !== 'boolean') return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  const sb = getSupabase()
  await sb.from('kurum_entegrasyonlari').update({ aktif }).eq('id', kurumId)
  await sb.from('fhir_audit').insert({ kurum_id: kurumId, islem: 'aktiflik', sonuc: aktif ? 'ACILDI' : 'KAPATILDI', detay: 'yönetim paneli' })
  return NextResponse.json({ success: true })
}
