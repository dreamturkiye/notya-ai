// app/onboarding/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';


const PROFESSIONS = [
  { id: 'doktor', label: 'Doktor/Hekim', desc: 'Medical Notes', emoji: '🏥' },
  { id: 'mali_musavirlik', label: 'Mali Musavir/SMMM/YMM', desc: 'Vergi Notes', emoji: '💰' },
  { id: 'avukat', label: 'Avukat', desc: 'Legal Notes', emoji: '⚖️' },
  { id: 'psikolog', label: 'Psikolog/Terapist', desc: 'Seans Notes', emoji: '🧠' }
];

const SPECIALTIES = [
  // List of 14 medical specialties
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [professionType, setProfessionType] = useState('');
  const [title, setTitle] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [hospital, setHospital] = useState('');
  const [unvan, setUnvan] = useState('');
  const [uzmanlikChips, setUzmanlikChips] = useState<string[]>([]);
  const [buroAdi, setBuroAdi] = useState('');
  const [sehir, setSehir] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [addressingPreference, setAddressingPreference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  useEffect(() => {
    if (step === 3) {
      const professionSpecificData = {
        doktor: { title, specialty, hospital },
        mali_musavirlik: { unvan, uzmanlik_alani: uzmanlikChips.join(','), buro_adi, sehir },
        avukat: { baro: '', uzmanlik: '', buro_adi }, // Add baro input
        psikolog: { uzmanlik: '', klinik_adi: '' } // Add klinik_adi input
      };

      const data = {
        profession_type: professionType,
        ...professionSpecificData[professionType],
        firstName, lastName, gender, addressingPreference
      };

      setLoading(true);
      fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(() => {
        if (professionType === 'mali_musavirlik') {
          router.replace('/dashboard/mali');
        } else {
          router.replace('/dashboard');
        }
      })
      .catch(err => setError('Failed to save profile'))
      .finally(() => setLoading(false));
    }
  }, [step, professionType, title, specialty, hospital, unvan, uzmanlikChips, buroAdi, sehir, firstName, lastName, gender, addressingPreference, router]);

  return (
    <div >
      {loading && <div>Loading...</div>}
      {error && <div>{error}</div>}
      <div >
        {[1, 2, 3].map(i => <span key={i} style={{ color: step >= i ? 'blue' : 'gray' }}>•</span>)}
      </div>
      {step === 1 && (
        <div >
          {PROFESSIONS.map(profession => (
            <div
              key={profession.id}
              
              onClick={() => setProfessionType(profession.id)}
            >
              <span>{profession.emoji}</span>
              <h3>{profession.label}</h3>
              <p>{profession.desc}</p>
            </div>
          ))}
          <button disabled={!professionType} onClick={() => setStep(2)}>Devam Et</button>
        </div>
      )}
      {step === 2 && (
        <div >
          {professionType === 'doktor' && (
            <>
              <select value={title} onChange={(e) => setTitle(e.target.value)}>
                <option value="">Title</option>
                <option value="Dr.">Dr.</option>
                <option value="Uzm.Dr.">Uzm.Dr.</option>
                <option value="Doc.Dr.">Doc.Dr.</option>
                <option value="Prof.Dr.">Prof.Dr.</option>
              </select>
              <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                <option value="">Specialty</option>
                {SPECIALTIES.map(specialty => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
              <input type="text" placeholder="Hospital" value={hospital} onChange={(e) => setHospital(e.target.value)} />
            </>
          )}
          {professionType === 'mali_musavirlik' && (
            <>
              <select value={unvan} onChange={(e) => setUnvan(e.target.value)}>
                <option value="">Unvan</option>
                <option value="SMMM">Serbest Muhasebeci Mali Musavir</option>
                <option value="YMM">Yeminli Mali Musavir</option>
                <option value="SM">Serbest Muhasebeci</option>
              </select>
              <div >
                {['Vergi Danismanligi', 'Muhasebe', 'SGK', 'Denetim', 'Ar-Ge Tesviki', 'Konkordato', 'Transfer Fiyatlandirmasi', 'Enflasyon Muhasebesi'].map(chip => (
                  <button
                    key={chip}
                    
                    onClick={() => setUzmanlikChips(prev => uzmanlikChips.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip])}
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <input type="text" placeholder="Buro Adi" value={buroAdi} onChange={(e) => setBuroAdi(e.target.value)} />
              <input type="text" placeholder="Sehir" value={sehir} onChange={(e) => setSehir(e.target.value)} />
            </>
          )}
          {professionType === 'avukat' && (
            <>
              <input type="text" placeholder="Baro" value="" onChange={(e) => console.log(e.target.value)} /> {/* Add baro input */}
              <select value={''} onChange={(e) => console.log(e.target.value)}> {/* Add uzmanlik select */}
                <option value="">Uzmanlik</option>
                <option value="Ceza Hukuku">Ceza Hukuku</option>
                <option value="Medeni Hukuk">Medeni Hukuk</option>
                <option value="Ticaret Hukuku">Ticaret Hukuku</option>
                <option value="Is Hukuku">Is Hukuku</option>
                <option value="Idare Hukuku">Idare Hukuku</option>
              </select>
              <input type="text" placeholder="Buro Adi" value={buroAdi} onChange={(e) => setBuroAdi(e.target.value)} />
            </>
          )}
          {professionType === 'psikolog' && (
            <>
              <select value={''} onChange={(e) => console.log(e.target.value)}> {/* Add uzmanlik select */}
                <option value="">Uzmanlik</option>
                <option value="BDT">BDT</option>
                <option value="EMDR">EMDR</option>
                <option value="ACT">ACT</option>
                <option value="Aile Terapisi">Aile Terapisi</option>
                <option value="Cocuk Terapisi">Cocuk Terapisi</option>
                <option value="Travma">Travma</option>
              </select>
              <input type="text" placeholder="Klinik Adi" value="" onChange={(e) => console.log(e.target.value)} /> {/* Add klinik_adi input */}
            </>
          )}
          <button onClick={() => setStep(3)}>Devam Et</button>
        </div>
      )}
      {step === 3 && (
        <div >
          <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <select value={addressingPreference} onChange={(e) => setAddressingPreference(e.target.value)}>
            <option value="">Addressing Preference</option>
            <option value="hocam">Hocam</option>
            <option value="named_hocam">Named Hocam</option>
            <option value="first_name_only">First Name Only</option>
          </select>
          <button onClick={() => setStep(4)}>Save</button>
        </div>
      )}
    </div>
  );
}