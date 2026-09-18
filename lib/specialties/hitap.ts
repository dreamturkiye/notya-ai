/**
 * BRANS-ALAN-SIZMASI (Kaan 2026-09-17) — kime hitap ediliyor: "hasta" mı "veli" mi.
 *
 * "Veli" (reşit olmayan çocuğun anne-babası / yasal vasisi) PEDİATRİK bağlamın kelimesidir.
 * Kadın doğum, dahiliye, dermatoloji, göz, kardiyoloji … notunda hasta erişkindir; orada "veli",
 * "hasta/veli" ya da "anne-babaya anlatır gibi" yazmak branş sızıntısıdır (canlı hata: KD hesabında
 * "Hasta/veli özeti").
 *
 * Bu dosya saf metindir (import yok) — hem istemci sayfaları hem sunucu promptları buradan okur.
 * Hangi bağlamın pediatrik olduğuna BURADA karar verilmez; o karar tek yerde:
 * lib/specialties/kapsam.ts → pediatrikBaglamMi(). Kural: .cursor/skills/brans-alan-sizmasi/SKILL.md
 */

export interface HitapMetinleri {
  /** İnceleme / not sayfası: portala giden özet kutusunun başlığı */
  ozetEtiketi: string
  /** Yazdır/PDF: aynı alanın basılı başlığı */
  ozetYazdirEtiketi: string
  /** Özet kutusunun yer tutucusu */
  ozetYerTutucu: string
  /** "Notuma göre yenile" düğmesinin Ayşe'ye gönderdiği istek */
  ozetYenileIstegi: string
  /** "Evde dikkat edilmesi gerekenler" başlığındaki hedef ("veliye/hastaya" | "hastaya") */
  evdeDikkatHedefi: string
  /** LLM promptunda hastaOzeti alanının tarifi */
  ozetPromptTarifi: string
  /** LLM promptunda taslak özet satırının etiketi */
  ozetPromptEtiketi: string
  /** Aşı kaydı kaynağı seçeneği (beyan) */
  beyanEtiketi: string
}

const PEDIATRIK: HitapMetinleri = {
  ozetEtiketi: 'Hasta/veli özeti',
  ozetYazdirEtiketi: 'Hasta / Veli Özeti',
  ozetYerTutucu: 'Veliye anne-babaya anlatır gibi kısa özet',
  ozetYenileIstegi: 'Notun güncel haline göre hasta/veli özetini yeniden yaz.',
  evdeDikkatHedefi: 'veliye/hastaya',
  ozetPromptTarifi: 'veliye giden özet',
  ozetPromptEtiketi: 'Veli özeti (taslak)',
  beyanEtiketi: 'Hasta/veli beyanı',
}

const HASTA: HitapMetinleri = {
  ozetEtiketi: 'Hasta özeti',
  ozetYazdirEtiketi: 'Hasta Özeti',
  ozetYerTutucu: 'Hastaya sade dille anlatır gibi kısa özet',
  ozetYenileIstegi: 'Notun güncel haline göre hasta özetini yeniden yaz.',
  evdeDikkatHedefi: 'hastaya',
  ozetPromptTarifi: 'hastaya giden özet',
  ozetPromptEtiketi: 'Hasta özeti (taslak)',
  beyanEtiketi: 'Hasta beyanı',
}

/** `pediatrik` yalnız pediatrikBaglamMi() sonucundan gelmeli; bilinmiyorsa false (varsayılan hasta dilidir). */
export function hitapMetinleri(pediatrik: boolean | null | undefined): HitapMetinleri {
  return pediatrik === true ? PEDIATRIK : HASTA
}
