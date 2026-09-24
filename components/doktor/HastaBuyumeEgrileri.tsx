'use client';
/**
 * NOTYA-BUYUME-EGRISI-02/03 — Büyüme Eğrileri sekmesi (Kaan 2026-09-14).
 * Küçük kart görünümü + tıklayınca tam sayfa büyük görünüm (Geri + Önceki/Sonraki ile
 * ebeveyne gösterim için gezinme). Neyzi standart persentil çizgileri + hastanın kendi
 * ölçümleri. Kaynak: lib/clinical/buyumeEgrisi.ts (Neyzi 2015, doğrulanmış).
 */
import { useEffect, useState } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import HedefBoyManken from '@/components/hedefBoy/HedefBoyManken';
import type { HedefBoySonuc } from '@/lib/clinical/hedefBoy';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

interface EgriNoktasi { ay: number; deger: number }
interface EgriSerisi { persentil: number; noktalar: EgriNoktasi[] }
interface Olcum { ay: number; deger: number; tarih: string }
interface ParamVeri { birim: string; egriler: EgriSerisi[]; noktalar: Olcum[] }
interface Yanit {
  dogumBilinmiyor: boolean;
  mevcutYasAy: number | null;
  cinsiyet: 'male' | 'female' | null;
  parametreler: { kilo?: ParamVeri; boy?: ParamVeri; basCevresi?: ParamVeri; vki?: ParamVeri | null };
}

function yasEtiketi(ay: number): string {
  if (ay <= 0) return 'Doğum';
  if (ay < 24) return `${Math.round(ay)}a`;
  const yil = Math.round(ay / 12);
  return `${yil}y`;
}
function yasMetniUzun(ay: number): string {
  if (ay <= 0) return 'doğumda';
  if (ay < 24) return `${Math.round(ay)} aylıkken`;
  const yil = Math.floor(ay / 12); const kalanAy = Math.round(ay % 12);
  return kalanAy > 0 ? `${yil} yaş ${kalanAy} aylıkken` : `${yil} yaşındayken`;
}

const RENK_50 = '#2DD4BF';
const RENK_BAND_DIS = 'rgba(148,163,184,0.55)'; // 3/97
const RENK_BAND_ORTA = 'rgba(94,234,212,0.55)'; // 10/90
const RENK_BAND_IC = 'rgba(45,212,191,0.75)';   // 25/75
const RENK_NOKTA = '#F59E0B';

function bandRenk(persentil: number): string {
  if (persentil === 50) return RENK_50;
  if (persentil === 25 || persentil === 75) return RENK_BAND_IC;
  if (persentil === 10 || persentil === 90) return RENK_BAND_ORTA;
  return RENK_BAND_DIS;
}

/** Tek bir eğri — küçük kart (buyuk=false) veya tam sayfa (buyuk=true) aynı bileşenle. Araçlar › Büyüme stüdyosu da kullanır. */
export function Grafik({ veri, birim, buyuk }: { veri: ParamVeri; birim: string; buyuk?: boolean }) {
  const W = buyuk ? 1000 : 320, H = buyuk ? 520 : 190;
  const L = buyuk ? 64 : 34, R = buyuk ? 28 : 10, T = buyuk ? 24 : 10, B = buyuk ? 52 : 22;
  const maxAy = Math.max(...veri.egriler.flatMap((s) => s.noktalar.map((n) => n.ay)), ...veri.noktalar.map((n) => n.ay), 6);
  const tumDegerler = [...veri.egriler.flatMap((s) => s.noktalar.map((n) => n.deger)), ...veri.noktalar.map((n) => n.deger)];
  let min = Math.min(...tumDegerler), max = Math.max(...tumDegerler);
  const pad = (max - min || 1) * 0.08;
  min = Math.max(0, min - pad); max = max + pad;
  const x = (ay: number) => L + (ay / maxAy) * (W - L - R);
  const y = (v: number) => T + (1 - (v - min) / (max - min || 1)) * (H - T - B);

  const etiketler: number[] = [];
  for (let a = 0; a <= Math.min(24, maxAy); a += (buyuk ? 3 : 6)) etiketler.push(a);
  for (let yil = 3; yil * 12 <= maxAy; yil++) etiketler.push(yil * 12);
  if (etiketler[etiketler.length - 1] < maxAy - 3) etiketler.push(Math.round(maxAy));

  const path = (n: EgriNoktasi[]) => n.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.ay).toFixed(1)},${y(p.deger).toFixed(1)}`).join(' ');
  const p50 = veri.egriler.find((s) => s.persentil === 50);
  const alanYolu = p50 ? `${path(p50.noktalar)} L${x(p50.noktalar[p50.noktalar.length - 1].ay).toFixed(1)},${y(min).toFixed(1)} L${x(0).toFixed(1)},${y(min).toFixed(1)} Z` : '';
  const uid = veri.birim.replace(/[^a-z]/gi, '');

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`fill-${uid}${buyuk ? '-b' : ''}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={RENK_50} stopOpacity="0.16" />
          <stop offset="100%" stopColor={RENK_50} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
        const v = min + (max - min) * (1 - f);
        return (
          <g key={i}>
            <line x1={L} x2={W - R} y1={T + f * (H - T - B)} y2={T + f * (H - T - B)} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            <text x={L - (buyuk ? 10 : 6)} y={T + f * (H - T - B) + 3.5} textAnchor="end" fontSize={buyuk ? 13 : 9.5} fill={CHROME_RENK.muted}>{Math.round(v * 10) / 10}</text>
          </g>
        );
      })}
      {etiketler.map((ay, i) => (
        <g key={i}>
          <line x1={x(ay)} x2={x(ay)} y1={T} y2={H - B} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <text x={x(ay)} y={H - B + (buyuk ? 20 : 12)} textAnchor="middle" fontSize={buyuk ? 12.5 : 9} fill={CHROME_RENK.muted}>{yasEtiketi(ay)}</text>
        </g>
      ))}
      {alanYolu && <path d={alanYolu} fill={`url(#fill-${uid}${buyuk ? '-b' : ''})`} />}
      {veri.egriler.map((s) => (
        <g key={s.persentil}>
          <path d={path(s.noktalar)} fill="none" stroke={bandRenk(s.persentil)} strokeWidth={s.persentil === 50 ? (buyuk ? 3.4 : 2.2) : (buyuk ? 1.8 : 1.1)} strokeDasharray={s.persentil === 50 ? undefined : (buyuk ? '5 4' : '3 3')} strokeLinecap="round" />
          {s.noktalar.length > 0 && (
            <text x={x(s.noktalar[s.noktalar.length - 1].ay) + 4} y={y(s.noktalar[s.noktalar.length - 1].deger) + 3} fontSize={buyuk ? 12 : 8.5} fontWeight={s.persentil === 50 ? 700 : 400} fill={bandRenk(s.persentil)}>{s.persentil}.</text>
          )}
        </g>
      ))}
      {veri.noktalar.map((n, i) => (
        <g key={i}>
          <circle cx={x(n.ay)} cy={y(n.deger)} r={buyuk ? 7 : 4} fill={RENK_NOKTA} stroke="#0B1628" strokeWidth={buyuk ? 2.5 : 1.5}>
            <title>{`${yasEtiketi(n.ay)} — ${n.deger} ${birim} (${new Date(n.tarih).toLocaleDateString('tr-TR')})`}</title>
          </circle>
          {buyuk && (
            <text x={x(n.ay)} y={y(n.deger) - 14} textAnchor="middle" fontSize={12} fontWeight={700} fill={RENK_NOKTA}>{n.deger}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

const PARAM_BASLIK: Record<string, string> = { kilo: 'Kilo', boy: 'Boy', basCevresi: 'Baş Çevresi', vki: 'Vücut Kitle İndeksi' };

export default function HastaBuyumeEgrileri({ patientId, hedefBoyGoster = false }: { patientId: string; hedefBoyGoster?: boolean }) {
  const [veri, setVeri] = useState<Yanit | null>(null);
  const [hata, setHata] = useState('');
  const [buyukIndex, setBuyukIndex] = useState<number | null>(null);
  const [hedef, setHedef] = useState<HedefBoySonuc | null>(null);
  const [hedefYuklendi, setHedefYuklendi] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        const r = await fetch(`/api/doktor/hastalar/${patientId}/buyume-egrileri`, { headers: { Authorization: `Bearer ${t}` } });
        if (hedefBoyGoster) {
          const hr = await fetch(`/api/doktor/hastalar/${patientId}/hedef-boy`, { headers: { Authorization: `Bearer ${t}` } });
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

  const hedefKart = hedefBoyGoster ? (
    <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.22)', borderRadius: 14, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, color: CHROME_RENK.ink, fontSize: 14 }}>Anne-Baba Boylarına Göre Hedef Boy</div>
        <a href={`/doktor-tools/hedef-boy?patientId=${patientId}`} style={{ color: '#7A5B1E', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Araçlar › Hedef Boy</a>
      </div>
      {hedef ? (
        <HedefBoyManken sonuc={hedef} tema="doktor" style={{ marginTop: 8 }} />
      ) : hedefYuklendi ? (
        <p style={{ margin: '10px 0 0', fontSize: 13, color: CHROME_RENK.muted, lineHeight: 1.5 }}>
          Intake zorunlu değil. Anne ve baba boyunu Araçlar’dan girin — sonuç aileye mankenlerle gösterilir.
        </p>
      ) : (
        <p style={{ margin: '10px 0 0', fontSize: 13, color: CHROME_RENK.muted }}>Hedef boy yükleniyor…</p>
      )}
    </div>
  ) : null;

  if (hata) {
    return (
      <div style={{ display: 'grid', gap: 16, padding: 4 }}>
        <div style={{ padding: '8px 4px', color: '#F87171', fontSize: 13 }}>{hata}</div>
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

  const { kilo, boy, basCevresi, vki } = veri.parametreler;
  const paramlar = ([['kilo', kilo], ['boy', boy], ['basCevresi', basCevresi], ['vki', vki]] as const).filter(([, v]) => !!v) as [string, ParamVeri][];
  const yasMetni = veri.mevcutYasAy != null ? (veri.mevcutYasAy < 24 ? `${Math.round(veri.mevcutYasAy)} aylık` : `${Math.floor(veri.mevcutYasAy / 12)} yaşında`) : '';

  if (buyukIndex !== null && paramlar[buyukIndex]) {
    const [anahtar, pVeri] = paramlar[buyukIndex];
    const sonOlcum = pVeri.noktalar[pVeri.noktalar.length - 1];
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#080F1A', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
        <div className="buyume-buyuk-bas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: 10 }}>
          <button type="button" onClick={() => setBuyukIndex(null)} style={{ background: 'transparent', border: 'none', color: '#9FB3C8', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>← Geri</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: CHROME_RENK.ink }}>{PARAM_BASLIK[anahtar]} Büyüme Eğrisi <span style={{ fontWeight: 400, color: CHROME_RENK.muted, fontSize: 14 }}>({pVeri.birim})</span></div>
            <div style={{ fontSize: 13, color: CHROME_RENK.muted, marginTop: 2 }}>{veri.cinsiyet === 'female' ? 'Kız' : 'Erkek'} · {yasMetni} · Neyzi Türk çocukları standartları</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" disabled={buyukIndex === 0} onClick={() => setBuyukIndex((i) => (i! - 1 + paramlar.length) % paramlar.length)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: buyukIndex === 0 ? '#475569' : CHROME_RENK.ink, borderRadius: 8, padding: '8px 14px', cursor: buyukIndex === 0 ? 'default' : 'pointer', fontSize: 14 }}>‹ Önceki</button>
            <button type="button" onClick={() => setBuyukIndex((i) => (i! + 1) % paramlar.length)} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Sonraki ›</button>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, minHeight: 0 }}>
          <div style={{ width: '100%', maxWidth: 1040 }}>
            <Grafik veri={pVeri} birim={pVeri.birim} buyuk />
          </div>
        </div>
        <div style={{ padding: '10px 24px 20px', textAlign: 'center', fontSize: 13, color: CHROME_RENK.muted }}>
          <span style={{ color: RENK_NOKTA, fontWeight: 700 }}>●</span> Hastanın ölçümleri
          <span style={{ margin: '0 10px', color: '#334155' }}>·</span>
          <span style={{ color: RENK_50, fontWeight: 700 }}>—</span> 50. persentil
          <span style={{ margin: '0 10px', color: '#334155' }}>·</span>
          kesikli çizgiler 3 / 10 / 25 / 75 / 90 / 97. persentil bantları
          {sonOlcum && <div style={{ marginTop: 6, color: CHROME_RENK.muted }}>Son ölçüm: {sonOlcum.deger} {pVeri.birim}, {yasMetniUzun(sonOlcum.ay)} ({new Date(sonOlcum.tarih).toLocaleDateString('tr-TR')})</div>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontSize: 13, color: CHROME_RENK.muted, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span>Neyzi Türk çocukları büyüme standartları · {veri.cinsiyet === 'female' ? 'Kız' : 'Erkek'} · {yasMetni}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
          <span><span style={{ color: RENK_NOKTA, fontWeight: 700 }}>●</span> ölçüm</span>
          <span><span style={{ color: RENK_50, fontWeight: 700 }}>—</span> 50p</span>
          <span style={{ color: CHROME_RENK.muted }}>┄ 3/10/25/75/90/97p</span>
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {paramlar.map(([anahtar, pVeri], i) => (
          <button
            key={anahtar}
            type="button"
            onClick={() => setBuyukIndex(i)}
            className="buyume-karti"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: 16, textAlign: 'left', cursor: 'pointer', transition: 'transform .15s, border-color .15s, background .15s' }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, color: CHROME_RENK.ink, fontSize: 14 }}>{PARAM_BASLIK[anahtar]} <span style={{ fontWeight: 400, color: CHROME_RENK.muted, fontSize: 12 }}>({pVeri.birim})</span></span>
              <span style={{ fontSize: 11, color: '#2DD4BF' }}>Büyüt ⤢</span>
            </div>
            <Grafik veri={pVeri} birim={pVeri.birim} />
          </button>
        ))}
      </div>
      {!vki && (
        <div style={{ fontSize: 12, color: CHROME_RENK.muted }}>Vücut Kitle İndeksi eğrisi 2 yaşından itibaren gösterilir.</div>
      )}
      {hedefKart}
      <style>{`
        .buyume-karti:hover { border-color: rgba(45,212,191,0.4) !important; background: rgba(45,212,191,0.05) !important; transform: translateY(-2px); }
        @media (max-width: 640px) { .buyume-buyuk-bas { justify-content: center !important; text-align: center; padding: 12px 14px !important; } }
      `}</style>
    </div>
  );
}
