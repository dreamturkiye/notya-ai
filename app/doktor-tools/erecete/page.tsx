'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DoktorNav from '@/components/doktor/DoktorNav';

export const dynamic = 'force-dynamic';

interface Hasta {
  id: string;
  ad: string;
  tc: string;
}

interface Ilac {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
}

interface ReceteResult {
  id: string;
  tarih: string;
  doktorAd: string;
  hasta: {
    ad: string;
    tc: string;
  };
  tani: {
    icd10: string;
    aciklama: string;
  };
  ilaclar: Ilac[];
  interaksiyonlar: string[];
  notlar?: string;
}

export default function ERecetePage() {
  const router = useRouter();

  const [hastalar, setHastalar] = useState<Hasta[]>([]);
  const [selectedHastaId, setSelectedHastaId] = useState('');
  const [tani, setTani] = useState('');
  const [notlar, setNotlar] = useState('');
  const [yeniIlaclar, setYeniIlaclar] = useState<Ilac[]>([]);
  const [result, setResult] = useState<ReceteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Yeni ilaç form state
  const [yeniIlac, setYeniIlac] = useState({
    name: '',
    dose: '',
    frequency: '',
    duration: ''
  });

  useEffect(() => {
    const raw_t = localStorage.getItem('auth-token'); const token = raw_t ? (() => { try { return JSON.parse(raw_t).access_token || raw_t } catch { return raw_t } })() : null;
    if (!token) {
      router.push('/giris/doktor');
      return;
    }

    const fetchHastalar = async () => {
      try {
        const res = await fetch('/api/doktor/hastalar', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Hasta listesi alınamadı');
        const data = await res.json();
        setHastalar(data);
      } catch (err) {
        setError('Hasta verileri yüklenirken hata oluştu');
      }
    };

    fetchHastalar();
  }, [router]);

  const handleIlacEkle = () => {
    if (!yeniIlac.name || !yeniIlac.dose || !yeniIlac.frequency || !yeniIlac.duration) {
      setError('Lütfen tüm ilaç alanlarını doldurun');
      return;
    }
    setYeniIlaclar([...yeniIlaclar, { ...yeniIlac }]);
    setYeniIlac({ name: '', dose: '', frequency: '', duration: '' });
    setError('');
  };

  const handleIlacSil = (index: number) => {
    const yeniListe = [...yeniIlaclar];
    yeniListe.splice(index, 1);
    setYeniIlaclar(yeniListe);
  };

  const handleUret = async () => {
    const raw_t = localStorage.getItem('auth-token'); const token = raw_t ? (() => { try { return JSON.parse(raw_t).access_token || raw_t } catch { return raw_t } })() : null;
    if (!token || !selectedHastaId || !tani || yeniIlaclar.length === 0) {
      setError('Hasta, tanı ve en az bir ilaç zorunludur');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/doktor/araclar/erecete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hastaId: selectedHastaId,
          tani,
          notlar,
          ilaclar: yeniIlaclar,
        }),
      });

      if (!res.ok) throw new Error('Reçete oluşturulamadı');
      const data: ReceteResult = await res.json();
      setResult(data);
    } catch (err) {
      setError('Reçete üretilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleKopyala = () => {
    if (!result) return;
    const text = `ELEKTRONİK REÇETE\nTarih: ${result.tarih}\nHasta: ${result.hasta.ad} (TC: ***${result.hasta.tc.slice(-4)})\nTanı: ${result.tani.icd10} - ${result.tani.aciklama}\nİlaçlar:\n${result.ilaclar.map(i => `- ${i.name} ${i.dose} ${i.frequency} ${i.duration}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    alert('Reçete panoya kopyalandı');
  };

  const handleYazdir = () => {
    window.print();
  };

  const selectedHasta = hastalar.find(h => h.id === selectedHastaId);

  return (
    <div className="min-h-screen bg-[#0A1628] text-white">
      <DoktorNav />

      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-semibold mb-8">Elektronik Reçete</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SOL PANEL - FORM */}
          <div className="bg-[#11253D] rounded-2xl p-8 space-y-6">
            <div>
              <label className="block text-sm mb-2">Hasta Seç</label>
              <select
                value={selectedHastaId}
                onChange={(e) => setSelectedHastaId(e.target.value)}
                className="w-full bg-[#0A1628] border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
              >
                <option value="">Hasta seçiniz...</option>
                {hastalar.map(h => (
                  <option key={h.id} value={h.id}>{h.ad} (TC: ***{h.tc.slice(-4)})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">Tanı</label>
              <textarea
                value={tani}
                onChange={(e) => setTani(e.target.value)}
                placeholder="Tanı bilgisini giriniz..."
                className="w-full h-24 bg-[#0A1628] border border-gray-700 rounded-xl px-4 py-3 resize-y focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Ek Notlar</label>
              <textarea
                value={notlar}
                onChange={(e) => setNotlar(e.target.value)}
                placeholder="İsteğe bağlı notlar..."
                className="w-full h-20 bg-[#0A1628] border border-gray-700 rounded-xl px-4 py-3 resize-y focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* İlaç Ekleme */}
            <div className="border border-gray-700 rounded-xl p-5 space-y-4">
              <p className="font-medium">İlaç Ekle</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="İlaç adı"
                  value={yeniIlac.name}
                  onChange={(e) => setYeniIlac({ ...yeniIlac, name: e.target.value })}
                  className="bg-[#0A1628] border border-gray-700 rounded-xl px-4 py-3"
                />
                <input
                  type="text"
                  placeholder="Doz (ör: 500mg)"
                  value={yeniIlac.dose}
                  onChange={(e) => setYeniIlac({ ...yeniIlac, dose: e.target.value })}
                  className="bg-[#0A1628] border border-gray-700 rounded-xl px-4 py-3"
                />
                <input
                  type="text"
                  placeholder="Kullanım sıklığı"
                  value={yeniIlac.frequency}
                  onChange={(e) => setYeniIlac({ ...yeniIlac, frequency: e.target.value })}
                  className="bg-[#0A1628] border border-gray-700 rounded-xl px-4 py-3"
                />
                <input
                  type="text"
                  placeholder="Süre (ör: 7 gün)"
                  value={yeniIlac.duration}
                  onChange={(e) => setYeniIlac({ ...yeniIlac, duration: e.target.value })}
                  className="bg-[#0A1628] border border-gray-700 rounded-xl px-4 py-3"
                />
              </div>
              <button
                onClick={handleIlacEkle}
                className="bg-blue-600 hover:bg-blue-700 transition px-6 py-2.5 rounded-xl font-medium"
              >
                İlaç Ekle
              </button>
            </div>

            {/* Eklenen İlaçlar */}
            {yeniIlaclar.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Eklenen İlaçlar</p>
                <div className="flex flex-wrap gap-2">
                  {yeniIlaclar.map((ilac, index) => (
                    <div key={index} className="flex items-center bg-[#0A1628] border border-gray-700 rounded-full px-4 py-1.5 text-sm">
                      {ilac.name} • {ilac.dose} • {ilac.frequency} • {ilac.duration}
                      <button onClick={() => handleIlacSil(index)} className="ml-3 text-red-400 hover:text-red-500">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={handleUret}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 transition py-4 rounded-2xl font-semibold text-lg"
            >
              {loading ? 'Reçete Hazırlanıyor...' : 'Reçete Üret'}
            </button>
          </div>

          {/* SAĞ PANEL - ÖNİZLEME */}
          <div className="bg-[#11253D] rounded-2xl p-8 min-h-[620px]">
            {!result && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 mb-6 text-gray-600">📋</div>
                <p className="text-xl text-gray-400">Reçete önizlemesi burada görünecek</p>
              </div>
            )}

            {loading && (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4" />
                <p className="text-lg">Reçete hazırlanıyor...</p>
              </div>
            )}

            {result && (
              <div className="bg-white text-[#0A1628] rounded-2xl p-8 shadow-2xl print:shadow-none">
                <div className="text-center border-b pb-6 mb-6">
                  <div className="font-bold text-2xl tracking-[3px]">ELEKTRONİK REÇETE</div>
                  <div className="text-sm mt-1 text-gray-500">{result.tarih}</div>
                  <div className="text-sm mt-1">{result.doktorAd}</div>
                </div>

                <div className="space-y-5 text-sm">
                  <div>
                    <div className="font-semibold mb-1">HASTA</div>
                    <div>{result.hasta.ad} • TC: ***{result.hasta.tc.slice(-4)}</div>
                  </div>

                  <div>
                    <div className="font-semibold mb-1">TANI</div>
                    <div>{result.tani.icd10} — {result.tani.aciklama}</div>
                  </div>

                  <div>
                    <div className="font-semibold mb-2">İLAÇLAR</div>
                    <div className="space-y-3">
                      {result.ilaclar.map((ilac, i) => (
                        <div key={i} className="pl-4 border-l-2 border-emerald-600">
                          <div className="font-medium">{ilac.name}</div>
                          <div className="text-gray-600">{ilac.dose} • {ilac.frequency} • {ilac.duration}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {result.interaksiyonlar.length > 0 && (
                    <div className="border border-red-500 bg-red-50 text-red-700 rounded-xl p-4">
                      <div className="font-semibold mb-1">⚠ İLAÇ ETKİLEŞİM UYARILARI</div>
                      <ul className="list-disc pl-5 text-sm">
                        {result.interaksiyonlar.map((u, i) => <li key={i}>{u}</li>)}
                      </ul>
                    </div>
                  )}

                  {result.notlar && (
                    <div className="text-gray-600">Not: {result.notlar}</div>
                  )}
                </div>

                <div className="flex gap-3 mt-8 print:hidden">
                  <button onClick={handleKopyala} className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-100">Kopyala</button>
                  <button onClick={handleYazdir} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">Yazdır</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
