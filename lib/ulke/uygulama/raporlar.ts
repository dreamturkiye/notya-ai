/**
 * The practice numbers of the Reports screen (Türkiye: Raporlar), counted from the signed-in doctor's own rows only.
 * PATIENT ISOLATION: service-role client, so every count carries the authenticated doctor's id; no id comes from the request.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { ulkeGunBasi } from './gun'
import { hesapSaatDilimi } from './saatDilimi'
import { ulkeTablosu } from './tablolar'

export type RaporOzeti = {
  hastaToplam: number; hastaYeniAy: number
  muayeneHafta: number; muayeneAy: number; muayeneToplam: number
  notOnayli: number; notBekleyen: number
  randevuAy: number; randevuTamam: number; randevuIptal: number
}

const GUN = 86400000

async function say(sorgu: PromiseLike<{ count: number | null; error: unknown }>): Promise<number | null> {
  const { count, error } = await sorgu
  return error || count === null ? null : count
}

/** null = a count could not be read (the screen says so instead of showing a wrong zero). */
export async function raporOzeti(supabase: SupabaseClient, doktorId: string): Promise<RaporOzeti | null> {
  const dilim = await hesapSaatDilimi(supabase, doktorId)
  const gunBasi = ulkeGunBasi(new Date(), dilim)
  const haftaBasi = new Date(gunBasi.getTime() - 6 * GUN).toISOString()
  const ayBasi = new Date(gunBasi.getTime() - 29 * GUN).toISOString()
  const t = (ad: 'ulke_hastalar' | 'ulke_muayeneler' | 'ulke_notlar' | 'ulke_randevulari') => ulkeTablosu(supabase, ad).select('id', { count: 'exact', head: true }).eq('doctor_id', doktorId)
  const r = await Promise.all([
    say(t('ulke_hastalar')),
    say(t('ulke_hastalar').gte('created_at', ayBasi)),
    say(t('ulke_muayeneler').gte('started_at', haftaBasi)),
    say(t('ulke_muayeneler').gte('started_at', ayBasi)),
    say(t('ulke_muayeneler')),
    say(t('ulke_notlar').not('approved_at', 'is', null)),
    say(t('ulke_notlar').is('approved_at', null)),
    say(t('ulke_randevulari').gte('baslangic', ayBasi)),
    say(t('ulke_randevulari').gte('baslangic', ayBasi).eq('durum', 'tamamlandi')),
    say(t('ulke_randevulari').gte('baslangic', ayBasi).in('durum', ['iptal', 'gelmedi'])),
  ])
  if (r.some((x) => x === null)) return null
  const [hastaToplam, hastaYeniAy, muayeneHafta, muayeneAy, muayeneToplam, notOnayli, notBekleyen, randevuAy, randevuTamam, randevuIptal] = r as number[]
  return { hastaToplam, hastaYeniAy, muayeneHafta, muayeneAy, muayeneToplam, notOnayli, notBekleyen, randevuAy, randevuTamam, randevuIptal }
}
