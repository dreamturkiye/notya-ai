/**
 * TOPLU-ULKE-01 (2026-10-16) — every user-visible string of the BATCH card (EylemToplu), as one injected copy object.
 *
 * Country builds must never show Turkish. The text is not written in core: Türkiye's copy is countries/tr/toplu.ts
 * (TOPLU_METIN_TR), the English forms are countries/_dil/en/toplu.ts, Uzbek is countries/uz/toplu.ts. Core reaches the
 * active one only through countries/active/toplu (scripts/ulke-duvarlari.mjs, D1/D5). Types only in this file.
 *
 * `alanEtiketleri` / `eylemEtiketleri` override the field / action labels the SERVER sends (core/eylemler, Turkish) for
 * the keys listed; anything not listed falls back to the server's label (logged in docs/OPEN-COMMITMENTS.md).
 */
export interface TopluMetin {
  /** Heading above the card: "3 entries prepared". */
  kayitHazirlandi: (n: number) => string
  /** Checkbox of a row that carries a serious warning. */
  uyariGordum: string
  /** Shown above the inline inputs of a row with missing required fields. */
  eksikAciklama: string
  /** First option of a select input. */
  seciniz: string
  /** "Ticked — will be added once <fields> are entered." */
  seciliEksik: (alanlar: string[]) => string
  kaydediliyor: string
  kaydedildi: string
  /** "Source:" label under a warning. */
  kaynak: string
  /** The Save button, with the ready / missing / awaiting-acknowledgement counts. */
  dugme: (s: { hazir: number; eksikli: number; uyariBekleyen: number }) => string
  zaman: {
    azOnce: string
    dakika: (n: number) => string
    saat: (n: number) => string
    dun: string
    gun: (n: number) => string
  }
  /** BCP-47 tag used to write the patient's date of birth and an old draft's date. */
  tarihYerel: string
  /** eylem_anahtar → label of the card ("ilac_ekle" → "Add medication"). */
  eylemEtiketleri: Record<string, string>
  /** alan anahtar → label of the field ("doz" → "Dose"). */
  alanEtiketleri: Record<string, string>
}
