import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function bearerToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } });
  const { data: { user }, error: authError } = await supabase.auth.getUser(bearerToken(request));

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 });
  }

  const body = await request.json();
  const {
    aktif, notlar, onay_durumu, bitis_tarihi,
    // NOTYA-ILAC-DUZEN-01: hekim İlaçlar sayfasında satırı doğrudan revize edebilsin.
    ad, ilac_adi, etkenMadde, etken_madde, doz, kullanim_sikli, baslangic_tarihi,
  } = body;

  const updateData: Record<string, unknown> = {};
  if (typeof aktif === 'boolean') updateData.aktif = aktif;
  if (notlar !== undefined) updateData.notlar = notlar;

  const yeniAd = typeof ad === 'string' ? ad.trim() : typeof ilac_adi === 'string' ? ilac_adi.trim() : '';
  if (yeniAd) updateData.ilac_adi = yeniAd.slice(0, 200);
  const yeniEtken = typeof etkenMadde === 'string' ? etkenMadde.trim() : typeof etken_madde === 'string' ? etken_madde.trim() : undefined;
  if (yeniEtken !== undefined) updateData.etken_madde = yeniEtken ? yeniEtken.slice(0, 200) : null;
  if (typeof doz === 'string') updateData.doz = doz.trim().slice(0, 120) || null;
  // Kullanım sıklığı serbest metin — sabit seçenek zorunlu değil.
  if (typeof kullanim_sikli === 'string') updateData.kullanim_sikli = kullanim_sikli.trim().slice(0, 120) || null;
  if (typeof baslangic_tarihi === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(baslangic_tarihi.trim())) {
    updateData.baslangic_tarihi = baslangic_tarihi.trim();
  }

  // NOTYA-RECETE-01: nottan aktarılan reçete 'beklemede' gelir ve hastaya
  // görünmez. Doktor burada karar verir: 'onayli' + aktif=true (kullanmaya devam
  // ediyor) ya da 'onayli' + aktif=false + bitiş tarihi (kür bitti). Karar
  // verilene kadar satır portalda çıkmaz.
  if (onay_durumu !== undefined) {
    if (onay_durumu !== 'beklemede' && onay_durumu !== 'onayli') {
      return NextResponse.json(
        { error: "onay_durumu yalnızca 'beklemede' veya 'onayli' olabilir." },
        { status: 400 }
      );
    }
    updateData.onay_durumu = onay_durumu;
  }
  if (bitis_tarihi !== undefined) updateData.bitis_tarihi = bitis_tarihi || null;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'Güncellenecek alan yok.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('hasta_ilaclar')
    .update(updateData)
    .eq('id', params.id)
    .eq('doctor_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } });
  const { data: { user }, error: authError } = await supabase.auth.getUser(bearerToken(request));

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 });
  }

  const { error } = await supabase
    .from('hasta_ilaclar')
    .delete()
    .eq('id', params.id)
    .eq('doctor_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
