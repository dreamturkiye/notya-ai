/**
 * NOTYA-DAH-WOW W0.3 — Kronik kart sözleşmesi. Her kart bu şekli uygular; hekim kilitleri tek tabloda (dahiliye_kart_kilitleri).
 * Kural: engine saf → API kaydeder → UI gösterir → hekim kilitler → ancak o zaman nota/rapora yazılır.
 */
import type { Dipnot } from './dahiliye'

export type KartAdi = 'ht' | 'dm' | 'lipid' | 'tiroid' | 'kvr' | 'ckd' | 'anemi' | 'obezite' | 'hf' | 'antikoagulan' | 'gi' | 'pulm' | 'checkup' | 'asi' | 'tarama' | 'izlem'
export interface HekimKilit { kart: KartAdi; alan: string; deger: unknown; kaynak?: string; created_at?: string }
export interface KartSonuc<T> { kart: KartAdi; taslak: T; plan: string[]; sevk: string[]; uyarilar: string[]; kilitAlanlari: string[]; dipnotlar: Dipnot[] }

export function kilitDegeri<T = unknown>(kilitler: HekimKilit[], kart: KartAdi, alan: string): T | null {
  const k = kilitler.filter((x) => x.kart === kart && x.alan === alan).sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))[0]
  return (k?.deger as T) ?? null
}
export function kilitDogrula(kart: string, alan: string): string | null {
  const izinli: Record<string, string[]> = { ht: ['evre', 'hedef'], dm: ['hedef_hba1c', 'tip'], lipid: ['hedef_ldl'], tiroid: ['tani'], kvr: ['kategori', 'hedef_ldl'], ckd: ['evre', 'kronik'], anemi: ['plan'], obezite: ['plan'], hf: ['nyha', 'plan'], antikoagulan: ['ajan', 'hedef_inr'], gi: ['tani'], pulm: ['tani', 'plan'], checkup: ['paket'], asi: ['plan'], tarama: ['plan'], izlem: ['sustur'] }
  if (!izinli[kart]) return `Bilinmeyen kart: ${kart}`
  if (!izinli[kart].includes(alan)) return `${kart} kartında kilitlenebilir alan değil: ${alan}`
  return null
}
