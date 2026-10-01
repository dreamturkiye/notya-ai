/** NOTYA-KAPSAM-01: sabit ret cümlesi — bağımsız modül (sistem istemi ve ön kapı aynı dizgiyi kullanır). Ekran = ses. */
export const KAPSAM_RED =
  `Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunuz varsa buyurun.`

export function kapsamRedMi(metin: string | null | undefined): boolean {
  return typeof metin === 'string' && metin.trim() === KAPSAM_RED
}

/**
 * NOTYA-KAPSAM-05: kapsam belirsizse (kapsam-dışı izi var, açık kalıp ve kapsam-içi sinyal yok) hasta aracı çalışmaz,
 * model de çağrılmaz — tek kısa netleştirme sorusu. Ekran = ses.
 */
export const KAPSAM_SORU =
  `Hocam, tam anlayamadım. Hasta dosyaları, randevular ya da notlarınızla ilgili bir şey mi soruyorsunuz? Hangi hasta ya da hangi kayıt olduğunu söyler misiniz?`
