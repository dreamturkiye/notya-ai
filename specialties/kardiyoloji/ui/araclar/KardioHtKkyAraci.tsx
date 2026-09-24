'use client';
/**
 * KARDIO-EXCEPTIONAL-01 — Araçlar › HT / KKY izlem. Kardiyoloji-only. Doz yok; NYHA hekim seçimi.
 */
import React, { useMemo, useState } from 'react';
import {
  KardioHastaSecici, kardioStil, Alan, Etiketli, Secim, Segment, Istatistik, TaslakNotu, KopyalaButonu,
  MuayeneFormunaEkle, useUrlHasta,
} from './KardioAracKabugu';
import { izlemDegerlendir, IZLEM_TIP_AD, NYHA_AD, type IzlemTip, type NyhaSinif } from '../../engines/htKky';

const S = kardioStil;
const bugun = () => new Date().toISOString().slice(0, 10);

export default function KardioHtKkyAraci() {
  const [hasta, setHasta] = useState('');
  useUrlHasta(setHasta);
  const [tip, setTip] = useState<IzlemTip>('ht');
  const [sbp, setSbp] = useState('');
  const [dbp, setDbp] = useState('');
  const [kilo, setKilo] = useState('');
  const [nyha, setNyha] = useState<NyhaSinif | ''>('');
  const [ekgBelge, setEkgBelge] = useState(false);
  const [not, setNot] = useState('');

  const sonuc = useMemo(() => izlemDegerlendir({
    tip, bugun: bugun(),
    sbp: sbp === '' ? null : Number(sbp),
    dbp: dbp === '' ? null : Number(dbp),
    kiloKg: kilo === '' ? null : Number(kilo),
    nyha: nyha || null,
    bayraklar: ekgBelge ? ['ekg_belge'] : [],
    hekimNotu: not,
  }), [tip, sbp, dbp, kilo, nyha, ekgBelge, not]);

  return (
    <>
      <div style={S.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)">
          <KardioHastaSecici secili={hasta} sec={(id) => setHasta(id)} />
        </Alan>
        <Segment
          etiket="İzlem tipi"
          deger={tip}
          set={setTip}
          secenekler={(Object.keys(IZLEM_TIP_AD) as IzlemTip[]).map((k) => [k, IZLEM_TIP_AD[k]] as [IzlemTip, string])}
        />
      </div>

      <div style={S.kutu}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Etiketli ad="SBP"><input type="number" value={sbp} onChange={(e) => setSbp(e.target.value)} style={{ ...S.input, width: 90 }} /></Etiketli>
          <Etiketli ad="DBP"><input type="number" value={dbp} onChange={(e) => setDbp(e.target.value)} style={{ ...S.input, width: 90 }} /></Etiketli>
          <Etiketli ad="Kilo kg"><input type="number" value={kilo} onChange={(e) => setKilo(e.target.value)} style={{ ...S.input, width: 90 }} /></Etiketli>
          {(tip === 'kky') && (
            <Secim etiket="NYHA (hekim)" deger={nyha} set={(x) => setNyha(x as '' | NyhaSinif)} bos="Seçilmedi" secenekler={(Object.keys(NYHA_AD) as NyhaSinif[]).map((k) => [k, NYHA_AD[k]] as [string, string])} />
          )}
        </div>
        <label style={{ ...S.metin, display: 'flex', gap: 8, marginTop: 10 }}>
          <input type="checkbox" checked={ekgBelge} onChange={(e) => setEkgBelge(e.target.checked)} />
          EKG / belge köprüsü — kontrol görevi aç
        </label>
        <Alan etiket="Hekim notu">
          <textarea value={not} onChange={(e) => setNot(e.target.value)} rows={3} style={{ ...S.input, width: '100%', resize: 'vertical' }} />
        </Alan>
      </div>

      <div style={S.kutu}>
        <div style={S.etiket}>Özet</div>
        <Istatistik deger={String(sonuc.gorevler.length)} etiket="Görev taslağı" ton={sonuc.eksikler.length ? 'uyari' : 'notr'} />
        {sonuc.eksikler.length > 0 && <div style={{ ...S.kucuk, color: '#7A5B1E', marginTop: 8 }}>Henüz ölçüm veya not girilmedi — dürüst boş durum.</div>}
        <div style={{ ...S.metin, marginTop: 8 }}>{sonuc.ozet}</div>
        {sonuc.uyarilar.map((u, i) => <div key={i} style={{ ...S.kucuk, color: '#FBBF24', marginTop: 4 }}>{u}</div>)}
        <ul style={{ ...S.kucuk, marginTop: 8 }}>
          {sonuc.gorevler.map((g) => <li key={g.kod}>{g.ad} · {g.due}</li>)}
        </ul>
        <TaslakNotu />
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <KopyalaButonu metin={sonuc.ozet} />
          {hasta && !sonuc.eksikler.length && <MuayeneFormunaEkle hastaId={hasta} arac="HT / KKY izlem" satirlar={[sonuc.ozet]} alan="content_objektif" />}
        </div>
      </div>
    </>
  );
}
