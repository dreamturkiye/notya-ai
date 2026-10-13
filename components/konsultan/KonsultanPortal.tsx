'use client'
/**
 * KONSULTASYONLAR-01 — konsültan portalı yüzü (hesap yok).
 * İlk viewport: Notya markası + tek başlık + kısa cümle + dominant görsel.
 * Altında istem özeti ve rapor formu. Demo ve canlı jeton aynı bileşeni kullanır.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { CHROME_BG_IMAGE, CHROME_FONT, CHROME_FONT_HREF, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import type { KonsultanDilim } from '@/lib/doktor/konsultanPortal'
import { telefonHref } from '@/lib/portal/hekimKarti'

const KABUL = '.jpg,.jpeg,.png,.webp,.heic,.heif,.gif,.tiff,.tif,.pdf,.mp3,.m4a,.wav,.mp4,.mov,.webm,.dcm'

async function dosyaBase64(f: File): Promise<{ ad: string; mime: string; base64: string }> {
  const buf = await f.arrayBuffer()
  let binary = ''
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return { ad: f.name, mime: f.type || 'application/octet-stream', base64: btoa(binary) }
}

export type KonsultanPortalProps = {
  jeton: string
  /** Verilirse API çağrılmaz — demo / önizleme. */
  baslangicDilim?: KonsultanDilim | null
  demoMu?: boolean
}

export default function KonsultanPortal({ jeton, baslangicDilim = null, demoMu = false }: KonsultanPortalProps) {
  const [dilim, setDilim] = useState<KonsultanDilim | null>(baslangicDilim)
  const [yukleniyor, setYukleniyor] = useState(!baslangicDilim && !!jeton)
  const [hata, setHata] = useState('')
  const [notHata, setNotHata] = useState('')
  const [belgeHata, setBelgeHata] = useState('')
  const [not, setNot] = useState('')
  const [dosyalar, setDosyalar] = useState<File[]>([])
  const [mesgul, setMesgul] = useState(false)
  const [sonuc, setSonuc] = useState('')
  const [davet, setDavet] = useState('')

  useEffect(() => {
    if (baslangicDilim) {
      setDilim(baslangicDilim)
      setYukleniyor(false)
      return
    }
    if (!jeton || demoMu) return
    setYukleniyor(true)
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
      .finally(() => setYukleniyor(false))
  }, [jeton, baslangicDilim, demoMu])

  const gonder = useCallback(async () => {
    setNotHata('')
    setBelgeHata('')
    if (not.trim().length < 3) { setNotHata('Kısa bir klinik not yazın — ör. "İşitme kaybı saptanmadı."'); return }
    if (!dosyalar.length) { setBelgeHata('En az bir belge yükleyin (JPEG, PDF veya kısa video).'); return }
    if (demoMu) {
      setSonuc('Demo önizleme — gerçek gönderim yok. Canlı linkte rapor isteyen hekime iletilir.')
      setDosyalar([])
      return
    }
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
      setSonuc(j.mesaj || 'Teşekkürler — rapor isteyen hekime iletilir.')
      if (j.davet) setDavet(j.davet)
      setDosyalar([])
    } catch {
      setHata('Gönderilemedi — bağlantıyı kontrol edin.')
    } finally {
      setMesgul(false)
    }
  }, [jeton, not, dosyalar, demoMu])

  const formaKaydir = () => {
    document.getElementById('konsultan-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <style>{`
        @keyframes kp-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes kp-veil { from { opacity: 0.35; } to { opacity: 1; } }
        .kp-rise { animation: kp-rise 0.7s ease-out both; }
        .kp-rise-2 { animation: kp-rise 0.75s ease-out 0.12s both; }
        .kp-rise-3 { animation: kp-rise 0.8s ease-out 0.22s both; }
        .kp-hero-veil { animation: kp-veil 1.1s ease-out both; }
        .kp-cta:hover { filter: brightness(1.06); transform: translateY(-1px); }
        .kp-cta { transition: transform 0.18s ease, filter 0.18s ease; }
        .kp-focus:focus-visible { outline: 2px solid ${CHROME_RENK.pine}; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) {
          .kp-rise, .kp-rise-2, .kp-rise-3, .kp-hero-veil { animation: none; }
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          fontFamily: CHROME_FONT.sans,
          color: CHROME_RENK.ink,
          background: CHROME_RENK.cream,
        }}
      >
        {/* ── İlk viewport: marka + tek başlık + kısa cümle + dominant görsel ── */}
        <header
          style={{
            position: 'relative',
            minHeight: 'min(92vh, 720px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            overflow: 'hidden',
            color: '#F7F1E6',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={CHROME_BG_IMAGE}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 35%',
            }}
          />
          <div
            className="kp-hero-veil"
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(28,36,28,0.18) 0%, rgba(28,36,28,0.42) 45%, rgba(28,36,28,0.88) 100%)',
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              padding: 'clamp(28px, 6vw, 56px) clamp(20px, 5vw, 40px) clamp(36px, 7vw, 64px)',
              maxWidth: 720,
            }}
          >
            <p
              className="kp-rise"
              style={{
                margin: 0,
                fontFamily: CHROME_FONT.serif,
                fontSize: 'clamp(42px, 9vw, 64px)',
                fontWeight: 560,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                color: '#F7F1E6',
              }}
            >
              Notya
            </p>
            <h1
              className="kp-rise-2"
              style={{
                margin: '14px 0 0',
                fontFamily: CHROME_FONT.serif,
                fontSize: 'clamp(26px, 5.2vw, 36px)',
                fontWeight: 480,
                fontStyle: 'italic',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                maxWidth: 18 * 16,
              }}
            >
              Konsültasyon istemi
            </h1>
            <p
              className="kp-rise-3"
              style={{
                margin: '12px 0 0',
                fontSize: 16,
                lineHeight: 1.45,
                color: 'rgba(247,241,230,0.88)',
                maxWidth: 34 * 16,
              }}
            >
              Hesap veya şifre gerekmez. Raporunuzu buraya bırakın — isteyen hekime iletilir.
            </p>
            {dilim && !hata && (
              <button
                type="button"
                className="kp-cta kp-focus kp-rise-3"
                onClick={formaKaydir}
                style={{
                  marginTop: 22,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  borderRadius: 12,
                  border: 'none',
                  background: CHROME_RENK.cream,
                  color: CHROME_RENK.pine,
                  fontFamily: CHROME_FONT.sans,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                İstemi aç <span aria-hidden>↓</span>
              </button>
            )}
            {demoMu && (
              <div
                className="kp-rise-3"
                style={{
                  marginTop: 16,
                  fontSize: 12.5,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'rgba(247,241,230,0.7)',
                }}
              >
                Önizleme · örnek istem
              </div>
            )}
          </div>
        </header>

        <main style={{ maxWidth: 640, margin: '0 auto', padding: '28px 18px 64px' }}>
          {yukleniyor && (
            <p style={{ color: CHROME_RENK.muted, fontSize: 15 }}>İstem yükleniyor…</p>
          )}

          {hata && !dilim && (
            <div
              role="alert"
              style={{
                padding: '18px 16px',
                borderRadius: 14,
                background: 'rgba(164,91,62,0.1)',
                border: '1px solid rgba(164,91,62,0.28)',
                color: CHROME_RENK.warn,
                fontSize: 15,
                lineHeight: 1.45,
              }}
            >
              {hata}
            </div>
          )}

          {dilim && (
            <>
              <section style={{ marginBottom: 28 }} aria-label="İsteyen hekim">
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: CHROME_RENK.muted,
                    marginBottom: 8,
                  }}
                >
                  İsteyen hekim
                </div>
                <div
                  style={{
                    fontFamily: CHROME_FONT.serif,
                    fontSize: 'clamp(26px, 5vw, 32px)',
                    fontWeight: 560,
                    color: CHROME_RENK.pine,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.15,
                  }}
                >
                  {dilim.hekimAdi}
                </div>
                {(dilim.hekimTelefon || dilim.hekimEposta) && (
                  <div
                    style={{
                      marginTop: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      fontSize: 15.5,
                      lineHeight: 1.4,
                      color: CHROME_RENK.ink,
                    }}
                  >
                    {dilim.hekimTelefon ? (
                      telefonHref(dilim.hekimTelefon) ? (
                        <a
                          href={telefonHref(dilim.hekimTelefon)!}
                          style={{ color: CHROME_RENK.pine, fontWeight: 600, textDecoration: 'none' }}
                        >
                          {dilim.hekimTelefon}
                        </a>
                      ) : (
                        <span style={{ fontWeight: 600 }}>{dilim.hekimTelefon}</span>
                      )
                    ) : null}
                    {dilim.hekimEposta ? (
                      <a
                        href={`mailto:${dilim.hekimEposta}`}
                        style={{ color: CHROME_RENK.pine, fontWeight: 600, textDecoration: 'none', wordBreak: 'break-all' }}
                      >
                        {dilim.hekimEposta}
                      </a>
                    ) : null}
                  </div>
                )}
                <div style={{ marginTop: 8, fontSize: 14.5, color: CHROME_RENK.muted, lineHeight: 1.4 }}>
                  {dilim.brans}
                  <span aria-hidden> · </span>
                  istem {dilim.istemTarihi}
                  {dilim.beklenenGun ? (
                    <>
                      <span aria-hidden> · </span>
                      beklenen {dilim.beklenenGun}
                    </>
                  ) : null}
                </div>
              </section>

              <section style={{ marginBottom: 28 }} aria-label="Hasta">
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: CHROME_RENK.muted,
                    marginBottom: 6,
                  }}
                >
                  Hasta
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: CHROME_RENK.ink }}>{dilim.hastaAdi}</div>
              </section>

              <section style={{ marginBottom: 28 }} aria-label="Klinik soru">
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: CHROME_RENK.muted,
                    marginBottom: 8,
                  }}
                >
                  Klinik soru
                </div>
                <p
                  style={{
                    margin: 0,
                    fontFamily: CHROME_FONT.serif,
                    fontSize: 'clamp(18px, 3.6vw, 22px)',
                    fontWeight: 480,
                    lineHeight: 1.45,
                    color: CHROME_RENK.ink,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {dilim.soru}
                </p>
              </section>

              {dilim.ozgecmis ? (
                <section style={{ marginBottom: 28 }} aria-label="Kısa özgeçmiş">
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: CHROME_RENK.muted,
                      marginBottom: 8,
                    }}
                  >
                    Kısa özgeçmiş
                  </div>
                  <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.55, color: CHROME_RENK.ink }}>
                    {dilim.ozgecmis}
                  </p>
                </section>
              ) : null}

              {!!dilim.onayliCumleler?.length && (
                <section style={{ marginBottom: 32 }} aria-label="Onaylı not cümleleri">
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: CHROME_RENK.muted,
                      marginBottom: 8,
                    }}
                  >
                    Onaylı not cümleleri
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14.5, lineHeight: 1.55, color: CHROME_RENK.ink }}>
                    {dilim.onayliCumleler.map((c, i) => (
                      <li key={i} style={{ marginBottom: 6 }}>{c}</li>
                    ))}
                  </ul>
                </section>
              )}

              <div
                id="konsultan-form"
                style={{
                  height: 1,
                  scrollMarginTop: 24,
                }}
              />

              {!sonuc.includes('iletildi') && !sonuc.includes('Demo önizleme') && (
                <section
                  aria-label="Rapor formu"
                  style={{
                    paddingTop: 8,
                    borderTop: `1px solid ${CHROME_RENK.border}`,
                  }}
                >
                  <h2
                    style={{
                      margin: '20px 0 6px',
                      fontFamily: CHROME_FONT.serif,
                      fontSize: 24,
                      fontWeight: 560,
                      color: CHROME_RENK.pine,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Raporunuzu bırakın
                  </h2>
                  <p style={{ margin: '0 0 18px', fontSize: 14, color: CHROME_RENK.muted, lineHeight: 1.45 }}>
                    Kısa klinik not ve en az bir belge (JPEG, PDF veya kısa video).
                  </p>

                  <label style={{ display: 'block', marginBottom: 16 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: CHROME_RENK.ink }}>Rapor / notunuz</span>
                    <textarea
                      className="kp-focus"
                      value={not}
                      onChange={(e) => setNot(e.target.value)}
                      rows={4}
                      maxLength={2000}
                      placeholder='Ör. İşitme kaybı saptanmadı. Saf ses odyogramı ektedir.'
                      style={{
                        display: 'block',
                        width: '100%',
                        marginTop: 8,
                        padding: '14px 16px',
                        borderRadius: 12,
                        border: `1px solid ${notHata ? CHROME_RENK.warn : CHROME_RENK.border}`,
                        background: CHROME_RENK.paper,
                        fontFamily: CHROME_FONT.sans,
                        fontSize: 15,
                        color: CHROME_RENK.ink,
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        lineHeight: 1.5,
                      }}
                    />
                    {notHata ? <div style={{ fontSize: 13, color: CHROME_RENK.warn, marginTop: 6 }}>{notHata}</div> : null}
                  </label>

                  <label style={{ display: 'block', marginBottom: 22 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: CHROME_RENK.ink }}>Belge</span>
                    <div
                      style={{
                        marginTop: 8,
                        padding: '16px 14px',
                        borderRadius: 12,
                        border: `1px dashed ${belgeHata ? CHROME_RENK.warn : 'rgba(47,67,52,0.35)'}`,
                        background: 'rgba(47,67,52,0.04)',
                      }}
                    >
                      {/* KURAL — TÜRKÇE: tarayıcının dosya kontrolü İngilizce yazar ("Choose Files / No file chosen").
                          Girdi gizli; çevreleyen <label> tıklamayı ona iletir, görünen düğme Türkçedir. */}
                      <input
                        type="file"
                        accept={KABUL}
                        multiple
                        onChange={(e) => setDosyalar(Array.from(e.target.files || []).slice(0, 5))}
                        style={{ display: 'none' }}
                      />
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          minHeight: 44,
                          padding: '0 16px',
                          borderRadius: 10,
                          border: `1px solid ${CHROME_RENK.pine}`,
                          background: '#fff',
                          color: CHROME_RENK.pine,
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <span aria-hidden>📎</span>
                        {dosyalar.length ? 'Dosyaları değiştir' : 'Dosya seç'}
                      </span>
                      <div style={{ fontSize: 12.5, color: CHROME_RENK.muted, marginTop: 8, lineHeight: 1.4 }}>
                        JPEG, PNG, PDF, kısa video veya DICOM · en fazla 4 MB · 5 dosya
                      </div>
                      {!!dosyalar.length && (
                        <div style={{ fontSize: 13.5, color: CHROME_RENK.pine, marginTop: 8, fontWeight: 600 }}>
                          {dosyalar.map((f) => f.name).join(' · ')}
                        </div>
                      )}
                    </div>
                    {belgeHata ? <div style={{ fontSize: 13, color: CHROME_RENK.warn, marginTop: 6 }}>{belgeHata}</div> : null}
                  </label>

                  <button
                    type="button"
                    className="kp-cta kp-focus"
                    onClick={() => { void gonder() }}
                    disabled={mesgul || (!!hata && !demoMu)}
                    style={{
                      width: '100%',
                      padding: '15px 18px',
                      borderRadius: 14,
                      border: 'none',
                      background: CHROME_RENK.pine,
                      color: CHROME_RENK.cream,
                      fontFamily: CHROME_FONT.sans,
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: mesgul ? 'wait' : 'pointer',
                      opacity: mesgul ? 0.72 : 1,
                      minHeight: 48,
                    }}
                  >
                    {mesgul ? 'Gönderiliyor…' : demoMu ? 'Gönder (demo)' : 'Gönder'}
                  </button>
                </section>
              )}

              {sonuc ? (
                <div
                  style={{
                    marginTop: 20,
                    padding: 16,
                    borderRadius: 14,
                    background: 'rgba(47,67,52,0.08)',
                    border: '1px solid rgba(47,67,52,0.18)',
                    color: CHROME_RENK.pine,
                    fontSize: 15,
                    lineHeight: 1.5,
                  }}
                  aria-live="polite"
                >
                  {sonuc}
                  {davet && /iletildi|Demo/.test(sonuc) ? (
                    <div style={{ marginTop: 10, fontSize: 13, color: CHROME_RENK.muted }}>{davet}</div>
                  ) : null}
                </div>
              ) : null}

              {hata && dilim ? (
                <div style={{ marginTop: 12, fontSize: 13, color: CHROME_RENK.warn }}>{hata}</div>
              ) : null}
            </>
          )}

          <footer
            style={{
              marginTop: 48,
              paddingTop: 18,
              borderTop: `1px solid ${CHROME_RENK.border}`,
              fontSize: 12.5,
              color: CHROME_RENK.muted,
              lineHeight: 1.45,
            }}
          >
            Notya · konsültan portalı · hesap gerekmez; rapor isteyen hekime iletilir.
          </footer>
        </main>
      </div>
    </>
  )
}
