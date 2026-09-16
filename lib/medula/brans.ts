/** SGK Medula branş kodları (Notya specialty → SGK kodu). Route'tan taşındı (NOTYA-ERECETE-01, 2026-09-16). */
import { SGK_BRANS_KODU } from './tipler'

export const BRANS_SGK: Record<string, number> = {
  pediatri: SGK_BRANS_KODU['cocuk-sagligi'],
  'aile-hekimligi': SGK_BRANS_KODU['aile-hekimligi'],
  dermatoloji: SGK_BRANS_KODU['deri-zuhrevi'],
  psikiyatri: SGK_BRANS_KODU['ruh-sagligi'],
  'enfeksiyon-hastaliklari': SGK_BRANS_KODU['enfeksiyon'],
}
