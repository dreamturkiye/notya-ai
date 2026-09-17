/**
 * NOTYA-DAH-WOW W4.1 — Kronik kohort paneli (hekimin tüm dahiliye hastaları). YENİ klinik mantık yok: yalnız kart tablolarının
 * ve onaylı lab satırlarının okunması. Bayraklar: HbA1c >9 · KB hedef dışı (HT kartı değerlendirmesi) · LDL hedef dışı (kilitli hedef)
 * · eGFR <45 · gecikmiş görev (lab / aşı / tarama / ilaç izlem) · son vizit >6 ay. Hatırlatma mesajı klinik değer içermez.
 */
export type KohortBayrak = 'hba1c_9' | 'kb_hedef_disi' | 'ldl_hedef_disi' | 'egfr_45' | 'gecikmis_lab' | 'gecikmis_asi' | 'gecikmis_tarama' | 'gecikmis_izlem' | 'vizit_6ay'
export const BAYRAK_AD: Record<KohortBayrak, string> = { hba1c_9: 'HbA1c >9', kb_hedef_disi: 'KB hedef dışı', ldl_hedef_disi: 'LDL hedef dışı', egfr_45: 'eGFR <45', gecikmis_lab: 'Gecikmiş lab', gecikmis_asi: 'Gecikmiş aşı', gecikmis_tarama: 'Gecikmiş tarama', gecikmis_izlem: 'Gecikmiş ilaç izlem', vizit_6ay: 'Vizit >6 ay' }

export interface KohortGirdi {
  patientId: string; ad: string
  hba1c: number | null; kbHedefteMi: boolean | null; ldl: number | null; ldlHedef: number | null; egfr: number | null
  gorevler: { kaynak: string | null; kod: string; due: string | null }[]; sonVizit: string | null; portalVar: boolean
}
export interface KohortSatir { patientId: string; ad: string; bayraklar: KohortBayrak[]; gecikmisSayi: number; sonVizit: string | null; portalVar: boolean; oncelik: number }

function ekleAy(t: string, ay: number): string { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }
const KAYNAK_BAYRAK = (k: { kaynak: string | null; kod: string }): KohortBayrak => {
  const s = `${k.kaynak || ''} ${k.kod}`
  if (/ilac_izlem|izlem_/.test(s)) return 'gecikmis_izlem'
  if (/asi/.test(s)) return 'gecikmis_asi'
  if (/tarama|ketem|dxa|nodul_us|pulm_spirometri/.test(s)) return 'gecikmis_tarama'
  return 'gecikmis_lab'
}
const AGIRLIK: Record<KohortBayrak, number> = { hba1c_9: 5, egfr_45: 4, kb_hedef_disi: 3, ldl_hedef_disi: 3, gecikmis_izlem: 3, gecikmis_lab: 2, vizit_6ay: 2, gecikmis_asi: 1, gecikmis_tarama: 1 }

export function kohortSatirlari(hastalar: KohortGirdi[], bugun: string): KohortSatir[] {
  return hastalar.map((h) => {
    const b = new Set<KohortBayrak>()
    if (h.hba1c != null && h.hba1c > 9) b.add('hba1c_9')
    if (h.kbHedefteMi === false) b.add('kb_hedef_disi')
    if (h.ldl != null && h.ldlHedef != null && h.ldl > h.ldlHedef) b.add('ldl_hedef_disi')
    if (h.egfr != null && h.egfr < 45) b.add('egfr_45')
    const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
    for (const g of gecikmis) b.add(KAYNAK_BAYRAK(g))
    if (!h.sonVizit || h.sonVizit < ekleAy(bugun, -6)) b.add('vizit_6ay')
    const bayraklar = Array.from(b)
    return { patientId: h.patientId, ad: h.ad, bayraklar, gecikmisSayi: gecikmis.length, sonVizit: h.sonVizit, portalVar: h.portalVar, oncelik: bayraklar.reduce((s, x) => s + AGIRLIK[x], 0) }
  }).filter((s) => s.bayraklar.length).sort((a, b) => b.oncelik - a.oncelik || a.ad.localeCompare(b.ad, 'tr'))
}

export function kohortFiltre(satirlar: KohortSatir[], bayraklar: KohortBayrak[]): KohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

/** Hastaya giden hatırlatma: klinik değer / tanı yazmaz (portal PIN arkasında olsa da en az bilgi). */
export function recallMesaji(bayraklar: KohortBayrak[]): { konu: string; metin: string } {
  const labMi = bayraklar.some((b) => ['hba1c_9', 'ldl_hedef_disi', 'egfr_45', 'gecikmis_lab', 'gecikmis_izlem'].includes(b))
  const asiTarama = bayraklar.some((b) => b === 'gecikmis_asi' || b === 'gecikmis_tarama')
  const nedenler = [bayraklar.includes('vizit_6ay') || bayraklar.includes('kb_hedef_disi') ? 'kontrol muayenesi' : null, labMi ? 'takip tahlilleri' : null, asiTarama ? 'aşı / tarama hatırlatması' : null].filter(Boolean) as string[]
  const liste = nedenler.length ? nedenler.join(', ') : 'kontrol muayenesi'
  return { konu: 'Kontrol zamanınız geldi', metin: `Merhaba, düzenli takibiniz kapsamında ${liste} zamanınız geldi. Uygun olduğunuz bir gün için randevu almanızı rica ederiz. Sorunuz varsa bu mesaja yanıt verebilirsiniz.` }
}
