/**
 * NOTYA-FORM-BIRLESTIR-01 — a patient's intake forms, merged from the newest to the oldest.
 *
 * A patient can fill the form more than once (a new link before a later visit). The file used to read only the
 * newest row, so a later form that left a question empty erased the earlier answer for Ayşe (allergy, chronic
 * disease, birth history). The rule here, key by key:
 *   - the newest form that ANSWERS a key wins. "Yok" / "Hayır" is an answer; missing, empty text, whitespace and an
 *     empty list are not;
 *   - a key the newest form leaves empty falls back to the next older form, and the value carries that form's date;
 *   - a detail field follows its question (BAGLI_ALAN): the allergy text is read from the form that answered the
 *     allergy question, so a newer "Bilinen alerjisi yok" is never paired with an older "Penisilin";
 *   - who filled the form (veliYakinligi → "veli beyanı" / "hasta beyanı") is the newest form's statement only.
 *
 * The merge is pure. Which rows are read (per doctor, per patient, how many) is the caller's query.
 */
import { decrypt } from '@/lib/security/encryption'

/** How many forms the file reads for one patient. */
export const BIRLESTIRILEN_FORM_SAYISI = 5

export interface FormSurumu {
  yanitlar: Record<string, unknown>
  /** The form row's date (created_at). */
  tarih: string | null
}

export interface BirlesikForm {
  yanitlar: Record<string, unknown>
  /** Keys whose value came from an OLDER form → that form's date. */
  eskiFormdan: Record<string, string | null>
  /** The newest form's date. */
  tarih: string | null
  formSayisi: number
}

/** Detail field → the question it belongs to. */
const BAGLI_ALAN: Record<string, string> = {
  alerjiAciklama: 'alerjiVarMi',
  kullanilanIlaclar: 'kullaniyorMu',
  gebelikHaftasi: 'gebelikSuphesi',
  jinekolojikHastalikDiger: 'bilinenJinekolojikHastaliklar',
  veliDigerAdSoyad: 'veliYakinligi',
}
/** Read from the newest form only — never carried over from an older one. */
const YALNIZ_EN_YENI = new Set(['veliYakinligi'])

export function yanitDoluMu(v: unknown): boolean {
  if (v == null) return false
  if (Array.isArray(v)) return v.some((x) => String(x ?? '').trim() !== '')
  return String(v).trim() !== ''
}

/** `formlar` newest first. Null when there is no form. */
export function formlariBirlestir(formlar: FormSurumu[]): BirlesikForm | null {
  if (!formlar.length) return null
  /** key → index of the form its value is read from. */
  const kaynak = new Map<string, number>()
  formlar.forEach((f, i) => {
    for (const [k, v] of Object.entries(f.yanitlar)) {
      if (kaynak.has(k) || !yanitDoluMu(v) || (i > 0 && YALNIZ_EN_YENI.has(k))) continue
      kaynak.set(k, i)
    }
  })
  const yanitlar: Record<string, unknown> = {}
  const eskiFormdan: Record<string, string | null> = {}
  for (const [k, i] of kaynak) {
    const soru = BAGLI_ALAN[k]
    const soruKaynagi = soru ? kaynak.get(soru) : undefined
    // A newer form answered the question and left the detail empty: the older detail belongs to the older answer.
    if (soruKaynagi !== undefined && soruKaynagi < i) continue
    yanitlar[k] = formlar[i].yanitlar[k]
    if (i > 0) eskiFormdan[k] = formlar[i].tarih
  }
  return { yanitlar, eskiFormdan, tarih: formlar[0].tarih, formSayisi: formlar.length }
}

/**
 * Rows of hasta_intake_formlari (newest first) → readable forms, in the same order. A row with no answers yet (link
 * sent, not filled) or one that cannot be decrypted / parsed is skipped; `okunamayan` counts the latter.
 */
export function sifreliFormlariCoz(satirlar: { form_data_encrypted?: string | null; created_at?: string | null }[] | null | undefined): { formlar: FormSurumu[]; okunamayan: number } {
  const formlar: FormSurumu[] = []
  let okunamayan = 0
  for (const s of satirlar || []) {
    if (!s?.form_data_encrypted) continue
    try {
      const y = JSON.parse(decrypt(s.form_data_encrypted)) as unknown
      if (!y || typeof y !== 'object' || Array.isArray(y)) throw new Error('form nesne değil')
      formlar.push({ yanitlar: y as Record<string, unknown>, tarih: s.created_at ?? null })
    } catch { okunamayan++ }
  }
  return { formlar, okunamayan }
}
