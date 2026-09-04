'use client'

/**
 * Public patient-portal DEMO — same UI as /portal/hasta/[token], sample data only.
 * Safari: https://notya-ai.vercel.app/portal/demo
 */

import React, { useState } from 'react'

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
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#0F9B8E] flex items-center justify-center text-white font-bold text-xl">
              N
            </div>
            <span className="font-semibold text-xl tracking-tight">Notya AI</span>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Hasta Portalı</div>
            <div className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 inline-block mt-1">
              DEMO — örnek veri
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-8 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Hoşgeldiniz, {data.patient.firstName}!</h1>
          <p className="text-gray-500 mt-1">
            Hastanın gördüğü portalın canlı önizlemesi. Gerçek linkler doktor panelinden 30 gün geçerli
            olarak üretilir.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 border-b pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-[#0F9B8E] text-white shadow'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[420px]">
          {activeTab === 'ziyaretler' && (
            <div className="space-y-4">
              {sortedSessions.map((s) => (
                <div key={s.id} className="border border-gray-200 rounded-2xl p-5">
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>{new Date(s.date).toLocaleDateString('tr-TR')}</span>
                    <span>{s.specialty}</span>
                  </div>
                  <p className="text-gray-800 leading-snug">{s.degerlendirme}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'ilaclar' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.medications.map((med) => (
                <div key={med.id} className="border border-gray-200 rounded-2xl p-5">
                  <div className="font-semibold text-lg">{med.drugName}</div>
                  <div className="mt-3 space-y-1 text-sm">
                    <div>
                      <span className="text-gray-500">Doz:</span> {med.dose}
                    </div>
                    <div>
                      <span className="text-gray-500">Sıklık:</span> {med.frequency}
                    </div>
                    <div className="pt-2 text-gray-600">{med.doctorNote}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'lab' && (
            <div className="overflow-x-auto border border-gray-200 rounded-2xl">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-5 font-medium">Test</th>
                    <th className="text-left py-3 px-4 font-medium">Değer</th>
                    <th className="text-left py-3 px-4 font-medium">Birim</th>
                    <th className="text-left py-3 px-4 font-medium">Referans</th>
                    <th className="text-left py-3 px-4 font-medium">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.labs.map((lab) => (
                    <tr key={lab.id}>
                      <td className="py-3 px-5">{lab.testName}</td>
                      <td className="py-3 px-4 font-medium">{lab.deger}</td>
                      <td className="py-3 px-4 text-gray-500">{lab.birim}</td>
                      <td className="py-3 px-4 text-gray-500">{lab.referans}</td>
                      <td className="py-3 px-4">
                        {lab.anormal ? (
                          <span className="text-red-600 font-medium">Anormal</span>
                        ) : (
                          <span className="text-emerald-600">Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'not' && (
            <div className="border border-gray-200 rounded-2xl p-8 space-y-6">
              <div>
                <div className="text-sm text-gray-500">Takip Süresi</div>
                <div className="text-xl font-medium mt-1">{data.doctorNote.takipSuresi}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Doktor Notu</div>
                <p className="leading-relaxed text-gray-800">{data.doctorNote.note}</p>
              </div>
              {data.doctorNote.nextAppointment && (
                <div>
                  <div className="text-sm text-gray-500">Sonraki Randevu</div>
                  <div className="font-medium">{data.doctorNote.nextAppointment}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-gray-500">
          Demo önizleme · Gerçek hasta linkleri 30 gün geçerlidir · KVKK kapsamında veriler korunur
        </div>
      </footer>
    </div>
  )
}
