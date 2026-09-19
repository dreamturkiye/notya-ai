'use client';
/**
 * GOZ-EXCEPTIONAL-01 — Araçlar › GİL EK-3/G kodları. Chapter verisi (engines/klinik GIL_EK3G_KALEMLERI); bedel/fiyat gösterilmez.
 * ARACLAR-CILA-01: ortak araç kütüphanesiyle yenilendi — tip seçimi segment, manşet sayı, kayan liste kabı, taslak rozeti.
 */
import React, { useState } from 'react';
import { gilKodAra } from '../../engines/araclar';
import { gilSgkKontrol } from '../../engines/klinik';
import { gozStil, Alan, Segment, Istatistik, Katlanir, KopyalaButonu, Rozet, TaslakNotu } from './GozAracKabugu';

const { kutu, etiket, kucuk, metin, satir, input, kaydir } = gozStil;

const TIPLER: Array<[string, string]> = [
  ['', 'Tümü'],
  ['monofokal', 'Monofokal'],
  ['torik', 'Torik'],
  ['multifokal', 'Multifokal'],
  ['edof', 'EDOF'],
  ['diger', 'Diğer'],
];

export default function GilKodAraci() {
  const [q, setQ] = useState('');
  const [tip, setTip] = useState('');
  const liste = gilKodAra(q);
  const esleme = tip ? gilSgkKontrol(tip) : null;
  const tumu = gilKodAra('');

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Ara</div>
        <Alan etiket="Kod veya kalem adı" ipucu={q.trim() && !liste.length ? 'Eşleşen kalem yok — aramayı kısaltın.' : 'Kod parçası da yeter: “G101”, “torik”, “multifokal”.'}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kod veya ad (ör. G10110, torik, multifokal)" aria-label="GİL kodu ara" style={input} />
        </Alan>
        <div style={{ marginTop: 14 }}>
          <Alan etiket="GİL tipinden koda" ipucu="Hekimin seçtiği lens tipi; tek kalem eşleşmiyorsa liste hekime bırakılır.">
            <Segment etiket="GİL tipi" deger={tip} set={setTip} secenekler={TIPLER} />
          </Alan>
        </div>
        {esleme && (
          <div style={{ ...metin, marginTop: 10 }}>
            {esleme.kalem
              ? <>Önerilen kalem: <b>{esleme.kalem.kod}</b> — {esleme.kalem.ad}</>
              : 'Bu tip için tek kalem eşlemesi yok — listeden hekim/idare seçer.'}
            {!!esleme.uyari.length && (
              <div style={{ ...satir, marginTop: 8 }}>
                {esleme.uyari.map((u) => <Rozet key={u} ton="uyari">{u}</Rozet>)}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={kutu} aria-live="polite">
        <div style={etiket}>EK-3/G göz içi lens kalemleri</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <Istatistik deger={liste.length} etiket={q.trim() ? 'aramaya uyan kalem' : 'listedeki kalem'} ton={liste.length ? 'iyi' : 'uyari'} />
          <Istatistik deger={tumu.length} etiket="EK-3/G toplam" />
        </div>
        {!liste.length && <div style={kucuk}>Eşleşen kalem yok — aramayı değiştirin.</div>}
        <div style={kaydir}>
          {liste.map((k) => (
            <div key={k.kod} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <b style={{ ...metin, fontVariantNumeric: 'tabular-nums', minWidth: 72 }}>{k.kod}</b>
              <div style={{ flex: '1 1 220px', minWidth: 0 }}><div style={metin}>{k.ad}</div><div style={kucuk}>{k.not}</div></div>
              <KopyalaButonu metin={k.kod} etiket="Kodu kopyala" />
            </div>
          ))}
        </div>
        <Katlanir baslik="Kaynak ve kapsam">
          <div style={kucuk}>Kaynak: SGK SUT EK-3/G (Göz Sağlığı ve Hastalıkları tıbbi malzeme listesi). Bedel ve fark ücreti değişkendir — Notya fiyat yazmaz; güncel satırı idare / hekim teyit eder. GİL tipi ve gücü hekim seçimidir.</div>
        </Katlanir>
        <TaslakNotu>Kod listesi bilgi amaçlıdır; fatura edilecek kalemi ve lens tipini hekim / idare kilitler. Nota otomatik yazılmaz.</TaslakNotu>
      </div>
    </>
  );
}
