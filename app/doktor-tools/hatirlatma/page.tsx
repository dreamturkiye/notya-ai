'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DoktorNav from '@/components/doktor/DoktorNav';

interface Hasta {
  id: string;
  ad: string;
  soyad: string;
}

interface Gonderilen {
  id: string;
  hastaId: string;
  hastaAd: string;
  mesaj: string;
  tarih: string;
  kanal: 'whatsapp' | 'sms';
  durum: 'bekliyor' | 'gonderildi';
}

interface Sonuc {
  id: string;
  basarili: boolean;
  mesaj: string;
}

export default function HatirlatmaPage() {
  const router = useRouter();

  const [hastalar, setHastalar] = useState<Hasta[]>([]);
  const [selectedHastaId, setSelectedHastaId] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [tarih, setTarih] = useState('');
  const [kanal, setKanal] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [sonuclar, setSonuclar] = useState<Sonuc[]>([]);
  const [loading, setLoading] = useState(false);
  const [gonderilen, setGonderilen] = useState<Gonderilen[]>([]);

  // Auth kontrolü + hasta listesi
  useEffect(() => {
    const token = (() => { const _r = localStorage.getItem('auth-token'); return _r ? (() => { try { return JSON.parse(_r).access_token || _r } catch { return _r } })() : null })();
    if (!token) {
      router.push('/giris/doktor');
      return;
    }

    const fetchHastalar = async () => {
      try {
        const res = await fetch('/api/doktor/hastalar', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setHastalar(data);
        }
      } catch (error) {
        console.error('Hasta listesi alınamadı');
      }
    };

    fetchHastalar();
  }, [router]);

  // Gönderilen hatırlatmaları getir
  const fetchGonderilenler = async () => {
    const token = (() => { const _r = localStorage.getItem('auth-token'); return _r ? (() => { try { return JSON.parse(_r).access_token || _r } catch { return _r } })() : null })();
    if (!token) return;

    try {
      const res = await fetch('/api/doktor/hatirlatma', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGonderilen(data);
      }
    } catch (error) {
      console.error('Gönderilenler alınamadı');
    }
  };

  useEffect(() => {
    fetchGonderilenler();
  }, []);

  const handleSablon = (tip: string) => {
    let sablonMesaj = '';
    if (tip === 'Takip Randevusu') {
      sablonMesaj = 'Sayın hastamız, takip randevunuz yaklaşıyor. Lütfen randevu saatinizi kontrol ediniz.';
    } else if (tip === 'Ilac Yenilemesi') {
      sablonMesaj = 'Sayın hastamız, reçeteli ilaçlarınızın yenilenme zamanı gelmiştir. Eczanenize başvurabilirsiniz.';
    } else if (tip === 'Lab Sonucu Hazir') {
      sablonMesaj = 'Sayın hastamız, laboratuvar sonuçlarınız hazır. Detaylı bilgi için lütfen kliniğimizi ziyaret ediniz.';
    }
    setMesaj(sablonMesaj);
  };

  const handleGonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHastaId || !mesaj || !tarih) {
      alert('Lütfen tüm alanları doldurun.');
      return;
    }

    setLoading(true);
    const token = (() => { const _r = localStorage.getItem('auth-token'); return _r ? (() => { try { return JSON.parse(_r).access_token || _r } catch { return _r } })() : null })();

    try {
      const res = await fetch('/api/doktor/hatirlatma', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hastaId: selectedHastaId,
          mesaj,
          tarih,
          kanal,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSonuclar((prev) => [...prev, { id: Date.now().toString(), basarili: true, mesaj: 'Hatırlatma başarıyla gönderildi.' }]);
        setMesaj('');
        setTarih('');
        setSelectedHastaId('');
        fetchGonderilenler();
      } else {
        setSonuclar((prev) => [...prev, { id: Date.now().toString(), basarili: false, mesaj: data.message || 'Gönderim başarısız.' }]);
      }
    } catch (error) {
      setSonuclar((prev) => [...prev, { id: Date.now().toString(), basarili: false, mesaj: 'Sunucu hatası oluştu.' }]);
    } finally {
      setLoading(false);
    }
  };

  const maskeAd = (ad: string, soyad: string) => {
    return `${ad[0]}*** ${soyad[0]}***`;
  };

  return (
    <div className="min-h-screen bg-[#0A1628] text-white">
      <DoktorNav />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SOL - FORM */}
          <div className="bg-white text-gray-900 rounded-2xl p-8 shadow-xl">
            <h1 className="text-2xl font-semibold mb-6">Hatırlatma Gönder</h1>

            <form onSubmit={handleGonder} className="space-y-6">
              {/* Hasta Seç */}
              <div>
                <label className="block text-sm font-medium mb-2">Hasta Seçin</label>
                <select
                  value={selectedHastaId}
                  onChange={(e) => setSelectedHastaId(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                >
                  <option value="">Hasta seçiniz...</option>
                  {hastalar.map((hasta) => (
                    <option key={hasta.id} value={hasta.id}>
                      {hasta.ad} {hasta.soyad}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mesaj */}
              <div>
                <label className="block text-sm font-medium mb-2">Mesaj</label>
                <textarea
                  value={mesaj}
                  onChange={(e) => setMesaj(e.target.value)}
                  placeholder="Sayın hastamız, takip randevunuz yaklaşıyor..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  required
                />
              </div>

              {/* Tarih/Saat */}
              <div>
                <label className="block text-sm font-medium mb-2">Tarih ve Saat</label>
                <input
                  type="datetime-local"
                  value={tarih}
                  onChange={(e) => setTarih(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {/* Kanal */}
              <div>
                <label className="block text-sm font-medium mb-3">Gönderim Kanalı</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="kanal"
                      value="whatsapp"
                      checked={kanal === 'whatsapp'}
                      onChange={() => setKanal('whatsapp')}
                      className="accent-green-600 w-5 h-5"
                    />
                    <span>WhatsApp</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="kanal"
                      value="sms"
                      checked={kanal === 'sms'}
                      onChange={() => setKanal('sms')}
                      className="accent-blue-600 w-5 h-5"
                    />
                    <span>SMS</span>
                  </label>
                </div>
              </div>

              {/* Şablonlar */}
              <div>
                <label className="block text-sm font-medium mb-3">Hızlı Şablonlar</label>
                <div className="flex flex-wrap gap-3">
                  {['Takip Randevusu', 'Ilac Yenilemesi', 'Lab Sonucu Hazir'].map((tip) => (
                    <button
                      key={tip}
                      type="button"
                      onClick={() => handleSablon(tip)}
                      className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                      {tip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gönder Butonu */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0A1628] hover:bg-black disabled:bg-gray-400 text-white py-3.5 rounded-xl font-medium transition-all active:scale-[0.985]"
              >
                {loading ? 'Gönderiliyor...' : 'Hatırlatmayı Gönder'}
              </button>
            </form>

            {/* Sonuçlar */}
            {sonuclar.length > 0 && (
              <div className="mt-6 space-y-2">
                {sonuclar.slice(-2).map((sonuc) => (
                  <div
                    key={sonuc.id}
                    className={`text-sm px-4 py-2 rounded-xl ${sonuc.basarili ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                  >
                    {sonuc.mesaj}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SAĞ - GEÇMİŞ */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-6">Gönderilen Hatırlatmalar</h2>

            {gonderilen.length === 0 ? (
              <div className="text-white/60 text-center py-12">Henüz hatırlatma gönderilmedi.</div>
            ) : (
              <div className="space-y-4 max-h-[620px] overflow-auto pr-2">
                {gonderilen.map((item) => (
                  <div key={item.id} className="bg-white/10 rounded-2xl p-5 border border-white/10">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium">{maskeAd(item.hastaAd.split(' ')[0] || '', item.hastaAd.split(' ')[1] || '')}</div>
                        <div className="text-xs text-white/60 mt-0.5">
                          {new Date(item.tarih).toLocaleString('tr-TR')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${item.kanal === 'whatsapp' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {item.kanal === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                        </span>
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${item.durum === 'gonderildi' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {item.durum}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-white/80 line-clamp-2">{item.mesaj}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
