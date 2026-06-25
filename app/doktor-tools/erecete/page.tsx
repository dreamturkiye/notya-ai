'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';

interface Hasta {
  id: string;
  ad: string;
  soyad: string;
}

interface Ilac {
  id: string;
  ad: string;
  doz: string;
  kullanim: string;
  sure: string;
}

interface ReceteSonuc {
  icd10: { code: string; aciklama: string };
  ilaclar: Ilac[];
  interaksiyonlar: string[];
  uyarilar: string[];
  sgkUyum: boolean;
}

const DoktorNav: React.FC = () => (
  <div style={{ 
    height: '64px', 
    backgroundColor: '#0A1328', 
    borderBottom: '1px solid rgba(255,255,255,0.08)', 
    display: 'flex', 
    alignItems: 'center', 
    padding: '0 24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  }}>
    <div style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>Doktor Paneli</div>
  </div>
);

const ERecetePage: React.FC = () => {
  const [hastalar, setHastalar] = useState<Hasta[]>([]);
  const [selectedHasta, setSelectedHasta] = useState('');
  const [tani, setTani] = useState('');
  const [notlar, setNotlar] = useState('');
  const [ilaclar, setIlaclar] = useState<Ilac[]>([
    { id: '1', ad: '', doz: '', kullanim: '', sure: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [sonuc, setSonuc] = useState<ReceteSonuc | null>(null);
  const [error, setError] = useState('');

  const teal = '#00D4AA';
  const glassBg = 'rgba(255,255,255,0.05)';
  const glassBorder = 'rgba(255,255,255,0.1)';

  useEffect(() => {
    const fetchHastalar = async () => {
      const tokenStr = localStorage.getItem('auth-token');
      if (!tokenStr) return;

      try {
        const tokenData = JSON.parse(tokenStr);
        const res = await fetch('/api/doktor/hastalar', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          setHastalar(data);
        }
      } catch (e) {
        console.error('Hasta listesi alınamadı');
      }
    };
    fetchHastalar();
  }, []);

  const addIlac = () => {
    setIlaclar([
      ...ilaclar,
      { id: Date.now().toString(), ad: '', doz: '', kullanim: '', sure: '' }
    ]);
  };

  const removeIlac = (id: string) => {
    if (ilaclar.length > 1) {
      setIlaclar(ilaclar.filter(ilac => ilac.id !== id));
    }
  };

  const updateIlac = (id: string, field: keyof Ilac, value: string) => {
    setIlaclar(ilaclar.map(ilac =>
      ilac.id === id ? { ...ilac, [field]: value } : ilac
    ));
  };

  const handleSubmit = async () => {
    if (!selectedHasta || !tani) {
      setError('Hasta ve tanı alanları zorunludur.');
      return;
    }

    setLoading(true);
    setError('');
    setSonuc(null);

    const tokenStr = localStorage.getItem('auth-token');
    if (!tokenStr) {
      setError('Oturum bulunamadı.');
      setLoading(false);
      return;
    }

    const tokenData = JSON.parse(tokenStr);
    const payload = {
      hastaId: selectedHasta,
      tani,
      notlar,
      ilaclar: ilaclar.filter(i => i.ad.trim() !== '')
    };

    try {
      const res = await fetch('/api/doktor/araclar/erecete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data: ReceteSonuc = await res.json();
        setSonuc(data);
      } else {
        setError('Reçete oluşturulamadı. Lütfen tekrar deneyin.');
      }
    } catch (e) {
      setError('Sunucu hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const printRecete = () => {
    window.print();
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#060C18', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#fff'
    }}>
      <DoktorNav />
      
      <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* HEADER */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ 
            color: teal, 
            fontSize: '12px', 
            fontWeight: 600, 
            letterSpacing: '1.5px',
            marginBottom: '8px'
          }}>
            E-RECETE
          </div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 700, 
            margin: 0,
            marginBottom: '6px'
          }}>
            Elektronik Reçete
          </h1>
          <p style={{ 
            color: 'rgba(255,255,255,0.6)', 
            fontSize: '15px', 
            margin: 0 
          }}>
            Elektronik reçete oluşturma ve SGK entegrasyonu
          </p>
        </div>

        {/* 2 COLUMN LAYOUT */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          gap: '20px',
          '@media (max-width: 768px)': { flexDirection: 'column' } as any
        }}>
          
          {/* LEFT PANEL */}
          <div style={{ flex: 1 }}>
            <div style={{
              backgroundColor: glassBg,
              border: `1px solid ${glassBorder}`,
              borderRadius: '18px',
              padding: '24px',
              backdropFilter: 'blur(20px)'
            }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 600, 
                marginBottom: '24px' 
              }}>
                Reçete Oluştur
              </div>

              {/* Hasta */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '13px', marginBottom: '8px', color: 'rgba(255,255,255,0.7)' }}>Hasta</div>
                <select
                  value={selectedHasta}
                  onChange={(e) => setSelectedHasta(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${glassBorder}`,
                    borderRadius: '14px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    color: '#fff',
                    outline: 'none'
                  }}
                >
                  <option value="">Hasta seçin...</option>
                  {hastalar.map(h => (
                    <option key={h.id} value={h.id}>{h.ad} {h.soyad}</option>
                  ))}
                </select>
              </div>

              {/* Tanı */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '13px', marginBottom: '8px', color: 'rgba(255,255,255,0.7)' }}>Tanı</div>
                <textarea
                  value={tani}
                  onChange={(e) => setTani(e.target.value)}
                  placeholder="Tanı bilgisini girin..."
                  rows={3}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${glassBorder}`,
                    borderRadius: '14px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    color: '#fff',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Ek Notlar */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', marginBottom: '8px', color: 'rgba(255,255,255,0.7)' }}>Ek Notlar</div>
                <textarea
                  value={notlar}
                  onChange={(e) => setNotlar(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${glassBorder}`,
                    borderRadius: '14px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    color: '#fff',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              </div>

              {/* İlaç Ekle */}
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>İlaçlar</div>
                  <button
                    onClick={addIlac}
                    style={{
                      backgroundColor: 'transparent',
                      border: `1px solid ${teal}`,
                      color: teal,
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    + Ekle
                  </button>
                </div>

                {ilaclar.map((ilac, index) => (
                  <div key={ilac.id} style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    marginBottom: '8px',
                    alignItems: 'center'
                  }}>
                    <input
                      placeholder="İlaç adı"
                      value={ilac.ad}
                      onChange={(e) => updateIlac(ilac.id, 'ad', e.target.value)}
                      style={{
                        flex: 2,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        border: `1px solid ${glassBorder}`,
                        borderRadius: '14px',
                        padding: '10px 14px',
                        fontSize: '14px',
                        color: '#fff',
                        outline: 'none'
                      }}
                    />
                    <input
                      placeholder="Doz"
                      value={ilac.doz}
                      onChange={(e) => updateIlac(ilac.id, 'doz', e.target.value)}
                      style={{
                        flex: 1,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        border: `1px solid ${glassBorder}`,
                        borderRadius: '14px',
                        padding: '10px 14px',
                        fontSize: '14px',
                        color: '#fff',
                        outline: 'none'
                      }}
                    />
                    <input
                      placeholder="Kullanım"
                      value={ilac.kullanim}
                      onChange={(e) => updateIlac(ilac.id, 'kullanim', e.target.value)}
                      style={{
                        flex: 1.2,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        border: `1px solid ${glassBorder}`,
                        borderRadius: '14px',
                        padding: '10px 14px',
                        fontSize: '14px',
                        color: '#fff',
                        outline: 'none'
                      }}
                    />
                    <input
                      placeholder="Süre"
                      value={ilac.sure}
                      onChange={(e) => updateIlac(ilac.id, 'sure', e.target.value)}
                      style={{
                        flex: 1,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        border: `1px solid ${glassBorder}`,
                        borderRadius: '14px',
                        padding: '10px 14px',
                        fontSize: '14px',
                        color: '#fff',
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={() => removeIlac(ilac.id)}
                      disabled={ilaclar.length === 1}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}

                <button
                  onClick={addIlac}
                  style={{
                    marginTop: '8px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${teal}`,
                    color: teal,
                    padding: '8px 16px',
                    borderRadius: '14px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  + İlaç Ekle
                </button>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  marginTop: '28px',
                  width: '100%',
                  height: '52px',
                  backgroundColor: teal,
                  color: '#060C18',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: loading ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading ? (
                  <>
                    <span style={{ 
                      width: '16px', 
                      height: '16px', 
                      border: '2px solid #060C18', 
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    Üretiliyor...
                  </>
                ) : 'Reçete Üret'}
              </button>

              {error && (
                <div style={{ color: '#ff6b6b', fontSize: '13px', marginTop: '12px' }}>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div style={{ flex: 1 }}>
            <div style={{
              backgroundColor: glassBg,
              border: `1px solid ${glassBorder}`,
              borderRadius: '18px',
              padding: '24px',
              minHeight: '420px',
              backdropFilter: 'blur(20px)'
            }}>
              {!sonuc ? (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  padding: '60px 20px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.4 }}>📋</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                    Reçete önizlemesi burada görünecek
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>Reçete Taslağı</div>
                    <button 
                      onClick={printRecete}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        border: `1px solid ${glassBorder}`,
                        color: '#fff',
                        padding: '6px 14px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      Yazdır
                    </button>
                  </div>

                  <div style={{ 
                    display: 'inline-block',
                    backgroundColor: 'rgba(0,212,170,0.1)',
                    color: teal,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    marginBottom: '18px'
                  }}>
                    {sonuc.icd10.code} — {sonuc.icd10.aciklama}
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', marginBottom: '10px', color: 'rgba(255,255,255,0.6)' }}>İlaçlar</div>
                    {sonuc.ilaclar.map((ilac, idx) => (
                      <div key={idx} style={{
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        marginBottom: '6px',
                        fontSize: '13px'
                      }}>
                        {ilac.ad} • {ilac.doz} • {ilac.kullanim} • {ilac.sure}
                      </div>
                    ))}
                  </div>

                  {sonuc.interaksiyonlar.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ color: '#f5a623', fontSize: '13px', marginBottom: '8px' }}>İnteraksiyonlar</div>
                      {sonuc.interaksiyonlar.map((i, idx) => (
                        <div key={idx} style={{ 
                          backgroundColor: 'rgba(245,166,35,0.1)', 
                          color: '#f5a623', 
                          padding: '8px 12px', 
                          borderRadius: '10px',
                          fontSize: '13px',
                          marginBottom: '4px'
                        }}>{i}</div>
                      ))}
                    </div>
                  )}

                  {sonuc.uyarilar.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ color: '#ff6b6b', fontSize: '13px', marginBottom: '8px' }}>Uyarılar</div>
                      {sonuc.uyarilar.map((u, idx) => (
                        <div key={idx} style={{ color: '#ff6b6b', fontSize: '13px' }}>• {u}</div>
                      ))}
                    </div>
                  )}

                  <div style={{
                    marginTop: '20px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: sonuc.sgkUyum ? 'rgba(0,212,170,0.1)' : 'rgba(255,107,107,0.1)',
                    color: sonuc.sgkUyum ? teal : '#ff6b6b',
                    fontSize: '13px',
                    fontWeight: 600
                  }}>
                    {sonuc.sgkUyum ? '✓ SGK Uyumlu' : '✕ SGK Uyumsuz'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ERecetePage;
