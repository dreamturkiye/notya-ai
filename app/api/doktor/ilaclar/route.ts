import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi';
import { arsivsizIlaclar } from '@/lib/doktor/arsiv';
import { dosyaSorguVerisiDerle } from '@/lib/doktor/dosyaOlaylari';
import { dozGuvenligi } from '@/lib/doktor/dozGuvenligi';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } });
  const _authH = request.headers.get('authorization')
  const _tok = _authH?.startsWith('Bearer ') ? _authH.slice(7) : undefined
  const { data: { user }, error: authError } = await supabase.auth.getUser(_tok);

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const hastaId = searchParams.get('hastaId');

  if (!hastaId) {
    return NextResponse.json({ error: 'Hasta seçimi zorunludur.' }, { status: 400 });
  }

  // NOTYA-RECETE-01: 'beklemede' satırlar nottan aktarılmış, doktorun kararını
  // bekleyen reçeteler. Doktora hepsi döner (kuyruk burada gösterilir); hastaya
  // yalnızca 'onayli' olanlar gider — bkz. app/api/portal/hasta/[token]/route.ts
  // NOTYA-ARSIV-02: arşivlenmiş muayenenin notunun yazdığı ilaçlar dosyada görünmez.
  const { data, error } = await arsivsizIlaclar(supabase, '*')
    .eq('doctor_id', user.id)
    .eq('patient_id', hastaId)
    .order('onay_durumu', { ascending: true })
    .order('aktif', { ascending: false })
    .order('baslangic_tarihi', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // NOTYA-ILK10-DOZ-01: the drug card shows the same dose-safety flag Ayşe reports (Q6 / Q9 / Q10): mg/kg/day with the
  // weight at the start date, measured against the Notya drug table, and a product mismatch with the visit's
  // prescription. HASTA-IZOLASYON-01: dosyaSorguVerisiDerle reads the patient row by id AND this doctor's id (a foreign
  // patient → null → no flag) and scopes every child read the same way. The flag is extra; the list never fails on it.
  let satirlar = data;
  try {
    const sorgu = await dosyaSorguVerisiDerle(supabase, user.id, hastaId);
    if (sorgu && Array.isArray(data)) {
      const g = dozGuvenligi(sorgu.olaylar, sorgu.hasta);
      const bayraklar = new Map<string, string[]>();
      const ekle = (id: string, metin: string) => bayraklar.set(id, [...(bayraklar.get(id) || []), metin]);
      for (const d of g.ilaclar) if (d.kaynak === 'liste' && d.bayrak) ekle(d.kaynakId, d.metin);
      for (const u of g.uyumsuzluklar) ekle(u.listeId, u.metin);
      if (bayraklar.size) satirlar = data.map((r: { id: string }) => (bayraklar.has(String(r.id)) ? { ...r, doz_guvenligi: bayraklar.get(String(r.id)) } : r));
    }
  } catch (e) {
    console.error('[ilaclar] doz güvenliği', e instanceof Error ? e.message.slice(0, 200) : 'hata');
  }

  return NextResponse.json(satirlar);
}

export async function POST(request: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } });
  const _authH = request.headers.get('authorization')
  const _tok = _authH?.startsWith('Bearer ') ? _authH.slice(7) : undefined
  const { data: { user }, error: authError } = await supabase.auth.getUser(_tok);

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 });
  }

  const body = await request.json();
  const { hastaId, ad, etkenMadde, doz, kullanim_sikli, baslangic_tarihi, bitis_tarihi, notlar, barkod, kutu_adedi } = body;

  if (!hastaId || !ad || !etkenMadde || !doz || !kullanim_sikli || !baslangic_tarihi) {
    return NextResponse.json({ error: 'Zorunlu alanlar eksik.' }, { status: 400 });
  }
  // HASTA-IZOLASYON-01: onay_durumu defaults to 'onayli', so a row written here is on the patient's
  // portal immediately — it must never be written for another doctor's patient.
  if (!(await hastaSahibiMi(supabase, user.id, hastaId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('hasta_ilaclar')
    .insert({
      doctor_id: user.id,
      patient_id: hastaId,
      ilac_adi: ad,
      // NOTYA-ILAC-05: the barcode identifies the exact presentation, which is what e-reçete
      // records. Without it a saved "LARGOPEN 500 MG" cannot be turned into a prescription later
      // without the doctor choosing the pack again.
      barkod: barkod || null,
      kutu_adedi: kutu_adedi || 1,
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
