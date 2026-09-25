'use client';
/**
 * NOTYA-GELEN-BELGELER — Ayarlar › Gelen Belgeler: one switch, "Sekreterim gelen belgeleri görebilir ve dosyalayabilir".
 * DECIDED (Kaan, 2026-09-25): off by default — incoming documents are doctor-only until the doctor turns it on.
 * The server enforces it (lib/gelenBelgeler/yetki.ts); this page only sets it.
 */
import { useEffect, useState } from 'react';
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme';
import { gelenIstek, GelenHatasi } from '@/lib/gelenBelgeler/istemci';

const R = CHROME_RENK;

export default function GelenBelgeAyarPage() {
  const [ayar, setAyar] = useState<{ acik: boolean; kaydedilebilir: boolean } | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState('');

  useEffect(() => {
    gelenIstek<{ acik: boolean; kaydedilebilir: boolean }>('/api/doktor/gelen-belgeler/ayar')
      .then(setAyar)
      .catch(() => setAyar({ acik: false, kaydedilebilir: false }));
  }, []);

  const degistir = async (acik: boolean) => {
    setKaydediliyor(true); setHata('');
    try {
      await gelenIstek('/api/doktor/gelen-belgeler/ayar', { method: 'POST', govde: { acik } });
      setAyar((a) => (a ? { ...a, acik } : a));
    } catch (e) {
      setHata(e instanceof GelenHatasi ? e.message : 'Kaydedilemedi.');
    } finally {
      setKaydediliyor(false);
    }
  };

  return (
    <div>
      <a href="/dashboard/doktor/ayarlar" style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4, display: 'inline-block', textDecoration: 'none' }}>‹ Ayarlar</a>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, margin: '0 0 6px', color: '#2e251d', letterSpacing: '-0.02em' }}>Gelen Belgeler</h1>
      <p style={{ fontSize: 14, color: R.muted, marginBottom: 22, maxWidth: 640 }}>
        Gelen belgeleri varsayılan olarak yalnızca siz görürsünüz. İsterseniz sekreterinizin de görüp hasta dosyasına eklemesine izin verebilirsiniz.
      </p>
      <div style={{ maxWidth: 640, background: '#FFFFFF', border: `1px solid ${R.border}`, borderRadius: 16, padding: '16px 18px', boxShadow: '0 8px 18px rgba(58,44,34,0.045)', fontFamily: CHROME_FONT.sans }}>
        {ayar && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 44, cursor: ayar.kaydedilebilir ? 'pointer' : 'default' }}>
            <span style={{ flex: 1, fontSize: 15, color: R.ink, fontWeight: 600 }}>Sekreterim gelen belgeleri görebilir ve dosyalayabilir</span>
            <input
              type="checkbox"
              role="switch"
              aria-checked={ayar.acik}
              checked={ayar.acik}
              disabled={!ayar.kaydedilebilir || kaydediliyor}
              onChange={(e) => void degistir(e.target.checked)}
              style={{ width: 22, height: 22, accentColor: R.pine }}
            />
          </label>
        )}
        {ayar && !ayar.kaydedilebilir && <div style={{ fontSize: 12, color: R.muted, marginTop: 6 }}>Bu ayar kısa süre içinde buradan değiştirilebilecek.</div>}
        {hata && <div style={{ fontSize: 13, color: R.warn, marginTop: 6 }}>{hata}</div>}
      </div>
    </div>
  );
}
