import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { groqChat } from '@/lib/dr-ayse/groq';

export const dynamic = 'force-dynamic';

interface EpikrizRequest {
  hastaId: string;
  seansId: string;
  ekBilgi?: string;
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

    const systemPrompt = `Türkiye Sağlık Bakanlığı standart epikriz formatında yaz. Sadece JSON döndür, başka hiçbir şey yazma: {"hastaBilgileri":"...","taniVeTedavi":"...","taburcuOzeti":"..."}`;

    const userPrompt = `SOAP notu:
Subjektif: ${note.content_subjektif || ''}
Objektif: ${note.content_objektif || ''}
Değerlendirme: ${note.content_degerlendirme || ''}
Plan: ${note.content_plan || ''}
İlaçlar: ${note.content_ilaclar || ''}
ICD10: ${note.icd10_codes || ''}
Ek bilgi: ${ekBilgi || ''}
Hastanın specialty: ${session.specialty || 'genel'}`;

    const raw = await groqChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.2, jsonMode: true }
    );

    let parsed: { hastaBilgileri?: string; taniVeTedavi?: string; taburcuOzeti?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ hata: 'AI yanıtı geçersiz format' }, { status: 502 });
    }

    return NextResponse.json({
      hastaBilgileri: parsed.hastaBilgileri || '',
      taniVeTedavi: parsed.taniVeTedavi || '',
      taburcuOzeti: parsed.taburcuOzeti || '',
    });
  } catch (error) {
    console.error('Epikriz oluşturma hatası:', error);
    return NextResponse.json(
      { hata: 'Epikriz oluşturulurken bir hata oluştu.' },
      { status: 500 }
    );
  }
}
