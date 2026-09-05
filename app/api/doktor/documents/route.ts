import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
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

    const bytes = Buffer.from(await file.arrayBuffer())
    const document = await uploadDocument(
      { supabase },
      {
        doctorId: user.id,
        patientId,
        visitId,
        fileName: file.name || 'belge',
        fileType: file.type || 'application/octet-stream',
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
