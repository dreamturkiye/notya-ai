'use client';

/**
 * KRONIK-SECIM-01 — chronic-condition picker (Türkiye doctor app): the branş's common conditions on top, a searchable
 * ICD-10 list, free-text add, multi-select, removable chips. Data and rules: lib/doktor/kronikHastaliklar.ts.
 * Used on the new-patient screen and on the patient file's "Sağlık geçmişi" card — one picker for every branş.
 */
import React, { useMemo, useState } from 'react';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import { aramaKatla, bransKronikOnerileri, kronikAra, kronikCikar, kronikEkle, kronikKodu } from '@/lib/doktor/kronikHastaliklar';

export default function KronikHastalikSecici({ secili, degistir, brans, id }: {
  secili: string[];
  degistir: (liste: string[]) => void;
  /** The doctor's branş key — its own suggestions go on top (never another branş's). */
  brans?: string | null;
  id?: string;
}) {
  const [sorgu, setSorgu] = useState('');
  const oneriler = useMemo(() => {
    const s = new Set(secili.map(aramaKatla));
    return bransKronikOnerileri(brans).filter((o) => !s.has(aramaKatla(o)));
  }, [brans, secili]);
  const sonuclar = useMemo(() => kronikAra(sorgu, secili), [sorgu, secili]);
  const tamEslesme = sonuclar.some((t) => aramaKatla(t.ad) === aramaKatla(sorgu));
  const serbest = sorgu.trim().length >= 2 && !tamEslesme && !secili.some((s) => aramaKatla(s) === aramaKatla(sorgu));

  const ekle = (ad: string) => { degistir(kronikEkle(secili, ad)); setSorgu(''); };
  const cip: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 34, padding: '4px 6px 4px 12px', borderRadius: 999, fontSize: 13.5, fontWeight: 600 };

  return (
    <div data-kronik-secici="" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {secili.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} aria-label="Seçilen kronik hastalıklar">
          {secili.map((s) => {
            const kod = kronikKodu(s);
            return (
              <span key={s} style={{ ...cip, background: CHROME_RENK.pine, color: '#FAF8F4' }}>
                {s}{kod ? <span style={{ opacity: 0.7, fontWeight: 500, fontSize: 12 }}>{kod}</span> : null}
                <button type="button" aria-label={`${s} kaldır`} onClick={() => degistir(kronikCikar(secili, s))}
                  style={{ width: 26, height: 26, borderRadius: 999, border: 'none', background: 'rgba(250,248,244,0.2)', color: '#FAF8F4', cursor: 'pointer', fontSize: 15, lineHeight: 1 }}>×</button>
              </span>
            );
          })}
        </div>
      )}
      {oneriler.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {oneriler.map((o) => (
            <button key={o} type="button" onClick={() => ekle(o)}
              style={{ ...cip, padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit', background: '#F6F0E4', color: CHROME_RENK.ink, border: `1px solid ${CHROME_RENK.pine}55` }}>
              + {o}
            </button>
          ))}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type="search"
          value={sorgu}
          onChange={(e) => setSorgu(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            if (sonuclar[0] && (tamEslesme || !serbest)) ekle(sonuclar[0].ad);
            else if (serbest) ekle(sorgu);
          }}
          placeholder="Hastalık ara (ad veya ICD-10) ya da yazıp ekleyin"
          aria-label="Kronik hastalık ara veya ekle"
          autoComplete="off"
          style={{ width: '100%', boxSizing: 'border-box', minHeight: 44, padding: '10px 12px', borderRadius: 10, border: `1px solid ${CHROME_RENK.border}`, background: '#FFFFFF', color: CHROME_RENK.ink, fontSize: 15, fontFamily: 'inherit' }}
        />
        {(sonuclar.length > 0 || serbest) && (
          <div role="listbox" style={{ marginTop: 6, border: `1px solid ${CHROME_RENK.border}`, borderRadius: 12, background: '#FFFFFF', overflow: 'hidden', maxHeight: 260, overflowY: 'auto' }}>
            {sonuclar.map((t) => (
              <button key={t.ad} type="button" role="option" aria-selected={false} onClick={() => ekle(t.ad)}
                style={{ display: 'flex', width: '100%', justifyContent: 'space-between', gap: 10, padding: '11px 12px', border: 'none', borderBottom: `1px solid ${CHROME_RENK.border}`, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5, color: CHROME_RENK.ink, textAlign: 'left' }}>
                <span>{t.ad}</span><span style={{ color: CHROME_RENK.muted, fontSize: 12.5 }}>{t.kod}</span>
              </button>
            ))}
            {serbest && (
              <button type="button" role="option" aria-selected={false} onClick={() => ekle(sorgu)}
                style={{ display: 'block', width: '100%', padding: '11px 12px', border: 'none', background: '#F6F0E4', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 650, color: CHROME_RENK.pine, textAlign: 'left' }}>
                + “{sorgu.trim()}” ekle
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
