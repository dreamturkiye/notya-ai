'use client';
/**
 * Araçlar › Kadın Doğum stüdyoları ortak kabuğu (GozAracKabugu ile aynı kalıp). Oturum + branş kapısı (doktorAraciBransaUygun)
 * + yönlendirme, mobil düzen, isteğe bağlı hasta seçici (tr-TR arama). Yalnız kadın hastalıkları ve doğum hekimi açar;
 * başka branş /doktor-tools'a döner (specialty-doktor-araclari).
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DoktorNav from '@/components/doktor/DoktorNav';
import { toolsShell, toolsInput, getAccessTokenAsync, normalizeHastalar, type HastaOption } from '@/lib/doktor/toolsUi';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { doktorAraciBransaUygun } from '@/lib/doktor/doktorAraclari';
import { doneWindowIdsFromClinic } from '../../engines/clinic-fit';
import type { WindowId } from '../../engines/test-windows';
import type { PencereDurum } from '../../engines/araclar';

export const kdStil = {
  kutu: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 18, marginBottom: 14 } as React.CSSProperties,
  etiket: { fontSize: 13, fontWeight: 700, color: '#F9A8D4', marginBottom: 8 } as React.CSSProperties,
  kucuk: { fontSize: 12, color: '#8FA0B5', lineHeight: 1.45 } as React.CSSProperties,
  metin: { fontSize: 14, color: '#EDF1F7', lineHeight: 1.5 } as React.CSSProperties,
  satir: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 } as React.CSSProperties,
  btn: { background: '#DB2777', color: '#FFFFFF', border: 'none', borderRadius: 12, padding: '11px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44 } as React.CSSProperties,
  ghost: { background: 'transparent', color: '#C9D4E3', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 44 } as React.CSSProperties,
  input: { ...toolsInput, fontSize: 16 } as React.CSSProperties,
  hata: { color: '#FCA5A5', fontSize: 13 } as React.CSSProperties,
};

/** Pencere durum renkleri — "kapanmak üzere" en baskın (geri alınamaz). */
export const DURUM_RENK: Record<PencereDurum, { fg: string; bg: string; kenar: string }> = {
  kapaniyor: { fg: '#FFFFFF', bg: '#C2410C', kenar: '#FB923C' },
  kacirildi: { fg: '#FCA5A5', bg: 'rgba(248,113,113,0.12)', kenar: 'rgba(248,113,113,0.45)' },
  gecti: { fg: '#8FA0B5', bg: 'rgba(255,255,255,0.03)', kenar: 'rgba(255,255,255,0.1)' },
  acik: { fg: '#6EE7B7', bg: 'rgba(16,185,129,0.12)', kenar: 'rgba(16,185,129,0.4)' },
  yaklasiyor: { fg: '#93C5FD', bg: 'rgba(59,130,246,0.12)', kenar: 'rgba(59,130,246,0.35)' },
  yapildi: { fg: '#8FA0B5', bg: 'rgba(255,255,255,0.03)', kenar: 'rgba(255,255,255,0.1)' },
  ileride: { fg: '#8FA0B5', bg: 'rgba(255,255,255,0.03)', kenar: 'rgba(255,255,255,0.08)' },
};

export function Secim({ deger, set, secenekler, bos, etiket }: { deger: string; set: (x: string) => void; secenekler: Array<[string, string]>; bos?: string; etiket?: string }) {
  return (
    <select aria-label={etiket} value={deger} onChange={(e) => set(e.target.value)} style={{ ...kdStil.input, width: 'auto', minWidth: 120, minHeight: 44 }}>
      {bos != null && <option value="" style={{ color: '#000' }}>{bos}</option>}
      {secenekler.map(([k, a]) => <option key={k} value={k} style={{ color: '#000' }}>{a}</option>)}
    </select>
  );
}

/** Segment düğmesi (iOS segmented control) — az seçenekli alanlarda select yerine tek dokunuş. */
export function Segment<T extends string>({ deger, set, secenekler, etiket }: { deger: T; set: (x: T) => void; secenekler: Array<[T, string]>; etiket: string }) {
  return (
    <div role="radiogroup" aria-label={etiket} style={{ display: 'inline-flex', flexWrap: 'wrap', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 3, gap: 3 }}>
      {secenekler.map(([k, a]) => {
        const on = k === deger;
        return <button key={k} type="button" role="radio" aria-checked={on} onClick={() => set(k)} style={{ minHeight: 44, padding: '8px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, background: on ? '#DB2777' : 'transparent', color: on ? '#FFFFFF' : '#C9D4E3' }}>{a}</button>;
      })}
    </div>
  );
}

/** Görünür etiketli alan — doldurulunca placeholder kaybolsa da alanın ne olduğu okunur. */
export function Etiketli({ ad, children, genislik }: { ad: string; children: React.ReactNode; genislik?: number | string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: genislik === '100%' ? '1 1 100%' : '0 1 auto', maxWidth: '100%' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#9BB0C7' }}>{ad}</span>
      {children}
    </label>
  );
}

/** Onay kutusu satırı — 44px dokunma alanı. */
export function Kutu({ on, set, children }: { on: boolean; set: (x: boolean) => void; children: React.ReactNode }) {
  return (
    <label style={{ ...kdStil.metin, display: 'flex', gap: 10, alignItems: 'center', minHeight: 44, cursor: 'pointer' }}>
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} style={{ width: 20, height: 20, flex: 'none' }} />
      <span>{children}</span>
    </label>
  );
}

/** Çift sütun (yasal asgari vs klinik öneri) — çakışma asla tek öneriye indirgenmez. */
export function CiftSutun({ baslik, sb, klinik }: { baslik: string; sb: string; klinik: string }) {
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 0' }}>
      <div style={{ ...kdStil.metin, fontWeight: 700, marginBottom: 6 }}>{baslik}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 10 }}><div style={{ ...kdStil.kucuk, fontWeight: 700, color: '#F9A8D4' }}>Yasal asgari (SB / SUT)</div><div style={kdStil.metin}>{sb}</div></div>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 10 }}><div style={{ ...kdStil.kucuk, fontWeight: 700, color: '#93C5FD' }}>Klinik öneri (uluslararası)</div><div style={kdStil.metin}>{klinik}</div></div>
      </div>
    </div>
  );
}

/** Hekimin kendi hasta listesi (/api/doktor/hastalar — doctor_id kapsamlı). Seçim isteğe bağlıdır. */
export function KdHastaSecici({ secili, sec }: { secili: string; sec: (id: string, ad: string) => void }) {
  const [liste, setListe] = useState<HastaOption[] | null>(null);
  const [q, setQ] = useState('');
  const [hata, setHata] = useState('');
  useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        const t = await getAccessTokenAsync();
        const r = await fetch('/api/doktor/hastalar', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
        const j = await r.json().catch(() => ({}));
        if (!iptal) { if (r.ok) setListe(normalizeHastalar(j)); else setHata(j.error || 'Hasta listesi yüklenemedi'); }
      } catch { if (!iptal) setHata('Hasta listesi yüklenemedi'); }
    })();
    return () => { iptal = true; };
  }, []);
  const kucukHarf = (s: string) => s.toLocaleLowerCase('tr-TR');
  const gorunen = (liste || []).filter((h) => !q.trim() || kucukHarf(h.label).includes(kucukHarf(q.trim()))).slice(0, 50);
  return (
    <div>
      <div style={kdStil.satir}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hasta ara (isteğe bağlı)" aria-label="Hasta ara" style={{ ...kdStil.input, flex: '1 1 200px', width: 'auto' }} />
        <select aria-label="Hasta seç" value={secili} onChange={(e) => { const h = (liste || []).find((x) => x.id === e.target.value); sec(e.target.value, h?.label || ''); }} style={{ ...kdStil.input, flex: '1 1 220px', width: 'auto', minHeight: 44 }}>
          <option value="" style={{ color: '#000' }}>{liste == null ? (hata ? 'Liste yüklenemedi' : 'Yükleniyor…') : liste.length ? 'Hasta seçilmedi' : 'Kayıtlı hasta yok'}</option>
          {gorunen.map((h) => <option key={h.id} value={h.id} style={{ color: '#000' }}>{h.label}</option>)}
        </select>
      </div>
      {hata && <div style={{ ...kdStil.hata, marginTop: 6 }}>{hata}</div>}
    </div>
  );
}

/** Seçilen hastanın gebelik özeti — mevcut /api/doktor/gebelik GET (hastaSahibiMi + doctor_id kapsamlı); yeni uç yok. */
export type KdHastaOzeti = {
  gebelikVar: boolean
  sat: string | null
  tdt: string | null
  tdtKaynak: string | null
  rhNegatif: boolean | null
  cogul: boolean
  oncekiSezaryen: number | null
  kesiTipi: string | null
  gravida: number | null
  para: number | null
  dogumTarihi: string | null
  hastaDogum: string | null
  izlemHaftalari: number[]
  yapilanlar: WindowId[]
  vki: number | null
  riskSinifi: 'dusuk' | 'orta' | 'yuksek'
}

const isoGun = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null);

export async function kdHastaOzeti(patientId: string): Promise<KdHastaOzeti> {
  const t = await getAccessTokenAsync();
  const r = await fetch(`/api/doktor/gebelik?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Hasta verisi yüklenemedi');
  const g = j.gebelik as Record<string, unknown> | null;
  const iz = (j.izlemler || []) as Array<{ hafta: number; usg?: Record<string, string | number> | null; ogtt?: unknown; gbs_kultur?: string | null }>;
  const n = (v: unknown) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
  const kilo = n(g?.gebelik_oncesi_kilo), boy = n(g?.boy);
  const risk = g?.risk_sinifi === 'orta' || g?.risk_sinifi === 'yuksek' ? g.risk_sinifi : 'dusuk';
  return {
    gebelikVar: !!g,
    sat: isoGun(g?.sat), tdt: isoGun(g?.tdt), tdtKaynak: (g?.tdt_kaynak as string) || null,
    rhNegatif: g ? !!g.rh_negatif : null,
    cogul: !!g?.cogul_gebelik_tipi && g.cogul_gebelik_tipi !== 'tekil',
    oncekiSezaryen: n(g?.onceki_sezaryen_sayisi), kesiTipi: (g?.onceki_sezaryen_kesi_tipi as string) || null,
    gravida: n(g?.gravida), para: n(g?.para),
    dogumTarihi: isoGun(g?.dogum_tarihi), hastaDogum: isoGun(j.baslik?.dogumTarihi),
    izlemHaftalari: iz.map((x) => Number(x.hafta)).filter((x) => Number.isFinite(x)),
    yapilanlar: g ? doneWindowIdsFromClinic({
      labs: (g.lab_panel || null) as never, kanGrubu: (g.kan_grubu as string) || null,
      izlemler: iz.map((x) => ({ hafta: Number(x.hafta), usg: x.usg || null, ogtt: x.ogtt, gbs_kultur: x.gbs_kultur ?? null })),
      genetik: ((j.genetikTaramalar || []) as Array<{ tur: string }>).map((x) => ({ tur: String(x.tur) })),
      destekAsi: (g.destek_asi || null) as never,
      antiD: Array.isArray(g.anti_d_uygulamalari) ? g.anti_d_uygulamalari : [],
    }) : [],
    vki: kilo && boy ? Math.round((kilo / Math.pow(boy / 100, 2)) * 10) / 10 : null,
    riskSinifi: risk as KdHastaOzeti['riskSinifi'],
  };
}

export async function panoya(metin: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(metin); return true; } catch { return false; }
}

export default function KdAracKabugu({ route, baslik, aciklama, children }: { route: string; baslik: string; aciklama: string; children: React.ReactNode }) {
  const router = useRouter();
  const [izin, setIzin] = useState<boolean | null>(null);
  useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        if (!t) { if (!iptal) { setIzin(false); router.replace('/doktor-tools'); } return; }
        const r = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${t}` } });
        const j = r.ok ? await r.json() : null;
        const ok = doktorAraciBransaUygun(route, j?.data?.specialty);
        if (!iptal) { setIzin(ok); if (!ok) router.replace('/doktor-tools'); }
      } catch { if (!iptal) { setIzin(false); router.replace('/doktor-tools'); } }
    })();
    return () => { iptal = true; };
  }, [router, route]);

  return (
    <div style={toolsShell}>
      <DoktorNav />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px 56px' }}>
        {!izin ? (
          <div style={{ color: '#9BB0C7', fontSize: 15, padding: '12px 0' }}>{izin === null ? 'Yükleniyor…' : 'Bu araç yalnızca kadın hastalıkları ve doğum için.'}</div>
        ) : (
          <>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F472B6', letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: 8 }}>Araçlar · Kadın Doğum</div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#EDF1F7', margin: 0, letterSpacing: '-0.4px', lineHeight: 1.2 }}>{baslik}</h1>
              <p style={{ margin: '8px 0 0', fontSize: 15, color: '#9BB0C7', lineHeight: 1.5, maxWidth: 680 }}>{aciklama}</p>
            </div>
            {children}
          </>
        )}
      </div>
    </div>
  );
}
