/**
 * HEKIM-PUSH (Kaan, 2026-11-25) — server half of the doctor notifications: immediate pushes for new alerts and the
 * morning summary. Routing rules, defaults and lock-screen payloads live in the pure, client-safe
 * lib/saglikEvi/hekimBildirimKurallari.ts (read its header for the full policy). Server only (node:crypto via webPush).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { pushGonder, vapidAnahtarlari, type PushIcerigi, type PushSonucu } from './push/webPush'
import { GUN_MS } from './zaman'
import { BEKLEYEN_PENCERE_MS, VARSAYILAN_HEKIM_AYARI, hekimAyarSatiri, hekimPushIcerigi, hekimYerelZaman, ozetZamaniMi, pushKarari } from './hekimBildirimKurallari'

export * from './hekimBildirimKurallari'

type Sb = SupabaseClient

// ─── server ─────────────────────────────────────────────────────────────────────────────────────────────────────────

export type HekimGonderici = (abone: { endpoint: string; p256dh: string; auth: string }, icerik: PushIcerigi, o: { acil: boolean }) => Promise<PushSonucu>

/** Real sender (VAPID from the environment), or null when push is not configured. acil → Urgency: high, 1 h TTL. */
export function varsayilanHekimGonderici(): HekimGonderici | null {
  const v = vapidAnahtarlari()
  if (!v) return null
  return (a, i, o) => pushGonder(a, i, v, { acil: o.acil, ttlSn: o.acil ? 3600 : 6 * 3600 })
}

export interface YeniUyari { id: string; doctor_id: string; patient_id: string; duzey: string; kural?: string | null; olusturma_at?: string | null }

async function talepEt(sb: Sb, satirlar: Array<{ doctor_id: string; patient_id: string | null; tur: string; anahtar: string; sonuc?: string }>): Promise<Set<string>> {
  if (!satirlar.length) return new Set()
  const { data } = await sb.from('ev_bildirim_gunlugu').upsert(satirlar, { onConflict: 'anahtar', ignoreDuplicates: true }).select('anahtar')
  return new Set(((data || []) as Array<{ anahtar: string }>).map((r) => r.anahtar))
}

async function hekimVerisi(sb: Sb, doktorIdler: string[], simdiMs: number) {
  const [ayarR, aboR, logR] = await Promise.all([
    sb.from('hekim_bildirim_ayarlari').select('*').in('doctor_id', doktorIdler),
    sb.from('hekim_push_abonelikleri').select('id, doctor_id, endpoint, p256dh, auth').in('doctor_id', doktorIdler).limit(500),
    sb.from('ev_bildirim_gunlugu').select('doctor_id, tur').in('doctor_id', doktorIdler).in('tur', ['hekim_acil', 'hekim_bildir']).gte('created_at', new Date(simdiMs - 3600_000).toISOString()).limit(2000),
  ])
  const ayar = new Map(((ayarR.data || []) as Record<string, any>[]).map((r) => [String(r.doctor_id), hekimAyarSatiri(r)]))
  const abo = new Map<string, Array<Record<string, any>>>()
  for (const a of (aboR.data || []) as Record<string, any>[]) abo.set(String(a.doctor_id), [...(abo.get(String(a.doctor_id)) || []), a])
  const sayac = new Map<string, number>()
  for (const l of (logR.data || []) as Record<string, any>[]) { const k = `${l.doctor_id}|${l.tur}`; sayac.set(k, (sayac.get(k) || 0) + 1) }
  return { ayar: (d: string) => ayar.get(d) || { ...VARSAYILAN_HEKIM_AYARI }, abo, sayac }
}

async function gonderHepsi(sb: Sb, gonder: HekimGonderici, isler: Array<{ abonelikler: Array<Record<string, any>>; icerik: PushIcerigi; acil: boolean }>) {
  let gonderilen = 0
  const silinecek: string[] = []
  await Promise.all(isler.flatMap((is) => is.abonelikler.map(async (a) => {
    const r = await gonder({ endpoint: a.endpoint, p256dh: a.p256dh, auth: a.auth }, is.icerik, { acil: is.acil })
    if (r.ok) gonderilen++
    else if (r.sil) silinecek.push(String(a.id))
  })))
  if (silinecek.length) await sb.from('hekim_push_abonelikleri').delete().in('id', silinecek)
  return { gonderilen, silinen: silinecek.length }
}

/**
 * New alerts → immediate pushes where the routing says so. Held alerts are left for the summary. Called off the request
 * path (portal reading save) and from the daily cron (kritik medicine alerts).
 */
export async function hekimeBildir(sb: Sb, gonder: HekimGonderici | null, uyarilar: YeniUyari[], simdiMs = Date.now()) {
  const adaylar = uyarilar.filter((u) => u.duzey === 'acil' || u.duzey === 'hekime_bildir')
  if (!gonder || !adaylar.length) return { hemen: 0, bekletilen: 0, gonderilen: 0 }
  const doktorlar = [...new Set(adaylar.map((u) => u.doctor_id))]
  const hastalar = [...new Set(adaylar.map((u) => u.patient_id))]
  const [hv, onayR] = await Promise.all([
    hekimVerisi(sb, doktorlar, simdiMs),
    sb.from('ev_tercihler').select('doctor_id, patient_id').eq('paylasim_onayi', true).in('doctor_id', doktorlar).in('patient_id', hastalar),
  ])
  const onayli = new Set(((onayR.data || []) as Record<string, any>[]).map((r) => `${r.doctor_id}|${r.patient_id}`))
  // One push per doctor + patient + level in one call (several rules on one reading → one notification).
  const gruplar = new Map<string, { doktor: string; hasta: string; duzey: 'acil' | 'hekime_bildir'; idler: string[] }>()
  let bekletilen = 0
  const sayac = new Map(hv.sayac)
  for (const u of adaylar) {
    if (!onayli.has(`${u.doctor_id}|${u.patient_id}`) || !(hv.abo.get(u.doctor_id) || []).length) continue
    const duzey = u.duzey as 'acil' | 'hekime_bildir'
    const tur = duzey === 'acil' ? 'hekim_acil' : 'hekim_bildir'
    const k = `${u.doctor_id}|${u.patient_id}|${duzey}`
    if (!gruplar.has(k)) {
      const karar = pushKarari(duzey, hv.ayar(u.doctor_id), simdiMs, sayac.get(`${u.doctor_id}|${tur}`) || 0)
      if (karar !== 'hemen') { bekletilen++; continue }
      sayac.set(`${u.doctor_id}|${tur}`, (sayac.get(`${u.doctor_id}|${tur}`) || 0) + 1)
      gruplar.set(k, { doktor: u.doctor_id, hasta: u.patient_id, duzey, idler: [] })
    }
    gruplar.get(k)!.idler.push(u.id)
  }
  const satirlar = [...gruplar.values()].flatMap((g) => g.idler.map((id) => ({ doctor_id: g.doktor, patient_id: g.hasta, tur: g.duzey === 'acil' ? 'hekim_acil' : 'hekim_bildir', anahtar: `hekim:uyari:${id}`, sonuc: 'hemen' })))
  const alinan = await talepEt(sb, satirlar)
  const isler = [...gruplar.values()].map((g) => ({ ...g, idler: g.idler.filter((id) => alinan.has(`hekim:uyari:${id}`)) })).filter((g) => g.idler.length).map((g) => ({
    abonelikler: hv.abo.get(g.doktor) || [],
    icerik: hekimPushIcerigi({ tur: g.duzey === 'acil' ? 'acil' : 'bildir', patientId: g.hasta, anahtar: g.idler[0], sayi: g.idler.length }),
    acil: g.duzey === 'acil',
  }))
  const r = await gonderHepsi(sb, gonder, isler)
  return { hemen: isler.length, bekletilen, gonderilen: r.gonderilen }
}

/**
 * The morning summary (every cron tick; sends at most once per doctor per local day): the held alerts of the last 3 days
 * that were never pushed, unseen, of consented patients → one push with counts only. Each counted alert is claimed so it
 * is never counted again.
 */
export async function hekimSabahOzeti(sb: Sb, gonder: HekimGonderici | null, simdiMs = Date.now()) {
  if (!gonder) return { ozet: 0 }
  const { data: aboR } = await sb.from('hekim_push_abonelikleri').select('doctor_id').limit(5000)
  const doktorlar = [...new Set(((aboR || []) as Record<string, any>[]).map((r) => String(r.doctor_id)))]
  if (!doktorlar.length) return { ozet: 0 }
  const hv = await hekimVerisi(sb, doktorlar, simdiMs)
  const zamani = doktorlar.filter((d) => ozetZamaniMi(hv.ayar(d), simdiMs))
  if (!zamani.length) return { ozet: 0 }
  const gunAnahtari = (d: string) => `hekim:ozet:${d}:${hekimYerelZaman(simdiMs, hv.ayar(d).saatDilimi).gun}`
  const [uyR, logR] = await Promise.all([
    sb.from('ev_uyarilar').select('id, doctor_id, patient_id, duzey').in('doctor_id', zamani).is('hekim_gordu_at', null).in('duzey', ['hekime_bildir', 'acil']).gte('olusturma_at', new Date(simdiMs - BEKLEYEN_PENCERE_MS).toISOString()).limit(3000),
    sb.from('ev_bildirim_gunlugu').select('anahtar').in('doctor_id', zamani).in('tur', ['hekim_acil', 'hekim_bildir', 'hekim_ozet']).gte('created_at', new Date(simdiMs - BEKLEYEN_PENCERE_MS - GUN_MS).toISOString()).limit(10000),
  ])
  const gecmis = new Set(((logR.data || []) as Array<{ anahtar: string }>).map((l) => l.anahtar))
  const bekleyen = ((uyR.data || []) as Record<string, any>[]).filter((u) => !gecmis.has(`hekim:uyari:${u.id}`))
  if (!bekleyen.length) return { ozet: 0 }
  const { data: onayR } = await sb.from('ev_tercihler').select('doctor_id, patient_id').eq('paylasim_onayi', true).in('doctor_id', zamani).in('patient_id', [...new Set(bekleyen.map((u) => String(u.patient_id)))])
  const onayli = new Set(((onayR || []) as Record<string, any>[]).map((r) => `${r.doctor_id}|${r.patient_id}`))
  const doktorBazli = new Map<string, Array<Record<string, any>>>()
  for (const u of bekleyen) if (onayli.has(`${u.doctor_id}|${u.patient_id}`) && !gecmis.has(gunAnahtari(String(u.doctor_id)))) doktorBazli.set(String(u.doctor_id), [...(doktorBazli.get(String(u.doctor_id)) || []), u])
  if (!doktorBazli.size) return { ozet: 0 }
  const gunAlinan = await talepEt(sb, [...doktorBazli.keys()].map((d) => ({ doctor_id: d, patient_id: null, tur: 'hekim_ozet', anahtar: gunAnahtari(d), sonuc: 'ozet' })))
  const secilen = [...doktorBazli.entries()].filter(([d]) => gunAlinan.has(gunAnahtari(d)))
  await talepEt(sb, secilen.flatMap(([d, liste]) => liste.map((u) => ({ doctor_id: d, patient_id: String(u.patient_id), tur: 'hekim_ozet', anahtar: `hekim:uyari:${u.id}`, sonuc: 'ozet' }))))
  const r = await gonderHepsi(sb, gonder, secilen.map(([d, liste]) => ({
    abonelikler: hv.abo.get(d) || [],
    icerik: hekimPushIcerigi({ tur: 'ozet', hastaSayisi: new Set(liste.map((u) => String(u.patient_id))).size, uyariSayisi: liste.length, gun: hekimYerelZaman(simdiMs, hv.ayar(d).saatDilimi).gun }),
    acil: false,
  })))
  return { ozet: secilen.length, gonderilen: r.gonderilen }
}
