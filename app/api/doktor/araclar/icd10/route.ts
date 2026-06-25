import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface IcdSonuc {
  kod: string;
  turkceAciklama: string;
  ingilizceAciklama: string;
  bolum: string;
  guven: number;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

async function groqChat(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY || process.env.GROK_API_KEY || ''
  const apiBase = process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : 'https://api.x.ai/v1'
  const modelId = process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : 'grok-3-mini'
  if (!apiKey) {
    throw new Error('GROQ_API_KEY tanımlı değil');
  }

  const response = await fetch(apiBase + '/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 2000,
      // response_format: removed for xAI compat
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API hatası: ${response.status} - ${errorText}`);
  }

  const data: GroqResponse = await response.json();
  return data.choices[0]?.message?.content || '{}';
}

async function authCheck(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  const sessionToken = request.cookies.get('next-auth.session-token')?.value;
  
  if (!authHeader && !sessionToken) {
    return false;
  }
  
  // Üretimde gerçek oturum doğrulama yapılmalı (NextAuth, JWT vb.)
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await authCheck(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { hata: 'Yetkilendirme başarısız. Lütfen giriş yapın.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json(
        { hata: 'Geçerli bir tanı sorgusu gönderilmelidir.' },
        { status: 400 }
      );
    }

    const systemPrompt = 'ICD-10 kodlama uzmanısın. Verilen Türkçe tanı için en uygun ICD-10 kodlarını bul. SADECE JSON: {sonuclar:[{kod,turkceAciklama,ingilizceAciklama,bolum,guven}]} (max 5 results, guven 0-100)';
    const userPrompt = `Tani: ${query.trim()}`;

    const rawResult = await groqChat(systemPrompt, userPrompt);
    
    let parsed: { sonuclar?: IcdSonuc[] };
    try {
      parsed = JSON.parse(rawResult);
    } catch {
      return NextResponse.json(
        { hata: 'Model yanıtı işlenemedi. Lütfen tekrar deneyin.' },
        { status: 502 }
      );
    }

    const sonuclar = Array.isArray(parsed.sonuclar) 
      ? parsed.sonuclar.slice(0, 5).filter((s: IcdSonuc) => 
          s.kod && s.turkceAciklama && typeof s.guven === 'number'
        )
      : [];

    const mapped = sonuclar.map((s) => ({ code: s.kod, turkish: s.turkceAciklama, english: s.ingilizceAciklama, chapter: s.bolum, confidence: s.guven, kod: s.kod, turkceAciklama: s.turkceAciklama })); return NextResponse.json({ results: mapped, sonuclar }, { status: 200 });

  } catch (error) {
    console.error('ICD-10 API hatası:', error);
    return NextResponse.json(
      { hata: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
