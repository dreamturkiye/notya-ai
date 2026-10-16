'use client'
/**
 * NOTYA-HASTA-ILETISIMI-01 — Ayarlar › İletişim, "SMS (Hasta İletişimi)" card. Doctor-only
 * (backend: sadeceDoktor). NOT Twilio — see lib/iletisim/sms/README.md. The doctor installs
 * android-sms-gateway (github.com/capcom6/android-sms-gateway, free, open source) on their OWN
 * phone and pastes the address/login it shows here.
 */
import React, { useEffect, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { getDoctorAccessToken } from '@/lib/doktor/clientAuth'

const R = CHROME_RENK
const kutu: React.CSSProperties = { background: '#FFFFFF', border: `1px solid ${R.border}`, borderRadius: 16, padding: '18px 18px 20px', boxShadow: '0 8px 18px rgba(58,44,34,0.045)', marginBottom: 14 }
const etiket: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: R.ink, marginBottom: 6 }
const giris: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#FFFFFF', border: `1px solid ${R.border}`, color: R.ink, borderRadius: 10, padding: '11px 12px', fontSize: 15, fontFamily: CHROME_FONT.sans }

export default function SmsAyarKarti() {
  const [gorunur, setGorunur] = useState(false)
  const [tabanUrl, setTabanUrl] = useState('')
  const [kullaniciAdi, setKullaniciAdi] = useState('')
  const [sifre, setSifre] = useState('')
  const [sifreVar, setSifreVar] = useState(false)
  const [aktif, setAktif] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookSirri, setWebhookSirri] = useState('')
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [mesaj, setMesaj] = useState('')
  const [hata, setHata] = useState('')

  const baslik = () => {
    const t = getDoctorAccessToken()
    return t ? { Authorization: `Bearer ${t}` } : undefined
  }

  useEffect(() => {
    void (async () => {
      const h = baslik()
      if (!h) return
      try {
        const r = await fetch('/api/doktor/iletisim/toplu/sms-ayarlari', { headers: h })
        if (r.status === 403) return // sekreter — bu kart hekim-only
        setGorunur(true)
        const d = await r.json()
        if (d?.ayar) {
          setTabanUrl(d.ayar.tabanUrl || ''); setKullaniciAdi(d.ayar.kullaniciAdi || '')
          setAktif(!!d.ayar.aktif); setSifreVar(!!d.ayar.sifreVar)
        }
      } catch { /* fail soft */ }
    })()
  }, [])

  const kaydet = async (test: boolean) => {
    const h = baslik()
    if (!h) return
    setKaydediliyor(true); setHata(''); setMesaj('')
    try {
      const r = await fetch('/api/doktor/iletisim/toplu/sms-ayarlari', {
        method: 'POST',
        headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabanUrl, kullaniciAdi, sifre: sifre || null, aktif, test }),
      })
      const d = await r.json()
      if (!r.ok) { setHata(d?.error || 'Kaydedilemedi.'); return }
      setSifre(''); setSifreVar(true)
      if (d.webhookUrl) setWebhookUrl(d.webhookUrl)
      if (d.webhookSirriYeni) setWebhookSirri(d.webhookSirriYeni)
      setMesaj(test ? (d.baglantiTest?.ok ? 'Kaydedildi — bağlantı başarılı.' : `Kaydedildi — bağlantı testi: ${d.baglantiTest?.hata || 'başarısız'}`) : 'Kaydedildi.')
    } catch {
      setHata('Bağlantı hatası.')
    } finally {
      setKaydediliyor(false)
    }
  }

  if (!gorunur) return null

  return (
    <div style={kutu}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>SMS (Hasta İletişimi — toplu mesaj)</div>
      <div style={{ fontSize: 13.5, color: R.muted, lineHeight: 1.5, marginBottom: 14 }}>
        SMS, Twilio gibi ücretli bir servisten değil, <b>kendi telefon numaranızdan</b> gider.
        Telefonunuza (Android) ücretsiz, açık kaynak <b>android-sms-gateway</b> uygulamasını kurun;
        uygulamanın gösterdiği adresi, kullanıcı adını ve şifreyi buraya yazın. Bağlamazsanız,
        toplu gönderimde Notya size SMS listesini kopyalayıp telefonunuzdan elle göndermeniz için hazırlar.
      </div>

      <label style={etiket} htmlFor="sms-url">Gateway adresi</label>
      <input id="sms-url" style={giris} placeholder="http://192.168.1.5:8080" value={tabanUrl} onChange={(e) => setTabanUrl(e.target.value)} />
      <div style={{ height: 10 }} />
      <label style={etiket} htmlFor="sms-kullanici">Kullanıcı adı</label>
      <input id="sms-kullanici" style={giris} value={kullaniciAdi} onChange={(e) => setKullaniciAdi(e.target.value)} />
      <div style={{ height: 10 }} />
      <label style={etiket} htmlFor="sms-sifre">Şifre {sifreVar && <span style={{ color: R.muted, fontWeight: 400 }}>(kayıtlı — değiştirmek için yazın)</span>}</label>
      <input id="sms-sifre" style={giris} type="password" value={sifre} onChange={(e) => setSifre(e.target.value)} />
      <div style={{ height: 12 }} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
        <input type="checkbox" checked={aktif} onChange={(e) => setAktif(e.target.checked)} /> Etkin
      </label>

      {webhookUrl && (
        <div style={{ marginTop: 14, fontSize: 13, color: R.ink, background: R.cream, borderRadius: 10, padding: 12 }}>
          DUR/STOP yanıtlarını işlemek için gateway uygulamasına bu webhook adresini ve gizli anahtarı (header: <code>X-Notya-Webhook-Secret</code>) ekleyin — bir kere gösterilir:
          <div style={{ marginTop: 6, wordBreak: 'break-all' }}><b>URL:</b> {webhookUrl}</div>
          <div style={{ wordBreak: 'break-all' }}><b>Gizli anahtar:</b> {webhookSirri}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button type="button" disabled={kaydediliyor} onClick={() => void kaydet(false)} style={{ flex: 1, minHeight: 46, borderRadius: 12, border: 'none', background: R.pine, color: R.paper, fontWeight: 700, cursor: 'pointer' }}>
          {kaydediliyor ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        <button type="button" disabled={kaydediliyor} onClick={() => void kaydet(true)} style={{ flex: 1, minHeight: 46, borderRadius: 12, border: `1.5px solid ${R.pine}`, background: '#FFFFFF', color: R.pine, fontWeight: 700, cursor: 'pointer' }}>
          Kaydet ve bağlantıyı test et
        </button>
      </div>
      {mesaj && <div style={{ color: R.pine, fontSize: 14, marginTop: 10, fontWeight: 600 }}>{mesaj}</div>}
      {hata && <div style={{ color: R.warn, fontSize: 14, marginTop: 10 }}>{hata}</div>}
    </div>
  )
}
