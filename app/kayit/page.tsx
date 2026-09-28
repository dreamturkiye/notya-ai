'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { CHROME_RENK, CHROME_FONT, CHROME_FONT_HREF } from '@/lib/doktor/chromeTheme';

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
  // NOTYA-KVKK-01: explicit consent, captured before an account can exist. KVKK m.6 forbids
  // processing özel nitelikli veri (patient health data) without açık rıza, and m.10 requires
  // the aydınlatma metni at COLLECTION — not linked from a footer afterwards. Never
  // pre-checked: consent must be 'özgür iradeyle açıklanan'.
  const [kvkkOnay, setKvkkOnay] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    if (!kvkkOnay) {
      setError('Devam edebilmek için KVKK Aydınlatma Metni\'ni okuyup onaylamanız gerekmektedir.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Consent must be PROVABLE, not merely collected: the moment and the text version mean a
          // later dispute can be answered with what was actually agreed to.
          data: {
            kvkk_onay: true,
            kvkk_onay_tarihi: new Date().toISOString(),
            kvkk_metin_versiyonu: '2026-08-25-v2',
          },
        },
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

  // NOTYA-KAYIT-GORUNUM-01 (Kaan, 2026-09-28): kayıt sayfası doktor arayüzünün krem/çam görünümünde. Mantık (KVKK onayı,
  // hata/başarı iletileri, yönlendirme) aynen korunur. Başlıktaki hastane emojisi (kırmızı haçlı bina) kaldırıldı: Kızılhaç ve
  // Kızılay/Kırmızı Hilal amblemleri korunan işaretlerdir (Cenevre Sözleşmeleri) — ticari üründe ne haç ne hilal
  // kullanılır; nötr yazı işareti (Notya).
  const R = CHROME_RENK;
  const girdi: React.CSSProperties = {
    width: '100%', padding: '14px 16px', backgroundColor: R.paper, border: `1px solid ${R.border}`, borderRadius: 12,
    color: R.ink, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: CHROME_FONT.sans,
  };
  return (
    <div style={{
      minHeight: '100dvh', backgroundColor: R.cream, fontFamily: CHROME_FONT.sans, color: R.ink,
      display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
      padding: 'calc(32px + env(safe-area-inset-top, 0px)) 16px calc(32px + env(safe-area-inset-bottom, 0px))',
    }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <div style={{
        width: '100%', maxWidth: 440, backgroundColor: R.paper, borderRadius: 24, boxSizing: 'border-box',
        padding: 'clamp(28px, 6vw, 44px)', border: `1px solid ${R.border}`, boxShadow: '0 18px 50px rgba(58,44,34,0.08)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 34, fontWeight: 560, letterSpacing: -0.5, color: R.pine, lineHeight: 1.1 }}>Notya</div>
          <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 16, color: R.muted, marginTop: 6 }}>15 gün ücretsiz deneyin</div>
        </div>

        {/* Badge */}
        <div style={{
          backgroundColor: 'rgba(47,67,52,0.08)', color: R.pine, fontSize: 13, fontWeight: 600, padding: '9px 16px',
          borderRadius: 9999, marginBottom: 26, textAlign: 'center', width: '100%', boxSizing: 'border-box',
        }}>
          15 günlük tam erişim — kredi kartı gerekmez
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <input type="email" placeholder="E-posta adresiniz" aria-label="E-posta adresiniz" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={girdi} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <input type="password" placeholder="Şifreniz" aria-label="Şifreniz" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required style={girdi} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <input type="password" placeholder="Şifrenizi tekrar girin" aria-label="Şifrenizi tekrar girin" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={girdi} />
          </div>

          {error && (
            <div style={{
              background: 'rgba(164,91,62,0.08)', border: '1px solid rgba(164,91,62,0.25)', borderRadius: 10,
              color: R.warn, fontSize: 14, lineHeight: 1.5, padding: '10px 12px', marginBottom: 18, textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          {/* NOTYA-SIGNUP-02: kayıt alındı, e-posta onayı bekleniyor — hata değil; hata renginde gösterilmez. */}
          {info && (
            <div style={{
              color: R.pine, background: 'rgba(47,67,52,0.08)', border: '1px solid rgba(47,67,52,0.28)', borderRadius: 12,
              padding: '14px 16px', fontSize: 14, lineHeight: 1.5, marginBottom: 18, textAlign: 'center',
            }}>
              {info}
            </div>
          )}

          <label style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, lineHeight: 1.55, marginBottom: 18,
            color: R.ink, cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={kvkkOnay}
              onChange={(e) => setKvkkOnay(e.target.checked)}
              style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0, cursor: 'pointer', accentColor: R.pine }}
            />
            <span>
              <a href="/kvkk" target="_blank" rel="noopener noreferrer" style={{ color: R.pine, fontWeight: 600 }}>
                KVKK Aydınlatma Metni
              </a>
              &apos;ni okudum. Kişisel verilerimin ve hastalarıma ait sağlık verilerinin metinde
              açıklanan amaçlarla işlenmesini ve belirtilen hizmet sağlayıcılara aktarılmasını kabul
              ediyorum.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', backgroundColor: R.pine, color: '#ffffff', fontSize: 15, fontWeight: 600, padding: 14,
              border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s ease', fontFamily: CHROME_FONT.sans, letterSpacing: 0.2,
            }}
          >
            {loading ? 'Hesap oluşturuluyor…' : 'Hesap oluştur'}
          </button>
        </form>

        {/* Footer Link */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${R.borderSoft}`, textAlign: 'center', fontSize: 14, color: R.muted }}>
          Zaten hesabınız var mı?{' '}
          <a href="/giris/doktor" style={{ color: R.pine, textDecoration: 'none', fontWeight: 600 }}>
            Giriş yap
          </a>
        </div>
      </div>
    </div>
  );
}
