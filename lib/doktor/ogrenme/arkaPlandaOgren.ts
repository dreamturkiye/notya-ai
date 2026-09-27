/**
 * NOTYA-MESLEKTAS-V2 — onay sonrası öğrenme. İstek yolunda LLM yok.
 * waitUntil ile sürer; aynı nota + aynı özet ikinci kez yazılmaz.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { duzeltmeAnaliz, type AlanMetinleri } from './duzeltmeAnaliz'
import { duzeltmeKurallariniKaydet } from './kuralKaydet'

export function arkaPlandaSurdur(p: Promise<unknown>): void {
  try {
    // Tip paketi ortamda yok; çalışma anında Vercel'de var (sesLlm ile aynı).
    const mod = require('@vercel/functions') as { waitUntil?: (x: Promise<unknown>) => void }
    if (mod.waitUntil) mod.waitUntil(p)
    else void p
  } catch { void p }
}

export function revizyonOzeti(loglar: { alan: string; onceki: string; sonraki: string }[]): string {
  return loglar
    .map((l) => `${l.alan}:${String(l.onceki).length}:${String(l.sonraki).length}:${String(l.sonraki).slice(0, 40)}`)
    .join('|')
    .slice(0, 400)
}

export function loglardanAlanlar(loglar: { alan: string; onceki: string; sonraki: string }[]): {
  taslak: AlanMetinleri
  son: AlanMetinleri
} {
  const taslak: AlanMetinleri = {}
  const son: AlanMetinleri = {}
  const map: Record<string, keyof AlanMetinleri> = {
    subjektif: 'subjektif',
    objektif: 'objektif',
    degerlendirme: 'degerlendirme',
    plan: 'plan',
    basvuruYakinmasi: 'basvuruYakinmasi',
    hastaOzeti: 'hastaOzeti',
    alarm_bulgulari: 'alarmBulgulari',
    alarmBulgulari: 'alarmBulgulari',
    content_ilaclar: 'ilaclar',
    ilaclar: 'ilaclar',
    ai_degerlendirme: 'aiDegerlendirme',
    aiDegerlendirme: 'aiDegerlendirme',
  }
  for (const l of loglar) {
    const alan = map[l.alan]
    if (!alan) continue
    taslak[alan] = l.onceki
    son[alan] = l.sonraki
  }
  return { taslak, son }
}

export async function duzeltmedenOgren(
  sb: SupabaseClient,
  doctorId: string,
  noteId: string,
  loglar: { alan: string; onceki: string; sonraki: string }[],
): Promise<number> {
  if (!loglar.length) return 0
  const ozet = revizyonOzeti(loglar)
  const { error: kilit } = await sb.from('doktor_ogrenme_islemleri').insert({
    doctor_id: doctorId,
    note_id: noteId,
    revizyon_ozet: ozet,
  })
  if (kilit) return 0
  const { taslak, son } = loglardanAlanlar(loglar)
  const deltolar = duzeltmeAnaliz(taslak, son)
  return duzeltmeKurallariniKaydet(sb, doctorId, deltolar, noteId)
}

export async function stilProfiliArkaPlan(
  sb: SupabaseClient,
  doctorId: string,
  logAdedi: number,
): Promise<void> {
  const { data: gecmis } = await sb
    .from('not_duzenlemeleri')
    .select('alan, onceki, sonraki')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false })
    .limit(20)
  const { data: profilSatiri } = await sb
    .from('doktor_stil_profilleri')
    .select('profil, ornek_sayisi')
    .eq('doctor_id', doctorId)
    .maybeSingle()
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const { stilProfiliDamit } = await import('@/lib/doktor/soapUret')
  const { hekimBransi } = await import('@/lib/doktor/hekimAdi')
  const yeniProfil = await stilProfiliDamit(
    new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }),
    String(profilSatiri?.profil || ''),
    gecmis || [],
    await hekimBransi(sb, doctorId),
  )
  if (!yeniProfil) return
  await sb.from('doktor_stil_profilleri').upsert({
    doctor_id: doctorId,
    profil: yeniProfil,
    ornek_sayisi: (profilSatiri?.ornek_sayisi || 0) + logAdedi,
    guncelleme: new Date().toISOString(),
  })
}

/** Onay yanıtından SONRA. LLM + kural yazımı istek yolunda yok. */
export function onaySonrasiOgren(
  sb: SupabaseClient,
  doctorId: string,
  noteId: string,
  loglar: { alan: string; onceki: string; sonraki: string }[],
): void {
  if (!loglar.length) return
  arkaPlandaSurdur((async () => {
    try { await duzeltmedenOgren(sb, doctorId, noteId, loglar) } catch (e) { console.error('[ogrenme] kural', e) }
    try { await stilProfiliArkaPlan(sb, doctorId, loglar.length) } catch (e) { console.error('[ogrenme] damitma', e) }
  })())
}
