/**
 * GERI-CAGIRMA-01 — "Çağır": the one send action. CORE; doktor + personel (pratikOturum), as bulk messaging.
 * Requires an explicit `onay: true` — set only after the screen showed the count, the channel split and the text.
 *
 * POST { patientIds[], sablon?, istekAnahtari, onay: true }
 *   → { durum: 'tamamlandi' | 'devam', gonderilen, basarisiz, atlanan, zatenIslenen, kanal, kalan, hatalar }
 * 'devam' = the per-request cap was reached: POST again with the SAME istekAnahtari; nobody is messaged twice.
 *
 * HASTA-IZOLASYON: the patient ids come from the body. They are never used to read or write directly: the engine
 * recomputes the doctor's own due list restricted to those ids (every query carries the doctor id), so another
 * doctor's patient id is simply "not due" — skipped, nothing read, nothing written (lib/geriCagirma/gonder.ts).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { geriCagir, GeriCagirmaHatasi } from '@/lib/geriCagirma/gonder'
import { adaylariTopla } from '@/lib/geriCagirma/kaynak'
import { sayaclariYenile } from '@/lib/geriCagirma/sayac'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, user, rol, personelId } = oturum
  const b = (await req.json().catch(() => null)) as { patientIds?: unknown; sablon?: unknown; istekAnahtari?: unknown; onay?: unknown } | null
  if (!b) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  if (b.onay !== true) return NextResponse.json({ error: 'Gönderim için onay gereklidir — önce önizlemeyi kontrol edin.' }, { status: 400 })
  try {
    const sonuc = await geriCagir(supabase, doktorId, { userId: user.id, personelId: personelId || null, rol }, { patientIds: b.patientIds, sablon: b.sablon, istekAnahtari: b.istekAnahtari })
    if (sonuc.durum === 'tamamlandi') {
      // Keep the stored "can be recalled now" number honest after a send (the cache was cleared by the engine).
      const { liste } = await adaylariTopla(supabase, doktorId, { taze: true })
      await sayaclariYenile(supabase, doktorId, { cagrilabilir: liste.adaylar.length }).catch(() => false)
    }
    return NextResponse.json(sonuc)
  } catch (e) {
    if (e instanceof GeriCagirmaHatasi) {
      return NextResponse.json({ error: e.message, kod: e.kod }, { status: e.kod === 'gecersiz' ? 400 : 503 })
    }
    console.error('[geri-cagirma] gonder', (e as Error)?.message)
    return NextResponse.json({ error: 'Geri çağırma gönderilemedi.' }, { status: 500 })
  }
}
