import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const { message, professionType, history } = await req.json()

    let systemPrompt = ''
    switch (professionType) {
      case 'doktor':
        systemPrompt = 'Sen Notya AI yardim asistanisin. Kullanicilar Türkçe konusuyor. Notya AI bir Türk AI saglik platformudur. Prof. Ayse ile sesli konusma, hasta notu kaydetme, SOAP formati, dashboard özellikleri hakkinda yardim et. Kısa ve net cevaplar ver. Maksimum 3 cumle.'
        break
      case 'mali_müşavirlik':
        systemPrompt = 'Sen Notya AI yardim asistanisin. Kullanicilar Türkçe konusuyor. Notya AI bir Türk AI mali müşavirlik platformudur. Uzm. Derya ile konusma, beyan takvimi, mevzuat arama, müşteri yönetimi hakkinda yardim et. Kısa ve net cevaplar ver. Maksimum 3 cumle.'
        break
      case 'avukat':
        systemPrompt = 'Sen Notya AI yardim asistanisin. Kullanicilar Türkçe konusuyor. Notya AI bir Türk AI hukuk asistan platformudur. 9 uzman avukatla konusma, sure takibi, dilekçe oluşturma, müvekkil yönetimi hakkinda yardim et. Kısa ve net cevaplar ver. Maksimum 3 cumle.'
        break
      default:
        systemPrompt = 'Sen Notya AI yardim asistanisin. Kullanicilar Türkçe konusuyor. Kısa ve net cevaplar ver. Maksimum 3 cumle.'
    }

    const messages = history.slice(-6).map(item => ({
      role: item.role,
      content: item.content
    }))
    messages.push({ role: 'user', content: message })

    const response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: systemPrompt,
      messages
    })

    return NextResponse.json({ reply: response.content[0].type === 'text' ? response.content[0].text : 'Bir hata oluştu.' })
  } catch (error) {
    return NextResponse.json({ reply: 'Bir hata oluştu, lutfen tekrar deneyin.' }, { status: 500 })
  }
}