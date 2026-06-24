import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Derya analyses the document and returns structured data
async function deryaAnaliz(fileBase64: string, mimeType: string, belgeTuru: string, isletmeTipi: string, donem: string, notlar: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing')

  const prompt = `Sen Uzm. Derya Yilmaz, deneyimli bir SMMM'sin. Bu belgeyi analiz et ve yap�land�r�lm�s� veri ��kar.

Belge t�r�: ${belgeTuru}
I�s�letme tipi: ${isletmeTipi || 'belirtilmedi'}
D�nem: ${donem}
Ek notlar: ${notlar || 'yok'}

S�u bilgileri ��kar (varsa):
- Belge tarihi
- Toplam tutar (KDV dahil)
- KDV tutar�
- KDV hari� tutar
- KDV oran� (%8, %18, %20 vs)
- Tedarik�i/Firma ad� (varsa)
- Belge no (fatura no, Z raporu no vs)
- I�s�lem t�r� (sat�s�/gider/bordro/kira vs)
- �nemli notlar

SADECE JSON d�n, bas�ka metin ekleme:
{
  "tarih": "YYYY-MM-DD veya null",
  "toplamTutar": numericOrNull,
  "kdvTutari": numericOrNull,
  "kdvHaricTutar": numericOrNull,
  "kdvOrani": numericOrNull,
  "firmAdi": "string veya null",
  "belgeNo": "string veya null",
  "islemTuru": "satis|gider|bordro|kira|diger",
  "ozet": "1-2 cumle Turkce ozet",
  "guvenSkor": 0-100,
  "uyarilar": ["liste"]
}`

  // Use Claude API with vision if image/PDF
  const isImage = mimeType.startsWith('image/')
  const isPDF = mimeType === 'application/pdf'

  const messages: { role: string; content: unknown[] }[] = []

  if (isImage || isPDF) {
    messages.push({
      role: 'user',
      content: [
        { type: isPDF ? 'document' : 'image', source: { type: 'base64', media_type: mimeType, data: fileBase64 } },
        { type: 'text', text: prompt }
      ]
    })
  } else {
    // Excel/XML - just text
    messages.push({ role: 'user', content: [{ type: 'text', text: prompt + '\n\nBelge metni verilmedi (Excel/XML). Belge t�r�ne g�re genel analiz yap.' }] })
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1024, messages })
  })

  const data = await res.json()
  const text = data.content?.[0]?.text || '{}'
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch { return { ozet: text.substring(0, 200), guvenSkor: 50 } }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const sb = getSupabase()
    const { data: { user }, error: ae } = await sb.auth.getUser(auth)
    if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const form = await req.formData()
    const files = form.getAll('files') as File[]
    const belgeTuru = form.get('belgeTuru') as string || 'diger_belge'
    const isletmeTipi = form.get('isletmeTipi') as string || ''
    const donem = form.get('donem') as string || new Date().toISOString().slice(0,7)
    const notlar = form.get('notlar') as string || ''

    if (!files.length) return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 })

    const results = []
    for (const file of files.slice(0, 5)) { // max 5 files per request
      const bytes = await file.arrayBuffer()
      const b64 = Buffer.from(bytes).toString('base64')
      const mimeType = file.type || 'application/octet-stream'

      // Store file in Supabase Storage
      const fileName = `${user.id}/${donem}/${Date.now()}_${file.name}`
      const { error: uploadErr } = await sb.storage.from('mali-belgeler').upload(fileName, bytes, { contentType: mimeType })
      const storageUrl = uploadErr ? null : fileName

      // Derya analyzes the document
      let analiz: Record<string, unknown> = {}
      try {
        analiz = await deryaAnaliz(b64, mimeType, belgeTuru, isletmeTipi, donem, notlar)
      } catch (e) { analiz = { ozet: 'Analiz yapilamadi', guvenSkor: 0, hata: String(e) } }

      // Save to DB
      const { data: belge } = await sb.from('mali_belgeler').insert({
        musavir_id: user.id,
        belge_turu: belgeTuru,
        isletme_tipi: isletmeTipi,
        donem,
        dosya_adi: file.name,
        storage_path: storageUrl,
        notlar,
        analiz_json: analiz,
        tarih: analiz.tarih as string || null,
        toplam_tutar: analiz.toplamTutar as number || null,
        kdv_tutari: analiz.kdvTutari as number || null,
        islem_turu: analiz.islemTuru as string || 'diger',
        guven_skor: analiz.guvenSkor as number || 50,
        ozet: analiz.ozet as string || '',
        inceleme_bekliyor: (analiz.guvenSkor as number || 50) < 70,
      }).select().single()

      results.push({ dosya: file.name, analiz, id: belge?.id })
    }

    // Build Derya's response message
    const ozets = results.map(r => r.analiz?.ozet || r.dosya).join(' | ')
    const dusukGuven = results.filter(r => (r.analiz?.guvenSkor as number || 100) < 70)

    return NextResponse.json({
      success: true,
      message: `${results.length} belge islendi. ${ozets}${dusukGuven.length ? ` | ${dusukGuven.length} belge inceleme bekliyor.` : ''}`.substring(0, 300),
      results,
      count: results.length
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Hata' }, { status: 500 })
  }
}