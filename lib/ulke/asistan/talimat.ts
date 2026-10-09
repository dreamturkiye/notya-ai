/**
 * NOTYA-ULKE-ASISTAN-01 — THE INSTRUCTION TO THE MODEL, assembled. Pure: the pack's parts come in as arguments, so
 * a test can assemble the instruction of every role of every pack without a server.
 *
 * THE ORDER IS THE KIT'S, and it is the same for every country and every role:
 *
 *   1. persona        who the assistant is: name with title, seniority, country of practice      (pack: kimlik)
 *   2. role scope     stays in the role's field, says when a question belongs elsewhere           (pack: kapsam)
 *   3. language       answers in the doctor's interface form                                      (pack: dil)
 *   4. sources        the authorities and reference works the pack LISTS for the role, named as
 *                     existing; and, where the pack lists no reference work, that none was given  (pack: kaynak*)
 *   5. honesty        says when it does not know the local rule; invents nothing; not a person,
 *                     not licensed; decision support only                                         (pack: durustluk)
 *   6. safety         emergencies; nothing addressed to a patient                                 (pack: guvenlik)
 *   7. form           plain text                                                                  (pack: bicim)
 *
 * The first block (1–7) is the same for every doctor of a role and a form: it holds no doctor's name, no date and no
 * patient, so the gateway may cache it. The patient block is separate (`asistanHastaBlogu`) and is never cached.
 *
 * NOTHING IS ADDED HERE. The kit writes no sentence of its own into an instruction: every word the model reads is
 * the pack's. A part that is missing makes the whole instruction `null` — the role then has no assistant in that
 * form — and never an instruction with a hole in it.
 */
import { yerine } from '../arayuz/yerTutucu'
import type { DilKodu } from '../tipler'
import type { AsistanIcerigi, AsistanKaynagi, AsistanTalimatParcalari } from './tipler'

/** The parts of an instruction, in the kit's order, each as it is sent. For tests and for the pack check. */
export type AsistanTalimatBolumleri = { kimlik: string; kapsam: string; dil: string; kaynaklar: string; durustluk: string; guvenlik: string; bicim: string }

export const TALIMAT_PARCA_ANAHTARLARI: readonly (keyof AsistanTalimatParcalari)[] = ['kimlik', 'kapsam', 'dil', 'kaynakGiris', 'kaynakSatiri', 'kaynakSon', 'kaynakYok', 'durustluk', 'guvenlik', 'bicim', 'hasta', 'hastaYok']

const dolu = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0

/** The entries the pack lists for a role, common ones first. undefined = the pack does not list the role at all. */
export function rolunKaynaklari(icerik: Pick<AsistanIcerigi, 'kaynaklar'>, rol: string): readonly AsistanKaynagi[] | undefined {
  const k = icerik.kaynaklar
  if (!k || !Object.prototype.hasOwnProperty.call(k.roller ?? {}, rol)) return undefined
  return [...(Array.isArray(k.ortak) ? k.ortak : []), ...(Array.isArray(k.roller[rol]) ? k.roller[rol] : [])]
}

/** The sources block: what exists (by name), that its text was not given, and — where no reference work is listed — that none was. */
function kaynakBlogu(p: AsistanTalimatParcalari, kaynaklar: readonly AsistanKaynagi[], dil: DilKodu): string | null {
  const adlar: string[] = []
  for (const k of kaynaklar) {
    const ad = Object.prototype.hasOwnProperty.call(k.ad, dil) ? k.ad[dil] : undefined
    // An entry without a name in this form cannot be said: the instruction is not assembled with a hole in it.
    if (!dolu(ad)) return null
    adlar.push(yerine(p.kaynakSatiri, ad))
  }
  const eserVar = kaynaklar.some((k) => k.tur === 'eser')
  return [
    ...(adlar.length ? [p.kaynakGiris, ...adlar] : []),
    // No reference work for the role: the model is told so, in the pack's words, instead of being left to assume one.
    ...(eserVar ? [] : [p.kaynakYok]),
    p.kaynakSon,
  ].join('\n')
}

/**
 * The parts of the instruction for `rol` in `dil`, or null: the pack has no parts for it, a part is empty, the role
 * is not listed among the sources, or the role has no assistant of its own (`kisi` null).
 */
export function asistanTalimatBolumleri(icerik: AsistanIcerigi, rol: string, dil: DilKodu, kisi: { tamAd: string; rolAdi: string } | null): AsistanTalimatBolumleri | null {
  if (!kisi || !dolu(kisi.tamAd) || !dolu(kisi.rolAdi)) return null
  const p = icerik.parcalar(rol, dil)
  if (!p || TALIMAT_PARCA_ANAHTARLARI.some((k) => !dolu(p[k]))) return null
  const kaynaklar = rolunKaynaklari(icerik, rol)
  if (!kaynaklar) return null
  const kaynakMetni = kaynakBlogu(p, kaynaklar, dil)
  if (kaynakMetni === null) return null
  if (!(Number.isInteger(icerik.kidemYili) && icerik.kidemYili > 0)) return null
  return {
    kimlik: yerine(p.kimlik, kisi.tamAd, kisi.rolAdi, icerik.kidemYili),
    kapsam: yerine(p.kapsam, kisi.rolAdi),
    dil: p.dil,
    kaynaklar: kaynakMetni,
    durustluk: p.durustluk,
    guvenlik: p.guvenlik,
    bicim: p.bicim,
  }
}

/** The instruction as one text, in the kit's order. null exactly where `asistanTalimatBolumleri` is. */
export function asistanTalimati(icerik: AsistanIcerigi, rol: string, dil: DilKodu, kisi: { tamAd: string; rolAdi: string } | null): string | null {
  const b = asistanTalimatBolumleri(icerik, rol, dil, kisi)
  return b ? [b.kimlik, b.kapsam, b.dil, b.kaynaklar, b.durustluk, b.guvenlik, b.bicim].join('\n\n') : null
}

/**
 * The second block: either "no patient's data was given", or the pack's sentence before the data and the data
 * itself as the pack writes it. Never cached, never part of the first block.
 */
export function asistanHastaBlogu(icerik: AsistanIcerigi, rol: string, dil: DilKodu, hastaMetni: string | null): string | null {
  const p = icerik.parcalar(rol, dil)
  if (!p || !dolu(p.hasta) || !dolu(p.hastaYok)) return null
  return hastaMetni === null ? p.hastaYok : `${p.hasta}\n\n${hastaMetni}`
}
