import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { dosyaPaketOnbellekli } from '@/lib/doktor/ogrenme/dosyaOnbellek';
import { asrAnahtarKelimeleri } from '@/lib/asistan/sesAnahtarKelime';
import type { HastaDosyaKart } from '@/lib/doktor/hastaDosyaKart';
import { createClient } from '@supabase/supabase-js';
import { getPersona, getPersonaForSpecialty } from '@/lib/asistan/personaEngine';
import { asistanOturumuAc } from '@/lib/asistan/ayseCevapla';
import { sesJetonuImzala, tekBeyinAcikMi } from '@/lib/asistan/sesJetonu';
import { TEK_BEYIN_AJANLARI } from '@/lib/asistan/tekBeyinAjanlari';
import { tabanAgentSec } from '@/lib/asistan/agentSec';
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi';
import { sesBaglantiTuru, sesMotorunuSabitle, SES_TEMEL_ANAHTARLAR_TR } from '@/lib/asistan/sesMotoru';
import { ayseFishTamMi } from '@/lib/asistan/fishSes';
import { istekSaatDilimi } from '@/lib/doktor/saatDilimi';
import { saatDilimiSec } from '@/lib/randevu/tarihCozumle';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// SES-OMURGA-V2 (E): next to the database (Supabase us-east-1). vercel.json pins the same region for the project.
export const preferredRegion = 'iad1';
export const dynamic = 'force-dynamic';

async function getElevenLabsConversationToken(agentId: string): Promise<string | null> {
  if (!ELEVENLABS_API_KEY) return null;
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`, {
      headers: { 'xi-api-key': ELEVENLABS_API_KEY }, cache: 'no-store', signal: AbortSignal.timeout(8_000),
    });
    if (!r.ok) { console.error('[signed-url] conversation token', r.status); return null; }
    const v = (await r.json()) as { token?: unknown };
    return typeof v.token === 'string' && v.token ? v.token : null;
  } catch (e) {
    console.error('[signed-url] conversation token', e instanceof Error ? e.name : 'hata');
    return null;
  }
}

async function verifyAuth(req: NextRequest): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } });
    const { data: { user }, error } = await sb.auth.getUser(token);
    if (error || !user) return null;
    return { userId: user.id };
  } catch { return null; }
}

async function getElevenLabsSignedUrl(agentId: string, tekBeyin = false): Promise<string | null> {
  if (!ELEVENLABS_API_KEY) {
    console.error('ELEVENLABS_API_KEY is not configured');
    return null;
  }

  // NOTYA-SES-KILIT-01: the call must not start on v3 expressive or a drifted speed.
  // SES-OMURGA-V2 (G): the TEK BEYİN copy is also held to the pinned conversation settings (turn, ASR, skip_turn …).
  await sesMotorunuSabitle(agentId, ELEVENLABS_API_KEY, fetch, tekBeyin ? { dil: 'tr', anahtarKelimeler: SES_TEMEL_ANAHTARLAR_TR, ozelLlm: true } : undefined);

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(8_000),
      }
    );

    if (!response.ok) {
      console.error('ElevenLabs API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();

    if (data.signed_url) {
      try {
        const parts = data.signed_url.split('.');
        const payload = parts[1] ? JSON.parse(Buffer.from(parts[1], 'base64').toString()) : null;
        if (payload?.signed_url) return payload.signed_url;
        return data.signed_url;
      } catch { return data.signed_url; }
    }

    return data.signed_url || null;
  } catch (error) {
    console.error('Failed to fetch ElevenLabs signed URL:', error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth) {
    return NextResponse.json(
      { error: 'Yetkisiz erişim. Lütfen giriş yapın.' },
      { status: 401 }
    );
  }

  const specialtyParam = req.nextUrl.searchParams.get('specialty') || 'pediatri';
  const personaParam = req.nextUrl.searchParams.get('persona') || '';
  const persona = personaParam
    ? getPersona(personaParam)
    : getPersona(getPersonaForSpecialty(specialtyParam));

  let AGENT_ID = tabanAgentSec(persona);
  const voiceId = persona.voiceId;

  // NOTYA-FISH-AYSE-02: with AYSE_SES_SAGLAYICI=fish (and a Fish key) Ayşe is a Fish call — no ConvAI signed URL,
  // no ElevenLabs websocket. NOTYA-SES-ELEVEN-GERI-01: by default she takes the ElevenLabs path below, as before Fish.
  const fishTam = ayseFishTamMi(persona.id)
  if (fishTam) {
    const oturum = await tekBeyinHazirla(auth.userId, persona.id, specialtyParam, req.nextUrl.searchParams)
    if (!oturum?.asistan_session_id) {
      return NextResponse.json({ error: 'Asistan oturumu açılamadı.' }, { status: 500 })
    }
    return NextResponse.json({
      fish: true,
      signed_url: null,
      agent_id: null,
      voice_id: voiceId,
      specialty: persona.primarySpecialty,
      persona_id: persona.id,
      persona_name: persona.name,
      persona_title: persona.title,
      specialist_total: 30,
      tek_beyin: true,
      asistan_session_id: oturum.asistan_session_id,
      baslangic: oturum.baslangic,
    })
  }

  // NOTYA-TEK-BEYIN: bayraktaki doktor Custom LLM'li test kopyasına geçer — beyin /api/asistan/ses-llm (yazılı sohbetle
  // aynı fonksiyon, aynı oturum). Bayrak boşsa / kopya ya da jeton anahtarı yoksa eski ajan, eski akış.
  let tekBeyin: { asistan_session_id: string; notya_jeton: string | null; baslangic: string; hastaId: string | null } | null = null;
  const kopya = TEK_BEYIN_AJANLARI[AGENT_ID];
  if (kopya && tekBeyinAcikMi(auth.userId)) {
    try {
      tekBeyin = await tekBeyinHazirla(auth.userId, persona.id, specialtyParam, req.nextUrl.searchParams);
      if (tekBeyin?.notya_jeton) AGENT_ID = kopya;
      else tekBeyin = null;
    } catch (e) {
      console.error('[signed-url] tek beyin', e instanceof Error ? e.name : 'hata');
    }
  }

  const baglanti = tekBeyin?.notya_jeton ? sesBaglantiTuru() : 'websocket';
  // In parallel: the agent lock + signed URL, the WebRTC token, and the call's ASR keywords (doctor-scoped chart).
  const [wssUrl, konusmaJetonu, asrKelimeleri] = await Promise.all([
    getElevenLabsSignedUrl(AGENT_ID, Boolean(tekBeyin?.notya_jeton)),
    baglanti === 'webrtc' ? getElevenLabsConversationToken(AGENT_ID) : Promise.resolve(null),
    tekBeyin?.notya_jeton ? asrKelimeleriHazirla(auth.userId, tekBeyin.hastaId, persona.name) : Promise.resolve([] as string[]),
  ]);

  if (!wssUrl) {
    return NextResponse.json(
      { error: 'Asistan bağlantısı oluşturulamadı. Lütfen daha sonra tekrar deneyin.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    signed_url: wssUrl,
    agent_id: AGENT_ID,
    voice_id: voiceId,
    specialty: persona.primarySpecialty,
    persona_id: persona.id,
    persona_name: persona.name,
    persona_title: persona.title,
    specialist_total: 30,
    fish: false,
    ...(tekBeyin?.notya_jeton ? { tek_beyin: true, asistan_session_id: tekBeyin.asistan_session_id, notya_jeton: tekBeyin.notya_jeton, baslangic: tekBeyin.baslangic } : {}),
    // SES-OMURGA-V2 (C): WebRTC when a token was minted (the browser falls back to the signed URL otherwise).
    baglanti: konusmaJetonu ? 'webrtc' : 'websocket',
    ...(konusmaJetonu ? { conversation_token: konusmaJetonu } : {}),
    ...(asrKelimeleri.length ? { asr_keywords: asrKelimeleri } : {}),
  });
}

/**
 * SES-OMURGA-V2 (C): the call's ASR keywords. HASTA-IZOLASYON-01: `hastaId` reached here only after hastaSahibiMi in
 * tekBeyinHazirla; the chart package is compiled with doctor-scoped queries (and served from the versioned cache).
 */
async function asrKelimeleriHazirla(doktorId: string, hastaId: string | null, personaAdi: string): Promise<string[]> {
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } });
    const paket = hastaId ? await dosyaPaketOnbellekli(sb as never, doktorId, hastaId) : null;
    const ilkAd = String(personaAdi || '').replace(/^(dr\.?|uzm\.?)\s+/i, '').split(/\s+/)[0] || null;
    return asrAnahtarKelimeleri({ temel: SES_TEMEL_ANAHTARLAR_TR, asistanAdi: ilkAd, hastaAdi: paket?.ad || null, kart: (paket?.kart as Partial<HastaDosyaKart> | undefined) || null });
  } catch (e) {
    console.error('[signed-url] asr anahtar', e instanceof Error ? e.name : 'hata');
    return asrAnahtarKelimeleri({ temel: SES_TEMEL_ANAHTARLAR_TR });
  }
}

/**
 * Ortak asistan oturumu (yazılı sohbetin oturumu verildiyse ve bu doktorunsa o; değilse yeni) + imzalı konuşma jetonu.
 * HASTA-IZOLASYON-01: sayfa hastası (patientId) jetona girmeden önce bu doktorun hastası olmalı.
 */
async function tekBeyinHazirla(doktorId: string, personaId: string, specialty: string, q: URLSearchParams) {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } });
  const istenenHasta = String(q.get('patientId') || '').trim() || null;
  const patientId = istenenHasta && (await hastaSahibiMi(sb, doktorId, istenenHasta)) ? istenenHasta : null;
  let oturumId: string | null = null;
  const istenenOturum = String(q.get('asistanSessionId') || '').trim();
  if (istenenOturum) {
    const { data } = await sb.from('asistan_sessions').select('id').eq('id', istenenOturum).eq('doctor_id', doktorId).maybeSingle();
    oturumId = (data as { id?: string } | null)?.id || null;
  }
  if (!oturumId) {
    const { data: u } = await sb.from('users').select('specialty').eq('id', doktorId).maybeSingle();
    const yeni = await asistanOturumuAc(sb, { doktorId, personaId, specialty, hekimBransi: (u as { specialty?: string } | null)?.specialty, patientId });
    oturumId = (yeni?.id as string) || null;
  }
  if (!oturumId) return null;
  // NOTYA-TAKVIM-TZ-01: the voice token carries the doctor's timezone (query `tz` → notya_tz cookie → TRT).
  const tz = saatDilimiSec(String(q.get('tz') || '').trim() || null, istekSaatDilimi());
  // SES-OMURGA-V2 (A): `c` — one id per call, the turn registry's call key.
  const jeton = sesJetonuImzala({ d: doktorId, o: oturumId, s: specialty, p: patientId, pe: personaId, tz, c: randomUUID() });
  // baslangic: sayfanın ses-ekran yoklaması sunucu saatinden sayar (istemci saati kayık olabilir).
  return { asistan_session_id: oturumId, notya_jeton: jeton, baslangic: new Date().toISOString(), hastaId: patientId };
}
