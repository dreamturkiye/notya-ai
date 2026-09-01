'use client';

/** NOTYA-RANDEVU-01 — sekreter davet kabul sayfası. Public — token kendisi kimlik doğrulamadır. */

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function DavetKabulPage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params?.token || '');

  const [durum, setDurum] = useState<'yukleniyor' | 'gecerli' | 'gecersiz' | 'tamamlandi'>('yukleniyor');
  const [bilgi, setBilgi] = useState<{ adSoyad: string; email: string; doktorAdi: string } | null>(null);
  const [hataMesaji, setHataMesaji] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreTekrar, setSifreTekrar] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [formHata, setFormHata] = useState('');

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const r = await fetch(`/api/personel/davet/${encodeURIComponent(token)}`);
        const d = await r.json();
        if (!r.ok) { setHataMesaji(d.error || 'Davet bulunamadı.'); setDurum('gecersiz'); return; }
        setBilgi(d);
        setDurum('gecerli');
      } catch {
        setHataMesaji('Davet doğrulanamadı. Bağlantınızı kontrol edin.');
        setDurum('gecersiz');
      }
    })();
  }, [token]);

  async function kabulEt(e: React.FormEvent) {
    e.preventDefault();
    setFormHata('');
    if (sifre.length < 8) { setFormHata('Şifre en az 8 karakter olmalıdır.'); return; }
    if (sifre !== sifreTekrar) { setFormHata('Şifreler eşleşmiyor.'); return; }
    setGonderiliyor(true);
    try {
      const r = await fetch('/api/personel/kabul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, sifre }),
      });
      const d = await r.json();
      if (!r.ok) { setFormHata(d.error || 'Hesap oluşturulamadı.'); return; }
      setDurum('tamamlandi');
      setTimeout(() => router.push('/giris/doktor'), 2000);
    } catch {
      setFormHata('Hesap oluşturulamadı. Bağlantınızı kontrol edin.');
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <div style={{ backgroundColor: '#0A1628', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="ni-card" style={{ width: '100%', maxWidth: 420 }}>
        {durum === 'yukleniyor' && <p style={{ color: '#64748B' }}>Davet kontrol ediliyor…</p>}

        {durum === 'gecersiz' && (
          <>
            <h3 className="ni-h3">Davet Kullanılamıyor</h3>
            <div className="ni-error">{hataMesaji}</div>
          </>
        )}

        {durum === 'gecerli' && bilgi && (
          <>
            <h3 className="ni-h3">Sekreter Daveti</h3>
            <p style={{ fontSize: 14, color: 'rgba(10,22,40,0.7)', marginBottom: 16 }}>
              Merhaba <strong>{bilgi.adSoyad}</strong>, <strong>{bilgi.doktorAdi}</strong> sizi Notya üzerinde sekreter olarak
              çalışmaya davet etti. Randevuları görüp yönetebileceksiniz. Devam etmek için bir şifre belirleyin.
            </p>
            <form onSubmit={kabulEt}>
              <div className="ni-field">
                <label className="ni-label">E-posta</label>
                <input className="ni-input" value={bilgi.email} disabled />
              </div>
              <div className="ni-field">
                <label className="ni-label">Şifre *</label>
                <input className="ni-input" type="password" value={sifre} onChange={(e) => setSifre(e.target.value)} placeholder="En az 8 karakter" />
              </div>
              <div className="ni-field">
                <label className="ni-label">Şifre (tekrar) *</label>
                <input className="ni-input" type="password" value={sifreTekrar} onChange={(e) => setSifreTekrar(e.target.value)} />
              </div>
              {formHata && <div className="ni-error">{formHata}</div>}
              <button type="submit" className="ni-btn" disabled={gonderiliyor}>
                {gonderiliyor ? 'Hesap oluşturuluyor…' : 'Hesabı Oluştur'}
              </button>
            </form>
          </>
        )}

        {durum === 'tamamlandi' && (
          <>
            <h3 className="ni-h3">Hesabınız Hazır ✓</h3>
            <p style={{ fontSize: 14, color: 'rgba(10,22,40,0.7)' }}>Giriş sayfasına yönlendiriliyorsunuz…</p>
          </>
        )}
      </div>
    </div>
  );
}
