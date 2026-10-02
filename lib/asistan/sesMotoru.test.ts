import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SES_TTS_KILIT, sesMotoruOnbelleginiSil, sesMotorunuSabitle, ttsKilitGerekli } from './sesMotoru'
import { SES_BLOK_ESIGI, SesYayKapisi, sesEtiketTemizle } from './sesYay'
import { pcmOranla } from './sesCalar'

test('TTS kilidi: Flash ve sabit hız temizdir; v3, expressive ve hız sapması kilit ister', () => {
  assert.equal(ttsKilitGerekli({
    model_id: 'eleven_flash_v2_5', expressive_mode: false, speed: 1, stability: 0.55, similarity_boost: 0.75,
  }), false)
  assert.equal(ttsKilitGerekli({ model_id: 'eleven_v3_conversational', speed: 1, stability: 0.55, similarity_boost: 0.75 }), true)
  assert.equal(ttsKilitGerekli({ model_id: 'eleven_flash_v2_5', expressive_mode: true, speed: 1, stability: 0.55, similarity_boost: 0.75 }), true)
  assert.equal(ttsKilitGerekli({ model_id: 'eleven_flash_v2_5', speed: 1.15, stability: 0.55, similarity_boost: 0.75 }), true)
  assert.equal(ttsKilitGerekli({ model_id: 'eleven_flash_v2_5', speed: 1, stability: 0.3, similarity_boost: 0.75 }), true)
  assert.equal(ttsKilitGerekli(null), true)
  assert.equal(ttsKilitGerekli({
    model_id: 'eleven_flash_v2_5', speed: 1, stability: 0.55, similarity_boost: 0.75,
    suggested_audio_tags: [{ tag: 'slow' }],
  }), true)
})

test('ses motoru sapmış ajanı Flash kilidine yazar, temiz ajanı yazmaz', async () => {
  sesMotoruOnbelleginiSil()
  const cagrilar: { url: string; method: string; body?: string }[] = []
  const fetchFn: typeof fetch = async (url, init) => {
    const method = init?.method || 'GET'
    cagrilar.push({ url: String(url), method, body: typeof init?.body === 'string' ? init.body : undefined })
    if (method === 'GET') {
      return new Response(JSON.stringify({
        conversation_config: { tts: { model_id: 'eleven_v3_conversational', expressive_mode: true, speed: 1.1, stability: 0.4, similarity_boost: 0.8, voice_id: 'ses' } },
      }), { status: 200 })
    }
    return new Response('{}', { status: 200 })
  }
  const r = await sesMotorunuSabitle('agent_sapma', 'anahtar', fetchFn)
  assert.equal(r.degisti, true)
  assert.match(r.once, /eleven_v3_conversational/)
  const yama = cagrilar.find((c) => c.method === 'PATCH')
  assert.ok(yama)
  const govde = JSON.parse(yama!.body || '{}')
  assert.equal(govde.conversation_config.tts.model_id, SES_TTS_KILIT.model_id)
  assert.equal(govde.conversation_config.tts.expressive_mode, false)
  assert.equal(govde.conversation_config.tts.speed, 1)
  assert.equal(govde.conversation_config.tts.voice_id, 'ses', 'ses kimliği yamada kalır')
  assert.deepEqual(govde.conversation_config.tts.suggested_audio_tags, [])

  cagrilar.length = 0
  sesMotoruOnbelleginiSil()
  const temiz: typeof fetch = async (url, init) => {
    cagrilar.push({ url: String(url), method: init?.method || 'GET' })
    return new Response(JSON.stringify({
      conversation_config: { tts: { model_id: 'eleven_flash_v2_5', expressive_mode: false, speed: 1, stability: 0.55, similarity_boost: 0.75 } },
    }), { status: 200 })
  }
  const t = await sesMotorunuSabitle('agent_temiz', 'anahtar', temiz)
  assert.equal(t.degisti, false)
  assert.equal(cagrilar.some((c) => c.method === 'PATCH'), false)
})

test('konuşma kapısı: etiket yok, yarım cümle biriktirilir, nefes dolunca ve bitişte tek parça', () => {
  assert.equal(sesEtiketTemizle('Önemli. [slow] Doz hekimindir. [excited]').replace(/\s+/g, ' ').trim(), 'Önemli. Doz hekimindir.')
  const parcalar: string[] = []
  const k = new SesYayKapisi((p) => parcalar.push(p))
  k.ekle('Kısa cümle. ')
  assert.equal(parcalar.length, 0, 'eşik dolmadan ElevenLabs\'e gitmez')
  const uzun = 'Hocam, bu cümle tek başına bir nefes olacak kadar uzundur ve Flash her cümleyi ayrı sentezleyip Türkçeyi peltekleştirmesin diye burada birikir, eşik dolar. '
  k.ekle(uzun)
  assert.equal(parcalar.length, 1, 'eşik aşılınca tek delta')
  assert.ok(parcalar[0].length >= SES_BLOK_ESIGI)
  assert.equal(parcalar[0].includes('[slow]'), false)
  k.ekle('Kuyruk cümlesi. ')
  k.bitir()
  assert.match(parcalar[parcalar.length - 1], /Kuyruk cümlesi\./)
})

test('onay sözü beklemez; uzun cevap cümle ortasından bölünmeden birleşir', () => {
  const parcalar: string[] = []
  const k = new SesYayKapisi((p) => parcalar.push(p))
  k.ekle('Tamam Hocam... ', true)
  assert.equal(parcalar[0], 'Tamam Hocam... ')
  const cumleler = [
    'Birinci cümle burada biter. ',
    'İkinci cümle de burada biter. ',
    'Üçüncü cümle ekrandakiyle aynı içeriği taşır ve yeterince uzundur. ',
    'Dördüncü. ',
  ]
  for (const c of cumleler) k.ekle(c)
  k.bitir()
  const metin = parcalar.join('').replace(/\s+/g, ' ').trim()
  assert.equal(metin, `Tamam Hocam... ${cumleler.join('').replace(/\s+/g, ' ').trim()}`)
  for (const p of parcalar) assert.match(p.trim(), /[.…]"?$|[.]$/, p)
})

test('pcm oranı süreyi korur: 16 kHz bir saniye, 48 kHz cihazda hâlâ bir saniyedir', () => {
  const kaynak = new Int16Array(16000)
  for (let i = 0; i < kaynak.length; i++) kaynak[i] = Math.round(Math.sin(i / 20) * 16000)
  const cikti = pcmOranla(kaynak, 16000, 48000)
  const sureGirdi = kaynak.length / 16000
  const sureCikti = cikti.length / 48000
  assert.ok(Math.abs(sureGirdi - sureCikti) < 1 / 48000, `${sureGirdi} vs ${sureCikti}`)
  assert.ok(Math.abs(cikti[0]) <= 1)
  const ayni = pcmOranla(kaynak, 16000, 16000)
  assert.equal(ayni.length, kaynak.length)
  assert.ok(Math.abs(ayni[100] - kaynak[100] / 32768) < 1e-6)
})
