import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM_PROMPTS: Record<string, string> = {
  doktor: 'Sen Notya AI yardim asistanisin. Kullanicilar Turkce konusuyor. Notya AI bir Turk AI saglik platformudur. Prof. Ayse ile sesli konusma, hasta notu kaydetme, SOAP formati, dashboard ozellikleri hakkinda yardim et. Kisa ve net cevaplar ver. Maksimum 3 cumle.',
  mali_musavirlik: 'Sen Notya AI yardim asistanisin. Kullanicilar Turkce konusuyor. Notya AI bir Turk AI mali musavirlik platformudur. Uzm. Derya ile konusma, beyan takvimi, mevzuat arama, musteri yonetimi hakkinda yardim et. Kisa ve net cevaplar ver. Maksimum 3 cumle.',
  avukat: 'Sen Notya AI yardim asistanisin. Kullanicilar Turkce konusuyor. Notya AI bir Turk AI hukuk asistan platformudur. 9 uzman avukatla konusma, sure takibi, dilekce olusturma, muvekkel yonetimi hakkinda yardim et. Kisa ve net cevaplar ver. Maksimum 3 cumle.',
}

export async function POST(req: NextRequest) {
  try {
    const { message, professionType, history } = await req.json()
    const systemPrompt = SYSTEM_PROMPTS[professionType] || SYSTEM_PROMPTS.doktor
    const messages = [
      ...(history || []).slice(-6).map((m: { role: string; content: string }) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message }
    ]
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: systemPrompt,
      messages
    })
    const reply = response.content[0].type === 'text' ? response.content[0].text : 'Bir hata olustu.'
    return NextResponse.json({ reply })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ reply: 'Bir hata olustu, lutfen tekrar deneyin.' }, { status: 500 })
  }
}
