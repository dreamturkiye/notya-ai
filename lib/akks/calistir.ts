/**
 * AKKS run engine (server). One item = the PRODUCTION text assistant exactly as a doctor uses it (lib/asistan/ayseCevapla,
 * kanal 'yazi', the branş's evaluation doctor, the branş's default colleague, no patient, a fresh session) + a SEPARATE
 * grader call through the central model policy (lib/ai/cagir.ts aiCagir; no model name here) + the deterministic citation
 * check against the TR-PROTOKOL-KUTUPHANESI registry. Numbers and the answer text are stored (akks_cevaplar); the evaluation
 * doctors have no patients, so nothing patient-derived exists to store.
 *
 * Founder lock: lib/asistan/ayseCevapla.ts and lib/ai/modeller.ts are called, never edited. The voice path is out of scope.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { ayseCevapla } from '@/lib/asistan/ayseCevapla'
import { varsayilanPersonaId } from '@/lib/asistan/personaEngine'
import { aiCagir, yanitMetni } from '@/lib/ai/cagir'
import { jsonCikar } from '@/lib/ai/jsonOnar'
import { belgeBul } from '@/lib/kaynaklar/protokolKutuphanesi'
import { maddeBul, tumMaddeler } from '@/core/akks/sorular'
import { NOTLAYICI_SISTEM, notlamaPaketi, notlamaCoz, atifBulgusuUygula } from '@/core/akks/notlayici'
import { atifDenetle, type KayitliBelge } from '@/core/akks/atif'
import { cevapGectiMi, cevapPuani, insanUygula, ozetle, barKarari, puanlariDogrula, type Ozet, type BarKarari } from '@/core/akks/rubrik'
import { kapiKarari, type KapiKarari } from '@/core/akks/kapi'
import { incelemeNedeni } from '@/core/akks/orneklem'
import type { CevapKaydi, InsanKarari, Kategori, Notlama, SoruMaddesi } from '@/core/akks/tipler'
import izlenen from '@/core/akks/izlenen.json'
import { bransAdi, degerlendirmeHekimi, degerlendirmeHekimleri, hafizaSifirla } from './hekim'
import { ONCELIKLI_BRANSLAR } from '@/core/akks/banka'

export const IZLENEN_OZET: string = (izlenen as { ozet: string }).ozet
export type KosuTuru = 'taban' | 'haftalik' | 'kapi' | 'elle'

const kayitliBelge = (id: string | null): KayitliBelge | null => {
  if (!id) return null
  const b = belgeBul(id)
  return b ? { id: b.id, kisaAd: b.kisaAd, yil: b.yil, surum: b.surum, durum: b.durum, atifAdlari: b.atifAdlari } : null
}

const sira = (id: string) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

export interface KosuAcGirdisi {
  etiket: string
  tur: KosuTuru
  branslar?: string[]
  soruIdleri?: string[]
  sadeceIzleme?: boolean
  /** at most N items per branş, spread across categories (stable order) */
  bransBasina?: number
  olusturan?: string | null
}

/** Items a run plans: explicit ids, else the bank filtered (removed items never count). */
export async function kosuMaddeleri(sb: SupabaseClient, g: KosuAcGirdisi): Promise<SoruMaddesi[]> {
  const { data: cikan } = await sb.from('akks_soru_inceleme').select('soru_id').eq('durum', 'cikarildi').limit(5000)
  const cikarildi = new Set(((cikan || []) as { soru_id: string }[]).map((r) => r.soru_id))
  let m = tumMaddeler().filter((x) => !cikarildi.has(x.id))
  if (g.soruIdleri?.length) { const s = new Set(g.soruIdleri); return m.filter((x) => s.has(x.id)) }
  if (g.branslar?.length) { const s = new Set(g.branslar); m = m.filter((x) => s.has(x.brans)) }
  if (g.sadeceIzleme) m = m.filter((x) => x.izleme)
  if (g.bransBasina && g.bransBasina > 0) {
    const out: SoruMaddesi[] = []
    for (const brans of [...new Set(m.map((x) => x.brans))]) {
      // round-robin over categories so a small sample still covers every category of the branş
      const gruplar = new Map<Kategori, SoruMaddesi[]>()
      for (const x of m.filter((y) => y.brans === brans).sort((a, b) => sira(a.id) - sira(b.id))) (gruplar.get(x.kategori) || gruplar.set(x.kategori, []).get(x.kategori)!).push(x)
      const secilen: SoruMaddesi[] = []
      while (secilen.length < g.bransBasina && [...gruplar.values()].some((l) => l.length)) for (const l of gruplar.values()) if (l.length && secilen.length < g.bransBasina) secilen.push(l.shift()!)
      out.push(...secilen)
    }
    m = out
  }
  return m
}

export async function kosuAc(sb: SupabaseClient, g: KosuAcGirdisi): Promise<{ id: string; soruIdleri: string[] }> {
  const maddeler = await kosuMaddeleri(sb, g)
  if (!maddeler.length) throw new Error('akks: no items selected')
  const branslar = [...new Set(maddeler.map((m) => m.brans))]
  for (const b of branslar) await degerlendirmeHekimi(sb, b)
  const { data, error } = await sb.from('akks_kosular').insert({
    etiket: g.etiket.slice(0, 80), tur: g.tur, soru_idleri: maddeler.map((m) => m.id), branslar,
    izlenen_ozet: IZLENEN_OZET, surum: (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 64) || null, olusturan: g.olusturan ?? null,
  }).select('id').single()
  if (error || !data) throw new Error(`akks: run not created (${error?.code || 'db'})`)
  return { id: (data as { id: string }).id, soruIdleri: maddeler.map((m) => m.id) }
}

/** Grade one answer (separate model call; strict rubric). null = could not be graded. */
export async function notla(madde: SoruMaddesi, cevap: string, kaynakIdleri: string[], hekimId: string | null): Promise<Notlama | null> {
  const belge = kayitliBelge(madde.kaynak.id)
  const cipler = kaynakIdleri.map((id) => belgeBul(id)).filter(Boolean).map((b) => `${b!.kisaAd}${b!.surum ? ` (${b!.surum})` : ''}`)
  const paket = notlamaPaketi({ bransAdi: bransAdi(madde.brans), madde, cevap, belge })
    + (cipler.length ? `\n\nSOURCE CHIPS SHOWN UNDER THE ANSWER (count as citations; grade "atif" on them too): ${cipler.join(' · ')}` : '')
  const kademe = process.env.AKKS_NOTLAYICI_KADEME === 'hizli' ? 'hizli' : 'derin'
  const y = await aiCagir({
    gorev: 'klinik-analiz', kademe, maxTokens: 3000, jsonBekleniyor: true, doctorId: hekimId,
    system: [{ metin: NOTLAYICI_SISTEM, onbellek: true }, { metin: paket }],
    messages: [{ role: 'user', content: 'Değerlendir. Yalnız JSON.' }],
  })
  const n = notlamaCoz(jsonCikar(yanitMetni(y)), madde)
  if (!n) return null
  const bulgu = atifDenetle(`${cevap}\n${cipler.join('\n')}`, belge ? [belge] : [])
  return atifBulgusuUygula(cipler.length && !n.atifVar ? { ...n, atifVar: true, puanlar: { ...n.puanlar, atif: n.puanlar.atif ?? 1 } } : n, bulgu)
}

export interface SoruSonucu {
  soruId: string
  brans: string
  puan: number | null
  zararli: boolean | null
  gecti: boolean | null
  inceleme: 'fail' | 'orneklem' | null
  rota: string | null
  ms: number
  hata: string | null
  cevap: string | null
}

/** Run one planned item of an open run (idempotent: an item already answered is returned as stored). */
export async function soruCalistir(sb: SupabaseClient, kosuId: string, soruId: string): Promise<SoruSonucu> {
  const { data: kosu } = await sb.from('akks_kosular').select('id, durum, soru_idleri').eq('id', kosuId).maybeSingle()
  const k = kosu as { durum: string; soru_idleri: string[] } | null
  if (!k || k.durum !== 'calisiyor' || !k.soru_idleri.includes(soruId)) throw new Error('akks: item not in an open run')
  const { data: onceki } = await sb.from('akks_cevaplar').select('soru_id, brans, puan, zararli, gecti, inceleme, rota, ms, hata, cevap').eq('kosu_id', kosuId).eq('soru_id', soruId).maybeSingle()
  if (onceki) { const o = onceki as Record<string, unknown>; return { soruId, brans: String(o.brans), puan: o.puan == null ? null : Number(o.puan), zararli: (o.zararli as boolean) ?? null, gecti: (o.gecti as boolean) ?? null, inceleme: (o.inceleme as SoruSonucu['inceleme']) ?? null, rota: (o.rota as string) ?? null, ms: Number(o.ms) || 0, hata: (o.hata as string) ?? null, cevap: (o.cevap as string) ?? null } }
  const madde = maddeBul(soruId)
  if (!madde) throw new Error('akks: unknown item')
  const hekimId = await degerlendirmeHekimi(sb, madde.brans)
  await hafizaSifirla(sb, hekimId).catch(() => { /* memory reset is best effort */ })
  const t0 = Date.now()
  let cevap: string | null = null, rota: string | null = null, kaynakIdleri: string[] = [], hata: string | null = null, oturumId: string | null = null
  try {
    const s = await ayseCevapla({ supabase: sb, doktorId: hekimId, oturumId: null, mesaj: madde.soru, kanal: 'yazi', personaId: varsayilanPersonaId(madde.brans), saatDilimi: 'Europe/Istanbul' })
    if (s.ok) {
      cevap = String(s.cevap.ekran || '').slice(0, 20000)
      rota = s.cevap.rota
      oturumId = s.cevap.oturumId
      const ids = (s.cevap.veri as { kaynakIdleri?: unknown }).kaynakIdleri
      kaynakIdleri = Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string').slice(0, 5) : []
    } else hata = `asistan_${s.durum}`
  } catch (e) {
    hata = `asistan_${e instanceof Error ? e.name : 'hata'}`.slice(0, 200)
  }
  const ms = Date.now() - t0
  if (oturumId) await sb.from('asistan_sessions').delete().eq('id', oturumId).eq('doctor_id', hekimId).then(() => undefined, () => undefined)
  let notlama: Notlama | null = null
  if (cevap && !hata) {
    try { notlama = await notla(madde, cevap, kaynakIdleri, hekimId) } catch (e) { hata = `notlayici_${e instanceof Error ? e.name : 'hata'}` }
    if (!notlama && !hata) hata = 'notlanamadi'
  }
  const puan = notlama ? cevapPuani(notlama) : null
  const gecti = notlama ? cevapGectiMi(notlama) : null
  const inceleme = notlama ? incelemeNedeni(kosuId, soruId, Boolean(gecti)) : null
  const { error: yazHata } = await sb.from('akks_cevaplar').upsert({
    kosu_id: kosuId, soru_id: soruId, soru_ozeti: madde.ozet, brans: madde.brans, kategori: madde.kategori, zorluk: madde.zorluk,
    cevap, rota, kaynak_idleri: kaynakIdleri, ms, notlama, puan, zararli: notlama?.zararli ?? null, kilavuz: notlama?.puanlar.kilavuz ?? null,
    atif_var: notlama?.atifVar ?? null, atif: notlama?.puanlar.atif ?? null, gecti, inceleme, hata,
  }, { onConflict: 'kosu_id,soru_id' })
  if (yazHata) throw new Error(`akks: answer not stored (${yazHata.code || 'db'})`)
  return { soruId, brans: madde.brans, puan, zararli: notlama?.zararli ?? null, gecti, inceleme, rota, ms, hata, cevap }
}

type CevapSatiri = { id: string; soru_id: string; brans: string; kategori: Kategori; notlama: Notlama | null; hata: string | null }

/** Stored answers of a run as rubric records, with human review decisions applied. */
export async function kosuKayitlari(sb: SupabaseClient, kosuId: string, brans?: string): Promise<CevapKaydi[]> {
  let q = sb.from('akks_cevaplar').select('id, soru_id, brans, kategori, notlama, hata').eq('kosu_id', kosuId).limit(2000)
  if (brans) q = q.eq('brans', brans)
  const { data } = await q
  const satirlar = (data || []) as CevapSatiri[]
  const ids = satirlar.map((s) => s.id)
  const kararlar = new Map<string, InsanKarari>()
  for (let i = 0; i < ids.length; i += 200) {
    const { data: ins } = await sb.from('akks_insan_inceleme').select('cevap_id, durum, puanlar, zararli').in('cevap_id', ids.slice(i, i + 200))
    for (const r of (ins || []) as { cevap_id: string; durum: string; puanlar: unknown; zararli: boolean | null }[]) {
      const p = puanlariDogrula(r.puanlar)
      kararlar.set(r.cevap_id, r.durum === 'duzeltildi' && p ? { durum: 'duzeltildi', puanlar: p, zararli: Boolean(r.zararli) } : { durum: 'onaylandi' })
    }
  }
  return satirlar.map((s) => ({ soruId: s.soru_id, brans: s.brans, kategori: s.kategori, hata: s.hata, notlama: s.notlama ? insanUygula(s.notlama, kararlar.get(s.id)) : null }))
}

export interface KosuOzeti {
  genel: Ozet & { bar: BarKarari }
  branslar: Record<string, Ozet & { bar: BarKarari }>
}

export function kosuOzetiHesapla(kayitlar: CevapKaydi[]): KosuOzeti {
  const branslar: KosuOzeti['branslar'] = {}
  for (const b of [...new Set(kayitlar.map((k) => k.brans))].sort()) { const o = ozetle(kayitlar.filter((k) => k.brans === b)); branslar[b] = { ...o, bar: barKarari(o) } }
  const g = ozetle(kayitlar)
  return { genel: { ...g, bar: barKarari(g) }, branslar }
}

/** The accepted baseline answers per branş (latest finished baseline run that measured the branş, other than `haric`). */
export async function tabanKayitlari(sb: SupabaseClient, branslar: string[], haric?: string): Promise<{ kayitlar: CevapKaydi[]; kosular: Record<string, string> }> {
  const { data } = await sb.from('akks_kosular').select('id, branslar').eq('taban_mi', true).eq('durum', 'tamam').order('basladi_at', { ascending: false }).limit(50)
  const kosular: Record<string, string> = {}
  for (const r of (data || []) as { id: string; branslar: string[] }[]) for (const b of r.branslar) if (r.id !== haric && branslar.includes(b) && !kosular[b]) kosular[b] = r.id
  const kayitlar: CevapKaydi[] = []
  for (const [b, id] of Object.entries(kosular)) kayitlar.push(...(await kosuKayitlari(sb, id, b)))
  return { kayitlar, kosular }
}

async function maliyetHesapla(sb: SupabaseClient, basladi: string): Promise<Record<string, unknown>> {
  const hekimler = await degerlendirmeHekimleri(sb)
  if (!hekimler.length) return { cagri: 0 }
  const { data } = await sb.from('ai_token_kullanim').select('gorev, model, input_tokens, output_tokens, cache_read, neden').in('doctor_id', hekimler).gte('created_at', basladi).limit(20000)
  const satir = (data || []) as { gorev: string; model: string; input_tokens: number | null; output_tokens: number | null; cache_read: number | null; neden: string | null }[]
  const modeller: Record<string, { cagri: number; girdi: number; cikti: number; onbellek: number }> = {}
  const nedenler: Record<string, number> = {}
  for (const r of satir) {
    const k = `${r.gorev}:${r.model}`
    const m = (modeller[k] ||= { cagri: 0, girdi: 0, cikti: 0, onbellek: 0 })
    m.cagri++; m.girdi += r.input_tokens || 0; m.cikti += r.output_tokens || 0; m.onbellek += r.cache_read || 0
    if (r.neden) nedenler[r.neden] = (nedenler[r.neden] || 0) + 1
  }
  return { cagri: satir.length, modeller, koruyucuNedenleri: nedenler }
}

/** Close a run: summary per branş, gate against the accepted baseline, token cost. A baseline run becomes the baseline. */
export async function kosuKapat(sb: SupabaseClient, kosuId: string): Promise<{ ozet: KosuOzeti; kapi: KapiKarari | null; maliyet: Record<string, unknown> }> {
  const { data: kosu } = await sb.from('akks_kosular').select('id, tur, durum, basladi_at, branslar').eq('id', kosuId).maybeSingle()
  const k = kosu as { tur: KosuTuru; durum: string; basladi_at: string; branslar: string[] } | null
  if (!k) throw new Error('akks: unknown run')
  const kayitlar = await kosuKayitlari(sb, kosuId)
  const ozet = kosuOzetiHesapla(kayitlar)
  const taban = await tabanKayitlari(sb, k.branslar, kosuId)
  const kapi = taban.kayitlar.length ? { ...kapiKarari(taban.kayitlar, kayitlar), tabanKosulari: taban.kosular } as KapiKarari : null
  const maliyet = await maliyetHesapla(sb, k.basladi_at)
  await sb.from('akks_kosular').update({ durum: 'tamam', bitti_at: new Date().toISOString(), ozet, kapi, maliyet, ...(k.tur === 'taban' ? { taban_mi: true } : {}) }).eq('id', kosuId)
  return { ozet, kapi, maliyet }
}

/** Planned items of a run that have no stored answer yet. */
export async function kalanMaddeler(sb: SupabaseClient, kosuId: string): Promise<string[]> {
  const { data: kosu } = await sb.from('akks_kosular').select('soru_idleri').eq('id', kosuId).maybeSingle()
  const { data: cev } = await sb.from('akks_cevaplar').select('soru_id').eq('kosu_id', kosuId).limit(2000)
  const yapildi = new Set(((cev || []) as { soru_id: string }[]).map((r) => r.soru_id))
  // an id the bank no longer knows can never be answered — it is not "remaining" (the run still closes)
  return (((kosu as { soru_idleri?: string[] } | null)?.soru_idleri) || []).filter((id) => !yapildi.has(id) && maddeBul(id))
}

/**
 * Nightly cron step (app/api/cron/ayse-kalite): continue the open weekly / gate run, or start one —
 *   weekly: Sundays (UTC), when no weekly run started in the last 6 days;
 *   gate:   when this build's watched-file hash (IZLENEN_OZET) has no run yet and a baseline exists.
 * Time-boxed; runs `paralel` items at a time; closes the run when nothing is left. AKKS_CRON_KAPALI=1 switches it off.
 */
export async function devamEt(sb: SupabaseClient, o: { butceMs: number; paralel: number; simdi?: Date }): Promise<Record<string, unknown>> {
  if (process.env.AKKS_CRON_KAPALI === '1') return { kapali: true }
  const simdi = o.simdi ?? new Date()
  const t0 = Date.now()
  // a forgotten run never blocks the queue forever
  await sb.from('akks_kosular').update({ durum: 'iptal', bitti_at: simdi.toISOString() }).eq('durum', 'calisiyor').lt('basladi_at', new Date(simdi.getTime() - 7 * 86400_000).toISOString())
  const { data: acik } = await sb.from('akks_kosular').select('id, tur').eq('durum', 'calisiyor').in('tur', ['haftalik', 'kapi']).order('basladi_at').limit(1)
  let kosuId = (acik?.[0] as { id: string } | undefined)?.id ?? null
  let baslatildi: string | null = null
  if (!kosuId) {
    const { data: son } = await sb.from('akks_kosular').select('tur, basladi_at, izlenen_ozet, taban_mi, durum').neq('durum', 'iptal').order('basladi_at', { ascending: false }).limit(200)
    const satirlar = (son || []) as { tur: string; basladi_at: string; izlenen_ozet: string | null; taban_mi: boolean; durum: string }[]
    const tabanVar = satirlar.some((r) => r.taban_mi && r.durum === 'tamam')
    const olculdu = satirlar.some((r) => r.izlenen_ozet === IZLENEN_OZET)
    // COST CAP (Kaan, 2026-11-24): a gate run (~100 items, the 5 priority branşlar' monitoring sample) only when a watched
    // prompt/model file changed, at most once per 24 h (later changes are picked up by the next one); the full monitoring set
    // (~275 items, all 40 branşlar) once a month — the first Sunday. The whole bank (1,550) runs only by hand.
    const kapiYakin = satirlar.some((r) => r.tur === 'kapi' && Date.parse(r.basladi_at) > simdi.getTime() - 86400_000)
    const aylikYakin = satirlar.some((r) => r.tur === 'haftalik' && Date.parse(r.basladi_at) > simdi.getTime() - 25 * 86400_000)
    const gun = simdi.toISOString().slice(0, 10)
    if (tabanVar && !olculdu && !kapiYakin) baslatildi = 'kapi'
    else if (simdi.getUTCDay() === 0 && simdi.getUTCDate() <= 7 && !aylikYakin) baslatildi = 'haftalik' // DB value kept; it is the monthly run
    if (baslatildi) kosuId = (await kosuAc(sb, baslatildi === 'kapi'
      ? { etiket: `kapi-${gun}`, tur: 'kapi', sadeceIzleme: true, branslar: [...ONCELIKLI_BRANSLAR] }
      : { etiket: `aylik-${gun}`, tur: 'haftalik', sadeceIzleme: true })).id
  }
  if (!kosuId) return { is: 'yok' }
  const kalan = await kalanMaddeler(sb, kosuId)
  let yapilan = 0, hata = 0
  const sinir = Math.max(30_000, o.butceMs - 120_000) // never start an item that cannot finish inside the function limit
  while (kalan.length && Date.now() - t0 < sinir) {
    const parti = kalan.splice(0, o.paralel)
    const r = await Promise.allSettled(parti.map((id) => soruCalistir(sb, kosuId!, id)))
    yapilan += r.filter((x) => x.status === 'fulfilled').length
    hata += r.filter((x) => x.status === 'rejected' || (x.status === 'fulfilled' && x.value.hata)).length
  }
  let kapandi = false
  if (!(await kalanMaddeler(sb, kosuId)).length) { await kosuKapat(sb, kosuId); kapandi = true }
  return { kosuId, baslatildi, yapilan, hata, kalan: kalan.length, kapandi }
}
