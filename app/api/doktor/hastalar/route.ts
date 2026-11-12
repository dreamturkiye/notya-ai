import { NextRequest, NextResponse } from 'next/server';
import { pratikOturum } from '@/lib/doktor/pratikOturum';
import { decrypt } from '@/lib/security/encryption';
import { hastaDosyaAra, klinikAramaMi } from '@/lib/doktor/hastaDosyaAra';
import { hastaKaydiOlustur } from '@/lib/doktor/hastaOlustur'
import { izinVarMi } from '@/lib/doktor/personelYetki'

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // NOTYA-SEKRETER-01: pratikOturum — sekreter, bağlı hekimin hasta listesini görür (doktorId).
  const oturum = await pratikOturum(req);
  if ('hata' in oturum) return oturum.hata;
  const { supabase, doktorId, rol } = oturum;

  const q = String(req.nextUrl.searchParams.get('q') || '').trim()
  // MOBIL-PERSONEL-01: the clinical-content search returns file summaries — only roles that may read the file.
  if (q && klinikAramaMi(q) && izinVarMi(rol, 'hasta.dosya.oku')) {
    const ara = await hastaDosyaAra(supabase, doktorId, q)
    return NextResponse.json({
      arama: true,
      sayi: ara.length,
      patients: ara.map((a) => ({
        id: a.id,
        name: a.ad,
        masked_name: a.ad,
        tc_kimlik_hash: '',
        last_visit: a.dobMetin,
        is_active: true,
        ozet: a.ozet,
      })),
    })
  }

  const { data: patients, error } = await supabase
    .from('patients')
    .select('id, tc_kimlik_hash, name_encrypted, is_active, created_at')
    .eq('doctor_id', doktorId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Hastalar alınamadı' }, { status: 500 });
  }

  const maskedPatients = patients.map((p: {
    id: string
    tc_kimlik_hash: string | null
    name_encrypted: string | null
    is_active: boolean | null
    created_at: string
  }) => {
    let fullName = 'Bilinmiyor'
    try {
      if (p.name_encrypted) {
        const parsed = JSON.parse(decrypt(p.name_encrypted)) as { ad?: string }
        fullName = (parsed.ad || '').trim() || 'Bilinmiyor'
      }
    } catch {
      fullName = 'Bilinmiyor'
    }

    return {
      id: p.id,
      // Doctor's own roster — full name for search/display (not a public list).
      name: fullName,
      masked_name: fullName, // backward-compatible for tool pages
      tc_kimlik_hash: p.tc_kimlik_hash || '',
      last_visit: p.created_at,
      is_active: p.is_active !== false,
    }
  })

  return NextResponse.json({ patients: maskedPatients })
}

export async function POST(req: NextRequest) {
  // NOTYA-SEKRETER-01: ön büro da hekim adına hasta ekleyebilir — doctor_id = doktorId.
  const oturum = await pratikOturum(req);
  if ('hata' in oturum) return oturum.hata;
  const { supabase, doktorId, rol } = oturum;

  const body = await req.json();
  const { tcKimlikNo, adSoyad, dogumTarihi, cinsiyet, telefon, eposta, sehir, kanGrubu, kronikHastaliklar, alerjiler, suregenIlaclar, sigaraAlkol } = body;
  // MOBIL-PERSONEL-01: a role without clinical-file write access (hasta_danismani) registers demographics + contact only.
  const klinikYazabilir = izinVarMi(rol, 'hasta.dosya.yaz');

  // QA-2026-09-06 (bot bulgusu): manuel formda e-posta ve TC alanları yokken API ikisini de
  // ZORUNLU sayıyordu — manuel hasta eklemek imkansızdı. Ürün felsefesiyle hizalandı:
  // zorunlu olan yalnız Ad Soyad (seans akışı da yalnız adla hasta yaratır); TC verilirse
  // doğrulanır, e-posta verilirse karşılama akışlarında kullanılır.
  if (tcKimlikNo && String(tcKimlikNo).length !== 11) {
    return NextResponse.json({ error: 'Geçersiz TC Kimlik' }, { status: 400 });
  }
  if (!adSoyad || !adSoyad.trim()) {
    return NextResponse.json({ error: 'Ad Soyad zorunludur.' }, { status: 400 });
  }
  if (eposta && !String(eposta).includes('@')) {
    return NextResponse.json({ error: 'E-posta adresi geçersiz.' }, { status: 400 });
  }

  // The single patient-create write (shared with the WhatsApp front-desk approval — lib/doktor/hastaOlustur.ts).
  const notlar = klinikYazabilir
    ? { sehir, kanGrubu, kronikHastaliklar, alerjiler, suregenIlaclar, sigaraAlkol }
    : { sehir };
  const s = await hastaKaydiOlustur(supabase, doktorId, { adSoyad, tcKimlikNo, dogumTarihi, cinsiyet, telefon, eposta, notlar });
  if (!s.ok) {
    console.error('patients insert error:', s.hata);
    return NextResponse.json({ error: 'Hasta oluşturulamadı: ' + s.hata }, { status: 500 });
  }
  const data = s.patient;
  return NextResponse.json({ patient: data });
}
