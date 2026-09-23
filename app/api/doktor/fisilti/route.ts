/**
 * NOTYA-FISILTI-UNIVERSAL — GET /api/doktor/fisilti. The one endpoint Fısıltı's UI (and, later,
 * Ayşe's read tool) calls, regardless of the doctor's own branş.
 *
 * Deliberately reuses each branş's existing, already-correct kohort route via an internal
 * same-origin fetch rather than importing 29 different `_kohort.ts` functions with 29 different
 * signatures -- less code, and zero risk of subtly re-implementing clinical logic wrong.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { bransKohortRotasi, FISILTI_DESTEKLI_BRANSLAR, normalizeKohortSatiri, type FisiltiItem } from '@/lib/doktor/fisiltiOrtak'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  const { data: profil } = await supabase.from('users').select('specialty').eq('id', user.id).single()
  const bransHam = String(profil?.specialty || '')
  const brans = bransAnahtari(bransHam)

  if (!brans || !FISILTI_DESTEKLI_BRANSLAR.has(brans)) {
    return NextResponse.json({ item: null, toplam: 0, kapsamDisi: true })
  }

  const rota = bransKohortRotasi(brans)
  const auth = req.headers.get('authorization') || ''
  let satirlar: Record<string, unknown>[] = []
  try {
    const iç = await fetch(new URL(`/api/doktor/${rota}/kohort`, req.url), {
      headers: { Authorization: auth },
      cache: 'no-store',
    })
    if (iç.ok) {
      const j = await iç.json()
      satirlar = Array.isArray(j?.satirlar) ? j.satirlar : []
    }
  } catch {
    // Fısıltı kritik değil -- alttaki branş rotası geçici olarak hata verse bile sayfa boş
    // fısıltı gösterir, çökmez.
  }

  if (!satirlar.length) return NextResponse.json({ item: null, toplam: 0 })

  const item: FisiltiItem | null = normalizeKohortSatiri(satirlar[0], brans)
  if (!item) return NextResponse.json({ item: null, toplam: 0 })
  item.toplamBekleyen = satirlar.length

  return NextResponse.json({ item, toplam: satirlar.length })
}
