'use client';
/** GOZ-EXCEPTIONAL-01 — Araçlar › VA / logMAR. engines/va üzerinden; tanı yok, değer hekimin yazdığı gibi okunur. */
import React, { useState } from 'react';
import { vaKarsilastir, type VaSatir } from '../../engines/araclar';
import { gozStil } from './GozAracKabugu';

const { kutu, etiket, kucuk, metin, satir, input, ghost, hata } = gozStil;
const ORNEKLER = ['1,0', '0,8', '0,5', '6/12', '20/40', 'PS 1m', 'EH', 'IH', 'IHY'];

function Hucre({ s }: { s: VaSatir }) {
  if (!s.ham) return <span style={kucuk}>—</span>;
  if (s.hata) return <span style={hata}>{s.hata}</span>;
  return (
    <span>
      <b>{s.gosterim}</b>
      {s.kategori === 'sayisal' ? <span style={kucuk}> · ondalık {s.ondalik} · logMAR {s.logmar}</span> : <span style={kucuk}> · sayısal değil (logMAR yok)</span>}
    </span>
  );
}

export default function VaAraci() {
  const [d, setD] = useState<Record<string, string>>({ odOnce: '', odSimdi: '', osOnce: '', osSimdi: '' });
  const [aktif, setAktif] = useState('odSimdi');
  const set = (k: string, v: string) => setD((p) => ({ ...p, [k]: v }));
  const od = vaKarsilastir(d.odOnce, d.odSimdi), os = vaKarsilastir(d.osOnce, d.osSimdi);
  const harf = (x: number | null) => (x == null ? '—' : `${x > 0 ? '+' : ''}${x} harf`);
  const renk = (x: number | null) => (x == null ? '#EDF1F7' : x <= -5 ? '#FBBF24' : x >= 5 ? '#2DD4BF' : '#EDF1F7');
  const alan = (k: string, ph: string, ad: string) => (
    <input value={d[k]} onFocus={() => setAktif(k)} onChange={(e) => set(k, e.target.value)} placeholder={ph} aria-label={ad} style={{ ...input, minWidth: 0 }} />
  );
  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Görme keskinliği — yazıldığı gibi</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr) minmax(0,1fr)', gap: 8, alignItems: 'center' }}>
          <span />
          <b style={{ color: '#2DD4BF', fontSize: 13 }}>OD (sağ)</b>
          <b style={{ color: '#60A5FA', fontSize: 13 }}>OS (sol)</b>
          <span style={kucuk}>Önceki vizit</span>{alan('odOnce', '0,5', 'Sağ önceki VA')}{alan('osOnce', '0,6', 'Sol önceki VA')}
          <span style={kucuk}>Bugün</span>{alan('odSimdi', '0,8', 'Sağ bugünkü VA')}{alan('osSimdi', '6/12', 'Sol bugünkü VA')}
        </div>
        <div style={{ ...satir, marginTop: 10 }}>
          <span style={kucuk}>Hızlı giriş →</span>
          {ORNEKLER.map((x) => <button key={x} type="button" onClick={() => set(aktif, x)} style={{ ...ghost, minHeight: 36, padding: '6px 10px' }}>{x}</button>)}
        </div>
      </div>
      <div style={kutu}>
        <div style={etiket}>Sonuç</div>
        {([['OD (sağ)', od], ['OS (sol)', os]] as const).map(([ad, k]) => (
          <div key={ad} style={{ ...metin, padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{ad}</div>
            <div>Önceki: <Hucre s={k.onceki} /></div>
            <div>Bugün: <Hucre s={k.simdi} /></div>
            <div style={{ marginTop: 4 }}>ETDRS harf farkı: <b style={{ color: renk(k.harf) }}>{harf(k.harf)}</b></div>
            {k.not && <div style={kucuk}>{k.not}</div>}
          </div>
        ))}
        <div style={{ ...kucuk, marginTop: 8 }}>logMAR = −log10(ondalık); 0,1 logMAR = 5 ETDRS harfi. PS / EH / IH / IHY sayısal değildir, ikame değer kullanılmaz. Sonuç karar desteğidir; klinik yorum hekimindir.</div>
      </div>
    </>
  );
}
