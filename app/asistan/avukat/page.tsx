'use client'
export const dynamic = "force-dynamic"
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { Conversation } from '@/components/AsistanConversation'

// supabase: use localStorage token only
type CS = 'idle'|'connecting'|'listening'|'speaking'|'error'
type Msg = { id: string; role: 'user'|'ai'; text: string }
type AC = Awaited<ReturnType<typeof Conversation.startSession>>

const PERSONAS = {
  kemalbey:    { name: 'Kemal Celik',   title: 'Ceza Hukuku',     emoji: '⚖️',  color: '#DC2626', branch: 'ceza' },
  selinhanim:  { name: 'Selin Arslan',  title: 'Aile Hukuku',     emoji: '👪', color: '#EC4899', branch: 'aile' },
  muratbey:    { name: 'Murat Ozturk',  title: 'Ticaret Hukuku',  emoji: '💼',  color: '#2563EB', branch: 'ticaret' },
  dilekhanim:  { name: 'Dilek Sahin',   title: 'Is Hukuku',       emoji: '📝',  color: '#7C3AED', branch: 'is' },
  halukbey:    { name: 'Haluk Demir',   title: 'Gayrimenkul',     emoji: '🏠',  color: '#D97706', branch: 'gayrimenkul' },
  aysehanim:   { name: 'Ayse Kaya',     title: 'Icra & Iflas',    emoji: '💰',  color: '#059669', branch: 'icra' },
  canbey:      { name: 'Can Yilmaz',    title: 'Idare Hukuku',    emoji: '🏛️', color: '#0891B2', branch: 'idare' },
  zeynephanim: { name: 'Zeynep Aktay',  title: 'Tuketici Hukuku', emoji: '🛒',  color: '#BE185D', branch: 'tuketici' },
  borabey:     { name: 'Bora Yildiz',   title: 'Bilisim & KVKK',  emoji: '💻',  color: '#6D28D9', branch: 'bilisim' },
}  as const
type PKey = keyof typeof PERSONAS

export default function AvukatAsistanPage() {
  const router = useRouter()
  const [pk, setPk] = useState<PKey>('kemalbey')
  const [status, setStatus] = useState<CS>('idle')
  const [messages, setMessages] = useState<Msg[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [token, setToken] = useState<string|null>(null)
  const convRef = useRef<AC|null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/giris/avukat'); return }
      setToken(session.access_token)
    })
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
    if (!token) { router.push('/giris/avukat'); return }
    await endConv()
    setStatus('connecting'); setErrorMsg(''); setMessages([])
    try {
      const r = await fetch('/api/asistan/avukat-signed-url?persona=' + pk, { headers: { Authorization: 'Bearer ' + token } })
      if (!r.ok) { const b = await r.json().catch(() => ({})); throw new Error((b as {error?:string}).error || 'Sunucu hatasi: ' + r.status) }
      const { signed_url } = await r.json()
      if (!signed_url) throw new Error('Baglanti adresi alinamadi')
      const p = PERSONAS[pk]
      const conv = await Conversation.startSession({
        signedUrl: signed_url, connectionType: 'websocket',
        onConnect: () => { setStatus('listening'); setErrorMsg(''); addMsg('ai', p.name + ' burada. ' + p.title + ' konusunda nasil yardimci olabilirim?') },
        onDisconnect: (d: {reason:string;message:string}) => { convRef.current=null; if(d.reason==='error'){setErrorMsg(d.message);setStatus('error')}else setStatus('idle') },
        onError: (m: string) => { setErrorMsg(m); setStatus('error') },
        onMessage: ({ message, role }: {message:string;role:string}) => { addMsg(role==='user'?'user':'ai', message) },
        onModeChange: ({ mode }: {mode:string}) => { setStatus(mode==='speaking'?'speaking':'listening') },
        onStatusChange: ({ status: s }: {status:string}) => { if(s==='connecting')setStatus('connecting'); if(s==='connected')setStatus('listening') }
      })
      convRef.current = conv
    } catch (e: unknown) { setErrorMsg(e instanceof Error?e.message:String(e)); setStatus('error'); convRef.current=null }
  }

  function switchPersona(key: PKey) { void endConv(); setPk(key); setMessages([]); setErrorMsg('') }

  const persona = PERSONAS[pk]
  const isActive = ['connecting','listening','speaking'].includes(status)
  const label = ({idle:'Konusmak icin dokunun',connecting:'Baglanıyor...',listening:'Dinliyor',speaking:persona.name+' konusuyor...',error:'Tekrar deneyin'} as Record<CS,string>)[status]

  return (
    <div style={{height:'100dvh',background:'#080F1A',display:'flex',flexDirection:'column',fontFamily:'system-ui,sans-serif',overflow:'hidden',userSelect:'none'}}>
      <style>{'@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}'}</style>
      <div style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:'8px',borderBottom:'1px solid rgba(255,255,255,.08)',background:'#0A1525',overflowX:'auto'}}>
        <div onClick={() => { void endConv(); router.push('/dashboard/avukat') }} style={{color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:'24px',padding:'4px 8px',flexShrink:0}}>&#8249;</div>
        {(Object.entries(PERSONAS) as [PKey, typeof PERSONAS[PKey]][]).map(([key, p]) => (
          <div key={key} onClick={() => switchPersona(key)} style={{padding:'5px 10px',borderRadius:'16px',fontSize:'11px',cursor:'pointer',fontWeight:pk===key?700:400,background:pk===key?p.color:'rgba(255,255,255,.08)',color:pk===key?'#fff':'rgba(255,255,255,.4)',border:'1px solid '+(pk===key?p.color:'rgba(255,255,255,.1)'),whiteSpace:'nowrap',flexShrink:0}}>
            {p.emoji} {p.name.split(' ')[0]}
          </div>
        ))}
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:'10px'}}>
        {messages.length===0 && status==='idle' && (
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'12px',opacity:.4}}>
            <div style={{fontSize:'56px'}}>{persona.emoji}</div>
            <div style={{fontSize:'16px',fontWeight:600,color:'#fff'}}>{persona.name}</div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,.4)'}}>{persona.title}</div>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,.25)',marginTop:'8px',textAlign:'center',maxWidth:'260px',lineHeight:'1.6'}}>Hukuki danismanlik - Flash v2.5 sesli gorusme</div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{display:'flex',justifyContent:msg.role==='user'?'flex-end':'flex-start',alignItems:'flex-end',gap:'8px'}}>
            {msg.role==='ai' && <div style={{width:'28px',height:'28px',borderRadius:'50%',background:persona.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',flexShrink:0}}>{persona.emoji}</div>}
            <div style={{maxWidth:'78%',padding:'10px 14px',fontSize:'14px',lineHeight:'1.55',borderRadius:msg.role==='user'?'16px 16px 3px 16px':'16px 16px 16px 3px',background:msg.role==='user'?persona.color:'#1A2B40',color:'#fff'}}>{msg.text}</div>
          </div>
        ))}
        {status==='connecting' && (
          <div style={{display:'flex',alignItems:'flex-end',gap:'8px'}}>
            <div style={{width:'28px',height:'28px',borderRadius:'50%',background:persona.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px'}}>{persona.emoji}</div>
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
          {isActive && <div style={{width:'7px',height:'7px',borderRadius:'50%',background:status==='speaking'?persona.color:status==='connecting'?'#F59E0B':'#22C55E',boxShadow:'0 0 8px '+(status==='speaking'?persona.color:'#22C55E')}} />}
          {label}
        </div>
        <div onClick={isActive?()=>void endConv().then(()=>setStatus('idle')):()=>void startConv()} style={{width:'80px',height:'80px',borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'32px',background:isActive?'radial-gradient(circle,'+persona.color+','+persona.color+'88)':'rgba(255,255,255,.1)',border:'2px solid '+(isActive?persona.color:'rgba(255,255,255,.2)'),boxShadow:isActive?'0 0 32px '+persona.color+'55':'none',transition:'all .25s'}}>
          {status==='connecting'?'⏳':status==='speaking'?'🔊':'🎤'}
        </div>
        <div style={{fontSize:'11px',color:'rgba(255,255,255,.2)'}}>{isActive?'Bitirmek icin dokunun':'Konusmak icin dokunun'}</div>
      </div>
    </div>
  )
}