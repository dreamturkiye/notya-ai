/**
 * HASTA-ALANI-MARKA — the doctor's profile photo for his patients' portal header (when he has no logo and did not switch
 * the photo off in Ayarlar › Hasta Alanı Görünümü). The token decides the doctor; only THAT doctor's doctor_avatars row is
 * read. No patient data. Shown on the PIN screen too, so no unlock is required (it is the doctor's own picture).
 * Versioned URL (?v=) → cached for a year in the patient's browser, never in a shared cache.
 */
import { NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { tokenDoktoru, fotoKullanilabilir } from '@/lib/portal/markaSunucu'
import { cizilebilirDataUrl, fotoKaresiCiz, hekimFotoBaytlari, onbellekliPng } from '@/lib/portal/markaCizim'
import { gorselTuruKoklayarak } from '@/lib/portal/markaGorsel'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const YOK = () => new NextResponse(null, { status: 404, headers: { 'cache-control': 'no-store' } })
const KALICI = 'private, max-age=31536000, immutable'

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const sb = servisSupabase()
  const t = await tokenDoktoru(sb, params.token)
  if (!t) return YOK()
  const [{ data: ayar }, { data: av }] = await Promise.all([
    sb.from('hasta_alani_gorunumu').select('foto_goster').eq('doctor_id', t.doctorId).maybeSingle(),
    sb.from('doctor_avatars').select('mime_type, byte_length').eq('doctor_id', t.doctorId).maybeSingle(),
  ])
  if (ayar?.foto_goster === false || !fotoKullanilabilir(av)) return YOK()
  const bayt = await hekimFotoBaytlari(sb, t.doctorId)
  if (!bayt) return YOK()
  const tur = gorselTuruKoklayarak(bayt)
  if (!tur) return YOK()
  // Small enough → as is; a large PNG / JPEG is downscaled once to a 256 px tile.
  if (bayt.length <= 250_000 || tur === 'image/webp') {
    return new NextResponse(new Uint8Array(bayt), { headers: { 'content-type': tur, 'cache-control': KALICI, 'x-robots-tag': 'noindex', 'x-content-type-options': 'nosniff' } })
  }
  const dataUrl = cizilebilirDataUrl(bayt)
  return dataUrl ? onbellekliPng(fotoKaresiCiz(dataUrl), KALICI) : YOK()
}
