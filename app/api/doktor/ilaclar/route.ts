import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const hastaId = searchParams.get('hastaId');

  if (!hastaId) {
    return NextResponse.json({ error: 'hastaId is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('hasta_ilaclar')
    .select('*')
    .eq('doctor_id', user.id)
    .eq('patient_id', hastaId)
    .order('aktif', { ascending: false })
    .order('baslangic_tarihi', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { hastaId, ad, etkenMadde, doz, kullanim_sikli, baslangic_tarihi, bitis_tarihi, notlar } = body;

  if (!hastaId || !ad || !etkenMadde || !doz || !kullanim_sikli || !baslangic_tarihi) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('hasta_ilaclar')
    .insert({
      doctor_id: user.id,
      patient_id: hastaId,
      ilac_adi: ad,
      etken_madde: etkenMadde,
      doz,
      kullanim_sikli,
      baslangic_tarihi,
      bitis_tarihi: bitis_tarihi || null,
      aktif: true,
      notlar: notlar || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ilac: data });
}
