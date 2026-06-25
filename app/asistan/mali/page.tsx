"use client"
export const dynamic = "force-dynamic"
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { Conversation } from '@/components/AsistanConversation'
import MaliNav from '@/components/mali/MaliNav'

// supabase: init inside async functions only
type CS = 'idle'|'connecting'|'listening'|'speaking'|'error'
type Msg = { id: string; role: 'user'|'ai'; text: string }
type AC = Awaited<ReturnType<typeof Conversation.startSession>>

const DERYA = { name: 'Uzm. Derya Yilmaz', title: 'Mali Musavirlik AI Asistani', emoji: '💰', color: '#10B981' }

export default function MaliAsistanPage() {
  const router = useRouter()
  const [status, setStatus] = useState<CS>('idle')
  const [messages, setMessages] = useState<Msg[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [token, setToken] = useState<string|null>(null)
  const convRef = useRef<AC|null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem(Object.keys(localStorage).find(k=>k.includes('auth-token'))||'')
    const session = raw ? JSON.parse(raw) : null
    if (!session?.access_token) { router.push('/giris/mali'); return }
    setToken(session.access_token)
    return () => { void endConv() }
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function addMsg(role: 'user'|'ai', text: string) {
    if (!text?.trim()) return
    setMessages(p => [...p, { id: Date.now()+'-'+Math.random(), role, text: text.trim() }])
  }

  async function endConv() {
    const conv = convRef.current; convRef.current = null
    if (conv) try { await conv.endSession() } catch {}
  }

  async function startConv() {
    if (!token) { router.push('/giris/mali'); return }
    await endConv()
    setStatus('connecting'); setErrorMsg(''); setMessages([])
    try {
      const r = await fetch('/api/asistan/mali-signed-url', { headers: { Authorization: 'Bearer ' + token } })
      if (!r.ok) { const b = await r.json().catch(() => ({})); throw new Error((b as {error?:string}).error || 'Sunucu hatasi: ' + r.status) }
      const { signed_url } = await r.json()
      if (!signed_url) throw new Error('Baglanti adresi alinamadi')
      const conv = await Conversation.startSession({
        signedUrl: signed_url, connectionType: 'websocket',
        onConnect: () => { setStatus('listening'); setErrorMsg(''); addMsg('ai', 'Merhaba! Mali Musavir Uzm. Derya burada. Size nasil yardimci olabilirim?') },
        onDisconnect: (d: {reason:string;message:string}) => {
          convRef.current = null
          if (d.reason === 'error') { setErrorMsg(d.message); setStatus('error') }
          else setStatus('idle')
        },
        onError: (m: string) => { setErrorMsg(m); setStatus('error') },
        onMessage: ({ message, role }: {message:string;role:string}) => { addMsg(role==='user'?'user':'ai', message) },
        onModeChange: ({ mode }: {mode:string}) => { setStatus(mode==='speaking'?'speaking':'listening') },
        onStatusChange: ({ status: s }: {status:string}) => {
          if (s === 'connecting') setStatus('connecting')
          if (s === 'connected') setStatus('listening')
        }
      })
      convRef.current = conv
    } catch (e: unknown) { setErrorMsg(e instanceof Error ? e.message : String(e)); setStatus('error'); convRef.current = null }
  }

  const isActive = ['connecting','listening','speaking'].includes(status)
  const label = { idle:'Konusmak icin dokunun', connecting:'Baglanıyor...', listening:'Dinliyor - konusun', speaking:'Uzm. Derya konusuyor...', error:'Tekrar deneyin' }[status]

  return (
    <><MaliNav />
      <div style={{height:'100dvh',background:'#080F1A',display:'flex',flexDirection:'column',fontFamily:'system-ui,sans-serif',overflow:'hidden',userSelect:'none'}}>
      <style>{'@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}'}</style>
      <div style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:'12px',borderBottom:'1px solid rgba(255,255,255,.08)',background:'#0A1525'}}>
        <div onClick={() => { void endConv(); router.push('/dashboard/mali') }} style={{color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:'24px',padding:'4px'}}>&#8249;</div>
        <div style={{flex:1}}>
          <div style={{fontSize:'15px',fontWeight:600,color:'#fff'}}>{DERYA.name}</div>
          <div style={{fontSize:'11px',color:'rgba(255,255,255,.4)'}}>{DERYA.title}</div>
        </div>
        <img src='/derya-avatar.jpg' style={{width:32,height:32,borderRadius:'50%',objectFit:'cover'}} />
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:'10px'}}>
        {messages.length===0 && status==='idle' && (
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'12px',opacity:.4}}>
            <div style={{fontSize:'56px'}}>{DERYA.emoji}</div>
            <div style={{fontSize:'16px',fontWeight:600,color:'#fff'}}>{DERYA.name}</div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,.4)'}}>{DERYA.title}</div>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,.25)',marginTop:'8px',textAlign:'center',maxWidth:'260px',lineHeight:'1.6'}}>Mali musavirlik - Flash v2.5 sesli gorusme</div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{display:'flex',justifyContent:msg.role==='user'?'flex-end':'flex-start',alignItems:'flex-end',gap:'8px'}}>
            {msg.role==='ai' && <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'#10B981',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',flexShrink:0}}>{DERYA.emoji}</div>}
            <div style={{maxWidth:'78%',padding:'10px 14px',fontSize:'14px',lineHeight:'1.55',borderRadius:msg.role==='user'?'16px 16px 3px 16px':'16px 16px 16px 3px',background:msg.role==='user'?'#10B981':'#1A2B40',color:'#fff'}}>{msg.text}</div>
          </div>
        ))}
        {status==='connecting' && (
          <div style={{display:'flex',alignItems:'flex-end',gap:'8px'}}>
            <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'#10B981',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px'}}>{DERYA.emoji}</div>
            <div style={{padding:'12px 16px',background:'#1A2B40',borderRadius:'16px 16px 16px 3px',display:'flex',gap:'5px',alignItems:'center'}}>
              {[0,1,2].map(i => <div key={i} style={{width:'6px',height:'6px',borderRadius:'50%',background:'rgba(255,255,255,.4)',animation:'bounce 1.2s ease-in-out '+(i*.2)+'s infinite'}} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div style={{padding:'16px 16px 44px',display:'flex',flexDirection:'column',alignItems:'center',gap:'12px',borderTop:'1px solid rgba(255,255,255,.06)',background:'#0A1525'}}>
        {errorMsg && <div style={{fontSize:'12px',color:'#F87171',background:'rgba(239,68,68,.12)',padding:'10px 18px',borderRadius:'10px',textAlign:'center',maxWidth:'320px',lineHeight:'1.5'}}>{errorMsg}</div>}
        <div style={{fontSize:'13px',color:'rgba(255,255,255,.45)',display:'flex',alignItems:'center',gap:'8px'}}>
          {isActive && <div style={{width:'7px',height:'7px',borderRadius:'50%',background:status==='speaking'?'#10B981':status==='connecting'?'#F59E0B':'#22C55E',boxShadow:'0 0 8px '+(status==='speaking'?'#10B981':'#22C55E')}} />}
          {label}
        </div>
        <div onClick={isActive?()=>void endConv().then(()=>setStatus('idle')):()=>void startConv()} style={{width:'80px',height:'80px',borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'32px',background:isActive?'radial-gradient(circle,#10B981,#10B98188)':'rgba(255,255,255,.1)',border:'2px solid '+(isActive?'#10B981':'rgba(255,255,255,.2)'),boxShadow:isActive?'0 0 32px #10B98155':'none',transition:'all .25s'}}>
          {status==='connecting'?'⏳':status==='speaking'?'🔊':'🎤'}
        </div>
        <div style={{fontSize:'11px',color:'rgba(255,255,255,.2)'}}>{isActive?'Bitirmek icin dokunun':'Konusmak icin dokunun'}</div>
      </div>
    </div>
    </>
  )
}