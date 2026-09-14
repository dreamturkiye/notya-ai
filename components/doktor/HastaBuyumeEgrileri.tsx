'use client';
/**
 * NOTYA-BUYUME-EGRISI-02 — Büyüme Eğrileri sekmesi (Kaan 2026-09-14).
 * Neyzi standart persentil çizgileri (3/10/25/50/75/90/97) + hastanın kendi ölçümleri aynı
 * SVG grafikte. 0-2 yaş aylık, 2 yaş sonrası yıllık eksen etiketleri (tek sürekli ay ekseni
 * üzerinde, yoğunluk yaşa göre uyarlanır — iki ayrı grafik yerine tek okunaklı eksen).
 * VKİ yalnız 2 yaş ve üzeri. Kaynak: lib/clinical/buyumeEgrisi.ts (Neyzi 2015, doğrulanmış).
 */
import { useEffect, useState } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';

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

function Grafik({ veri, baslik, birim }: { veri: ParamVeri; baslik: string; birim: string }) {
  const W = 640, H = 300, L = 46, R = 16, T = 16, B = 30;
  const maxAy = Math.max(...veri.egriler.flatMap((s) => s.noktalar.map((n) => n.ay)), ...veri.noktalar.map((n) => n.ay), 6);
  const tumDegerler = [...veri.egriler.flatMap((s) => s.noktalar.map((n) => n.deger)), ...veri.noktalar.map((n) => n.deger)];
  let min = Math.min(...tumDegerler), max = Math.max(...tumDegerler);
  const pad = (max - min || 1) * 0.08;
  min = Math.max(0, min - pad); max = max + pad;
  const x = (ay: number) => L + (ay / maxAy) * (W - L - R);
  const y = (v: number) => T + (1 - (v - min) / (max - min || 1)) * (H - T - B);

  // Eksen etiketleri: 24 aya kadar 3 ayda bir, sonrası yıllık — 0-2 yaş aylık, 2 yaş sonrası yıllık
  const etiketler: number[] = [];
  for (let a = 0; a <= Math.min(24, maxAy); a += 6) etiketler.push(a);
  for (let yil = 3; yil * 12 <= maxAy; yil++) etiketler.push(yil * 12);
  if (etiketler[etiketler.length - 1] < maxAy - 3) etiketler.push(Math.round(maxAy));

  const path = (n: EgriNoktasi[]) => n.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.ay).toFixed(1)},${y(p.deger).toFixed(1)}`).join(' ');
  const renk50 = '#2DD4BF';
  const bantRenk = 'rgba(45,212,191,0.35)';

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}>
      <div style={{ fontWeight: 700, color: '#EDF1F7', marginBottom: 8, fontSize: 14 }}>{baslik} <span style={{ fontWeight: 400, color: '#64748B', fontSize: 12 }}>({birim})</span></div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={baslik} style={{ display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
          const v = min + (max - min) * (1 - f);
          return (
            <g key={i}>
              <line x1={L} x2={W - R} y1={T + f * (H - T - B)} y2={T + f * (H - T - B)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x={L - 6} y={T + f * (H - T - B) + 3.5} textAnchor="end" fontSize="9.5" fill="#64748B">{Math.round(v * 10) / 10}</text>
            </g>
          );
        })}
        {etiketler.map((ay, i) => (
          <text key={i} x={x(ay)} y={H - 8} textAnchor="middle" fontSize="9.5" fill="#64748B">{yasEtiketi(ay)}</text>
        ))}
        {veri.egriler.map((s) => (
          <g key={s.persentil}>
            <path d={path(s.noktalar)} fill="none" stroke={s.persentil === 50 ? renk50 : bantRenk} strokeWidth={s.persentil === 50 ? 2.4 : 1.2} strokeDasharray={s.persentil === 50 ? undefined : '3 3'} />
            {s.noktalar.length > 0 && (
              <text x={x(s.noktalar[s.noktalar.length - 1].ay) + 3} y={y(s.noktalar[s.noktalar.length - 1].deger) + 3} fontSize="9" fill={s.persentil === 50 ? renk50 : '#64748B'}>{s.persentil}.</text>
            )}
          </g>
        ))}
        {veri.noktalar.map((n, i) => (
          <g key={i}>
            <circle cx={x(n.ay)} cy={y(n.deger)} r="4.5" fill="#F59E0B" stroke="#0B1628" strokeWidth="1.5">
              <title>{`${yasEtiketi(n.ay)} — ${n.deger} ${birim} (${new Date(n.tarih).toLocaleDateString('tr-TR')})`}</title>
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function HastaBuyumeEgrileri({ patientId }: { patientId: string }) {
  const [veri, setVeri] = useState<Yanit | null>(null);
  const [hata, setHata] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        const r = await fetch(`/api/doktor/hastalar/${patientId}/buyume-egrileri`, { headers: { Authorization: `Bearer ${t}` } });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Büyüme eğrileri alınamadı');
        setVeri(j);
      } catch (e) { setHata(e instanceof Error ? e.message : 'Hata'); }
    })();
  }, [patientId]);

  if (hata) return <div style={{ padding: 20, color: '#F87171', fontSize: 13 }}>{hata}</div>;
  if (!veri) return <div style={{ padding: 20, color: '#8FA0B5', fontSize: 13 }}>Büyüme eğrileri hazırlanıyor…</div>;
  if (veri.dogumBilinmiyor) return <div style={{ padding: 20, color: '#8FA0B5', fontSize: 13 }}>Doğum tarihi veya cinsiyet kayıtlı değil — büyüme eğrisi çizilemiyor.</div>;

  const { kilo, boy, basCevresi, vki } = veri.parametreler;
  const yasMetni = veri.mevcutYasAy != null ? (veri.mevcutYasAy < 24 ? `${Math.round(veri.mevcutYasAy)} aylık` : `${Math.floor(veri.mevcutYasAy / 12)} yaşında`) : '';

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontSize: 13, color: '#8FA0B5' }}>
        Neyzi Türk çocukları büyüme standartları · {veri.cinsiyet === 'female' ? 'Kız' : 'Erkek'} · {yasMetni}
        {' · '}turuncu noktalar hastanın kendi muayene kayıtları, yeşil çizgi 50. persentil, kesikli çizgiler 3/10/25/75/90/97. persentil bantları.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {kilo && <Grafik veri={kilo} baslik="Kilo" birim={kilo.birim} />}
        {boy && <Grafik veri={boy} baslik="Boy" birim={boy.birim} />}
        {basCevresi && <Grafik veri={basCevresi} baslik="Baş Çevresi" birim={basCevresi.birim} />}
        {vki && <Grafik veri={vki} baslik="Vücut Kitle İndeksi" birim={vki.birim} />}
      </div>
      {!vki && (
        <div style={{ fontSize: 12, color: '#64748B' }}>Vücut Kitle İndeksi eğrisi 2 yaşından itibaren gösterilir.</div>
      )}
    </div>
  );
}
