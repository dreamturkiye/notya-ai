'use client';
/**
 * KBB-EXCEPTIONAL-01 — Araçlar › Otoskopi / kulak zarı notu (KBB'ye özel).
 * Hekim sağ/sol dış kulak ve TM görünümlerini işaretler; araç yalnız bunları düzgün bir muayene
 * cümlesine çevirir. Tanı adı üretmez, doz yazmaz, "otit" gibi bir sonuç iddia etmez.
 */
import React, { useMemo, useState } from 'react';
import {
  KbbHastaSecici, kbbStil, Kutu, Katlanir, TaslakNotu, Rozet, KopyalaButonu, MuayeneFormunaEkle, useUrlHasta, Alan,
} from './KbbAracKabugu';
import {
  otoskopiNotu, DIS_KULAK_AD, TM_AD, EK_BULGULAR, DIS_KULAK_LISTESI, TM_LISTESI,
  type DisKulakBulgu, type TmGorunum,
} from '../../engines/otoskopi';
import { REF_ACIKLAMA } from '../../engines/kbb';

const S = kbbStil;

function KulakKolonu({
  ad, dis, setDis, tm, setTm,
}: { ad: string; dis: DisKulakBulgu[]; setDis: (x: DisKulakBulgu[]) => void; tm: TmGorunum[]; setTm: (x: TmGorunum[]) => void }) {
  const cevirDis = (x: DisKulakBulgu) => setDis(dis.includes(x) ? dis.filter((y) => y !== x) : [...dis, x]);
  const cevirTm = (x: TmGorunum) => setTm(tm.includes(x) ? tm.filter((y) => y !== x) : [...tm, x]);
  return (
    <div style={{ flex: '1 1 260px', minWidth: 0 }}>
      <div style={S.etiket}>{ad}</div>
      <div style={{ ...S.kucuk, marginBottom: 2 }}>Dış kulak yolu</div>
      {DIS_KULAK_LISTESI.map((k) => <Kutu key={k} on={dis.includes(k)} set={() => cevirDis(k)}>{DIS_KULAK_AD[k]}</Kutu>)}
      <div style={{ ...S.kucuk, marginTop: 8, marginBottom: 2 }}>Kulak zarı (TM)</div>
      {TM_LISTESI.map((k) => <Kutu key={k} on={tm.includes(k)} set={() => cevirTm(k)}>{TM_AD[k]}</Kutu>)}
    </div>
  );
}

export default function KbbOtoskopiAraci() {
  const [hasta, setHasta] = useState('');
  useUrlHasta(setHasta);
  const [sagDis, setSagDis] = useState<DisKulakBulgu[]>([]);
  const [sagTm, setSagTm] = useState<TmGorunum[]>([]);
  const [solDis, setSolDis] = useState<DisKulakBulgu[]>([]);
  const [solTm, setSolTm] = useState<TmGorunum[]>([]);
  const [ek, setEk] = useState<string[]>([]);
  const [not, setNot] = useState('');

  const sonuc = useMemo(() => otoskopiNotu({
    kulaklar: [{ yan: 'sag', disKulak: sagDis, tm: sagTm }, { yan: 'sol', disKulak: solDis, tm: solTm }],
    ekBulgular: ek,
    hekimNotu: not,
  }), [sagDis, sagTm, solDis, solTm, ek, not]);

  return (
    <>
      <div style={S.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)" ipucu="Hasta seçerseniz notu doğrudan bugünkü muayene formuna ekleyebilirsiniz.">
          <KbbHastaSecici secili={hasta} sec={(id) => setHasta(id)} />
        </Alan>
      </div>

      <div style={S.kutu}>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <KulakKolonu ad="Sağ kulak" dis={sagDis} setDis={setSagDis} tm={sagTm} setTm={setSagTm} />
          <KulakKolonu ad="Sol kulak" dis={solDis} setDis={setSolDis} tm={solTm} setTm={setSolTm} />
        </div>
        <Katlanir baslik="Ek muayene bulguları" rozet={ek.length ? String(ek.length) : undefined}>
          {EK_BULGULAR.map((x) => (
            <Kutu key={x} on={ek.includes(x)} set={() => setEk(ek.includes(x) ? ek.filter((y) => y !== x) : [...ek, x])}>{x}</Kutu>
          ))}
        </Katlanir>
        <div style={{ marginTop: 10 }}>
          <Alan etiket="Hekim notu">
            <input value={not} onChange={(e) => setNot(e.target.value)} placeholder="Serbest metin — kendi cümlenizle" style={S.input} />
          </Alan>
        </div>
      </div>

      <div style={S.kutu}>
        <div style={S.etiket}>Not önizleme</div>
        {sonuc.satirlar.length
          ? sonuc.satirlar.map((x) => <div key={x} style={S.metin}>{x}</div>)
          : <div style={S.kucuk}>Henüz bulgu işaretlenmedi.</div>}

        {sonuc.dikkat.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {sonuc.dikkat.map((d) => <Rozet key={d} ton="uyari">{d}</Rozet>)}
          </div>
        )}
        {sonuc.eksikler.length > 0 && (
          <div style={{ ...S.kucuk, marginTop: 8, color: '#FDE68A' }}>
            {sonuc.eksikler.map((e) => <div key={e}>• {e}</div>)}
          </div>
        )}

        <TaslakNotu>Bulgular hekim muayenesidir; tanı ve tedavi kararı hekimindedir. Notya tanı yazmaz, doz üretmez.</TaslakNotu>
        <div style={{ ...S.satir, marginTop: 10 }}>
          <KopyalaButonu metin={sonuc.metin} etiket="Notu kopyala" />
        </div>
        <MuayeneFormunaEkle hastaId={hasta} arac="Otoskopi / TM" satirlar={sonuc.satirlar} alan="content_objektif" />
        <div style={{ ...S.kucuk, marginTop: 10 }}>{REF_ACIKLAMA.TKBBD}</div>
      </div>
    </>
  );
}
