import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const hastaId = formData.get('hastaId') as string;
    const modalite = formData.get('modalite') as string;
    const vucut_bolgesi = formData.get('vucut_bolgesi') as string;
    const rapor_metni = formData.get('rapor_metni') as string;
    const tarih = formData.get('tarih') as string;

    if (!file || !hastaId) {
      return NextResponse.json({ error: 'Dosya ve hastaId zorunludur' }, { status: 400 });
    }

    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `${user.id}/${hastaId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('hasta-goruntuleme')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: 'Dosya yüklenemedi' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from('hasta-goruntuleme')
      .getPublicUrl(filePath);

    const { data: goruntuleme, error: insertError } = await supabase
      .from('hasta_goruntulemeler')
      .insert({
        doctor_id: user.id,
        patient_id: hastaId,
        modalite,
        vucut_bolgesi,
        dosya_url: urlData.publicUrl,
        rapor_metni,
        goruntuleme_tarihi: tarih,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Kayıt oluşturulamadı' }, { status: 500 });
    }

    return NextResponse.json({ goruntuleme });
  } catch (error) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
