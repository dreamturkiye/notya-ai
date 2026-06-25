import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


const AGENT_MAP: Record<string, string> = {
  pediatri: process.env.ELEVENLABS_AGENT_PEDIATRI || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_3601ktc884ntf3dbdkjtyx6vdfwa',
  kardiyoloji: process.env.ELEVENLABS_AGENT_KARDIYOLOJI || 'agent_6501ktc87nmyeca88wskfvr8dfxh', // Dr. Mehmet - Abdulkadir K male voice,
  noroloji: process.env.ELEVENLABS_AGENT_NOROLOJI || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_3601ktc884ntf3dbdkjtyx6vdfwa',
  dahiliye: process.env.ELEVENLABS_AGENT_DAHILIYE || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_3601ktc884ntf3dbdkjtyx6vdfwa',
  psikiyatri: process.env.ELEVENLABS_AGENT_PSIKIYATRI || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_3601ktc884ntf3dbdkjtyx6vdfwa',
  acil: process.env.ELEVENLABS_AGENT_ACIL || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_3601ktc884ntf3dbdkjtyx6vdfwa',
  default: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_3601ktc884ntf3dbdkjtyx6vdfwa',
};

const DEFAULT_AGENT = 'agent_3601ktc884ntf3dbdkjtyx6vdfwa';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

async function verifyAuth(req: NextRequest): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: { user }, error } = await sb.auth.getUser(token);
    if (error || !user) return null;
    return { userId: user.id };
  } catch { return null; }
}

async function getElevenLabsSignedUrl(agentId: string): Promise<string | null> {
  if (!ELEVENLABS_API_KEY) {
    console.error('ELEVENLABS_API_KEY is not configured');
    return null;
  }

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
      }
    );

    if (!response.ok) {
      console.error('ElevenLabs API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    
    // JWT decode fix - extract real signed_url from JWT if needed
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

  const specialty = req.nextUrl.searchParams.get('specialty') || 'default';
  const AGENT_ID = AGENT_MAP[specialty] || AGENT_MAP.default || DEFAULT_AGENT;

  const wssUrl = await getElevenLabsSignedUrl(AGENT_ID);

  if (!wssUrl) {
    return NextResponse.json(
      { error: 'Asistan bağlantısı oluşturulamadı. Lütfen daha sonra tekrar deneyin.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    signed_url: wssUrl,
    agent_id: AGENT_ID,
    specialty,
  });
}
