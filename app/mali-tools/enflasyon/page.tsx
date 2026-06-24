'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// TUFE Endeksleri - GIB Teblig 555 No baz yili: Aralik 2021 = 100
const TUFE: Record<string,number> = {
  '2021-12':100.00, '2022-06':126.89, '2022-12':184.15,
  '2023-06':259.33, '2023-12':393.72, '2024-06':573.41,
  '2024-12':789.51, '2025-06':924.15, '2025-12':1045.22,
  '2026-06':1124.88
}

export default function EnflasyonPage() {
  const router = useRouter()
  const [kayitDegeri, setKayitDegeri] = useState('')
  const [edinmeTarihi, setEdinmeTarihi] = useState('2022-12')
  const [hedefTarih, setHedefTarih] = useState('2025-12')
  const [varlikTuru, setVarlikTuru] = useState('sabit_kiymet')
  const [result, setResult] = useState<Record<string,number>|null>(null)

  function hesapla() {
    const deger = Number(kayitDegeri)
    if (!deger || deger <= 0) return
    const tufeBaslangic = TUFE[edinmeTarihi]
    const tufeBitis = TUFE[hedefTarih]
    if (!tufeBaslangic || !tufeBitis) { alert('Secilen donem icin endeks bulunamadi'); return }
    const katsayi = tufeBitis / tufeBaslangic
    const duzeltilmisDeger = deger * katsayi
    const enflasyonFarki = duzeltilmisDeger - deger
    const amortismanBazis = varlikTuru !== 'stok' ? duzeltilmisDeger : deger
    setResult({ deger, katsayi, duzeltilmisDeger, enflasyonFarki, amortismanBazis, tufeBaslangic, tufeBitis })
  }

  const fmt = (n:number) => n.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})
  const G = '#10B981'
  const inp: React.CSSProperties = { width:'100%',padding:'10px 12px',border:'1px solid #E2E8F0',borderRadius:8,fontSize:14,outline:'none',boxSizing:'border-box' }

  const donemler = Object.keys(TUFE).map(k => ({ value:k, label:k.replace('-','/') }))

  return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',fontFamily:'system-ui,sans-serif'}}>
      <nav style={{background:'#0A1628',padding:'0 20px',height:56,display:'flex',alignItems:'center',gap:12}}>
        <button onClick={()=>router.push('/mali-tools')} style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:20}}>{'<'}</button>
        <span style={{color:'#fff',fontWeight:700}}>Enflasyon Muhasebesi Hesaplayici</span>
      </nav>
      <div style={{maxWidth:560,margin:'0 auto',padding:'24px 16px'}}>
        <div style={{background:'#FEF3C7',border:'1px solid #F59E0B',borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:13,color:'#78350F'}}>
          VUK 555 No.lu Teblig bazli. Buyuksehir esnafi 1.1.2026 itibaren gercek usule gectigi icin enflasyon duzeltmesi zorunludur.
        </div>
        <div style={{background:'#fff',borderRadius:12,padding:24,border:'1px solid #E2E8F0',marginBottom:20}}>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:5}}>Kayitli Deger (TL)</label>
            <input type='number' value={kayitDegeri} onChange={e=>setKayitDegeri(e.target.value)} placeholder='ornek: 500000' style={inp} />
          </div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:5}}>Varlik Turu</label>
            <select value={varlikTuru} onChange={e=>setVarlikTuru(e.target.value)} style={{...inp,cursor:'pointer'}}>
              <option value='sabit_kiymet'>Sabit Kiymet (makine, arazi, bina)</option>
              <option value='stok'>Stok / Emtia</option>
              <option value='istirak'>Istirak / Finansal Varlik</option>
            </select>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:5}}>Edinme Tarihi (Donem)</label>
              <select value={edinmeTarihi} onChange={e=>setEdinmeTarihi(e.target.value)} style={{...inp,cursor:'pointer'}}>
                {donemler.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:5}}>Duzeltme Tarihi</label>
              <select value={hedefTarih} onChange={e=>setHedefTarih(e.target.value)} style={{...inp,cursor:'pointer'}}>
                {donemler.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>
          <button onClick={hesapla} disabled={!kayitDegeri} style={{width:'100%',background:G,border:'none',color:'#fff',padding:'13px',borderRadius:9,cursor:'pointer',fontWeight:700,fontSize:15,opacity:!kayitDegeri?0.5:1}}>Hesapla</button>
        </div>
        {result && (
          <div style={{background:'#fff',borderRadius:12,padding:24,border:'1px solid #E2E8F0'}}>
            <div style={{fontWeight:700,fontSize:16,marginBottom:16,color:'#1E293B'}}>Duzeltme Sonucu</div>
            {[
              ['Orijinal Kayitli Deger', fmt(result.deger) + ' TL', false],
              ['TUFE Katsayisi', result.katsayi.toFixed(4), false],
              ['Duzeltilmis Deger', fmt(result.duzeltilmisDeger) + ' TL', true],
              ['Enflasyon Farki (GV Matrah Etkisi)', fmt(result.enflasyonFarki) + ' TL', false],
              ['Amortisman Bazis Degeri', fmt(result.amortismanBazis) + ' TL', false],
            ].map(([l,v,bold]) => (
              <div key={String(l)} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid #F1F5F9'}}>
                <span style={{fontSize:13,color:'#374151'}}>{String(l)}</span>
                <span style={{fontSize:14,fontWeight:bold?700:600,color:bold?G:'#1E293B'}}>{String(v)}</span>
              </div>
            ))}
            <div style={{background:'#F0FDF4',borderRadius:8,padding:'12px',marginTop:12,fontSize:12,color:'#065F46',lineHeight:'1.6'}}>
              Yasal dayanak: VUK 555 No.lu Teblig. Duzeltme Aralik 2023 baz doneminden itibaren zorunludur. Sonuclari SMMM ile teyit edin.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}