/**
 * NOTYA-RAPORLAR-01 — doktorun kendi satırlarından kilitli raporu derler.
 * Her sorgu doctor_id ile kısıtlıdır. Arşivli muayene ve onun notu dışarıdadır.
 * Hasta adı, telefon ve kimlik seçilmez.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { bransDegistirebilir } from '@/lib/auth/superuserBranslar'
import { arsivsizNotlar, arsivsizSeanslar } from '@/lib/doktor/arsiv'
import { BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari'
import {
  aralikHesapla,
  aralikSiniri,
  gecerliAralik,
  raporPencereleri,
  type NotSatiri,
  type RaporAralik,
  type SeansSatiri,
} from '@/lib/doktor/raporHesap'

type Ist = SupabaseClient

export interface RaporHacim {
  yeniBuAy: number
  yeniGecenAy: number
  yeniSon3Ay: number
  yeniOnceki3Ay: number
  aktifHasta: number
  muayeneBuHafta: number
  muayeneGecenHafta: number
  muayeneBuAy: number
  muayeneGecenAy: number
  muayeneToplam: number
}

async function say(q: PromiseLike<{ count: number | null; error: { message: string } | null }>): Promise<number> {
  const { count, error } = await q
  if (error) throw new Error(error.message)
  return count || 0
}

async function tumu<T>(sayfa: (bas: number, son: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const boy = 1000
  const out: T[] = []
  for (let i = 0; i < 30; i++) {
    const { data, error } = await sayfa(i * boy, i * boy + boy - 1)
    if (error) throw new Error(error.message)
    const rows = data || []
    out.push(...rows)
    if (rows.length < boy) break
  }
  return out
}

function bransAdi(anahtar: string | null): string {
  if (!anahtar) return 'Belirtilmemiş'
  return (BRANS_ETIKETLERI as Record<string, string>)[anahtar] || anahtar
}

export async function raporDerle(sb: Ist, doctorId: string, aralikHam: string | null, simdi = new Date(), ozet = false) {
  const aralik: RaporAralik = gecerliAralik(aralikHam)
  const pencere = raporPencereleri(simdi)
  const sinir = aralikSiniri(aralik, simdi)

  const seansSay = (bas?: string, son?: string) => {
    let q = arsivsizSeanslar(sb, 'id', { count: 'exact', head: true }).eq('doctor_id', doctorId)
    if (bas) q = q.gte('started_at', bas)
    if (son) q = q.lt('started_at', son)
    return say(q)
  }
  const hastaSay = (bas?: string, son?: string, yalnizAktif = false) => {
    let q = sb.from('patients').select('id', { count: 'exact', head: true }).eq('doctor_id', doctorId)
    if (yalnizAktif) q = q.eq('is_active', true)
    if (bas) q = q.gte('created_at', bas)
    if (son) q = q.lt('created_at', son)
    return say(q)
  }

  const [
    yeniBuAy, yeniGecenAy, yeniSon3Ay, yeniOnceki3Ay, aktifHasta,
    muayeneBuHafta, muayeneGecenHafta, muayeneBuAy, muayeneGecenAy, muayeneToplam,
    bugunkuMuayene, bekleyenOnay, tamamlananNot,
  ] = await Promise.all([
    hastaSay(pencere.ay.bas, pencere.ay.son),
    hastaSay(pencere.gecenAy.bas, pencere.gecenAy.son),
    hastaSay(pencere.ucAy.bas, pencere.ucAy.son),
    hastaSay(pencere.oncekiUcAy.bas, pencere.oncekiUcAy.son),
    hastaSay(undefined, undefined, true),
    seansSay(pencere.hafta.bas, pencere.hafta.son),
    seansSay(pencere.gecenHafta.bas, pencere.gecenHafta.son),
    seansSay(pencere.ay.bas, pencere.ay.son),
    seansSay(pencere.gecenAy.bas, pencere.gecenAy.son),
    seansSay(),
    seansSay(pencere.bugun.bas, pencere.bugun.son),
    say(arsivsizNotlar(sb, 'id', { count: 'exact', head: true }).eq('doctor_id', doctorId).is('approved_at', null)),
    say(arsivsizNotlar(sb, 'id', { count: 'exact', head: true }).eq('doctor_id', doctorId).not('approved_at', 'is', null).gte('created_at', pencere.ay.bas).lt('created_at', pencere.ay.son)),
  ])

  const [seanslar, notlar] = ozet
    ? [[], []] as [SeansSatiri[], NotSatiri[]]
    : await Promise.all([
      tumu<SeansSatiri>((a, b) => arsivsizSeanslar(sb, 'started_at, session_type, duration_seconds, specialty')
        .eq('doctor_id', doctorId).gte('started_at', sinir.bas).lt('started_at', sinir.son).order('started_at', { ascending: true }).range(a, b)),
      tumu<NotSatiri>((a, b) => arsivsizNotlar(sb, 'created_at, note_type, approved_at, basvuru_yakinmasi, icd10_codes, content_ilaclar')
        .eq('doctor_id', doctorId).gte('created_at', sinir.bas).lt('created_at', sinir.son).order('created_at', { ascending: true }).range(a, b)),
    ])

  const hacim: RaporHacim = {
    yeniBuAy, yeniGecenAy, yeniSon3Ay, yeniOnceki3Ay, aktifHasta,
    muayeneBuHafta, muayeneGecenHafta, muayeneBuAy, muayeneGecenAy, muayeneToplam,
  }
  const hesap = aralikHesapla(aralik, simdi, seanslar, notlar, bransDegistirebilir(doctorId), bransAdi)

  return {
    ...hesap,
    hacim,
    // Kontrol paneli ve arşiv testi bu alanları okur. Aralık çipi bunları değiştirmez.
    buAyMuayene: muayeneBuAy,
    buAyToplam: muayeneBuAy,
    bugunkuMuayene,
    toplamMuayene: muayeneToplam,
    aktifHasta,
    bekleyenOnay,
    tamamlananNot,
  }
}
