'use client';

/**
 * ASI-KARNESI-01 (C7) + NOTYA-ASI-GOZLEM-01 — hasta dosyası › Aşılar.
 *
 * İlk adım: "Aşı karnesi gözlemle" → salt-okunur rapor sayfası
 * (/dashboard/doktor/hastalar/[id]/asi-karnesi). PDF indir / Paylaş / Yazdır o sayfada.
 * Sağlığım'daki karneyle AYNI içerik (lib/asi/karneSunucu + karnePdf) — ikinci şablon yok.
 */

import React from 'react';
import Link from 'next/link';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const dugme: React.CSSProperties = {
  background: '#0F9B8E',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  minHeight: 40,
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
};

export default function AsiKarnesiEylemleri({ patientId, kayitSayisi }: { patientId: string; kayitSayisi: number }) {
  if (kayitSayisi === 0) return null;
  return (
    <div data-asi-karnesi-eylemleri="" style={{ background: '#F6F0E4', borderRadius: 12, padding: 12, marginBottom: 16, display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#3b2e24' }}>Aşı karnesi (Sağlığım&apos;dakiyle aynı)</div>
        <Link
          href={`/dashboard/doktor/hastalar/${encodeURIComponent(patientId)}/asi-karnesi`}
          data-asi-karnesi-gozlemle=""
          style={dugme}
        >
          Aşı karnesi gözlemle
        </Link>
      </div>
      <div style={{ fontSize: 12, color: CHROME_RENK.muted }}>
        Revize edilemeyen rapor görünümü — PDF indirme o sayfada.
      </div>
    </div>
  );
}
