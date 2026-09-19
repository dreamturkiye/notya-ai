'use client';
/**
 * KBB-EXCEPTIONAL-01 — Araçlar › Vertigo / Dix-Hallpike notu (KBB'ye özel).
 * Manevra sonuçları + nistagmus özellikleri → düzenli muayene notu.
 *
 * Kilit: santral şüphesi işareti seçiliyken araç repozisyon manevrasını ÖNERMEZ; acil / nöroloji
 * değerlendirmesini öne alır (112). Tanı (BPPV, vestibüler nörit, Meniere…) yazılmaz — hekimindir.
 */
import React, { useMemo, useState } from 'react';
import {
  KbbHastaSecici, kbbStil, Alan, Secim, Kutu, Rozet, TaslakNotu, KopyalaButonu, MuayeneFormunaEkle, useUrlHasta,
} from './KbbAracKabugu';
import {
  vertigoNotu, MANEVRA_AD, MANEVRA_LISTESI, SONUC_AD, NISTAGMUS_OZELLIKLERI, SANTRAL_ISARETLERI,
  type Manevra, type ManevraSonucu,
} from '../../engines/vertigo';
import { YAN_AD, REF_ACIKLAMA } from '../../engines/kbb';

const S = kbbStil;
const SONUC_SECENEK: Array<[string, string]> = (Object.keys(SONUC_AD) as ManevraSonucu[]).map((k) => [k, SONUC_AD[k]]);
const YAN_SECENEK: Array<[string, string]> = [['sag', YAN_AD.sag], ['sol', YAN_AD.sol], ['iki', YAN_AD.iki]];

export default function KbbVertigoAraci() {
  const [hasta, setHasta] = useState('');
  useUrlHasta(setHasta);
  const [sonuclar, setSonuclar] = useState<Record<string, string>>({});
  const [yanlar, setYanlar] = useState<Record<string, string>>({});
  const [nistagmus, setNistagmus] = useState<string[]>([]);
  const [santral, setSantral] = useState<string[]>([]);
  const [kulakBelirtisi, setKulakBelirtisi] = useState(false);
  const [not, setNot] = useState('');

  const sonuc = useMemo(() => vertigoNotu({
    manevralar: MANEVRA_LISTESI
      .filter((m) => sonuclar[m])
      .map((m) => ({ manevra: m as Manevra, yan: (yanlar[m] || undefined) as 'sag' | undefined, sonuc: sonuclar[m] as ManevraSonucu })),
    nistagmus, santralIsaretleri: santral, kulakBelirtisi, hekimNotu: not,
  }), [sonuclar, yanlar, nistagmus, santral, kulakBelirtisi, not]);

  const cevir = (liste: string[], set: (x: string[]) => void, x: string) => set(liste.includes(x) ? liste.filter((y) => y !== x) : [...liste, x]);

  return (
    <>
      <div style={S.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)">
          <KbbHastaSecici secili={hasta} sec={(id) => setHasta(id)} />
        </Alan>
      </div>

      <div style={S.kutu}>
        <div style={S.etiket}>Önce santral şüphesi</div>
        <div style={S.kucuk}>
          Bunlardan biri varsa pozisyonel manevra öncelik değildir; 112 veya en yakın acil / nöroloji değerlendirmesi öndedir.
        </div>
        {SANTRAL_ISARETLERI.map((x) => (
          <Kutu key={x} on={santral.includes(x)} set={() => cevir(santral, setSantral, x)}>{x}</Kutu>
        ))}
        {!sonuc.manevraUygunMu && (
          <div style={{ marginTop: 8 }}>
            <Rozet ton="kirmizi">Repozisyon manevrası uygun değil — 112 veya en yakın acil / nöroloji değerlendirmesi</Rozet>
          </div>
        )}
      </div>

      <div style={S.kutu}>
        <div style={S.etiket}>Manevralar ve testler</div>
        {MANEVRA_LISTESI.map((m) => (
          <div key={m} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ ...S.metin, flex: '1 1 200px' }}>{MANEVRA_AD[m]}</span>
            <Secim etiket={`${MANEVRA_AD[m]} sonucu`} deger={sonuclar[m] || ''} set={(v) => setSonuclar({ ...sonuclar, [m]: v })} bos="—" secenekler={SONUC_SECENEK} />
            <Secim etiket={`${MANEVRA_AD[m]} tarafı`} deger={yanlar[m] || ''} set={(v) => setYanlar({ ...yanlar, [m]: v })} bos="Taraf yok" secenekler={YAN_SECENEK} />
          </div>
        ))}
      </div>

      <div style={S.kutu}>
        <div style={S.etiket}>Nistagmus özellikleri</div>
        {NISTAGMUS_OZELLIKLERI.map((x) => (
          <Kutu key={x} on={nistagmus.includes(x)} set={() => cevir(nistagmus, setNistagmus, x)}>{x}</Kutu>
        ))}
        <Kutu on={kulakBelirtisi} set={setKulakBelirtisi}>Eşlik eden kulak belirtisi (işitme kaybı / çınlama / dolgunluk)</Kutu>
        <div style={{ marginTop: 10 }}>
          <Alan etiket="Hekim notu">
            <input value={not} onChange={(e) => setNot(e.target.value)} placeholder="Serbest metin" style={S.input} />
          </Alan>
        </div>
      </div>

      <div style={S.kutu}>
        <div style={S.etiket}>Not önizleme</div>
        {sonuc.uyarilar.map((u) => <div key={u} style={{ ...S.metin, color: '#FCA5A5' }}>{u}</div>)}
        {sonuc.satirlar.length ? sonuc.satirlar.map((x) => <div key={x} style={S.metin}>{x}</div>) : <div style={S.kucuk}>Henüz manevra işaretlenmedi.</div>}
        {sonuc.eksikler.length > 0 && (
          <div style={{ ...S.kucuk, marginTop: 8, color: '#FDE68A' }}>{sonuc.eksikler.map((e) => <div key={e}>• {e}</div>)}</div>
        )}
        <TaslakNotu>Manevra sonuçları muayene bulgusudur; tanı, tedavi ve ileri tetkik kararı hekimindedir.</TaslakNotu>
        <div style={{ ...S.satir, marginTop: 10 }}>
          <KopyalaButonu metin={sonuc.metin} etiket="Notu kopyala" />
        </div>
        <MuayeneFormunaEkle hastaId={hasta} arac="Vestibüler muayene" satirlar={[...sonuc.uyarilar, ...sonuc.satirlar]} alan="content_objektif" />
        <div style={{ ...S.kucuk, marginTop: 10 }}>{REF_ACIKLAMA.TKBBD}</div>
      </div>
    </>
  );
}
