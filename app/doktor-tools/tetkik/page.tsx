'use client'

import DoktorNav from '@/components/doktor/DoktorNav'
import {
  getAccessToken, getAccessTokenAsync,
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


const vucutBolgeleri = ['Baş', 'Boyun', 'Göğüs', 'Karın', 'Pelvis', 'Omurga', 'Kol', 'Bacak']
const modaliteler = ['X-Ray', 'USG', 'MRI', 'BT', 'PET-BT', 'EKO', 'EEG', 'EMG']

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
  const [doktorAdi, setDoktorAdi] = useState('Doktor')

  useEffect(() => {
    try {
      setDoktorAdi(localStorage.getItem('notya_doktor_name') || 'Doktor')
    } catch {
      /* ignore */
    }
    const load = async () => {
      const token = await getAccessTokenAsync()
      if (!token) return
      try {
        const res = await fetch('/api/doktor/hastalar', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        setHastalar(normalizeHastalar(await res.json()))
      } catch {
        setError('Hasta listesi alınamadı.')
      }
    }
    void load()
  }, [])

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
    border: `1px solid ${active ? 'rgba(15,155,142,0.55)' : 'rgba(255,255,255,0.12)'}`,
    background: active ? 'rgba(15,155,142,0.12)' : 'rgba(255,255,255,0.03)',
    cursor: 'pointer',
    minWidth: 0,
  })

  return (
    <div style={toolsShell}>
      <DoktorNav />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px 48px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#14B8A6', letterSpacing: 1.2, marginBottom: 8 }}>
          ARAÇLAR
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#FFFFFF' }}>Tetkik İstek Formu</h1>
        <p style={{ marginTop: 8, color: '#94A3B8', fontSize: 14 }}>Lab ve görüntüleme istek formu oluşturun.</p>

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
                background: activeTab === key ? '#0F9B8E' : 'rgba(255,255,255,0.08)',
                color: activeTab === key ? '#041016' : '#CBD5E1',
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
                      style={{ background: 'rgba(15,155,142,0.12)', border: '1px solid rgba(15,155,142,0.45)', color: '#5EEAD4', borderRadius: 999, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
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
                    <input type="checkbox" checked={!!selectedLabTests[x.ad]} onChange={() => setSelectedLabTests((prev) => ({ ...prev, [x.ad]: !prev[x.ad] }))} style={{ marginTop: 2, accentColor: '#0F9B8E', flexShrink: 0 }} />
                    <span style={{ color: '#F8FAFC', fontSize: 13, lineHeight: 1.35, wordBreak: 'break-word' }}>
                      {x.ad}
                      <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                        {!bolum ? `${TETKIK_BOLUMU.get(x.ad)} · ` : ''}{NUMUNE_ADI[x.n]}{x.aclik ? ' · açlık' : ''}{x.not ? ` · ${x.not}` : ''}
                      </span>
                    </span>
                  </label>
                ))}
                {gorunen.length === 0 && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Eşleşen tetkik yok — Ekstra Tetkikler alanına yazabilirsiniz.</div>}
              </div>

              {/* Seçilenler */}
              {selectedTests.length > 0 && (
                <div>
                  <label style={toolsLabel}>Seçilen Tetkikler ({selectedTests.length})</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedTests.map((t) => (
                      <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 999, padding: '4px 10px', fontSize: 12, color: '#F8FAFC' }}>
                        {t}
                        <button type="button" onClick={() => setSelectedLabTests((prev) => ({ ...prev, [t]: false }))} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }} aria-label={`${t} kaldır`}>×</button>
                      </span>
                    ))}
                    <button type="button" onClick={() => setSelectedLabTests({})} style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: 12 }}>Tümünü temizle</button>
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
                        style={{ marginTop: 2, accentColor: '#0F9B8E', flexShrink: 0 }}
                      />
                      <span style={{ color: '#F8FAFC', fontSize: 13 }}>{m}</span>
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

      {showPrintable && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            id="print-area"
            style={{
              background: '#fff',
              color: '#0F172A',
              width: '100%',
              maxWidth: 720,
              maxHeight: '90dvh',
              overflow: 'auto',
              borderRadius: 16,
              padding: 22,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #CBD5E1', paddingBottom: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>TETKİK İSTEK FORMU</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>TC SAĞLIK BAKANLIĞI</div>
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>{new Date().toLocaleDateString('tr-TR')}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, fontSize: 14 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Doktor</div>
                <div>Dr. {doktorAdi}</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Hasta</div>
                <div>{selectedHasta?.label || '—'}</div>
              </div>
            </div>

            <div style={{ marginBottom: 16, fontSize: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>İstenen Tetkikler</div>
              {activeTab === 'lab' ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {[...selectedTests, ...(customTests ? [customTests] : [])].length ? (
                    [...selectedTests, ...(customTests ? [customTests] : [])].map((t) => {
                      const k = TUM_TETKIKLER.find((x) => x.ad === t)
                      return (
                        <li key={t}>
                          {t}
                          {k ? <span style={{ color: '#64748B', fontSize: 12 }}> — {NUMUNE_ADI[k.n]}{k.aclik ? ', açlık gerekir' : ''}{k.not ? `, ${k.not}` : ''}</span> : null}
                        </li>
                      )
                    })
                  ) : (
                    <li>Seçili tetkik yok</li>
                  )}
                </ul>
              ) : (
                <div>
                  <div>Vücut Bölgesi: {vucutBolgesi || '—'}</div>
                  <div>Modalite: {modalite || '—'}</div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 18, fontSize: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Klinik Endikasyon</div>
              <div style={{ border: '1px solid #CBD5E1', borderRadius: 12, padding: 12, minHeight: 64 }}>
                {klinikEndikasyon || 'Belirtilmemiş'}
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => window.print()} style={toolsPrimaryBtn(false)}>
                Yazdır
              </button>
              <button
                type="button"
                onClick={() => setShowPrintable(false)}
                style={{
                  ...toolsPrimaryBtn(false),
                  background: '#E2E8F0',
                  color: '#0F172A',
                }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print, nav { display: none !important; }
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; max-height: none; }
        }
      `}</style>
    </div>
  )
}
