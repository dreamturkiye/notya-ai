'use client';
/**
 * KONSULTASYON-01 — kohort panellerinin ortak satırı: "Yanıt bekleyen konsültasyonlar (N gündür açık)".
 * YENİ ARAÇ DEĞİLDİR: her branşın MEVCUT kohort paneline (Araçlar › … kohort) takılır; branşa özgü kod yok.
 * Veri: GET /api/doktor/konsultasyon?bekleyen=1 (hekimin kendi satırları, kendi hastaları). SKS mantığıyla uyumlu:
 * en uzun bekleyen üstte + son 180 günün istem → yanıt medyanı (yalnız ölçüm, eşik değil).
 * Satırdan hasta dosyası › Konsültasyonlar'a gidilir; hatırlatma / yanıt ekleme orada, tek yerde.
 * KONSULTASYON-02: liste, sıra ve bekleme vurgusu lib/doktor/konsultasyon.ts'teki TEK tanımdan gelir
 * (bekleyenListesi / beklemeVurgusu) — Araçlar › Bekleyen Konsültasyonlar ile aynı veri, aynı eşik.
 */
import React, { useEffect, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { useAracStil, Rozet } from '@/lib/doktor/aracUi';
import { beklemeVurgusu, trGun, type BekleyenKonsultasyon } from '@/lib/doktor/konsultasyon';
import { BEKLEYEN_KONSULTASYONLAR_ROTASI, konsultasyonDosyaYolu } from '@/lib/doktor/konsultasyonIstemci';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

export type { BekleyenKonsultasyon };
export type YanitSuresi = { adet: number; medyanGun: number | null; enUzunGun: number | null }

/** Sunumsal kısım (SSR testi için ayrı). */
export function KonsultasyonKohortListesi({ bekleyenler, yanitSuresi, hazir = true }: { bekleyenler: BekleyenKonsultasyon[] | null; yanitSuresi?: YanitSuresi | null; hazir?: boolean }) {
  const stil = useAracStil();
  return (
    <div style={stil.kutu} data-konsultasyon-kohort="">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ ...stil.etiket, marginBottom: 0 }}>Yanıt bekleyen konsültasyonlar{bekleyenler ? ` (${bekleyenler.length})` : ''}</div>
        {yanitSuresi && yanitSuresi.adet > 0 && (
          <span style={stil.kucuk}>Son 180 gün: {yanitSuresi.adet} yanıt · istem → yanıt medyanı {yanitSuresi.medyanGun} gün</span>
        )}
      </div>
      {!hazir ? <div style={{ ...stil.kucuk, marginTop: 8 }}>Konsültasyon kayıtları henüz hazır değil.</div>
        : bekleyenler == null ? <div style={{ ...stil.kucuk, marginTop: 8 }}>Yükleniyor…</div>
          : !bekleyenler.length ? <div style={{ ...stil.kucuk, marginTop: 8 }}>Yanıt bekleyen konsültasyon yok.</div>
            : (
              <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
                {bekleyenler.slice(0, 30).map((b) => (
                  <a key={b.id} href={konsultasyonDosyaYolu(b.patientId)}
                    style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', minHeight: 44, padding: '8px 10px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.12)', textDecoration: 'none', color: CHROME_RENK.ink }}>
                    <Rozet ton={beklemeVurgusu(b.gun)}>{b.gun === 0 ? 'bugün' : `${b.gun} gündür açık`}</Rozet>
                    <span style={{ fontWeight: 700, fontSize: 14, minWidth: 0, overflowWrap: 'anywhere' }}>{b.hastaAdi}</span>
                    <span style={stil.kucuk}>→ {b.hedef} · istem {trGun(b.istemTarihi)}{b.aciliyet === 'acil' ? ' · acil' : b.aciliyet === 'oncelikli' ? ' · öncelikli' : ''}{b.eskiKayit ? ' · eski kayıt' : ''}</span>
                  </a>
                ))}
                {bekleyenler.length > 30 && <div style={stil.kucuk}>+{bekleyenler.length - 30} konsültasyon daha — tamamı Bekleyen Konsültasyonlar aracında.</div>}
              </div>
            )}
      <div style={{ ...stil.kucuk, marginTop: 8 }}>
        Hatırlatma ve yanıt ekleme hasta dosyası › Konsültasyonlar'dadır; tüm liste ve işlemler için{' '}
        <a href={BEKLEYEN_KONSULTASYONLAR_ROTASI} style={{ color: '#0F9B8E', display: 'inline-block', padding: '12px 0' }}>Bekleyen Konsültasyonlar ›</a>
      </div>
    </div>
  );
}

export default function KonsultasyonKohortSatiri() {
  const [bekleyenler, setBekleyenler] = useState<BekleyenKonsultasyon[] | null>(null);
  const [yanitSuresi, setYanitSuresi] = useState<YanitSuresi | null>(null);
  const [hazir, setHazir] = useState(true);
  useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        const t = await getAccessTokenAsync();
        const r = await fetch('/api/doktor/konsultasyon?bekleyen=1', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
        const j = (await r.json().catch(() => ({}))) as { bekleyenler?: BekleyenKonsultasyon[]; yanitSuresi?: YanitSuresi; tabloHazir?: boolean };
        if (iptal) return;
        setBekleyenler(Array.isArray(j.bekleyenler) ? j.bekleyenler : []);
        setYanitSuresi(j.yanitSuresi || null);
        setHazir(j.tabloHazir !== false);
      } catch { if (!iptal) setBekleyenler([]); }
    })();
    return () => { iptal = true; };
  }, []);
  return <KonsultasyonKohortListesi bekleyenler={bekleyenler} yanitSuresi={yanitSuresi} hazir={hazir} />;
}
