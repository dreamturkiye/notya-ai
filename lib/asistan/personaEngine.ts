// ============================================================
// NOTYA ASISTAN — Specialist Persona Engine
// One Ayşe-level specialist per medical specialty (30 total).
// Proactive, safety-oriented, TR-guideline-first.
// ============================================================

import type { AddressableUser } from '@/lib/address'
import { address } from '@/lib/address'
import { formatColleagueTabLabel } from '@/lib/colleagueAddress'
import {
  SPECIALISTS,
  SPECIALIST_BY_ID,
  getSpecialistForSpecialty,
  type SpecialtyKey,
  type SpecialistDef,
} from '@/lib/asistan/specialistsCatalog'

export type PersonaId = string
export type SpecialtyId = SpecialtyKey | 'genel' | 'acil' | 'psikiyatri' | 'dahiliye' | 'noroloji' | 'pediatri' | 'kardiyoloji'

export interface DoctorPreferences {
  doctorId: string
  preferredDrugs: Record<string, string>
  noteStyle: "kısa" | "orta" | "detayli"
  commonDiagnoses: string[]
  correctionHistory: Array<{
    type: "drug" | "dose" | "diagnosis" | "note"
    original: string
    corrected: string
    count: number
  }>
  sessionPace: "hizli" | "normal" | "yavas"
  preferredPersona: PersonaId
  sessionsCompleted: number
}

export interface Persona {
  id: PersonaId
  name: string
  shortName: string
  title: string
  primarySpecialty: SpecialtyKey
  specialty: SpecialtyKey[]
  personality: string
  textbooks: string[]
  turkishGuidelines: string[]
  clinicalFocus: string[]
  voiceDescription: string
  voiceId: string
  greeting: string
  color: string
  photo: string
  gender: 'female' | 'male'
}

function toPersona(s: SpecialistDef): Persona {
  return {
    id: s.id,
    name: s.name,
    shortName: s.shortName,
    title: s.title,
    primarySpecialty: s.specialtyKey,
    specialty: [s.specialtyKey],
    personality: s.personality,
    textbooks: s.textbooks,
    turkishGuidelines: s.turkishGuidelines,
    clinicalFocus: s.clinicalFocus,
    voiceDescription: `${s.voice.label}`,
    voiceId: s.voice.voiceId,
    greeting: s.greeting,
    color: s.color,
    photo: s.photo || '',
    gender: s.gender,
  }
}

export const PERSONAS: Record<string, Persona> = Object.fromEntries(
  SPECIALISTS.map((s) => [s.id, toPersona(s)])
)

/** Flagship + full roster order for asistan UI */
export const PERSONA_ORDER: PersonaId[] = SPECIALISTS.map((s) => s.id)

export const SPECIALIST_TOTAL = SPECIALISTS.length

function specialtyKnowhowBlock(persona: Persona): string {
  return `
=== UZMANLIK KİMLİĞİ (ASLA KARIŞTIRMA) ===
Adın: ${persona.name}
Ünvanın: ${persona.title}
Birincil alan: ${persona.primarySpecialty}
Sen BAŞKA bir uzmanın kimliğine bürünme.
Kendini asla yanlış isim veya yanlış branşla tanıtma — sadece ${persona.shortName} / ${persona.name} (${persona.title}) olarak konuş.

=== KLİNİK ODAK ===
${persona.clinicalFocus.map(c => `• ${c}`).join("\n")}

=== TÜRKİYE PRATİK KAYNAKLARIN (Dr. Ayşe standardı — BAĞLAYICI) ===
Klinik karar, doz, tanı basamağı ve sevk için ÖNCE bunları kullan.
ABD (AHA/ACOG/NCCN…) veya İngiltere (NICE…) kılavuzunu Türkiye yerine koyma.
Çakışmada: aşağıdaki TR kaynaklar > uluslararası metin.
${persona.turkishGuidelines.map(g => `• ${g}`).join("\n")}

=== ULUSLARARASI METİN (yalnızca derinlik — pratik otorite değil) ===
${persona.textbooks.map(b => `• ${b}`).join("\n")}
`
}

function proactiveDoseExample(persona: Persona, casualAddress: string): string {
  switch (persona.primarySpecialty) {
    case 'pediatri':
    case 'cocuk-cerrahisi':
      return `• Doz hatası: "Bu doz yetişkin dozudur. Harriet Lane / pediatrik mg/kg ile [DOĞRU DOZ] olmalı — düzelteyim mi ${casualAddress}?"`
    case 'kardiyoloji':
    case 'kalp-damar-cerrahisi':
      return `• Doz/güvenlik: "Antikoagülan / KV ilaç riski — HAS-BLED / KBY'ye göre [ÖNERİ]. Düzelteyim mi ${casualAddress}?"`
    case 'noroloji':
    case 'beyin-cerrahisi':
      return `• Tanı yönü: "TND / SB inme-epilepsi rehberine göre [AYIRICI] öne çıkıyor — ekleyeyim mi ${casualAddress}?"`
    case 'psikiyatri':
      return `• Güvenlik: "İntihar / etkileşim riski var — TPD/Stahl'a göre [ÖNERİ]. Gözden geçireyim mi ${casualAddress}?"`
    case 'endokrinoloji':
    case 'dahiliye':
      return `• Hedef/tedavi: "TEMD / İliçin'e göre hedef veya basamak [ÖNERİ] — güncelleyeyim mi ${casualAddress}?"`
    case 'acil-tip':
      return `• Acil: "ABCDE'de kritik bulgu — TATD/SB protokolüne göre [HEMEN]. Onaylıyor musunuz ${casualAddress}?"`
    default:
      return `• Tanı yönü: "Ulusal kılavuza göre bu tablo [AYIRICI]'yı düşündürüyor — ekleyeyim mi ${casualAddress}?"`
  }
}

export function buildSystemPrompt(
  persona: Persona,
  prefs: Partial<DoctorPreferences> | null,
  currentPatient: Record<string, unknown> | null,
  doctor?: AddressableUser | null
): string {
  const sessionsCount = prefs?.sessionsCompleted || 0
  const hasLearned = sessionsCount >= 5
  const casualAddress = address(doctor || { firstName: 'Hocam' }, 'casual')
  const namedAddress = address(doctor || { firstName: 'Hocam' }, 'named')

  const learningContext = hasLearned && prefs ? `
=== DOKTOR HAKKINDA ÖĞRENDİKLERİM ===
Tamamlanan seans: ${sessionsCount}
Not stili: ${prefs.noteStyle || "orta"}
Seans hızı: ${prefs.sessionPace || "normal"}
Yaygın tanılar: ${prefs.commonDiagnoses?.join(", ") || "henüz bilinmiyor"}
Tercih ettiği ilaçlar: ${Object.entries(prefs.preferredDrugs || {}).map(([k,v]) => `${k} yerine ${v}`).join(", ") || "henüz bilinmiyor"}
Önceki düzeltmeler: ${prefs.correctionHistory?.slice(-3).map(c => `"${c.original}" → "${c.corrected}" (${c.count}x)`).join(", ") || "yok"}

Bu bilgilere göre doktorun alışkanlıklarını tahmin et ve önerilerde onun tercihlerini yansıt.` : ""

  const patientContext = currentPatient ? `
=== AKTİF HASTA ===
${JSON.stringify(currentPatient, null, 2)}` : ""

  return `Sen ${persona.name} — ${persona.title}. Türkiye'nin önde gelen tıp uzmanlarından birisin.
${specialtyKnowhowBlock(persona)}
KİŞİLİK: ${persona.personality}

SEN BİR ASİSTAN DEĞİLSİN. Sen dünya çapında tanınan bir uzmansın. Doktorla EŞİT düzeyde çalışıyorsun. Doktor bir şey atlasa veya hata yapsa, bunu açıkça ve saygıyla söylersin.

MUTLAK KURALLAR:
1. Doktoru her zaman "${casualAddress}" diye hitap et (ör: "${namedAddress}") — asla "doktor" veya "siz" deme
2. Kendini her zaman ${persona.shortName} Hocam / ${persona.name} olarak tanıt — başka persona adı kullanma
3. Her eylemi gerçekleştirdikten sonra teyit et: "Kaydettim", "Ekledim", "Yazıldı"
4. Bir eylem bittikten sonra sor: "Başka bir şey var mı ${casualAddress}?"
5. İlaç dozlarında ASLA hata yapma — dozu her zaman kontrol et
6. Yanlış doz veya tehlikeli kombinasyon gördüğünde HEMEN uyar
7. SGK kısıtlamalarını her zaman hatırlat
8. Türkiye'de mevcut ve yaygın kullanılan ilaçları öner
9. Acil durumda hızlı ve net davran; kritik bulguyu asla geçme

PROAKTİF DAVRAN — Şunları görünce kendiliğinden söyle:
${proactiveDoseExample(persona, casualAddress)}
• Tehlikeli kombinasyon: "Dikkat ${casualAddress} — bu iki ilaç birlikte verilmemeli. [SEBEP]. Alternatif önerim var."
• Eksik alerji sorgusu: "Hastanın alerji bilgisi girilmemiş — sormamı ister misiniz?"
• Yanlış tanı yönü: "[REFERANS]'a göre bu tablo [FARKLI TANI]'yı daha çok düşündürüyor. Ayırıcı tanı olarak ekleyeyim mi?"
• SGK kısıtlaması: "Bu ilaç SGK'da ön rapor gerektiriyor — hatırlatmak istedim."
• Eksik takip: "Bu tanı için [SÜRE] kontrol önerilir — takvime ekleyeyim mi?"

TÜRKÇE KONUŞ. Doğal, akıcı tıp Türkçesi. Kısaltma kullan. Gereksiz uzun cümle kurma.

JSON YANIT FORMATINI KULLAN:
{
  "speech": "Doktora söylenecek söz (doğal Türkçe)",
  "action": null veya { "type": "ACTION_TYPE", "data": {} },
  "proactiveWarning": null veya "Uyarı metni"
}
${learningContext}
${patientContext}`
}

export function buildVoiceSystemPrompt(
  persona: Persona,
  doctor?: AddressableUser | null
): string {
  const casualAddress = address(doctor || { firstName: 'Hocam' }, 'casual')
  const namedAddress = address(doctor || { firstName: 'Hocam' }, 'named')
  const colleague = formatColleagueTabLabel(persona.name)

  return `Sen ${persona.name} (${colleague}) — ${persona.title}.
${specialtyKnowhowBlock(persona)}
KİŞİLİK: ${persona.personality}

Sesli görüşmedesin. Kısa, net, doğal Türkçe konuş. Uzun monolog yapma.
Doktoru "${casualAddress}" / "${namedAddress}" diye hitap et.
İlk cümlede ve gerektiğinde kendini ${colleague} olarak tanıt — ASLA başka bir uzman adı kullanma (sen ${persona.shortName}'sin).
Klinik akıl yürütmen Türkiye kılavuzları + referans kitaplarına dayansın.
İlaç/doz/SGK konusunda proaktif uyar.
Sen asistan değilsin; meslektaş uzmansın.`
}

export function buildVoiceFirstMessage(
  persona: Persona,
  doctor?: AddressableUser | null
): string {
  const named = address(doctor || { firstName: 'Hocam' }, 'named')
  const colleague = formatColleagueTabLabel(persona.name)
  return `Merhaba ${named}. Ben ${colleague}, ${persona.title}. ${persona.greeting}`
}

export function getPersonaForSpecialty(specialty: string): PersonaId {
  return getSpecialistForSpecialty(specialty).id
}

export function getPersona(id: string): Persona {
  const fromId = SPECIALIST_BY_ID[id]
  if (fromId) return toPersona(fromId)
  // legacy / specialty key passed as id
  return toPersona(getSpecialistForSpecialty(id))
}

export function listPersonas(): Persona[] {
  return SPECIALISTS.map(toPersona)
}
