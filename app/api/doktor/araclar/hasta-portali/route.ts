import { createHmac } from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return Response.json(
        { hata: 'Yetkisiz erişim. Lütfen giriş yapın.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return Response.json(
        { hata: 'Kullanıcı doğrulanamadı.' },
        { status: 401 }
      );
    }

    const { hastaId } = await request.json();
    if (!hastaId) {
      return Response.json(
        { hata: 'Hasta ID gereklidir.' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const secret = process.env.PORTAL_TOKEN_SECRET!;
    const hmac = createHmac('sha256', secret)
      .update(`${hastaId}${user.id}${timestamp}`)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const createdAt = new Date().toISOString();

    const { error: upsertError } = await supabase
      .from('hasta_portal_tokens')
      .upsert({
        token_hash: hmac,
        doctor_id: user.id,
        patient_id: hastaId,
        expires_at: expiresAt,
        created_at: createdAt,
      }, {
        onConflict: 'token_hash'
      });

    if (upsertError) {
      return Response.json(
        { hata: 'Portal tokenı oluşturulamadı.' },
        { status: 500 }
      );
    }

    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/hasta/${hmac}`;

    return Response.json({ portalUrl });
  } catch (err) {
    return Response.json(
      { hata: 'Beklenmeyen bir hata oluştu.' },
      { status: 500 }
    );
  }
}
