-- lib/db/schema_avukat.sql
CREATE TABLE IF NOT EXISTS avukat_preferences (
  avukat_id UUID PRIMARY KEY,
  preferred_dilekce JSONB,
  branch_style JSONB,
  correction_history JSONB,
  preferred_kanunlar JSONB,
  sessions_completed INT DEFAULT 0,
  last_session_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS avukat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  avukat_id UUID REFERENCES users(id),
  muvekkel_id UUID,
  persona_id TEXT,
  messages JSONB DEFAULT [],
  active_context JSONB DEFAULT {},
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS avukat_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  avukat_id UUID REFERENCES users(id),
  avukat_session_id UUID,
  action_type TEXT,
  input_text TEXT,
  ai_response TEXT,
  action_data JSONB DEFAULT {},
  was_corrected BOOLEAN DEFAULT FALSE,
  correction_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS musevvekiller (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  avukat_id UUID REFERENCES users(id) NOT NULL,
  name TEXT NOT NULL,
  case_type TEXT,
  branch TEXT,
  opposing_party TEXT,
  case_number TEXT,
  status TEXT DEFAULT 'aktif',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sure_takibi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  avukat_id UUID REFERENCES users(id) NOT NULL,
  muvekkel_id UUID REFERENCES musevvekiller(id),
  sure_turu TEXT NOT NULL,
  son_tarih DATE NOT NULL,
  kanun TEXT,
  kritik BOOLEAN DEFAULT FALSE,
  tamamlandi BOOLEAN DEFAULT FALSE,
  hatirlatma_gonderildi BOOLEAN DEFAULT FALSE,
  notlar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dilekce_kuyrugu (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  avukat_id UUID REFERENCES users(id) NOT NULL,
  muvekkel_id UUID REFERENCES musevvekiller(id),
  dilekce_turu TEXT NOT NULL,
  icerik TEXT,
  taslak BOOLEAN DEFAULT TRUE,
  onaylandi BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS avukat_baro TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avukat_sicil TEXT;

-- RLS policies
ALTER TABLE avukat_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE avukat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE avukat_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE musevvekiller ENABLE ROW LEVEL SECURITY;
ALTER TABLE sure_takibi ENABLE ROW LEVEL SECURITY;
ALTER TABLE dilekce_kuyrugu ENABLE ROW LEVEL SECURITY;

CREATE POLICY "avukat_preferences_policy" ON avukat_preferences FOR ALL USING (auth.uid() = avukat_id);
CREATE POLICY "avukat_sessions_policy" ON avukat_sessions FOR ALL USING (auth.uid() = avukat_id);
CREATE POLICY "avukat_actions_policy" ON avukat_actions FOR ALL USING (auth.uid() = avukat_id);
CREATE POLICY "musevvekiller_policy" ON musevvekiller FOR ALL USING (auth.uid() = avukat_id);
CREATE POLICY "sure_takibi_policy" ON sure_takibi FOR ALL USING (auth.uid() = avukat_id);
CREATE POLICY "dilekce_kuyrugu_policy" ON dilekce_kuyrugu FOR ALL USING (auth.uid() = avukat_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_avukat_sessions_avukat ON avukat_sessions(avukat_id);
CREATE INDEX IF NOT EXISTS idx_musevvekiller_avukat ON musevvekiller(avukat_id);
CREATE INDEX IF NOT EXISTS idx_sure_takibi_avukat ON sure_takibi(avukat_id);
CREATE INDEX IF NOT EXISTS idx_sure_takibi_son_tarih ON sure_takibi(son_tarih);

// lib/ai/noteGenerator.ts
import { anthropicClient } from '@/lib/anthropicClient';

export interface LegalNoteV2 {
  dava_ozeti: string;
  muvekkel_talepleri: string;
  hukuki_sorunlar: string[];
  ilgili_mevzuat: Array<{ kanun: string; maddeler: string[] }>;
  sureler: Array<{ turu: string; son_tarih: string; kanun: string; notlar: string }>;
  dilekce_kuyrugu: Array<{ turu: string; icerik: string; taslak: boolean; onaylandi: boolean }>;
}

export async function generateLegalNoteV2(message: string): Promise<LegalNoteV2> {
  const systemPrompt = `
    You are a legal assistant. Your task is to analyze the provided message and generate a detailed legal note.
    The note should include:
    - A summary of the case (dava_ozeti)
    - The client's requests or claims (muvekkel_talepleri)
    - Identified legal issues (hukuki_sorunlar)
    - Relevant laws and articles (ilgili_mevzuat)
    - Outstanding deadlines (sureler)
    - Pending documents or actions (dilekce_kuyrugu)

    Format your response as a JSON object with the following structure:
    {
      "dava_ozeti": "Summary of the case",
      "muvekkel_talepleri": "Client's requests or claims",
      "hukuki_sorunlar": ["Legal issue 1", "Legal issue 2"],
      "ilgili_mevzuat": [
        {
          "kanun": "Law name",
          "maddeler": ["Article 1", "Article 2"]
        }
      ],
      "sureler": [
        {
          "turu": "Deadline type",
          "son_tarih": "YYYY-MM-DD",
          "kanun": "Law name",
          "notlar": "Additional notes"
        }
      ],
      "dilekce_kuyrugu": [
        {
          "turu": "Document type",
          "icerik": "Content of the document",
          "taslak": true/false,
          "onaylandi": true/false
        }
      ]
    }

    Ensure that your response is accurate and comprehensive.
  `;

  const userPrompt = `
    Analyze the following message and generate a detailed legal note:
    "${message}"
  `;

  const response = await anthropicClient.completions.create({
    model: 'claude-2',
    max_tokens_to_sample: 8192,
    temperature: 0.5,
    top_p: 1,
    stop_sequences: ['\n\n'],
    prompt: `${systemPrompt}\n\n${userPrompt}`,
  });

  const note = JSON.parse(response.completion);

  return note;
}