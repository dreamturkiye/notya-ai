/**
 * WHATSAPP-ONBURO-01 — POST /api/doktor/iletisim/on-buro/onizleme { metin, ayar? }
 *
 * The settings card's test box: the doctor types a patient message and sees what Ayşe would reply. NOTHING is sent and
 * nothing is stored. `ayar` may be the unsaved form (so a sheet can be tried before saving); without it the saved row is
 * used. Doctor only. The request carries a free text and the doctor's own sheet — no patient, appointment or message id;
 * the only tables read are the doctor's own settings and calendar (free times, never who occupies a taken one).
 * A model call made here counts against the doctor's daily model budget.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { onBuroNormalize } from '@/lib/iletisim/onburo/ayar'
import { varsayilanBilgiModeli } from '@/lib/iletisim/onburo/bilgi'
import { AKTIF_ON_BURO } from '@/lib/iletisim/onburo/dil/aktif'
import { onBuroOnizleme } from '@/lib/iletisim/onburo/onizleme'
import { modelHakkiAl, onBuroAyarGetir, turetilmisSaatler } from '@/lib/iletisim/onburo/sunucu'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const o = await pratikOturum(req)
  if ('hata' in o) return o.hata
  if (o.rol !== 'doktor') return NextResponse.json({ error: 'Bu ekran yalnızca hekim içindir.' }, { status: 403 })
  const g = (await req.json().catch(() => null)) as { metin?: unknown; ayar?: unknown } | null
  const metin = typeof g?.metin === 'string' ? g.metin.trim().slice(0, 600) : ''
  if (!metin) return NextResponse.json({ error: 'Bir hasta mesajı yazın.' }, { status: 400 })
  const ayar = g?.ayar && typeof g.ayar === 'object' ? onBuroNormalize(g.ayar) : (await onBuroAyarGetir(o.supabase, o.doktorId)).ayar
  const simdi = new Date()
  const onizleme = await onBuroOnizleme(o.supabase, {
    doktorId: o.doktorId, metin, ayar, dil: AKTIF_ON_BURO, simdi,
    turetilmisSaatler: await turetilmisSaatler(o.supabase, o.doktorId, AKTIF_ON_BURO),
    model: (i) => varsayilanBilgiModeli(i, o.doktorId),
    modelIzni: () => modelHakkiAl(o.supabase, o.doktorId, simdi),
  })
  return NextResponse.json({ onizleme, etiketler: AKTIF_ON_BURO.alanEtiketi })
}
