/**
 * Distinct Turkish ElevenLabs voices per Notya assistant.
 * Prefer Istanbul/Aegean TR voices already in the workspace; never share
 * Jessica/Bella (EN) across female doctors.
 *
 * ConvAI sessions pass `overrides.tts.voiceId` so each persona sounds unique
 * even when agents temporarily share a base config.
 */

export type VoiceGender = 'female' | 'male'

export interface NotyaVoice {
  voiceId: string
  label: string
  gender: VoiceGender
  accent: string
}

/** Workspace / library voice IDs (Turkish-first). */
export const TR_VOICES = {
  // Females — already in account or shared library
  ayseHanim: {
    // Ece (İstanbul conversational) — Wise Educator slurry on Flash TR medical speech
    voiceId: '5MSp7yE6sGgawegWrMgt',
    label: 'Ece — Ayşe Hanım (İstanbul)',
    gender: 'female',
    accent: 'istanbul',
  },
  gulrizElif: {
    voiceId: '7i5J4Bl0THYWdNcoKRl6',
    label: 'Gülriz — Elif Şahin (İstanbul)',
    gender: 'female',
    accent: 'istanbul',
  },
  gunnurDilek: {
    voiceId: '58oUR7g9xaf9pbxNCyws',
    label: 'Günnur — Dilek Hanım (İstanbul)',
    gender: 'female',
    accent: 'istanbul',
  },
  pinarZeynep: {
    voiceId: 'TLSC2qq8RlDdm7tETUHz',
    label: 'Pınar K — Zeynep Hanım (İstanbul)',
    gender: 'female',
    accent: 'istanbul',
  },
  tugbaSelin: {
    voiceId: 'D6QpOJ61ltQ3whot6iJZ',
    label: 'Tuğba — Selin Hanım (İstanbul)',
    gender: 'female',
    accent: 'istanbul',
  },
  /** Warm native TR female (shared library) — Mali Derya */
  asli: {
    voiceId: 'HZh2tWL1clJO95e2qMt2',
    label: 'Aslı — Warm Native Turkish (İstanbul)',
    gender: 'female',
    accent: 'istanbul',
  },
  /** Composed young TR female (shared library) — Avukat Ayşe (icra) distinct from Dr Ayşe */
  leyla: {
    voiceId: 'ir8YO3t6kXwbDO3roXIT',
    label: 'Leyla — Composed & Balanced',
    gender: 'female',
    accent: 'standard',
  },
  sibel: {
    voiceId: 'qLdPxFtPuffoxx5gieBJ',
    label: 'Sibel Malkoç (İstanbul)',
    gender: 'female',
    accent: 'istanbul',
  },
  ece: {
    voiceId: '5MSp7yE6sGgawegWrMgt',
    label: 'Ece (İstanbul)',
    gender: 'female',
    accent: 'istanbul',
  },

  // Males — account voices
  abdulkadir: {
    voiceId: 'pGMp7Agf4sG0hyhiiGiw',
    label: 'Abdulkadir (İstanbul)',
    gender: 'male',
    accent: 'istanbul',
  },
  ertanHaluk: {
    voiceId: 'goDh3UOD7uY8nX9JmLnv',
    label: 'Ertan Dönmez — Haluk Bey',
    gender: 'male',
    accent: 'standard',
  },
  gokhan: {
    voiceId: 'aF3NZfADeIc6RJO5v5Ia',
    label: 'Gökhan (İstanbul)',
    gender: 'male',
    accent: 'istanbul',
  },
  serhat: {
    voiceId: 'vhKOmda0rMxo3o60S4G5',
    label: 'Serhat (İstanbul)',
    gender: 'male',
    accent: 'istanbul',
  },
  bahadir: {
    voiceId: 'LIayCu3NIwyEyDw2fhqs',
    label: 'Bahadır',
    gender: 'male',
    accent: 'standard',
  },
  eyup: {
    voiceId: 'YRAJxpPvdBUTgvjBUHlB',
    label: 'Eyüp (İstanbul)',
    gender: 'male',
    accent: 'istanbul',
  },
  halil: {
    voiceId: '6U25IshsKGd7nVhRbPOT',
    label: 'Halil Aykut (İstanbul)',
    gender: 'male',
    accent: 'istanbul',
  },
} as const satisfies Record<string, NotyaVoice>

/** Doktor asistan personas → unique TR voices */
export const DOKTOR_VOICE_BY_PERSONA = {
  aysekaya: TR_VOICES.ayseHanim,
  mehmetdemir: TR_VOICES.abdulkadir,
  elifsahin: TR_VOICES.gulrizElif,
} as const

/** Avukat personas → unique TR voices (no two share a voice) */
export const AVUKAT_VOICE_BY_PERSONA = {
  kemalbey: TR_VOICES.serhat,
  selinhanim: TR_VOICES.tugbaSelin,
  muratbey: TR_VOICES.gokhan,
  dilekhanim: TR_VOICES.gunnurDilek,
  halukbey: TR_VOICES.ertanHaluk,
  aysehanim: TR_VOICES.leyla, // distinct from Dr. Ayşe
  canbey: TR_VOICES.bahadir,
  zeynephanim: TR_VOICES.pinarZeynep,
  borabey: TR_VOICES.eyup,
} as const

/** Mali müşavir */
export const MALI_VOICE = TR_VOICES.asli

export function voiceIdForDoktorPersona(personaId: string): string {
  const v = DOKTOR_VOICE_BY_PERSONA[personaId as keyof typeof DOKTOR_VOICE_BY_PERSONA]
  if (v) return v.voiceId
  // Full roster voices live on specialistsCatalog; callers should prefer persona.voiceId
  return TR_VOICES.ayseHanim.voiceId
}

export function voiceIdForAvukatPersona(personaId: string): string {
  const v = AVUKAT_VOICE_BY_PERSONA[personaId as keyof typeof AVUKAT_VOICE_BY_PERSONA]
  return v?.voiceId || TR_VOICES.serhat.voiceId
}

export function voiceIdForMali(): string {
  return MALI_VOICE.voiceId
}
