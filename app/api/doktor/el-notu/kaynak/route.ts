/**
 * ESNEK-MUAYENE-A — muayene sources.
 * POST { patientId, sessionId?, kanal, isleme, ziyaretTarihi?, tur?, metin?, gelenBelgeId? } → { kaynak } (idempotent on isleme;
 *      no sessionId → a visit is opened dated to ziyaretTarihi). A typed note (tur 'yazili_not', metin) is a source too.
 * GET  ?sessionId= | ?patientId= | ?id= → sources with their reading and open Doğrula questions.
 * HASTA-IZOLASYON: patientId via hastaSahibiMi, sessionId via seansSahibi (in kaynakOlustur); every read by doctor_id.
 */
import { NextRequest } from 'next/server'
import { elNotuIstegi, json, uuidMu } from '@/lib/elNotu/rota'
import { hastaAdlari, kaynakOlustur } from '@/lib/elNotu/sunucu'
import { hastaSahibiMi, seansSahibi } from '@/lib/doktor/hastaSahipligi'

export const dynamic = 'force-dynamic'
const KANALLAR = ['kamera', 'dosya', 'tarayici', 'gelen_belge', 'toplu', 'klavye'] as const

export async function POST(req: NextRequest) {
  const o = await elNotuIstegi(req, 'hazirla')
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b || !uuidMu(b.patientId)) return json({ error: 'Hasta gerekli.' }, 400)
  const kanal = KANALLAR.includes(b.kanal as never) ? (b.kanal as (typeof KANALLAR)[number]) : 'kamera'
  const tur = b.tur === 'yazili_not' ? 'yazili_not' : o.rol === 'doktor' ? 'el_notu' : 'sekreter_yukleme'
  const metin = tur === 'yazili_not' && typeof b.metin === 'string' ? b.metin.trim().slice(0, 20000) : null
  if (tur === 'yazili_not' && !metin) return json({ error: 'Not metni boş.' }, 400)
  const isleme = typeof b.isleme === 'string' && /^[a-f0-9]{16,128}$/i.test(b.isleme) ? b.isleme : null
  if (!isleme) return json({ error: 'Geçersiz kaynak anahtarı.' }, 400)
  const r = await kaynakOlustur(o.supabase, {
    doktorId: o.doktorId, patientId: b.patientId, sessionId: uuidMu(b.sessionId) ? b.sessionId : null, tur, kanal, isleme,
    ziyaretTarihi: typeof b.ziyaretTarihi === 'string' ? b.ziyaretTarihi : null, aktor: o.aktor, gelenBelgeId: uuidMu(b.gelenBelgeId) ? b.gelenBelgeId : null, metin,
  })
  if ('hata' in r) return json({ error: r.hata }, r.durum)
  return json({ kaynak: { id: r.kaynak.id, sessionId: r.kaynak.session_id, durum: r.kaynak.durum, yeni: r.yeni } })
}

export async function GET(req: NextRequest) {
  const o = await elNotuIstegi(req, 'hazirla')
  if ('hata' in o) return o.hata
  const u = new URL(req.url)
  const sessionId = u.searchParams.get('sessionId'), patientId = u.searchParams.get('patientId'), id = u.searchParams.get('id')
  let q = o.supabase.from('muayene_kaynaklari').select('id, patient_id, session_id, note_id, tur, kanal, durum, sayfa_sayisi, maskeli_belge_ids, okuma, metin, acik_dogrula, korumali_acik, ziyaret_tarihi, ekleyen_rol, created_at').eq('doctor_id', o.doktorId).neq('durum', 'iptal')
  if (uuidMu(id)) q = q.eq('id', id)
  else if (uuidMu(sessionId)) { if (!(await seansSahibi(o.supabase, o.doktorId, sessionId))) return json({ error: 'Muayene bulunamadı.' }, 404); q = q.eq('session_id', sessionId) }
  else if (uuidMu(patientId)) { if (!(await hastaSahibiMi(o.supabase, o.doktorId, patientId))) return json({ error: 'Hasta bulunamadı.' }, 404); q = q.eq('patient_id', patientId) }
  else if (u.searchParams.get('acik') === '1') q = q.in('durum', ['dogrulama', 'okundu', 'okunuyor']).is('note_id', null)
  else return json({ error: 'Kapsam gerekli.' }, 400)
  const { data: kaynaklar } = await q.order('created_at', { ascending: false }).limit(50)
  const ids = (kaynaklar || []).map((k) => k.id)
  const { data: sorular } = ids.length
    ? await o.supabase.from('okuma_dogrulamalari').select('kaynak_id, soru_anahtari, sinif, korumali_tur, okunan, adaylar, sayfa, kutu, durum').eq('doctor_id', o.doktorId).in('kaynak_id', ids).eq('durum', 'acik').limit(1000)
    : { data: [] }
  const adlar = await hastaAdlari(o.supabase, o.doktorId, (kaynaklar || []).map((k) => String(k.patient_id || '')))
  return json({ kaynaklar: (kaynaklar || []).map((k) => ({ ...k, hasta: adlar.get(String(k.patient_id)) || '', sorular: (sorular || []).filter((s) => s.kaynak_id === k.id) })) })
}
