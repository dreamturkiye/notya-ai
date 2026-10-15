/**
 * NOTYA-OKUL-RAPOR-01 — İstirahat ve Geçici Hastalık Raporu (okul/kreş izin raporu).
 * Base/ORTAK tool: every specialty, gated on the PATIENT being a minor/öğrenci (lib/doktor/okulAraclariKapisi.ts),
 * never on the doctor's branş. HASTA-IZOLASYON-01: hastaSahibiMi before any read or write.
 */
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import {
  bitisTarihiHesapla,
  egitimYiliEtiketi,
  egitimYiliGecerliMi,
  egitimYiliToplamGun,
  gunSayisiSinirla,
  yillikLimitAsildiMi,
  ISTIRAHAT_YILLIK_LIMIT_GUN,
  type IstirahatRaporuSatiri,
} from '@/lib/doktor/istirahatRaporu'

export const dynamic = 'force-dynamic'

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) },
  })
}

async function dogrulaKullanici(request: NextRequest) {
  const supabase = sb()
  const authH = request.headers.get('authorization')
  const token = authH?.startsWith('Bearer ') ? authH.slice(7) : undefined
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return { supabase, userId: user.id }
}

/** GET ?hastaId=... — bu hastanın raporları (yeni → eski) + güncel eğitim yılı toplam gün sayacı. */
export async function GET(request: NextRequest) {
  const kimlik = await dogrulaKullanici(request)
  if (!kimlik) return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  const { supabase, userId } = kimlik

  const { searchParams } = new URL(request.url)
  const hastaId = searchParams.get('hastaId') || ''
  if (!hastaId) return NextResponse.json({ error: 'Hasta seçimi zorunludur.' }, { status: 400 })
  if (!(await hastaSahibiMi(supabase, userId, hastaId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('istirahat_raporlari')
    .select('*')
    .eq('doctor_id', userId)
    .eq('patient_id', hastaId)
    .order('baslangic_tarihi', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const raporlar = (data || []) as IstirahatRaporuSatiri[]
  const guncelYil = egitimYiliEtiketi(null)
  const toplamGun = egitimYiliToplamGun(raporlar, guncelYil)

  return NextResponse.json({
    raporlar: data,
    egitimYili: guncelYil,
    toplamGun,
    yillikLimit: ISTIRAHAT_YILLIK_LIMIT_GUN,
    limitAsildi: yillikLimitAsildiMi(toplamGun),
  })
}

/** POST — yeni rapor. Gövde: hastaId, tani, gunSayisi (1–10), baslangicTarihi (YYYY-MM-DD), eOkulaIletildi?. */
export async function POST(request: NextRequest) {
  const kimlik = await dogrulaKullanici(request)
  if (!kimlik) return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  const { supabase, userId } = kimlik

  const body = await request.json().catch(() => ({}))
  const hastaId = String(body?.hastaId || '')
  const tani = String(body?.tani || '').trim().slice(0, 300)
  const baslangicTarihi = String(body?.baslangicTarihi || '').slice(0, 10)
  const gunSayisi = gunSayisiSinirla(Number(body?.gunSayisi))
  if (!hastaId || !tani || !/^\d{4}-\d{2}-\d{2}$/.test(baslangicTarihi)) {
    return NextResponse.json({ error: 'Eksik veya hatalı parametreler.' }, { status: 400 })
  }
  if (!(await hastaSahibiMi(supabase, userId, hastaId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }

  const egitimYili = egitimYiliGecerliMi(String(body?.egitimYili || '')) ? String(body.egitimYili) : egitimYiliEtiketi(baslangicTarihi)
  const bitisTarihi = bitisTarihiHesapla(baslangicTarihi, gunSayisi)

  const { data: oncekiler, error: oncekilerHata } = await supabase
    .from('istirahat_raporlari')
    .select('gun_sayisi, egitim_yili')
    .eq('doctor_id', userId)
    .eq('patient_id', hastaId)
    .eq('egitim_yili', egitimYili)
  if (oncekilerHata) return NextResponse.json({ error: oncekilerHata.message }, { status: 500 })

  const { data, error } = await supabase
    .from('istirahat_raporlari')
    .insert({
      doctor_id: userId,
      patient_id: hastaId,
      tani,
      gun_sayisi: gunSayisi,
      baslangic_tarihi: baslangicTarihi,
      bitis_tarihi: bitisTarihi,
      egitim_yili: egitimYili,
      e_okula_iletildi: body?.eOkulaIletildi === true,
      e_okula_iletildi_at: body?.eOkulaIletildi === true ? new Date().toISOString() : null,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const toplamGun = egitimYiliToplamGun([...(oncekiler || []), { gun_sayisi: gunSayisi, egitim_yili: egitimYili }] as IstirahatRaporuSatiri[], egitimYili)

  return NextResponse.json({
    rapor: data,
    egitimYili,
    toplamGun,
    yillikLimit: ISTIRAHAT_YILLIK_LIMIT_GUN,
    // Bilgi amaçlı uyarı — engelleme yok, karar hekimde.
    limitAsildi: yillikLimitAsildiMi(toplamGun),
  })
}
