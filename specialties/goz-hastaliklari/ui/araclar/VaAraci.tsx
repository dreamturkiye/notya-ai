'use client';
/**
 * GOZ-EXCEPTIONAL-01 — Araçlar › VA / logMAR. engines/va üzerinden; tanı yok, değer hekimin yazdığı gibi okunur.
 * ARACLAR-CILA-01: ortak araç kütüphanesiyle yenilendi — manşet ETDRS farkı, durum rozeti, katlanır yöntem notu, taslak rozeti.
 */
import React, { useState } from 'react';
import { vaKarsilastir, type VaSatir } from '../../engines/araclar';
import { gozStil, GozHastaSecici, Istatistik, Katlanir, KopyalaButonu, MuayeneFormunaEkle, Rozet, TaslakNotu } from './GozAracKabugu';

const { kutu, etiket, kucuk, metin, satir, input, ghost, hata, kaydir } = gozStil;
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
  const [hastaId, setHastaId] = useState('');
  const set = (k: string, v: string) => setD((p) => ({ ...p, [k]: v }));
  const od = vaKarsilastir(d.odOnce, d.odSimdi), os = vaKarsilastir(d.osOnce, d.osSimdi);
  const harf = (x: number | null) => (x == null ? '—' : `${x > 0 ? '+' : ''}${x} harf`);
  const ton = (x: number | null): 'iyi' | 'uyari' | 'notr' => (x == null ? 'notr' : x <= -5 ? 'uyari' : x >= 5 ? 'iyi' : 'notr');
  const yon = (x: number | null) => (x == null ? 'karşılaştırma için iki vizit gerekir' : x <= -5 ? 'anlamlı düşüş (≥1 sıra)' : x >= 5 ? 'anlamlı artış (≥1 sıra)' : 'değişim eşik altında');
  const alan = (k: string, ph: string, ad: string) => (
    <input value={d[k]} onFocus={() => setAktif(k)} onChange={(e) => set(k, e.target.value)} placeholder={ph} aria-label={ad} style={{ ...input, minWidth: 0 }} />
  );
  const girildi = Object.values(d).some((x) => x.trim());
  const notSatirlari = [
    (d.odOnce.trim() || d.odSimdi.trim()) ? `OD (sağ): önceki ${od.onceki.gosterim || '—'} · bugün ${od.simdi.gosterim || '—'} · ETDRS harf farkı ${harf(od.harf)}` : '',
    (d.osOnce.trim() || d.osSimdi.trim()) ? `OS (sol): önceki ${os.onceki.gosterim || '—'} · bugün ${os.simdi.gosterim || '—'} · ETDRS harf farkı ${harf(os.harf)}` : '',
  ].filter(Boolean);
  const ozetMetni = [
    `Görme keskinliği (hekim girdisi) — ${new Date().toISOString().slice(0, 10)}`,
    ...notSatirlari,
    'logMAR = −log10(ondalık); 0,1 logMAR = 5 ETDRS harfi. Karar desteğidir; klinik yorum hekimindir.',
  ].join('\n');

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Görme keskinliği — yazıldığı gibi</div>
        <div style={kaydir}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr) minmax(0,1fr)', gap: 8, alignItems: 'center', minWidth: 280 }}>
            <span />
            <b style={{ color: '#2DD4BF', fontSize: 13 }}>OD (sağ)</b>
            <b style={{ color: '#60A5FA', fontSize: 13 }}>OS (sol)</b>
            <span style={kucuk}>Önceki vizit</span>{alan('odOnce', '0,5', 'Sağ önceki VA')}{alan('osOnce', '0,6', 'Sol önceki VA')}
            <span style={kucuk}>Bugün</span>{alan('odSimdi', '0,8', 'Sağ bugünkü VA')}{alan('osSimdi', '6/12', 'Sol bugünkü VA')}
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ ...kucuk, marginBottom: 6 }}>Hasta (isteğe bağlı — sonucu bugünkü muayene formuna eklemek için seçin)</div>
          <GozHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        </div>
        <div style={{ ...satir, marginTop: 10 }}>
          <span style={kucuk}>Hızlı giriş →</span>
          {ORNEKLER.map((x) => <button key={x} type="button" onClick={() => set(aktif, x)} style={{ ...ghost, minHeight: 36, padding: '6px 10px' }}>{x}</button>)}
        </div>
      </div>

      <div style={kutu} aria-live="polite">
        <div style={etiket}>Sonuç</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
          <Istatistik deger={harf(od.harf)} etiket="OD (sağ) ETDRS farkı" ton={ton(od.harf)} />
          <Istatistik deger={harf(os.harf)} etiket="OS (sol) ETDRS farkı" ton={ton(os.harf)} />
        </div>
        {([['OD (sağ)', od], ['OS (sol)', os]] as const).map(([ad, k]) => (
          <div key={ad} style={{ ...metin, padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontWeight: 700 }}>{ad}</span>
              <Rozet ton={ton(k.harf)}>{yon(k.harf)}</Rozet>
            </div>
            <div>Önceki: <Hucre s={k.onceki} /></div>
            <div>Bugün: <Hucre s={k.simdi} /></div>
            {k.not && <div style={kucuk}>{k.not}</div>}
          </div>
        ))}
        {girildi && <div style={{ ...satir }}><KopyalaButonu metin={ozetMetni} etiket="VA özetini kopyala" /></div>}
        <MuayeneFormunaEkle hastaId={hastaId} arac="VA / logMAR" satirlar={notSatirlari} />
        <Katlanir baslik="Yöntem ve ölçek">
          <div style={kucuk}>logMAR = −log10(ondalık); 0,1 logMAR = 5 ETDRS harfi. PS / EH / IH / IHY sayısal değildir, ikame değer kullanılmaz.</div>
        </Katlanir>
        <TaslakNotu>Sonuç karar desteğidir; klinik yorum hekimindir. Nota otomatik yazılmaz.</TaslakNotu>
      </div>
    </>
  );
}
