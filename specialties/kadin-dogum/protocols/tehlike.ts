/**
 * DÖBYR tehlike işaretleri — patient counseling snippet.
 * Reuses the live catalog in lib/clinical/genetikTarama (SB DÖB wording).
 */
import { TEHLIKE_ISARETLERI } from '../../../lib/clinical/genetikTarama'

export { TEHLIKE_ISARETLERI }

export function tehlikeDanismanlikMetni(): string {
  const maddeler = TEHLIKE_ISARETLERI.map((t) => `• ${t.etiket}`).join('\n')
  return [
    'Gebelikte aşağıdaki durumlarda hemen başvurunuz:',
    maddeler,
    '',
    'Kaynak: DÖBYR 2026 (yasal taban). Bu liste danışmanlıktır; tanı değildir.',
  ].join('\n')
}
