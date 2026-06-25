import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface IlacInteraksiyonRequest {
  ilaclar: string[];
  agirlik?: number;
  yas?: number;
  bobrekFonksiyon?: string;
}

interface GroqInteraksiyonSonuc {
  genelRisk: 'guvenli' | 'dikkat' | 'kontrendike';
  interaksiyonlar: Array<{
    ilac1: string;
    ilac2: string;
    siddet: 'dusuk' | 'orta' | 'yuksek' | 'kontrendike';
    mekanizma: string;
    aciklama: string;
    oneri: string;
  }>;
  dozUyarilari: Array<{
    ilac: string;
    uyari: string;
  }>;
}

async function groqChat(systemPrompt: string, userPrompt: string): Promise<GroqInteraksiyonSonuc> {
  const apiKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY || '';
  if (!apiKey) {
    throw new Error('GROQ_API_KEY tanımlı değil');
  }

  const response = await fetch((process.env.GROQ_API_KEY ? "https://api.groq.com/openai/v1/chat/completions" : "https://api.x.ai/v1/chat/completions"), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API hatası: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('Groq yanıtı boş');
  }

  return JSON.parse(content) as GroqInteraksiyonSonuc;
}

export async function POST(request: NextRequest) {
  // 1. Auth check
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { hata: 'Yetkisiz erişim. Lütfen geçerli bir token sağlayın.' },
      { status: 401 }
    );
  }

  try {
    const body: IlacInteraksiyonRequest = await request.json();

    if (!body.ilaclar || !Array.isArray(body.ilaclar) || body.ilaclar.length < 2) {
      return NextResponse.json(
        { hata: 'En az iki ilaç belirtilmelidir.' },
        { status: 400 }
      );
    }

    // 2. Build context string from optional patient params
    const hastaBilgi = body.yas || body.agirlik || body.bobrekFonksiyon
      ? `Hasta: ${body.yas ?? 'belirtilmemiş'} yaşında, ${body.agirlik ?? 'belirtilmemiş'} kg, böbrek fonksiyonu: ${body.bobrekFonksiyon || 'normal'}`
      : 'Hasta bilgileri belirtilmemiş';

    // 3. groqChat çağrısı
    const systemPrompt = 'Klinik farmakoloji uzmanısın. İlaç interaksiyon analizi yap. SADECE JSON: {genelRisk:guvenli|dikkat|kontrendike, interaksiyonlar:[{ilac1,ilac2,siddet:dusuk|orta|yuksek|kontrendike,mekanizma,aciklama,oneri}], dozUyarilari:[{ilac,uyari}]}';
    
    const userPrompt = `İlaçlar: ${body.ilaclar.join(', ')}. ${hastaBilgi}`;

    const sonuc = await groqChat(systemPrompt, userPrompt);

    // 4. Return parsed result
    return NextResponse.json(sonuc);
  } catch (error) {
    console.error('İlaç interaksiyon hatası:', error);
    return NextResponse.json(
      { hata: 'İlaç interaksiyon analizi sırasında bir hata oluştu.' },
      { status: 500 }
    );
  }
}
