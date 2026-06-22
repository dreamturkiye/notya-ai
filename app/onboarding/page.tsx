// app/onboarding/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const cities = [
  'Istanbul',
  'Ankara',
  'Izmir',
  'Bursa',
  'Antalya',
  'Gaziantep',
  'Kayseri',
  'Konya',
  'Mersin',
  'Adana',
  'Diyarbakir',
  'Eskisehir',
  'Kocaeli',
  'Samsun',
  'Trabzon',
  'Mugla'
];

const professions = ['doktor', 'mali_musavirlik', 'avukat', 'psikolog'];

const professionFields: { [key: string]: any } = {
  doktor: [
    { label: 'Title', name: 'title', type: 'select', options: ['Dr', 'Uzm.Dr', 'Doc.Dr', 'Prof.Dr'] },
    { label: 'Specialty', name: 'specialty', type: 'text' },
    { label: 'Hospital', name: 'hospital', type: 'text' }
  ],
  mali_musavirlik: [
    { label: 'Unvan', name: 'unvan', type: 'select', options: ['SMMM', 'YMM', 'SM'] },
    {
      label: 'Uzmanlik',
      name: 'uzmanlik',
      type: 'chips',
      options: [
        'Vergi Danismanligi',
        'Muhasebe',
        'SGK ve Is Hukuku',
        'Bagimsiz Denetim',
        'Ar-Ge Tesviki',
        'Konkordato',
        'Transfer Fiyatlandirmasi',
        'Enflasyon Muhasebesi',
        'MASAK Uyumu',
        'Sirket Kurulusu'
      ]
    },
    { label: 'Buro Adı', name: 'buro_adi', type: 'text' },
    { label: 'Şehir', name: 'sehir', type: 'select', options: cities }
  ],
  avukat: [
    { label: 'Baro', name: 'baro', type: 'text' },
    {
      label: 'Uzmanlik',
      name: 'uzmanlik',
      type: 'chips',
      options: [
        'Ceza Hukuku',
        'Aile ve Miras Hukuku',
        'Ticaret ve Sirketler Hukuku',
        'Is ve SGK Hukuku',
        'Gayrimenkul ve Tapu Hukuku',
        'Icra ve Iflas Hukuku',
        'Idare ve Anayasa Hukuku',
        'Tuketici ve Sigorta Hukuku',
        'Bilisim ve KVKK Hukuku',
        'Genel Hukuk'
      ]
    },
    { label: 'Buro Adı', name: 'buro_adi', type: 'text' },
    { label: 'Yıl', name: 'yil', type: 'number' },
    { label: 'Şehir', name: 'sehir', type: 'select', options: cities }
  ],
  psikolog: [
    {
      label: 'Yaklaşım',
      name: 'yaklasim',
      type: 'chips',
      options: ['BDT', 'EMDR', 'ACT', 'DBT', 'Aile Terapisi', 'Cocuk Terapisi', 'Travma', 'Psikanaliz', 'Gestalt']
    },
    { label: 'Klinik', name: 'klinik', type: 'text' }
  ]
};

const addressingPreferenceOptions = {
  doktor: ['hocam', 'named_hocam', 'sadece_ad'],
  mali_musavirlik: ['Musavir Hanim', 'Bey', 'sadece_ad'],
  avukat: ['Avukat Hanim', 'Bey', 'sadece_ad']
};

const OnboardingPage = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profession, setProfession] = useState('');
  const [formData, setFormData] = useState({});

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleChipsChange = (field: string, value: string) => {
    if (Array.isArray(formData[field])) {
      const updatedValue = formData[field].includes(value)
        ? formData[field].filter((item) => item !== value)
        : [...formData[field], value];
      setFormData({ ...formData, [field]: updatedValue });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.getSession();
    if (!error) {
      const response = await fetch('/api/users/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabase.auth.session()?.access_token}`
        },
        body: JSON.stringify({ profession, ...formData })
      });

      if (response.ok) {
        switch (profession) {
          case 'mali_musavirlik':
            router.replace('/dashboard/mali');
            break;
          case 'avukat':
            router.replace('/dashboard/avukat');
            break;
          default:
            router.replace('/dashboard');
        }
      }
    }
  };

  return (
    <div style={{ backgroundColor: '#0A1628', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <form
        onSubmit={handleNext}
        style={{
          backgroundColor: '#111827',
          padding: '2rem',
          borderRadius: '0.5rem',
          width: '300px',
          color: '#fff'
        }}
      >
        {step === 1 && (
          <div>
            <h2>Select Profession</h2>
            <select
              name="profession"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              style={{ backgroundColor: '#1e293b', color: '#fff', padding: '0.5rem', borderRadius: '0.25rem', width: '100%' }}
            >
              <option value="">Select</option>
              {professions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        )}
        {step === 2 && profession && (
          <div>
            <h2>{profession.charAt(0).toUpperCase() + profession.slice(1)}</h2>
            {professionFields[profession].map((field: any) => {
              if (field.type === 'select') {
                return (
                  <div key={field.name}>
                    <label>{field.label}</label>
                    <select
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleChange}
                      style={{ backgroundColor: '#1e293b', color: '#fff', padding: '0.5rem', borderRadius: '0.25rem', width: '100%' }}
                    >
                      <option value="">Select</option>
                      {field.options.map((option: string) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              } else if (field.type === 'chips') {
                return (
                  <div key={field.name}>
                    <label>{field.label}</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                      {field.options.map((option: string) => (
                        <button
                          key={option}
                          onClick={() => handleChipsChange(field.name, option)}
                          style={{
                            backgroundColor: formData[field.name]?.includes(option) ? '#2563EB' : '#1e293b',
                            color: '#fff',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            margin: '0.25rem'
                          }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={field.name}>
                    <label>{field.label}</label>
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleChange}
                      style={{ backgroundColor: '#1e293b', color: '#fff', padding: '0.5rem', borderRadius: '0.25rem', width: '100%' }}
                    />
                  </div>
                );
              }
            })}
          </div>
        )}
        {step === 3 && (
          <div>
            <h2>Personal Information</h2>
            <input
              type="text"
              name="firstName"
              value={formData.firstName || ''}
              onChange={handleChange}
              placeholder="First Name"
              style={{ backgroundColor: '#1e293b', color: '#fff', padding: '0.5rem', borderRadius: '0.25rem', width: '100%', marginBottom: '0.5rem' }}
            />
            <input
              type="text"
              name="lastName"
              value={formData.lastName || ''}
              onChange={handleChange}
              placeholder="Last Name"
              style={{ backgroundColor: '#1e293b', color: '#fff', padding: '0.5rem', borderRadius: '0.25rem', width: '100%', marginBottom: '0.5rem' }}
            />
            <div>
              <label>Gender</label>
              <select
                name="gender"
                value={formData.gender || ''}
                onChange={handleChange}
                style={{ backgroundColor: '#1e293b', color: '#fff', padding: '0.5rem', borderRadius: '0.25rem', width: '100%', marginBottom: '0.5rem' }}
              >
                <option value="">Select</option>
                <option value="Bay">Bay</option>
                <option value="Bayan">Bayan</option>
              </select>
            </div>
            <div>
              <label>Addressing Preference</label>
              <select
                name="addressingPreference"
                value={formData.addressingPreference || ''}
                onChange={handleChange}
                style={{ backgroundColor: '#1e293b', color: '#fff', padding: '0.5rem', borderRadius: '0.25rem', width: '100%', marginBottom: '0.5rem' }}
              >
                <option value="">Select</option>
                {addressingPreferenceOptions[profession].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        <button type="submit" style={{ backgroundColor: '#2563EB', color: '#fff', padding: '0.75rem', borderRadius: '0.25rem', width: '100%' }}>
          {step === 3 ? 'Submit' : 'Next'}
        </button>
      </form>
    </div>
  );
};

export default OnboardingPage;