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

export async function GET(req: NextRequest) {
  const token = verifyAuthToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const supabase = await getSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
  }

  const { data: patients, error } = await supabase
    .from('patients')
    .select('id, tc_kimlik_hash, name_encrypted, is_active, created_at')
    .eq('doctor_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Hastalar alınamadı' }, { status: 500 });
  }

  const maskedPatients = patients.map((p: any) => ({
    id: p.id,
    masked_name: p.name_encrypted ? 
      (JSON.parse(decrypt(p.name_encrypted)).ad || '??') + ' ***' : 'Bilinmiyor ***',
    last_visit: p.created_at,
    is_active: true
  }));

  return NextResponse.json({ patients: maskedPatients });
}

export async function POST(req: NextRequest) {
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
  const { tcKimlikNo, adSoyad, dogumTarihi, cinsiyet, telefon, sehir, kanGrubu, kronikHastaliklar, alerjiler, suregenIlaclar, sigaraAlkol } = body;

  if (!tcKimlikNo || tcKimlikNo.length !== 11) {
    return NextResponse.json({ error: 'Geçersiz TC Kimlik' }, { status: 400 });
  }
  if (!adSoyad || !adSoyad.trim()) {
    return NextResponse.json({ error: 'Ad Soyad zorunlu' }, { status: 400 });
  }

  const tcHash = require('crypto').createHash('sha256').update(tcKimlikNo).digest('hex');

  const encryptedAd = encrypt(JSON.stringify({ ad: adSoyad }));
  const encryptedDob = dogumTarihi ? encrypt(dogumTarihi) : null;
  const encryptedGender = cinsiyet ? encrypt(cinsiyet) : null;
  const encryptedPhone = telefon ? encrypt(telefon) : null;
  const notesPayload = { sehir, kanGrubu, kronikHastaliklar, alerjiler, suregenIlaclar, sigaraAlkol };
  const encryptedNotes = encrypt(JSON.stringify(notesPayload));

  const { data, error } = await supabase
    .from('patients')
    .insert({
      doctor_id: user.id,
      tc_kimlik_hash: tcHash,
      name_encrypted: encryptedAd,
      dob_encrypted: encryptedDob,
      gender_encrypted: encryptedGender,
      phone_encrypted: encryptedPhone,
      notes_encrypted: encryptedNotes,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('patients insert error:', error.message, error.details, error.hint);
    return NextResponse.json({ error: 'Hasta oluşturulamadı: ' + error.message }, { status: 500 });
  }

  return NextResponse.json({ patient: data });
}
