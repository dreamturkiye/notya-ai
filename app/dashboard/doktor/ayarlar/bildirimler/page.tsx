'use client';
/**
 * HEKIM-PUSH (Kaan, 2026-11-25) — Ayarlar › Bildirimler: Sağlığım ev verisi uyarılarının hekimin telefonuna bildirimi.
 * Core: every branş (one doctor app). Component: components/doktor/HekimBildirimAyarlari.tsx.
 */
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme';
import HekimBildirimAyarlari from '@/components/doktor/HekimBildirimAyarlari';

export default function BildirimAyarPage() {
  return (
    <div>
      <a href="/dashboard/doktor/ayarlar" style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4, display: 'inline-block', textDecoration: 'none' }}>‹ Ayarlar</a>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, margin: '0 0 6px', color: '#2e251d', letterSpacing: '-0.02em' }}>Bildirimler</h1>
      <p style={{ fontSize: 14, color: CHROME_RENK.muted, marginBottom: 22 }}>Hastalarınızın Sağlığım’a girdiği acil ev ölçümleri ve uyarılar — telefonunuza, kendi çalışma saatlerinize göre.</p>
      <HekimBildirimAyarlari />
    </div>
  );
}
