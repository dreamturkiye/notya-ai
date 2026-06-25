import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encrypt, decrypt } from '@/lib/security/encryption';

export const dynamic = 'force-dynamic';

async function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function verifyAuthToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.replace('Bearer ', '');
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = verifyAuthToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const supabase = await getSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
  }

  const { data: patient, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', params.id)
    .eq('doctor_id', user.id)
    .single();

  if (error || !patient) {
    return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 });
  }

  let decryptedData = {};
  if (patient.ad_soyad_encrypted) {
    try {
      decryptedData = JSON.parse(decrypt(patient.ad_soyad_encrypted));
    } catch {}
  }

  return NextResponse.json({ 
    patient: { 
      ...patient, 
      ...decryptedData,
      ad_soyad_encrypted: undefined 
    } 
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = verifyAuthToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const supabase = await getSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
  }

  const body = await req.json();
  const updateData: any = { ...body };

  if (body.ad_soyad) {
    updateData.ad_soyad_encrypted = encrypt(JSON.stringify({ ad: body.ad_soyad }));
    delete updateData.ad_soyad;
  }

  const { data, error } = await supabase
    .from('patients')
    .update(updateData)
    .eq('id', params.id)
    .eq('doctor_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Güncelleme başarısız' }, { status: 500 });
  }

  return NextResponse.json({ patient: data });
}
