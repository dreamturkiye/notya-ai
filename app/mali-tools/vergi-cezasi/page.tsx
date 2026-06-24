'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2026 constants
const AYLIK_GECIKME_FAIZI = 0.0236 // %2.36 aylik (Aralik 2025 itibarõyla)
const VERGI_ZIYAI_CEZA_ORANI = 1.0 // %100 vergi ziyai
const USULSUZLUK_BIRINCI_DERECE = 3800 // TL 2026
const USULSUZLUK_IKINCI_DERECE = 1900 // TL 2026

type CezaTuru = 'vergi_ziyai' | 'usulsuzluk_1' | 'usulsuzluk_2' | 'gec_beyanname' | 'gec_kdv'

export default function VergiCezasiPage() {
  const router = useRouter()
  const [cezaTuru, setCezaTuru] = useState<CezaTuru>('vergi_ziyai')
  const [vergiAslõ, setVergiAsli] = useState('')
  const [gecGun, setGecGun] = useState('')
  const [result, setResult] = useState<Record<string,number|string>|null>(null)

  function hesapla() {
    const asl = Number(vergiAsli)
    const gun = Number(gecGun) || 0
    if (!asl && cezaTuru !== 'usulsuzluk_1' && cezaTuru !== 'usulsuzluk_2') return
    let ceza = 0, gecikme = 0, toplam = 0, aciklama = ''
    if (cezaTuru === 'vergi_ziyai') {
      ceza = asl * VERGI_ZIYAI_CEZA_ORANI
      gecikme = asl * AYLIK_GECIKME_FAIZI * (gun / 30)
      toplam = asl + ceza + gecikme
      aciklama = 'VUK Md.344: Vergi Ziyai Cezasi %100 + Gecikme Faizi'
    } else if (cezaTuru === 'gec_beyanname') {
      ceza = asl * 0.5 // 1. derece usulsuzluk
      gecikme = asl * AYLIK_GECIKME_FAIZI * (gun / 30)
      toplam = asl + ceza + gecikme
      aciklama = 'VUK Md.352: Gec Beyanname - Vergi aslinin %50si + gecikme faizi'
    } else if (cezaTuru === 'gec_kdv') {
      ceza = asl * 0.5
      gecikme = asl * AYLIK_GECIKME_FAIZI * (gun / 30)
      toplam = asl + ceza + gecikme
      aciklama = 'KDV Kanunu: Gec odenen KDV icin vergi ziyai + gecikme faizi'
    } else if (cezaTuru === 'usulsuzluk_1') {
      ceza = USULSUZLUK_BIRINCI_DERECE
      toplam = ceza
      aciklama = 'VUK Md.352: 1. Derece Usulsuzluk Cezasi (2026)'
    } else {
      ceza = USULSUZLUK_IKINCI_DERECE
      toplam = ceza
      aciklama = 'VUK Md.352: 2. Derece Usulsuzluk Cezasi (2026)'
    }
    setResult({ asl, ceza, gecikme, toplam, aciklama })
  }

  const fmt = (n:number) => n.toLocaleString('tr-TR',{minimumFractionDigits:2})
  const inp: React.CSSProperties = { width:'100%',padding:'10px 12px',border:'1px solid #E2E8F0',borderRadius:8,fontSize:14,outline:'none',boxSizing:'border-box' }
  const needsAmount = ['vergi_ziyai','gec_beyanname','gec_kdv'].includes(cezaTuru)
  const needsDays = ['vergi_ziyai','gec_beyanname','gec_kdv'].includes(cezaTuru)

  return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',fontFamily:'system-ui,sans-serif'}}>
      <nav style={{background:'#0A1628',padding:'0 20px',height:56,display:'flex',alignItems:'center',gap:12}}>
        <button onClick={()=>router.push('/mali-tools')} style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:20}}>{'<'}</button>
        <span style={{color:'#fff',fontWeight:700}}>Vergi Cezasi Hesaplayici</span>
      </nav>
      <div style={{maxWidth:520,margin:'0 auto',padding:'24px 16px'}}>
        <div style={{background:'#fff',borderRadius:12,padding:24,border:'1px solid #E2E8F0',marginBottom:20}}>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:5}}>Ceza Turu</label>
            <select value={cezaTuru} onChange={e=>{ setCezaTuru(e.target.value as CezaTuru); setResult(null) }} style={{...inp,cursor:'pointer'}}>
              <option value='vergi_ziyai'>Vergi Ziyai Cezasi (%100)</option>
              <option value='gec_beyanname'>Gec Beyanname (VUK Md.352)</option>
              <option value='gec_kdv'>Gec KDV Odemesi</option>
              <option value='usulsuzluk_1'>1. Derece Usulsuzluk</option>
              <option value='usulsuzluk_2'>2. Derece Usulsuzluk</option>
            </select>
          </div>
          {needsAmount && (
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:5}}>Vergi Asli (TL)</label>
              <input type='number' value={vergiAsli} onChange={e=>setVergiAsli(e.target.value)} placeholder='ornek: 50000' style={inp} />
            </div>
          )}
          {needsDays && (
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:5}}>Gecikme Suresi (Gun)</label>
              <input type='number' value={gecGun} onChange={e=>setGecGun(e.target.value)} placeholder='ornek: 45' style={inp} />
            </div>
          )}
          <button onClick={hesapla} style={{width:'100%',background:'#DC2626',border:'none',color:'#fff',padding:'13px',borderRadius:9,cursor:'pointer',fontWeight:700,fontSize:15}}>Hesapla</button>
        </div>
        {result && (
          <div style={{background:'#fff',borderRadius:12,padding:24,border:'1px solid #E2E8F0'}}>
            <div style={{fontWeight:700,fontSize:16,marginBottom:16,color:'#1E293B'}}>Hesaplama Sonucu</div>
            {[
              result.asl > 0 && ['Vergi Asli', fmt(Number(result.asl)) + ' TL', false],
              result.ceza > 0 && ['Vergi Cezasi', fmt(Number(result.ceza)) + ' TL', false],
              result.gecikme > 0 && ['Gecikme Faizi (%2.36/ay)', fmt(Number(result.gecikme)) + ' TL', false],
              ['TOPLAM ODEME', fmt(Number(result.toplam)) + ' TL', true],
            ].filter(Boolean).map((row) => {
              const [l,v,bold] = row as [string,string,boolean]
              return (
                <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid #F1F5F9'}}>
                  <span style={{fontSize:13,color:'#374151'}}>{l}</span>
                  <span style={{fontSize:14,fontWeight:bold?700:600,color:bold?'#DC2626':'#1E293B'}}>{v}</span>
                </div>
              )
            })}
            <div style={{background:'#FEF2F2',borderRadius:8,padding:'12px',marginTop:12,fontSize:12,color:'#7F1D1D',lineHeight:'1.6'}}>
              {String(result.aciklama)} | Aylik gecikme faizi %2.36 (2025 sonu itibarõyla). Mali musavirinizle teyit edin.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}