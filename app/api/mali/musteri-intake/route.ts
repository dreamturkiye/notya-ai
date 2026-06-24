import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { olusturEsnafProfil } from '@/lib/mali/esnafEngine'

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const sb = getSupabase()
    const { data: { user }, error: ae } = await sb.auth.getUser(auth)
    if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sirket_adi, vergi_no, yetkili_kisi, telefon, email, faaliyet_alani, sirket_turu, calisan_sayisi, notlar, buyuksehirde } = await req.json()
    if (!sirket_adi?.trim()) return NextResponse.json({ error: 'Sirket adi gerekli' }, { status: 400 })

    // 1. Create customer
    const { data: musteri, error: me } = await sb.from('mali_musteriler').insert({
      musavir_id: user.id,
      sirket_adi: sirket_adi.trim(),
      vergi_no: vergi_no?.trim() || null,
      yetkili_kisi: yetkili_kisi?.trim() || null,
      telefon: telefon?.trim() || null,
      email: email?.trim() || null,
      faaliyet_alani: faaliyet_alani?.trim() || null,
      sirket_turu: sirket_turu || 'sahis',
      notlar: notlar?.trim() || null,
      is_active: true
    }).select().single()
    if (me || !musteri) return NextResponse.json({ error: me?.message || 'Musteri olusturulamadi' }, { status: 500 })

    // 2. Auto-classify and generate beyan takvimi
    const profil = olusturEsnafProfil(
      faaliyet_alani || sirket_adi,
      sirket_turu || 'sahis',
      Number(calisan_sayisi) || 0,
      buyuksehirde !== false // default true
    )

    // 3. Insert beyan takvimi entries
    const yil = new Date().getFullYear()
    const takvimRows = profil.beyanlar.flatMap(b =>
      b.aylar.map(ay => ({
        musavir_id: user.id,
        musteri_id: musteri.id,
        beyan_turu: b.beyanTuru,
        son_gun: new Date(yil, ay - 1, b.periyot === 'aylik' ? 26 : b.periyot === '3_aylik' ? 17 : 31).toISOString().split('T')[0],
        tamamlandi: false,
        aciklama: b.aciklama,
        kanun_dayanagi: b.kanunDayanagi
      }))
    )

    if (takvimRows.length > 0) {
      await sb.from('mali_beyan_takvimi').insert(takvimRows)
    }

    return NextResponse.json({
      success: true,
      data: {
        musteri,
        profil: {
          vergilendirmeUsulu: profil.vergilendirmeUsulu,
          beyanSayisi: takvimRows.length,
          riskler: profil.riskler,
          notlar: profil.notlar
        }
      }
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Hata' }, { status: 500 })
  }
}
