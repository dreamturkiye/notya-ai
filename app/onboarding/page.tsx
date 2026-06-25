'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Profession {
  id: string;
  label: string;
  emoji: string;
  desc: string;
}

const professions: Profession[] = [
  { id: 'doktor', label: 'Doktor/Hekim', emoji: '🏥', desc: 'Tıbbi uzmanlık alanınız' },
  { id: 'mali', label: 'Mali Müşavir/SMMM', emoji: '💰', desc: 'Finansal danışmanlık' },
  { id: 'avukat', label: 'Avukat', emoji: '⚖️', desc: 'Hukuki danışmanlık' },
  { id: 'psikolog', label: 'Psikolog/Terapist', emoji: '🧠', desc: 'Ruh sağlığı uzmanlığı' },
];

const unvanOptions = ['Dr.', 'Uzm.Dr.', 'Doç.Dr.', 'Prof.Dr.'];

const doctorSpecialties = [
  'Kardiyoloji', 'Pediatri', 'Nöroloji', 'Dahiliye', 'Psikiyatri',
  'Genel Pratisyen', 'Ortopedi', 'Radyoloji', 'Anestezi', 'Dermatoloji',
  'Göğüs Hastalıkları', 'Onkoloji', 'Üroloji', 'Göz Hastalıkları', 'Kulak Burun Boğaz', 'Diğer'
];

const maliChips = ['Vergi Danışmanlığı', 'Bağımsız Denetim', 'Muhasebe', 'Mali Hukuk', 'KDV İadesi', 'Transfer Fiyatlandırması'];
const avukatUzmanlik = ['Ceza Hukuku', 'Ticaret Hukuku', 'Aile Hukuku', 'İdare Hukuku', 'İş Hukuku', 'Gayrimenkul Hukuku', 'Fikri Mülkiyet'];

const agentMapping: Record<string, string> = {
  'Kardiyoloji': 'kardiyoloji',
  'Pediatri': 'pediatri',
  'Nöroloji': 'noroloji',
  'Dahiliye': 'dahiliye',
  'Psikiyatri': 'psikiyatri',
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedProfession, setSelectedProfession] = useState<string>('');
  
  // Doctor fields
  const [unvan, setUnvan] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [hospital, setHospital] = useState('');
  
  // Mali fields
  const [selectedMaliChips, setSelectedMaliChips] = useState<string[]>([]);
  
  // Avukat fields
  const [baro, setBaro] = useState('');
  const [avukatUzmanlikSec, setAvukatUzmanlikSec] = useState('');
  
  // Step 3 fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [addressingPreference, setAddressingPreference] = useState('');

  const isStep1Complete = !!selectedProfession;
  
  const canProceedToStep3 = () => {
    if (selectedProfession === 'doktor') {
      return !!unvan && !!specialty;
    }
    if (selectedProfession === 'mali') {
      return selectedMaliChips.length > 0;
    }
    if (selectedProfession === 'avukat') {
      return !!baro && !!avukatUzmanlikSec;
    }
    return true; // psikolog
  };

  const canSubmit = firstName && lastName && gender && addressingPreference;

  const toggleMaliChip = (chip: string) => {
    setSelectedMaliChips(prev =>
      prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
    );
  };

  const handleNext = () => {
    if (step === 1 && isStep1Complete) {
      setStep(2);
    } else if (step === 2 && canProceedToStep3()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const getRedirectPath = (profession: string) => {
    if (profession === 'doktor') return '/dashboard/doktor';
    if (profession === 'mali') return '/dashboard/mali';
    if (profession === 'avukat') return '/dashboard/avukat';
    return '/dashboard';
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const tokenStr = localStorage.getItem('auth-token');
    if (!tokenStr) {
      alert('Oturum bulunamadı');
      return;
    }

    let access_token = '';
    try {
      const parsed = JSON.parse(tokenStr);
      access_token = parsed.access_token;
    } catch {
      alert('Token formatı hatalı');
      return;
    }

    const profession_type = selectedProfession;
    let finalSpecialty = specialty;
    
    if (profession_type === 'mali') {
      finalSpecialty = selectedMaliChips.join(', ');
    } else if (profession_type === 'avukat') {
      finalSpecialty = avukatUzmanlikSec;
    } else if (profession_type === 'psikolog') {
      finalSpecialty = 'Psikoloji';
    }

    const agent = agentMapping[specialty] || 'default';

    const profilePayload = {
      profession_type,
      specialty: finalSpecialty,
      title: unvan || '',
      hospital: hospital || '',
      firstName,
      lastName,
      gender,
      addressingPreference,
      trial_start: new Date().toISOString(),
      plan: 'professional',
      metadata: { agent },
    };

    try {
      // POST profile
      await fetch('/api/users/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify(profilePayload),
      });

      // Set asistan specialty
      await fetch('/api/asistan/set-specialty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({ specialty: finalSpecialty }),
      });

      // Activate trial
      await fetch('/api/users/trial', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      const redirectPath = getRedirectPath(profession_type);
      router.push(redirectPath);
    } catch (error) {
      console.error(error);
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const renderStep2 = () => {
    if (selectedProfession === 'doktor') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Unvan</label>
            <select
              value={unvan}
              onChange={(e) => setUnvan(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0D1425', color: '#fff', border: '1px solid #374151', borderRadius: '8px', padding: '12px', fontSize: '15px' }}
            >
              <option value="">Seçiniz</option>
              {unvanOptions.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div>
            <label style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Uzmanlık Alanı</label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0D1425', color: '#fff', border: '1px solid #374151', borderRadius: '8px', padding: '12px', fontSize: '15px' }}
            >
              <option value="">Seçiniz</option>
              {doctorSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Klinik / Hastane Adı</label>
            <input
              type="text"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              placeholder="Klinik veya hastane adını girin"
              style={{ width: '100%', backgroundColor: '#0D1425', color: '#fff', border: '1px solid #374151', borderRadius: '8px', padding: '12px', fontSize: '15px' }}
            />
          </div>
        </div>
      );
    }

    if (selectedProfession === 'mali') {
      return (
        <div>
          <label style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '12px', display: 'block' }}>Uzmanlık Alanlarınız</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {maliChips.map(chip => (
              <div
                key={chip}
                onClick={() => toggleMaliChip(chip)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '9999px',
                  backgroundColor: selectedMaliChips.includes(chip) ? '#134E4B' : '#0D1425',
                  border: selectedMaliChips.includes(chip) ? '1px solid #14B8A6' : '1px solid #374151',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {chip}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (selectedProfession === 'avukat') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Baro</label>
            <input
              type="text"
              value={baro}
              onChange={(e) => setBaro(e.target.value)}
              placeholder="Baro adını girin"
              style={{ width: '100%', backgroundColor: '#0D1425', color: '#fff', border: '1px solid #374151', borderRadius: '8px', padding: '12px', fontSize: '15px' }}
            />
          </div>
          <div>
            <label style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Uzmanlık Alanı</label>
            <select
              value={avukatUzmanlikSec}
              onChange={(e) => setAvukatUzmanlikSec(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0D1425', color: '#fff', border: '1px solid #374151', borderRadius: '8px', padding: '12px', fontSize: '15px' }}
            >
              <option value="">Seçiniz</option>
              {avukatUzmanlik.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
      );
    }

    return <div style={{ color: '#9CA3AF' }}>Kişisel bilgilerinize geçebilirsiniz.</div>;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#060C18', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff', padding: '40px 20px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '13px', color: '#14B8A6', marginBottom: '8px' }}>ONBOARDING</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>
            {step === 1 && 'Hangi alanda çalışıyorsunuz?'}
            {step === 2 && (selectedProfession === 'doktor' ? 'Uzmanlık alanı ve klinik bilgileriniz' : 'Uzmanlık bilgileriniz')}
            {step === 3 && 'Hesabınızı tamamlayın'}
          </div>
        </div>

        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {professions.map((prof) => {
              const isSelected = selectedProfession === prof.id;
              return (
                <div
                  key={prof.id}
                  onClick={() => setSelectedProfession(prof.id)}
                  style={{
                    backgroundColor: '#0D1425',
                    border: isSelected ? '2px solid #14B8A6' : '1px solid #1F2937',
                    borderLeft: isSelected ? '4px solid #14B8A6' : '4px solid #374151',
                    borderRadius: '12px',
                    padding: '24px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '16px' }}>{prof.emoji}</div>
                  <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '6px' }}>{prof.label}</div>
                  <div style={{ fontSize: '14px', color: '#9CA3AF' }}>{prof.desc}</div>
                </div>
              );
            })}
          </div>
        )}

        {step === 2 && renderStep2()}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Ad</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width: '100%', backgroundColor: '#0D1425', color: '#fff', border: '1px solid #374151', borderRadius: '8px', padding: '12px', fontSize: '15px' }} />
              </div>
              <div>
                <label style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Soyad</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} style={{ width: '100%', backgroundColor: '#0D1425', color: '#fff', border: '1px solid #374151', borderRadius: '8px', padding: '12px', fontSize: '15px' }} />
              </div>
            </div>

            <div>
              <label style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Cinsiyet</label>
              <select value={gender} onChange={e => setGender(e.target.value)} style={{ width: '100%', backgroundColor: '#0D1425', color: '#fff', border: '1px solid #374151', borderRadius: '8px', padding: '12px', fontSize: '15px' }}>
                <option value="">Seçiniz</option>
                <option value="Erkek">Erkek</option>
                <option value="Kadın">Kadın</option>
              </select>
            </div>

            <div>
              <label style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Hitap Tercihi</label>
              <select value={addressingPreference} onChange={e => setAddressingPreference(e.target.value)} style={{ width: '100%', backgroundColor: '#0D1425', color: '#fff', border: '1px solid #374151', borderRadius: '8px', padding: '12px', fontSize: '15px' }}>
                <option value="">Seçiniz</option>
                <option value="Hocam">Hocam</option>
                <option value="[isim] Hocam">[isim] Hocam</option>
                <option value="First name only">Sadece İsim</option>
              </select>
            </div>
          </div>
        )}

        <div style={{ marginTop: '40px', display: 'flex', gap: '12px' }}>
          {step > 1 && (
            <button onClick={handleBack} style={{ flex: 1, padding: '14px', backgroundColor: '#1F2937', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 500, cursor: 'pointer' }}>
              Geri
            </button>
          )}
          
          {step < 3 && (
            <button
              onClick={handleNext}
              disabled={step === 1 ? !isStep1Complete : !canProceedToStep3()}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: (step === 1 ? isStep1Complete : canProceedToStep3()) ? '#14B8A6' : '#374151',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: (step === 1 ? isStep1Complete : canProceedToStep3()) ? 'pointer' : 'not-allowed',
              }}
            >
              Devam Et
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: canSubmit ? '#14B8A6' : '#374151',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              Deneme Süresini Başlat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
