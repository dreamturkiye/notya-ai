import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';

export function generatePortalToken(avukatId: string, muvekkilId: string, secret: string): string {
    const payload = { avukatId, muvekkilId, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 };
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(base64Payload);
    const sig = hmac.digest('base64');
    return `${base64Payload}.${sig}`;
}

export async function registerPortalToken(supabaseClient: SupabaseClient, avukatId: string, muvekkilId: string, token: string, expiresAt: Date): Promise<boolean> {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const { error } = await supabaseClient.from('avukat_portal_tokens').insert({
        avukat_id: avukatId,
        muvekkil_id: muvekkilId,
        token_hash: hash,
        expires_at: expiresAt
    });
    return !error;
}

export async function verifyPortalToken(token: string, secret: string, supabaseClient: SupabaseClient): Promise<{ avukatId: string, muvekkilId: string } | null> {
    try {
        const [base64Payload, sig] = token.split('.');
        if (!base64Payload || !sig) return null;
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(base64Payload);
        const expectedSig = hmac.digest('base64');
        if (sig !== expectedSig) return null;

        const payload: { avukatId: string, muvekkilId: string, exp: number } = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
        if (payload.exp < Date.now()) return null;

        const hash = crypto.createHash('sha256').update(token).digest('hex');
        const { data, error } = await supabaseClient.from('avukat_portal_tokens').select('*').eq('token_hash', hash).single();
        if (error || !data || data.revoked_at || new Date(data.expires_at) < new Date()) return null;

        supabaseClient.from('avukat_portal_tokens').update({
            last_accessed: new Date().toISOString(),
            access_count: (data.access_count as number || 0) + 1
        }).eq('id', data.id).then(() => {});

        return { avukatId: payload.avukatId, muvekkilId: payload.muvekkilId };
    } catch {
        return null;
    }
}

export async function revokePortalToken(supabaseClient: SupabaseClient, token: string): Promise<boolean> {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const { data, error } = await supabaseClient.from('avukat_portal_tokens').select('*').eq('token_hash', hash).single();
    if (error || !data) return false;
    await supabaseClient.from('avukat_portal_tokens').update({ revoked_at: new Date().toISOString() }).eq('id', data.id);
    return true;
}

export function buildMuvekkilSystemPrompt(avukat: {name:string}, muvekkil: Record<string,unknown>, sureler: any[]): string {
    const caseDetails = `The client ${muvekkil.ad} ${muvekkil.soyad} is involved in a case of type ${muvekkil.dava_turu}. Here are the details about their current cases:\n`;
    const deadlines = sureler.map(sure =>
        `- Case: ${sure.sure_turu}, Deadline: ${new Date(sure.son_gun).toLocaleDateString()}, Description: ${sure.aciklama}`
    ).join('\n');
    return `
    You are a legal assistant for Avukat ${avukat.name}. Your client's case details are as follows:
    ${caseDetails}${deadlines}
    When answering questions about upcoming deadlines, please provide simple explanations without using legal jargon. 
    Always reassure your client and avoid unnecessary alarm.
    `;
}
