'use client'

/**
 * Public patient-portal DEMO — same UI/theme as /portal/hasta/[token].
 * Safari: https://notya-ai.vercel.app/portal/demo
 */

import React, { useState } from 'react'
import { portal } from '../portalStyles'

type Tab = 'ziyaretler' | 'ilaclar' | 'lab' | 'not'

const DEMO = {
  patient: { firstName: 'Ayşe' },
  sessions: [
    {
      id: '1',
      date: '2026-08-28T10:30:00Z',
      specialty: 'İç Hastalıkları',
      degerlendirme:
        'Kontrol muayenesinde tansiyon regüle. Mevcut antihipertansif tedaviye devam. Diyet ve yürüyüş önerildi.',
    },
    {
      id: '2',
      date: '2026-07-12T14:00:00Z',
      specialty: 'İç Hastalıkları',
      degerlendirme:
        'Halsizlik ve çarpıntı şikayeti. Lab: HbA1c hafif yüksek. Metformin doz ayarı planlandı.',
    },
    {
      id: '3',
      date: '2026-05-03T09:15:00Z',
      specialty: 'İç Hastalıkları',
      degerlendirme: 'Yıllık check-up. Fizik muayene doğal. Aşı ve tarama hatırlatmaları yapıldı.',
    },
  ],
  medications: [
    {
      id: 'm1',
      drugName: 'COVERSYL 5 MG',
      dose: '1 tablet',
      frequency: 'Günde 1 kez, sabah',
      doctorNote: 'Tansiyon için — aç veya tok alınabilir.',
    },
    {
      id: 'm2',
      drugName: 'GLUCOPHAGE 1000 MG',
      dose: '1 tablet',
      frequency: 'Günde 2 kez, yemekle',
      doctorNote: 'Kan şekeri için. Mide rahatsızlığında doktora bildirin.',
    },
    {
      id: 'm3',
      drugName: 'ASPIRIN PROTECT 100 MG',
      dose: '1 tablet',
      frequency: 'Günde 1 kez',
      doctorNote: 'Koruyucu — kanama riski artarsa ara verin ve arayın.',
    },
  ],
  labs: [
    { id: 'l1', testName: 'HbA1c', deger: '6.4', birim: '%', referans: '4.0–5.6', anormal: true },
    { id: 'l2', testName: 'Açlık Glukoz', deger: '108', birim: 'mg/dL', referans: '70–99', anormal: true },
    { id: 'l3', testName: 'LDL Kolesterol', deger: '118', birim: 'mg/dL', referans: '<130', anormal: false },
    { id: 'l4', testName: 'Kreatinin', deger: '0.82', birim: 'mg/dL', referans: '0.6–1.1', anormal: false },
    { id: 'l5', testName: 'TSH', deger: '2.1', birim: 'mIU/L', referans: '0.4–4.0', anormal: false },
  ],
  doctorNote: {
    takipSuresi: '3 ay',
    note:
      'Ayşe Hanım, tansiyonunuz kontrol altında. Şeker değerleriniz hedefe yakın; diyete ve yürüyüşe devam edin. Bir sonraki kontrolde HbA1c tekrar bakacağız. Acil durumda 112 veya muayenehaneyi arayın.',
    nextAppointment: '28 Kasım 2026 — 10:30',
  },
}

export default function PatientPortalDemoPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ziyaretler')
  const data = DEMO

  const tabs: { key: Tab; label: string }[] = [
    { key: 'ziyaretler', label: 'Son Ziyaretlerim' },
    { key: 'ilaclar', label: 'İlaçlarım' },
    { key: 'lab', label: 'Lab Sonuçları' },
    { key: 'not', label: 'Doktorum Notu' },
  ]

  const sortedSessions = [...data.sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div style={portal.shell}>
      <header style={portal.header}>
        <div style={portal.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={portal.logoMark}>N</div>
            <span style={portal.brand}>Notya AI</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={portal.muted}>Hasta Portalı</div>
            <div style={portal.demoPill}>DEMO — örnek veri</div>
          </div>
        </div>
      </header>

      <main style={portal.main}>
        <h1 style={portal.h1}>Hoşgeldiniz, {data.patient.firstName}!</h1>
        <p style={portal.lead}>
          Hastanın gördüğü portalın canlı önizlemesi. Gerçek linkler doktor panelinden 30 gün geçerli
          olarak üretilir.
        </p>

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
              {data.medications.map((med) => (
                <div key={med.id} style={portal.card}>
                  <div style={portal.medTitle}>{med.drugName}</div>
                  <div style={portal.medRow}>
                    <span style={portal.label}>Doz:</span> {med.dose}
                  </div>
                  <div style={portal.medRow}>
                    <span style={portal.label}>Sıklık:</span> {med.frequency}
                  </div>
                  <div style={{ ...portal.medRow, color: '#94A3B8', marginTop: 10 }}>{med.doctorNote}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'lab' && (
            <div style={portal.tableWrap}>
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
        Demo önizleme · Gerçek hasta linkleri 30 gün geçerlidir · KVKK kapsamında veriler korunur
      </footer>
    </div>
  )
}
