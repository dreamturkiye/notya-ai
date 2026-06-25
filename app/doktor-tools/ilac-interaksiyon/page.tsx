"use client";

import React, { useState } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';

export const dynamic = 'force-dynamic';

interface Interaction {
  ilac1: string;
  ilac2: string;
  siddet: 'Agir' | 'Orta' | 'Hafif';
  aciklama: string;
  oneriler: string;
}

interface ApiResponse {
  interaksiyonlar: Interaction[];
  hastaOnerileri?: string[];
}

const Page: React.FC = () => {
  const [ilaclar, setIlaclar] = useState<string[]>([]);
  const [yeniIlac, setYeniIlac] = useState('');
  const [agirlik, setAgirlik] = useState(70);
  const [yas, setYas] = useState(45);
  const [bobrekFonksiyonu, setBobrekFonksiyonu] = useState('Normal');
  const [loading, setLoading] = useState(false);
  const [interaksiyonlar, setInteraksiyonlar] = useState<Interaction[]>([]);
  const [hastaOnerileri, setHastaOnerileri] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const teal = '#14B8A6';
  const bg = '#060C18';
  const glass = 'rgba(255,255,255,0.035)';
  const border = 'rgba(255,255,255,0.08)';

  const addIlac = () => {
    const trimmed = yeniIlac.trim();
    if (trimmed && !ilaclar.includes(trimmed)) {
      setIlaclar([...ilaclar, trimmed]);
      setYeniIlac('');
    }
  };

  const removeIlac = (index: number) => {
    setIlaclar(ilaclar.filter((_, i) => i !== index));
  };

  const getSeverityColor = (siddet: string) => {
    if (siddet === 'Agir') return '#EF4444';
    if (siddet === 'Orta') return '#F59E0B';
    return '#3B82F6';
  };

  const handleSubmit = async () => {
    if (ilaclar.length < 2) return;

    setLoading(true);
    setSubmitted(true);

    try {
      const tokenStr = localStorage.getItem('auth-token');
      const token = tokenStr ? JSON.parse(tokenStr).access_token : '';

      const res = await fetch('/api/doktor/araclar/ilac-interaksiyon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ilaclar,
          agirlik,
          yas,
          bobrekFonksiyonu,
        }),
      });

      const data: ApiResponse = await res.json();
      setInteraksiyonlar(data.interaksiyonlar || []);
      setHastaOnerileri(data.hastaOnerileri || []);
    } catch {
      setInteraksiyonlar([]);
      setHastaOnerileri([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#fff' }}>
      <DoktorNav />

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '48px 24px' }}>
        {/* HEADER */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ color: teal, fontSize: 11, letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>
            ILAC ETKILESIM
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0, letterSpacing: -0.5 }}>
            Ilac Etkilesim Kontrolu
          </h1>
          <p style={{ color: '#9CA3AF', marginTop: 8, fontSize: 15 }}>
            Ilaclar arasindaki etkilesimleri aninda kontrol edin
          </p>
        </div>

        {/* SEARCH CARD */}
        <div style={{
          background: glass,
          border: `1px solid ${border}`,
          borderRadius: 18,
          padding: 24,
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Ilac Listesi
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <input
              value={yeniIlac}
              onChange={(e) => setYeniIlac(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addIlac()}
              placeholder="Ilac adi girin"
              style={{
                flex: 1,
                height: 44,
                background: 'rgba(0,0,0,0.3)',
                border: `1px solid ${border}`,
                borderRadius: 10,
                padding: '0 16px',
                color: '#fff',
                fontSize: 15,
                outline: 'none',
              }}
            />
            <button
              onClick={addIlac}
              style={{
                height: 44,
                padding: '0 24px',
                background: teal,
                color: '#000',
                border: 'none',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Ekle
            </button>
          </div>

          {ilaclar.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {ilaclar.map((ilac, index) => (
                <div key={index} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '6px 14px',
                  border: `1px solid ${teal}`,
                  borderRadius: 999,
                  fontSize: 13,
                  gap: 8,
                }}>
                  {ilac}
                  <span onClick={() => removeIlac(index)} style={{ cursor: 'pointer', color: teal }}>×</span>
                </div>
              ))}
            </div>
          )}

          {/* PATIENT PARAMS */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Agirlik (kg)</div>
              <input type="number" value={agirlik} onChange={(e) => setAgirlik(Number(e.target.value))} style={{
                width: 60, height: 36, background: 'rgba(0,0,0,0.3)', border: `1px solid ${border}`, borderRadius: 8, color: '#fff', padding: '0 8px', fontSize: 14,
              }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Yas</div>
              <input type="number" value={yas} onChange={(e) => setYas(Number(e.target.value))} style={{
                width: 60, height: 36, background: 'rgba(0,0,0,0.3)', border: `1px solid ${border}`, borderRadius: 8, color: '#fff', padding: '0 8px', fontSize: 14,
              }} />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Bobrek Fonksiyonu</div>
              <select value={bobrekFonksiyonu} onChange={(e) => setBobrekFonksiyonu(e.target.value)} style={{
                width: '100%', height: 36, background: 'rgba(0,0,0,0.3)', border: `1px solid ${border}`, borderRadius: 8, color: '#fff', padding: '0 12px', fontSize: 14,
              }}>
                <option>Normal</option>
                <option>Hafif Bozuk</option>
                <option>Orta Bozuk</option>
                <option>Agir Bozuk</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={ilaclar.length < 2 || loading}
            style={{
              width: '100%',
              height: 52,
              background: teal,
              color: '#000',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              cursor: ilaclar.length < 2 ? 'not-allowed' : 'pointer',
              opacity: ilaclar.length < 2 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Analiz ediliyor...
              </>
            ) : 'Kontrol Et'}
          </button>
        </div>

        {/* RESULTS */}
        {submitted && !loading && (
          <div style={{
            background: glass,
            border: `1px solid ${border}`,
            borderRadius: 18,
            padding: 24,
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 14px',
              background: 'rgba(20,184,166,0.1)',
              color: teal,
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 20,
            }}>
              {interaksiyonlar.length} etkilesim bulundu
            </div>

            {interaksiyonlar.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 42, marginBottom: 12 }}>✅</div>
                <div style={{ color: '#4ADE80', fontSize: 15, fontWeight: 500 }}>
                  Kritik etkilesim tespit edilmedi
                </div>
              </div>
            ) : (
              interaksiyonlar.map((item, idx) => (
                <div key={idx} style={{
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: 14,
                  padding: 18,
                  marginBottom: 12,
                  border: `1px solid ${border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: getSeverityColor(item.siddet) }} />
                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                      {item.ilac1} + {item.ilac2}
                    </div>
                    <div style={{
                      marginLeft: 'auto',
                      padding: '2px 10px',
                      fontSize: 12,
                      borderRadius: 999,
                      background: getSeverityColor(item.siddet) + '22',
                      color: getSeverityColor(item.siddet),
                      fontWeight: 600,
                    }}>
                      {item.siddet}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.45, marginBottom: 6 }}>
                    {item.aciklama}
                  </div>
                  <div style={{ fontSize: 12, color: teal, fontStyle: 'italic' }}>
                    {item.oneriler}
                  </div>
                </div>
              ))
            )}

            {hastaOnerileri.length > 0 && (
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${border}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: teal }}>
                  Hasta Onerileri
                </div>
                {hastaOnerileri.map((o, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>• {o}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
