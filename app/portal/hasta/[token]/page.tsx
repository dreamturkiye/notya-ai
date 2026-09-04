'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { portal } from '../../portalStyles'

interface Session {
  id: string
  date: string
  specialty: string
  degerlendirme: string
}

interface Medication {
  id: string
  drugName: string
  dose: string
  frequency: string
  doctorNote: string
}

interface LabResult {
  id: string
  testName: string
  deger: string
  birim: string
  referans: string
  anormal: boolean
}

interface DoctorNote {
  takipSuresi: string
  note: string
  nextAppointment?: string
}

interface PortalData {
  patient: { firstName: string }
  sessions: Session[]
  medications: Medication[]
  labs: LabResult[]
  doctorNote: DoctorNote
}

type Tab = 'ziyaretler' | 'ilaclar' | 'lab' | 'not'

export default function PatientPortal() {
  const params = useParams<{ token: string }>()
  const token = params.token

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PortalData | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('ziyaretler')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/portal/hasta/${token}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        })
        if (!res.ok) throw new Error('invalid')
        const json: PortalData = await res.json()
        setData(json)
      } catch {
        setError('Baglanti gecersiz veya suresi dolmus')
      } finally {
        setLoading(false)
      }
    }
    if (token) void fetchData()
  }, [token])

  if (loading) {
    return (
      <div style={{ ...portal.shell, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#0F9B8E', fontSize: 16, fontWeight: 600 }}>Yükleniyor...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ ...portal.shell, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={portal.errorBox}>
          <div
            style={{
              margin: '0 auto 14px',
              height: 44,
              width: 44,
              borderRadius: 999,
              background: 'rgba(248,113,113,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            !
          </div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Bağlantı geçersiz veya süresi dolmuş</p>
        </div>
      </div>
    )
  }

  const sortedSessions = [...data.sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const tabs: { key: Tab; label: string }[] = [
    { key: 'ziyaretler', label: 'Son Ziyaretlerim' },
    { key: 'ilaclar', label: 'İlaçlarım' },
    { key: 'lab', label: 'Lab Sonuçları' },
    { key: 'not', label: 'Doktorum Notu' },
  ]

  return (
    <div style={portal.shell}>
      <header style={portal.header}>
        <div style={portal.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={portal.logoMark}>N</div>
            <span style={portal.brand}>Notya AI</span>
          </div>
          <div style={portal.muted}>Hasta Portalı</div>
        </div>
      </header>

      <main style={portal.main}>
        <h1 style={portal.h1}>Hoşgeldiniz, {data.patient.firstName}!</h1>
        <p style={portal.lead}>Kişisel sağlık portalınıza hoş geldiniz.</p>

        <div style={portal.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={portal.tab(activeTab === tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ minHeight: 380 }}>
          {activeTab === 'ziyaretler' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sortedSessions.length === 0 && <p style={portal.empty}>Ziyaret kaydı bulunamadı.</p>}
              {sortedSessions.map((s) => (
                <div key={s.id} style={portal.card}>
                  <div style={portal.cardMeta}>
                    <span>{new Date(s.date).toLocaleDateString('tr-TR')}</span>
                    <span>{s.specialty}</span>
                  </div>
                  <p style={portal.cardBody}>{s.degerlendirme}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'ilaclar' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 12,
              }}
            >
              {data.medications.length === 0 && <p style={portal.empty}>Aktif ilaç kaydı yok.</p>}
              {data.medications.map((med) => (
                <div key={med.id} style={portal.card}>
                  <div style={portal.medTitle}>{med.drugName}</div>
                  <div style={portal.medRow}>
                    <span style={portal.label}>Doz:</span> {med.dose}
                  </div>
                  <div style={portal.medRow}>
                    <span style={portal.label}>Sıklık:</span> {med.frequency}
                  </div>
                  {med.doctorNote ? (
                    <div style={{ ...portal.medRow, color: '#94A3B8', marginTop: 10 }}>{med.doctorNote}</div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'lab' && (
            <div style={portal.tableWrap}>
              {data.labs.length === 0 ? (
                <p style={{ ...portal.empty, padding: 18 }}>Lab sonucu bulunamadı.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={portal.th}>Test</th>
                      <th style={portal.th}>Değer</th>
                      <th style={portal.th}>Birim</th>
                      <th style={portal.th}>Referans</th>
                      <th style={portal.th}>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.labs.map((lab) => (
                      <tr key={lab.id}>
                        <td style={portal.td}>{lab.testName}</td>
                        <td style={{ ...portal.td, fontWeight: 700 }}>{lab.deger}</td>
                        <td style={{ ...portal.td, color: '#94A3B8' }}>{lab.birim}</td>
                        <td style={{ ...portal.td, color: '#94A3B8' }}>{lab.referans}</td>
                        <td style={portal.td}>
                          <span style={lab.anormal ? portal.bad : portal.ok}>
                            {lab.anormal ? 'Anormal' : 'Normal'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'not' && (
            <div style={{ ...portal.card, padding: 28 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ ...portal.label, fontSize: 12 }}>Takip Süresi</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6, color: '#F8FAFC' }}>
                  {data.doctorNote.takipSuresi}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ ...portal.label, fontSize: 12, marginBottom: 6 }}>Doktor Notu</div>
                <p style={portal.cardBody}>{data.doctorNote.note}</p>
              </div>
              {data.doctorNote.nextAppointment && (
                <div>
                  <div style={{ ...portal.label, fontSize: 12 }}>Sonraki Randevu</div>
                  <div style={{ fontWeight: 700, marginTop: 6, color: '#99F6E4' }}>
                    {data.doctorNote.nextAppointment}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer style={portal.footer}>
        Bu portal 30 gün için geçerlidir. KVKK kapsamında verileriniz korunmaktadır.
      </footer>
    </div>
  )
}
