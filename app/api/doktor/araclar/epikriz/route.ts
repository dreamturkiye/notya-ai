import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { groqChat } from '@/lib/dr-ayse/groq';

export const dynamic = 'force-dynamic';

interface EpikrizRequest {
  hastaId: string;
  seansId: string;
  ekBilgi?: string;
}

interface EpikrizResponse {
  epikriz: {
    basvuruSikayeti: string;
    anamnestiKBilgi: string;
    fizikMuayene: string;
    tani: { icd10: string; aciklama: string };
    tedavi: string;
    takipOnerisi: string;
    ekNotlar: string;
  };
  tarih: string;
  specialty: string;
}



export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body: EpikrizRequest = await request.json();
    const { hastaId, seansId, ekBilgi } = body;

    if (!hastaId || !seansId) {
      return NextResponse.json(
        { hata: 'Hasta ID ve seans ID zorunludur.' },
        { status: 400 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      request.headers.get('Authorization')?.replace('Bearer ', '') || ''
    );

    if (authError || !user) {
      return NextResponse.json(
        { hata: 'Yetkilendirme başarısız.' },
        { status: 401 }
      );
    }

    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .eq('session_id', seansId)
      .eq('doctor_id', user.id)
      .single();

    if (noteError || !note) {
      return NextResponse.json(
        { hata: 'SOAP notu bulunamadı.' },
        { status: 404 }
      );
    }

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('specialty,started_at')
      .eq('id', seansId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { hata: 'Seans bilgisi bulunamadı.' },
        { status: 404 }
      );
    }

    const systemPrompt = `Türkiye Sağlık Bakanlığı standart epikriz formatında yaz. Sadece JSON: {basvuruSikayeti,anamnestiKBilgi,fizikMuayene,tani:{icd10,aciklama},tedavi,takipOnerisi,ekNotlar}`;

    const userPrompt = `SOAP notu:
Subjektif: ${note.content_subjektif || ''}
Objektif: ${note.content_objektif || ''}
Değerlendirme: ${note.content_degerlendirme || ''}
Plan: ${note.content_plan || ''}
İlaçlar: ${note.ilaclar || ''}
ICD10: ${note.icd10_codes || ''}
Ek bilgi: ${ekBilgi || ''}
Hastanın specialty: ${session.specialty}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const epikrizJson = JSON.parse(completion || '{}');

    const response: EpikrizResponse = {
      epikriz: epikrizJson,
      tarih: session.started_at,
      specialty: session.specialty,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Epikriz oluşturma hatası:', error);
    return NextResponse.json(
      { hata: 'Epikriz oluşturulurken bir hata oluştu.' },
      { status: 500 }
    );
  }
}
