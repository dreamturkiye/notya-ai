'use client'

/**
 * Shared practice inbox — doktor + sekreter.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'

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
}

export default function DoktorMesajlarPage() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [threadMeta, setThreadMeta] = useState<{ konu: string; hastaAdi: string } | null>(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

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
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Yüklenemedi')
      } finally {
        setLoading(false)
      }
    })()
  }, [loadList])

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

  return (
    <div>
      <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>Doktor</div>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, margin: '0 0 6px', color: '#2e251d', letterSpacing: '-0.02em' }}>
        Mesajlar {unreadCount > 0 ? <span style={{ color: CHROME_RENK.pine }}>({unreadCount})</span> : null}
      </h1>
      <p style={{ margin: '0 0 18px', color: CHROME_RENK.muted, fontSize: 14 }}>
        Hasta portalı (Sağlığım) gelen kutusu — doktor ve sekreter ortak görür.
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
              <p style={{ margin: 0, color: CHROME_RENK.muted, fontSize: 13 }}>{threadMeta?.hastaAdi}</p>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.taraf === 'hasta' ? 'flex-start' : 'flex-end',
                      maxWidth: '90%',
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: m.taraf === 'hasta' ? '#F6F0E4' : CHROME_RENK.pine,
                      color: m.taraf === 'hasta' ? CHROME_RENK.ink : '#FAF8F4',
                    }}
                  >
                    <div style={{ fontSize: 11, color: m.taraf === 'hasta' ? CHROME_RENK.pine : CHROME_RENK.gold, fontWeight: 700, marginBottom: 4 }}>{m.kimden}</div>
                    <div style={{ fontSize: 14, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{m.metin}</div>
                    <div style={{ fontSize: 11, color: m.taraf === 'hasta' ? CHROME_RENK.muted : 'rgba(250,248,244,0.7)', marginTop: 6 }}>
                      {new Date(m.tarih).toLocaleString('tr-TR')}
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
    </div>
  )
}
