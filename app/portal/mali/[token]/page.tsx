'use client'
export const dynamic = "force-dynamic"
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

type BeyanItem = { id:string;beyan_turu:string;son_gun:string;tamamlandi:boolean;aciklama:string }
type Musteri = { sirket_adi:string;yetkili_kisi:string;faaliyet_alani:string;sirket_turu:string }

export default function MusteriPortalPage() {
  const { token } = useParams() as { token: string }
  const [musteri, setMusteri] = useState<Musteri|null>(null)
  const [beyanlar, setBeyanlar] = useState<BeyanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    fetch('/api/mali/portal?token=' + token)
      .then(r => r.json())
      .then(d => {
        if (d.success) { setMusteri(d.data.musteri); setBeyanlar(d.data.beyanlar || []) }
        else setError(d.error || 'Gecersiz veya suresi dolmus link')
        setLoading(false)
      }).catch(() => { setError('Baglanti hatasi'); setLoading(false) })
  }, [token])

  const today = new Date()
  const upcoming = beyanlar.filter(b => !b.tamamlandi && new Date(b.son_gun) >= today).sort((a,b) => new Date(a.son_gun).getTime()-new Date(b.son_gun).getTime())
  const completed = beyanlar.filter(b => b.tamamlandi)
  const overdue = beyanlar.filter(b => !b.tamamlandi && new Date(b.son_gun) < today)

  const gunKaldi = (iso:string) => Math.ceil((new Date(iso).getTime()-today.getTime())/(86400000))
  const renkBeyan = (iso:string) => { const g=gunKaldi(iso); return g<=1?'#DC2626':g<=3?'#D97706':'#10B981' }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'system-ui'}}>Yukleniyor...</div>
  if (error || !musteri) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'system-ui',flexDirection:'column',gap:12}}>
      <div style={{fontSize:48}}>?</div>
      <div style={{fontWeight:700,fontSize:18,color:'#1E293B'}}>Gecersiz veya Suresi Dolmus Link</div>
      <div style={{color:'#64748B',fontSize:14}}>{error}</div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#F0F4F8',fontFamily:'system-ui,sans-serif'}}>
      <div style={{background:'#0A1628',padding:'20px 24px',color:'white'}}>
        <div style={{maxWidth:640,margin:'0 auto'}}>
          <div style={{fontSize:12,opacity:.6,marginBottom:4}}>Mali Musavirlik Musteri Portali</div>
          <div style={{fontSize:22,fontWeight:800}}>{musteri.sirket_adi}</div>
          <div style={{fontSize:13,opacity:.7,marginTop:4}}>{musteri.yetkili_kisi} - {musteri.faaliyet_alani}</div>
        </div>
      </div>
      <div style={{maxWidth:640,margin:'0 auto',padding:'20px 16px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:20}}>
          {[['Bekleyen',upcoming.length,'#3B82F6'],['Tamamlanan',completed.length,'#10B981'],['Geciken',overdue.length,'#DC2626']].map(([l,v,c])=>(
            <div key={String(l)} style={{background:'#fff',borderRadius:10,padding:'14px',textAlign:'center',border:'1px solid #E2E8F0'}}>
              <div style={{fontSize:28,fontWeight:800,color:String(c)}}>{Number(v)}</div>
              <div style={{fontSize:12,color:'#64748B',marginTop:2}}>{String(l)}</div>
            </div>
          ))}
        </div>
        {overdue.length > 0 && (
          <div style={{background:'#FEF2F2',border:'1px solid #FCA5A5',borderRadius:10,padding:'14px 16px',marginBottom:16}}>
            <div style={{fontWeight:700,color:'#991B1B',marginBottom:8}}>Geciken Beyanlar ({overdue.length})</div>
            {overdue.map(b=><div key={b.id} style={{fontSize:13,color:'#7F1D1D',marginBottom:4}}>- {b.beyan_turu} - {new Date(b.son_gun).toLocaleDateString('tr-TR')}</div>)}
          </div>
        )}
        <div style={{fontWeight:700,fontSize:15,color:'#1E293B',marginBottom:12}}>Yaklasan Beyanlar</div>
        {upcoming.length === 0 ? (
          <div style={{background:'#fff',borderRadius:10,padding:'24px',textAlign:'center',color:'#64748B',border:'1px solid #E2E8F0'}}>Yaklasan beyan yok</div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {upcoming.slice(0,10).map(b => {
              const g = gunKaldi(b.son_gun)
              const renk = renkBeyan(b.son_gun)
              return (
                <div key={b.id} style={{background:'#fff',borderRadius:10,padding:'14px 16px',border:'1px solid #E2E8F0',borderLeft:'4px solid '+renk,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:14,color:'#1E293B'}}>{b.beyan_turu}</div>
                    <div style={{fontSize:12,color:'#64748B',marginTop:2}}>{b.aciklama}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontWeight:700,color:renk}}>{g===0?'BUGUN':g===1?'YARIN':g+' GUN'}</div>
                    <div style={{fontSize:11,color:'#94A3B8'}}>{new Date(b.son_gun).toLocaleDateString('tr-TR')}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {completed.length > 0 && (
          <div style={{marginTop:20}}>
            <div style={{fontWeight:700,fontSize:15,color:'#1E293B',marginBottom:12}}>Tamamlanan Beyanlar</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {completed.slice(0,5).map(b=>(
                <div key={b.id} style={{background:'#F0FDF4',borderRadius:8,padding:'10px 14px',border:'1px solid #BBF7D0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:13,color:'#065F46'}}>{b.beyan_turu}</span>
                  <span style={{fontSize:12,color:'#10B981',fontWeight:600}}>Tamamlandi</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{textAlign:'center',marginTop:24,fontSize:11,color:'#94A3B8'}}>Notya AI Mali Musavirlik Sistemi</div>
      </div>
    </div>
  )
}// v2
