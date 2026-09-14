'use client';
/**
 * NOTYA-HESAP-01 — Hesabım: e-posta görünümü + şifre değiştirme.
 * Kaan/Gökhan (2026-09-14): Ayarlar'da hesap/şifre için hiçbir yol yoktu.
 */
import { useEffect, useState } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';

export default function HesabimPage() {
  const [eposta, setEposta] = useState('');
  const [yeni, setYeni] = useState('');
  const [tekrar, setTekrar] = useState('');
  const [durum, setDurum] = useState<'bos' | 'kaydediyor' | 'kaydedildi' | 'hata'>('bos');
  const [hata, setHata] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        const r = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${t}` } });
        const j = await r.json();
        setEposta(j?.data?.email || '');
      } catch { /* e-posta gösterimi kritik değil */ }
    })();
  }, []);

  const kaydet = async () => {
    setHata('');
    if (yeni.length < 8) { setHata('Şifre en az 8 karakter olmalıdır.'); return; }
    if (yeni !== tekrar) { setHata('Şifreler birbirini tutmuyor.'); return; }
    setDurum('kaydediyor');
    try {
      const t = await ensureDoctorAccessToken();
      const r = await fetch('/api/doktor/hesap/sifre-degistir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ yeniSifre: yeni }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Şifre güncellenemedi');
      setDurum('kaydedildi'); setYeni(''); setTekrar('');
      setTimeout(() => setDurum('bos'), 3000);
    } catch (e) {
      setDurum('hata');
      setHata(e instanceof Error ? e.message : 'Şifre güncellenemedi');
    }
  };

  const kutu: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'white', fontSize: 14, padding: '10px 12px', boxSizing: 'border-box' };

  return (
    <div style={{ backgroundColor: '#0A1628', minHeight: '100vh', color: 'white' }}>
      <DoktorNav />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 24 }}>
        <a href="/dashboard/doktor/ayarlar" style={{ color: '#9FB3C8', fontSize: 13, textDecoration: 'none' }}>← Ayarlar</a>
        <h1 style={{ fontSize: 22, margin: '10px 0 6px' }}>Hesabım</h1>
        <p style={{ fontSize: 13, color: '#8FA0B5', marginBottom: 24 }}>Giriş bilgileriniz ve şifreniz.</p>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: '#8FA0B5', display: 'block', marginBottom: 4 }}>E-posta</label>
          <div style={{ ...kutu, color: '#C9D4E3', background: 'rgba(255,255,255,0.03)' }}>{eposta || '—'}</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Şifreyi değiştir</div>
          <label style={{ fontSize: 12, color: '#8FA0B5', display: 'block', marginBottom: 4 }}>Yeni şifre</label>
          <input type="password" value={yeni} onChange={(e) => setYeni(e.target.value)} placeholder="En az 8 karakter" style={{ ...kutu, marginBottom: 12 }} />
          <label style={{ fontSize: 12, color: '#8FA0B5', display: 'block', marginBottom: 4 }}>Yeni şifre (tekrar)</label>
          <input type="password" value={tekrar} onChange={(e) => setTekrar(e.target.value)} style={{ ...kutu, marginBottom: 14 }} />
          {hata && <div style={{ color: '#F87171', fontSize: 13, marginBottom: 10 }}>{hata}</div>}
          <button type="button" onClick={kaydet} disabled={durum === 'kaydediyor'} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 8, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>
            {durum === 'kaydediyor' ? 'Kaydediliyor…' : durum === 'kaydedildi' ? '✓ Şifre değiştirildi' : 'Şifreyi Kaydet'}
          </button>
        </div>

        {/* Kaan/Gökhan (2026-09-14): masaüstünde hamburger menüsü yok — çıkış burada da olsun */}
        <button
          type="button"
          onClick={() => {
            const key = Object.keys(localStorage).find((k) => k.includes('auth-token')) || '';
            if (key) localStorage.removeItem(key);
            window.location.href = '/giris/doktor';
          }}
          style={{ marginTop: 24, background: 'transparent', border: '1px solid rgba(248,113,113,0.35)', color: '#F87171', borderRadius: 8, padding: '10px 18px', fontWeight: 600, cursor: 'pointer', width: '100%' }}
        >
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}
