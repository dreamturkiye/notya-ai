'use client';
/** GOZ-EXCEPTIONAL-01 — Araçlar › GİL EK-3/G kodları. Chapter verisi (engines/klinik GIL_EK3G_KALEMLERI); bedel/fiyat gösterilmez. */
import React, { useState } from 'react';
import { gilKodAra } from '../../engines/araclar';
import { gilSgkKontrol } from '../../engines/klinik';
import { gozStil, Secim } from './GozAracKabugu';

const { kutu, etiket, kucuk, metin, satir, input, ghost } = gozStil;

export default function GilKodAraci() {
  const [q, setQ] = useState('');
  const [tip, setTip] = useState('');
  const [kopya, setKopya] = useState('');
  const liste = gilKodAra(q);
  const esleme = tip ? gilSgkKontrol(tip) : null;
  const kopyala = async (kod: string) => { try { await navigator.clipboard.writeText(kod); setKopya(kod); } catch { setKopya(''); } };
  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Ara</div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kod veya ad (ör. G10110, torik, multifokal)" aria-label="GİL kodu ara" style={input} />
        <div style={{ ...satir, marginTop: 12 }}>
          <span style={kucuk}>GİL tipinden koda:</span>
          <Secim etiket="GİL tipi" deger={tip} set={setTip} secenekler={[['monofokal', 'Monofokal'], ['torik', 'Torik'], ['multifokal', 'Multifokal'], ['edof', 'EDOF'], ['diger', 'Diğer']]} bos="GİL tipi seçin" />
        </div>
        {esleme && (
          <div style={{ ...metin, marginTop: 8 }}>
            {esleme.kalem ? <>Önerilen kalem: <b>{esleme.kalem.kod}</b> — {esleme.kalem.ad}</> : 'Bu tip için tek kalem eşlemesi yok — listeden hekim/idare seçer.'}
            {esleme.uyari.map((u) => <div key={u} style={{ ...kucuk, color: '#FBBF24' }}>• {u}</div>)}
          </div>
        )}
      </div>
      <div style={kutu}>
        <div style={etiket}>EK-3/G göz içi lens kalemleri ({liste.length})</div>
        {!liste.length && <div style={kucuk}>Eşleşen kalem yok — aramayı değiştirin.</div>}
        {liste.map((k) => (
          <div key={k.kod} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <b style={{ ...metin, fontVariantNumeric: 'tabular-nums', minWidth: 72 }}>{k.kod}</b>
            <div style={{ flex: '1 1 220px' }}><div style={metin}>{k.ad}</div><div style={kucuk}>{k.not}</div></div>
            <button type="button" onClick={() => kopyala(k.kod)} style={ghost}>{kopya === k.kod ? 'Kopyalandı' : 'Kodu kopyala'}</button>
          </div>
        ))}
        <div style={{ ...kucuk, marginTop: 10 }}>Kaynak: SGK SUT EK-3/G (Göz Sağlığı ve Hastalıkları tıbbi malzeme listesi). Bedel ve fark ücreti değişkendir — Notya fiyat yazmaz; güncel satırı idare / hekim teyit eder. GİL tipi ve gücü hekim seçimidir.</div>
      </div>
    </>
  );
}
