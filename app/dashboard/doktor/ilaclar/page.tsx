'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';

interface Hasta {
  id: string;
  ad: string;
  soyad: string;
}

interface Ilac {
  id: string;
  ad: string;
  etkenMadde: string;
  doz: string;
  kullanim: string;
  baslangic: string;
  bitis?: string;
  notlar?: string;
  aktif: boolean;
}

interface NewIlac {
  ad: string;
  etkenMadde: string;
  doz: string;
  kullanim: string;
  baslangic: string;
  bitis: string;
  notlar: string;
}

export default function DoktorIlaclarPage() {
  const [hastalar, setHastalar] = useState<Hasta[]>([]);
  const [selectedHastaId, setSelectedHastaId] = useState<string>('');
  const [ilaclar, setIlaclar] = useState<Ilac[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newIlac, setNewIlac] = useState<NewIlac>({
    ad: '',
    etkenMadde: '',
    doz: '',
    kullanim: 'Gunluk',
    baslangic: '',
    bitis: '',
    notlar: '',
  });

  // Auth + fetch hastalar
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Auth kontrolü (basit session kontrolü)
        const authRes = await fetch('/api/auth/session');
        if (!authRes.ok) {
          window.location.href = '/giris';
          return;
        }

        const res = await fetch('/api/doktor/hastalar');
        if (res.ok) {
          const data = await res.json();
          setHastalar(data);
          if (data.length > 0) {
            setSelectedHastaId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Veri çekme hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Seçili hastaya göre ilaçları getir
  useEffect(() => {
    const fetchIlaclar = async () => {
      if (!selectedHastaId) return;

      try {
        const res = await fetch(`/api/doktor/ilaclar?hastaId=${selectedHastaId}`);
        if (res.ok) {
          const data = await res.json();
          setIlaclar(data);
        }
      } catch (error) {
        console.error('İlaçlar çekilemedi:', error);
      }
    };

    fetchIlaclar();
  }, [selectedHastaId]);

  const handleInputChange = (field: keyof NewIlac, value: string) => {
    setNewIlac(prev => ({ ...prev, [field]: value }));
  };

  const handleAddIlac = async () => {
    if (!selectedHastaId || !newIlac.ad || !newIlac.baslangic) {
      alert('Lütfen zorunlu alanları doldurun');
      return;
    }

    try {
      const res = await fetch('/api/doktor/ilaclar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hastaId: selectedHastaId,
          ...newIlac,
        }),
      });

      if (res.ok) {
        const yeniIlac = await res.json();
        setIlaclar(prev => [...prev, yeniIlac]);
        setNewIlac({
          ad: '', etkenMadde: '', doz: '', kullanim: 'Gunluk',
          baslangic: '', bitis: '', notlar: '',
        });
        setShowAddForm(false);
      } else {
        alert('İlaç eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('İlaç ekleme hatası:', error);
    }
  };

  const updateIlacDurum = async (id: string, aktif: boolean) => {
    try {
      const res = await fetch(`/api/doktor/ilaclar/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aktif }),
      });

      if (res.ok) {
        setIlaclar(prev =>
          prev.map(ilac => ilac.id === id ? { ...ilac, aktif } : ilac)
        );
      }
    } catch (error) {
      console.error('Güncelleme hatası:', error);
    }
  };

  const deleteIlac = async (id: string) => {
    if (!confirm('Bu ilacı silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`/api/doktor/ilaclar/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setIlaclar(prev => prev.filter(ilac => ilac.id !== id));
      }
    } catch (error) {
      console.error('Silme hatası:', error);
    }
  };

  const aktifIlaclar = ilaclar.filter(i => i.aktif);
  const pasifIlaclar = ilaclar.filter(i => !i.aktif);

  const selectedHasta = hastalar.find(h => h.id === selectedHastaId);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <DoktorNav />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-zinc-900">İlaç Yönetimi</h1>
              <p className="text-zinc-500 mt-1">Hasta ilaçlarını görüntüleyin ve yönetin</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Hasta Seç */}
              <select
                value={selectedHastaId}
                onChange={(e) => setSelectedHastaId(e.target.value)}
                className="border border-zinc-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                disabled={hastalar.length === 0}
              >
                {hastalar.length === 0 && <option value="">Hasta bulunamadı</option>}
                {hastalar.map(hasta => (
                  <option key={hasta.id} value={hasta.id}>
                    {hasta.ad} {hasta.soyad}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-zinc-900 hover:bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                + İlaç Ekle
              </button>
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="mb-8 border border-zinc-200 rounded-xl p-6 bg-white">
              <h3 className="font-semibold text-lg mb-5 text-zinc-900">Yeni İlaç Ekle</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">İlaç Adı</label>
                  <input
                    type="text"
                    value={newIlac.ad}
                    onChange={(e) => handleInputChange('ad', e.target.value)}
                    className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 text-sm"
                    placeholder="Parol"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Etken Madde</label>
                  <input
                    type="text"
                    value={newIlac.etkenMadde}
                    onChange={(e) => handleInputChange('etkenMadde', e.target.value)}
                    className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 text-sm"
                    placeholder="Parasetamol"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Doz</label>
                  <input
                    type="text"
                    value={newIlac.doz}
                    onChange={(e) => handleInputChange('doz', e.target.value)}
                    className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 text-sm"
                    placeholder="500mg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Kullanım Sıklığı</label>
                  <select
                    value={newIlac.kullanim}
                    onChange={(e) => handleInputChange('kullanim', e.target.value)}
                    className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 text-sm"
                  >
                    <option value="Gunluk">Günlük</option>
                    <option value="2xGun">Günde 2 kez</option>
                    <option value="3xGun">Günde 3 kez</option>
                    <option value="Haftalik">Haftalık</option>
                    <option value="Aylik">Aylık</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    value={newIlac.baslangic}
                    onChange={(e) => handleInputChange('baslangic', e.target.value)}
                    className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Bitiş Tarihi (Opsiyonel)</label>
                  <input
                    type="date"
                    value={newIlac.bitis}
                    onChange={(e) => handleInputChange('bitis', e.target.value)}
                    className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Notlar</label>
                <textarea
                  value={newIlac.notlar}
                  onChange={(e) => handleInputChange('notlar', e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 text-sm h-20 resize-y"
                  placeholder="Ek notlar..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddIlac}
                  className="bg-zinc-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium"
                >
                  Kaydet
                </button>
              </div>
            </div>
          )}

          {/* İlaç Listesi */}
          {!selectedHastaId ? (
            <div className="text-center py-12 text-zinc-400">Lütfen bir hasta seçin</div>
          ) : ilaclar.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400">Bu hasta için henüz ilaç eklenmedi.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Aktif İlaçlar */}
              {aktifIlaclar.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-semibold text-emerald-700">AKTİF İLAÇLAR</span>
                    <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                      {aktifIlaclar.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {aktifIlaclar.map(ilac => (
                      <div key={ilac.id} className="border border-zinc-200 rounded-xl p-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-lg text-zinc-900">{ilac.ad}</div>
                            <div className="text-sm text-zinc-500">{ilac.etkenMadde}</div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateIlacDurum(ilac.id, false)}
                              className="text-xs px-3 py-1.5 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50"
                            >
                              Durdur
                            </button>
                            <button
                              onClick={() => deleteIlac(ilac.id)}
                              className="text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-sm">
                          <span className="bg-zinc-100 px-3 py-0.5 rounded-full text-zinc-700">{ilac.doz} • {ilac.kullanim}</span>
                          <span className="text-zinc-500">
                            {new Date(ilac.baslangic).toLocaleDateString('tr-TR')}
                            {ilac.bitis && ` - ${new Date(ilac.bitis).toLocaleDateString('tr-TR')}`}
                          </span>
                        </div>
                        {ilac.notlar && <div className="mt-2 text-sm text-zinc-600">{ilac.notlar}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pasif İlaçlar */}
              {pasifIlaclar.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-semibold text-zinc-500">PASİF İLAÇLAR</span>
                    <span className="bg-zinc-200 text-zinc-600 text-xs px-2.5 py-0.5 rounded-full font-medium">
                      {pasifIlaclar.length}
                    </span>
                  </div>
                  <div className="space-y-3 opacity-75">
                    {pasifIlaclar.map(ilac => (
                      <div key={ilac.id} className="border border-zinc-200 rounded-xl p-5 bg-zinc-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-lg text-zinc-700">{ilac.ad}</div>
                            <div className="text-sm text-zinc-500">{ilac.etkenMadde}</div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateIlacDurum(ilac.id, true)}
                              className="text-xs px-3 py-1.5 border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50"
                            >
                              Yeniden Başlat
                            </button>
                            <button
                              onClick={() => deleteIlac(ilac.id)}
                              className="text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-sm text-zinc-500">
                          <span className="bg-white px-3 py-0.5 rounded-full">{ilac.doz} • {ilac.kullanim}</span>
                          <span>
                            {new Date(ilac.baslangic).toLocaleDateString('tr-TR')}
                            {ilac.bitis && ` - ${new Date(ilac.bitis).toLocaleDateString('tr-TR')}`}
                          </span>
                        </div>
                        {ilac.notlar && <div className="mt-2 text-sm">{ilac.notlar}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
