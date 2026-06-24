import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { olusturMesaj, olusturWhatsAppLink, olusturApiPayload, gunHesapla } from '@/lib/mali/whatsappEngine'

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET: fetch upcoming deadlines needing reminders
export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const sb = getSupabase()
    const { data: { user }, error: ae } = await sb.auth.getUser(auth)
    if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const today = new Date()
    const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    const { data: beyanlar } = await sb
      .from('mali_beyan_takvimi')
      .select('*, mali_musteriler(sirket_adi, yetkili_kisi, telefon)')
      .eq('musavir_id', user.id)
      .eq('tamamlandi', false)
      .gte('son_gun', today.toISOString().split('T')[0])
      .lte('son_gun', in7Days.toISOString().split('T')[0])
      .order('son_gun', { ascending: true })

    const items = (beyanlar || []).map((b: Record<string, unknown>) => {
      const musteri = b.mali_musteriler as Record<string, string> | null
      const gunKaldi = gunHesapla(String(b.son_gun))
      const mesaj = olusturMesaj({
        musteriAdi: musteri?.yetkili_kisi || 'Sayin Yetkili',
        sirketAdi: musteri?.sirket_adi || '',
        beyanTuru: String(b.beyan_turu),
        sonGun: String(b.son_gun),
        gunKaldi,
      })
      const whatsappLink = musteri?.telefon
        ? olusturWhatsAppLink(musteri.telefon, mesaj)
        : null

      return {
        id: b.id,
        sirketAdi: musteri?.sirket_adi,
        beyanTuru: b.beyan_turu,
        sonGun: b.son_gun,
        gunKaldi,
        telefon: musteri?.telefon || null,
        whatsappLink,
        mesaj,
        aciliyet: gunKaldi <= 1 ? 'kritik' : gunKaldi <= 3 ? 'acil' : 'normal'
      }
    })

    return NextResponse.json({ success: true, data: items, count: items.length })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Hata' }, { status: 500 })
  }
}

// POST: send WhatsApp notification via Cloud API
export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const sb = getSupabase()
    const { data: { user }, error: ae } = await sb.auth.getUser(auth)
    if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { beyanId, telefon, mesaj } = await req.json()
    if (!beyanId || !telefon || !mesaj) {
      return NextResponse.json({ error: 'beyanId, telefon ve mesaj gerekli' }, { status: 400 })
    }

    const waToken = process.env.WHATSAPP_BUSINESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    // If WhatsApp Business API configured, send directly
    if (waToken && phoneNumberId) {
      const payload = olusturApiPayload(telefon, mesaj)
      const resp = await fetch(
        `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${waToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )
      if (!resp.ok) {
        const err = await resp.text()
        return NextResponse.json({ success: false, error: `WhatsApp API: ${err}`, fallback: olusturWhatsAppLink(telefon, mesaj) }, { status: 200 })
      }
      // Mark as sent
      await sb.from('mali_beyan_takvimi').update({ hatirlatma_gonderildi: true }).eq('id', beyanId)
      return NextResponse.json({ success: true, method: 'api' })
    }

    // Fallback: return click-to-chat link
    const link = olusturWhatsAppLink(telefon, mesaj)
    return NextResponse.json({ success: true, method: 'link', whatsappLink: link, mesaj })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Hata' }, { status: 500 })
  }
}
