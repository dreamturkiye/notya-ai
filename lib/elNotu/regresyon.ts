/**
 * ESNEK-GELISIM (Kaan, 2026-11-24) — the growing, consented, de-identified El Notu regression set (service-role client).
 *
 * Entry (only with the doctor's explicit consent, esnek_muayene_ayarlari.gelistirme_onayi — default OFF):
 *   1. `regresyonAdayiYaz`   after a page is read (app/api/doktor/el-notu/oku, in the background): the device's MASKED page
 *                            package exactly as the reader received it (its masking proven again here) is stored as one
 *                            object under a random name in the private bucket; the row keeps a pending link to its source.
 *   2. `regresyonuTamamla`   after the DOCTOR approves the note (lib/esnek/onaySonrasi.ts, in the background): the clinical
 *                            facts of each page are derived from his approved note + the confirmed reading
 *                            (core/elNotu/regresyonSeti.ts — identity-shaped text, the patient's name parts and dates
 *                            dropped); the link to the source is cut (kaynak_id NULL). A secretary's finalization never
 *                            completes a page. A page with too few facts is deleted.
 *   - consent withdrawn → `gelistirmeOnayiniGeriCek` deletes every page of that doctor (objects + rows) at once;
 *   - a page whose note is never approved is deleted after 30 days (`bayatAdaylariTemizle`, weekly run).
 *
 * Weekly (`haftalikRegresyon`, app/api/cron/el-notu-regresyon, cronYetki): every set page is re-read through the
 * PRODUCTION reader path (lib/elNotu/model.ts → central policy, no model named here; branş seed incl. approved pairs; no
 * personal memory) — the masking proven again before any model call — scored with the shared core, and only numbers are
 * stored. Every model answer is recorded next to the page (`kayit/<page>.json`) for the regression guard's replay
 * (scripts/el-notu-regresyon-bekcisi.mts). Nothing patient-identifying is in a metric row.
 * HASTA-IZOLASYON: every doctor-side read / write by doctor_id; the note and its sources by id AND doctor_id.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import type { GorselBlok, SayfaPaketi, SayfaSonucu } from '@/core/elNotu/okuyucu'
import { sayfaGercekleri, haftaBasi, ASGARI_GERCEK } from '@/core/elNotu/regresyonSeti'
import { kaydedenModel, sayfaOlc, puandanOlcum, olcumdenPuan, type SetSayfasi, type OlcumOrtami, type OlcumSatiri } from '@/core/elNotu/regresyonBekcisi'
import { toplamPuan, type DegerlendirmeGercegi, type ToplamPuan } from '@/core/elNotu/degerlendirme'
import type { ModelKapisi } from '@/core/elNotu/okuyucu'

export const REGRESYON_KOVASI = 'el-notu-regresyon'
export const BEKLEME_GUN = 30
/** Pages re-read per week at most (cost bound; the oldest set pages first, the rest the next week). */
export const HAFTALIK_AZAMI = 200

export async function gelistirmeOnayiVarMi(sb: SupabaseClient, doktorId: string): Promise<boolean> {
  const { data, error } = await sb.from('esnek_muayene_ayarlari').select('gelistirme_onayi').eq('doctor_id', doktorId).maybeSingle()
  return !error && (data as { gelistirme_onayi?: boolean } | null)?.gelistirme_onayi === true
}

async function nesneSil(sb: SupabaseClient, yollar: string[]): Promise<void> {
  const tum = yollar.flatMap((y) => [y, `kayit/${y}`])
  for (let i = 0; i < tum.length; i += 100) { try { await sb.storage.from(REGRESYON_KOVASI).remove(tum.slice(i, i + 100)) } catch { /* the weekly run retries orphans */ } }
}

/** 1. A page just read: stored as a pending set page only when the doctor consented and the masking is proven again. */
export async function regresyonAdayiYaz(sb: SupabaseClient, g: { doktorId: string; kaynakId: string; brans: string | null; paket: SayfaPaketi; maskeliSayfa: GorselBlok; maskeKaniti: (p: SayfaPaketi, s: GorselBlok) => boolean }): Promise<'yazildi' | 'onay_yok' | 'maske' | 'hata'> {
  if (!(await gelistirmeOnayiVarMi(sb, g.doktorId))) return 'onay_yok'
  if (!g.maskeKaniti(g.paket, g.maskeliSayfa)) return 'maske'
  const yol = `${randomUUID()}.json`
  const { error: yukHata } = await sb.storage.from(REGRESYON_KOVASI).upload(yol, Buffer.from(JSON.stringify({ paket: g.paket, maskeliSayfa: g.maskeliSayfa })), { contentType: 'application/json', upsert: false })
  if (yukHata) return 'hata'
  const { data: eski } = await sb.from('el_notu_regresyon_sayfalari').select('id, depo_yolu').eq('doctor_id', g.doktorId).eq('kaynak_id', g.kaynakId).eq('sayfa', g.paket.sayfa).maybeSingle()
  if (eski) {
    // a retake of the same page replaces the pending package
    const { error } = await sb.from('el_notu_regresyon_sayfalari').update({ depo_yolu: yol, brans: g.brans }).eq('id', eski.id).eq('doctor_id', g.doktorId)
    if (error) { await nesneSil(sb, [yol]); return 'hata' }
    await nesneSil(sb, [String(eski.depo_yolu)])
    return 'yazildi'
  }
  const { error } = await sb.from('el_notu_regresyon_sayfalari').insert({ doctor_id: g.doktorId, kaynak_id: g.kaynakId, sayfa: g.paket.sayfa, brans: g.brans, depo_yolu: yol, durum: 'bekliyor' })
  if (error) { await nesneSil(sb, [yol]); return 'hata' }
  return 'yazildi'
}

/** The confirmed reading of one page (every answered Doğrula already written into its lines). */
function sayfaMetni(s: SayfaSonucu | { satirlar?: { normal?: string; ham?: string }[]; cizimler?: { bulgu?: string }[] }): string {
  return [...(s.satirlar || []).map((l) => String(l.normal || l.ham || '')), ...(s.cizimler || []).map((c) => String(c.bulgu || ''))].filter(Boolean).join('\n')
}

/** 2. After the DOCTOR's approval: facts per page, link cut; no consent (any more) → the pending pages are deleted. */
export async function regresyonuTamamla(sb: SupabaseClient, g: { doktorId: string; noteId: string; hekim: boolean; son: Record<string, unknown> }): Promise<{ hazir: number; silinen: number }> {
  if (!g.hekim) return { hazir: 0, silinen: 0 }
  const { data: not } = await sb.from('notes').select('id, session_id, patient_id').eq('id', g.noteId).eq('doctor_id', g.doktorId).maybeSingle()
  if (!not) return { hazir: 0, silinen: 0 }
  const kaynakSecim = 'id, tur, patient_id, okuma, durum, acik_dogrula'
  const [{ data: k1 }, { data: k2 }] = await Promise.all([
    sb.from('muayene_kaynaklari').select(kaynakSecim).eq('doctor_id', g.doktorId).eq('note_id', g.noteId).limit(40),
    not.session_id ? sb.from('muayene_kaynaklari').select(kaynakSecim).eq('doctor_id', g.doktorId).eq('session_id', not.session_id).limit(40) : Promise.resolve({ data: [] as unknown[] }),
  ])
  const kaynaklar = [...new Map([...(k1 || []), ...(k2 || [])].map((r) => [String((r as { id: string }).id), r as { id: string; tur: string; patient_id: string | null; okuma: { sayfalar?: SayfaSonucu[] } | null; durum: string; acik_dogrula: number }])).values()]
  const elKaynaklari = kaynaklar.filter((k) => k.tur === 'el_notu' || k.tur === 'sekreter_yukleme')
  if (!elKaynaklari.length) return { hazir: 0, silinen: 0 }
  const { data: bekleyen } = await sb.from('el_notu_regresyon_sayfalari').select('id, kaynak_id, sayfa, depo_yolu').eq('doctor_id', g.doktorId).eq('durum', 'bekliyor').in('kaynak_id', elKaynaklari.map((k) => k.id))
  const satirlar = (bekleyen || []) as { id: string; kaynak_id: string; sayfa: number; depo_yolu: string }[]
  if (!satirlar.length) return { hazir: 0, silinen: 0 }
  const sil = async (liste: typeof satirlar) => {
    if (!liste.length) return 0
    await sb.from('el_notu_regresyon_sayfalari').delete().eq('doctor_id', g.doktorId).in('id', liste.map((r) => r.id))
    await nesneSil(sb, liste.map((r) => r.depo_yolu))
    return liste.length
  }
  if (!(await gelistirmeOnayiVarMi(sb, g.doktorId))) return { hazir: 0, silinen: await sil(satirlar) }

  const { genisletici, hastaAdParcalari } = await import('@/lib/esnek/sunucu')
  const [genislet, adlar] = await Promise.all([genisletici(sb, g.doktorId), hastaAdParcalari(sb, g.doktorId, [not.patient_id, ...elKaynaklari.map((k) => k.patient_id)].filter(Boolean).map(String))])
  // every page of the note's hand-note sources, in order; facts are attributed to pages
  const sayfalar = elKaynaklari.flatMap((k) => ((k.okuma?.sayfalar || []) as SayfaSonucu[]).map((s) => ({ kaynakId: k.id, sayfa: s.sayfa, metin: sayfaMetni(s) })))
  // a dictated visit (audio / duration on the session) is a second source: then only facts found on the page count
  const { data: seans } = not.session_id ? await sb.from('sessions').select('duration_seconds, audio_url').eq('id', not.session_id).eq('doctor_id', g.doktorId).maybeSingle() : { data: null }
  const dikteli = Boolean(seans && ((Number((seans as { duration_seconds?: number }).duration_seconds) || 0) > 0 || (seans as { audio_url?: string }).audio_url))
  const tekSayfa = sayfalar.length === 1 && !dikteli && kaynaklar.every((k) => k.tur === 'el_notu' || k.tur === 'sekreter_yukleme')
  const alan = (k: string) => (typeof g.son[k] === 'string' ? (g.son[k] as string) : null)
  const gercekler = sayfaGercekleri({ not: { subjektif: alan('content_subjektif'), objektif: alan('content_objektif'), degerlendirme: alan('content_degerlendirme'), plan: alan('content_plan') }, sayfaMetinleri: sayfalar.map((s) => s.metin), genislet, adlar, tekSayfa })
  let hazir = 0
  const kucuk: typeof satirlar = []
  const simdi = new Date().toISOString()
  for (const r of satirlar) {
    const i = sayfalar.findIndex((s) => s.kaynakId === r.kaynak_id && s.sayfa === r.sayfa)
    const liste: DegerlendirmeGercegi[] = i >= 0 ? gercekler[i] : []
    if (liste.length < ASGARI_GERCEK) { kucuk.push(r); continue }
    const { error } = await sb.from('el_notu_regresyon_sayfalari').update({ gercekler: liste, gercek_sayisi: liste.length, durum: 'hazir', kaynak_id: null, hazir_at: simdi }).eq('id', r.id).eq('doctor_id', g.doktorId)
    if (!error) hazir++
  }
  return { hazir, silinen: await sil(kucuk) }
}

/** Consent withdrawn: every page of this doctor leaves the set now (metrics keep numbers only, unlinked). */
export async function gelistirmeOnayiniGeriCek(sb: SupabaseClient, doktorId: string): Promise<number> {
  const { data } = await sb.from('el_notu_regresyon_sayfalari').select('id, depo_yolu').eq('doctor_id', doktorId).limit(5000)
  const satirlar = (data || []) as { id: string; depo_yolu: string }[]
  if (!satirlar.length) return 0
  await sb.from('el_notu_regresyon_sayfalari').delete().eq('doctor_id', doktorId)
  await nesneSil(sb, satirlar.map((r) => r.depo_yolu))
  return satirlar.length
}

/** Pending pages whose note was never approved within BEKLEME_GUN days. */
export async function bayatAdaylariTemizle(sb: SupabaseClient, simdi = new Date()): Promise<number> {
  const kesim = new Date(simdi.getTime() - BEKLEME_GUN * 86400000).toISOString()
  const { data } = await sb.from('el_notu_regresyon_sayfalari').select('id, depo_yolu').eq('durum', 'bekliyor').lt('created_at', kesim).limit(1000)
  const satirlar = (data || []) as { id: string; depo_yolu: string }[]
  if (!satirlar.length) return 0
  await sb.from('el_notu_regresyon_sayfalari').delete().in('id', satirlar.map((r) => r.id)).eq('durum', 'bekliyor')
  await nesneSil(sb, satirlar.map((r) => r.depo_yolu))
  return satirlar.length
}

async function nesneOku(sb: SupabaseClient, yol: string): Promise<unknown> {
  const { data, error } = await sb.storage.from(REGRESYON_KOVASI).download(yol)
  if (error || !data) throw new Error('nesne')
  const metin = typeof data === 'string' ? data : typeof (data as Blob).text === 'function' ? await (data as Blob).text() : Buffer.from(data as unknown as ArrayBuffer).toString('utf8')
  return JSON.parse(metin)
}

export type HaftalikGirdi = {
  simdi?: Date
  butceMs: number
  model: () => ModelKapisi
  ortam: OlcumOrtami
  maskeKaniti: (p: SayfaPaketi, s: GorselBlok) => boolean
  surum?: string | null
}

/** One invocation of the weekly run: continues this week's run where the previous invocation stopped (time-boxed). */
export async function haftalikRegresyon(sb: SupabaseClient, g: HaftalikGirdi): Promise<{ hafta: string; olculen: number; kalan: number; hata: number }> {
  const bas = Date.now()
  const hafta = haftaBasi(g.simdi || new Date())
  const [{ data: set }, { data: yapilan }] = await Promise.all([
    sb.from('el_notu_regresyon_sayfalari').select('id, brans, depo_yolu, gercekler').eq('durum', 'hazir').order('hazir_at', { ascending: true }).limit(HAFTALIK_AZAMI),
    sb.from('el_notu_regresyon_olcumleri').select('sayfa_id').eq('hafta', hafta).limit(HAFTALIK_AZAMI * 2),
  ])
  const bitti = new Set(((yapilan || []) as { sayfa_id: string | null }[]).map((r) => String(r.sayfa_id)))
  const sira = ((set || []) as { id: string; brans: string | null; depo_yolu: string; gercekler: DegerlendirmeGercegi[] }[]).filter((r) => !bitti.has(r.id))
  let olculen = 0, hata = 0
  for (const r of sira) {
    if (Date.now() - bas > g.butceMs) break
    const t0 = Date.now()
    let satir: Partial<OlcumSatiri> & { hata?: string | null } = {}
    try {
      const nesne = (await nesneOku(sb, r.depo_yolu)) as { paket: SayfaPaketi; maskeliSayfa: GorselBlok }
      if (!nesne?.paket || !nesne.maskeliSayfa || !g.maskeKaniti(nesne.paket, nesne.maskeliSayfa)) throw Object.assign(new Error('maske'), { kod: 'maske' })
      const kayit: Record<string, unknown> = {}
      const s: SetSayfasi = { ad: r.id, brans: r.brans, paket: nesne.paket, maskeliSayfa: nesne.maskeliSayfa, gercekler: r.gercekler || [] }
      const { puan } = await sayfaOlc(s, kaydedenModel(g.model(), r.id, kayit), g.ortam)
      satir = puandanOlcum(puan)
      try { await sb.storage.from(REGRESYON_KOVASI).upload(`kayit/${r.depo_yolu}`, Buffer.from(JSON.stringify({ hafta, surum: g.surum || null, kayit })), { contentType: 'application/json', upsert: true }) } catch { /* the guard reports the page as stale */ }
      olculen++
    } catch (e) {
      hata++
      satir = { hata: ((e as { kod?: string }).kod || (e instanceof Error ? e.name : 'hata')).slice(0, 40) }
    }
    await sb.from('el_notu_regresyon_olcumleri').upsert({ hafta, sayfa_id: r.id, brans: r.brans, okuyucu_surumu: g.surum ? String(g.surum).slice(0, 40) : null, ms: Date.now() - t0, ...satir }, { onConflict: 'hafta,sayfa_id' })
  }
  return { hafta, olculen, kalan: Math.max(0, sira.length - olculen - hata), hata }
}

export type RegresyonHaftasi = { hafta: string; sayfa: number; hata: number; toplam: ToplamPuan; surumler: string[] }
export type RegresyonOzeti = { haftalar: RegresyonHaftasi[]; set: { hazir: number; bekliyor: number; doktor: number; brans: Record<string, number> } }

/** Dashboard: the weekly trend (numbers only) + the set's size. */
export async function regresyonOzeti(sb: SupabaseClient, haftaSayisi = 12): Promise<RegresyonOzeti> {
  const kesim = new Date(Date.now() - haftaSayisi * 7 * 86400000).toISOString().slice(0, 10)
  const [{ data: olc, error: e1 }, { data: set, error: e2 }] = await Promise.all([
    sb.from('el_notu_regresyon_olcumleri').select('hafta, okuyucu_surumu, gercek, kesin, dogrulamada, adayda, isaretli, kacan, dogrula, korumali_soru, korumali_gercek, korumali_dogrula_ile, uydurma, hata').gte('hafta', kesim).limit(10000),
    sb.from('el_notu_regresyon_sayfalari').select('doctor_id, brans, durum').limit(20000),
  ])
  const gruplar = new Map<string, { satirlar: OlcumSatiri[]; hata: number; surumler: Set<string> }>()
  if (!e1) for (const r of (olc || []) as (OlcumSatiri & { hafta: string; okuyucu_surumu: string | null; hata: string | null })[]) {
    const h = String(r.hafta).slice(0, 10)
    const v = gruplar.get(h) || { satirlar: [], hata: 0, surumler: new Set<string>() }
    if (r.hata) v.hata++; else v.satirlar.push(r)
    if (r.okuyucu_surumu) v.surumler.add(String(r.okuyucu_surumu).slice(0, 7))
    gruplar.set(h, v)
  }
  const haftalar = [...gruplar.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([hafta, v]) => ({ hafta, sayfa: v.satirlar.length, hata: v.hata, toplam: toplamPuan(v.satirlar.map(olcumdenPuan)), surumler: [...v.surumler] }))
  const satirlar = e2 ? [] : ((set || []) as { doctor_id: string; brans: string | null; durum: string }[])
  const brans: Record<string, number> = {}
  for (const r of satirlar) if (r.durum === 'hazir') brans[r.brans || '—'] = (brans[r.brans || '—'] || 0) + 1
  return { haftalar, set: { hazir: satirlar.filter((r) => r.durum === 'hazir').length, bekliyor: satirlar.filter((r) => r.durum === 'bekliyor').length, doktor: new Set(satirlar.filter((r) => r.durum === 'hazir').map((r) => r.doctor_id)).size, brans } }
}
