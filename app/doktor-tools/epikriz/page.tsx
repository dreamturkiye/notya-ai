'use client';

import React, { useState, useEffect } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';

export const dynamic = 'force-dynamic';

interface Hasta {
  id: string;
  ad: string;
  soyad: string;
  tcKimlik: string;
}

interface Seans {
  id: string;
  tarih: string;
  uzmanlik: string;
}

interface EpikrizSonuc {
  basvuruSikayeti: string;
  anamnestikBilgi: string;
  fizikMuayene: string;
  tani: { kod: string; aciklama: string };
  tedavi: string;
  takipOnerisi: string;
}

export default function EpikrizPage() {
  const [hastalar, setHastalar] = useState<Hasta[]>([]);
  const [sessions, setSessions] = useState<Seans[]>([]);
  const [selectedHastaId, setSelectedHastaId] = useState('');
  const [selectedSeansId, setSelectedSeansId] = useState('');
  const [ekBilgi, setEkBilgi] = useState('');
  const [result, setResult] = useState<EpikrizSonuc | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        const authRes = await fetch('/api/auth/session');
        if (!authRes.ok) {
          window.location.href = '/giris';
          return;
        }
        const res = await fetch('/api/doktor/hastalar');
        if (res.ok) {
          const data = await res.json();
          setHastalar(data.hastalar || []);
        }
      } catch (error) {
        console.error('Auth veya hasta yükleme hatası:', error);
      }
    };
    checkAuthAndFetch();
  }, []);

  const handleHastaChange = async (hastaId: string) => {
    setSelectedHastaId(hastaId);
    setSelectedSeansId('');
    setSessions([]);
    setResult(null);
    setEkBilgi('');

    if (!hastaId) return;

    try {
      const res = await fetch(`/api/doktor/hastalar/${hastaId}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.seanslar || []);
      }
    } catch (error) {
      console.error('Seans yükleme hatası:', error);
    }
  };

  const handleUret = async () => {
    if (!selectedHastaId || !selectedSeansId) return;

    setLoading(true);
    try {
      const res = await fetch('/api/doktor/araclar/epikriz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hastaId: selectedHastaId,
          seansId: selectedSeansId,
          ekBilgi,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data.epikriz);
      }
    } catch (error) {
      console.error('Epikriz üretme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleYazdir = () => {
    window.print();
  };

  const handleKopyala = () => {
    if (!result) return;
    const text = `
EPIKRIZ
Tarih: ${new Date().toLocaleDateString('tr-TR')}
Hastane: Özel Sağlık Merkezi

BASVURU SIKAYETI
${result.basvuruSikayeti}

ANAMNESTIK BILGI
${result.anamnestikBilgi}

FIZIK MUAYENE
${result.fizikMuayene}

TANI
${result.tani.kod} - ${result.tani.aciklama}

TEDAVI
${result.tedavi}

TAKIP ONERISI
${result.takipOnerisi}
    `.trim();
    navigator.clipboard.writeText(text);
    alert('Epikriz panoya kopyalandı.');
  };

  const selectedSeans = sessions.find(s => s.id === selectedSeansId);

  return (
    <div className="min-h-screen bg-gray-50">
      <DoktorNav />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-8">Epikriz Oluştur</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SOL FORM */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-medium mb-6">Hasta ve Seans Seçimi</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
                <select
                  value={selectedHastaId}
                  onChange={(e) => handleHastaChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Hasta seçiniz</option>
                  {hastalar.map(h => (
                    <option key={h.id} value={h.id}>{h.ad} {h.soyad} ({h.tcKimlik})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seans</label>
                <select
                  value={selectedSeansId}
                  onChange={(e) => setSelectedSeansId(e.target.value)}
                  disabled={!selectedHastaId}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                >
                  <option value="">Seans seçiniz</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{new Date(s.tarih).toLocaleDateString('tr-TR')} - {s.uzmanlik}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ek Bilgi</label>
                <textarea
                  value={ekBilgi}
                  onChange={(e) => setEkBilgi(e.target.value)}
                  rows={4}
                  placeholder="Ek klinik bilgi veya notlar..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                onClick={handleUret}
                disabled={!selectedHastaId || !selectedSeansId || loading}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors"
              >
                {loading ? 'Üretiliyor...' : 'Epikriz Üret'}
              </button>
            </div>
          </div>

          {/* SAĞ ÖNİZLEME */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print:shadow-none print:border-none">
            {!result ? (
              <div className="flex items-center justify-center h-96 text-center text-gray-500">
                <div>
                  <p className="text-lg">Epikriz oluşturmak için</p>
                  <p className="text-lg">hasta ve seans seçin.</p>
                </div>
              </div>
            ) : (
              <div id="epikriz-card" className="print:p-8">
                <div className="text-center border-b pb-4 mb-6">
                  <h1 className="text-3xl font-bold tracking-wider">EPIKRIZ</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date().toLocaleDateString('tr-TR')} • Özel Sağlık Merkezi
                  </p>
                </div>

                {[
                  { label: 'BASVURU SIKAYETI', value: result.basvuruSikayeti },
                  { label: 'ANAMNESTIK BILGI', value: result.anamnestikBilgi },
                  { label: 'FIZIK MUAYENE', value: result.fizikMuayene },
                  { label: 'TANI', value: `${result.tani.kod} - ${result.tani.aciklama}` },
                  { label: 'TEDAVI', value: result.tedavi },
                  { label: 'TAKIP ONERISI', value: result.takipOnerisi },
                ].map((section, idx) => (
                  <div key={idx} className="mb-6">
                    <div className="pl-4 border-l-4 border-teal-600">
                      <div className="uppercase text-xs font-semibold tracking-widest text-teal-700 mb-1.5">
                        {section.label}
                      </div>
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{section.value}</p>
                    </div>
                  </div>
                ))}

                <div className="mt-8 flex gap-3 print:hidden">
                  <button
                    onClick={handleYazdir}
                    className="flex-1 border border-gray-300 hover:bg-gray-50 py-2.5 rounded-lg font-medium text-sm"
                  >
                    Yazdır
                  </button>
                  <button
                    onClick={handleKopyala}
                    className="flex-1 bg-teal-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-teal-700"
                  >
                    Kopyala
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #epikriz-card, #epikriz-card * { visibility: visible; }
          #epikriz-card { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
