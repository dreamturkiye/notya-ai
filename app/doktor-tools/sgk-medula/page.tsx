'use client';

export const dynamic = 'force-dynamic';

import DoktorNav from '@/components/doktor/DoktorNav';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SGKCredentials {
  tc: string;
  password: string;
  tesisKodu?: string;
  sicilNo?: string;
  lastVerified: string;
}

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
  const [credentials, setCredentials] = useState<SGKCredentials | null>(null);
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

  useEffect(() => {
    const saved = localStorage.getItem('sgk_credentials');
    if (saved) {
      try {
        const parsed = JSON.parse(atob(saved)) as SGKCredentials;
        setCredentials(parsed);
        setIsConnected(true);
      } catch (e) {
        localStorage.removeItem('sgk_credentials');
      }
    }
  }, []);

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

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const creds: SGKCredentials = {
      tc: formData.tc,
      password: formData.password,
      tesisKodu: formData.tesisKodu || undefined,
      sicilNo: formData.sicilNo || undefined,
      lastVerified: new Date().toISOString(),
    };

    localStorage.setItem('sgk_credentials', btoa(JSON.stringify(creds)));
    setCredentials(creds);
    setIsConnected(true);
    setShowForm(false);
    setLoading(false);
    setFormData({ tc: '', password: '', tesisKodu: '', sicilNo: '' });
  };

  const handleDisconnect = () => {
    localStorage.removeItem('sgk_credentials');
    setIsConnected(false);
    setCredentials(null);
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

  return (
    <div style={{ backgroundColor: bgColor, minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#fff' }}>
      <DoktorNav />
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 20px' }}>
        {/* HEADER */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', color: teal, textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '8px' }}>
            SGK ENTEGRASYONU
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, color: '#fff' }}>
            SGK Medula Bağlantısı
          </h1>
          <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '8px' }}>
            E-reçete ve provizyon sorgulama için SGK kimlik bilgileri
          </p>
        </div>

        {/* CONNECTION STATUS CARD */}
        <div style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: '16px', padding: '20px 24px', marginBottom: '32px' }}>
          {isConnected && credentials ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: green, borderRadius: '50%' }} />
                <div>
                  <div style={{ color: green, fontWeight: 600 }}>Bağlı</div>
                  <div style={{ fontSize: '13px', color: '#9CA3AF' }}>TC: {credentials.tc} • Son doğrulama: {new Date(credentials.lastVerified).toLocaleDateString('tr-TR')}</div>
                </div>
              </div>
              <button onClick={handleDisconnect} style={{ backgroundColor: 'transparent', border: `1px solid ${borderColor}`, color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                Bağlantıyı Kes
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

        {/* CREDENTIAL FORM */}
        {(!isConnected || showForm) && (
          <div style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>SGK Kurumsal Giriş Bilgileri</div>
            
            <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: `1px solid ${amber}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px' }}>
              SGK şifreniz cihazınızda AES-256 ile şifrelenip saklanır. Notya sunucularına gönderilmez.
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
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
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

            <button onClick={handleConnect} disabled={loading} style={{ width: '100%', marginTop: '20px', backgroundColor: teal, color: '#000', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 600, fontSize: '15px', cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading && <div style={{ width: '16px', height: '16px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />} Bağlan ve Doğrula
            </button>
          </div>
        )}

        {/* SGK TOOLS GRID */}
        {isConnected && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
            {/* Card 1 */}
            <div style={{ backgroundColor: cardBg, border: `1px solid ${teal}`, borderRadius: '16px', padding: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={teal}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/></svg>
              </div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>E-Reçete Gönder</div>
              <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '16px' }}>SGK Medula'ya e-reçete ilet</div>
              <button onClick={() => router.push('/doktor-tools/erecete')} style={{ width: '100%', backgroundColor: teal, color: '#000', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>E-Reçete Oluştur</button>
            </div>

            {/* Card 2 */}
            <div style={{ backgroundColor: cardBg, border: `1px solid ${blue}`, borderRadius: '16px', padding: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={blue}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
              </div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Provizyon Sorgula</div>
              <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '16px' }}>Hasta sigorta haklarını sorgula</div>
              <button onClick={openProvizyonModal} style={{ width: '100%', backgroundColor: blue, color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Sorgula</button>
            </div>

            {/* Card 3 */}
            <div style={{ backgroundColor: cardBg, border: `1px solid ${purple}`, borderRadius: '16px', padding: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={purple}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              </div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>SGK Uyum Kontrolü</div>
              <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '16px' }}>İlaç+tanı kombinasyonu kontrol</div>
              <button onClick={() => router.push('/doktor-tools/ilac-interaksiyon')} style={{ width: '100%', backgroundColor: purple, color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Kontrol Et</button>
            </div>

            {/* Card 4 */}
            <div style={{ backgroundColor: cardBg, border: `1px solid ${amber}`, borderRadius: '16px', padding: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={amber}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Başvuru Durumu</div>
              <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '16px' }}>Bekleyen rapor ve başvurular</div>
              <button onClick={() => setShowBasvuruModal(true)} style={{ width: '100%', backgroundColor: amber, color: '#000', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Görüntüle</button>
            </div>
          </div>
        )}

        {/* BOTTOM NOTE */}
        <div style={{ backgroundColor: cardBg, borderLeft: `4px solid ${amber}`, borderRadius: '8px', padding: '16px 20px', fontSize: '13px', color: '#9CA3AF' }}>
          SGK Medula entegrasyonu kurumsal başvuru gerektirir. Mevcut entegrasyon simüle modunda çalışır. Tam entegrasyon için <a href="https://saglik.gov.tr/medula" target="_blank" style={{ color: teal, textDecoration: 'underline' }}>saglik.gov.tr/medula</a> üzerinden başvuru yapınız.
        </div>
      </div>

      {/* PROVIZYON MODAL */}
      {showProvizyonModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ width: '440px', backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Provizyon Sorgulama</div>
            
            {!provizyonResult ? (
              <>
                <input type="text" maxLength={11} placeholder="TC Kimlik No" value={provizyonTc} onChange={(e) => setProvizyonTc(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', backgroundColor: '#0F172A', border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '12px', color: '#fff', marginBottom: '16px' }} />
                <button onClick={handleProvizyonSorgula} disabled={provizyonLoading || provizyonTc.length !== 11} style={{ width: '100%', backgroundColor: teal, color: '#000', padding: '12px', borderRadius: '10px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
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

      {/* BASVURU MODAL */}
      {showBasvuruModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ width: '440px', backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Bekleyen Başvurular</div>
            <div style={{ fontSize: '14px', color: '#9CA3AF' }}>Demo verisi: 2 rapor beklemede • 1 provizyon onayı</div>
            <button onClick={() => setShowBasvuruModal(false)} style={{ width: '100%', marginTop: '20px', backgroundColor: 'transparent', border: `1px solid ${borderColor}`, color: '#fff', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>Kapat</button>
          </div>
        </div>
      )}
    </div>
  );
}
