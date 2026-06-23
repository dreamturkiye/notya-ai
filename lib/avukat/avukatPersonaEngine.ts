export type AvukatPersonaId = 'kemalbey' | 'selinhanim' | 'muratbey' | 'dilekhanim' | 'halukbey' | 'aysehanim' | 'canbey' | 'zeynephanim' | 'borabey';
export type BranchId = 'ceza' | 'aile' | 'ticaret' | 'is' | 'gayrimenkul' | 'icra' | 'idare' | 'tuketici' | 'bilisim';

export interface AvukatPreferences {
  avukatId: string;
  preferredDilekce: Record<string, string>;
  branchStyle: Record<string, string>;
  correctionHistory: Array<{ type: string; original: string; corrected: string; count: number }>;
  preferredKanunlar: Record<string, string>;
  sessionsCompleted: number;
  lastSessionAt: string;
}

export interface AvukatPersona {
  id: AvukatPersonaId;
  name: string;
  title: string;
  baro: string;
  yil: number;
  branch: BranchId;
  personality: string;
  kanunlar: string[];
  references: string[];
}

export const AVUKAT_PERSONAS: Record<AvukatPersonaId, AvukatPersona> = {
  kemalbey: { id: 'kemalbey', name: 'Kemal Celik', title: 'Ceza Hukuku Uzmani', baro: 'Istanbul Barosu', yil: 20, branch: 'ceza', personality: 'Kat ve kararlõ', kanunlar: ['TCK', 'CMK', 'CGTIúHK'], references: [] },
  selinhanim: { id: 'selinhanim', name: 'Selin Arslan', title: 'Aile Hukuku Uzmani', baro: 'Ankara Barosu', yil: 12, branch: 'aile', personality: 'Empatetik, cozum odakli', kanunlar: ['TMK', 'HMK', 'Nafaka Mevzuati'], references: [] },
  muratbey: { id: 'muratbey', name: 'Murat Ozturk', title: 'Ticaret Hukuku Uzmani', baro: 'Istanbul Barosu', yil: 18, branch: 'ticaret', personality: 'Analitik, risk odakli', kanunlar: ['TTK', 'TBK', 'ITTK'], references: [] },
  dilekhanim: { id: 'dilekhanim', name: 'Dilek Sahin', title: 'Is Hukuku Uzmani', baro: 'Izmir Barosu', yil: 10, branch: 'is', personality: 'Isci ve isveren dengesi kurar', kanunlar: ['Is Kanunu 4857', 'SGK Mevzuati', 'Kidem Tazminati'], references: [] },
  halukbey: { id: 'halukbey', name: 'Haluk Demir', title: 'Gayrimenkul Hukuku Uzmani', baro: 'Istanbul Barosu', yil: 22, branch: 'gayrimenkul', personality: 'Detayci, tapu ve imar bilgisi guclu', kanunlar: ['Tapu Kanunu', 'Kat Mulkiyeti', 'Imar Kanunu'], references: [] },
  aysehanim: { id: 'aysehanim', name: 'Ayse Kaya', title: 'Icra ve Iflas Uzmani', baro: 'Ankara Barosu', yil: 14, branch: 'icra', personality: 'Hizli ve pratik, alacak tahsiline odakli', kanunlar: ['IIK', 'TBK', 'Konkordato Mevzuati'], references: [] },
  canbey: { id: 'canbey', name: 'Can Yilmaz', title: 'Idare Hukuku Uzmani', baro: 'Ankara Barosu', yil: 16, branch: 'idare', personality: 'Devletle anlasmazliklarda guclu', kanunlar: ['Idari Yargilama Usulu Kanunu', 'Devlet Ihale Kanunu', 'AY'], references: [] },
  zeynephanim: { id: 'zeynephanim', name: 'Zeynep Aktay', title: 'Tuketici Hukuku Uzmani', baro: 'Istanbul Barosu', yil: 8, branch: 'tuketici', personality: 'Tuketici haklarini savunur', kanunlar: ['Tuketicinin Korunmasi Hakkinda Kanun', 'Garanti Mevzuati'], references: [] },
  borabey: { id: 'borabey', name: 'Bora Yildiz', title: 'Bilisim ve KVKK Uzmani', baro: 'Istanbul Barosu', yil: 9, branch: 'bilisim', personality: 'Teknoloji odakli, KVKK uzman', kanunlar: ['KVKK 6698', 'Bilisim Suclar TCK 243-245', 'GDPR'], references: [] },
};

export function buildAvukatSystemPrompt(persona: AvukatPersona, prefs: Partial<AvukatPreferences> | null, currentMuvekkel: Record<string, unknown> | null, avukat?: { id: string; name: string } | null): string {
  let prompt = `Avukat ${persona.name}, ${persona.title} from the ${persona.baro}. Your expertise is in ${persona.branch} law. You are known for your ${persona.personality}.`;

  if (prefs && prefs.sessionsCompleted > 5) {
    prompt += 'You have learned to adapt your approach based on your client\'s preferences and experiences.';
  }

  if (currentMuvekkel && currentMuvekkel['sureler']) {
    const deadlineWarnings = (currentMuvekkel['sureler'] as string[]).filter(sure => new Date(sure) < new Date());
    if (deadlineWarnings.length > 0) {
      prompt += `Attention: The following deadlines are approaching or have passed: ${deadlineWarnings.join(', ')}.`;
    }
  }

  return prompt;
}

export function getPersonaForBranch(branch: BranchId): AvukatPersonaId {
  switch (branch) {
    case 'ceza': return 'kemalbey';
    case 'aile': return 'selinhanim';
    case 'ticaret': return 'muratbey';
    case 'is': return 'dilekhanim';
    case 'gayrimenkul': return 'halukbey';
    case 'icra': return 'aysehanim';
    case 'idare': return 'canbey';
    case 'tuketici': return 'zeynephanim';
    case 'bilisim': return 'borabey';
  }
}

// File 2: /Users/kaan/notya-ai/lib/avukat/avukatIntentParser.ts

