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

  let name = 'Bilinmiyor', dob = null, gender = null, phone = null, notesData: Record<string, unknown> = {};
  try { if (patient.name_encrypted) name = JSON.parse(decrypt(patient.name_encrypted)).ad || 'Bilinmiyor'; } catch {}
  try { if (patient.dob_encrypted) dob = decrypt(patient.dob_encrypted); } catch {}
  try { if (patient.gender_encrypted) gender = decrypt(patient.gender_encrypted); } catch {}
  try { if (patient.phone_encrypted) phone = decrypt(patient.phone_encrypted); } catch {}
  try { if (patient.notes_encrypted) notesData = JSON.parse(decrypt(patient.notes_encrypted)); } catch {}

  return NextResponse.json({
    patient: {
      id: patient.id,
      ad_soyad: name,
      dogum_tarihi: dob,
      cinsiyet: gender,
      telefon: phone,
      sehir: notesData.sehir || null,
      kan_grubu: notesData.kanGrubu || null,
      kronik_hastaliklar: notesData.kronikHastaliklar || [],
      alerjiler: notesData.alerjiler || null,
      surekli_ilaclar: notesData.suregenIlaclar || null,
      sigara_alkol: notesData.sigaraAlkol || null,
      is_active: patient.is_active,
      created_at: patient.created_at,
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
  const updateData: Record<string, unknown> = {};

  if (body.ad_soyad) updateData.name_encrypted = encrypt(JSON.stringify({ ad: body.ad_soyad }));
  if (body.dogum_tarihi) updateData.dob_encrypted = encrypt(body.dogum_tarihi);
  if (body.cinsiyet) updateData.gender_encrypted = encrypt(body.cinsiyet);
  if (body.telefon) updateData.phone_encrypted = encrypt(body.telefon);

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
