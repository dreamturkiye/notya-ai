/**
 * PLASTIK-CERRAHI-EXCEPTIONAL-01 — Onam taslağı checklist. SAF fonksiyon.
 * Bilgilendirilmiş onam hatırlatma maddeleri — tanı kilidi / doz / OR scheduling YOK.
 */
import { dozVeyaTaniKilidiIceriyorMu } from './plastik'
import type { Dipnot } from './plastik'

export type OnamKod =
  | 'islem_amaci'
  | 'risk_kanama'
  | 'risk_enfeksiyon'
  | 'risk_skar'
  | 'risk_asimetri'
  | 'alternatifler'
  | 'foto_izin'
  | 'sigara_uyari'
  | 'sorular_yanit'
  | 'yazili_onam'

export const ONAM_MADDELER: Array<{ kod: OnamKod; ad: string }> = [
  { kod: 'islem_amaci', ad: 'İşlemin amacı ve beklenen sonuç hekim tarafından anlatıldı' },
  { kod: 'risk_kanama', ad: 'Kanama / hematom riski anlatıldı' },
  { kod: 'risk_enfeksiyon', ad: 'Enfeksiyon riski anlatıldı' },
  { kod: 'risk_skar', ad: 'Skar / yara izi riski anlatıldı' },
  { kod: 'risk_asimetri', ad: 'Asimetri / revizyon olasılığı anlatıldı' },
  { kod: 'alternatifler', ad: 'Alternatifler ve işlem yapılmama seçeneği anlatıldı' },
  { kod: 'foto_izin', ad: 'Klinik fotoğraf çekimi için hasta onayı alındı (KVKK)' },
  { kod: 'sigara_uyari', ad: 'Sigara / nikotinin yara iyileşmesine etkisi anlatıldı (varsa)' },
  { kod: 'sorular_yanit', ad: 'Hastanın soruları yanıtlandı' },
  { kod: 'yazili_onam', ad: 'Yazılı bilgilendirilmiş onam imzalandı / dosyaya eklendi' },
]

export interface OnamSonuc {
  tamamMi: boolean
  secilen: OnamKod[]
  ozet: string
  taslak: string
  dipnot: Dipnot
  gorevOnerileri: Array<{ kod: string; ad: string }>
}

export function onamSkorla(secilenHam: unknown, hekimNot?: string | null): OnamSonuc {
  const dipnot: Dipnot = { ref: 'TPRECD', not: 'Onam kontrol listesi karar desteğidir; tanı/doz/ameliyathane planı hekimin' }
  const izinli = new Set(ONAM_MADDELER.map((m) => m.kod))
  const secilen = (Array.isArray(secilenHam) ? secilenHam.map(String) : [])
    .filter((k): k is OnamKod => izinli.has(k as OnamKod))
  if (!secilen.length) {
    return { tamamMi: false, secilen: [], ozet: 'En az bir onam maddesi işaretleyin.', taslak: '', dipnot, gorevOnerileri: [] }
  }
  if (hekimNot && dozVeyaTaniKilidiIceriyorMu(hekimNot)) {
    return { tamamMi: false, secilen, ozet: 'Hekim notunda doz / tanı kilidi / ameliyathane planı yazılamaz.', taslak: '', dipnot, gorevOnerileri: [] }
  }
  const adlar = ONAM_MADDELER.filter((m) => secilen.includes(m.kod)).map((m) => m.ad)
  const taslak = [
    'TASLAK — Bilgilendirilmiş onam kontrol listesi (karar desteği).',
    'Otomatik tanı kilidi, doz ve ameliyathane planı bu listede yoktur; hekim kilidi gerektirir.',
    '',
    ...adlar.map((a) => `☐ ${a}`),
    hekimNot ? `\nHekim notu: ${hekimNot.slice(0, 400)}` : '',
    '',
    'Canlı Medula e-imza / HIS onam motoru yok — yazılı onam hekim/klinik süreçtedir.',
  ].filter(Boolean).join('\n')
  const gorevOnerileri: Array<{ kod: string; ad: string }> = []
  if (!secilen.includes('yazili_onam')) {
    gorevOnerileri.push({ kod: 'onam_yazili', ad: 'Yazılı bilgilendirilmiş onam tamamla' })
  }
  if (!secilen.includes('foto_izin')) {
    gorevOnerileri.push({ kod: 'foto_izin', ad: 'Klinik fotoğraf onayı (KVKK) kontrol et' })
  }
  return {
    tamamMi: true,
    secilen,
    ozet: `Onam kontrol listesi: ${secilen.length}/${ONAM_MADDELER.length} madde. Karar desteğidir; tanı/doz hekimin.`,
    taslak,
    dipnot,
    gorevOnerileri,
  }
}
