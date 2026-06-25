import { NextRequest, NextResponse } from 'next/server';


const AGENT_MAP: Record<string, string> = {
  pediatri: process.env.ELEVENLABS_AGENT_PEDIATRI || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_3601ktc884ntf3dbdkjtyx6vdfwa',
  kardiyoloji: process.env.ELEVENLABS_AGENT_KARDIYOLOJI || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_3601ktc884ntf3dbdkjtyx6vdfwa',
  noroloji: process.env.ELEVENLABS_AGENT_NOROLOJI || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_3601ktc884ntf3dbdkjtyx6vdfwa',
  dahiliye: process.env.ELEVENLABS_AGENT_DAHILIYE || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_3601ktc884ntf3dbdkjtyx6vdfwa',
  psikiyatri: process.env.ELEVENLABS_AGENT_PSIKIYATRI || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_3601ktc884ntf3dbdkjtyx6vdfwa',
  acil: process.env.ELEVENLABS_AGENT_ACIL || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_3601ktc884ntf3dbdkjtyx6vdfwa',
  default: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_3601ktc884ntf3dbdkjtyx6vdfwa',
};

const DEFAULT_AGENT = 'agent_3601ktc884ntf3dbdkjtyx6vdfwa';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

interface AuthPayload {
  userId?: string;
  exp?: number;
}

async function verifyAuth(req: NextRequest): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.decode(token) as AuthPayload | null;
    if (!decoded || !decoded.userId) {
      return null;
    }
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return null;
    }
    return { userId: decoded.userId };
  } catch {
    return null;
  }
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
    if (data.signed_url && data.signed_url.includes('.')) {
      try {
        const decoded = jwt.decode(data.signed_url) as { signed_url?: string } | null;
        if (decoded?.signed_url) {
          return decoded.signed_url;
        }
      } catch {
        // If not a JWT, return as-is
        return data.signed_url;
      }
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
