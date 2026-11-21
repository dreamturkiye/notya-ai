'use client';
/**
 * NOTYA-BUYUME-EGRISI-02/03 — Büyüme Eğrileri sekmesi (Kaan 2026-09-14); BUYUME-GRAFIK-V2 redesign (Kaan 2026-11-20).
 * Pediatri only (the tab and its mount sit behind pediatriUygun in the patient file — brans-alan-sizmasi).
 * Cards: latest value + percentile chip, trend note, the curve (components/doktor/buyume/BuyumeGrafigi.tsx) in an age
 * window that fits the child; tap "Büyüt" for the full-screen view (Geri + Önceki/Sonraki to show the parents).
 * Reference: lib/clinical/buyumeEgrisi.ts (Neyzi 2015). Points and their percentiles come from the API.
 */
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import HedefBoyManken from '@/components/hedefBoy/HedefBoyManken';
import { formatBoyCm, type HedefBoySonuc } from '@/lib/clinical/hedefBoy';
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { Grafik, GrafikAnahtari, BUYUME_RENK, tarihTR, type GrafikVerisi } from '@/components/doktor/buyume/BuyumeGrafigi';
import { bantDisiMi, degerMetni, egilimMetni, persentilEgilimi, persentilEtiketi, yasMetni, yasPenceresi } from '@/lib/clinical/buyumeGrafik';
import { doktorFetch } from '@/lib/doktor/oturumFetch'

/** Araçlar › Büyüme stüdyosu draws with the same chart. */
export { Grafik } from '@/components/doktor/buyume/BuyumeGrafigi';

type ParamVeri = GrafikVerisi;
interface Yanit {
  dogumBilinmiyor: boolean;
  mevcutYasAy: number | null;
  cinsiyet: 'male' | 'female' | null;
  parametreler: { kilo?: ParamVeri; boy?: ParamVeri; basCevresi?: ParamVeri; vki?: ParamVeri | null };
  /** Prematüre bebek: 24 aya kadar noktalar düzeltilmiş yaşa göre çizilir (gestasyon "32+4"). */
  duzeltme?: { gestasyon: string } | null;
}

const PARAM_BASLIK: Record<string, string> = { kilo: 'Kilo', boy: 'Boy', basCevresi: 'Baş çevresi', vki: 'Vücut kitle indeksi' };

const kart: CSSProperties = {
  background: BUYUME_RENK.yuzey, border: '1px solid rgba(58,44,34,0.09)', borderRadius: 18, padding: '16px 16px 12px',
  boxShadow: '0 1px 2px rgba(58,44,34,0.04)', minWidth: 0,
};

function PersentilCipi({ p, buyuk }: { p: number; buyuk?: boolean }) {
  const disari = bantDisiMi(p);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', borderRadius: 999,
      padding: buyuk ? '6px 12px' : '4px 10px', fontSize: buyuk ? 14 : 12.5, fontWeight: 700,
      background: disari ? BUYUME_RENK.uyariZemin : BUYUME_RENK.iyiZemin, color: disari ? BUYUME_RENK.uyariYazi : BUYUME_RENK.iyiYazi,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {disari ? <span aria-hidden style={{ fontWeight: 800 }}>!</span> : <span aria-hidden style={{ width: 7, height: 7, borderRadius: 7, background: BUYUME_RENK.medyan }} />}
      {persentilEtiketi(p)}
    </span>
  );
}

function EgilimNotu({ veri }: { veri: ParamVeri }) {
  const e = egilimMetni(persentilEgilimi(veri.noktalar));
  if (!e) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 13, lineHeight: 1.35, color: e.uyari ? BUYUME_RENK.uyariYazi : BUYUME_RENK.iyiYazi, fontWeight: 600 }}>
      <span aria-hidden style={{
        flex: '0 0 auto', width: 18, height: 18, borderRadius: 18, display: 'inline-grid', placeItems: 'center', fontSize: 11, marginTop: -1,
        background: e.uyari ? BUYUME_RENK.uyariZemin : BUYUME_RENK.iyiZemin,
      }}>{e.uyari ? '!' : '✓'}</span>
      <span>{e.metin}</span>
    </div>
  );
}

/** Header of a card / of the full-screen view: name + percentile chip, latest value with age and date, trend. */
function KartBasligi({ anahtar, veri, buyuk, sag }: { anahtar: string; veri: ParamVeri; buyuk?: boolean; sag?: ReactNode }) {
  const son = veri.noktalar[veri.noktalar.length - 1];
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, minHeight: 32 }}>
        <span style={{ fontSize: buyuk ? 15 : 14, fontWeight: 600, color: CHROME_RENK.muted }}>{PARAM_BASLIK[anahtar]}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {son?.persentil != null && <PersentilCipi p={son.persentil} buyuk={buyuk} />}
          {sag}
        </span>
      </div>
      {son ? (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px 10px', flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{ fontFamily: CHROME_FONT.serif, fontSize: buyuk ? 38 : 30, lineHeight: 1.05, color: CHROME_RENK.ink, fontWeight: 560, fontVariantNumeric: 'tabular-nums' }}>
            {degerMetni(son.deger, veri.birim)}
          </span>
          <span style={{ fontSize: 13, color: CHROME_RENK.muted }}>{son.ay < 0.25 ? 'Doğumda' : yasMetni(son.ay)} · {tarihTR(son.tarih)}</span>
        </div>
      ) : (
        <div style={{ fontSize: 13.5, color: CHROME_RENK.muted, lineHeight: 1.45 }}>Henüz ölçüm yok — onaylanan muayene notundaki {PARAM_BASLIK[anahtar].toLocaleLowerCase('tr-TR')} burada görünür.</div>
      )}
      <EgilimNotu veri={veri} />
    </div>
  );
}

function Segment({ secenekler, deger, set }: { secenekler: [boolean, string][]; deger: boolean; set: (v: boolean) => void }) {
  return (
    <div role="group" aria-label="Yaş aralığı" style={{ display: 'inline-flex', background: 'rgba(58,44,34,0.06)', borderRadius: 999, padding: 3 }}>
      {secenekler.map(([v, etiket]) => (
        <button key={etiket} type="button" aria-pressed={deger === v} onClick={() => set(v)} style={{
          border: 'none', cursor: 'pointer', borderRadius: 999, padding: '6px 13px', fontSize: 13, fontWeight: 600, minHeight: 32,
          background: deger === v ? CHROME_RENK.pine : 'transparent', color: deger === v ? '#fff' : CHROME_RENK.ink,
        }}>{etiket}</button>
      ))}
    </div>
  );
}

function aralikMetni(ust: number): string {
  return ust <= 36 ? `0–${ust} ay` : `0–${Math.round(ust / 12)} yaş`;
}

/** The view itself — data in, no fetching (also rendered by the static preview and tests). */
export function BuyumeEgrileriGorunumu({ veri, hedefKart, baslangicBuyuk = null }: { veri: Yanit; hedefKart?: ReactNode; baslangicBuyuk?: number | null }) {
  const [buyukIndex, setBuyukIndex] = useState<number | null>(baslangicBuyuk);
  const [tumu, setTumu] = useState(false);

  const { kilo, boy, basCevresi, vki } = veri.parametreler;
  const paramlar = ([['kilo', kilo], ['boy', boy], ['basCevresi', basCevresi], ['vki', vki]] as const).filter(([, v]) => !!v) as [string, ParamVeri][];
  const pencere = useMemo(() => {
    const tamUst = Math.max(6, ...paramlar.flatMap(([, p]) => p.egriler.flatMap((s) => s.noktalar.map((n) => n.ay))));
    return yasPenceresi(veri.mevcutYasAy, paramlar.flatMap(([, p]) => p.noktalar.map((n) => n.ay)), tamUst);
  }, [paramlar, veri.mevcutYasAy]);
  const ustAy = tumu ? pencere.tamUst : pencere.varsayilanUst;
  const yasYazisi = veri.mevcutYasAy != null ? yasMetni(veri.mevcutYasAy) : '';
  const altBilgi = `Neyzi Türk çocukları standartları · ${veri.cinsiyet === 'female' ? 'Kız' : 'Erkek'}${yasYazisi ? ` · ${yasYazisi}` : ''}`;
  const toggle = pencere.daraltilmis ? (
    <Segment deger={tumu} set={setTumu} secenekler={[[false, aralikMetni(pencere.varsayilanUst)], [true, `Tümü · ${aralikMetni(pencere.tamUst)}`]]} />
  ) : null;

  if (buyukIndex !== null && paramlar[buyukIndex]) {
    const [anahtar, pVeri] = paramlar[buyukIndex];
    const dugme: CSSProperties = { background: 'rgba(58,44,34,0.06)', border: 'none', color: CHROME_RENK.ink, borderRadius: 999, padding: '9px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 600, minHeight: 40 };
    return (
      <div role="dialog" aria-modal="true" aria-label="Büyüme eğrisi" style={{ position: 'fixed', inset: 0, background: CHROME_RENK.cream, zIndex: 200, display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="buyume-buyuk-bas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setBuyukIndex(null)} style={{ ...dugme, background: 'transparent', color: CHROME_RENK.muted }}>← Geri</button>
          <div style={{ fontSize: 13, color: CHROME_RENK.muted }}>{altBilgi}{veri.duzeltme ? ` · düzeltilmiş yaş (doğumda ${veri.duzeltme.gestasyon} hafta)` : ''}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setBuyukIndex((i) => (i! - 1 + paramlar.length) % paramlar.length)} style={dugme}>‹ Önceki</button>
            <button type="button" onClick={() => setBuyukIndex((i) => (i! + 1) % paramlar.length)} style={{ ...dugme, background: CHROME_RENK.pine, color: '#fff' }}>Sonraki ›</button>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '4px 20px 24px' }}>
          <div style={{ ...kart, width: '100%', maxWidth: 1080, padding: '22px 24px 16px', display: 'grid', gap: 14, alignContent: 'start', alignSelf: 'flex-start' }}>
            <KartBasligi anahtar={anahtar} veri={pVeri} buyuk sag={toggle} />
            <Grafik veri={pVeri} birim={pVeri.birim} buyuk ustAy={ustAy} duzeltilmis={!!veri.duzeltme} />
            <GrafikAnahtari stil={{ justifyContent: 'center' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px 16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 13, color: CHROME_RENK.muted }}>{altBilgi}</span>
          {veri.duzeltme && <span style={{ fontSize: 13, fontWeight: 600, color: BUYUME_RENK.uyariYazi }}>Düzeltilmiş yaşa göre çizildi (doğumda {veri.duzeltme.gestasyon} hafta) — 24 aya kadar</span>}
        </div>
        {toggle}
      </div>
      <GrafikAnahtari />
      <div className="buyume-izgara" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 14 }}>
        {paramlar.map(([anahtar, pVeri], i) => (
          <section key={anahtar} style={{ ...kart, display: 'flex', flexDirection: 'column', gap: 10 }} aria-label={`${PARAM_BASLIK[anahtar]} büyüme eğrisi`}>
            <KartBasligi anahtar={anahtar} veri={pVeri} sag={
              <button type="button" onClick={() => setBuyukIndex(i)} className="buyume-buyut" aria-label={`${PARAM_BASLIK[anahtar]} eğrisini büyüt`} title="Büyüt" style={{ background: 'rgba(58,44,34,0.05)', border: 'none', color: CHROME_RENK.pine, fontSize: 15, fontWeight: 700, cursor: 'pointer', width: 32, height: 32, borderRadius: 32, display: 'inline-grid', placeItems: 'center' }}>
                ⤢
              </button>
            } />
            <div style={{ marginTop: 'auto' }}><Grafik veri={pVeri} birim={pVeri.birim} ustAy={ustAy} duzeltilmis={!!veri.duzeltme} /></div>
          </section>
        ))}
      </div>
      {!vki && (
        <div style={{ fontSize: 12.5, color: CHROME_RENK.muted }}>Vücut kitle indeksi eğrisi 2 yaşından itibaren gösterilir.</div>
      )}
      {hedefKart}
      <style>{`
        .buyume-buyut:hover { background: rgba(47,67,52,0.12) !important; }
        .buyume-buyut:focus-visible, .buyume-izgara circle:focus-visible { outline: 2px solid ${CHROME_RENK.pine}; outline-offset: 2px; }
        @media (max-width: 640px) { .buyume-buyuk-bas { justify-content: center !important; text-align: center; padding: 12px 14px !important; } }
      `}</style>
    </div>
  );
}

/** The estimate on one horizontal scale: expected range as a sage band, the target as the berry dot, parents as ticks. */
function HedefBoyOlcegi({ hedef }: { hedef: HedefBoySonuc }) {
  const alt = Math.floor((Math.min(hedef.anneCm, hedef.babaCm, hedef.altCm) - 6) / 5) * 5;
  const ust = Math.ceil((Math.max(hedef.anneCm, hedef.babaCm, hedef.ustCm) + 6) / 5) * 5;
  const yuzde = (cm: number) => `${((cm - alt) / (ust - alt)) * 100}%`;
  const ebeveyn = [{ ad: 'Anne', cm: hedef.anneCm }, { ad: 'Baba', cm: hedef.babaCm }].sort((a, b) => a.cm - b.cm);
  const yakin = Math.abs(hedef.anneCm - hedef.babaCm) < (ust - alt) * 0.14;
  const tikler: number[] = [];
  for (let c = alt; c <= ust; c += 10) tikler.push(c);
  return (
    <div style={{ position: 'relative', padding: '30px 6px 44px' }} aria-hidden>
      <div style={{ position: 'relative', height: 12, borderRadius: 12, background: BUYUME_RENK.bandDis }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: yuzde(hedef.altCm), width: `calc(${yuzde(hedef.ustCm)} - ${yuzde(hedef.altCm)})`, background: BUYUME_RENK.bandIc, borderRadius: 12 }} />
        <div style={{ position: 'absolute', top: '50%', left: yuzde(hedef.cocukCm), width: 18, height: 18, marginLeft: -9, marginTop: -9, borderRadius: 18, background: BUYUME_RENK.olcum, boxShadow: `0 0 0 3px ${BUYUME_RENK.yuzey}` }} />
        <div style={{ position: 'absolute', bottom: 22, left: yuzde(hedef.cocukCm), transform: 'translateX(-50%)', fontSize: 13, fontWeight: 700, color: CHROME_RENK.ink, whiteSpace: 'nowrap' }}>hedef {formatBoyCm(hedef.cocukCm).split(' (')[0]}</div>
        {ebeveyn.map((e, i) => (
          <div key={e.ad} style={{ position: 'absolute', top: 16, left: yuzde(e.cm), transform: yakin ? (i === 0 ? 'translateX(-100%)' : 'translateX(0)') : 'translateX(-50%)', display: 'grid', justifyItems: yakin ? (i === 0 ? 'end' : 'start') : 'center', fontSize: 12, color: CHROME_RENK.muted, whiteSpace: 'nowrap' }}>
            <span style={{ width: 2, height: 8, background: CHROME_RENK.muted, opacity: 0.6 }} />
            <span>{e.ad} {Math.round(e.cm)}</span>
          </div>
        ))}
      </div>
      <div style={{ position: 'relative', height: 0 }}>
        {tikler.map((c) => <span key={c} style={{ position: 'absolute', top: 30, left: yuzde(c), transform: 'translateX(-50%)', fontSize: 11, color: CHROME_RENK.muted, opacity: 0.8 }}>{c}</span>)}
      </div>
    </div>
  );
}

/** Hedef boy block in the same card language: the estimate as a figure and a scale; the family scene on demand. */
export function HedefBoyKarti({ patientId, hedef, yuklendi, baslangicSahne = false }: { patientId: string; hedef: HedefBoySonuc | null; yuklendi: boolean; baslangicSahne?: boolean }) {
  const [sahne, setSahne] = useState(baslangicSahne);
  return (
    <section style={{ ...kart, padding: '18px 18px 14px', display: 'grid', gap: 10 }} aria-label="Hedef boy">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: CHROME_RENK.muted }}>Hedef boy · anne ve baba boyuna göre</span>
        <a href={`/doktor-tools/hedef-boy?patientId=${patientId}`} style={{ color: CHROME_RENK.pine, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Araçlar › Hedef Boy</a>
      </div>
      {hedef ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px 12px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: CHROME_FONT.serif, fontSize: 30, lineHeight: 1.05, color: CHROME_RENK.ink, fontWeight: 560 }}>{formatBoyCm(hedef.cocukCm).split(' (')[0]}</span>
            <span style={{ fontSize: 13.5, color: CHROME_RENK.muted }}>tahmini erişkin boy · beklenen aralık {Math.round(hedef.altCm)}–{Math.round(hedef.ustCm)} cm</span>
          </div>
          <HedefBoyOlcegi hedef={hedef} />
          <div>
            <button type="button" aria-expanded={sahne} onClick={() => setSahne((v) => !v)} style={{ background: 'rgba(58,44,34,0.06)', border: 'none', borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: CHROME_RENK.ink, cursor: 'pointer', minHeight: 36 }}>
              {sahne ? 'Aile görünümünü kapat' : 'Aileye göster'}
            </button>
          </div>
          {sahne && <HedefBoyManken sonuc={hedef} tema="doktor" />}
        </>
      ) : (
        <p style={{ margin: 0, fontSize: 13.5, color: CHROME_RENK.muted, lineHeight: 1.5 }}>
          {yuklendi ? 'Anne ve baba boyu girildiğinde tahmini erişkin boy burada görünür. Hasta bilgi formu zorunlu değil — Araçlar › Hedef Boy’dan girebilirsiniz.' : 'Hedef boy yükleniyor…'}
        </p>
      )}
    </section>
  );
}

export default function HastaBuyumeEgrileri({ patientId, hedefBoyGoster = false }: { patientId: string; hedefBoyGoster?: boolean }) {
  const [veri, setVeri] = useState<Yanit | null>(null);
  const [hata, setHata] = useState('');
  const [hedef, setHedef] = useState<HedefBoySonuc | null>(null);
  const [hedefYuklendi, setHedefYuklendi] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        const r = await doktorFetch(`/api/doktor/hastalar/${patientId}/buyume-egrileri`, {});
        if (hedefBoyGoster) {
          const hr = await doktorFetch(`/api/doktor/hastalar/${patientId}/hedef-boy`, {});
          if (hr.ok) {
            const hd = await hr.json();
            if (hd.arac !== false) setHedef(hd.sonuc || null);
          }
        }
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Büyüme eğrileri alınamadı');
        setVeri(j);
      } catch (e) { setHata(e instanceof Error ? e.message : 'Hata'); }
      finally { setHedefYuklendi(true); }
    })();
  }, [patientId, hedefBoyGoster]);

  const hedefKart = hedefBoyGoster ? <HedefBoyKarti patientId={patientId} hedef={hedef} yuklendi={hedefYuklendi} /> : null;

  if (hata) {
    return (
      <div style={{ display: 'grid', gap: 16, padding: 4 }}>
        <div style={{ padding: '8px 4px', color: '#B42318', fontSize: 13 }}>{hata}</div>
        {hedefKart}
      </div>
    );
  }
  if (!veri) return <div style={{ padding: 20, color: CHROME_RENK.muted, fontSize: 13 }}>Büyüme eğrileri hazırlanıyor…</div>;
  if (veri.dogumBilinmiyor) {
    return (
      <div style={{ display: 'grid', gap: 16, padding: 4 }}>
        <div style={{ padding: '8px 4px', color: CHROME_RENK.muted, fontSize: 13 }}>Doğum tarihi veya cinsiyet kayıtlı değil — büyüme eğrisi çizilemiyor.</div>
        {hedefKart}
      </div>
    );
  }
  return <BuyumeEgrileriGorunumu veri={veri} hedefKart={hedefKart} />;
}
