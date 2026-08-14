'use client';

export const dynamic = 'force-dynamic';

import DoktorNav from '@/components/doktor/DoktorNav';
import { getDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ProvizyonResult {
  maskedName: string;
  aktif: boolean;
  tur: string;
  muafiyet: string;
  katilim: string;
}

export default function SGKMedulaPage() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [meta, setMeta] = useState<Record<string, unknown>>({});
  const [lastVerified, setLastVerified] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showProvizyonModal, setShowProvizyonModal] = useState(false);
  const [showBasvuruModal, setShowBasvuruModal] = useState(false);
  const [provizyonLoading, setProvizyonLoading] = useState(false);
  const [provizyonResult, setProvizyonResult] = useState<ProvizyonResult | null>(null);
  const [provizyonTc, setProvizyonTc] = useState('');

  const [formData, setFormData] = useState({
    tc: '',
    password: '',
    tesisKodu: '',
    sicilNo: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const bgColor = '#060C18';
  const cardBg = 'rgba(255,255,255,0.04)';
  const borderColor = 'rgba(255,255,255,0.08)';
  const teal = '#14B8A6';
  const amber = '#F59E0B';
  const green = '#10B981';
  const blue = '#3B82F6';
  const purple = '#8B5CF6';

  const loadVault = useCallback(async () => {
    const token = getDoctorAccessToken();
    if (!token) return;
    try {
      const res = await fetch('/api/doktor/integrations/medula', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const connected = Boolean((data as { connected?: boolean }).connected);
      setIsConnected(connected);
      setMeta(((data as { meta?: Record<string, unknown> }).meta) || {});
      setLastVerified((data as { lastVerified?: string | null }).lastVerified || null);
      // Clear legacy localStorage store once vault is the source of truth
      try {
        localStorage.removeItem('sgk_credentials');
      } catch {
        /* ignore */
      }
      if (!connected) setShowForm(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadVault();
  }, [loadVault]);

  const validateTcChecksum = (tc: string): boolean => {
    if (!/^\d{11}$/.test(tc)) return false;
    const digits = tc.split('').map(Number);
    const sumOdd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const sumEven = digits[1] + digits[3] + digits[5] + digits[7];
    const checksum1 = (sumOdd * 7 - sumEven) % 10;
    const checksum2 = (sumOdd + sumEven + digits[9]) % 10;
    return checksum1 === digits[9] && checksum2 === digits[10];
  };

  const handleConnect = async () => {
    setFormError('');
    if (!validateTcChecksum(formData.tc)) {
      setFormError('Geçerli bir TC Kimlik No giriniz (checksum doğrulaması başarısız).');
      return;
    }
    if (!formData.password) {
      setFormError('SGK Kurumsal Şifre zorunludur.');
      return;
    }

    const token = getDoctorAccessToken();
    if (!token) {
      setFormError('Oturum gerekli');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/doktor/integrations/medula', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hekimTc: formData.tc,
          sifre: formData.password,
          tesisKodu: formData.tesisKodu || undefined,
          sicilNo: formData.sicilNo || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(String((data as { error?: string }).error || 'Kaydedilemedi'));
        return;
      }
      localStorage.removeItem('sgk_credentials');
      setIsConnected(true);
      setMeta(((data as { meta?: Record<string, unknown> }).meta) || {});
      setLastVerified((data as { lastVerified?: string | null }).lastVerified || null);
      setShowForm(false);
      setFormData({ tc: '', password: '', tesisKodu: '', sicilNo: '' });
    } catch {
      setFormError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    const token = getDoctorAccessToken();
    if (!token) return;
    await fetch('/api/doktor/integrations/medula', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.removeItem('sgk_credentials');
    setIsConnected(false);
    setMeta({});
    setLastVerified(null);
    setShowForm(true);
  };

  const handleProvizyonSorgula = async () => {
    if (!validateTcChecksum(provizyonTc)) return;
    setProvizyonLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setProvizyonResult({
      maskedName: '***** ***',
      aktif: true,
      tur: 'Genel Sağlık Sigortası',
      muafiyet: 'Yok',
      katilim: '%20',
    });
    setProvizyonLoading(false);
  };

  const openProvizyonModal = () => {
    setShowProvizyonModal(true);
    setProvizyonResult(null);
    setProvizyonTc('');
  };

  const maskedTc = String(meta.hekimTcMasked || '');

  return (
    <div style={{ backgroundColor: bgColor, minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#fff' }}>
      <DoktorNav />
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', color: teal, textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '8px' }}>
            SGK ENTEGRASYONU
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, color: '#fff' }}>
            SGK Medula Bağlantısı
          </h1>
          <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '8px' }}>
            Kimlik bilgileri Entegrasyonlar kasasında şifreli saklanır.{' '}
            <a href="/dashboard/doktor/entegrasyonlar" style={{ color: teal }}>Tüm entegrasyonlar</a>
          </p>
        </div>

        <div style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: '16px', padding: '20px 24px', marginBottom: '32px' }}>
          {isConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: green, borderRadius: '50%' }} />
                <div>
                  <div style={{ color: green, fontWeight: 600 }}>Bağlı</div>
                  <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                    TC: {maskedTc || '••••'} • Son doğrulama:{' '}
                    {lastVerified ? new Date(lastVerified).toLocaleDateString('tr-TR') : '—'}
                  </div>
                </div>
              </div>
              <button onClick={() => void handleDisconnect()} style={{ backgroundColor: 'transparent', border: `1px solid ${borderColor}`, color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                Bağlantıyı Kes
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: amber, borderRadius: '50%' }} />
                <div>
                  <div style={{ color: amber, fontWeight: 600 }}>Bağlı değil</div>
                  <div style={{ fontSize: '13px', color: '#9CA3AF' }}>SGK kimlik bilgilerinizi girin</div>
                </div>
              </div>
              <button onClick={() => setShowForm(true)} style={{ backgroundColor: teal, color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Bağlan
              </button>
            </div>
          )}
        </div>

        {(!isConnected || showForm) && (
          <div style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>SGK Kurumsal Giriş Bilgileri</div>
            
            <div style={{ backgroundColor: 'rgba(20,184,166,0.1)', border: `1px solid ${teal}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px' }}>
              Şifreniz sunucuda şifreli saklanır; sorgular sizin yetkinizle yapılır. Kaydettikten sonra şifre tarayıcıya geri dönmez.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#9CA3AF', display: 'block', marginBottom: '6px' }}>TC Kimlik No</label>
                <input type="text" maxLength={11} value={formData.tc} onChange={(e) => setFormData({ ...formData, tc: e.target.value.replace(/\D/g, '') })} style={{ width: '100%', backgroundColor: '#0F172A', border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '15px' }} placeholder="12345678901" />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#9CA3AF', display: 'block', marginBottom: '6px' }}>SGK Kurumsal Şifre</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} style={{ width: '100%', backgroundColor: '#0F172A', border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '12px 44px 12px 12px', color: '#fff', fontSize: '15px' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                    {showPassword ? 'Gizle' : 'Göster'}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#9CA3AF', display: 'block', marginBottom: '6px' }}>Tesis Kodu (opsiyonel)</label>
                <input type="text" maxLength={10} value={formData.tesisKodu} onChange={(e) => setFormData({ ...formData, tesisKodu: e.target.value })} style={{ width: '100%', backgroundColor: '#0F172A', border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '15px' }} placeholder="örn. 1134001234" />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#9CA3AF', display: 'block', marginBottom: '6px' }}>Hekim Sicil No (opsiyonel)</label>
                <input type="text" value={formData.sicilNo} onChange={(e) => setFormData({ ...formData, sicilNo: e.target.value })} style={{ width: '100%', backgroundColor: '#0F172A', border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '15px' }} />
              </div>
            </div>

            {formError && <div style={{ color: '#EF4444', fontSize: '13px', marginTop: '12px' }}>{formError}</div>}

            <button onClick={() => void handleConnect()} disabled={loading} style={{ width: '100%', marginTop: '20px', backgroundColor: teal, color: '#000', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 600, fontSize: '15px', cursor: loading ? 'wait' : 'pointer' }}>
              {loading ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </div>
        )}

        {isConnected && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div style={{ backgroundColor: cardBg, border: `1px solid ${teal}`, borderRadius: '16px', padding: '20px' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>E-Reçete Gönder</div>
              <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '16px' }}>SGK Medula&apos;ya e-reçete ilet</div>
              <button onClick={() => router.push('/doktor-tools/erecete')} style={{ width: '100%', backgroundColor: teal, color: '#000', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>E-Reçete Oluştur</button>
            </div>

            <div style={{ backgroundColor: cardBg, border: `1px solid ${blue}`, borderRadius: '16px', padding: '20px' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Provizyon Sorgula</div>
              <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '16px' }}>Hasta sigorta haklarını sorgula</div>
              <button onClick={openProvizyonModal} style={{ width: '100%', backgroundColor: blue, color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Sorgula</button>
            </div>

            <div style={{ backgroundColor: cardBg, border: `1px solid ${purple}`, borderRadius: '16px', padding: '20px' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>SGK Uyum Kontrolü</div>
              <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '16px' }}>İlaç+tanı kombinasyonu kontrol</div>
              <button onClick={() => router.push('/doktor-tools/ilac-interaksiyon')} style={{ width: '100%', backgroundColor: purple, color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Kontrol Et</button>
            </div>

            <div style={{ backgroundColor: cardBg, border: `1px solid ${amber}`, borderRadius: '16px', padding: '20px' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Başvuru Durumu</div>
              <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '16px' }}>Bekleyen rapor ve başvurular</div>
              <button onClick={() => setShowBasvuruModal(true)} style={{ width: '100%', backgroundColor: amber, color: '#000', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Görüntüle</button>
            </div>
          </div>
        )}

        <div style={{ backgroundColor: cardBg, borderLeft: `4px solid ${amber}`, borderRadius: '8px', padding: '16px 20px', fontSize: '13px', color: '#9CA3AF' }}>
          SGK Medula entegrasyonu kurumsal başvuru gerektirir. Mevcut entegrasyon simüle modunda çalışır. Tam entegrasyon için <a href="https://saglik.gov.tr/medula" target="_blank" style={{ color: teal, textDecoration: 'underline' }}>saglik.gov.tr/medula</a> üzerinden başvuru yapınız.
        </div>
      </div>

      {showProvizyonModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ width: '440px', maxWidth: 'calc(100vw - 32px)', boxSizing: 'border-box', backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Provizyon Sorgulama</div>
            
            {!provizyonResult ? (
              <>
                <input type="text" maxLength={11} placeholder="TC Kimlik No" value={provizyonTc} onChange={(e) => setProvizyonTc(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', backgroundColor: '#0F172A', border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '12px', color: '#fff', marginBottom: '16px' }} />
                <button onClick={() => void handleProvizyonSorgula()} disabled={provizyonLoading || provizyonTc.length !== 11} style={{ width: '100%', backgroundColor: teal, color: '#000', padding: '12px', borderRadius: '10px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                  {provizyonLoading ? 'Sorgulanıyor...' : 'Sorgula'}
                </button>
              </>
            ) : (
              <div style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: `1px solid ${green}`, borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                <div>İsim: {provizyonResult.maskedName}</div>
                <div>Aktif sigorta: <span style={{ color: green }}>Evet</span></div>
                <div>SGK türü: {provizyonResult.tur}</div>
                <div>Muafiyet: {provizyonResult.muafiyet}</div>
                <div>Katılım payı: {provizyonResult.katilim}</div>
              </div>
            )}

            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '12px' }}>Gerçek provizyon sorgusu için doktorun SGK kurumsal sistemi üzerinden yapılır. Bu demo modudur.</div>
            
            <button onClick={() => { setShowProvizyonModal(false); setProvizyonResult(null); }} style={{ width: '100%', marginTop: '16px', backgroundColor: 'transparent', border: `1px solid ${borderColor}`, color: '#fff', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>Kapat</button>
          </div>
        </div>
      )}

      {showBasvuruModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ width: '440px', maxWidth: 'calc(100vw - 32px)', boxSizing: 'border-box', backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Bekleyen Başvurular</div>
            <div style={{ fontSize: '14px', color: '#9CA3AF' }}>Demo verisi: 2 rapor beklemede • 1 provizyon onayı</div>
            <button onClick={() => setShowBasvuruModal(false)} style={{ width: '100%', marginTop: '20px', backgroundColor: 'transparent', border: `1px solid ${borderColor}`, color: '#fff', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>Kapat</button>
          </div>
        </div>
      )}
    </div>
  );
}
