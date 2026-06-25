'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DoktorNav from '@/components/doktor/DoktorNav';

export const dynamic = 'force-dynamic';

interface FormData {
  tc: string;
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
  kvkkRiza: boolean;
}

const KRONIK_HASTALIKLAR = ['DM', 'HT', 'KAH', 'KOAH', 'Astım', 'Epilepsi', 'Tiroid', 'Böbrek yet.', 'Karaciğer yet.', 'Diğer'];

function validateTC(tc: string): boolean {
  if (!/^\d{11}$/.test(tc) || tc[0] === '0') return false;
  const digits = tc.split('').map(Number);
  const sumOdd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sumEven = digits[1] + digits[3] + digits[5] + digits[7] + digits[9];
  if (((sumOdd * 7) - sumEven) % 10 !== digits[10]) return false;
  const sumFirst10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (sumFirst10 % 10 !== digits[10]) return false;
  return true;
}

export default function HastaEklePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    tc: '', adSoyad: '', dogumTarihi: '', cinsiyet: '', kanGrubu: '',
    kronikHastaliklar: [], alerjiler: '', suregenIlaclar: '', sigaraAlkol: '',
    telefon: '', sehir: '', kvkkRiza: false
  });
  const [error, setError] = useState('');

  const handleNext = () => {
    if (step === 1) {
      if (!validateTC(formData.tc)) {
        setError('Geçersiz TC Kimlik numarası');
        return;
      }
      if (!formData.adSoyad || !formData.dogumTarihi || !formData.cinsiyet || !formData.kanGrubu) {
        setError('Tüm alanları doldurun');
        return;
      }
    }
    setError('');
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!formData.kvkkRiza) {
      setError('KVKK rızası zorunludur');
      return;
    }
    const token = localStorage.getItem(Object.keys(localStorage).find(k => k.includes('auth-token')) || '');
    const res = await fetch('/api/doktor/hastalar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(formData)
    });
    if (res.ok) router.push('/dashboard/doktor/hastalar');
    else setError('Kayıt başarısız');
  };

  return (
    <div style={{ backgroundColor: '#0A1628', minHeight: '100vh', color: 'white' }}>
      <DoktorNav />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
        <h1 style={{ fontSize: 28, marginBottom: 24 }}>Yeni Hasta Kaydı</h1>
        
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {[1,2,3].map(s => (
            <div key={s} style={{ flex: 1, height: 4, background: s <= step ? '#0F9B8E' : '#334155', borderRadius: 2 }} />
          ))}
        </div>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input placeholder="TC Kimlik No (11 hane)" value={formData.tc} onChange={e => setFormData({...formData, tc: e.target.value})} style={{ padding: 14, background: '#1E2937', border: '1px solid #334155', borderRadius: 8, color: 'white' }} />
            <input placeholder="Ad Soyad" value={formData.adSoyad} onChange={e => setFormData({...formData, adSoyad: e.target.value})} style={{ padding: 14, background: '#1E2937', border: '1px solid #334155', borderRadius: 8, color: 'white' }} />
            <input type="date" value={formData.dogumTarihi} onChange={e => setFormData({...formData, dogumTarihi: e.target.value})} style={{ padding: 14, background: '#1E2937', border: '1px solid #334155', borderRadius: 8, color: 'white' }} />
            <select value={formData.cinsiyet} onChange={e => setFormData({...formData, cinsiyet: e.target.value})} style={{ padding: 14, background: '#1E2937', border: '1px solid #334155', borderRadius: 8, color: 'white' }}>
              <option value="">Cinsiyet</option><option>Erkek</option><option>Kadın</option>
            </select>
            <select value={formData.kanGrubu} onChange={e => setFormData({...formData, kanGrubu: e.target.value})} style={{ padding: 14, background: '#1E2937', border: '1px solid #334155', borderRadius: 8, color: 'white' }}>
              <option value="">Kan Grubu</option><option>A Rh+</option><option>A Rh-</option><option>B Rh+</option><option>B Rh-</option><option>AB Rh+</option><option>AB Rh-</option><option>0 Rh+</option><option>0 Rh-</option>
            </select>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ marginBottom: 8 }}>Kronik Hastalıklar</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {KRONIK_HASTALIKLAR.map(h => (
                  <button key={h} onClick={() => {
                    const arr = formData.kronikHastaliklar.includes(h) 
                      ? formData.kronikHastaliklar.filter(x => x !== h) 
                      : [...formData.kronikHastaliklar, h];
                    setFormData({...formData, kronikHastaliklar: arr});
                  }} style={{ padding: '8px 14px', background: formData.kronikHastaliklar.includes(h) ? '#0F9B8E' : '#1E2937', borderRadius: 999, border: 'none', color: 'white' }}>{h}</button>
                ))}
              </div>
            </div>
            <input placeholder="Alerjiler" value={formData.alerjiler} onChange={e => setFormData({...formData, alerjiler: e.target.value})} style={{ padding: 14, background: '#1E2937', border: '1px solid #334155', borderRadius: 8, color: 'white' }} />
            <input placeholder="Süregelen İlaçlar" value={formData.suregenIlaclar} onChange={e => setFormData({...formData, suregenIlaclar: e.target.value})} style={{ padding: 14, background: '#1E2937', border: '1px solid #334155', borderRadius: 8, color: 'white' }} />
            <input placeholder="Sigara / Alkol kullanımı" value={formData.sigaraAlkol} onChange={e => setFormData({...formData, sigaraAlkol: e.target.value})} style={{ padding: 14, background: '#1E2937', border: '1px solid #334155', borderRadius: 8, color: 'white' }} />
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input placeholder="Telefon" value={formData.telefon} onChange={e => setFormData({...formData, telefon: e.target.value})} style={{ padding: 14, background: '#1E2937', border: '1px solid #334155', borderRadius: 8, color: 'white' }} />
            <input placeholder="Şehir" value={formData.sehir} onChange={e => setFormData({...formData, sehir: e.target.value})} style={{ padding: 14, background: '#1E2937', border: '1px solid #334155', borderRadius: 8, color: 'white' }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={formData.kvkkRiza} onChange={e => setFormData({...formData, kvkkRiza: e.target.checked})} />
              KVKK aydınlatma metnini okudum ve rıza veriyorum
            </label>
          </div>
        )}

        {error && <div style={{ color: '#EF4444', marginTop: 16 }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
          {step > 1 && <button onClick={() => setStep(step - 1)} style={{ padding: '12px 24px', background: '#334155', color: 'white', borderRadius: 8, border: 'none' }}>Geri</button>}
          {step < 3 && <button onClick={handleNext} style={{ padding: '12px 24px', background: '#0F9B8E', color: 'white', borderRadius: 8, border: 'none', marginLeft: 'auto' }}>İleri</button>}
          {step === 3 && <button onClick={handleSubmit} style={{ padding: '12px 24px', background: '#0F9B8E', color: 'white', borderRadius: 8, border: 'none', marginLeft: 'auto' }}>Kaydet</button>}
        </div>
      </div>
    </div>
  );
}
