/**
 * ESNEK-GELISIM (Kaan, 2026-11-24) — branş lexicon growth on the server (service-role client).
 *
 *  - `bransOnerileriniGuncelle`  nightly (app/api/cron/esnek-gece): reads every doctor's OWN confirmed lexicon entries
 *                                (hekim_el_sozlugu, source Doğrula / his own entry / overnight-learned), counts independent
 *                                doctors per branş + pair (core/elNotu/bransSozlukBuyume.ts, threshold 3, never-learned
 *                                classes excluded) and stores only the pair + the count. Founder / test accounts never count
 *                                as an independent doctor. Decided rows are never reopened.
 *  - `bransOneriKarari`          the founder's approve / reject on the dashboard (app/api/kurucu/el-notu-kalite).
 *  - `bransTohumu`               the branş seed every reader of that branş uses: curated seed + approved pairs (cached 10 min
 *                                per instance; one small indexed query otherwise). The doctor's own lexicon still wins.
 * HASTA-IZOLASYON: no patient id anywhere; doctor ids are read only to count distinct doctors and never stored or returned.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { tohumlarTr } from '@/core/elNotu/tohum'
import { bransOnerileri, bransTohumuBirlestir, oneriKorumaliMi, type HekimGirdisi } from '@/core/elNotu/bransSozlukBuyume'
import type { SozlukGirdisi } from '@/core/elNotu/tipler'
import { KAAN_TEST_EPOSTASI, kurucuEpostalari } from '@/lib/kurucu/denemeBildirimi'

const ONBELLEK_MS = 10 * 60 * 1000
const onbellek = new Map<string, { t: number; girdiler: { kisaltma: string; anlam: string }[] }>()
export function bransOnbellegiTemizle(): void { onbellek.clear() }

export async function onayliBransGirdileri(sb: SupabaseClient, brans: string | null | undefined): Promise<{ kisaltma: string; anlam: string }[]> {
  if (!brans) return []
  const v = onbellek.get(brans)
  if (v && Date.now() - v.t < ONBELLEK_MS) return v.girdiler
  try {
    const { data, error } = await sb.from('brans_sozluk_onerileri').select('kisaltma, anlam').eq('brans', brans).eq('durum', 'onayli').limit(500)
    // a database without migration 205 (or a transient error): the curated seed alone, never a failed reading
    const girdiler = error ? [] : ((data || []) as { kisaltma: string; anlam: string }[]).map((r) => ({ kisaltma: String(r.kisaltma), anlam: String(r.anlam) }))
    if (!error) onbellek.set(brans, { t: Date.now(), girdiler })
    return girdiler
  } catch { return [] }
}

/** The Türkiye build's seeds for a branş: curated + founder-approved pairs, and the general seed. */
export async function bransTohumu(sb: SupabaseClient, brans: string | null | undefined): Promise<{ brans: SozlukGirdisi[]; genel: SozlukGirdisi[] }> {
  const t = tohumlarTr(brans || null)
  const onayli = await onayliBransGirdileri(sb, brans)
  return { brans: bransTohumuBirlestir(t.brans, onayli), genel: t.genel }
}

/** Accounts that never count as an independent doctor (founders, Kaan's test account). */
async function sayilmayanDoktorlar(sb: SupabaseClient, ids: string[]): Promise<Set<string>> {
  const haric = new Set([KAAN_TEST_EPOSTASI, ...kurucuEpostalari()].map((e) => e.toLowerCase()))
  const out = new Set<string>()
  for (let i = 0; i < ids.length; i += 500) {
    const { data } = await sb.from('users').select('id, email').in('id', ids.slice(i, i + 500))
    for (const u of (data || []) as { id: string; email: string | null }[]) if (u.email && haric.has(String(u.email).toLowerCase())) out.add(String(u.id))
  }
  return out
}

export async function bransOnerileriniGuncelle(sb: SupabaseClient): Promise<{ oneri: number; yeni: number; silinen: number }> {
  const { data, error } = await sb.from('hekim_el_sozlugu').select('doctor_id, kisaltma, anlam, brans').in('kaynak', ['dogrulama', 'elle', 'gece']).limit(50000)
  if (error) return { oneri: 0, yeni: 0, silinen: 0 }
  const satirlar = (data || []) as { doctor_id: string; kisaltma: string; anlam: string; brans: string | null }[]
  const ids = [...new Set(satirlar.map((r) => String(r.doctor_id)))]
  const haric = await sayilmayanDoktorlar(sb, ids)
  // an entry without its branş (an older row) takes the doctor's registered branş
  const eksik = [...new Set(satirlar.filter((r) => !r.brans).map((r) => String(r.doctor_id)))]
  const kayitli = new Map<string, string>()
  for (let i = 0; i < eksik.length; i += 500) {
    const { data: u } = await sb.from('users').select('id, specialty').in('id', eksik.slice(i, i + 500))
    for (const x of (u || []) as { id: string; specialty: string | null }[]) if (x.specialty) kayitli.set(String(x.id), String(x.specialty))
  }
  const girdiler: HekimGirdisi[] = satirlar.filter((r) => !haric.has(String(r.doctor_id))).map((r) => ({ doktorId: String(r.doctor_id), brans: r.brans || kayitli.get(String(r.doctor_id)) || null, kisaltma: String(r.kisaltma), anlam: String(r.anlam) }))
  const oneriler = bransOnerileri(girdiler, (b) => tohumlarTr(b))

  const { data: mevcut } = await sb.from('brans_sozluk_onerileri').select('id, brans, kisaltma_anahtar, anlam_anahtar, durum, doktor_sayisi').limit(20000)
  const harita = new Map(((mevcut || []) as { id: string; brans: string; kisaltma_anahtar: string; anlam_anahtar: string; durum: string; doktor_sayisi: number }[]).map((r) => [`${r.brans}\u0000${r.kisaltma_anahtar}\u0000${r.anlam_anahtar}`, r]))
  const simdi = new Date().toISOString()
  const yeniler = oneriler.filter((o) => !harita.has(`${o.brans}\u0000${o.kisaltmaAnahtar}\u0000${o.anlamAnahtar}`))
  if (yeniler.length) {
    await sb.from('brans_sozluk_onerileri').insert(yeniler.map((o) => ({ brans: o.brans, kisaltma: o.kisaltma, kisaltma_anahtar: o.kisaltmaAnahtar, anlam: o.anlam, anlam_anahtar: o.anlamAnahtar, doktor_sayisi: o.doktorSayisi, durum: 'oneri' })))
  }
  const destek = new Map(oneriler.map((o) => [`${o.brans}\u0000${o.kisaltmaAnahtar}\u0000${o.anlamAnahtar}`, o.doktorSayisi]))
  let silinen = 0
  for (const [k, r] of harita) {
    const n = destek.get(k)
    if (n === undefined) {
      // support fell below the threshold: an undecided proposal is withdrawn; a decision stays (the founder's call)
      if (r.durum === 'oneri') { await sb.from('brans_sozluk_onerileri').delete().eq('id', r.id).eq('durum', 'oneri'); silinen++ }
      continue
    }
    if (n !== Number(r.doktor_sayisi)) await sb.from('brans_sozluk_onerileri').update({ doktor_sayisi: n, updated_at: simdi }).eq('id', r.id)
  }
  return { oneri: oneriler.length, yeni: yeniler.length, silinen }
}

export type BransOneriSatiri = { id: string; brans: string; kisaltma: string; anlam: string; doktorSayisi: number; durum: 'oneri' | 'onayli' | 'reddedildi'; kararAt: string | null; createdAt: string }

export async function bransOnerileriListe(sb: SupabaseClient): Promise<BransOneriSatiri[]> {
  const { data, error } = await sb.from('brans_sozluk_onerileri').select('id, brans, kisaltma, anlam, doktor_sayisi, durum, karar_at, created_at').order('created_at', { ascending: false }).limit(500)
  if (error) return []
  const sira = { oneri: 0, onayli: 1, reddedildi: 2 } as const
  return ((data || []) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id), brans: String(r.brans), kisaltma: String(r.kisaltma), anlam: String(r.anlam), doktorSayisi: Number(r.doktor_sayisi) || 0,
    durum: (['oneri', 'onayli', 'reddedildi'].includes(String(r.durum)) ? r.durum : 'oneri') as BransOneriSatiri['durum'], kararAt: (r.karar_at as string) || null, createdAt: String(r.created_at),
  })).sort((a, b) => sira[a.durum] - sira[b.durum] || b.doktorSayisi - a.doktorSayisi || a.brans.localeCompare(b.brans))
}

/** The founder's decision. Approval re-checks the never-learned guard and refuses a second meaning for an approved key. */
export async function bransOneriKarari(sb: SupabaseClient, g: { id: unknown; karar: unknown; userId: string }): Promise<{ ok: true } | { hata: string; durum: number }> {
  if (typeof g.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(g.id)) return { hata: 'invalid id', durum: 400 }
  if (g.karar !== 'onayli' && g.karar !== 'reddedildi' && g.karar !== 'oneri') return { hata: 'invalid decision', durum: 400 }
  const { data: r } = await sb.from('brans_sozluk_onerileri').select('id, brans, kisaltma, kisaltma_anahtar, anlam, durum').eq('id', g.id).maybeSingle()
  if (!r) return { hata: 'not found', durum: 404 }
  if (g.karar === 'onayli') {
    if (oneriKorumaliMi(String(r.kisaltma), String(r.anlam))) return { hata: 'never-learned class', durum: 422 }
    const { data: baska } = await sb.from('brans_sozluk_onerileri').select('id').eq('brans', r.brans).eq('kisaltma_anahtar', r.kisaltma_anahtar).eq('durum', 'onayli').neq('id', r.id).limit(1)
    if ((baska || []).length) return { hata: 'another meaning of this abbreviation is already approved for this branş', durum: 409 }
  }
  const simdi = new Date().toISOString()
  const { error } = await sb.from('brans_sozluk_onerileri').update({ durum: g.karar, karar_veren_user_id: g.karar === 'oneri' ? null : g.userId, karar_at: g.karar === 'oneri' ? null : simdi, updated_at: simdi }).eq('id', r.id)
  if (error) return { hata: 'not saved', durum: 500 }
  bransOnbellegiTemizle()
  return { ok: true }
}
