import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const getSB = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const supabase = getSB();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const supabase = getSB();
  const { data, error } = await supabase
    .from('hasta_hatirlatma')
    .select('*')
    .eq('doctor_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: 'Veri alınamadı' }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const body = await req.json();
  const { hastaId, mesaj, tarih, kanal } = body;

  if (!hastaId || !mesaj || !tarih || !kanal) {
    return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });
  }

  const supabase = getSB();

  const insertData: any = {
    doctor_id: user.id,
    patient_id: hastaId,
    mesaj,
    gonder_tarih: tarih,
    gonderildi: false,
    kanal,
  };

  let gonderildi = false;

  if (kanal === 'whatsapp') {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_WHATSAPP_FROM;

      if (!accountSid || !authToken || !from) {
        throw new Error('Twilio yapılandırması eksik');
      }



      gonderildi = true;
    } catch (err) {
      gonderildi = false;
    }
  }

  insertData.gonderildi = gonderildi;

  const { data: hatirlatma, error } = await supabase
    .from('hasta_hatirlatma')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Kayıt oluşturulamadı' }, { status: 500 });
  }

  return NextResponse.json({ hatirlatma, gonderildi });
}
