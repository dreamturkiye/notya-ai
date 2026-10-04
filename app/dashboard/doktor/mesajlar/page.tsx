'use client'

/**
 * Shared practice inbox — doktor + sekreter.
 * Hasta mesaj ekleri: gözlemle · Belgeler'e kaydet · mesajla birlikte sil.
 */
import React, { useCallback, useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'
import MesajEkViewer from '@/components/doktor/MesajEkViewer'
import { ORTAK_BELGE_TURLERI } from '@/lib/doktor/belgeTurleri'
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon'

type Ek = {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  belgeId: string | null
}

type Thread = {
  id: string
  patientId: string
  hastaAdi: string
  konu: string
  sonMesajAt: string
  okundu: boolean
  ozet: string
  sonTaraf: string | null
}

type Msg = {
  id: string
  taraf: string
  metin: string
  tarih: string
  kimden: string
  ekler?: Ek[]
}

export default function DoktorMesajlarPage() {
  return (
    <Suspense fallback={null}>
      <DoktorMesajlarIcerik />
    </Suspense>
  )
}

function DoktorMesajlarIcerik() {
  const searchParams = useSearchParams()
  const [threads, setThreads] = useState<Thread[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [patientId, setPatientId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [threadMeta, setThreadMeta] = useState<{ konu: string; hastaAdi: string } | null>(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [viewer, setViewer] = useState<Ek | null>(null)
  const [kaydetEk, setKaydetEk] = useState<Ek | null>(null)
  const [kategori, setKategori] = useState<string>('Röntgen')
  const [busyEk, setBusyEk] = useState<string | null>(null)

  const authHeaders = useCallback(async () => {
    const t = await ensureDoctorAccessToken()
    if (!t) throw new Error('Oturum gerekli')
    return { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }
  }, [])

  const loadList = useCallback(async () => {
    const headers = await authHeaders()
    const res = await fetch('/api/doktor/mesajlar', { headers })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error || 'Yüklenemedi')
    setThreads(json.threads || [])
    setUnreadCount(json.unreadCount || 0)
  }, [authHeaders])

  const openThread = useCallback(
    async (id: string) => {
      setActiveId(id)
      setError(null)
      const headers = await authHeaders()
      const res = await fetch(`/api/doktor/mesajlar/${encodeURIComponent(id)}`, { headers })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Konu açılamadı')
      setThreadMeta({ konu: json.thread.konu, hastaAdi: json.thread.hastaAdi })
      setPatientId(json.thread.patientId || null)
      setMessages(json.messages || [])
      setThreads((prev) => {
        const wasUnread = prev.some((t) => t.id === id && !t.okundu)
        if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1))
        return prev.map((t) => (t.id === id ? { ...t, okundu: true } : t))
      })
    },
    [authHeaders]
  )

  useEffect(() => {
    ;(async () => {
      try {
        await loadList()
        const konuId = searchParams?.get('konu')
        if (konuId) await openThread(konuId)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Yüklenemedi')
      } finally {
        setLoading(false)
      }
    })()
  }, [loadList, openThread, searchParams])

  async function sendReply() {
    if (!activeId || !reply.trim()) return
    setSending(true)
    setError(null)
    try {
      const headers = await authHeaders()
      const res = await fetch(`/api/doktor/mesajlar/${encodeURIComponent(activeId)}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ metin: reply.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Yanıt gönderilemedi')
      setReply('')
      await openThread(activeId)
      await loadList()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yanıt gönderilemedi')
    } finally {
      setSending(false)
    }
  }

  async function mesajSil(mesajId: string) {
    if (!activeId) return
    if (!window.confirm('Bu mesaj ve ekleri silinsin mi?')) return
    setBusyEk(mesajId)
    setError(null)
    try {
      const headers = await authHeaders()
      const res = await fetch(`/api/doktor/mesajlar/${encodeURIComponent(activeId)}`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ mesajId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Silinemedi')
      if (json.konuSilindi) {
        setActiveId(null)
        setMessages([])
        setThreadMeta(null)
        await loadList()
      } else {
        await openThread(activeId)
        await loadList()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Silinemedi')
    } finally {
      setBusyEk(null)
    }
  }

  async function belgeyeKaydet() {
    if (!kaydetEk) return
    setBusyEk(kaydetEk.id)
    setError(null)
    try {
      const headers = await authHeaders()
      const res = await fetch(`/api/doktor/mesajlar/ek/${encodeURIComponent(kaydetEk.id)}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'belgeye-kaydet', category: kategori }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Kaydedilemedi')
      setKaydetEk(null)
      if (activeId) await openThread(activeId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi')
    } finally {
      setBusyEk(null)
    }
  }

  return (
    <div>
      <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>Doktor</div>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, margin: '0 0 6px', color: '#2e251d', letterSpacing: '-0.02em' }}>
        Mesajlar {unreadCount > 0 ? <span style={{ color: CHROME_RENK.pine }}>({unreadCount})</span> : null}
      </h1>
      <p style={{ margin: '0 0 18px', color: CHROME_RENK.muted, fontSize: 14 }}>
        Hasta portalı (Sağlığım) gelen kutusu — ekleri gözlemleyin, belgelere kaydedin veya mesajla silin.
      </p>

      {error ? <p style={{ color: CHROME_RENK.warn, fontSize: 14 }}>{error}</p> : null}
      {loading ? <p style={{ color: CHROME_RENK.muted }}>Yükleniyor…</p> : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
        }}
      >
        <div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${CHROME_RENK.border}`,
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 8px 18px rgba(58,44,34,0.045)',
          }}
        >
          {!threads.length && !loading ? (
            <p style={{ margin: 0, padding: 16, color: CHROME_RENK.muted, fontSize: 14 }}>Henüz mesaj yok.</p>
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => openThread(t.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  borderBottom: `1px solid ${CHROME_RENK.border}`,
                  background: activeId === t.id ? '#E4F3F1' : 'transparent',
                  color: CHROME_RENK.ink,
                  padding: '14px 16px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong style={{ fontSize: 14 }}>{t.konu}</strong>
                  {!t.okundu ? (
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: CHROME_RENK.pine, marginTop: 5 }} />
                  ) : null}
                </div>
                <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 4 }}>{t.hastaAdi}</div>
                <div style={{ fontSize: 13, color: CHROME_RENK.ink, marginTop: 4 }}>{t.ozet}</div>
              </button>
            ))
          )}
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${CHROME_RENK.border}`,
            borderRadius: 16,
            padding: 16,
            minHeight: 280,
            boxShadow: '0 8px 18px rgba(58,44,34,0.045)',
          }}
        >
          {!activeId ? (
            <p style={{ margin: 0, color: CHROME_RENK.muted }}>Bir konuşma seçin.</p>
          ) : (
            <>
              <h2 style={{ margin: '0 0 4px', fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 20, color: '#2e251d' }}>{threadMeta?.konu}</h2>
              <p style={{ margin: 0, color: CHROME_RENK.muted, fontSize: 13 }}>
                {threadMeta?.hastaAdi}
                {patientId ? (
                  <>
                    {' · '}
                    <Link href={hastaDosyaHref(patientId, 'belgeler')} style={{ color: CHROME_RENK.pine, fontWeight: 700 }}>
                      Belgeler
                    </Link>
                  </>
                ) : null}
              </p>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.taraf === 'hasta' ? 'flex-start' : 'flex-end',
                      maxWidth: '94%',
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: m.taraf === 'hasta' ? '#F6F0E4' : CHROME_RENK.pine,
                      color: m.taraf === 'hasta' ? CHROME_RENK.ink : '#FAF8F4',
                    }}
                  >
                    <div style={{ fontSize: 11, color: m.taraf === 'hasta' ? CHROME_RENK.pine : CHROME_RENK.gold, fontWeight: 700, marginBottom: 4 }}>{m.kimden}</div>
                    <div style={{ fontSize: 14, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{m.metin}</div>
                    {m.ekler?.length ? (
                      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {m.ekler.map((ek) => (
                          <div
                            key={ek.id}
                            style={{
                              padding: '8px 10px',
                              borderRadius: 10,
                              background: m.taraf === 'hasta' ? 'rgba(47,67,52,0.06)' : 'rgba(255,255,255,0.12)',
                              fontSize: 13,
                            }}
                          >
                            <div style={{ fontWeight: 650, marginBottom: 6 }}>📎 {ek.fileName}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              <button type="button" style={ekBtn(m.taraf === 'hasta')} onClick={() => setViewer(ek)}>
                                Gözlemle
                              </button>
                              {ek.belgeId ? (
                                patientId ? (
                                  <Link
                                    href={`/dashboard/doktor/hastalar/${encodeURIComponent(patientId)}/belgeler/${encodeURIComponent(ek.belgeId)}`}
                                    style={{ ...ekBtn(m.taraf === 'hasta'), textDecoration: 'none' }}
                                  >
                                    Belgelerde aç
                                  </Link>
                                ) : (
                                  <span style={{ fontSize: 12, opacity: 0.85 }}>Belgelere kaydedildi</span>
                                )
                              ) : (
                                <button type="button" style={ekBtn(m.taraf === 'hasta')} onClick={() => { setKaydetEk(ek); setKategori(tahminKategori(ek.fileName, ek.fileType)) }}>
                                  Belgeler&apos;e kaydet
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: m.taraf === 'hasta' ? CHROME_RENK.muted : 'rgba(250,248,244,0.7)' }}>
                        {new Date(m.tarih).toLocaleString('tr-TR')}
                      </span>
                      <button
                        type="button"
                        onClick={() => void mesajSil(m.id)}
                        disabled={busyEk === m.id}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: m.taraf === 'hasta' ? CHROME_RENK.warn : 'rgba(250,248,244,0.85)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Yanıt yazın…"
                rows={3}
                style={{
                  width: '100%',
                  marginTop: 16,
                  boxSizing: 'border-box',
                  borderRadius: 12,
                  border: `1px solid ${CHROME_RENK.border}`,
                  background: '#FFFFFF',
                  color: CHROME_RENK.ink,
                  padding: 12,
                  fontSize: 16,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              <button
                type="button"
                onClick={sendReply}
                disabled={sending || !reply.trim()}
                style={{
                  marginTop: 10,
                  padding: '10px 18px',
                  borderRadius: 999,
                  border: 'none',
                  background: CHROME_RENK.pine,
                  color: '#FAF8F4',
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: sending || !reply.trim() ? 0.6 : 1,
                }}
              >
                {sending ? 'Gönderiliyor…' : 'Yanıtla'}
              </button>
            </>
          )}
        </div>
      </div>

      {viewer ? (
        <MesajEkViewer
          ekId={viewer.id}
          fileName={viewer.fileName}
          fileType={viewer.fileType}
          onClose={() => setViewer(null)}
        />
      ) : null}

      {kaydetEk ? (
        <div
          role="dialog"
          aria-label="Belgeler'e kaydet"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            background: 'rgba(20,16,12,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setKaydetEk(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, padding: 18, width: 'min(420px, 100%)', border: `1px solid ${CHROME_RENK.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Belgeler&apos;e kaydet</div>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: CHROME_RENK.muted }}>{kaydetEk.fileName}</p>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: CHROME_RENK.pine, marginBottom: 4 }}>Belge türü</label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 10, border: `1px solid ${CHROME_RENK.border}`, marginBottom: 14 }}
            >
              {ORTAK_BELGE_TURLERI.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => void belgeyeKaydet()}
                disabled={busyEk === kaydetEk.id}
                style={{ padding: '10px 16px', borderRadius: 999, border: 'none', background: CHROME_RENK.pine, color: '#FAF8F4', fontWeight: 700, cursor: 'pointer' }}
              >
                Kaydet
              </button>
              <button type="button" onClick={() => setKaydetEk(null)} style={{ padding: '10px 16px', borderRadius: 999, border: `1px solid ${CHROME_RENK.border}`, background: '#fff', cursor: 'pointer' }}>
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ekBtn(hasta: boolean): React.CSSProperties {
  return {
    border: `1px solid ${hasta ? 'rgba(47,67,52,0.25)' : 'rgba(255,255,255,0.35)'}`,
    background: hasta ? '#fff' : 'rgba(255,255,255,0.12)',
    color: hasta ? CHROME_RENK.pine : '#FAF8F4',
    borderRadius: 999,
    padding: '5px 10px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  }
}

function tahminKategori(fileName: string, fileType: string): string {
  const n = `${fileName} ${fileType}`.toLocaleLowerCase('tr-TR')
  if (/ekg|ecg/.test(n)) return 'EKG'
  if (/rontgen|röntgen|x-?ray|xr|akci[gğ]er/.test(n)) return 'Röntgen'
  if (/lab|hemogram|kan|sonu[cç]/.test(n)) return 'Lab Sonucu'
  if (/usg|ultrason|ultrasound/.test(n)) return 'Görüntüleme Raporu'
  if (/epikriz/.test(n)) return 'Epikriz'
  if (/audio|ses|mp3|wav|m4a/.test(n)) return 'Muayene ses kaydı'
  if (/image|jpg|png|foto/.test(n)) return 'Muayene görüntüsü'
  return 'Diğer'
}
