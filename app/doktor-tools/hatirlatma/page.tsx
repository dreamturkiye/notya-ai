'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';

interface Hasta {
  id: string;
  ad: string;
  soyad: string;
}

interface Hatirlatma {
  id: string;
  hastaAdi: string;
  mesaj: string;
  kanal: 'WhatsApp' | 'SMS';
  tarih: string;
  durum: 'gonderildi' | 'bekliyor' | 'hata';
}

const DoktorNav = () => (
  <nav style={{ padding: '16px 24px', borderBottom: '1px solid #1a2233', background: '#060C18', display: 'flex', alignItems: 'center', gap: 12 }}>
    <div style={{ color: '#fff', fontSize: 18, fontWeight: 600, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Doktor Paneli</div>
  </nav>
);

const tok = () => {
  try {
    return JSON.parse(localStorage.getItem('auth-token') || '{}').access_token || '';
  } catch {
    return '';
  }
};

const glassStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 18,
  padding: 24,
  backdropFilter: 'blur(20px)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: '12px 16px',
  color: '#fff',
  fontSize: 15,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  outline: 'none',
};

const Page: React.FC = () => {
  const [hastalar, setHastalar] = useState<Hasta[]>([]);
  const [hatirlatmalar, setHatirlatmalar] = useState<Hatirlatma[]>([]);
  const [selectedHasta, setSelectedHasta] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [tarihSaat, setTarihSaat] = useState('');
  const [kanal, setKanal] = useState<'WhatsApp' | 'SMS'>('WhatsApp');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const fetchHastalar = async () => {
    const token = tok();
    if (!token) return;
    const res = await fetch('/api/doktor/hastalar', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setHastalar(data);
  };

  const fetchHatirlatmalar = async () => {
    const token = tok();
    if (!token) return;
    const res = await fetch('/api/doktor/hatirlatma', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setHatirlatmalar(data);
  };

  useEffect(() => {
    fetchHastalar();
    fetchHatirlatmalar();
  }, []);

  const sablonlar: Record<string, string> = {
    'Takip Randevusu': 'Merhaba, takip randevunuz yaklaşıyor. Lütfen tarih ve saati onaylayın.',
    'Ilac Yenilemesi': 'İlaç reçeteniz yenilenmeye hazır. Eczaneden alabilirsiniz.',
    'Lab Sonucu Hazir': 'Laboratuvar sonuçlarınız hazır. Detaylar için uygulamayı kontrol edin.',
    'Kontrol Zamani': 'Kontrol zamanınız geldi. Randevu için iletişime geçin.',
  };

  const handleSablonClick = (key: string) => {
    setMesaj(sablonlar[key]);
  };

  const handleGonder = async () => {
    if (!selectedHasta || !mesaj || !tarihSaat) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess(false);

    const token = tok();
    try {
      const res = await fetch('/api/doktor/hatirlatma', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hastaId: selectedHasta,
          mesaj,
          kanal,
          tarih: tarihSaat,
        }),
      });
      if (!res.ok) throw new Error('Gönderim başarısız');
      setSuccess(true);
      setMesaj('');
      setTarihSaat('');
      setSelectedHasta('');
      fetchHatirlatmalar();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#060C18', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#fff' }}>
      <DoktorNav />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ color: '#14b8a6', fontSize: 12, letterSpacing: 2, fontWeight: 600 }}>HATIRLATMA</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '8px 0' }}>Hasta Hatırlatma</h1>
          <p style={{ color: '#94a3b8', fontSize: 15 }}>WhatsApp veya SMS ile hasta bildirimi gönderin</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* LEFT FORM */}
          <div style={{ ...glassStyle }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Yeni Hatırlatma</div>

            <div style={{ marginBottom: 16 }}>
              <select value={selectedHasta} onChange={(e) => setSelectedHasta(e.target.value)} style={inputStyle}>
                <option value="">Hasta seçin</option>
                {hastalar.map(h => (
                  <option key={h.id} value={h.id}>{h.ad} {h.soyad}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <textarea
                rows={4}
                value={mesaj}
                onChange={(e) => setMesaj(e.target.value)}
                placeholder="Mesajınızı yazın..."
                style={{ ...inputStyle, resize: 'none' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <input
                type="datetime-local"
                value={tarihSaat}
                onChange={(e) => setTarihSaat(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
              {(['WhatsApp', 'SMS'] as const).map(k => (
                <div
                  key={k}
                  onClick={() => setKanal(k)}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    textAlign: 'center',
                    borderRadius: 999,
                    cursor: 'pointer',
                    background: kanal === k ? (k === 'WhatsApp' ? '#166534' : '#1e40af') : 'rgba(255,255,255,0.06)',
                    color: kanal === k ? '#fff' : '#94a3b8',
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {k}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {Object.keys(sablonlar).map(key => (
                <div
                  key={key}
                  onClick={() => handleSablonClick(key)}
                  style={{
                    padding: '6px 14px',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 999,
                    fontSize: 13,
                    cursor: 'pointer',
                    color: '#94a3b8',
                  }}
                >
                  {key}
                </div>
              ))}
            </div>

            <button
              onClick={handleGonder}
              disabled={loading}
              style={{
                width: '100%',
                height: 52,
                background: '#14b8a6',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {loading ? (
                <>⟳ Gönderiliyor...</>
              ) : (
                'Hatırlatmayı Gönder'
              )}
            </button>

            {success && <div style={{ marginTop: 16, padding: 12, background: '#166534', borderRadius: 12, color: '#4ade80', fontSize: 14 }}>Başarıyla gönderildi</div>}
            {error && <div style={{ marginTop: 16, padding: 12, background: '#7f1d1d', borderRadius: 12, color: '#f87171', fontSize: 14 }}>{error}</div>}
          </div>

          {/* RIGHT HISTORY */}
          <div style={{ ...glassStyle }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Gönderilen Hatırlatmalar</div>

            {hatirlatmalar.length === 0 && (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>Henüz hatırlatma gönderilmedi</div>
            )}

            {hatirlatmalar.map(item => (
              <div key={item.id} style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ fontSize: 18 }}>{item.kanal === 'WhatsApp' ? '🟢' : '🔵'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{item.hastaAdi}</div>
                  <div style={{ color: '#94a3b8', fontSize: 14, margin: '2px 0' }}>{item.mesaj.slice(0, 60)}...</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{new Date(item.tarih).toLocaleString('tr-TR')}</div>
                </div>
                <div style={{
                  padding: '2px 10px',
                  borderRadius: 999,
                  fontSize: 12,
                  background: item.durum === 'gonderildi' ? '#166534' : item.durum === 'bekliyor' ? '#854d0e' : '#7f1d1d',
                  color: item.durum === 'gonderildi' ? '#4ade80' : item.durum === 'bekliyor' ? '#fbbf24' : '#f87171',
                }}>
                  {item.durum}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
