'use client'
export const dynamic = "force-dynamic"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MaliNav from '@/components/mali/MaliNav'

const G='#0A1628'; const BLUE='#2563EB'; const GREEN='#10B981'; const AMBER='#F59E0B'; const RED='#DC2626'

type KdvOzet = {
  satisToplami:number; giderToplami:number; kdvTahsilat:number
  kdvIndirilen:number; netKdv:number; stopajToplami:number
  toplamIslem:number; incelemeGereken:number; uyarilar:string[]; tavsiye:string
}
type BeyanOzet = { toplam:number; tamamlandi:number; bekleyen:number; geciken:number }
type WhatsappLink = { sirketAdi:string; link:string|null; mesaj:string }

export default function AylikRaporPage() {
  const router = useRouter()
  const [kdv,       setKdv]       = useState<KdvOzet|null>(null)
  const [beyanOzet, setBeyanOzet] = useState<BeyanOzet|null>(null)
  const [beyanlar,  setBeyanlar]  = useState<Record<string,unknown>[]>([])
  const [waLinks,   setWaLinks]   = useState<WhatsappLink[]>([])
  const [loading,   setLoading]   = useState(true)
  const [donem,     setDonem]     = useState(new Date().toISOString().slice(0,7))

  useEffect(() => { load(donem) }, [donem])

  async function getToken() {
    const keys = Object.keys(localStorage).filter(k=>k.includes('auth-token')||k.includes('supabase'))
    for (const k of keys) {
      try {
        const p = JSON.parse(localStorage.getItem(k) || '{}')
        if (p.access_token) return p.access_token
      } catch {}
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
      setBeyanlar(beyanRes.data.beyanlar || [])
      setWaLinks(beyanRes.data.whatsappLinks || [])
      setBeyanOzet(beyanRes.data.ozet || null)
    }
    setLoading(false)
  }

  const fmt = (n:number) => n.toLocaleString('tr-TR', {minimumFractionDigits:2, maximumFractionDigits:2})

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',
      height:'100vh',fontFamily:'system-ui',flexDirection:'column',gap:12}}>
      <div style={{fontSize:28}}>⏳</div>
      <div style={{fontSize:14,color:'#64748B'}}>Yükleniyor...</div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',fontFamily:'system-ui,sans-serif'}}>
      <MaliNav />

      {/* HEADER BAR */}
      <div style={{
        background:G,padding:'0 12px',height:52,
        display:'flex',alignItems:'center',gap:8,
        position:'sticky',top:0,zIndex:50
      }}>
        <button
          onClick={()=>router.push('/dashboard/mali')}
          style={{
            background:'none',border:'none',color:'#94a3b8',
            cursor:'pointer',fontSize:22,padding:'0 6px',
            lineHeight:1,flexShrink:0
          }}
        >‹</button>
        <span style={{color:'#fff',fontWeight:700,fontSize:15,flex:1}}>Aylık Rapor</span>
        <input
          type='month'
          value={donem}
          onChange={e=>setDonem(e.target.value)}
          style={{
            background:'#1e3a5f',border:'none',color:'white',
            padding:'5px 8px',borderRadius:6,fontSize:13,
            flexShrink:0,maxWidth:140
          }}
        />
      </div>

      {/* CONTENT */}
      <div style={{
        width:'100%',maxWidth:600,margin:'0 auto',
        padding:'14px 12px 32px',boxSizing:'border-box'
      }}>

        {/* BEYAN STATS — 2×2 grid */}
        {beyanOzet && (
          <div style={{
            display:'grid',gridTemplateColumns:'1fr 1fr',
            gap:8,marginBottom:14
          }}>
            {(['Toplam','Tamamlandı','Bekleyen','Geciken'] as const).map((lbl,i) => {
              const vals  = [beyanOzet.toplam, beyanOzet.tamamlandi, beyanOzet.bekleyen, beyanOzet.geciken]
              const clrs  = ['#6366F1', GREEN, AMBER, RED]
              return (
                <div key={lbl} style={{
                  background:'#fff',borderRadius:10,
                  padding:'12px 10px',textAlign:'center',
                  border:'1px solid #E2E8F0'
                }}>
                  <div style={{fontSize:22,fontWeight:800,color:clrs[i],lineHeight:1}}>{vals[i]}</div>
                  <div style={{fontSize:11,color:'#64748B',marginTop:4}}>{lbl}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* FINANSAL ÖZET */}
        {kdv ? (
          <div style={{background:'#fff',borderRadius:12,padding:14,border:'1px solid #E2E8F0',marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:14,color:G,marginBottom:12}}>
              Finansal Özet — {donem}
            </div>

            {/* Row layout — label left, value right, full width */}
            {([
              ['Toplam Satış',  kdv.satisToplami,  GREEN],
              ['Toplam Gider',  kdv.giderToplami,  RED],
              ['KDV Tahsilat',  kdv.kdvTahsilat,   BLUE],
              ['KDV İndirilen', kdv.kdvIndirilen,  AMBER],
              ['Net KDV',       kdv.netKdv,        kdv.netKdv>0?RED:GREEN],
              ['Stopaj',        kdv.stopajToplami, '#7C3AED'],
            ] as [string,number,string][]).map(([l,v,c])=>(
              <div key={l} style={{
                display:'flex',justifyContent:'space-between',alignItems:'center',
                padding:'8px 10px',background:'#F8FAFC',borderRadius:7,marginBottom:5
              }}>
                <span style={{fontSize:13,color:'#475569'}}>{l}</span>
                <span style={{fontWeight:700,fontSize:13,color:c,flexShrink:0,marginLeft:8}}>
                  {fmt(v)} TL
                </span>
              </div>
            ))}

            {/* Meta row */}
            <div style={{
              fontSize:12,color:'#0369A1',background:'#F0F9FF',
              borderRadius:7,padding:'7px 10px',marginTop:8
            }}>
              {kdv.toplamIslem} işlem kayıtlı
            </div>

            {kdv.incelemeGereken>0 && (
              <div
                onClick={()=>router.push('/dashboard/mali/review')}
                style={{
                  fontSize:12,color:'#92400E',background:'#FEF3C7',
                  borderRadius:7,padding:'7px 10px',marginTop:6,cursor:'pointer'
                }}
              >
                ⚠️ {kdv.incelemeGereken} belge onay bekliyor
              </div>
            )}

            {kdv.uyarilar.length>0 && (
              <div style={{borderTop:'1px solid #F1F5F9',marginTop:8,paddingTop:6}}>
                {kdv.uyarilar.map((u,i)=>(
                  <div key={i} style={{fontSize:12,color:'#92400E',padding:'2px 0'}}>⚠️ {u}</div>
                ))}
              </div>
            )}

            <div style={{
              marginTop:10,padding:'9px 10px',
              background:kdv.netKdv>0?'#FEF2F2':'#F0FDF4',
              borderRadius:8,fontSize:13,fontWeight:600,
              color:kdv.netKdv>0?RED:GREEN,lineHeight:1.4
            }}>
              {kdv.tavsiye}
            </div>
          </div>
        ) : (
          <div style={{
            background:'#F8FAFC',borderRadius:12,padding:20,
            border:'1px solid #E2E8F0',marginBottom:12,
            textAlign:'center',color:'#94A3B8',fontSize:13
          }}>
            Bu dönem için finansal veri bulunamadı. Belge yükleyin.
          </div>
        )}

        {/* WHATSAPP LINKS */}
        {waLinks.length > 0 && (
          <div style={{background:'#fff',borderRadius:12,padding:14,border:'1px solid #E2E8F0',marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:13,color:G,marginBottom:10}}>
              📱 WhatsApp Hatırlatma Gönder
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:7}}>
              {waLinks.map((w,i)=>(
                <div key={i} style={{
                  display:'flex',justifyContent:'space-between',alignItems:'center',
                  padding:'9px 10px',background:'#F8FAFC',
                  borderRadius:8,border:'1px solid #E2E8F0',gap:8
                }}>
                  <span style={{
                    fontSize:13,fontWeight:600,color:G,
                    flex:1,minWidth:0,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'
                  }}>
                    {w.sirketAdi}
                  </span>
                  {w.link ? (
                    <a
                      href={w.link}
                      target='_blank'
                      rel='noreferrer'
                      style={{
                        background:'#25D366',color:'#fff',
                        padding:'6px 12px',borderRadius:7,
                        fontSize:12,fontWeight:600,
                        textDecoration:'none',flexShrink:0
                      }}
                    >
                      WhatsApp
                    </a>
                  ) : (
                    <span style={{fontSize:11,color:'#94A3B8',flexShrink:0}}>Telefon yok</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BEYANLAR */}
        <div style={{background:'#fff',borderRadius:12,padding:14,border:'1px solid #E2E8F0'}}>
          <div style={{fontWeight:700,fontSize:13,color:G,marginBottom:10}}>
            Bu Ayın Beyanları
          </div>
          {beyanlar.length === 0 ? (
            <div style={{textAlign:'center',padding:20,color:'#64748B',fontSize:13}}>
              Bu ay için beyan bulunmuyor
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {beyanlar.map((b:Record<string,unknown>,i:number)=>(
                <div key={i} style={{
                  display:'flex',justifyContent:'space-between',
                  alignItems:'flex-start',
                  padding:'9px 10px',borderRadius:8,gap:8,
                  background:b.tamamlandi?'#F0FDF4':'#FFF7ED',
                  border:'1px solid '+(b.tamamlandi?'#BBF7D0':'#FED7AA')
                }}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:G}}>
                      {String(b.beyan_turu)}
                    </div>
                    {b.sirket_adi && (
                      <div style={{
                        fontSize:11,color:'#64748B',marginTop:2,
                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'
                      }}>
                        {String(b.sirket_adi)}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize:11,fontWeight:700,flexShrink:0,marginTop:1,
                    color:b.tamamlandi?GREEN:AMBER
                  }}>
                    {b.tamamlandi?'Tamamlandı':'Bekliyor'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
