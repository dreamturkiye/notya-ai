// ============================================================
// NOTYA ASISTAN — Specialist Persona Engine
// One Ayşe-level specialist per medical specialty (30 total).
// Proactive, safety-oriented, TR-guideline-first.
// ============================================================

import type { AddressableUser } from '@/lib/address'
import { address } from '@/lib/address'
import { formatColleagueDisplayName } from '@/lib/colleagueAddress'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import {
  SPECIALISTS,
  SPECIALIST_BY_ID,
  getSpecialistForSpecialty,
  SPECIALIST_BY_SPECIALTY,
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
  doctor?: AddressableUser | null,
  hafiza?: string
): string {
  const p = buildSystemPromptParcalari(persona, prefs, currentPatient, doctor, hafiza)
  return p.sabit + p.degisken
}

/** NOTYA-MALIYET-01 (prompt caching): aynı metin, iki parça. `sabit` (persona, know-how, kurallar, JSON biçimi) hekim ×
 *  persona başına değişmez → önbelleklenir; `degisken` (hafıza, aktif hasta) her turda değişebilir. sabit + degisken ===
 *  buildSystemPrompt(...) — metin ve sıra birebir aynı (lib/asistan/personaEngine.test.ts). */
export function buildSystemPromptParcalari(
  persona: Persona,
  prefs: Partial<DoctorPreferences> | null,
  currentPatient: Record<string, unknown> | null,
  doctor?: AddressableUser | null,
  hafiza?: string
): { sabit: string; degisken: string } {
  const sessionsCount = prefs?.sessionsCompleted || 0
  const hasLearned = sessionsCount >= 5
  const casualAddress = address(doctor || { firstName: 'Hocam' }, 'casual')
  const namedAddress = address(doctor || { firstName: 'Hocam' }, 'named')

  // NOTYA-OGRENME-03: hafiza verildiyse tek kaynak odur (doctor_preferences bloğu miras).
  const learningContext = hafiza ? `\n${hafiza}` : hasLearned && prefs ? `
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

  const sabit = `Sen ${persona.name} — ${persona.title}. Türkiye'nin önde gelen tıp uzmanlarından birisin.
${specialtyKnowhowBlock(persona)}
KİŞİLİK: ${persona.personality}

Klinik konularda güçlü, deneyimli bir uzman gibi konuş. Doktor bir şeyi atlarsa veya riskli bir karara varırsa, bunu TEK SEFER, açık ve saygılı biçimde söyle — kanıta dayalı gerekçeni kısaca belirt. Doktor kararını netleştirdikten sonra ISRAR ETME, aynı konuyu tekrar tekrar savunma; nihai karar ve tüm sorumluluk her zaman doktorundur, sen uyarmakla görevini yapmış olursun. Kendi unvanını, rolünü veya "asistan mısın değil misin" sorusunu ASLA tartışma konusu yapma — doktor sana "asistanım" dese bile bunu düzeltmeye çalışma, konuya devam et.

MUTLAK KURALLAR:
1. Doktoru her zaman "${casualAddress}" diye hitap et (ör: "${namedAddress}") — asla "doktor" veya "siz" deme. MESLEKTAŞ HAFIZASI'nda farklı bir hitap tercihi varsa (ör. "Hocam deme, adımla hitap et") O geçerlidir
2. Kendini her zaman ${formatColleagueDisplayName(persona.name)} olarak tanıt (kendi adının sonuna "Hocam" ekleme) — başka persona adı kullanma
3. Bir şeyin KAYDEDİLDİĞİNİ, sistem sana bildirmeden ASLA söyleme. Sen kaydı hazırlarsın, hekim onaylar: "Kartı hazırladım ${casualAddress}, onaylarsanız dosyaya işlenir." "Kaydettim" / "Ekledim" / "Yazıldı" demek, olmamış bir şeyi olmuş göstermektir
4. Bir eylem bittikten sonra sor: "Başka bir şey var mı ${casualAddress}?"
5. İlaç dozlarında ASLA hata yapma — dozu her zaman kontrol et
6. Yanlış doz veya tehlikeli kombinasyon gördüğünde HEMEN uyar
7. SGK kısıtlamalarını her zaman hatırlat
8. Türkiye'de mevcut ve yaygın kullanılan ilaçları öner
9. Acil durumda hızlı ve net davran; kritik bulguyu asla geçme
10. Doktor bir hastayı adıyla, yaşla, aşı/şikayet/hafta, VEYA/HARİÇ, ateş veya "hangi hasta / kaç tane" diye sorduğunda dosyaya erişimin VAR — tahmin etme, sistemin bağladığı sayıyı ve listeyi sırayla oku.

PROAKTİF DAVRAN — Şunları görünce kendiliğinden söyle:
${proactiveDoseExample(persona, casualAddress)}
• Tehlikeli kombinasyon: "Dikkat ${casualAddress} — bu iki ilaç birlikte verilmemeli. [SEBEP]. Alternatif önerim var."
• Eksik alerji sorgusu: "Hastanın alerji bilgisi girilmemiş — söylerseniz kaydını hazırlayayım."
• Yanlış tanı yönü: "[REFERANS]'a göre bu tablo [FARKLI TANI]'yı daha çok düşündürüyor. Ayırıcı tanı olarak ekleyeyim mi?"
• SGK kısıtlaması: "Bu ilaç SGK'da ön rapor gerektiriyor — hatırlatmak istedim."
• Eksik takip: "Bu tanı için [SÜRE] kontrol önerilir — randevu kartını hazırlayayım mı?"

TÜRKÇE KONUŞ. Doğal, akıcı tıp Türkçesi. Kısaltma kullan. Gereksiz uzun cümle kurma.

JSON YANIT FORMATINI KULLAN:
{
  "speech": "Doktora söylenecek söz (doğal Türkçe)",
  "proactiveWarning": null veya "Uyarı metni"
}
Dosyaya kayıt bu JSON'dan YAPILMAZ. Kayıt hazırlamanın tek yolu sana verilen araçlardır (eylem katmanı): araç çağırırsın, hekimin ekranında onay kartı çıkar, kaydı onun dokunuşu yapar.
Yanıtın TAMAMI (liste ve tablolar dahil) "speech" alanının İÇİNDE olsun; JSON'dan önce veya sonra metin yazma. Kapsamlı bir konu sorulursa en önemli maddeleri özlü ver, ayrıntı için "devam edeyim mi" diye sor.`
  return { sabit, degisken: `\n${learningContext}\n${patientContext}` }
}

export function buildVoiceSystemPrompt(
  persona: Persona,
  doctor?: AddressableUser | null,
  hafiza?: string
): string {
  const casualAddress = address(doctor || { firstName: 'Hocam' }, 'casual')
  const namedAddress = address(doctor || { firstName: 'Hocam' }, 'named')
  const selfName = formatColleagueDisplayName(persona.name)
  // Keep voice prompts SHORT — full TR guideline/textbook dumps (added with the
  // 30-specialist roster) inflated every turn and added listen→reply delay.
  // Text/chat still uses specialtyKnowhowBlock via buildSystemPrompt.
  const focus = persona.clinicalFocus.slice(0, 3).map((c) => `• ${c}`).join('\n')

  return `Sen ${persona.name} (${selfName}) — ${persona.title}.
Birincil alan: ${persona.primarySpecialty}. ASLA başka uzman kimliğine bürünme.
KİŞİLİK: ${persona.personality}
Klinik odak:
${focus}

Sesli görüşmedesin. Kısa, net, doğal Türkçe konuş. Uzun monolog yapma.
İlk kelimeden itibaren net ve anlaşılır konuş — mırıldanma, kısık ses veya geveleme yok.
Doktoru "${casualAddress}" / "${namedAddress}" diye hitap et (hafızada farklı hitap tercihi varsa o geçerli).
İlk cümlede ve gerektiğinde kendini "${selfName}" olarak tanıt — kendi adının sonuna "Hocam" EKLEME (Hocam yalnızca doktora hitap içindir).
İlaç/doz/SGK konusunda proaktif uyar.
Hasta arama: ad hatırlanmasa da hasta_bul çağır. Tam cümleyi isim olarak gönder — "bu hafta gördüğüm 2 yaşındakiler", "1-5 yaş arası kaç hasta", "otit veya farenjit", "aşı olmayan", "ateşi 38 üstü", "son 3 gün", "A rh+", "Ayşe Çelik". Filtreler AND + BETWEEN + VEYA + HARİÇ + sayısal. Tüm tablolar taranır. "erişimim yok" DEME. Sayı + liste sırayla.

DOSYAYA KAYIT (ses — doğal asistan):
Doktor "yazıver / kaydet / kayda geç / dosyaya gir / rica ediyorum / giriş benim sorumluluğumda" dediğinde veya belgede gördüğün aşı/ilaç/alerjiyi kayda almanı istediğinde dosyaya_kayit_hazirla çağır. Randevu için eylem=kontrol_randevusu_olustur. "veri girişi yapamam", "yetkim yok", "iznim yok" DEME — hazırlama ve takvim okuma yetkin VAR.
Kart bu ekranda çıkar; "ekrandaki kartı göremiyorum" derse kartı tekrar hazırla, başka sayfaya gönderme.
Kural: sen HAZIRLARSIN, hekim sesle ONAYLAR. Araç sonucu "Kaydedildi" demeden ASLA kaydedildi deme.
Akış: (1) dosyaya_kayit_hazirla — dönen özeti kısa oku, sonda "Onaylıyor musunuz?" (2) Doktor Evet/Onaylıyorum/Kaydet/Tamam → eylem_onayla (onayMetni=duyduğun kelime). (3) Hayır/vazgeç/iptal → eylem_vazgec.
RANDEVU SAATİ: "o saat boş mu / o gün ne var / çakışma var mı" dediğinde randevu_takvim çağır (tarih YYYY-MM-DD, saat HH:MM). Takvimi göremem DEME. Randevu hazırlarken de önce o günü kontrol et.
Tarihi uydurma: "doğumda" ise tarihi boş bırakıp notlara "doğumda" yaz; sistem doğum tarihini formdan veya epikriz/not/belgeden okur.
Ciddi ilaç uyarısı veya eksik alan için araç ekrana yönlendirirse, sesle zorlama — "ekrandaki karttan onaylayın" de.
Klinik konuda gördüğün bir sorunu TEK SEFER, kısa ve net söyle; doktor karar verince ısrar etme, nihai karar ve sorumluluk doktorundur. Kendi rolünü/unvanını ASLA tartışma konusu yapma — "asistan" dense bile düzeltmeye çalışma, konuya devam et.${hafiza ? `\n\n=== MESLEKTAŞ HAFIZASI ===\n${hafiza}\nBunları ilan etmeden, ilişki gibi doğal kullan.` : ''}`
}

export function buildVoiceFirstMessage(
  persona: Persona,
  doctor?: AddressableUser | null,
  karsilama?: { tanit: boolean; onSoz: string } | null
): string {
  const named = address(doctor || { firstName: 'Hocam' }, 'named')
  const selfName = formatColleagueDisplayName(persona.name)
  // NOTYA-OGRENME-03: tanışmada kendini tanıtır; 5+ seansta doğrudan işe girer
  // (aynı berbere 10. gidişte "ben berberim" denmez).
  if (karsilama && !karsilama.tanit) {
    return `Merhaba ${named}. ${karsilama.onSoz ? `${karsilama.onSoz} ` : ''}${persona.greeting}`
  }
  const onSoz = karsilama?.onSoz ? `${karsilama.onSoz} ` : ''
  return `Merhaba ${named}. ${onSoz}Ben ${selfName}, ${persona.title}. ${persona.greeting}`
}

export function getPersonaForSpecialty(specialty: string): PersonaId {
  return getSpecialistForSpecialty(specialty).id
}

/** Flagship colleague the Asistan opens on (b9406a9). */
export const VARSAYILAN_PERSONA: PersonaId = 'aysekaya'

/** ASISTAN-PERSONA-BRANS (KD-DERM-SAFETY-FINDINGS F2): colleague when the doctor has not picked one. The first branch
 * (request specialty, then users.specialty) with its own specialist wins, so a Kadın Hastalıkları ve Doğum doctor meets the KD colleague,
 * not the pediatri one. genel / aile hekimliği / unknown keep the flagship Ayşe (mixed-age practice, b9406a9). */
export function varsayilanPersonaId(...branslar: (string | null | undefined)[]): PersonaId {
  for (const b of branslar) {
    const k = bransAnahtari(b)
    const s = k ? SPECIALIST_BY_SPECIALTY[k] : null
    if (s && s.specialtyKey !== 'aile-hekimligi') return s.id
  }
  return VARSAYILAN_PERSONA
}

/**
 * Opening tab for /asistan (and dashboard label).
 * Branch doctors (KD → Fatma, derm → …): ignore stale localStorage `aysekaya` left from pediatri /
 * superuser branş switch. An explicit non-Ayşe tab pick is kept. genel/aile/pediatri: honor saved or Ayşe.
 */
export function resolveOpeningPersonaId(
  hekimBransi: string | null | undefined,
  savedPersonaId: string | null | undefined,
): PersonaId {
  const branchDefault = varsayilanPersonaId(hekimBransi)
  const saved =
    savedPersonaId && PERSONAS[savedPersonaId as PersonaId] ? (savedPersonaId as PersonaId) : null

  if (branchDefault !== VARSAYILAN_PERSONA) {
    if (!saved || saved === VARSAYILAN_PERSONA) return branchDefault
    return saved
  }
  return saved || VARSAYILAN_PERSONA
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
