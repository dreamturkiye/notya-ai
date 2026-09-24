'use client';
import HafifMarkdown from '@/components/asistan/HafifMarkdown';
import React, { useState, useEffect } from 'react';
import { getDoctorAccessToken, ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme';

export const dynamic = 'force-dynamic';

interface Hasta {
  id: string;
  masked_name: string;
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
  imza: string;
  letterhead?: { satirlar: string[]; logoDataUrl: string; diplomaNo: string };
  enabiz?: {
    tur?: string
    kanal?: string
    live_write?: boolean
    kopya_metin?: string
    uretildi_at?: string
  };
}


export default function EpikrizPage() {
  const [hastalar, setHastalar] = useState<Hasta[]>([]);
  const [seciliHastaId, setSeciliHastaId] = useState('');
  const [seanslar, setSeanslar] = useState<Seans[]>([]);
  const [seciliSeansId, setSeciliSeansId] = useState('');
  const [mod, setMod] = useState<'tekSeans' | 'tumSeanslar'>('tekSeans'); // Kaan (2026-09-13): kapsamlı özet seçeneği
  const [ekBilgi, setEkBilgi] = useState('');
  const [sonuc, setSonuc] = useState<EpikrizSonuc | null>(null);
  const [loading, setLoading] = useState(false);
  const [seansLoading, setSeansLoading] = useState(false);
  const [seansError, setSeansError] = useState('');
  const [hastaLoading, setHastaLoading] = useState(true);
  const [uretHata, setUretHata] = useState('');

  const getToken = () => getDoctorAccessToken() || null; // NOTYA-AUTH-01

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
          setHastalar(Array.isArray(data.patients) ? data.patients : []);
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
        setSeansError('Seans bulunamadı');
        setSeanslar([]);
      } else if (res.ok) {
        const data = await res.json();
        const raw = Array.isArray(data.sessions) ? data.sessions : [];
        const mapped = raw.map((s: { id: string; created_at: string }) => {
          const d = new Date(s.created_at);
          return {
            id: s.id,
            tarih: d.toLocaleDateString('tr-TR'),
            saat: d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          };
        });
        setSeanslar(mapped);
        setSeansError('');
      }
    } catch (e) {
      setSeansError('Seans bulunamadı');
    } finally {
      setSeansLoading(false);
    }
  };

  const handleUret = async () => {
    if (!seciliHastaId || (mod === 'tekSeans' && !seciliSeansId)) return;

    setLoading(true);
    setUretHata('');
    // Kaan (2026-09-13): "Epikriz Üret'e bastığımda ekran ilerlemiyor" — kök sebep iki katlı:
    // (1) getToken() yenilenmeyen token döndürüyordu, süresi dolunca 401; (2) res.ok değilse
    // hiçbir hata gösterilmiyordu, sayfa sessizce hiçbir şey olmamış gibi kalıyordu.
    const token = await ensureDoctorAccessToken();
    if (!token) {
      setLoading(false);
      setUretHata('Oturum doğrulanamadı — sayfayı yenileyip tekrar deneyin.');
      return;
    }

    try {
      const res = await fetch('/api/doktor/araclar/epikriz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          mod === 'tumSeanslar'
            ? { hastaId: seciliHastaId, tumSeanslar: true, ekBilgi }
            : { hastaId: seciliHastaId, seansId: seciliSeansId, ekBilgi }
        ),
      });

      if (res.ok) {
        const data: EpikrizSonuc = await res.json();
        setSonuc(data);
      } else {
        const j = await res.json().catch(() => ({}));
        setUretHata(j.hata || j.error || `Epikriz oluşturulamadı (${res.status}).`);
      }
    } catch (e) {
      console.error(e);
      setUretHata('Bağlantı hatası — tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleKopyala = () => {
    if (!sonuc) return;
    const text = `${sonuc.hastaBilgileri}\n\n${sonuc.taniVeTedavi}\n\n${sonuc.taburcuOzeti}\n\n${sonuc.imza}`;
    navigator.clipboard.writeText(text);
  };

  const handleEnabizIndir = () => {
    if (!sonuc?.enabiz) return;
    const blob = new Blob([JSON.stringify(sonuc.enabiz, null, 2)], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `enabiz-epikriz-${(sonuc.enabiz.uretildi_at || '').slice(0, 10) || 'paket'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleYazdir = () => {
    window.print();
  };

  const handlePDF = () => {
    window.print();
  };

  return (
    <>
    <div className="yazdirma-gizle" style={{ 
      minHeight: '100vh', 
      backgroundColor: 'transparent', 
      fontFamily: CHROME_FONT.sans 
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 0 20px' }}>
        {/* HEADER */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ 
            fontFamily: CHROME_FONT.serif,
            fontStyle: 'italic',
            color: '#6d6055', 
            fontSize: '15px', 
            marginBottom: '4px' 
          }}>
            Epikriz
          </div>
          <h1 style={{ 
            fontFamily: CHROME_FONT.serif,
            fontWeight: 500,
            fontSize: '32px', 
            color: '#2e251d', 
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            Epikriz Üretici
          </h1>
          <p style={{ 
            color: CHROME_RENK.muted, 
            fontSize: '15px', 
            marginTop: '8px' 
          }}>
            Hasta ve seans seçerek profesyonel epikriz raporu oluşturun
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '32px' 
        }}>
          {/* LEFT - FORM */}
          <div>
            <div style={{
              backgroundColor: '#FFFFFF',
              border: `1px solid ${CHROME_RENK.border}`,
              borderRadius: '18px',
              padding: '24px',
              boxShadow: '0 8px 18px rgba(58,44,34,0.045)'
            }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 600, 
                color: CHROME_RENK.ink, 
                marginBottom: '24px' 
              }}>
                Epikriz Bilgileri
              </div>

              {/* Hasta Select */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  color: CHROME_RENK.muted, 
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
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${CHROME_RENK.border}`,
                    borderRadius: '10px',
                    color: CHROME_RENK.ink,
                    fontSize: '15px',
                    padding: '0 14px',
                    outline: 'none'
                  }}
                >
                  <option value="">Hasta seçin</option>
                  {hastalar.map(h => (
                    <option key={h.id} value={h.id} style={{ color: '#000', background: '#fff' }}>
                      {h.masked_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kaan (2026-09-13): "tüm seansları özetleyecek şekilde de bir seçenek olmalı" */}
              <div style={{ marginBottom: '20px', display: 'flex', gap: 8 }}>
                {([['tekSeans', 'Tek Seans'], ['tumSeanslar', 'Tüm Seanslar (Kapsamlı Özet)']] as const).map(([m, etiket]) => (
                  <button key={m} type="button" onClick={() => setMod(m)}
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      border: mod === m ? `1px solid ${CHROME_RENK.pine}` : `1px solid ${CHROME_RENK.border}`,
                      background: mod === m ? '#E4F3F1' : '#FFFFFF',
                      color: mod === m ? CHROME_RENK.pine : CHROME_RENK.muted,
                    }}>
                    {etiket}
                  </button>
                ))}
              </div>
              {mod === 'tumSeanslar' && (
                <div style={{ marginBottom: '16px', fontSize: 13, color: CHROME_RENK.muted, lineHeight: 1.5 }}>
                  Hastanın ilk geldiğinden son gelişine kadar tüm muayeneleri, geliş tanıları (rutin kontroller ve geçirdiği hastalıklar ayrı, tarihli), kayıtlı aşılar ve kullanılan ilaç/takviyeler tek özette birleştirilir.
                </div>
              )}
              {/* Seans Select */}
              <div style={{ marginBottom: '20px', display: mod === 'tumSeanslar' ? 'none' : 'block' }}>
                <label style={{ 
                  display: 'block', 
                  color: CHROME_RENK.muted, 
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
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${CHROME_RENK.border}`,
                    borderRadius: '10px',
                    color: CHROME_RENK.ink,
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
                  <div style={{ color: CHROME_RENK.warn, fontSize: '13px', marginTop: '6px' }}>
                    {seansError}
                  </div>
                )}
              </div>

              {/* Ek Bilgi */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  color: CHROME_RENK.muted, 
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
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${CHROME_RENK.border}`,
                    borderRadius: '10px',
                    color: CHROME_RENK.ink,
                    fontSize: '15px',
                    padding: '14px',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                onClick={handleUret}
                disabled={!seciliHastaId || (mod === 'tekSeans' && !seciliSeansId) || loading}
                style={{
                  width: '100%',
                  height: '52px',
                  backgroundColor: CHROME_RENK.pine,
                  color: '#FAF8F4',
                  fontSize: '15px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '10px',
                  cursor: loading || !seciliHastaId || (mod === 'tekSeans' && !seciliSeansId) ? 'not-allowed' : 'pointer',
                  opacity: loading || !seciliHastaId || (mod === 'tekSeans' && !seciliSeansId) ? 0.6 : 1,
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
                    border: '2px solid rgba(250,248,244,0.4)',
                    borderTopColor: '#FAF8F4',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                )}
                Epikriz Üret
              </button>
              {uretHata && <div style={{ marginTop: 10, fontSize: 13, color: CHROME_RENK.warn }}>{uretHata}</div>}
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
                backgroundColor: '#FFFFFF',
                border: `1px solid ${CHROME_RENK.border}`,
                borderRadius: '18px',
                padding: '48px 32px'
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C9BEA9" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <p style={{ 
                  color: CHROME_RENK.muted, 
                  fontSize: '15px', 
                  marginTop: '20px',
                  textAlign: 'center'
                }}>
                  Epikriz oluşturmak için hasta ve seans seçin
                </p>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#FFFFFF',
                border: `1px solid ${CHROME_RENK.border}`,
                borderRadius: '18px',
                padding: '28px',
                color: CHROME_RENK.ink,
                boxShadow: '0 8px 18px rgba(58,44,34,0.045)'
              }}>
                <div style={{ marginBottom: '24px', background: '#F6F0E4', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: CHROME_RENK.pine, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Hasta Bilgileri</div>
                  <div style={{ color: CHROME_RENK.ink, fontSize: '15px', lineHeight: '1.7', whiteSpace: 'pre-line' }}>{sonuc.hastaBilgileri}</div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: CHROME_RENK.pine, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tanı ve Tedavi</div>
                  <div style={{ color: CHROME_RENK.ink, fontSize: '15px', lineHeight: '1.6' }}>
                    <HafifMarkdown metin={sonuc.taniVeTedavi} karanlik={false} />
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: CHROME_RENK.pine, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Taburcu Özeti</div>
                  <div style={{ 
                    color: CHROME_RENK.ink, 
                    fontSize: '15px', 
                    lineHeight: '1.6',
                  }}>
                    <HafifMarkdown metin={sonuc.taburcuOzeti} karanlik={false} />
                  </div>
                </div>

                <div style={{ borderTop: `1px solid ${CHROME_RENK.border}`, paddingTop: '18px' }}>
                  <div style={{ color: CHROME_RENK.muted, fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-line', textAlign: 'right' }}>{sonuc.imza}</div>
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
                    color: CHROME_RENK.pine,
                    border: `1px solid ${CHROME_RENK.pine}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}>
                    Kopyala
                  </button>
                  {sonuc.enabiz && (
                    <button onClick={handleEnabizIndir} style={{
                      flex: 1,
                      height: '44px',
                      backgroundColor: 'transparent',
                      color: CHROME_RENK.muted,
                      border: `1px solid ${CHROME_RENK.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}>
                      e-Nabız FHIR JSON
                    </button>
                  )}
                  <button onClick={handleYazdir} style={{
                    flex: 1,
                    height: '44px',
                    backgroundColor: 'transparent',
                    color: CHROME_RENK.pine,
                    border: `1px solid ${CHROME_RENK.pine}`,
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
                    color: CHROME_RENK.pine,
                    border: `1px solid ${CHROME_RENK.pine}`,
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

    {/* NOTYA-EPIKRIZ-03 (Kaan 2026-09-14): "cila = exceptional" — koyu uygulama arayüzü değil,
        reçete/yazdır sayfalarıyla aynı kalitede ayrı bir beyaz kağıt belgesi yazdırılır/PDF olur.
        Ekranda görünmez; yalnız @media print'te. */}
    {sonuc && (
      <div className="epikriz-kagit" style={{ display: 'none', background: 'white', color: '#111', fontFamily: 'Georgia, "Times New Roman", serif', maxWidth: 760, margin: '0 auto', padding: '36px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #111', paddingBottom: 14, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M8 19c1.6-5.8 3.4-9.6 7.2-14.2.8 3.4.8 6.4-.2 9.2-1.5 2.4-4 4-7 5z" stroke="#6a7563" strokeWidth="1.3"/></svg>
              <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: '#6d6055' }}>Notya</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 500 }}>Epikriz</div>
            <div style={{ fontSize: 11.5, color: '#8b7d70' }}>Türkiye Sağlık Bakanlığı standart formatı</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {sonuc.letterhead?.logoDataUrl && <img src={sonuc.letterhead.logoDataUrl} alt="" style={{ height: 40, marginBottom: 4 }} />}
            {sonuc.letterhead?.satirlar && sonuc.letterhead.satirlar.length > 0 ? (
              sonuc.letterhead.satirlar.map((satir, i) => (
                <div key={i} style={{ font: i === 0 ? '14px Georgia, serif' : '11.5px Georgia, serif', fontWeight: i === 0 ? 700 : 400, color: i === 0 ? '#111' : '#555' }}>{satir}</div>
              ))
            ) : null}
            {sonuc.letterhead?.diplomaNo && <div style={{ fontSize: 10.5, color: '#777', marginTop: 2 }}>Diploma No: {sonuc.letterhead.diplomaNo}</div>}
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#111', borderBottom: '1px solid #ccc', paddingBottom: 4, marginBottom: 8 }}>Hasta Bilgileri</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{sonuc.hastaBilgileri}</div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#111', borderBottom: '1px solid #ccc', paddingBottom: 4, marginBottom: 8 }}>Tanı ve Tedavi</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.7 }}><HafifMarkdown metin={sonuc.taniVeTedavi} karanlik={false} /></div>
        </div>

        <div style={{ marginBottom: 30 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#111', borderBottom: '1px solid #ccc', paddingBottom: 4, marginBottom: 8 }}>Taburcu Özeti</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.7 }}><HafifMarkdown metin={sonuc.taburcuOzeti} karanlik={false} /></div>
        </div>

        <div style={{ borderTop: '1px solid #333', paddingTop: 14, marginTop: 40 }}>
          <div style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-line', textAlign: 'right' }}>{sonuc.imza}</div>
        </div>

        <div style={{ fontSize: 10, color: '#999', marginTop: 30, borderTop: '1px solid #eee', paddingTop: 10 }}>
          Bu epikriz, Notya AI klinik asistanı tarafından oluşturulan bir taslaktır; hekimin muayene bulgularına ve onayına tabidir.
        </div>

        <style>{`
          @media print {
            .yazdirma-gizle { display: none !important; }
            .epikriz-kagit { display: block !important; }
            body { -webkit-print-color-adjust: exact; background: white !important; }
            @page { size: A4; margin: 16mm; }
          }
        `}</style>
      </div>
    )}
    </>
  );
}
