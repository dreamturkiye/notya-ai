'use client'
export const dynamic = "force-dynamic"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MaliNav from '@/components/mali/MaliNav'

const G='#0A1628'; const BLUE='#2563EB'; const GREEN='#10B981'; const AMBER='#F59E0B'; const RED='#DC2626'

type KdvOzet = { satisToplami:number; giderToplami:number; kdvTahsilat:number; kdvIndirilen:number; netKdv:number; stopajToplami:number; toplamIslem:number; incelemeGereken:number; uyarilar:string[]; tavsiye:string }
type BeyanOzet = { toplam:number; tamamlandi:number; bekleyen:number; geciken:number }
type WhatsappLink = { sirketAdi:string; link:string|null; mesaj:string }

export default function AylikRaporPage() {
  const router = useRouter()
  const [kdv,    setKdv]    = useState<KdvOzet|null>(null)
  const [beyanOzet, setBeyanOzet] = useState<BeyanOzet|null>(null)
  const [beyanlar,  setBeyanlar]  = useState<Record<string,unknown>[]>([])
  const [waLinks,   setWaLinks]   = useState<WhatsappLink[]>([])
  const [loading,   setLoading]   = useState(true)
  const [donem,     setDonem]     = useState(new Date().toISOString().slice(0,7))

  useEffect(() => { load(donem) }, [donem])

  async function getToken() {
    const keys = Object.keys(localStorage).filter(k=>k.includes('auth-token')||k.includes('supabase'))
    for (const k of keys) {
      try { const p=JSON.parse(localStorage.getItem(k)||''); if(p.access_token) return p.access_token } catch {}
    }
    return null
  }

  async function load(d:string) {
    setLoading(true)
    const token = await getToken()
    if (!token) { router.push('/giris/mali'); return }

    const [kdvRes, beyanRes] = await Promise.all([
      fetch('/api/mali/kdv-ozet?donem='+d, { headers:{Authorization:'Bearer '+token} }).then(r=>r.json()).catch(()=>null),
      fetch('/api/mali/aylik-rapor',        { headers:{Authorization:'Bearer '+token} }).then(r=>r.json()).catch(()=>null)
    ])

    if (kdvRes?.success) setKdv(kdvRes)
    if (beyanRes?.success && beyanRes.data) {
      const data = beyanRes.data
      setBeyanlar(data.beyanlar || [])
      setWaLinks(data.whatsappLinks || [])
      setBeyanOzet(data.ozet || null)
    }
    setLoading(false)
  }

  const fmt = (n:number) => n.toLocaleString('tr-TR', {minimumFractionDigits:2, maximumFractionDigits:2})

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'system-ui'}}>Yükleniyor...</div>

  return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',fontFamily:'system-ui,sans-serif'}}>
      <MaliNav />

      {/* SUB HEADER */}
      <div style={{background:G,padding:'0 20px',height:52,display:'flex',alignItems:'center',gap:12}}>
        <button onClick={()=>router.push('/dashboard/mali')} style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:18}}>{'<'}</button>
        <span style={{color:'#fff',fontWeight:700,fontSize:15}}>Aylık Rapor</span>
        <input type='month' value={donem} onChange={e=>setDonem(e.target.value)}
          style={{marginLeft:'auto',background:'#1e3a5f',border:'none',color:'white',padding:'4px 10px',borderRadius:6,fontSize:13}} />
      </div>

      <div style={{maxWidth:800,margin:'0 auto',padding:'20px 16px'}}>

        {/* BEYAN OZET STATS */}
        {beyanOzet && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
            {([['Toplam',beyanOzet.toplam,'#6366F1'],['Tamamlandı',beyanOzet.tamamlandi,GREEN],['Bekleyen',beyanOzet.bekleyen,AMBER],['Geciken',beyanOzet.geciken,RED]] as [string,number,string][]).map(([l,v,c])=>(
              <div key={l} style={{background:'#fff',borderRadius:10,padding:'14px',textAlign:'center',border:'1px solid #E2E8F0'}}>
                <div style={{fontSize:26,fontWeight:800,color:c}}>{v}</div>
                <div style={{fontSize:12,color:'#64748B',marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
        )}

        {/* FINANSAL OZET — from normalized_transactions */}
        {kdv ? (
          <div style={{background:'#fff',borderRadius:12,padding:20,border:'1px solid #E2E8F0',marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:15,color:G,marginBottom:14}}>Finansal Özet — {donem}</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:14}}>
              {([
                ['Toplam Satış',   kdv.satisToplami,  GREEN],
                ['Toplam Gider',   kdv.giderToplami,  RED],
                ['KDV Tahsilat',   kdv.kdvTahsilat,   BLUE],
                ['KDV İndirilen',  kdv.kdvIndirilen,  AMBER],
                ['Net KDV',        kdv.netKdv,        kdv.netKdv>0?RED:GREEN],
                ['Stopaj',         kdv.stopajToplami, '#7C3AED'],
              ] as [string,number,string][]).map(([l,v,c])=>(
                <div key={l} style={{padding:'10px 14px',background:'#F8FAFC',borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:13,color:'#475569'}}>{l}</span>
                  <span style={{fontWeight:700,fontSize:14,color:c}}>{fmt(v)} TL</span>
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:kdv.uyarilar.length>0?12:0}}>
              <div style={{padding:'8px 14px',background:'#F0F9FF',borderRadius:8,fontSize:12,color:'#0369A1'}}>
                {kdv.toplamIslem} işlem kayıtlı
              </div>
              {kdv.incelemeGereken>0 && (
                <div style={{padding:'8px 14px',background:'#FEF3C7',borderRadius:8,fontSize:12,color:'#92400E',cursor:'pointer'}}
                  onClick={()=>router.push('/dashboard/mali/review')}>
                  ⚠️ {kdv.incelemeGereken} belge onay bekliyor
                </div>
              )}
            </div>
            {kdv.uyarilar.length>0 && (
              <div style={{borderTop:'1px solid #F1F5F9',paddingTop:12}}>
                {kdv.uyarilar.map((u,i)=>(
                  <div key={i} style={{fontSize:12,color:'#92400E',padding:'4px 0'}}>⚠️ {u}</div>
                ))}
              </div>
            )}
            <div style={{marginTop:12,padding:'10px 14px',background:kdv.netKdv>0?'#FEF2F2':'#F0FDF4',borderRadius:8,fontSize:13,fontWeight:600,color:kdv.netKdv>0?RED:GREEN}}>
              {kdv.tavsiye}
            </div>
          </div>
        ) : (
          <div style={{background:'#F8FAFC',borderRadius:12,padding:24,border:'1px solid #E2E8F0',marginBottom:16,textAlign:'center',color:'#94A3B8',fontSize:13}}>
            Bu dönem için finansal veri bulunamadı. Belge yükleyin.
          </div>
        )}

        {/* WHATSAPP LINKS */}
        {waLinks.length > 0 && (
          <div style={{background:'#fff',borderRadius:12,padding:20,border:'1px solid #E2E8F0',marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:14,color:G,marginBottom:12}}>📱 WhatsApp Hatırlatma Gönder</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {waLinks.map((w,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'#F8FAFC',borderRadius:8,border:'1px solid #E2E8F0'}}>
                  <span style={{fontSize:14,fontWeight:600,color:G}}>{w.sirketAdi}</span>
                  {w.link ? (
                    <a href={w.link} target='_blank' rel='noreferrer'
                      style={{background:'#25D366',color:'#fff',padding:'6px 14px',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none'}}>
                      WhatsApp
                    </a>
                  ) : (
                    <span style={{fontSize:12,color:'#94A3B8'}}>Telefon yok</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BEYANLAR */}
        <div style={{background:'#fff',borderRadius:12,padding:20,border:'1px solid #E2E8F0'}}>
          <div style={{fontWeight:700,fontSize:14,color:G,marginBottom:12}}>Bu Ayın Beyanları</div>
          {beyanlar.length === 0 ? (
            <div style={{textAlign:'center',padding:24,color:'#64748B',fontSize:13}}>Bu ay için beyan bulunmuyor</div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {beyanlar.map((b:Record<string,unknown>,i:number)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 12px',borderRadius:8,background:b.tamamlandi?'#F0FDF4':'#FFF7ED',border:'1px solid '+(b.tamamlandi?'#BBF7D0':'#FED7AA')}}>
                  <div>
                    <span style={{fontSize:13,fontWeight:600,color:G}}>{String(b.beyan_turu)}</span>
                    {b.sirket_adi && <span style={{fontSize:11,color:'#64748B',marginLeft:8}}>{String(b.sirket_adi)}</span>}
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:b.tamamlandi?GREEN:AMBER}}>{b.tamamlandi?'Tamamlandı':'Bekliyor'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
