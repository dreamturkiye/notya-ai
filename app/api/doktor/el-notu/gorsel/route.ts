/**
 * ESNEK-MUAYENE-A — GET ?belgeId= → bytes of an El Notu MASKED page or memory crop (Doğrula crops are drawn from it).
 * Only categories 'el_notu_maskeli' / 'el_notu_kirpinti' — never an original, never another document type.
 * HASTA-IZOLASYON: getDocumentMeta / downloadDocument scope by doctor_id (a foreign id = 404).
 */
import { NextRequest, NextResponse } from 'next/server'
import { elNotuIstegi, json, uuidMu } from '@/lib/elNotu/rota'
import { downloadDocument } from '@/lib/vault/service'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const o = await elNotuIstegi(req, 'hazirla')
  if ('hata' in o) return o.hata
  const id = new URL(req.url).searchParams.get('belgeId')
  if (!uuidMu(id)) return json({ error: 'Belge gerekli.' }, 400)
  try {
    const { meta, bytes } = await downloadDocument({ supabase: o.supabase }, o.doktorId, id)
    if (meta.category !== 'el_notu_maskeli' && meta.category !== 'el_notu_kirpinti') return json({ error: 'Belge bulunamadı.' }, 404)
    return new NextResponse(new Uint8Array(bytes), { headers: { 'content-type': meta.fileType, 'cache-control': 'private, max-age=600' } })
  } catch { return json({ error: 'Belge bulunamadı.' }, 404) }
}
