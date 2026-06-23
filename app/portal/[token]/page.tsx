'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

interface Message { role: 'user' | 'assistant'; content: string }
interface Beyan { beyanTuru: string; sonGun: string; daysLeft: number }

export default function MüşteriPortal() {
  const params = useParams<{ token: string }>()
  const token = params.token
  const [müşteriAdi, setMüşteriAdi] = useState('')
  const [müşavirAdi, setMüşavirAdi] = useState('')
  const [aktifBeyanlar, setAktifBeyanlar] = useState<Beyan[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!token) return
    fetch(`/api/mali/portal?token=${token}`)
      .then(r => r.json())
      .then(res => {
        if (!res.success) { setError(true); setLoading(false); return }
        setMüşteriAdi(res.data.müşteriAdi)
        setMüşavirAdi(res.data.müşavirAdi)
        setAktifBeyanlar(res.data.aktifBeyanlar)
        setMessages([{
          role: 'assistant',
          content: `Merhaba! Ben Derya Yılmaz, mali müşavirinizin asistanıyım. ${res.data.müşteriAdi} hesabınız hakkında sorularınızı yanıtlayabilirim.`
        }])
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [token])

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')

    try {
      const res = await fetch('/api/mali/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, message: userMsg.content, history: newMessages })
      })
      const data = await res.json()
      if (data.success) {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }])
      }
    } catch {}
    setTimeout(() => chatRef.current?.scrollTo(0, chatRef.current.scrollHeight), 50)
  }

  const getBeyanColor = (days: number) => days <= 7 ? '#ef4444' : days <= 30 ? '#f59e0b' : '#22c55e'

  if (loading) return <div style={{ background: '#0A1628', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Yükleniyor...</div>
  if (error) return <div style={{ background: '#0A1628', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 24, textAlign: 'center' }}>Geçersiz bağlantı. Lütfen müşavirinizle iletişime geçin.</div>

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#0A1628', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui' }}>
      <div style={{ padding: 16, borderBottom: '1px solid #1f2a44', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, background: '#0ea5e9', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>N</div>
        <div>
          <div style={{ fontWeight: 600 }}>{müşteriAdi}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Derya Yılmaz ile konuşuyorsunuz</div>
        </div>
      </div>

      {aktifBeyanlar.length > 0 && (
        <div style={{ padding: 16, overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {aktifBeyanlar.map((b, i) => (
            <div key={i} style={{ display: 'inline-block', background: '#1f2a44', padding: 12, borderRadius: 8, marginRight: 8, minWidth: 160 }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{b.beyanTuru}</div>
              <div style={{ color: getBeyanColor(b.daysLeft), fontWeight: 600 }}>{b.sonGun} • {b.daysLeft} gün</div>
            </div>
          ))}
        </div>
      )}

      <div ref={chatRef} style={{ height: 'calc(100vh - 280px)', overflowY: 'auto', padding: 16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
            {m.role === 'assistant' && <div style={{ width: 28, height: 28, background: '#22c55e', borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, fontSize: 13, fontWeight: 700 }}>D</div>}
            <div style={{
              maxWidth: '75%',
              padding: '10px 14px',
              borderRadius: 16,
              background: m.role === 'user' ? '#14b8a6' : '#1f2a44',
              fontSize: 15,
              lineHeight: 1.4
            }}>{m.content}</div>
          </div>
        ))}
      </div>

      <div style={{ position: 'fixed', bottom: 0, maxWidth: 480, width: '100%', padding: 16, background: '#0A1628', borderTop: '1px solid #1f2a44' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Mesajınızı yazın..."
            style={{ flex: 1, background: '#1f2a44', border: 'none', borderRadius: 999, padding: '12px 18px', color: '#fff', fontSize: 15 }}
          />
          <button onClick={sendMessage} style={{ background: '#14b8a6', border: 'none', borderRadius: 999, padding: '0 20px', color: '#fff', fontWeight: 600 }}>Gönder</button>
        </div>
      </div>
    </div>
  )
}