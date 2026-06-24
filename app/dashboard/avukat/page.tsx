'use client'
import GameChangerTabs from '@/components/avukat/GameChangerTabs'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const PERSONAS = [
  { id: 'kemalbey', name: 'Kemal Celik', title: 'Ceza Hukuku', color: '#DC2626' },
  { id: 'selinhanim', name: 'Selin Arslan', title: 'Aile Hukuku', color: '#EC4899' },
  { id: 'muratbey', name: 'Murat Ozturk', title: 'Ticaret Hukuku', color: '#2563EB' },
  { id: 'dilekhanim', name: 'Dilek Sahin', title: 'Is Hukuku', color: '#7C3AED' },
  { id: 'halukbey', name: 'Haluk Demir', title: 'Gayrimenkul', color: '#D97706' },
  { id: 'aysehanim', name: 'Ayse Kaya', title: 'Icra ve Iflas', color: '#059669' },
  { id: 'canbey', name: 'Can Yilmaz', title: 'Idare Hukuku', color: '#0891B2' },
  { id: 'zeynephanim', name: 'Zeynep Aktay', title: 'Tuketici Hukuku', color: '#BE185D' },
  { id: 'borabey', name: 'Bora Yildiz', title: 'Bilisim & KVKK', color: '#6D28D9' },
]

export default function AvukatDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<Record<string,unknown> | null>(null)
  const [sessions, setSessions] = useState<Record<string,unknown>[]>([])
  const [sureler, setSureler] = useState<Record<string,unknown>[]>([])
  const [muvekkilCount, setMuvekkilCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activePersona, setActivePersona] = useState<string | null>(null)
  const [chatMsg, setChatMsg] = useState('')
  const [chatHistory, setChatHistory] = useState<{role:string;content:string}[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard'|'chat'|'sure'|'muvekkiller'|'dilekce'|'ictihat'|'sozlesme'>('dashboard')
  const [avukatToken, setAvukatToken] = useState('')

  const now = new Date()
  const hour = parseInt(new Intl.DateTimeFormat('tr-TR', { hour: 'numeric', hour12: false, timeZone: 'Europe/Istanbul' }).format(now))
  const greeting = hour < 12 ? 'Gunaydin' : hour < 18 ? 'Iyi Gunler' : 'Iyi Aksamlar'

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/giris/avukat'); return }
      const { data: u } = await supabase.from('users').select('*').eq('id', session.user.id).single()
      if (!u) { router.push('/giris/avukat'); return }
      if (u.profession_type !== 'avukat') { router.push('/giris/avukat'); return }
      setUser(u)
      const [sessRes, sureRes, muvRes] = await Promise.all([
        supabase.from('avukat_sessions').select('*').eq('avukat_id', session.user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('sure_takibi').select('*').eq('avukat_id', session.user.id).eq('tamamlandi', false).order('son_gun', { ascending: true }).limit(5),
        supabase.from('musevvekiller').select('id', { count: 'exact' }).eq('avukat_id', session.user.id)
      ])
      setSessions(sessRes.data || [])
      setSureler(sureRes.data || [])
      setMuvekkilCount(muvRes.count || 0)
      setLoading(false)
      const {data:{session:s2}} = await supabase.auth.getSession(); if(s2) setAvukatToken(s2.access_token||"")
      supabase.auth.getSession().then(({data:{session}})=>{ if(session) setAvukatToken(session.access_token||"")})
    })
  }, [])

  async function sendChat() {
    if (!chatMsg.trim() || !activePersona || chatLoading) return
    const userMsg = chatMsg.trim()
    setChatMsg('')
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }])
    setChatLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/asistan/avukat-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (session?.access_token || '') },
        body: JSON.stringify({ message: userMsg, personaId: activePersona })
      })
      const data = await res.json()
      const reply = data.speech || data.message || data.error || 'Yanit alinamadi.'
      setChatHistory(prev => [...prev, { role: 'assistant', content: reply }])
    } catch { setChatHistory(prev => [...prev, { role: 'assistant', content: 'Baglanti hatasi.' }]) }
    setChatLoading(false)
  }

  const urgentSureler = sureler.filter(s => {
    const d = String(s.son_gun).split('.').reverse().join('-')
    return (new Date(d).getTime() - now.getTime()) / 86400000 <= 3
  })

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div>Yukleniyor...</div></div>

  return (
    <>
      <div style={{background:'linear-gradient(135deg,#1E3A5F 0%,#2563EB 100%)',padding:'20px 24px',color:'#fff',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:22,fontWeight:700}}>Notya Hukuk</div>
          <div style={{fontSize:14,opacity:.8}}>{greeting}, {String(user?.full_name || user?.name || 'Avukat')}</div>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/giris/avukat'))} style={{background:'rgba(255,255,255,.15)',border:'none',color:'#fff',padding:'8px 16px',borderRadius:8,cursor:'pointer'}}>Cikis</button>
      </div>

      <div style={{background:'#fff',borderBottom:'1px solid #E2E8F0',padding:'0 24px',display:'flex',gap:4}}>
        {([['dashboard','Ozet'],['chat','Asistan'],['sure','Sure Takibi'],['muvekkiller','Muvekkillerim'],['dilekce','Dilekce'],['ictihat','Ictihat'],['sozlesme','Sozlesme']] as const).map(([tab,label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{padding:'12px 20px',border:'none',borderBottom:activeTab===tab?'2px solid #2563EB':'2px solid transparent',background:'transparent',color:activeTab===tab?'#2563EB':'#64748B',cursor:'pointer',fontSize:14,fontWeight:500}}>{label}</button>
        ))}
      </div>

      <div style={{padding:'24px',background:'#F8FAFC',minHeight:'calc(100vh - 120px)'}}>

        {activeTab === 'dashboard' && (
          <div>
            {urgentSureler.length > 0 && (
              <div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:10,padding:'12px 16px',marginBottom:20}}>
                <span style={{color:'#DC2626',fontWeight:600}}>Dikkat: {urgentSureler.length} acil sure yaklasıyor!</span>
              </div>
            )}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
              {[
                { label:'Toplam Seans', value: sessions.length, color:'#2563EB' },
                { label:'Aktif Sure', value: sureler.length, color: sureler.length > 0 ? '#DC2626' : '#059669' },
                { label:'Muvekkil', value: muvekkilCount, color:'#7C3AED' },
              ].map((s,i) => (
                <div key={i} style={{background:'#fff',borderRadius:12,padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,.06)',borderLeft:'4px solid ' + s.color}}>
                  <div style={{fontSize:28,fontWeight:700,color:s.color}}>{s.value}</div>
                  <div style={{fontSize:13,color:'#64748B'}}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{background:'linear-gradient(135deg,#1E3A5F 0%,#7C3AED 100%)',borderRadius:12,padding:'16px 20px',marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}} onClick={() => router.push('/asistan/avukat')}>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:'#fff'}}>Sesli Hukuk Asistani</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,.7)',marginTop:2}}>9 uzman avukat ile 2-yonlu sesli gorusme</div>
              </div>
              <div style={{fontSize:36}}>🎙️</div>
            </div>
            <div style={{fontWeight:700,fontSize:16,marginBottom:14,color:'#1E293B'}}>Uzman Asistanlariniz</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:24}}>
              {PERSONAS.map(p => (
                <div key={p.id} onClick={() => { setActivePersona(p.id); setActiveTab('chat') }} style={{background:'#fff',borderRadius:12,padding:'18px',boxShadow:'0 1px 4px rgba(0,0,0,.06)',cursor:'pointer',borderTop:'3px solid ' + p.color}}>
                  <div style={{fontWeight:600,fontSize:14,color:'#1E293B'}}>{p.name}</div>
                  <div style={{fontSize:12,color:p.color,marginTop:2}}>{p.title}</div>
                  <div style={{fontSize:11,color:'#94A3B8',marginTop:6}}>Danismak icin tikla</div>
                </div>
              ))}
            </div>
            {sessions.length > 0 && (
              <div>
                <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>Son Seanslar</div>
                <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,.06)',overflow:'hidden'}}>
                  {sessions.slice(0,5).map((s,i) => (
                    <div key={i} style={{padding:'14px 18px',borderBottom:'1px solid #F1F5F9',display:'flex',justifyContent:'space-between'}}>
                      <div style={{fontWeight:500,fontSize:14}}>{String(s.persona_id || 'Genel Danisma')}</div>
                      <div style={{fontSize:12,color:'#94A3B8'}}>{new Date(String(s.created_at)).toLocaleDateString('tr-TR')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div style={{maxWidth:800}}>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16}}>
              {PERSONAS.map(p => (
                <button key={p.id} onClick={() => { setActivePersona(p.id); setChatHistory([]) }} style={{padding:'6px 14px',borderRadius:20,border:'1.5px solid ' + (activePersona===p.id?p.color:'#E2E8F0'),background:activePersona===p.id?p.color:'#fff',color:activePersona===p.id?'#fff':'#374151',fontSize:12,cursor:'pointer'}}>{p.name.split(' ')[0]}</button>
              ))}
            </div>
            <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,.06)',height:420,display:'flex',flexDirection:'column'}}>
              <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:10}}>
                {chatHistory.length === 0 && <div style={{textAlign:'center',color:'#94A3B8',marginTop:60}}>{activePersona ? PERSONAS.find(p=>p.id===activePersona)?.name + ' hazir. Nasil yardimci olabilirim?' : 'Uzman secin.'}</div>}
                {chatHistory.map((m,i) => (
                  <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                    <div style={{padding:'10px 14px',borderRadius:12,maxWidth:'80%',fontSize:14,background:m.role==='user'?'#2563EB':'#F1F5F9',color:m.role==='user'?'#fff':'#1E293B'}}>{m.content}</div>
                  </div>
                ))}
                {chatLoading && <div style={{color:'#64748B',fontSize:13}}>Dusunuyor...</div>}
              </div>
              <div style={{padding:'12px 16px',borderTop:'1px solid #F1F5F9',display:'flex',gap:8}}>
                <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} placeholder={activePersona?'Sorunuzu yazin...':'Once uzman secin'} disabled={!activePersona} style={{flex:1,padding:'10px 14px',borderRadius:8,border:'1px solid #E2E8F0',fontSize:14,outline:'none'}} />
                <button onClick={sendChat} disabled={!activePersona||chatLoading} style={{background:'#2563EB',color:'#fff',border:'none',borderRadius:8,padding:'10px 18px',cursor:'pointer',fontSize:14,fontWeight:600}}>Gonder</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sure' && (
          <div>
            <div style={{fontWeight:700,fontSize:16,marginBottom:16}}>Sure Takibi</div>
            {sureler.length === 0 ? (
              <div style={{textAlign:'center',padding:40,color:'#94A3B8'}}>Aktif sure bulunmuyor.</div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {sureler.map((s,i) => {
                  const d = String(s.son_gun).split('.').reverse().join('-')
                  const diff = Math.ceil((new Date(d).getTime() - now.getTime()) / 86400000)
                  const color = diff <= 1 ? '#DC2626' : diff <= 3 ? '#D97706' : '#059669'
                  return (
                    <div key={i} style={{background:'#fff',borderRadius:10,padding:'16px',boxShadow:'0 1px 4px rgba(0,0,0,.06)',display:'flex',justifyContent:'space-between',alignItems:'center',borderLeft:'4px solid ' + color}}>
                      <div>
                        <div style={{fontWeight:600}}>{String(s.aciklama || s.tur || 'Sure')}</div>
                        <div style={{fontSize:13,color:'#64748B'}}>Son gun: {String(s.son_gun)}</div>
                      </div>
                      <div style={{background:color,color:'#fff',padding:'6px 14px',borderRadius:20,fontSize:13,fontWeight:600}}>{diff <= 0 ? 'Gecti!' : diff + ' gun'}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'muvekkiller' && (
          <div style={{textAlign:'center',padding:60,color:'#94A3B8'}}>
            <div style={{fontWeight:600,fontSize:16,color:'#1E293B'}}>{muvekkilCount} Muvekkil</div>
            <div style={{marginTop:8}}>Muvekkil yonetimi yakininda aktif olacak.</div>
          </div>
        )}

        {(activeTab==='dilekce'||activeTab==='ictihat'||activeTab==='sozlesme') && <GameChangerTabs token={avukatToken} activeTab={activeTab} />}
      </div>
    </>
  )
}