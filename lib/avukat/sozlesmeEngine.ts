import { ClaudeClient } from 'anthropic';

interface ChecklistItem {
  id: string;
  kategori: string;
  kontrol: string;
  kritik: boolean;
  kanunDayanagi?: string;
}

interface Risk {
  metin: string;
  ciddiyet: 'dusuk' | 'orta' | 'yuksek' | 'kritik';
  aciklama: string;
  oneri: string;
}

const SOZLESME_KONTROL_LISTESI: ChecklistItem[] = [
  { id: '1', kategori: 'Taraf Bilgileri', kontrol: 'Tarafların tam adları ve vergi numaraları belirtilmiş mi?', kritik: true, kanunDayanagi: 'TBK 203' },
  { id: '2', kategori: 'Konu ve Bedel', kontrol: 'Konu ve bedel net ve anlaşılır mı?', kritik: true, kanunDayanagi: 'TBK 314' },
  { id: '3', kategori: 'Ödeme Koşulları', kontrol: 'Ödeme şekli ve süresi belirtilmiş mi?', kritik: true, kanunDayanagi: 'TBK 320' },
  // ... Add at least 30 items
];

const KIRMIZI_BAYRAKLAR: string[] = [
  'tek taraflı fesih hakkõ',
  'belirsiz ceza klozu',
  'otomatik yenileme',
  'tek taraflı değişim hakkı',
  // ... Add at least 20 patterns
];

function buildSozlesmeAnalysisPrompt(sozlesmeMetni: string, sozlesmeTuru: string): string {
  return `
    Analyze the following Turkish contract (sozlesmeMetni) of type ${sozlesmeTuru}:
    
    1. Identify all parties and their roles.
    2. Summarize key terms (bedel, süre, konu).
    3. Check against SOZLESME_KONTROL_LISTESI.
    4. Flag KIRMIZI_BAYRAKLAR patterns found.
    5. Cite relevant TBK articles for any issues.
    6. Suggest specific improvements.

    Output JSON: {
      "taraflar": string[],
      "anahtar_kosullar": object,
      "riskler": Risk[],
      "eksik_maddeler": string[],
      "tbk_uyumsuzluklar": string[],
      "oneri_degisiklikler": string[],
      "genel_puan": number (0-100),
      "ozet": string
    }

    Each Risk: {
      "metin": string,
      "ciddiyet": 'dusuk'|'orta'|'yuksek'|'kritik',
      "aciklama": string,
      "oneri": string
    }
    
    Contract text:
    ${sozlesmeMetni}
  `;
}

export { SOZLESME_KONTROL_LISTESI, KIRMIZI_BAYRAKLAR, buildSozlesmeAnalysisPrompt };