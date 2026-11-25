/**
 * ESNEK-MUAYENE-A — form templates (per doctor; optional clinic id).
 * GET → templates · POST { id?, ad, tur, brans?, enBoy, baslik[], cizim[], parmakIzi? } → create / update · DELETE ?id= → deactivate.
 * Staff with 'elnotu.hazirla' may create one while ingesting (marking the header once is part of capture).
 * HASTA-IZOLASYON: no patient id; rows by doctor_id.
 */
import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { elNotuIstegi, json, uuidMu } from '@/lib/elNotu/rota'
import { sablonSatiri, sablonlarYukle } from '@/lib/elNotu/sunucu'
import { sablonTaslagi } from '@/core/elNotu/sablon'
import { kayitliSablonlarTr } from '@/core/elNotu/tohum'
import type { CizimBolgesi, Kutu } from '@/core/elNotu/tipler'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const o = await elNotuIstegi(req, 'hazirla')
  if ('hata' in o) return o.hata
  const sablonlar = await sablonlarYukle(o.supabase, o.doktorId)
  // a recent MASKED page read with each template (the region editor draws on it; identity is already blacked out)
  const ids = sablonlar.filter((x) => x.tur === 'formlu').map((x) => x.id)
  const { data: son } = ids.length ? await o.supabase.from('muayene_kaynaklari').select('sablon_id, okuma, created_at').eq('doctor_id', o.doktorId).in('sablon_id', ids).order('created_at', { ascending: false }).limit(60) : { data: [] }
  const ornek = new Map<string, string>()
  for (const k of son || []) {
    const sid = String(k.sablon_id)
    if (ornek.has(sid)) continue
    const sayfa = ((k.okuma as { sayfalar?: { sablonId?: string | null; maskeliBelgeId?: string }[] } | null)?.sayfalar || []).find((x) => x.sablonId === sid && x.maskeliBelgeId)
    if (sayfa?.maskeliBelgeId) ornek.set(sid, sayfa.maskeliBelgeId)
  }
  // ESNEK-KBB2: the build's registry forms of the doctor's branş (read-only, placed on a photo by their printed labels;
  // kept apart so the settings card does not offer them for editing)
  const { data: u } = await o.supabase.from('users').select('specialty').eq('id', o.doktorId).maybeSingle()
  return json({ sablonlar: sablonlar.map((x) => ({ ...x, ornekBelgeId: ornek.get(x.id) || null })), kayitli: kayitliSablonlarTr((u?.specialty as string) || null) })
}

export async function POST(req: NextRequest) {
  const o = await elNotuIstegi(req, 'hazirla')
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b) return json({ error: 'Geçersiz istek.' }, 400)
  let s
  try {
    s = sablonTaslagi({
      id: uuidMu(b.id) ? b.id : randomUUID(), ad: String(b.ad || ''), tur: b.tur === 'serbest' ? 'serbest' : 'formlu', brans: typeof b.brans === 'string' ? b.brans : null,
      enBoy: Number(b.enBoy) || 0.7071, baslik: Array.isArray(b.baslik) ? (b.baslik as Kutu[]) : [], cizim: Array.isArray(b.cizim) ? (b.cizim as CizimBolgesi[]) : [],
      parmakIzi: Array.isArray(b.parmakIzi) ? (b.parmakIzi as number[]).map(Number) : null,
    })
  } catch (e) { return json({ error: 'Şablon eksik.', kod: e instanceof Error ? e.message : 'gecersiz' }, 400) }
  if (s.tur === 'serbest') {
    // one plain-sheet declaration per doctor
    const { data: var_ } = await o.supabase.from('el_notu_sablonlari').select('id').eq('doctor_id', o.doktorId).eq('tur', 'serbest').eq('aktif', true).maybeSingle()
    if (var_) return json({ sablon: { ...s, id: var_.id } })
  }
  const satir = { doctor_id: o.doktorId, ad: s.ad, tur: s.tur, brans: s.brans, en_boy: s.enBoy, baslik_bolgeleri: s.baslikBolgeleri, cizim_bolgeleri: s.cizimBolgeleri, parmak_izi: s.parmakIzi, aktif: true, updated_at: new Date().toISOString() }
  const { data: mevcut } = await o.supabase.from('el_notu_sablonlari').select('id').eq('id', s.id).eq('doctor_id', o.doktorId).maybeSingle()
  const r = mevcut
    ? await o.supabase.from('el_notu_sablonlari').update(satir).eq('id', s.id).eq('doctor_id', o.doktorId).select('*').single()
    : await o.supabase.from('el_notu_sablonlari').insert({ id: s.id, ...satir }).select('*').single()
  if (r.error || !r.data) return json({ error: 'Şablon kaydedilemedi.' }, 500)
  return json({ sablon: sablonSatiri(r.data as Record<string, unknown>) })
}

export async function DELETE(req: NextRequest) {
  const o = await elNotuIstegi(req, 'doktor')
  if ('hata' in o) return o.hata
  const id = new URL(req.url).searchParams.get('id')
  if (!uuidMu(id)) return json({ error: 'Şablon gerekli.' }, 400)
  await o.supabase.from('el_notu_sablonlari').update({ aktif: false, updated_at: new Date().toISOString() }).eq('id', id).eq('doctor_id', o.doktorId)
  return json({ ok: true })
}
