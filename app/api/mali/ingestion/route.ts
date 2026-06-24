import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSB = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function deryaAnaliz(b64: string, mime: string, belgeTuru: string, isletmeTipi: string, donem: string, notlar: string) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY missing')
  const isImg = mime.startsWith('image/')
  const isPDF = mime === 'application/pdf'
  const prompt = 'Sen Uzm. Derya Yilmaz, deneyimli SMMM. Belgeyi analiz et. Belge turu: ' + belgeTuru + '. Isletme: ' + (isletmeTipi||'genel') + '. Donem: ' + donem + '. Notlar: ' + (notlar||'yok') + '. SADECE JSON don: {"tarih":null,"toplamTutar":null,"kdvTutari":null,"kdvHaricTutar":null,"kdvOrani":null,"firmaAdi":null,"belgeNo":null,"islemTuru":"gider","ozet":"ozet","guvenSkor":80,"uyarilar":[]}'
  const textPart = { type:'text' as const, text: prompt }
  let content: unknown[]
  if (isImg) content = [{ type:'image', source:{ type:'base64', media_type:mime, data:b64 }}, textPart]
  else if (isPDF) content = [{ type:'document', source:{ type:'base64', media_type:'application/pdf' as const, data:b64 }}, textPart]
  else content = [{ type:'text', text: prompt + ' (Excel/XML dosyasi - format analizi yap)' }]
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers:{ 'x-api-key':key, 'anthropic-version':'2023-06-01', 'content-type':'application/json' },
    body: JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:1024, messages:[{ role:'user', content }] })
  })
  const d = await res.json()
  const txt = d.content?.[0]?.text || '{}'
  try { return JSON.parse(txt.replace(/```json|```/g,'').trim()) }
  catch { return { ozet: txt.substring(0,200), guvenSkor:40 } }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ','')
    if (!auth) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
    const sb = getSB()
    const { data:{ user }, error:ae } = await sb.auth.getUser(auth)
    if (ae || !user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
    const form = await req.formData()
    const files = form.getAll('files') as File[]
    const belgeTuru = form.get('belgeTuru') as string || 'diger_belge'
    const isletmeTipi = form.get('isletmeTipi') as string || ''
    const donem = form.get('donem') as string || new Date().toISOString().slice(0,7)
    const notlar = form.get('notlar') as string || ''
    const musteriId = form.get('musteriId') as string | null
    if (!files.length) return NextResponse.json({ error:'Dosya gerekli' }, { status:400 })
    const results = []
    for (const file of files.slice(0,5)) {
      const bytes = await file.arrayBuffer()
      const b64 = Buffer.from(bytes).toString('base64')
      const mime = file.type || 'application/octet-stream'
      const fname = user.id + '/' + donem + '/' + Date.now() + '_' + file.name
      const { error:upErr } = await sb.storage.from('mali-belgeler').upload(fname, bytes, { contentType:mime })
      const storagePath = upErr ? null : fname
      let analiz: Record<string,unknown> = {}
      try { analiz = await deryaAnaliz(b64, mime, belgeTuru, isletmeTipi, donem, notlar) }
      catch (e) { analiz = { ozet:'Analiz yapilamadi', guvenSkor:0 } }
      const { data:belge } = await sb.from('mali_belgeler').insert({
        musavir_id:user.id, musteri_id:musteriId, belge_turu:belgeTuru,
        isletme_tipi:isletmeTipi, donem, dosya_adi:file.name,
        storage_path:storagePath, notlar, analiz_json:analiz,
        tarih:analiz.tarih||null, toplam_tutar:analiz.toplamTutar||null,
        kdv_tutari:analiz.kdvTutari||null, islem_turu:analiz.islemTuru||'diger',
        guven_skor:analiz.guvenSkor||50, ozet:analiz.ozet||'',
        inceleme_bekliyor:((analiz.guvenSkor as number)||50)<70,
      }).select().single()
      results.push({ dosya:file.name, analiz, id:belge?.id })
    }
    const dusuk = results.filter(r => ((r.analiz?.guvenSkor as number)||100)<70)
    const msg = results.length + ' belge islendi.' + (dusuk.length ? ' ' + dusuk.length + ' belge inceleme bekliyor.' : ' Tumu onaylandi.')
    return NextResponse.json({ success:true, message:msg, results, count:results.length })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Hata' }, { status:500 })
  }
}
