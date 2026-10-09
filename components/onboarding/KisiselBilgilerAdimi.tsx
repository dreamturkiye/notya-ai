'use client';

import React from 'react';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import KvkkOnayKutusu from './KvkkOnayKutusu';

/**
 * NOTYA-ONBOARDING-01 (Kaan, 2026-10-09) — onboarding 3. adım ("Hesabınızı tamamlayın").
 *
 * Evrensel çerçeve: her meslek ve her branş için aynıdır; branşa göre dallanan hiçbir alan yoktur.
 * Sıra: Ad, Soyad → E-posta (salt okunur) → Cep telefonu → Cinsiyet → Hitap Tercihi → (kayıtlı rıza yoksa) KVKK.
 * Görünüm sayfadaki mevcut alanlarla aynıdır (aynı etiket ve girdi stilleri); yalnız sunum — durum ve
 * doğrulama app/onboarding/page.tsx + lib/onboarding/profilDogrula.ts içindedir.
 */
export type KisiselAlan = 'firstName' | 'lastName' | 'cepTelefonu' | 'gender' | 'addressingPreference';

export type KisiselBilgilerProps = {
  firstName: string;
  lastName: string;
  cepTelefonu: string;
  gender: string;
  addressingPreference: string;
  /** Hesabın giriş e-postası — salt okunur. */
  eposta: string;
  /** Sunucunun kararı: bu hesabın kayıtlı KVKK rızası yok. */
  kvkkGerekli: boolean;
  kvkkOnay: boolean;
  /** Alan altı Türkçe uyarılar (yalnız hekim alana dokunduktan sonra dolar). */
  hatalar?: Partial<Record<KisiselAlan, string>>;
  /** Form geneli hata (sunucunun yanıtı). */
  genelHata?: string;
  onDegis: (alan: KisiselAlan, deger: string) => void;
  onBirak?: (alan: KisiselAlan) => void;
  onKvkk: (isaretli: boolean) => void;
};

const R = CHROME_RENK;
const etiket: React.CSSProperties = { color: R.muted, fontSize: '14px', marginBottom: '8px', display: 'block' };
const girdi: React.CSSProperties = { width: '100%', backgroundColor: R.paper, color: R.ink, border: '1px solid ' + R.border, borderRadius: '8px', padding: '12px', fontSize: '15px' };
const uyari: React.CSSProperties = { color: R.warn, fontSize: '13px', lineHeight: 1.45, marginTop: '6px' };
const aciklama: React.CSSProperties = { color: R.muted, fontSize: '13px', lineHeight: 1.45, marginTop: '6px' };

export default function KisiselBilgilerAdimi(p: KisiselBilgilerProps) {
  const h = p.hatalar || {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label htmlFor="onb-ad" style={etiket}>Ad</label>
          <input id="onb-ad" type="text" autoComplete="given-name" value={p.firstName} onChange={e => p.onDegis('firstName', e.target.value)} onBlur={() => p.onBirak?.('firstName')} aria-invalid={h.firstName ? true : undefined} style={girdi} />
          {h.firstName && <div data-hata="firstName" style={uyari}>{h.firstName}</div>}
        </div>
        <div>
          <label htmlFor="onb-soyad" style={etiket}>Soyad</label>
          <input id="onb-soyad" type="text" autoComplete="family-name" value={p.lastName} onChange={e => p.onDegis('lastName', e.target.value)} onBlur={() => p.onBirak?.('lastName')} aria-invalid={h.lastName ? true : undefined} style={girdi} />
          {h.lastName && <div data-hata="lastName" style={uyari}>{h.lastName}</div>}
        </div>
      </div>

      <div>
        <label htmlFor="onb-eposta" style={etiket}>E-posta</label>
        <input id="onb-eposta" type="email" value={p.eposta} readOnly aria-readonly="true" tabIndex={-1} style={{ ...girdi, color: R.muted, backgroundColor: 'rgba(47,67,52,0.06)', cursor: 'default' }} />
        <div style={aciklama}>Notya&apos;ya bu e-posta adresiyle giriş yaparsınız. Adres yanlışsa Notya ekibinizle iletişime geçin.</div>
      </div>

      <div>
        <label htmlFor="onb-cep" style={etiket}>Cep telefonu</label>
        <input id="onb-cep" type="tel" inputMode="tel" autoComplete="tel" placeholder="0532 123 45 67" value={p.cepTelefonu} onChange={e => p.onDegis('cepTelefonu', e.target.value)} onBlur={() => p.onBirak?.('cepTelefonu')} aria-invalid={h.cepTelefonu ? true : undefined} style={girdi} />
        {h.cepTelefonu && <div data-hata="cepTelefonu" style={uyari}>{h.cepTelefonu}</div>}
      </div>

      <div>
        <label htmlFor="onb-cinsiyet" style={etiket}>Cinsiyet</label>
        <select id="onb-cinsiyet" value={p.gender} onChange={e => p.onDegis('gender', e.target.value)} style={girdi}>
          <option value="">Seçiniz</option>
          <option value="Erkek">Erkek</option>
          <option value="Kadın">Kadın</option>
        </select>
      </div>

      <div>
        <label htmlFor="onb-hitap" style={etiket}>Hitap Tercihi</label>
        <select id="onb-hitap" value={p.addressingPreference} onChange={e => p.onDegis('addressingPreference', e.target.value)} style={girdi}>
          <option value="">Seçiniz</option>
          <option value="Hocam">Hocam</option>
          <option value="[isim] Hocam">[isim] Hocam</option>
          <option value="First name only">Sadece İsim</option>
        </select>
      </div>

      {p.kvkkGerekli && <KvkkOnayKutusu isaretli={p.kvkkOnay} onDegis={p.onKvkk} />}

      {p.genelHata && (
        <div data-hata="genel" role="alert" style={{
          background: 'rgba(164,91,62,0.08)', border: '1px solid rgba(164,91,62,0.25)', borderRadius: 10,
          color: R.warn, fontSize: 14, lineHeight: 1.5, padding: '10px 12px', textAlign: 'center',
        }}>
          {p.genelHata}
        </div>
      )}
    </div>
  );
}
