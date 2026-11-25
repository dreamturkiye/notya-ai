'use client';
/**
 * HASTA-ALANI-MARKA (Kaan, 2026-11-25) — Ayarlar › Hasta Alanı Görünümü: the patient portal opens under the doctor's own
 * logo / photo / name. Core: every branş (one doctor app). Component: components/doktor/HastaAlaniGorunumuAyarlari.tsx.
 */
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme';
import HastaAlaniGorunumuAyarlari from '@/components/doktor/HastaAlaniGorunumuAyarlari';

export default function HastaAlaniAyarPage() {
  return (
    <div>
      <a href="/dashboard/doktor/ayarlar" style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4, display: 'inline-block', textDecoration: 'none' }}>‹ Ayarlar</a>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, margin: '0 0 6px', color: '#2e251d', letterSpacing: '-0.02em' }}>Hasta Alanı Görünümü</h1>
      <p style={{ fontSize: 14, color: CHROME_RENK.muted, marginBottom: 22, maxWidth: 640 }}>Hastalarınız Sağlığım’ı sizin adınızla, logonuzla ya da fotoğrafınızla açar — sizin hizmetiniz olarak.</p>
      <HastaAlaniGorunumuAyarlari />
    </div>
  );
}
