import { NextRequest, NextResponse } from 'next/server'
import { bosProfil, klinikBaglam, klinikHesabiniBagla, slugYap, yetkileriKur, yoneticiDegil } from '@/lib/klinik/katman/sunucu'
import {
  haftayiDogrula,
  klinikAdiDogrula,
  rezervasyonDogrula,
  varsayilanHafta,
  varsayilanRezervasyon,
  vergiNoDogrula,
  widgetDogrula,
  type CalismaHaftasi,
  type MesajAyari,
  type RezervasyonKurali,
  type WidgetAyari,
} from '@/lib/klinik/katman/kurulum'

export const dynamic = 'force-dynamic'

function nesne<T>(deger: unknown, varsayilan: T): T {
  return deger && typeof deger === 'object' ? deger as T : varsayilan
}

async function paket(supabase: import('@supabase/supabase-js').SupabaseClient, klinikId: string, userId: string, yonetici: boolean) {
  const [odalar, yetkiler, paketler, planlar, uyeler, davetler] = await Promise.all([
    supabase.from('clinic_odalar').select('id, ad, tur, aktif, sira').eq('clinic_id', klinikId).order('sira'),
    supabase.from('clinic_yetkileri').select('rol, modul, oku, yaz, sil').eq('clinic_id', klinikId),
    supabase.from('clinic_paketler').select('id, ad, seans, ucret_kurus, aktif').eq('clinic_id', klinikId).order('created_at'),
    supabase.from('clinic_odeme_planlari').select('id, paket_id, ad, taksit, pesinat_kurus').eq('clinic_id', klinikId).order('created_at'),
    supabase.from('clinic_members').select('user_id, role, koltuk, is_active').eq('clinic_id', klinikId).eq('is_active', true),
    supabase.from('clinic_invitations').select('id, email, expires_at, accepted_at').eq('clinic_id', klinikId).is('accepted_at', null),
  ])
  const ids = (uyeler.data || []).map((u) => u.user_id).filter(Boolean)
  const kisiler = ids.length
    ? await supabase.from('users').select('id, full_name, email').in('id', ids)
    : { data: [] }
  const ad = new Map((kisiler.data || []).map((k) => [k.id, k]))
  return {
    yonetici,
    ben: userId,
    odalar: odalar.data || [],
    yetkiler: yetkiler.data || [],
    paketler: paketler.data || [],
    planlar: planlar.data || [],
    uyeler: (uyeler.data || []).map((u) => ({
      userId: u.user_id,
      rol: u.role,
      koltuk: u.koltuk,
      ad: ad.get(u.user_id)?.full_name || '',
      eposta: yonetici || u.user_id === userId ? (ad.get(u.user_id)?.email || '') : '',
    })),
    davetler: yonetici
      ? (davetler.data || []).filter((d) => Date.parse(d.expires_at) > Date.now()).map((d) => ({
        id: d.id, email: d.email, expiresAt: d.expires_at,
      }))
      : [],
  }
}

export async function GET(req: NextRequest) {
  const baglam = await klinikBaglam(req)
  if ('hata' in baglam) return baglam.hata
  if (!baglam.klinik) return NextResponse.json({ klinik: null })
  const k = baglam.klinik
  const ek = await paket(baglam.supabase, k.id, baglam.userId, baglam.yonetici)
  return NextResponse.json({
    klinik: {
      id: k.id,
      ad: k.name,
      telefon: k.phone || '',
      adres: k.adres || '',
      vergiNo: k.vergi_no || '',
      sehir: k.city || '',
      logo: k.logo_url || '',
      koltuk: k.seat_count,
      kullanilan: k.seats_used,
      calisma: nesne(k.calisma, varsayilanHafta()),
      rezervasyon: nesne(k.rezervasyon, varsayilanRezervasyon()),
      widget: nesne(k.widget, { acik: false, baslik: '' }),
      mesaj: nesne(k.mesaj, { hatirlatma: false }),
      resepsiyonAcik: Boolean(k.resepsiyon_acik),
    },
    ...ek,
  })
}

export async function POST(req: NextRequest) {
  const oturum = await klinikBaglam(req)
  if ('hata' in oturum) return oturum.hata
  if (oturum.klinik) return NextResponse.json({ error: 'Bu hesap zaten bir kliniğe bağlı.' }, { status: 409 })
  const govde = await req.json().catch(() => null) as { ad?: string; telefon?: string; adres?: string; vergiNo?: string } | null
  const adHatasi = klinikAdiDogrula(govde?.ad || '')
  if (adHatasi) return NextResponse.json({ error: adHatasi }, { status: 400 })
  const vergiHatasi = vergiNoDogrula(govde?.vergiNo || '')
  if (vergiHatasi) return NextResponse.json({ error: vergiHatasi }, { status: 400 })
  const profil = bosProfil()
  const ad = govde!.ad!.trim()
  const { data, error } = await oturum.supabase.from('clinics').insert({
    name: ad,
    slug: slugYap(ad),
    owner_id: oturum.userId,
    phone: (govde?.telefon || '').trim() || null,
    adres: (govde?.adres || '').trim() || null,
    vergi_no: (govde?.vergiNo || '').trim() || null,
    plan: 'klinik',
    seat_count: 5,
    seats_used: 1,
    calisma: profil.calisma,
    rezervasyon: profil.rezervasyon,
    widget: profil.widget,
    mesaj: profil.mesaj,
    resepsiyon_acik: false,
  }).select('id').single()
  if (error || !data) return NextResponse.json({ error: 'Klinik açılamadı.' }, { status: 500 })
  const uye = await oturum.supabase.from('clinic_members').insert({
    clinic_id: data.id, user_id: oturum.userId, role: 'admin', koltuk: true, is_active: true,
  })
  if (uye.error) return NextResponse.json({ error: 'Klinik üyeliği yazılamadı.' }, { status: 500 })
  await klinikHesabiniBagla(oturum.supabase, oturum.userId, data.id, true)
  await yetkileriKur(oturum.supabase, data.id)
  return NextResponse.json({ id: data.id })
}

export async function PUT(req: NextRequest) {
  const baglam = await klinikBaglam(req)
  if ('hata' in baglam) return baglam.hata
  if (!baglam.klinik) return NextResponse.json({ error: 'Klinik yok.' }, { status: 404 })
  if (!baglam.yonetici) return yoneticiDegil()
  const g = await req.json().catch(() => null) as {
    ad?: string
    telefon?: string
    adres?: string
    vergiNo?: string
    sehir?: string
    logo?: string
    calisma?: CalismaHaftasi
    rezervasyon?: RezervasyonKurali
    widget?: WidgetAyari
    mesaj?: MesajAyari
    resepsiyonAcik?: boolean
  } | null
  if (!g) return NextResponse.json({ error: 'Eksik gövde.' }, { status: 400 })
  const adHatasi = klinikAdiDogrula(g.ad || baglam.klinik.name)
  if (adHatasi) return NextResponse.json({ error: adHatasi }, { status: 400 })
  const vergiHatasi = vergiNoDogrula(g.vergiNo || '')
  if (vergiHatasi) return NextResponse.json({ error: vergiHatasi }, { status: 400 })
  if (g.calisma) {
    const h = haftayiDogrula(g.calisma)
    if (h) return NextResponse.json({ error: h }, { status: 400 })
  }
  if (g.rezervasyon) {
    const h = rezervasyonDogrula(g.rezervasyon)
    if (h) return NextResponse.json({ error: h }, { status: 400 })
  }
  if (g.widget) {
    const h = widgetDogrula(g.widget)
    if (h) return NextResponse.json({ error: h }, { status: 400 })
  }
  const { error } = await baglam.supabase.from('clinics').update({
    name: (g.ad || baglam.klinik.name).trim(),
    phone: (g.telefon || '').trim() || null,
    adres: (g.adres || '').trim() || null,
    vergi_no: (g.vergiNo || '').trim() || null,
    city: (g.sehir || '').trim() || null,
    logo_url: (g.logo || '').trim() || null,
    calisma: g.calisma || baglam.klinik.calisma || varsayilanHafta(),
    rezervasyon: g.rezervasyon || baglam.klinik.rezervasyon || varsayilanRezervasyon(),
    widget: g.widget || baglam.klinik.widget || { acik: false, baslik: '' },
    mesaj: g.mesaj || baglam.klinik.mesaj || { hatirlatma: false },
    resepsiyon_acik: Boolean(g.resepsiyonAcik),
  }).eq('id', baglam.klinik.id).eq('owner_id', baglam.klinik.owner_id)
  if (error) return NextResponse.json({ error: 'Klinik kaydedilemedi.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
