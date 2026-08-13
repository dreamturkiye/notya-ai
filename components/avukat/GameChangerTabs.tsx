'use client'
import { useState, useEffect, useCallback } from 'react'

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
  const [muvekkiller, setMuvekkiller] = useState<any[]>([])
  const [portalTokens, setPortalTokens] = useState<any[]>([])
  const [portalLoading, setPortalLoading] = useState(true)
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [portalError, setPortalError] = useState('')
  const [portalLink, setPortalLink] = useState('')

  const loadPortal = useCallback(async () => {
    setPortalLoading(true)
    setPortalError('')
    try {
      const res = await fetch('/api/avukat/portal', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ admin: true, action: 'list' }) })
      const data = await res.json()
      if (data?.success && data.data) {
        setMuvekkiller(Array.isArray(data.data.muvekkiller) ? data.data.muvekkiller : [])
        setPortalTokens(Array.isArray(data.data.tokens) ? data.data.tokens : [])
      } else {
        setMuvekkiller([])
        setPortalTokens([])
        setPortalError(String(data?.error || 'Portal verileri yüklenemedi.'))
      }
    } catch {
      setPortalError('Bağlantı hatası. Portal verileri yüklenemedi.')
    }
    setPortalLoading(false)
  }, [token])

  useEffect(() => {
    if (activeTab === 'portal' && token) loadPortal()
  }, [activeTab, token, loadPortal])

  async function generateLink(muvekkilId: string) {
    setGeneratingFor(muvekkilId)
    setPortalError('')
    try {
      const res = await fetch('/api/avukat/portal', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ admin: true, muvekkilId }) })
      const data = await res.json()
      const url = data?.data?.portalUrl || (data?.data?.token ? window.location.origin + '/portal/avukat/' + data.data.token : '')
      if (data?.success && url) {
        setPortalLink(String(url))
        try {
          await navigator.clipboard.writeText(String(url))
          setCopiedId(muvekkilId)
          setTimeout(() => setCopiedId(null), 3000)
        } catch {
          // Clipboard blocked; the link is shown below the list instead.
        }
        await loadPortal()
      } else {
        setPortalError(String(data?.error || 'Link oluşturulamadı.'))
      }
    } catch {
      setPortalError('Bağlantı hatası. Link oluşturulamadı.')
    }
    setGeneratingFor(null)
  }

  async function revokeLink(tokenId: string) {
    setRevokingId(tokenId)
    setPortalError('')
    try {
      const res = await fetch('/api/avukat/portal', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ admin: true, action: 'revoke', tokenId }) })
      const data = await res.json()
      if (!data?.success) setPortalError(String(data?.error || 'Link iptal edilemedi.'))
      setPortalLink('')
      await loadPortal()
    } catch {
      setPortalError('Bağlantı hatası. Link iptal edilemedi.')
    }
    setRevokingId(null)
  }

  async function genDilekce() {
    setDilekceLoading(true)
    setDilekceOut('')
    try {
      const res = await fetch('/api/avukat/dilekce', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ turId: dilektceTur, muvekkil_bilgileri: { aciklama: dilekceInput } }) })
      const data = await res.json()
      setDilekceOut(
        data?.success && data?.data?.dilekce_metni
          ? String(data.data.dilekce_metni)
          : String(data?.error || 'Dilekce olusturulamadi.')
      )
    } catch { setDilekceOut('Bağlantı hatası') }
    setDilekceLoading(false)
  }

  async function araIctihat() {
    setIctihatLoading(true)
    setIctihatOut('')
    try {
      const res = await fetch('/api/avukat/ictihat-ara', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ query: ictihatQ }) })
      const data = await res.json()
      if (data?.success && data.data) {
        const parts = [data.data.ozet, data.data.strateji_onerisi].filter(Boolean).map(String)
        setIctihatOut(parts.length ? parts.join('\n\n') : 'Sonuc bulunamadi.')
      } else setIctihatOut(String(data?.error || 'Arama basarisiz.'))
    } catch { setIctihatOut('Bağlantı hatası') }
    setIctihatLoading(false)
  }

  async function analizSozlesme() {
    setSozLoading(true)
    setSozOut('')
    try {
      const res = await fetch('/api/avukat/sozlesme-analiz', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ sozlesmeMetni: sozMetin, sozlesmeTuru: sozTur }) })
      const data = await res.json()
      if (data?.success && data.data) {
        const d = data.data
        const riskler = Array.isArray(d.riskler) ? d.riskler : []
        const riskStr = riskler
          .map((r: Record<string, unknown>) =>
            String(r?.ciddiyet || 'RISK').toUpperCase() + ': ' + String(r?.metin || '') + ' -> ' + String(r?.oneri || '')
          )
          .join('\n')
        setSozOut(
          'PUAN: ' + (d.genel_puan ?? '—') + '/100\n\n' +
          String(d.ozet || 'Ozet yok.') +
          (riskStr ? '\n\nRISKLER:\n' + riskStr : '')
        )
      } else setSozOut(String(data?.error || 'Analiz basarisiz.'))
    } catch { setSozOut('Bağlantı hatası') }
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
          <option value='kvkk_veri_ihlali_bildirimi'>KVKK Veri Ihlali Bildirimi</option>
          <option value='kvkk_kurula_sikayet'>KVKK Kurula Sikayet</option>
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

  if (activeTab === 'portal') {
    const daysLeft = (expiresAt: string) => Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 86400000))
    const tokenFor = (muvekkilId: string) => portalTokens.find((t: any) => t.muvekkil_id === muvekkilId)
    return (
      <div style={{ maxWidth: 800 }}>
        <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#6D28D9)', borderRadius: 10, padding: 16, marginBottom: 16, color: '#fff' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Muvekkil Portali</div>
          <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.6 }}>Her muvekkil icin imzali, sureli link olusturun. Link istediginiz an iptal edilebilir.</div>
        </div>
        {portalError && (
          <div style={{ background: '#7F1D1D', border: '1px solid #FCA5A5', color: '#FEE2E2', borderRadius: 8, padding: '11px 13px', marginBottom: 14, fontSize: 13, lineHeight: 1.5 }}>
            {portalError}
          </div>
        )}
        {portalLink && (
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>Son olusturulan portal linki</div>
            <div style={{ fontSize: 12, color: '#E2E8F0', wordBreak: 'break-all', fontFamily: 'ui-monospace,monospace' }}>{portalLink}</div>
          </div>
        )}
        {portalLoading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>Yukleniyor...</div>
        ) : muvekkiller.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>Henuz muvekkil eklemediniz.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {muvekkiller.map((m: any) => {
              const t = tokenFor(m.id)
              const active = !!t
              const left = active ? daysLeft(t.expires_at) : 0
              return (
                <div key={m.id} style={{ background: '#1e293b', borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>{m.ad} {m.soyad}</div>
                    {m.dava_turu && <div style={{ fontSize: 12, color: '#94A3B8' }}>{m.dava_turu}</div>}
                    {active && <div style={{ fontSize: 11, color: left <= 3 ? '#DC2626' : '#059669', marginTop: 2 }}>Aktif link — {left} gun kaldi | {t.access_count || 0} kullanim</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {active && (
                      <button onClick={() => revokeLink(t.id)} disabled={revokingId === t.id} style={{ padding: '6px 12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        {revokingId === t.id ? '...' : 'Iptal'}
                      </button>
                    )}
                    <button onClick={() => generateLink(m.id)} disabled={generatingFor === m.id} style={{ padding: '6px 14px', background: copiedId === m.id ? '#059669' : '#6D28D9', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {generatingFor === m.id ? 'Olusturuluyor...' : copiedId === m.id ? 'Kopyalandi!' : active ? 'Yenile & Kopyala' : 'Link Olustur'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return null
}