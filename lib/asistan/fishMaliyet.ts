/**
 * NOTYA-SES-FISH-UCTAN-UCA-01 / SADECE-01 — Ayşe Kaya'nın Fish yolunda bir görüşmenin gerçek dakika başı maliyeti
 * ve tur gecikmesi özeti.
 *
 * Toplam = Fish ASR (kulak) + Fish TTS (ses) + model (ai_token_kullanim). Sunucu / Vercel payı dahil DEĞİL.
 * FİYAT UYDURULMAZ: yalnız kaynağı doğrulanmış oran hesaba girer; oranı olmayan kalem ham kullanımıyla yazılır,
 * toplam "bilinen" diye ayrılır ve eksik oran TODO olarak döner.
 *
 * Oranların kaynağı (2026-09-28'de bakıldı):
 *   - Fish ASR transcribe-1 ve transcribe-1-pro: $0.36 / ses saati; "Charges are based on the duration of audio
 *     processed", "Duration is rounded up to the nearest second" —
 *     https://docs.fish.audio/developer-guide/models-pricing/pricing-and-rate-limits. Yuvarlama istek başına
 *     uygulandığı varsayılır (fish-dinle istek başına Math.ceil yazar) — faturada doğrulanmalı.
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
  /** Fish ASR: ses saati başına USD — model adına göre. */
  fishAsrSaat: Record<string, Oran>
  /** Fish: 1M UTF-8 bayt başına USD — model adına göre. */
  fishMilyonBayt: Record<string, Oran>
  /** Model: 1M token başına USD (girdi / çıktı / önbellek okuma / önbellek yazma). */
  modelMilyonToken: { input: number; output: number; cacheRead: number; cacheCreation: number; kaynak: string } | null
  /** ElevenLabs karşılaştırması: kredi başına USD. */
  elevenlabsKredi: Oran | null
}

export const DOGRULANMIS_ORANLAR: MaliyetOranlari = {
  fishAsrSaat: {
    'transcribe-1': { usd: 0.36, kaynak: 'docs.fish.audio pricing-and-rate-limits (ASR)', not: 'saniyeye yukarı yuvarlanır' },
    'transcribe-1-pro': { usd: 0.36, kaynak: 'docs.fish.audio pricing-and-rate-limits (ASR)', not: 'saniyeye yukarı yuvarlanır' },
  },
  fishMilyonBayt: {
    's2.1-pro-free': { usd: 0, kaynak: 'docs.fish.audio pricing-and-rate-limits', not: 'ücretsiz geliştirici modeli, 30 Kasım 2026\'ya kadar' },
    's2.1-pro': { usd: 15, kaynak: 'docs.fish.audio pricing-and-rate-limits' },
  },
  modelMilyonToken: null,
  elevenlabsKredi: null,
}

export const FISH_UCRETLI_MODEL = 's2.1-pro'
/** docs/OPEN-COMMITMENTS.md NOTYA-SES-FISH-01 BASELINE (ElevenLabs, 09-25→28, 30 çağrı). */
export const ELEVENLABS_TABAN_KREDI_DK = 429

export interface OturumKullanimi {
  /** Görüşmenin duvar saati süresi (sn) — dakika başına bölen. */
  oturumSaniye: number
  /** Fish ASR'nin faturaladığı ses saniyesi (istek başına yukarı yuvarlanmış toplam). */
  asrSaniye: number
  asrModel: string | null
  fishBayt: number
  fishModel: string | null
  model: { cagri: number; input: number; output: number; cacheRead: number; cacheCreation: number }
}

export interface MaliyetKalemi {
  ad: 'fish_asr' | 'fish' | 'model'
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

  const asrSaat = Math.max(0, k.asrSaniye) / 3600
  const asrOran = k.asrModel ? oranlar.fishAsrSaat[k.asrModel] : undefined
  const asrMiktar = `${yuvarla(k.asrSaniye, 1)} sn ses (${k.asrModel || '?'})`
  if (k.asrSaniye <= 0) {
    kalemler.push({ ad: 'fish_asr', miktar: '0 sn ses', usd: 0 })
  } else if (asrOran) {
    kalemler.push({ ad: 'fish_asr', miktar: asrMiktar, usd: yuvarla(asrSaat * asrOran.usd) })
  } else {
    const t = `Fish ASR fiyatı "${k.asrModel || 'bilinmeyen model'}" için doğrulanmadı — ham ses süresi yazıldı`
    kalemler.push({ ad: 'fish_asr', miktar: asrMiktar, usd: null, todo: t })
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
export function maliyetRaporuMetni(oturumId: string, k: OturumKullanimi, r: MaliyetRaporu, ek: { ucretliFish?: MaliyetRaporu; gecikme?: GecikmeOzeti[] } = {}): string {
  const usd = (x: number | null) => (x === null ? 'TODO' : `$${x.toFixed(4)}`)
  const satirlar = [
    `# Fish uçtan uca maliyet — oturum ${oturumId}`,
    '',
    `Görüşme: ${r.dakika} dk · Fish ASR'ye giden ses ${yuvarla(k.asrSaniye / 60, 2)} dk`,
    '',
    '| Kalem | Kullanım | USD |',
    '|---|---|---|',
    ...r.kalemler.map((x) => `| ${x.ad} | ${x.miktar} | ${usd(x.usd)} |`),
    `| **Toplam** | | **${usd(r.toplamUsd)}** (bilinen: ${usd(r.bilinenUsd)}) |`,
    '',
    `Dakika başı: **${usd(r.dakikaBasiUsd)}** (bilinen kalemler: ${usd(r.bilinenDakikaBasiUsd)})`,
  ]
  if (ek.ucretliFish) satirlar.push(`Fish ücretli modelde (${FISH_UCRETLI_MODEL}) dakika başı bilinen: ${usd(ek.ucretliFish.bilinenDakikaBasiUsd)}`)
  satirlar.push('', `ElevenLabs tabanı: ${ELEVENLABS_TABAN_KREDI_DK} kredi/dk → ${usd(r.elevenlabsTabanDakikaUsd)}`)
  if (ek.gecikme?.length) {
    satirlar.push('', '## Tur gecikmesi (ms)', '', '| Aşama | n | p50 | p90 | en çok |', '|---|---|---|---|---|')
    for (const g of ek.gecikme) satirlar.push(`| ${GECIKME_ADLARI[g.olcu] || g.olcu} | ${g.n} | ${g.p50} | ${g.p90} | ${g.enCok} |`)
    const dinle = ek.gecikme.find((g) => g.olcu === 'dinle_ms')
    if (dinle && dinle.p50 > ASR_GECIKME_SINIRI_MS) satirlar.push('', `**UYARI:** ASR yükleme + dökme p50 ${dinle.p50} ms > ${ASR_GECIKME_SINIRI_MS} ms — Kaan'ın doğal konuşma çıtasının üstünde.`)
  }
  if (r.todo.length) satirlar.push('', '## TODO', ...r.todo.map((t) => `- ${t}`))
  return satirlar.join('\n') + '\n'
}

/** Kaan'ın çıtası: ASR yükleme + dökme adımı sürekli ~1 sn'yi aşarsa açıkça söylenir. */
export const ASR_GECIKME_SINIRI_MS = 1000

export const GECIKME_ADLARI: Record<string, string> = {
  soz_sonu_ms: 'son ses → VAD söz sonu (tarayıcı)',
  dinle_ms: 'WAV yükleme + Fish ASR (tarayıcı)',
  asr_ms: 'Fish ASR round trip (sunucu)',
  ilk_soz_ms: 'fish-tur → model ilk cümle (sunucu)',
  ilk_ses_ms: 'ilk cümle → Fish sesi (tarayıcı)',
  toplam_ms: 'doktorun son sesi → Ayşe\'nin ilk sesi (tarayıcı)',
}
const GECIKME_SIRASI = ['soz_sonu_ms', 'dinle_ms', 'asr_ms', 'ilk_soz_ms', 'ilk_ses_ms', 'toplam_ms']

export type GecikmeOzeti = { olcu: string; n: number; p50: number; p90: number; enCok: number }

/** ses_kullanim 'gecikme' satırları → aşama başına n / p50 / p90 / en çok (en yakın sıra yöntemi). */
export function gecikmeOzeti(satirlar: { olcu: string; miktar: number }[]): GecikmeOzeti[] {
  const gruplar = new Map<string, number[]>()
  for (const s of satirlar) {
    const m = Number(s.miktar)
    if (!Number.isFinite(m)) continue
    gruplar.set(s.olcu, [...(gruplar.get(s.olcu) || []), m])
  }
  const yuzde = (d: number[], p: number) => d[Math.min(d.length - 1, Math.max(0, Math.ceil(p * d.length) - 1))]
  return [...gruplar.entries()]
    .sort(([a], [b]) => (GECIKME_SIRASI.indexOf(a) + 1 || 99) - (GECIKME_SIRASI.indexOf(b) + 1 || 99))
    .map(([olcu, d]) => {
      const s = [...d].sort((x, y) => x - y)
      return { olcu, n: s.length, p50: Math.round(yuzde(s, 0.5)), p90: Math.round(yuzde(s, 0.9)), enCok: Math.round(s[s.length - 1]) }
    })
}
