/**
 * ESNEK-MUAYENE-A — POST { kaynakId, paket, maskeliSayfa, orijinalBelgeId? } → one page read.
 * Privacy: `paket` / `maskeliSayfa` are the device's MASKED crops and page (core/elNotu/sayfaPaketi.ts); the vault original
 * is never read here. HASTA-IZOLASYON: kaynak by id AND doctor_id; the original's vault id must be the same patient's.
 */
import { NextRequest } from 'next/server'
import { elNotuIstegi, json, uuidMu } from '@/lib/elNotu/rota'
import { kaynakAl } from '@/lib/elNotu/sunucu'
import { paketCoz, sayfaOkut } from '@/lib/elNotu/okumaServisi'
import { elNotuModeli } from '@/lib/elNotu/model'
import { EL_NOTU_TR } from '@/core/elNotu/metinTr'
import { aiKotaKullan, KOTA_MESAJI } from '@/lib/doktor/hizLimiti'
import { getDocumentMeta } from '@/lib/vault/service'
import { SPECIALTIES } from '@/lib/doktor/specialties'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const o = await elNotuIstegi(req, 'hazirla')
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const kaynak = await kaynakAl(o.supabase, o.doktorId, b?.kaynakId)
  if (!kaynak || !kaynak.patient_id) return json({ error: 'Kaynak bulunamadı.' }, 404)
  if (kaynak.note_id) {
    const { data: n } = await o.supabase.from('notes').select('approved_at').eq('id', kaynak.note_id).eq('doctor_id', o.doktorId).maybeSingle()
    if (n?.approved_at) return json({ error: 'Bu muayenenin notu onaylanmış.' }, 409)
  }
  const paket = paketCoz(b?.paket)
  if (!paket) return json({ error: 'Sayfa paketi geçersiz.' }, 400)
  let orijinalBelgeId: string | null = null
  if (uuidMu(b?.orijinalBelgeId)) {
    try {
      const meta = await getDocumentMeta({ supabase: o.supabase }, o.doktorId, b!.orijinalBelgeId as string)
      if (meta.patientId === kaynak.patient_id) orijinalBelgeId = meta.id
    } catch { orijinalBelgeId = null }
  }
  const kota = await aiKotaKullan(o.supabase, o.doktorId, 'soap')
  if (!kota.izin) return json({ error: KOTA_MESAJI }, 429)
  const { data: s } = kaynak.session_id ? await o.supabase.from('sessions').select('specialty').eq('id', kaynak.session_id).eq('doctor_id', o.doktorId).maybeSingle() : { data: null }
  const brans = (s?.specialty as string) || null
  const bransAdi = SPECIALTIES.find((x) => x.key === brans)?.label || brans || 'genel'
  const r = await sayfaOkut(o.supabase, {
    doktorId: o.doktorId, kaynak, paket, maskeliSayfa: b?.maskeliSayfa as never, orijinalBelgeId, aktor: o.aktor,
    model: elNotuModeli({ doctorId: o.doktorId }), metin: EL_NOTU_TR, brans, bransAdi,
  })
  if ('hata' in r) return json({ error: r.hata }, r.durum)
  return json({ sayfa: r.sayfa, metin: r.okuma.metin, istatistik: r.okuma.istatistik, acik: r.acik, korumaliAcik: r.korumaliAcik })
}
