'use client'
export const dynamic = "force-dynamic"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MaliNav from '@/components/mali/MaliNav'
import { createClient } from '@supabase/supabase-js'
import { getBeyanTakvimi, MEVZUAT_DATABASE } from '@/lib/ai/mevzuatEngine'

const G = '#0A1628'
const BLUE = '#2563EB'
const GREEN = '#10B981'
const AMBER = '#F59E0B'
const RED = '#DC2626'

type Stats = {
  toplamBelge: number
  incelemeBekleyen: number
  aktifMusteri: number
  yaklasanBeyan: number
  netKdv: number | null
  buAyBelge: number
}

type SessionNote = {
  id: string
  created_at: string
  notlar: string
  session_type?: string
  vergi_risk_skoru?: number
}

export default function MaliDashboard() {
  const router = useRouter()
  const [user, setUser]       = useState<Record<string,unknown>|null>(null)
  const [stats, setStats]     = useState<Stats>({ toplamBelge:0, incelemeBekleyen:0, aktifMusteri:0, yaklasanBeyan:0, netKdv:null, buAyBelge:0 })
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([])
  const [loading, setLoading] = useState(true)
  const [mevzuatSearch, setMevzuatSearch] = useState('')
  const [token, setToken]     = useState<string|null>(null)

  const now   = new Date()
  const donem = now.toISOString().slice(0,7)
  const beyanlar = [
    ...getBeyanTakvimi(now.getFullYear(), now.getMonth()+1),
    ...getBeyanTakvimi(now.getMonth()===11 ? now.getFullYear()+1 : now.getFullYear(), now.getMonth()===11 ? 1 : now.getMonth()+2)
  ]
  const upcoming = beyanlar.filter(b => {
    const [dd,mm,yyyy] = b.son_gun.split('.')
    return (new Date(+yyyy, +mm-1, +dd).getTime() - now.getTime()) / 86400000 <= 7
  }).length

  useEffect(() => {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/giris'); return }
      const tok = session.access_token
      setToken(tok)

      // User profile
      const { data: u } = await sb.from('users').select('*').eq('id', session.user.id).single()
      if (u && !u.onboarding_completed && !u.profession_type) { router.push('/onboarding'); return }
      setUser(u)

      // Parallel data fetch
      const [belgeRes, musterilerRes, sessionRes, kdvRes] = await Promise.all([
        sb.from('mali_belgeler').select('id,inceleme_bekliyor,created_at,musavir_id').eq('musavir_id', session.user.id),
        sb.from('mali_musteriler').select('id').eq('musavir_id', session.user.id),
        sb.from('mali_session_notes').select('id,created_at,notlar,session_type,vergi_risk_skoru').eq('musavir_id', session.user.id).order('created_at',{ascending:false}).limit(5),
        fetch('/api/mali/kdv-ozet?donem='+donem, { headers: { Authorization: 'Bearer '+tok } }).then(r=>r.json()).catch(()=>null)
      ])

      const belgeler  = belgeRes.data || []
      const buAy      = belgeler.filter(b => b.created_at?.startsWith(donem)).length
      const inceleme  = belgeler.filter(b => b.inceleme_bekliyor).length
      const musteriler = musterilerRes.data || []

      setStats({
        toplamBelge:      belgeler.length,
        incelemeBekleyen: inceleme,
        aktifMusteri:     musteriler.length,
        yaklasanBeyan:    upcoming,
        netKdv:           kdvRes?.netKdv ?? null,
        buAyBelge:        buAy
      })
      setSessionNotes((sessionRes.data || []) as SessionNote[])
      setLoading(false)
    })
  }, [])

  const selamla = () => {
    const h = parseInt(new Date().toLocaleString('tr-TR', { timeZone:'Europe/Istanbul', hour:'2-digit', hour12:false }))
    const g = h < 12 ? 'Günaydın' : h < 18 ? 'İyi Günler' : 'İyi Akşamlar'
    return user?.first_name ? g + ' ' + user.first_name + '!' : g + '!'
  }

  const mevzuatEntries = Object.entries(MEVZUAT_DATABASE).filter(([k,v]) =>
    !mevzuatSearch ||
    k.includes(mevzuatSearch.toLowerCase()) ||
    (v as Record<string,string>).kanun?.toLowerCase().includes(mevzuatSearch.toLowerCase()) ||
    (v as Record<string,string>).ozet?.toLowerCase().includes(mevzuatSearch.toLowerCase())
  )

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F1F5F9',fontFamily:'system-ui'}}><div>Yükleniyor...</div></div>

  const card = (label:string, val:string|number, color:string, sub?:string, onClick?:()=>void) => (
    <div onClick={onClick} style={{background:'white',borderRadius:12,padding:'18px 20px',boxShadow:'0 1px 3px rgba(0,0,0,0.08)',cursor:onClick?'pointer':'default',transition:'box-shadow 0.15s'}}
      onMouseEnter={e=>{ if(onClick)(e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 12px rgba(0,0,0,0.12)' }}
      onMouseLeave={e=>{ if(onClick)(e.currentTarget as HTMLDivElement).style.boxShadow='0 1px 3px rgba(0,0,0,0.08)' }}>
      <div style={{fontSize:26,fontWeight:800,color}}>{val}</div>
      <div style={{fontSize:13,color:'#64748B',marginTop:3,fontWeight:600}}>{label}</div>
      {sub && <div style={{fontSize:11,color:'#94A3B8',marginTop:2}}>{sub}</div>}
    </div>
  )

  const actionBtn = (label:string, icon:string, route:string, bg:string, badge?:number) => (
    <button onClick={()=>router.push(route)}
      style={{background:bg,color:'white',border:'none',borderRadius:12,padding:'14px 16px',cursor:'pointer',textAlign:'left',position:'relative',width:'100%'}}>
      <div style={{fontSize:22,marginBottom:6}}>{icon}</div>
      <div style={{fontWeight:700,fontSize:13}}>{label}</div>
      {badge != null && badge > 0 && (
        <span style={{position:'absolute',top:10,right:10,background:'#DC2626',color:'white',borderRadius:99,padding:'2px 7px',fontSize:11,fontWeight:700}}>{badge}</span>
      )}
    </button>
  )

  return (
    <div style={{minHeight:'100vh',background:'#F1F5F9',fontFamily:'system-ui,sans-serif',overflowX:'hidden'}}>
      <MaliNav />
      <div style={{maxWidth:1200,margin:'0 auto',padding:'16px 12px'}}>

        {/* GREETING */}
        <h1 style={{fontSize:22,fontWeight:700,color:G,marginBottom:20}}>{selamla()}</h1>

        {/* STATS — from real tables */}
        <div className="stats-grid" style={{display:'grid',gap:10,marginBottom:20}}>
          {card('Toplam Belge',     stats.toplamBelge,       BLUE,  'Tüm dönemler')}
          {card('Bu Ay',            stats.buAyBelge,          BLUE,  donem)}
          {card('İnceleme Bekliyor',stats.incelemeBekleyen,  stats.incelemeBekleyen>0?RED:GREEN, 'Onay gerekli', ()=>router.push('/dashboard/mali/review'))}
          {card('Aktif Müşteri',    stats.aktifMusteri,       G,     'Kayıtlı müşteri')}
          {card('Yaklaşan Beyan',   stats.yaklasanBeyan,      stats.yaklasanBeyan>0?AMBER:GREEN, '7 gün içinde')}
          {card('Net KDV',          stats.netKdv != null ? stats.netKdv.toLocaleString('tr-TR')+ ' TL' : '—', stats.netKdv!=null&&stats.netKdv>0?RED:GREEN, donem+' dönemi')}
        </div>

        {/* QUICK ACTIONS */}
        <h2 style={{fontSize:16,fontWeight:700,color:G,marginBottom:12}}>Hızlı Erişim</h2>
        <div className="actions-grid" style={{display:'grid',gap:10,marginBottom:28}}>
          {actionBtn('Belge Yükle',      '📤', '/dashboard/mali/ingestion', BLUE)}
          {actionBtn('İnceleme Kuyruğu', '✅', '/dashboard/mali/review',    '#7C3AED', stats.incelemeBekleyen)}
          {actionBtn('Belge Arşivi',     '🗂',  '/dashboard/mali/belgeler',  '#0F766E')}
          {actionBtn('Mutabakat',        '⚖️',  '/dashboard/mali/mutabakat', '#0E7490')}
          {actionBtn('Müşteriler',       '👥',  '/dashboard/mali/musteriler','#1D4ED8')}
          {actionBtn('Araçlar',          '🧰',  '/mali-tools',              '#374151')}
        </div>

        <div className="main-grid" style={{display:'grid',gap:24}}>

          {/* LEFT: KDV özet + session notes + beyan takvimi */}
          <div>

            {/* KDV MINI CARD */}
            {token && (
              <div style={{background:'white',borderRadius:12,padding:20,boxShadow:'0 1px 3px rgba(0,0,0,0.08)',marginBottom:20,border:'1px solid #E2E8F0'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <span style={{fontWeight:700,fontSize:15,color:G}}>KDV Durumu — {donem}</span>
                  <button onClick={()=>router.push('/dashboard/mali/aylik-rapor')} style={{background:'none',border:'1px solid #E2E8F0',borderRadius:8,padding:'4px 10px',fontSize:12,cursor:'pointer',color:BLUE}}>Detay →</button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                  {[
                    ['Tahsil',  stats.netKdv != null ? '—' : '—', GREEN],
                    ['İndirilen','—', AMBER],
                    ['Net KDV', stats.netKdv != null ? stats.netKdv.toLocaleString('tr-TR')+' TL' : '—', stats.netKdv!=null&&stats.netKdv>0?RED:GREEN]
                  ].map(([l,v,c])=>(
                    <div key={String(l)} style={{textAlign:'center',padding:'10px 6px',background:'#F8FAFC',borderRadius:8}}>
                      <div style={{fontSize:15,fontWeight:800,color:String(c)}}>{String(v)}</div>
                      <div style={{fontSize:11,color:'#64748B',marginTop:2}}>{String(l)}</div>
                    </div>
                  ))}
                </div>
                {stats.incelemeBekleyen > 0 && (
                  <div style={{marginTop:10,padding:'8px 12px',background:'#FEF3C7',borderRadius:8,fontSize:12,color:'#92400E'}}>
                    ⚠️ {stats.incelemeBekleyen} belge onaylanmadan beyan hesabı eksik
                  </div>
                )}
              </div>
            )}

            {/* SESSION NOTES */}
            <h2 style={{fontSize:16,fontWeight:700,color:G,marginBottom:12}}>Son Görüşmeler</h2>
            {sessionNotes.length === 0 ? (
              <div style={{background:'white',borderRadius:12,padding:30,textAlign:'center',color:'#94a3b8',boxShadow:'0 1px 3px rgba(0,0,0,0.08)',marginBottom:20}}>
                <div style={{fontSize:32,marginBottom:8}}>📝</div>
                <p style={{margin:'0 0 12px',fontSize:14}}>Henüz görüşme notunuz yok</p>
                <button onClick={()=>router.push('/session/mali')} style={{background:BLUE,color:'white',border:'none',padding:'8px 20px',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:600}}>Yeni Görüşme Başlat</button>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
                {sessionNotes.map(n => (
                  <div key={n.id} style={{background:'white',borderRadius:10,padding:'12px 16px',boxShadow:'0 1px 3px rgba(0,0,0,0.08)',borderLeft:'3px solid '+( n.vergi_risk_skoru && n.vergi_risk_skoru>6?RED:n.vergi_risk_skoru&&n.vergi_risk_skoru>3?AMBER:BLUE)}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontWeight:600,fontSize:13,color:G}}>{(n.session_type||'Görüşme').replace(/_/g,' ')}</span>
                      {n.vergi_risk_skoru && <span style={{fontSize:11,fontWeight:700,color:n.vergi_risk_skoru>6?RED:AMBER}}>Risk {n.vergi_risk_skoru}/10</span>}
                    </div>
                    <div style={{fontSize:12,color:'#64748B'}}>{new Date(n.created_at).toLocaleDateString('tr-TR',{day:'2-digit',month:'long',year:'numeric'})}</div>
                    {n.notlar && <div style={{fontSize:12,color:'#475569',marginTop:4}}>{n.notlar.substring(0,80)}{n.notlar.length>80?'...':''}</div>}
                  </div>
                ))}
                <button onClick={()=>router.push('/session/mali')} style={{background:BLUE,color:'white',border:'none',padding:'9px 20px',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:600,alignSelf:'flex-start'}}>+ Yeni Görüşme</button>
              </div>
            )}

            {/* BEYAN TAKVİMİ */}
            <h2 style={{fontSize:16,fontWeight:700,color:G,marginBottom:12}}>Beyan Takvimi</h2>
            <div style={{background:'white',borderRadius:12,padding:20,boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
              {beyanlar.map((b, i) => {
                const [dd,mm,yyyy] = b.son_gun.split('.')
                const daysLeft = Math.ceil((new Date(+yyyy,+mm-1,+dd).getTime()-now.getTime())/86400000)
                const col = daysLeft<=3?RED:daysLeft<=7?AMBER:GREEN
                return (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i<beyanlar.length-1?'1px solid #F1F5F9':'none'}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:13,color:G}}>{b.beyan}</div>
                      <div style={{fontSize:11,color:'#94A3B8'}}>{b.kanun}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontWeight:700,fontSize:13,color:col}}>{b.son_gun}</div>
                      <div style={{fontSize:11,color:col}}>{daysLeft<=0?'Geçti!':daysLeft===1?'Yarın!':daysLeft+' gün'}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT: mevzuat */}
          <div>
            <h2 style={{fontSize:16,fontWeight:700,color:G,marginBottom:12}}>Mevzuat Referans</h2>
            <div style={{background:'white',borderRadius:12,padding:16,boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
              <input value={mevzuatSearch} onChange={e=>setMevzuatSearch(e.target.value)}
                placeholder='KDV, SGK, MASAK...'
                style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid #E2E8F0',marginBottom:12,boxSizing:'border-box',fontSize:13}} />
              {mevzuatEntries.slice(0,8).map(([k,v]) => {
                const mv = v as Record<string,string>
                return (
                  <div key={k} style={{padding:'10px 0',borderBottom:'1px solid #F1F5F9'}}>
                    <div style={{fontWeight:700,fontSize:12,color:'#1e3a5f'}}>{mv.kanun}</div>
                    <div style={{fontSize:11,color:BLUE}}>{mv.madde}</div>
                    <div style={{fontSize:11,color:'#64748B',marginTop:2}}>{mv.ozet?.slice(0,80)}{mv.ozet?.length>80?'...':''}</div>
                    <a href={'https://'+mv.url} target='_blank' rel='noreferrer' style={{fontSize:10,color:BLUE,textDecoration:'none'}}>{mv.url}</a>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html:`
        .stats-grid   { grid-template-columns: repeat(2,1fr); }
        .actions-grid { grid-template-columns: repeat(2,1fr); }
        .main-grid    { grid-template-columns: 1fr; }
        @media(min-width:769px){
          .stats-grid   { grid-template-columns: repeat(6,1fr); }
          .actions-grid { grid-template-columns: repeat(6,1fr); }
          .main-grid    { grid-template-columns: 2fr 1fr; }
        }
      `}} />
    </div>
  )
}
