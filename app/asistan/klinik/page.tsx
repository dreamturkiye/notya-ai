"use client"

export const dynamic = "force-dynamic"

/**
 * NOTYA-KLINIK-02 — /asistan/klinik: one voice expert per clinic discipline.
 *
 * Same voice UX as /asistan/mali (tap to talk, live transcript) plus what mali doesn't need:
 * a persona picker, because a clinic has ten disciplines and the doctor in the chair changes.
 * Personas come from lib/ai/personas/klinik_uzmanlar; prompt/voice/first message are applied as
 * ConvAI overrides on the shared base agents, so no ElevenLabs setup is needed per persona.
 */
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Conversation } from '@/components/AsistanConversation'
import { isAndroid } from '@/lib/asistan/platform'
import { ensureDoctorAccessToken, DOKTOR_GIRIS } from '@/lib/doktor/clientAuth'
import { KlinikUzmanPersonas, type KlinikUzmanPersona } from '@/lib/ai/personas/klinik_uzmanlar'

type CS = 'idle'|'connecting'|'listening'|'speaking'|'error'
type Msg = { id: string; role: 'user'|'ai'; text: string }
type AC = Awaited<ReturnType<typeof Conversation.startSession>>

const SLUGS = Object.keys(KlinikUzmanPersonas)

export default function KlinikAsistanPage() {
  const router = useRouter()
  const search = useSearchParams()
  const istenen = search.get('uzman') || ''
  const [slug, setSlug] = useState<string>(SLUGS.includes(istenen) ? istenen : 'sac-ekimi')
  const [status, setStatus] = useState<CS>('idle')
  const [messages, setMessages] = useState<Msg[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [token, setToken] = useState<string|null>(null)
  const convRef = useRef<AC|null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const p: KlinikUzmanPersona = KlinikUzmanPersonas[slug]

  useEffect(() => {
    void (async () => {
      const t = await ensureDoctorAccessToken()
      if (!t) { router.push(DOKTOR_GIRIS); return }
      setToken(t)
    })()
    return () => { void endConv() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function addMsg(role: 'user'|'ai', text: string) {
    if (!text?.trim()) return
    setMessages(prev => [...prev, { id: Date.now()+'-'+Math.random(), role, text: text.trim() }])
  }

  async function endConv() {
    const conv = convRef.current; convRef.current = null
    if (conv) try { await conv.endSession() } catch {}
  }

  async function pickPersona(next: string) {
    if (next === slug) return
    await endConv()
    setStatus('idle'); setMessages([]); setErrorMsg('')
    setSlug(next)
  }

  async function startConv() {
    if (!token) { router.push(DOKTOR_GIRIS); return }
    await endConv()
    setStatus('connecting'); setErrorMsg(''); setMessages([])
    try {
      const r = await fetch(`/api/asistan/klinik-signed-url?persona=${slug}`, { headers: { Authorization: 'Bearer ' + token } })
      if (!r.ok) { const b = await r.json().catch(() => ({})); throw new Error((b as {error?:string}).error || 'Sunucu hatası: ' + r.status) }
      const body = await r.json()
      if (!body.signed_url) throw new Error('Bağlantı adresi alınamadı')

      if (isAndroid() && typeof window !== 'undefined') {
        try { const Ctx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }); const ctx = new (Ctx.AudioContext || Ctx.webkitAudioContext!)(); await ctx.resume() } catch {}
      }

      const conv = await Conversation.startSession({
        signedUrl: body.signed_url as string, connectionType: 'websocket',
        overrides: {
          agent: {
            prompt: { prompt: body.prompt as string },
            language: 'tr',
            firstMessage: body.first_message as string,
          },
          tts: { voiceId: body.voice_id as string },
        },
        onConnect: () => { setStatus('listening'); setErrorMsg('') },
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
  const label = { idle:'Konuşmak için dokunun', connecting:'Bağlanıyor...', listening:'Dinliyor — konuşun', speaking:`${p.name.split(' ').slice(-2).join(' ')} konuşuyor...`, error:'Tekrar deneyin' }[status]

  return (
    <div style={{height:'calc(100dvh - var(--sat) - var(--sab))',minHeight:0,background:'#080F1A',display:'flex',flexDirection:'column',fontFamily:'system-ui,sans-serif',overflow:'hidden',userSelect:'none'}}>
      <style>{'@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}'}</style>

      <div style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:'12px',borderBottom:'1px solid rgba(255,255,255,.08)',background:'#0A1525'}}>
        <div onClick={() => { void endConv(); router.push('/dashboard/klinik') }} style={{color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:'24px',padding:'4px'}}>&#8249;</div>
        <div style={{flex:1}}>
          <div style={{fontSize:'15px',fontWeight:600,color:'#fff'}}>{p.name}</div>
          <div style={{fontSize:'11px',color:'rgba(255,255,255,.4)'}}>{p.title}</div>
        </div>
        <div style={{width:32,height:32,borderRadius:'50%',background:p.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>{p.emoji}</div>
      </div>

      {/* Persona picker — one expert per discipline, switching ends the running session. */}
      <div style={{display:'flex',gap:'8px',overflowX:'auto',padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,.06)',background:'#0A1525',WebkitOverflowScrolling:'touch'}}>
        {SLUGS.map(s => {
          const u = KlinikUzmanPersonas[s]
          const active = s === slug
          return (
            <button key={s} onClick={() => void pickPersona(s)} style={{flexShrink:0,display:'flex',alignItems:'center',gap:'6px',padding:'7px 12px',borderRadius:'999px',border:'1px solid '+(active?u.color:'rgba(255,255,255,.14)'),background:active?u.color+'22':'transparent',color:active?'#fff':'rgba(255,255,255,.6)',fontSize:'12px',cursor:'pointer',whiteSpace:'nowrap'}}>
              <span>{u.emoji}</span>{u.specialty}
            </button>
          )
        })}
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:'10px'}}>
        {messages.length===0 && status==='idle' && (
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'12px',opacity:.45}}>
            <div style={{fontSize:'56px'}}>{p.emoji}</div>
            <div style={{fontSize:'16px',fontWeight:600,color:'#fff'}}>{p.name}</div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,.4)'}}>{p.title}</div>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,.25)',marginTop:'8px',textAlign:'center',maxWidth:'280px',lineHeight:'1.6'}}>{p.specialty} — sesli görüşme. Mikrofona dokunun, Türkçe konuşun.</div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{display:'flex',justifyContent:msg.role==='user'?'flex-end':'flex-start',alignItems:'flex-end',gap:'8px'}}>
            {msg.role==='ai' && <div style={{width:'28px',height:'28px',borderRadius:'50%',background:p.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',flexShrink:0}}>{p.emoji}</div>}
            <div style={{maxWidth:'78%',padding:'10px 14px',fontSize:'14px',lineHeight:'1.55',borderRadius:msg.role==='user'?'16px 16px 3px 16px':'16px 16px 16px 3px',background:msg.role==='user'?p.color:'#1A2B40',color:'#fff'}}>{msg.text}</div>
          </div>
        ))}
        {status==='connecting' && (
          <div style={{display:'flex',alignItems:'flex-end',gap:'8px'}}>
            <div style={{width:'28px',height:'28px',borderRadius:'50%',background:p.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px'}}>{p.emoji}</div>
            <div style={{padding:'12px 16px',background:'#1A2B40',borderRadius:'16px 16px 16px 3px',display:'flex',gap:'5px',alignItems:'center'}}>
              {[0,1,2].map(i => <div key={i} style={{width:'6px',height:'6px',borderRadius:'50%',background:'rgba(255,255,255,.4)',animation:'bounce 1.2s ease-in-out '+(i*.2)+'s infinite'}} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{padding:'16px 16px 24px',display:'flex',flexDirection:'column',alignItems:'center',gap:'12px',borderTop:'1px solid rgba(255,255,255,.06)',background:'#0A1525'}}>
        {errorMsg && <div style={{fontSize:'12px',color:'#F87171',background:'rgba(239,68,68,.12)',padding:'10px 18px',borderRadius:'10px',textAlign:'center',maxWidth:'320px',lineHeight:'1.5'}}>{errorMsg}</div>}
        <div style={{fontSize:'13px',color:'rgba(255,255,255,.45)',display:'flex',alignItems:'center',gap:'8px'}}>
          {isActive && <div style={{width:'7px',height:'7px',borderRadius:'50%',background:status==='speaking'?p.color:status==='connecting'?'#F59E0B':'#22C55E',boxShadow:'0 0 8px '+(status==='speaking'?p.color:'#22C55E')}} />}
          {label}
        </div>
        <div onClick={isActive?()=>void endConv().then(()=>setStatus('idle')):()=>void startConv()} style={{width:'80px',height:'80px',borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'32px',background:isActive?`radial-gradient(circle, ${p.color}, ${p.color}88)`:'rgba(255,255,255,.1)',border:'2px solid '+(isActive?p.color:'rgba(255,255,255,.2)'),boxShadow:isActive?`0 0 32px ${p.color}55`:'none',transition:'all .25s'}}>
          {status==='connecting'?'⏳':status==='speaking'?'🔊':'🎤'}
        </div>
        <div style={{fontSize:'11px',color:'rgba(255,255,255,.2)'}}>{isActive?'Bitirmek için dokunun':'Konuşmak için dokunun'}</div>
      </div>
    </div>
  )
}
