/**
 * HEKIM-PUSH (Kaan, 2026-11-25) — the doctor's own notification settings and Web Push subscriptions (Ayarlar → Bildirimler,
 * the one-time prompt on the Ev verisi card).
 *   GET                         → { ayar, vapidAcik, abonelikSayisi, istemKapatildi, buCihaz } (buCihaz: ?endpoint=… is this browser's)
 *   PUT    { ayar }             → save settings (working hours, quiet hours, on/off per level, time zone)
 *   POST   { islem: 'abone', abonelik: { endpoint, p256dh, auth }, cihaz?, saatDilimi? } → store this browser's subscription
 *   POST   { islem: 'deneme' }  → one test push to the doctor's own devices (generic words only)
 *   POST   { islem: 'istem-kapat' } → the Ev verisi card stops asking
 *   DELETE { endpoint }         → remove one of the doctor's own subscriptions
 * HASTA-IZOLASYON: no patient id is taken. pratikOturum + sadeceDoktor: the doctor himself only (a secretary's session
 * never subscribes in his name). Every row is written and deleted by doctor_id = the signed-in doctor; a foreign endpoint
 * matches nothing. Push payloads never carry PHI (lib/saglikEvi/hekimBildirim.ts).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { abonelikGecerliMi, vapidAnahtarlari } from '@/lib/saglikEvi/push/webPush'
import { hekimAyarGuncellemesi, hekimAyarSatiri, hekimPushIcerigi, saatDilimiGecerliMi, varsayilanHekimGonderici } from '@/lib/saglikEvi/hekimBildirim'

export const dynamic = 'force-dynamic'
const AZAMI_CIHAZ = 6

async function kapi(req: NextRequest) {
  const o = await pratikOturum(req)
  if ('hata' in o) return { hata: o.hata }
  const engel = sadeceDoktor(o)
  if (engel) return { hata: engel }
  return { o }
}

export async function GET(req: NextRequest) {
  const k = await kapi(req)
  if ('hata' in k) return k.hata
  const { supabase: sb, doktorId } = k.o
  const endpoint = req.nextUrl.searchParams.get('endpoint')
  const [ayarR, aboR] = await Promise.all([
    sb.from('hekim_bildirim_ayarlari').select('*').eq('doctor_id', doktorId).maybeSingle(),
    sb.from('hekim_push_abonelikleri').select('endpoint').eq('doctor_id', doktorId).limit(20),
  ])
  const abonelikler = (aboR.data || []) as Array<{ endpoint: string }>
  return NextResponse.json({
    ayar: hekimAyarSatiri(ayarR.data as Record<string, unknown> | null),
    vapidAcik: vapidAnahtarlari()?.acik ?? null,
    abonelikSayisi: abonelikler.length,
    istemKapatildi: !!(ayarR.data as Record<string, unknown> | null)?.istem_kapatildi_at,
    buCihaz: endpoint ? abonelikler.some((a) => a.endpoint === endpoint) : null,
  })
}

export async function PUT(req: NextRequest) {
  const k = await kapi(req)
  if ('hata' in k) return k.hata
  const b = (await req.json().catch(() => null)) as { ayar?: unknown } | null
  const t = hekimAyarGuncellemesi(b?.ayar)
  if (!t.ok) return NextResponse.json({ error: t.hata }, { status: 422 })
  const { error } = await k.o.supabase.from('hekim_bildirim_ayarlari').upsert({ ...t.g, doctor_id: k.o.doktorId, updated_at: new Date().toISOString() }, { onConflict: 'doctor_id' })
  if (error) return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const k = await kapi(req)
  if ('hata' in k) return k.hata
  const { supabase: sb, doktorId } = k.o
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b || typeof b.islem !== 'string') return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  if (b.islem === 'istem-kapat') {
    await sb.from('hekim_bildirim_ayarlari').upsert({ doctor_id: doktorId, istem_kapatildi_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'doctor_id' })
    return NextResponse.json({ ok: true })
  }
  if (b.islem === 'abone') {
    if (!abonelikGecerliMi(b.abonelik)) return NextResponse.json({ error: 'Bildirim aboneliği geçersiz.' }, { status: 422 })
    const a = b.abonelik
    const { data: mevcut } = await sb.from('hekim_push_abonelikleri').select('endpoint').eq('doctor_id', doktorId).limit(20)
    const varMi = ((mevcut || []) as Array<{ endpoint: string }>).some((x) => x.endpoint === a.endpoint)
    if (!varMi && (mevcut || []).length >= AZAMI_CIHAZ) return NextResponse.json({ error: `En fazla ${AZAMI_CIHAZ} cihazda bildirim açılabilir.` }, { status: 429 })
    // An endpoint belongs to one browser: a row of another doctor with the same endpoint (shared device, re-login) is
    // removed first so the push never reaches the previous doctor's session — never re-pointed in place. Only when the
    // caller proves possession of that very subscription (same endpoint AND the browser's own p256dh + auth keys), so a
    // doctor can never remove another doctor's subscription by knowing its URL.
    await sb.from('hekim_push_abonelikleri').delete().eq('endpoint', a.endpoint).eq('p256dh', a.p256dh).eq('auth', a.auth).neq('doctor_id', doktorId)
    const { data: baskasi } = await sb.from('hekim_push_abonelikleri').select('id').eq('endpoint', a.endpoint).neq('doctor_id', doktorId).limit(1)
    if ((baskasi || []).length) return NextResponse.json({ error: 'Bu tarayıcı başka bir hesapta kayıtlı.' }, { status: 409 })
    const cihaz = typeof b.cihaz === 'string' ? b.cihaz.slice(0, 80) : null
    const { error } = await sb.from('hekim_push_abonelikleri').upsert({ doctor_id: doktorId, endpoint: a.endpoint, p256dh: a.p256dh, auth: a.auth, cihaz, hata_sayisi: 0 }, { onConflict: 'endpoint' })
    if (error) return NextResponse.json({ error: 'Bildirim açılamadı.' }, { status: 500 })
    if (saatDilimiGecerliMi(b.saatDilimi)) {
      // First subscription: remember the doctor's own time zone for working hours (only when he has not set one yet).
      const { data: ayar } = await sb.from('hekim_bildirim_ayarlari').select('doctor_id').eq('doctor_id', doktorId).maybeSingle()
      if (!ayar) await sb.from('hekim_bildirim_ayarlari').upsert({ doctor_id: doktorId, saat_dilimi: b.saatDilimi, updated_at: new Date().toISOString() }, { onConflict: 'doctor_id' })
    }
    return NextResponse.json({ ok: true })
  }
  if (b.islem === 'deneme') {
    const gonder = varsayilanHekimGonderici()
    if (!gonder) return NextResponse.json({ error: 'Bildirimler bu sunucuda yapılandırılmamış.' }, { status: 503 })
    const { data } = await sb.from('hekim_push_abonelikleri').select('id, endpoint, p256dh, auth').eq('doctor_id', doktorId).limit(AZAMI_CIHAZ)
    const satirlar = (data || []) as Array<{ id: string; endpoint: string; p256dh: string; auth: string }>
    if (!satirlar.length) return NextResponse.json({ error: 'Bu hesapta açık bildirim yok.' }, { status: 404 })
    const sonuc = await Promise.all(satirlar.map((a) => gonder(a, hekimPushIcerigi({ tur: 'deneme' }), { acil: false })))
    const sil = satirlar.filter((_, i) => !sonuc[i].ok && (sonuc[i] as { sil?: boolean }).sil).map((a) => a.id)
    if (sil.length) await sb.from('hekim_push_abonelikleri').delete().eq('doctor_id', doktorId).in('id', sil)
    return NextResponse.json({ ok: true, gonderilen: sonuc.filter((r) => r.ok).length })
  }
  return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const k = await kapi(req)
  if ('hata' in k) return k.hata
  const b = (await req.json().catch(() => null)) as { endpoint?: unknown } | null
  if (typeof b?.endpoint !== 'string') return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  await k.o.supabase.from('hekim_push_abonelikleri').delete().eq('endpoint', b.endpoint).eq('doctor_id', k.o.doktorId)
  return NextResponse.json({ ok: true })
}
