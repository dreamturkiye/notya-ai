import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { groqChat } from '@/lib/dr-ayse/groq';
import { pseudonymize, restoreDeep, assertNoTckn } from '@/lib/security/pseudonymize';

export const dynamic = 'force-dynamic';

interface EpikrizRequest {
  hastaId: string;
  seansId?: string;
  tumSeanslar?: boolean; // Kaan (2026-09-13): hastanın tüm geçmişini özetleyen kapsamlı epikriz
  ekBilgi?: string;
}



export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body: EpikrizRequest = await request.json();
    const { hastaId, seansId, tumSeanslar, ekBilgi } = body;

    if (!hastaId || (!seansId && !tumSeanslar)) {
      return NextResponse.json(
        { hata: 'Hasta ID ve seans ID (veya tüm seanslar seçeneği) zorunludur.' },
        { status: 400 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      request.headers.get('Authorization')?.replace('Bearer ', '') || ''
    );

    if (authError || !user) {
      return NextResponse.json(
        { hata: 'Yetkilendirme başarısız.' },
        { status: 401 }
      );
    }

    // Kaan (2026-09-13): "tüm seansları özetleyecek şekilde bir seçenek olmalı" — hastanın ilk
    // geldiğinden bu yana tüm vizitleri, tanıları (sağlam çocuk + geçirdiği hastalıklar, tarihli),
    // aşı karnesi, kullanılan ilaç/takviyeler. hastaDosyasiniDerle zaten bunu derliyor (Ayşe'ye
    // Danış'ta kullanılan aynı fonksiyon) — burada epikriz formatına dönüştürülüyor.
    if (tumSeanslar) {
      const { hastaDosyasiniDerle } = await import('@/lib/doktor/hastaDosyaDerleyici')
      const dosya = await hastaDosyasiniDerle(supabase, user.id, hastaId)
      if (!dosya) return NextResponse.json({ hata: 'Hasta dosyası bulunamadı.' }, { status: 404 })

      const kapsamliSystem = `Türkiye Sağlık Bakanlığı standart epikriz formatında, hastanın İLK GELİŞİNDEN BU YANA TÜM İZLEMİNİ özetleyen kapsamlı bir epikriz yaz. Sadece JSON döndür: {"hastaBilgileri":"...","taniVeTedavi":"...","taburcuOzeti":"..."}
"hastaBilgileri" içinde: takip süresi (ilk-son vizit tarihi), toplam vizit sayısı.
"taniVeTedavi" içinde SIRAYLA: (1) Geliş tanıları ve tarihleri — sağlam çocuk/rutin kontroller ile geçirilen hastalıkları AYRI listele; (2) Aşı karnesi — uygulanan aşılar ve tarihleri; (3) Kullanılan ilaç/takviyeler (geçmiş ve güncel, tarihleriyle).
"taburcuOzeti" içinde: genel klinik seyir, 3-5 cümlelik özet.
Yalnız dosyada YER ALAN bilgiyi kullan, uydurma; bir bölüm boşsa "Kayıt yok" yaz.`
      const kapsamliUser = `${dosya}\n\nEk bilgi: ${ekBilgi || ''}`
      const { text: guvenliKapsamli, map: kapsamliMap } = pseudonymize(kapsamliUser)
      assertNoTckn(guvenliKapsamli, 'epikriz-kapsamli')
      const rawKapsamli = await groqChat(
        [
          { role: 'system', content: kapsamliSystem },
          { role: 'user', content: guvenliKapsamli },
        ],
        { temperature: 0.2, jsonMode: true }
      )
      let parsedKapsamli: { hastaBilgileri?: string; taniVeTedavi?: string; taburcuOzeti?: string }
      try {
        parsedKapsamli = restoreDeep(JSON.parse(rawKapsamli), kapsamliMap)
      } catch {
        return NextResponse.json({ hata: 'AI yanıtı geçersiz format' }, { status: 502 })
      }
      return NextResponse.json({
        hastaBilgileri: parsedKapsamli.hastaBilgileri || '',
        taniVeTedavi: parsedKapsamli.taniVeTedavi || '',
        taburcuOzeti: parsedKapsamli.taburcuOzeti || '',
      })
    }

    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .eq('session_id', seansId)
      .eq('doctor_id', user.id)
      .single();

    if (noteError || !note) {
      return NextResponse.json(
        { hata: 'SOAP notu bulunamadı.' },
        { status: 404 }
      );
    }

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('specialty,started_at')
      .eq('id', seansId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { hata: 'Seans bilgisi bulunamadı.' },
        { status: 404 }
      );
    }

    const systemPrompt = `Türkiye Sağlık Bakanlığı standart epikriz formatında yaz. Sadece JSON döndür, başka hiçbir şey yazma: {"hastaBilgileri":"...","taniVeTedavi":"...","taburcuOzeti":"..."}`;

    const userPrompt = `SOAP notu:
Subjektif: ${note.content_subjektif || ''}
Objektif: ${note.content_objektif || ''}
Değerlendirme: ${note.content_degerlendirme || ''}
Plan: ${note.content_plan || ''}
İlaçlar: ${note.content_ilaclar || ''}
ICD10: ${note.icd10_codes || ''}
Ek bilgi: ${ekBilgi || ''}
Hastanın specialty: ${session.specialty || 'genel'}`;

    // NOTYA-PSEUDO-01: a SOAP note is free text — the patient is frequently named in it, and
    // identifiers are pasted in from other systems. Strip before the border, restore after.
    const { text: guvenliPrompt, map: epikrizMap } = pseudonymize(userPrompt);
    assertNoTckn(guvenliPrompt, 'epikriz');

    const raw = await groqChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: guvenliPrompt },
      ],
      { temperature: 0.2, jsonMode: true }
    );

    let parsed: { hastaBilgileri?: string; taniVeTedavi?: string; taburcuOzeti?: string };
    try {
      // Placeholders go out, real values come back in — the doctor never sees [HASTA_1].
      parsed = restoreDeep(JSON.parse(raw), epikrizMap);
    } catch {
      return NextResponse.json({ hata: 'AI yanıtı geçersiz format' }, { status: 502 });
    }

    return NextResponse.json({
      hastaBilgileri: parsed.hastaBilgileri || '',
      taniVeTedavi: parsed.taniVeTedavi || '',
      taburcuOzeti: parsed.taburcuOzeti || '',
    });
  } catch (error) {
    console.error('Epikriz oluşturma hatası:', error);
    return NextResponse.json(
      { hata: 'Epikriz oluşturulurken bir hata oluştu.' },
      { status: 500 }
    );
  }
}
