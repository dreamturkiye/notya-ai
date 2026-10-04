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
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Conversation } from '@/components/AsistanConversation'
import { isAndroid, connectionErrorHelp, micPermissionHelp } from '@/lib/asistan/platform'
import { ensureDoctorAccessToken, DOKTOR_GIRIS } from '@/lib/doktor/clientAuth'
import { KlinikUzmanPersonas, type KlinikUzmanPersona } from '@/lib/ai/personas/klinik_uzmanlar'
import { SES_CALAR } from '@/lib/asistan/sesCalar'
import { CHROME_RENK, CHROME_FONT, CHROME_FONT_HREF } from '@/lib/doktor/chromeTheme'

type CS = 'idle'|'connecting'|'listening'|'speaking'|'error'
type Msg = { id: string; role: 'user'|'ai'; text: string }
type AC = Awaited<ReturnType<typeof Conversation.startSession>>

const SLUGS = Object.keys(KlinikUzmanPersonas)

/** KURAL — TÜRKÇE: ses SDK'sının / tarayıcının İngilizce hata metni ekrana çıkmaz; Türkçe mesajlar olduğu gibi kalır. */
function sesHataMesaji(m?: string): string {
  if (!m) return connectionErrorHelp()
  if (/[çğıİöşüÇĞÖŞÜ]/.test(m)) return m
  if (/denied|not-?allowed|permission/i.test(m)) return micPermissionHelp()
  return connectionErrorHelp()
}

export default function KlinikAsistanPage() {
  // Next cannot prerender a client page that calls useSearchParams at the top level; the
  // Suspense boundary is the documented fix. `export const dynamic` is IGNORED in "use client"
  // files — that mistake failed the first Vercel build of this branch.
  return (
    <Suspense fallback={null}>
      <KlinikAsistanInner />
    </Suspense>
  )
}

function KlinikAsistanInner() {
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

  // NOTYA-ASISTAN-AVATAR-01: empty idle must not scrollIntoView — same iPhone clip as /asistan.
  useEffect(() => {
    if (messages.length === 0) return
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

      const tekBeyin = Boolean(body.tek_beyin && body.notya_jeton)
      const conv = await Conversation.startSession({
        signedUrl: body.signed_url as string, connectionType: 'websocket',
        ...SES_CALAR,
        // NOTYA-TEK-BEYIN-CORE-01: Custom LLM copy — jeton in extra body; fat prompt override stays off.
        ...(tekBeyin ? { customLlmExtraBody: { notya_jeton: body.notya_jeton as string } } : {}),
        overrides: {
          agent: {
            ...(tekBeyin || !body.prompt ? {} : { prompt: { prompt: body.prompt as string } }),
            language: 'tr',
            firstMessage: body.first_message as string,
          },
          tts: { voiceId: body.voice_id as string },
        },
        onConnect: () => { setStatus('listening'); setErrorMsg('') },
        onDisconnect: (d: { reason: string; message?: string }) => {
          convRef.current = null
          if (d.reason === 'error') { setErrorMsg(d.message ? sesHataMesaji(d.message) : 'Bağlantı kesildi. Tekrar deneyin.'); setStatus('error') }
          else setStatus('idle')
        },
        onError: (m: string) => { setErrorMsg(sesHataMesaji(m)); setStatus('error') },
        onMessage: ({ message, role }: {message:string;role:string}) => { addMsg(role==='user'?'user':'ai', message) },
        onModeChange: ({ mode }: {mode:string}) => { setStatus(mode==='speaking'?'speaking':'listening') },
        onStatusChange: ({ status: s }: {status:string}) => {
          if (s === 'connecting') setStatus('connecting')
          if (s === 'connected') setStatus('listening')
        }
      })
      convRef.current = conv
    } catch (e: unknown) { setErrorMsg(sesHataMesaji(e instanceof Error ? e.message : String(e))); setStatus('error'); convRef.current = null }
  }

  const isActive = ['connecting','listening','speaking'].includes(status)
  const label = { idle:'Konuşmak için dokunun', connecting:'Bağlanıyor...', listening:'Dinliyor — konuşun', speaking:`${p.name.split(' ').slice(-2).join(' ')} konuşuyor...`, error:'Tekrar deneyin' }[status]

  return (
    <div style={{height:'calc(100dvh - var(--sat) - var(--sab))',minHeight:0,background:CHROME_RENK.cream,display:'flex',flexDirection:'column',fontFamily:CHROME_FONT.sans,color:CHROME_RENK.ink,overflow:'hidden',userSelect:'none'}}>
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <style>{'@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}'}</style>

      <div style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:'12px',borderBottom:'1px solid rgba(58,44,34,0.08)',background:CHROME_RENK.paper}}>
        <div onClick={() => { void endConv(); router.push('/dashboard/klinik') }} style={{color:CHROME_RENK.muted,cursor:'pointer',fontSize:'24px',padding:'4px'}}>&#8249;</div>
        <div style={{flex:1}}>
          <div style={{fontSize:'15px',fontWeight:600,color:CHROME_RENK.ink,fontFamily:CHROME_FONT.serif}}>{p.name}</div>
          <div style={{fontSize:'11px',color:CHROME_RENK.muted}}>{p.title}</div>
        </div>
        <div style={{width:32,height:32,borderRadius:'50%',background:p.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>{p.emoji}</div>
      </div>

      {/* Persona picker — one expert per discipline, switching ends the running session. */}
      <div style={{display:'flex',gap:'8px',overflowX:'auto',padding:'10px 16px',borderBottom:'1px solid rgba(58,44,34,0.08)',background:CHROME_RENK.paper,WebkitOverflowScrolling:'touch'}}>
        {SLUGS.map(s => {
          const u = KlinikUzmanPersonas[s]
          const active = s === slug
          return (
            <button key={s} onClick={() => void pickPersona(s)} style={{flexShrink:0,display:'flex',alignItems:'center',gap:'6px',padding:'7px 12px',borderRadius:'999px',border:'1px solid '+(active?u.color:'rgba(58,44,34,0.14)'),background:active?u.color+'22':'transparent',color:active?CHROME_RENK.ink:CHROME_RENK.muted,fontSize:'12px',cursor:'pointer',whiteSpace:'nowrap'}}>
              <span>{u.emoji}</span>{u.specialty}
            </button>
          )
        })}
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:'10px'}}>
        {messages.length===0 && status==='idle' && (
          <div style={{marginBlock:'auto',display:'flex',flexDirection:'column',alignItems:'center',gap:'12px',opacity:.45,width:'100%',flexShrink:0,paddingTop:4}}>
            <div style={{fontSize:'56px'}}>{p.emoji}</div>
            <div style={{fontSize:'16px',fontWeight:600,color:CHROME_RENK.ink,fontFamily:CHROME_FONT.serif}}>{p.name}</div>
            <div style={{fontSize:'13px',color:CHROME_RENK.muted}}>{p.title}</div>
            <div style={{fontSize:'12px',color:CHROME_RENK.muted,marginTop:'8px',textAlign:'center',maxWidth:'280px',lineHeight:'1.6'}}>{p.specialty} — sesli görüşme. Mikrofona dokunun, Türkçe konuşun.</div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{display:'flex',justifyContent:msg.role==='user'?'flex-end':'flex-start',alignItems:'flex-end',gap:'8px'}}>
            {msg.role==='ai' && <div style={{width:'28px',height:'28px',borderRadius:'50%',background:p.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',flexShrink:0}}>{p.emoji}</div>}
            <div style={{maxWidth:'78%',padding:'10px 14px',fontSize:'14px',lineHeight:'1.55',borderRadius:msg.role==='user'?'16px 16px 3px 16px':'16px 16px 16px 3px',background:msg.role==='user'?p.color:CHROME_RENK.paper,border:msg.role==='user'?'none':'1px solid '+CHROME_RENK.border,color:msg.role==='user'?'#fff':CHROME_RENK.ink}}>{msg.text}</div>
          </div>
        ))}
        {status==='connecting' && (
          <div style={{display:'flex',alignItems:'flex-end',gap:'8px'}}>
            <div style={{width:'28px',height:'28px',borderRadius:'50%',background:p.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px'}}>{p.emoji}</div>
            <div style={{padding:'12px 16px',background:CHROME_RENK.paper,border:'1px solid '+CHROME_RENK.border,borderRadius:'16px 16px 16px 3px',display:'flex',gap:'5px',alignItems:'center'}}>
              {[0,1,2].map(i => <div key={i} style={{width:'6px',height:'6px',borderRadius:'50%',background:CHROME_RENK.muted,animation:'bounce 1.2s ease-in-out '+(i*.2)+'s infinite'}} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{padding:'16px 16px 24px',display:'flex',flexDirection:'column',alignItems:'center',gap:'12px',borderTop:'1px solid rgba(58,44,34,0.08)',background:CHROME_RENK.paper}}>
        {errorMsg && <div style={{fontSize:'12px',color:CHROME_RENK.warn,background:'rgba(164,91,62,0.08)',border:'1px solid rgba(164,91,62,0.25)',padding:'10px 18px',borderRadius:'10px',textAlign:'center',maxWidth:'320px',lineHeight:'1.5'}}>{errorMsg}</div>}
        <div style={{fontSize:'13px',color:CHROME_RENK.muted,display:'flex',alignItems:'center',gap:'8px'}}>
          {isActive && <div style={{width:'7px',height:'7px',borderRadius:'50%',background:status==='speaking'?p.color:status==='connecting'?'#F59E0B':'#22C55E',boxShadow:'0 0 8px '+(status==='speaking'?p.color:'#22C55E')}} />}
          {label}
        </div>
        <div onClick={isActive?()=>void endConv().then(()=>setStatus('idle')):()=>void startConv()} style={{width:'80px',height:'80px',borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'32px',background:isActive?`radial-gradient(circle, ${p.color}, ${p.color}88)`:'rgba(58,44,34,0.06)',border:'2px solid '+(isActive?p.color:CHROME_RENK.muted),boxShadow:isActive?`0 0 32px ${p.color}55`:'none',transition:'all .25s'}}>
          {status==='connecting'?'⏳':status==='speaking'?'🔊':'🎤'}
        </div>
        <div style={{fontSize:'11px',color:CHROME_RENK.muted}}>{isActive?'Bitirmek için dokunun':'Konuşmak için dokunun'}</div>
      </div>
    </div>
  )
}
