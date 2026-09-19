/**
 * KARDIO-EXCEPTIONAL-01 — SCORE2 / KV risk sarmalayıcısı. SAF fonksiyon.
 * Sayısal motor specialties/dahiliye/engines/score2.ts (ESC 2021, ONAYLI).
 * Bu dosya kardiyoloji yüzü: bant KARAR DESTEĞİDİR, tanı değildir; doz yok.
 */
import {
  score2Ham, score2Kova, SCORE2_ONAYLI, type Cinsiyet, type Bolge, type KvrKova, type Score2Girdi,
} from '@/specialties/dahiliye/engines/score2'
import type { Dipnot } from './kardiyoloji'

export { SCORE2_ONAYLI }
export type { Cinsiyet, Bolge, KvrKova, Score2Girdi }

export const KOVA_AD: Record<KvrKova, string> = {
  dusuk_orta: 'Düşük–orta risk bandı (karar desteği)',
  yuksek: 'Yüksek risk bandı (karar desteği)',
  cok_yuksek: 'Çok yüksek risk bandı (karar desteği)',
}

export interface KardioScore2Sonuc {
  riskPct: number | null
  kova: KvrKova | null
  kovaAd: string
  bolge: Bolge
  tamamMi: boolean
  eksikler: string[]
  ozet: string
  dipnotlar: Dipnot[]
}

export function kardioScore2Hesapla(g: Partial<Score2Girdi> & { yas?: number }): KardioScore2Sonuc {
  const bolge: Bolge = g.bolge || 'high'
  const eksikler: string[] = []
  if (g.yas == null || !Number.isFinite(g.yas)) eksikler.push('Yaş gerekli')
  else if (g.yas < 40 || g.yas > 69) eksikler.push('SCORE2 40–69 yaş aralığında hesaplanır (≥70 ve DM için ayrı motorlar dahiliye motorlarında)')
  if (g.cinsiyet !== 'erkek' && g.cinsiyet !== 'kadin') eksikler.push('Cinsiyet (erkek/kadın) gerekli')
  if (g.sbp == null || !Number.isFinite(g.sbp)) eksikler.push('Sistolik KB gerekli')
  if (g.tcholMgdl == null || !Number.isFinite(g.tcholMgdl)) eksikler.push('Total kolesterol (mg/dL) gerekli')
  if (g.hdlMgdl == null || !Number.isFinite(g.hdlMgdl)) eksikler.push('HDL (mg/dL) gerekli')
  if (typeof g.sigara !== 'boolean') eksikler.push('Sigara durumu gerekli')

  if (eksikler.length || !SCORE2_ONAYLI) {
    return {
      riskPct: null, kova: null, kovaAd: 'Hesaplanamadı', bolge, tamamMi: false, eksikler: SCORE2_ONAYLI ? eksikler : ['SCORE2 motoru onay bekliyor'],
      ozet: 'SCORE2 girdileri eksik — Notya değer uydurmaz.',
      dipnotlar: [{ ref: 'SCORE2_ESC', not: 'Eksik girdi veya motor kilidi — sayısal risk üretilmez.' }],
    }
  }

  const girdi: Score2Girdi = {
    yas: g.yas!, cinsiyet: g.cinsiyet!, sigara: g.sigara!, sbp: g.sbp!,
    tcholMgdl: g.tcholMgdl!, hdlMgdl: g.hdlMgdl!, bolge,
  }
  const riskPct = score2Ham(girdi)
  const kova = riskPct == null ? null : score2Kova(girdi.yas, riskPct)
  return {
    riskPct,
    kova,
    kovaAd: kova ? KOVA_AD[kova] : '—',
    bolge,
    tamamMi: riskPct != null,
    eksikler: [],
    ozet: riskPct == null
      ? 'SCORE2 hesaplanamadı (girdi aralığı dışı).'
      : `SCORE2 ${riskPct}% · ${kova ? KOVA_AD[kova] : '—'} · Türkiye yüksek risk bölgesi. Bant karar desteğidir; tanı ve tedavi hekimindir.`,
    dipnotlar: [
      { ref: 'SCORE2_ESC', not: 'ESC 2021 SCORE2 — kalibre 10 yıllık risk; kova taslaktır, hekim kilitler.' },
      { ref: 'TKD', not: 'TKD / ESC klinik bağlam; statin ve hedef LDL kararı hekimindir (doz yok).' },
    ],
  }
}
