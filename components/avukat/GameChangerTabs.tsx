'use client'
import { useState } from 'react'

export default function AvukatGameChangerTabs({ token, activeTab }: { token: string; activeTab: string }) {
  const [dilekceOut, setDilekceOut] = useState('')
  const [dilekceLoading, setDilekceLoading] = useState(false)
  const [dilektceTur, setDilekceTur] = useState('itiraz_dilekce')
  const [dilekceInput, setDilekceInput] = useState('')
  const [ictihatOut, setIctihatOut] = useState('')
  const [ictihatLoading, setIctihatLoading] = useState(false)
  const [ictihatQ, setIctihatQ] = useState('')
  const [sozOut, setSozOut] = useState('')
  const [sozLoading, setSozLoading] = useState(false)
  const [sozMetin, setSozMetin] = useState('')
  const [sozTur, setSozTur] = useState('kira')

  async function genDilekce() {
    setDilekceLoading(true)
    setDilekceOut('')
    try {
      const res = await fetch('/api/avukat/dilekce', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ turId: dilektceTur, muvekkil_bilgileri: { aciklama: dilekceInput } }) })
      const data = await res.json()
      setDilekceOut(data.success ? data.data.dilekce_metni : (data.error || 'Hata'))
    } catch { setDilekceOut('Baglanti hatasi') }
    setDilekceLoading(false)
  }

  async function araIctihat() {
    setIctihatLoading(true)
    setIctihatOut('')
    try {
      const res = await fetch('/api/avukat/ictihat-ara', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ query: ictihatQ }) })
      const data = await res.json()
      if (data.success) setIctihatOut(data.data.ozet + ' ' + data.data.strateji_onerisi)
      else setIctihatOut(data.error || 'Hata')
    } catch { setIctihatOut('Baglanti hatasi') }
    setIctihatLoading(false)
  }

  async function analizSozlesme() {
    setSozLoading(true)
    setSozOut('')
    try {
      const res = await fetch('/api/avukat/sozlesme-analiz', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ sozlesmeMetni: sozMetin, sozlesmeTuru: sozTur }) })
      const data = await res.json()
      if (data.success) {
        const d = data.data
        const riskStr = (d.riskler || []).map((r: {ciddiyet: string; metin: string; oneri: string}) => r.ciddiyet.toUpperCase() + ': ' + r.metin + ' -> ' + r.oneri).join(', ')
        setSozOut('PUAN: ' + d.genel_puan + '/100 | ' + d.ozet + ' | RISKLER: ' + riskStr)
      } else setSozOut(data.error || 'Hata')
    } catch { setSozOut('Baglanti hatasi') }
    setSozLoading(false)
  }

  const inp: React.CSSProperties = { width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const btn = (bg: string): React.CSSProperties => ({ background: bg, border: 'none', borderRadius: 8, padding: '12px 24px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16 })
  const pre: React.CSSProperties = { background: '#1e293b', borderRadius: 8, padding: 16, color: '#e2e8f0', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', minHeight: 80 }

  if (activeTab === 'dilekce') return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 12 }}>
        <select value={dilektceTur} onChange={e => setDilekceTur(e.target.value)} style={{ ...inp, marginBottom: 12, cursor: 'pointer' }}>
          <option value='itiraz_dilekce'>Itiraz Dilekcesi</option>
          <option value='dava_acilis'>Dava Acilis</option>
          <option value='nafaka_talebi'>Nafaka Talebi</option>
          <option value='bosanma_davasi'>Bosanma Davasi</option>
          <option value='is_akdi_feshi'>Haksiz Fesih</option>
          <option value='icra_itiraz'>Icra Itiraz</option>
          <option value='idari_itiraz'>Idari Itiraz</option>
          <option value='tespit_talebi'>Tespit Talebi</option>
        </select>
        <textarea value={dilekceInput} onChange={e => setDilekceInput(e.target.value)} rows={5} placeholder='Muvekkil adi, konu, taraflar, onemli tarihler...' style={{ ...inp, resize: 'vertical', marginBottom: 12 }} />
        <button onClick={genDilekce} disabled={dilekceLoading} style={btn('#2563EB')}>{dilekceLoading ? 'Olusturuluyor...' : 'Dilekce Olustur'}</button>
      </div>
      {dilekceOut && <pre style={pre}>{dilekceOut}</pre>}
    </div>
  )

  if (activeTab === 'ictihat') return (
    <div style={{ maxWidth: 800 }}>
      <input value={ictihatQ} onChange={e => setIctihatQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && araIctihat()} placeholder='Yargitay karari ara... (ornek: kira artisi tahliye)' style={{ ...inp, marginBottom: 12 }} />
      <button onClick={araIctihat} disabled={ictihatLoading} style={btn('#0891B2')}>{ictihatLoading ? 'Aranıyor...' : 'Ara'}</button>
      {ictihatOut && <pre style={pre}>{ictihatOut}</pre>}
    </div>
  )

  if (activeTab === 'sozlesme') return (
    <div style={{ maxWidth: 800 }}>
      <select value={sozTur} onChange={e => setSozTur(e.target.value)} style={{ ...inp, marginBottom: 12, cursor: 'pointer' }}>
        <option value='kira'>Kira Sozlesmesi</option>
        <option value='is'>Is Sozlesmesi</option>
        <option value='ticari'>Ticari Sozlesme</option>
        <option value='hizmet'>Hizmet Sozlesmesi</option>
        <option value='gizlilik'>Gizlilik Sozlesmesi</option>
        <option value='diger'>Diger</option>
      </select>
      <textarea value={sozMetin} onChange={e => setSozMetin(e.target.value)} rows={8} placeholder='Sozlesme metnini buraya yapistirin...' style={{ ...inp, resize: 'vertical', marginBottom: 12 }} />
      <button onClick={analizSozlesme} disabled={sozLoading} style={btn('#059669')}>{sozLoading ? 'Analiz ediliyor...' : 'Analiz Et'}</button>
      {sozOut && <pre style={pre}>{sozOut}</pre>}
    </div>
  )

  return null
}