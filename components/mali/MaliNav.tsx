"use client"
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const ITEMS = [
  { label:'Uzm. Derya', icon:'AI', route:'/asistan/mali', bg:'linear-gradient(135deg,#7C3AED,#2563EB)', color:'white', primary:true },
  { label:'Araclar', icon:'T', route:'/mali-tools', bg:'#1B4332', color:'white' },
  { label:'+ Musteri', icon:'+', route:'/dashboard/mali/musteri-ekle', bg:'#F59E0B', color:'white' },
  { label:'Hatirlatma', icon:'W', route:'/dashboard/mali/hatirlatma', bg:'#25D366', color:'white' },
  { label:'Rapor', icon:'R', route:'/dashboard/mali/aylik-rapor', bg:'#6366F1', color:'white' },
  { label:'Musteriler', icon:'M', route:'/dashboard/mali/musteriler', bg:'#0F766E', color:'white' },
  { label:'Gorusme', icon:'G', route:'/session/mali', bg:'#2563EB', color:'white' },
  { label:'Belge Yukle', icon:'B', route:'/dashboard/mali/ingestion', bg:'#DC2626', color:'white' },
]

export default function MaliNav() {
  const router = useRouter()
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

  return (
    <>
      <nav style={{background:'#0A1628',padding:'0 16px',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 8px rgba(0,0,0,0.4)'}}>
        <span style={{color:'white',fontWeight:700,fontSize:18,cursor:'pointer'}} onClick={()=>go('/dashboard/mali')}>
          <span style={{color:'#10B981'}}>Notya</span> AI
        </span>
        <div className='d-nav' style={{display:'flex',gap:5,alignItems:'center'}}>
          {ITEMS.map(item => (
            <button key={item.route} onClick={()=>go(item.route)}
              style={{background:item.primary?'linear-gradient(135deg,#7C3AED,#2563EB)':item.bg,border:'none',color:item.color,padding:'6px 10px',borderRadius:7,cursor:'pointer',fontWeight:700,fontSize:11,whiteSpace:'nowrap',letterSpacing:'.01em',boxShadow:'0 1px 3px rgba(0,0,0,.2)',opacity:pathname===item.route?1:.85}}>
              {item.label}
            </button>
          ))}
          <button onClick={cikis} style={{background:'transparent',color:'#64748B',border:'1px solid #334155',padding:'5px 9px',borderRadius:7,cursor:'pointer',fontSize:11}}>Cikis</button>
        </div>
        <button className='m-nav' onClick={()=>setOpen(!open)}
          style={{background:'transparent',border:'none',color:'white',cursor:'pointer',padding:'8px',fontSize:22,display:'none'}}>
          {open ? 'x' : '='}
        </button>
      </nav>
      {open && (
        <div style={{position:'fixed',inset:0,zIndex:200,display:'flex'}} onClick={()=>setOpen(false)}>
          <div style={{flex:1,background:'rgba(0,0,0,0.55)'}} />
          <div style={{width:270,background:'#0A1628',height:'100%',padding:'0 0 24px',display:'flex',flexDirection:'column',overflowY:'auto',boxShadow:'-4px 0 24px rgba(0,0,0,.6)'}}
            onClick={e=>e.stopPropagation()}>
            <div style={{padding:'16px 20px',borderBottom:'1px solid #1E293B',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{color:'white',fontWeight:700,fontSize:17}}><span style={{color:'#10B981'}}>Notya</span> AI</span>
              <button onClick={()=>setOpen(false)} style={{background:'transparent',border:'none',color:'#94A3B8',cursor:'pointer',fontSize:20,padding:4}}>x</button>
            </div>
            <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:6}}>
              <button onClick={()=>go('/asistan/mali')}
                style={{background:'linear-gradient(135deg,#7C3AED,#2563EB)',border:'none',color:'white',padding:'16px',borderRadius:12,cursor:'pointer',textAlign:'left',marginBottom:4,display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:40,height:40,background:'rgba(255,255,255,.2)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>AI</div>
                <div><div style={{fontWeight:700,fontSize:15}}>Uzm. Derya</div><div style={{fontSize:12,opacity:.8}}>AI Mali Musaviriniz</div></div>
              </button>
              {ITEMS.slice(1).map(item => (
                <button key={item.route} onClick={()=>go(item.route)}
                  style={{background:pathname===item.route?item.bg:'rgba(255,255,255,.05)',border:'none',color:'white',padding:'13px 16px',borderRadius:10,cursor:'pointer',textAlign:'left',fontSize:14,fontWeight:pathname===item.route?700:500,display:'flex',alignItems:'center',gap:10,transition:'all .15s'}}>
                  <span style={{width:28,height:28,background:pathname===item.route?'rgba(255,255,255,.2)':'rgba(255,255,255,.08)',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <div style={{marginTop:8,borderTop:'1px solid #1E293B',paddingTop:12}}>
                <button onClick={cikis} style={{background:'transparent',border:'1px solid #334155',color:'#94A3B8',padding:'11px 16px',borderRadius:9,cursor:'pointer',width:'100%',textAlign:'left',fontSize:13}}>Cikis Yap</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width:768px) { .d-nav { display:none !important; } .m-nav { display:flex !important; align-items:center; justify-content:center; } }
        @media (min-width:769px) { .m-nav { display:none !important; } }
      `}} />
    </>
  )
}
