import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)


export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const supabase = getSupabase();
  const { data: sessionData, error: sessionError } = await supabase.auth.getUser();

  if (sessionError || !sessionData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let query = supabase.from('mali_musteriler').select('*').eq('musavir_id', sessionData.user.id);

    if (id) {
      query = query.eq('id', id);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = getSupabase();
  const { data: sessionData, error: sessionError } = await supabase.auth.getUser();

  if (sessionError || !sessionData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const musteriId = crypto.randomUUID();
    const currentDate = new Date().toISOString();
    const nextMonthDate = new Date(new Date().setMonth(new Date().getMonth()+1)).toISOString();

    const newMusteri = {
      id: musteriId,
      musavir_id: sessionData.user.id,
      sirket_adi: body.sirket_adi,
      vergi_no: body.vergi_no,
      faaliyet_alani: body.faaliyet_alani,
      sirket_turu: body.sirket_turu,
      yetkili_kisi: body.yetkili_kisi,
      telefon: body.telefon,
      email: body.email,
      notlar: body.notlar,
      is_active: true,
      created_at: currentDate,
      updated_at: currentDate,
    };

    const { data, error } = await supabase.from('mali_musteriler').insert([newMusteri]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create beyan_takvimi entries
    const beyanEntries = [
      {
        id: crypto.randomUUID(),
        musavir_id: sessionData.user.id,
        client_id: musteriId,
        beyan_turu: 'KDV1 Beyanname',
        son_gun: nextMonthDate.replace(/(\d{2})\.(\d{2})\.(\d{4})/, '$3-$1-$2'),
        tamamlandi: false,
        hatirlatma_gonderildi: false,
        notlar: '',
        created_at: currentDate,
      },
      {
        id: crypto.randomUUID(),
        musavir_id: sessionData.user.id,
        client_id: musteriId,
        beyan_turu: 'Muhtasar Beyanname',
        son_gun: nextMonthDate.replace(/(\d{2})\.(\d{2})\.(\d{4})/, '$3-$1-$2'),
        tamamlandi: false,
        hatirlatma_gonderildi: false,
        notlar: '',
        created_at: currentDate,
      },
      {
        id: crypto.randomUUID(),
        musavir_id: sessionData.user.id,
        client_id: musteriId,
        beyan_turu: 'SGK Bildirgesi',
        son_gun: nextMonthDate.replace(/(\d{2})\.(\d{2})\.(\d{4})/, '$3-$1-$2'),
        tamamlandi: false,
        hatirlatma_gonderildi: false,
        notlar: '',
        created_at: currentDate,
      },
    ];

    if (['limited', 'anonim'].includes(body.sirket_turu)) {
      beyanEntries.push({
        id: crypto.randomUUID(),
        musavir_id: sessionData.user.id,
        client_id: musteriId,
        beyan_turu: 'Kurumlar Vergisi',
        son_gun: nextMonthDate.replace(/(\d{2})\.(\d{2})\.(\d{4})/, '$3-04-30'),
        tamamlandi: false,
        hatirlatma_gonderildi: false,
        notlar: '',
        created_at: currentDate,
      });
    }

    const { error: beyanError } = await supabase.from('beyan_takvimi').insert(beyanEntries);

    if (beyanError) {
      return NextResponse.json({ error: beyanError.message }, { status: 500 });
    }

    return NextResponse.json(newMusteri);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const supabase = getSupabase();
  const { data: sessionData, error: sessionError } = await supabase.auth.getUser();

  if (sessionError || !sessionData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updatedFields } = body;

    const { data, error } = await supabase
      .from('mali_musteriler')
      .update(updatedFields)
      .eq('id', id)
      .eq('musavir_id', sessionData.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const supabase = getSupabase();
  const { data: sessionData, error: sessionError } = await supabase.auth.getUser();

  if (sessionError || !sessionData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('mali_musteriler')
      .update({ is_active: false })
      .eq('id', id)
      .eq('musavir_id', sessionData.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}