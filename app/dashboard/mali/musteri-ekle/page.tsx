'use client'
export const dynamic = "force-dynamic"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import MaliNav from '@/components/mali/MaliNav'

// supabase: use localStorage token only

const FAALIYET_GRUPLARI = [
  { grup: 'Perakende', esnaflar: ['Bakkal / Mini Market','Manav','Kuruyemis','Tuhafiye','Kirtasiye','Cicekci'] },
  { grup: 'Guzellik & Bakim', esnaflar: ['Kuafor','Berber','Guzellik Salonu','Tirnak Studio','Masaj / SPA'] },
  { grup: 'Yiyecek & Icecek', esnaflar: ['Cafe / Kahve','Cay Ocagi','Restoran / Lokanta','Pastane','Unlu Mamul'] },
  { grup: 'Hizmet', esnaflar: ['Terzi / Dikis','Tamirci','Ayakkabi Tamiri','Temizlik','Nakliye'] },
  { grup: 'Şirketi', esnaflar: ['Limited Şirketi','Anonim Şirketi'] },
]

export default function MüşteriIntakePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Record<string,unknown>|null>(null)
  const [form, setForm] = useState({
    şirket_adi: '', vergi_no: '', yetkili_kişi: '', telefon: '', email: '',
    faaliyet_alani: '', şirket_turu: 'sahis', calisan_sayisi: '0', notlar: '', buyuksehirde: true
  })

  async function kaydet() {
    setLoading(true); setError('')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { session } } = await sb.auth.getSession()
    if (!session) { router.push('/giris/mali'); return }
    const res = await fetch('/api/mali/müşteri-intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
      body: JSON.stringify({ ...form, calisan_sayisi: Number(form.calisan_sayisi) })
    })
    const data = await res.json()
    if (data.success) { setResult(data.data); setStep(4) }
    else setError(data.error || 'Hata')
    setLoading(false)
  }

  const inp: React.CSSProperties = { width:'100%',padding:'11px 14px',border:'1px solid #E2E8F0',borderRadius:9,fontSize:15,outline:'none',background:'#fff',boxSizing:'border-box' }
  const G = '#10B981'; const BG = '#F0FDF4'

  if (step === 4 && result) {
    const profil = result.profil as Record<string,unknown>
    const müşteri = result.müşteri as Record<string,unknown>
    const usul = profil.vergilendirmeUsulu as string
    const riskler = profil.riskler as string[]
    return (
      <div style={{minHeight:'100vh',background:'#F8FAFC',fontFamily:'system-ui,sans-serif',padding:24}}>
      <MaliNav />
        <div style={{maxWidth:560,margin:'0 auto'}}>
          <div style={{background:'#fff',borderRadius:16,padding:28,border:'1px solid #E2E8F0',textAlign:'center',marginBottom:16}}>
            <div style={{fontSize:48,marginBottom:8}}>?</div>
            <div style={{fontSize:20,fontWeight:800,color:'#1E293B',marginBottom:4}}>{String(müşteri.şirket_adi)} eklendi!</div>
            <div style={{fontSize:14,color:'#64748B'}}>{Number(profil.beyanSayisi)} beyan takvimi otomatik oluşturuldu</div>
          </div>
          <div style={{background:usul==='gercek_usul'?'#FEF3C7':'#F0FDF4',borderRadius:12,padding:16,marginBottom:12,border:'1px solid '+(usul==='gercek_usul'?'#F59E0B':'#10B981')}}>
            <div style={{fontWeight:700,fontSize:14,color:usul==='gercek_usul'?'#92400E':'#065F46',marginBottom:4}}>
              {usul === 'gercek_usul' ? 'Gercek Usul Mukellef' : 'Basit Usul Mukellef'}
            </div>
            <div style={{fontSize:13,color:usul==='gercek_usul'?'#78350F':'#064E3B'}}>{String(profil.notlar)}</div>
          </div>
          {riskler.length > 0 && (
            <div style={{background:'#FEF2F2',borderRadius:12,padding:16,marginBottom:12,border:'1px solid #FCA5A5'}}>
              <div style={{fontWeight:700,fontSize:13,color:'#991B1B',marginBottom:8}}>Dikkat Edilmesi Gerekenler</div>
              {riskler.map((r,i) => <div key={i} style={{fontSize:12,color:'#7F1D1D',marginBottom:4}}>- {r}</div>)}
            </div>
          )}
          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>router.push('/dashboard/mali/müşteriler')} style={{flex:1,background:G,border:'none',color:'#fff',padding:'12px',borderRadius:9,cursor:'pointer',fontWeight:600,fontSize:14}}>Müşterileri Gor</button>
            <button onClick={()=>{setStep(1);setResult(null);setForm({şirket_adi:'',vergi_no:'',yetkili_kişi:'',telefon:'',email:'',faaliyet_alani:'',şirket_turu:'sahis',calisan_sayisi:'0',notlar:'',buyuksehirde:true})}} style={{flex:1,background:'#F1F5F9',border:'none',color:'#475569',padding:'12px',borderRadius:9,cursor:'pointer',fontSize:14}}>Yeni Müşteri Ekle</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',fontFamily:'system-ui,sans-serif'}}>
      <nav style={{background:'#0A1628',padding:'0 20px',height:56,display:'flex',alignItems:'center',gap:12}}>
        <button onClick={()=>router.push('/dashboard/mali/müşteriler')} style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:20}}>{'<'}</button>
        <span style={{color:'#fff',fontWeight:700}}>Yeni Müşteri Ekle</span>
        <span style={{marginLeft:'auto',fontSize:12,color:'#64748B'}}>Adim {step} / 3</span>
      </nav>
      <div style={{maxWidth:560,margin:'0 auto',padding:'24px 16px'}}>

        {step === 1 && (
          <div>
            <div style={{fontSize:20,fontWeight:800,color:'#1E293B',marginBottom:6}}>Faaliyet Turu</div>
            <div style={{fontSize:13,color:'#64748B',marginBottom:20}}>Ne is yapiyor? Bir kategori secin veya yazin</div>
            <input value={form.faaliyet_alani} onChange={e=>setForm(f=>({...f,faaliyet_alani:e.target.value}))} placeholder='Ornek: Bakkal, Kuafor, Cafe...' style={{...inp,marginBottom:20,fontSize:16}} />
            {FAALIYET_GRUPLARI.map(g => (
              <div key={g.grup} style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>{g.grup}</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                  {g.esnaflar.map(e => (
                    <button key={e} onClick={()=>{setForm(f=>({...f,faaliyet_alani:e,şirket_turu:e.includes('Limited')||e.includes('Anonim')?e.toLowerCase().split(' ')[0]:'sahis'}));setStep(2)}} style={{padding:'8px 14px',borderRadius:20,border:'1px solid #E2E8F0',background:form.faaliyet_alani===e?G:'#fff',color:form.faaliyet_alani===e?'#fff':'#374151',cursor:'pointer',fontSize:13,fontWeight:form.faaliyet_alani===e?600:400}}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {form.faaliyet_alani && <button onClick={()=>setStep(2)} style={{width:'100%',marginTop:8,background:G,border:'none',color:'#fff',padding:'14px',borderRadius:9,cursor:'pointer',fontWeight:700,fontSize:15}}>Devam Et</button>}
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{fontSize:20,fontWeight:800,color:'#1E293B',marginBottom:6}}>Isletme Bilgileri</div>
            <div style={{fontSize:13,color:'#64748B',marginBottom:20}}>{form.faaliyet_alani} Ñ temel bilgileri doldurun</div>
            {[
              {label:'Isletme / Şirket Adi *',key:'şirket_adi',placeholder:'Ornek: Hasan Usta Bakkal'},
              {label:'Vergi No',key:'vergi_no',placeholder:'10 haneli vergi numarasi'},
              {label:'Yetkili Kişi',key:'yetkili_kişi',placeholder:'Sahip / Yetkili adi'},
              {label:'Telefon',key:'telefon',placeholder:'0532 000 0000'},
              {label:'E-posta',key:'email',placeholder:'mail@ornek.com'},
            ].map(({label,key,placeholder}) => (
              <div key={key} style={{marginBottom:14}}>
                <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:5}}>{label}</label>
                <input type='text' value={form[key as keyof typeof form] as string} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder={placeholder} style={inp} />
              </div>
            ))}
            <div style={{display:'flex',gap:10,marginTop:8}}>
              <button onClick={()=>setStep(1)} style={{flex:1,background:'#F1F5F9',border:'none',color:'#475569',padding:'13px',borderRadius:9,cursor:'pointer',fontSize:14}}>Geri</button>
              <button onClick={()=>setStep(3)} disabled={!form.şirket_adi.trim()} style={{flex:2,background:G,border:'none',color:'#fff',padding:'13px',borderRadius:9,cursor:'pointer',fontWeight:700,fontSize:15,opacity:form.şirket_adi.trim()?1:0.5}}>Devam Et</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{fontSize:20,fontWeight:800,color:'#1E293B',marginBottom:6}}>Vergi & Calisan</div>
            <div style={{fontSize:13,color:'#64748B',marginBottom:20}}>Bu bilgiler beyan takvimini otomatik oluşturur</div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:8}}>Calisan Sayisi (siz dahil degil)</label>
              <div style={{display:'flex',gap:8}}>
                {['0','1','2','3','4','5+'].map(n => (
                  <button key={n} onClick={()=>setForm(f=>({...f,calisan_sayisi:n==='5+'?'5':n}))} style={{flex:1,padding:'11px 4px',borderRadius:8,border:'1px solid '+(form.calisan_sayisi===(n==='5+'?'5':n)?G:'#E2E8F0'),background:form.calisan_sayisi===(n==='5+'?'5':n)?BG:'#fff',color:form.calisan_sayisi===(n==='5+'?'5':n)?'#065F46':'#374151',cursor:'pointer',fontWeight:600,fontSize:14}}>{n}</button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:16,background:'#F8FAFC',borderRadius:10,padding:'14px 16px',border:'1px solid #E2E8F0'}}>
              <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:8}}>Konum</label>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setForm(f=>({...f,buyuksehirde:true}))} style={{flex:1,padding:'10px',borderRadius:8,border:'1px solid '+(form.buyuksehirde?G:'#E2E8F0'),background:form.buyuksehirde?BG:'#fff',color:form.buyuksehirde?'#065F46':'#374151',cursor:'pointer',fontSize:13,fontWeight:600}}>Buyuksehir (Istanbul, Ankara...)</button>
                <button onClick={()=>setForm(f=>({...f,buyuksehirde:false}))} style={{flex:1,padding:'10px',borderRadius:8,border:'1px solid '+(!form.buyuksehirde?G:'#E2E8F0'),background:!form.buyuksehirde?BG:'#fff',color:!form.buyuksehirde?'#065F46':'#374151',cursor:'pointer',fontSize:13,fontWeight:600}}>Diger Sehir</button>
              </div>
              <div style={{fontSize:11,color:'#94A3B8',marginTop:6}}>Nisantasi gibi buyuksehir ilce 30k+ nufus = gercek usule gecis (10380 CB Karari)</div>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:5}}>Notlar (opsiyonel)</label>
              <textarea value={form.notlar} onChange={e=>setForm(f=>({...f,notlar:e.target.value}))} rows={3} placeholder='Ozel durumlar, hatirlatmalar...' style={{...inp,resize:'vertical'}} />
            </div>
            {error && <div style={{color:'#DC2626',fontSize:13,marginBottom:10}}>{error}</div>}
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setStep(2)} style={{flex:1,background:'#F1F5F9',border:'none',color:'#475569',padding:'13px',borderRadius:9,cursor:'pointer',fontSize:14}}>Geri</button>
              <button onClick={kaydet} disabled={loading} style={{flex:2,background:G,border:'none',color:'#fff',padding:'13px',borderRadius:9,cursor:'pointer',fontWeight:700,fontSize:15,opacity:loading?0.7:1}}>{loading?'Kaydediliyor...':'Müşteri Ekle + Takvim Oluştur'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}