/**
 * TR-PROTOKOL-KUTUPHANESI — founder review of the monthly check's flags (/kurucu/kaynaklar). Pure decision logic (tested) +
 * the two DB writes. Approving a "new edition" may publish ONE announcement (→ one Fısıltı per doctor of the document's
 * branşlar). It never edits the registry: the founder's decision is the input for a reviewed commit to belgeler.ts, and the
 * panel says so. Takes no patient, note or session id — only a queue row id and a registry document id.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { belgeBul } from './index'
import { duyuruBasligi } from './takip'

export type IncelemeKarari = {
  id: string
  karar: 'onayla' | 'reddet'
  not: string | null
  duyuru: { belgeId: string; surum: string | null; yil: number | null; url: string | null } | null
}

const UUID = /^[0-9a-f-]{36}$/i

export function incelemeKarariCoz(govde: unknown): IncelemeKarari | { hata: string } {
  const b = (govde && typeof govde === 'object' ? govde : {}) as Record<string, unknown>
  if (typeof b.id !== 'string' || !UUID.test(b.id)) return { hata: 'Queue item missing.' }
  if (b.karar !== 'onayla' && b.karar !== 'reddet') return { hata: 'Decision must be onayla or reddet.' }
  const not = typeof b.not === 'string' && b.not.trim() ? b.not.trim().slice(0, 1000) : null
  let duyuru: IncelemeKarari['duyuru'] = null
  if (b.karar === 'onayla' && b.duyuru && typeof b.duyuru === 'object') {
    const d = b.duyuru as Record<string, unknown>
    const belgeId = typeof d.belgeId === 'string' ? d.belgeId : ''
    if (!belgeBul(belgeId)) return { hata: 'Announcement needs a registry document.' }
    const yil = d.yil === null || d.yil === undefined || d.yil === '' ? null : Number(d.yil)
    if (yil !== null && !(Number.isInteger(yil) && yil >= 1990 && yil <= 2100)) return { hata: 'Year must be 1990–2100.' }
    const url = typeof d.url === 'string' && d.url.trim() ? d.url.trim() : null
    if (url && !/^https:\/\/([a-z0-9-]+\.)*(saglik\.gov\.tr|titck\.gov\.tr|sgk\.gov\.tr|resmigazete\.gov\.tr|tuseb\.gov\.tr|org\.tr|escardio\.org|goldcopd\.org|ginasthma\.org|kdigo\.org|uroweb\.org|erc\.edu)\//i.test(url)) return { hata: 'Official https link only (saglik.gov.tr, titck, sgk, resmigazete, tuseb, a society .org.tr, or the international society site: escardio.org, goldcopd.org, ginasthma.org, kdigo.org, uroweb.org, erc.edu).' }
    const surum = typeof d.surum === 'string' && d.surum.trim() ? d.surum.trim().slice(0, 200) : null
    if (!surum && yil === null) return { hata: 'Give the new edition (as printed) or its year.' }
    duyuru = { belgeId, surum, yil, url }
  }
  return { id: b.id, karar: b.karar, not, duyuru }
}

/** The announcement row a reviewed new edition publishes (branşlar from the registry, never from the request). */
export function duyuruSatiri(d: NonNullable<IncelemeKarari['duyuru']>, kuyrukId: string) {
  const belge = belgeBul(d.belgeId)!
  return { belge_id: belge.id, baslik: duyuruBasligi(belge), branslar: [...belge.branslar], surum: d.surum, yil: d.yil, url: d.url, kuyruk_id: kuyrukId }
}

export async function incelemeKarariUygula(sb: SupabaseClient, k: IncelemeKarari, kurucuId: string): Promise<{ ok: true; duyuruId: string | null } | { hata: string; durum: number }> {
  const { data: satir, error } = await sb
    .from('protokol_inceleme_kuyrugu')
    .update({ durum: k.karar === 'onayla' ? 'onaylandi' : 'reddedildi', karar_at: new Date().toISOString(), karar_veren: kurucuId, karar_notu: k.not })
    .eq('id', k.id)
    .eq('durum', 'bekliyor')
    .select('id, belge_idleri')
    .maybeSingle()
  if (error) return { hata: 'Not saved.', durum: 500 }
  if (!satir) return { hata: 'Already decided or not found.', durum: 404 }
  if (!k.duyuru) return { ok: true, duyuruId: null }
  const { data: d, error: e } = await sb.from('protokol_surum_duyurulari').insert(duyuruSatiri(k.duyuru, k.id)).select('id').single()
  if (e || !d) return { hata: 'Decision saved; announcement not published.', durum: 500 }
  return { ok: true, duyuruId: String(d.id) }
}
