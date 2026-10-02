/**
 * NOTYA-KALITE-STANDART-01 — the rubric: which checks of denetimler.ts run on which text of an answer.
 *
 *   written answer / file panel   every wording and structure check on the screen text
 *   voice answer                  wording checks on the SPOKEN text (what the doctor hears), the voice checks
 *                                 (Q-30 to Q-32), and the structure checks on the screen text of the same turn
 *
 * The screen text and the spoken text are judged separately; each verdict says which one it is about (`hedef`).
 * An expected out-of-scope refusal is the fixed sentence of the scope gate: only "never silent" applies to it.
 * PURE — no model call.
 */
import {
  bolumler, bosSavusturma, cevapOnce, dayanakYorum, dikkatSonda, hamArtik, hastaAdi, karar, mgkgKilo, persentilTarih, planUygulandi,
  seriTablo, sesAnlati, sesBicim, sesBirim, sesKimlik, sesTarih, sesUzunluk, sessizDegil, takipBugun, takipGecti, tamTarih, tekOlcum,
  turkce, uzunluk, yabanciHasta, yapilmadi, yasakIfade,
  type KaliteGirdisi, type KaliteKarari,
} from './denetimler'

/** Every verdict that applies to one answer. An empty text gives only the "never silent" verdict. */
export function cevabiDenetle(g: KaliteGirdisi): KaliteKarari[] {
  const out: (KaliteKarari | null)[] = [karar('sessiz-degil', g.yuzey === 'ses' ? 'soz' : 'ekran', sessizDegil(g))]
  if (g.ret) return out.filter((k): k is KaliteKarari => k !== null)

  const sesli = g.yuzey === 'ses'
  const hedef = sesli ? 'soz' : 'ekran'
  // What the doctor reads or hears.
  const metin = sesli ? g.soz || '' : g.ekran
  // What is on the screen: the answer itself, or on voice the screen message of the same turn.
  const ekran = g.ekran

  // ── wording: on the answer the doctor gets on this surface ──
  out.push(
    karar('cevap-once', hedef, cevapOnce(metin)),
    karar('tek-olcum', hedef, tekOlcum(metin, g.olcum)),
    karar('yapilmadi', hedef, yapilmadi(metin)),
    karar('plan-uygulandi', hedef, planUygulandi(metin, g.kanit)),
    karar('takip-bugun', hedef, takipBugun(metin)),
    karar('takip-gecti', hedef, takipGecti(metin, g.kanit)),
    karar('hasta-adi', hedef, g.yuzey === 'panel' ? null : hastaAdi(metin, g.hastaAdi)),
    karar('yabanci-hasta', hedef, yabanciHasta(metin, g.soru, g.yabanciAdlar)),
    karar('yasak-ifade', hedef, yasakIfade(metin)),
    karar('bos-savusturma', hedef, bosSavusturma(metin)),
    karar('ham-artik', hedef, hamArtik(metin)),
    karar('turkce', hedef, turkce(metin)),
    // Q-06 "full dates" is about the patient's record; a calendar answer about this week is not judged by it.
    karar('tam-tarih', hedef, g.hastaAdi ? tamTarih(metin) : null),
  )

  // ── structure: on the screen text ──
  out.push(
    karar('dayanak-yorum', 'ekran', dayanakYorum(ekran)),
    karar('dikkat-sonda', 'ekran', dikkatSonda(ekran)),
    karar('persentil-tarih', 'ekran', persentilTarih(ekran)),
    karar('mgkg-kilo', 'ekran', mgkgKilo(ekran)),
    karar('uzunluk', 'ekran', uzunluk(ekran, g)),
    karar('seri-tablo', 'ekran', seriTablo(ekran)),
    karar('bolumler', 'ekran', bolumler(ekran, g.yapi)),
  )

  // ── voice ──
  if (sesli) {
    const soz = g.soz || ''
    out.push(
      karar('ses-uzunluk', 'soz', sesUzunluk(soz, g.okuIstegi)),
      karar('ses-anlati', 'soz', g.okuIstegi ? null : sesAnlati(soz, ekran, g.yapi)),
      karar('ses-tarih', 'soz', sesTarih(soz)),
      karar('ses-bicim', 'soz', sesBicim(soz)),
      karar('ses-birim', 'soz', sesBirim(g.okunus)),
      karar('ses-kimlik', 'soz', sesKimlik(soz, g.kimlikDegerleri)),
    )
  }
  return out.filter((k): k is KaliteKarari => k !== null)
}
