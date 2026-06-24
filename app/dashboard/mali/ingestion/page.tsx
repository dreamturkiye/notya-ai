'use client'
export const dynamic = 'force-dynamic'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import MaliNav from '@/components/mali/MaliNav'

// Business type templates - real workflows in Turkey
const ISLETME_TIPLERI = [
  { id:'kafe', label:'Kafe / Restoran', icon:'?', docs:['Z Raporu (gunluk)','Malzeme faturalari','Personel puantaji','Kira makbuzu','POS ekstresi'] },
  { id:'kuafor', label:'Kuafor / Guzellik', icon:'??', docs:['Z Raporu (gunluk)','Kira makbuzu','Malzeme faturalari','Personel puantaji'] },
  { id:'butik', label:'Butik / Giyim', icon:'?', docs:['Z Raporu','e-Fatura / e-Arsiv','Tedarikci faturalari','Banka ekstresi','Personel puantaji'] },
  { id:'firinci', label:'Firinci / Pastane', icon:'?', docs:['Z Raporu (gunluk)','Hammadde faturalari','Elektrik-su faturalari','Personel puantaji','Diger giderler'] },
  { id:'market', label:'Market / Bakkal', icon:'?', docs:['Z Raporu (gunluk)','Tedarikci faturalari','e-Fatura (varsa)','Banka/POS ekstresi','Personel'] },
  { id:'hizmet', label:'Hizmet Isletmesi', icon:'?', docs:['Hizmet faturalari','Masraf fisleri','Banka ekstresi','Personel puantaji'] },
  { id:'diger', label:'Diger', icon:'?', docs:['Her turlu belge'] },
]

const BELGE_TIPLERI = [
  { id:'z_raporu', label:'Z Raporu', icon:'??', hint:'Gunluk yazar kasa / OKC Z kapanisi' },
  { id:'efatura', label:'e-Fatura / e-Arsiv', icon:'?', hint:'GIB sisteminden gelen XML veya PDF fatura' },
  { id:'kagit_fatura', label:'Kagit Fatura / Fis', icon:'?', hint:'Tedarikci veya gider fislerinin fotografi' },
  { id:'banka', label:'Banka Ekstresi', icon:'?', hint:'Banka veya POS ekstre PDF' },
  { id:'puantaj', label:'Puantaj / Personel', icon:'?', hint:'Personel calisma saatleri Excel veya liste' },
  { id:'kira', label:'Kira Makbuzu', icon:'?', hint:'Kira odemesi dekont veya makbuz' },
  { id:'diger_belge', label:'Diger Belge', icon:'?', hint:'Kategorize edilemeyen belge' },
]

export default function IngestionPage() {
  const router = useRouter()
  const [selectedTip, setSelectedTip] = useState('')
  const [selectedBelge, setSelectedBelge] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ok:boolean;message:string}|null>(null)
  const [donem, setDonem] = useState(new Date().toISOString().slice(0,7))
  const inputRef = useRef<HTMLInputElement>(null)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setFiles(Array.from(e.target.files))
  }

  async function gonder() {
    if (!files.length) { alert('Lutfen en az bir belge secin'); return }
    if (!selectedBelge) { alert('Belge turunu secin'); return }
    setUploading(true)
    const raw = typeof window !== 'undefined' ? localStorage.getItem(Object.keys(localStorage).find(k=>k.includes('auth-token'))||'') : null
    const token = raw ? JSON.parse(raw).access_token : null
    if (!token) { router.push('/giris/mali'); return }
    const form = new FormData()
    files.forEach(f => form.append('files', f))
    form.append('belgeTuru', selectedBelge)
    form.append('isletmeTipi', selectedTip)
    form.append('donem', donem)
    form.append('notlar', notes)
    try {
      const res = await fetch('/api/mali/ingestion', {
        method:'POST', headers:{'Authorization':'Bearer '+token}, body:form
      })
      const data = await res.json()
      setResult({ ok: data.success, message: data.message || (data.success ? 'Belgeler basariyla islendi. Derya inceliyor.' : data.error || 'Hata olustu') })
      if (data.success) { setFiles([]); setNotes('') }
    } catch { setResult({ ok:false, message:'Baglanti hatasi' }) }
    setUploading(false)
  }

  const tipInfo = ISLETME_TIPLERI.find(t=>t.id===selectedTip)
  const G = '#10B981'
  const inp: React.CSSProperties = {width:'100%',padding:'10px 14px',border:'1px solid #E2E8F0',borderRadius:9,fontSize:14,outline:'none',background:'#fff',boxSizing:'border-box'}

  return (
    <div style={{minHeight:'100vh',background:'#F0F4F8',fontFamily:'system-ui,sans-serif'}}>
      <MaliNav />
      <div style={{maxWidth:680,margin:'0 auto',padding:'20px 16px'}}>
        {/* Header */}
        <div style={{marginBottom:20}}>
          <h1 style={{fontSize:22,fontWeight:800,color:'#0A1628',margin:0}}>Belge Y�kle</h1>
          <p style={{fontSize:14,color:'#64748B',marginTop:4}}>Derya belgelerinizi okuyup kaydedecek. Fatura, Z raporu, banka ekstresi - hepsi burada.</p>
        </div>

        {/* Derya hint card */}
        <div style={{background:'linear-gradient(135deg,#7C3AED,#2563EB)',borderRadius:14,padding:'14px 18px',marginBottom:20,display:'flex',gap:12,alignItems:'center'}}>
          <span style={{fontSize:32}}>?</span>
          <div>
            <div style={{color:'white',fontWeight:700,fontSize:15}}>Derya Hazir</div>
            <div style={{color:'rgba(255,255,255,0.8)',fontSize:13}}>Belgeleri yukleyin, Derya analiz edip beyan takvimini gunceller.</div>
          </div>
        </div>

        {/* Step 1: Business type */}
        <div style={{background:'#fff',borderRadius:12,padding:20,marginBottom:16,border:'1px solid #E2E8F0'}}>
          <div style={{fontWeight:700,fontSize:14,color:'#1E293B',marginBottom:12}}>1. Isletme Tipi <span style={{color:'#94A3B8',fontWeight:400}}>(opsiyonel)</span></div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:8}}>
            {ISLETME_TIPLERI.map(t => (
              <button key={t.id} onClick={()=>setSelectedTip(selectedTip===t.id?'':t.id)}
                style={{border:'2px solid '+(selectedTip===t.id?G:'#E2E8F0'),background:selectedTip===t.id?'#F0FDF4':'#F8FAFC',borderRadius:10,padding:'10px 8px',cursor:'pointer',textAlign:'center',transition:'all .15s'}}>
                <div style={{fontSize:22,marginBottom:4}}>{t.icon}</div>
                <div style={{fontSize:11,fontWeight:600,color:'#1E293B',lineHeight:1.3}}>{t.label}</div>
              </button>
            ))}
          </div>
          {tipInfo && (
            <div style={{marginTop:10,padding:'10px 14px',background:'#F0FDF4',borderRadius:8,fontSize:12,color:'#065F46'}}>
              <strong>Genellikle: </strong>{tipInfo.docs.join(' � ')}
            </div>
          )}
        </div>

        {/* Step 2: Document type */}
        <div style={{background:'#fff',borderRadius:12,padding:20,marginBottom:16,border:'1px solid #E2E8F0'}}>
          <div style={{fontWeight:700,fontSize:14,color:'#1E293B',marginBottom:12}}>2. Belge Turu <span style={{color:'#DC2626',fontSize:12}}>*</span></div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {BELGE_TIPLERI.map(b => (
              <button key={b.id} onClick={()=>setSelectedBelge(b.id)}
                style={{border:'2px solid '+(selectedBelge===b.id?G:'#E2E8F0'),background:selectedBelge===b.id?'#F0FDF4':'#F8FAFC',borderRadius:9,padding:'11px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:10,textAlign:'left',transition:'all .15s'}}>
                <span style={{fontSize:18,width:24,flexShrink:0}}>{b.icon}</span>
                <div>
                  <div style={{fontWeight:600,fontSize:13,color:'#1E293B'}}>{b.label}</div>
                  <div style={{fontSize:11,color:'#94A3B8',marginTop:1}}>{b.hint}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Period + File upload */}
        <div style={{background:'#fff',borderRadius:12,padding:20,marginBottom:16,border:'1px solid #E2E8F0'}}>
          <div style={{fontWeight:700,fontSize:14,color:'#1E293B',marginBottom:12}}>3. Donem ve Dosyalar</div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:5}}>Donem (Ay/Yil)</label>
            <input type='month' value={donem} onChange={e=>setDonem(e.target.value)} style={inp} />
          </div>
          {/* Drop zone */}
          <div onClick={()=>inputRef.current?.click()}
            style={{border:'2px dashed #CBD5E1',borderRadius:10,padding:'28px 20px',textAlign:'center',cursor:'pointer',background:'#F8FAFC',marginBottom:12,transition:'all .2s'}}>
            <div style={{fontSize:36,marginBottom:8}}>?</div>
            <div style={{fontWeight:600,color:'#1E293B',fontSize:15}}>Dosya sec veya surukle</div>
            <div style={{fontSize:12,color:'#94A3B8',marginTop:4}}>PDF, JPG, PNG, XLSX � max 10MB</div>
            <input ref={inputRef} type='file' multiple accept='.pdf,.jpg,.jpeg,.png,.xlsx,.xls,.xml' onChange={onFileChange} style={{display:'none'}} />
          </div>
          {files.length > 0 && (
            <div style={{marginBottom:12}}>
              {files.map((f,i) => (
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'#F0FDF4',borderRadius:7,marginBottom:4,fontSize:13}}>
                  <span>? {f.name}</span>
                  <span style={{color:'#64748B'}}>{(f.size/1024).toFixed(0)}KB</span>
                </div>
              ))}
            </div>
          )}
          <div>
            <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:5}}>Notlar (opsiyonel)</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder='Ornek: Bu ayin Z raporlari. Pazartesi kapali oldugundan 5 gun eksik.' rows={3} style={{...inp,resize:'vertical'}} />
          </div>
        </div>

        {/* Submit */}
        {result && (
          <div style={{background:result.ok?'#F0FDF4':'#FEF2F2',border:'1px solid '+(result.ok?'#10B981':'#DC2626'),borderRadius:10,padding:'14px 18px',marginBottom:16,color:result.ok?'#065F46':'#991B1B',fontSize:14,fontWeight:500}}>
            {result.ok ? '?' : '?'} {result.message}
          </div>
        )}
        <button onClick={gonder} disabled={uploading}
          style={{width:'100%',background:G,border:'none',color:'white',padding:'16px',borderRadius:11,fontSize:16,fontWeight:700,cursor:'pointer',opacity:uploading?.7:1,marginBottom:32}}>
          {uploading ? 'Yukleniyor...' : 'Derya ile Gonder'}
        </button>
      </div>
    </div>
  )
}