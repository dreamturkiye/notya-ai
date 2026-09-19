/**
 * COCUK-CERRAHISI-EXCEPTIONAL-01 — Onam / veli checklist (yaş kapılı). SAF.
 * Reşit (≥18) hastada veli maddeleri AÇILMAZ. Tanı / doz / OR YOK.
 */
import { dozVeyaTaniKilidiIceriyorMu } from './cocuk-cerrahisi'
import type { Dipnot } from './cocuk-cerrahisi'

export type OnamKod =
  | 'islem_amaci'
  | 'risk_kanama'
  | 'risk_enfeksiyon'
  | 'alternatifler'
  | 'sorular_yanit'
  | 'yazili_onam'
  | 'veli_kimlik'
  | 'veli_yazili'
  | 'cocuk_bilgilendirme'
  | 'acil_kisi'

export const ONAM_ORTAK: Array<{ kod: OnamKod; ad: string }> = [
  { kod: 'islem_amaci', ad: 'İşlemin amacı ve beklenen sonuç anlatıldı' },
  { kod: 'risk_kanama', ad: 'Kanama riski anlatıldı' },
  { kod: 'risk_enfeksiyon', ad: 'Enfeksiyon riski anlatıldı' },
  { kod: 'alternatifler', ad: 'Alternatifler ve işlem yapılmama seçeneği anlatıldı' },
  { kod: 'sorular_yanit', ad: 'Sorular yanıtlandı' },
  { kod: 'yazili_onam', ad: 'Yazılı bilgilendirilmiş onam imzalandı / dosyaya eklendi' },
  { kod: 'acil_kisi', ad: 'Acil durumda aranacak kişi (opsiyonel) not edildi' },
]

export const ONAM_VELI: Array<{ kod: OnamKod; ad: string }> = [
  { kod: 'veli_kimlik', ad: 'Veli / yasal temsilci kimliği doğrulandı' },
  { kod: 'veli_yazili', ad: 'Veli / yasal temsilci yazılı onamı alındı' },
  { kod: 'cocuk_bilgilendirme', ad: 'Çocuğa yaşa uygun bilgilendirme yapıldı (anlayabildiği ölçüde)' },
]

/** Yaş < 18 → veli maddeleri açılır. Yaş bilinmiyor → çocuk cerrahisinde veli maddeleri önerilir (güvenli taraf). */
export function onamMaddeleri(yasYil: number | null): Array<{ kod: OnamKod; ad: string }> {
  const veliGerekli = yasYil == null || yasYil < 18
  return veliGerekli ? [...ONAM_ORTAK, ...ONAM_VELI] : ONAM_ORTAK
}

export interface OnamSonuc {
  tamamMi: boolean
  secilen: OnamKod[]
  yasYil: number | null
  veliGerekli: boolean
  ozet: string
  taslak: string
  dipnot: Dipnot
  gorevOnerileri: Array<{ kod: string; ad: string }>
}

export function onamSkorla(secilenHam: unknown, yasYilHam?: unknown, hekimNot?: string | null): OnamSonuc {
  const dipnot: Dipnot = { ref: 'VELI_ONAM', not: 'Onam checklist karar desteğidir; yazılı onam klinik süreçtedir' }
  const yasRaw = yasYilHam == null || yasYilHam === '' ? null : Number(yasYilHam)
  const yasYil = yasRaw != null && Number.isFinite(yasRaw) && yasRaw >= 0 && yasRaw < 120 ? yasRaw : null
  const veliGerekli = yasYil == null || yasYil < 18
  const maddeler = onamMaddeleri(yasYil)
  const izinli = new Set(maddeler.map((m) => m.kod))
  const secilen = (Array.isArray(secilenHam) ? secilenHam.map(String) : [])
    .filter((k): k is OnamKod => izinli.has(k as OnamKod))
  if (!secilen.length) {
    return { tamamMi: false, secilen: [], yasYil, veliGerekli, ozet: 'En az bir onam maddesi işaretleyin.', taslak: '', dipnot, gorevOnerileri: [] }
  }
  if (hekimNot && dozVeyaTaniKilidiIceriyorMu(hekimNot)) {
    return { tamamMi: false, secilen, yasYil, veliGerekli, ozet: 'Hekim notunda doz / tanı kilidi / OR planı yazılamaz.', taslak: '', dipnot, gorevOnerileri: [] }
  }
  const adlar = maddeler.filter((m) => secilen.includes(m.kod)).map((m) => m.ad)
  const taslak = [
    'TASLAK — Bilgilendirilmiş onam / veli checklist (karar desteği).',
    veliGerekli
      ? 'Hasta <18 veya yaş bilinmiyor → veli / yasal temsilci maddeleri açıktır (VELI-YASAL-ONAM).'
      : 'Hasta ≥18 → veli maddeleri kapalı; hasta kendi onamı.',
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
  if (veliGerekli && !secilen.includes('veli_yazili')) {
    gorevOnerileri.push({ kod: 'veli_onam', ad: 'Veli / yasal temsilci yazılı onamı tamamla' })
  }
  return {
    tamamMi: true,
    secilen,
    yasYil,
    veliGerekli,
    ozet: `Onam checklist: ${secilen.length}/${maddeler.length} madde${veliGerekli ? ' (veli açık)' : ' (reşit — veli kapalı)'}. Karar desteğidir.`,
    taslak,
    dipnot,
    gorevOnerileri,
  }
}
