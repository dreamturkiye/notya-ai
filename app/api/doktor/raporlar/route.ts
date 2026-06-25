import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface TopTani {
  kod: string;
  aciklama: string;
  sayi: number;
}

interface UzmanlikDagilimi {
  specialty: string;
  sayi: number;
}

interface GunlukAktivite {
  tarih: string;
  sayi: number;
}

interface RaporResponse {
  buAyMuayene: number;
  toplamMuayene: number;
  aktifHasta: number;
  bekleyenOnay: number;
  tamamlananNot: number;
  topTanilar: TopTani[];
  uzmanlikDagilimi: UzmanlikDagilimi[];
  gunlukAktivite: GunlukAktivite[];
}

export async function GET(request: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const doctor_id = user.id;

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get('month');

  let startDate: Date;
  let endDate: Date;

  if (monthParam) {
    const [year, month] = monthParam.split('-').map(Number);
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0, 23, 59, 59, 999);
  } else {
    const now = new Date();
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  try {
    // 1. Bu ay muayene sayısı
    const { count: buAyMuayene } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctor_id)
      .gte('started_at', startISO)
      .lte('started_at', endISO);

    // 2. Toplam muayene sayısı
    const { count: toplamMuayene } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctor_id);

    // 3. Aktif hasta sayısı
    const { count: aktifHasta } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctor_id)
      .eq('is_active', true);

    // 4. Bekleyen onay sayısı
    const { count: bekleyenOnay } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctor_id)
      .is('approved_at', null);

    // 5. Tamamlanan not sayısı (bu ay)
    const { count: tamamlananNot } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctor_id)
      .not('approved_at', 'is', null)
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    // 6. Top tanılar (JSONB parse + aggregate)
    const { data: notesData } = await supabase
      .from('notes')
      .select('icd10_codes')
      .eq('doctor_id', doctor_id)
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    const taniCounts: Record<string, number> = {};
    notesData?.forEach((note) => {
      const codes = note.icd10_codes;
      if (Array.isArray(codes)) {
        codes.forEach((code: string) => {
          taniCounts[code] = (taniCounts[code] || 0) + 1;
        });
      }
    });

    const topTanilar: TopTani[] = Object.entries(taniCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([kod, sayi]) => ({ kod, aciklama: kod, sayi }));

    // 7. Uzmanlık dağılımı
    const { data: uzmanlikData } = await supabase
      .from('sessions')
      .select('specialty')
      .eq('doctor_id', doctor_id)
      .gte('started_at', startISO)
      .lte('started_at', endISO);

    const uzmanlikCounts: Record<string, number> = {};
    uzmanlikData?.forEach((s) => {
      const spec = s.specialty || 'Belirtilmemiş';
      uzmanlikCounts[spec] = (uzmanlikCounts[spec] || 0) + 1;
    });

    const uzmanlikDagilimi: UzmanlikDagilimi[] = Object.entries(uzmanlikCounts).map(
      ([specialty, sayi]) => ({ specialty, sayi })
    );

    // 8. Günlük aktivite
    const { data: dailyData } = await supabase
      .from('sessions')
      .select('started_at')
      .eq('doctor_id', doctor_id)
      .gte('started_at', startISO)
      .lte('started_at', endISO);

    const gunlukCounts: Record<string, number> = {};
    dailyData?.forEach((s) => {
      if (s.started_at) {
        const day = s.started_at.split('T')[0];
        gunlukCounts[day] = (gunlukCounts[day] || 0) + 1;
      }
    });

    const gunlukAktivite: GunlukAktivite[] = Object.entries(gunlukCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([tarih, sayi]) => ({ tarih, sayi }));

    const response: RaporResponse = {
      buAyMuayene: buAyMuayene || 0,
      toplamMuayene: toplamMuayene || 0,
      aktifHasta: aktifHasta || 0,
      bekleyenOnay: bekleyenOnay || 0,
      tamamlananNot: tamamlananNot || 0,
      topTanilar,
      uzmanlikDagilimi,
      gunlukAktivite,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Rapor API hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
