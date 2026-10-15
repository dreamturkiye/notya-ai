/**
 * NOTYA-OKUL-RAPOR-01 — Durum Bildirir Sağlık Raporları / Katılım Belgeleri (spor / kreş / erteleme).
 * Base/ORTAK tool: every specialty, gated on the PATIENT being a minor/öğrenci. HASTA-IZOLASYON-01:
 * hastaSahibiMi before any read or write.
 *
 * Kreş/okul öncesi (tur='kres'): aşı takviminin tam olup olmadığı aşı modülünden okunur, elle tekrar
 * girilmez. Bu uçtaki sinyal aşıKarnesiVerisi'nin (lib/asi/karneSunucu.ts) kendi "siradakiler" alanından
 * gelir — hekimin kendi girdiği sonraki doz tarihleri; ulusal takvime göre TAM bir gecikme hesabı değildir
 * (o hesap pedi-asi/kohort motorunun içindedir, bu araca henüz bağlanmadı — docs/OPEN-COMMITMENTS.md
 * § NOTYA-OKUL-RAPOR-01). Bilinmeyen/kaydı olmayan durumda asiTakvimiTamMi = null (iddia edilmez).
 */
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { katilimSonucuDogrula, katilimTuruGecerliMi } from '@/lib/doktor/katilimRaporu'
import { asiKarnesiVerisi } from '@/lib/asi/karneSunucu'

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
    .from('katilim_raporlari')
    .select('*')
    .eq('doctor_id', userId)
    .eq('patient_id', hastaId)
    .order('rapor_tarihi', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ raporlar: data })
}

export async function POST(request: NextRequest) {
  const kimlik = await dogrulaKullanici(request)
  if (!kimlik) return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  const { supabase, userId } = kimlik

  const body = await request.json().catch(() => ({}))
  const hastaId = String(body?.hastaId || '')
  const tur = String(body?.tur || '')
  if (!hastaId || !katilimTuruGecerliMi(tur)) {
    return NextResponse.json({ error: 'Eksik veya hatalı parametreler.' }, { status: 400 })
  }
  if (!(await hastaSahibiMi(supabase, userId, hastaId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }

  let sonucGirdisi = body?.sonuc
  // NOTYA-ASI-OKUMA-01: kreş raporunda aşı takvimi hekim tarafından elle tekrar girilmez — aşı modülünden
  // okunur ve sonuç nesnesine sunucu tarafında eklenir (doktor isterse not alanını kendi yazar).
  if (tur === 'kres') {
    try {
      const karne = await asiKarnesiVerisi(supabase, userId, hastaId)
      const asiTakvimiTamMi = karne.siradakiler.length === 0 ? true : null
      sonucGirdisi = {
        ...(sonucGirdisi && typeof sonucGirdisi === 'object' ? sonucGirdisi : {}),
        asiTakvimiTamMi,
        asiNotu: karne.siradakiler.length
          ? `Aşı modülünde bekleyen ${karne.siradakiler.length} doz kaydı var: ${karne.siradakiler.map((s) => s.ad).join(', ')}.`
          : undefined,
      }
    } catch {
      /* aşı modülü okunamazsa elle girilen değer kullanılır; iddia edilmez */
    }
  }

  const sonuc = katilimSonucuDogrula(tur, sonucGirdisi)
  if (!sonuc) return NextResponse.json({ error: 'Rapor sonucu eksik.' }, { status: 400 })

  const { data, error } = await supabase
    .from('katilim_raporlari')
    .insert({
      doctor_id: userId,
      patient_id: hastaId,
      tur,
      sonuc,
      rapor_tarihi: /^\d{4}-\d{2}-\d{2}$/.test(String(body?.raporTarihi || '')) ? body.raporTarihi : undefined,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rapor: data })
}
