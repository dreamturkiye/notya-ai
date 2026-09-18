'use client';
/**
 * PEDI-ARACLAR-01 — Araçlar › pediatri stüdyoları ortak kabuğu (GozAracKabugu ile aynı desen ve görsel dil).
 * Oturum + branş kapısı (doktorAraciBransaUygun) + yönlendirme, mobil düzen, isteğe bağlı hasta seçici (tr-TR arama).
 * Yalnız pediatri hekimi açar; başka branş /doktor-tools'a döner (specialty-doktor-araclari).
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DoktorNav from '@/components/doktor/DoktorNav';
import { toolsShell, toolsInput, getAccessTokenAsync, normalizeHastalar, type HastaOption } from '@/lib/doktor/toolsUi';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { doktorAraciBransaUygun } from '@/lib/doktor/doktorAraclari';

export const pediStil = {
  kutu: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 18, marginBottom: 14, minWidth: 0 } as React.CSSProperties,
  etiket: { fontSize: 13, fontWeight: 700, color: '#2DD4BF', marginBottom: 8 } as React.CSSProperties,
  kucuk: { fontSize: 12, color: '#8FA0B5', lineHeight: 1.45 } as React.CSSProperties,
  metin: { fontSize: 14, color: '#EDF1F7', lineHeight: 1.5 } as React.CSSProperties,
  satir: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 } as React.CSSProperties,
  btn: { background: '#0F9B8E', color: '#041016', border: 'none', borderRadius: 12, padding: '11px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44 } as React.CSSProperties,
  ghost: { background: 'transparent', color: '#C9D4E3', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 44, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' } as React.CSSProperties,
  input: { ...toolsInput, fontSize: 16, minHeight: 44 } as React.CSSProperties,
  hata: { color: '#FCA5A5', fontSize: 13 } as React.CSSProperties,
  uyari: { background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.35)', color: '#FDE68A', borderRadius: 12, padding: '10px 12px', fontSize: 13, lineHeight: 1.45 } as React.CSSProperties,
  kirmizi: { background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.4)', color: '#FCA5A5', borderRadius: 12, padding: '10px 12px', fontSize: 13, lineHeight: 1.45 } as React.CSSProperties,
  /** Geniş içerik (tablo) kendi kabında kayar — sayfa yatay kaymaz (390 px). */
  kaydir: { overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' } as React.CSSProperties,
};

/** Etiketli alan — etiket üstte, girdi tam genişlik. */
export function Alan({ etiket, ipucu, children }: { etiket: string; ipucu?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 6, minWidth: 0 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#C9D4E3' }}>{etiket}</span>
      {children}
      {ipucu ? <span style={pediStil.kucuk}>{ipucu}</span> : null}
    </label>
  );
}

/** iOS tarzı segmentli seçim — her parça ≥ 44 px. */
export function Segment<T extends string | number>({ deger, set, secenekler, etiket }: { deger: T; set: (x: T) => void; secenekler: Array<[T, string]>; etiket: string }) {
  return (
    <div role="radiogroup" aria-label={etiket} style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 3, flexWrap: 'wrap' }}>
      {secenekler.map(([k, a]) => {
        const on = k === deger;
        return (
          <button key={String(k)} type="button" role="radio" aria-checked={on} onClick={() => set(k)}
            style={{ flex: '1 1 auto', minHeight: 40, minWidth: 44, padding: '8px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: on ? 700 : 500, background: on ? '#0F9B8E' : 'transparent', color: on ? '#041016' : '#C9D4E3' }}>
            {a}
          </button>
        );
      })}
    </div>
  );
}

/** Gelişmiş seçenekler — varsayılan kapalı (ilk ekranı kalabalıklaştırmaz). */
export function Katlanir({ baslik, acik: baslangic = false, children, rozet }: { baslik: string; acik?: boolean; children: React.ReactNode; rozet?: string }) {
  const [acik, setAcik] = useState(baslangic);
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 12, paddingTop: 4 }}>
      <button type="button" aria-expanded={acik} onClick={() => setAcik(!acik)} style={{ ...pediStil.ghost, border: 'none', padding: '8px 0', width: '100%', justifyContent: 'space-between', color: '#9BB0C7' }}>
        <span>{baslik}{rozet ? <span style={{ marginLeft: 8, fontSize: 12, color: '#5EEAD4' }}>{rozet}</span> : null}</span>
        <span aria-hidden style={{ transform: acik ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>›</span>
      </button>
      {acik && <div style={{ paddingTop: 6 }}>{children}</div>}
    </div>
  );
}

/** Uygulamanın hekim kilidi dili — her klinik çıktının yanında. */
export function TaslakNotu({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{ ...pediStil.kucuk, marginTop: 10, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <span style={{ flexShrink: 0, border: '1px solid rgba(45,212,191,0.4)', color: '#5EEAD4', borderRadius: 999, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>TASLAK</span>
      <span>{children || 'Karar desteğidir; klinik yorum ve onay hekimindir. Nota otomatik yazılmaz.'}</span>
    </div>
  );
}

/** Panoya kopyala — sonuç metni hekimin kendi notuna yapıştırması için. */
export function KopyalaButonu({ metin, etiket = 'Kopyala' }: { metin: string; etiket?: string }) {
  const [tamam, setTamam] = useState(false);
  return (
    <button type="button" disabled={!metin} onClick={async () => {
      try { await navigator.clipboard.writeText(metin); setTamam(true); setTimeout(() => setTamam(false), 1600); } catch { /* izin yok */ }
    }} style={{ ...pediStil.ghost, opacity: metin ? 1 : 0.5 }}>{tamam ? 'Kopyalandı ✓' : etiket}</button>
  );
}

/** Hekimin kendi hasta listesi (/api/doktor/hastalar — doctor_id kapsamlı). Seçim isteğe bağlıdır. */
export function PediHastaSecici({ secili, sec }: { secili: string; sec: (id: string, ad: string) => void }) {
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
      <div style={{ ...pediStil.satir, marginTop: 0 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hasta ara (isteğe bağlı)" aria-label="Hasta ara" style={{ ...pediStil.input, flex: '1 1 180px', width: 'auto', minWidth: 0 }} />
        <select aria-label="Hasta seç" value={secili} onChange={(e) => { const h = (liste || []).find((x) => x.id === e.target.value); sec(e.target.value, h?.label || ''); }} style={{ ...pediStil.input, flex: '1 1 200px', width: 'auto', minWidth: 0 }}>
          <option value="" style={{ color: '#000' }}>{liste == null ? 'Yükleniyor…' : 'Hasta seçilmedi — elle hesap'}</option>
          {gorunen.map((h) => <option key={h.id} value={h.id} style={{ color: '#000' }}>{h.label}</option>)}
        </select>
      </div>
      {hata && <div style={{ ...pediStil.hata, marginTop: 6 }}>{hata}</div>}
    </div>
  );
}

export interface PediHastaOzet { dogumIso: string | null; cinsiyet: 'male' | 'female' | null; yasAy: number | null }

/** Seçili hastanın doğum tarihi / cinsiyeti (/api/doktor/pediatri — sahiplik sunucuda doğrulanır). */
export function usePediHasta(patientId: string): { ozet: PediHastaOzet | null; hata: string; yukleniyor: boolean } {
  const [ozet, setOzet] = useState<PediHastaOzet | null>(null);
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  useEffect(() => {
    setOzet(null); setHata('');
    if (!patientId) return;
    let iptal = false;
    setYukleniyor(true);
    (async () => {
      try {
        const t = await getAccessTokenAsync();
        const r = await fetch(`/api/doktor/pediatri?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
        const j = await r.json().catch(() => ({}));
        if (!iptal) { if (r.ok) setOzet(j); else setHata(j.error || 'Hasta bilgisi alınamadı'); }
      } catch { if (!iptal) setHata('Hasta bilgisi alınamadı — bağlantıyı kontrol edin.'); }
      finally { if (!iptal) setYukleniyor(false); }
    })();
    return () => { iptal = true; };
  }, [patientId]);
  return { ozet, hata, yukleniyor };
}

export default function PediAracKabugu({ route, baslik, aciklama, children }: { route: string; baslik: string; aciklama: string; children: React.ReactNode }) {
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
    <div style={{ ...toolsShell, overflowX: 'hidden' }}>
      <DoktorNav />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px 56px', boxSizing: 'border-box' }}>
        {!izin ? (
          <div style={{ color: '#9BB0C7', fontSize: 15, padding: '12px 0' }}>{izin === null ? 'Yükleniyor…' : 'Bu araç yalnızca pediatri için.'}</div>
        ) : (
          <>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#14B8A6', letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: 8 }}>Araçlar · Pediatri</div>
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
