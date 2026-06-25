'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';

interface Interaksiyon {
  ilacA: string;
  ilacB: string;
  siddet: 'Hafif' | 'Orta' | 'Ciddi' | 'Kritik';
  mekanizma: string;
  aciklama: string;
  oneri: string;
}

interface ApiResponse {
  risk: 'guvenli' | 'dikkat' | 'kontrendike';
  interaksiyonlar: Interaksiyon[];
  dozUyarilari: string[];
}

const riskConfig = {
  guvenli: { label: 'GÜVENLİ', color: '#16a34a', bg: 'bg-[#16a34a]' },
  dikkat: { label: 'DIKKAT', color: '#d97706', bg: 'bg-[#d97706]' },
  kontrendike: { label: 'KONTRENDİKE', color: '#dc2626', bg: 'bg-[#dc2626]' },
};

const bobrekSecenekleri = [
  'Normal',
  'Hafif azalma',
  'Orta azalma',
  'Ağır azalma',
] as const;

type BobrekFonksiyonu = (typeof bobrekSecenekleri)[number];

export default function IlacInteraksiyonPage() {
  const [ilaclar, setIlaclar] = useState<string[]>([]);
  const [yeniIlac, setYeniIlac] = useState('');
  const [agirlik, setAgirlik] = useState('');
  const [yas, setYas] = useState('');
  const [bobrekFonksiyonu, setBobrekFonksiyonu] = useState<BobrekFonksiyonu>('Normal');
  const [loading, setLoading] = useState(false);
  const [sonuc, setSonuc] = useState<ApiResponse | null>(null);
  const [hata, setHata] = useState('');

  const maxIlac = 10;

  const ilacEkle = () => {
    const trimmed = yeniIlac.trim();
    if (!trimmed) return;
    if (ilaclar.length >= maxIlac) return;
    if (ilaclar.includes(trimmed)) {
      setYeniIlac('');
      return;
    }
    setIlaclar([...ilaclar, trimmed]);
    setYeniIlac('');
  };

  const ilacSil = (index: number) => {
    const yeniListe = ilaclar.filter((_, i) => i !== index);
    setIlaclar(yeniListe);
    if (yeniListe.length < 2) setSonuc(null);
  };

  const handleKontrolEt = async () => {
    if (ilaclar.length < 2) return;

    setLoading(true);
    setHata('');
    setSonuc(null);

    try {
      const payload = {
        ilaclar,
        agirlik: agirlik ? parseFloat(agirlik) : undefined,
        yas: yas ? parseInt(yas) : undefined,
        bobrekFonksiyonu,
      };

      const res = await fetch('/api/doktor/araclar/ilac-interaksiyon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Sunucu hatası');

      const data: ApiResponse = await res.json();
      setSonuc(data);
    } catch (err) {
      setHata('Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const riskBilgi = sonuc ? riskConfig[sonuc.risk] : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <DoktorNav />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-semibold mb-8">İlaç Etkileşim Kontrolü</h1>

        {/* İlaç Girişi */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={yeniIlac}
              onChange={(e) => setYeniIlac(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ilacEkle()}
              placeholder="İlaç adı yazın..."
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              disabled={ilaclar.length >= maxIlac}
            />
            <button
              onClick={ilacEkle}
              disabled={!yeniIlac.trim() || ilaclar.length >= maxIlac}
              className="px-8 rounded-xl bg-white text-zinc-950 font-medium disabled:opacity-40"
            >
              Ekle
            </button>
          </div>

          {/* İlaç Pill'leri */}
          {ilaclar.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ilaclar.map((ilac, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-zinc-800 text-sm px-4 py-1.5 rounded-full"
                >
                  {ilac}
                  <button
                    onClick={() => ilacSil(index)}
                    className="text-zinc-400 hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className="text-xs text-zinc-500 self-center ml-2">
                {ilaclar.length}/{maxIlac}
              </div>
            </div>
          )}
        </div>

        {/* Opsiyonel Alanlar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Ağırlık (kg)</label>
            <input
              type="number"
              value={agirlik}
              onChange={(e) => setAgirlik(e.target.value)}
              placeholder="70"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Yaş (yıl)</label>
            <input
              type="number"
              value={yas}
              onChange={(e) => setYas(e.target.value)}
              placeholder="45"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Böbrek Fonksiyonu</label>
            <select
              value={bobrekFonksiyonu}
              onChange={(e) => setBobrekFonksiyonu(e.target.value as BobrekFonksiyonu)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
            >
              {bobrekSecenekleri.map((secenek) => (
                <option key={secenek} value={secenek}>
                  {secenek}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Kontrol Butonu */}
        <button
          onClick={handleKontrolEt}
          disabled={ilaclar.length < 2 || loading}
          className="w-full md:w-auto px-12 py-4 bg-white text-zinc-950 font-semibold rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Analiz yapılıyor...' : 'Kontrol Et'}
        </button>

        {hata && <p className="text-red-400 mt-4">{hata}</p>}

        {/* Sonuçlar */}
        {sonuc && riskBilgi && (
          <div className="mt-12">
            {/* Genel Risk Badge */}
            <div className="flex justify-center mb-10">
              <div
                className={`${riskBilgi.bg} text-white text-2xl font-bold px-16 py-4 rounded-3xl tracking-wider`}
              >
                {riskBilgi.label}
              </div>
            </div>

            {/* Etkileşim Kartları */}
            {sonuc.interaksiyonlar.length > 0 && (
              <div className="mb-10">
                <h3 className="text-xl font-semibold mb-4">İlaç Etkileşimleri</h3>
                <div className="space-y-4">
                  {sonuc.interaksiyonlar.map((item, idx) => (
                    <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-medium">{item.ilacA}</span>
                        <span className="text-zinc-500">↔</span>
                        <span className="font-medium">{item.ilacB}</span>
                        <span className="ml-auto text-xs px-3 py-1 rounded-full bg-zinc-800">
                          {item.siddet}
                        </span>
                      </div>
                      <div className="text-sm text-zinc-400 mb-2">
                        <span className="font-medium text-zinc-300">Mekanizma:</span> {item.mekanizma}
                      </div>
                      <div className="text-sm mb-3">{item.aciklama}</div>
                      <div className="text-sm text-emerald-400">
                        <span className="font-medium">Öneri:</span> {item.oneri}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Doz Uyarıları */}
            {sonuc.dozUyarilari.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Doz Ayarlama Uyarıları</h3>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <ul className="space-y-3 text-sm">
                    {sonuc.dozUyarilari.map((uyari, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-amber-400 mt-1">•</span>
                        <span>{uyari}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
