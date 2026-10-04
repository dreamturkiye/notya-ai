/**
 * NOTYA-RANDEVU-V2 — Sağlığım › Randevu (patient). Exists only while the doctor's 'Hasta Portalı Randevu' is ON.
 *
 * GET                       → { acik, turler, randevular, iptalSinirSaat }   (acik:false → nothing else)
 * GET ?tur=<tur>            → { gunler: [{ gun, slotlar }] } free times for a new request
 * GET ?randevuId=<id>       → free times to move that own appointment (same length)
 * POST { islem: 'talep', tur, baslangic }
 * POST { islem: 'iptal' | 'ertele' | 'kabul' | 'teyit', randevuId, baslangic? }
 *
 * Isolation: the PIN-unlocked token fixes BOTH the doctor and the patient (resolvePortalToken). Free/busy is that
 * doctor's only, as bare times — never who holds a taken slot or why. Own appointments are read with
 * doktor_id + patient_id together; an appointment id from the body is re-resolved with both before any write.
 */
import { NextRequest, NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { resolvePortalToken } from '@/lib/portal/messages'
import { requirePortalUnlock } from '@/lib/portal/requireUnlock'
import { acikTurler, portalTuruMu } from '@/lib/randevu/v2/ayar'
import { gunlereAyir } from '@/lib/randevu/v2/slot'
import {
  ayarGetir,
  hastaIslem,
  hastaRandevulari,
  isleriCalistir,
  musaitSlotlar,
  talepOlustur,
  type HastaIslemi,
} from '@/lib/randevu/v2/sunucu'

export const dynamic = 'force-dynamic'

const HASTA_ISLEMLERI: readonly HastaIslemi[] = ['iptal', 'ertele', 'kabul', 'teyit']

async function oturum(req: NextRequest, token: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { hata: NextResponse.json({ error: 'Portal yapılandırılmamış.' }, { status: 500 }) }
  }
  const sb = servisSupabase()
  const tok = await resolvePortalToken(sb, token)
  if (!tok) return { hata: NextResponse.json({ error: 'Token bulunamadı veya süresi dolmuş' }, { status: 404 }) }
  const kilit = requirePortalUnlock(req, token, tok)
  if (kilit) return { hata: kilit }
  return { sb, doktorId: String(tok.doctor_id), patientId: String(tok.patient_id) }
}

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const o = await oturum(req, params.token)
  if ('hata' in o) return o.hata
  const { sb, doktorId, patientId } = o

  const ayar = await ayarGetir(sb, doktorId)
  if (!ayar.acik) return NextResponse.json({ acik: false })

  const url = new URL(req.url)
  const tur = url.searchParams.get('tur')
  const randevuId = url.searchParams.get('randevuId')
  const simdi = Date.now()

  if (tur || randevuId) {
    let sure: number
    let haric: string | null = null
    if (randevuId) {
      const { data: r } = await sb.from('randevular').select('id, baslangic, bitis')
        .eq('id', randevuId).eq('doktor_id', doktorId).eq('patient_id', patientId).maybeSingle()
      if (!r) return NextResponse.json({ error: 'Randevu bulunamadı.' }, { status: 404 })
      sure = Math.max(5, Math.round((Date.parse(r.bitis) - Date.parse(r.baslangic)) / 60000))
      haric = r.id
    } else {
      if (!portalTuruMu(tur) || !ayar.turler[tur].acik) return NextResponse.json({ error: 'Bu randevu türü online alınamıyor.' }, { status: 400 })
      sure = ayar.turler[tur].sure
    }
    const slotlar = await musaitSlotlar(sb, doktorId, ayar, sure, simdi, haric)
    if (!slotlar) return NextResponse.json({ error: 'Uygun saatler alınamadı.' }, { status: 500 })
    return NextResponse.json({ gunler: gunlereAyir(slotlar) })
  }

  const randevular = await hastaRandevulari(sb, doktorId, patientId, ayar, simdi)
  if (!randevular) return NextResponse.json({ error: 'Randevular alınamadı.' }, { status: 500 })
  return NextResponse.json({ acik: true, turler: acikTurler(ayar), randevular, iptalSinirSaat: ayar.iptalSinirSaat })
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const o = await oturum(req, params.token)
  if ('hata' in o) return o.hata
  const { sb, doktorId, patientId } = o

  const b = (await req.json().catch(() => ({}))) as { islem?: string; tur?: string; baslangic?: string; randevuId?: string }
  const islem = String(b.islem || '')

  const s = islem === 'talep'
    ? await talepOlustur(sb, { doktorId, patientId, tur: String(b.tur || ''), baslangic: String(b.baslangic || '') })
    : HASTA_ISLEMLERI.includes(islem as HastaIslemi) && b.randevuId
      ? await hastaIslem(sb, { doktorId, patientId, randevuId: String(b.randevuId), islem: islem as HastaIslemi, baslangic: b.baslangic, kanal: 'portal' })
      : null
  if (!s) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  if (!s.ok) return NextResponse.json({ error: s.hata }, { status: s.durum })

  await isleriCalistir(sb, { randevuId: s.randevu.id, doktorId, limit: 5, bitis: Date.now() + 15_000 })
  return NextResponse.json({ ok: true, durum: s.randevu.durum, onayBekliyor: s.randevu.durum === 'talep' })
}
