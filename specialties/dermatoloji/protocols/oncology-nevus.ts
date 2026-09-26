import type { EvalResult } from './eval'

export function evaluateNevus(input: { ugly_duckling: boolean; digital_map?: boolean }): EvalResult {
  return {
    triage: input.ugly_duckling ? 'urgent' : 'routine',
    next: [
      input.ugly_duckling ? 'Çirkin ördek yavrusu işareti' : 'Rutin ben kontrolü',
      input.digital_map ? 'Dijital harita' : 'MoleMax / FotoFinder / manuel haritalama düşünülebilir',
      'Kontrol aralığı 3–12 ay',
      'Endikasyon varsa eksizyon + patoloji sonucu takibi',
    ],
    citations: ['bolognia-5', 'euromelanoma'],
    photoPlan: ['klinik_genel', 'klinik_yakin', 'dermoskopi_polarize'],
  }
}
