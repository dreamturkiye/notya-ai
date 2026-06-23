// app/session/mali/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { AccountingNoteV2 } from '@/lib/ai/noteGenerator';

const GORUSME_TYPES = [
  { value: 'müşteri_görüşmesi', label: 'Müşteri Görüşmesi' },
  { value: 'vergi_denetim', label: 'Vergi Denetimi Hazırlığı' },
  { value: 'sozlesme_imzasi', label: 'Sözleşme İmzası' },
  { value: 'on_danisma', label: 'On Danışma' },
  { value: 'finansal_analiz', label: 'Finansal Analiz' },
  { value: 'icra_takip', label: 'İcra ve Yapilandırma' },
  { value: 'ar_ge_tesviki', label: 'Ar-Ge Tesvik' },
  { value: 'enflasyon_muhasebesi', label: 'Enflasyon Muhasebesi' }
];

const HIZMET_TYPES = [
  { value: 'vergi_danismanligi', label: 'Vergi Danışmanlığı' },
  { value: 'muhasebe', label: 'Muhasebe' },
  { value: 'sgk', label: 'SGK' },
  { value: 'denetim', label: 'Denetim' },
  { value: 'irs_planlama', label: 'Vergi Planlaması' },
  { value: 'konkordato', label: 'Konkordato' },
  { value: 'genel', label: 'Genel' }
];

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const SessionPage: React.FC = () => {
  const [step, setStep] = useState<'setup' | 'recording' | 'processing' | 'done'>('setup');
  const [görüşmeTuru, setGörüşmeTuru] = useState<string>('müşteri_görüşmesi');
  const [hizmetTuru, setHizmetTuru] = useState<string>('vergi_danismanligi');
  const [companyName, setCompanyName] = useState<string>('');
  const [vergiNo, setVergiNo] = useState<string>('');
  const [faaliyetAlani, setFaaliyetAlani] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [note, setNote] = useState<AccountingNoteV2 | null>(null);
  const [seconds, setSeconds] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (step === 'recording') {
      startTimer();
      startSpeechRecognition();
    }
  }, [step]);

  const startTimer = () => {
    const intervalId = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  };

  const startSpeechRecognition = async () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'tr-TR';

      let finalTranscript = '';
      let interimTranscript = '';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setError(event.error);
      };

      recognition.start();
    } else {
      setError('Web Speech API not supported');
    }
  };

  const handleComplete = async () => {
    if ('webkitSpeechRecognition' in window) {
      (window as any).webkitSpeechRecognition().stop();
    }

    setStep('processing');

    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert([
          {
            session_type: görüşmeTuru,
            specialty: hizmetTuru
          }
        ])
        .select();

      if (sessionError) throw sessionError;

      const sessionId = sessionData[0].id;

      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .insert([
          {
            session_id: sessionId,
            transcript,
            profession: 'muhasebeci',
            service_type: hizmetTuru,
            görüşme_turu: görüşmeTuru,
            company_name: companyName,
            vergi_no: vergiNo,
            faaliyet_alani: faaliyetAlani
          }
        ])
        .select();

      if (noteError) throw noteError;

      setNote(noteData[0]);
    } catch (err) {
      setError(err.message);
    }

    setStep('done');
  };

  return (
    <div style={{ backgroundColor: '#F1F5F9', height: '100vh' }}>
      <nav style={{ backgroundColor: '#0A1628', color: 'white', padding: '10px 20px', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => router.push('/dashboard/mali')} style={{ background: 'none', border: 'none', color: 'white', marginRight: '10px' }}>
          {'<'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto' }}>
          <div style={{ width: '28px', height: '28px', background: '#2563EB', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: '14px', fontWeight: '700' }}>N</span>
          </div>
          <span style={{ color: '#fff', fontSize: '16px', fontWeight: '700' }}>Notya AI</span>
        </div>
      </nav>

      {step === 'setup' && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
          <form
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '300px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <input
              type="text"
              placeholder="Şirket Adı"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px' }}
            />
            <input
              type="text"
              placeholder="Vergi No"
              value={vergiNo}
              onChange={(e) => setVergiNo(e.target.value)}
              style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px' }}
            />
            <select
              value={faaliyetAlani}
              onChange={(e) => setFaaliyetAlani(e.target.value)}
              style={{ marginBottom: '20px', padding: '8px', borderRadius: '4px' }}
            >
              <option value="">Faaliyet Alanı</option>
              <option value=''>Faaliyet Alanı Secin</option>
              <option value='ticaret'>Ticaret</option>
              <option value='hizmet'>Hizmet</option>
              <option value='insaat'>Insaat ve Muteahhitlik</option>
              <option value='imalat'>Imalat ve Uretim</option>
              <option value='gida'>Gida ve Restoran</option>
              <option value='turizm'>Turizm ve Otelcilik</option>
              <option value='saglik'>Saglik ve Klinik</option>
              <option value='egitim'>Egitim ve Kurs</option>
              <option value='teknoloji'>Teknoloji ve Yazilim</option>
              <option value='tasimacilik'>Tasimacilik ve Lojistik</option>
              <option value='gayrimenkul'>Gayrimenkul</option>
              <option value='tekstil'>Tekstil ve Hazır Giyim</option>
              <option value='tarim'>Tarim ve Hayvancilik</option>
              <option value='enerji'>Enerji</option>
              <option value='finans'>Finans ve Sigorta</option>
              <option value='diger'>Diger</option>
            </select>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
              {GORUSME_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setGörüşmeTuru(type.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    backgroundColor: görüşmeTuru === type.value ? '#2563EB' : 'white',
                    color: görüşmeTuru === type.value ? 'white' : '#0A1628',
                    border: görüşmeTuru === type.value ? 'none' : '1px solid #0A1628'
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
              {HIZMET_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setHizmetTuru(type.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    backgroundColor: hizmetTuru === type.value ? '#2563EB' : 'white',
                    color: hizmetTuru === type.value ? 'white' : '#0A1628',
                    border: hizmetTuru === type.value ? 'none' : '1px solid #0A1628'
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep('recording')}
              disabled={!companyName}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: companyName ? 'pointer' : 'not-allowed'
              }}
            >
              Başla
            </button>
          </form>
        </div>
      )}

      {step === 'recording' && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', width: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '1.5em', fontWeight: 'bold' }}>Kayıt Devam Ediyor</span>
              <span style={{ color: '#DC2626', fontSize: '1.5em' }}>{new Date(seconds * 1000).toISOString().substr(14, 5)}</span>
            </div>

            <div style={{ position: 'relative', height: '300px', overflowY: 'auto', marginBottom: '20px' }}>
              <textarea
                value={transcript}
                readOnly
                style={{
                  width: '100%',
                  height: '100%',
                  padding: '8px',
                  border: 'none',
                  backgroundColor: '#F9FAFB',
                  resize: 'none'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#DC2626',
                  animation: 'pulse 1s infinite'
                }}
              />
            </div>

            <button
              onClick={handleComplete}
              style={{
                padding: '10px 20px',
                backgroundColor: '#DC2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Tamamla
            </button>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', width: '300px', textAlign: 'center' }}>
            <span style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '20px' }}>Notlar Oluşturuluyor</span>
            <div
              style={{
                border: '4px solid #2563EB',
                borderRadius: '50%',
                width: '80px',
                height: '80px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>•</span>
            </div>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', width: '500px' }}>
            {/* Render the note details here */}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionPage;