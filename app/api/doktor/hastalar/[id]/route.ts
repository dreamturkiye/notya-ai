import { NextRequest, NextResponse } from 'next/server';
import { doktorOturum } from '@/lib/doktor/serverAuth';
import { encrypt, decrypt } from '@/lib/security/encryption';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // NOTYA-AUTH-01: one server-side convention, one honest 401.
  const oturum = await doktorOturum(req);
  if ('hata' in oturum) return oturum.hata;
  const { user, supabase } = oturum;

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
  // NOTYA-AUTH-01: one server-side convention, one honest 401.
  const oturum = await doktorOturum(req);
  if ('hata' in oturum) return oturum.hata;
  const { user, supabase } = oturum;

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
