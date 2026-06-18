'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  sandboxFetch,
  playBase64Audio,
  SANDBOX_THEME,
} from '@/lib/sandbox/client'

type Message = { role: 'patient' | 'dr_ayse'; text: string }

type SpeechRecognitionType = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionType
    webkitSpeechRecognition?: new () => SpeechRecognitionType
  }
}

export default function PatientPageInner() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') || ''
  const appointmentId = params.get('appointment_id') || ''

  const [status, setStatus] = useState<'idle' | 'starting' | 'listening' | 'processing' | 'speaking' | 'done'>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState('')
  const [exchangeCount, setExchangeCount] = useState(0)
  const recognitionRef = useRef<SpeechRecognitionType | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isSpeakingRef = useRef(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const completeInterview = useCallback(async () => {
    setStatus('processing')
    try {
      const resp = await sandboxFetch('/api/sandbox/interview/complete', token, {
        method: 'POST',
        body: JSON.stringify({ token, appointment_id: appointmentId }),
      })
      const json = await resp.json()
      if (!json.success) throw new Error(json.error)
      setStatus('done')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Tamamlanamadı')
      setStatus('idle')
    }
  }, [token, appointmentId])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isSpeakingRef.current) return
    setStatus('processing')
    setMessages((m) => [...m, { role: 'patient', text: text.trim() }])

    try {
      const resp = await sandboxFetch('/api/sandbox/interview/message', token, {
        method: 'POST',
        body: JSON.stringify({ token, appointment_id: appointmentId, message: text.trim() }),
      })
      const json = await resp.json()
      if (!json.success) throw new Error(json.error)

      const { reply, audio_base64, exchange_count, should_complete } = json.data
      setMessages((m) => [...m, { role: 'dr_ayse', text: reply }])
      setExchangeCount(exchange_count)

      isSpeakingRef.current = true
      setStatus('speaking')
      await playBase64Audio(audio_base64)
      isSpeakingRef.current = false

      if (should_complete || exchange_count >= 12) {
        await completeInterview()
        return
      }

      setStatus('listening')
      recognitionRef.current?.start()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Mesaj gönderilemedi')
      setStatus('idle')
    }
  }, [token, appointmentId, completeInterview])

  async function startInterview() {
    if (!token || !appointmentId) {
      setError('Token ve appointment_id gerekli')
      return
    }
    setStatus('starting')
    setError('')

    try {
      const resp = await sandboxFetch('/api/sandbox/interview/start', token, {
        method: 'POST',
        body: JSON.stringify({ token, appointment_id: appointmentId }),
      })
      const json = await resp.json()
      if (!json.success) throw new Error(json.error)

      const { welcome_message, audio_base64 } = json.data
      setMessages([{ role: 'dr_ayse', text: welcome_message }])

      isSpeakingRef.current = true
      setStatus('speaking')
      await playBase64Audio(audio_base64)
      isSpeakingRef.current = false

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        setError('Tarayıcınız ses tanımayı desteklemiyor. Chrome kullanın.')
        setStatus('idle')
        return
      }

      const recognition = new SpeechRecognition()
      recognition.lang = 'tr-TR'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript
        recognition.stop()
        sendMessage(transcript)
      }

      recognition.onerror = (e) => {
        if (e.error !== 'no-speech') {
          setError(`Ses tanıma hatası: ${e.error}`)
        }
        if (status !== 'done' && !isSpeakingRef.current) {
          setTimeout(() => recognition.start(), 500)
        }
      }

      recognition.onend = () => {
        if (status === 'listening') {
          // auto-restart handled by onerror/no-speech
        }
      }

      recognitionRef.current = recognition
      setStatus('listening')
      recognition.start()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Başlatılamadı')
      setStatus('idle')
    }
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setStatus('idle')
  }

  if (!token || !appointmentId) {
    return (
      <div style={pageStyle}>
        <p style={{ color: SANDBOX_THEME.muted }}>?token=XXX&amp;appointment_id=YYY gerekli</p>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <header style={{ padding: '12px 0', borderBottom: `1px solid ${SANDBOX_THEME.border}`, marginBottom: 16 }}>
        <button type="button" onClick={() => router.back()} style={{ background: 'none', border: 'none', color: SANDBOX_THEME.muted, cursor: 'pointer', fontSize: 24 }}>‹</button>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Dr. Ayşe — Hasta Görüşmesi</div>
        <div style={{ fontSize: 12, color: SANDBOX_THEME.muted }}>Pre-vizit AI asistan</div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {messages.length === 0 && status === 'idle' && (
          <div style={{ textAlign: 'center', opacity: 0.5, marginTop: 40 }}>
            <div style={{ fontSize: 48 }}>👩‍⚕️</div>
            <p>Dr. Ayşe sizi karşılamak için hazır</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'patient' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%',
              padding: '10px 14px',
              borderRadius: msg.role === 'patient' ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
              background: msg.role === 'patient' ? SANDBOX_THEME.accentAlt : SANDBOX_THEME.card,
              fontSize: 14,
              lineHeight: 1.5,
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div style={{ color: '#F87171', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</div>
      )}

      {status === 'done' ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#22C55E', marginBottom: 16 }}>✓ Görüşme tamamlandı. Chart oluşturuldu.</p>
          <button
            type="button"
            onClick={() => router.push(`/sandbox/dr-ayse/test?token=${encodeURIComponent(token)}`)}
            style={btnStyle}
          >
            Test sayfasına dön
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', paddingBottom: 32 }}>
          <div style={{ fontSize: 13, color: SANDBOX_THEME.muted, marginBottom: 12 }}>
            {status === 'idle' && 'Başlatmak için dokunun'}
            {status === 'starting' && 'Bağlanıyor...'}
            {status === 'listening' && `Dinliyor (${exchangeCount} mesaj) — konuşun`}
            {status === 'processing' && 'Dr. Ayşe düşünüyor...'}
            {status === 'speaking' && 'Dr. Ayşe konuşuyor...'}
          </div>
          <button
            type="button"
            onClick={status === 'idle' ? startInterview : stopListening}
            style={{
              ...btnStyle,
              width: 80,
              height: 80,
              borderRadius: '50%',
              fontSize: 32,
              background: status !== 'idle' ? SANDBOX_THEME.accent : 'rgba(255,255,255,0.1)',
              boxShadow: status !== 'idle' ? `0 0 24px ${SANDBOX_THEME.accent}55` : 'none',
            }}
          >
            {status === 'speaking' ? '🔊' : '🎙️'}
          </button>
          {status === 'listening' && (
            <button type="button" onClick={completeInterview} style={{ ...btnStyle, marginTop: 12, background: SANDBOX_THEME.card, fontSize: 13 }}>
              Görüşmeyi Bitir
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const pageStyle: CSSProperties = {
  minHeight: '100dvh',
  background: SANDBOX_THEME.bg,
  color: SANDBOX_THEME.text,
  display: 'flex',
  flexDirection: 'column',
  padding: '0 16px',
  fontFamily: 'system-ui, sans-serif',
  maxWidth: 480,
  margin: '0 auto',
}

const btnStyle: CSSProperties = {
  padding: '12px 24px',
  borderRadius: 10,
  border: 'none',
  background: SANDBOX_THEME.accent,
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
  width: '100%',
}
