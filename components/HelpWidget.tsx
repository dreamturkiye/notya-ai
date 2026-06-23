'use client'
import { useState, useEffect, useRef } from 'react'

interface HelpWidgetProps {
  professionType: 'doktor' | 'mali_müşavirlik' | 'avukat'
  userName?: string
  isFirstLogin?: boolean
}

export default function HelpWidget({ professionType, userName, isFirstLogin }: HelpWidgetProps) {
  const [showModal, setShowModal] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isFirstLogin) {
      setShowModal(localStorage.getItem('notya_onboarded') !== '1')
    }
  }, [isFirstLogin])

  const closeModal = () => {
    localStorage.setItem('notya_onboarded', '1')
    setShowModal(false)
  }

  const toggleChat = () => {
    setShowChat(!showChat)
  }

  useEffect(() => {
    if (showChat) {
      setMessages([
        {
          role: 'assistant',
          content:
            professionType === 'doktor'
              ? 'Merhaba! Prof. Ayse ile nasil calisacaginizi veya dashboard hakkinda sorulariniz icin burdayim.'
              : professionType === 'mali_müşavirlik'
              ? 'Merhaba! Uzm. Derya ile nasil calisacaginizi veya beyan takvimi hakkinda sorulariniz icin burdayim.'
              : 'Merhaba! 9 uzman avukatimiz veya sure takibi hakkinda sorulariniz icin burdayim.',
        },
      ])
    }
  }, [showChat, professionType])

  const sendMessage = async () => {
    if (input.trim() === '') return
    setLoading(true)
    setMessages((prev) => [...prev, { role: 'user', content: input }])
    setInput('')

    try {
      const response = await fetch('/api/help/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          professionType,
          history: messages.slice(-6),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const chatArea = document.getElementById('chat-area')
    if (chatArea) {
      chatArea.scrollTop = chatArea.scrollHeight
    }
  }, [messages])

  return (
    <>
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ maxWidth: '520px', width: '100%', backgroundColor: '#fff', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#006699', borderRadius: '8px', marginRight: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontSize: '24px', fontWeight: '700' }}>N</span>
              </div>
              <h3>Hoş Geldiniz!</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {professionType === 'doktor'
                ? [
                    'Prof. Ayse ile sesli konusin - mikrofona dokunun',
                    'Hasta notlariniz otomatik SOAP formatinda kaydedilir',
                    'Dashboard\'unuzdan tum notlara ve istatistiklere erisebilirsiniz',
                  ]
                : professionType === 'mali_müşavirlik'
                ? [
                    'Uzm. Derya ile mali sorularinizi konusin',
                    'Beyan takvimi otomatik takip edilir ve hatirlatilir',
                    'Müşterilerinizi ve islemlerinizi dashboard\'dan yonetin',
                  ]
                : [
                    '9 uzman avukatla hukuki konulari konusin',
                    'Süre takibi ve dilekçe oluşturma otomatiktir',
                    'Müvekkillerinizi ve davalarinizi dashboard\'dan yonetin',
                  ]}.map((step, index) => (
                <div key={index} style={{ padding: '16px', backgroundColor: '#F4F7F6', borderRadius: '8px' }}>
                  <span style={{ color: '#006699', fontSize: '24px', fontWeight: '700', marginRight: '8px' }}>{index + 1}.</span>
                  {step}
                </div>
              ))}
            </div>
            <button onClick={closeModal} style={{ marginTop: '32px', padding: '12px 24px', backgroundColor: '#FF6B4B', color: '#fff', fontSize: '16px', fontWeight: '700', borderRadius: '8px' }}>
              Başlayalım
            </button>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#6B7280' }}>Yardım için ? butonunu kullanin</div>
          </div>
        </div>
      )}
      <button onClick={toggleChat} style={{ position: 'fixed', bottom: '24px', right: '24px', width: '52px', height: '52px', backgroundColor: '#006699', color: '#fff', fontSize: '20px', fontWeight: '700', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
        {showChat ? 'x' : '?'}
      </button>
      {showChat && (
        <div style={{ position: 'fixed', bottom: '80px', right: '24px', width: '380px', height: '480px', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '16px', display: 'flex', flexDirection: 'column', zIndex: 999 }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', fontSize: '20px', fontWeight: '700', color: '#1F2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Notya AI Yardım</span>
            <div style={{ backgroundColor: '#e5e7eb', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#6B7280' }}>{professionType}</div>
          </div>
          <div id="chat-area" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div
                  style={{
                    padding: '12px 16px',
                    maxWidth: '70%',
                    borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    backgroundColor: msg.role === 'user' ? '#006699' : '#F4F7F6',
                    color: msg.role === 'user' ? '#fff' : '#1F2937',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'center', marginTop: '8px' }}>
                <span style={{ color: '#006699', fontSize: '12px', fontWeight: '700' }}>.</span>
                <span style={{ color: '#006699', fontSize: '12px', fontWeight: '700' }}>.</span>
                <span style={{ color: '#006699', fontSize: '12px', fontWeight: '700' }}>.</span>
              </div>
            )}
          </div>
          <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              style={{ flex: 1, padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', marginRight: '8px' }}
            />
            <button onClick={sendMessage} style={{ padding: '8px 16px', backgroundColor: '#006699', color: '#fff', fontSize: '14px', fontWeight: '700', borderRadius: '4px' }}>
              Gönder
            </button>
          </div>
        </div>
      )}
    </>
  )
}