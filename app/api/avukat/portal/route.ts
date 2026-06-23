import { NextRequest, NextResponse } from 'next/server';
import { generatePortalToken, verifyPortalToken, buildMuvekkilSystemPrompt } from '@/lib/avukat/avukatPortalEngine';
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
import { rateLimit } from 'express-rate-limit';

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
});

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 });

    const decodedToken = verifyPortalToken(token, process.env.Portal_SECRET!);
    if (!decodedToken) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const { avukatId, muvekkilId } = decodedToken;

    const { data: musevvekiller } = await supabase
        .from('musevvekiller')
        .select('*')
        .eq('id', muvekkilId)
        .single();

    if (!musevvekiller) return NextResponse.json({ success: false, error: 'Muvekkil not found' }, { status: 404 });

    const { data: users } = await supabase
        .from('users')
        .select('name')
        .eq('id', avukatId)
        .single();

    if (!users) return NextResponse.json({ success: false, error: 'Avukat not found' }, { status: 404 });

    const { data: sure_takibi } = await supabase
        .from('sure_takibi')
        .select('*')
        .eq('avukat_id', avukatId)
        .eq('muvekkil_id', muvekkilId)
        .eq('tamamlandi', false);

    return NextResponse.json({
        success: true,
        data: {
            muvekkilAdi: `${musevvekiller.ad} ${musevvekiller.soyad}`,
            avukatAdi: users.name,
            sureler: sure_takibi || [],
            davaTuru: musevvekiller.dava_turu
        }
    });
}

export async function POST(req: NextRequest) {
    await limiter(req, req.res);

    const body = await req.json();
    const { token, message, history } = body;

    if (!token || !message || !history) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });

    const decodedToken = verifyPortalToken(token, process.env.Portal_SECRET!);
    if (!decodedToken) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const { avukatId, muvekkilId } = decodedToken;

    const { data: musevvekiller } = await supabase
        .from('musevvekiller')
        .select('*')
        .eq('id', muvekkilId)
        .single();

    if (!musevvekiller) return NextResponse.json({ success: false, error: 'Muvekkil not found' }, { status: 404 });

    const { data: users } = await supabase
        .from('users')
        .select('name')
        .eq('id', avukatId)
        .single();

    if (!users) return NextResponse.json({ success: false, error: 'Avukat not found' }, { status: 404 });

    const systemPrompt = buildMuvekkilSystemPrompt(users, musevvekiller, []);
    // Here you would call Claude API with the system prompt and message history to get the response
    // For demonstration purposes, let's assume we have a function called `callClaudeApi` that does this:
    const { speech } = await callClaudeApi(systemPrompt, history.concat(message));

    return NextResponse.json({
        success: true,
        data: {
            speech
        }
    });
}

export async function POST_ADMIN(req: NextRequest) {
    const token = req.headers.get('Authorization');
    if (!token) return NextResponse.json({ success: false, error: 'Missing authorization' }, { status: 401 });

    const decodedToken = verifyPortalToken(token.split(' ')[1], process.env.AVUKAT_SECRET!);
    if (!decodedToken) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    const { muvekkilId, expiresInDays = 30 } = body;

    const portalToken = generatePortalToken(decodedToken.avukatId, muvekkilId, process.env.Portal_SECRET!);
    const tokenHash = crypto.createHash('sha256').update(portalToken).digest('hex');
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const { data: existingTokens } = await supabase
        .from('avukat_portal_tokens')
        .select('*')
        .eq('muvekkel_id', muvekkilId)
        .single();

    if (existingTokens) {
        await supabase
            .from('avukat_portal_tokens')
            .update({ token_hash, expires_at })
            .eq('id', existingTokens.id);
    } else {
        await supabase
            .from('avukat_portal_tokens')
            .insert({
                avukat_id: decodedToken.avukatId,
                muvekkel_id: muvekkilId,
                token_hash,
                expires_at,
                is_active: true
            });
    }

    return NextResponse.json({
        success: true,
        data: {
            portalUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/portal/${portalToken}`,
            token: portalToken
        }
    });
}