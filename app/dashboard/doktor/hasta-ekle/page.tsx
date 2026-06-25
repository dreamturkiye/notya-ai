'use client';

import React, { useState } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';

export const dynamic = 'force-dynamic';

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

const formatTC = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 11);
};

export default function HastaEklePage() {
  const [currentStep, setCurrentStep] = useState(1);
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
  const [mernisBanner, setMernisBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [highlightFields, setHighlightFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleTCChange = (value: string) => {
    const formatted = formatTC(value);
    setFormData(prev => ({ ...prev, tcKimlikNo: formatted }));
    
    if (formatted.length === 11) {
      const isValid = validateTC(formatted);
      setTcValid(isValid);
      setTcError(isValid ? '' : 'Geçersiz TC Kimlik Numarası');
    } else {
      setTcValid(false);
      setTcError('');
    }
    setMernisBanner(null);
  };

  const handleMernisLookup = async () => {
    if (!tcValid) return;

    setMernisLoading(true);
    setMernisBanner(null);

    try {
      const authData = localStorage.getItem('auth-token');
      const token = authData ? JSON.parse(authData).access_token : '';
      
      const response = await fetch('/api/doktor/mernis-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tc: formData.tcKimlikNo }),
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          adSoyad: data.adSoyad || prev.adSoyad,
          dogumTarihi: data.dogumTarihi || prev.dogumTarihi,
          cinsiyet: data.cinsiyet || prev.cinsiyet,
        }));
        setMernisBanner({ type: 'success', message: "MERNiS'ten bilgiler getirildi" });
        setHighlightFields(true);
        
        setTimeout(() => {
          setHighlightFields(false);
          setMernisBanner(null);
        }, 3000);
      } else {
        setMernisBanner({ type: 'error', message: 'MERNiS bilgisi alınamadı. Manuel doldurun.' });
      }
    } catch {
      setMernisBanner({ type: 'error', message: 'MERNiS bilgisi alınamadı. Manuel doldurun.' });
    } finally {
      setMernisLoading(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleKronikHastalik = (hastalik: string) => {
    const current = formData.kronikHastaliklar;
    const updated = current.includes(hastalik)
      ? current.filter(h => h !== hastalik)
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
      const authData = localStorage.getItem('auth-token');
      const token = authData ? JSON.parse(authData).access_token : '';

      const response = await fetch('/api/doktor/hastalar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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

  const nextStep = () => currentStep < 3 && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  const renderStepIndicator = () => {
    const steps = [1, 2, 3];
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 40 }}>
        {steps.map((step, index) => {
          const isActive = step === currentStep;
          const isDone = step < currentStep;
          return (
            <React.Fragment key={step}>
              <div style={{
                width: 28, height: 28, borderRadius: 14, border: '2px solid',
                borderColor: isActive || isDone ? '#14B8A6' : '#4B5563',
                backgroundColor: isActive ? '#14B8A6' : isDone ? '#14B8A6' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 14, fontWeight: 600
              }}>
                {isDone ? '✓' : step}
              </div>
              {index < 2 && (
                <div style={{ width: 48, height: 2, backgroundColor: isDone ? '#14B8A6' : '#4B5563' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const inputStyle = (isHighlighted = false): React.CSSProperties => ({
    width: '100%', height: 52, fontSize: 17, backgroundColor: 'rgba(255,255,255,0.06)',
    border: `1.5px solid ${isHighlighted ? '#14B8A6' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 14, color: '#fff', padding: '0 18px', outline: 'none'
  });

  const tcInputStyle = (): React.CSSProperties => ({
    ...inputStyle(),
    borderColor: tcError ? '#EF4444' : tcValid ? '#14B8A6' : 'rgba(255,255,255,0.1)'
  });

  return (
    <div style={{ backgroundColor: '#060C18', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <DoktorNav />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '28px 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Yeni Hasta Ekle</h1>
        
        {renderStepIndicator()}

        {currentStep === 1 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 24 }}>Kimlik Bilgileri</h2>
            
            <div style={{ marginBottom: 20 }}>
              <input
                type="text"
                placeholder="TC Kimlik Numarası"
                value={formData.tcKimlikNo}
                onChange={(e) => handleTCChange(e.target.value)}
                style={tcInputStyle()}
              />
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
                _ _ _ _ _ _ _ _ _ _ _
              </div>
              {tcError && <div style={{ color: '#EF4444', fontSize: 13, marginTop: 6 }}>{tcError}</div>}
            </div>

            {tcValid && (
              <button
                onClick={handleMernisLookup}
                disabled={mernisLoading}
                style={{
                  width: '100%', height: 40, border: '1.5px solid #14B8A6', color: '#14B8A6',
                  backgroundColor: 'transparent', borderRadius: 10, fontSize: 15, fontWeight: 500,
                  marginBottom: 24, cursor: mernisLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {mernisLoading ? '⏳ MERNiS sorgulanıyor...' : "MERNiS'ten Getir"}
              </button>
            )}

            {mernisBanner && (
              <div style={{
                padding: 14, borderRadius: 10, marginBottom: 20,
                backgroundColor: mernisBanner.type === 'success' ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
                color: mernisBanner.type === 'success' ? '#34D399' : '#FBBF24', fontSize: 14
              }}>
                {mernisBanner.message}
              </div>
            )}

            <input
              type="text"
              placeholder="Ad Soyad"
              value={formData.adSoyad}
              onChange={(e) => updateFormData('adSoyad', e.target.value)}
              style={inputStyle(highlightFields)}
            />
            <div style={{ height: 16 }} />
            
            <input
              type="date"
              value={formData.dogumTarihi}
              onChange={(e) => updateFormData('dogumTarihi', e.target.value)}
              style={inputStyle(highlightFields)}
            />
            <div style={{ height: 16 }} />

            <select
              value={formData.cinsiyet}
              onChange={(e) => updateFormData('cinsiyet', e.target.value)}
              style={{ ...inputStyle(highlightFields), color: formData.cinsiyet ? '#fff' : 'rgba(255,255,255,0.3)' }}
            >
              <option value="">Cinsiyet Seçin</option>
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
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 24 }}>Sağlık Geçmişi</h2>
            
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: '#fff', marginBottom: 10, fontSize: 15 }}>Kronik Hastalıklar</div>
              {['Diyabet', 'Hipertansiyon', 'Astım', 'Kalp Hastalığı'].map(h => (
                <button
                  key={h}
                  onClick={() => toggleKronikHastalik(h)}
                  style={{
                    padding: '8px 16px', margin: '4px 6px 4px 0', borderRadius: 20,
                    border: '1px solid #14B8A6',
                    backgroundColor: formData.kronikHastaliklar.includes(h) ? '#14B8A6' : 'rgba(255,255,255,0.06)',
                    color: '#fff', fontSize: 14
                  }}
                >
                  {h}
                </button>
              ))}
            </div>

            <input type="text" placeholder="Alerjiler" value={formData.alerjiler} onChange={(e) => updateFormData('alerjiler', e.target.value)} style={inputStyle()} />
            <div style={{ height: 16 }} />
            <input type="text" placeholder="Süregelen İlaçlar" value={formData.suregenIlaclar} onChange={(e) => updateFormData('suregenIlaclar', e.target.value)} style={inputStyle()} />
            <div style={{ height: 16 }} />
            <input type="text" placeholder="Sigara / Alkol Kullanımı" value={formData.sigaraAlkol} onChange={(e) => updateFormData('sigaraAlkol', e.target.value)} style={inputStyle()} />
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 24 }}>İletişim</h2>
            
            <input type="tel" placeholder="Telefon" value={formData.telefon} onChange={(e) => updateFormData('telefon', e.target.value)} style={inputStyle()} />
            <div style={{ height: 16 }} />
            <input type="text" placeholder="Şehir" value={formData.sehir} onChange={(e) => updateFormData('sehir', e.target.value)} style={inputStyle()} />
            <div style={{ height: 24 }} />

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fff', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={formData.kvkkOnay}
                onChange={(e) => updateFormData('kvkkOnay', e.target.checked)}
              />
              KVKK Aydınlatma Metni'ni okudum ve onaylıyorum
            </label>

            {submitError && <div style={{ color: '#EF4444', marginTop: 16, fontSize: 14 }}>{submitError}</div>}
            {submitSuccess && <div style={{ color: '#14B8A6', marginTop: 16, fontSize: 14 }}>Hasta başarıyla kaydedildi.</div>}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 40 }}>
          {currentStep > 1 && (
            <button onClick={prevStep} style={{ flex: 1, height: 48, border: '1.5px solid rgba(255,255,255,0.2)', color: '#fff', backgroundColor: 'transparent', borderRadius: 12, fontSize: 16 }}>
              Geri
            </button>
          )}
          {currentStep < 3 && (
            <button onClick={nextStep} style={{ flex: 1, height: 48, backgroundColor: '#14B8A6', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600 }}>
              İleri
            </button>
          )}
          {currentStep === 3 && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{ flex: 1, height: 48, backgroundColor: '#14B8A6', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600 }}
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Hastayı Kaydet'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
