/**
 * SES-OMURGA-V2 — the voice route's health check (GET /api/asistan/ses-llm/v1/chat/completions). No patient, no doctor,
 * no secret in the answer; safe to call after a deploy.
 *
 *   bolge      the region the function actually runs in (VERCEL_REGION) — the 10-26 logs showed cle1 while vercel.json
 *              said fra1; this is how a deploy proves the iad1 pin.
 *   db         ses_turu_ac_v2 reachable (a nil session id answers `yok`), and its round-trip time.
 *   tur=1      a synthetic Custom-LLM request through the real route with a server-signed token for a nil doctor and
 *              session: secret check, token check, turn registry, DB open → "oturum yok" → ends with the buffer chunk
 *              and [DONE]. Reports first-byte time and that no whitespace-only content was sent.
 *   ajan=1     reads the TEK BEYİN agent and applies the pinned conversation settings (lib/asistan/sesMotoru.ts),
 *              reporting each group (tamam / uygulandi / tutmadi / reddedildi) and the backup-LLM state.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sesJetonuImzala } from '@/lib/asistan/sesJetonu'
import { sesAjaniniSabitle, SES_TEMEL_ANAHTARLAR_TR } from '@/lib/asistan/sesMotoru'
import { TEK_BEYIN_AJANLARI } from '@/lib/asistan/tekBeyinAjanlari'

const NIL = '00000000-0000-0000-0000-000000000000'

export async function sesSaglikGet(req: NextRequest): Promise<Response> {
  const q = req.nextUrl.searchParams
  const cevap: Record<string, unknown> = {
    bolge: process.env.VERCEL_REGION || null,
    surum: (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 12) || null,
  }
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } })
    const t = Date.now()
    const { data, error } = await sb.rpc('ses_turu_ac_v2', { p_oturum: NIL, p_doktor: NIL, p_cagri: 'saglik', p_tur: 0, p_mesaj: '', p_anahtar: '', p_hasta: null, p_pencere: 1 })
    cevap.db = { v2: !error && (data as { yok?: boolean } | null)?.yok === true, ms: Date.now() - t, ...(error ? { hata: error.code || 'hata' } : {}) }
  } catch (e) {
    cevap.db = { v2: false, hata: e instanceof Error ? e.name : 'hata' }
  }
  if (q.get('tur') === '1') {
    const sir = String(process.env.NOTYA_SES_LLM_SECRET || '').trim()
    const jeton = sesJetonuImzala({ d: NIL, o: NIL, s: 'genel', p: null, pe: 'aysekaya', c: `saglik-${Date.now()}` })
    if (!sir || !jeton) cevap.tur = { calisti: false, neden: 'sir_yok' }
    else {
      const { sesLlmPost } = await import('@/lib/asistan/sesLlm')
      const t = Date.now()
      const y = await sesLlmPost(new NextRequest('http://localhost/api/asistan/ses-llm/v1/chat/completions', {
        method: 'POST', headers: { authorization: `Bearer ${sir}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'notya-ayse', stream: true, messages: [{ role: 'user', content: 'Merhaba Hocam, bu bir sağlık denetimi.' }], elevenlabs_extra_body: { notya_jeton: jeton } }),
      }))
      const okuyucu = y.body?.getReader()
      let ilkBayt: number | null = null
      let ham = ''
      if (okuyucu) {
        const coz = new TextDecoder()
        for (;;) {
          const { done, value } = await okuyucu.read()
          if (done) break
          if (ilkBayt === null) ilkBayt = Date.now() - t
          ham += coz.decode(value, { stream: true })
        }
      }
      const icerikler = ham.split('\n').filter((s) => s.startsWith('data: ') && s !== 'data: [DONE]')
        .map((s) => { try { return (JSON.parse(s.slice(6)).choices?.[0]?.delta?.content ?? null) as string | null } catch { return null } })
        .filter((c): c is string => typeof c === 'string')
      cevap.tur = {
        calisti: y.status === 200, durum: y.status, ilkBaytMs: ilkBayt, toplamMs: Date.now() - t,
        doneIleBitti: ham.trimEnd().endsWith('data: [DONE]'),
        yalnizBoslukYok: !icerikler.some((c) => c.length > 0 && !c.trim()),
        icerik: icerikler.join(''),
      }
    }
  }
  if (q.get('ajan') === '1') {
    const anahtar = String(process.env.ELEVENLABS_API_KEY || '').trim()
    const ajanlar = [...new Set(Object.values(TEK_BEYIN_AJANLARI))]
    cevap.ajan = anahtar
      ? await Promise.all(ajanlar.map(async (a) => ({ ajan: a, ...(await sesAjaniniSabitle(a, anahtar, { dil: 'tr', anahtarKelimeler: SES_TEMEL_ANAHTARLAR_TR, ozelLlm: true })) })))
      : 'anahtar_yok'
  }
  return NextResponse.json(cevap, { headers: { 'Cache-Control': 'no-store' } })
}
