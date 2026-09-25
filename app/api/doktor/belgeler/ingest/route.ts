import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { groqChat } from '@/lib/dr-ayse/groq'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
export const dynamic = 'force-dynamic'

const getSB = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } }
)

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer '))
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const sb = getSB()
  const { data: { user }, error: ae } = await sb.auth.getUser(authHeader.split(' ')[1])
  if (ae || !user) return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })
  const { base64, mimeType, hastaId, belgeType } = await req.json()
  // HASTA-IZOLASYON-01: no upload and no hasta_belgeler row for a patient this doctor does not own.
  if (!(await hastaSahibiMi(sb, user.id, hastaId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  const ext = mimeType?.split('/')[1] || 'pdf'
  const { data: uploadData, error: uploadError } = await sb.storage
    .from('hasta-belgeler')
    .upload(user.id + '/' + hastaId + '/' + Date.now() + '.' + ext,
      Buffer.from(base64, 'base64'), { contentType: mimeType })
  if (uploadError) return NextResponse.json({ error: 'Dosya yüklenemedi.' }, { status: 500 })
  // NOTYA-GELEN-BELGELER: hasta-belgeler is a PRIVATE bucket. We used to store a public-style URL here, which either
  // 404s or — if the bucket were ever flipped public — exposes the file to anyone with the link. Store a storage
  // reference instead and hand the caller a short-lived signed URL.
  const dosya_url = 'hasta-belgeler/' + uploadData.path
  const { data: imzali } = await sb.storage.from('hasta-belgeler').createSignedUrl(uploadData.path, 600)
  const sysMap: Record<string,string> = {
    'Lab Sonucu': 'Tibbi lab belgesi. JSON: {"testler":[{"ad":"","deger":"","birim":"","referansAralik":"","anormal":false}],"labAdi":"","tarih":""}',
    'Goruntulemeler': 'Radyoloji. JSON: {"modalite":"","bolge":"","bulgular":"","izlenim":"","radyolog":"","tarih":""}',
  }
  const systemPrompt = sysMap[belgeType] || 'Tibbi belge. JSON: {"tip":"","icerik":"","tarih":""}'
  let aiOzet: Record<string,unknown> = {}
  try {
    const raw = await groqChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Analiz et. Sadece JSON.' }
    ], { temperature: 0.1, maxTokens: 1500, jsonMode: true })
    aiOzet = JSON.parse(raw)
  } catch { aiOzet = { hata: 'basarisiz' } }
  const { data: belge, error } = await sb.from('hasta_belgeler')
    .insert({ doctor_id: user.id, patient_id: hastaId, belge_turu: belgeType, dosya_url, ai_ozet: aiOzet, inceleme_bekliyor: true })
    .select().single()
  if (error) return NextResponse.json({ error: 'Kaydedilemedi' }, { status: 500 })
  return NextResponse.json({ belge, aiOzet, imzaliUrl: imzali?.signedUrl ?? null })
}