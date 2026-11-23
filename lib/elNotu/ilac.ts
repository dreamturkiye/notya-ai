/**
 * ESNEK-MUAYENE-A — drug-name matcher for the protected class 'ilac' (Türkiye build: SGK EK-4/A + TİTCK active
 * substances from data/sgk-ilaclar.json). Exact = the word is a known brand's first word or an active substance;
 * near = within ~20% edit distance of one (a handwritten "Eritronysin" → "Eritromisin"): never accepted without a
 * reading confirmation, the near name is offered as a candidate. Loaded once per process.
 */
import fs from 'fs'
import path from 'path'
import { benzerlik, kelimeAnahtari } from '@/core/elNotu/uzlastir'
import type { IlacEslesmesi } from '@/core/elNotu/korumali'

let adlar: Map<string, string> | null = null
let ilkHarf: Map<string, string[]> | null = null

function yukle(): void {
  if (adlar) return
  adlar = new Map(); ilkHarf = new Map()
  try {
    const ham = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'sgk-ilaclar.json'), 'utf8')) as { ilaclar?: { ad?: string; marka?: string; etkenMadde?: string }[] }
    for (const i of ham.ilaclar || []) {
      for (const aday of [String(i.marka || i.ad || '').split(/\s+/)[0], String(i.etkenMadde || '').split(/[\s,+/]+/)[0]]) {
        const temiz = aday.replace(/[^\p{L}]/gu, '')
        const k = kelimeAnahtari(temiz)
        if (k.length < 4 || adlar.has(k)) continue
        const gorunur = temiz.charAt(0).toLocaleUpperCase('tr') + temiz.slice(1).toLocaleLowerCase('tr')
        adlar.set(k, gorunur)
        const h = k.charAt(0)
        ilkHarf.set(h, [...(ilkHarf.get(h) || []), k])
      }
    }
  } catch { /* no catalogue: no drug class (the generic number/dose classes still protect doses) */ }
}

export const ilacEslesmesi: IlacEslesmesi = (t: string) => {
  yukle()
  const k = kelimeAnahtari(t.replace(/[^\p{L}]/gu, ''))
  if (k.length < 4 || !adlar) return null
  const tam = adlar.get(k)
  if (tam) return { durum: 'tam', ad: tam }
  let enIyi: string | null = null, skor = 0
  for (const aday of ilkHarf!.get(k.charAt(0)) || []) {
    if (Math.abs(aday.length - k.length) > 3) continue
    const s = benzerlik(k, aday)
    if (s > skor) { skor = s; enIyi = aday }
  }
  return enIyi && skor >= 0.8 ? { durum: 'yakin', ad: adlar.get(enIyi)! } : null
}
