'use client';

/**
 * NOTYA-RANDEVU-01 — personel (sekreter) yönetimi. Doktor bir sekreteri buradan davet eder;
 * davet linkini WhatsApp/SMS ile kendisi paylaşır (bkz. /api/doktor/personel — SMTP henüz
 * kurulmadığı için otomatik e-posta göndermiyoruz).
 */

import React, { useEffect, useState, useCallback } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';

export const dynamic = 'force-dynamic';

interface PersonelSatiri {
  id: string;
  adSoyad: string;
  email: string;
  rol: string;
  aktif: boolean;
  davetBeklemede: boolean;
  davetSuresiDoldu: boolean;
}

export default function PersonelPage() {
  const [liste, setListe] = useState<PersonelSatiri[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [adSoyad, setAdSoyad] = useState('');
  const [email, setEmail] = useState('');
  const [kaydediyor, setKaydediyor] = useState(false);
  const [sonDavetLinki, setSonDavetLinki] = useState<{ adSoyad: string; link: string } | null>(null);
  const [kopyalandi, setKopyalandi] = useState(false);

  const token = ensureDoctorAccessToken;

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    setHata('');
    try {
      const t = await token();
      if (!t) { setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return; }
      const r = await fetch('/api/doktor/personel', { headers: { Authorization: `Bearer ${t}` } });
      if (r.status === 403) { setHata('Bu sayfa yalnızca doktor hesabı içindir.'); setListe([]); return; }
      if (!r.ok) { setHata('Personel listesi alınamadı.'); return; }
      const d = await r.json();
      setListe(d.personel || []);
    } catch {
      setHata('Personel listesi alınamadı.');
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => { yukle(); }, [yukle]);

  async function davetGonder(e: React.FormEvent) {
    e.preventDefault();
    if (!adSoyad.trim() || !email.trim()) { setHata('Ad soyad ve e-posta zorunludur.'); return; }
    setKaydediyor(true);
    setHata('');
    setSonDavetLinki(null);
    try {
      const t = await token();
      if (!t) { setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return; }
      const r = await fetch('/api/doktor/personel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ adSoyad: adSoyad.trim(), email: email.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { setHata(d.error || 'Personel eklenemedi.'); return; }
      setSonDavetLinki({ adSoyad: adSoyad.trim(), link: d.davetLinki });
      setAdSoyad(''); setEmail('');
      await yukle();
    } catch {
      setHata('Personel eklenemedi. Bağlantınızı kontrol edin.');
    } finally {
      setKaydediyor(false);
    }
  }

  async function aktiflikDegistir(id: string, aktif: boolean) {
    try {
      const t = await token();
      if (!t) return;
      await fetch(`/api/doktor/personel/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ aktif }),
      });
      await yukle();
    } catch { /* ignore */ }
  }

  async function kaldir(id: string) {
    if (!confirm('Bu personeli tamamen kaldırmak istiyor musunuz?')) return;
    try {
      const t = await token();
      if (!t) return;
      await fetch(`/api/doktor/personel/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
      await yukle();
    } catch { /* ignore */ }
  }

  function linkiKopyala() {
    if (!sonDavetLinki) return;
    navigator.clipboard?.writeText(sonDavetLinki.link).then(() => {
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    });
  }

  return (
    <div style={{ backgroundColor: '#0A1628', minHeight: '100vh', color: 'white' }}>
      <DoktorNav />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 24 }}>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>Personel</h1>
        <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 20 }}>
          Sekreterinizi davet edin — randevularınızı sizin adınıza görüp yönetebilir. Klinik notlara, e-reçeteye ve SGK araçlarına erişemez.
        </p>

        {hata && <div className="ni-error" style={{ marginBottom: 16 }}>{hata}</div>}

        <form onSubmit={davetGonder} className="ni-card">
          <h3 className="ni-h3">Sekreter Davet Et</h3>
          <div className="ni-grid">
            <div className="ni-field">
              <label className="ni-label">Ad Soyad *</label>
              <input className="ni-input" value={adSoyad} onChange={(e) => setAdSoyad(e.target.value)} placeholder="Örn. Ayşe Yılmaz" />
            </div>
            <div className="ni-field">
              <label className="ni-label">E-posta *</label>
              <input className="ni-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sekreter@ornek.com" />
            </div>
          </div>
          <button type="submit" className="ni-btn" disabled={kaydediyor}>
            {kaydediyor ? 'Gönderiliyor…' : 'Davet Linki Oluştur'}
          </button>
        </form>

        {sonDavetLinki && (
          <div className="ni-card" style={{ marginTop: 12, borderColor: '#0F9B8E' }}>
            <h3 className="ni-h3">{sonDavetLinki.adSoyad} için davet hazır</h3>
            <p className="ni-hint" style={{ marginBottom: 8 }}>
              Bu linki WhatsApp veya SMS ile kendinize gönderin — 7 gün geçerlidir, tek kullanımlıktır.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="ni-input" readOnly value={sonDavetLinki.link} onFocus={(e) => e.target.select()} />
              <button type="button" onClick={linkiKopyala} className="ni-btn" style={{ width: 'auto', padding: '0 16px' }}>
                {kopyalandi ? 'Kopyalandı ✓' : 'Kopyala'}
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          {yukleniyor && <p style={{ color: '#94A3B8' }}>Yükleniyor…</p>}
          {!yukleniyor && liste.length === 0 && <p style={{ color: '#94A3B8' }}>Henüz personel eklenmedi.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {liste.map((p) => (
              <div key={p.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.adSoyad} <span style={{ fontWeight: 400, color: '#94A3B8', fontSize: 12 }}>· Sekreter</span></div>
                  <div style={{ fontSize: 13, color: '#94A3B8' }}>{p.email}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    {p.davetSuresiDoldu && <span style={{ color: '#EF4444' }}>Davetin süresi doldu</span>}
                    {!p.davetSuresiDoldu && p.davetBeklemede && <span style={{ color: '#F59E0B' }}>Davet bekleniyor</span>}
                    {!p.davetBeklemede && <span style={{ color: p.aktif ? '#22C55E' : '#64748B' }}>{p.aktif ? 'Aktif' : 'Pasif'}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {!p.davetBeklemede && (
                    <button type="button" onClick={() => aktiflikDegistir(p.id, !p.aktif)} style={aksiyonBtn}>
                      {p.aktif ? 'Pasif Yap' : 'Aktif Yap'}
                    </button>
                  )}
                  <button type="button" onClick={() => kaldir(p.id)} style={{ ...aksiyonBtn, color: '#EF4444' }}>Kaldır</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const aksiyonBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: 'none',
  color: '#CBD5E1',
  borderRadius: 8,
  padding: '6px 12px',
  fontSize: 12,
  cursor: 'pointer',
};
