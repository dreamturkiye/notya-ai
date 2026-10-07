/**
 * NOTYA-INTAKE-EPOSTA-02 — POST: send the intake invitation (bilgi_formu) from the doctor's own connected mailbox.
 *
 * Body: { patientId?, randevuId?, kuyrukId?, link } → { ok: true, alici, tekrar } | { error }
 * Only bilgi_formu; same consent rule as the automatic sender; one send per invitation (lib/iletisim/bilgiFormuKutudan.ts).
 * Doctor and secretary (pratikOturum, turIzinliMi). Every id is ownership-checked in iletisimHazirla
 * (HASTA-IZOLASYON-01).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { bilgiFormuKutudanGonder } from '@/lib/iletisim/bilgiFormuKutudan'
import { doktorIletisimAyari } from '@/lib/iletisim/sunucu'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, user, personelId } = oturum
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })

  const ayar = await doktorIletisimAyari(supabase, doktorId)
  const s = await bilgiFormuKutudanGonder(
    supabase,
    { doktorId, rol, userId: user.id, personelId },
    { patientId: body.patientId, randevuId: body.randevuId, kuyrukId: body.kuyrukId, link: body.link },
    { doktorAdi: ayar.doktorAdi, doktorBransi: ayar.brans },
  )
  if (!s.ok) return NextResponse.json({ error: s.hata }, { status: s.durum })
  return NextResponse.json({ ok: true, alici: s.alici, tekrar: s.tekrar })
}
