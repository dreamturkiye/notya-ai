/**
 * BEYIN-CERRAHISI-EXCEPTIONAL-01 — Nöro post-op checklist. SAF fonksiyon.
 * Madde kodları + tarih. Tanı, OR HIS, AED doz YOK.
 */
import { aedDozIceriyorMu, type Dipnot } from './beyin'

export type PostopKod =
  | 'yara_kontrol'
  | 'norolojik_muayene'
  | 'agri_skalasi'
  | 'dvt_profilaksi_hatirlat'
  | 'steroid_azaltma_izlem'
  | 'goruntu_kontrol'
  | 'taburcu_egitim'
  | 'kontrol_randevu'

export const POSTOP_MADDELER: Array<{ kod: PostopKod; ad: string }> = [
  { kod: 'yara_kontrol', ad: 'Cerrahi yara / dren / pansuman kontrolü' },
  { kod: 'norolojik_muayene', ad: 'Odaklı nörolojik muayene kaydı' },
  { kod: 'agri_skalasi', ad: 'Ağrı skoru (sayı; ilaç dozu yazılmaz)' },
  { kod: 'dvt_profilaksi_hatirlat', ad: 'DVT profilaksisi hatırlatması (doz hekimde)' },
  { kod: 'steroid_azaltma_izlem', ad: 'Steroid azaltma izlem tarihi (doz hekimde)' },
  { kod: 'goruntu_kontrol', ad: 'Kontrol görüntüleme planı' },
  { kod: 'taburcu_egitim', ad: 'Taburcu / evde uyarı eğitimi verildi' },
  { kod: 'kontrol_randevu', ad: 'Kontrol randevusu belirlendi' },
]

export interface PostopSonuc {
  tamamMi: boolean
  secilen: PostopKod[]
  ozet: string
  gorevOnerileri: Array<{ kod: string; ad: string }>
  dipnot: Dipnot
}

export function postopSkorla(secilenHam: unknown, not?: string | null): PostopSonuc {
  const dipnot: Dipnot = { ref: 'TND_NOROS', not: 'Post-op kontrol listesi karar desteğidir; tanı ve doz hekimin' }
  const izinli = new Set(POSTOP_MADDELER.map((m) => m.kod))
  const secilen = (Array.isArray(secilenHam) ? secilenHam.map(String) : []).filter((k): k is PostopKod => izinli.has(k as PostopKod))
  if (not && aedDozIceriyorMu(not)) {
    return { tamamMi: false, secilen, ozet: 'Post-op notunda AED / mg doz yazılamaz.', gorevOnerileri: [], dipnot }
  }
  if (!secilen.length) {
    return { tamamMi: false, secilen, ozet: 'En az bir kontrol listesi maddesi seçin.', gorevOnerileri: [], dipnot }
  }
  const adlar = POSTOP_MADDELER.filter((m) => secilen.includes(m.kod)).map((m) => m.ad)
  const gorevOnerileri = secilen
    .filter((k) => k === 'goruntu_kontrol' || k === 'kontrol_randevu' || k === 'yara_kontrol')
    .map((k) => {
      const m = POSTOP_MADDELER.find((x) => x.kod === k)!
      return { kod: `postop_${k}`, ad: m.ad }
    })
  return {
    tamamMi: true,
    secilen,
    ozet: `Nöro post-op kontrol listesi: ${adlar.join('; ')}. Karar desteğidir; tanı/AED dozu hekimin.`,
    gorevOnerileri,
    dipnot,
  }
}
