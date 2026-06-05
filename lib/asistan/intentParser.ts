
// ============================================================
// NOTYA ASISTAN — Intent Parser
// Classifies doctor's message into one of 8 action types
// ============================================================

export type IntentType =
  | "CREATE_PATIENT"
  | "ADD_COMPLAINT"
  | "REQUEST_DIAGNOSIS"
  | "ADD_PRESCRIPTION"
  | "GENERATE_DOCUMENT"
  | "SEARCH_PATIENT"
  | "CORRECT_PREVIOUS"
  | "GENERAL_CHAT"

export interface ParsedIntent {
  type: IntentType
  confidence: number
  extractedData: Record<string, unknown>
}

// Fast rule-based pre-classifier (no AI needed for common cases)
export function quickClassify(message: string): IntentType | null {
  const m = message.toLowerCase()

  // CREATE_PATIENT patterns
  if (m.match(/yeni hasta|hasta (ekle|oluştur|kaydı|kayıt)|yeni (kayıt|muayene)/)) return "CREATE_PATIENT"
  if (m.match(/\d+\s*(yaş|aylık|günlük).*(kadın|erkek|bayan|bay)/)) return "CREATE_PATIENT"
  if (m.match(/(kadın|erkek|bayan|bay).*\d+\s*yaş/)) return "CREATE_PATIENT"

  // ADD_COMPLAINT patterns
  if (m.match(/şikayet|belirti|semptom|başvuru nedeni/)) return "ADD_COMPLAINT"
  if (m.match(/ateş|ağrı|öksürük|kusma|ishal|baş dönmesi|nefes/)) return "ADD_COMPLAINT"

  // REQUEST_DIAGNOSIS
  if (m.match(/tanı(n)? ne|ne düşünüyorsun|ne olabilir|ayırıcı tanı|teşhis/)) return "REQUEST_DIAGNOSIS"
  if (m.match(/icd|kod (ne|yaz|ekle)/)) return "REQUEST_DIAGNOSIS"

  // ADD_PRESCRIPTION
  if (m.match(/ilaç (yaz|ekle|ver)|reçete|mg.*x.*gün|\dx\d/)) return "ADD_PRESCRIPTION"
  if (m.match(/(yaz|ekle|ver).*(tablet|kapsül|şurup|ampul|mg)/)) return "ADD_PRESCRIPTION"

  // GENERATE_DOCUMENT
  if (m.match(/sevk|rapor|mektup|belge|istirahat|doğum izni|mazeret/)) return "GENERATE_DOCUMENT"

  // SEARCH_PATIENT
  if (m.match(/hasta(yı)? (bul|ara|getir|göster)|geçen (sefer|seans|not)/)) return "SEARCH_PATIENT"
  if (m.match(/(önceki|eski|son) (not|kayıt|muayene)/)) return "SEARCH_PATIENT"

  // CORRECT_PREVIOUS
  if (m.match(/hayır|değil|yanlış|düzelt|değiştir|iptal|sil/)) return "CORRECT_PREVIOUS"

  return null // Fall back to AI classification
}

// Extract patient data from natural language
export function extractPatientData(message: string): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  // Age
  const ageMatch = message.match(/(\d+)\s*(yaş|aylık|günlük|haftalık)/)
  if (ageMatch) {
    data.age = parseInt(ageMatch[1])
    data.ageUnit = ageMatch[2]
  }

  // Gender
  if (message.match(/kadın|bayan|kız|female/i)) data.gender = "Kadın"
  else if (message.match(/erkek|bay|male/i)) data.gender = "Erkek"

  // Name — look for proper nouns after "adı" or "ismi"
  const nameMatch = message.match(/(?:adı|ismi|hastam?|)\s+([A-ZÇĞİÖŞÜa-zçğışöşü]{2,}(?:\s[A-ZÇĞİÖŞÜ][a-zçğışöşü]+)*)/i)
  if (nameMatch && !nameMatch[1].match(/^(yeni|hasta|kaydı|ekle)$/i)) {
    data.name = nameMatch[1]
  }

  // Complaint
  const complaintPatterns = [/(?:şikayeti|başvuru nedeni|sorunu)\s+(.+?)(?:\.|,|$)/i]
  for (const p of complaintPatterns) {
    const m = message.match(p)
    if (m) { data.complaint = m[1]; break }
  }

  return data
}

// Extract prescription data
export function extractPrescriptionData(message: string): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  // Drug name (first significant word)
  const drugMatch = message.match(/([A-ZÇĞİÖŞÜa-zçğışöşü]+(?:ilin|misin|metil|ofen|prazol|sartan|statin|pril)?)/i)
  if (drugMatch) data.drugName = drugMatch[1]

  // Dose - mg
  const doseMatch = message.match(/(\d+)\s*mg/)
  if (doseMatch) data.dose = doseMatch[1] + "mg"

  // Frequency - 3x1, 2x1 etc
  const freqMatch = message.match(/(\d+)\s*[xX×*]\s*(\d+)/)
  if (freqMatch) data.frequency = `${freqMatch[1]}x${freqMatch[2]}`

  // Duration - 5 gün, 1 hafta
  const durMatch = message.match(/(\d+)\s*(gün|hafta|ay)/)
  if (durMatch) data.duration = `${durMatch[1]} ${durMatch[2]}`

  return data
}
