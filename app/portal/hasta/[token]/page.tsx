'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Session {
  id: string;
  date: string;
  specialty: string;
  degerlendirme: string;
}

interface Medication {
  id: string;
  drugName: string;
  dose: string;
  frequency: string;
  doctorNote: string;
}

interface LabResult {
  id: string;
  testName: string;
  deger: string;
  birim: string;
  referans: string;
  anormal: boolean;
}

interface DoctorNote {
  takipSuresi: string;
  note: string;
  nextAppointment?: string;
}

interface PortalData {
  patient: { firstName: string };
  sessions: Session[];
  medications: Medication[];
  labs: LabResult[];
  doctorNote: DoctorNote;
}

type Tab = 'ziyaretler' | 'ilaclar' | 'lab' | 'not';

const PatientPortal: React.FC = () => {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PortalData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('ziyaretler');

  const accent = '#0F9B8E';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/portal/hasta/${token}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error('invalid');
        }

        const json: PortalData = await res.json();
        setData(json);
      } catch {
        setError('Baglanti gecersiz veya suresi dolmus');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-[#0F9B8E] text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-2xl">!</span>
          </div>
          <p className="text-gray-800 text-lg font-medium">Bağlantı geçersiz veya süresi dolmuş</p>
        </div>
      </div>
    );
  }

  const sortedSessions = [...data.sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: 'ziyaretler', label: 'Son Ziyaretlerim' },
    { key: 'ilaclar', label: 'İlaçlarım' },
    { key: 'lab', label: 'Lab Sonuçları' },
    { key: 'not', label: 'Doktorum Notu' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#0F9B8E] flex items-center justify-center text-white font-bold text-xl">N</div>
            <div>
              <span className="font-semibold text-xl tracking-tight">Notya AI</span>
            </div>
          </div>
          <div className="text-sm text-gray-500">Hasta Portalı</div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-8 pb-16">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Hoşgeldiniz, {data.patient.firstName}!</h1>
          <p className="text-gray-500 mt-1">Kişisel sağlık portalınıza hoş geldiniz.</p>
        </div>

        {/* Pill Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
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

        {/* Tab Content */}
        <div className="min-h-[420px]">
          {activeTab === 'ziyaretler' && (
            <div className="space-y-4">
              {sortedSessions.length === 0 && <p className="text-gray-500">Ziyaret kaydı bulunamadı.</p>}
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
                    <div><span className="text-gray-500">Doz:</span> {med.dose}</div>
                    <div><span className="text-gray-500">Sıklık:</span> {med.frequency}</div>
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

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-gray-500">
          Bu portal 30 gün için geçerlidir. KVKK kapsamında verileriniz korunmaktadır.
        </div>
      </footer>
    </div>
  );
};

export default PatientPortal;
