export interface Specialty {
  key: string;
  label: string;
  emoji: string;
  color: string;
  references: string[];
  soapFields: string[];
  greeting: string;
  agentIdEnvVar: string;
}

export const SPECIALTIES: Specialty[] = [
  { key: "pediatri", label: "Pediatri", emoji: "👶", color: "#0F9B8E", references: ["Nelson Textbook of Pediatrics 22e", "Harriet Lane Handbook 23e"], soapFields: ["ates", "kilo", "boy", "gelisim"], greeting: "Merhaba, ben Prof. Dr. Ayşe Kaya. Pediatri alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_PEDİATRİ" },
  { key: "kardiyoloji", label: "Kardiyoloji", emoji: "❤️", color: "#DC2626", references: ["Braunwald's Heart Disease 12e", "ESC Guidelines 2024"], soapFields: ["ekg", "ef", "nyha"], greeting: "Merhaba, ben Prof. Dr. Mehmet Demir. Kardiyoloji alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_KARDİYOLOJİ" },
  { key: "noroloji", label: "Nöroloji", emoji: "🧠", color: "#7C3AED", references: ["Harrison's Principles 22e", "Adams & Victor's Neurology"], soapFields: ["norolojik_muayene", "gcs", "kraniyal_sinirler"], greeting: "Merhaba, ben Prof. Dr. Elif Şahin. Nöroloji alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_NÖROLOJİ" },
  { key: "dahiliye", label: "Dahiliye", emoji: "🩺", color: "#0F9B8E", references: ["Harrison's Principles 22e", "Washington Manual 38e"], soapFields: ["sistemik_muayene"], greeting: "Merhaba, dahiliye uzmanı olarak size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_DAHİLİYE" },
  { key: "psikiyatri", label: "Psikiyatri", emoji: "🧘", color: "#6366F1", references: ["DSM-5-TR", "Kaplan & Sadock 11e"], soapFields: ["mental_durum"], greeting: "Merhaba, psikiyatri alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_PSİKİYATRİ" },
  { key: "genel-cerrahi", label: "Genel Cerrahi", emoji: "🔪", color: "#EF4444", references: ["Schwartz's Principles 11e", "Sabiston Textbook 21e"], soapFields: ["cerrahi_anamnez"], greeting: "Merhaba, genel cerrahi alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_GENEL_CERRAHİ" },
  { key: "ortopedi", label: "Ortopedi", emoji: "🦴", color: "#F59E0B", references: ["Rockwood & Green 9e", "Campbell's Operative Orthopaedics 14e"], soapFields: ["travma", "rom", "xray"], greeting: "Merhaba, ortopedi alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_ORTOPEDİ" },
  { key: "dermatoloji", label: "Dermatoloji", emoji: "🧴", color: "#EC4899", references: ["Fitzpatrick's Dermatology 9e", "Bologna Dermatology 4e"], soapFields: ["lezyon", "efflorescence"], greeting: "Merhaba, dermatoloji alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_DERMATOLOJİ" },
  { key: "kulak-burun-bogaz", label: "KBB", emoji: "👂", color: "#14B8A6", references: ["Cummings Otolaryngology 7e", "Bailey's Head & Neck Surgery"], soapFields: ["kbb_muayene"], greeting: "Merhaba, KBB alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_KBB" },
  { key: "goz-hastaliklari", label: "Göz Hastalıkları", emoji: "👁️", color: "#3B82F6", references: ["Kanski's Clinical Ophthalmology 9e", "Vaughan & Asbury"], soapFields: ["goz_muayene"], greeting: "Merhaba, göz hastalıkları alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_GÖZ" },
  { key: "kadin-hastaliklari-dogum", label: "Kadın Hastalıkları ve Doğum", emoji: "🤰", color: "#BE185D", references: ["Williams Obstetrics 26e", "Berek & Novak 16e"], soapFields: ["jinekolojik_anamnez"], greeting: "Merhaba, kadın hastalıkları ve doğum alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_KADIN_DOĞUM" },
  { key: "uroloji", label: "Üroloji", emoji: "🚽", color: "#0EA5E9", references: ["Campbell-Walsh-Wein 12e", "EAU Guidelines 2024"], soapFields: ["urolojik_muayene"], greeting: "Merhaba, üroloji alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_ÜROLOJİ" },
  { key: "radyoloji", label: "Radyoloji", emoji: "📷", color: "#64748B", references: ["Grainger & Allison 5e", "Sutton Radiology 9e"], soapFields: ["goruntuleme_bulgulari"], greeting: "Merhaba, radyoloji alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_RADYOLOJİ" },
  { key: "anestezi", label: "Anestezi", emoji: "💉", color: "#8B5CF6", references: ["Miller's Anesthesia 9e", "Morgan & Mikhail 6e"], soapFields: ["anestezi_riski"], greeting: "Merhaba, anestezi alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_ANESTEZİ" },
  { key: "acil-tip", label: "Acil Tıp", emoji: "🚑", color: "#F97316", references: ["Tintinalli's Emergency Medicine 9e", "Rosen's Emergency Medicine 9e"], soapFields: ["acil_degerlendirme"], greeting: "Merhaba, acil tıp alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_ACİL" },
  { key: "fizik-tedavi", label: "Fizik Tedavi", emoji: "🏃", color: "#22C55E", references: ["Braddom's Physical Medicine 5e", "DeLisa's Physical Medicine 5e"], soapFields: ["fiziksel_degerlendirme"], greeting: "Merhaba, fizik tedavi alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_FİZİK" },
  { key: "enfeksiyon-hastaliklari", label: "Enfeksiyon Hastalıkları", emoji: "🦠", color: "#E11D48", references: ["Mandell Douglas Bennett 9e", "Sanford Guide 2024"], soapFields: ["enfeksiyon_belirtileri"], greeting: "Merhaba, enfeksiyon hastalıkları alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_ENFEKSİYON" },
  { key: "endokrinoloji", label: "Endokrinoloji", emoji: "🧬", color: "#A855F7", references: ["Williams Textbook of Endocrinology 14e", "Greenspan's Basic & Clinical Endocrinology 10e"], soapFields: ["endokrin_lab"], greeting: "Merhaba, endokrinoloji alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_ENDOKRİN" },
  { key: "gastroenteroloji", label: "Gastroenteroloji", emoji: "🫁", color: "#F43F5E", references: ["Sleisenger & Fordtran 11e", "Yamada's Textbook 6e"], soapFields: ["gastro_anamnez"], greeting: "Merhaba, gastroenteroloji alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_GASTRO" },
  { key: "nefroloji", label: "Nefroloji", emoji: "🫘", color: "#06B6D4", references: ["Brenner & Rector's The Kidney 11e", "BNF Renal"], soapFields: ["bobrek_fonksiyonlari"], greeting: "Merhaba, nefroloji alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_NEFRO" },
  { key: "romatoloji", label: "Romatoloji", emoji: "🦵", color: "#D97706", references: ["Kelley & Firestein's Rheumatology 10e", "ACR Guidelines"], soapFields: ["eklem_muayenesi"], greeting: "Merhaba, romatoloji alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_ROMATO" },
  { key: "onkoloji", label: "Onkoloji", emoji: "🎗️", color: "#7C2D12", references: ["DeVita Cancer 12e", "NCCN Guidelines 2024"], soapFields: ["onkolojik_degerlendirme"], greeting: "Merhaba, onkoloji alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_ONKOLOJİ" },
  { key: "gogus-hastaliklari", label: "Göğüs Hastalıkları", emoji: "🫀", color: "#0D9488", references: ["Murray & Nadel's Textbook 7e", "GINA/GOLD 2024"], soapFields: ["solunum_fonksiyonlari"], greeting: "Merhaba, göğüs hastalıkları alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_GÖĞÜS" },
  { key: "gogus-cerrahisi", label: "Göğüs Cerrahisi", emoji: "🫁", color: "#B91C1C", references: ["Shields' General Thoracic Surgery 3e"], soapFields: ["torasik_anamnez"], greeting: "Merhaba, göğüs cerrahisi alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_GÖĞÜS_CERRAHİ" },
  { key: "plastik-cerrahi", label: "Plastik Cerrahi", emoji: "✨", color: "#C026D3", references: ["Grabb & Smith's Plastic Surgery 8e"], soapFields: ["plastik_degerlendirme"], greeting: "Merhaba, plastik cerrahi alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_PLASTİK" },
  { key: "beyin-cerrahisi", label: "Beyin Cerrahisi", emoji: "🧠", color: "#581C87", references: ["Youmans & Winn Neurological Surgery 8e"], soapFields: ["norocerrahi"], greeting: "Merhaba, beyin cerrahisi alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_BEYİN_CERRAHİ" },
  { key: "kalp-damar-cerrahisi", label: "Kalp Damar Cerrahisi", emoji: "❤️", color: "#9F1239", references: ["Kirklin & Barratt-Boyes Cardiac Surgery 4e"], soapFields: ["kardiyovaskuler_cerrahi"], greeting: "Merhaba, kalp damar cerrahisi alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_KALP_DAMAR" },
  { key: "cocuk-cerrahisi", label: "Çocuk Cerrahisi", emoji: "👶", color: "#166534", references: ["Ashcraft's Pediatric Surgery 6e"], soapFields: ["cocuk_cerrahi"], greeting: "Merhaba, çocuk cerrahisi alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_ÇOCUK_CERRAHİ" },
  { key: "aile-hekimligi", label: "Aile Hekimliği", emoji: "🏠", color: "#15803D", references: ["Current Medical Diagnosis 2024", "ICPC-2"], soapFields: ["aile_anamnezi"], greeting: "Merhaba, aile hekimliği alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_AİLE" },
  { key: "spor-hekimligi", label: "Spor Hekimliği", emoji: "🏅", color: "#854D0E", references: ["Brukner & Khan's Clinical Sports Medicine 5e"], soapFields: ["spor_yaralanma"], greeting: "Merhaba, spor hekimliği alanında size yardımcı oluyorum.", agentIdEnvVar: "GROQ_AGENT_SPOR" }
];

export const SPECIALTY_MAP: Record<string, Specialty> = SPECIALTIES.reduce((acc, s) => {
  acc[s.key] = s;
  return acc;
}, {} as Record<string, Specialty>);
