'use client';
/**
 * AMELIYAT-NOTU-01 / KD-RAPOR-01 — the A4 letterhead page every new printout of the patient file uses (operation note,
 * USG / NST reports, doğum epikrizi). Same paper language as the Gebe İzlem Kartı (NOTYA-KHD-04): the doctor's own
 * letterhead lines and logo, the doctor's name WITH THE STORED TITLE (OP-DR-01, server-side hekimAdi), diploma number,
 * the patient's name and birth date, a print bar hidden on paper. Words arrive as props; this file only draws.
 */
import React from 'react';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import BelgeKunyesi from './BelgeKunyesi';
import type { BelgeTuru } from '@/lib/belge/belge';

/** BELGE-NO-01: the document this page prints (number, revision, verify QR). */
export type YazdirBelgesi = { tur: BelgeTuru; kaynakId: string; hastaId?: string | null; icerik: unknown };

export type Antet = { hastaAd: string; dogumTarihi: string | null; hekim: string; satirlar: string[]; logoDataUrl: string; diplomaNo: string };

export const yazdirTarih = (iso: string | null | undefined) => (iso ? new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }) : '—');
export const KAGIT = {
  H: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #ccc', paddingBottom: 4, margin: '16px 0 8px' } as React.CSSProperties,
  TH: { textAlign: 'left', fontSize: 11, color: '#555', padding: '4px 6px', borderBottom: '1px solid #999' } as React.CSSProperties,
  TD: { fontSize: 11.5, padding: '4px 6px', borderBottom: '1px solid #e5e5e5', verticalAlign: 'top' } as React.CSSProperties,
  P: { fontSize: 12, lineHeight: 1.5, margin: '0 0 6px', whiteSpace: 'pre-wrap' } as React.CSSProperties,
};

export function AntetliKagit({ baslik, antet, geriHref, geriEtiket, tarih, altBilgi, belge, children }: {
  baslik: string; antet: Antet; geriHref: string; geriEtiket: string; tarih?: string | null; altBilgi?: string; belge?: YazdirBelgesi; children: React.ReactNode
}) {
  return (
    <div style={{ background: 'white', color: '#111', minHeight: '100vh', fontFamily: 'Georgia, "Times New Roman", serif' }}>
      <style>{`@media print { .yazdirma-gizle { display: none !important; } body { -webkit-print-color-adjust: exact; } @page { size: A4; margin: 14mm; } }`}</style>
      <div className="yazdirma-gizle" style={{ background: '#F6F0E4', borderBottom: '1px solid rgba(58,44,34,0.1)', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href={geriHref} style={{ color: CHROME_RENK.muted, fontFamily: 'system-ui', fontSize: 13, textDecoration: 'none' }}>← {geriEtiket}</a>
          <span style={{ color: '#2e251d', fontFamily: 'system-ui', fontSize: 14, fontWeight: 700 }}>{baslik} · {antet.hastaAd || 'Hasta'}</span>
        </span>
        <button type="button" onClick={() => window.print()} style={{ background: CHROME_RENK.pine, border: 'none', color: '#FAF8F4', borderRadius: 8, padding: '10px 18px', fontFamily: 'system-ui', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>🖨️ Yazdır / PDF (A4)</button>
      </div>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '24px 28px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, borderBottom: '2px solid #222', paddingBottom: 10 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {antet.logoDataUrl ? <img src={antet.logoDataUrl} alt="" style={{ maxHeight: 64, maxWidth: 140, objectFit: 'contain' }} /> : null}
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{antet.hekim || 'Dr.'}</div>
              {antet.satirlar.map((s, i) => <div key={i} style={{ fontSize: 11.5, color: '#333' }}>{s}</div>)}
              {antet.diplomaNo ? <div style={{ fontSize: 11, color: '#555' }}>Diploma Tescil No: {antet.diplomaNo}</div> : null}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12 }}>
            <div><b>Hasta:</b> {antet.hastaAd || '—'}</div>
            <div><b>Doğum tarihi:</b> {yazdirTarih(antet.dogumTarihi)}</div>
            <div><b>Tarih:</b> {yazdirTarih(tarih || new Date().toISOString())}</div>
          </div>
        </div>
        <h1 style={{ fontSize: 19, textAlign: 'center', margin: '14px 0 6px', letterSpacing: '0.04em' }}>{baslik}</h1>
        {belge ? <BelgeKunyesi {...belge} /> : null}
        {children}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 36 }}>
          <div style={{ borderTop: '1px solid #333', width: 240, paddingTop: 4, fontSize: 12, textAlign: 'center' }}>{antet.hekim || 'Dr.'} — İmza / Kaşe</div>
        </div>
        {altBilgi ? <p style={{ fontSize: 10, color: '#666', marginTop: 18 }}>{altBilgi}</p> : null}
      </div>
    </div>
  );
}
