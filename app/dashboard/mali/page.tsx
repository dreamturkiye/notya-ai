'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { getBeyanTakvimi, MEVZUAT_DATABASE } from '@/lib/ai/mevzuatEngine'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function MaliDashboard() {
  const router = useRouter()
  const [notes, setNotes] = useState<Record<string,unknown>[]>([])
  const [user, setUser] = useState<Record<string,unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [mevzuatSearch, setMevzuatSearch] = useState('')
  const now = new Date() // always use native Date - timezone handled at display level
  const beyanlar = [...getBeyanTakvimi(now.getFullYear(), now.getMonth()+1), ...getBeyanTakvimi(now.getMonth()===11 ? now.getFullYear()+1 : now.getFullYear(), now.getMonth()===11 ? 1 : now.getMonth()+2)]

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/giriş'); return }
      const { data: u } = await supabase.from('users').select('*').eq('id', session.user.id).single()
      if (u && !u.onboarding_completed && !u.profession_type) { router.push('/onboarding'); return }
      setUser(u)
      const { data: n } = await supabase.from('notes').select('*, sessions(session_type, duration_seconds)').eq('doctor_id', session.user.id).order('created_at', { ascending: false }).limit(20)
      setNotes(n || [])
      setLoading(false)
    })
  }, [])

  const riskColor = (s: number) => s <= 3 ? '#16A34A' : s <= 6 ? '#D97706' : '#DC2626'
  const thisMonth = notes.filter(n => new Date(n.created_at as string).getMonth() === now.getMonth()).length
  const upcoming = beyanlar.filter(b => { const d = b.son_gun.split('.').reverse().join('-'); return (new Date(d).getTime() - now.getTime()) / 86400000 <= 7 }).length
  const mevzuatEntries = Object.entries(MEVZUAT_DATABASE).filter(([k,v]) => !mevzuatSearch || k.includes(mevzuatSearch.toLowerCase()) || (v as Record<string,string>).kanun?.toLowerCase().includes(mevzuatSearch.toLowerCase()) || (v as Record<string,string>).ozet?.toLowerCase().includes(mevzuatSearch.toLowerCase()))

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F1F5F9'}}><div style={{fontSize:32}}>Yükleniyor...</div></div>

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media(max-width:768px) {
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .main-grid { grid-template-columns: 1fr !important; }
          .notes-grid { grid-template-columns: 1fr !important; }
          .hide-mobile { display:none !important; }
          .main-pad { padding: 12px !important; }
          .stat-number { font-size: 20px !important; }
          .stat-label { font-size: 11px !important; }
          .stat-card { padding: 14px 16px !important; }
          .section-title { font-size: 15px !important; margin-bottom: 10px !important; }
          .page-title { font-size: 18px !important; margin-bottom: 16px !important; }
          .nav-btn { padding: 6px 10px !important; font-size: 12px !important; }
          .empty-icon { font-size: 28px !important; }
        }
      `}} />
      <div style={{minHeight:'100vh', background:'#F1F5F9', fontFamily:'system-ui,sans-serif'}}>
      {/* NAV */}
      <nav style={{background:'#0A1628',padding:'0 24px',height:60,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{color:'white',fontWeight:700,fontSize:20}}>Notya AI</span>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>router.push('/asistan/mali')} className='nav-btn' style={{background:'linear-gradient(135deg,#7C3AED,#2563EB)',color:'white',border:'none',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontWeight:600}}>Uzm. Derya</button><button onClick={()=>router.push('/mali-tools')} className='nav-btn' style={{background:'#1B4332',color:'white',border:'none',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontWeight:600}}>Mali Araçlar</button><button onClick={()=>router.push('/dashboard/mali/musteri-ekle')} className='nav-btn' style={{background:'#F59E0B',color:'white',border:'none',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontWeight:600}}>+ Musteri</button><button onClick={()=>router.push('/dashboard/mali/hatirlatma')} className='nav-btn' style={{background:'#25D366',color:'white',border:'none',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontWeight:600}}>WhatsApp</button><button onClick={()=>router.push('/dashboard/mali/musteriler')} className='nav-btn' style={{background:'#0F766E',color:'white',border:'none',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontWeight:600}}>Musteriler</button>
          <button onClick={()=>router.push('/session/mali')} className='hide-mobile' style={{background:'#2563EB',color:'white',border:'none',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontWeight:600}}>Yeni Görüşme</button>
          <button onClick={()=>supabase.auth.signOut().then(()=>router.push('/giriş'))} style={{background:'transparent',color:'#94a3b8',border:'1px solid #334155',padding:'8px 16px',borderRadius:8,cursor:'pointer'}}>Çıkış</button>
        </div>
      </nav>
      <div className='main-pad' style={{maxWidth:1200,margin:'0 auto',padding:32}}>
        <h1 className='page-title' style={{fontSize:24,fontWeight:700,color:'#0A1628',marginBottom:24}}>{(() => { const h = parseInt(new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', hour12: false })); const g = h < 12 ? 'Günaydın' : h < 18 ? 'İyi Günler' : 'İyi Akşamlar'; return (user?.first_name ? g + ' ' + user.first_name + '!' : g + '!') })()}</h1>
        {/* STATS ROW */}
        <div className='stats-grid' style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:32}}>
          {[{label:'Toplam Görüşme',val:notes.length,icon:'total_meet'},{label:'Bu Ay',val:thisMonth,icon:'this_mon'},{label:'Aktif Müşteriler',val:new Set(notes.map(n=>n.profession_type||'müşteri')).size,icon:'active_c'},{label:'Yaklaşan Beyanlar',val:upcoming,icon:'upcoming'}].map(s=>(
            <div key={s.icon} className='stat-card' style={{background:'white',borderRadius:12,padding:'20px 24px',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
              <div className='stat-number' style={{fontSize:28,fontWeight:700,color:'#2563EB'}}>{s.val}</div>
              <div className='stat-label' style={{fontSize:14,color:'#64748B',marginTop:4}}>{s.label}</div>
            </div>
          ))}
        </div>
        <div className='main-grid' style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:24}}>
          <div>
            {/* NOTES GRID */}
            <h2 className='section-title' style={{fontSize:18,fontWeight:600,marginBottom:16}}>Son Görüşmeler</h2>
            {notes.length === 0 ? (
              <div style={{background:'white',borderRadius:12,padding:40,textAlign:'center',color:'#94a3b8'}}>
                <div className='empty-icon' style={{fontSize:48,marginBottom:12}}>Görüşme yok</div>
                <p>Henüz görüşme notunuz yok. İlk görüşmenizi başlatın</p>
                <button onClick={()=>router.push('/session/mali')} style={{background:'#2563EB',color:'white',border:'none',padding:'10px 24px',borderRadius:8,cursor:'pointer',marginTop:12}}>Yeni Görüşme Başlat</button>
              </div>
            ) : (
              <div className='notes-grid' style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                {notes.map((n) => {
                  const riskScore = n.vergi_risk_skoru as number | undefined
                  const sessionType = (n.sessions as Record<string,unknown>)?.session_type as string || n.görüşme_turu as string || 'Görüşme'
                  const dateStr = new Date(n.created_at as string).toLocaleDateString('tr-TR', {timeZone: 'Europe/Istanbul',day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})
                  return (
                    <div key={n.id as string} style={{background:'white',borderRadius:12,padding:20,boxShadow:'0 1px 3px rgba(0,0,0,0.1)',borderLeft:'4px solid' + (riskScore ? riskColor(riskScore) : '#2563EB')}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                        <span style={{fontWeight:600,fontSize:14}}>{sessionType.replace(/_/g, ' ')}</span>
                        {riskScore && <span style={{background:riskColor(riskScore),color:'white',padding:'2px 8px',borderRadius:12,fontSize:12,fontWeight:700}}>Risk: {riskScore}/10</span>}
                      </div>
                      <div style={{fontSize:12,color:'#94a3b8'}}>{dateStr}</div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* BEYAN TAKVIMI */}
            <h2 className='section-title' style={{fontSize:18,fontWeight:600,margin:'32px 0 16px'}}>Beyan Takvimi</h2>
            <div style={{background:'white',borderRadius:12,padding:20,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
              {beyanlar.map((b, i) => {
                const [dd,mm,yyyy] = b.son_gun.split('.')
                const daysLeft = Math.ceil((new Date(+yyyy, +mm-1, +dd).getTime() - now.getTime()) / 86400000)
                const col = daysLeft <= 3 ? '#DC2626' : daysLeft <= 7 ? '#D97706' : '#16A34A'
                return (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:i<beyanlar.length-1?'1px solid #f1f5f9':'none'}}>
                    <div>
                      <span style={{fontWeight:600,fontSize:14}}>{b.beyan}</span>
                      <span style={{fontSize:12,color:'#94a3b8',marginLeft:8}}>{b.kanun}</span>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontWeight:600,fontSize:14,color:col}}>{b.son_gun}</div>
                      <div style={{fontSize:12,color:col}}>{daysLeft <= 0 ? 'Gecti!' : daysLeft === 1 ? 'Yarin!' : daysLeft + ' gun kaldi'}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {/* MEVZUAT SIDEBAR */}
          <div>
            <h2 className='section-title' style={{fontSize:18,fontWeight:600,marginBottom:16}}>Mevzuat Referans</h2>
            <div style={{background:'white',borderRadius:12,padding:16,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
              <input value={mevzuatSearch} onChange={e=>setMevzuatSearch(e.target.value)} placeholder='KDV, SGK, MASAK...' style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid #e2e8f0',marginBottom:12,boxSizing:'border-box'}} />
              {mevzuatEntries.slice(0,8).map(([k,v]) => {
                const mv = v as Record<string,string>
                return (
                  <div key={k} style={{padding:'10px 0',borderBottom:'1px solid #f1f5f9'}}>
                    <div style={{fontWeight:700,fontSize:13,color:'#1e3a5f'}}>{mv.kanun}</div>
                    <div style={{fontSize:12,color:'#2563EB'}}>{mv.madde}</div>
                    <div style={{fontSize:12,color:'#64748B',marginTop:2}}>{mv.ozet?.slice(0,80)}{mv.ozet?.length>80 ? '...' : ''}</div>
                    <a href={'https://'+mv.url} target='_blank' rel='noreferrer' style={{fontSize:11,color:'#2563EB',textDecoration:'none'}}>{mv.url}</a>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}