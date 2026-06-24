
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { olusturWhatsAppLink } from '@/lib/mali/whatsappEngine'

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ','')
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const sb = getSupabase()
    const { data: { user }, error: ae } = await sb.auth.getUser(auth)
    if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const musteriId = req.nextUrl.searchParams.get('musteriId')
    const now = new Date()
    const ay = now.getMonth() + 1
    const yil = now.getFullYear()

    const { data: musteri } = musteriId
      ? await sb.from('mali_musteriler').select('*').eq('id', musteriId).eq('musavir_id', user.id).single()
      : { data: null }

    let q = sb.from('mali_beyan_takvimi').select('*,mali_musteriler(sirket_adi,yetkili_kisi,telefon)').eq('musavir_id', user.id)
    if (musteriId) q = (q as any).eq('musteri_id', musteriId)
    const { data: tumBeyanlar } = await q

    const ayBeyanlar = (tumBeyanlar || []).filter((b: Record<string,unknown>) => {
      const d = new Date(String(b.son_gun))
      return d.getMonth() + 1 === ay && d.getFullYear() === yil
    })

    const tamamlandi = ayBeyanlar.filter((b: Record<string,unknown>) => b.tamamlandi)
    const bekleyen = ayBeyanlar.filter((b: Record<string,unknown>) => !b.tamamlandi && new Date(String(b.son_gun)) >= now)
    const geciken = ayBeyanlar.filter((b: Record<string,unknown>) => !b.tamamlandi && new Date(String(b.son_gun)) < now)

    const musteriMap: Record<string, { sirketAdi: string; telefon: string; beyanlar: typeof ayBeyanlar }> = {}
    ayBeyanlar.forEach((b: Record<string,unknown>) => {
      const mid = String(b.musteri_id)
      const m = b.mali_musteriler as Record<string,string> | null
      if (!musteriMap[mid]) musteriMap[mid] = { sirketAdi: m?.sirket_adi || mid, telefon: m?.telefon || '', beyanlar: [] }
      musteriMap[mid].beyanlar.push(b)
    })

    const whatsappLinks = Object.values(musteriMap).slice(0,10).map(m => {
      const satirlar = m.beyanlar.map((b: Record<string,unknown>) => (b.tamamlandi ? 'OK ' : '- ') + String(b.beyan_turu) + ' ' + new Date(String(b.son_gun)).toLocaleDateString('tr-TR')).join(', ')
      const mesaj = 'Sayin ' + m.sirketAdi + ' - ' + ay + '/' + yil + ' Beyan Ozeti: ' + satirlar + '. Sorulariniz icin arayin.'
      return { sirketAdi: m.sirketAdi, link: m.telefon ? olusturWhatsAppLink(m.telefon, mesaj) : null, mesaj }
    })

    return NextResponse.json({
      success: true,
      data: { donem: ay + '/' + yil, ozet: { toplam: ayBeyanlar.length, tamamlandi: tamamlandi.length, bekleyen: bekleyen.length, geciken: geciken.length }, beyanlar: ayBeyanlar, whatsappLinks, musteri: musteri || null }
    })
  } catch (e: unknown) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
