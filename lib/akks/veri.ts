/**
 * AKKS founder dashboard data + decisions + the pseudonymous panel (server). No patient data exists in any AKKS table.
 * The dashboard is labelled "vs guideline gold answers" (kılavuz-altın-cevaba göre) until blind Prof. comparisons exist;
 * a Prof. comparison number is shown only from blind-graded pairs (akks_kor_puanlar) and labelled as such.
 */
import { createHash, randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { tumMaddeler, maddeBul } from '@/core/akks/sorular'
import { HEDEF, ONCELIKLI_BRANSLAR } from '@/core/akks/banka'
import { cevapPuani, puanlariDogrula, BAR, yuzde } from '@/core/akks/rubrik'
import { korEslesme, korMetni } from '@/core/akks/orneklem'
import { OLCUTLER, KATEGORILER, type Notlama, type Puanlar, type SoruIncelemeDurumu, type SoruMaddesi } from '@/core/akks/tipler'
import { bransAdi } from './hekim'

export const ETIKET_ALTIN = 'kılavuz-altın-cevaba göre (vs guideline gold answers)'
export const ETIKET_PROF = 'kör Prof. karşılaştırması (blind Prof. comparison)'

const ozet = (t: string) => createHash('sha256').update(t, 'utf8').digest('hex')

type KosuSatiri = { id: string; etiket: string; tur: string; durum: string; branslar: string[]; soru_idleri: string[]; basladi_at: string; bitti_at: string | null; ozet: Record<string, unknown> | null; kapi: Record<string, unknown> | null; maliyet: Record<string, unknown> | null; taban_mi: boolean; izlenen_ozet: string | null; surum: string | null }

async function soruIncelemeleri(sb: SupabaseClient): Promise<Map<string, { durum: SoruIncelemeDurumu; gecerli: boolean }>> {
  const { data } = await sb.from('akks_soru_inceleme').select('soru_id, soru_ozeti, durum').limit(5000)
  const m = new Map<string, { durum: SoruIncelemeDurumu; gecerli: boolean }>()
  for (const r of (data || []) as { soru_id: string; soru_ozeti: string; durum: SoruIncelemeDurumu }[]) {
    const madde = maddeBul(r.soru_id)
    m.set(r.soru_id, { durum: r.durum, gecerli: Boolean(madde && madde.ozet === r.soru_ozeti) })
  }
  return m
}

/** Review status of a gold item: a decision made on an older version of the item does not count ("taslak"). */
export function soruDurumu(m: SoruMaddesi, kayit: { durum: SoruIncelemeDurumu; gecerli: boolean } | undefined): SoruIncelemeDurumu {
  if (!kayit) return 'taslak'
  if (kayit.durum === 'cikarildi') return 'cikarildi'
  return kayit.gecerli ? kayit.durum : 'taslak'
}

export async function panoVerisi(sb: SupabaseClient) {
  const maddeler = tumMaddeler()
  const inc = await soruIncelemeleri(sb)
  const { data: kosuData } = await sb.from('akks_kosular').select('id, etiket, tur, durum, branslar, soru_idleri, basladi_at, bitti_at, ozet, kapi, maliyet, taban_mi, izlenen_ozet, surum').order('basladi_at', { ascending: false }).limit(40)
  const kosular = (kosuData || []) as KosuSatiri[]
  const tamam = kosular.filter((k) => k.durum === 'tamam')
  const branslar = [...new Set(maddeler.map((m) => m.brans))]
  const bransSatirlari = branslar.map((b) => {
    const bm = maddeler.filter((m) => m.brans === b)
    const durumlar = bm.map((m) => soruDurumu(m, inc.get(m.id)))
    const trend = tamam.filter((k) => (k.ozet as { branslar?: Record<string, unknown> } | null)?.branslar?.[b]).slice(0, 12).reverse().map((k) => {
      const o = (k.ozet as { branslar: Record<string, Record<string, unknown>> }).branslar[b]
      return { kosuId: k.id, etiket: k.etiket, tur: k.tur, tarih: k.basladi_at, n: o.n, genelPuan: o.genelPuan, kilavuzUyumu: o.kilavuzUyumu, zararli: o.zararli, atifDogrulugu: o.atifDogrulugu, bar: o.bar }
    })
    return {
      brans: b, ad: bransAdi(b), oncelikli: (ONCELIKLI_BRANSLAR as readonly string[]).includes(b),
      hedef: (ONCELIKLI_BRANSLAR as readonly string[]).includes(b) ? HEDEF.oncelikli : 100,
      soru: bm.length, izleme: bm.filter((m) => m.izleme).length,
      onayli: durumlar.filter((d) => d === 'onaylandi').length, duzeltme: durumlar.filter((d) => d === 'duzeltme-gerekli').length,
      cikarildi: durumlar.filter((d) => d === 'cikarildi').length, taslak: durumlar.filter((d) => d === 'taslak').length,
      son: trend.length ? trend[trend.length - 1] : null, trend,
    }
  })
  // failing items of the latest finished run of each branş
  const sonKosu = new Map<string, string>()
  for (const k of tamam) for (const b of k.branslar) if (!sonKosu.has(b)) sonKosu.set(b, k.id)
  const basarisiz: Record<string, unknown>[] = []
  for (const [b, id] of sonKosu) {
    const { data } = await sb.from('akks_cevaplar').select('id, soru_id, puan, zararli, notlama, cevap, hata').eq('kosu_id', id).eq('brans', b).or('gecti.eq.false,hata.not.is.null').order('puan', { ascending: true, nullsFirst: true }).limit(40)
    for (const r of (data || []) as { id: string; soru_id: string; puan: number | null; zararli: boolean | null; notlama: Notlama | null; cevap: string | null; hata: string | null }[]) {
      const m = maddeBul(r.soru_id)
      basarisiz.push({
        cevapId: r.id, kosuId: id, brans: b, soruId: r.soru_id, soru: m?.soru ?? '', kategori: m?.kategori, puan: r.puan, zararli: r.zararli, hata: r.hata,
        eksik: m && r.notlama ? m.anahtarlar.filter((_, i) => r.notlama!.anahtarIsabet[i] !== 'var') : [],
        ihlal: m && r.notlama ? r.notlama.soylememeliIhlal.map((i) => m.soylememeli[i]).filter(Boolean) : [],
        gerekce: r.notlama?.gerekce ?? '', zararNedeni: r.notlama?.zararNedeni ?? null, cevap: (r.cevap || '').slice(0, 4000),
      })
    }
  }
  // human review queue: every fail + sampled passes without a decision
  const { data: kuyrukData } = await sb.from('akks_cevaplar').select('id, kosu_id, soru_id, brans, inceleme, puan, zararli, notlama, cevap, created_at').not('inceleme', 'is', null).order('created_at', { ascending: false }).limit(300)
  const kuyrukHam = (kuyrukData || []) as { id: string; kosu_id: string; soru_id: string; brans: string; inceleme: string; puan: number | null; zararli: boolean | null; notlama: Notlama | null; cevap: string | null }[]
  const karar = new Set<string>()
  for (let i = 0; i < kuyrukHam.length; i += 200) {
    const { data } = await sb.from('akks_insan_inceleme').select('cevap_id').in('cevap_id', kuyrukHam.slice(i, i + 200).map((r) => r.id))
    for (const r of (data || []) as { cevap_id: string }[]) karar.add(r.cevap_id)
  }
  const kuyruk = kuyrukHam.filter((r) => !karar.has(r.id)).slice(0, 60).map((r) => {
    const m = maddeBul(r.soru_id)
    return { cevapId: r.id, kosuId: r.kosu_id, brans: r.brans, soruId: r.soru_id, neden: r.inceleme, soru: m?.soru ?? '', anahtarlar: m?.anahtarlar ?? [], soylememeli: m?.soylememeli ?? [], puan: r.puan, zararli: r.zararli, puanlar: r.notlama?.puanlar ?? null, isabet: r.notlama?.anahtarIsabet ?? [], gerekce: r.notlama?.gerekce ?? '', cevap: (r.cevap || '').slice(0, 6000) }
  })
  const bekleyenInceleme = kuyrukHam.filter((r) => !karar.has(r.id)).length
  // blind Prof. comparison (only from blind-graded pairs)
  const { data: korData } = await sb.from('akks_kor_puanlar').select('brans, a_kaynak, puan_a, puan_b, zararli_a, zararli_b, tercih').limit(5000)
  const prof: Record<string, { n: number; ayse: number; prof: number; ayseZararli: number; profZararli: number; ayseTercih: number; profTercih: number; esit: number }> = {}
  for (const r of (korData || []) as { brans: string; a_kaynak: 'ayse' | 'prof'; puan_a: unknown; puan_b: unknown; zararli_a: boolean; zararli_b: boolean; tercih: 'A' | 'B' | 'esit' }[]) {
    const pa = puanlariDogrula(r.puan_a), pb = puanlariDogrula(r.puan_b)
    if (!pa || !pb) continue
    const sA = cevapPuani({ puanlar: pa, zararli: r.zararli_a }), sB = cevapPuani({ puanlar: pb, zararli: r.zararli_b })
    const ayseA = r.a_kaynak === 'ayse'
    const p = (prof[r.brans] ||= { n: 0, ayse: 0, prof: 0, ayseZararli: 0, profZararli: 0, ayseTercih: 0, profTercih: 0, esit: 0 })
    p.n++; p.ayse += ayseA ? sA : sB; p.prof += ayseA ? sB : sA
    if (ayseA ? r.zararli_a : r.zararli_b) p.ayseZararli++
    if (ayseA ? r.zararli_b : r.zararli_a) p.profZararli++
    if (r.tercih === 'esit') p.esit++; else if ((r.tercih === 'A') === ayseA) p.ayseTercih++; else p.profTercih++
  }
  const profSatirlari = Object.entries(prof).map(([b, p]) => ({ brans: b, ad: bransAdi(b), n: p.n, ayse: p.n ? Math.round((p.ayse / p.n) * 1000) / 1000 : null, prof: p.n ? Math.round((p.prof / p.n) * 1000) / 1000 : null, ayseZararli: p.ayseZararli, profZararli: p.profZararli, ayseTercih: p.ayseTercih, profTercih: p.profTercih, esit: p.esit }))
  const { data: davetData } = await sb.from('akks_panel_davetleri').select('id, rol, brans, kod, soru_idleri, olusturma, son_kullanma, iptal').order('olusturma', { ascending: false }).limit(50)
  return {
    etiket: profSatirlari.some((p) => p.n > 0) ? ETIKET_PROF : ETIKET_ALTIN,
    etiketAltin: ETIKET_ALTIN,
    bar: BAR,
    toplamSoru: maddeler.length,
    branslar: bransSatirlari,
    kosular: kosular.map((k) => ({
      id: k.id, etiket: k.etiket, tur: k.tur, durum: k.durum, branslar: k.branslar, soru: k.soru_idleri.length, basladi: k.basladi_at, bitti: k.bitti_at, tabanMi: k.taban_mi, izlenenOzet: k.izlenen_ozet, surum: k.surum,
      genel: (k.ozet as { genel?: Record<string, unknown> } | null)?.genel ?? null,
      kapi: k.kapi ? { gecti: (k.kapi as { gecti?: boolean }).gecti ?? null, nedenler: (k.kapi as { nedenler?: string[] }).nedenler ?? [] } : null,
      maliyet: k.maliyet,
    })),
    basarisiz, kuyruk, bekleyenInceleme, prof: profSatirlari,
    davetler: ((davetData || []) as { id: string; rol: string; brans: string; kod: string; soru_idleri: string[]; olusturma: string; son_kullanma: string; iptal: boolean }[]).map((d) => ({ id: d.id, rol: d.rol, brans: d.brans, kod: d.kod, soru: d.soru_idleri.length, olusturma: d.olusturma, sonKullanma: d.son_kullanma, iptal: d.iptal })),
    uretildi: new Date().toISOString(),
  }
}
export type AkksPanoVerisi = Awaited<ReturnType<typeof panoVerisi>>

/** Validate a Puanlar payload from a reviewer form. */
export function puanGirdisi(x: unknown): Puanlar | null { return puanlariDogrula(x) }

export async function insanIncelemeKaydet(sb: SupabaseClient, g: { cevapId: unknown; durum: unknown; puanlar?: unknown; zararli?: unknown; not?: unknown; userId?: string | null; kod?: string | null }): Promise<{ ok: true } | { hata: string; durum: number }> {
  if (typeof g.cevapId !== 'string' || !/^[0-9a-f-]{36}$/.test(g.cevapId)) return { hata: 'invalid id', durum: 400 }
  if (g.durum !== 'onaylandi' && g.durum !== 'duzeltildi') return { hata: 'invalid decision', durum: 400 }
  const puanlar = g.durum === 'duzeltildi' ? puanGirdisi(g.puanlar) : null
  if (g.durum === 'duzeltildi' && (!puanlar || typeof g.zararli !== 'boolean')) return { hata: 'scores and harm flag required', durum: 400 }
  const { data: c } = await sb.from('akks_cevaplar').select('id').eq('id', g.cevapId).maybeSingle()
  if (!c) return { hata: 'not found', durum: 404 }
  const { error } = await sb.from('akks_insan_inceleme').upsert({
    cevap_id: g.cevapId, durum: g.durum, puanlar, zararli: g.durum === 'duzeltildi' ? g.zararli : null,
    not_: typeof g.not === 'string' ? g.not.slice(0, 2000) : null, inceleyen: g.userId ?? null, inceleyen_kodu: g.kod ?? null, karar_at: new Date().toISOString(),
  }, { onConflict: 'cevap_id' })
  return error ? { hata: 'not saved', durum: 500 } : { ok: true }
}

export async function soruIncelemeKaydet(sb: SupabaseClient, g: { soruId: unknown; durum: unknown; not?: unknown; userId?: string | null; kod?: string | null }): Promise<{ ok: true } | { hata: string; durum: number }> {
  const m = typeof g.soruId === 'string' ? maddeBul(g.soruId) : null
  if (!m) return { hata: 'unknown item', durum: 404 }
  if (g.durum !== 'onaylandi' && g.durum !== 'duzeltme-gerekli' && g.durum !== 'cikarildi') return { hata: 'invalid decision', durum: 400 }
  const { error } = await sb.from('akks_soru_inceleme').upsert({
    soru_id: m.id, soru_ozeti: m.ozet, durum: g.durum, not_: typeof g.not === 'string' ? g.not.slice(0, 2000) : null,
    inceleyen: g.userId ?? null, inceleyen_kodu: g.kod ?? null, karar_at: new Date().toISOString(),
  }, { onConflict: 'soru_id' })
  return error ? { hata: 'not saved', durum: 500 } : { ok: true }
}

export async function tabanKabul(sb: SupabaseClient, kosuId: unknown): Promise<{ ok: true } | { hata: string; durum: number }> {
  if (typeof kosuId !== 'string') return { hata: 'invalid id', durum: 400 }
  const { data } = await sb.from('akks_kosular').update({ taban_mi: true }).eq('id', kosuId).eq('durum', 'tamam').select('id')
  return data?.length ? { ok: true } : { hata: 'only a finished run can become the baseline', durum: 409 }
}

// ── Panel (blind Prof. comparison + gold-item review) ────────────────────────────────────────────────────────────────

export type PanelRolu = 'cevaplayici' | 'degerlendirici' | 'soru-inceleyici'
export const PANEL_BASLIGI = 'x-akks-panel'

type Davet = { id: string; rol: PanelRolu; brans: string; kod: string; soru_idleri: string[] }

async function sonAyseCevaplari(sb: SupabaseClient, brans: string): Promise<Map<string, { id: string; cevap: string }>> {
  const { data } = await sb.from('akks_cevaplar').select('id, soru_id, cevap, created_at').eq('brans', brans).not('notlama', 'is', null).not('cevap', 'is', null).order('created_at', { ascending: false }).limit(2000)
  const m = new Map<string, { id: string; cevap: string }>()
  for (const r of (data || []) as { id: string; soru_id: string; cevap: string }[]) if (!m.has(r.soru_id)) m.set(r.soru_id, { id: r.id, cevap: r.cevap })
  return m
}

/** Create a panel invite; the plaintext token is returned ONCE (only its SHA-256 is stored). */
export async function davetOlustur(sb: SupabaseClient, g: { rol: unknown; brans: unknown; kod: unknown; soruSayisi?: unknown; gun?: unknown; userId?: string | null }): Promise<{ token: string; id: string; soru: number } | { hata: string; durum: number }> {
  if (g.rol !== 'cevaplayici' && g.rol !== 'degerlendirici' && g.rol !== 'soru-inceleyici') return { hata: 'invalid role', durum: 400 }
  const brans = typeof g.brans === 'string' ? g.brans : ''
  const bm = tumMaddeler().filter((m) => m.brans === brans)
  if (!bm.length) return { hata: 'unknown branş', durum: 400 }
  if (typeof g.kod !== 'string' || !/^[A-Za-z0-9_-]{1,20}$/.test(g.kod)) return { hata: 'pseudonym code: 1–20 letters / digits', durum: 400 }
  const n = Math.max(1, Math.min(g.rol === 'soru-inceleyici' ? 200 : 60, Number(g.soruSayisi) || 20))
  let ids: string[]
  if (g.rol === 'soru-inceleyici') ids = bm.map((m) => m.id).slice(0, n)
  else if (g.rol === 'cevaplayici') {
    const ayse = await sonAyseCevaplari(sb, brans)
    ids = bm.filter((m) => ayse.has(m.id)).map((m) => m.id).slice(0, n)
  } else {
    const { data } = await sb.from('akks_prof_cevaplar').select('soru_id').eq('brans', brans).limit(2000)
    ids = [...new Set(((data || []) as { soru_id: string }[]).map((r) => r.soru_id))].slice(0, n)
  }
  if (!ids.length) return { hata: g.rol === 'degerlendirici' ? 'no panel answers to grade yet' : 'no Ayşe answers for this branş yet — run AKKS first', durum: 409 }
  const gun = Math.max(1, Math.min(30, Number(g.gun) || 14))
  const token = randomBytes(32).toString('base64url')
  const { data, error } = await sb.from('akks_panel_davetleri').insert({
    anahtar_ozeti: ozet(token), rol: g.rol, brans, kod: g.kod, soru_idleri: ids,
    son_kullanma: new Date(Date.now() + gun * 86400_000).toISOString(), olusturan: g.userId ?? null,
  }).select('id').single()
  if (error || !data) return { hata: 'not saved', durum: 500 }
  return { token, id: (data as { id: string }).id, soru: ids.length }
}

export async function davetIptal(sb: SupabaseClient, id: unknown): Promise<{ ok: true } | { hata: string; durum: number }> {
  if (typeof id !== 'string') return { hata: 'invalid id', durum: 400 }
  await sb.from('akks_panel_davetleri').update({ iptal: true }).eq('id', id)
  return { ok: true }
}

/** The invite behind a panel token, or null (unknown, revoked, expired, malformed). */
export async function panelDavet(req: Request, sb: SupabaseClient, simdi = Date.now()): Promise<Davet | null> {
  const t = (req.headers.get(PANEL_BASLIGI) || '').trim()
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(t)) return null
  const { data } = await sb.from('akks_panel_davetleri').select('id, rol, brans, kod, soru_idleri, son_kullanma, iptal').eq('anahtar_ozeti', ozet(t)).limit(1)
  const d = (data?.[0] as (Davet & { son_kullanma: string; iptal: boolean }) | undefined)
  if (!d || d.iptal || !(Date.parse(d.son_kullanma) > simdi)) return null
  return d
}

export async function panelVerisi(sb: SupabaseClient, d: Davet) {
  const maddeler = d.soru_idleri.map((id) => maddeBul(id)).filter((m): m is SoruMaddesi => Boolean(m))
  const temel = { rol: d.rol, brans: d.brans, bransAdi: bransAdi(d.brans), kod: d.kod, olcutler: OLCUTLER, kategoriler: KATEGORILER }
  if (d.rol === 'soru-inceleyici') {
    const inc = await soruIncelemeleri(sb)
    return { ...temel, maddeler: maddeler.map((m) => ({ id: m.id, kategori: m.kategori, zorluk: m.zorluk, soru: m.soru, anahtarlar: m.anahtarlar, soylememeli: m.soylememeli, kaynak: m.kaynak, durum: soruDurumu(m, inc.get(m.id)) })) }
  }
  if (d.rol === 'cevaplayici') {
    const { data } = await sb.from('akks_prof_cevaplar').select('soru_id').eq('davet_id', d.id)
    const yapildi = new Set(((data || []) as { soru_id: string }[]).map((r) => r.soru_id))
    // the panel member never sees Ayşe's answer, the key points or the gold source
    return { ...temel, maddeler: maddeler.map((m) => ({ id: m.id, soru: m.soru, yapildi: yapildi.has(m.id) })) }
  }
  const { data: profData } = await sb.from('akks_prof_cevaplar').select('id, soru_id, cevap, davet_id').eq('brans', d.brans).in('soru_id', d.soru_idleri).neq('davet_id', d.id).limit(2000)
  const { data: puanData } = await sb.from('akks_kor_puanlar').select('soru_id').eq('davet_id', d.id)
  const puanlandi = new Set(((puanData || []) as { soru_id: string }[]).map((r) => r.soru_id))
  const ayse = await sonAyseCevaplari(sb, d.brans)
  const ciftler = maddeler.map((m) => {
    const p = ((profData || []) as { id: string; soru_id: string; cevap: string }[]).find((r) => r.soru_id === m.id)
    const a = ayse.get(m.id)
    if (!p || !a) return null
    const e = korEslesme(d.id, m.id)
    return { id: m.id, soru: m.soru, anahtarlar: m.anahtarlar, A: korMetni(e.A === 'ayse' ? a.cevap : p.cevap), B: korMetni(e.B === 'ayse' ? a.cevap : p.cevap), yapildi: puanlandi.has(m.id) }
  }).filter(Boolean)
  return { ...temel, ciftler }
}

export async function panelKaydet(sb: SupabaseClient, d: Davet, b: Record<string, unknown> | null): Promise<{ ok: true } | { hata: string; durum: number }> {
  const soruId = typeof b?.soruId === 'string' ? b.soruId : ''
  if (!d.soru_idleri.includes(soruId)) return { hata: 'item not in this invite', durum: 400 }
  const m = maddeBul(soruId)
  if (!m) return { hata: 'unknown item', durum: 404 }
  if (d.rol === 'soru-inceleyici') return soruIncelemeKaydet(sb, { soruId, durum: b?.durum, not: b?.not, kod: d.kod })
  if (d.rol === 'cevaplayici') {
    const cevap = typeof b?.cevap === 'string' ? b.cevap.trim() : ''
    if (cevap.length < 5 || cevap.length > 12000) return { hata: 'answer: 5–12000 characters', durum: 400 }
    const { error } = await sb.from('akks_prof_cevaplar').upsert({ davet_id: d.id, soru_id: soruId, soru_ozeti: m.ozet, brans: d.brans, kod: d.kod, cevap, sure_sn: Number.isInteger(b?.sureSn) ? Math.max(0, Math.min(86400, Number(b?.sureSn))) : null }, { onConflict: 'davet_id,soru_id' })
    return error ? { hata: 'not saved', durum: 500 } : { ok: true }
  }
  const pa = puanlariDogrula(b?.puanA), pb = puanlariDogrula(b?.puanB)
  if (!pa || !pb || typeof b?.zararliA !== 'boolean' || typeof b?.zararliB !== 'boolean' || !['A', 'B', 'esit'].includes(String(b?.tercih))) return { hata: 'all scores, harm flags and a preference are required', durum: 400 }
  const { data: profData } = await sb.from('akks_prof_cevaplar').select('id').eq('brans', d.brans).eq('soru_id', soruId).neq('davet_id', d.id).limit(1)
  const ayse = (await sonAyseCevaplari(sb, d.brans)).get(soruId)
  const prof = (profData?.[0] as { id: string } | undefined)
  if (!prof || !ayse) return { hata: 'pair not available', durum: 409 }
  const e = korEslesme(d.id, soruId)
  const { error } = await sb.from('akks_kor_puanlar').upsert({
    davet_id: d.id, soru_id: soruId, brans: d.brans, prof_cevap_id: prof.id, ayse_cevap_id: ayse.id, a_kaynak: e.A,
    puan_a: pa, puan_b: pb, zararli_a: b.zararliA, zararli_b: b.zararliB, tercih: b.tercih, not_: typeof b?.not === 'string' ? b.not.slice(0, 2000) : null,
  }, { onConflict: 'davet_id,soru_id' })
  return error ? { hata: 'not saved', durum: 500 } : { ok: true }
}

export { yuzde }
