'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://anjayzospuurymjmmtim.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuamF5em9zcHV1cnltam1tdGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDc5NzIsImV4cCI6MjA5NjIyMzk3Mn0.J4qRde2QJxxErFIWsO6Zb2TPN8GEIFXloLRpdac4GxE'
);

export default function KayitPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        // NOTYA-SIGNUP-01: every failure except "already registered" used to show
        // "Kayıt başarısız. Lütfen bilgilerinizi kontrol edin." — it blamed the doctor for
        // problems that are ours. The clearest case is the e-mail send limit: when the mail
        // provider refuses, the doctor is told their own details are wrong, so they retype
        // correct information, fail again, and leave. A user must never be blamed for a
        // server-side fault.
        const raw = (signUpError.message || '').toLowerCase();
        if (raw.includes('already registered') || raw.includes('user already registered')) {
          setError('Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.');
        } else if (raw.includes('rate limit') || raw.includes('too many')) {
          setError('Şu anda kayıt işlemi geçici olarak yapılamıyor. Lütfen birkaç dakika sonra tekrar deneyin. (Sorun sizde değil, sistemimizde.)');
        } else if (raw.includes('password')) {
          setError('Şifreniz yeterince güçlü değil. En az 8 karakter kullanın.');
        } else if (raw.includes('email') && (raw.includes('invalid') || raw.includes('geçersiz'))) {
          setError('E-posta adresi geçersiz görünüyor. Lütfen kontrol edin.');
        } else if (raw.includes('fetch') || raw.includes('network')) {
          setError('Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.');
        } else {
          setError('Kayıt tamamlanamadı. Lütfen birkaç dakika sonra tekrar deneyin.');
        }
        setLoading(false);
        return;
      }

      if (data.session) {
        localStorage.setItem('auth-token', JSON.stringify({ access_token: data.session.access_token }));
        router.replace('/onboarding?p=doktor');
      } else {
        // NOTYA-SIGNUP-02: no session here means the account was created and e-mail confirmation
        // is pending — the expected path when confirmations are on. Telling the doctor to "try
        // logging in" sends them to a login that cannot work until they confirm, and reads as a
        // failure when in fact the registration succeeded.
        setInfo('Kayıt alındı. E-posta adresinize bir onay bağlantısı gönderdik — hesabınızı etkinleştirmek için bağlantıya tıklayın. (Gelen kutunuzda yoksa spam klasörünü kontrol edin.)');
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#060C18',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#111827',
        borderRadius: '20px',
        padding: '48px 40px',
        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.4)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '42px', marginBottom: '12px' }}>🏥</div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 600,
            color: '#ffffff',
            margin: '0 0 4px 0',
            letterSpacing: '-0.3px'
          }}>
            Notya AI
          </h1>
          <p style={{
            fontSize: '15px',
            color: '#14b8a6',
            margin: 0,
            fontWeight: 500
          }}>
            15 Gün Ücretsiz Deneyin!
          </p>
        </div>

        {/* Badge */}
        <div style={{
          display: 'inline-block',
          backgroundColor: '#134e4b',
          color: '#14b8a6',
          fontSize: '13px',
          fontWeight: 500,
          padding: '6px 16px',
          borderRadius: '9999px',
          marginBottom: '32px',
          textAlign: 'center',
          width: '100%'
        }}>
          15 günlük tam erişim - kredi kartı gerekmez
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <input
              type="email"
              placeholder="E-posta adresiniz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '15px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <input
              type="password"
              placeholder="Şifreniz"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '15px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <input
              type="password"
              placeholder="Şifrenizi tekrar girin"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '15px',
                outline: 'none'
              }}
            />
          </div>

          {error && (
            <div style={{
              color: '#f87171',
              fontSize: '14px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* NOTYA-SIGNUP-02: a successful registration awaiting e-mail confirmation is NOT an
              error and must not be styled as one — red text on a success path teaches doctors
              that the product failed when it did not. */}
          {info && (
            <div style={{
              color: '#0A1628',
              background: '#EEF4FF',
              border: '1px solid #2563EB',
              borderRadius: '8px',
              padding: '14px 16px',
              fontSize: '14px',
              lineHeight: 1.5,
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#14b8a6',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 600,
              padding: '14px',
              border: 'none',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Hesap oluşturuluyor...' : 'Hesap Oluştur'}
          </button>
        </form>

        {/* Footer Link */}
        <div style={{
          marginTop: '28px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#9ca3af'
        }}>
          Zaten hesabınız var mı?{' '}
          <a
            href="/giris/doktor"
            style={{
              color: '#14b8a6',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            Giriş Yap
          </a>
        </div>
      </div>
    </div>
  );
}
