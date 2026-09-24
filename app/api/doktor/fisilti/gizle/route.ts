/**
 * NOTYA-FISILTI-GIZLE-01 — hide / list / restore Fısıltı items. Never changes clinical data.
 *
 * GET              → { gizlenenler: [{ gizleId, ad, baslik, detay, until, createdAt }] } — hidden items that are
 *                    still in the doctor's own current list (facts unchanged, 7-gün window open).
 * POST { itemId, sure: 'kalici' | '7gun' } → hides that item. The item is looked up in the doctor's OWN
 *                    freshly-built list (fisiltiOgeleri) — patient_id and the facts hash come from there, never
 *                    from the request body.
 * PATCH { gizleId } → "Geri getir": sets kaldirildi_at on the row, scoped by id AND doctor_id.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { fisiltiOgeleri, fisiltiGizlemeleri } from '@/lib/doktor/fisiltiTopla'
import { fisiltiAyir, fisiltiIcerikOzeti, gizleUntil, type GizleSure } from '@/lib/doktor/fisiltiGizle'
import { logFisiltiGizleme } from '@/lib/security/auditLogger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const { ogeler } = await fisiltiOgeleri(req, supabase, user.id)
  const { gizli } = fisiltiAyir(ogeler, await fisiltiGizlemeleri(supabase, user.id), new Date())
  return NextResponse.json({
    gizlenenler: gizli.map(({ item, kayit }) => ({ gizleId: kayit.id, ad: item.ad, baslik: item.baslik, detay: item.detay[0] || '', until: kayit.until, createdAt: kayit.created_at })),
  })
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const b = (await req.json().catch(() => null)) as { itemId?: unknown; sure?: unknown } | null
  const itemId = typeof b?.itemId === 'string' ? b.itemId.slice(0, 200) : ''
  const sure: GizleSure = b?.sure === '7gun' ? '7gun' : 'kalici'
  if (!itemId) return NextResponse.json({ error: 'Uyarı seçilmedi.' }, { status: 400 })

  const { ogeler } = await fisiltiOgeleri(req, supabase, user.id)
  const item = ogeler.find((o) => o.id === itemId)
  if (!item) return NextResponse.json({ error: 'Bu uyarı artık listede değil.' }, { status: 404 })

  const { data, error } = await supabase
    .from('fisilti_gizlenen')
    .insert({ doctor_id: user.id, patient_id: item.patientId, tur: item.id, icerik_ozeti: fisiltiIcerikOzeti(item), until: gizleUntil(sure, new Date()) })
    .select('id')
    .single()
  if (error || !data) return NextResponse.json({ error: 'Gizlenemedi — tekrar deneyin.' }, { status: 500 })
  await logFisiltiGizleme(user.id, item.patientId, 'gizle', { tur: item.id, sure }, req)
  return NextResponse.json({ ok: true, gizleId: data.id })
}

export async function PATCH(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const b = (await req.json().catch(() => null)) as { gizleId?: unknown } | null
  const gizleId = typeof b?.gizleId === 'string' && /^[0-9a-f-]{36}$/i.test(b.gizleId) ? b.gizleId : ''
  if (!gizleId) return NextResponse.json({ error: 'Kayıt seçilmedi.' }, { status: 400 })

  const { data } = await supabase
    .from('fisilti_gizlenen')
    .update({ kaldirildi_at: new Date().toISOString() })
    .eq('id', gizleId)
    .eq('doctor_id', user.id)
    .is('kaldirildi_at', null)
    .select('patient_id, tur')
    .maybeSingle()
  if (!data) return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 })
  await logFisiltiGizleme(user.id, String(data.patient_id), 'geri_getir', { tur: data.tur }, req)
  return NextResponse.json({ ok: true })
}
