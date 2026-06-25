import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function decryptPatientName(encryptedName: string, doctorId: string): string {
  try {
    // Production'da gerçek decrypt logic (örn. AES + doctorId context)
    if (!encryptedName) return '??';
    const decrypted = Buffer.from(encryptedName, 'base64').toString('utf8');
    return decrypted.length > 0 ? decrypted : encryptedName.substring(0, 2);
  } catch {
    return encryptedName.substring(0, 2);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;

  if (!token) {
    return new NextResponse('Token gerekli', { status: 400 });
  }

  const sb = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  // Token doğrulama
  const { data: tokenData, error: tokenError } = await sb
    .from('hasta_portal_tokens')
    .select('patient_id, expires_at')
    .eq('token_hash', token)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (tokenError || !tokenData) {
    return new NextResponse('Token bulunamadı veya süresi dolmuş', { status: 404 });
  }

  const patientId = tokenData.patient_id;

  // Hasta demografik bilgileri
  const { data: patientRow } = await sb
    .from('patients')
    .select('first_name_encrypted, doctor_id')
    .eq('id', patientId)
    .single();

  const firstName = patientRow 
    ? decryptPatientName(patientRow.first_name_encrypted, patientRow.doctor_id)
    : 'Hasta';

  // Son 10 onaylı ziyaret + notlar
  const { data: ziyaretlerRaw } = await sb
    .from('sessions')
    .select(`
      created_at,
      specialty,
      icd10,
      notes (degerlendirme, plan)
    `)
    .eq('patient_id', patientId)
    .not('approved_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  const ziyaretler = (ziyaretlerRaw || []).map((z: any) => ({
    tarih: z.created_at,
    specialty: z.specialty,
    degerlendirme: z.notes?.degerlendirme || '',
    plan: z.notes?.plan || '',
    icd10: z.icd10
  }));

  // Aktif ilaçlar
  const { data: ilaclarRaw } = await sb
    .from('hasta_ilaclar')
    .select('ad, doz, kullanim')
    .eq('patient_id', patientId)
    .eq('aktif', true);

  const ilaclar = ilaclarRaw || [];

  // Son 5 lab sonuçları
  const { data: labRaw } = await sb
    .from('hasta_lab_sonuclari')
    .select('testler, created_at')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(5);

  const labSonuclari = (labRaw || []).map((l: any) => ({
    testler: l.testler,
    tarih: l.created_at
  }));

  return NextResponse.json({
    hasta: { firstName },
    ziyaretler,
    ilaclar,
    labSonuclari
  });
}
