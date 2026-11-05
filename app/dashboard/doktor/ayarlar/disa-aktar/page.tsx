'use client';
/**
 * HASTA-DISA-AKTAR-01 (Kaan, 2026-11-05) — Ayarlar › Hasta kayıtlarını dışa aktar. Settings only (no marketing, no landing
 * mention). One patient at a time: a PDF (the printable page, saved as PDF by the browser) and a structured data file
 * (FHIR R4 JSON). Only the doctor's own patients; every export is written to the audit log. Exporting every patient at
 * once is not offered yet (docs/OPEN-COMMITMENTS.md HASTA-DISA-AKTAR-01).
 */
import React, { useState } from 'react';
import { HastaSecici } from '@/lib/doktor/aracUi';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme';

export default function DisaAktarSayfasi() {
  const [hasta, setHasta] = useState('');
  const [durum, setDurum] = useState<'' | 'iniyor' | 'tamam' | 'hata'>('');
  const [hata, setHata] = useState('');
  async function jsonIndir() {
    if (!hasta) return;
    setDurum('iniyor'); setHata('');
    try {
      const t = await ensureDoctorAccessToken();
      const r = await fetch(`/api/doktor/hastalar/${encodeURIComponent(hasta)}/disa-aktar?bicim=json`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'Dışa aktarılamadı'); }
      const blob = await r.blob();
      const ad = /filename="([^"]+)"/.exec(r.headers.get('Content-Disposition') || '')?.[1] || 'notya-hasta.fhir.json';
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = ad; a.click(); URL.revokeObjectURL(a.href);
      setDurum('tamam');
    } catch (e) { setDurum('hata'); setHata(e instanceof Error ? e.message : 'Dışa aktarılamadı'); }
  }
  const kart: React.CSSProperties = { background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, padding: 18, marginBottom: 16, boxShadow: '0 8px 18px rgba(58,44,34,0.045)' };
  const dugme: React.CSSProperties = { background: CHROME_RENK.pine, border: 'none', color: '#FAF8F4', borderRadius: 999, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' };
  return (
    <div style={{ maxWidth: 560 }}>
      <a href="/dashboard/doktor/ayarlar" style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', textDecoration: 'none' }}>‹ Ayarlar</a>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 30, margin: '4px 0 6px', color: '#2e251d' }}>Hasta kayıtlarını dışa aktar</h1>
      <p style={{ fontSize: 14, color: CHROME_RENK.muted, marginBottom: 20, lineHeight: 1.5 }}>Kendi hastanızın onaylı muayene notlarını, aktif ilaçlarını ve ameliyat notlarını PDF veya yapılandırılmış veri (FHIR R4 uyumlu JSON) olarak indirin. Arşivlenmiş muayeneler ve T.C. kimlik numarası dışa aktarılmaz. Her dışa aktarım denetim kaydına yazılır.</p>
      <div style={kart}>
        <HastaSecici secili={hasta} sec={(id) => { setHasta(id); setDurum(''); }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          <a href={hasta ? `/dashboard/doktor/hastalar/${encodeURIComponent(hasta)}/disa-aktar/yazdir` : undefined} aria-disabled={!hasta} style={{ ...dugme, opacity: hasta ? 1 : 0.5, pointerEvents: hasta ? 'auto' : 'none' }}>PDF olarak hazırla</a>
          <button type="button" disabled={!hasta || durum === 'iniyor'} onClick={jsonIndir} style={{ ...dugme, background: 'transparent', color: CHROME_RENK.ink, border: `1px solid ${CHROME_RENK.border}`, opacity: hasta ? 1 : 0.5 }}>{durum === 'iniyor' ? 'Hazırlanıyor…' : 'Yapılandırılmış veri (JSON) indir'}</button>
        </div>
        {durum === 'tamam' && <p style={{ fontSize: 12, color: '#2E6E4E', marginTop: 8 }}>✓ Dosya indirildi.</p>}
        {durum === 'hata' && <p style={{ fontSize: 12, color: CHROME_RENK.warn, marginTop: 8 }}>{hata}</p>}
      </div>
    </div>
  );
}
