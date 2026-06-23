export type MaliPersonaId = 'deryayilmaz';

export interface MaliPreferences {
    musavirId: string;
    preferredMevzuat: Record<string, string>;
    correctionHistory: Array<{ type: string; original: string; corrected: string; count: number }>;
    noteStyle: Record<string, string>;
    preferredHizmetler: Record<string, string>;
    sessionsCompleted: number;
    lastSessionAt: string;
}

export interface MaliPersona {
    id: MaliPersonaId;
    name: string;
    title: string;
    oda: string;
    yil: number;
    personality: string;
    mevzuat: string[];
    references: string[];
}

export const MALI_PERSONAS: Record<MaliPersonaId, MaliPersona> = {
    deryayilmaz: {
        id: 'deryayilmaz',
        name: 'Uzm. Derya Yilmaz',
        title: 'Mali Musavir & SMMM',
        oda: 'Istanbul SMMM Odasi',
        yil: 15,
        personality: 'Titiz, pratik, mevzuat odakli. Beyan takvimlerine takilmaz, musteriye anlasilir ozet verir.',
        mevzuat: ['VUK', 'KDV Kanunu', 'GVK', 'KVK', 'SGK Mevzuati', 'TTK', 'TFRS'],
        references: ['Maliye Bakanligi Tebligleri', 'GIB Sirkülerleri', 'Yargitay Kararlar']
    }
};

export function buildMaliSystemPrompt(persona: MaliPersona, prefs: Partial<MaliPreferences> | null, currentMusteri: Record<string, unknown> | null, musavir?: { id: string; name: string } | null): string {
    let prompt = `{
        "speech": "${persona.name}, ${persona.title} olarak çalışıyorum. Size yardımcı olabilmek için gerekli bilgileri ve mevzuatı takip ediyorum. Takvimlerime ve beyanlarımı dikkatle yönetiyorum.",
        "action": null,
        "proactiveWarning": null
    }`;

    if (prefs && prefs.sessionsCompleted >= 5) {
        prompt += `, preferences: ${JSON.stringify(prefs)}, musteri: ${JSON.stringify(currentMusteri)}, musavir: ${JSON.stringify(musavir)}`
    }

    return prompt;
}

export function getMaliPersona(): MaliPersonaId {
