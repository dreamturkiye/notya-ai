import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/security/encryption';
import { sendTwilioMessage } from '@/lib/doktor/twilioNotify';

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
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

function patientPhone(phoneEncrypted: string | null | undefined): string {
  if (!phoneEncrypted) return '';
  try {
    return String(decrypt(phoneEncrypted) || '').trim();
  } catch {
    return '';
  }
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
  const { hastaId, mesaj, tarih, kanal } = body as {
    hastaId?: string;
    mesaj?: string;
    tarih?: string;
    kanal?: string;
  };

  if (!hastaId || !mesaj || !tarih || !kanal) {
    return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });
  }

  const channel = String(kanal).toLowerCase() === 'whatsapp' ? 'whatsapp' : 'sms';
  const supabase = getSB();

  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id, phone_encrypted')
    .eq('id', hastaId)
    .eq('doctor_id', user.id)
    .maybeSingle();

  if (patientError || !patient) {
    return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 });
  }

  const telefon = patientPhone(patient.phone_encrypted);
  if (!telefon) {
    return NextResponse.json(
      { error: 'Hastanın telefon numarası yok. Hasta kaydına telefon ekleyin.' },
      { status: 400 }
    );
  }

  const send = await sendTwilioMessage({
    channel,
    toPhone: telefon,
    body: String(mesaj),
  });

  const { data: hatirlatma, error } = await supabase
    .from('hasta_hatirlatma')
    .insert({
      doctor_id: user.id,
      patient_id: hastaId,
      mesaj: String(mesaj),
      gonder_tarih: tarih,
      gonderildi: send.ok,
      kanal: channel,
    })
    .select()
    .single();

  if (error) {
    console.error('hasta_hatirlatma insert error:', error.message);
    return NextResponse.json({ error: 'Kayıt oluşturulamadı' }, { status: 500 });
  }

  if (!send.ok) {
    return NextResponse.json(
      {
        hatirlatma,
        gonderildi: false,
        error: send.error,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    hatirlatma,
    gonderildi: true,
    method: channel,
    sid: send.sid,
  });
}
