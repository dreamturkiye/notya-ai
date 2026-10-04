/**
 * NOTYA-RANDEVU-V2 — Geliyorum / Ertele / İptal / Kabul links from appointment e-mails (no login).
 *
 * GET  ?t=<signed token> → what the page shows: date, time, doctor, state, what this link may do (+ free
 *                           times for 'ertele'). Nothing changes on GET — mail scanners open links.
 * POST { t, baslangic? }  → performs the link's one action.
 *
 * Isolation: the HMAC token (lib/randevu/v2/jeton.ts) names one appointment and one action. The row is read by
 * that id; its own doktor_id + patient_id then scope every further read/write (hastaIslem re-resolves the row
 * with both). The response never carries the patient's name, phone, e-mail or any clinical field.
 */
import { NextRequest, NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { doktorIletisimAyari } from '@/lib/iletisim/sunucu'
import { randevuJetonuCoz, type JetonEylemi } from '@/lib/randevu/v2/jeton'
import { gunlereAyir } from '@/lib/randevu/v2/slot'
import { hastaIzinleri, oneriBekliyorMu, v2Durum, V2_ETIKET } from '@/lib/randevu/v2/durum'
import { gunEtiketi, saatEtiketi } from '@/lib/randevu/v2/zaman'
import { ayarGetir, hastaIslem, isleriCalistir, musaitSlotlar, type HastaIslemi } from '@/lib/randevu/v2/sunucu'
import { googleaGonder } from '@/lib/randevu/v2/google/senk'

export const dynamic = 'force-dynamic'

const ISLEM: Record<JetonEylemi, HastaIslemi> = { geliyorum: 'teyit', kabul: 'kabul', iptal: 'iptal', ertele: 'ertele' }
const GECERSIZ = 'Bu bağlantı geçersiz ya da süresi dolmuş.'

async function coz(jeton: string) {
  const icerik = randevuJetonuCoz(jeton)
  if (!icerik) return null
  const sb = servisSupabase()
  const { data: r } = await sb.from('randevular')
    .select('id, doktor_id, patient_id, baslangic, bitis, durum, oneri_at, hasta_teyit_at')
    .eq('id', icerik.randevuId).maybeSingle()
  if (!r || !r.patient_id) return null
  return { sb, icerik, r }
}

export async function GET(req: NextRequest) {
  const c = await coz(new URL(req.url).searchParams.get('t') || '')
  if (!c) return NextResponse.json({ error: GECERSIZ }, { status: 404 })
  const { sb, icerik, r } = c
  const doktorId = String(r.doktor_id)
  const ayar = await ayarGetir(sb, doktorId)
  if (!ayar.acik) return NextResponse.json({ error: 'Online randevu işlemleri şu an kapalı. Lütfen muayenehaneyi arayın.' }, { status: 403 })

  const simdi = Date.now()
  const izin = hastaIzinleri(r, ayar, simdi)
  const yapilabilir =
    icerik.eylem === 'geliyorum' ? izin.teyit
      : icerik.eylem === 'kabul' ? oneriBekliyorMu(r) && Date.parse(r.baslangic) > simdi
        : icerik.eylem === 'iptal' ? izin.iptal
          : izin.ertele
  const d = v2Durum(r)
  let gunler = null
  if (icerik.eylem === 'ertele' && yapilabilir) {
    const sure = Math.max(5, Math.round((Date.parse(r.bitis) - Date.parse(r.baslangic)) / 60000))
    const s = await musaitSlotlar(sb, doktorId, ayar, sure, simdi, r.id)
    gunler = s ? gunlereAyir(s).slice(0, 14) : []
  }
  const doktor = await doktorIletisimAyari(sb, doktorId)
  return NextResponse.json({
    eylem: icerik.eylem,
    gun: gunEtiketi(r.baslangic),
    saat: saatEtiketi(r.baslangic),
    doktorAdi: doktor.doktorAdi,
    durum: d,
    etiket: oneriBekliyorMu(r) ? 'Yeni saat önerildi' : V2_ETIKET[d],
    yapilabilir,
    neden: yapilabilir ? null : izin.neden || 'Bu işlem artık yapılamıyor.',
    gunler,
  })
}

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as { t?: string; baslangic?: string }
  const c = await coz(String(b.t || ''))
  if (!c) return NextResponse.json({ error: GECERSIZ }, { status: 404 })
  const { sb, icerik, r } = c
  const doktorId = String(r.doktor_id)
  const s = await hastaIslem(sb, {
    doktorId,
    patientId: String(r.patient_id),
    randevuId: String(r.id),
    islem: ISLEM[icerik.eylem],
    baslangic: b.baslangic,
    kanal: 'eposta',
  })
  if (!s.ok) return NextResponse.json({ error: s.hata }, { status: s.durum })
  await isleriCalistir(sb, { randevuId: s.randevu.id, doktorId, limit: 5, bitis: Date.now() + 15_000 })
  await googleaGonder(sb, doktorId, s.randevu.id)
  return NextResponse.json({
    ok: true,
    gun: gunEtiketi(s.randevu.baslangic),
    saat: saatEtiketi(s.randevu.baslangic),
    durum: v2Durum(s.randevu),
    onayBekliyor: s.randevu.durum === 'talep',
  })
}
