'use client';

/**
 * Hasta bilgi formunun bölüm listesi (app/intake/[token]/page.tsx) — sayfadan ayrıldı ki testler formu gerçekten
 * çizebilsin (react-dom/server; YasamsalBulgularFormu ile aynı desen). Yalnız GÖRÜNEN bölümler numaralanır:
 * VELI-YASAL-ONAM — "Veli / Yasal Temsilci" bölümü erişkin hastada (ve doğum tarihi girilmeden) hiç çizilmez,
 * numarası da boşluk bırakmaz. Görünürlük kararı lib/intake/dogrula.ts (istemci + sunucu aynı kod).
 */

import React from 'react';
import type { IntakeAlan, IntakeBolum } from '@/lib/intake/coreAlanlar';
import { intakeAlanGorunur, intakeGorunurBolumler } from '@/lib/intake/dogrula';

/** Kaç sütun VE minimum sütun genişliği: uzun etiketli seçenekler (>14 karakter) 2 sütuna, kısa
 * olanlar 3 sütuna sığar — ama bu üst sınır, alt sınır değil. auto-fit/minmax kullanıyoruz ki
 * dar bir telefon ekranında (📱 mobil uyumluluk gereksinimi) grid otomatik olarak 1 sütuna
 * düşsün — sabit repeat(3,1fr) telefon genişliğinde metni sıkıştırıp okunmaz hale getirirdi. */
function gridSablonu(secenekler: string[]): string {
  const uzunEnUzun = Math.max(...secenekler.map((s) => s.length));
  if (secenekler.length <= 2) return `repeat(${secenekler.length}, 1fr)`;
  const minGenislik = uzunEnUzun > 14 ? 190 : 150;
  return `repeat(auto-fit, minmax(${minGenislik}px, 1fr))`;
}

function AlanGirdisi({ alan, deger, onChange }: { alan: IntakeAlan; deger: unknown; onChange: (v: unknown) => void }) {
  const ortakStil: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(10,22,40,0.15)',
    fontSize: 14, background: 'white', color: '#0A1628',
  };

  if (alan.tur === 'textarea') {
    return <textarea style={{ ...ortakStil, minHeight: 64, resize: 'vertical' }} value={(deger as string) || ''} onChange={(e) => onChange(e.target.value)} placeholder={alan.placeholder} />;
  }
  if (alan.tur === 'select') {
    return (
      <select style={ortakStil} value={(deger as string) || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Seçiniz…</option>
        {alan.secenekler?.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    );
  }
  if (alan.tur === 'radio' && alan.secenekler) {
    const grid = alan.dikey ? '1fr' : gridSablonu(alan.secenekler);
    return (
      <div style={{ display: 'grid', gridTemplateColumns: grid, gap: '8px 12px' }}>
        {alan.secenekler.map((s) => (
          <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, cursor: 'pointer' }}>
            <input type="radio" name={alan.id} checked={deger === s} onChange={() => onChange(s)} />
            {s}
          </label>
        ))}
      </div>
    );
  }
  if (alan.tur === 'checkbox-grup' && alan.secenekler) {
    const secililer = (deger as string[]) || [];
    const grid = alan.dikey ? '1fr' : gridSablonu(alan.secenekler);
    return (
      <div style={{ display: 'grid', gridTemplateColumns: grid, gap: '8px 12px' }}>
        {alan.secenekler.map((s) => (
          <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={secililer.includes(s)}
              onChange={(e) => {
                if (e.target.checked) onChange([...secililer, s]);
                else onChange(secililer.filter((x) => x !== s));
              }}
            />
            {s}
          </label>
        ))}
      </div>
    );
  }
  const inputTur = alan.tur === 'tel' ? 'tel' : alan.tur === 'email' ? 'email' : alan.tur === 'date' ? 'date' : 'text';
  // Kaan (2026-09-10): doğum tarihi gelecekte olamaz — takvim bugünle sınırlı
  const tarihSinir = alan.tur === 'date' ? { max: new Date().toISOString().slice(0, 10), min: '1900-01-01' } : {};
  // Kaan (2026-09-13): TC kimlik gibi desen tanımlı alanlarda tam uzunluk + yalnız rakam zorlanır ("ne az ne de fazla")
  const desenSinir = alan.desen === '^[0-9]{11}$'
    ? { inputMode: 'numeric' as const, pattern: '[0-9]*', maxLength: 11, onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => { if (!/[0-9]/.test(e.key)) e.preventDefault() } }
    : {};
  const desenGecersiz = !!alan.desen && !!(deger as string) && !new RegExp(alan.desen).test(String(deger))
  return (
    <>
      <input style={ortakStil} type={inputTur} value={(deger as string) || ''} onChange={(e) => onChange(alan.desen ? e.target.value.replace(/\D/g, '') : e.target.value)} placeholder={alan.placeholder} {...tarihSinir} {...desenSinir} />
      {desenGecersiz && alan.desenHata && <div style={{ fontSize: 12, color: '#DC2626', marginTop: 4 }}>{alan.desenHata}</div>}
    </>
  );
}

/** Görünen bölümleri sırayla, 1'den numaralayarak çizer. `bolumler` tam form listesidir (onay sonda). */
export default function IntakeBolumleri({ bolumler, yanitlar, onDegis, nowMs }: {
  bolumler: IntakeBolum[];
  yanitlar: Record<string, unknown>;
  onDegis: (id: string, deger: unknown) => void;
  nowMs?: number;
}) {
  return (
    <>
      {intakeGorunurBolumler(bolumler, yanitlar, nowMs).map((bolum, bolumIndex) => (
        <div key={bolum.baslik} style={{ marginBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', background: '#0F9B8E', color: 'white',
              fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {bolumIndex + 1}
            </span>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', margin: 0, letterSpacing: '0.01em' }}>
              {bolum.baslik}
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingLeft: 30 }}>
            {bolum.alanlar.map((alan) => {
              if (alan.tur === 'bolum-basligi') {
                return (
                  <div key={alan.id} style={{ fontSize: 12, fontWeight: 700, color: '#0F9B8E', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 6, borderTop: '1px solid rgba(15,155,142,0.15)', paddingTop: 12 }}>
                    {alan.etiket}
                  </div>
                );
              }
              if (!intakeAlanGorunur(alan, yanitlar)) return null;
              return (
                <div key={alan.id}>
                  <label style={{ display: 'block', fontSize: 13, color: '#0A1628', marginBottom: 6, fontWeight: 500 }}>
                    {alan.etiket}{alan.zorunlu && <span style={{ color: '#EF4444' }}> *</span>}
                  </label>
                  <AlanGirdisi alan={alan} deger={yanitlar[alan.id]} onChange={(v) => onDegis(alan.id, v)} />
                  {alan.yardim && <p style={{ fontSize: 11.5, color: 'rgba(10,22,40,0.5)', marginTop: 4 }}>{alan.yardim}</p>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
