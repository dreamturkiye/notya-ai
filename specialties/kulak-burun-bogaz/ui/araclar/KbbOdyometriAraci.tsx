'use client';
/**
 * KBB-EXCEPTIONAL-01 — Araçlar › Odyometri özeti (KBB'ye özel).
 * 0,5 / 1 / 2 / 4 kHz hava yolu eşiklerinden saf ses ortalaması (PTA) ve şiddet bandı.
 *
 * Kilitler: bant KARAR DESTEĞİDİR, tanı değildir. Kayıp tipini (iletim / sensorinöral / mikst) araç
 * atamaz — hekim seçer. Eksik frekans varsa ortalama yorumlanmaz; araç eşik uydurmaz.
 */
import React, { useMemo, useState } from 'react';
import {
  KbbHastaSecici, kbbStil, Alan, Etiketli, Secim, Istatistik, Rozet, TaslakNotu, KopyalaButonu,
  MuayeneFormunaEkle, useUrlHasta,
} from './KbbAracKabugu';
import {
  skorla, degisim, asimetriNotu, sonrakiOlcumGun, PTA_FREKANSLARI, KAYIP_TIPI_AD, KAYIP_TIPLERI,
} from '../../engines/odyometri';
import { REF_ACIKLAMA } from '../../engines/kbb';

const S = kbbStil;
const BOS = ['', '', '', ''];

function Kulak({
  ad, esikler, set, onceki, setOnceki,
}: { ad: string; esikler: string[]; set: (x: string[]) => void; onceki: string; setOnceki: (x: string) => void }) {
  const sonuc = skorla(esikler.map((x) => (x === '' ? null : Number(x))), ad === 'Sağ kulak' ? 'sag' : 'sol');
  const d = degisim(onceki === '' ? null : Number(onceki), sonuc.tamamMi ? sonuc.pta : null);
  return (
    <div style={{ flex: '1 1 280px', minWidth: 0 }}>
      <div style={S.etiket}>{ad}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PTA_FREKANSLARI.map((f, i) => (
          <Etiketli key={f} ad={`${f} kHz`}>
            <input
              type="number" inputMode="numeric" aria-label={`${ad} ${f} kHz eşiği`}
              value={esikler[i]} onChange={(e) => set(esikler.map((x, j) => (j === i ? e.target.value : x)))}
              style={{ ...S.input, width: 82 }}
            />
          </Etiketli>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
        <Istatistik deger={sonuc.tamamMi ? `${sonuc.pta} dB` : '—'} etiket="PTA (0,5–4 kHz)" ton={sonuc.tamamMi ? 'notr' : 'uyari'} />
        <Istatistik deger={sonuc.bantAd} etiket="Şiddet bandı · karar desteği" />
      </div>
      {!sonuc.tamamMi && <div style={{ ...S.kucuk, color: '#FDE68A', marginTop: 6 }}>{sonuc.eksikFrekans} frekans boş — ortalama yorumlanmaz.</div>}
      <div style={{ marginTop: 8 }}>
        <Etiketli ad="Önceki PTA (varsa)">
          <input type="number" inputMode="numeric" aria-label={`${ad} önceki PTA`} value={onceki} onChange={(e) => setOnceki(e.target.value)} style={{ ...S.input, width: 110 }} />
        </Etiketli>
      </div>
      <div style={{ ...S.kucuk, marginTop: 6 }}>{d.not}</div>
    </div>
  );
}

export default function KbbOdyometriAraci() {
  const [hasta, setHasta] = useState('');
  useUrlHasta(setHasta);
  const [sag, setSag] = useState<string[]>(BOS);
  const [sol, setSol] = useState<string[]>(BOS);
  const [sagOnceki, setSagOnceki] = useState('');
  const [solOnceki, setSolOnceki] = useState('');
  const [tip, setTip] = useState('');

  const sagSonuc = useMemo(() => skorla(sag.map((x) => (x === '' ? null : Number(x))), 'sag'), [sag]);
  const solSonuc = useMemo(() => skorla(sol.map((x) => (x === '' ? null : Number(x))), 'sol'), [sol]);
  const asimetri = asimetriNotu(sagSonuc.tamamMi ? sagSonuc.pta : null, solSonuc.tamamMi ? solSonuc.pta : null);
  const enAgir = [sagSonuc, solSonuc].filter((x) => x.tamamMi).sort((a, b) => (b.pta || 0) - (a.pta || 0))[0] || null;

  const satirlar = [
    sagSonuc.tamamMi ? sagSonuc.ozet : null,
    solSonuc.tamamMi ? solSonuc.ozet : null,
    asimetri,
    tip ? `Kayıp tipi (hekim değerlendirmesi): ${KAYIP_TIPI_AD[tip as keyof typeof KAYIP_TIPI_AD]}.` : null,
    enAgir ? `Tekrar ölçüm takvim taslağı: ~${sonrakiOlcumGun(enAgir.bant)} gün (hekim değiştirebilir).` : null,
  ].filter(Boolean) as string[];

  return (
    <>
      <div style={S.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)" ipucu="Hasta seçerseniz özeti bugünkü muayene formuna ekleyebilirsiniz.">
          <KbbHastaSecici secili={hasta} sec={(id) => setHasta(id)} />
        </Alan>
      </div>

      <div style={S.kutu}>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <Kulak ad="Sağ kulak" esikler={sag} set={setSag} onceki={sagOnceki} setOnceki={setSagOnceki} />
          <Kulak ad="Sol kulak" esikler={sol} set={setSol} onceki={solOnceki} setOnceki={setSolOnceki} />
        </div>
        {asimetri && <div style={{ marginTop: 10 }}><Rozet ton="uyari">{asimetri}</Rozet></div>}
        <div style={{ marginTop: 12 }}>
          <Alan etiket="Kayıp tipi — hekim seçer" ipucu="Notya iletim / sensorinöral / mikst ayrımı yapmaz; bu değerlendirme odyogram ve muayene ile hekimindir.">
            <Secim etiket="Kayıp tipi" deger={tip} set={setTip} bos="Seçilmedi" secenekler={KAYIP_TIPLERI.map((k) => [k, KAYIP_TIPI_AD[k]] as [string, string])} />
          </Alan>
        </div>
      </div>

      <div style={S.kutu}>
        <div style={S.etiket}>Özet</div>
        {satirlar.length ? satirlar.map((x) => <div key={x} style={S.metin}>{x}</div>) : <div style={S.kucuk}>Eşikleri girin.</div>}
        <div style={{ ...S.kucuk, marginTop: 8 }}>
          Bant aralıkları (dB HL): ≤25 normal · 26–40 hafif · 41–55 orta · 56–70 orta-ileri · 71–90 ileri · &gt;90 çok ileri.
        </div>
        <TaslakNotu>PTA bandı karar desteğidir; tanı, kayıp tipi ve tedavi kararı hekimindedir. Notya doz üretmez.</TaslakNotu>
        <div style={{ ...S.satir, marginTop: 10 }}>
          <KopyalaButonu metin={satirlar.join('\n')} etiket="Özeti kopyala" />
        </div>
        <MuayeneFormunaEkle hastaId={hasta} arac="Odyometri özeti" satirlar={satirlar} alan="content_objektif" />
        <div style={{ ...S.kucuk, marginTop: 10 }}>{REF_ACIKLAMA.ODYOLOJI_SINIFLAMA}</div>
      </div>
    </>
  );
}
