'use client'
export const dynamic = "force-dynamic"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MaliNav from '@/components/mali/MaliNav'

type RaporData = { dönem:string; ozet:{toplam:number;tamamlandi:number;bekleyen:number;geciken:number}; beyanlar:Record<string,unknown>[]; whatsappLinks:{şirketAdi:string;link:string|null;mesaj:string}[] }

export default function AylikRaporPage() {
  const router = useRouter()
  const [rapor, setRapor] = useState<RaporData|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const raw = localStorage.getItem(Object.keys(localStorage).find(k=>k.includes('auth-token'))||'')
    const token = raw ? JSON.parse(raw).access_token : null
    if (!token) { router.push('/giris/mali'); return }
    const res = await fetch('/api/mali/aylik-rapor', { headers: { Authorization: 'Bearer ' + token } })
    const data = await res.json()
    if (data.success) setRapor(data.data)
    setLoading(false)
  }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>Yükleniyor...</div>

  return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',fontFamily:'system-ui,sans-serif'}}>
      <MaliNav />
      <nav style={{background:'#0A1628',padding:'0 20px',height:56,display:'flex',alignItems:'center',gap:12}}>
        <button onClick={()=>router.push('/dashboard/mali')} style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:20}}>{'<'}</button>
        <span style={{color:'#fff',fontWeight:700}}>Aylık Rapor - {rapor?.dönem}</span>
      </nav>
      <div style={{maxWidth:700,margin:'0 auto',padding:'20px 16px'}}>
        {rapor && (
          <>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
              {[['Toplam',rapor.ozet.toplam,'#6366F1'],['Tamamlandi',rapor.ozet.tamamlandi,'#10B981'],['Bekleyen',rapor.ozet.bekleyen,'#F59E0B'],['Geciken',rapor.ozet.geciken,'#DC2626']].map(([l,v,c])=>(
                <div key={String(l)} style={{background:'#fff',borderRadius:10,padding:'14px',textAlign:'center',border:'1px solid #E2E8F0'}}>
                  <div style={{fontSize:28,fontWeight:800,color:String(c)}}>{Number(v)}</div>
                  <div style={{fontSize:12,color:'#64748B'}}>{String(l)}</div>
                </div>
              ))}
            </div>
            {rapor.whatsappLinks.length > 0 && (
              <div style={{background:'#fff',borderRadius:12,padding:20,border:'1px solid #E2E8F0',marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>WhatsApp Ozet Gönderin</div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {rapor.whatsappLinks.map((w,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'#F8FAFC',borderRadius:8,border:'1px solid #E2E8F0'}}>
                      <span style={{fontSize:14,fontWeight:600}}>{w.şirketAdi}</span>
                      {w.link ? (
                        <a href={w.link} target='_blank' rel='noreferrer' style={{background:'#25D366',color:'#fff',padding:'7px 16px',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none'}}>WhatsApp</a>
                      ) : (
                        <span style={{fontSize:12,color:'#94A3B8'}}>Telefon yok</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{background:'#fff',borderRadius:12,padding:20,border:'1px solid #E2E8F0'}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>Bu Ayin Beyanlar</div>
              {rapor.beyanlar.length === 0 ? (
                <div style={{textAlign:'center',padding:30,color:'#64748B'}}>Bu ay icin beyan bulunmuyor</div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {rapor.beyanlar.map((b:Record<string,unknown>,i:number)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'9px 12px',borderRadius:8,background:b.tamamlandi?'#F0FDF4':'#FFF7ED',border:'1px solid '+(b.tamamlandi?'#BBF7D0':'#FED7AA')}}>
                      <span style={{fontSize:13}}>{String(b.beyan_turu)}</span>
                      <span style={{fontSize:12,fontWeight:600,color:b.tamamlandi?'#15803D':'#D97706'}}>{b.tamamlandi?'Tamamlandi':'Bekliyor'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}// v2
