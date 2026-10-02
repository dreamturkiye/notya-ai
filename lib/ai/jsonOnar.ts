/**
 * F3 kurtarıcı (AUDIT-2026-09-03, canlı olay 16:27) — model çıktısındaki JSON'u ayrıştırır; token tavanında DİZİ
 * ORTASINDA kesilmiş çıktıyı son tam öğede kırpıp açık string'i ve parantez yığınını doğru sırayla kapatarak onarır.
 * (1) düz dener, (2) ilk '{'dan gövdeyi dener, (3) kesik çıktıyı onarır. Onarılamazsa null.
 *
 * İki kullanıcı: lib/doktor/soapUret.ts (SOAP gövdesi/önerisi) ve lib/ai/cagir.ts G2 (d) — "kurtarılabilen JSON
 * yedeğe gitmez" kuralı aynı algoritmayla ölçülür (NOTYA-MODEL-LUNAPRO-01).
 */
export type JsonOnarSonucu = { deger: unknown; neden: 'ok' } | { deger: null; neden: 'json_yok' | 'onarilamadi' }

export function jsonOnarDetay(ham: string): JsonOnarSonucu {
  const metin = String(ham ?? '').replace(/```json\n?|\n?```/g, '').trim()
  const dene = (s: string): unknown => { try { return JSON.parse(s) as unknown } catch { return undefined } }
  let v = dene(metin)
  if (v !== undefined) return { deger: v, neden: 'ok' }
  const bas = metin.indexOf('{')
  if (bas === -1) return { deger: null, neden: 'json_yok' }
  const govde = metin.slice(bas)
  v = dene(govde)
  if (v !== undefined) return { deger: v, neden: 'ok' }
  // Sondaki düzyazı ("…} Umarım yardımcı olur.") — son '}' da kesip dene.
  const son = govde.lastIndexOf('}')
  if (son > 0) {
    v = dene(govde.slice(0, son + 1))
    if (v !== undefined) return { deger: v, neden: 'ok' }
  }
  const adaylar = [govde]
  for (const kesici of ['},', '],', '",', '}']) {
    const i = govde.lastIndexOf(kesici)
    if (i > 0) adaylar.push(govde.slice(0, i + 1))
  }
  for (const parca of adaylar) {
    let str = false, esc = false
    const yigin: string[] = []
    for (const ch of parca) {
      if (esc) { esc = false; continue }
      if (ch === '\\') { esc = true; continue }
      if (ch === '"') { str = !str; continue }
      if (str) continue
      if (ch === '{') yigin.push('}')
      else if (ch === '[') yigin.push(']')
      else if (ch === '}' || ch === ']') yigin.pop()
    }
    let aday = parca
    if (str) aday += '"'
    aday = aday.replace(/,\s*$/, '') + yigin.reverse().join('')
    v = dene(aday)
    if (v !== undefined) return { deger: v, neden: 'ok' }
  }
  return { deger: null, neden: 'onarilamadi' }
}

/**
 * NOTYA-AYSE-GERI-07 (audit §7, PR 13) — the JSON a model wrapped in a code fence or in prose, WITHOUT repair:
 * whole text, else from the first '{' to the last '}'. For answers whose values are clinical (a dose, a
 * prescription line, a report text): a cut answer is not completed here — closing an open string would turn
 * "560 mg" into "56". null when there is no complete JSON object.
 */
export function jsonCikar(ham: string): Record<string, unknown> | null {
  const metin = String(ham ?? '').replace(/```json\n?|```/g, '').trim()
  const dene = (s: string): Record<string, unknown> | null => {
    try {
      const v = JSON.parse(s) as unknown
      return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
    } catch { return null }
  }
  const tam = dene(metin)
  if (tam) return tam
  const bas = metin.indexOf('{')
  const son = metin.lastIndexOf('}')
  return bas >= 0 && son > bas ? dene(metin.slice(bas, son + 1)) : null
}

/** Onarılmış JSON değeri ya da null. */
export function jsonOnar(ham: string): unknown {
  return jsonOnarDetay(ham).deger
}
