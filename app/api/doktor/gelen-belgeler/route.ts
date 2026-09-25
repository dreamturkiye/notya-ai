/**
 * NOTYA-GELEN-BELGELER — Gelen Belgeler inbox (lib/gelenBelgeler).
 *
 * GET  ?sayi=1        → { sayi, erisim } — Ana Sayfa card + sidebar badge. A secretary without access gets
 *                       { sayi: 0, erisim: false } (200) so the chrome can hide the entry quietly.
 * GET  ?hastaAra=<q>  → { hastalar: [{ id, ad, dogum }] } — "Başka hasta seç", the practice's own patients only.
 * GET                 → { ogeler, hazir } — unfiled items with a short-lived signed URL each.
 * POST multipart { dosya, kaynak }            → adds one file (drag & drop, upload, camera, voice note).
 * POST JSON      { metin, kaynak: 'yapistir' } → adds pasted text as a text document.
 *      → { durum: 'eklendi' | 'zaten_var', id } · 400 plain sentence · 503 before migration 099.
 *
 * Access: the doctor; a secretary only when the doctor's Ayarlar switch is on (lib/gelenBelgeler/yetki.ts).
 * HASTA-IZOLASYON-01: takes no patient id except hastaAra's free text; every query is scoped by doktorId.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { gelenBelgeErisimi, gelenBelgeOturum, sekreterErisimiAcikMi } from '@/lib/gelenBelgeler/yetki'
import { gelenBelgeEkle, gelenleriListele, hastaAra, yeniSayisi } from '@/lib/gelenBelgeler/sunucu'
import { EN_BUYUK_BAYT, kaynakMi } from '@/lib/gelenBelgeler/tipler'
import { belgeTurleriIcinBrans } from '@/lib/doktor/belgeTurleri'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const HAZIR_DEGIL = 'Gelen Belgeler kısa süre içinde açılacak. Belgeyi şimdilik hasta dosyasından ekleyebilirsiniz.'

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('sayi')) {
    const o = await pratikOturum(req)
    if ('hata' in o) return o.hata
    const erisim = gelenBelgeErisimi(o.rol, o.rol === 'sekreter' ? await sekreterErisimiAcikMi(o.supabase, o.doktorId) : true)
    return NextResponse.json({ sayi: erisim ? await yeniSayisi(o.supabase, o.doktorId) : 0, erisim })
  }
  const o = await gelenBelgeOturum(req)
  if ('hata' in o) return o.hata
  const q = req.nextUrl.searchParams.get('hastaAra')
  if (q !== null) return NextResponse.json({ hastalar: await hastaAra(o.supabase, o.doktorId, q) })
  // The document types this practice's branş offers (Yenidoğan Taburculuk Epikrizi only for pediatri / KD).
  const { data: doktor } = await o.supabase.from('users').select('specialty').eq('id', o.doktorId).maybeSingle()
  return NextResponse.json({ ...(await gelenleriListele(o.supabase, o.doktorId)), rol: o.rol, turler: belgeTurleriIcinBrans(doktor?.specialty ?? null) })
}

export async function POST(req: NextRequest) {
  const o = await gelenBelgeOturum(req)
  if ('hata' in o) return o.hata
  const ekleyen = { userId: o.user.id, personelId: o.rol === 'sekreter' ? o.personelId ?? null : null }

  let sonuc
  if ((req.headers.get('content-type') || '').includes('application/json')) {
    const b = (await req.json().catch(() => null)) as { metin?: unknown; kaynak?: unknown } | null
    const metin = typeof b?.metin === 'string' ? b.metin.trim() : ''
    if (metin.length < 3) return NextResponse.json({ error: 'Yapıştırılan metin boş.' }, { status: 400 })
    const bytes = Buffer.from(metin, 'utf8')
    if (bytes.length > EN_BUYUK_BAYT) return NextResponse.json({ error: 'Metin çok uzun.' }, { status: 400 })
    const tarih = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }).replace(/\./g, '-')
    sonuc = await gelenBelgeEkle({ supabase: o.supabase, doktorId: o.doktorId, kaynak: 'yapistir', dosya: { ad: `yapistirilan-metin-${tarih}.txt`, mime: 'text/plain', bytes }, ekleyen })
  } else {
    const form = await req.formData().catch(() => null)
    const dosya = form?.get('dosya')
    const kaynak = form?.get('kaynak')
    if (!(dosya instanceof File)) return NextResponse.json({ error: 'Dosya seçilmedi.' }, { status: 400 })
    if (dosya.size > EN_BUYUK_BAYT) return NextResponse.json({ error: 'Bu dosya çok büyük (en fazla 4 MB).' }, { status: 400 })
    sonuc = await gelenBelgeEkle({
      supabase: o.supabase, doktorId: o.doktorId, kaynak: kaynakMi(kaynak) ? kaynak : 'yukleme',
      dosya: { ad: dosya.name || 'belge', mime: dosya.type || null, bytes: Buffer.from(await dosya.arrayBuffer()) }, ekleyen,
    })
  }

  if (sonuc.durum === 'gecersiz') return NextResponse.json({ error: sonuc.hata }, { status: 400 })
  if (sonuc.durum === 'hazir_degil') return NextResponse.json({ error: HAZIR_DEGIL }, { status: 503 })
  if (sonuc.durum === 'zaten_var') return NextResponse.json({ durum: 'zaten_var', id: sonuc.id, dosyalandi: sonuc.dosyalandi })
  return NextResponse.json({ durum: 'eklendi', id: sonuc.id }, { status: 201 })
}
