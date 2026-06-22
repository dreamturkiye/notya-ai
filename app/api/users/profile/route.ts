// app/api/users/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { profession_type, unvan, buro_adi, uzmanlik_alani, sehir, ...rest } = body;

  try {
    let { data, error } = await supabase
      .from('users')
      .update({
        profession_type,
        unvan,
        buro_adi,
        sehir,
        specialty: profession_type === 'mali_musavirlik' ? uzmanlik_alani : null,
        ...rest
      })
      .eq('id', req.cookies['sb:session']?.split('.')[0])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}