import { createHmac } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { generatePortalPin, hashPortalPin, isValidPortalPin } from '@/lib/portal/pinAuth';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type PortalPaylasimOzeti = {
  /** Visits the patient will see = sessions whose note is approved. */
  onayliZiyaret: number;
  /** Notes written but never approved — invisible to the patient. */
  onaysizNot: number;
  aktifIlac: number;
  labSonuc: number;
  goruntuleme: number;
  /** True when the patient would open the portal and find every section empty. */
  portalBos: boolean;
  /** Doctor-facing warning, or null when there is nothing to flag. */
  uyari: string | null;
};

/** What will this patient actually see when they open the portal? */
async function portalPaylasimOzeti(patientId: string): Promise<PortalPaylasimOzeti> {
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('patient_id', patientId)
    .limit(200);
  const sessionIds = (sessions || []).map((s) => s.id as string);

  let onayliZiyaret = 0;
  let onaysizNot = 0;
  if (sessionIds.length) {
    const { data: notes } = await supabase
      .from('notes')
      .select('session_id, approved_at')
      .in('session_id', sessionIds);
    const approvedSessions = new Set<string>();
    for (const n of notes || []) {
      if (n.approved_at) approvedSessions.add(String(n.session_id));
      else onaysizNot += 1;
    }
    onayliZiyaret = approvedSessions.size;
  }

  const countFor = async (table: string, extra?: (q: any) => any) => {
    const base = supabase.from(table).select('id', { count: 'exact', head: true }).eq('patient_id', patientId);
    const { count } = await (extra ? extra(base) : base);
    return count ?? 0;
  };

  const aktifIlac = await countFor('hasta_ilaclar', (q) => q.eq('aktif', true));
  const labSonuc = await countFor('hasta_lab_sonuclari');
  const goruntuleme = await countFor('hasta_goruntulemeler');

  const portalBos = onayliZiyaret === 0 && aktifIlac === 0 && labSonuc === 0 && goruntuleme === 0;

  let uyari: string | null = null;
  if (onaysizNot > 0 && onayliZiyaret === 0) {
    uyari = `Bu hastanın ${onaysizNot} notu onaylanmamış. Portal yalnızca ONAYLANMIŞ notları paylaşır — hasta linki açtığında hiçbir ziyaret göremeyecek. Notları onaylayın, sonra linki paylaşın.`;
  } else if (onaysizNot > 0) {
    uyari = `${onaysizNot} not onaylanmamış ve hastaya görünmeyecek. Hasta ${onayliZiyaret} ziyaret görecek.`;
  } else if (portalBos) {
    uyari =
      'Bu hastada paylaşılacak veri yok (onaylı ziyaret, aktif ilaç, lab veya görüntüleme). Hasta boş bir portal görecek.';
  }

  return { onayliZiyaret, onaysizNot, aktifIlac, labSonuc, goruntuleme, portalBos, uyari };
}

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

    const body = await request.json().catch(() => ({}));
    const hastaId = String((body as { hastaId?: string }).hastaId || '');
    const customPin = String((body as { pin?: string }).pin || '').trim();

    if (!hastaId) {
      return Response.json(
        { hata: 'Hasta ID gereklidir.' },
        { status: 400 }
      );
    }

    if (customPin && !isValidPortalPin(customPin)) {
      return Response.json(
        { hata: 'PIN 6 haneli rakam olmalıdır.' },
        { status: 400 }
      );
    }

    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', hastaId)
      .eq('doctor_id', user.id)
      .maybeSingle();

    if (patientError || !patient) {
      return Response.json(
        { hata: 'Hasta bulunamadı veya bu hastaya erişim yok.' },
        { status: 404 }
      );
    }

    const secret = process.env.PORTAL_TOKEN_SECRET;
    if (!secret) {
      return Response.json(
        { hata: 'Portal yapılandırılmamış.' },
        { status: 500 }
      );
    }

    const plainPin = customPin || generatePortalPin();
    let pinHash: string;
    try {
      pinHash = hashPortalPin(plainPin);
    } catch {
      return Response.json(
        { hata: 'Portal yapılandırılmamış.' },
        { status: 500 }
      );
    }

    const timestamp = Date.now();
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
        pin_hash: pinHash,
      }, {
        onConflict: 'token_hash'
      });

    if (upsertError) {
      return Response.json(
        { hata: 'Portal tokenı oluşturulamadı.' },
        { status: 500 }
      );
    }

    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://notya-ai.vercel.app'}/portal/hasta/${hmac}`;

    // QA 2026-09-08: the portal only shares notes with approved_at set, so a
    // patient with unapproved notes opens a completely empty portal and the
    // doctor has no way to know. Report what this patient will actually see.
    const paylasim = await portalPaylasimOzeti(hastaId);

    return Response.json({
      portalUrl,
      pin: plainPin,
      expiresAt,
      note: 'PIN yalnızca bir kez gösterilir. Hastaya link ile birlikte iletin.',
      paylasim,
    });
  } catch (err) {
    return Response.json(
      { hata: 'Beklenmeyen bir hata oluştu.' },
      { status: 500 }
    );
  }
}
