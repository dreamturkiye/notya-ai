/**
 * ESNEK-MUAYENE-A — a hand-note draft for the El Notları workspace.
 * GET ?noteId= → the draft (sections, provenance, sources summary, open questions, who drafted, approval state).
 * PATCH { noteId, duzenlemeler: { subjektif?, objektif?, degerlendirme?, plan? } } → staff / doctor edits before finalizing.
 * A secretary reads NO clinical note content outside this: only drafts built from hand-note sources (MOBIL-PERSONEL-04 kept).
 * HASTA-IZOLASYON: note by id AND doctor_id; its sources / questions by doctor_id.
 */
import { NextRequest } from 'next/server'
import { elNotuIstegi, json, uuidMu } from '@/lib/elNotu/rota'
import { denetimYaz, elNotuTaslagiMi, hastaAdlari } from '@/lib/elNotu/sunucu'
import type { KaynakOzeti } from '@/lib/elNotu/derlemeServisi'

export const dynamic = 'force-dynamic'
const ALAN = { subjektif: 'content_subjektif', objektif: 'content_objektif', degerlendirme: 'content_degerlendirme', plan: 'content_plan' } as const
const TURETILEN = { subjektif: 'content_anamnez', objektif: 'content_fizik_muayene', degerlendirme: 'content_tani', plan: 'content_tedavi' } as const


export async function GET(req: NextRequest) {
  const o = await elNotuIstegi(req, 'hazirla')
  if ('hata' in o) return o.hata
  const u = new URL(req.url)
  if (u.searchParams.get('liste') === '1') {
    // drafts built from hand-note sources, not yet finalized (the El Notları workspace)
    const { data } = await o.supabase.from('notes').select('id, session_id, created_at, kaynak_ozeti, hekim_onayi_bekliyor, taslak_hazirlayan_rol, basvuru_yakinmasi, sessions(patient_id)').eq('doctor_id', o.doktorId).is('approved_at', null).not('kaynak_ozeti', 'is', null).order('created_at', { ascending: false }).limit(100)
    const liste = (data || []).filter((n) => elNotuTaslagiMi(n.kaynak_ozeti as KaynakOzeti))
    const pid = (n: Record<string, unknown>) => String((n.sessions as { patient_id?: string } | null)?.patient_id || '')
    const adlar = await hastaAdlari(o.supabase, o.doktorId, liste.map(pid))
    return json({ taslaklar: liste.map((n) => ({ id: n.id, sessionId: n.session_id, tarih: n.created_at, hekimOnayiBekliyor: n.hekim_onayi_bekliyor, hazirlayan: n.taslak_hazirlayan_rol, sikayet: n.basvuru_yakinmasi, patientId: pid(n) || null, hasta: adlar.get(pid(n)) || '' })) })
  }
  const noteId = u.searchParams.get('noteId')
  if (!uuidMu(noteId)) return json({ error: 'Not gerekli.' }, 400)
  const { data: n } = await o.supabase.from('notes').select('id, session_id, created_at, approved_at, approved_by, content_subjektif, content_objektif, content_degerlendirme, content_plan, basvuru_yakinmasi, icd10_codes, content_ilaclar, kaynak_izleri, kaynak_ozeti, taslak_hazirlayan_rol, kesinlestiren_rol, kesinlestirme_at, hekim_onayi_bekliyor, sessions(patient_id)').eq('id', noteId).eq('doctor_id', o.doktorId).maybeSingle()
  if (!n || (o.rol !== 'doktor' && !elNotuTaslagiMi(n.kaynak_ozeti as KaynakOzeti))) return json({ error: 'Not bulunamadı.' }, 404)
  const kaynakIdleri = ((n.kaynak_ozeti as KaynakOzeti | null)?.kaynaklar || []).map((k) => k.id).filter((x) => uuidMu(x))
  const { data: sorular } = await o.supabase.from('okuma_dogrulamalari').select('kaynak_id, soru_anahtari, sinif, korumali_tur, okunan, adaylar, sayfa, kutu, durum').eq('doctor_id', o.doktorId).in('kaynak_id', [...kaynakIdleri, n.id]).eq('durum', 'acik').limit(500)
  const { data: kaynaklar } = kaynakIdleri.length ? await o.supabase.from('muayene_kaynaklari').select('id, tur, sayfa_sayisi, okuma, maskeli_belge_ids').eq('doctor_id', o.doktorId).in('id', kaynakIdleri) : { data: [] }
  return json({ not: n, sorular: sorular || [], kaynaklar: kaynaklar || [] })
}

export async function PATCH(req: NextRequest) {
  const o = await elNotuIstegi(req, 'hazirla')
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as { noteId?: unknown; duzenlemeler?: Record<string, unknown> } | null
  if (!uuidMu(b?.noteId)) return json({ error: 'Not gerekli.' }, 400)
  const { data: n } = await o.supabase.from('notes').select('id, session_id, approved_at, kaynak_ozeti, content_subjektif, content_objektif, content_degerlendirme, content_plan').eq('id', b!.noteId as string).eq('doctor_id', o.doktorId).maybeSingle()
  if (!n || (o.rol !== 'doktor' && !elNotuTaslagiMi(n.kaynak_ozeti as KaynakOzeti))) return json({ error: 'Not bulunamadı.' }, 404)
  if (n.approved_at) return json({ error: 'Not kesinleşmiş.' }, 409)
  const g: Record<string, string> = {}
  for (const [k, kolon] of Object.entries(ALAN)) {
    const v = b?.duzenlemeler?.[k]
    if (typeof v === 'string' && v !== (n as Record<string, unknown>)[kolon]) { g[kolon] = v.slice(0, 20000); g[TURETILEN[k as keyof typeof TURETILEN]] = v.slice(0, 20000) }
  }
  if (!Object.keys(g).length) return json({ ok: true, degisen: 0 })
  const { error } = await o.supabase.from('notes').update(g).eq('id', n.id).eq('doctor_id', o.doktorId).is('approved_at', null)
  if (error) return json({ error: 'Kaydedilemedi.' }, 500)
  await denetimYaz(o.supabase, { doktorId: o.doktorId, noteId: String(n.id), sessionId: n.session_id as string, eylem: 'duzenleme', aktor: o.aktor, ayrinti: { alanlar: Object.keys(g).filter((x) => x in Object.fromEntries(Object.values(ALAN).map((v) => [v, 1]))) } })
  return json({ ok: true, degisen: Object.keys(g).length / 2 })
}
