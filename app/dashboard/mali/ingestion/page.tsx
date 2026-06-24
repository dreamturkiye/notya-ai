"use client"
export const dynamic = "force-dynamic"
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import MaliNav from '@/components/mali/MaliNav'

const ISLETME_TIPLERI = [
  { id:'kafe', label:'Kafe / Restoran', docs:['Z Raporu (günlük)','Malzeme faturaları','Personel puantajı','Kira makbuzu','POS ekstresi'] },
  { id:'kuafor', label:'Kuaför / Güzellik', docs:['Z Raporu (günlük)','Kira makbuzu','Malzeme faturaları','Personel puantajı'] },
  { id:'butik', label:'Butik / Giyim', docs:['Z Raporu','e-Fatura / e-Arşiv','Tedarikçi faturaları','Banka ekstresi','Personel puantajı'] },
  { id:'firinci', label:'Fırıncı / Pastane', docs:['Z Raporu (günlük)','Hammadde faturaları','Elektrik-su faturaları','Personel puantajı'] },
  { id:'market', label:'Market / Bakkal', docs:['Z Raporu (günlük)','Tedarikçi faturaları','e-Fatura (varsa)','Banka/POS ekstresi'] },
  { id:'hizmet', label:'Hizmet İşletmesi', docs:['Hizmet faturaları','Masraf fişleri','Banka ekstresi','Personel puantajı'] },
  { id:'diger', label:'Diğer', docs:['Her türlü belge'] },
]

const BELGE_TIPLERI = [
  { id:'z_raporu', label:'Z Raporu', hint:'Günlük yazar kasa / ÖKC Z kapanışı' },
  { id:'efatura', label:'e-Fatura / e-Arşiv', hint:'GİB sisteminden gelen XML veya PDF fatura' },
  { id:'kagit_fatura', label:'Kağıt Fatura / Fiş', hint:'Tedarikçi veya gider fişlerinin fotoğrafı' },
  { id:'banka', label:'Banka Ekstresi', hint:'Banka veya POS ekstre PDF' },
  { id:'puantaj', label:'Puantaj / Personel', hint:'Personel çalışma saatleri Excel veya liste' },
  { id:'kira', label:'Kira Makbuzu', hint:'Kira ödemesi dekont veya makbuz' },
  { id:'diger_belge', label:'Diğer Belge', hint:'Kategorize edilemeyen belge' },
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
    if (!files.length) { alert('Lütfen en az bir belge seçin'); return }
    if (!selectedBelge) { alert('Belge türünü seçin'); return }
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
      setResult({ ok: data.success, message: data.message || (data.success ? 'Belgeler başarıyla işlendi. Derya inceliyor.' : data.error || 'Hata oluştu') })
      if (data.success) { setFiles([]); setNotes('') }
    } catch { setResult({ ok:false, message:'Bağlantı hatası' }) }
    setUploading(false)
  }

  const tipInfo = ISLETME_TIPLERI.find(t=>t.id===selectedTip)
  const G = '#10B981'
  const inp: React.CSSProperties = {width:'100%',padding:'10px 14px',border:'1px solid #E2E8F0',borderRadius:9,fontSize:14,outline:'none',background:'#fff',boxSizing:'border-box'}

  return (
    <div style={{minHeight:'100vh',background:'#F0F4F8',fontFamily:'system-ui,sans-serif'}}>
      <MaliNav />
      <div style={{maxWidth:680,margin:'0 auto',padding:'20px 16px'}}>
        <div style={{marginBottom:20}}>
          <h1 style={{fontSize:22,fontWeight:800,color:'#0A1628',margin:0}}>Belge Yükle</h1>
          <p style={{fontSize:14,color:'#64748B',marginTop:4}}>Derya belgelerinizi okuyup kaydedecek. Fatura, Z raporu, banka ekstresi — hepsi burada.</p>
        </div>

        <div style={{background:'linear-gradient(135deg,#7C3AED,#2563EB)',borderRadius:14,padding:'14px 18px',marginBottom:20,display:'flex',gap:12,alignItems:'center'}}>
          <div style={{width:44,height:44,background:'rgba(255,255,255,.2)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:11,color:'white',flexShrink:0}}>AI</div>
          <div>
            <div style={{color:'white',fontWeight:700,fontSize:15}}>Derya Hazır</div>
            <div style={{color:'rgba(255,255,255,0.8)',fontSize:13}}>Belgeleri yükleyin, Derya analiz edip beyan takvimini günceller.</div>
          </div>
        </div>

        <div style={{background:'#fff',borderRadius:12,padding:20,marginBottom:16,border:'1px solid #E2E8F0'}}>
          <div style={{fontWeight:700,fontSize:14,color:'#1E293B',marginBottom:12}}>1. İşletme Tipi <span style={{color:'#94A3B8',fontWeight:400}}>(opsiyonel)</span></div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:8}}>
            {ISLETME_TIPLERI.map(t => (
              <button key={t.id} onClick={()=>setSelectedTip(selectedTip===t.id?'':t.id)}
                style={{border:'2px solid '+(selectedTip===t.id?G:'#E2E8F0'),background:selectedTip===t.id?'#F0FDF4':'#F8FAFC',borderRadius:10,padding:'12px 8px',cursor:'pointer',textAlign:'center',transition:'all .15s'}}>
                <div style={{fontSize:12,fontWeight:600,color:'#1E293B',lineHeight:1.4}}>{t.label}</div>
              </button>
            ))}
          </div>
          {tipInfo && (
            <div style={{marginTop:10,padding:'10px 14px',background:'#F0FDF4',borderRadius:8,fontSize:12,color:'#065F46'}}>
              <strong>Genellikle: </strong>{tipInfo.docs.join(' • ')}
            </div>
          )}
        </div>

        <div style={{background:'#fff',borderRadius:12,padding:20,marginBottom:16,border:'1px solid #E2E8F0'}}>
          <div style={{fontWeight:700,fontSize:14,color:'#1E293B',marginBottom:12}}>2. Belge Türü <span style={{color:'#DC2626',fontSize:12}}>*</span></div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {BELGE_TIPLERI.map(b => (
              <button key={b.id} onClick={()=>setSelectedBelge(b.id)}
                style={{border:'2px solid '+(selectedBelge===b.id?G:'#E2E8F0'),background:selectedBelge===b.id?'#F0FDF4':'#F8FAFC',borderRadius:9,padding:'11px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:10,textAlign:'left',transition:'all .15s'}}>
                <div style={{width:10,height:10,borderRadius:'50%',background:selectedBelge===b.id?G:'#CBD5E1',flexShrink:0,transition:'all .15s'}} />
                <div>
                  <div style={{fontWeight:600,fontSize:13,color:'#1E293B'}}>{b.label}</div>
                  <div style={{fontSize:11,color:'#94A3B8',marginTop:1}}>{b.hint}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{background:'#fff',borderRadius:12,padding:20,marginBottom:16,border:'1px solid #E2E8F0'}}>
          <div style={{fontWeight:700,fontSize:14,color:'#1E293B',marginBottom:12}}>3. Dönem ve Dosyalar</div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:5}}>Dönem (Ay/Yıl)</label>
            <input type="month" value={donem} onChange={e=>setDonem(e.target.value)} style={inp} />
          </div>
          <div onClick={()=>inputRef.current?.click()}
            style={{border:'2px dashed #CBD5E1',borderRadius:10,padding:'28px 20px',textAlign:'center',cursor:'pointer',background:'#F8FAFC',marginBottom:12}}>
            <div style={{fontSize:36,marginBottom:8}}>📁</div>
            <div style={{fontWeight:600,color:'#1E293B',fontSize:15}}>Dosya seç veya sürükle</div>
            <div style={{fontSize:12,color:'#94A3B8',marginTop:4}}>PDF, JPG, PNG, XLSX — max 10MB</div>
            <input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.xml" onChange={onFileChange} style={{display:'none'}} />
          </div>
          {files.length > 0 && (
            <div style={{marginBottom:12}}>
              {files.map((f,i) => (
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'#F0FDF4',borderRadius:7,marginBottom:4,fontSize:13}}>
                  <span>📎 {f.name}</span>
                  <span style={{color:'#64748B'}}>{(f.size/1024).toFixed(0)}KB</span>
                </div>
              ))}
            </div>
          )}
          <div>
            <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:5}}>Notlar (opsiyonel)</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)}
              placeholder="Örnek: Bu ayın Z raporları. Pazartesi kapalı olduğundan 5 gün eksik."
              rows={3} style={{...inp,resize:'vertical'}} />
          </div>
        </div>

        {result && (
          <div style={{background:result.ok?'#F0FDF4':'#FEF2F2',border:'1px solid '+(result.ok?'#10B981':'#DC2626'),borderRadius:10,padding:'14px 18px',marginBottom:16,color:result.ok?'#065F46':'#991B1B',fontSize:14,fontWeight:500}}>
            {result.ok ? '✅' : '❌'} {result.message}
          </div>
        )}
        <button onClick={gonder} disabled={uploading}
          style={{width:'100%',background:G,border:'none',color:'white',padding:'16px',borderRadius:11,fontSize:16,fontWeight:700,cursor:'pointer',opacity:uploading?.7:1,marginBottom:32}}>
          {uploading ? 'Yükleniyor...' : 'Derya ile Gönder'}
        </button>
      </div>
    </div>
  )
}
