'use client';

export const dynamic = 'force-dynamic';

/**
 * NOTYA-FHIR-02 — Kurum Entegrasyonları paneli (P2). Yalnız ADMIN_EMAILS görür.
 * Kurum listesi + aktif/pasif anahtarı + kuyruk özeti + son denetim satırları.
 * Bilinçli olarak sade: bu bir işletme paneli, doktor yüzeyi değil.
 */

import { useEffect, useState } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';

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
    <div style={{ minHeight: '100vh', background: '#0A1628', color: '#EDF1F7', padding: '28px 16px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Kurum Entegrasyonları</h1>
        <p style={{ color: '#8FA0B5', fontSize: 13, margin: '6px 0 20px' }}>
          FHIR Gateway — onaylı notların hastane sistemlerine aktarımı. Yalnız aktif kurumlara veri gider.
        </p>
        {hata && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#FCA5A5', borderRadius: 12, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>{hata}</div>}
        {yukleniyor && <div style={{ color: '#8FA0B5', fontSize: 13 }}>Yükleniyor…</div>}

        {kurumlar.map((k) => {
          const o = ozet[k.id] || { sent: 0, failed: 0, pending: 0 };
          return (
            <div key={k.id} style={{ background: '#0D1C33', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{k.ad} <span style={{ fontSize: 11, fontWeight: 400, color: '#5F7189' }}>· {k.hedef}</span></div>
                <div style={{ fontSize: 11.5, color: '#8FA0B5', marginTop: 3, wordBreak: 'break-all' }}>{k.fhir_base_url}</div>
                <div style={{ fontSize: 12, marginTop: 6 }}>
                  <span style={{ color: '#2DD4BF' }}>✓ {o.sent} gönderildi</span>
                  <span style={{ color: '#FCA5A5', marginLeft: 10 }}>✕ {o.failed} hata</span>
                  <span style={{ color: '#FBBF24', marginLeft: 10 }}>… {o.pending} beklemede</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => anahtar(k)}
                style={{ background: k.aktif ? 'rgba(45,212,191,0.15)' : 'rgba(255,255,255,0.07)', border: `1px solid ${k.aktif ? 'rgba(45,212,191,0.5)' : 'rgba(255,255,255,0.16)'}`, color: k.aktif ? '#2DD4BF' : '#C9D4E3', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                {k.aktif ? 'AKTİF — kapat' : 'PASİF — aç'}
              </button>
            </div>
          );
        })}

        {denetim.length > 0 && (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '22px 0 8px', color: '#C9D4E3' }}>Son denetim kayıtları</h2>
            <div style={{ background: '#0D1C33', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
              {denetim.map((d, i) => (
                <div key={i} style={{ fontSize: 12, color: '#8FA0B5', padding: '5px 2px', borderBottom: i < denetim.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <span style={{ color: d.sonuc.startsWith('OK') || d.sonuc === 'ACILDI' ? '#2DD4BF' : d.sonuc === 'KAPATILDI' ? '#FBBF24' : '#FCA5A5', fontWeight: 600 }}>{d.sonuc}</span>
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
