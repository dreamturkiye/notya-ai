'use client'
import {
  getAccessTokenAsync,
  normalizeHastalar,
  toolsCard,
  toolsErrorBox,
  toolsInput,
  toolsLabel,
  toolsPrimaryBtn,
  toolsShell,
  type HastaOption,
} from '@/lib/doktor/toolsUi'
import React, { useEffect, useMemo, useState } from 'react'
import { TETKIK_KATALOGU, TETKIK_PANELLERI, TETKIK_BOLUMU, NUMUNE_ADI, TUM_TETKIKLER, tetkikAra } from '@/lib/doktor/tetkikKatalogu'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'
import { BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari'
import { hekimUnvanli } from '@/lib/doktor/hekimAdi'


const vucutBolgeleri = ['Baş', 'Boyun', 'Göğüs', 'Karın', 'Pelvis', 'Omurga', 'Kol', 'Bacak']
const modaliteler = ['Röntgen', 'USG', 'MR', 'BT', 'PET-BT', 'EKO', 'EKG', 'Mamografi', 'EEG', 'EMG']

export default function TetkikPage() {
  const [activeTab, setActiveTab] = useState<'lab' | 'goruntuleme'>('lab')
  const [hastalar, setHastalar] = useState<HastaOption[]>([])
  const [selectedHastaId, setSelectedHastaId] = useState('')
  const [klinikEndikasyon, setKlinikEndikasyon] = useState('')
  const [selectedLabTests, setSelectedLabTests] = useState<Record<string, boolean>>({})
  const [customTests, setCustomTests] = useState('')
  const [bolum, setBolum] = useState<string>('')
  const [arama, setArama] = useState('')
  const gorunen = useMemo(() => tetkikAra(arama, bolum || undefined), [arama, bolum])
  const [vucutBolgesi, setVucutBolgesi] = useState('')
  const [modalite, setModalite] = useState('')
  const [showPrintable, setShowPrintable] = useState(false)
  const [error, setError] = useState('')
  const [baslik, setBaslik] = useState<{
    unvan: string
    ad: string
    brans: string
    klinik: string
    satirlar: string[]
    diplomaNo: string
    logoDataUrl: string
  }>({ unvan: 'Dr.', ad: '', brans: '', klinik: '', satirlar: [], diplomaNo: '', logoDataUrl: '' })
  const [hastaYas, setHastaYas] = useState('')

  useEffect(() => {
    const load = async () => {
      const token = await getAccessTokenAsync()
      if (!token) return
      try {
        const [hastaR, baslikR] = await Promise.all([
          fetch('/api/doktor/hastalar', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/doktor/recete-baslik', { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (hastaR.ok) setHastalar(normalizeHastalar(await hastaR.json()))
        if (baslikR.ok) {
          const p = await baslikR.json() as {
            hekim?: string; unvan?: string; brans?: string; klinik?: string
            satirlar?: string[]; diplomaNo?: string; logoDataUrl?: string
          }
          setBaslik({
            unvan: String(p.unvan || 'Dr.'),
            ad: String(p.hekim || ''),
            brans: String(p.brans || ''),
            klinik: String(p.klinik || ''),
            satirlar: Array.isArray(p.satirlar) ? p.satirlar.map(String).filter(Boolean) : [],
            diplomaNo: String(p.diplomaNo || ''),
            logoDataUrl: String(p.logoDataUrl || ''),
          })
        }
      } catch {
        setError('Hasta listesi alınamadı.')
      }
    }
    void load()
  }, [])

  useEffect(() => {
    if (!selectedHastaId) { setHastaYas(''); return }
    let iptal = false
    void (async () => {
      const token = await getAccessTokenAsync()
      if (!token) return
      try {
        const r = await fetch(`/api/doktor/hastalar/${encodeURIComponent(selectedHastaId)}`, { headers: { Authorization: `Bearer ${token}` } })
        if (!r.ok || iptal) return
        const j = await r.json() as { patient?: { dogum_tarihi?: string | null; cinsiyet?: string | null } }
        const dogum = j.patient?.dogum_tarihi || ''
        if (!dogum) { if (!iptal) setHastaYas(''); return }
        const d = new Date(dogum)
        if (isNaN(d.getTime())) { if (!iptal) setHastaYas(''); return }
        const ay = Math.floor((Date.now() - d.getTime()) / (30.44 * 86400000))
        const yas = ay < 24 ? `${ay} aylık` : `${Math.floor(ay / 12)} yaş`
        const cins = j.patient?.cinsiyet
        const c = cins === 'male' || cins === 'Erkek' ? 'E' : cins === 'female' || cins === 'Kadın' || cins === 'Kız/Kadın' ? 'K' : ''
        if (!iptal) setHastaYas(c ? `${yas} · ${c}` : yas)
      } catch { /* yaş kâğıtta boş kalır */ }
    })()
    return () => { iptal = true }
  }, [selectedHastaId])

  const selectedHasta = hastalar.find((h) => h.id === selectedHastaId) || null
  const selectedTests = Object.keys(selectedLabTests).filter((t) => selectedLabTests[t])

  const handleOlustur = () => {
    if (!selectedHastaId) {
      setError('Lütfen hasta seçin.')
      return
    }
    setError('')
    setShowPrintable(true)
  }

  const choiceStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 12,
    border: `1px solid ${active ? CHROME_RENK.pine + '88' : CHROME_RENK.border}`,
    background: active ? '#E4F3F1' : '#FFFFFF',
    cursor: 'pointer',
    minWidth: 0,
  })

  return (
    <div style={toolsShell}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px 48px' }}>
        <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>
          Araçlar
        </div>
        <h1 style={{ margin: 0, fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, color: '#2e251d', letterSpacing: '-0.02em' }}>Tetkik İstek Formu</h1>
        <p style={{ marginTop: 8, color: CHROME_RENK.muted, fontSize: 14 }}>Lab ve görüntüleme istek formu oluşturun.</p>

        {error && <div style={toolsErrorBox}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }} className="no-print">
          {([
            ['lab', 'Lab İstekleri'],
            ['goruntuleme', 'Görüntüleme'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              style={{
                padding: '10px 16px',
                borderRadius: 999,
                border: 'none',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                background: activeTab === key ? CHROME_RENK.pine : '#EFE9DC',
                color: activeTab === key ? '#FAF8F4' : CHROME_RENK.muted,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ ...toolsCard, marginTop: 16 }} className="no-print">
          <label style={toolsLabel}>Hasta</label>
          <select
            value={selectedHastaId}
            onChange={(e) => setSelectedHastaId(e.target.value)}
            style={{ ...toolsInput, marginBottom: 16 }}
          >
            <option value="">Hasta seçiniz...</option>
            {hastalar.map((h) => (
              <option key={h.id} value={h.id} style={{ color: '#000' }}>
                {h.label}
              </option>
            ))}
          </select>

          <label style={toolsLabel}>Klinik Endikasyon</label>
          <textarea
            value={klinikEndikasyon}
            onChange={(e) => setKlinikEndikasyon(e.target.value)}
            rows={4}
            placeholder="Klinik endikasyon bilgilerini giriniz..."
            style={{ ...toolsInput, resize: 'vertical', marginBottom: 16 }}
          />

          {activeTab === 'lab' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Hazır paneller — tek tıkla ekle, sonra düzenle */}
              <div>
                <label style={toolsLabel}>Hazır Paneller</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Object.entries(TETKIK_PANELLERI).map(([ad, liste]) => (
                    <button key={ad} type="button" onClick={() => setSelectedLabTests((prev) => { const n = { ...prev }; liste.forEach((t) => { n[t] = true }); return n })}
                      style={{ background: '#E4F3F1', border: `1px solid ${CHROME_RENK.pine}70`, color: CHROME_RENK.pine, borderRadius: 999, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
                      + {ad} <span style={{ opacity: 0.6 }}>({liste.length})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bölüm + arama */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div>
                  <label style={toolsLabel}>Laboratuvar Bölümü</label>
                  <select value={bolum} onChange={(e) => setBolum(e.target.value)} style={toolsInput}>
                    <option value="">Tüm bölümler ({TUM_TETKIKLER.length} test)</option>
                    {TETKIK_KATALOGU.map((b) => (
                      <option key={b.bolum} value={b.bolum} style={{ color: '#000' }}>{b.bolum} ({b.testler.length})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={toolsLabel}>Tetkik Ara</label>
                  <input type="text" value={arama} onChange={(e) => setArama(e.target.value)} placeholder="hba1c, ferritin, anti-tpo, kültür…" autoComplete="off" style={toolsInput} />
                </div>
              </div>

              {/* Sonuçlar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 8, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
                {gorunen.map((x) => (
                  <label key={x.ad} style={choiceStyle(!!selectedLabTests[x.ad])}>
                    <input type="checkbox" checked={!!selectedLabTests[x.ad]} onChange={() => setSelectedLabTests((prev) => ({ ...prev, [x.ad]: !prev[x.ad] }))} style={{ marginTop: 2, accentColor: CHROME_RENK.pine, flexShrink: 0 }} />
                    <span style={{ color: CHROME_RENK.ink, fontSize: 13, lineHeight: 1.35, wordBreak: 'break-word' }}>
                      {x.ad}
                      <span style={{ display: 'block', fontSize: 11, color: CHROME_RENK.muted }}>
                        {!bolum ? `${TETKIK_BOLUMU.get(x.ad)} · ` : ''}{NUMUNE_ADI[x.n]}{x.aclik ? ' · açlık' : ''}{x.not ? ` · ${x.not}` : ''}
                      </span>
                    </span>
                  </label>
                ))}
                {gorunen.length === 0 && <div style={{ color: CHROME_RENK.muted, fontSize: 13 }}>Eşleşen tetkik yok — Ekstra Tetkikler alanına yazabilirsiniz.</div>}
              </div>

              {/* Seçilenler */}
              {selectedTests.length > 0 && (
                <div>
                  <label style={toolsLabel}>Seçilen Tetkikler ({selectedTests.length})</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedTests.map((t) => (
                      <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFE9DC', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 999, padding: '4px 10px', fontSize: 12, color: CHROME_RENK.ink }}>
                        {t}
                        <button type="button" onClick={() => setSelectedLabTests((prev) => ({ ...prev, [t]: false }))} style={{ background: 'none', border: 'none', color: CHROME_RENK.muted, cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }} aria-label={`${t} kaldır`}>×</button>
                      </span>
                    ))}
                    <button type="button" onClick={() => setSelectedLabTests({})} style={{ background: 'none', border: 'none', color: CHROME_RENK.warn, cursor: 'pointer', fontSize: 12 }}>Tümünü temizle</button>
                  </div>
                </div>
              )}

              <div>
                <label style={toolsLabel}>Ekstra Tetkikler</label>
                <input
                  type="text"
                  value={customTests}
                  onChange={(e) => setCustomTests(e.target.value)}
                  placeholder="Özel tetkik isteklerini yazınız..."
                  style={toolsInput}
                />
              </div>
            </div>
          )}

          {activeTab === 'goruntuleme' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={toolsLabel}>Vücut Bölgesi</label>
                <select value={vucutBolgesi} onChange={(e) => setVucutBolgesi(e.target.value)} style={toolsInput}>
                  <option value="">Bölge seçiniz...</option>
                  {vucutBolgeleri.map((b) => (
                    <option key={b} value={b} style={{ color: '#000' }}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={toolsLabel}>Modalite</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                  {modaliteler.map((m) => (
                    <label key={m} style={choiceStyle(modalite === m)}>
                      <input
                        type="radio"
                        name="modalite"
                        value={m}
                        checked={modalite === m}
                        onChange={(e) => setModalite(e.target.value)}
                        style={{ marginTop: 2, accentColor: CHROME_RENK.pine, flexShrink: 0 }}
                      />
                      <span style={{ color: CHROME_RENK.ink, fontSize: 13 }}>{m}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleOlustur}
            disabled={!selectedHastaId}
            style={{ ...toolsPrimaryBtn(!selectedHastaId), marginTop: 18 }}
          >
            Form Oluştur
          </button>
        </div>
      </div>

      {showPrintable && (() => {
        const bransAd = (BRANS_ETIKETLERI[baslik.brans as keyof typeof BRANS_ETIKETLERI] || baslik.brans || '').replace(/\s*\(.*\)\s*$/, '')
        const hekimSatir = hekimUnvanli(baslik.ad || `${baslik.unvan}`.trim()) || '________________'
        const tarih = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric' })
        const hastaAd = [selectedHasta?.ad, selectedHasta?.soyad].filter(Boolean).join(' ') || selectedHasta?.label?.split(' — ')[0] || '________________'
        const tetkikler = activeTab === 'lab'
          ? [...selectedTests, ...(customTests ? [customTests] : [])]
          : [vucutBolgesi && modalite ? `${modalite} — ${vucutBolgesi}` : modalite || vucutBolgesi].filter(Boolean) as string[]
        return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div style={{ maxHeight: '92dvh', overflow: 'auto', width: '100%', maxWidth: 560 }}>
            <div
              id="print-area"
              className="tetkik-kagit"
              style={{
                background: 'white',
                color: '#111',
                width: '100%',
                minHeight: 740,
                boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                padding: '36px 40px',
                boxSizing: 'border-box',
                fontFamily: 'Georgia, "Times New Roman", serif',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ textAlign: 'center', borderBottom: '1.5px solid #111', paddingBottom: 8, marginBottom: 14 }}>
                {baslik.logoDataUrl && <img src={baslik.logoDataUrl} alt="" style={{ height: 44, marginBottom: 4 }} />}
                {baslik.satirlar.length > 0
                  ? baslik.satirlar.map((s, i) => (
                      <div key={i} style={i === 0 ? { fontSize: 16, fontWeight: 700, letterSpacing: 0.3 } : { fontSize: i === 1 ? 12 : 11, color: i === 1 ? '#111' : '#333' }}>{s}</div>
                    ))
                  : (
                    <>
                      <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.3 }}>{hekimSatir}</div>
                      {bransAd && <div style={{ fontSize: 12 }}>{bransAd} Uzmanı</div>}
                      {baslik.klinik && <div style={{ fontSize: 11, color: '#333' }}>{baslik.klinik}</div>}
                    </>
                  )}
                <div style={{ fontSize: 13, fontStyle: 'italic', marginTop: 8 }}>Tetkik İstek Formu</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 16, gap: 12 }}>
                <div>
                  <div><b>Hasta:</b> {hastaAd}</div>
                  <div><b>Yaş:</b> {hastaYas || '____'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div><b>Tarih:</b> {tarih}</div>
                </div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>İstenen tetkikler</div>
              {tetkikler.length === 0 ? (
                <div style={{ fontSize: 12, color: '#666' }}>Seçili tetkik yok.</div>
              ) : (
                <ol style={{ margin: 0, paddingLeft: 22, fontSize: 13, lineHeight: 1.55 }}>
                  {tetkikler.map((t) => {
                    const k = TUM_TETKIKLER.find((x) => x.ad === t)
                    return (
                      <li key={t} style={{ marginBottom: 8 }}>
                        <b>{t}</b>
                        {k ? <div style={{ paddingLeft: 2, fontStyle: 'italic', color: '#333' }}>{NUMUNE_ADI[k.n]}{k.aclik ? ', açlık gerekir' : ''}{k.not ? `, ${k.not}` : ''}</div> : null}
                      </li>
                    )
                  })}
                </ol>
              )}

              <div style={{ marginTop: 18, fontSize: 13 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Klinik endikasyon</div>
                <div style={{ borderBottom: '1px solid #111', minHeight: 48, paddingBottom: 6, whiteSpace: 'pre-wrap' }}>
                  {klinikEndikasyon || ' '}
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 48, display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ textAlign: 'center', fontSize: 11, color: '#333', borderTop: '1px solid #111', paddingTop: 6, minWidth: 180 }}>
                  Kaşe / İmza<br />
                  <span style={{ color: '#666' }}>Diploma No: {baslik.diplomaNo || '____________'}</span>
                </div>
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => window.print()} style={toolsPrimaryBtn(false)}>
                Yazdır
              </button>
              <button
                type="button"
                onClick={() => setShowPrintable(false)}
                style={{
                  ...toolsPrimaryBtn(false),
                  background: '#EFE9DC',
                  color: CHROME_RENK.ink,
                }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
        )
      })()}

      <style>{`
        @media print {
          .no-print, nav { display: none !important; }
          body { background: white !important; }
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; max-height: none; box-shadow: none !important; min-height: auto !important; }
          @page { size: A4 portrait; margin: 12mm; }
        }
      `}</style>
    </div>
  )
}
