import { NextRequest, NextResponse } from 'next/server'
import { authDoctorFromBearer } from '@/lib/doktor/integrations'
import { parseTurkishIdCardText } from '@/lib/doktor/idCardParse'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Parse Turkish ID card image / OCR text.
 * Images are processed in-memory and discarded — never persisted.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }
  const doctor = await authDoctorFromBearer(auth.slice(7))
  if (!doctor) {
    return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })
  }

  const contentType = req.headers.get('content-type') || ''
  let ocrText = ''
  let imageBase64: string | undefined

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    const textField = form.get('ocrText')
    if (typeof textField === 'string') ocrText = textField
    const file = form.get('image')
    if (file && typeof file !== 'string') {
      const buf = Buffer.from(await (file as Blob).arrayBuffer())
      imageBase64 = buf.toString('base64')
    }
  } else {
    const body = await req.json().catch(() => ({}))
    ocrText = String((body as { ocrText?: string }).ocrText || '')
    imageBase64 = (body as { imageBase64?: string }).imageBase64
  }

  if (!ocrText && imageBase64) {
    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('tur+eng')
      const raw = imageBase64.includes(',')
        ? imageBase64.split(',')[1]
        : imageBase64
      const {
        data: { text },
      } = await worker.recognize(Buffer.from(raw, 'base64'))
      ocrText = text || ''
      await worker.terminate()
    } catch (e) {
      console.error('id-card OCR failed', e)
      return NextResponse.json(
        {
          error:
            'Görüntü okunamadı. Daha net fotoğraf çekin veya alanları manuel girin.',
        },
        { status: 422 }
      )
    }
  }

  if (!ocrText.trim()) {
    return NextResponse.json(
      { error: 'OCR metni veya kimlik görseli gerekli' },
      { status: 400 }
    )
  }

  const parsed = parseTurkishIdCardText(ocrText)
  // Drop raw image from memory path — never write to storage.
  imageBase64 = undefined

  return NextResponse.json({
    success: true,
    source: 'id_card_ocr',
    populated: Boolean(parsed.fields.adSoyad || parsed.fields.tcKimlikNo),
    confidence: parsed.confidence,
    fields: {
      tcKimlikNo: parsed.fields.tcKimlikNo || '',
      adSoyad: parsed.fields.adSoyad || '',
      dogumTarihi: parsed.fields.dogumTarihi || '',
      cinsiyet: parsed.fields.cinsiyet || '',
    },
    hints: parsed.rawHints,
    message:
      parsed.confidence >= 0.4
        ? 'Kimlik alanları okundu — lütfen kontrol edin'
        : 'Kısmi okuma — eksik alanları elle düzeltin',
  })
}
