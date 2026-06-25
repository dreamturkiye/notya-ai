import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface SGKRapor {
  raporBasligi: string;
  hastaAdi: string;
  tcSon4: string;
  tani: { icd10: string; aciklama: string };
  anamnez: string;
  mevcutDurum: string;
  calismaKapasitesi: 'tam' | 'kisitli' | 'yok';
  onerilen_sure_ay: number;
  hekim_notu: string;
  zorunluTetkikler: string[];
}

async function groqChat(system: string, user: string): Promise<SGKRapor> {
  const apiKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
  if (!apiKey) throw new Error('GROQ_API_KEY tanımlı değil');

  const response = await fetch((process.env.GROQ_API_KEY ? "https://api.groq.com/openai/v1/chat/completions" : "https://api.x.ai/v1/chat/completions"), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : 'grok-3-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
      max_tokens: 2000,
      
    }),
  });

  if (!response.ok) {
    throw new Error('Groq API hatası');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error('Groq yanıtı boş');

  return JSON.parse(content) as SGKRapor;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ hata: 'Yetkisiz erişim' }, { status: 401 });
    }
    // Basit token kontrolü (gerçekte JWT doğrulaması yapılmalı)
    const token = authHeader.split(' ')[1];
    if (!token || token.length < 20) {
      return NextResponse.json({ hata: 'Geçersiz oturum' }, { status: 401 });
    }

    const { hastaId, raporTipi, sure } = await request.json();
    if (!hastaId || !raporTipi || typeof sure !== 'number') {
      return NextResponse.json({ hata: 'Eksik parametreler' }, { status: 400 });
    }

    // 2. Veritabanı sorguları (Supabase örneği)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Hasta bilgisi
    const hastaRes = await fetch(`${supabaseUrl}/rest/v1/patients?id=eq.${hastaId}&select=id,adi,soyadi,tc_kimlik`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    const hastaData = await hastaRes.json();
    if (!hastaData?.length) {
      return NextResponse.json({ hata: 'Hasta bulunamadı' }, { status: 404 });
    }
    const hasta = hastaData[0];

    // Son 3 onaylı not
    const notesRes = await fetch(
      `${supabaseUrl}/rest/v1/notes?hasta_id=eq.${hastaId}&approved_at=not.is.null&select=content_degerlendirme,content_plan&order=created_at.desc&limit=3`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    const notes = await notesRes.json();

    const notMetinleri = notes
      .map((n: any) => (n.content_degerlendirme || '') + (n.content_plan || ''))
      .join('\n');

    // 3. Groq çağrısı
    const systemPrompt = `SGK resmi rapor yazma uzmanısın. SADECE JSON: {raporBasligi,hastaAdi,tcSon4,tani:{icd10,aciklama},anamnez,mevcutDurum,calismaKapasitesi:tam|kisitli|yok,onerilen_sure_ay:number,hekim_notu,zorunluTetkikler:[]}`;
    const userPrompt = `Rapor tipi: ${raporTipi}. Sure: ${sure} ay. Hasta notlari: ${notMetinleri}`;

    const rapor = await groqChat(systemPrompt, userPrompt);

    // 4. Dönüş
    const tarih = new Date().toLocaleDateString('tr-TR');
    return NextResponse.json({ rapor, tarih });
  } catch (error: any) {
    return NextResponse.json({ hata: error.message || 'Sunucu hatası' }, { status: 500 });
  }
}
