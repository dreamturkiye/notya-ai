'use client';

import React, { useState } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';
import IdCardCapture from '@/components/doktor/IdCardCapture';
import { getDoctorAccessToken } from '@/lib/doktor/clientAuth';

export const dynamic = 'force-dynamic';

type IdentitySource = 'nvi' | 'ocr' | 'manuel' | '';

type Phase =
  | 'chooser'
  | 'tc'
  | 'id_card'
  | 'manual'
  | 'review'
  | 'health'
  | 'kvkk';

interface FormData {
  tcKimlikNo: string;
  adSoyad: string;
  dogumTarihi: string;
  cinsiyet: string;
  kanGrubu: string;
  kronikHastaliklar: string[];
  alerjiler: string;
  suregenIlaclar: string;
  sigaraAlkol: string;
  telefon: string;
  sehir: string;
  kvkkOnay: boolean;
}

const validateTC = (tc: string): boolean => {
  if (!/^\d{11}$/.test(tc)) return false;
  const digits = tc.split('').map(Number);
  const sumOdd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sumEven = digits[1] + digits[3] + digits[5] + digits[7];
  const checksum1 = (sumOdd * 7 - sumEven) % 10;
  const checksum2 = (sumOdd + sumEven + digits[9]) % 10;
  return checksum1 === digits[9] && checksum2 === digits[10];
};

const formatTC = (value: string): string => value.replace(/\D/g, '').slice(0, 11);

const SOURCE_LABEL: Record<Exclude<IdentitySource, ''>, string> = {
  nvi: 'NVI',
  ocr: 'Kimlik OCR',
  manuel: 'Manuel',
};

export default function HastaEklePage() {
  const [phase, setPhase] = useState<Phase>('chooser');
  const [identitySource, setIdentitySource] = useState<IdentitySource>('');
  const [formData, setFormData] = useState<FormData>({
    tcKimlikNo: '',
    adSoyad: '',
    dogumTarihi: '',
    cinsiyet: '',
    kanGrubu: '',
    kronikHastaliklar: [],
    alerjiler: '',
    suregenIlaclar: '',
    sigaraAlkol: '',
    telefon: '',
    sehir: '',
    kvkkOnay: false,
  });
  const [tcError, setTcError] = useState('');
  const [tcValid, setTcValid] = useState(false);
  const [mernisLoading, setMernisLoading] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'warn' | 'error'; message: string } | null>(null);
  const [showNviSheet, setShowNviSheet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const updateFormData = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTCChange = (value: string) => {
    const formatted = formatTC(value);
    setFormData((prev) => ({ ...prev, tcKimlikNo: formatted }));
    if (formatted.length === 11) {
      const isValid = validateTC(formatted);
      setTcValid(isValid);
      setTcError(isValid ? '' : 'Bu TC Kimlik No geçerli değil — rakamları kontrol edin 🙂');
    } else if (formatted.length > 0) {
      setTcValid(false);
      setTcError(`${11 - formatted.length} hane daha`);
    } else {
      setTcValid(false);
      setTcError('');
    }
    setBanner(null);
  };

  const handleMernisLookup = async () => {
    if (!tcValid) return;
    setMernisLoading(true);
    setBanner(null);
    try {
      const token = getDoctorAccessToken();
      const response = await fetch('/api/doktor/mernis-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tc: formData.tcKimlikNo }),
      });
      const data = await response.json().catch(() => ({} as Record<string, unknown>));
      if (!response.ok) {
        setBanner({ type: 'error', message: String(data.error || 'TC doğrulanamadı') });
        return;
      }

      const adSoyad = String(data.adSoyad || '').trim();
      const dogumTarihi = String(data.dogumTarihi || '').trim();
      const cinsiyet = String(data.cinsiyet || '').trim();
      const populated = Boolean(data.populated && adSoyad);
      const nviConnected = Boolean(data.nviConnected);

      if (populated) {
        setFormData((prev) => ({
          ...prev,
          adSoyad: adSoyad || prev.adSoyad,
          dogumTarihi: dogumTarihi || prev.dogumTarihi,
          cinsiyet: cinsiyet || prev.cinsiyet,
        }));
        setIdentitySource('nvi');
        setBanner({ type: 'success', message: String(data.message || "NVI'dan bilgiler getirildi") });
        setPhase('review');
        return;
      }

      if (!nviConnected) {
        setShowNviSheet(true);
        setBanner({
          type: 'warn',
          message: String(data.message || 'TC doğrulandı. NVI bağlayın veya manuel devam edin.'),
        });
      } else {
        setBanner({
          type: 'warn',
          message: String(data.message || 'NVI yanıt vermedi. Manuel veya kimlik fotoğrafı kullanın.'),
        });
      }
    } catch {
      setBanner({ type: 'error', message: 'TC sorgusu başarısız' });
    } finally {
      setMernisLoading(false);
    }
  };

  const fillFromMyProfile = async () => {
    try {
      const token = getDoctorAccessToken();
      if (!token) {
        setBanner({ type: 'error', message: 'Oturum bulunamadı.' });
        return;
      }
      const resp = await fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await resp.json().catch(() => ({}));
      const profile = (body as { data?: Record<string, unknown> }).data || body;
      const fullName = String(
        (profile as { full_name?: string }).full_name ||
          [(profile as { firstName?: string }).firstName, (profile as { lastName?: string }).lastName]
            .filter(Boolean)
            .join(' ')
      ).trim();
      const genderRaw = String((profile as { gender?: string }).gender || '').toLowerCase();
      const cinsiyet =
        genderRaw === 'male' || genderRaw === 'erkek'
          ? 'Erkek'
          : genderRaw === 'female' || genderRaw === 'kadın' || genderRaw === 'kadin'
            ? 'Kadın'
            : '';

      if (!fullName) {
        setBanner({ type: 'error', message: 'Profilinizde ad soyad yok.' });
        return;
      }
      setFormData((prev) => ({
        ...prev,
        adSoyad: fullName,
        cinsiyet: cinsiyet || prev.cinsiyet,
      }));
      setIdentitySource('manuel');
      setBanner({ type: 'success', message: 'Profilinizden dolduruldu — kontrol edin.' });
      setPhase('review');
    } catch {
      setBanner({ type: 'error', message: 'Profil bilgisi alınamadı.' });
    }
  };

  const goReviewFromManual = () => {
    if (formData.tcKimlikNo.length === 11 && !validateTC(formData.tcKimlikNo)) {
      setTcError('Geçersiz TC');
      return;
    }
    if (!formData.adSoyad.trim()) {
      setBanner({ type: 'error', message: 'Ad Soyad zorunlu' });
      return;
    }
    setIdentitySource((s) => s || 'manuel');
    setPhase('review');
  };

  const toggleKronikHastalik = (hastalik: string) => {
    const current = formData.kronikHastaliklar;
    const updated = current.includes(hastalik)
      ? current.filter((h) => h !== hastalik)
      : [...current, hastalik];
    updateFormData('kronikHastaliklar', updated);
  };

  const handleSubmit = async () => {
    if (!formData.kvkkOnay) {
      setSubmitError('KVKK onayını işaretlemelisiniz');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const token = getDoctorAccessToken();
      const response = await fetch('/api/doktor/hastalar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          window.location.href = '/dashboard/doktor/hastalar';
        }, 1500);
      } else {
        setSubmitError('Hasta kaydı oluşturulamadı');
      }
    } catch {
      setSubmitError('Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = (highlight = false): React.CSSProperties => ({
    width: '100%',
    height: 52,
    fontSize: 17,
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: `1.5px solid ${highlight ? '#14B8A6' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 14,
    color: '#fff',
    padding: '0 18px',
    outline: 'none',
    boxSizing: 'border-box',
  });

  const tileStyle: React.CSSProperties = {
    textAlign: 'left',
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: '20px 18px',
    color: '#fff',
    cursor: 'pointer',
  };

  const stepLabel =
    phase === 'health' ? 'Sağlık' : phase === 'kvkk' ? 'KVKK' : phase === 'review' ? 'Onay' : 'Kimlik';

  return (
    <div style={{ backgroundColor: '#060C18', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <DoktorNav />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '28px 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Yeni Hasta</h1>
        {phase !== 'chooser' && (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>{stepLabel}</div>
        )}

        {phase === 'chooser' && (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, marginBottom: 24, lineHeight: 1.5 }}>
              Hastayı nasıl eklemek istersiniz?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                type="button"
                style={tileStyle}
                onClick={() => {
                  setIdentitySource('');
                  setPhase('tc');
                }}
              >
                <div style={{ fontSize: 17, fontWeight: 650 }}>TC ile getir</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
                  NVI bağlıysa ad soyad otomatik dolar
                </div>
              </button>
              <button
                type="button"
                style={tileStyle}
                onClick={() => {
                  setIdentitySource('ocr');
                  setPhase('id_card');
                }}
              >
                <div style={{ fontSize: 17, fontWeight: 650 }}>Kimlik kartı</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
                  Fotoğraf veya galeri — eski / yeni kimlik
                </div>
              </button>
              <button
                type="button"
                style={tileStyle}
                onClick={() => {
                  setIdentitySource('manuel');
                  setPhase('manual');
                }}
              >
                <div style={{ fontSize: 17, fontWeight: 650 }}>Manuel</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
                  Karttaki alanları yazın
                </div>
              </button>
            </div>
          </div>
        )}

        {phase === 'tc' && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 16 }}>TC ile getir</h2>
            <input
              type="text"
              inputMode="numeric"
              placeholder="TC Kimlik Numarası"
              value={formData.tcKimlikNo}
              onChange={(e) => handleTCChange(e.target.value)}
              style={{
                ...inputStyle(),
                borderColor: tcError ? '#EF4444' : tcValid ? '#14B8A6' : 'rgba(255,255,255,0.1)',
              }}
            />
            {tcError && <div style={{ color: '#EF4444', fontSize: 13, marginTop: 8 }}>{tcError}</div>}

            <button
              type="button"
              disabled={!tcValid || mernisLoading}
              onClick={() => void handleMernisLookup()}
              style={{
                width: '100%',
                height: 48,
                marginTop: 20,
                border: 'none',
                borderRadius: 12,
                background: tcValid ? '#14B8A6' : 'rgba(255,255,255,0.1)',
                color: tcValid ? '#041016' : 'rgba(255,255,255,0.4)',
                fontWeight: 650,
                fontSize: 16,
                cursor: tcValid && !mernisLoading ? 'pointer' : 'not-allowed',
              }}
            >
              {mernisLoading ? 'Getiriliyor…' : 'Getir'}
            </button>

            <button
              type="button"
              onClick={() => void fillFromMyProfile()}
              style={{
                width: '100%',
                marginTop: 12,
                height: 40,
                border: 'none',
                background: 'transparent',
                color: 'rgba(255,255,255,0.45)',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Profilimden doldur
            </button>

            {banner && (
              <div
                style={{
                  marginTop: 16,
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor:
                    banner.type === 'success'
                      ? 'rgba(52,211,153,0.1)'
                      : banner.type === 'warn'
                        ? 'rgba(251,191,36,0.1)'
                        : 'rgba(248,113,113,0.1)',
                  color:
                    banner.type === 'success' ? '#34D399' : banner.type === 'warn' ? '#FBBF24' : '#F87171',
                  fontSize: 14,
                }}
              >
                {banner.message}
              </div>
            )}

            <button
              type="button"
              onClick={() => setPhase('chooser')}
              style={{
                width: '100%',
                marginTop: 16,
                height: 40,
                border: 'none',
                background: 'transparent',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
              }}
            >
              Geri
            </button>
          </div>
        )}

        {phase === 'id_card' && (
          <IdCardCapture
            getToken={getDoctorAccessToken}
            onCancel={() => setPhase('chooser')}
            onParsed={(fields) => {
              setFormData((prev) => ({
                ...prev,
                tcKimlikNo: fields.tcKimlikNo || prev.tcKimlikNo,
                adSoyad: fields.adSoyad || prev.adSoyad,
                dogumTarihi: fields.dogumTarihi || prev.dogumTarihi,
                cinsiyet: fields.cinsiyet || prev.cinsiyet,
              }));
              if (fields.tcKimlikNo) {
                setTcValid(validateTC(fields.tcKimlikNo));
              }
              setIdentitySource('ocr');
              setPhase('review');
            }}
          />
        )}

        {phase === 'manual' && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 20 }}>Manuel giriş</h2>
            <input
              type="text"
              placeholder="TC Kimlik Numarası"
              value={formData.tcKimlikNo}
              onChange={(e) => handleTCChange(e.target.value)}
              style={{
                ...inputStyle(),
                borderColor: tcError ? '#EF4444' : tcValid ? '#14B8A6' : 'rgba(255,255,255,0.1)',
              }}
            />
            {tcError && <div style={{ color: '#EF4444', fontSize: 13, marginTop: 6 }}>{tcError}</div>}
            <div style={{ height: 16 }} />
            <input
              type="text"
              placeholder="Ad Soyad"
              value={formData.adSoyad}
              onChange={(e) => updateFormData('adSoyad', e.target.value)}
              style={inputStyle()}
            />
            <div style={{ height: 16 }} />
            <input
              type="date"
              value={formData.dogumTarihi}
              onChange={(e) => updateFormData('dogumTarihi', e.target.value)}
              style={inputStyle()}
            />
            <div style={{ height: 16 }} />
            <select
              value={formData.cinsiyet}
              onChange={(e) => updateFormData('cinsiyet', e.target.value)}
              style={{ ...inputStyle(), color: formData.cinsiyet ? '#fff' : 'rgba(255,255,255,0.3)' }}
            >
              <option value="">Cinsiyet</option>
              <option value="Erkek">Erkek</option>
              <option value="Kadın">Kadın</option>
            </select>
            <div style={{ height: 16 }} />
            <input
              type="text"
              placeholder="Kan Grubu"
              value={formData.kanGrubu}
              onChange={(e) => updateFormData('kanGrubu', e.target.value)}
              style={inputStyle()}
            />
            {banner && (
              <div style={{ marginTop: 12, color: '#F87171', fontSize: 14 }}>{banner.message}</div>
            )}
            <button
              type="button"
              onClick={goReviewFromManual}
              style={{
                width: '100%',
                height: 48,
                marginTop: 24,
                border: 'none',
                borderRadius: 12,
                background: '#14B8A6',
                color: '#041016',
                fontWeight: 650,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              İncele
            </button>
            <button
              type="button"
              onClick={() => setPhase('chooser')}
              style={{
                width: '100%',
                marginTop: 10,
                height: 40,
                border: 'none',
                background: 'transparent',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
              }}
            >
              Geri
            </button>
          </div>
        )}

        {phase === 'review' && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Kontrol et</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 20 }}>
              Kaydetmeden önce bilgileri doğrulayın
            </p>

            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: 18,
                marginBottom: 16,
              }}
            >
              {identitySource && (
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#14B8A6',
                    background: 'rgba(20,184,166,0.12)',
                    padding: '4px 10px',
                    borderRadius: 8,
                    marginBottom: 14,
                  }}
                >
                  {SOURCE_LABEL[identitySource]}
                </span>
              )}
              <input
                type="text"
                placeholder="Ad Soyad"
                value={formData.adSoyad}
                onChange={(e) => updateFormData('adSoyad', e.target.value)}
                style={inputStyle()}
              />
              <div style={{ height: 12 }} />
              <input
                type="text"
                placeholder="TC"
                value={formData.tcKimlikNo}
                onChange={(e) => handleTCChange(e.target.value)}
                style={inputStyle()}
              />
              <div style={{ height: 12 }} />
              <input
                type="date"
                value={formData.dogumTarihi}
                onChange={(e) => updateFormData('dogumTarihi', e.target.value)}
                style={inputStyle()}
              />
              <div style={{ height: 12 }} />
              <select
                value={formData.cinsiyet}
                onChange={(e) => updateFormData('cinsiyet', e.target.value)}
                style={{ ...inputStyle(), color: formData.cinsiyet ? '#fff' : 'rgba(255,255,255,0.3)' }}
              >
                <option value="">Cinsiyet</option>
                <option value="Erkek">Erkek</option>
                <option value="Kadın">Kadın</option>
              </select>
              <div style={{ height: 12 }} />
              <input
                type="text"
                placeholder="Kan Grubu (opsiyonel)"
                value={formData.kanGrubu}
                onChange={(e) => updateFormData('kanGrubu', e.target.value)}
                style={inputStyle()}
              />
            </div>

            <button
              type="button"
              disabled={!formData.adSoyad.trim()}
              onClick={() => setPhase('health')}
              style={{
                width: '100%',
                height: 48,
                border: 'none',
                borderRadius: 12,
                background: formData.adSoyad.trim() ? '#14B8A6' : 'rgba(255,255,255,0.1)',
                color: formData.adSoyad.trim() ? '#041016' : 'rgba(255,255,255,0.4)',
                fontWeight: 650,
                fontSize: 16,
                cursor: formData.adSoyad.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Hasta kaydını oluştur
            </button>
            <button
              type="button"
              onClick={() => setPhase('chooser')}
              style={{
                width: '100%',
                marginTop: 10,
                height: 40,
                border: 'none',
                background: 'transparent',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
              }}
            >
              Baştan seç
            </button>
          </div>
        )}

        {phase === 'health' && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 24 }}>Sağlık Geçmişi</h2>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: '#fff', marginBottom: 10, fontSize: 15 }}>Kronik Hastalıklar</div>
              {['Diyabet', 'Hipertansiyon', 'Astım', 'Kalp Hastalığı'].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => toggleKronikHastalik(h)}
                  style={{
                    padding: '8px 16px',
                    margin: '4px 6px 4px 0',
                    borderRadius: 20,
                    border: '1px solid #14B8A6',
                    backgroundColor: formData.kronikHastaliklar.includes(h)
                      ? '#14B8A6'
                      : 'rgba(255,255,255,0.06)',
                    color: '#fff',
                    fontSize: 14,
                  }}
                >
                  {h}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Alerjiler"
              value={formData.alerjiler}
              onChange={(e) => updateFormData('alerjiler', e.target.value)}
              style={inputStyle()}
            />
            <div style={{ height: 16 }} />
            <input
              type="text"
              placeholder="Süregelen İlaçlar"
              value={formData.suregenIlaclar}
              onChange={(e) => updateFormData('suregenIlaclar', e.target.value)}
              style={inputStyle()}
            />
            <div style={{ height: 16 }} />
            <input
              type="text"
              placeholder="Sigara / Alkol Kullanımı"
              value={formData.sigaraAlkol}
              onChange={(e) => updateFormData('sigaraAlkol', e.target.value)}
              style={inputStyle()}
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button
                type="button"
                onClick={() => setPhase('review')}
                style={{
                  flex: 1,
                  height: 48,
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  backgroundColor: 'transparent',
                  borderRadius: 12,
                  fontSize: 16,
                }}
              >
                Geri
              </button>
              <button
                type="button"
                onClick={() => setPhase('kvkk')}
                style={{
                  flex: 1,
                  height: 48,
                  backgroundColor: '#14B8A6',
                  color: '#041016',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                İleri
              </button>
            </div>
          </div>
        )}

        {phase === 'kvkk' && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 24 }}>İletişim & KVKK</h2>
            <input
              type="tel"
              placeholder="Telefon"
              value={formData.telefon}
              onChange={(e) => updateFormData('telefon', e.target.value)}
              style={inputStyle()}
            />
            <div style={{ height: 16 }} />
            <input
              type="text"
              placeholder="Şehir"
              value={formData.sehir}
              onChange={(e) => updateFormData('sehir', e.target.value)}
              style={inputStyle()}
            />
            <div style={{ height: 24 }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fff', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={formData.kvkkOnay}
                onChange={(e) => updateFormData('kvkkOnay', e.target.checked)}
              />
              KVKK Aydınlatma Metni&apos;ni okudum ve onaylıyorum
            </label>
            {submitError && <div style={{ color: '#EF4444', marginTop: 16, fontSize: 14 }}>{submitError}</div>}
            {submitSuccess && (
              <div style={{ color: '#14B8A6', marginTop: 16, fontSize: 14 }}>Hasta başarıyla kaydedildi.</div>
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button
                type="button"
                onClick={() => setPhase('health')}
                style={{
                  flex: 1,
                  height: 48,
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  backgroundColor: 'transparent',
                  borderRadius: 12,
                  fontSize: 16,
                }}
              >
                Geri
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  height: 48,
                  backgroundColor: '#14B8A6',
                  color: '#041016',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {isSubmitting ? 'Kaydediliyor...' : 'Hastayı Kaydet'}
              </button>
            </div>
          </div>
        )}
      </div>

      {showNviSheet && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setShowNviSheet(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 520,
              background: '#0B1220',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '24px 20px calc(24px + env(safe-area-inset-bottom))',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 650, color: '#fff', marginBottom: 8 }}>
              NVI bağlı değil
            </div>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
              TC doğrulandı. Ad soyad için NVI hesabınızı bağlayın veya manuel devam edin.
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/dashboard/doktor/entegrasyonlar';
              }}
              style={{
                width: '100%',
                height: 48,
                border: 'none',
                borderRadius: 12,
                background: '#14B8A6',
                color: '#041016',
                fontWeight: 650,
                marginBottom: 10,
                cursor: 'pointer',
              }}
            >
              NVI bağla
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNviSheet(false);
                setIdentitySource('manuel');
                setPhase('manual');
              }}
              style={{
                width: '100%',
                height: 44,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Manuel devam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
