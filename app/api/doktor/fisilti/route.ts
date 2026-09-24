/**
 * NOTYA-FISILTI-UNIVERSAL — GET /api/doktor/fisilti. The one endpoint Fısıltı's UI (and, later,
 * Ayşe's read tool) calls, regardless of the doctor's own branş. Candidate collection lives in
 * lib/doktor/fisiltiTopla.ts (shared with ./gizle).
 *
 * NOTYA-FISILTI-GIZLE-01: items the doctor hid (fisilti_gizlenen) are filtered out while their facts
 * are unchanged and any "7 gün" window is still open; `gizliSayisi` feeds the "Gizlenenler (n)" link.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { fisiltiOgeleri, fisiltiGizlemeleri } from '@/lib/doktor/fisiltiTopla'
import { fisiltiAyir } from '@/lib/doktor/fisiltiGizle'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  const { ogeler, bransDestekli } = await fisiltiOgeleri(req, supabase, user.id)
  const { gorunen, gizli } = fisiltiAyir(ogeler, await fisiltiGizlemeleri(supabase, user.id), new Date())
  const gizliSayisi = gizli.length
  if (!gorunen.length) return NextResponse.json({ item: null, toplam: 0, gizliSayisi, kapsamDisi: !bransDestekli && !ogeler.length })

  const item = gorunen[0]
  item.toplamBekleyen = gorunen.length

  return NextResponse.json({ item, toplam: gorunen.length, gizliSayisi })
}
