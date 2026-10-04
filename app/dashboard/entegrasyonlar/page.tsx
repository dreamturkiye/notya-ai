'use client';

export const dynamic = 'force-dynamic';

/**
 * NOTYA-FHIR-02 — Kurum Entegrasyonları paneli (P2). Yalnız ADMIN_EMAILS görür.
 * Kurum listesi + aktif/pasif anahtarı + kuyruk özeti + son denetim satırları.
 * Bilinçli olarak sade: bu bir işletme paneli, doktor yüzeyi değil.
 */

import { useEffect, useState } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { CHROME_RENK, CHROME_FONT, CHROME_FONT_HREF } from '@/lib/doktor/chromeTheme';

interface Kurum { id: string; ad: string; fhir_base_url: string; hedef: string; aktif: boolean }
interface Ozet { sent: number; failed: number; pending: number }
interface Denetim { islem: string; sonuc: string; detay: string | null; created_at: string; kurum_id: string | null }

export default function EntegrasyonlarPage() {
  const [kurumlar, setKurumlar] = useState<Kurum[]>([]);
  const [ozet, setOzet] = useState<Record<string, Ozet>>({});
  const [denetim, setDenetim] = useState<Denetim[]>([]);
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(true);

  async function yukle() {
    try {
      const token = await ensureDoctorAccessToken();
      const r = await fetch('/api/entegrasyon/yonetim', { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Yüklenemedi');
      setKurumlar(d.kurumlar || []);
      setOzet(d.ozet || {});
      setDenetim(d.denetim || []);
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Yüklenemedi');
    } finally {
      setYukleniyor(false);
    }
  }
  useEffect(() => { yukle(); }, []);

  async function anahtar(k: Kurum) {
    const token = await ensureDoctorAccessToken();
    await fetch('/api/entegrasyon/yonetim', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ kurumId: k.id, aktif: !k.aktif }),
    });
    yukle();
  }

  return (
    <div style={{ minHeight: '100dvh', background: CHROME_RENK.cream, color: CHROME_RENK.ink, fontFamily: CHROME_FONT.sans, padding: '28px 16px' }}>
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, fontFamily: CHROME_FONT.serif }}>Kurum Entegrasyonları</h1>
        <p style={{ color: CHROME_RENK.muted, fontSize: 13, margin: '6px 0 20px' }}>
          FHIR Gateway — onaylı notların hastane sistemlerine aktarımı. Yalnız aktif kurumlara veri gider.
        </p>
        {hata && <div style={{ background: 'rgba(164,91,62,0.08)', border: '1px solid rgba(164,91,62,0.25)', color: CHROME_RENK.warn, borderRadius: 12, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>{hata}</div>}
        {yukleniyor && <div style={{ color: CHROME_RENK.muted, fontSize: 13 }}>Yükleniyor…</div>}

        {kurumlar.map((k) => {
          const o = ozet[k.id] || { sent: 0, failed: 0, pending: 0 };
          return (
            <div key={k.id} style={{ background: CHROME_RENK.paper, border: `1px solid ${CHROME_RENK.border}`, boxShadow: '0 2px 10px rgba(58,44,34,0.08)', borderRadius: 14, padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{k.ad} <span style={{ fontSize: 11, fontWeight: 400, color: CHROME_RENK.muted }}>· {k.hedef}</span></div>
                <div style={{ fontSize: 11.5, color: CHROME_RENK.muted, marginTop: 3, wordBreak: 'break-all' }}>{k.fhir_base_url}</div>
                <div style={{ fontSize: 12, marginTop: 6 }}>
                  <span style={{ color: CHROME_RENK.pine }}>✓ {o.sent} gönderildi</span>
                  <span style={{ color: CHROME_RENK.warn, marginLeft: 10 }}>✕ {o.failed} hata</span>
                  <span style={{ color: '#8a6a1f', marginLeft: 10 }}>… {o.pending} beklemede</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => anahtar(k)}
                style={{ background: k.aktif ? 'rgba(47,67,52,0.1)' : 'transparent', border: `1px solid ${k.aktif ? 'rgba(47,67,52,0.4)' : 'rgba(58,44,34,0.2)'}`, color: k.aktif ? CHROME_RENK.pine : CHROME_RENK.ink, borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                {k.aktif ? 'AKTİF — kapat' : 'PASİF — aç'}
              </button>
            </div>
          );
        })}

        {denetim.length > 0 && (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '22px 0 8px', color: CHROME_RENK.ink }}>Son denetim kayıtları</h2>
            <div style={{ background: CHROME_RENK.paper, border: `1px solid ${CHROME_RENK.border}`, borderRadius: 12, padding: 12 }}>
              {denetim.map((d, i) => (
                <div key={i} style={{ fontSize: 12, color: CHROME_RENK.muted, padding: '5px 2px', borderBottom: i < denetim.length - 1 ? `1px solid ${CHROME_RENK.borderSoft}` : 'none' }}>
                  <span style={{ color: d.sonuc.startsWith('OK') || d.sonuc === 'ACILDI' ? CHROME_RENK.pine : d.sonuc === 'KAPATILDI' ? '#8a6a1f' : CHROME_RENK.warn, fontWeight: 600 }}>{d.sonuc === 'ACILDI' ? 'AÇILDI' : d.sonuc}</span>
                  {' '}· {d.islem} · {new Date(d.created_at).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}{d.detay ? ` · ${d.detay.slice(0, 80)}` : ''}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
