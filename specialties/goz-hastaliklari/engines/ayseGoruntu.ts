/**
 * GOZ-AYSE-VISION — Decision-support draft scaffold for OCT / fundus / ön segment.
 * Dual-sign: always draft, asistan-authored; uzman must approve. Never diagnoses.
 * Optional LLM fill is a separate call site; this module is deterministic + safe.
 */
import { GOZ_GORUNTU_DISCLAIMER, type GozModalite } from '../imaging/dualSign'

const SABLON: Record<GozModalite, string[]> = {
  oct: [
    'Makula / fovea konturu (hekim işaretler)',
    'Retina katmanları — belirgin bozulma var mı? (gözlem)',
    'Subretinal / intraretinal sıvı şüphesi (gözlem; evre yok)',
    'RNFL / gangliyon hücre tabakası — asimetri notu (hekim)',
    'Artefakt / düşük sinyal — tekrar çekim gerekir mi?',
  ],
  fundus: [
    'Optik disk kenarı / C/D izlenimi (hekim)',
    'Makula reflektans / kanama / eksuda (gözlem)',
    'Damar kalibresi / AV çaprazlaşma (gözlem)',
    'Periferi — tarama alanı yeterli mi?',
    'Tek alan fundus ise güven sınırı hatırlatması',
  ],
  on_segment: [
    'Kornea saydamlık / boyanma (gözlem)',
    'Ön kamara derinliği / hücre-flare (hekim)',
    'Iris / pupil',
    'Lens — opasite dağılımı (hekim; GİL gücü yok)',
    'Konjonktiva / kapak kenarı',
  ],
}

export function ayseGoruntuTaslagi(input: {
  modalite: GozModalite
  goz: 'sag' | 'sol' | 'iki' | null
}): { taslak: string; disclaimer: string; uyarilar: string[] } {
  const goz = input.goz === 'sag' ? 'sağ göz' : input.goz === 'sol' ? 'sol göz' : input.goz === 'iki' ? 'iki göz' : 'göz belirtilmedi'
  const maddeler = SABLON[input.modalite] || SABLON.fundus
  const baslik = input.modalite === 'oct' ? 'OCT' : input.modalite === 'fundus' ? 'Fundus' : 'Ön segment'
  const satirlar = [
    `Ayşe taslak gözlem (${baslik}, ${goz}) — ${GOZ_GORUNTU_DISCLAIMER}`,
    ...maddeler.map((m, i) => `${i + 1}. ${m}`),
    'Tanı / evre yazılmaz. Uzman onayından önce klinik karar verilmez.',
  ]
  return {
    taslak: satirlar.join('\n'),
    disclaimer: GOZ_GORUNTU_DISCLAIMER,
    uyarilar: ['Taslak karar desteğidir; kesin tanı dili kullanmayın.'],
  }
}
