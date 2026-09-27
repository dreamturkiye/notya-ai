/**
 * NOTYA-MESLEKTAS-V2 Faz 2 — kullanım olaylarından rutin (LLM yok).
 * rutinHesapla (seans saatleri) durur; bu paket onu genişletir.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { rutinHesapla } from '@/lib/doktor/hafiza'
export const SONRAKI_ESIK_P = 0.6
export const SONRAKI_ESIK_N = 8

export interface RutinGecis {
  from: string
  to: string
  n: number
  p: number
}

export interface RutinPaket {
  tipikBaslangicSaati?: string
  tipikBitisSaati?: string
  tipikOturumDk?: number
  gunBasinaOrtHasta?: number
  gecisler: RutinGecis[]
  kartSirasi: 'hastalar' | 'randevular' | null
  cihaz?: string
  hesaplandi?: string
}

export interface HamOlay {
  sayfa_tipi: string
  eylem: string
  onceki: string | null
  sure_ms: number | null
  cihaz?: string | null
  zaman?: string
}

export function rutinTuret(olaylar: HamOlay[], seansRutin: Record<string, unknown> = {}): RutinPaket {
  const gecisSay = new Map<string, Map<string, number>>()
  const sureler: number[] = []
  const cihazSay = new Map<string, number>()

  for (const o of olaylar) {
    const from = String(o.onceki || '').trim()
    const to = o.eylem && o.eylem !== 'sayfa_ac' ? o.eylem : String(o.sayfa_tipi || '').trim()
    if (from && to && from !== to) {
      if (!gecisSay.has(from)) gecisSay.set(from, new Map())
      const m = gecisSay.get(from)!
      m.set(to, (m.get(to) || 0) + 1)
    }
    if (o.sure_ms && o.sure_ms > 0 && o.sure_ms < 4 * 3600_000) sureler.push(o.sure_ms)
    if (o.cihaz) cihazSay.set(o.cihaz, (cihazSay.get(o.cihaz) || 0) + 1)
  }

  const gecisler: RutinGecis[] = []
  for (const [from, m] of gecisSay) {
    const toplam = [...m.values()].reduce((a, b) => a + b, 0)
    for (const [to, n] of m) {
      gecisler.push({ from, to, n, p: toplam ? n / toplam : 0 })
    }
  }
  gecisler.sort((a, b) => b.n - a.n)

  const ana = gecisSay.get('ana')
  let kartSirasi: RutinPaket['kartSirasi'] = null
  if (ana) {
    const h = ana.get('hastalar') || 0
    const r = ana.get('randevular') || 0
    if (h + r >= 4) kartSirasi = h > r ? 'hastalar' : 'randevular'
  }

  const ortSure = sureler.length ? sureler.reduce((a, b) => a + b, 0) / sureler.length : 0
  const cihaz = [...cihazSay.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]

  return {
    tipikBaslangicSaati: typeof seansRutin.tipikBaslangicSaati === 'string' ? seansRutin.tipikBaslangicSaati : undefined,
    tipikBitisSaati: typeof seansRutin.tipikBitisSaati === 'string' ? seansRutin.tipikBitisSaati : undefined,
    tipikOturumDk: ortSure ? Math.round(ortSure / 60000) : undefined,
    gunBasinaOrtHasta: typeof seansRutin.gunBasinaOrtHasta === 'number' ? seansRutin.gunBasinaOrtHasta : undefined,
    gecisler: gecisler.slice(0, 40),
    kartSirasi,
    cihaz,
    hesaplandi: new Date().toISOString().slice(0, 10),
  }
}

export function sonrakiAday(
  paket: RutinPaket | null | undefined,
  sonEylem: string,
): RutinGecis | null {
  if (!paket?.gecisler?.length) return null
  const adaylar = paket.gecisler
    .filter((g) => g.from === sonEylem && g.p >= SONRAKI_ESIK_P && g.n >= SONRAKI_ESIK_N)
    .sort((a, b) => b.p - a.p || b.n - a.n)
  return adaylar[0] || null
}

const ETIKET: Record<string, string> = {
  recete: 'Reçeteyi aç',
  recete_ac: 'Reçeteyi aç',
  randevular: 'Kontrol randevusu?',
  hastalar: 'Hastaları aç',
  hasta: 'Dosyayı aç',
  inceleme: 'İncelemeyi aç',
  ana: 'Ana sayfa',
}

const SOZ: Record<string, string> = {
  recete: 'Genelde reçeteyi açarsınız',
  recete_ac: 'Genelde reçeteyi açarsınız',
  randevular: 'Genelde kontrol randevusu yazarsınız',
  hastalar: 'Genelde hastaları açarsınız',
  hasta: 'Genelde dosyayı açarsınız',
  inceleme: 'Genelde incelemeyi açarsınız',
}

export function sonrakiMetin(gecis: RutinGecis): { soz: string; cta: string } {
  const cta = ETIKET[gecis.to] || gecis.to
  return { soz: SOZ[gecis.to] || `Genelde ${cta} adımına geçersiniz`, cta }
}

export function sonrakiHref(to: string, ctx: { noteId?: string | null; patientId?: string | null }): string | null {
  if (to === 'recete' || to === 'recete_ac') {
    return ctx.noteId ? `/dashboard/doktor/notlar/${ctx.noteId}/recete` : '/doktor-tools/erecete'
  }
  if (to === 'randevular') return '/dashboard/doktor/randevular?kontrol=1hafta'
  if (to === 'hastalar') return '/dashboard/doktor/hastalar'
  if (to === 'hasta' && ctx.patientId) return `/dashboard/doktor/hastalar/${ctx.patientId}`
  if (to === 'inceleme') return '/dashboard/doktor/inceleme'
  if (to === 'ana') return '/dashboard/doktor'
  return null
}

export async function rutinYukle(sb: SupabaseClient, doctorId: string): Promise<RutinPaket | null> {
  const { data } = await sb.from('doktor_rutin').select('paket').eq('doctor_id', doctorId).maybeSingle()
  const paket = data?.paket as RutinPaket | undefined
  return paket && Array.isArray(paket.gecisler) ? paket : null
}

export async function rutinHesaplaVeYaz(sb: SupabaseClient, doctorId: string): Promise<RutinPaket> {
  const kesim = new Date(Date.now() - 30 * 86400000).toISOString()
  const [{ data }, seans] = await Promise.all([
    sb.from('doktor_kullanim_olaylari')
      .select('sayfa_tipi, eylem, onceki, sure_ms, cihaz, zaman')
      .eq('doctor_id', doctorId)
      .gte('zaman', kesim)
      .order('zaman', { ascending: true })
      .limit(4000),
    rutinHesapla(sb, doctorId).catch(() => ({})),
  ])
  const paket = rutinTuret((data || []) as HamOlay[], seans || {})
  await sb.from('doktor_rutin').upsert({
    doctor_id: doctorId,
    paket,
    guncelleme: new Date().toISOString(),
  })
  return paket
}
