/**
 * BRANS-ALAN-SIZMASI (Kaan 2026-09-17) — kime hitap ediliyor: "hasta" mı "veli" mi.
 *
 * "Veli" (reşit olmayan hastanın anne-babası / yasal vasisi) HASTANIN YAŞINA bağlı hukuki bir kelimedir, branşa değil
 * (VELI-YASAL-ONAM, Kaan 2026-09-17): 18 yaşını doldurmamış her hastada klinik kayıt ve onam veliden — göz, KBB,
 * ortopedi, kardiyoloji hekiminin 10 yaşındaki hastası da veli dilini alır. ERİŞKİN hastanın notunda (KD, dahiliye,
 * dermatoloji …) "veli", "hasta/veli" ya da "anne-babaya anlatır gibi" yazmak ise sızıntıdır (canlı hata: KD
 * hesabında "Hasta/veli özeti").
 *
 * Bu dosya saf metindir (import yok) — hem istemci sayfaları hem sunucu promptları buradan okur.
 * Hangi notun veli dilinde olduğuna BURADA karar verilmez; o karar tek yerde:
 * lib/specialties/kapsam.ts → veliDiliMi() (veliOnamGerekliMi: <18 her branş + pediatrikBaglamMi).
 * Kural: .cursor/skills/brans-alan-sizmasi/SKILL.md
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

/** Reşit olmayan hasta (her branş) + pediatri / çocuk cerrahisi bağlamı */
const VELI: HitapMetinleri = {
  ozetEtiketi: 'Hasta/veli özeti',
  ozetYazdirEtiketi: 'Hasta / Veli Özeti',
  ozetYerTutucu: 'Veliye anne-babaya anlatır gibi kısa özet',
  ozetYenileIstegi: 'Notun güncel haline göre hasta/veli özetini yeniden yaz.',
  evdeDikkatHedefi: 'veliye/hastaya',
  ozetPromptTarifi: 'veliye giden özet',
  ozetPromptEtiketi: 'Veli özeti (taslak)',
  beyanEtiketi: 'Hasta/veli beyanı',
}

/** Erişkin hasta — "veli" yok, "hasta/veli" gibi muğlak ifade yok */
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

/** `veliDili` yalnız kapsam.ts → veliDiliMi() sonucundan gelmeli; bilinmiyorsa false (varsayılan hasta dilidir). */
export function hitapMetinleri(veliDili: boolean | null | undefined): HitapMetinleri {
  return veliDili === true ? VELI : HASTA
}
