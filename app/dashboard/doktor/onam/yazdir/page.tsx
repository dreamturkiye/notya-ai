'use client';
/**
 * NOTYA-KD-02 — Printable onam (V1: browser print → PDF; e-imza later). Kadın Hastalıkları ve Doğum templates only.
 * The patient's name is typed by the doctor at print time (not fetched) so nothing identifying is in the URL.
 *
 * KD-OPERATOR-01 (Kaan, 2026-11-05): PROCEDURE-SPECIFIC CONSENT for the 16 operations of the operation-note templates
 * (`?islem=<key>`; lib/clinical/onamProsedurleri.ts gives the structure, specialties/kadin-dogum/engines/operatorMetinleri.ts
 * the Turkish words). The library's older "sezaryen" and "kolposkopi" forms now open the structured form (deepened, not
 * duplicated). Risks are named, grouped serious / frequent; their frequency is written on the form as discussed with the
 * patient (no number is invented). BELGE-NO-01: every form carries its document number and verify QR.
 */
import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ONAM_KUTUPHANESI } from '@/specialties/kadin-dogum/engines/dogum-spine';
import { KADIN_HASTALIKLARI_DOGUM_ETIKETI } from '@/lib/doktor/specialties';
import { onamGeriHref } from '@/lib/doktor/geriNavigasyon';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { ONAM_PROSEDURLERI, ONAM_YAPILARI, type OnamProseduru } from '@/lib/clinical/onamProsedurleri';
import { ONAM_EK_ISLEM_ADI, ONAM_KAYNAKLARI, ONAM_PROSEDUR, ONAM_RISK_ADI } from '@/specialties/kadin-dogum/engines/operatorMetinleri';
import BelgeKunyesi from '@/components/doktor/yazdir/BelgeKunyesi';

/** The library's older forms that the structured procedure form now replaces. */
const ESLEME: Record<string, OnamProseduru> = { sezaryen: 'sezaryen', kolposkopi: 'kolposkopi_leep' };

function Ust({ patientId, ad, setAd, hekim, setHekim }: { patientId: string | null; ad: string; setAd: (x: string) => void; hekim: string; setHekim: (x: string) => void }) {
  return (
    <>
      <style>{`@media print { .no-print { display: none } body { background: #fff } }`}</style>
      <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 16, fontFamily: 'system-ui', fontSize: 13, alignItems: 'center', flexWrap: 'wrap' }}>
        <a href={onamGeriHref(patientId)} style={{ color: CHROME_RENK.pine, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>{patientId ? '← Gebelik' : '← Geri'}</a>
        <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Hasta adı soyadı" style={{ padding: 6, flex: 1 }} />
        <input value={hekim} onChange={(e) => setHekim(e.target.value)} placeholder="Hekim" style={{ padding: 6, flex: 1 }} />
        <button type="button" onClick={() => window.print()} style={{ padding: '6px 14px', fontWeight: 700 }}>Yazdır / PDF</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M8 19c1.6-5.8 3.4-9.6 7.2-14.2.8 3.4.8 6.4-.2 9.2-1.5 2.4-4 4-7 5z" stroke="#6a7563" strokeWidth="1.3"/></svg>
        <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 11, color: '#6d6055' }}>Notya</span>
      </div>
    </>
  );
}

function Imzalar() {
  return (
    <div style={{ display: 'flex', gap: 40, marginTop: 40, fontSize: 12 }}>
      <div style={{ flex: 1 }}>Hasta / yasal temsilci imzası<br /><br />______________________</div>
      <div style={{ flex: 1 }}>Hekim imzası / kaşe<br /><br />______________________</div>
      <div style={{ flex: 1 }}>Tanık<br /><br />______________________</div>
    </div>
  );
}

function IslemOnami({ islem, patientId, ekKutu }: { islem: OnamProseduru; patientId: string | null; ekKutu?: string }) {
  const [ad, setAd] = useState('');
  const [hekim, setHekim] = useState('');
  const p = ONAM_PROSEDUR[islem];
  const y = ONAM_YAPILARI[islem];
  const satir = (k: string) => <tr key={k}><td style={{ padding: '3px 6px', borderBottom: '1px solid #e5e5e5' }}>{ONAM_RISK_ADI[k] || k}</td><td style={{ padding: '3px 6px', borderBottom: '1px solid #e5e5e5', width: 160 }}>______________</td></tr>;
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 32, fontFamily: 'Georgia, serif', color: '#111', background: '#fff' }}>
      <Ust patientId={patientId} ad={ad} setAd={setAd} hekim={hekim} setHekim={setHekim} />
      <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>{p.ad} — Bilgilendirilmiş Onam Formu</h1>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>Tarih: {new Date().toLocaleDateString('tr-TR')}</div>
      <BelgeKunyesi tur="onam" kaynakId={`onam:${islem}${patientId ? `:${patientId.slice(0, 8)}` : ''}`} hastaId={patientId} icerik={{ islem, p, y }} />
      <p style={{ fontSize: 13 }}><b>Hasta:</b> {ad || '______________________'} &nbsp; <b>Hekim:</b> {hekim || '______________________'}</p>
      <h2 style={{ fontSize: 15 }}>İşlem</h2><p style={{ fontSize: 13, lineHeight: 1.6 }}>{p.aciklama}</p>
      <h2 style={{ fontSize: 15 }}>Beklenen yararlar</h2><p style={{ fontSize: 13, lineHeight: 1.6 }}>{p.yararlar}</p>
      <h2 style={{ fontSize: 15 }}>Alternatifler</h2><p style={{ fontSize: 13, lineHeight: 1.6 }}>{p.alternatifler}</p>
      <h2 style={{ fontSize: 15 }}>Ciddi riskler</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr><th style={{ textAlign: 'left', padding: '3px 6px' }}>Risk</th><th style={{ textAlign: 'left', padding: '3px 6px' }}>Konuşulan sıklık</th></tr></thead><tbody>{y.ciddi.map(satir)}</tbody></table>
      <h2 style={{ fontSize: 15 }}>Sık görülen riskler</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><tbody>{y.sik.map(satir)}</tbody></table>
      <h2 style={{ fontSize: 15 }}>Gerekirse yapılabilecek ek işlemler</h2>
      <ul style={{ fontSize: 13, lineHeight: 1.6 }}>{y.ekIslemler.map((k) => <li key={k}>☐ {ONAM_EK_ISLEM_ADI[k] || k}</li>)}</ul>
      {ekKutu && <p style={{ fontSize: 13, border: '1px solid #999', padding: 8 }}>☐ {ekKutu}</p>}
      <p style={{ fontSize: 13 }}>Hekimime ek riskleri ve kendime özgü durumları sorabileceğim anlatıldı: ______________________________________________</p>
      <p style={{ fontSize: 13, marginTop: 16 }}>Yukarıdaki bilgileri okudum / bana okundu; sorularım yanıtlandı. İşlemi kendi isteğimle kabul ediyorum. İşlemden önce istediğim zaman vazgeçme hakkım olduğu anlatıldı.</p>
      <Imzalar />
      <p style={{ fontSize: 10, color: '#777', marginTop: 24 }}>Kaynak: {ONAM_KAYNAKLARI.map((k) => `${k.kurum}, ${k.belge} (${k.yil})`).join('; ')}. Form hekim tarafından hastaya açıklanarak kullanılır.</p>
    </div>
  );
}

function OnamYazdirIc() {
  const sp = useSearchParams();
  const patientId = sp.get('patientId');
  const kod = sp.get('kod') || '';
  const islemHam = sp.get('islem') || ESLEME[kod] || '';
  const s = ONAM_KUTUPHANESI.find((o) => o.kod === kod);
  const [ad, setAd] = useState('');
  const [hekim, setHekim] = useState('');
  if ((ONAM_PROSEDURLERI as readonly string[]).includes(islemHam)) return <IslemOnami islem={islemHam as OnamProseduru} patientId={patientId} ekKutu={s?.ekKutu} />;
  if (!s) return <div style={{ padding: 24, fontFamily: 'system-ui' }}>Onam şablonu bulunamadı. <a href={onamGeriHref(patientId)}>← Geri</a></div>;
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 32, fontFamily: 'Georgia, serif', color: '#111', background: '#fff' }}>
      <Ust patientId={patientId} ad={ad} setAd={setAd} hekim={hekim} setHekim={setHekim} />
      <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>{s.ad}</h1>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>Bilgilendirilmiş Onam Formu · Tarih: {new Date().toLocaleDateString('tr-TR')}</div>
      <BelgeKunyesi tur="onam" kaynakId={`onam:${s.kod}${patientId ? `:${patientId.slice(0, 8)}` : ''}`} hastaId={patientId} icerik={s} />
      <p style={{ fontSize: 13 }}><b>Hasta:</b> {ad || '______________________'} &nbsp; <b>Hekim:</b> {hekim || '______________________'}</p>
      <h2 style={{ fontSize: 15 }}>Bilgilendirme</h2>
      <ol style={{ fontSize: 13, lineHeight: 1.6 }}>{s.maddeler.map((m, i) => <li key={i}>{m}</li>)}</ol>
      <h2 style={{ fontSize: 15 }}>Olası riskler</h2>
      <ul style={{ fontSize: 13, lineHeight: 1.6 }}>{s.riskler.map((r, i) => <li key={i}>{r}</li>)}</ul>
      {s.ekKutu && <p style={{ fontSize: 13, border: '1px solid #999', padding: 8 }}>☐ {s.ekKutu}</p>}
      <p style={{ fontSize: 13, marginTop: 16 }}>Yukarıdaki bilgileri okudum / bana okundu; sorularım yanıtlandı. İşlemi kendi isteğimle kabul ediyorum. İstediğim zaman vazgeçme hakkım olduğu anlatıldı.</p>
      <Imzalar />
      <p style={{ fontSize: 10, color: '#777', marginTop: 24 }}>Notya — {KADIN_HASTALIKLARI_DOGUM_ETIKETI} onam kütüphanesi (TJOD tarzı). Bu form hekim tarafından hastaya açıklanarak kullanılır; yapay zekâ tanı koymaz.</p>
    </div>
  );
}

export default function OnamYazdirPage() { return <Suspense fallback={null}><OnamYazdirIc /></Suspense>; }
