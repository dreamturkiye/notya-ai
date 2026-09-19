/**
 * ONKOLOJI-EXCEPTIONAL-01 — SGK/SUT onkoloji rapor taslağı. SAF fonksiyon.
 * Canlı Medula e-imza YOK. Endikasyon kutuları hekim doldurur; güncel SUT metni hekim doğrular.
 */
import type { Dipnot } from './onkoloji'
import { kurDozIceriyorMu } from './kur'

export type SutAmac = 'tedavi_raporu' | 'ilac_raporu' | 'tetkik_raporu' | 'diger'

export const SUT_AMAC_ETIKET: Record<SutAmac, string> = {
  tedavi_raporu: 'Tedavi raporu taslağı',
  ilac_raporu: 'İlaç raporu taslağı (endikasyon hekimde)',
  tetkik_raporu: 'Tetkik / görüntüleme raporu taslağı',
  diger: 'Diğer belge taslağı',
}

export interface SutGirdi {
  amac: SutAmac
  endikasyonOzet: string
  oncekiTedaviOzet?: string | null
  labOzet?: string | null
  hekimNot?: string | null
}

export interface SutSonuc {
  tamamMi: boolean
  taslak: string
  ozet: string
  dipnot: Dipnot
}

export function sutTaslagi(g: SutGirdi): SutSonuc {
  const dipnot: Dipnot = { ref: 'SGK_SUT', not: 'SUT taslağı — canlı e-imza yok; güncel metin hekim doğrular' }
  const amac = g.amac in SUT_AMAC_ETIKET ? g.amac : null
  if (!amac) return { tamamMi: false, taslak: '', ozet: 'Rapor amacı seçin.', dipnot }
  const end = String(g.endikasyonOzet || '').trim()
  if (end.length < 8) return { tamamMi: false, taslak: '', ozet: 'Endikasyon özeti en az birkaç kelime olmalı.', dipnot }
  const birlesik = [end, g.oncekiTedaviOzet, g.labOzet, g.hekimNot].filter(Boolean).join(' ')
  if (kurDozIceriyorMu(birlesik) || /\d+\s*mg\/m/i.test(birlesik)) {
    return { tamamMi: false, taslak: '', ozet: 'SUT taslağına doz / mg/m² / AUC yazılamaz — endikasyon dilinde kalın.', dipnot }
  }
  if (/ev[rR]e\s*[IVX0-9]|stage\s*[IVX]|T[0-4]N[0-3]M[0-1]|tan[ıi]\s*kilit/i.test(birlesik)) {
    return { tamamMi: false, taslak: '', ozet: 'Evre / TNM / tanı kilidi SUT taslağına otomatik yazılmaz — hekim klinik belgede ayrıca kilitler.', dipnot }
  }
  const satirlar = [
    `SGK/SUT — ${SUT_AMAC_ETIKET[amac]} (TASLAK — canlı Medula e-imza yok)`,
    `Endikasyon özeti (hekim): ${end}`,
    g.oncekiTedaviOzet ? `Önceki tedavi özeti (hekim): ${String(g.oncekiTedaviOzet).slice(0, 400)}` : null,
    g.labOzet ? `Lab / görüntü özeti (hekim): ${String(g.labOzet).slice(0, 400)}` : null,
    g.hekimNot ? `Hekim notu: ${String(g.hekimNot).slice(0, 400)}` : null,
    'Not: Güncel SUT maddesi ve ilaç endikasyonu hekim tarafından doğrulanır. Notya doz üretmez ve e-imza atmaz.',
  ].filter(Boolean)
  const taslak = satirlar.join('\n')
  return { tamamMi: true, taslak, ozet: `${SUT_AMAC_ETIKET[amac]} hazır (taslak).`, dipnot }
}
