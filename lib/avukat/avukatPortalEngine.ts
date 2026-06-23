import crypto from 'crypto';

export function generatePortalToken(avukatId: string, muvekkilId: string, secret: string): string {
    const payload = { avukatId, muvekkilId, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 };
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(base64Payload);
    const sig = hmac.digest('base64');
    return `${base64Payload}.${sig}`;
}

export function verifyPortalToken(token: string, secret: string): { avukatId: string, muvekkilId: string } | null {
    try {
        const [base64Payload, sig] = token.split('.');
        if (!base64Payload || !sig) return null;
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(base64Payload);
        const expectedSig = hmac.digest('base64');
        if (sig !== expectedSig) return null;
        
        const payload: { avukatId: string, muvekkilId: string, exp: number } = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
        if (payload.exp < Date.now()) return null; // Token expired
        
        return { avukatId: payload.avukatId, muvekkilId: payload.muvekkilId };
    } catch {
        return null;
    }
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