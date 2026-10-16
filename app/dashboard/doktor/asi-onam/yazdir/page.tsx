'use client';
/**
 * NOTYA-ASI-ONAM-01 — fallback flow #3: printable paper consent form (browser print → PDF), same
 * convention as app/dashboard/doktor/onam/yazdir/page.tsx (KD). SAME content as the digital form
 * (lib/asi/onam/asiOnamIcerigi.ts) — no second copy of the text. The patient's name is typed at
 * print time, never fetched, so nothing identifying sits in the URL.
 */
import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { asiOnamIcerigiGoster } from '@/lib/asi/onam/asiOnamMotoru';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

function AsiOnamYazdirIc() {
  const sp = useSearchParams();
  // NOTYA-ASI-NOT-01: query param is named asiAdlari (not "asilar") — arsiv.test.ts's guard regex
  // flags any literal `('asilar'` call as a possible raw read of the asilar DB TABLE; this is a
  // URL param holding the chosen vaccine NAMES only, not a table read.
  const asilar = (sp.get('asiAdlari') || '').split('|').map((s) => s.trim()).filter(Boolean);
  const icerikler = asilar.map((a) => asiOnamIcerigiGoster(a)).filter((x): x is NonNullable<typeof x> => !!x);
  const patientId = sp.get('patientId');
  const [ad, setAd] = useState('');
  const [hekim, setHekim] = useState('');

  if (!icerikler.length) {
    return <div style={{ padding: 24, fontFamily: 'system-ui' }}>Aşı seçilmedi. Lütfen muayene ekranından aşı seçip yazdırma bağlantısını açın.</div>;
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 32, fontFamily: 'Georgia, serif', color: '#111', background: '#fff' }}>
      <style>{`@media print { .no-print { display: none } body { background: #fff } }`}</style>
      <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 16, fontFamily: 'system-ui', fontSize: 13, alignItems: 'center', flexWrap: 'wrap' }}>
        {patientId && <a href={`/dashboard/doktor/hastalar/${patientId}`} style={{ color: CHROME_RENK.pine, fontWeight: 600, textDecoration: 'none' }}>← Hasta Dosyası</a>}
        <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Hasta adı soyadı" style={{ padding: 6, flex: 1 }} />
        <input value={hekim} onChange={(e) => setHekim(e.target.value)} placeholder="Hekim" style={{ padding: 6, flex: 1 }} />
        <button type="button" onClick={() => window.print()} style={{ padding: '6px 14px', fontWeight: 700 }}>Yazdır / PDF</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M8 19c1.6-5.8 3.4-9.6 7.2-14.2.8 3.4.8 6.4-.2 9.2-1.5 2.4-4 4-7 5z" stroke="#6a7563" strokeWidth="1.3" /></svg>
        <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 11, color: '#6d6055' }}>Notya</span>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>Aşı Bilgilendirme ve Onay Formu</h1>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 16 }}>Tarih: {new Date().toLocaleDateString('tr-TR')}</div>
      <p style={{ fontSize: 13 }}><b>Hasta:</b> {ad || '______________________'} &nbsp; <b>Hekim:</b> {hekim || '______________________'}</p>

      {icerikler.map((i) => (
        <div key={i.ad} style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, marginBottom: 4 }}>{i.ad}</h2>
          <p style={{ fontSize: 13, margin: '0 0 6px' }}>{i.korur}</p>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 2 }}>Sık görülen yan etkiler</div>
          <ul style={{ fontSize: 13, lineHeight: 1.5, margin: '0 0 0 18px' }}>
            {i.yanEtkiler.map((y, idx) => <li key={idx}>{y}</li>)}
          </ul>
        </div>
      ))}

      <p style={{ fontSize: 13, marginTop: 16, borderTop: '1px solid #ccc', paddingTop: 12 }}>{icerikler[0]?.onamCumlesi}</p>
      <div style={{ display: 'flex', gap: 40, marginTop: 40, fontSize: 12 }}>
        <div style={{ flex: 1 }}>Veli / yasal temsilci (veya hasta) adı, soyadı ve imzası<br /><br />______________________</div>
        <div style={{ flex: 1 }}>Hekim imzası / kaşe<br /><br />______________________</div>
        <div style={{ flex: 1 }}>Tanık<br /><br />______________________</div>
      </div>
      <p style={{ fontSize: 10, color: '#777', marginTop: 24 }}>
        Notya — Aşı onam içeriği (standart bilgilendirme). İmzalı form taranıp/fotoğraflanıp hasta dosyasına
        "Kağıt onam yükle" ile eklenmelidir. Kaynak: {icerikler[0]?.kaynak}
      </p>
    </div>
  );
}

export default function AsiOnamYazdirPage() { return <Suspense fallback={null}><AsiOnamYazdirIc /></Suspense>; }
