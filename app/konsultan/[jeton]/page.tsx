'use client'
/**
 * KONSULTASYONLAR-01 — konsültan portalı. Hesap / şifre / kayıt yok.
 * Tek sayfa: isteyen hekim, hasta, soru, özgeçmiş, rapor, belge. Gönder tek birincil düğme.
 * Görünüm: chromeTheme cream / pine / Fraunces — koyu lacivert yok.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CHROME_BG_IMAGE, CHROME_FONT, CHROME_FONT_HREF, CHROME_RENK } from '@/lib/doktor/chromeTheme'

type Dilim = {
  brans: string
  hekimAdi: string
  hastaAdi: string
  soru: string
  ozgecmis: string | null
  onayliCumleler: string[]
  istemTarihi: string
  beklenenGun: string | null
}

const KABUL = '.jpg,.jpeg,.png,.webp,.heic,.heif,.gif,.tiff,.tif,.pdf,.mp3,.m4a,.wav,.mp4,.mov,.webm,.dcm'

async function dosyaBase64(f: File): Promise<{ ad: string; mime: string; base64: string }> {
  const buf = await f.arrayBuffer()
  let binary = ''
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return { ad: f.name, mime: f.type || 'application/octet-stream', base64: btoa(binary) }
}

export default function KonsultanPortalSayfasi() {
  const params = useParams()
  const jeton = String(params?.jeton || '')
  const [dilim, setDilim] = useState<Dilim | null>(null)
  const [hata, setHata] = useState('')
  const [notHata, setNotHata] = useState('')
  const [belgeHata, setBelgeHata] = useState('')
  const [not, setNot] = useState('')
  const [dosyalar, setDosyalar] = useState<File[]>([])
  const [mesgul, setMesgul] = useState(false)
  const [sonuc, setSonuc] = useState('')
  const [davet, setDavet] = useState('')

  useEffect(() => {
    if (!jeton) return
    fetch(`/api/konsultan?t=${encodeURIComponent(jeton)}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}))
        if (!r.ok) { setHata(j.error || 'Bağlantı açılamadı.'); return }
        setDilim(j.dilim)
        setDavet(j.davet || '')
        if (j.gonderildi) setSonuc('Bu istem için daha önce rapor bırakılmış. Yeni belge ekleyebilirsiniz.')
        if (j.kapali) setHata('Bu konsültasyon kapatılmış.')
      })
      .catch(() => setHata('Bağlantı açılamadı.'))
  }, [jeton])

  const gonder = useCallback(async () => {
    setNotHata('')
    setBelgeHata('')
    if (not.trim().length < 3) { setNotHata('Kısa bir klinik not yazın — ör. "İşitme kaybı saptanmadı."'); return }
    if (!dosyalar.length) { setBelgeHata('En az bir belge yükleyin (JPEG, PDF veya kısa video).'); return }
    setMesgul(true)
    try {
      const packed = await Promise.all(dosyalar.map(dosyaBase64))
      const r = await fetch('/api/konsultan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ t: jeton, not, dosyalar: packed }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        const m = j.error || 'Gönderilemedi.'
        if (/belge|dosya|tür|MB/i.test(m)) setBelgeHata(m)
        else if (/not/i.test(m)) setNotHata(m)
        else setHata(m)
        return
      }
      setSonuc(j.mesaj || 'Teşekkürler — rapor isteyen hekime iletildi.')
      if (j.davet) setDavet(j.davet)
      setDosyalar([])
    } catch {
      setHata('Gönderilemedi — bağlantıyı kontrol edin.')
    } finally {
      setMesgul(false)
    }
  }, [jeton, not, dosyalar])

  return (
    <>
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <div
        style={{
          minHeight: '100vh',
          fontFamily: CHROME_FONT.sans,
          color: CHROME_RENK.ink,
          backgroundColor: CHROME_RENK.cream,
          backgroundImage: `linear-gradient(165deg, ${CHROME_RENK.cream} 0%, ${CHROME_RENK.paper} 55%, #ebe4d6 100%), url(${CHROME_BG_IMAGE})`,
          backgroundSize: 'cover',
          backgroundBlendMode: 'soft-light',
          padding: '28px 16px 48px',
        }}
      >
        <main
          style={{
            maxWidth: 560,
            margin: '0 auto',
            background: CHROME_RENK.paper,
            border: `1px solid ${CHROME_RENK.border}`,
            borderRadius: 16,
            padding: '28px 24px 32px',
            boxShadow: '0 1px 0 rgba(58,44,34,0.04)',
          }}
        >
          <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 28, fontWeight: 560, color: CHROME_RENK.pine, marginBottom: 6 }}>
            Konsültasyon
          </div>
          <p style={{ margin: '0 0 22px', fontSize: 14, color: CHROME_RENK.muted, lineHeight: 1.45 }}>
            Hesap veya şifre gerekmez. Raporunuzu buraya bırakın — isteyen hekime iletilir.
          </p>

          {hata && !dilim && (
            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(164,91,62,0.08)', color: CHROME_RENK.warn, fontSize: 14 }}>
              {hata}
            </div>
          )}

          {dilim && (
            <>
              <section style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', color: CHROME_RENK.muted, marginBottom: 6 }}>İsteyen hekim</div>
                <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 20, color: CHROME_RENK.ink }}>{dilim.hekimAdi}</div>
                <div style={{ fontSize: 14, color: CHROME_RENK.muted, marginTop: 4 }}>{dilim.brans} · istem {dilim.istemTarihi}{dilim.beklenenGun ? ` · beklenen ${dilim.beklenenGun}` : ''}</div>
              </section>

              <section style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', color: CHROME_RENK.muted, marginBottom: 6 }}>Hasta</div>
                <div style={{ fontSize: 17, fontWeight: 600 }}>{dilim.hastaAdi}</div>
              </section>

              <section style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', color: CHROME_RENK.muted, marginBottom: 6 }}>Klinik soru</div>
                <div style={{ fontSize: 16, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{dilim.soru}</div>
              </section>

              {dilim.ozgecmis && (
                <section style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', color: CHROME_RENK.muted, marginBottom: 6 }}>Kısa özgeçmiş</div>
                  <div style={{ fontSize: 15, lineHeight: 1.5, color: CHROME_RENK.ink }}>{dilim.ozgecmis}</div>
                </section>
              )}

              {!!dilim.onayliCumleler?.length && (
                <section style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', color: CHROME_RENK.muted, marginBottom: 6 }}>Onaylı not cümleleri</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.5 }}>
                    {dilim.onayliCumleler.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </section>
              )}

              {!sonuc.includes('iletildi') && (
                <>
                  <label style={{ display: 'block', marginBottom: 16 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: CHROME_RENK.ink }}>Rapor / notunuz</span>
                    <textarea
                      value={not}
                      onChange={(e) => setNot(e.target.value)}
                      rows={4}
                      maxLength={2000}
                      placeholder="Ör. İşitme kaybı saptanmadı. Saf ses odyogramı ektedir."
                      style={{
                        display: 'block',
                        width: '100%',
                        marginTop: 6,
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: `1px solid ${notHata ? CHROME_RENK.warn : CHROME_RENK.border}`,
                        background: CHROME_RENK.cream,
                        fontFamily: CHROME_FONT.sans,
                        fontSize: 15,
                        color: CHROME_RENK.ink,
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                    />
                    {notHata && <div style={{ fontSize: 13, color: CHROME_RENK.warn, marginTop: 4 }}>{notHata}</div>}
                  </label>

                  <label style={{ display: 'block', marginBottom: 20 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: CHROME_RENK.ink }}>Belge (JPEG, PDF, kısa video…)</span>
                    <input
                      type="file"
                      accept={KABUL}
                      multiple
                      onChange={(e) => setDosyalar(Array.from(e.target.files || []).slice(0, 5))}
                      style={{ display: 'block', marginTop: 8, fontSize: 14 }}
                    />
                    {!!dosyalar.length && (
                      <div style={{ fontSize: 13, color: CHROME_RENK.muted, marginTop: 6 }}>
                        {dosyalar.map((f) => f.name).join(', ')}
                      </div>
                    )}
                    {belgeHata && <div style={{ fontSize: 13, color: CHROME_RENK.warn, marginTop: 4 }}>{belgeHata}</div>}
                  </label>

                  <button
                    type="button"
                    onClick={gonder}
                    disabled={mesgul || !!hata}
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      borderRadius: 12,
                      border: 'none',
                      background: CHROME_RENK.pine,
                      color: CHROME_RENK.cream,
                      fontFamily: CHROME_FONT.sans,
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: mesgul ? 'wait' : 'pointer',
                      opacity: mesgul ? 0.7 : 1,
                    }}
                  >
                    {mesgul ? 'Gönderiliyor…' : 'Gönder'}
                  </button>
                </>
              )}

              {sonuc && (
                <div style={{ marginTop: 18, padding: 14, borderRadius: 10, background: 'rgba(47,67,52,0.08)', color: CHROME_RENK.pine, fontSize: 15, lineHeight: 1.45 }} aria-live="polite">
                  {sonuc}
                  {davet && sonuc.includes('iletildi') && (
                    <div style={{ marginTop: 10, fontSize: 13, color: CHROME_RENK.muted }}>{davet}</div>
                  )}
                </div>
              )}
              {hata && dilim && (
                <div style={{ marginTop: 12, fontSize: 13, color: CHROME_RENK.warn }}>{hata}</div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  )
}
