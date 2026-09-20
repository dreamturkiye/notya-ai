// ============================================================
// NOTYA ASISTAN — Action gate (eski "executor")
// ============================================================
/**
 * NOTYA-EYLEM-24 — the old silent clinical write path, closed.
 *
 * This file used to WRITE. A model turn on `/api/asistan/chat` could emit
 * `{ "action": { "type": "ADD_PRESCRIPTION", … } }` and a prescription line, a diagnosis, a note
 * field or a whole patient row appeared in the database with no doctor tap anywhere in the flow.
 * That contradicts the locked relationship model (docs/AYSE-EYLEM-MIMARISI.md §1):
 * **Ayşe PREPARES, the hekim COMMITS. Confirm card ALWAYS, silent write NEVER.**
 *
 * So the module keeps its name and its signature — callers and the isolation suite still import
 * `executeAction` — but it no longer reaches a clinical table. It CLASSIFIES and REDIRECTS:
 *
 *   • klinik_eylem  — an equivalent exists in `core/eylemler` (dosya notu). The caller turns the
 *                     legacy payload into an `eylem_onerileri` taslak and renders EylemKarti; the
 *                     write happens in core/eylemler/onayla.ts, behind the doctor's tap, or not at all.
 *   • klinik_t3     — reçete, tanı, not onayı, silme, anything leaving the system
 *                     (core/eylemler/yasakli.ts). Never executed and never proposed: Ayşe says she
 *                     can prepare it and points at the screen where it legally belongs.
 *   • klinik_ekran  — record-writing, no eylem equivalent (hasta açma, seans açma/güncelleme —
 *                     seans açmak hasta onayını da yazıyordu). Same treatment as T3: point, do not write.
 *   • klinik_disi   — writes nothing at all. GENERATE_DOCUMENT renders a template string into the
 *                     chat; the doctor is the one who saves or sends anything.
 *
 * Conservative rule (directed): if a type's clinical status is unclear, it is clinical. There is no
 * "probably fine" branch in here — the only branch that returns `success: true` is the one that
 * touches no table.
 */

import { address, type AddressableUser } from "@/lib/address"

export type ActionType =
  | "CREATE_PATIENT"
  | "UPDATE_SESSION"
  | "ADD_NOTE_CONTENT"
  | "ADD_PRESCRIPTION"
  | "SET_DIAGNOSIS"
  | "CREATE_SESSION"
  | "GENERATE_DOCUMENT"

export interface ActionRequest {
  type: ActionType
  doctorId: string
  data: Record<string, unknown>
  doctorProfile?: AddressableUser
}

export interface ActionResult {
  success: boolean
  message: string
  data?: Record<string, unknown>
}

/** What the gate decided about a legacy action type. */
export type EylemSinifi = "klinik_eylem" | "klinik_t3" | "klinik_ekran" | "klinik_disi"

export interface EskiEylemKarari {
  sinif: EylemSinifi
  /** core/eylemler anahtarı — only for `klinik_eylem`. */
  eylemAnahtar?: string
  /** Turkish sentence Ayşe says INSTEAD of writing. Same voice as core/eylemler/istem.ts. */
  metin: string
  /** Where the doctor is pointed. `:hastaId` is substituted by the caller when it has one. */
  yol?: string
  etiket?: string
}

/**
 * The inventory. Every legacy action type is listed here exactly once; a type that is not in this
 * map is unknown and therefore clinical (see `eskiEylemKarari`). Adding a type without a row here
 * makes the guard test red rather than silently re-opening a write path.
 */
const KARARLAR: Record<ActionType, EskiEylemKarari> = {
  // ── Bir EYLEM karşılığı var: kart hazırlanır, yazmayı hekimin dokunuşu yapar ──
  ADD_NOTE_CONTENT: {
    sinif: "klinik_eylem",
    eylemAnahtar: "dosya_notu_ekle",
    metin: "Notu dosyaya ben yazmıyorum — kartını hazırladım, onaylarsanız bugünkü muayene notuna işlenir.",
  },

  // ── T3: bu yoldan ASLA (core/eylemler/yasakli.ts) ──
  ADD_PRESCRIPTION: {
    sinif: "klinik_t3",
    metin:
      "Reçeteyi bu yoldan yazamam — reçete sistemden çıkan, hukuken bağlayıcı bir işlem, onu e-Reçete ekranından siz oluşturuyorsunuz. İlacı hastanın sürekli ilaç listesine eklememi isterseniz kartını hazırlayabilirim.",
    yol: "/doktor-tools/erecete",
    etiket: "e-Reçete ekranına git",
  },
  SET_DIAGNOSIS: {
    sinif: "klinik_t3",
    metin:
      "Tanıyı dosyaya ben yazamam — tanı ve ICD kodu hekimin imzasıdır, muayene notu ekranından siz giriyorsunuz. İsterseniz ayırıcı tanıyı burada birlikte gözden geçirelim.",
    yol: "/dashboard/doktor/inceleme",
    etiket: "Muayene notuna git",
  },

  // ── Kayıt yazan, EYLEM karşılığı olmayan türler: yazmıyorum, ekranı gösteriyorum ──
  CREATE_PATIENT: {
    sinif: "klinik_ekran",
    metin:
      "Yeni hasta kaydını ben açmıyorum — hasta dosyası açmak kimlik bilgisi isteyen bir işlem, Hastalar ekranından siz açıyorsunuz. Dosya açıldıktan sonra içine kayıt hazırlamak bende.",
    yol: "/dashboard/doktor/hasta-ekle",
    etiket: "Hasta ekle ekranına git",
  },
  CREATE_SESSION: {
    sinif: "klinik_ekran",
    metin:
      "Muayeneyi ben başlatmıyorum — seans açmak hasta onayını da kaydeden bir işlem, onu siz başlatıyorsunuz.",
    yol: "/dashboard/doktor/hastalar",
    etiket: "Hasta dosyasına git",
  },
  UPDATE_SESSION: {
    sinif: "klinik_ekran",
    metin: "Muayene kaydını ben güncellemiyorum — muayene ekranından siz düzenliyorsunuz.",
    yol: "/dashboard/doktor/inceleme",
    etiket: "Muayene notuna git",
  },

  // ── Klinik dışı: hiçbir tabloya dokunmaz ──
  GENERATE_DOCUMENT: {
    sinif: "klinik_disi",
    metin: "Belge taslağını hazırladım — kaydı ve gönderimi siz yapıyorsunuz.",
  },
}

/** Every legacy type that must never produce a write on the model's say-so. */
export const KLINIK_ESKI_EYLEM_TIPLERI = (Object.keys(KARARLAR) as ActionType[])
  .filter((t) => KARARLAR[t].sinif !== "klinik_disi")
  .sort()

/** Legacy type → core/eylemler anahtarı, for the types that have an equivalent. */
export const ESKI_EYLEM_KARSILIKLARI: Readonly<Record<string, string>> = Object.fromEntries(
  (Object.keys(KARARLAR) as ActionType[])
    .filter((t) => KARARLAR[t].eylemAnahtar)
    .map((t) => [t, KARARLAR[t].eylemAnahtar as string])
)

/**
 * Classify a type coming out of a model turn. An unknown / misspelled / newly invented type is
 * treated as clinical and refused — the conservative default, deliberately.
 */
export function eskiEylemKarari(type: string, hastaId?: string | null): EskiEylemKarari {
  const k = KARARLAR[String(type || "") as ActionType]
  if (!k) {
    return {
      sinif: "klinik_ekran",
      metin: "Bunu bu yoldan yapamam — ilgili ekrandan siz yapıyorsunuz. Dosyaya kayıt hazırlamamı isterseniz söyleyin, kartını getireyim.",
    }
  }
  const yol = k.yol && hastaId && k.yol.includes(":hastaId") ? k.yol.replace(":hastaId", hastaId) : k.yol
  return { ...k, yol }
}

export function klinikEskiEylemMi(type: string): boolean {
  return eskiEylemKarari(type).sinif !== "klinik_disi"
}

/**
 * Kept for call/­test compatibility. It NEVER writes.
 *
 * A clinical type answers `success: false` plus the Turkish redirect in `message` and the decision
 * in `data`, whoever asks and whatever ids are in the payload — there is no owner check left to
 * pass, because there is no write left to guard. The only `success: true` branch renders a document
 * template, which touches nothing.
 */
export async function executeAction(
  action: ActionRequest,
  _serviceKey?: string
): Promise<ActionResult> {
  const karar = eskiEylemKarari(String(action?.type || ""))

  if (karar.sinif !== "klinik_disi") {
    return {
      success: false,
      message: karar.metin,
      data: { sinif: karar.sinif, eylemAnahtar: karar.eylemAnahtar ?? null, yol: karar.yol ?? null, etiket: karar.etiket ?? null, yazildi: false },
    }
  }

  // GENERATE_DOCUMENT — a template string handed to the chat. No table, no row, no id.
  const { type, patientName } = action.data || {}
  const referralHeader = address(action.doctorProfile || { firstName: "Meslektaşım" }, "referral")
  const templates: Record<string, string> = {
    sevk: `SEVK MEKTUBU\n\n${referralHeader},\n\n${patientName || "Hastamız"} ileri tetkik ve tedavi amacıyla kliniğinize sevk edilmektedir.\n\nSaygılarımla.`,
    istirahat: `İSTİRAHAT RAPORU\n\n${patientName || "Hasta"} ${new Date().toLocaleDateString("tr-TR")} tarihinde muayene edilmiş olup ... gün istirahat uygundur.`,
    rapor: `TIBBİ RAPOR\n\n${patientName || "Hasta"} tarafından kliniğimize başvurulmuş, muayene ve tetkikler yapılmıştır.`,
  }
  const docContent = templates[String(type)] || templates.rapor
  return { success: true, message: karar.metin, data: { document: docContent, type, yazildi: false } }
}
