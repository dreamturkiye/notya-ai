export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import groqChat from '@/lib/dr-ayse/groq';

interface IlacInput {
  ad: string;
  doz: string;
  kullanim: string;
  sure: string;
}

interface RequestBody {
  hastaId: string;
  tani: string;
  notlar: string;
  ilaclar: IlacInput[];
}

const getSB = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ hata: 'Yetkilendirme başlığı eksik' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const sb = getSB();
    const { data: { user }, error: authError } = await sb.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ hata: 'Geçersiz veya süresi dolmuş token' }, { status: 401 });
    }

    const body: RequestBody = await request.json();
    const { hastaId, tani, notlar, ilaclar } = body;

    if (!hastaId || !tani) {
      return NextResponse.json({ hata: 'hastaId ve tani zorunludur' }, { status: 400 });
    }

    const { data: hasta, error: hastaError } = await sb
      .from('patients')
      .select('name_encrypted, notes_encrypted')
      .eq('id', hastaId)
      .single();

    if (hastaError || !hasta) {
      return NextResponse.json({ hata: 'Hasta bulunamadı' }, { status: 404 });
    }

    const alerjiBilgisi = hasta.notes_encrypted || 'Bilgi yok';

    const systemPrompt =
      'Sen uzman Türk hekimisin. e-Reçete taslağı üret. Sadece JSON: {icd10:{kod,aciklama},ilaclar:[{ad,etkenMadde,doz,kullanim,sure,sgkNotu}],interaksiyonlar:[{ilac1,ilac2,siddet,aciklama,oneri}],uyarilar:[string]}';

    const userMessage = `Tanı: ${tani}. Notlar: ${notlar}. İstenen ilaçlar: ${JSON.stringify(ilaclar)}. Hasta alerjileri ve kronik hastalıklar: ${alerjiBilgisi}`;

    const groqResponse = await groqChat(systemPrompt, userMessage);
    const parsedRecete = JSON.parse(groqResponse);

    const recete = {
      tani,
      icd10: parsedRecete.icd10,
      ilaclar: parsedRecete.ilaclar,
      interaksiyonlar: parsedRecete.interaksiyonlar,
      uyarilar: parsedRecete.uyarilar,
      tarih: new Date().toISOString(),
    };

    return NextResponse.json({ recete });
  } catch (error) {
    console.error('e-Reçete oluşturma hatası:', error);
    return NextResponse.json({ hata: 'Sunucu hatası oluştu' }, { status: 500 });
  }
}
