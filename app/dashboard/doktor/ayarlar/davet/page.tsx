'use client';
/**
 * REFERANS-01 (Kaan, 2026-11-05) — Ayarlar › Hekim davet programı. The doctor's own code (NTY-XXXX), the sign-up link
 * and its QR code, and plain counts. Copy without overclaiming: one free month for both, after the invited doctor's
 * first paid month; the free trial needs no card and no code.
 */
import React, { useEffect, useState } from 'react';
import QrKod from '@/components/belge/QrKod';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme';
import { panoyaKopyala } from '@/lib/doktor/aracUi';

type Ozet = { kod: string; adres: string; davet: number; odeyen: number; verilen: number; son12ay: number; bekleyen: number; sinir: number };

export default function DavetSayfasi() {
  const [o, setO] = useState<Ozet | null>(null);
  const [hata, setHata] = useState('');
  const [kopya, setKopya] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        const r = await fetch('/api/referans', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Yüklenemedi');
        setO(j);
      } catch (e) { setHata(e instanceof Error ? e.message : 'Yüklenemedi'); }
    })();
  }, []);
  const kart: React.CSSProperties = { background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, padding: 18, marginBottom: 16, boxShadow: '0 8px 18px rgba(58,44,34,0.045)' };
  const dugme: React.CSSProperties = { background: CHROME_RENK.pine, border: 'none', color: '#FAF8F4', borderRadius: 999, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' };
  const kopyala = async (metin: string, ne: string) => { if (await panoyaKopyala(metin)) { setKopya(ne); setTimeout(() => setKopya(''), 2000); } };
  return (
    <div style={{ maxWidth: 560 }}>
      <a href="/dashboard/doktor/ayarlar" style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', textDecoration: 'none' }}>‹ Ayarlar</a>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 30, margin: '4px 0 6px', color: '#2e251d' }}>Hekim davet programı</h1>
      <p style={{ fontSize: 14, color: CHROME_RENK.muted, marginBottom: 20, lineHeight: 1.5 }}>Bir meslektaşınız davet bağlantınızla kaydolup ilk ücretli ayını ödediğinde, ikinize de bir ay ücretsiz kullanım tanımlanır: her biriniz için kendi planınızın bir aylık tutarı, sonraki faturanızdan düşülür. Ücretsiz deneme için kart ya da kod gerekmez.</p>
      {hata && <p style={{ color: CHROME_RENK.warn }}>{hata}</p>}
      {!o && !hata && <p style={{ color: CHROME_RENK.muted }}>Yükleniyor…</p>}
      {o && (
        <>
          <div style={{ ...kart, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            <QrKod metin={o.adres} boyut={132} etiket="Davet bağlantısı karekodu" />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 12, color: CHROME_RENK.muted }}>Davet kodunuz</div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 26, fontWeight: 700, letterSpacing: '0.06em', color: '#2e251d' }}>{o.kod}</div>
              <div style={{ fontSize: 12, color: CHROME_RENK.muted, wordBreak: 'break-all', margin: '6px 0 10px' }}>{o.adres}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" style={dugme} onClick={() => kopyala(o.adres, 'bağlantı')}>Bağlantıyı kopyala</button>
                <button type="button" style={{ ...dugme, background: 'transparent', color: CHROME_RENK.ink, border: `1px solid ${CHROME_RENK.border}` }} onClick={() => kopyala(o.kod, 'kod')}>Kodu kopyala</button>
              </div>
              {kopya && <div style={{ fontSize: 12, color: '#2E6E4E', marginTop: 6 }}>✓ {kopya === 'kod' ? 'Kod' : 'Bağlantı'} kopyalandı</div>}
            </div>
          </div>
          <div style={kart}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: CHROME_RENK.ink }}>Durum</div>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: CHROME_RENK.ink }}>
              Bağlantınızla kaydolan hekim: <b>{o.davet}</b><br />
              İlk ücretli ayını ödeyen: <b>{o.odeyen}</b><br />
              Size tanımlanan ücretsiz ay: <b>{o.verilen}</b>{o.bekleyen ? ` (işlenmeyi bekleyen: ${o.bekleyen})` : ''}<br />
              Son 12 ayda: <b>{o.son12ay}</b> / {o.sinir}
            </div>
            <p style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 10, lineHeight: 1.5 }}>Bir hekim 12 ayda en fazla {o.sinir} ücretsiz ay kazanabilir. Kendi hesabınız, aynı e-posta, aynı klinik veya aynı ödeme kartıyla yapılan davetler sayılmaz. Ücretsiz ayınız henüz ücretli bir aboneliğiniz yoksa, ilk faturanız ödendiğinde tanımlanır.</p>
          </div>
        </>
      )}
    </div>
  );
}
