'use client';
/**
 * PEDI-ARACLAR-01 — Araçlar › Büyüme & persentil stüdyosu (engines/buyume.ts → lib/clinical/buyumeEgrisi + WHO LMS).
 * En kısa yol: doğum tarihi + cinsiyet + bugünkü ölçüm → persentil ve z-skor anında. Önceki ölçümler (hasta seçiliyse
 * onaylı notlardan otomatik; değilse elle) → eğri, persentil kayması (≥ 2 majör çizgi) ve büyüme hızı (cm/yıl).
 * Referans Neyzi (varsayılan) ↔ WHO. Grafik hasta dosyasındakiyle aynı bileşen (HastaBuyumeEgrileri.Grafik).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { Grafik } from '@/components/doktor/HastaBuyumeEgrileri';
import type { BuyumeParametre, Cinsiyet } from '@/lib/clinical/buyumeEgrisi';
import {
  olcumSatirlari, persentilKaymalari, buyumeHizlari, egriler, vkiSinifi, zMetni, persentilKisa, buyumeOzetMetni,
  REFERANS_AD, REFERANS_UST_AY, PARAM_AD, PARAM_BIRIM, type Referans, type Olcum,
} from '../../engines/buyume';
import { cmCoz, kiloCoz, tarihCoz, tarihGoster, yasMetni, ondalikAy, tr } from '../../engines/girdi';
import { pediStil, Alan, Segment, Katlanir, TaslakNotu, KopyalaButonu, MuayeneFormunaEkle, OncekiVizit, PediHastaSecici, usePediHasta } from './PediAracKabugu';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const { kutu, etiket, kucuk, input, ghost, uyari, kirmizi, kaydir } = pediStil;
const bugun = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);

type Satir = { id: string; tarih: string; kilo: string; boy: string; bas: string; kaynak: 'kayit' | 'elle' };
/** tarih ekranda yazıldığı gibi tutulur (gg.aa.yyyy); hesapta tarihCoz ile ISO'ya çevrilir. */
const yeniSatir = (tarih = ''): Satir => ({ id: Math.random().toString(36).slice(2), tarih, kilo: '', boy: '', bas: '', kaynak: 'elle' });

function PersentilRozet({ p }: { p: number }) {
  const uc = p < 3 || p > 97;
  const orta = !uc && (p < 10 || p > 90);
  return <span style={{ fontSize: 26, fontWeight: 800, color: uc ? CHROME_RENK.warn : orta ? '#7A5B1E' : '#5EEAD4', letterSpacing: '-0.5px' }}>{persentilKisa(p)} <span style={{ fontSize: 14, fontWeight: 600 }}>persentil</span></span>;
}

export default function BuyumeStudyosu() {
  const [hastaId, setHastaId] = useState('');
  const { ozet, hata: hastaHata } = usePediHasta(hastaId);
  const [dogumHam, setDogumHam] = useState('');
  const [cinsiyet, setCinsiyet] = useState<Cinsiyet | ''>('');
  const [ref, setRef] = useState<Referans>('neyzi');
  const [bugunSatir, setBugunSatir] = useState<Satir>(() => yeniSatir(tarihGoster(bugun())));
  const [gecmis, setGecmis] = useState<Satir[]>([]);
  const [param, setParam] = useState<BuyumeParametre>('boy');
  const [gecmisHata, setGecmisHata] = useState('');

  useEffect(() => {
    if (!ozet) return;
    if (ozet.dogumIso) setDogumHam(tarihGoster(ozet.dogumIso));
    if (ozet.cinsiyet) setCinsiyet(ozet.cinsiyet);
  }, [ozet]);

  // Hasta seçilince geçmiş ölçümler: onaylı notların vitalleri (/api/doktor/hastalar/[id]/buyume-egrileri).
  useEffect(() => {
    setGecmisHata('');
    if (!hastaId) { setGecmis((g) => g.filter((x) => x.kaynak === 'elle')); return; }
    let iptal = false;
    (async () => {
      try {
        const t = await getAccessTokenAsync();
        const r = await fetch(`/api/doktor/hastalar/${encodeURIComponent(hastaId)}/buyume-egrileri`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) { if (!iptal) setGecmisHata(j.error || 'Geçmiş ölçümler alınamadı'); return; }
        const tarihe = new Map<string, Satir>();
        for (const [p, k] of [['kilo', 'kilo'], ['boy', 'boy'], ['basCevresi', 'bas']] as const) {
          for (const n of (j?.parametreler?.[p]?.noktalar || []) as Array<{ deger: number; tarih: string }>) {
            const tarih = String(n.tarih).slice(0, 10);
            const s = tarihe.get(tarih) || { ...yeniSatir(tarihGoster(tarih)), kaynak: 'kayit' as const };
            s[k] = String(n.deger).replace('.', ',');
            tarihe.set(tarih, s);
          }
        }
        if (!iptal) setGecmis([...tarihe.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, s]) => s));
      } catch { if (!iptal) setGecmisHata('Geçmiş ölçümler alınamadı — elle ekleyebilirsiniz.'); }
    })();
    return () => { iptal = true; };
  }, [hastaId]);

  const dogumIso = tarihCoz(dogumHam);
  const hazir = !!dogumIso && !!cinsiyet;
  const olcumler: Olcum[] = useMemo(() => [...gecmis, bugunSatir]
    .map((s) => ({ tarih: tarihCoz(s.tarih) || '', kilo: kiloCoz(s.kilo), boy: cmCoz(s.boy), basCevresi: cmCoz(s.bas) }))
    .filter((o) => o.tarih && (o.kilo || o.boy || o.basCevresi)), [gecmis, bugunSatir]);
  const satirlar = useMemo(() => (hazir ? olcumSatirlari(ref, cinsiyet as Cinsiyet, dogumIso!, olcumler) : []), [hazir, ref, cinsiyet, dogumIso, olcumler]);
  const kaymalar = useMemo(() => persentilKaymalari(satirlar), [satirlar]);
  const hizlar = useMemo(() => buyumeHizlari(satirlar), [satirlar]);
  const son = satirlar[satirlar.length - 1];
  const bugunTarih = tarihCoz(bugunSatir.tarih);

  const grafikVeri = useMemo(() => {
    if (!hazir || !satirlar.length) return null;
    const noktalar = satirlar.filter((s) => s.deger[param] != null && s.ay <= REFERANS_UST_AY[ref][param]).map((s) => ({ ay: s.ay, deger: s.deger[param]!, tarih: s.tarih }));
    const maxAy = Math.max(24, ...satirlar.map((s) => s.ay)) + 6;
    let e = egriler(ref, param, cinsiyet as Cinsiyet, maxAy);
    if (param === 'vki') e = e.map((x) => ({ ...x, noktalar: x.noktalar.filter((n) => n.ay >= 24 || ref === 'who') }));
    return { birim: PARAM_BIRIM[param], egriler: e, noktalar };
  }, [hazir, satirlar, param, ref, cinsiyet]);

  /** Faz 3 (kalıcılık): büyüme ölçümleri zaten onaylı not vitallerinde saklanır — son kayıt görünür olsun. */
  const sonKayitliOlcum = [...gecmis].reverse().find((x) => x.kaynak === 'kayit' && (x.kilo || x.boy || x.bas)) || null;

  const setB = (k: keyof Satir, v: string) => setBugunSatir((s) => ({ ...s, [k]: v }));
  const setG = (id: string, k: keyof Satir, v: string) => setGecmis((g) => g.map((s) => (s.id === id ? { ...s, [k]: v } : s)));

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Hasta (isteğe bağlı — doğum tarihi ve geçmiş ölçümler kayıttan gelir)</div>
        <PediHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        {(hastaHata || gecmisHata) && <div style={{ ...pediStil.hata, marginTop: 6 }}>{hastaHata || gecmisHata}</div>}
        {ozet && (!ozet.dogumIso || !ozet.cinsiyet) && <div style={{ ...kucuk, marginTop: 6 }}>Kayıtta {!ozet.dogumIso ? 'doğum tarihi' : 'cinsiyet'} yok — aşağıya elle girin.</div>}
        <OncekiVizit tarih={sonKayitliOlcum?.tarih || null}>
          {[sonKayitliOlcum?.kilo ? `kilo ${sonKayitliOlcum.kilo} kg` : '', sonKayitliOlcum?.boy ? `boy ${sonKayitliOlcum.boy} cm` : '', sonKayitliOlcum?.bas ? `baş çevresi ${sonKayitliOlcum.bas} cm` : ''].filter(Boolean).join(' · ')} — onaylı muayene notlarından okundu; bugünün satırını aşağıya girin.
        </OncekiVizit>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginTop: 14 }}>
          <Alan etiket="Doğum tarihi" ipucu={dogumHam && !dogumIso ? 'Okunamadı — ör. 12.03.2024' : dogumIso && bugunTarih ? yasMetni(dogumIso, bugunTarih) : 'gg.aa.yyyy'}>
            <input value={dogumHam} onChange={(e) => setDogumHam(e.target.value)} placeholder="12.03.2024" aria-label="Doğum tarihi" inputMode="decimal" style={input} />
          </Alan>
          <Alan etiket="Cinsiyet">
            <Segment etiket="Cinsiyet" deger={cinsiyet} set={setCinsiyet} secenekler={[['female', 'Kız'], ['male', 'Erkek']]} />
          </Alan>
          <Alan etiket="Referans">
            <Segment etiket="Referans" deger={ref} set={setRef} secenekler={[['neyzi', 'Neyzi'], ['who', 'WHO']]} />
          </Alan>
        </div>
      </div>

      <div style={kutu}>
        <div style={etiket}>Ölçüm</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <Alan etiket="Tarih"><input value={bugunSatir.tarih} onChange={(e) => setB('tarih', e.target.value)} aria-label="Ölçüm tarihi" inputMode="decimal" style={input} /></Alan>
          <Alan etiket="Kilo (kg)"><input value={bugunSatir.kilo} onChange={(e) => setB('kilo', e.target.value)} placeholder="12,4" aria-label="Kilo" inputMode="decimal" style={input} /></Alan>
          <Alan etiket="Boy (cm)"><input value={bugunSatir.boy} onChange={(e) => setB('boy', e.target.value)} placeholder="86,5" aria-label="Boy" inputMode="decimal" style={input} /></Alan>
          <Alan etiket="Baş çevresi (cm)"><input value={bugunSatir.bas} onChange={(e) => setB('bas', e.target.value)} placeholder="47" aria-label="Baş çevresi" inputMode="decimal" style={input} /></Alan>
        </div>
        <Katlanir baslik="Önceki ölçümler" rozet={gecmis.length ? `${gecmis.length} ölçüm` : undefined} acik={gecmis.length > 0}>
          {gecmis.length === 0 && <div style={kucuk}>Önceki ölçüm eklerseniz eğri, persentil kayması ve büyüme hızı hesaplanır.</div>}
          <div style={{ display: 'grid', gap: 8 }}>
            {gecmis.map((g) => (
              <div key={g.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr)) 44px', gap: 8, alignItems: 'center' }}>
                <input value={g.tarih} onChange={(e) => setG(g.id, 'tarih', e.target.value)} placeholder="tarih" aria-label="Önceki ölçüm tarihi" style={{ ...input, minWidth: 0 }} />
                <input value={g.kilo} onChange={(e) => setG(g.id, 'kilo', e.target.value)} placeholder="kg" aria-label="Önceki kilo" inputMode="decimal" style={{ ...input, minWidth: 0 }} />
                <input value={g.boy} onChange={(e) => setG(g.id, 'boy', e.target.value)} placeholder="boy cm" aria-label="Önceki boy" inputMode="decimal" style={{ ...input, minWidth: 0 }} />
                <input value={g.bas} onChange={(e) => setG(g.id, 'bas', e.target.value)} placeholder="baş cm" aria-label="Önceki baş çevresi" inputMode="decimal" style={{ ...input, minWidth: 0 }} />
                <button type="button" aria-label="Ölçümü kaldır" onClick={() => setGecmis((x) => x.filter((y) => y.id !== g.id))} style={{ ...ghost, padding: 0, minWidth: 44 }}>✕</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setGecmis((g) => [...g, yeniSatir()])} style={{ ...ghost, marginTop: 10 }}>+ Önceki ölçüm ekle</button>
          {gecmis.some((g) => g.kaynak === 'kayit') && <div style={{ ...kucuk, marginTop: 8 }}>Kayıttan gelenler onaylı muayene notlarının vitallerinden okundu; burada düzeltmek kaydı değiştirmez.</div>}
        </Katlanir>
      </div>

      <div style={kutu} aria-live="polite">
        <div style={{ ...etiket, display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <span>Sonuç</span><span style={{ ...kucuk, fontWeight: 500 }}>{REFERANS_AD[ref]}</span>
        </div>
        {!hazir ? (
          <div style={{ ...kucuk, fontSize: 14 }}>Doğum tarihi ve cinsiyet girin; ölçüm yazdıkça persentil ve z-skor hesaplanır.</div>
        ) : !son ? (
          <div style={{ ...kucuk, fontSize: 14 }}>Kilo, boy veya baş çevresi girin.</div>
        ) : (
          <>
            <div style={{ ...kucuk, marginBottom: 10 }}>{tarihGoster(son.tarih)} · {yasMetni(dogumIso!, son.tarih)} ({tr(son.ay, 1)} ay)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
              {(['kilo', 'boy', 'basCevresi', 'vki'] as BuyumeParametre[]).filter((p) => son.deger[p] != null).map((p) => {
                const r = son.sonuc[p];
                const sinif = r ? vkiSinifi(ref, son.ay, r.persentil) : null;
                return (
                  <button key={p} type="button" onClick={() => setParam(p)} style={{ textAlign: 'left', background: param === p ? 'rgba(45,212,191,0.08)' : 'rgba(0,0,0,0.18)', border: `1px solid ${param === p ? 'rgba(45,212,191,0.45)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, padding: 12, cursor: 'pointer', minHeight: 44, color: CHROME_RENK.ink }}>
                    <div style={{ fontSize: 13, color: CHROME_RENK.muted }}>{PARAM_AD[p]} · {tr(son.deger[p]!, 2)} {PARAM_BIRIM[p]}</div>
                    {r ? (<><PersentilRozet p={r.persentil} /><div style={kucuk}>z {zMetni(r.z)}{sinif ? ` · ${sinif}` : ''}</div></>) : (
                      <div style={{ ...kucuk, marginTop: 4 }}>{ref === 'who' && p === 'basCevresi' ? 'WHO baş çevresi 5 yaşa kadar' : ref === 'who' && p === 'kilo' ? 'WHO yaşa göre kilo 10 yaşa kadar' : 'Bu yaş referans kapsamı dışında'}</div>
                    )}
                  </button>
                );
              })}
            </div>
            {son.deger.vki != null && (son.ay < 24 || ref === 'who') && <div style={{ ...kucuk, marginTop: 8 }}>{ref === 'who' ? 'VKİ: WHO seçiliyken sınıf verilmez, z-skor gösterilir.' : 'VKİ: Neyzi sınıflaması 2 yaşından itibaren.'}</div>}

            {kaymalar.map((k) => (
              <div key={k.param} style={{ ...(Math.abs(k.cizgi) >= 3 ? kirmizi : uyari), marginTop: 10 }}>
                ⚠ <b>{PARAM_AD[k.param]} persentil kayması:</b> {persentilKisa(k.pOnce)} → {persentilKisa(k.pSon)} persentil ({tarihGoster(k.oncekiTarih)} → {tarihGoster(k.sonTarih)}), {Math.abs(k.cizgi)} majör çizgi {k.cizgi < 0 ? 'aşağı' : 'yukarı'}.
                {ondalikAy(dogumIso!, k.oncekiTarih) < 6 ? ' İlk aylarda kanal değişimi fizyolojik olabilir.' : ''} Hekim değerlendirir.
              </div>
            ))}
            {hizlar.length > 0 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                {hizlar.map((h) => (
                  <div key={h.param} style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 12px', minWidth: 150, flex: '1 1 150px' }}>
                    <div style={kucuk}>{PARAM_AD[h.param]} hızı</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: CHROME_RENK.ink }}>{tr(h.yillik, 1)} {h.param === 'kilo' ? 'kg' : 'cm'}/yıl</div>
                    <div style={kucuk}>{tr(h.fark, 1)} {h.param === 'kilo' ? 'kg' : 'cm'} / {tr(h.aralikAy, 1)} ay{h.kisaAralik ? ' · aralık 6 aydan kısa, ölçüm hatasına duyarlı' : ''}</div>
                  </div>
                ))}
              </div>
            )}
            {satirlar.length === 1 && <div style={{ ...kucuk, marginTop: 10 }}>Kayma ve büyüme hızı için önceki bir ölçüm ekleyin.</div>}
          </>
        )}
      </div>

      {grafikVeri && (
        <div style={kutu}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <div style={etiket}>{PARAM_AD[param]} eğrisi</div>
            <Segment etiket="Eğri" deger={param} set={setParam} secenekler={[['kilo', 'Kilo'], ['boy', 'Boy'], ['basCevresi', 'Baş'], ['vki', 'VKİ']]} />
          </div>
          <div style={kaydir}>
            <div style={{ minWidth: 320 }}>
              {grafikVeri.noktalar.length || grafikVeri.egriler.length ? <Grafik veri={grafikVeri} birim={grafikVeri.birim} /> : <div style={kucuk}>Bu ölçüm için eğri yok.</div>}
            </div>
          </div>
          <div style={{ ...kucuk, marginTop: 6 }}><span style={{ color: '#F59E0B', fontWeight: 700 }}>●</span> ölçümler · <span style={{ color: '#2DD4BF', fontWeight: 700 }}>—</span> 50. persentil · kesikli 3/10/25/75/90/97</div>
        </div>
      )}

      {hazir && son && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...pediStil.satir }}>
            <KopyalaButonu metin={buyumeOzetMetni(ref, satirlar, kaymalar, hizlar)} etiket="Özeti kopyala" />
          </div>
          <MuayeneFormunaEkle hastaId={hastaId} arac="Büyüme & persentil" satirlar={buyumeOzetMetni(ref, satirlar, kaymalar, hizlar).split('\n')} />
        </div>
      )}
      <TaslakNotu>Persentil ve z-skor istatistiksel konumdur, tanı değildir. Kayma eşiği: ≥ 2 majör persentil çizgisi (3/10/25/50/75/90/97). Kaynak: Neyzi ve ark. 2015 (JCRPE) · WHO Child Growth Standards 2006 / Growth Reference 2007. Klinik yorum hekimindir.</TaslakNotu>
    </>
  );
}

