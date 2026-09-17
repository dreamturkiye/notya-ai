/**
 * NOTYA-DAH-WOW W2.4 — KETEM ulusal kanser taraması due motoru (her iki cinsiyet).
 * Kolorektal 50–70: GGK (gaitada gizli kan) 2 yılda bir VEYA kolonoskopi 10 yılda bir · Meme 40–69 (K): mamografi 2 yılda bir
 * · Serviks 30–65 (K): HPV-DNA 5 yılda bir. Kadın satırları jine takvimiyle aynı kurallar (jinekoloji-spine dueHesapla ile hizalı);
 * route kadin_sagligi tarihlerini de okur (çift motor yok). Tarama ≠ tanı; pozitif sonuç → sevk.
 */
import type { Dipnot } from './dahiliye'

export interface TaramaGirdi { yas: number | null; kadin: boolean; histerektomi?: boolean; sonGgk?: string | null; sonKolonoskopi?: string | null; sonMamografi?: string | null; sonHpv?: string | null; sonPap?: string | null; ggkPozitif?: boolean; bugun: string }
export interface TaramaDue { kod: 'kolon' | 'meme' | 'serviks' | 'prostat'; ad: string; due: string | null; durum: 'gecikti' | 'yaklasiyor' | 'planli' | 'bilgi' | 'sevk'; not: string; dipnot: Dipnot }

const KETEM: Dipnot = { ref: 'KETEM', not: 'Ulusal tarama: kolorektal 50–70 GGK 2 yılda bir / kolonoskopi 10 yılda bir; meme 40–69 mamografi 2 yılda bir; serviks 30–65 HPV-DNA 5 yılda bir' }
function ekleAy(t: string, ay: number): string { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }

export function taramaDue(g: TaramaGirdi): TaramaDue[] {
  const out: TaramaDue[] = []
  const y = g.yas
  if (y == null) return out
  const durum = (due: string): TaramaDue['durum'] => (due < g.bugun ? 'gecikti' : due <= ekleAy(g.bugun, 3) ? 'yaklasiyor' : 'planli')
  if (g.ggkPozitif) out.push({ kod: 'kolon', ad: 'GGK pozitif', due: g.bugun, durum: 'sevk', not: 'Gaitada gizli kan pozitif → kolonoskopi için gastroenteroloji sevki', dipnot: KETEM })
  else if (y >= 50 && y <= 70) {
    if (g.sonKolonoskopi && g.sonKolonoskopi >= ekleAy(g.bugun, -120)) { const due = ekleAy(g.sonKolonoskopi, 120); out.push({ kod: 'kolon', ad: 'Kolorektal (kolonoskopi 10 yıl)', due, durum: durum(due), not: `Son kolonoskopi ${g.sonKolonoskopi} — GGK gerekmez`, dipnot: KETEM }) }
    else { const due = g.sonGgk ? ekleAy(g.sonGgk, 24) : g.bugun; out.push({ kod: 'kolon', ad: 'Kolorektal GGK (2 yılda bir)', due, durum: durum(due), not: 'KETEM / aile hekimliği ücretsiz GGK; alternatif kolonoskopi 10 yılda bir', dipnot: KETEM }) }
  }
  if (g.kadin && y >= 40 && y <= 69) { const due = g.sonMamografi ? ekleAy(g.sonMamografi, 24) : g.bugun; out.push({ kod: 'meme', ad: 'Mamografi (2 yılda bir)', due, durum: durum(due), not: 'KETEM 40–69', dipnot: KETEM }) }
  if (g.kadin && !g.histerektomi && y >= 30 && y <= 65) { const son = [g.sonHpv, g.sonPap].filter(Boolean).sort().reverse()[0] || null; const due = son ? ekleAy(son, 60) : g.bugun; out.push({ kod: 'serviks', ad: 'HPV-DNA (5 yılda bir)', due, durum: durum(due), not: 'KETEM 30–65; jine takvimiyle ortak tarih', dipnot: KETEM }) }
  if (!g.kadin && y >= 50 && y <= 69) out.push({ kod: 'prostat', ad: 'Prostat (PSA)', due: null, durum: 'bilgi', not: 'Ulusal programda rutin PSA taraması yok — yarar/zarar paylaşılmış karar (hekim)', dipnot: { ref: 'TIHUD2023', not: 'PSA taraması bireysel paylaşılmış karar' } })
  return out
}
