'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type HatirlatmaItem = {
  id: string; sirketAdi: string; beyanTuru: string; sonGun: string
  gunKaldi: number; telefon: string|null; whatsappLink: string|null
  mesaj: string; aciliyet: 'kritik'|'acil'|'normal'
}

export default function HatirlatmaPage() {
  const router = useRouter()
  const [items, setItems] = useState<HatirlatmaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string|null>(null)
  const [sent, setSent] = useState<Set<string>>(new Set())

  useEffect(() => { load() }, [])

  async function load() {
    const raw = localStorage.getItem(Object.keys(localStorage).find(k => k.includes('auth-token')) || '')
    const token = raw ? JSON.parse(raw).access_token : null
    if (!token) { router.push('/giris/mali'); return }
    const res = await fetch('/api/mali/hatirlatma', { headers: { Authorization: 'Bearer ' + token } })
    const data = await res.json()
    if (data.success) setItems(data.data || [])
    setLoading(false)
  }

  async function gonder(item: HatirlatmaItem) {
    if (!item.telefon) {
      alert('Bu musteri icin telefon numarasi kayitli degil. Musteri kaydini guncelleyin.')
      return
    }
    setSending(item.id)
    const raw = localStorage.getItem(Object.keys(localStorage).find(k => k.includes('auth-token')) || '')
    const token = raw ? JSON.parse(raw).access_token : null
    const res = await fetch('/api/mali/hatirlatma', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ beyanId: item.id, telefon: item.telefon, mesaj: item.mesaj })
    })
    const data = await res.json()
    if (data.whatsappLink) {
      window.open(data.whatsappLink, '_blank')
    }
    if (data.success) setSent(s => new Set([...s, item.id]))
    setSending(null)
  }

  const renk = (a: string) => a==='kritik' ? '#DC2626' : a==='acil' ? '#D97706' : '#10B981'
  const bg = (a: string) => a==='kritik' ? '#FEF2F2' : a==='acil' ? '#FFFBEB' : '#F0FDF4'

  return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',fontFamily:'system-ui,sans-serif'}}>
      <nav style={{background:'#0A1628',padding:'0 20px',height:56,display:'flex',alignItems:'center',gap:12}}>
        <button onClick={()=>router.push('/dashboard/mali')} style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:20}}>{'<'}</button>
        <span style={{color:'#fff',fontWeight:700}}>WhatsApp Hatirlatma</span>
        <span style={{marginLeft:8,background:'#25D366',color:'#fff',borderRadius:12,padding:'2px 10px',fontSize:12,fontWeight:600}}>WhatsApp</span>
      </nav>
      <div style={{maxWidth:680,margin:'0 auto',padding:'20px 16px'}}>
        <div style={{fontSize:13,color:'#64748B',marginBottom:20}}>Onumuzdeki 7 gun icinde son gunu gelen beyanlar</div>
        {loading ? (
          <div style={{textAlign:'center',padding:60,color:'#64748B'}}>Yukleniyor...</div>
        ) : items.length === 0 ? (
          <div style={{textAlign:'center',padding:60,background:'#fff',borderRadius:12,border:'1px solid #E2E8F0'}}>
            <div style={{fontSize:40,marginBottom:12}}>?</div>
            <div style={{fontWeight:600,color:'#1E293B'}}>Onumuzdeki 7 gunun icinde beyan yok</div>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {items.map(item => (
              <div key={item.id} style={{background:'#fff',borderRadius:12,padding:'16px 18px',border:'1px solid #E2E8F0',borderLeft:'4px solid '+renk(item.aciliyet)}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:15,color:'#1E293B'}}>{item.sirketAdi}</div>
                    <div style={{fontSize:13,color:'#64748B',marginTop:2}}>{String(item.beyanTuru)}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:13,fontWeight:700,color:renk(item.aciliyet)}}>{item.gunKaldi === 0 ? 'BUGUN' : item.gunKaldi === 1 ? 'YARIN' : item.gunKaldi + ' GUN'}</div>
                    <div style={{fontSize:11,color:'#94A3B8',marginTop:1}}>Son: {new Date(item.sonGun).toLocaleDateString('tr-TR')}</div>
                  </div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  {sent.has(item.id) ? (
                    <div style={{flex:1,textAlign:'center',padding:'9px',borderRadius:8,background:'#F0FDF4',color:'#15803D',fontSize:13,fontWeight:600}}>Gonderildi ?</div>
                  ) : (
                    <button onClick={()=>gonder(item)} disabled={sending===item.id} style={{flex:1,background:'#25D366',border:'none',color:'#fff',padding:'9px 16px',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:13,opacity:sending===item.id?0.7:1}}>
                      {sending===item.id ? 'Hazirlanıyor...' : item.telefon ? 'WhatsApp Gonder' : 'Telefon Eksik'}
                    </button>
                  )}
                  {item.whatsappLink && !sent.has(item.id) && (
                    <a href={item.whatsappLink} target='_blank' rel='noreferrer' style={{padding:'9px 14px',borderRadius:8,background:'#F0FDF4',color:'#15803D',fontSize:12,fontWeight:600,textDecoration:'none',border:'1px solid #BBF7D0'}}>Onizle</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}