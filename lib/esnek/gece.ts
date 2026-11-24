/**
 * ESNEK-MUAYENE-B2 — gece öğrenme turu (overnight learning loop), per doctor, run by app/api/cron/esnek-gece (cronYetki).
 *
 *  1. The day's corrections → candidates: shadow-mode differences (abbreviations, the secretary's format), Doğrula answers
 *     that expanded a short form, and phrasing rules the existing correction learning just promoted.
 *  2. Each candidate is regression-tested against THIS doctor's past approved notes (core/esnek/regresyon.ts): anything
 *     that changes a never-learned token or contradicts a past approved note is not activated (an existing rule that does
 *     is sent back to "aday").
 *  3. Activation writes exactly one row (his lexicon / his style rule) and records it, so "Geri al" undoes exactly that.
 * NEVER learned: right/left, doses, numbers, allergies, negation, patient identity (refused at creation AND re-checked here).
 * A candidate the doctor reverted is never re-learned. HASTA-IZOLASYON: every read and write by doctor_id; patient names
 * are read (doctor-scoped) only to refuse a candidate that carries one.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { arsivsizNotlar } from '@/lib/doktor/arsiv'
import { golgedenSozlukAdaylari, golgedenBicimAdaylari, dogrulamadanAdaylar, korumaliAdayMi, bicimKurali, type Aday, type Oneri } from '@/core/esnek/aday'
import { adayiSina, aktiflesirMi, type GecmisNot } from '@/core/esnek/regresyon'
import { notlariKarsilastir } from '@/core/esnek/olgu'
import { ESNEK_TR } from '@/core/esnek/metinTr'
import { genisletici, hastaAdParcalari, sozlukParcalari } from './sunucu'
import { taslakMetni } from './golge'

export type GeceSonucu = { aday: number; sinanan: number; aktif: number; kirdi: number; geriDonen: number }

const NOT_ALAN = { subjektif: 'content_subjektif', objektif: 'content_objektif', degerlendirme: 'content_degerlendirme', plan: 'content_plan', basvuruYakinmasi: 'basvuru_yakinmasi' } as const

/** The doctor's last approved notes (+ the hand-note / typed sources they were built from) — the regression set. */
export async function gecmisNotlar(sb: SupabaseClient, doktorId: string, adet = 60): Promise<GecmisNot[]> {
  const { data } = await arsivsizNotlar(sb, `id, ${Object.values(NOT_ALAN).join(', ')}`).eq('doctor_id', doktorId).not('approved_at', 'is', null).order('created_at', { ascending: false }).limit(adet)
  const notlar = (data || []) as Record<string, unknown>[]
  if (!notlar.length) return []
  const { data: k } = await sb.from('muayene_kaynaklari').select('note_id, metin').eq('doctor_id', doktorId).in('note_id', notlar.map((n) => String(n.id))).in('tur', ['el_notu', 'sekreter_yukleme', 'yazili_not']).limit(500)
  const kaynak = new Map<string, string>()
  for (const r of k || []) kaynak.set(String(r.note_id), [kaynak.get(String(r.note_id)), r.metin].filter(Boolean).join('\n'))
  return notlar.map((n) => ({ id: String(n.id), alanlar: Object.fromEntries(Object.entries(NOT_ALAN).map(([a, c]) => [a, (n[c] as string) || ''])), kaynakMetni: kaynak.get(String(n.id)) || null }))
}

/** Candidate rows: merge evidence (an evidence id counts once), never touch a candidate the doctor reverted. */
async function adaylariBirlestir(sb: SupabaseClient, doktorId: string, adaylar: Aday[]): Promise<number> {
  let n = 0
  for (const a of adaylar) {
    const { data: v } = await sb.from('esnek_ogrenme_adaylari').select('id, kanit_sayisi, kanit_idler, durum').eq('doctor_id', doktorId).eq('tur', a.tur).eq('anahtar', a.anahtar).maybeSingle()
    const simdi = new Date().toISOString()
    if (!v) {
      const { error } = await sb.from('esnek_ogrenme_adaylari').insert({ doctor_id: doktorId, tur: a.tur, anahtar: a.anahtar, oneri: a.oneri, kaynak: a.kaynak, kanit_sayisi: 1, kanit_idler: [a.kanit], durum: 'aday' })
      if (!error) n++
      continue
    }
    if (v.durum === 'geri_alindi' || (v.kanit_idler as string[] || []).includes(a.kanit)) continue
    const yeniDurum = v.durum === 'kirdi' || v.durum === 'celiski' ? 'aday' : v.durum
    await sb.from('esnek_ogrenme_adaylari').update({ kanit_sayisi: Number(v.kanit_sayisi || 0) + 1, kanit_idler: [...((v.kanit_idler as string[]) || []), a.kanit].slice(-20), durum: yeniDurum, updated_at: simdi }).eq('id', v.id).eq('doctor_id', doktorId)
    n++
  }
  return n
}

/** 1a. shadow-mode differences not yet learned from. */
async function golgeAdaylari(sb: SupabaseClient, doktorId: string): Promise<{ adaylar: Aday[]; idler: string[] }> {
  const { data } = await sb.from('golge_karsilastirmalari').select('id, patient_id, sekreter_metni, notya_taslak').eq('doctor_id', doktorId).eq('durum', 'karsilastirildi').eq('ogrenildi', false).limit(200)
  const satirlar = (data || []) as { id: string; patient_id: string; sekreter_metni: string; notya_taslak: Record<string, string> | null }[]
  if (!satirlar.length) return { adaylar: [], idler: [] }
  const [genislet, parcalar, adlar] = await Promise.all([genisletici(sb, doktorId), sozlukParcalari(sb, doktorId), hastaAdParcalari(sb, doktorId, satirlar.map((s) => s.patient_id))])
  const { sozlukKur, coz } = await import('@/core/elNotu/sozluk')
  const s = sozlukKur(parcalar.hekim, parcalar.brans, parcalar.genel)
  const bilinen = (t: string) => coz(s, t) !== null
  const adaylar: Aday[] = []
  for (const r of satirlar) {
    const k = notlariKarsilastir(taslakMetni(r.notya_taslak), r.sekreter_metni, genislet)
    adaylar.push(...golgedenSozlukAdaylari(k, bilinen, String(r.id), adlar), ...golgedenBicimAdaylari(r.sekreter_metni, String(r.id), adlar))
  }
  return { adaylar, idler: satirlar.map((r) => String(r.id)) }
}

/** 1b. Doğrula answers of the last 36 hours. */
async function dogrulaAdaylari(sb: SupabaseClient, doktorId: string): Promise<Aday[]> {
  const kesim = new Date(Date.now() - 36 * 3600000).toISOString()
  const { data } = await sb.from('okuma_dogrulamalari').select('id, okunan, cevap, sinif, patient_id').eq('doctor_id', doktorId).eq('durum', 'cevaplandi').eq('sinif', 'kelime').gte('cevap_at', kesim).limit(500)
  const satirlar = (data || []) as { id: string; okunan: string | null; cevap: string | null; sinif: string; patient_id: string | null }[]
  if (!satirlar.length) return []
  const adlar = await hastaAdParcalari(sb, doktorId, satirlar.map((r) => String(r.patient_id || '')))
  return dogrulamadanAdaylar(satirlar).filter((a) => !korumaliAdayMi(a.oneri, adlar))
}

/** 1c. phrasing rules the existing correction learning promoted in the last 48 hours → re-tested tonight. */
async function kuralAdaylari(sb: SupabaseClient, doktorId: string): Promise<{ oneri: Oneri; kanit: number; notlar: string[] }[]> {
  const kesim = new Date(Date.now() - 48 * 3600000).toISOString()
  const { data } = await sb.from('doktor_hafiza').select('anahtar, deger, kanit_sayisi, kanit_not_idler').eq('doctor_id', doktorId).eq('kaynak', 'duzeltme').eq('durum', 'uygulanir').eq('aktif', true).gte('updated_at', kesim).limit(100)
  return ((data || []) as { anahtar: string; deger: string; kanit_sayisi: number; kanit_not_idler: string[] | null }[])
    .filter((r) => !String(r.anahtar).startsWith('gece-'))
    .map((r) => ({ oneri: { tur: 'kural', anahtar: String(r.anahtar), deger: String(r.deger) } as Oneri, kanit: Number(r.kanit_sayisi) || 0, notlar: (r.kanit_not_idler || []).map(String) }))
}

/** Activation: exactly one row, recorded for the one-tap undo. */
async function aktiflestir(sb: SupabaseClient, doktorId: string, o: Oneri, brans: string | null): Promise<{ uygulama: Record<string, unknown> | null; durum: 'aktif' | 'celiski' }> {
  if (o.tur === 'sozluk') {
    const { anahtar } = await import('@/core/elNotu/sozluk')
    const anah = anahtar(o.kisaltma).slice(0, 24)
    const { data: v } = await sb.from('hekim_el_sozlugu').select('id, anlam').eq('doctor_id', doktorId).eq('kisaltma_anahtar', anah).maybeSingle()
    if (v) return String(v.anlam).toLocaleLowerCase('tr') === o.anlam.toLocaleLowerCase('tr') ? { uygulama: { zaten: true }, durum: 'aktif' } : { uygulama: null, durum: 'celiski' }
    const { data, error } = await sb.from('hekim_el_sozlugu').insert({ doctor_id: doktorId, kisaltma: o.kisaltma.slice(0, 24), kisaltma_anahtar: anah, anlam: o.anlam.slice(0, 80), kaynak: 'gece', brans }).select('id').single()
    return error || !data ? { uygulama: null, durum: 'celiski' } : { uygulama: { tablo: 'hekim_el_sozlugu', id: String(data.id) }, durum: 'aktif' }
  }
  if (o.tur === 'bicim') {
    const k = bicimKurali(o, ESNEK_TR.ogrenme)
    const simdi = new Date().toISOString()
    const { error } = await sb.from('doktor_hafiza').upsert({ doctor_id: doktorId, kategori: 'uslup', anahtar: k.anahtar, deger: k.deger, kaynak: 'duzeltme', kanit_sayisi: 2, kesin: true, aktif: true, durum: 'uygulanir', son_gorulme: simdi, updated_at: simdi }, { onConflict: 'doctor_id,kategori,anahtar' })
    return error ? { uygulama: null, durum: 'celiski' } : { uygulama: { tablo: 'doktor_hafiza', anahtar: k.anahtar, gece: true }, durum: 'aktif' }
  }
  return { uygulama: { tablo: 'doktor_hafiza', anahtar: o.anahtar, gece: false }, durum: 'aktif' }
}

export async function geceTuru(sb: SupabaseClient, doktorId: string): Promise<GeceSonucu> {
  const sonuc: GeceSonucu = { aday: 0, sinanan: 0, aktif: 0, kirdi: 0, geriDonen: 0 }
  // 1. collect
  const [golge, dogrula, kurallar] = await Promise.all([golgeAdaylari(sb, doktorId), dogrulaAdaylari(sb, doktorId), kuralAdaylari(sb, doktorId)])
  sonuc.aday += await adaylariBirlestir(sb, doktorId, [...golge.adaylar, ...dogrula])
  if (golge.idler.length) await sb.from('golge_karsilastirmalari').update({ ogrenildi: true }).eq('doctor_id', doktorId).in('id', golge.idler)
  for (const k of kurallar) {
    const anahtar = `kural:${(k.oneri as { anahtar: string }).anahtar}`.slice(0, 120)
    const { data: v } = await sb.from('esnek_ogrenme_adaylari').select('id, kanit_sayisi, durum').eq('doctor_id', doktorId).eq('tur', 'kural').eq('anahtar', anahtar).maybeSingle()
    if (v && Number(v.kanit_sayisi) === k.kanit && v.durum !== 'aday') continue // already tested with this evidence
    if (v) await sb.from('esnek_ogrenme_adaylari').update({ oneri: k.oneri, kanit_sayisi: k.kanit, kanit_idler: k.notlar.slice(-20), durum: 'aday', updated_at: new Date().toISOString() }).eq('id', v.id).eq('doctor_id', doktorId)
    else await sb.from('esnek_ogrenme_adaylari').insert({ doctor_id: doktorId, tur: 'kural', anahtar, oneri: k.oneri, kaynak: 'duzeltme', kanit_sayisi: k.kanit, kanit_idler: k.notlar.slice(-20), durum: 'aday' })
  }
  // 2. test every open candidate
  const { data: acik } = await sb.from('esnek_ogrenme_adaylari').select('id, tur, oneri, kanit_sayisi, kanit_idler').eq('doctor_id', doktorId).eq('durum', 'aday').limit(200)
  const liste = (acik || []) as { id: string; tur: string; oneri: Oneri; kanit_sayisi: number; kanit_idler: string[] }[]
  if (!liste.length) return sonuc
  const [notlar, parcalar] = await Promise.all([gecmisNotlar(sb, doktorId), sozlukParcalari(sb, doktorId)])
  const baglam = { hekimSozlugu: parcalar.hekim, bransTohum: parcalar.brans, genelTohum: parcalar.genel }
  for (const a of liste) {
    const simdi = new Date().toISOString()
    // the never-learned guard again (a row stored by an older build, or tampered with)
    if (a.tur !== 'kural' && korumaliAdayMi(a.oneri)) {
      await sb.from('esnek_ogrenme_adaylari').update({ durum: 'kirdi', regresyon: { neden: 'korumali' }, son_deneme_at: simdi, updated_at: simdi }).eq('id', a.id).eq('doctor_id', doktorId)
      sonuc.kirdi++; continue
    }
    const r = adayiSina(a.oneri, notlar, a.tur === 'kural' ? a.kanit_idler : [], baglam)
    sonuc.sinanan++
    if (a.tur === 'kural') {
      if (r.gecti) {
        await sb.from('esnek_ogrenme_adaylari').update({ durum: 'aktif', regresyon: r, uygulama: { tablo: 'doktor_hafiza', anahtar: (a.oneri as { anahtar: string }).anahtar, gece: false }, aktif_at: simdi, son_deneme_at: simdi, updated_at: simdi }).eq('id', a.id).eq('doctor_id', doktorId)
        sonuc.aktif++
      } else {
        // the existing learning promoted it, but it breaks a past approved note → back to "aday" (not applied)
        await sb.from('doktor_hafiza').update({ durum: 'aday', kesin: false, updated_at: simdi }).eq('doctor_id', doktorId).eq('anahtar', (a.oneri as { anahtar: string }).anahtar).eq('kaynak', 'duzeltme')
        await sb.from('esnek_ogrenme_adaylari').update({ durum: 'kirdi', regresyon: r, son_deneme_at: simdi, updated_at: simdi }).eq('id', a.id).eq('doctor_id', doktorId)
        sonuc.geriDonen++
      }
      continue
    }
    if (r.neden === 'celiski') { await sb.from('esnek_ogrenme_adaylari').update({ durum: 'celiski', regresyon: r, son_deneme_at: simdi, updated_at: simdi }).eq('id', a.id).eq('doctor_id', doktorId); sonuc.kirdi++; continue }
    if (!r.gecti) { await sb.from('esnek_ogrenme_adaylari').update({ durum: 'kirdi', regresyon: r, son_deneme_at: simdi, updated_at: simdi }).eq('id', a.id).eq('doctor_id', doktorId); sonuc.kirdi++; continue }
    if (!aktiflesirMi(Number(a.kanit_sayisi) || 0, r)) { await sb.from('esnek_ogrenme_adaylari').update({ regresyon: r, son_deneme_at: simdi, updated_at: simdi }).eq('id', a.id).eq('doctor_id', doktorId); continue }
    const ak = await aktiflestir(sb, doktorId, a.oneri, parcalar.bransAnahtari)
    const gorunur = ak.durum === 'aktif' && !(ak.uygulama as { zaten?: boolean } | null)?.zaten
    await sb.from('esnek_ogrenme_adaylari').update({ durum: ak.durum, regresyon: r, uygulama: ak.uygulama, aktif_at: gorunur ? simdi : null, son_deneme_at: simdi, updated_at: simdi }).eq('id', a.id).eq('doctor_id', doktorId)
    if (gorunur) sonuc.aktif++
  }
  return sonuc
}

/** "Bu hafta öğrendiklerim" — at most 3 items activated in the last 7 days, most evidence first. */
export async function haftalikOgrenilenler(sb: SupabaseClient, doktorId: string): Promise<{ id: string; tur: string; oneri: Oneri; aktifAt: string }[]> {
  const kesim = new Date(Date.now() - 7 * 86400000).toISOString()
  const { data } = await sb.from('esnek_ogrenme_adaylari').select('id, tur, oneri, aktif_at, kanit_sayisi').eq('doctor_id', doktorId).eq('durum', 'aktif').not('aktif_at', 'is', null).gte('aktif_at', kesim).order('kanit_sayisi', { ascending: false }).limit(3)
  return ((data || []) as { id: string; tur: string; oneri: Oneri; aktif_at: string }[]).map((r) => ({ id: String(r.id), tur: r.tur, oneri: r.oneri, aktifAt: r.aktif_at }))
}

/**
 * ESNEK-GELISIM — handwriting learned this week, for "Bu hafta öğrendiklerim": distinct words he confirmed in the last 7
 * days that his handwriting memory did not hold before (protected readings — sides, numbers, doses — are not counted:
 * they are always read fresh), and abbreviations he taught through Doğrula or entered himself. Counts only, doctor_id only.
 */
export async function haftalikElYazisi(sb: SupabaseClient, doktorId: string, simdi = new Date()): Promise<{ kelime: number; kisaltma: number }> {
  const kesim = new Date(simdi.getTime() - 7 * 86400000).toISOString()
  const [{ data: yeni }, { data: eski }, { data: soz }] = await Promise.all([
    sb.from('hekim_el_yazisi_hafizasi').select('metin').eq('doctor_id', doktorId).eq('korumali', false).gte('created_at', kesim).limit(2000),
    sb.from('hekim_el_yazisi_hafizasi').select('metin').eq('doctor_id', doktorId).lt('created_at', kesim).order('created_at', { ascending: false }).limit(3000),
    sb.from('hekim_el_sozlugu').select('kisaltma_anahtar').eq('doctor_id', doktorId).in('kaynak', ['dogrulama', 'elle']).gte('created_at', kesim).limit(500),
  ])
  const { katla, kelimeler } = await import('@/core/esnek/metinAraclari')
  const sozcukler = (rows: unknown) => ((rows || []) as { metin: string }[]).flatMap((r) => kelimeler(String(r.metin || ''))).map(katla).filter((w) => w.length >= 2 && !/\d/.test(w))
  const once = new Set(sozcukler(eski))
  return { kelime: new Set(sozcukler(yeni).filter((w) => !once.has(w))).size, kisaltma: new Set(((soz || []) as { kisaltma_anahtar: string }[]).map((r) => r.kisaltma_anahtar)).size }
}

/** One-tap undo: exactly what activation wrote. A reverted candidate is never re-learned. */
export async function ogrenileniGeriAl(sb: SupabaseClient, doktorId: string, id: unknown): Promise<boolean> {
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) return false
  const { data: a } = await sb.from('esnek_ogrenme_adaylari').select('id, durum, uygulama').eq('id', id).eq('doctor_id', doktorId).maybeSingle()
  if (!a || a.durum !== 'aktif') return false
  const u = (a.uygulama || {}) as { tablo?: string; id?: string; anahtar?: string; gece?: boolean }
  if (u.tablo === 'hekim_el_sozlugu' && u.id) await sb.from('hekim_el_sozlugu').delete().eq('id', u.id).eq('doctor_id', doktorId).eq('kaynak', 'gece')
  else if (u.tablo === 'doktor_hafiza' && u.anahtar) {
    if (u.gece) await sb.from('doktor_hafiza').update({ durum: 'kapali', aktif: false, kesin: false, updated_at: new Date().toISOString() }).eq('doctor_id', doktorId).eq('anahtar', u.anahtar)
    else { const { kuralKapat } = await import('@/lib/doktor/ogrenme/kuralKaydet'); await kuralKapat(sb, doktorId, u.anahtar) }
  }
  const simdi = new Date().toISOString()
  const { error } = await sb.from('esnek_ogrenme_adaylari').update({ durum: 'geri_alindi', geri_alindi_at: simdi, updated_at: simdi }).eq('id', id).eq('doctor_id', doktorId)
  return !error
}

/** Doctors with something to learn from tonight (shadow rows, Doğrula answers, freshly promoted rules). */
export async function geceDoktorlari(sb: SupabaseClient): Promise<string[]> {
  const k36 = new Date(Date.now() - 36 * 3600000).toISOString(), k48 = new Date(Date.now() - 48 * 3600000).toISOString()
  const [a, b, c, d] = await Promise.all([
    sb.from('golge_karsilastirmalari').select('doctor_id').eq('ogrenildi', false).eq('durum', 'karsilastirildi').limit(2000),
    sb.from('okuma_dogrulamalari').select('doctor_id').eq('durum', 'cevaplandi').gte('cevap_at', k36).limit(2000),
    sb.from('doktor_hafiza').select('doctor_id').eq('kaynak', 'duzeltme').eq('durum', 'uygulanir').gte('updated_at', k48).limit(2000),
    sb.from('esnek_ogrenme_adaylari').select('doctor_id').eq('durum', 'aday').limit(2000),
  ])
  return [...new Set([a, b, c, d].flatMap((r) => (r.data || []).map((x) => String((x as { doctor_id: string }).doctor_id))))]
}
