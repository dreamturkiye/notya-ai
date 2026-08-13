'use client';
export const dynamic = "force-dynamic"

// app/session/mali/page.tsx


import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { AccountingNote } from '@/lib/ai/noteGenerator';

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

const getSB = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const SessionPage: React.FC = () => {
  const [step, setStep] = useState<'setup' | 'recording' | 'processing' | 'done'>('setup');
  const [görüşmeTuru, setGörüşmeTuru] = useState<string>('müşteri_görüşmesi');
  const [hizmetTuru, setHizmetTuru] = useState<string>('vergi_danismanligi');
  const [companyName, setCompanyName] = useState<string>('');
  const [vergiNo, setVergiNo] = useState<string>('');
  const [faaliyetAlani, setFaaliyetAlani] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [note, setNote] = useState<AccountingNote | null>(null);
  const [seconds, setSeconds] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (step !== 'recording') return;
    startTimer();
    startSpeechRecognition();
    return () => stopRecording();
  }, [step]);

  useEffect(() => () => stopRecording(), []);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSeconds((prev) => prev + 1), 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* already stopped */ }
      recognitionRef.current = null;
    }
  };

  const startSpeechRecognition = () => {
    const SR = typeof window !== 'undefined'
      ? (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      : undefined;
    if (!SR) {
      setError('Bu tarayıcı sesli kayıt (Web Speech API) desteklemiyor. Notu elle yazabilirsiniz.');
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'tr-TR';

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      setError(String(event?.error || 'Ses tanıma hatası'));
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setError('Mikrofon başlatılamadı. Tarayıcı izinlerini kontrol edin.');
    }
  };

  const handleComplete = async () => {
    stopRecording();
    setError(null);
    setStep('processing');

    try {
      const sb = getSB();
      const { data: sessionData, error: sessionError } = await sb
        .from('sessions')
        .insert([
          {
            session_type: görüşmeTuru,
            specialty: hizmetTuru
          }
        ])
        .select();

      if (sessionError) throw sessionError;
      if (!sessionData?.length) throw new Error('Görüşme kaydı oluşturulamadı.');

      const sessionId = sessionData[0].id;

      const { data: noteData, error: noteError } = await sb
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
      if (!noteData?.length) throw new Error('Not kaydedilemedi.');

      setNote(noteData[0] as AccountingNote);
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Not kaydedilirken bir hata oluştu.');
      setStep('recording');
    }
  };

  return (
    <div style={{ backgroundColor: '#F1F5F9', minHeight: '100vh' }}>
      <nav style={{ backgroundColor: '#0A1628', color: 'white', padding: '10px 20px', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => router.push('/dashboard/mali')} style={{ background: 'none', border: 'none', color: 'white', marginRight: '10px', cursor: 'pointer' }}>
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px)', padding: 16 }}>
          <form
            onSubmit={(e) => e.preventDefault()}
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '360px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <input
              type="text"
              placeholder="Şirket Adı"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #E2E8F0', boxSizing: 'border-box' }}
            />
            <input
              type="text"
              placeholder="Vergi No"
              value={vergiNo}
              onChange={(e) => setVergiNo(e.target.value)}
              style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #E2E8F0', boxSizing: 'border-box' }}
            />
            <select
              value={faaliyetAlani}
              onChange={(e) => setFaaliyetAlani(e.target.value)}
              style={{ marginBottom: '20px', padding: '8px', borderRadius: '4px', border: '1px solid #E2E8F0', boxSizing: 'border-box' }}
            >
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
              <option value='diğer'>Diğer</option>
            </select>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
              {GORUSME_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setGörüşmeTuru(type.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
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
                  type="button"
                  onClick={() => setHizmetTuru(type.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
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
              type="button"
              onClick={() => { setSeconds(0); setTranscript(''); setStep('recording'); }}
              disabled={!companyName}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: companyName ? 'pointer' : 'not-allowed',
                opacity: companyName ? 1 : 0.6
              }}
            >
              Başla
            </button>
          </form>
        </div>
      )}

      {step === 'recording' && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px)', padding: 16 }}>
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.5em', fontWeight: 'bold' }}>Kayıt Devam Ediyor</span>
              <span style={{ color: '#DC2626', fontSize: '1.5em' }}>{new Date(seconds * 1000).toISOString().substring(14, 19)}</span>
            </div>

            {error && (
              <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ position: 'relative', height: '300px', marginBottom: '20px' }}>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                style={{
                  width: '100%',
                  height: '100%',
                  padding: '8px',
                  border: '1px solid #E2E8F0',
                  borderRadius: 6,
                  backgroundColor: '#F9FAFB',
                  resize: 'none',
                  boxSizing: 'border-box'
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
                  backgroundColor: '#DC2626'
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px)', padding: 16 }}>
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', width: '100%', maxWidth: '300px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: '1.3em', fontWeight: 'bold' }}>Notlar Oluşturuluyor</span>
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px)', padding: 16 }}>
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', width: '100%', maxWidth: '500px' }}>
            <div style={{ fontSize: '1.3em', fontWeight: 'bold', marginBottom: 8 }}>Görüşme Kaydedildi</div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
              {companyName} — {GORUSME_TYPES.find(t => t.value === görüşmeTuru)?.label || görüşmeTuru}
              {note ? ' — kayıt oluşturuldu' : ''}
            </div>
            {transcript && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 13, color: '#334155', maxHeight: 220, overflowY: 'auto', whiteSpace: 'pre-wrap', marginBottom: 16 }}>
                {transcript}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => router.push('/dashboard/mali')}
                style={{ flex: 1, minWidth: 140, padding: '11px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                Panele Dön
              </button>
              <button
                onClick={() => { setNote(null); setTranscript(''); setSeconds(0); setError(null); setStep('setup'); }}
                style={{ flex: 1, minWidth: 140, padding: '11px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 8, cursor: 'pointer' }}
              >
                Yeni Görüşme
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionPage;
