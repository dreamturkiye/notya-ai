/**
 * NOTYA-EPIKRIZ-02 (Kaan 2026-09-14): "PDF tamamen hatalı — database adlarını gösteriyor."
 * Kök sebep: hasta adı, doğum tarihi, tarihler, hekim adı hiç modele verilmiyordu — model
 * standart epikriz başlığını doldururken bilmediği alanlara [HASTA ADI SOYADI] gibi yer
 * tutucu yazıyordu. Çözüm: başlık ve imza artık AI'DAN GELMİYOR — gerçek veriden sunucuda
 * deterministik kuruluyor (reçete başlığı/yazdır sayfasıyla aynı ilke). AI yalnız Tanı ve
 * Tedavi + Taburcu Özeti'nin KLİNİK içeriğini üretiyor.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { groqChat } from '@/lib/dr-ayse/groq';
import { pseudonymize, restoreDeep, assertNoTckn } from '@/lib/security/pseudonymize';
import { decrypt } from '@/lib/security/encryption';
import { hekimAdi } from '@/lib/doktor/hekimAdi';

export const dynamic = 'force-dynamic';

interface EpikrizRequest {
  hastaId: string;
  seansId?: string;
  tumSeanslar?: boolean;
  ekBilgi?: string;
}

function coz(v: string | null | undefined): string {
  if (!v) return '';
  try { return decrypt(v); } catch { return ''; }
}
function trTarih(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' });
}
function yasHesapla(dogumIso: string | null): string {
  if (!dogumIso) return '';
  const d = new Date(dogumIso);
  if (isNaN(d.getTime())) return '';
  const simdi = new Date();
  let ay = (simdi.getFullYear() - d.getFullYear()) * 12 + (simdi.getMonth() - d.getMonth());
  if (simdi.getDate() < d.getDate()) ay -= 1;
  return ay < 24 ? `${Math.max(0, ay)} aylık` : `${Math.floor(ay / 12)} yaşında`;
}
function cinsiyetTr(ham: string): string {
  return ham === 'female' ? 'Kız/Kadın' : ham === 'male' ? 'Erkek' : 'Belirtilmemiş';
}

/** Ad/doğum/cinsiyet/branş/hekim — gerçek veriden, AI'ya hiç sormadan kurulan başlık. */
async function baslikKur(
  supabase: SupabaseClient, doktorId: string, patientId: string, branş: string, tarihIso: string,
): Promise<string> {
  const [{ data: hasta }, hekim] = await Promise.all([
    supabase.from('patients').select('name_encrypted, dob_encrypted, gender_encrypted').eq('id', patientId).maybeSingle(),
    hekimAdi(supabase, doktorId),
  ]);
  let adSoyad = '';
  try { const n = JSON.parse(coz(hasta?.name_encrypted)); adSoyad = [n.ad, n.soyad].filter(Boolean).join(' '); } catch { /* ad çözülemedi */ }
  const dogumIso = coz(hasta?.dob_encrypted) || null;
  const cinsiyet = cinsiyetTr(coz(hasta?.gender_encrypted));
  const tarih = trTarih(tarihIso) || trTarih(new Date().toISOString());

  const satirlar = [
    adSoyad ? `Ad Soyad: ${adSoyad}` : null,
    dogumIso ? `Doğum Tarihi: ${trTarih(dogumIso)} (${yasHesapla(dogumIso)})` : null,
    `Cinsiyet: ${cinsiyet}`,
    `Müracaat / Taburcu Tarihi: ${tarih}`,
    `Kliniği: ${branş || 'Pediatri'}`,
    hekim ? `Hekim: ${hekim}` : null,
  ].filter(Boolean);
  return satirlar.join('\n');
}

function imzaKur(hekim: string, branş: string, tarihIso: string): string {
  const satirlar = [
    hekim || 'Uzm. Dr.',
    branş ? `${branş} Uzmanı` : '',
    `Tarih: ${trTarih(tarihIso) || trTarih(new Date().toISOString())}`,
  ].filter(Boolean);
  return satirlar.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { global: { fetch: (u: RequestInfo | URL, o?: RequestInit) => fetch(u, { ...o, cache: 'no-store' }) } }
    );
    const body: EpikrizRequest = await request.json();
    const { hastaId, seansId, tumSeanslar, ekBilgi } = body;
    if (!hastaId || (!seansId && !tumSeanslar)) {
      return NextResponse.json({ hata: 'Hasta ID ve seans ID (veya tüm seanslar seçeneği) zorunludur.' }, { status: 400 });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      request.headers.get('Authorization')?.replace('Bearer ', '') || ''
    );
    if (authError || !user) {
      return NextResponse.json({ hata: 'Yetkilendirme başarısız.' }, { status: 401 });
    }

    if (tumSeanslar) {
      const { hastaDosyasiniDerle } = await import('@/lib/doktor/hastaDosyaDerleyici');
      const dosya = await hastaDosyasiniDerle(supabase, user.id, hastaId);
      if (!dosya) return NextResponse.json({ hata: 'Hasta dosyası bulunamadı.' }, { status: 404 });

      const hekim = await hekimAdi(supabase, user.id);
      const hastaBilgileri = await baslikKur(supabase, user.id, hastaId, 'Pediatri', new Date().toISOString());
      const kapsamliSystem = `Türkiye Sağlık Bakanlığı standart epikriz formatında, hastanın İLK GELİŞİNDEN BU YANA TÜM İZLEMİNİ özetleyen kapsamlı bir epikriz yaz. Sadece JSON döndür: {"taniVeTedavi":"...","taburcuOzeti":"..."}
BAŞLIK BİLGİLERİNİ (ad, tarih, hekim, protokol no vb.) YAZMA — ayrıca ekleniyor. İMZA/TARİH SATIRI YAZMA — ayrıca ekleniyor.
"taniVeTedavi" içinde SIRAYLA: (1) Geliş tanıları ve tarihleri — sağlam çocuk/rutin kontroller ile geçirilen hastalıkları AYRI listele; (2) Aşı karnesi — uygulanan aşılar ve tarihleri; (3) Kullanılan ilaç/takviyeler (geçmiş ve güncel, tarihleriyle).
"taburcuOzeti" içinde: genel klinik seyir, takip süresi, toplam vizit sayısı, 3-5 cümlelik özet.
Yalnız dosyada YER ALAN bilgiyi kullan, uydurma; bir bölüm boşsa "Kayıt yok" yaz.`;
      const kapsamliUser = `${dosya}\n\nEk bilgi: ${ekBilgi || ''}`;
      const { text: guvenliKapsamli, map: kapsamliMap } = pseudonymize(kapsamliUser);
      assertNoTckn(guvenliKapsamli, 'epikriz-kapsamli');
      const rawKapsamli = await groqChat(
        [{ role: 'system', content: kapsamliSystem }, { role: 'user', content: guvenliKapsamli }],
        { temperature: 0.2, jsonMode: true, maxTokens: 3000 }
      );
      let parsedKapsamli: { taniVeTedavi?: string; taburcuOzeti?: string };
      try {
        const temiz = rawKapsamli.replace(/```json\n?|\n?```/g, '').trim();
        parsedKapsamli = restoreDeep(JSON.parse(temiz), kapsamliMap);
      } catch {
        console.error('[epikriz-kapsamli] JSON parse başarısız, ham metin:', rawKapsamli.slice(0, 500));
        return NextResponse.json({ hata: 'Epikriz taslağı üretilemedi. Lütfen tekrar deneyin.' }, { status: 502 });
      }
      return NextResponse.json({
        hastaBilgileri,
        taniVeTedavi: parsedKapsamli.taniVeTedavi || '',
        taburcuOzeti: parsedKapsamli.taburcuOzeti || '',
        imza: imzaKur(hekim, 'Pediatri', new Date().toISOString()),
      });
    }

    const { data: note, error: noteError } = await supabase
      .from('notes').select('*, sessions!inner(patient_id, specialty, started_at)')
      .eq('session_id', seansId).eq('doctor_id', user.id).single();
    if (noteError || !note) {
      return NextResponse.json({ hata: 'SOAP notu bulunamadı.' }, { status: 404 });
    }
    const seansBilgi = Array.isArray(note.sessions) ? note.sessions[0] : note.sessions;
    const branş = seansBilgi?.specialty || 'Pediatri';
    const tarihIso = seansBilgi?.started_at || note.created_at;

    const hekim = await hekimAdi(supabase, user.id);
    const hastaBilgileri = await baslikKur(supabase, user.id, hastaId, branş, tarihIso);

    const systemPrompt = `Türkiye Sağlık Bakanlığı standart epikriz formatında yaz. Sadece JSON döndür, başka hiçbir şey yazma: {"taniVeTedavi":"...","taburcuOzeti":"..."}
BAŞLIK BİLGİLERİNİ (ad, tarih, hekim, protokol no vb.) YAZMA — ayrıca ekleniyor. İMZA/TARİH SATIRI YAZMA — ayrıca ekleniyor. Bilmediğin bir alan için ASLA köşeli parantez içinde yer tutucu ([...]) yazma.`;
    const userPrompt = `SOAP notu:
Subjektif: ${note.content_subjektif || ''}
Objektif: ${note.content_objektif || ''}
Değerlendirme: ${note.content_degerlendirme || ''}
Plan: ${note.content_plan || ''}
İlaçlar: ${note.content_ilaclar || ''}
ICD10: ${note.icd10_codes || ''}
Ek bilgi: ${ekBilgi || ''}
Hastanın specialty: ${branş}`;
    const { text: guvenliPrompt, map: epikrizMap } = pseudonymize(userPrompt);
    assertNoTckn(guvenliPrompt, 'epikriz');
    const raw = await groqChat(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: guvenliPrompt }],
      { temperature: 0.2, jsonMode: true, maxTokens: 3000 }
    );
    let parsed: { taniVeTedavi?: string; taburcuOzeti?: string };
    try {
      const temiz = raw.replace(/```json\n?|\n?```/g, '').trim();
      parsed = restoreDeep(JSON.parse(temiz), epikrizMap);
    } catch {
      console.error('[epikriz] JSON parse başarısız, ham metin:', raw.slice(0, 500));
      return NextResponse.json({ hata: 'Epikriz taslağı üretilemedi. Lütfen tekrar deneyin.' }, { status: 502 });
    }
    return NextResponse.json({
      hastaBilgileri,
      taniVeTedavi: parsed.taniVeTedavi || '',
      taburcuOzeti: parsed.taburcuOzeti || '',
      imza: imzaKur(hekim, branş, tarihIso),
    });
  } catch (error) {
    console.error('Epikriz oluşturma hatası:', error);
    return NextResponse.json({ hata: 'Epikriz oluşturulurken bir hata oluştu.' }, { status: 500 });
  }
}
