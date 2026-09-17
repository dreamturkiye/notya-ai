'use client';
/**
 * NOTYA-KD-02 — Printable onam (V1: browser print → PDF; e-imza later). Kadın-doğum templates only.
 * The patient's name is typed by the doctor at print time (not fetched) so nothing identifying is in the URL.
 */
import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ONAM_KUTUPHANESI } from '@/specialties/kadin-dogum/engines/dogum-spine';
import { onamGeriHref } from '@/lib/doktor/geriNavigasyon';

function OnamYazdirIc() {
  const sp = useSearchParams();
  const s = ONAM_KUTUPHANESI.find((o) => o.kod === (sp.get('kod') || ''));
  const patientId = sp.get('patientId');
  const [ad, setAd] = useState('');
  const [hekim, setHekim] = useState('');
  if (!s) return <div style={{ padding: 24, fontFamily: 'system-ui' }}>Onam şablonu bulunamadı. <a href={onamGeriHref(patientId)}>← Geri</a></div>;
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 32, fontFamily: 'Georgia, serif', color: '#111', background: '#fff' }}>
      <style>{`@media print { .no-print { display: none } body { background: #fff } }`}</style>
      <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 16, fontFamily: 'system-ui', fontSize: 13, alignItems: 'center', flexWrap: 'wrap' }}>
        <a href={onamGeriHref(patientId)} style={{ color: '#0F9B8E', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>{patientId ? '← Gebelik' : '← Geri'}</a>
        <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Hasta adı soyadı" style={{ padding: 6, flex: 1 }} />
        <input value={hekim} onChange={(e) => setHekim(e.target.value)} placeholder="Hekim" style={{ padding: 6, flex: 1 }} />
        <button type="button" onClick={() => window.print()} style={{ padding: '6px 14px', fontWeight: 700 }}>Yazdır / PDF</button>
      </div>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>{s.ad}</h1>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 16 }}>Bilgilendirilmiş Onam Formu · Tarih: {new Date().toLocaleDateString('tr-TR')}</div>
      <p style={{ fontSize: 13 }}><b>Hasta:</b> {ad || '______________________'} &nbsp; <b>Hekim:</b> {hekim || '______________________'}</p>
      <h2 style={{ fontSize: 15 }}>Bilgilendirme</h2>
      <ol style={{ fontSize: 13, lineHeight: 1.6 }}>{s.maddeler.map((m, i) => <li key={i}>{m}</li>)}</ol>
      <h2 style={{ fontSize: 15 }}>Olası riskler</h2>
      <ul style={{ fontSize: 13, lineHeight: 1.6 }}>{s.riskler.map((r, i) => <li key={i}>{r}</li>)}</ul>
      {s.ekKutu && <p style={{ fontSize: 13, border: '1px solid #999', padding: 8 }}>☐ {s.ekKutu}</p>}
      <p style={{ fontSize: 13, marginTop: 16 }}>Yukarıdaki bilgileri okudum / bana okundu; sorularım yanıtlandı. İşlemi kendi isteğimle kabul ediyorum. İstediğim zaman vazgeçme hakkım olduğu anlatıldı.</p>
      <div style={{ display: 'flex', gap: 40, marginTop: 40, fontSize: 12 }}>
        <div style={{ flex: 1 }}>Hasta / yasal temsilci imzası<br /><br />______________________</div>
        <div style={{ flex: 1 }}>Hekim imzası / kaşe<br /><br />______________________</div>
        <div style={{ flex: 1 }}>Tanık<br /><br />______________________</div>
      </div>
      <p style={{ fontSize: 10, color: '#777', marginTop: 24 }}>Notya — kadın-doğum onam kütüphanesi (TJOD tarzı). Bu form hekim tarafından hastaya açıklanarak kullanılır; yapay zekâ tanı koymaz.</p>
    </div>
  );
}

export default function OnamYazdirPage() { return <Suspense fallback={null}><OnamYazdirIc /></Suspense>; }
