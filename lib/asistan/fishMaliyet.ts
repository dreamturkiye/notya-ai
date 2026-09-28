/**
 * NOTYA-SES-FISH-UCTAN-UCA-01 — Ayşe Kaya'nın Fish yolunda bir görüşmenin gerçek dakika başı maliyeti.
 *
 * Toplam = Deepgram (kulak) + Fish (ses) + model (ai_token_kullanim). Sunucu / Vercel payı dahil DEĞİL.
 * FİYAT UYDURULMAZ: yalnız kaynağı doğrulanmış oran hesaba girer; oranı olmayan kalem ham kullanımıyla yazılır,
 * toplam "bilinen" diye ayrılır ve eksik oran TODO olarak döner.
 *
 * Oranların kaynağı (2026-09-28'de bakıldı):
 *   - Deepgram Nova-3 monolingual, akış, pay-as-you-go: $0.0048/dk ("limited-time promotional rate", normal fiyat
 *     $0.0077/dk) — https://deepgram.com/pricing. Türkçe Nova-3'ün çok dilli kümesinde değil; monolingual fiyatla
 *     faturalandığı çıkarımdır, faturada doğrulanmalı.
 *   - Fish s2.1-pro: $15.00 / 1M UTF-8 bayt; s2.1-pro-free: $0 —
 *     https://docs.fish.audio/developer-platform/models-pricing/pricing-and-rate-limits. Ayşe bugün s2.1-pro-free
 *     kullanıyor (lib/asistan/fishSes.ts FISH_MODEL, 30 Kasım 2026'ya kadar); ücretli karşılığı ayrıca gösterilir.
 *   - Model (Luna-Pro birincil / Sonnet 5 koruyucu, OpenRouter): depoda fiyat tablosu YOK → TODO.
 *   - ElevenLabs karşılaştırması: docs/OPEN-COMMITMENTS.md NOTYA-SES-FISH-01 ~429 kredi/dk. ElevenLabs'in güncel
 *     ajan fiyatlandırması kredi değil dakika üzerinden (https://elevenlabs.io/pricing/agents: ek dakika $0.08, LLM
 *     ayrı) — kredi→USD oranı plan kademesine bağlı → TODO (Kaan'ın hesap kademesi).
 */

export type Oran = { usd: number; kaynak: string; not?: string }

export interface MaliyetOranlari {
  /** Deepgram: gönderilen ses dakikası başına USD. */
  deepgramDakika: Oran | null
  /** Fish: 1M UTF-8 bayt başına USD — model adına göre. */
  fishMilyonBayt: Record<string, Oran>
  /** Model: 1M token başına USD (girdi / çıktı / önbellek okuma / önbellek yazma). */
  modelMilyonToken: { input: number; output: number; cacheRead: number; cacheCreation: number; kaynak: string } | null
  /** ElevenLabs karşılaştırması: kredi başına USD. */
  elevenlabsKredi: Oran | null
}

export const DOGRULANMIS_ORANLAR: MaliyetOranlari = {
  deepgramDakika: { usd: 0.0048, kaynak: 'deepgram.com/pricing (Nova-3 monolingual, streaming, PAYG)', not: 'promosyon fiyatı; normal $0.0077/dk' },
  fishMilyonBayt: {
    's2.1-pro-free': { usd: 0, kaynak: 'docs.fish.audio pricing-and-rate-limits', not: 'ücretsiz geliştirici modeli, 30 Kasım 2026\'ya kadar' },
    's2.1-pro': { usd: 15, kaynak: 'docs.fish.audio pricing-and-rate-limits' },
  },
  modelMilyonToken: null,
  elevenlabsKredi: null,
}

/** Deepgram'ın promosyon dışı liste fiyatı — duyarlılık satırı için. */
export const DEEPGRAM_NORMAL_DAKIKA: Oran = { usd: 0.0077, kaynak: 'deepgram.com/pricing (regular price)' }
export const FISH_UCRETLI_MODEL = 's2.1-pro'
/** docs/OPEN-COMMITMENTS.md NOTYA-SES-FISH-01 BASELINE (ElevenLabs, 09-25→28, 30 çağrı). */
export const ELEVENLABS_TABAN_KREDI_DK = 429

export interface OturumKullanimi {
  /** Görüşmenin duvar saati süresi (sn) — dakika başına bölen. */
  oturumSaniye: number
  deepgramSesSaniye: number
  deepgramBaglantiSaniye?: number
  fishBayt: number
  fishModel: string | null
  model: { cagri: number; input: number; output: number; cacheRead: number; cacheCreation: number }
}

export interface MaliyetKalemi {
  ad: 'deepgram' | 'fish' | 'model'
  miktar: string
  usd: number | null
  todo?: string
}

export interface MaliyetRaporu {
  dakika: number
  kalemler: MaliyetKalemi[]
  /** Oranı bilinen kalemlerin toplamı. */
  bilinenUsd: number
  bilinenDakikaBasiUsd: number | null
  /** Tüm kalemlerin oranı biliniyorsa gerçek toplam; biri eksikse null (uydurma toplam yok). */
  toplamUsd: number | null
  dakikaBasiUsd: number | null
  todo: string[]
  /** ElevenLabs tabanının USD karşılığı (oran yoksa null + TODO). */
  elevenlabsTabanDakikaUsd: number | null
}

const yuvarla = (x: number, b = 6) => Math.round(x * 10 ** b) / 10 ** b

export function maliyetHesapla(k: OturumKullanimi, oranlar: MaliyetOranlari = DOGRULANMIS_ORANLAR): MaliyetRaporu {
  const dakika = Math.max(0, k.oturumSaniye) / 60
  const kalemler: MaliyetKalemi[] = []
  const todo: string[] = []

  const dgDakika = Math.max(0, k.deepgramSesSaniye) / 60
  if (oranlar.deepgramDakika) {
    kalemler.push({ ad: 'deepgram', miktar: `${yuvarla(dgDakika, 2)} dk ses`, usd: yuvarla(dgDakika * oranlar.deepgramDakika.usd) })
  } else {
    const t = 'Deepgram dakika fiyatı doğrulanmadı — ham ses süresi yazıldı'
    kalemler.push({ ad: 'deepgram', miktar: `${yuvarla(dgDakika, 2)} dk ses`, usd: null, todo: t })
    todo.push(t)
  }

  const fishOran = k.fishModel ? oranlar.fishMilyonBayt[k.fishModel] : undefined
  if (k.fishBayt <= 0) {
    kalemler.push({ ad: 'fish', miktar: '0 bayt', usd: 0 })
  } else if (fishOran) {
    kalemler.push({ ad: 'fish', miktar: `${k.fishBayt} UTF-8 bayt (${k.fishModel})`, usd: yuvarla((k.fishBayt / 1e6) * fishOran.usd) })
  } else {
    const t = `Fish fiyatı "${k.fishModel || 'bilinmeyen model'}" için doğrulanmadı — ham bayt yazıldı`
    kalemler.push({ ad: 'fish', miktar: `${k.fishBayt} UTF-8 bayt (${k.fishModel || '?'})`, usd: null, todo: t })
    todo.push(t)
  }

  const m = k.model
  const tokenMetni = `${m.cagri} çağrı · girdi ${m.input} · çıktı ${m.output} · önbellek okuma ${m.cacheRead} · önbellek yazma ${m.cacheCreation} token`
  if (m.cagri === 0 && m.input + m.output + m.cacheRead + m.cacheCreation === 0) {
    kalemler.push({ ad: 'model', miktar: tokenMetni, usd: 0 })
  } else if (oranlar.modelMilyonToken) {
    const o = oranlar.modelMilyonToken
    const usd = (m.input * o.input + m.output * o.output + m.cacheRead * o.cacheRead + m.cacheCreation * o.cacheCreation) / 1e6
    kalemler.push({ ad: 'model', miktar: tokenMetni, usd: yuvarla(usd) })
  } else {
    const t = 'Model (Luna-Pro / Sonnet 5, OpenRouter) token fiyatı depoda yok — ham token yazıldı; OpenRouter faturasındaki oranla tamamlanmalı'
    kalemler.push({ ad: 'model', miktar: tokenMetni, usd: null, todo: t })
    todo.push(t)
  }

  const bilinenUsd = yuvarla(kalemler.reduce((a, x) => a + (x.usd ?? 0), 0))
  const eksik = kalemler.some((x) => x.usd === null)
  const toplamUsd = eksik ? null : bilinenUsd
  let elevenlabsTabanDakikaUsd: number | null = null
  if (oranlar.elevenlabsKredi) elevenlabsTabanDakikaUsd = yuvarla(ELEVENLABS_TABAN_KREDI_DK * oranlar.elevenlabsKredi.usd)
  else todo.push(`ElevenLabs tabanı ${ELEVENLABS_TABAN_KREDI_DK} kredi/dk — kredi→USD oranı hesap kademesine bağlı (ajanlar artık dakikayla faturalanıyor), Kaan'ın kademesi gerekli`)

  return {
    dakika: yuvarla(dakika, 3),
    kalemler,
    bilinenUsd,
    bilinenDakikaBasiUsd: dakika > 0 ? yuvarla(bilinenUsd / dakika) : null,
    toplamUsd,
    dakikaBasiUsd: toplamUsd !== null && dakika > 0 ? yuvarla(toplamUsd / dakika) : null,
    todo,
    elevenlabsTabanDakikaUsd,
  }
}

/** Markdown rapor (scripts/fish-maliyet.mts → docs/denetim/). */
export function maliyetRaporuMetni(oturumId: string, k: OturumKullanimi, r: MaliyetRaporu, ek: { ucretliFish?: MaliyetRaporu; normalDeepgram?: MaliyetRaporu } = {}): string {
  const usd = (x: number | null) => (x === null ? 'TODO' : `$${x.toFixed(4)}`)
  const satirlar = [
    `# Fish uçtan uca maliyet — oturum ${oturumId}`,
    '',
    `Görüşme: ${r.dakika} dk · Deepgram gönderilen ses ${yuvarla(k.deepgramSesSaniye / 60, 2)} dk` + (k.deepgramBaglantiSaniye ? ` (bağlantı ${yuvarla(k.deepgramBaglantiSaniye / 60, 2)} dk)` : ''),
    '',
    '| Kalem | Kullanım | USD |',
    '|---|---|---|',
    ...r.kalemler.map((x) => `| ${x.ad} | ${x.miktar} | ${usd(x.usd)} |`),
    `| **Toplam** | | **${usd(r.toplamUsd)}** (bilinen: ${usd(r.bilinenUsd)}) |`,
    '',
    `Dakika başı: **${usd(r.dakikaBasiUsd)}** (bilinen kalemler: ${usd(r.bilinenDakikaBasiUsd)})`,
  ]
  if (ek.ucretliFish) satirlar.push(`Fish ücretli modelde (${FISH_UCRETLI_MODEL}) dakika başı bilinen: ${usd(ek.ucretliFish.bilinenDakikaBasiUsd)}`)
  if (ek.normalDeepgram) satirlar.push(`Deepgram promosyon dışı fiyatla dakika başı bilinen: ${usd(ek.normalDeepgram.bilinenDakikaBasiUsd)}`)
  satirlar.push('', `ElevenLabs tabanı: ${ELEVENLABS_TABAN_KREDI_DK} kredi/dk → ${usd(r.elevenlabsTabanDakikaUsd)}`)
  if (r.todo.length) satirlar.push('', '## TODO', ...r.todo.map((t) => `- ${t}`))
  return satirlar.join('\n') + '\n'
}
