'use client'
/**
 * NOTYA-ILETISIM-01 — Ayarlar › İletişim card. Everything is pre-filled from the profile; nothing has
 * to be set up before the first send. The doctor can correct their own WhatsApp number / email, pick
 * where emails open on this device, and send themselves a test. The automatic-sending rows come only
 * from OtomatikSlotlari (jobs B and C replace that file alone).
 */
import React, { useEffect, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { EPOSTA_ACILIS_ETIKETI, epostaLinki, whatsappLinki } from '@/lib/iletisim/baglantilar'
import { baglantiyiAc, cihazEpostaAcilisi, cihazEpostaAcilisiniKaydet, iletisimIstek } from '@/lib/iletisim/istemci'
import type { EpostaAcilis } from '@/lib/iletisim/tipler'
import OtomatikSlotlari from './OtomatikSlotlari'

const R = CHROME_RENK
const DENEME_METNI = 'Merhaba, bu bir Notya deneme mesajıdır. Hastalarınıza giden mesajlar da böyle, sizin hesabınızdan açılacak.'

const kutu: React.CSSProperties = { background: '#FFFFFF', border: `1px solid ${R.border}`, borderRadius: 16, padding: '18px 18px 20px', boxShadow: '0 8px 18px rgba(58,44,34,0.045)', marginBottom: 14 }
const etiket: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: R.ink, marginBottom: 6 }
const giris: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#FFFFFF', border: `1px solid ${R.border}`, color: R.ink, borderRadius: 10, padding: '11px 12px', fontSize: 16, fontFamily: CHROME_FONT.sans }
const sessiz: React.CSSProperties = { background: 'none', border: 'none', padding: '6px 0', color: R.pine, fontSize: 14, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }

export default function IletisimAyarKarti() {
  const [whatsapp, setWhatsapp] = useState('')
  const [muayenehane, setMuayenehane] = useState('')
  const [muayenehaneBagli, setMuayenehaneBagli] = useState(false)
  const [muayenehaneTelefon, setMuayenehaneTelefon] = useState('')
  const [varsayilanTelefon, setVarsayilanTelefon] = useState('')
  const [varsayilanOzel, setVarsayilanOzel] = useState(false)
  const [eposta, setEposta] = useState('')
  const [acilis, setAcilis] = useState<EpostaAcilis>('uygulama')
  const [yuklendi, setYuklendi] = useState(false)
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [mesaj, setMesaj] = useState('')
  const [hata, setHata] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const j = await iletisimIstek<{
          whatsapp: string
          eposta: string
          epostaAcilis: EpostaAcilis
          muayenehane?: string
          muayenehaneBagli?: boolean
          muayenehaneTelefon?: string
          varsayilanTelefon?: string | null
          gorunenTelefon?: string
        }>('/api/doktor/iletisim/ayarlar')
        setWhatsapp(j.whatsapp || '')
        setMuayenehane(j.muayenehane || '')
        setMuayenehaneBagli(Boolean(j.muayenehaneBagli))
        const ofis = String(j.muayenehaneTelefon || '').trim()
        const ozel = j.varsayilanTelefon != null && String(j.varsayilanTelefon).trim() !== ''
          ? String(j.varsayilanTelefon).trim()
          : ''
        setMuayenehaneTelefon(ofis)
        setVarsayilanOzel(Boolean(ozel))
        setVarsayilanTelefon(ozel || ofis || String(j.gorunenTelefon || '').trim())
        setEposta(j.eposta || '')
        setAcilis(cihazEpostaAcilisi() || j.epostaAcilis || 'uygulama')
      } catch (e) {
        setHata(e instanceof Error ? e.message : 'Ayarlar alınamadı.')
      } finally {
        setYuklendi(true)
      }
    })()
  }, [])

  const acilisSec = (a: EpostaAcilis) => {
    setAcilis(a)
    cihazEpostaAcilisiniKaydet(a) // this device, immediately
    setMesaj('')
  }

  const ofisYaz = (ham: string) => {
    setMuayenehaneTelefon(ham)
    // Ofis varsayılanı izliyorsa görünen alan ofisle birlikte yürür.
    if (!varsayilanOzel) setVarsayilanTelefon(ham)
  }

  const varsayilanYaz = (ham: string) => {
    setVarsayilanTelefon(ham)
    const ofis = muayenehaneTelefon.trim()
    setVarsayilanOzel(ham.trim() !== '' && ham.trim() !== ofis)
  }

  const kaydet = async () => {
    setKaydediliyor(true); setHata(''); setMesaj('')
    try {
      await iletisimIstek('/api/doktor/iletisim/ayarlar', {
        method: 'PUT',
        govde: {
          whatsapp,
          eposta,
          epostaAcilis: acilis,
          muayenehane,
          muayenehaneTelefon,
          // Ofisle aynıysa sunucu NULL yazar → ofisi izlemeye devam.
          varsayilanTelefon: varsayilanOzel ? varsayilanTelefon : muayenehaneTelefon,
        },
      })
      setMesaj('Kaydedildi.')
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Kaydedilemedi.')
    } finally {
      setKaydediliyor(false)
    }
  }

  // Synchronous: opens straight from the tap (iOS Safari).
  const denemeWhatsapp = () => {
    const link = whatsappLinki(whatsapp, DENEME_METNI)
    if (!link) { setHata('WhatsApp numarası anlaşılamadı. Örnek: 0532 123 45 67'); return }
    setHata(''); baglantiyiAc(link)
  }
  const denemeEposta = () => {
    const link = epostaLinki(eposta, 'Notya deneme mesajı', DENEME_METNI, acilis)
    if (!link) { setHata('E-posta adresi anlaşılamadı.'); return }
    setHata(''); baglantiyiAc(link)
  }

  return (
    <div style={{ maxWidth: 640, fontFamily: CHROME_FONT.sans, color: R.ink }}>
      <div style={kutu}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Hastalarınıza kendi hesaplarınızdan yazın</div>
        <div style={{ fontSize: 14, color: R.muted, lineHeight: 1.5, marginBottom: 18 }}>
          Notya mesajı hazırlar; mesaj sizin WhatsApp’ınızda ya da e-postanızda açılır, siz gönderirsiniz. Sekreteriniz kendi
          cihazından gönderdiğinde mesaj o cihazdaki WhatsApp ve e-postadan gider.
        </div>

        <label style={etiket} htmlFor="iletisim-whatsapp">WhatsApp numaranız</label>
        <input id="iletisim-whatsapp" style={giris} inputMode="tel" autoComplete="tel" placeholder="0532 123 45 67" value={whatsapp} disabled={!yuklendi} onChange={(e) => setWhatsapp(e.target.value)} />
        <button type="button" style={sessiz} onClick={denemeWhatsapp}>Kendime deneme gönder</button>

        <div style={{ height: 16 }} />
        <label style={etiket} htmlFor="iletisim-ofis-telefon">Muayenehane telefonu</label>
        <div style={{ fontSize: 14, color: R.muted, lineHeight: 1.5, marginBottom: 8 }}>
          Ofis / sabit hat veya cep. Hastalar ve konsültan meslektaşlarınız bu numarayı görür — siz ayrı bir varsayılan seçmedikçe.
        </div>
        <input
          id="iletisim-ofis-telefon"
          style={giris}
          inputMode="tel"
          autoComplete="tel"
          placeholder="0216 123 45 67"
          value={muayenehaneTelefon}
          disabled={!yuklendi}
          onChange={(e) => ofisYaz(e.target.value)}
        />

        <div style={{ height: 14 }} />
        <label style={etiket} htmlFor="iletisim-varsayilan-telefon">Varsayılan telefon (görünen)</label>
        <div style={{ fontSize: 14, color: R.muted, lineHeight: 1.5, marginBottom: 8 }}>
          {varsayilanOzel
            ? 'Şu an ofisten farklı bir numara gösteriyorsunuz. Ofis telefonuna dönmek için aynı numarayı yazın veya ofis alanını güncelleyin.'
            : 'Muayenehane telefonu yazıldığında burası da onu izler. Farklı bir numara göstermek isterseniz değiştirin.'}
        </div>
        <input
          id="iletisim-varsayilan-telefon"
          style={giris}
          inputMode="tel"
          autoComplete="tel"
          placeholder="0216 123 45 67"
          value={varsayilanTelefon}
          disabled={!yuklendi}
          onChange={(e) => varsayilanYaz(e.target.value)}
        />

        <div style={{ height: 16 }} />
        <label style={etiket} htmlFor="iletisim-muayenehane">Muayenehane WhatsApp hattı (varsa)</label>
        <div style={{ fontSize: 14, color: R.muted, lineHeight: 1.5, marginBottom: 8 }}>
          Muayenehanede ayrı bir WhatsApp hattınız var mı? Numarayı yazın, aşağıdan bağlayın. Hastalar o hatta yazacak; kişisel telefon sessizde kalabilir.
          WhatsApp Business gerekir. Yalnızca yazmak bağlantı değildir.
        </div>
        <input id="iletisim-muayenehane" style={giris} inputMode="tel" autoComplete="tel" placeholder="0532 123 45 67" value={muayenehane} disabled={!yuklendi} onChange={(e) => { setMuayenehane(e.target.value); setMuayenehaneBagli(false) }} />
        {muayenehaneBagli && <div style={{ fontSize: 13, color: R.pine, marginTop: 6, fontWeight: 600 }}>Bu numara bağlı hatla aynı.</div>}

        <div style={{ height: 12 }} />
        <label style={etiket} htmlFor="iletisim-eposta">E-posta adresiniz</label>
        <input id="iletisim-eposta" style={giris} type="email" inputMode="email" autoComplete="email" placeholder="ornek@klinik.com" value={eposta} disabled={!yuklendi} onChange={(e) => setEposta(e.target.value)} />
        <button type="button" style={sessiz} onClick={denemeEposta}>Kendime deneme gönder</button>

        <div style={{ height: 14 }} />
        <div style={etiket}>E-postalar nerede açılsın?</div>
        <div role="radiogroup" aria-label="E-postalar nerede açılsın?" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(['uygulama', 'gmail', 'outlook'] as EpostaAcilis[]).map((a) => {
            const secili = acilis === a
            return (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={secili}
                onClick={() => acilisSec(a)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, minHeight: 46, padding: '0 14px', borderRadius: 12, cursor: 'pointer',
                  border: `1.5px solid ${secili ? R.pine : R.border}`, background: secili ? R.cream : '#FFFFFF', color: R.ink,
                  fontSize: 15, fontWeight: secili ? 700 : 500, textAlign: 'left', fontFamily: CHROME_FONT.sans,
                }}
              >
                <span aria-hidden style={{ width: 16, height: 16, borderRadius: 999, border: `2px solid ${secili ? R.pine : '#C9BEA9'}`, background: secili ? R.pine : 'transparent', boxShadow: secili ? `inset 0 0 0 3px ${R.cream}` : 'none', flexShrink: 0 }} />
                {EPOSTA_ACILIS_ETIKETI[a]}
              </button>
            )
          })}
        </div>
        <div style={{ fontSize: 12, color: R.muted, marginTop: 6 }}>Bu seçim bu cihaz için geçerlidir.</div>

        <button
          type="button"
          onClick={() => void kaydet()}
          disabled={!yuklendi || kaydediliyor}
          style={{ marginTop: 18, width: '100%', minHeight: 50, borderRadius: 14, border: 'none', background: R.pine, color: R.paper, fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: !yuklendi || kaydediliyor ? 0.6 : 1 }}
        >
          {kaydediliyor ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        {mesaj && <div style={{ color: R.pine, fontSize: 14, marginTop: 10, fontWeight: 600 }}>{mesaj}</div>}
        {hata && <div style={{ color: R.warn, fontSize: 14, marginTop: 10 }}>{hata}</div>}
      </div>

      <div style={kutu}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Otomatik gönderim</div>
        <OtomatikSlotlari />
      </div>
    </div>
  )
}
