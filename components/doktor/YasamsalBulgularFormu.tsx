'use client';
/**
 * BRANS-ALAN-SIZMASI (Kaan 2026-09-17) — Yaşamsal Bulgular giriş alanları, İnceleme ve not sayfasının ORTAK bileşeni.
 *
 * Alan listesi burada YAZILMAZ: çağıran, sunucunun hesapladığı `bransKapsami.olcumler`'i verir
 * (lib/specialties/kapsam.ts → notOlcumleri: branş profili, ateş ilk; baş çevresi yalnız pediatrik bağlamda).
 * Eskiden iki sayfa da ['ates', …, 'basCevresi'] listesini koşulsuz yazıyordu — KD hekiminin formunda
 * "Baş Çevresi" çıkıyordu. Gizlenen alanın mevcut değeri durumda korunur (silinmez); yalnız çizilmez.
 */
import React from 'react';
import type { NotOlcumu } from '@/lib/specialties/kapsam';
import { eriskinVkiHesapla } from '@/lib/clinical/eriskinVki';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

export interface BuyumePersentilleri { kilo?: string; boy?: string; basCevresi?: string; vki?: string; vkiSinif?: string; uyari?: string }

export default function YasamsalBulgularFormu({
  olcumler, degerler, onDegis, persentiller, girdiStili, persentilRengi = '#2DD4BF', eriskinVkiGoster = true,
}: {
  olcumler: NotOlcumu[];
  degerler: Record<string, string>;
  onDegis: (anahtar: string, deger: string) => void;
  /** Neyzi persentili — sunucu yalnız pediatrik bağlamda gönderir */
  persentiller?: BuyumePersentilleri | null;
  girdiStili?: React.CSSProperties;
  persentilRengi?: string;
  /** Erişkin WHO VKİ — pediatrik Neyzi VKİ varken gizlenir */
  eriskinVkiGoster?: boolean;
}) {
  const eriskin = eriskinVkiGoster && !persentiller?.vki
    ? eriskinVkiHesapla(degerler.kilo, degerler.boy)
    : null;

  return (
    <div data-testid="yasamsal-bulgular">
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {olcumler.map(({ anahtar, etiket, birim }) => {
          const persentil = anahtar === 'kilo' || anahtar === 'boy' || anahtar === 'basCevresi' ? persentiller?.[anahtar] : undefined;
          return (
            <label key={anahtar} data-olcum={anahtar} style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: CHROME_RENK.muted, minWidth: 96 }}>
              {etiket}
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input value={degerler[anahtar] ?? ''} onChange={(e) => onDegis(anahtar, e.target.value)} placeholder="—"
                  style={girdiStili ?? { width: 72, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: CHROME_RENK.ink, fontSize: 13, padding: '5px 8px', fontFamily: 'inherit' }} />
                <span style={{ color: CHROME_RENK.muted }}>{birim}</span>
              </span>
              {persentil && <span style={{ fontSize: 10, color: persentilRengi }}>{persentil}</span>}
            </label>
          );
        })}
      </div>
      {persentiller?.uyari && (
        <div style={{ marginTop: 6, fontSize: 11, color: '#F59E0B', maxWidth: 520 }} data-testid="buyume-uyari">{persentiller.uyari}</div>
      )}
      {persentiller?.vki && !persentiller.uyari && (
        <div style={{ marginTop: 6, fontSize: 11, color: persentilRengi }}>
          VKİ: {persentiller.vki}{persentiller.vkiSinif ? ` — ${persentiller.vkiSinif}` : ''} <span style={{ color: CHROME_RENK.muted }}>(Neyzi standartları)</span>
        </div>
      )}
      {eriskin && (
        <div style={{ marginTop: 6, fontSize: 11, color: persentilRengi }} data-testid="eriskin-vki">
          VKİ: {eriskin.ozet} <span style={{ color: CHROME_RENK.muted }}>(WHO)</span>
        </div>
      )}
    </div>
  );
}
