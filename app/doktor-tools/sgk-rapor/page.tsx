'use client'

import DoktorNav from '@/components/doktor/DoktorNav'
import {
  getAccessToken,
  normalizeHastalar,
  toolsCard,
  toolsErrorBox,
  toolsInput,
  toolsLabel,
  toolsPrimaryBtn,
  toolsShell,
  type HastaOption,
} from '@/lib/doktor/toolsUi'
import React, { useEffect, useState } from 'react'

const raporTipleri = [
  'Kronik Hastalık Raporu',
  'Maluliyet Raporu',
  'İş Göremezlik Belgesi',
  'Sağlık Kurulu Raporu',
]

type RaporPayload = {
  raporBasligi?: string
  hastaAdi?: string
  tcSon4?: string
  tani?: { icd10?: string; aciklama?: string }
  anamnez?: string
  mevcutDurum?: string
  calismaKapasitesi?: string
  onerilen_sure_ay?: number
  hekim_notu?: string
  zorunluTetkikler?: string[]
}

export default function SgkRaporPage() {
  const [hastalar, setHastalar] = useState<HastaOption[]>([])
  const [hastaId, setHastaId] = useState('')
  const [raporTipi, setRaporTipi] = useState(raporTipleri[0])
  const [sure, setSure] = useState(1)
  const [rapor, setRapor] = useState<RaporPayload | null>(null)
  const [tarih, setTarih] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const token = getAccessToken()
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

  const secili = hastalar.find((h) => h.id === hastaId)

  const handleUret = async () => {
    if (!hastaId) {
      setError('Lütfen hasta seçin.')
      return
    }
    setLoading(true)
    setError('')
    setRapor(null)
    try {
      const token = getAccessToken()
      if (!token) {
        setError('Oturum bulunamadı. Tekrar giriş yapın.')
        return
      }
      const res = await fetch('/api/doktor/araclar/sgk-rapor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ hastaId, raporTipi, sure: Number(sure) || 1 }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(String(data?.hata || 'Rapor oluşturulamadı.'))
        return
      }
      const draft = (data?.rapor || data) as RaporPayload
      setRapor(draft)
      setTarih(String(data?.tarih || new Date().toLocaleDateString('tr-TR')))
    } catch {
      setError('Sunucu hatası. Tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={toolsShell}>
      <DoktorNav />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 48px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#14B8A6', letterSpacing: 1.2, marginBottom: 8 }}>
          ARAÇLAR
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#FFFFFF' }}>SGK Rapor Oluştur</h1>
        <p style={{ marginTop: 8, color: '#94A3B8', fontSize: 14, lineHeight: 1.5 }}>
          Resmi SGK rapor taslağını hızlıca üretin.
        </p>

        {error && <div style={toolsErrorBox}>{error}</div>}

        <div style={{ ...toolsCard, marginTop: 20 }} className="no-print">
          <label style={toolsLabel}>Rapor Tipi</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
            {raporTipleri.map((tip) => (
              <label
                key={tip}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: `1px solid ${raporTipi === tip ? 'rgba(15,155,142,0.55)' : 'rgba(255,255,255,0.12)'}`,
                  background: raporTipi === tip ? 'rgba(15,155,142,0.12)' : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="raporTipi"
                  value={tip}
                  checked={raporTipi === tip}
                  onChange={(e) => setRaporTipi(e.target.value)}
                  style={{ marginTop: 3, accentColor: '#0F9B8E', flexShrink: 0 }}
                />
                <span style={{ color: '#F8FAFC', fontSize: 14, lineHeight: 1.4, wordBreak: 'break-word' }}>{tip}</span>
              </label>
            ))}
          </div>

          <label style={toolsLabel}>Hasta</label>
          <select value={hastaId} onChange={(e) => setHastaId(e.target.value)} style={{ ...toolsInput, marginBottom: 16 }}>
            <option value="">Hasta seçiniz</option>
            {hastalar.map((h) => (
              <option key={h.id} value={h.id} style={{ color: '#000' }}>
                {h.label}
              </option>
            ))}
          </select>

          <label style={toolsLabel}>Rapor Süresi (Ay)</label>
          <input
            type="number"
            min={1}
            max={36}
            value={sure}
            onChange={(e) => setSure(parseInt(e.target.value || '1', 10))}
            style={{ ...toolsInput, marginBottom: 18 }}
          />

          <button type="button" onClick={() => void handleUret()} disabled={loading || !hastaId} style={toolsPrimaryBtn(loading || !hastaId)}>
            {loading ? 'Oluşturuluyor...' : 'Üret'}
          </button>
        </div>

        {rapor && (
          <div
            id="rapor-card"
            style={{
              marginTop: 20,
              background: '#FFFFFF',
              color: '#0F172A',
              borderRadius: 16,
              padding: 22,
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <div style={{ textAlign: 'center', borderBottom: '2px solid #0F172A', paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ fontWeight: 800, letterSpacing: 2 }}>T.C.</div>
              <div style={{ fontWeight: 700 }}>SAĞLIK BAKANLIĞI</div>
              <div style={{ fontSize: 13 }}>SGK Resmi Rapor Belgesi</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{tarih}</div>
            </div>

            <h2 style={{ textAlign: 'center', fontSize: 18, margin: '0 0 18px' }}>
              {rapor.raporBasligi || raporTipi}
            </h2>

            <section style={{ marginBottom: 14, fontSize: 14, lineHeight: 1.55 }}>
              <div style={{ fontWeight: 700, borderBottom: '1px solid #CBD5E1', marginBottom: 6 }}>HASTA BİLGİLERİ</div>
              <div>
                <strong>Ad Soyad:</strong> {rapor.hastaAdi || secili?.label || '—'}
              </div>
              <div>
                <strong>T.C. (son 4):</strong> {rapor.tcSon4 || '****'}
              </div>
            </section>

            <section style={{ marginBottom: 14, fontSize: 14, lineHeight: 1.55 }}>
              <div style={{ fontWeight: 700, borderBottom: '1px solid #CBD5E1', marginBottom: 6 }}>TANI</div>
              <div>
                {rapor.tani?.icd10 ? `${rapor.tani.icd10} — ` : ''}
                {rapor.tani?.aciklama || '—'}
              </div>
            </section>

            <section style={{ marginBottom: 14, fontSize: 14, lineHeight: 1.55 }}>
              <div style={{ fontWeight: 700, borderBottom: '1px solid #CBD5E1', marginBottom: 6 }}>ANAMNEZ</div>
              <div>{rapor.anamnez || '—'}</div>
            </section>

            <section style={{ marginBottom: 14, fontSize: 14, lineHeight: 1.55 }}>
              <div style={{ fontWeight: 700, borderBottom: '1px solid #CBD5E1', marginBottom: 6 }}>MEVCUT DURUM</div>
              <div>{rapor.mevcutDurum || '—'}</div>
            </section>

            <section style={{ marginBottom: 14, fontSize: 14, lineHeight: 1.55 }}>
              <div style={{ fontWeight: 700, borderBottom: '1px solid #CBD5E1', marginBottom: 6 }}>ÇALIŞMA KAPASİTESİ</div>
              <div>{rapor.calismaKapasitesi || '—'}</div>
            </section>

            <section style={{ marginBottom: 14, fontSize: 14, lineHeight: 1.55 }}>
              <div style={{ fontWeight: 700, borderBottom: '1px solid #CBD5E1', marginBottom: 6 }}>ÖNERİLEN SÜRE</div>
              <div>{rapor.onerilen_sure_ay ?? sure} ay</div>
            </section>

            <section style={{ marginBottom: 14, fontSize: 14, lineHeight: 1.55 }}>
              <div style={{ fontWeight: 700, borderBottom: '1px solid #CBD5E1', marginBottom: 6 }}>HEKİM NOTU</div>
              <div>{rapor.hekim_notu || '—'}</div>
            </section>

            {Array.isArray(rapor.zorunluTetkikler) && rapor.zorunluTetkikler.length > 0 && (
              <section style={{ marginBottom: 14, fontSize: 14, lineHeight: 1.55 }}>
                <div style={{ fontWeight: 700, borderBottom: '1px solid #CBD5E1', marginBottom: 6 }}>ZORUNLU TETKİKLER</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {rapor.zorunluTetkikler.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </section>
            )}

            <button
              type="button"
              className="no-print"
              onClick={() => window.print()}
              style={{ ...toolsPrimaryBtn(false), marginTop: 8 }}
            >
              Yazdır
            </button>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .no-print, nav { display: none !important; }
          body { background: white !important; }
          #rapor-card { box-shadow: none !important; border: 2px solid black !important; }
        }
      `}</style>
    </div>
  )
}
