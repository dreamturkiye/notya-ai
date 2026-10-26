import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { goruntuImzaliUrl } from '@/lib/doktor/goruntulemeImzaliUrl';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }), headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hastaId = searchParams.get('hastaId');

    let query = supabase
      .from('hasta_goruntulemeler')
      .select('*')
      .eq('doctor_id', user.id)
      .order('goruntuleme_tarihi', { ascending: false });

    if (hastaId) {
      query = query.eq('patient_id', hastaId);
    }

    const { data: goruntulemeler, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Veri alınamadı' }, { status: 500 });
    }

    // HASTA-GORUNTU-GIZLILIK-01: dosya_url satırda yalnızca bir storage referansı — kova private,
    // her okumada taze kısa ömürlü imzalı URL üretilir, hiçbir zaman kalıcı/public bir URL değil.
    const sonuc = await Promise.all(
      (goruntulemeler || []).map(async (g) => ({ ...g, dosya_url: (await goruntuImzaliUrl(supabase, g.dosya_url)) || '' }))
    );

    return NextResponse.json(sonuc);
  } catch (error) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
