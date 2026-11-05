'use client';
/**
 * HASTA-DISA-AKTAR-01 — the PDF form of one patient's exported record (printed by the browser). Opening it IS an export:
 * the route writes the audit row before it answers. BELGE-NO-01: the printout carries its document number and verify QR.
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import BelgeKunyesi from '@/components/doktor/yazdir/BelgeKunyesi';
import type { DisaAktarimVerisi } from '@/lib/doktor/hastaDisaAktarim';

const tarih = (x: string | null) => (x ? new Date(x.length === 10 ? `${x}T12:00:00Z` : x).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }) : '—');

export default function DisaAktarYazdir() {
  const p = useParams<{ id: string }>();
  const [v, setV] = useState<DisaAktarimVerisi | null>(null);
  const [hata, setHata] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        const r = await fetch(`/api/doktor/hastalar/${encodeURIComponent(p.id)}/disa-aktar?bicim=pdf`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Yüklenemedi');
        setV(j.veri);
      } catch (e) { setHata(e instanceof Error ? e.message : 'Yüklenemedi'); }
    })();
  }, [p.id]);
  if (hata) return <div style={{ padding: 24, fontFamily: 'system-ui' }}>{hata} <a href="/dashboard/doktor/ayarlar/disa-aktar">← Geri</a></div>;
  if (!v) return <div style={{ padding: 24, fontFamily: 'system-ui', color: '#666' }}>Hazırlanıyor…</div>;
  const H: React.CSSProperties = { fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #ccc', paddingBottom: 4, margin: '18px 0 8px' };
  return (
    <div style={{ background: '#fff', color: '#111', minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
      <style>{`@media print { .yazdirma-gizle { display: none !important; } @page { size: A4; margin: 14mm; } }`}</style>
      <div className="yazdirma-gizle" style={{ background: '#F6F0E4', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <a href="/dashboard/doktor/ayarlar/disa-aktar" style={{ color: CHROME_RENK.muted, fontFamily: 'system-ui', fontSize: 13, textDecoration: 'none' }}>← Dışa aktarım</a>
        <button type="button" onClick={() => window.print()} style={{ background: CHROME_RENK.pine, border: 'none', color: '#FAF8F4', borderRadius: 8, padding: '8px 16px', fontFamily: 'system-ui', fontWeight: 700, cursor: 'pointer' }}>🖨️ PDF olarak kaydet</button>
      </div>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '24px 28px 40px' }}>
        <h1 style={{ fontSize: 20, margin: '0 0 4px' }}>Hasta kaydı — dışa aktarım</h1>
        <div style={{ fontSize: 12, color: '#444' }}>Hasta: <b>{v.hasta.adSoyad}</b> · Doğum tarihi: {tarih(v.hasta.dogumTarihi)} · Hekim: {v.doktor.adSoyad} · Oluşturuldu: {new Date(v.olusturuldu).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}</div>
        <BelgeKunyesi tur="hasta_disa_aktarim" kaynakId={`disa:${p.id}`} hastaId={p.id} icerik={{ notlar: v.notlar, ilaclar: v.ilaclar, ameliyatlar: v.ameliyatlar }} />
        <div style={H}>Aktif ilaçlar</div>
        {v.ilaclar.length ? <ul style={{ fontSize: 12.5, margin: 0, paddingLeft: 18 }}>{v.ilaclar.map((i, k) => <li key={k}>{i.ad}{i.etken ? ` (${i.etken})` : ''}{i.baslangic ? ` — başlangıç ${tarih(i.baslangic)}` : ''}</li>)}</ul> : <p style={{ fontSize: 12.5 }}>—</p>}
        {v.ameliyatlar.length > 0 && <><div style={H}>Ameliyat notları</div>{v.ameliyatlar.map((a) => <p key={a.id} style={{ fontSize: 12.5, margin: '0 0 8px' }}><b>{tarih(a.tarih)} — {a.islem || 'Ameliyat'}</b>{a.bulgular ? <><br />Bulgular: {a.bulgular}</> : null}{a.komplikasyon ? <><br />Komplikasyon: {a.komplikasyon}</> : null}</p>)}</>}
        <div style={H}>Onaylı muayene notları ({v.notlar.length})</div>
        {v.notlar.map((n) => (
          <div key={n.id} style={{ marginBottom: 14, pageBreakInside: 'avoid' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{new Date(n.tarih).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}</div>
            {n.bolumler.map(([b, m]) => <p key={b} style={{ fontSize: 12.5, margin: '2px 0', whiteSpace: 'pre-wrap' }}><b>{b}:</b> {m}</p>)}
            {n.tanilar.length > 0 && <p style={{ fontSize: 12.5, margin: '2px 0' }}><b>ICD-10:</b> {n.tanilar.join('; ')}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
