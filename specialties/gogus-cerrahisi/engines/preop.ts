/**
 * GOGUS-CERRAHISI-EXCEPTIONAL-01 — Pre-op solunum checklist. SAF fonksiyon.
 * SFT / anestezi / sigara / görüntü hazırlık maddeleri. Tanı / doz / OR planı YOK.
 * CAT/mMRC skoru buraya girmez (gogus-hastaliklari).
 */
import type { Dipnot } from './gogus-cerrahisi'

export type PreopKod =
  | 'sft_yapildi'
  | 'goruntu_hazir'
  | 'anestezi_degerlendirme'
  | 'sigara_sorgulandi'
  | 'kan_lab_hazir'
  | 'onam_konustu'
  | 'kardiyak_risk_hekim'

export const PREOP_MADDELER: Array<{ kod: PreopKod; ad: string }> = [
  { kod: 'sft_yapildi', ad: 'Solunum fonksiyon testi yapıldı / sonucu hekimde' },
  { kod: 'goruntu_hazir', ad: 'Toraks görüntüsü (BT/akciğer grafisi) hekim incelemesine hazır' },
  { kod: 'anestezi_degerlendirme', ad: 'Anestezi değerlendirmesi planlandı / tamamlandı (hekim)' },
  { kod: 'sigara_sorgulandi', ad: 'Sigara öyküsü sorgulandı' },
  { kod: 'kan_lab_hazir', ad: 'Pre-op kan tahlilleri hekim incelemesine hazır' },
  { kod: 'onam_konustu', ad: 'Cerrahi onam konuşması yapıldı (hekim)' },
  { kod: 'kardiyak_risk_hekim', ad: 'Kardiyak risk değerlendirmesi hekimde' },
]

export interface PreopSonuc {
  tamamMi: boolean
  secilen: PreopKod[]
  ozet: string
  gorevOnerileri: Array<{ kod: string; ad: string }>
  dipnot: Dipnot
}

const KOD_SET = new Set(PREOP_MADDELER.map((m) => m.kod))

/** Doz / CAT / mMRC / GOLD sızıntısı. */
export function preopYasakIceriyorMu(metin: string): boolean {
  return /\d+\s*(mg|mcg|µg|ug|mg\/kg)\b|doz şeması|CAT\b|mMRC|GOLD\s*[ABCD]|GOLD\s*ABE|inhaler doz/i.test(metin)
}

export function preopSkorla(secilenHam: unknown, not?: string | null): PreopSonuc {
  const dipnot: Dipnot = { ref: 'TGCD', not: 'Pre-op checklist karar desteğidir; tanı ve cerrahi karar hekimin' }
  const liste = Array.isArray(secilenHam) ? secilenHam.map(String) : []
  const secilen = [...new Set(liste.filter((k): k is PreopKod => KOD_SET.has(k as PreopKod)))]
  if (not && preopYasakIceriyorMu(not)) {
    return { tamamMi: false, secilen, ozet: 'Pre-op notunda doz / CAT / mMRC yazılamaz.', gorevOnerileri: [], dipnot }
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
    ozet: `Pre-op solunum checklist (${secilen.length}/${PREOP_MADDELER.length}): ${adlar.join('; ')}. Karar desteğidir; tanı/cerrahi karar hekimin.`,
    gorevOnerileri,
    dipnot,
  }
}

export const PREOP_KONTROL_LISTESI: readonly string[] = PREOP_MADDELER.map((m) => m.ad)
