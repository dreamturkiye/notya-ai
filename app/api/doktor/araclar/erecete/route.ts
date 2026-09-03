export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { pseudonymize, restoreDeep, assertNoTckn } from '@/lib/security/pseudonymize';
import { aiKotaKullan, KOTA_MESAJI } from '@/lib/doktor/hizLimiti';
import { kritikAlarm } from '@/lib/alarm';

interface IlacInput {
  ad: string;
  doz: string;
  kullanim: string;
  sure: string;
}

interface RequestBody {
  hastaId: string;
  tani: string;
  notlar: string;
  ilaclar: IlacInput[];
}

const getSB = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ hata: 'Yetkilendirme başlığı eksik' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const sb = getSB();
    const { data: { user }, error: authError } = await sb.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ hata: 'Geçersiz veya süresi dolmuş token' }, { status: 401 });
    }

    const body: RequestBody = await request.json();
    const { hastaId, tani, notlar, ilaclar } = body;

    if (!hastaId || !tani) {
      return NextResponse.json({ hata: 'hastaId ve tani zorunludur' }, { status: 400 });
    }

    const { data: hasta, error: hastaError } = await sb
      .from('patients')
      .select('name_encrypted, notes_encrypted')
      .eq('id', hastaId)
      .eq('doctor_id', user.id)
      .single();

    if (hastaError || !hasta) {
      return NextResponse.json({ hata: 'Hasta bulunamadı' }, { status: 404 });
    }

    // NOTYA-KOTA-01
    const kota = await aiKotaKullan(sb, user.id, 'konsult');
    if (!kota.izin) return NextResponse.json({ hata: KOTA_MESAJI }, { status: 429 });

    // AUDIT-2026-09-03: etkileşim kontrolü artık gerçek — hastanın kayıtlı sürekli ilaçları
    // modele (kimliksiz) verilir; önceden boş placeholder gidiyordu.
    let mevcutIlaclar = 'kayıtlı sürekli ilaç yok';
    try {
      const { data: hi } = await sb.from('hasta_ilaclar').select('*').eq('patient_id', hastaId).limit(30);
      if (hi?.length) {
        mevcutIlaclar = hi.map((i: Record<string, unknown>) => [i.ilac_adi || i.ad, i.doz, i.kullanim].filter(Boolean).join(' ')).filter(Boolean).join('; ');
      }
    } catch { /* ilaç listesi kritik değil */ }

    const systemPrompt =
      'Sen uzman Türk hekimisin; Türkiye reçete pratiğini ve SGK kurallarını bilirsin. e-Reçete taslağı üret. SADECE geçerli JSON döndür: {"icd10":{"kod":"","aciklama":""},"ilaclar":[{"ad":"","etkenMadde":"","doz":"","kullanim":"","sure":"","sgkNotu":""}],"interaksiyonlar":[{"ilac1":"","ilac2":"","siddet":"","aciklama":"","oneri":""}],"uyarilar":[""]}. İstenen ilaçları hastanın MEVCUT ilaçlarıyla çapraz kontrol et; etkileşim yoksa interaksiyonlar boş dizi olsun. Nihai karar doktorundur.';

    const userMessage = `Tanı: ${tani}. Notlar: ${notlar}. İstenen ilaçlar: ${JSON.stringify(ilaclar)}. Hastanın mevcut/sürekli ilaçları: ${mevcutIlaclar}`;

    // NOTYA-PSEUDO-01: `notlar` is doctor-entered free text and can carry names, T.C. kimlik
    // numbers or contact details pasted from another system.
    const { text: guvenliMesaj, map: receteMap } = pseudonymize(userMessage);
    assertNoTckn(guvenliMesaj, 'erecete');

    // AUDIT-2026-09-03: Groq'tan Anthropic'e geçiş — GROQ_API_KEY hiçbir ortamda tanımlı
    // değildi, araç hiç çalışmamıştı. Tek AI sağlayıcı = tek fatura, tutarlı kalite.
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: guvenliMesaj }],
      }),
    });
    const veri = await r.json();
    if (!r.ok) {
      console.error('[erecete] anthropic', JSON.stringify(veri).slice(0, 300));
      await kritikAlarm('erecete AI hatasi', JSON.stringify(veri).slice(0, 200));
      return NextResponse.json({ hata: 'Reçete taslağı üretilemedi. Lütfen tekrar deneyin.' }, { status: 502 });
    }
    const hamMetin = (veri.content || []).filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('');
    const temiz = hamMetin.replace(/```json\n?|\n?```/g, '').trim();
    let parsedRecete: Record<string, unknown>;
    try {
      parsedRecete = JSON.parse(temiz);
    } catch {
      const bas = temiz.indexOf('{'); const son = temiz.lastIndexOf('}');
      parsedRecete = JSON.parse(temiz.slice(bas, son + 1));
    }
    parsedRecete = restoreDeep(parsedRecete, receteMap) as Record<string, unknown>;

    const recete = {
      tani,
      icd10: parsedRecete.icd10,
      ilaclar: parsedRecete.ilaclar,
      interaksiyonlar: parsedRecete.interaksiyonlar,
      uyarilar: parsedRecete.uyarilar,
      tarih: new Date().toISOString(),
    };

    return NextResponse.json({ recete });
  } catch (error) {
    console.error('e-Reçete oluşturma hatası:', error);
    return NextResponse.json({ hata: 'Sunucu hatası oluştu' }, { status: 500 });
  }
}
