'use client'
import{useState,useEffect}from 'react'
import{createClient}from '@supabase/supabase-js'
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const TURLER=[{id:'itiraz_dilekce',label:'Itiraz Dilekcesi'},{id:'dava_acilis',label:'Dava Acilis'},{id:'nafaka_talebi',label:'Nafaka Talebi'},{id:'bosanma_davasi',label:'Bosanma Davasi'},{id:'is_akdi_feshi',label:'Haksiz Fesih'},{id:'icra_itiraz',label:'Icra Itiraz'},{id:'idari_itiraz',label:'Idari Itiraz'},{id:'tespit_talebi',label:'Tespit Talebi'}]
export default function DilekceTab({avukatToken}:{avukatToken:string}){
  const[turId,setTurId]=useState('itiraz_dilekce')
  const[muvekkilBilgi,setMuvekkilBilgi]=useState('')
  const[ekBilgi,setEkBilgi]=useState('')
  const[loading,setLoading]=useState(false)
  const[result,setResult]=useState<{dilekce_metni:string;eksik_bilgiler:string[];uyarilar:string[]}|null>(null)
  const[error,setError]=useState('')
  const[gecmis,setGecmis]=useState<Record<string,unknown>[]>([])
  useEffect(()=>{
    sb.auth.getSession().then(async({data:{session}})=>{
      if(!session)return
      const{data}=await sb.from('dilekce_kuyrugu').select('*').eq('avukat_id',session.user.id).order('created_at',{ascending:false}).limit(5)
      setGecmis(data||[])
    })
  },[result])
  async function generate(){
    if(!avukatToken){setError('Oturum suresi dolmus');return}
    setLoading(true);setError('');setResult(null)
    try{
      const res=await fetch('/api/avukat/dilekce',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+avukatToken},body:JSON.stringify({turId,muvekkil_bilgileri:{aciklama:muvekkilBilgi},ek_bilgiler:ekBilgi})})
      const data=await res.json()
      if(!data.success)throw new Error(data.error)
      setResult(data.data)
    }catch(e:unknown){setError(e instanceof Error?e.message:'Hata')}
    setLoading(false)
  }
  const inp:React.CSSProperties={width:'100%',background:'#1e293b',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'10px 12px',color:'#fff',fontSize:14,outline:'none',boxSizing:'border-box'}
  return(
    <div style={{maxWidth:800}}>
      <div style={{marginBottom:16}}>
        <label style={{fontSize:13,color:'#94a3b8',display:'block',marginBottom:6}}>Dilekce Turu</label>
        <select value={turId} onChange={e=>setTurId(e.target.value)} style={{...inp,cursor:'pointer'}}>
          {TURLER.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>
      <div style={{marginBottom:16}}>
        <label style={{fontSize:13,color:'#94a3b8',display:'block',marginBottom:6}}>Muvekkil Bilgileri</label>
        <textarea value={muvekkilBilgi} onChange={e=>setMuvekkilBilgi(e.target.value)} rows={4} placeholder='Muvekkil adi, konu, taraflar, tarihler...' style={{...inp,resize:'vertical'}}/>
      </div>
      <div style={{marginBottom:16}}>
        <label style={{fontSize:13,color:'#94a3b8',display:'block',marginBottom:6}}>Ek Bilgiler</label>
        <textarea value={ekBilgi} onChange={e=>setEkBilgi(e.target.value)} rows={3} placeholder='Varsa ek aciklamalar...' style={{...inp,resize:'vertical'}}/>
      </div>
      {error&&<div style={{background:'rgba(220,38,38,0.1)',border:'1px solid rgba(220,38,38,0.3)',borderRadius:8,padding:10,color:'#fca5a5',fontSize:13,marginBottom:12}}>{error}</div>}
      <button onClick={generate} disabled={loading} style={{background:'#10B981',border:'none',borderRadius:8,padding:'12px 24px',color:'#fff',fontSize:15,fontWeight:600,cursor:'pointer',opacity:loading?0.7:1,marginBottom:24}}>
        {loading?'Olusturuluyor...':'Dilekce Olustur'}
      </button>
      {result&&(
        <div style={{background:'#1e293b',borderRadius:12,padding:20,marginBottom:24}}>
          {result.uyarilar?.length>0&&<div style={{marginBottom:12,display:'flex',flexWrap:'wrap',gap:6}}>{result.uyarilar.map((u,i)=><span key={i} style={{background:'rgba(220,38,38,0.2)',color:'#fca5a5',padding:'3px 10px',borderRadius:20,fontSize:12}}>{u}</span>)}</div>}
          {result.eksik_bilgiler?.length>0&&<div style={{marginBottom:12,display:'flex',flexWrap:'wrap',gap:6}}>{result.eksik_bilgiler.map((e,i)=><span key={i} style={{background:'rgba(234,179,8,0.2)',color:'#fde047',padding:'3px 10px',borderRadius:20,fontSize:12}}>{e}</span>)}</div>}
          <pre style={{whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13,lineHeight:1.7,margin:0}}>{result.dilekce_metni}</pre>
          <button onClick={()=>navigator.clipboard.writeText(result!.dilekce_metni)} style={{marginTop:12,background:'rgba(255,255,255,0.1)',border:'none',borderRadius:6,padding:'6px 16px',color:'#94a3b8',cursor:'pointer',fontSize:13}}>Kopyala</button>
        </div>
      )}
      {gecmis.length>0&&(
        <div>
          <div style={{fontSize:13,color:'#64748b',marginBottom:10}}>Son Dilekceler</div>
          {gecmis.map((g,i)=>(
            <div key={i} style={{background:'#1e293b',borderRadius:8,padding:'10px 14px',marginBottom:8,display:'flex',justifyContent:'space-between'}}>
              <span style={{fontSize:13,color:'#94a3b8'}}>{String(g.dilekce_turu)}</span>
              <span style={{fontSize:12,color:'#64748b'}}>{new Date(String(g.created_at)).toLocaleDateString('tr-TR')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
