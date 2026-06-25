'use client';

import DoktorNav from '@/components/doktor/DoktorNav'
import React, { useState, useEffect } from 'react';

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
  saat: string;
}

interface EpikrizSonuc {
  hastaBilgileri: string;
  taniVeTedavi: string;
  taburcuOzeti: string;
}


export default function EpikrizPage() {
  const [hastalar, setHastalar] = useState<Hasta[]>([]);
  const [seciliHastaId, setSeciliHastaId] = useState('');
  const [seanslar, setSeanslar] = useState<Seans[]>([]);
  const [seciliSeansId, setSeciliSeansId] = useState('');
  const [ekBilgi, setEkBilgi] = useState('');
  const [sonuc, setSonuc] = useState<EpikrizSonuc | null>(null);
  const [loading, setLoading] = useState(false);
  const [seansLoading, setSeansLoading] = useState(false);
  const [seansError, setSeansError] = useState('');
  const [hastaLoading, setHastaLoading] = useState(true);

  const getToken = () => {
    if (typeof window === 'undefined') return null;
    const tokenStr = localStorage.getItem('auth-token');
    if (!tokenStr) return null;
    try {
      return JSON.parse(tokenStr).access_token;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const fetchHastalar = async () => {
      const token = getToken();
      if (!token) {
        setHastaLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/doktor/hastalar', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setHastalar(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setHastaLoading(false);
      }
    };
    fetchHastalar();
  }, []);

  const handleHastaChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const hastaId = e.target.value;
    setSeciliHastaId(hastaId);
    setSeciliSeansId('');
    setSeanslar([]);
    setSeansError('');
    setSonuc(null);

    if (!hastaId) return;

    setSeansLoading(true);
    const token = getToken();
    if (!token) {
      setSeansLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/doktor/hastalar/${hastaId}/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) {
        setSeansError('Seans bulunamadi');
        setSeanslar([]);
      } else if (res.ok) {
        const data = await res.json();
        setSeanslar(data);
        setSeansError('');
      }
    } catch (e) {
      setSeansError('Seans bulunamadi');
    } finally {
      setSeansLoading(false);
    }
  };

  const handleUret = async () => {
    if (!seciliHastaId || !seciliSeansId) return;

    setLoading(true);
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/doktor/araclar/epikriz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hastaId: seciliHastaId,
          seansId: seciliSeansId,
          ekBilgi,
        }),
      });

      if (res.ok) {
        const data: EpikrizSonuc = await res.json();
        setSonuc(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleKopyala = () => {
    if (!sonuc) return;
    const text = `${sonuc.hastaBilgileri}\n\n${sonuc.taniVeTedavi}\n\n${sonuc.taburcuOzeti}`;
    navigator.clipboard.writeText(text);
  };

  const handleYazdir = () => {
    window.print();
  };

  const handlePDF = () => {
    alert('PDF indirme başlatıldı (demo)');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#060C18', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
    }}>
      <DoktorNav />
      
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px' }}>
        {/* HEADER */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ 
            color: '#14B8A6', 
            fontSize: '13px', 
            fontWeight: 600, 
            letterSpacing: '1.5px',
            marginBottom: '8px' 
          }}>
            EPIKRIZ
          </div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 700, 
            color: '#fff', 
            margin: 0,
            letterSpacing: '-0.6px'
          }}>
            Epikriz Uretici
          </h1>
          <p style={{ 
            color: '#8A94A8', 
            fontSize: '15px', 
            marginTop: '8px' 
          }}>
            Hasta ve seans seçerek profesyonel epikriz raporu oluşturun
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '32px' 
        }}>
          {/* LEFT - FORM */}
          <div>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '18px',
              padding: '24px',
              backdropFilter: 'blur(20px)'
            }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 600, 
                color: '#fff', 
                marginBottom: '24px' 
              }}>
                Epikriz Bilgileri
              </div>

              {/* Hasta Select */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#A1A9BB', 
                  fontSize: '13px', 
                  marginBottom: '8px' 
                }}>
                  Hasta
                </label>
                <select 
                  value={seciliHastaId} 
                  onChange={handleHastaChange}
                  disabled={hastaLoading}
                  style={{
                    width: '100%',
                    height: '48px',
                    backgroundColor: '#0F1729',
                    border: '1px solid #2A3448',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '15px',
                    padding: '0 14px',
                    outline: 'none'
                  }}
                >
                  <option value="">Hasta seçin</option>
                  {hastalar.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.ad} {h.soyad} ({h.tcKimlik})
                    </option>
                  ))}
                </select>
              </div>

              {/* Seans Select */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#A1A9BB', 
                  fontSize: '13px', 
                  marginBottom: '8px' 
                }}>
                  Seans
                </label>
                <select 
                  value={seciliSeansId} 
                  onChange={(e) => setSeciliSeansId(e.target.value)}
                  disabled={!seciliHastaId || seansLoading}
                  style={{
                    width: '100%',
                    height: '48px',
                    backgroundColor: '#0F1729',
                    border: '1px solid #2A3448',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '15px',
                    padding: '0 14px',
                    outline: 'none'
                  }}
                >
                  <option value="">Seans seçin</option>
                  {seanslar.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.tarih} • {s.saat}
                    </option>
                  ))}
                </select>
                {seansError && (
                  <div style={{ color: '#EF4444', fontSize: '13px', marginTop: '6px' }}>
                    {seansError}
                  </div>
                )}
              </div>

              {/* Ek Bilgi */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#A1A9BB', 
                  fontSize: '13px', 
                  marginBottom: '8px' 
                }}>
                  Ek Bilgi
                </label>
                <textarea
                  value={ekBilgi}
                  onChange={(e) => setEkBilgi(e.target.value)}
                  rows={4}
                  placeholder="Ek klinik bilgi veya notlar..."
                  style={{
                    width: '100%',
                    backgroundColor: '#0F1729',
                    border: '1px solid #2A3448',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '15px',
                    padding: '14px',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                onClick={handleUret}
                disabled={!seciliHastaId || !seciliSeansId || loading}
                style={{
                  width: '100%',
                  height: '52px',
                  backgroundColor: '#14B8A6',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '10px',
                  cursor: loading || !seciliHastaId || !seciliSeansId ? 'not-allowed' : 'pointer',
                  opacity: loading || !seciliHastaId || !seciliSeansId ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading && (
                  <div style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                )}
                Epikriz Uret
              </button>
            </div>
          </div>

          {/* RIGHT - RESULT */}
          <div>
            {!sonuc ? (
              <div style={{
                height: '100%',
                minHeight: '380px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '18px',
                padding: '48px 32px'
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <p style={{ 
                  color: '#64748B', 
                  fontSize: '15px', 
                  marginTop: '20px',
                  textAlign: 'center'
                }}>
                  Epikriz oluşturmak için hasta ve seans seçin
                </p>
              </div>
            ) : (
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '18px',
                padding: '28px',
                color: '#fff'
              }}>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>Hasta Bilgileri</div>
                  <div style={{ color: '#CBD5E1', fontSize: '15px', lineHeight: '1.5' }}>{sonuc.hastaBilgileri}</div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>Tanı ve Tedavi</div>
                  <div style={{ color: '#CBD5E1', fontSize: '15px', lineHeight: '1.5' }}>{sonuc.taniVeTedavi}</div>
                </div>

                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>Taburcu Özeti</div>
                  <div style={{ 
                    color: '#CBD5E1', 
                    fontSize: '15px', 
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {sonuc.taburcuOzeti}
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  marginTop: '32px',
                  flexWrap: 'wrap'
                }}>
                  <button onClick={handleKopyala} style={{
                    flex: 1,
                    height: '44px',
                    backgroundColor: 'transparent',
                    color: '#14B8A6',
                    border: '1px solid #14B8A6',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}>
                    Kopyala
                  </button>
                  <button onClick={handleYazdir} style={{
                    flex: 1,
                    height: '44px',
                    backgroundColor: 'transparent',
                    color: '#14B8A6',
                    border: '1px solid #14B8A6',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}>
                    Yazdır
                  </button>
                  <button onClick={handlePDF} style={{
                    flex: 1,
                    height: '44px',
                    backgroundColor: 'transparent',
                    color: '#14B8A6',
                    border: '1px solid #14B8A6',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}>
                    PDF İndir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
