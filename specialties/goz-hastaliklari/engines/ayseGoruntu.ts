/**
 * GOZ-AYSE-VISION — Decision-support draft scaffold for OCT / fundus / ön segment.
 * Dual-sign: always draft, asistan-authored; uzman must approve. Never diagnoses.
 * Fundus scaffold mirrors TR clinic order (disk 3C → damar → makula → perifer), OD/OS.
 * Optional LLM fill is Belge › Asistana raporla (Tier A); this module is deterministic + safe.
 */
import { GOZ_GORUNTU_DISCLAIMER, type GozModalite } from '../imaging/dualSign'

const FUNDUS_SIRA = [
  'Ortam / kırmızı refleks — bulanıklık, artefakt, alan yeterli mi?',
  'Optik disk — 3C: renk, kenar (kontur), C/D izlenimi (hekim yazar; glokom tanısı yok)',
  'Damarlar — A/V kalibre, AV çaprazlaşma, neovaskülarizasyon şüphesi (gözlem)',
  'Makula — foveal refle, kanama / sert eksuda / yumuşak eksuda (gözlem; evre yok)',
  'Perifer — tarama alanı; tek alan fotoğrafta perifer güven sınırı',
]

const SABLON: Record<GozModalite, string[]> = {
  oct: [
    'Makula / fovea konturu (hekim işaretler)',
    'Retina katmanları — belirgin bozulma var mı? (gözlem)',
    'Subretinal / intraretinal sıvı şüphesi (gözlem; evre yok)',
    'RNFL / gangliyon hücre tabakası — asimetri notu (hekim)',
    'Artefakt / düşük sinyal — tekrar çekim gerekir mi?',
  ],
  fundus: FUNDUS_SIRA,
  on_segment: [
    'Kornea saydamlık / boyanma (gözlem)',
    'Ön kamara derinliği / hücre-flare (hekim)',
    'Iris / pupil',
    'Lens — opasite dağılımı (hekim; GİL gücü yok)',
    'Konjonktiva / kapak kenarı',
  ],
}

function gozEtiket(goz: 'sag' | 'sol' | 'iki' | null): string {
  if (goz === 'sag') return 'sağ göz (OD)'
  if (goz === 'sol') return 'sol göz (OS)'
  if (goz === 'iki') return 'iki göz (OU) — tercihen OD ve OS ayrı fotoğraf'
  return 'göz belirtilmedi — yüklemede OD/OS seçin'
}

export function ayseGoruntuTaslagi(input: {
  modalite: GozModalite
  goz: 'sag' | 'sol' | 'iki' | null
}): { taslak: string; disclaimer: string; uyarilar: string[] } {
  const goz = gozEtiket(input.goz)
  const maddeler = SABLON[input.modalite] || SABLON.fundus
  const baslik = input.modalite === 'oct' ? 'OCT' : input.modalite === 'fundus' ? 'Fundus (göz dibi)' : 'Ön segment'
  const satirlar = [
    `Ayşe taslak gözlem (${baslik}, ${goz}) — ${GOZ_GORUNTU_DISCLAIMER}`,
    ...(input.modalite === 'fundus'
      ? ['Sıra (TR poliklinik): disk → damarlar → makula → perifer. DR / glokom evresi yazılmaz.']
      : []),
    ...maddeler.map((m, i) => `${i + 1}. ${m}`),
    'Tanı / ICDR evresi / tedavi yazılmaz. Uzman onayından önce klinik karar verilmez.',
  ]
  const uyarilar = ['Taslak karar desteğidir; kesin tanı dili kullanmayın.']
  if (input.modalite === 'fundus' && (input.goz == null || input.goz === 'iki')) {
    uyarilar.push('Bilateral değerlendirme için OD ve OS ayrı fundus fotoğrafı yükleyin.')
  }
  return {
    taslak: satirlar.join('\n'),
    disclaimer: GOZ_GORUNTU_DISCLAIMER,
    uyarilar,
  }
}
