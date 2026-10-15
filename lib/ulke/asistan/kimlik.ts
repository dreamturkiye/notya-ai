/**
 * NOTYA-ASISTAN-SABLON — the screen name and the three-reference shape.
 *
 * This file does not import the chart rules or the textbooks. A screen can name the assistant without loading
 * either. The instruction that joins the rules to the three references is sablon.ts, and only the server builds it.
 */
import type { AsistanKimligi, RolTarafi } from '@/lib/ulke/arayuz/tipler'

/** More than twenty years in the country. The template does not accept less. */
export const ASISTAN_YIL = 20

export type UcKaynak = readonly [string, string, string]

export type AsistanRolGirdisi = {
  uzmanlik: string
  taraf: RolTarafi
  kaynaklar: UcKaynak
}

const bos = (s: string) => !s.trim()

/** Exactly three non-empty references, or the template refuses the role. */
export function ucKaynak(kaynaklar: readonly string[]): UcKaynak {
  if (kaynaklar.length !== 3 || kaynaklar.some(bos)) throw new Error('ucKaynak: a role has exactly three references')
  return [kaynaklar[0], kaynaklar[1], kaynaklar[2]]
}

/**
 * What a screen shows. Doctors and clinic doctors: "Professor of {specialty}". Allied professions: "Senior {profession}".
 * makineTuretimi stays true until the owner replaces the title with a name. No personal name is invented here.
 */
export function asistanKimligiKur(g: Pick<AsistanRolGirdisi, 'uzmanlik' | 'taraf'>): AsistanKimligi {
  const hekim = g.taraf !== 'klinik-muttefik'
  return {
    tamAd: hekim ? `Professor of ${g.uzmanlik}` : `Senior ${g.uzmanlik}`,
    kisaAd: hekim ? 'Professor' : 'Senior',
    makineTuretimi: true,
  }
}
