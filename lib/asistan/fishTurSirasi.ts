/**
 * NOTYA-SES-TUR-01 — turn sequencing for the Ayşe 1:1 voice loop. Pure; unit-tested with synthetic events.
 *
 * The recorder never stops (fishDinleDongusu keeps it running while a turn is in flight and while Ayşe
 * plays), so every clip that leaves the junk gate is an event here. Decisions:
 *  - no turn in flight → send the clip in the same tick (single-sentence latency unchanged);
 *  - turn in flight, answer audio already playing → barge-in: abort it, the clip is a new turn;
 *  - turn in flight, no audio yet, the doctor resumed within the merge window → abort it, send BOTH clips
 *    as one merged utterance ("<first>. <second>"); one merge per turn, ≤ 40 words known so far, ≤ 16 s;
 *  - the window is 1.5 s after the first clip ended, 2.5 s when its transcript has no terminal cue
 *    (the doctor was mid-thought), always capped by the first answer audio;
 *  - a clip after the turn already merged is ignored (no ping-pong: the merged answer plays, the doctor
 *    can barge in); a clip outside the window before any audio replaces the turn (newer speech wins).
 */

export const FISH_BIRLESTIR_PENCERE_MS = 1500
export const FISH_BIRLESTIR_ACIK_PENCERE_MS = 2500
export const FISH_BIRLESTIR_AZAMI_KELIME = 40
export const FISH_BIRLESTIR_AZAMI_MS = 16_000
/** A clip that arrives while the brain works must carry this much voiced audio; a cough / "hmm" must not restart the turn. */
export const FISH_BIRLESTIR_MIN_SESLI_MS = 350

export type TurKlipBilgisi = { konusmaBas: number; bitis: number; sesliMs: number }

export type AktifTur<K> = { klipler: K[]; stt: string | null; sesBasladi: boolean; birlesti: boolean }
export type TurSirasi<K> = { aktif: AktifTur<K> | null }

export type TurKarari<K> =
  | { k: 'gonder'; klipler: K[]; birlesik: boolean; iptal: 'yok' | 'barge' | 'birlestir' | 'yeni' }
  | { k: 'yoksay'; neden: 'birlesti' | 'kisa' }

export function turSirasiBaslat<K>(): TurSirasi<K> {
  return { aktif: null }
}

/** Fish ASR punctuates; a Turkish question particle at the end also closes the sentence. */
export function cumleBittiMi(metin: string): boolean {
  const t = String(metin || '').trim()
  if (!t) return false
  if (/[.?!…]["'”’)]*$/.test(t)) return true
  return /(^|\s)(mı|mi|mu|mü|mısın|misin|musun|müsün|mıyım|miyim|muyum|müyüm|mıdır|midir|mudur|müdür|mısınız|misiniz|musunuz|müsünüz)$/i.test(t)
}

export function birlestirPenceresiMs(stt: string | null): number {
  if (stt !== null && !cumleBittiMi(stt)) return FISH_BIRLESTIR_ACIK_PENCERE_MS
  return FISH_BIRLESTIR_PENCERE_MS
}

export function kelimeSayisi(s: string): number {
  return String(s || '').trim().split(/\s+/).filter(Boolean).length
}

/** A clip left the junk gate. `birlesebilir` is false when the clips cannot be joined (non-WAV recorder). */
export function klipGeldi<K extends TurKlipBilgisi>(
  d: TurSirasi<K>,
  klip: K,
  birlesebilir = true,
): { durum: TurSirasi<K>; karar: TurKarari<K> } {
  const a = d.aktif
  const yeni = (iptal: 'yok' | 'barge' | 'yeni'): { durum: TurSirasi<K>; karar: TurKarari<K> } => ({
    durum: { aktif: { klipler: [klip], stt: null, sesBasladi: false, birlesti: false } },
    karar: { k: 'gonder', klipler: [klip], birlesik: false, iptal },
  })
  if (!a) return yeni('yok')
  if (a.sesBasladi) return yeni('barge')
  if (klip.sesliMs < FISH_BIRLESTIR_MIN_SESLI_MS) return { durum: d, karar: { k: 'yoksay', neden: 'kisa' } }
  if (a.birlesti) return { durum: d, karar: { k: 'yoksay', neden: 'birlesti' } }
  const ilk = a.klipler[0]
  const son = a.klipler[a.klipler.length - 1]
  const pencerede = klip.konusmaBas - son.bitis <= birlestirPenceresiMs(a.stt)
  const kisa = a.stt === null || kelimeSayisi(a.stt) <= FISH_BIRLESTIR_AZAMI_KELIME
  const sure = klip.bitis - ilk.konusmaBas <= FISH_BIRLESTIR_AZAMI_MS
  if (birlesebilir && pencerede && kisa && sure) {
    const klipler = [...a.klipler, klip]
    return {
      durum: { aktif: { klipler, stt: null, sesBasladi: false, birlesti: true } },
      karar: { k: 'gonder', klipler, birlesik: true, iptal: 'birlestir' },
    }
  }
  return yeni('yeni')
}

export function sttGeldi<K>(d: TurSirasi<K>, metin: string): TurSirasi<K> {
  return d.aktif ? { aktif: { ...d.aktif, stt: String(metin || '') } } : d
}

/** First answer audio is playing: from here on new speech is barge-in, never a merge. */
export function sesBasladi<K>(d: TurSirasi<K>): TurSirasi<K> {
  return d.aktif ? { aktif: { ...d.aktif, sesBasladi: true } } : d
}

export function turBitti<K>(_d: TurSirasi<K>): TurSirasi<K> {
  return { aktif: null }
}
