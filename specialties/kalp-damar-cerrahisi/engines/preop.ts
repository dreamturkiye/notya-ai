/**
 * KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — Pre-op risk checklist. SAF fonksiyon.
 * Anestezi / görüntü / lab / onam / antikoagülan sorgusu maddeleri. Tanı / doz / OR planı / SCORE2 YOK.
 */
import type { Dipnot } from './kalp-damar'

export type PreopKod =
  | 'goruntu_hazir'
  | 'anestezi_degerlendirme'
  | 'kan_lab_hazir'
  | 'eko_raporu_hekim'
  | 'antikoag_sorgulandi'
  | 'onam_konustu'
  | 'sigara_sorgulandi'
  | 'kardiyak_risk_hekim'

export const PREOP_MADDELER: Array<{ kod: PreopKod; ad: string }> = [
  { kod: 'goruntu_hazir', ad: 'Damar / kalp görüntüsü (BT anjiyo / Doppler / koroner) hekim incelemesine hazır' },
  { kod: 'anestezi_degerlendirme', ad: 'Anestezi değerlendirmesi planlandı / tamamlandı (hekim)' },
  { kod: 'kan_lab_hazir', ad: 'Pre-op kan tahlilleri hekim incelemesine hazır' },
  { kod: 'eko_raporu_hekim', ad: 'Ekokardiyografi / kardiyak değerlendirme raporu hekimde' },
  { kod: 'antikoag_sorgulandi', ad: 'Antikoagülan / antiplatelet öyküsü sorgulandı (doz yazılmaz)' },
  { kod: 'onam_konustu', ad: 'Cerrahi onam konuşması yapıldı (hekim)' },
  { kod: 'sigara_sorgulandi', ad: 'Sigara öyküsü sorgulandı' },
  { kod: 'kardiyak_risk_hekim', ad: 'Perioperatif kardiyak risk değerlendirmesi hekimde' },
]

export interface PreopSonuc {
  tamamMi: boolean
  secilen: PreopKod[]
  ozet: string
  gorevOnerileri: Array<{ kod: string; ad: string }>
  dipnot: Dipnot
}

const KOD_SET = new Set(PREOP_MADDELER.map((m) => m.kod))

/** Doz / SCORE2 / Kalbim sızıntısı. */
export function preopYasakIceriyorMu(metin: string): boolean {
  return /\d+\s*(mg|mcg|µg|ug|mg\/kg)\b|doz şeması|SCORE\s*2|SCORE2|Kalbim|INR\s*hedef|warfarin\s*\d/i.test(metin)
}

export function preopSkorla(secilenHam: unknown, not?: string | null): PreopSonuc {
  const dipnot: Dipnot = { ref: 'TKDCD', not: 'Pre-op checklist karar desteğidir; tanı ve cerrahi karar hekimin' }
  const liste = Array.isArray(secilenHam) ? secilenHam.map(String) : []
  const secilen = [...new Set(liste.filter((k): k is PreopKod => KOD_SET.has(k as PreopKod)))]
  if (not && preopYasakIceriyorMu(not)) {
    return { tamamMi: false, secilen, ozet: 'Pre-op notunda doz / SCORE2 yazılamaz.', gorevOnerileri: [], dipnot }
  }
  if (!secilen.length) {
    return { tamamMi: false, secilen, ozet: 'En az bir pre-op madde seçin — tanı yazılmaz.', gorevOnerileri: [], dipnot }
  }
  const adlar = PREOP_MADDELER.filter((m) => secilen.includes(m.kod)).map((m) => m.ad)
  const eksik = PREOP_MADDELER.filter((m) => !secilen.includes(m.kod))
  const gorevOnerileri = eksik.slice(0, 3).map((m) => ({ kod: `preop_${m.kod}`, ad: `Pre-op: ${m.ad}` }))
  return {
    tamamMi: true,
    secilen,
    ozet: `Pre-op risk checklist (${secilen.length}/${PREOP_MADDELER.length}): ${adlar.join('; ')}. Karar desteğidir; tanı/cerrahi karar hekimin. SCORE2/doz yok.`,
    gorevOnerileri,
    dipnot,
  }
}

export const PREOP_KONTROL_LISTESI: readonly string[] = PREOP_MADDELER.map((m) => m.ad)
