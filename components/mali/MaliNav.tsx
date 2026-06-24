"use client"
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const ITEMS = [
  { label:'Uzm. Derya', short:'AI',  route:'/asistan/mali',                bg:'linear-gradient(135deg,#7C3AED,#2563EB)', color:'white', primary:true },
  { label:'Araçlar',    short:'AR',  route:'/mali-tools',                  bg:'#1B4332', color:'white' },
  { label:'+ Müşteri',  short:'+M',  route:'/dashboard/mali/musteri-ekle', bg:'#F59E0B', color:'white' },
  { label:'Hatırlatma', short:'HA',  route:'/dashboard/mali/hatirlatma',   bg:'#25D366', color:'white' },
  { label:'Rapor',      short:'RP',  route:'/dashboard/mali/aylik-rapor',  bg:'#6366F1', color:'white' },
  { label:'Müşteriler', short:'MÜ',  route:'/dashboard/mali/musteriler',   bg:'#0F766E', color:'white' },
  { label:'Görüşme',    short:'GR',  route:'/session/mali',                bg:'#2563EB', color:'white' },
  { label:'Belge Yükle',short:'BY',  route:'/dashboard/mali/ingestion',    bg:'#DC2626', color:'white' },
]

// First 3 shown on mobile inline, rest in drawer
const MOBILE_INLINE = ITEMS.slice(0, 3)

export default function MaliNav() {
  const router   = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])

  function go(route: string) { setOpen(false); router.push(route) }

  function cikis() {
    if (typeof window !== 'undefined') {
      const key = Object.keys(localStorage).find(k => k.includes('auth-token')) || ''
      localStorage.removeItem(key)
    }
    router.push('/giris/mali')
  }

  const btnBase: React.CSSProperties = {
    border:'none', color:'white', borderRadius:8, cursor:'pointer',
    fontWeight:700, whiteSpace:'nowrap', boxShadow:'0 1px 3px rgba(0,0,0,.25)',
    transition:'all .15s',
  }

  return (
    <>
      <nav style={{background:'#0A1628',padding:'0 12px',height:56,display:'flex',
                   alignItems:'center',justifyContent:'space-between',
                   position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 8px rgba(0,0,0,0.4)'}}>

        {/* Logo */}
        <span style={{color:'white',fontWeight:800,fontSize:17,cursor:'pointer',flexShrink:0,marginRight:8}}
              onClick={()=>go('/dashboard/mali')}>
          <span style={{color:'#10B981'}}>Notya</span> AI
        </span>

        {/* Desktop: all buttons */}
        <div className="d-nav" style={{gap:5,alignItems:'center',flexWrap:'nowrap',flex:1,justifyContent:'flex-end'}}>
          {ITEMS.map(item => (
            <button key={item.route} onClick={()=>go(item.route)}
              style={{...btnBase, background:item.bg,
                      padding:'6px 10px', fontSize:11,
                      opacity:pathname===item.route?1:.85}}>
              {item.label}
            </button>
          ))}
          <button onClick={cikis}
            style={{background:'transparent',color:'#64748B',border:'1px solid #334155',
                    padding:'5px 9px',borderRadius:7,cursor:'pointer',fontSize:11,flexShrink:0}}>
            Çıkış
          </button>
        </div>

        {/* Mobile: 3 inline buttons + hamburger */}
        <div className="m-nav" style={{alignItems:'center',gap:6,flex:1,justifyContent:'flex-end'}}>
          {MOBILE_INLINE.map(item => (
            <button key={item.route} onClick={()=>go(item.route)}
              style={{...btnBase, background:item.bg,
                      padding:'7px 10px', fontSize:12,
                      opacity:pathname===item.route?1:.85}}>
              {item.label}
            </button>
          ))}
          <button onClick={()=>setOpen(!open)}
            style={{background:'rgba(255,255,255,.12)',border:'none',color:'white',
                    cursor:'pointer',padding:'7px 11px',borderRadius:8,
                    fontSize:18,lineHeight:1,flexShrink:0,marginLeft:2}}>
            {open ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Drawer */}
      {open && (
        <div style={{position:'fixed',inset:0,zIndex:200,display:'flex'}} onClick={()=>setOpen(false)}>
          <div style={{flex:1,background:'rgba(0,0,0,0.55)'}} />
          <div style={{width:260,background:'#0A1628',height:'100%',
                       display:'flex',flexDirection:'column',overflowY:'auto',
                       boxShadow:'-4px 0 24px rgba(0,0,0,.7)'}}
               onClick={e=>e.stopPropagation()}>
            <div style={{padding:'16px 20px',borderBottom:'1px solid #1E293B',
                         display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{color:'white',fontWeight:700,fontSize:16}}>
                <span style={{color:'#10B981'}}>Notya</span> AI
              </span>
              <button onClick={()=>setOpen(false)}
                style={{background:'transparent',border:'none',color:'#94A3B8',
                        cursor:'pointer',fontSize:20,padding:4,lineHeight:1}}>✕</button>
            </div>

            <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:5}}>
              {/* Derya — hero button */}
              <button onClick={()=>go('/asistan/mali')}
                style={{background:'linear-gradient(135deg,#7C3AED,#2563EB)',border:'none',
                        color:'white',padding:'14px 16px',borderRadius:12,cursor:'pointer',
                        textAlign:'left',marginBottom:4,display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:38,height:38,background:'rgba(255,255,255,.2)',borderRadius:9,
                             display:'flex',alignItems:'center',justifyContent:'center',
                             fontWeight:800,fontSize:11,flexShrink:0,color:'white'}}>AI</div>
                <div>
                  <div style={{fontWeight:700,fontSize:14}}>Uzm. Derya</div>
                  <div style={{fontSize:11,opacity:.8}}>AI Mali Müşaviriniz</div>
                </div>
              </button>

              {/* Rest of items */}
              {ITEMS.slice(1).map(item => (
                <button key={item.route} onClick={()=>go(item.route)}
                  style={{background:pathname===item.route?item.bg:'rgba(255,255,255,.06)',
                          border:'none',color:'white',padding:'12px 14px',borderRadius:10,
                          cursor:'pointer',textAlign:'left',fontSize:14,
                          fontWeight:pathname===item.route?700:400,
                          display:'flex',alignItems:'center',gap:10,transition:'all .15s'}}>
                  <span style={{width:28,height:28,flexShrink:0,borderRadius:6,
                                background:pathname===item.route?'rgba(255,255,255,.2)':'rgba(255,255,255,.08)',
                                display:'flex',alignItems:'center',justifyContent:'center',
                                fontSize:10,fontWeight:800}}>{item.short}</span>
                  {item.label}
                </button>
              ))}

              <div style={{marginTop:8,paddingTop:12,borderTop:'1px solid #1E293B'}}>
                <button onClick={cikis}
                  style={{background:'transparent',border:'1px solid #334155',color:'#94A3B8',
                          padding:'10px 14px',borderRadius:9,cursor:'pointer',
                          width:'100%',textAlign:'left',fontSize:13}}>
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html:`
        .d-nav { display: none; }
        .m-nav { display: flex; align-items: center; }
        @media (min-width: 769px) {
          .d-nav { display: flex; }
          .m-nav { display: none; }
        }
      `}} />
    </>
  )
}
