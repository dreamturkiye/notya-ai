/**
 * HASTA-PORTALI-GUNLUK (Kaan, 2026-11-24) — Sağlığım daily health home. PIN unlock required.
 *   GET  → the patient's Bugün state (lib/saglikEvi/ozet.ts GunlukDurum): doses, quick-add tiles, rings, dial, trends,
 *          streak, badges, karne, consent / reminder preferences.
 *   POST { islem, ... } → olcum | olcum-sil | doz | plan | tercih | soru | soru-sil | rozet-goruldu | uyari-goruldu
 * HASTA-IZOLASYON: token → (patient_id, doctor_id) via portalKapsami; every read / write carries both; ids from the body
 * (plan, reading, question, alert) are matched only inside that scope.
 */
import { NextRequest, NextResponse } from 'next/server'
import { portalKapsami, sonucYaniti } from '@/lib/saglikEvi/portalKapisi'
import { dozIsaretle, goruldu, gunlukYukle, olcumKaydet, olcumSil, planDuzenle, soruEkle, soruSil, tercihKaydet } from '@/lib/saglikEvi/sunucu'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const g = await portalKapsami(req, params.token)
  if ('hata' in g) return g.hata
  try {
    return NextResponse.json(await gunlukYukle(g.sb, g.kapsam))
  } catch (e) {
    console.error('[portal/gunluk] yukle:', (e as Error).message)
    return NextResponse.json({ error: 'Günlük bilgileriniz şu an yüklenemedi.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const g = await portalKapsami(req, params.token)
  if ('hata' in g) return g.hata
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b || typeof b.islem !== 'string') return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  const { sb, kapsam } = g
  switch (b.islem) {
    case 'olcum': return sonucYaniti(await olcumKaydet(sb, kapsam, b))
    case 'olcum-sil': return sonucYaniti(await olcumSil(sb, kapsam, b.id))
    case 'doz': return sonucYaniti(await dozIsaretle(sb, kapsam, b))
    case 'plan': return sonucYaniti(await planDuzenle(sb, kapsam, { ...b, islem: b.tur }))
    case 'tercih': return sonucYaniti(await tercihKaydet(sb, kapsam, b))
    case 'soru': return sonucYaniti(await soruEkle(sb, kapsam, b.metin))
    case 'soru-sil': return sonucYaniti(await soruSil(sb, kapsam, b.id))
    case 'rozet-goruldu': return sonucYaniti(await goruldu(sb, kapsam, 'rozet'))
    case 'uyari-goruldu': return sonucYaniti(await goruldu(sb, kapsam, 'uyari', b.idler))
    default: return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 })
  }
}
