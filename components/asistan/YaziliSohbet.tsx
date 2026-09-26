/**
 * NOTYA-KADEME-01 — Yazılı Ayşe (temel kademe yüzeyi).
 * Doktor MİKROFONLA konuşur (tarayıcı STT — ücretsiz), Ayşe YAZILI cevap verir:
 * ElevenLabs jetonu hiç yanmaz. Arkada /api/asistan/chat çalışır — yani hasta dosyası
 * bilinci, "son hastam" çözümleme, ilaç etkileşim uyarısı ve aksiyonlar TAMAMEN aktif.
 * Halka açılışta kademe planı: temel = bu yüzey; orta/pro = ElevenLabs sesli 1:1
 * (seans limitli). Kademe zorlaması abonelik lansmanında eklenecek — yetenek bugün herkese açık.
 *
 * NOTYA-ASISTAN-YUZEN-01: sohbet durumu (mesajlar, girdi, STT, ortak oturum) AsistanOturumContext'te —
 * doktor başka sayfaya geçince sohbet sürer. Bu bileşen yalnız görünüm.
 */
'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import HafifMarkdown from '@/components/asistan/HafifMarkdown';
import { EylemKarti, EylemToplu } from '@/components/core/EylemKarti';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import { useAsistanOturum } from '@/components/asistan/AsistanOturumContext';

export default function YaziliSohbet() {
  const { persona, yazili, setYaziliAcik, setYaziliGirdi, yaziliGonder, yaziliMikrofon } = useAsistanOturum();
  const { acik, mesajlar, girdi, bekliyor, dinliyor, aktifHasta } = yazili;
  const personaAdi = persona.shortName;
  const altRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!acik || mesajlar.length === 0) return;
    const t = setTimeout(() => altRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    return () => clearTimeout(t);
  }, [acik, mesajlar.length, bekliyor]);

  // NOTYA-YENI-GORUNUM-03 (Kaan, 2026-09-24): this panel was still fully dark-navy (#0D1C33 +
  // white-based translucent fills) -- the redesign never reached it, since it lives outside
  // app/dashboard/doktor and app/doktor-tools (the original audit's scope). Recolored to the same
  // light mint/teal "Ayşe" treatment used in HastaKonsult.tsx for visual consistency between the
  // two Ayşe chat surfaces.
  return (
    <div style={{ maxWidth: 560, margin: '18px auto 30px', padding: '0 16px', flexShrink: 0 }}>
      {!acik ? (
        <button
          type="button"
          onClick={() => setYaziliAcik(true)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', textAlign: 'center', lineHeight: 1.4, background: '#F0FDFA', border: '1px solid #99F6E4', color: '#0F9B8E', borderRadius: 14, padding: '13px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          💬 Yazılı sohbet — sesli sorun, {personaAdi} yazsın <span style={{ fontSize: 11, color: CHROME_RENK.muted }}>(hasta dosyası bilinciyle)</span>
        </button>
      ) : (
        <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: CHROME_RENK.ink }}>💬 Yazılı sohbet{aktifHasta ? <span style={{ fontWeight: 400, fontSize: 12, color: '#0F9B8E' }}> · aktif hasta: {aktifHasta}</span> : ''}</span>
            <span role="button" tabIndex={0} onClick={() => setYaziliAcik(false)} onKeyDown={(e) => { if (e.key === 'Enter') setYaziliAcik(false); }} style={{ fontSize: 12, color: CHROME_RENK.muted, cursor: 'pointer' }}>Kapat ✕</span>
          </div>
          {mesajlar.length === 0 && (
            <div style={{ fontSize: 12.5, color: CHROME_RENK.muted, lineHeight: 1.6, marginBottom: 10 }}>
              Hastanın adını söylemeniz yeterli: &ldquo;Mehmet Yılmaz kaç kez geldi?&rdquo;, &ldquo;son hastamın ilaçları neydi?&rdquo; — {personaAdi} dosyadan cevaplar, ilaç etkileşimlerinde kendiliğinden uyarır.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', marginBottom: 10 }}>
            {mesajlar.map((m) => (
              <div key={m.sira} style={{ alignSelf: m.rol === 'doktor' ? 'flex-end' : 'stretch', maxWidth: m.rol === 'doktor' ? '90%' : '100%', minWidth: 0 }}>
                <div style={{ display: 'inline-block', maxWidth: '100%', background: m.rol === 'doktor' ? '#0F9B8E' : '#FFFFFF', border: m.rol === 'doktor' ? 'none' : `1px solid ${CHROME_RENK.border}`, color: m.rol === 'doktor' ? '#fff' : CHROME_RENK.ink, borderRadius: 12, padding: '8px 12px', fontSize: 13.5, lineHeight: 1.55, whiteSpace: m.rol === 'doktor' ? 'pre-wrap' : 'normal', overflowWrap: 'anywhere' }}>{m.rol === 'asistan' ? <HafifMarkdown metin={m.icerik} /> : m.icerik}</div>
                {m.oneriler?.length && m.hasta ? (
                  m.oneriler.length > 1 ? <EylemToplu oneriler={m.oneriler} hasta={m.hasta} /> : <EylemKarti oneri={m.oneriler[0]} hasta={m.hasta} />
                ) : null}
                {m.yonlendirme?.yol && m.yonlendirme.etiket ? (
                  <div style={{ marginTop: 6 }}>
                    {/* NOTYA-ASISTAN-YUZEN-01: next/link — tam sayfa yüklemesi sohbeti öldürürdü. */}
                    <Link href={m.yonlendirme.yol} style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, color: '#0F9B8E', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>
                      {m.yonlendirme.etiket} ›
                    </Link>
                  </div>
                ) : null}
              </div>
            ))}
            {bekliyor && <div style={{ fontSize: 12, color: CHROME_RENK.muted }}>{personaAdi} dosyaya bakıyor…</div>}
            <div ref={altRef} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); void yaziliGonder(); }} style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={yaziliMikrofon}
              title={dinliyor ? 'Dinlemeyi durdur' : 'Sesle sorun'}
              style={{ width: 42, flexShrink: 0, background: dinliyor ? '#EF4444' : '#FFFFFF', border: `1px solid ${dinliyor ? '#EF4444' : CHROME_RENK.border}`, color: dinliyor ? 'white' : CHROME_RENK.ink, borderRadius: 10, fontSize: 16, cursor: 'pointer' }}
            >
              {dinliyor ? '⏹' : '🎤'}
            </button>
            <input
              value={girdi}
              onChange={(e) => setYaziliGirdi(e.target.value)}
              placeholder={dinliyor ? 'Dinliyorum…' : 'Sorunuzu yazın ya da 🎤 ile söyleyin'}
              style={{ flex: 1, minWidth: 0, background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, color: CHROME_RENK.ink, borderRadius: 10, padding: '10px 12px', fontSize: 14 }}
            />
            <button type="submit" disabled={bekliyor || !girdi.trim()} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 10, padding: '0 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: bekliyor || !girdi.trim() ? 0.5 : 1 }}>Sor</button>
          </form>
        </div>
      )}
    </div>
  );
}
