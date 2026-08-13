'use client'
export const dynamic = 'force-dynamic'

import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Sure = {
  id?: string
  sure_turu?: string
  son_gun?: string
  aciklama?: string
}

type PortalInfo = {
  muvekkilAdi: string
  avukatAdi: string
  davaTuru: string
  sureler: Sure[]
}

type ChatMessage = { role: 'user' | 'assistant'; content: string }

const NAVY = '#1E3A5F'
const RED = '#DC2626'
const AMBER = '#D97706'
const GREEN = '#059669'

export default function AvukatPortalPage() {
  const params = useParams() as { token?: string | string[] }
  const token = Array.isArray(params?.token) ? params.token[0] : params?.token || ''

  const [info, setInfo] = useState<PortalInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [chatError, setChatError] = useState('')
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!token) { setLoadError('Link geçersiz. Avukatınızdan yeni bir bağlantı isteyin.'); setLoading(false); return }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/avukat/portal?token=' + encodeURIComponent(token))
        const data = await res.json()
        if (cancelled) return
        if (data?.success && data.data) {
          setInfo({
            muvekkilAdi: String(data.data.muvekkilAdi || 'Müvekkil'),
            avukatAdi: String(data.data.avukatAdi || 'Avukat'),
            davaTuru: String(data.data.davaTuru || 'Genel'),
            sureler: Array.isArray(data.data.sureler) ? data.data.sureler : [],
          })
        } else {
          setLoadError(String(data?.error || 'Bilgiler yüklenemedi. Link geçersiz veya süresi dolmuş olabilir.'))
        }
      } catch {
        if (!cancelled) setLoadError('Bağlantı hatası. İnternet bağlantınızı kontrol edip sayfayı yenileyin.')
      }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [token])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, sending])

  async function send() {
    const text = draft.trim()
    if (!text || sending) return
    const history = messages
    setDraft('')
    setChatError('')
    setMessages([...history, { role: 'user', content: text }])
    setSending(true)
    try {
      const res = await fetch('/api/avukat/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, message: text, history }),
      })
      const data = await res.json()
      const reply = data?.data?.speech || data?.data?.message || data?.speech
      if (data?.success && reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: String(reply) }])
      } else {
        setChatError(String(data?.error || 'Yanıt alınamadı. Lütfen tekrar deneyin.'))
      }
    } catch {
      setChatError('Bağlantı hatası. Mesaj gönderilemedi.')
    }
    setSending(false)
  }

  const sureRenk = (sonGun?: string) => {
    if (!sonGun) return GREEN
    const diff = new Date(sonGun).getTime() - Date.now()
    if (Number.isNaN(diff)) return GREEN
    const gun = diff / 86400000
    return gun <= 3 ? RED : gun <= 7 ? AMBER : GREEN
  }

  const gunMetni = (sonGun?: string) => {
    if (!sonGun) return '—'
    const t = new Date(sonGun).getTime()
    if (Number.isNaN(t)) return '—'
    const gun = Math.ceil((t - Date.now()) / 86400000)
    return gun < 0 ? 'Süre geçti' : gun === 0 ? 'Bugün' : gun === 1 ? 'Yarın' : gun + ' gün'
  }

  const tarih = (sonGun?: string) => {
    if (!sonGun) return ''
    const d = new Date(sonGun)
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('tr-TR')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F5F9', fontFamily: 'system-ui,sans-serif', color: '#475569' }}>
        Yükleniyor...
      </div>
    )
  }

  if (loadError || !info) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F5F9', fontFamily: 'system-ui,sans-serif', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 28, maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#1E293B', marginBottom: 8 }}>Bağlantı Açılamadı</div>
          <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>{loadError || 'Link geçersiz veya süresi dolmuş.'}</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F1F5F9', fontFamily: 'system-ui,sans-serif' }}>
      <header style={{ background: NAVY, color: '#fff', padding: '20px 16px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Müvekkil Portalı</div>
          <div style={{ fontSize: 21, fontWeight: 800 }}>{info.muvekkilAdi}</div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
            Av. {info.avukatAdi} · {info.davaTuru}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 32px' }}>
        <section style={{ marginBottom: 22 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', margin: '0 0 10px' }}>Yaklaşan Süreler</h2>
          {info.sureler.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
              Şu anda takip edilen aktif bir süre bulunmuyor.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {info.sureler.map((s, i) => {
                const renk = sureRenk(s.son_gun)
                return (
                  <div key={s.id || i} style={{ background: '#fff', border: '1px solid #E2E8F0', borderLeft: '4px solid ' + renk, borderRadius: 10, padding: '13px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#1E293B' }}>{s.sure_turu || 'Süre'}</div>
                      {s.aciklama && <div style={{ fontSize: 12, color: '#64748B', marginTop: 3, lineHeight: 1.5 }}>{s.aciklama}</div>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: renk }}>{gunMetni(s.son_gun)}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{tarih(s.son_gun)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', margin: '0 0 10px' }}>Hukuk Asistanına Sorun</h2>
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, display: 'flex', flexDirection: 'column', height: 440, overflow: 'hidden' }}>
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, marginTop: 40, lineHeight: 1.7, padding: '0 12px' }}>
                  Dosyanızla ilgili merak ettiklerinizi buraya yazabilirsiniz.<br />
                  Örnek: &quot;Bir sonraki duruşmada ne olacak?&quot;
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '82%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    fontSize: 14,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    background: m.role === 'user' ? NAVY : '#F1F5F9',
                    color: m.role === 'user' ? '#fff' : '#1E293B',
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && <div style={{ fontSize: 13, color: '#64748B' }}>Yanıt hazırlanıyor...</div>}
              {chatError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: 10, padding: '10px 12px', fontSize: 13 }}>
                  {chatError}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid #E2E8F0', padding: 12, display: 'flex', gap: 8 }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Sorunuzu yazın..."
                disabled={sending}
                style={{ flex: 1, minWidth: 0, padding: '11px 14px', borderRadius: 9, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
              <button
                onClick={send}
                disabled={sending || !draft.trim()}
                style={{
                  background: sending || !draft.trim() ? '#94A3B8' : NAVY,
                  color: '#fff', border: 'none', borderRadius: 9,
                  padding: '11px 20px', fontSize: 14, fontWeight: 600,
                  cursor: sending || !draft.trim() ? 'not-allowed' : 'pointer', flexShrink: 0,
                }}
              >
                Gönder
              </button>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 10, lineHeight: 1.6 }}>
            Bu asistanın yanıtları bilgilendirme amaçlıdır ve hukuki mütalaa yerine geçmez.
            Kesin bilgi için avukatınıza danışın.
          </div>
        </section>
      </main>
    </div>
  )
}
