'use client'

import DoktorNav from '@/components/doktor/DoktorNav'
import {
  getAccessToken,
  normalizeHastalar,
  toolsCard,
  toolsErrorBox,
  toolsInput,
  toolsPrimaryBtn,
  toolsShell,
  type HastaOption,
} from '@/lib/doktor/toolsUi'
import React, { useEffect, useState } from 'react'

type HatirlatmaItem = {
  id: string
  hastaAdi: string
  mesaj: string
  kanal: string
  tarih: string
  durum: 'gonderildi' | 'bekliyor' | 'hata'
}

function normalizeHatirlatmalar(payload: unknown, hastalar: HastaOption[]): HatirlatmaItem[] {
  const raw = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { hatirlatmalar?: unknown[] }).hatirlatmalar)
      ? (payload as { hatirlatmalar: unknown[] }).hatirlatmalar
      : []

  return raw.map((item, idx) => {
    const row = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    const patientId = String(row.patient_id || row.hastaId || '')
    const matched = hastalar.find((h) => h.id === patientId)
    const kanalRaw = String(row.kanal || 'SMS').toLowerCase()
    const kanal = kanalRaw.includes('whats') ? 'WhatsApp' : 'SMS'
    const gonderildi = Boolean(row.gonderildi)
    return {
      id: String(row.id || idx),
      hastaAdi: String(row.hastaAdi || matched?.label || 'Hasta'),
      mesaj: String(row.mesaj || ''),
      kanal,
      tarih: String(row.gonder_tarih || row.tarih || row.created_at || ''),
      durum: gonderildi ? 'gonderildi' : 'bekliyor',
    }
  })
}

export default function HatirlatmaPage() {
  const [hastalar, setHastalar] = useState<HastaOption[]>([])
  const [hatirlatmalar, setHatirlatmalar] = useState<HatirlatmaItem[]>([])
  const [selectedHasta, setSelectedHasta] = useState('')
  const [mesaj, setMesaj] = useState('')
  const [tarihSaat, setTarihSaat] = useState('')
  const [kanal, setKanal] = useState<'WhatsApp' | 'SMS'>('WhatsApp')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const fetchAll = async () => {
    const token = getAccessToken()
    if (!token) return
    try {
      const [hRes, listRes] = await Promise.all([
        fetch('/api/doktor/hastalar', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/doktor/hatirlatma', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const patients = hRes.ok ? normalizeHastalar(await hRes.json()) : []
      setHastalar(patients)
      if (listRes.ok) {
        setHatirlatmalar(normalizeHatirlatmalar(await listRes.json(), patients))
      } else {
        setHatirlatmalar([])
      }
    } catch {
      setError('Veriler alınamadı.')
    }
  }

  useEffect(() => {
    void fetchAll()
  }, [])

  const sablonlar: Record<string, string> = {
    'Takip Randevusu': 'Merhaba, takip randevunuz yaklaşıyor. Lütfen tarih ve saati onaylayın.',
    'Ilac Yenilemesi': 'İlaç reçeteniz yenilenmeye hazır. Eczaneden alabilirsiniz.',
    'Lab Sonucu Hazir': 'Laboratuvar sonuçlarınız hazır. Detaylar için uygulamayı kontrol edin.',
    'Kontrol Zamani': 'Kontrol zamanınız geldi. Randevu için iletişime geçin.',
  }

  const handleGonder = async () => {
    if (!selectedHasta || !mesaj || !tarihSaat) {
      setError('Lütfen tüm alanları doldurun.')
      return
    }
    setLoading(true)
    setError('')
    setSuccess(false)
    const token = getAccessToken()
    try {
      const res = await fetch('/api/doktor/hatirlatma', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hastaId: selectedHasta,
          mesaj,
          kanal: kanal === 'WhatsApp' ? 'whatsapp' : 'sms',
          tarih: tarihSaat,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(String((body as { error?: string }).error || 'Gönderim başarısız'))
      }
      setSuccess(true)
      setMesaj('')
      setTarihSaat('')
      setSelectedHasta('')
      await fetchAll()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gönderim başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={toolsShell}>
      <DoktorNav />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 48px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#14B8A6', letterSpacing: 1.2, marginBottom: 8 }}>
          ARAÇLAR
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>Hasta Hatırlatma</h1>
        <p style={{ marginTop: 8, color: '#94A3B8', fontSize: 14 }}>WhatsApp veya SMS ile hasta bildirimi gönderin</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 20 }}>
          <div style={toolsCard}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Yeni Hatırlatma</div>
            <select value={selectedHasta} onChange={(e) => setSelectedHasta(e.target.value)} style={{ ...toolsInput, marginBottom: 12 }}>
              <option value="">Hasta seçin</option>
              {hastalar.map((h) => (
                <option key={h.id} value={h.id} style={{ color: '#000' }}>
                  {h.label}
                </option>
              ))}
            </select>
            <textarea
              rows={4}
              value={mesaj}
              onChange={(e) => setMesaj(e.target.value)}
              placeholder="Mesajınızı yazın..."
              style={{ ...toolsInput, resize: 'vertical', marginBottom: 12 }}
            />
            <input
              type="datetime-local"
              value={tarihSaat}
              onChange={(e) => setTarihSaat(e.target.value)}
              style={{ ...toolsInput, marginBottom: 12, colorScheme: 'dark' as never }}
            />
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {(['WhatsApp', 'SMS'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKanal(k)}
                  style={{
                    flex: 1,
                    minWidth: 120,
                    padding: '10px 0',
                    borderRadius: 999,
                    border: 'none',
                    cursor: 'pointer',
                    background: kanal === k ? (k === 'WhatsApp' ? '#166534' : '#1e40af') : 'rgba(255,255,255,0.06)',
                    color: kanal === k ? '#fff' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {k}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {Object.keys(sablonlar).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMesaj(sablonlar[key])}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 999,
                    fontSize: 12,
                    cursor: 'pointer',
                    color: '#94a3b8',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => void handleGonder()} disabled={loading} style={toolsPrimaryBtn(loading)}>
              {loading ? 'Gönderiliyor...' : 'Hatırlatmayı Gönder'}
            </button>
            {success && (
              <div style={{ marginTop: 12, padding: 12, background: '#166534', borderRadius: 12, color: '#4ade80', fontSize: 14 }}>
                Başarıyla kaydedildi
              </div>
            )}
            {error && <div style={toolsErrorBox}>{error}</div>}
          </div>

          <div style={toolsCard}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Gönderilen Hatırlatmalar</div>
            {hatirlatmalar.length === 0 && (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>Henüz hatırlatma yok</div>
            )}
            {hatirlatmalar.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '14px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{item.hastaAdi}</div>
                  <div style={{ color: '#94a3b8', fontSize: 14, margin: '2px 0', wordBreak: 'break-word' }}>
                    {(item.mesaj || '').slice(0, 80)}
                    {(item.mesaj || '').length > 80 ? '...' : ''}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {item.tarih ? new Date(item.tarih).toLocaleString('tr-TR') : '—'} · {item.kanal}
                  </div>
                </div>
                <div
                  style={{
                    padding: '2px 10px',
                    borderRadius: 999,
                    fontSize: 12,
                    flexShrink: 0,
                    background: item.durum === 'gonderildi' ? '#166534' : '#854d0e',
                    color: item.durum === 'gonderildi' ? '#4ade80' : '#fbbf24',
                  }}
                >
                  {item.durum}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
