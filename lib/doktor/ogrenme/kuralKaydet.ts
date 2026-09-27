/**
 * NOTYA-MESLEKTAS-V2 — doktor_hafiza'ya düzeltme kuralı yazar.
 * Kapalı kurala dokunulmaz. Aynı nota ikinci kez bakılmaz.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { HafizaKategori } from '@/lib/doktor/hafiza'
import { deltalardanAdaylar, kuraliBirlesitir, type HafizaKuralSatiri, type KuralDurum } from './kuralTuret'
import type { DuzeltmeDelta } from './duzeltmeAnaliz'

export async function duzeltmeKurallariniKaydet(
  sb: SupabaseClient,
  doctorId: string,
  deltolar: DuzeltmeDelta[],
  noteId: string,
): Promise<number> {
  const adaylar = deltalardanAdaylar(deltolar, noteId)
  let n = 0
  for (const aday of adaylar) {
    const { data } = await sb
      .from('doktor_hafiza')
      .select('anahtar, kategori, deger, kaynak, kanit_sayisi, durum, ornekler, kanit_not_idler, aktif')
      .eq('doctor_id', doctorId)
      .eq('anahtar', aday.anahtarSlug)
      .maybeSingle()
    const mevcut = data ? satirCoz(data) : null
    const birlesik = kuraliBirlesitir(mevcut, aday)
    if (!birlesik || (mevcut && birlesik.kanit_sayisi === mevcut.kanit_sayisi && birlesik.durum === mevcut.durum)) continue
    const simdi = new Date().toISOString()
    const { error } = await sb.from('doktor_hafiza').upsert({
      doctor_id: doctorId,
      kategori: birlesik.kategori as HafizaKategori,
      anahtar: birlesik.anahtar,
      deger: birlesik.deger,
      kaynak: 'duzeltme',
      kanit_sayisi: birlesik.kanit_sayisi,
      kesin: birlesik.durum === 'uygulanir',
      aktif: birlesik.durum !== 'kapali',
      durum: birlesik.durum,
      ornekler: birlesik.ornekler,
      kanit_not_idler: birlesik.kanit_not_idler,
      son_gorulme: simdi,
      updated_at: simdi,
    }, { onConflict: 'doctor_id,kategori,anahtar' })
    if (!error) n++
  }
  return n
}

function satirCoz(r: Record<string, unknown>): HafizaKuralSatiri {
  const ornekler = Array.isArray(r.ornekler) ? r.ornekler.map(String) : []
  const idler = Array.isArray(r.kanit_not_idler) ? r.kanit_not_idler.map(String) : []
  const durum = (['aday', 'uygulanir', 'kapali'] as const).includes(r.durum as KuralDurum)
    ? (r.durum as KuralDurum)
    : r.aktif === false ? 'kapali' : r.kesin ? 'uygulanir' : 'aday'
  return {
    anahtar: String(r.anahtar || ''),
    kategori: (r.kategori === 'klinik' || r.kategori === 'uygulama' ? r.kategori : 'uslup'),
    deger: String(r.deger || ''),
    kaynak: 'duzeltme',
    kanit_sayisi: Number(r.kanit_sayisi || 0),
    durum,
    ornekler,
    kanit_not_idler: idler,
    aktif: r.aktif !== false,
  }
}

export async function uygulanirKurallariYukle(
  sb: SupabaseClient,
  doctorId: string,
  limit = 12,
): Promise<{ slug: string; satir: string }[]> {
  const { data } = await sb
    .from('doktor_hafiza')
    .select('anahtar, deger, kanit_sayisi, durum, aktif, kategori')
    .eq('doctor_id', doctorId)
    .eq('aktif', true)
    .eq('kaynak', 'duzeltme')
    .eq('durum', 'uygulanir')
    .in('kategori', ['uslup', 'klinik', 'uygulama'])
    .order('kanit_sayisi', { ascending: false })
    .limit(40)
  const satirlar = (data || []) as { anahtar: string; deger: string; kanit_sayisi: number; durum?: string; aktif?: boolean }[]
  return satirlar
    .filter((k) => k.durum !== 'kapali' && k.aktif !== false)
    .slice(0, limit)
    .map((k) => ({ slug: k.anahtar, satir: k.deger }))
}

export async function kuralMetinleriniCoz(
  sb: SupabaseClient,
  doctorId: string,
  slugs: string[],
): Promise<{ slug: string; deger: string }[]> {
  const temiz = [...new Set(slugs.map((s) => String(s || '').trim()).filter(Boolean))].slice(0, 12)
  if (!temiz.length) return []
  const { data } = await sb
    .from('doktor_hafiza')
    .select('anahtar, deger')
    .eq('doctor_id', doctorId)
    .in('anahtar', temiz)
  const map = new Map((data || []).map((r) => [String((r as { anahtar: string }).anahtar), String((r as { deger: string }).deger)]))
  return temiz.map((slug) => ({ slug, deger: map.get(slug) || slug }))
}

export async function kuralKapat(
  sb: SupabaseClient,
  doctorId: string,
  anahtar: string,
): Promise<void> {
  const simdi = new Date().toISOString()
  await sb.from('doktor_hafiza')
    .update({ durum: 'kapali', aktif: false, kesin: false, updated_at: simdi })
    .eq('doctor_id', doctorId)
    .eq('anahtar', anahtar)
  await sb.from('doktor_hafiza').upsert({
    doctor_id: doctorId,
    kategori: 'uslup',
    anahtar: `kapali-${anahtar}`.slice(0, 60),
    deger: `Bu kuralı uygulama: ${anahtar}`,
    kaynak: 'doktor_soyledi',
    kanit_sayisi: 1,
    kesin: true,
    aktif: true,
    durum: 'aday',
    son_gorulme: simdi,
    updated_at: simdi,
  }, { onConflict: 'doctor_id,kategori,anahtar' })
}
