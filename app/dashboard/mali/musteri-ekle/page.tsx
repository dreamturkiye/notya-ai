'use client'
export const dynamic = "force-dynamic"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MaliNav from '@/components/mali/MaliNav'
import { getAccessToken, asArray } from '@/lib/portal/toolsUi'

const FAALIYET_GRUPLARI = [
  { grup: 'Perakende', esnaflar: ['Bakkal / Mini Market','Manav','Kuruyemis','Tuhafiye','Kirtasiye','Cicekci'] },
  { grup: 'Guzellik & Bakim', esnaflar: ['Kuafor','Berber','Guzellik Salonu','Tirnak Studio','Masaj / SPA'] },
  { grup: 'Yiyecek & Icecek', esnaflar: ['Cafe / Kahve','Cay Ocagi','Restoran / Lokanta','Pastane','Unlu Mamul'] },
  { grup: 'Hizmet', esnaflar: ['Terzi / Dikis','Tamirci','Ayakkabi Tamiri','Temizlik','Nakliye'] },
  { grup: 'Şirketi', esnaflar: ['Limited Şirketi','Anonim Şirketi'] },
]

const EMPTY_FORM = {
  sirket_adi: '', vergi_no: '', yetkili_kisi: '', telefon: '', email: '',
  faaliyet_alani: '', sirket_turu: 'sahis', calisan_sayisi: '0', notlar: '', buyuksehirde: true,
}

type Sonuc = {
  musteri: Record<string, unknown>
  profil: Record<string, unknown>
}

export default function MusteriEklePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Sonuc|null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  async function kaydet() {
    setLoading(true); setError('')
    const token = getAccessToken()
    if (!token) { router.push('/giris/mali'); return }
    try {
      const res = await fetch('/api/mali/musteri-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          sirket_adi: form.sirket_adi,
          yetkili_kisi: form.yetkili_kisi,
          sirket_turu: form.sirket_turu,
          vergi_no: form.vergi_no,
          telefon: form.telefon,
          email: form.email,
          faaliyet_alani: form.faaliyet_alani,
          calisan_sayisi: Number(form.calisan_sayisi) || 0,
          notlar: form.notlar,
          buyuksehirde: form.buyuksehirde,
        })
      })
      const data = await res.json()
      if (data?.success && data.data?.musteri) {
        setResult({ musteri: data.data.musteri, profil: data.data.profil || {} })
        setStep(4)
      } else {
        setError(data?.error || 'Müşteri eklenemedi. Lütfen tekrar deneyin.')
      }
    } catch {
      setError('Bağlantı hatası. Müşteri eklenemedi.')
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = { width:'100%',padding:'11px 14px',border:'1px solid #E2E8F0',borderRadius:9,fontSize:15,outline:'none',background:'#fff',boxSizing:'border-box' }
  const G = '#10B981'; const BG = '#F0FDF4'

  if (step === 4 && result) {
    const profil = result.profil
    const musteri = result.musteri
    const usul = String(profil.vergilendirmeUsulu || '')
    const riskler = asArray<string>(profil.riskler)
    const beyanSayisi = Number(profil.beyanSayisi || 0)
    const adi = String(musteri.sirket_adi || musteri['şirket_adi'] || form.sirket_adi || 'Müşteri')
    const gercek = usul === 'gercek_usul'
    return (
      <div style={{minHeight:'100vh',background:'#F8FAFC',fontFamily:'system-ui,sans-serif'}}>
        <MaliNav />
        <div style={{maxWidth:560,margin:'0 auto',padding:'24px 16px'}}>
          <div style={{background:'#fff',borderRadius:16,padding:28,border:'1px solid #E2E8F0',textAlign:'center',marginBottom:16}}>
            <div style={{fontSize:20,fontWeight:800,color:'#1E293B',marginBottom:6}}>{adi} eklendi!</div>
            <div style={{fontSize:14,color:'#64748B'}}>
              {beyanSayisi > 0 ? `${beyanSayisi} beyan takvimi otomatik oluşturuldu` : 'Müşteri kaydı oluşturuldu'}
            </div>
          </div>

          {usul && (
            <div style={{background:gercek?'#FEF3C7':'#F0FDF4',borderRadius:12,padding:16,marginBottom:12,border:'1px solid '+(gercek?'#F59E0B':'#10B981')}}>
              <div style={{fontWeight:700,fontSize:14,color:gercek?'#92400E':'#065F46',marginBottom:4}}>
                {gercek ? 'Gercek Usul Mukellef' : 'Basit Usul Mukellef'}
              </div>
              {!!profil.notlar && (
                <div style={{fontSize:13,color:gercek?'#78350F':'#064E3B'}}>{String(profil.notlar)}</div>
              )}
            </div>
          )}

          {riskler.length > 0 && (
            <div style={{background:'#FEF2F2',borderRadius:12,padding:16,marginBottom:12,border:'1px solid #FCA5A5'}}>
              <div style={{fontWeight:700,fontSize:13,color:'#991B1B',marginBottom:8}}>Dikkat Edilmesi Gerekenler</div>
              {riskler.map((r,i) => <div key={i} style={{fontSize:12,color:'#7F1D1D',marginBottom:4}}>- {r}</div>)}
            </div>
          )}

          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <button onClick={()=>router.push('/dashboard/mali/musteriler')} style={{flex:1,minWidth:150,background:G,border:'none',color:'#fff',padding:'12px',borderRadius:9,cursor:'pointer',fontWeight:600,fontSize:14}}>Müşterileri Gör</button>
            <button onClick={()=>{setStep(1);setResult(null);setError('');setForm({ ...EMPTY_FORM })}} style={{flex:1,minWidth:150,background:'#F1F5F9',border:'none',color:'#475569',padding:'12px',borderRadius:9,cursor:'pointer',fontSize:14}}>Yeni Müşteri Ekle</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',fontFamily:'system-ui,sans-serif'}}>
      <MaliNav />
      <div style={{maxWidth:560,margin:'0 auto',padding:'20px 16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:20}}>
          <button onClick={()=>router.push('/dashboard/mali/musteriler')} style={{background:'#fff',border:'1px solid #E2E8F0',color:'#475569',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:13}}>← Müşteriler</button>
          <span style={{fontWeight:800,fontSize:18,color:'#0A1628',flex:1}}>Yeni Müşteri Ekle</span>
          <span style={{fontSize:12,color:'#94A3B8'}}>Adım {step} / 3</span>
        </div>

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
                    <button key={e} onClick={()=>{setForm(f=>({...f,faaliyet_alani:e,sirket_turu:e.includes('Limited')||e.includes('Anonim')?e.toLowerCase().split(' ')[0]:'sahis'}));setStep(2)}} style={{padding:'8px 14px',borderRadius:20,border:'1px solid #E2E8F0',background:form.faaliyet_alani===e?G:'#fff',color:form.faaliyet_alani===e?'#fff':'#374151',cursor:'pointer',fontSize:13,fontWeight:form.faaliyet_alani===e?600:400}}>
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
            <div style={{fontSize:13,color:'#64748B',marginBottom:20}}>{form.faaliyet_alani} — temel bilgileri doldurun</div>
            {[
              {label:'Isletme / Şirket Adi *',key:'sirket_adi',placeholder:'Ornek: Hasan Usta Bakkal'},
              {label:'Vergi No',key:'vergi_no',placeholder:'10 haneli vergi numarasi'},
              {label:'Yetkili Kişi',key:'yetkili_kisi',placeholder:'Sahip / Yetkili adi'},
              {label:'Telefon',key:'telefon',placeholder:'0532 000 0000'},
              {label:'E-posta',key:'email',placeholder:'mail@ornek.com'},
            ].map(({label,key,placeholder}) => (
              <div key={key} style={{marginBottom:14}}>
                <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:5}}>{label}</label>
                <input type='text' value={form[key as keyof typeof form] as string} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder={placeholder} style={inp} />
              </div>
            ))}
            <div style={{display:'flex',gap:10,marginTop:8,flexWrap:'wrap'}}>
              <button onClick={()=>setStep(1)} style={{flex:1,minWidth:120,background:'#F1F5F9',border:'none',color:'#475569',padding:'13px',borderRadius:9,cursor:'pointer',fontSize:14}}>Geri</button>
              <button onClick={()=>setStep(3)} disabled={!form.sirket_adi.trim()} style={{flex:2,minWidth:150,background:G,border:'none',color:'#fff',padding:'13px',borderRadius:9,cursor:'pointer',fontWeight:700,fontSize:15,opacity:form.sirket_adi.trim()?1:0.5}}>Devam Et</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{fontSize:20,fontWeight:800,color:'#1E293B',marginBottom:6}}>Vergi & Calisan</div>
            <div style={{fontSize:13,color:'#64748B',marginBottom:20}}>Bu bilgiler beyan takvimini otomatik oluşturur</div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:8}}>Calisan Sayisi (siz dahil degil)</label>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {['0','1','2','3','4','5+'].map(n => {
                  const val = n==='5+' ? '5' : n
                  const on = form.calisan_sayisi === val
                  return (
                    <button key={n} onClick={()=>setForm(f=>({...f,calisan_sayisi:val}))} style={{flex:1,minWidth:44,padding:'11px 4px',borderRadius:8,border:'1px solid '+(on?G:'#E2E8F0'),background:on?BG:'#fff',color:on?'#065F46':'#374151',cursor:'pointer',fontWeight:600,fontSize:14}}>{n}</button>
                  )
                })}
              </div>
            </div>
            <div style={{marginBottom:16,background:'#F8FAFC',borderRadius:10,padding:'14px 16px',border:'1px solid #E2E8F0'}}>
              <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:8}}>Konum</label>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button onClick={()=>setForm(f=>({...f,buyuksehirde:true}))} style={{flex:1,minWidth:150,padding:'10px',borderRadius:8,border:'1px solid '+(form.buyuksehirde?G:'#E2E8F0'),background:form.buyuksehirde?BG:'#fff',color:form.buyuksehirde?'#065F46':'#374151',cursor:'pointer',fontSize:13,fontWeight:600}}>Buyuksehir (Istanbul, Ankara...)</button>
                <button onClick={()=>setForm(f=>({...f,buyuksehirde:false}))} style={{flex:1,minWidth:150,padding:'10px',borderRadius:8,border:'1px solid '+(!form.buyuksehirde?G:'#E2E8F0'),background:!form.buyuksehirde?BG:'#fff',color:!form.buyuksehirde?'#065F46':'#374151',cursor:'pointer',fontSize:13,fontWeight:600}}>Diger Sehir</button>
              </div>
              <div style={{fontSize:11,color:'#94A3B8',marginTop:6}}>Nisantasi gibi buyuksehir ilce 30k+ nufus = gercek usule gecis (10380 CB Karari)</div>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:5}}>Notlar (opsiyonel)</label>
              <textarea value={form.notlar} onChange={e=>setForm(f=>({...f,notlar:e.target.value}))} rows={3} placeholder='Ozel durumlar, hatirlatmalar...' style={{...inp,resize:'vertical'}} />
            </div>
            {error && <div style={{color:'#991B1B',background:'#FEF2F2',border:'1px solid #FCA5A5',borderRadius:9,padding:'10px 12px',fontSize:13,marginBottom:12}}>{error}</div>}
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <button onClick={()=>setStep(2)} style={{flex:1,minWidth:120,background:'#F1F5F9',border:'none',color:'#475569',padding:'13px',borderRadius:9,cursor:'pointer',fontSize:14}}>Geri</button>
              <button onClick={kaydet} disabled={loading} style={{flex:2,minWidth:200,background:G,border:'none',color:'#fff',padding:'13px',borderRadius:9,cursor:loading?'not-allowed':'pointer',fontWeight:700,fontSize:15,opacity:loading?0.7:1}}>{loading?'Kaydediliyor...':'Müşteri Ekle + Takvim Oluştur'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
