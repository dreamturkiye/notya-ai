'use client'

/**
 * WHATSAPP-API-01 — guided WhatsApp setup for doctors who have never touched a Meta account: what to have ready,
 * numbered steps, what to do while Meta's window is open, the KVKK / sub-processor consent and a small assistant
 * ("Meta hesabı nedir?" …). Plain Turkish, no provider jargon. Same look as the rest of the card (CHROME_RENK/FONT).
 * The assistant answers from the built-in FAQ instantly; free questions go to /api/iletisim/whatsapp/yardim.
 */
import React, { useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { KVKK_ONAY_KISA, KVKK_ONAY_METNI } from '@/lib/iletisim/whatsapp/kvkk'
import { DESTEK_NOTU, SSS, sssBul } from '@/lib/iletisim/whatsapp/yardim'
import { waIstek } from '@/lib/iletisim/whatsapp/istemci'

export const HAZIRLIK_MADDELERI = [
  'SMS ya da sesli arama alabilen bir cep numarası (sabit hat çalışmaz).',
  'Telefonunuzda ücretsiz WhatsApp Business uygulaması. Normal WhatsApp kullanıyorsanız önce ona geçin; sohbetleriniz ve numaranız aynen kalır, hem uygulamayı hem Notya’yı aynı numarada birlikte kullanırsınız.',
  'Bir Facebook hesabı (yoksa açılan pencerede oluşturabilirsiniz). Profiliniz hastalarınıza görünmez.',
]

export const ADIMLAR = [
  'Aşağıdaki KVKK onayını işaretleyin.',
  '“WhatsApp’ı bağla”ya dokunun; Meta’nın penceresi açılır.',
  'Facebook hesabınızla giriş yapın ve “mevcut WhatsApp Business uygulamamı bağla” seçeneğini seçin.',
  'Numaranızı seçin. Telefonunuza SMS, sesli arama ya da uygulamada bir kod gelir; kodu pencereye girin.',
  '“Bitir”e dokunun. Pencere kendiliğinden kapanır ve bu kart “bağlı” olur. Toplam yaklaşık 2 dakika.',
]

export const PENCERE_ACIKKEN = 'Pencere açıkken sırayla: Meta girişi → numaranızı seçin → gelen kodu girin → Bitir. Pencere kapanırsa tekrar dokunun; hiçbir şey silinmez.'

const yazi: React.CSSProperties = { fontSize: 14, lineHeight: 1.5, color: CHROME_RENK.ink }
const baslik: React.CSSProperties = { margin: '14px 0 6px', fontSize: 13, fontWeight: 700, letterSpacing: 0.2, color: CHROME_RENK.pine }
const cip: React.CSSProperties = {
  minHeight: 44, padding: '8px 12px', borderRadius: 999, border: `1px solid ${CHROME_RENK.border}`, background: CHROME_RENK.cream,
  color: CHROME_RENK.ink, fontSize: 14, fontFamily: CHROME_FONT.sans, cursor: 'pointer', textAlign: 'left',
}

export default function WhatsAppRehber(props: { onay: boolean; onOnay: (v: boolean) => void; mesgul?: boolean }) {
  const [cevap, setCevap] = useState<string | null>(null)
  const [soru, setSoru] = useState('')
  const [bekle, setBekle] = useState(false)
  const [acik, setAcik] = useState(false)

  const sor = async (metin: string) => {
    const t = metin.trim()
    if (!t) return
    const yerel = sssBul(t)
    if (yerel) { setCevap(yerel.cevap); return }
    setBekle(true)
    try {
      const r = await waIstek('/api/iletisim/whatsapp/yardim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ soru: t }) })
      const j = r ? await r.json().catch(() => null) : null
      setCevap(r?.ok && j?.cevap ? String(j.cevap) : `Şu an yanıt alınamadı. ${DESTEK_NOTU}`)
    } catch {
      setCevap(`Şu an yanıt alınamadı. ${DESTEK_NOTU}`)
    }
    setBekle(false)
  }

  return (
    <div data-whatsapp-rehber style={{ fontFamily: CHROME_FONT.sans }}>
      <div style={baslik}>Başlamadan önce hazır olsun</div>
      <ul style={{ margin: 0, paddingLeft: 20, ...yazi }}>
        {HAZIRLIK_MADDELERI.map((m) => <li key={m} style={{ marginBottom: 4 }}>{m}</li>)}
      </ul>

      <div style={baslik}>Adım adım</div>
      <ol style={{ margin: 0, paddingLeft: 22, ...yazi }}>
        {ADIMLAR.map((a) => <li key={a} style={{ marginBottom: 4 }}>{a}</li>)}
      </ol>
      {props.mesgul && (
        <p role="status" style={{ margin: '10px 0 0', padding: '10px 12px', borderRadius: 10, background: CHROME_RENK.cream, ...yazi }}>
          {PENCERE_ACIKKEN}
        </p>
      )}

      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '16px 0 0', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={props.onay}
          onChange={(e) => props.onOnay(e.target.checked)}
          style={{ width: 22, height: 22, marginTop: 1, flexShrink: 0, accentColor: CHROME_RENK.pine }}
        />
        <span style={{ ...yazi, fontSize: 13 }}>
          {KVKK_ONAY_METNI}{' '}
          <a href="/kvkk" target="_blank" rel="noreferrer" style={{ color: CHROME_RENK.pine }}>{KVKK_ONAY_KISA}</a>
        </span>
      </label>

      <button
        type="button"
        onClick={() => setAcik(!acik)}
        aria-expanded={acik}
        style={{ marginTop: 14, minHeight: 44, border: 'none', background: 'transparent', padding: '10px 0', color: CHROME_RENK.pine, fontWeight: 600, fontSize: 14, fontFamily: CHROME_FONT.sans, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}
      >
        {acik ? 'Yardımı kapat' : 'Takıldınız mı? Sorun, yardımcı yanıtlasın'}
      </button>
      {acik && (
        <div data-whatsapp-yardim style={{ marginTop: 6 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SSS.slice(0, 6).map((m) => (
              <button key={m.id} type="button" style={cip} onClick={() => setCevap(m.cevap)}>{m.soru}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); void sor(soru) }} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              value={soru}
              onChange={(e) => setSoru(e.target.value)}
              placeholder="Sorunuzu yazın…"
              maxLength={300}
              aria-label="Yardım sorusu"
              style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 10, padding: '11px 12px', fontSize: 16, fontFamily: CHROME_FONT.sans, background: '#fff', color: CHROME_RENK.ink }}
            />
            <button type="submit" disabled={bekle || !soru.trim()} style={{ minHeight: 44, padding: '0 16px', borderRadius: 10, border: 'none', background: CHROME_RENK.pine, color: CHROME_RENK.cream, fontWeight: 600, fontFamily: CHROME_FONT.sans, cursor: 'pointer', opacity: bekle || !soru.trim() ? 0.6 : 1 }}>
              {bekle ? '…' : 'Sor'}
            </button>
          </form>
          {cevap && <p role="status" style={{ margin: '10px 0 0', padding: '12px 14px', borderRadius: 12, background: CHROME_RENK.cream, ...yazi }}>{cevap}</p>}
        </div>
      )}
    </div>
  )
}
