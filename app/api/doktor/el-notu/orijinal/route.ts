/**
 * ESNEK-MUAYENE-A — POST { kaynakId, sayfa, mime, base64 } → the page photo the doctor keeps (re-encoded on the device: EXIF /
 * GPS stripped) into the patient's vault, category 'el_notu', on the visit. It is what the doctor sees in Belgeler; it is
 * never sent to a model. Staff with 'elnotu.hazirla' may upload (the secretary scans the pages).
 * HASTA-IZOLASYON: kaynak by id AND doctor_id; uploadDocument re-checks patient + visit ownership.
 */
import { NextRequest } from 'next/server'
import { elNotuIstegi, json } from '@/lib/elNotu/rota'
import { kaynakAl, vaultaYaz } from '@/lib/elNotu/sunucu'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const o = await elNotuIstegi(req, 'hazirla')
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as { kaynakId?: unknown; sayfa?: unknown; mime?: unknown; base64?: unknown } | null
  const kaynak = await kaynakAl(o.supabase, o.doktorId, b?.kaynakId)
  if (!kaynak || !kaynak.patient_id) return json({ error: 'Kaynak bulunamadı.' }, 404)
  if (typeof b?.base64 !== 'string' || b.base64.length > 4_000_000 || !/^image\/(jpeg|png|webp)$/.test(String(b.mime))) return json({ error: 'Sayfa geçersiz.' }, 400)
  try {
    const id = await vaultaYaz(o.supabase, { doktorId: o.doktorId, patientId: kaynak.patient_id, sessionId: kaynak.session_id, ad: `el-notu-sayfa-${Number(b.sayfa) || 1}.jpg`, mime: String(b.mime), base64: b.base64, kategori: 'el_notu', yukleyen: o.user.id })
    return json({ belgeId: id })
  } catch { return json({ error: 'Sayfa kaydedilemedi.' }, 500) }
}
