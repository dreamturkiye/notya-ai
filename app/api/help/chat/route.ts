import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const getSB = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type ChatRole = 'user' | 'assistant'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ reply: 'Yetkisiz erişim.' }, { status: 401 })
    }
    const token = authHeader.slice('Bearer '.length).trim()
    const { data: { user }, error: authError } = await getSB().auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ reply: 'Yetkisiz erişim.' }, { status: 401 })
    }

    const { message, professionType, history } = await req.json()
    if (!message || typeof message !== 'string' || message.trim().length < 1) {
      return NextResponse.json({ reply: 'Mesaj gerekli.' }, { status: 400 })
    }
    if (message.length > 2000) {
      return NextResponse.json({ reply: 'Mesaj çok uzun.' }, { status: 400 })
    }

    let systemPrompt = ''
    switch (professionType) {
      case 'doktor':
        systemPrompt = 'Sen Notya AI yardim asistanisin. Kullanicilar Türkçe konusuyor. Notya AI bir Türk AI saglik platformudur. Prof. Ayse ile sesli konusma, hasta notu kaydetme, SOAP formati, dashboard özellikleri hakkinda yardim et. Kısa ve net cevaplar ver. Maksimum 3 cumle.'
        break
      case 'mali_musavirlik':
        systemPrompt = 'Sen Notya AI yardim asistanisin. Kullanicilar Türkçe konusuyor. Notya AI bir Türk AI mali müşavirlik platformudur. Uzm. Derya ile konusma, beyan takvimi, mevzuat arama, müşteri yönetimi hakkinda yardim et. Kısa ve net cevaplar ver. Maksimum 3 cumle.'
        break
      case 'avukat':
        systemPrompt = 'Sen Notya AI yardim asistanisin. Kullanicilar Türkçe konusuyor. Notya AI bir Türk AI hukuk asistan platformudur. 9 uzman avukatla konusma, sure takibi, dilekçe oluşturma, müvekkil yönetimi hakkinda yardim et. Kısa ve net cevaplar ver. Maksimum 3 cumle.'
        break
      default:
        systemPrompt = 'Sen Notya AI yardim asistanisin. Kullanicilar Türkçe konusuyor. Kısa ve net cevaplar ver. Maksimum 3 cumle.'
    }

    const rawHistory = Array.isArray(history) ? history : []
    const messages = rawHistory
      .slice(-6)
      .filter((item: { role?: string; content?: unknown }) =>
        (item?.role === 'user' || item?.role === 'assistant') &&
        typeof item.content === 'string' &&
        item.content.length > 0 &&
        item.content.length <= 2000
      )
      .map((item: { role: ChatRole; content: string }) => ({
        role: item.role as ChatRole,
        content: item.content,
      }))
    messages.push({ role: 'user', content: message.trim() })

    const response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: systemPrompt,
      messages,
    })

    return NextResponse.json({
      reply: response.content[0].type === 'text' ? response.content[0].text : 'Bir hata oluştu.',
    })
  } catch {
    return NextResponse.json({ reply: 'Bir hata oluştu, lutfen tekrar deneyin.' }, { status: 500 })
  }
}
