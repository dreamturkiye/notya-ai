/**
 * Shared Transcribe-1 call (MessagePack, language tr). Used by fish-stt and by fish-tur
 * so the TTS socket can open while ASR is still running.
 */
import { fishFetch } from '@/lib/asistan/fishBaglanti'
import {
  FISH_ASR_DIL, FISH_ASR_MODEL, FISH_ASR_YENIDEN, FISH_ASR_ZAMAN_MS, FISH_KLIP_AZAMI_BAYT,
  asrKlipDenetle, fishAsrDilKoduUyumluMu, fishAsrDilUyumluMu, fishAsrDosyaAdi, fishAsrGovde, fishAsrMetni, fishAsrYenidenDenenirMi,
} from '@/lib/asistan/fishSes'

export type FishAsrDeneme = { durum: number | null; metin: string; hata: string | null; dil?: string | null }

export type FishAsrSonuc =
  | { tur: 'metin'; metin: string; asr_latency_ms: number; dil: string | null }
  | { tur: 'atlandi'; neden: string; asr_latency_ms: number }
  | { tur: 'hata'; asr_latency_ms: number }

export async function fishAsrCagir(anahtar: string, bayt: Uint8Array): Promise<FishAsrDeneme> {
  const kontrol = new AbortController()
  const zaman = setTimeout(() => kontrol.abort(), FISH_ASR_ZAMAN_MS)
  try {
    const yanit = await fishFetch('https://api.fish.audio/v1/asr', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${anahtar}`,
        model: FISH_ASR_MODEL,
        'Content-Type': 'application/msgpack',
      },
      body: Buffer.from(fishAsrGovde(bayt)),
      signal: kontrol.signal,
    })
    if (!yanit.ok) return { durum: yanit.status, metin: '', hata: `http_${yanit.status}` }
    const j = (await yanit.json().catch(() => null)) as { text?: unknown; language_code?: unknown } | null
    return {
      durum: yanit.status, metin: fishAsrMetni(typeof j?.text === 'string' ? j.text : ''), hata: null,
      dil: typeof j?.language_code === 'string' ? j.language_code : null,
    }
  } catch (e) {
    return { durum: null, metin: '', hata: e instanceof Error ? e.name : 'hata' }
  } finally {
    clearTimeout(zaman)
  }
}

export async function fishAsrBlob(anahtar: string, ses: Blob, gunluk = '[fish-stt]'): Promise<FishAsrSonuc> {
  if (ses.size > FISH_KLIP_AZAMI_BAYT) return { tur: 'atlandi', neden: 'uzun', asr_latency_ms: 0 }
  const ad = ses instanceof File && ses.name ? ses.name : fishAsrDosyaAdi(ses.type)
  const bayt = new Uint8Array(await ses.arrayBuffer())
  const klip = asrKlipDenetle(bayt, ses.type || ad)
  if (!klip.uygun) {
    console.info(gunluk, { atlandi: klip.neden, klip_ms: klip.sureMs, bayt: klip.bayt, rms: klip.rms })
    return { tur: 'atlandi', neden: klip.neden, asr_latency_ms: 0 }
  }
  const t0 = Date.now()
  let deneme: FishAsrDeneme = { durum: null, metin: '', hata: 'baslamadi' }
  let tekrar = 0
  for (let i = 0; i <= FISH_ASR_YENIDEN; i++) {
    tekrar = i
    deneme = await fishAsrCagir(anahtar, bayt)
    const dilOk = !deneme.hata && fishAsrDilUyumluMu(deneme.metin) && fishAsrDilKoduUyumluMu(deneme.dil)
    if (dilOk) break
    if (deneme.hata && !fishAsrYenidenDenenirMi(deneme.durum)) break
  }
  const asr_latency_ms = Date.now() - t0
  const asr_dil_uyusmazligi = !deneme.hata && !(fishAsrDilUyumluMu(deneme.metin) && fishAsrDilKoduUyumluMu(deneme.dil))
  console.info(gunluk, {
    asr_latency_ms, klip_ms: klip.sureMs, bayt: klip.bayt, dil: FISH_ASR_DIL, dil_tespit: deneme.dil ?? null, model: FISH_ASR_MODEL,
    durum: deneme.durum, tekrar, karakter: deneme.metin.length, hata: deneme.hata, asr_dil_uyusmazligi,
  })
  if (deneme.hata) return { tur: 'hata', asr_latency_ms }
  if (asr_dil_uyusmazligi) return { tur: 'atlandi', neden: 'dil', asr_latency_ms }
  return { tur: 'metin', metin: deneme.metin, asr_latency_ms, dil: deneme.dil ?? null }
}
