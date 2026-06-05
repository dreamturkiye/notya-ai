// ============================================================
// NOTYA AI - Yapay Zeka Not Üretici
// Tüm Meslekler için Claude API Entegrasyonu
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import type { 
  GeneratedNote, SessionContext, TranscriptSegment, MedicalSpecialty 
} from '@/types/notya'
import { getSpecialtyTemplate } from './specialtyTemplates'
import { getProfessionTemplate } from './professionTemplates'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ============================================================
// TIP ALANLARI - KLİNİK NOT ÜRETİCİ
// ============================================================

export async function generateMedicalNote(
  transcript: string,
  context: SessionContext
): Promise<GeneratedNote> {
  const template = getSpecialtyTemplate(context.specialty)
  
  const systemPrompt = `${template.systemPrompt}

Hasta Bağlamı:
- Yaş: ${context.patient_age || 'Bilinmiyor'}
- Cinsiyet: ${context.patient_gender || 'Bilinmiyor'}
- Önceki Tanılar: ${context.previous_diagnoses?.join(', ') || 'Yok'}
- Mevcut İlaçlar: ${context.current_medications?.join(', ') || 'Yok'}
- Alerjiler: ${context.allergies?.join(', ') || 'Yok'}

GÖREV: Transkripti analiz et ve aşağıdaki JSON yapısını döndür. Başka hiçbir şey yazma.

{
  "soap": {
    "subjektif": "Hastanın şikayetleri ve anamnez",
    "objektif": "Fizik muayene bulguları ve vital bulgular",
    "degerlendirme": "Tanı ve değerlendirme",
    "plan": "Tedavi planı ve talimatlar"
  },
  "anamnez": "Detaylı anamnez",
  "fizik_muayene": "Sistemik fizik muayene bulguları",
  "tani": "Ön tanı ve ayırıcı tanılar",
  "tedavi": "Tedavi planı detayları",
  "ilaclar": [
    {"ad": "İlaç adı", "doz": "Doz", "kullanim": "Günde Nx", "sure": "X gün", "aciklama": ""}
  ],
  "lab_istekleri": [
    {"test_adi": "Test adı", "acil": false, "aciklama": ""}
  ],
  "goruntulemeler": [
    {"tur": "BT/MR/Röntgen/USG", "bolge": "Bölge", "acil": false, "aciklama": ""}
  ],
  "icd10_codes": [
    {"code": "X00.0", "description": "Description", "description_tr": "Türkçe açıklama", "is_primary": true}
  ],
  "kritik_bulgular": ["Acil dikkat gerektiren bulgular varsa"],
  "takip_suresi": "X gün/hafta/ay sonra kontrol",
  "ai_confidence": 0.95
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    temperature: 0.1,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Muayene transkripti:\n\n${transcript}`
      }
    ]
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Beklenmeyen AI yanıt tipi')
  
  try {
    const cleanJson = content.text.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleanJson)
  } catch {
    throw new Error('AI yanıtı parse edilemedi: ' + content.text.slice(0, 200))
  }
}

// ============================================================
// AVUKAT - HUKUKİ NOT ÜRETİCİ
// ============================================================

export interface LegalNote {
  dosya_ozeti: string
  musteri_talepleri: string
  hukuki_sorunlar: string[]
  ilgili_mevzuat: string[]
  deliller: string[]
  strateji_onerileri: string
  yapilacaklar: ActionItem[]
  gecmis_tarihce: string
  sonraki_adimlar: string
  gizlilik_notu: string
  ai_confidence: number
}

export interface ActionItem {
  gorev: string
  sorumlu: string
  son_tarih?: string
  oncelik: 'yüksek' | 'orta' | 'düşük'
}

export async function generateLegalNote(
  transcript: string,
  legalArea: string,
  context: { client_name?: string; case_number?: string; opposing_party?: string }
): Promise<LegalNote> {
  const systemPrompt = `Sen deneyimli bir Türk avukatının asistanısın. ${legalArea} alanında uzmanlaşmış bir hukuki not asistanısın.

Türk Hukuku kurallarına göre not oluştur:
- Türk Medeni Kanunu
- Türk Borçlar Kanunu
- Hukuk Muhakemeleri Kanunu
- Türk Ceza Kanunu (gerekirse)
- İlgili özel mevzuat

MÜVEKKİL BİLGİLERİ:
- Müvekkil: ${context.client_name || 'Belirtilmemiş'}
- Dosya No: ${context.case_number || 'Yeni dosya'}
- Karşı Taraf: ${context.opposing_party || 'Belirtilmemiş'}

Avukat-müvekkil görüşmesini analiz et ve JSON döndür. Başka hiçbir şey yazma.

{
  "dosya_ozeti": "Dava/mesele özeti",
  "musteri_talepleri": "Müvekkil talep ve beklentileri",
  "hukuki_sorunlar": ["Tespit edilen hukuki sorunlar"],
  "ilgili_mevzuat": ["Uygulanabilir kanun maddeleri"],
  "deliller": ["Sunulan veya istenecek deliller"],
  "strateji_onerileri": "Hukuki strateji önerisi",
  "yapilacaklar": [
    {"gorev": "Yapılacak iş", "sorumlu": "Avukat/Müvekkil", "son_tarih": "GG.AA.YYYY", "oncelik": "yüksek"}
  ],
  "gecmis_tarihce": "Önemli tarihler ve olaylar kronolojisi",
  "sonraki_adimlar": "Bir sonraki aşama açıklaması",
  "gizlilik_notu": "Dikkat edilmesi gereken gizlilik hususları",
  "ai_confidence": 0.92
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    temperature: 0.1,
    system: systemPrompt,
    messages: [{ role: 'user', content: `Müvekkil görüşmesi transkripti:\n\n${transcript}` }]
  })

  const text = (response.content[0] as { text: string }).text
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
}

// ============================================================
// PSİKOLOG/TERAPİST - SEANS NOTU ÜRETİCİ
// ============================================================

export interface TherapyNote {
  seans_ozeti: string
  baskın_temalar: string[]
  duygusal_durum: string
  bilis_kaliplari: string[]
  mudahaleler: string[]
  hasta_tepkileri: string
  ilerleme_degerlendirmesi: string
  risk_degerlendirmesi: {
    intihar_riski: 'düşük' | 'orta' | 'yüksek' | 'belirsiz'
    kendine_zarar_riski: 'düşük' | 'orta' | 'yüksek' | 'belirsiz'
    aciklama: string
  }
  ev_odevi: string[]
  sonraki_seans_plani: string
  gizli_notlar: string
  ai_confidence: number
}

export async function generateTherapyNote(
  transcript: string,
  therapyType: string,
  context: { session_number?: number; diagnosis?: string; treatment_goals?: string[] }
): Promise<TherapyNote> {
  const systemPrompt = `Sen deneyimli bir Türk psikologunun/terapistinin klinik not asistanısın. ${therapyType} uzmanlık alanında çalışıyorsun.

Türk Psikologlar Derneği etik kuralları ve gizlilik standartlarına uygun not oluştur.

SEANS BİLGİLERİ:
- Seans No: ${context.session_number || 'Belirtilmemiş'}
- Tanı: ${context.diagnosis || 'Değerlendirme aşamasında'}
- Tedavi Hedefleri: ${context.treatment_goals?.join(', ') || 'Belirleniyor'}

ÖNEMLİ: Risk değerlendirmesi her seansta yapılmalıdır.

Seans transkriptini analiz et ve JSON döndür. Başka hiçbir şey yazma.

{
  "seans_ozeti": "Seansın genel özeti",
  "baskın_temalar": ["Seansta öne çıkan temalar"],
  "duygusal_durum": "Hastanın duygusal durumu",
  "bilis_kaliplari": ["Tespit edilen bilişsel kalıplar veya çarpıtmalar"],
  "mudahaleler": ["Kullanılan terapötik müdahaleler"],
  "hasta_tepkileri": "Müdahalelere hastanın tepkileri",
  "ilerleme_degerlendirmesi": "Tedavi hedeflerine göre ilerleme",
  "risk_degerlendirmesi": {
    "intihar_riski": "düşük",
    "kendine_zarar_riski": "düşük",
    "aciklama": "Risk değerlendirmesi açıklaması"
  },
  "ev_odevi": ["Seans arası yapılacak çalışmalar"],
  "sonraki_seans_plani": "Bir sonraki seans için plan",
  "gizli_notlar": "Terapistin gizli klinik notları",
  "ai_confidence": 0.90
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    temperature: 0.1,
    system: systemPrompt,
    messages: [{ role: 'user', content: `Terapi seansı transkripti:\n\n${transcript}` }]
  })

  const text = (response.content[0] as { text: string }).text
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
}

// ============================================================
// MUHASEBECİ - MÜŞTERİ GÖRÜŞME NOTU
// ============================================================

export interface AccountingNote {
  musteri_ozeti: string
  mali_durum: string
  vergi_konulari: string[]
  uyum_gereksinimleri: string[]
  tespit_edilen_sorunlar: string[]
  oneriler: string[]
  yapilacaklar: ActionItem[]
  onemli_tarihler: Array<{ tarih: string; konu: string }>
  risk_uyarilari: string[]
  ai_confidence: number
}

export async function generateAccountingNote(
  transcript: string,
  serviceType: string,
  context: { company_name?: string; tax_period?: string; company_type?: string }
): Promise<AccountingNote> {
  const systemPrompt = `Sen deneyimli bir Türk mali müşavirim (SMMM/YMM). ${serviceType} alanında uzmanlaşmışsın.

Türk vergi mevzuatına göre not oluştur:
- Vergi Usul Kanunu (VUK)
- Kurumlar Vergisi Kanunu
- Katma Değer Vergisi Kanunu
- Türk Ticaret Kanunu
- SGK mevzuatı

MÜŞTERİ BİLGİLERİ:
- Şirket: ${context.company_name || 'Belirtilmemiş'}
- Dönem: ${context.tax_period || 'Güncel dönem'}
- Şirket Türü: ${context.company_type || 'Belirtilmemiş'}

Görüşme transkriptini analiz et ve JSON döndür. Başka hiçbir şey yazma.

{
  "musteri_ozeti": "Müşteri ve görüşme özeti",
  "mali_durum": "Mevcut mali durum değerlendirmesi",
  "vergi_konulari": ["Ele alınan vergi konuları"],
  "uyum_gereksinimleri": ["Yasal uyum gereksinimleri"],
  "tespit_edilen_sorunlar": ["Tespit edilen mali/vergisel sorunlar"],
  "oneriler": ["Önerilen çözümler ve optimizasyonlar"],
  "yapilacaklar": [
    {"gorev": "Yapılacak iş", "sorumlu": "Müşavir/Müşteri", "son_tarih": "GG.AA.YYYY", "oncelik": "yüksek"}
  ],
  "onemli_tarihler": [
    {"tarih": "GG.AA.YYYY", "konu": "Beyanname tarihi vb."}
  ],
  "risk_uyarilari": ["Vergisel risk uyarıları"],
  "ai_confidence": 0.93
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    temperature: 0.1,
    system: systemPrompt,
    messages: [{ role: 'user', content: `Müşteri görüşmesi transkripti:\n\n${transcript}` }]
  })

  const text = (response.content[0] as { text: string }).text
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
}

// ============================================================
// İNSAN KAYNAKLARI - GÖRÜŞME NOTU
// ============================================================

export interface HRNote {
  gorusme_turu: string
  calisan_ozeti: string
  performans_degerlendirmesi?: string
  tespit_edilen_sorunlar: string[]
  calisan_gorus_ve_talepleri: string
  yonetici_degerlendirmesi: string
  aksiyon_plani: ActionItem[]
  gelisim_onerileri: string[]
  hr_ozel_notlar: string
  takip_tarihi?: string
  ai_confidence: number
}

export async function generateHRNote(
  transcript: string,
  meetingType: string,
  context: { employee_name?: string; department?: string; manager?: string }
): Promise<HRNote> {
  const systemPrompt = `Sen deneyimli bir İnsan Kaynakları uzmanısın. ${meetingType} türü görüşme notları oluşturuyorsun.

Türk İş Kanunu ve işyeri gizliliği standartlarına uygun not oluştur.

GÖRÜŞME BİLGİLERİ:
- Çalışan: ${context.employee_name || 'Belirtilmemiş'}
- Departman: ${context.department || 'Belirtilmemiş'}
- Yönetici: ${context.manager || 'Belirtilmemiş'}

Görüşme transkriptini analiz et ve JSON döndür. Başka hiçbir şey yazma.

{
  "gorusme_turu": "${meetingType}",
  "calisan_ozeti": "Çalışan ve görüşme özeti",
  "performans_degerlendirmesi": "Performans değerlendirme notu (varsa)",
  "tespit_edilen_sorunlar": ["Tespit edilen sorunlar veya endişeler"],
  "calisan_gorus_ve_talepleri": "Çalışanın görüş ve talepleri",
  "yonetici_degerlendirmesi": "Yönetici değerlendirmesi",
  "aksiyon_plani": [
    {"gorev": "Yapılacak iş", "sorumlu": "İK/Yönetici/Çalışan", "son_tarih": "GG.AA.YYYY", "oncelik": "yüksek"}
  ],
  "gelisim_onerileri": ["Kariyer ve gelişim önerileri"],
  "hr_ozel_notlar": "İK gizli notları",
  "takip_tarihi": "GG.AA.YYYY",
  "ai_confidence": 0.91
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    temperature: 0.1,
    system: systemPrompt,
    messages: [{ role: 'user', content: `Görüşme transkripti:\n\n${transcript}` }]
  })

  const text = (response.content[0] as { text: string }).text
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
}

// ============================================================
// EMLAKÇI - MÜŞTERİ GÖRÜŞME NOTU
// ============================================================

export interface RealEstateNote {
  musteri_profili: string
  talep_ozeti: string
  butce: string
  aranan_ozellikler: string[]
  tercih_edilen_bolgeler: string[]
  gorulen_mulkler: Array<{ adres: string; fiyat: string; izlenim: string }>
  musteri_karari: string
  sonraki_adimlar: ActionItem[]
  notlar: string
  ai_confidence: number
}

export async function generateRealEstateNote(
  transcript: string,
  context: { client_name?: string; transaction_type?: 'alım' | 'satım' | 'kiralama' }
): Promise<RealEstateNote> {
  const systemPrompt = `Sen deneyimli bir Türk emlak danışmanısın. Müşteri görüşmelerini profesyonel notlara dönüştürüyorsun.

Türk Tapu ve Kadastro mevzuatı, Konut Finansmanı Kanunu ve emlak sektörü pratiklerine uygun not oluştur.

MÜŞTERİ: ${context.client_name || 'Belirtilmemiş'}
İŞLEM TÜRÜ: ${context.transaction_type || 'Belirtilmemiş'}

Görüşme transkriptini analiz et ve JSON döndür. Başka hiçbir şey yazma.

{
  "musteri_profili": "Müşteri profili ve ihtiyaç özeti",
  "talep_ozeti": "Mülk talep özeti",
  "butce": "Bütçe aralığı",
  "aranan_ozellikler": ["İstenen mülk özellikleri"],
  "tercih_edilen_bolgeler": ["Tercih edilen mahalle/semt/ilçe"],
  "gorulen_mulkler": [
    {"adres": "Adres", "fiyat": "Fiyat", "izlenim": "Müşteri izlenimi"}
  ],
  "musteri_karari": "Müşterinin kararı veya tereddütleri",
  "sonraki_adimlar": [
    {"gorev": "Yapılacak iş", "sorumlu": "Danışman/Müşteri", "son_tarih": "GG.AA.YYYY", "oncelik": "yüksek"}
  ],
  "notlar": "Özel notlar",
  "ai_confidence": 0.89
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    temperature: 0.1,
    system: systemPrompt,
    messages: [{ role: 'user', content: `Müşteri görüşmesi transkripti:\n\n${transcript}` }]
  })

  const text = (response.content[0] as { text: string }).text
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
}

// ============================================================
// SİGORTA ACENTESİ - POLİÇE GÖRÜŞME NOTU
// ============================================================

export interface InsuranceNote {
  musteri_ozeti: string
  mevcut_sigortalar: string[]
  ihtiyac_analizi: string
  onerilen_urunler: Array<{ urun: string; prim: string; kapsam: string; sebep: string }>
  risk_profili: string
  yapilacaklar: ActionItem[]
  notlar: string
  ai_confidence: number
}

export async function generateInsuranceNote(
  transcript: string,
  context: { client_name?: string; insurance_type?: string }
): Promise<InsuranceNote> {
  const systemPrompt = `Sen deneyimli bir Türk sigorta danışmanısın. Müşteri görüşmelerini profesyonel notlara dönüştürüyorsun.

Türk Sigorta mevzuatı ve SEDDK düzenlemelerine uygun not oluştur.

MÜŞTERİ: ${context.client_name || 'Belirtilmemiş'}
SİGORTA TÜRÜ: ${context.insurance_type || 'Belirtilmemiş'}

Görüşme transkriptini analiz et ve JSON döndür. Başka hiçbir şey yazma.

{
  "musteri_ozeti": "Müşteri profili özeti",
  "mevcut_sigortalar": ["Mevcut sigorta poliçeleri"],
  "ihtiyac_analizi": "Sigorta ihtiyaç analizi",
  "onerilen_urunler": [
    {"urun": "Ürün adı", "prim": "Aylık/yıllık prim", "kapsam": "Kapsam özeti", "sebep": "Öneri gerekçesi"}
  ],
  "risk_profili": "Müşteri risk profili değerlendirmesi",
  "yapilacaklar": [
    {"gorev": "Yapılacak iş", "sorumlu": "Acente/Müşteri", "son_tarih": "GG.AA.YYYY", "oncelik": "yüksek"}
  ],
  "notlar": "Özel notlar",
  "ai_confidence": 0.88
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    temperature: 0.1,
    system: systemPrompt,
    messages: [{ role: 'user', content: `Müşteri görüşmesi transkripti:\n\n${transcript}` }]
  })

  const text = (response.content[0] as { text: string }).text
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
}

// ============================================================
// EĞİTİM DANIŞMANI - VELİ/ÖĞRENCİ GÖRÜŞME NOTU
// ============================================================

export interface EducationNote {
  ogrenci_profili: string
  akademik_durum: string
  tespitler: string[]
  guclu_yonler: string[]
  gelisim_alanlari: string[]
  veli_endiseler: string
  oneriler: string[]
  aksiyon_plani: ActionItem[]
  notlar: string
  ai_confidence: number
}

export async function generateEducationNote(
  transcript: string,
  context: { student_name?: string; grade?: string; subject?: string }
): Promise<EducationNote> {
  const systemPrompt = `Sen deneyimli bir Türk eğitim danışmanısın.

MİLLİ EĞİTİM BAKANLIĞI müfredatı ve öğrenci gelişim standartlarına uygun not oluştur.

ÖĞRENCİ: ${context.student_name || 'Belirtilmemiş'}
SINIF: ${context.grade || 'Belirtilmemiş'}
DERS/ALAN: ${context.subject || 'Genel'}

Görüşme transkriptini analiz et ve JSON döndür. Başka hiçbir şey yazma.

{
  "ogrenci_profili": "Öğrenci genel profili",
  "akademik_durum": "Akademik durum özeti",
  "tespitler": ["Görüşmede tespit edilen önemli noktalar"],
  "guclu_yonler": ["Öğrencinin güçlü yönleri"],
  "gelisim_alanlari": ["Gelişim gerektiren alanlar"],
  "veli_endiseler": "Veli endişeleri ve beklentileri",
  "oneriler": ["Akademik ve kişisel gelişim önerileri"],
  "aksiyon_plani": [
    {"gorev": "Yapılacak iş", "sorumlu": "Öğretmen/Veli/Öğrenci", "son_tarih": "GG.AA.YYYY", "oncelik": "orta"}
  ],
  "notlar": "Danışman özel notları",
  "ai_confidence": 0.90
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    temperature: 0.1,
    system: systemPrompt,
    messages: [{ role: 'user', content: `Veli/Öğrenci görüşmesi transkripti:\n\n${transcript}` }]
  })

  const text = (response.content[0] as { text: string }).text
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
}

// ============================================================
// YÖNETİCİ - İŞ TOPLANTISI NOTU
// ============================================================

export interface MeetingNote {
  toplanti_ozeti: string
  katilimcilar: string[]
  gundem_maddeleri: Array<{ madde: string; karar: string; sorumlu: string }>
  alinan_kararlar: string[]
  aksiyon_planlari: ActionItem[]
  sonraki_toplanti: string
  onemli_notlar: string
  ai_confidence: number
}

export async function generateMeetingNote(
  transcript: string,
  context: { meeting_type?: string; participants?: string[]; subject?: string }
): Promise<MeetingNote> {
  const systemPrompt = `Sen kurumsal toplantı not uzmanısın. Türkçe iş ortamı kültürüne uygun profesyonel toplantı notları oluşturuyorsun.

TOPLANTI BİLGİLERİ:
- Tür: ${context.meeting_type || 'Genel toplantı'}
- Katılımcılar: ${context.participants?.join(', ') || 'Belirtilmemiş'}
- Konu: ${context.subject || 'Belirtilmemiş'}

Toplantı transkriptini analiz et ve JSON döndür. Başka hiçbir şey yazma.

{
  "toplanti_ozeti": "Toplantı amacı ve genel özet",
  "katilimcilar": ["Katılımcı listesi"],
  "gundem_maddeleri": [
    {"madde": "Gündem maddesi", "karar": "Alınan karar", "sorumlu": "Sorumlu kişi"}
  ],
  "alinan_kararlar": ["Kesinleşen kararlar"],
  "aksiyon_planlari": [
    {"gorev": "Yapılacak iş", "sorumlu": "Kişi adı", "son_tarih": "GG.AA.YYYY", "oncelik": "yüksek"}
  ],
  "sonraki_toplanti": "Bir sonraki toplantı bilgisi",
  "onemli_notlar": "Önemli notlar ve uyarılar",
  "ai_confidence": 0.94
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    temperature: 0.1,
    system: systemPrompt,
    messages: [{ role: 'user', content: `Toplantı transkripti:\n\n${transcript}` }]
  })

  const text = (response.content[0] as { text: string }).text
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
}

// ============================================================
// ANA YÖNLENDIRICI - Mesleğe Göre Doğru Fonksiyonu Çağır
// ============================================================

export type ProfessionType = 
  | 'doktor' | 'avukat' | 'psikolog' | 'muhasebeci' 
  | 'ik' | 'emlakci' | 'sigorta' | 'egitim' | 'yonetici'

export async function generateNote(
  profession: ProfessionType,
  transcript: string,
  context: Record<string, unknown>
): Promise<Record<string, unknown>> {
  switch (profession) {
    case 'doktor':
      return generateMedicalNote(transcript, context as SessionContext)
    case 'avukat':
      return generateLegalNote(transcript, context.legal_area as string || 'Genel', context as never)
    case 'psikolog':
      return generateTherapyNote(transcript, context.therapy_type as string || 'BDT', context as never)
    case 'muhasebeci':
      return generateAccountingNote(transcript, context.service_type as string || 'Genel', context as never)
    case 'ik':
      return generateHRNote(transcript, context.meeting_type as string || 'Genel', context as never)
    case 'emlakci':
      return generateRealEstateNote(transcript, context as never)
    case 'sigorta':
      return generateInsuranceNote(transcript, context as never)
    case 'egitim':
      return generateEducationNote(transcript, context as never)
    case 'yonetici':
      return generateMeetingNote(transcript, context as never)
    default:
      throw new Error(`Bilinmeyen meslek türü: ${profession}`)
  }
}
