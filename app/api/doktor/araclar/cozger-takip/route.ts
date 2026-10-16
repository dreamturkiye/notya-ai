/**
 * NOTYA-COZGER-TAKIP-01 — ÇÖZGER takip (Araçlar → Hasta Raporları → Çocuk Hasta Raporları ile aynı
 * alt bölüm). Notya resmi ÇÖZGER raporu ÜRETMEZ — bkz. lib/doktor/cozgerTakip.ts COZGER_UYARI_METNI
 * ve bu dosyanın kapsam notu. Bu rota SADECE bu hekimin kendi hastasının süreç takibini okur/yazar.
 *
 * HASTA-IZOLASYON-01: hastaId istekten (query/body) gelen, saldırgan kontrollü bir kimliktir — her
 * GET/POST/PATCH'te hastaSahibiMi(doktorId, hastaId) ile 404 (yabancı id = yok) kontrolünden SONRA
 * okunur/yazılır. Satır hasta BAŞINA (doctor_id, patient_id) tektir — bu doktorun hasta kaydı
 * kapsamından çıkmayan bir "takip id"si dolaştırılmaz; her PATCH yine hastaId + doctor_id ile daralır.
 *
 * Branş kapısı (specialty-doktor-araclari / brans-alan-sızması): doktorun KENDİ branşı — Çocuk Hasta
 * Raporları ile AYNI gate, cocukHastaRaporuBransiMi (pediatri + çocuk cerrahisi). Madde 6/1 çok branşlı
 * ÇÖZGER kurulu üyeleri arasında çocuk cerrahisini açıkça saydığı için bu genişletme regülasyonla
 * doğrulanmıştır (bkz. lib/doktor/cozgerTakip.ts başlık yorumu).
 */
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { hekimBransi } from '@/lib/doktor/hekimAdi'
import { cocukHastaRaporuBransiMi } from '@/lib/doktor/belgeTurleri'
import {
  cozgerDurumGecerliMi,
  cozgerDuzeyiGecerliMi,
  cozgerGecerlilikTipiGecerliMi,
} from '@/lib/doktor/cozgerTakip'

export const dynamic = 'force-dynamic'

const ISO_TARIH = /^\d{4}-\d{2}-\d{2}$/

function tarihAlaniYaDaNull(v: unknown): string | null {
  const s = String(v ?? '').trim()
  return ISO_TARIH.test(s) ? s : null
}

function metinAlaniYaDaNull(v: unknown, maxLen: number): string | null {
  const s = String(v ?? '').trim()
  return s ? s.slice(0, maxLen) : null
}

/** Branş kapısı — her metod için aynı kontrol, Çocuk Hasta Raporları ile aynı gate. */
async function bransKapisiGec(supabase: SupabaseClient, doktorId: string): Promise<NextResponse | null> {
  const brans = await hekimBransi(supabase, doktorId)
  if (!cocukHastaRaporuBransiMi(brans)) {
    return NextResponse.json({ error: 'Bu araç branşınızda kullanılamaz.' }, { status: 403 })
  }
  return null
}

/** GET ?hastaId=... — bu doktorun bu hasta için takip kaydı (yoksa null). */
export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const doktorId = user.id

  const engel = await bransKapisiGec(supabase, doktorId)
  if (engel) return engel

  const hastaId = new URL(req.url).searchParams.get('hastaId') || ''
  if (!hastaId) return NextResponse.json({ error: 'Hasta seçimi zorunludur.' }, { status: 400 })
  if (!(await hastaSahibiMi(supabase, doktorId, hastaId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('cozger_takip')
    .select('*')
    .eq('doctor_id', doktorId)
    .eq('patient_id', hastaId)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ takip: data || null })
}

/** POST — takip kaydı başlat. Zaten varsa mevcut kayıt döner (hasta başına tek kayıt). */
export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const doktorId = user.id

  const engel = await bransKapisiGec(supabase, doktorId)
  if (engel) return engel

  const body = await req.json().catch(() => ({}))
  const hastaId = String(body?.hastaId || '')
  if (!hastaId) return NextResponse.json({ error: 'Hasta seçimi zorunludur.' }, { status: 400 })
  if (!(await hastaSahibiMi(supabase, doktorId, hastaId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }

  const { data: mevcut, error: mevcutHata } = await supabase
    .from('cozger_takip')
    .select('*')
    .eq('doctor_id', doktorId)
    .eq('patient_id', hastaId)
    .maybeSingle()
  if (mevcutHata) return NextResponse.json({ error: mevcutHata.message }, { status: 500 })
  if (mevcut) return NextResponse.json({ takip: mevcut, yeni: false })

  const kurumAdi = metinAlaniYaDaNull(body?.kurumAdi, 200)
  const basvuruTarihi = tarihAlaniYaDaNull(body?.basvuruTarihi)

  const { data, error } = await supabase
    .from('cozger_takip')
    .insert({
      doctor_id: doktorId,
      patient_id: hastaId,
      durum: 'hazirlik',
      kurum_adi: kurumAdi,
      basvuru_tarihi: basvuruTarihi,
    })
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ takip: data, yeni: true })
}

/** PATCH — alan güncellemesi. hastaId + doctor_id ile daralır; ayrı bir "takip id" dolaştırılmaz. */
export async function PATCH(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const doktorId = user.id

  const engel = await bransKapisiGec(supabase, doktorId)
  if (engel) return engel

  const body = await req.json().catch(() => ({}))
  const hastaId = String(body?.hastaId || '')
  if (!hastaId) return NextResponse.json({ error: 'Hasta seçimi zorunludur.' }, { status: 400 })
  if (!(await hastaSahibiMi(supabase, doktorId, hastaId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }

  const guncelleme: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.durum !== undefined) {
    if (!cozgerDurumGecerliMi(String(body.durum))) {
      return NextResponse.json({ error: 'Geçersiz durum.' }, { status: 400 })
    }
    guncelleme.durum = body.durum
  }
  if (body.kurumAdi !== undefined) guncelleme.kurum_adi = metinAlaniYaDaNull(body.kurumAdi, 200)
  if (body.basvuruTarihi !== undefined) guncelleme.basvuru_tarihi = tarihAlaniYaDaNull(body.basvuruTarihi)
  if (body.heyetTarihi !== undefined) guncelleme.heyet_tarihi = tarihAlaniYaDaNull(body.heyetTarihi)
  if (body.sonucDuzeyi !== undefined) {
    const v = String(body.sonucDuzeyi || '').trim()
    if (v && !cozgerDuzeyiGecerliMi(v)) {
      return NextResponse.json({ error: 'Geçersiz düzey.' }, { status: 400 })
    }
    guncelleme.sonuc_duzeyi = v || null
  }
  if (body.sonucTarihi !== undefined) guncelleme.sonuc_tarihi = tarihAlaniYaDaNull(body.sonucTarihi)
  if (body.gecerlilikTipi !== undefined) {
    const v = String(body.gecerlilikTipi || '').trim()
    if (v && !cozgerGecerlilikTipiGecerliMi(v)) {
      return NextResponse.json({ error: 'Geçersiz geçerlilik tipi.' }, { status: 400 })
    }
    guncelleme.gecerlilik_tipi = v || null
    // Sürekli rapora geçerlilik bitiş tarihi anlamsız — süreli'den çıkıldığında temizle.
    if (v !== 'sureli') guncelleme.gecerlilik_bitis_tarihi = null
  }
  if (body.gecerlilikBitisTarihi !== undefined) {
    guncelleme.gecerlilik_bitis_tarihi = tarihAlaniYaDaNull(body.gecerlilikBitisTarihi)
  }
  if (body.raporNo !== undefined) guncelleme.rapor_no = metinAlaniYaDaNull(body.raporNo, 60)
  if (body.notMetni !== undefined) guncelleme.not_metni = metinAlaniYaDaNull(body.notMetni, 2000)

  const { data, error } = await supabase
    .from('cozger_takip')
    .update(guncelleme)
    .eq('doctor_id', doktorId)
    .eq('patient_id', hastaId)
    .select('*')
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Takip kaydı bulunamadı. Önce başlatın.' }, { status: 404 })
  return NextResponse.json({ takip: data })
}
