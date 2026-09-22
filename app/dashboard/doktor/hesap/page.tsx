'use client';
/**
 * NOTYA-HESAP-01 — Hesabım: profil fotoğrafı + e-posta görünümü + şifre değiştirme.
 * Kaan/Gökhan (2026-09-14): Ayarlar'da hesap/şifre için hiçbir yol yoktu.
 * Kaan (2026-09-17): profil fotoğrafının ayrı bir Ayarlar kartına gerek yok — Hesabım'da,
 * e-postanın üstünde dursun.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import DoktorAvatar from '@/components/doktor/DoktorAvatar';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { AVATAR_IZINLI_MIME, AVATAR_MAX_BYTES, avatarDogrula, AvatarGecersizError } from '@/lib/doktor/avatar';
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme';

const AVATAR_ONBELLEK = 'notya_doktor_avatar';

export default function HesabimPage() {
  const [eposta, setEposta] = useState('');
  const [ad, setAd] = useState('Doktor');
  const [adSoyad, setAdSoyad] = useState('');
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [avatarDurum, setAvatarDurum] = useState<'yukleniyor' | 'bos' | 'kaydediyor' | 'kaydedildi'>('yukleniyor');
  const [avatarHata, setAvatarHata] = useState('');
  const dosyaRef = useRef<HTMLInputElement>(null);

  const [yeni, setYeni] = useState('');
  const [tekrar, setTekrar] = useState('');
  const [durum, setDurum] = useState<'bos' | 'kaydediyor' | 'kaydedildi' | 'hata'>('bos');
  const [hata, setHata] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        const [me, av] = await Promise.all([
          fetch('/api/users/me', { headers: { Authorization: `Bearer ${t}` } }).then((r) => r.json()).catch(() => null),
          fetch('/api/doktor/profil/avatar', { headers: { Authorization: `Bearer ${t}` } }).then((r) => r.json()).catch(() => null),
        ]);
        setEposta(me?.data?.email || '');
        setAd(me?.data?.first_name || me?.data?.full_name || 'Doktor');
        const first = me?.data?.first_name || '';
        const last = me?.data?.last_name || '';
        setAdSoyad(`${first} ${last}`.trim() || me?.data?.full_name || '');
        setFotoUrl(av?.avatar?.dataUrl || null);
      } catch { /* e-posta/foto gösterimi kritik değil */ }
      setAvatarDurum('bos');
    })();
  }, []);

  /** Karşılama ekranı ilk boyamada bunu okur; sunucu yanıtı gelince tazelenir. */
  const onbellegeYaz = useCallback((deger: string | null) => {
    try {
      if (deger) localStorage.setItem(AVATAR_ONBELLEK, deger);
      else localStorage.removeItem(AVATAR_ONBELLEK);
    } catch {
      /* özel sekmede localStorage kapalı olabilir — avatar yine sunucudan gelir */
    }
  }, []);

  const fotoSecildi = async (dosya: File | undefined) => {
    if (!dosya) return;
    setAvatarHata('');
    try {
      avatarDogrula(dosya.type || '', dosya.size);
    } catch (e) {
      setAvatarHata(e instanceof AvatarGecersizError ? e.message : 'Fotoğraf kabul edilmedi');
      return;
    }
    setAvatarDurum('kaydediyor');
    try {
      const t = await ensureDoctorAccessToken();
      const form = new FormData();
      form.append('file', dosya);
      const r = await fetch('/api/doktor/profil/avatar', { method: 'POST', headers: { Authorization: `Bearer ${t}` }, body: form });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Fotoğraf yüklenemedi');
      setFotoUrl(j.avatar.dataUrl);
      onbellegeYaz(j.avatar.dataUrl);
      setAvatarDurum('kaydedildi');
      setTimeout(() => setAvatarDurum('bos'), 3000);
    } catch (e) {
      setAvatarDurum('bos');
      setAvatarHata(e instanceof Error ? e.message : 'Fotoğraf yüklenemedi');
    } finally {
      if (dosyaRef.current) dosyaRef.current.value = '';
    }
  };

  const fotoKaldir = async () => {
    setAvatarHata('');
    setAvatarDurum('kaydediyor');
    try {
      const t = await ensureDoctorAccessToken();
      const r = await fetch('/api/doktor/profil/avatar', { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
      if (!r.ok) throw new Error('Fotoğraf kaldırılamadı');
      setFotoUrl(null);
      onbellegeYaz(null);
      setAvatarDurum('bos');
    } catch (e) {
      setAvatarDurum('bos');
      setAvatarHata(e instanceof Error ? e.message : 'Fotoğraf kaldırılamadı');
    }
  };

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

  const kutu: React.CSSProperties = { width: '100%', background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 8, color: CHROME_RENK.ink, fontSize: 14, padding: '10px 12px', boxSizing: 'border-box' };
  const dugme: React.CSSProperties = { background: CHROME_RENK.pine, border: 'none', color: '#FAF8F4', borderRadius: 999, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' };

  return (
    <div>
      <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>Ayarlar</div>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 30, margin: '0 0 6px', color: '#2e251d', letterSpacing: '-0.02em' }}>Hesabım</h1>
      <p style={{ fontSize: 14, color: CHROME_RENK.muted, marginBottom: 24 }}>Giriş bilgileriniz, profil fotoğrafınız ve şifreniz.</p>
      <div style={{ maxWidth: 480 }}>

        {/* Profil fotoğrafı — e-postanın üstünde (Kaan, 2026-09-17) */}
        <div style={{ background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, padding: 18, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', boxShadow: '0 8px 18px rgba(58,44,34,0.045)' }}>
          <DoktorAvatar ad={ad} fotoUrl={fotoUrl} boyut={56} />
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 13, color: CHROME_RENK.muted, marginBottom: 8 }}>
              {avatarDurum === 'yukleniyor' ? 'Yükleniyor…' : fotoUrl ? 'Karşılama ekranında bu şekilde görünür.' : 'Şu an baş harfli avatar kullanılıyor.'}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" style={{ ...dugme, opacity: avatarDurum === 'kaydediyor' ? 0.6 : 1 }} disabled={avatarDurum === 'kaydediyor'} onClick={() => dosyaRef.current?.click()}>
                {avatarDurum === 'kaydediyor' ? 'Yükleniyor…' : fotoUrl ? 'Fotoğrafı değiştir' : 'Fotoğraf yükle'}
              </button>
              {fotoUrl && (
                <button type="button" onClick={fotoKaldir} disabled={avatarDurum === 'kaydediyor'} style={{ ...dugme, background: 'transparent', border: `1px solid ${CHROME_RENK.border}`, color: CHROME_RENK.ink }}>
                  Kaldır
                </button>
              )}
              <input ref={dosyaRef} type="file" accept={AVATAR_IZINLI_MIME.join(',')} style={{ display: 'none' }} onChange={(e) => fotoSecildi(e.target.files?.[0])} />
            </div>
            <p style={{ fontSize: 11, color: CHROME_RENK.muted, marginTop: 8 }}>JPEG, PNG veya WebP · en fazla {Math.round(AVATAR_MAX_BYTES / (1024 * 1024))} MB</p>
            {avatarDurum === 'kaydedildi' && <p style={{ fontSize: 12, color: '#2E6E4E', marginTop: 6 }}>Fotoğrafınız kaydedildi.</p>}
            {avatarHata && <p style={{ fontSize: 12, color: CHROME_RENK.warn, marginTop: 6 }}>{avatarHata}</p>}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: CHROME_RENK.muted, display: 'block', marginBottom: 4 }}>Ad Soyad</label>
          <div style={{ ...kutu, color: CHROME_RENK.ink, background: '#F6F0E4' }}>{adSoyad || '—'}</div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: CHROME_RENK.muted, display: 'block', marginBottom: 4 }}>E-posta</label>
          <div style={{ ...kutu, color: CHROME_RENK.ink, background: '#F6F0E4' }}>{eposta || '—'}</div>
        </div>
        <div style={{ background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, padding: 18, boxShadow: '0 8px 18px rgba(58,44,34,0.045)' }}>
          <div style={{ fontWeight: 700, marginBottom: 12, color: CHROME_RENK.ink }}>Şifreyi değiştir</div>
          <label style={{ fontSize: 12, color: CHROME_RENK.muted, display: 'block', marginBottom: 4 }}>Yeni şifre</label>
          <input type="password" value={yeni} onChange={(e) => setYeni(e.target.value)} placeholder="En az 8 karakter" style={{ ...kutu, marginBottom: 12 }} />
          <label style={{ fontSize: 12, color: CHROME_RENK.muted, display: 'block', marginBottom: 4 }}>Yeni şifre (tekrar)</label>
          <input type="password" value={tekrar} onChange={(e) => setTekrar(e.target.value)} style={{ ...kutu, marginBottom: 14 }} />
          {hata && <div style={{ color: CHROME_RENK.warn, fontSize: 13, marginBottom: 10 }}>{hata}</div>}
          <button type="button" onClick={kaydet} disabled={durum === 'kaydediyor'} style={{ background: CHROME_RENK.pine, border: 'none', color: '#FAF8F4', borderRadius: 8, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>
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
          style={{ marginTop: 24, background: 'transparent', border: `1px solid ${CHROME_RENK.warn}55`, color: CHROME_RENK.warn, borderRadius: 8, padding: '10px 18px', fontWeight: 600, cursor: 'pointer', width: '100%' }}
        >
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}
