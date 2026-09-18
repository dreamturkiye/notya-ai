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

export interface BuyumePersentilleri { kilo?: string; boy?: string; basCevresi?: string; vki?: string; vkiSinif?: string }

export default function YasamsalBulgularFormu({
  olcumler, degerler, onDegis, persentiller, girdiStili, persentilRengi = '#2DD4BF',
}: {
  olcumler: NotOlcumu[];
  degerler: Record<string, string>;
  onDegis: (anahtar: string, deger: string) => void;
  /** Neyzi persentili — sunucu yalnız pediatrik bağlamda gönderir */
  persentiller?: BuyumePersentilleri | null;
  girdiStili?: React.CSSProperties;
  persentilRengi?: string;
}) {
  return (
    <div data-testid="yasamsal-bulgular" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {olcumler.map(({ anahtar, etiket, birim }) => {
        const persentil = anahtar === 'kilo' || anahtar === 'boy' || anahtar === 'basCevresi' ? persentiller?.[anahtar] : undefined;
        return (
          <label key={anahtar} data-olcum={anahtar} style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: '#8FA0B5', minWidth: 96 }}>
            {etiket}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input value={degerler[anahtar] ?? ''} onChange={(e) => onDegis(anahtar, e.target.value)} placeholder="—"
                style={girdiStili ?? { width: 72, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#EDF1F7', fontSize: 13, padding: '5px 8px', fontFamily: 'inherit' }} />
              <span style={{ color: '#64748B' }}>{birim}</span>
            </span>
            {persentil && <span style={{ fontSize: 10, color: persentilRengi }}>{persentil}</span>}
          </label>
        );
      })}
    </div>
  );
}
