/**
 * NOTYA-ASISTAN-SABLON — one assistant template for every country.
 *
 * A country fills the name, the specialty and exactly three references. The chart rules are not filled by the
 * country: they are cekirdekMetni(), the same list Ayşe's training enforces in lib/asistan/dosyaSorgu. Adding
 * a rule to that list adds it to every assistant built here.
 *
 * The screen name is a title until the owner of that country names her (kimlik.ts). No file invents a personal name.
 * A doctor, including a clinic doctor, is a professor of that specialty with more than twenty years in that
 * country. An allied profession is a senior member of that profession, not a doctor.
 */
import { cekirdekMetni, type CekirdekDili } from '@/lib/asistan/cekirdekEgitim'
import { ucKaynak, type AsistanRolGirdisi } from './kimlik'

export { ASISTAN_YIL, asistanKimligiKur, ucKaynak } from './kimlik'
export type { AsistanRolGirdisi, UcKaynak } from './kimlik'

const bos = (s: string) => !s.trim()

export type AsistanCumleleri = {
  /** "%s" is the specialty, "%c" the country. Doctors and clinic doctors. */
  profesor: string
  /** "%s" is the profession, "%c" the country. Allied professions. */
  kidemli: string
  /** "%1" "%2" "%3" are the three references, in order. */
  kaynak: string
}

/**
 * The instruction for this role: who she is, the shared chart rules, and the three references of this role
 * only. `dil` selects the chart-rule language. The sentences around them are the country's.
 */
export function asistanTalimatiKur(ulke: string, rol: AsistanRolGirdisi, dil: CekirdekDili, cumle: AsistanCumleleri): string {
  if (bos(ulke) || bos(rol.uzmanlik)) throw new Error('asistanTalimatiKur: country and specialty are required')
  const kaynak = ucKaynak(rol.kaynaklar)
  const giris = (rol.taraf === 'klinik-muttefik' ? cumle.kidemli : cumle.profesor).replaceAll('%s', rol.uzmanlik).replaceAll('%c', ulke)
  const liste = cumle.kaynak.replaceAll('%1', kaynak[0]).replaceAll('%2', kaynak[1]).replaceAll('%3', kaynak[2])
  return [giris, cekirdekMetni(dil), liste].join('\n')
}
