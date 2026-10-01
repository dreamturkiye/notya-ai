/** NOTYA-KAPSAM-01: sabit ret cümlesi — bağımsız modül (sistem istemi ve ön kapı aynı dizgiyi kullanır). Ekran = ses. */
export const KAPSAM_RED =
  `Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunuz varsa buyurun.`

export function kapsamRedMi(metin: string | null | undefined): boolean {
  return typeof metin === 'string' && metin.trim() === KAPSAM_RED
}
