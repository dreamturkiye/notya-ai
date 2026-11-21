'use client';
/**
 * NOTYA-BELGE-DEID-03 — the standard quiet privacy line under a document that is read by the assistant: one line ("identity is hidden
 * in the copy sent for evaluation"), chips for what the on-device scan found, the non-blocking wrong-patient warning and — only when
 * masking failed on a Belgeler page — the doctor's attestation fallback. Copy comes from core/belgeler/deidMetin (country-aware).
 */
import React from 'react';
import { deIdMetin } from '@/core/belgeler/deidMetin';
import type { KimlikBulgulari } from '@/core/belgeler/kimlikMaske';

const chip: React.CSSProperties = { border: '1px solid rgba(0,0,0,0.15)', borderRadius: 10, padding: '1px 8px' };

export default function KimlikGizlemeSatiri({ bulgu, ad, yedekGerek, kimlikYok, onKimlikYok, renk = '#6b5d52', uyariRenk = '#a45b3e' }: {
  bulgu?: KimlikBulgulari | null; ad?: 'eslesir' | 'eslesmiyor' | 'belirsiz' | null; yedekGerek?: boolean; kimlikYok?: boolean; onKimlikYok?: (v: boolean) => void; renk?: string; uyariRenk?: string
}) {
  const m = deIdMetin(process.env.NOTYA_COUNTRY);
  return (
    <div style={{ marginTop: 8, fontSize: 12, color: renk }} data-kimlik-gizleme="">
      <div>{m.kopyadaGizli}</div>
      {bulgu && (bulgu.ad || bulgu.muayeneTarihi || bulgu.dogum || bulgu.protokol) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          {bulgu.ad && <span style={chip}>{m.chipAd}</span>}
          {bulgu.muayeneTarihi && <span style={chip}>{m.chipMuayene(bulgu.muayeneTarihi)}</span>}
          {bulgu.dogum && <span style={chip}>{m.chipDogum}</span>}
          {bulgu.protokol && <span style={chip}>{m.chipProtokol}</span>}
        </div>
      )}
      {ad === 'eslesmiyor' && <div style={{ color: uyariRenk, fontWeight: 700, marginTop: 4 }}>{m.adUyusmuyor}</div>}
      {yedekGerek && onKimlikYok && (
        <>
          <div style={{ color: uyariRenk, marginTop: 6 }}>{m.yedekUyari}</div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!kimlikYok} onChange={(e) => onKimlikYok(e.target.checked)} />
            <span>{m.yedekOnay}</span>
          </label>
        </>
      )}
    </div>
  );
}
