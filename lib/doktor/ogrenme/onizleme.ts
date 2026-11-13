/**
 * AYSE-OGRENME-V3 / 2 — Kural önizleme: "bu kuralla şöyle yazılırdı".
 * Örnek, doktorun KENDİ kanıt notlarından (kanit_not_idler) kaydedilmiş düzeltmeden (not_duzenlemeleri) yeniden kurulur —
 * deterministik fark (duzeltmeAnaliz), YENİ LLM ÇAĞRISI YOK, istek yoluna gecikme eklemez.
 * Doz DEĞERİ asla kural olmaz → önizlemesi de yoktur. Doktor kapsamı: yalnız kendi not_duzenlemeleri satırları.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { anahtarSlug } from '@/lib/doktor/hafiza'
import { duzeltmeAnaliz, cumlelereBol, piiTemizle } from './duzeltmeAnaliz'
import { loglardanAlanlar } from './arkaPlandaOgren'
import { deltalardanAdaylar } from './kuralTuret'

export interface DuzenlemeSatiri {
  note_id: string
  alan: string
  onceki: string
  sonraki: string
}

export interface OnizlemeCifti {
  alan: string
  /** Kuralsız taslak (AI'nın yazdığı). Boş = bu kural o cümleyi taslağa EKLER (taslakta yoktu). */
  onceki: string
  /** Kuralla yazılacak hali (doktorun onayladığı). Boş = kural bu cümleyi nottan ÇIKARIR. */
  sonraki: string
}

export interface KuralOnizlemesi {
  var: boolean
  ciftler: OnizlemeCifti[]
}

const BOS: KuralOnizlemesi = { var: false, ciftler: [] }
const EN_COK_CIFT = 2

function kelimeCumlesi(metin: string, kelime: string): string {
  const k = kelime.toLowerCase()
  const c = cumlelereBol(metin).find((x) => x.toLowerCase().includes(k))
  return piiTemizle(c || kelime)
}

/** Saf: kanıt notlarının düzenleme satırlarından en çok 2 önce/sonra çifti. */
export function kuralOnizlemesiKur(
  kural: { anahtar: string; kanit_not_idler: string[] },
  satirlar: DuzenlemeSatiri[],
): KuralOnizlemesi {
  const slug = anahtarSlug(kural.anahtar)
  if (!slug || slug.startsWith('doz-degeri') || slug.startsWith('klinik-')) return BOS
  const izinli = new Set(kural.kanit_not_idler)
  const notlar = new Map<string, DuzenlemeSatiri[]>()
  for (const s of satirlar) {
    if (!izinli.has(s.note_id)) continue
    if (!notlar.has(s.note_id)) notlar.set(s.note_id, [])
    notlar.get(s.note_id)!.push(s)
  }
  const ciftler: OnizlemeCifti[] = []
  for (const [noteId, loglar] of notlar) {
    if (ciftler.length >= EN_COK_CIFT) break
    const { taslak, son } = loglardanAlanlar(loglar)
    const deltolar = duzeltmeAnaliz(taslak, son).filter((d) => d.tur !== 'doz_degeri')
    for (const d of deltolar) {
      const aday = deltalardanAdaylar([d], noteId)[0]
      if (!aday || aday.anahtarSlug !== slug) continue
      let onceki = d.onceki
      let sonraki = d.sonraki
      if (d.tur === 'terim' && d.terimOnceki && d.terimSonraki) {
        const ham = loglar.find((l) => l.onceki.toLowerCase().includes(d.terimOnceki!.toLowerCase())) || loglar[0]
        onceki = kelimeCumlesi(ham.onceki, d.terimOnceki)
        sonraki = kelimeCumlesi(ham.sonraki, d.terimSonraki)
      }
      if (!onceki && !sonraki) continue
      ciftler.push({ alan: d.alan, onceki, sonraki })
      break
    }
  }
  return { var: ciftler.length > 0, ciftler }
}

/** Kanıt not satırlarını doktorun kendi kaydından okur (doctor_id + note_id ikisi de zorunlu). */
export async function kuralOnizlemesiYukle(
  sb: SupabaseClient,
  doctorId: string,
  anahtar: string,
): Promise<KuralOnizlemesi> {
  const slug = anahtarSlug(anahtar)
  if (!slug) return BOS
  const { data: kural } = await sb
    .from('doktor_hafiza')
    .select('anahtar, kanit_not_idler')
    .eq('doctor_id', doctorId)
    .eq('anahtar', slug)
    .maybeSingle()
  const idler = Array.isArray(kural?.kanit_not_idler) ? (kural!.kanit_not_idler as unknown[]).map(String).slice(-12) : []
  if (!idler.length) return BOS
  const { data } = await sb
    .from('not_duzenlemeleri')
    .select('note_id, alan, onceki, sonraki')
    .eq('doctor_id', doctorId)
    .in('note_id', idler)
    .limit(120)
  return kuralOnizlemesiKur({ anahtar: slug, kanit_not_idler: idler }, (data || []) as DuzenlemeSatiri[])
}
