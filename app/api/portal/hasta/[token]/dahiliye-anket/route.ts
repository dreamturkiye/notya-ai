/**
 * NOTYA-DAH-WOW W2.7 (+ W1.5 portal girişi) — Sağlığım › Muayene öncesi anket.
 * PIN kilidi zorunlu (requirePortalUnlock). GET yalnız şablon döner (PHI yok). POST: ev ölçümleri → dahiliye_ev_kayitlari (kaynak=portal),
 * anket → dahiliye_anketler (SOAP Subjektif taslağı + alarmlar). Hastaya yorum/tanı dönmez; alarmda 112 metni.
 */
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { resolvePortalToken } from '@/lib/portal/messages'
import { requirePortalUnlock } from '@/lib/portal/requireUnlock'
import { anketSablonu, anketDogrula, anketiSoapa, type AnketKart } from '@/specialties/dahiliye/engines/anket'

export const dynamic = 'force-dynamic'

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) }, auth: { persistSession: false } })
}

async function kartlar(client: NonNullable<ReturnType<typeof sb>>, patientId: string): Promise<AnketKart[]> {
  const tablolar: [string, AnketKart][] = [['dahiliye_ht', 'ht'], ['dahiliye_dm', 'dm'], ['dahiliye_lipid', 'lipid'], ['dahiliye_tiroid', 'tiroid'], ['dahiliye_ckd', 'ckd'], ['dahiliye_hf', 'hf'], ['dahiliye_antikoagulan', 'antikoagulan'], ['dahiliye_pulm', 'pulm'], ['dahiliye_gi', 'gi']]
  const sonuc = await Promise.all(tablolar.map(async ([t, k]) => { const { data } = await client.from(t).select('id').eq('patient_id', patientId).limit(1); return data?.length ? k : null }))
  return sonuc.filter((x): x is AnketKart => !!x)
}

async function hazirla(req: NextRequest, token: string) {
  const client = sb()
  if (!client) return { hata: NextResponse.json({ error: 'Portal yapılandırılmamış.' }, { status: 500 }) }
  const tok = await resolvePortalToken(client, token)
  if (!tok) return { hata: NextResponse.json({ error: 'Token bulunamadı veya süresi dolmuş' }, { status: 404 }) }
  const locked = requirePortalUnlock(req, token, tok)
  if (locked) return { hata: locked }
  return { client, tok }
}

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const h = await hazirla(req, params.token)
  if ('hata' in h) return h.hata
  const k = await kartlar(h.client, h.tok.patient_id)
  const { data: son } = await h.client.from('dahiliye_anketler').select('created_at').eq('patient_id', h.tok.patient_id).order('created_at', { ascending: false }).limit(1)
  return NextResponse.json({ uygun: k.length > 0, sablon: anketSablonu(k), sonGonderim: son?.[0]?.created_at || null })
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const h = await hazirla(req, params.token)
  if ('hata' in h) return h.hata
  const { client, tok } = h
  const bugunBasi = new Date(); bugunBasi.setHours(0, 0, 0, 0)
  const { count } = await client.from('dahiliye_anketler').select('id', { count: 'exact', head: true }).eq('patient_id', tok.patient_id).gte('created_at', bugunBasi.toISOString())
  if ((count || 0) >= 3) return NextResponse.json({ error: 'Bugün için anket sınırına ulaşıldı. Doktorunuza Mesajlar bölümünden yazabilirsiniz.' }, { status: 429 })
  const ham = await req.json().catch(() => null)
  const sablon = anketSablonu(await kartlar(client, tok.patient_id))
  const { girdi, hatalar, alarmlar } = anketDogrula(ham, sablon)
  const simdi = new Date().toISOString()
  const olcumZamani = (x?: string) => { const d = x ? new Date(x) : null; return d && !isNaN(d.getTime()) && d.getTime() <= Date.now() && d.getTime() > Date.now() - 30 * 86400000 ? d.toISOString() : simdi }
  const ev = [
    ...(girdi.kb || []).map((k) => ({ patient_id: tok.patient_id, doctor_id: tok.doctor_id, tip: 'kb', sbp: k.sbp, dbp: k.dbp, olcum_at: olcumZamani(k.olcumAt), kaynak: 'portal' })),
    ...(girdi.glukoz || []).map((g) => ({ patient_id: tok.patient_id, doctor_id: tok.doctor_id, tip: 'glukoz', deger: g.deger, aclik: g.aclik !== false, olcum_at: olcumZamani(g.olcumAt), kaynak: 'portal' })),
    ...(girdi.kilo != null ? [{ patient_id: tok.patient_id, doctor_id: tok.doctor_id, tip: 'kilo', deger: girdi.kilo, olcum_at: simdi, kaynak: 'portal' }] : []),
  ]
  if (ev.length) { const { error } = await client.from('dahiliye_ev_kayitlari').insert(ev); if (error) return NextResponse.json({ error: 'Ölçümler kaydedilemedi' }, { status: 500 }) }
  const tarih = simdi.slice(0, 10)
  const { error } = await client.from('dahiliye_anketler').insert({ patient_id: tok.patient_id, doctor_id: tok.doctor_id, cevaplar: girdi, alarmlar, soap_metni: anketiSoapa(girdi, sablon, tarih, alarmlar) })
  if (error) return NextResponse.json({ error: 'Anket kaydedilemedi' }, { status: 500 })
  return NextResponse.json({ ok: true, uyarilar: hatalar, acilMetni: alarmlar.length ? 'İşaretlediğiniz bazı belirtiler acil değerlendirme gerektirebilir. Şikâyetiniz şu an sürüyorsa 112\'yi arayın veya en yakın acil servise başvurun.' : null })
}
