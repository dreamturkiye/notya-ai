'use client'

/**
 * Shared practice inbox — doktor + sekreter.
 */
import React, { useCallback, useEffect, useState } from 'react'
import DoktorNav from '@/components/doktor/DoktorNav'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'

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
    <div style={{ background: '#0A1628', minHeight: '100vh', color: '#EDF1F7' }}>
      <DoktorNav />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px 48px' }}>
        <h1 style={{ fontSize: 22, margin: '0 0 6px' }}>
          Mesajlar {unreadCount > 0 ? <span style={{ color: '#0F9B8E' }}>({unreadCount})</span> : null}
        </h1>
        <p style={{ margin: '0 0 18px', color: '#8FA0B5', fontSize: 13 }}>
          Hasta portalı (Sağlığım) gelen kutusu — doktor ve sekreter ortak görür.
        </p>

        {error ? <p style={{ color: '#F59E0B', fontSize: 14 }}>{error}</p> : null}
        {loading ? <p style={{ color: '#8FA0B5' }}>Yükleniyor…</p> : null}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12,
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            {!threads.length && !loading ? (
              <p style={{ margin: 0, padding: 16, color: '#8FA0B5', fontSize: 14 }}>Henüz mesaj yok.</p>
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
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: activeId === t.id ? 'rgba(15,155,142,0.18)' : 'transparent',
                    color: '#EDF1F7',
                    padding: '14px 16px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong style={{ fontSize: 14 }}>{t.konu}</strong>
                    {!t.okundu ? (
                      <span style={{ width: 8, height: 8, borderRadius: 99, background: '#0F9B8E', marginTop: 5 }} />
                    ) : null}
                  </div>
                  <div style={{ fontSize: 12, color: '#8FA0B5', marginTop: 4 }}>{t.hastaAdi}</div>
                  <div style={{ fontSize: 13, color: '#C9D4E3', marginTop: 4 }}>{t.ozet}</div>
                </button>
              ))
            )}
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              padding: 16,
              minHeight: 280,
            }}
          >
            {!activeId ? (
              <p style={{ margin: 0, color: '#8FA0B5' }}>Bir konuşma seçin.</p>
            ) : (
              <>
                <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>{threadMeta?.konu}</h2>
                <p style={{ margin: 0, color: '#8FA0B5', fontSize: 13 }}>{threadMeta?.hastaAdi}</p>
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: m.taraf === 'hasta' ? 'flex-start' : 'flex-end',
                        maxWidth: '90%',
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: m.taraf === 'hasta' ? 'rgba(255,255,255,0.06)' : 'rgba(15,155,142,0.22)',
                      }}
                    >
                      <div style={{ fontSize: 11, color: '#0F9B8E', fontWeight: 700, marginBottom: 4 }}>{m.kimden}</div>
                      <div style={{ fontSize: 14, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{m.metin}</div>
                      <div style={{ fontSize: 11, color: '#8FA0B5', marginTop: 6 }}>
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
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: '#0A1628',
                    color: '#EDF1F7',
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
                    background: '#0F9B8E',
                    color: '#fff',
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
    </div>
  )
}
