/**
 * BRANS-PAKETI — the patient's private photos (Tabağım meal photos, progress / growth / lesion photos). PIN unlock required.
 *   POST multipart { modul, etiket?, riza=1, file } → store (magic-byte type check, metadata incl. location stripped,
 *        private bucket brans-paket-foto, path built from the token scope).
 *   GET  ?id= → the photo bytes (no-store) — only a photo of THIS token's patient and doctor.
 *   DELETE ?id= → the patient deletes his own photo (object + row).
 * HASTA-IZOLASYON: token → (patient_id, doctor_id) via portalKapsami; the id is matched only inside that scope; the
 * storage path must start with "<doctor_id>/<patient_id>/" before it is opened.
 */
import { NextRequest, NextResponse } from 'next/server'
import { portalKapsami, sonucYaniti } from '@/lib/saglikEvi/portalKapisi'
import { fotoEkle, fotoOku, fotoSil, PAKET_FOTO_AZAMI_BAYT } from '@/lib/portal/bransPaketiSunucu'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const g = await portalKapsami(req, params.token)
  if ('hata' in g) return g.hata
  const f = await fotoOku(g.sb, g.kapsam, req.nextUrl.searchParams.get('id') || '').catch(() => null)
  if (!f) return NextResponse.json({ error: 'Fotoğraf bulunamadı.' }, { status: 404 })
  return new NextResponse(Buffer.from(f.bayt), { headers: { 'Content-Type': f.mime, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const g = await portalKapsami(req, params.token)
  if ('hata' in g) return g.hata
  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!form || !(file instanceof Blob)) return NextResponse.json({ error: 'Fotoğraf seçin.' }, { status: 400 })
  if (file.size > PAKET_FOTO_AZAMI_BAYT) return NextResponse.json({ error: 'Fotoğraf en fazla 5 MB olabilir.' }, { status: 400 })
  try {
    const bayt = Buffer.from(await file.arrayBuffer())
    return sonucYaniti(await fotoEkle(g.sb, g.kapsam, { modul: String(form.get('modul') || ''), etiket: form.get('etiket') ? String(form.get('etiket')) : null, riza: form.get('riza') === '1', bayt }))
  } catch (e) {
    console.error('[portal/brans-paketi/foto] ekle:', (e as Error).message)
    return NextResponse.json({ error: 'Fotoğraf yüklenemedi.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { token: string } }) {
  const g = await portalKapsami(req, params.token)
  if ('hata' in g) return g.hata
  return sonucYaniti(await fotoSil(g.sb, g.kapsam, req.nextUrl.searchParams.get('id') || ''))
}
