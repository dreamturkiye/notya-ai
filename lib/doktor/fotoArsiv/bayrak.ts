/**
 * FOTO-ARSIV-01 — kill switches. NOTYA_FOTO_ARSIVI=off closes the archive routes (404, the tab renders its "closed"
 * state); NOTYA_FOTO_AI=off closes only the AI evaluation routes while the archive keeps working. Default: ON.
 */
const KAPALI = new Set(['off', '0', 'false', 'kapali', 'kapalı', 'hayir', 'hayır', 'no', 'disabled'])

const kapaliMi = (v: string | undefined) => KAPALI.has(String(v ?? '').trim().toLocaleLowerCase('tr-TR'))

export function fotoArsiviAcikMi(env: Record<string, string | undefined> = process.env): boolean {
  return !kapaliMi(env.NOTYA_FOTO_ARSIVI)
}

export function fotoAiAcikMi(env: Record<string, string | undefined> = process.env): boolean {
  return fotoArsiviAcikMi(env) && !kapaliMi(env.NOTYA_FOTO_AI)
}
