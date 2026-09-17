/**
 * NOTYA-DAH-WOW W0.4/W1.1 — Sticky "bugünkü vizit" şeridi: kartlardan ve görevlerden tek satır + 1-tap plan taslağı.
 * Saf fonksiyon; nota yazmaz. Hekim planı onaylayınca SOAP'a kopyalanır.
 */
export interface SeritGirdi {
  bugun: string
  kb: { sbp: number; dbp: number; tarih: string; hedefteMi: boolean | null; teknikOnay?: boolean } | null
  hba1c: { deger: number; delta: number | null; tarih: string | null; hedef: number | null } | null
  ldl: { deger: number; tarih: string | null; hedef: number | null } | null
  egfr: { deger: number; tarih: string | null; evre: string | null; renk: string | null } | null
  gorevler: { kod: string; ad: string; due: string | null }[]
  planlar: { kaynak: string; madde: string }[]
  kirmizi: string[]
}
export interface VizitSeridi {
  chips: { ad: string; deger: string; durum: 'iyi' | 'dikkat' | 'kotu' | 'yok'; alt?: string }[]
  overdue: { ad: string; due: string; gecikmeGun: number }[]
  planTaslagi: string[]
  kirmizi: string[]
}

export function vizitSeridi(g: SeritGirdi): VizitSeridi {
  const chips: VizitSeridi['chips'] = []
  // W4.2: teknik doğrulanmadan hedef dışı KB "kötü" (kontrolsüz) gösterilmez — önce ölçüm tekniği kontrol listesi.
  const teknikBekliyor = g.kb?.hedefteMi === false && g.kb.teknikOnay === false
  chips.push(g.kb ? { ad: 'KB', deger: `${g.kb.sbp}/${g.kb.dbp}`, durum: g.kb.tarih !== g.bugun ? 'dikkat' : g.kb.hedefteMi === false ? (teknikBekliyor ? 'dikkat' : 'kotu') : 'iyi', alt: g.kb.tarih !== g.bugun ? 'bugün ölçülmedi' : teknikBekliyor ? 'ölçüm tekniğini doğrula' : undefined } : { ad: 'KB', deger: '—', durum: 'yok', alt: 'bugün ölç' })
  chips.push(g.hba1c ? { ad: 'HbA1c', deger: `${g.hba1c.deger}%${g.hba1c.delta != null ? ` Δ${g.hba1c.delta > 0 ? '+' : ''}${g.hba1c.delta}` : ''}`, durum: g.hba1c.hedef != null && g.hba1c.deger > g.hba1c.hedef ? 'kotu' : 'iyi', alt: eskiMi(g.hba1c.tarih, g.bugun, 6) ? '>6 ay eski' : undefined } : { ad: 'HbA1c', deger: '—', durum: 'yok' })
  chips.push(g.ldl ? { ad: 'LDL', deger: `${g.ldl.deger}`, durum: g.ldl.hedef != null && g.ldl.deger > g.ldl.hedef ? 'kotu' : 'iyi', alt: g.ldl.hedef != null ? `hedef <${g.ldl.hedef}` : 'hedef kilitli değil' } : { ad: 'LDL', deger: '—', durum: 'yok' })
  chips.push(g.egfr ? { ad: 'eGFR', deger: `${g.egfr.deger}${g.egfr.evre ? ` ${g.egfr.evre}` : ''}`, durum: g.egfr.renk === 'kirmizi' ? 'kotu' : g.egfr.renk === 'turuncu' || g.egfr.renk === 'sari' ? 'dikkat' : 'iyi' } : { ad: 'eGFR', deger: '—', durum: 'yok' })
  const overdue = g.gorevler.filter((x) => x.due && x.due < g.bugun).map((x) => ({ ad: x.ad, due: x.due as string, gecikmeGun: gunFarki(x.due as string, g.bugun) })).sort((a, b) => b.gecikmeGun - a.gecikmeGun)
  chips.push({ ad: 'Gecikmiş', deger: String(overdue.length), durum: overdue.length ? (overdue.length >= 3 ? 'kotu' : 'dikkat') : 'iyi' })
  const planTaslagi = [
    ...g.kirmizi.map((k) => `⚑ ${k}`),
    ...g.planlar.map((p) => `${p.kaynak}: ${p.madde}`),
    ...overdue.slice(0, 5).map((o) => `Gecikmiş: ${o.ad} (${o.gecikmeGun} gün)`),
  ]
  return { chips, overdue, planTaslagi, kirmizi: g.kirmizi }
}

function gunFarki(a: string, b: string): number { return Math.round((Date.parse(b) - Date.parse(a)) / 86400000) }
function eskiMi(t: string | null, bugun: string, ay: number): boolean { if (!t) return true; const [y, m, d] = bugun.split('-').map(Number); return t < new Date(Date.UTC(y, m - 1 - ay, d)).toISOString().slice(0, 10) }
