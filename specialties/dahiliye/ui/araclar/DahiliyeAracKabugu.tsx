'use client';
/**
 * DAH-EXCEPTIONAL-01 — Araçlar › dahiliye stüdyoları ortak kabuğu. Oturum + branş kapısı (doktorAraciBransaUygun) + yönlendirme,
 * mobil düzen, hasta seçici. Yalnız dahiliye hekimi açar; başka branş /doktor-tools'a döner (specialty-doktor-araclari).
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DoktorNav from '@/components/doktor/DoktorNav';
import { toolsShell, toolsInput, getAccessTokenAsync, normalizeHastalar, type HastaOption } from '@/lib/doktor/toolsUi';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { doktorAraciBransaUygun } from '@/lib/doktor/doktorAraclari';

export const dahStil = {
  kutu: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 18, marginBottom: 14 } as React.CSSProperties,
  etiket: { fontSize: 13, fontWeight: 700, color: '#5EEAD4', marginBottom: 8 } as React.CSSProperties,
  kucuk: { fontSize: 12, color: '#8FA0B5', lineHeight: 1.45 } as React.CSSProperties,
  metin: { fontSize: 14, color: '#EDF1F7', lineHeight: 1.5 } as React.CSSProperties,
  satir: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 } as React.CSSProperties,
  btn: { background: '#0D9488', color: '#ECFEFF', border: 'none', borderRadius: 12, padding: '11px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44 } as React.CSSProperties,
  ghost: { background: 'transparent', color: '#C9D4E3', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 44 } as React.CSSProperties,
  input: { ...toolsInput, fontSize: 16 } as React.CSSProperties,
  hata: { color: '#FCA5A5', fontSize: 13 } as React.CSSProperties,
  iyi: { color: '#5EEAD4', fontSize: 14, fontWeight: 700 } as React.CSSProperties,
};

export function Secim({ deger, set, secenekler, bos, etiket }: { deger: string; set: (x: string) => void; secenekler: Array<[string, string]>; bos?: string; etiket?: string }) {
  return (
    <select aria-label={etiket} value={deger} onChange={(e) => set(e.target.value)} style={{ ...dahStil.input, width: 'auto', minWidth: 120, minHeight: 44 }}>
      {bos != null && <option value="" style={{ color: '#000' }}>{bos}</option>}
      {secenekler.map(([k, a]) => <option key={k} value={k} style={{ color: '#000' }}>{a}</option>)}
    </select>
  );
}

export function Onay({ ad, deger, set, aciklama }: { ad: string; deger: boolean; set: (b: boolean) => void; aciklama?: string }) {
  return (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', minHeight: 44, padding: '6px 0', cursor: 'pointer', flex: '1 1 240px' }}>
      <input type="checkbox" checked={deger} onChange={(e) => set(e.target.checked)} style={{ width: 20, height: 20, marginTop: 3 }} />
      <span>
        <span style={dahStil.metin}>{ad}</span>
        {aciklama && <span style={{ ...dahStil.kucuk, display: 'block' }}>{aciklama}</span>}
      </span>
    </label>
  );
}

export function Sayi({ ad, deger, set, birim, genislik = 110, adim }: { ad: string; deger: string; set: (x: string) => void; birim?: string; genislik?: number; adim?: string }) {
  return (
    <label style={{ ...dahStil.metin, display: 'flex', gap: 6, alignItems: 'center' }}>
      {ad}
      <input type="number" inputMode="decimal" step={adim} aria-label={ad} value={deger} onChange={(e) => set(e.target.value)} style={{ ...dahStil.input, width: genislik, minHeight: 44 }} />
      {birim && <span style={dahStil.kucuk}>{birim}</span>}
    </label>
  );
}

/** Metni panoya kopyalar; destek yoksa sessizce false döner (mobil Safari eski sürümleri). */
export async function panoyaKopyala(metin: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(metin);
    return true;
  } catch { return false; }
}

export function KopyalaButonu({ metin, etiket = 'Sonucu kopyala' }: { metin: string; etiket?: string }) {
  const [durum, setDurum] = useState('');
  return (
    <div style={dahStil.satir}>
      <button
        type="button"
        style={dahStil.ghost}
        onClick={async () => { setDurum((await panoyaKopyala(metin)) ? 'Kopyalandı' : 'Kopyalanamadı — metni seçip kopyalayın'); }}
      >{etiket}</button>
      {durum && <span style={dahStil.kucuk} aria-live="polite">{durum}</span>}
    </div>
  );
}

/** Hekimin kendi hasta listesi (/api/doktor/hastalar — doctor_id kapsamlı). Seçim isteğe bağlıdır. */
export function DahHastaSecici({ secili, sec }: { secili: string; sec: (id: string, ad: string) => void }) {
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
      <div style={dahStil.satir}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hasta ara (isteğe bağlı)" aria-label="Hasta ara" style={{ ...dahStil.input, flex: '1 1 200px', width: 'auto' }} />
        <select aria-label="Hasta seç" value={secili} onChange={(e) => { const h = (liste || []).find((x) => x.id === e.target.value); sec(e.target.value, h?.label || ''); }} style={{ ...dahStil.input, flex: '1 1 220px', width: 'auto', minHeight: 44 }}>
          <option value="" style={{ color: '#000' }}>{liste == null ? 'Yükleniyor…' : 'Hasta seçilmedi'}</option>
          {gorunen.map((h) => <option key={h.id} value={h.id} style={{ color: '#000' }}>{h.label}</option>)}
        </select>
      </div>
      {hata && <div style={{ ...dahStil.hata, marginTop: 6 }}>{hata}</div>}
    </div>
  );
}

export default function DahiliyeAracKabugu({ route, baslik, aciklama, children }: { route: string; baslik: string; aciklama: string; children: React.ReactNode }) {
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
          <div style={{ color: '#9BB0C7', fontSize: 15, padding: '12px 0' }}>{izin === null ? 'Yükleniyor…' : 'Bu araç yalnızca dahiliye için.'}</div>
        ) : (
          <>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#14B8A6', letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: 8 }}>Araçlar · İç Hastalıkları</div>
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
