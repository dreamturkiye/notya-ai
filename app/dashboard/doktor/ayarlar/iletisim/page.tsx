'use client';
/**
 * NOTYA-ILETISIM-01 — Ayarlar › İletişim: hastalara kendi WhatsApp ve e-postanızdan tek dokunuşla yazın.
 */
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme';
import IletisimAyarKarti from '@/components/doktor/iletisim/IletisimAyarKarti';

export default function IletisimAyarPage() {
  return (
    <div>
      <a href="/dashboard/doktor/ayarlar" style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4, display: 'inline-block', textDecoration: 'none' }}>‹ Ayarlar</a>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, margin: '0 0 6px', color: '#2e251d', letterSpacing: '-0.02em' }}>İletişim</h1>
      <p style={{ fontSize: 14, color: CHROME_RENK.muted, marginBottom: 22 }}>WhatsApp ve e-posta — sizin hesaplarınızdan, tek dokunuşla.</p>
      <IletisimAyarKarti />
    </div>
  );
}
