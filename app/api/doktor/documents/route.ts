import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { belgeTuruIzinliMi } from '@/lib/doktor/belgeTurleri'
import {
  VaultAccessError,
  VaultValidationError,
  listDocuments,
  uploadDocument,
} from '@/lib/vault/service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/doktor/documents?patientId=&visitId= — metadata only */
export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  const patientId = req.nextUrl.searchParams.get('patientId') || undefined
  const visitId = req.nextUrl.searchParams.get('visitId') || undefined

  try {
    const documents = await listDocuments({ supabase }, user.id, { patientId, visitId })
    return NextResponse.json({ documents })
  } catch {
    return NextResponse.json({ error: 'Belgeler listelenemedi' }, { status: 500 })
  }
}

/** POST multipart: file, patientId, visitId?, notes?, category? */
export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  try {
    const form = await req.formData()
    const file = form.get('file')
    const patientId = String(form.get('patientId') || '')
    const visitId = String(form.get('visitId') || '') || null
    const notes = String(form.get('notes') || '') || null
    const category = String(form.get('category') || '') || null

    if (!patientId) {
      return NextResponse.json({ error: 'Hasta seçimi zorunludur' }, { status: 400 })
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Dosya zorunludur' }, { status: 400 })
    }

    // BRANŞ-ALAN-SIZMASI: Yenidoğan Taburculuk Epikrizi yalnız pediatri / KD.
    if (category) {
      const { data: doktor } = await supabase.from('users').select('specialty').eq('id', user.id).maybeSingle()
      if (!belgeTuruIzinliMi(category, doktor?.specialty)) {
        return NextResponse.json(
          { error: 'Bu belge türü branşınız için kullanılamaz.' },
          { status: 400 },
        )
      }
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const ad = (file.name || 'belge').toLowerCase()
    let fileType = file.type || 'application/octet-stream'
    if (!fileType || fileType === 'application/octet-stream') {
      if (ad.endsWith('.heic')) fileType = 'image/heic'
      else if (ad.endsWith('.heif')) fileType = 'image/heif'
      else if (ad.endsWith('.jpg') || ad.endsWith('.jpeg')) fileType = 'image/jpeg'
      else if (ad.endsWith('.png')) fileType = 'image/png'
      else if (ad.endsWith('.webp')) fileType = 'image/webp'
      else if (ad.endsWith('.pdf')) fileType = 'application/pdf'
      else if (ad.endsWith('.m4a')) fileType = 'audio/mp4'
      else if (ad.endsWith('.mp3')) fileType = 'audio/mpeg'
      else if (ad.endsWith('.wav')) fileType = 'audio/wav'
    }
    const document = await uploadDocument(
      { supabase },
      {
        doctorId: user.id,
        patientId,
        visitId,
        fileName: file.name || 'belge',
        fileType,
        bytes,
        notes,
        category,
        uploadedBy: user.id,
      }
    )
    return NextResponse.json({ document }, { status: 201 })
  } catch (e) {
    if (e instanceof VaultValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    if (e instanceof VaultAccessError) {
      return NextResponse.json({ error: e.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Belge yüklenemedi' }, { status: 500 })
  }
}
