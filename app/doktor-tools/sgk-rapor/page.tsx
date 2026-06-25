'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';

interface Hasta {
  id: string;
  ad: string;
  soyad: string;
  tcKimlikNo: string;
}

interface RaporData {
  hasta: Hasta;
  raporTipi: string;
  sure: number;
  tani: string;
  anamnez: string;
  mevcutDurum: string;
  calismaKapasitesi: string;
  hekimNotu: string;
  tarih: string;
}

const raporTipleri = [
  'Kronik Hastalık Raporu',
  'Maluliyet Raporu',
  'İş Göremezlik Belgesi',
  'Sağlık Kurulu Raporu',
];

export default function SgkRaporPage() {
  const [hastalar, setHastalar] = useState<Hasta[]>([]);
  const [hastaId, setHastaId] = useState('');
  const [raporTipi, setRaporTipi] = useState(raporTipleri[0]);
  const [sure, setSure] = useState(1);
  const [raporData, setRaporData] = useState<RaporData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingHastalar, setFetchingHastalar] = useState(true);

  useEffect(() => {
    const fetchHastalar = async () => {
      try {
        const res = await fetch('/api/doktor/hastalar');
        if (res.ok) {
          const data = await res.json();
          setHastalar(data);
        }
      } catch (error) {
        console.error('Hasta listesi alınamadı');
      } finally {
        setFetchingHastalar(false);
      }
    };
    fetchHastalar();
  }, []);

  const handleUret = async () => {
    if (!hastaId || !raporTipi || !sure) return;

    setLoading(true);
    try {
      const res = await fetch('/api/doktor/araclar/sgk-rapor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hastaId, raporTipi, sure }),
      });

      if (res.ok) {
        const data: RaporData = await res.json();
        setRaporData(data);
      } else {
        alert('Rapor oluşturulamadı');
      }
    } catch (error) {
      alert('Sunucu hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleYazdir = () => {
    window.print();
  };

  const seciliHasta = hastalar.find(h => h.id === hastaId);

  return (
    <div className="min-h-screen bg-gray-50">
      <DoktorNav />

      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">SGK Rapor Oluştur</h1>

        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow mb-8 no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rapor Tipi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rapor Tipi</label>
              <div className="space-y-2">
                {raporTipleri.map((tip) => (
                  <label key={tip} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="raporTipi"
                      value={tip}
                      checked={raporTipi === tip}
                      onChange={(e) => setRaporTipi(e.target.value)}
                      className="accent-blue-600"
                    />
                    <span>{tip}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
              <select
                value={hastaId}
                onChange={(e) => setHastaId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                disabled={fetchingHastalar}
              >
                <option value="">Hasta seçiniz</option>
                {hastalar.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.ad} {h.soyad} ({h.tcKimlikNo})
                  </option>
                ))}
              </select>
            </div>

            {/* Süre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rapor Süresi (Ay)</label>
              <input
                type="number"
                min={1}
                max={36}
                value={sure}
                onChange={(e) => setSure(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>

          <button
            onClick={handleUret}
            disabled={!hastaId || loading}
            className="mt-6 w-full md:w-auto bg-blue-600 text-white px-8 py-2.5 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Oluşturuluyor...' : 'Üret'}
          </button>
        </div>

        {/* Rapor Kartı */}
        {raporData && (
          <div id="rapor-card" className="bg-white border border-gray-800 p-10 shadow-lg print:shadow-none print:border-black">
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <div className="font-bold text-xl tracking-widest">T.C.</div>
              <div className="font-bold text-lg">SAĞLIK BAKANLIĞI</div>
              <div className="text-sm">SGK Resmi Rapor Belgesi</div>
              <div className="mt-1 text-xs text-gray-600">{raporData.tarih}</div>
            </div>

            <h2 className="text-center text-2xl font-bold mb-8 tracking-wide">{raporData.raporTipi}</h2>

            <div className="space-y-6 text-sm leading-relaxed">
              <div>
                <div className="font-bold border-b pb-1 mb-2">HASTA BİLGİLERİ</div>
                <p><strong>Ad Soyad:</strong> {raporData.hasta.ad} {raporData.hasta.soyad}</p>
                <p><strong>T.C. Kimlik No:</strong> {raporData.hasta.tcKimlikNo}</p>
              </div>

              <div>
                <div className="font-bold border-b pb-1 mb-2">TANI</div>
                <p>{raporData.tani}</p>
              </div>

              <div>
                <div className="font-bold border-b pb-1 mb-2">ANAMNEZ / HİKAYE</div>
                <p>{raporData.anamnez}</p>
              </div>

              <div>
                <div className="font-bold border-b pb-1 mb-2">MEVCUT DURUM</div>
                <p>{raporData.mevcutDurum}</p>
              </div>

              <div>
                <div className="font-bold border-b pb-1 mb-2">ÇALIŞMA KAPASİTESİ</div>
                <p>{raporData.calismaKapasitesi}</p>
              </div>

              <div>
                <div className="font-bold border-b pb-1 mb-2">ÖNERİLEN SÜRE</div>
                <p>{raporData.sure} ay</p>
              </div>

              <div>
                <div className="font-bold border-b pb-1 mb-2">HEKİM NOTU</div>
                <p>{raporData.hekimNotu}</p>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t flex justify-between items-end text-sm">
              <div>
                <div className="font-semibold">Dr. {raporData.hasta.ad} {raporData.hasta.soyad}</div>
                <div className="text-xs">İmza / Kaşe</div>
              </div>
              <div className="text-right text-xs">Bu belge elektronik ortamda düzenlenmiştir.</div>
            </div>

            <button
              onClick={handleYazdir}
              className="mt-8 w-full bg-gray-900 text-white py-2.5 rounded no-print hover:bg-black"
            >
              Yazdır
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          .no-print,
          nav,
          button {
            display: none !important;
          }
          #rapor-card {
            box-shadow: none;
            border: 2px solid black;
            margin: 0;
            padding: 30px;
          }
        }
      `}</style>
    </div>
  );
}
