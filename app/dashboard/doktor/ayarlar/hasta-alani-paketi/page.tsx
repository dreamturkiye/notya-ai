'use client';
/**
 * BRANS-PAKETI Phase 2 (Kaan, 2026-11-27) — Ayarlar › Hasta alanı paketi: the treating doctor reviews, edits and accepts
 * the branş package templates (timestamped; nothing reaches a patient before acceptance) and manages one patient's
 * modules. Core page for every branş (the 30 medical branşlar here; Özel Branşlar also reach it from their tool).
 * Same component as Özel Branşlar › Hasta alanı paketi (components/klinik/BransPaketiYonetimi.tsx) — one product.
 */
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme';
import BransPaketiYonetimi from '@/components/klinik/BransPaketiYonetimi';

export default function HastaAlaniPaketiPage() {
  return (
    <div>
      <a href="/dashboard/doktor/ayarlar" style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4, display: 'inline-block', textDecoration: 'none' }}>‹ Ayarlar</a>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, margin: '0 0 6px', color: '#2e251d', letterSpacing: '-0.02em' }}>Hasta alanı paketi</h1>
      <p style={{ fontSize: 14, color: CHROME_RENK.muted, marginBottom: 22, maxWidth: 680 }}>Branşınıza özel bakım yolculuğu, günlükler ve kırmızı bayraklar. Şablonları inceleyip kabul ettiğinizde hastalarınızın Sağlığım sayfasında açılır; bayraklı kayıtlar size bildirilir.</p>
      <BransPaketiYonetimi />
    </div>
  );
}
