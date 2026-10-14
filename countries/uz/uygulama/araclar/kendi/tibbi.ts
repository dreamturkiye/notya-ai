/**
 * NOTYA-ULKE-TIBBI-UZ — Uzbekistan: mechanisms whose rows were read from an official text on 2026-10-14.
 * MACHINE-WRITTEN. AWAITS NATIVE AND CLINICAL REVIEW. No clinician has signed these tools (./onay.ts).
 *
 * The essential-medicines annex, the immunisation flyer and the narcotic-prescription order are official texts.
 * The licence statement on each tool is a machine's reading of the copyright law, not a lawyer's opinion.
 * Nothing here is sent to a pharmacy, a payer or a state record.
 */
import type { AracTanimi } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, kontrolListesi, metin, sayi, sayiMi, secim } from '@/lib/ulke/araclar/yardimci'
import ham from '../../../referans/asosiyDorilar.json'

export type UzAsosiyQator = { anahtar: string; kod: string; inn: string; shakl: string; lotin: string; kirill: string; ruscha: string }

export const UZ_ASOSIY_QATORLAR = ham.rows as UzAsosiyQator[]
const ANAHTARLAR = UZ_ASOSIY_QATORLAR.map((r) => r.anahtar)
const sira = (anahtar: unknown): number => UZ_ASOSIY_QATORLAR.findIndex((r) => r.anahtar === anahtar)

/** A row of the essential-medicines annex. The position is the annex order, not a count of prescriptions. */
export const UZ_ASOSIY_DORILAR: AracTanimi = {
  anahtar: 'uz-asosiy-dorilar',
  tur: 'hesap',
  alanlar: [secim('dori', ANAHTARLAR)],
  cikti: { sayilar: ['sira'], bantlar: [], uyarilar: ['royxat'], tarihler: [] },
  kaynak: 'https://lex.uz/docs/-6590070 — Minister of Health order No. 34 of 21 August 2023, Ministry of Justice registration No. 3455 of 31 August 2023, annex. Read 2026-10-14.',
  hesapla: (g) => {
    const n = sira(g.dori)
    if (n < 0) return BOS_SONUC
    return { tamam: true, sayilar: [{ anahtar: 'sira', deger: n + 1, ondalik: 0 }], bant: null, uyarilar: ['royxat'], tarihler: [] }
  },
}

/**
 * A local note that names one annex row, plus a quantity and directions the doctor types.
 * The quantity is not a dose the tool chose. The note is not the pink narcotic form and is not sent.
 */
export const UZ_RETSEPT_QAYDI: AracTanimi = {
  anahtar: 'uz-retsept-qaydi',
  tur: 'hesap',
  alanlar: [secim('dori', ANAHTARLAR), sayi('miqdor', 0.01, 9999, { istege: true }), metin('yol')],
  cikti: { sayilar: ['sira', 'miqdor'], bantlar: [], uyarilar: ['royxat', 'yuborilmadi'], tarihler: [] },
  kaynak: 'https://lex.uz/docs/-6590070 — the same annex, for the name, the form and the strength. Read 2026-10-14. The note itself is this product\'s own: it is not a state prescription blank.',
  hesapla: (g) => {
    const n = sira(g.dori)
    if (n < 0) return BOS_SONUC
    return {
      tamam: true,
      sayilar: [{ anahtar: 'sira', deger: n + 1, ondalik: 0 }, ...(sayiMi(g.miqdor) ? [{ anahtar: 'miqdor', deger: g.miqdor, ondalik: 2 }] : [])],
      bant: null,
      uyarilar: ['royxat', 'yuborilmadi'],
      tarihler: [],
    }
  },
}

/**
 * What order No. 3604 of 27 January 2025 says a doctor writes on a narcotic prescription.
 * Paragraphs read that day: 33, 34, 36 and 37, at https://lex.uz/uz/docs/-7349574.
 * The ticks are the doctor's own confirmation. The tool does not check a form and does not send one.
 */
const GIYOHVAND_MADDELER = ['muassasa', 'rahbar', 'lotin_yozuv', 'davlat_tili', 'tartib', 'bitta_nom', 'yetti_miqdor', 'yetti_kun', 'narkoz_yoq'] as const

export const UZ_GIYOHVAND_QOIDALARI = kontrolListesi({
  anahtar: 'uz-giyohvand-qoidalari',
  maddeler: GIYOHVAND_MADDELER,
  uyarilar: ['toliq_emas', 'yuborilmadi'],
  uyari: (secili) => [secili.length < GIYOHVAND_MADDELER.length ? 'toliq_emas' : '', 'yuborilmadi'].filter(Boolean),
  kaynak: 'https://lex.uz/uz/docs/-7349574 — order No. 3604 of 27 January 2025, paragraphs 33, 34, 36 and 37. Read 2026-10-14.',
})

/**
 * The ages and vaccine kinds printed on the sanitary service's one-page flyer.
 * The flyer states no catch-up rule, no dose interval and no date of issue.
 * Presidential resolution PQ-402 of 22 November 2024 tells the ministry to review the HPV ages and to re-approve
 * the national calendar; the re-approved text was not the page that was opened. A clinician confirms the flyer is current.
 */
const EMLASH_MADDELER = ['kun1', 'kun2', 'oy2', 'oy3', 'oy4', 'oy12', 'oy16', 'yosh6', 'yosh7', 'yosh9', 'yosh16'] as const

export const UZ_EMLASH_TAQVIMI = kontrolListesi({
  anahtar: 'uz-emlash-taqvimi',
  maddeler: EMLASH_MADDELER,
  uyarilar: ['varaqa'],
  uyari: () => ['varaqa'],
  kaynak: 'https://emlash.sanepid.uz/upload/Calendar_new_a5_flyer_uzb.pdf — flyer "Profilaktik emlashlar kalendari", opened 2026-10-14. No issue date on the page.',
})
