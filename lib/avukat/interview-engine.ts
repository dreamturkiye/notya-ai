// lib/avukat/interview-engine.ts

import { groqChat, GroqMessage } from './groq';
import { AVUKAT_PERSONAS, AvukatPersonaId } from './personas';

type InterviewBranch = {
  id: string;
  keywords: string[];
  questions: string[];
};

type TranscriptEntry = {
  role: "avukat" | "musevvekil";
  text: string;
  timestamp: string;
};

type AvukatPreferences = {
  avukatId: string;
  preferredDilekce: Record<string, string>;
  branchStyle: Record<string, string>;
  correctionHistory: Array<{ type: string; original: string; corrected: string; count: number }>;
  sessionsCompleted: number;
  lastSessionAt: string;
};

const INTERVIEW_BRANCHES: InterviewBranch[] = [
  {
    id: 'kira_tahliye',
    keywords: ['kira', 'kiracõ', 'tahliye', 'depozito', 'tahsilat'],
    questions: [
      "Kira anlaşmasının süresi nedir?",
      "Ne kadar aylık kira tahsil edilmemiştir?",
      "Noter ihtarı var mı? Eğer varsa, detayları nelerdir?",
      "Kira anlaşması ne tür bir sözleşme?",
      "Kiracının mülkünde hasar var mı? Hasarın detayları nedir?",
      "Kiracının kira tahsilatını iptal etme hakkına sahip mi?",
      "Kiracının kira tahsilatını iptal etme hakkını kullanma şartları nedir?",
      "Kiracının kira tahsilatını iptal etme hakkını kullanma şartlarını karşılayan mülk detayları nedir?"
    ]
  },
  {
    id: 'bosanma',
    keywords: ['bosanma', 'nafaka', 'velayet', 'mal paylasüõmõ', 'esinden'],
    questions: [
      "Bosanma süresi nedir?",
      "Nafaka talebi var mı? Eğer varsa, detayları nelerdir?",
      "Velayet mahkemesindeki kararlar var mı? Eğer varsa, detayları nelerdir?",
      "Mal paylaşımı konusunda anlaşmazlık var mı? Eğer varsa, detayları nelerdir?",
      "Eşi veya eşinden kaç yıl önce ayrıldı?",
      "Bosanma talebindeki çocuklar hakkında bilgi var mı? Eğer varsa, detayları nelerdir?",
      "Bosanma talebindeki mülkler hakkında bilgi var mı? Eğer varsa, detayları nelerdir?",
      "Bosanma talebindeki şiddet veya suç konusunda sorun var mı? Eğer varsa, detayları nelerdir?"
    ]
  },
  {
    id: 'is_akdi',
    keywords: ['isüten', 'isüi', 'kõdem', 'ihbar', 'mobbing', 'sigortasõz', 'sgk'],
    questions: [
      "İş akdının başlangıç tarihi nedir?",
      "İş akdının sona erme şekli nedir?",
      "Ködem hesaplaması nasıl yapılmıştır?",
      "SGK kaydı var mı? Eğer varsa, detayları nelerdir?",
      "Banka ödeme konusunda sorun var mı? Eğer varsa, detayları nelerdir?",
      "İş akdında ihbar veya mobbing konusu var mı? Eğer varsa, detayları nelerdir?",
      "İş akdında sigorta sözü var mı? Eğer varsa, detayları nelerdir?",
      "İş akdında diğer önemli noktalar var mı? Eğer varsa, detayları nelerdir?"
    ]
  },
  {
    id: 'tapu_ihtilaf',
    keywords: ['tapu', 'mlk', 'arazi', 'imar', 'satõsü', 'tescil'],
    questions: [
      "Tapu deedinin sahibi kimdir?",
      "Satış tarihi nedir?",
      "Notary of deed var mı? Eğer varsa, detayları nelerdir?",
      "Ödeme kanıtı var mı? Eğer varsa, detayları nelerdir?",
      "Zoning veya imar konusu sorun var mı? Eğer varsa, detayları nelerdir?",
      "Tapu deedindeki diğer önemli noktalar var mı? Eğer varsa, detayları nelerdir?",
      "Tapu deedindeki mülkün durumu nedir?",
      "Tapu deedindeki mülkün kullanım hakkı nedir?"
    ]
  },
  {
    id: 'ceza_davasi',
    keywords: ['gzaltõ', 'tutuklama', 'sulama', 'süikayet', 'ifade', 'beraat'],
    questions: [
      "Custody süresi nedir?",
      "Medyada ifade verilmiştir mı? Eğer varsa, detayları nelerdir?",
      "Ceza veya suçlar hakkında bilgi var mı? Eğer varsa, detayları nelerdir?",
      "Kanıt veya deliller var mı? Eğer varsa, detayları nelerir?",
      "Önceki suç veya ceza kayıtları var mı? Eğer varsa, detayları nelerdir?",
      "Ceza davasında diğer önemli noktalar var mı? Eğer varsa, detayları nelerdir?",
      "Ceza davasında tutuklama veya suçlaması hakkında bilgi var mı? Eğer varsa, detayları nelerdir?",
      "Ceza davasında suçun ciddiyeti nedir?"
    ]
  },
  {
    id: 'ticaret_sozlesme',
    keywords: ['szlesüme', 'teslim', 'deme', 'alacak', 'ihtarname', 'tazminat'],
    questions: [
      "Yazılı sözleşme var mı? Eğer varsa, detayları nelerdir?",
      "Sözleşme ihlali konusunda sorun var mı? Eğer varsa, detayları nelerdir?",
      "Hasar veya zarar konusunda sorun var mı? Eğer varsa, detayları nelerdir?",
      "Belgeler ve dokümanlar hakkında bilgi var mı? Eğer varsa, detayları nelerdir?",
      "Mediation veya anlaşmazlık çözümü konusunda sorun var mı? Eğer varsa, detayları nelerdir?",
      "Ticaret sözleşmesinde diğer önemli noktalar var mi? Eğer varsa, detayları nelerdir?",
      "Ticaret sözleşmesinde ödeme ve teslimat konuları hakkında bilgi var mı? Eğer varsa, detayları nelerdir?",
      "Ticaret sözleşmesinde tazminat veya garantiler konusunda sorun var mı? Eğer varsa, detayları nelerdir?"
    ]
  },
  {
    id: 'idari_dava',
    keywords: ['belediye', 'vergi cezasõ', 'idare', 'iptal', 'yrtme'],
    questions: [
      "İdari kararın tarihi nedir?",
      "60 günlük sürenin dolu olup olmadığı hakkında bilgi var mı? Eğer varsa, detayları nelerdir?",
      "Hasar veya zarar konusunda sorun var mı? Eğer varsa, detayları nelerdir?",
      "İdari davada diğer önemli noktalar var mı? Eğer varsa, detayları nelerdir?",
      "İdari davada iptal veya yürütmek istenen karar hakkında bilgi var mı? Eğer varsa, detayları nelerdir?",
      "İdari davada belediye veya vergi cezası konusunda sorun var mı? Eğer varsa, detayları nelerdir?",
      "İdari davada idari kararın uygulanması hakkında bilgi var mı? Eğer varsa, detayları nelerdir?",
      "İdari davada diğer önemli noktalar var mı? Eğer varsa, detayları nelerdir?"
    ]
  },
  {
    id: 'bilisim',
    keywords: ['KVKK', 'sikayet', 'icerik kaldir', 'marka itiraz'],
    questions: [
      "KVKK veya diğer yasal düzenlemelere uygunluk konusunda sorun var mı? Eğer varsa, detayları nelerdir?",
      "İçerik kaldırma talebi var mı? Eğer varsa, detayları nelerdir?",
      "Marka itirazı konusunda sorun var mı? Eğer varsa, detayları nelerdir?",
      "Bilgi güvenliği veya veri koruma konusunda sorun var mı? Eğer varsa, detayları nelerdir?",
      "Diğer önemli noktalar var mı? Eğer varsa, detayları nelerdir?"
    ]
  },
  {
    id: 'default',
    keywords: [],
    questions: [
      "Lütfen daha fazla bilgi sağlayın.",
      "Hangi konuda yardımcı olabiliriz?",
      "Diğer önemli noktalar var mı? Eğer varsa, detayları nelerdir?"
    ]
  }
];

function detectBranch(transcript: TranscriptEntry[]): InterviewBranch {
  const keywords = transcript.flatMap(entry => entry.text.split(/\s+/));
  for (const branch of INTERVIEW_BRANCHES) {
    if (branch.keywords.some(keyword => keywords.includes(keyword))) {
      return branch;
    }
  }
  return INTERVIEW_BRANCHES.find(branch => branch.id === 'default')!;
}

function buildMessages(transcript: TranscriptEntry[], branch: InterviewBranch, preferences: AvukatPreferences): GroqMessage[] {
  const messages: GroqMessage[] = [];
  for (const entry of transcript) {
    messages.push({
      role: entry.role,
      content: entry.text
    });
  }
  if (preferences.sessionsCompleted > 0 && branch.id !== 'default') {
    messages.push({
      role: "avukat",
      content: `Bu konuda daha önce ${preferences.sessionsCompleted} oturum geçirdiniz.`
    });
  }
  for (const question of branch.questions) {
    messages.push({
      role: "avukat",
      content: question
    });
  }
  return messages;
}

async function continueInterview(transcript: TranscriptEntry[], preferences: AvukatPreferences): Promise<string> {
  const branch = detectBranch(transcript);
  const messages = buildMessages(transcript, branch, preferences);
  const response = await groqChat(messages);
  return response.content;
}

function getRiskLevel(analiz: DavaAnalizi): string {
  switch (analiz.riskLevel) {
    case 'kritik':
      return ":red Kritik Risk";
    case 'yuksek':
      return "orange Yüksük Risk";
    case 'orta':
      return "yellow Orta Risk";
    case 'dusuk':
      return "green Düşük Risk";
    default:
      return "gray Bilinmeyen Risk";
  }
}