'use client';
/**
 * PSIK-EXCEPTIONAL-01 — Araçlar › psikiyatri stüdyoları ortak kabuğu. Oturum + branş kapısı
 * (doktorAraciBransaUygun) + yönlendirme, mobil düzen, hasta seçici. Yalnız psikiyatri hekimi açar;
 * başka branş /doktor-tools'a döner (specialty-doktor-araclari).
 *
 * DahiliyeAracKabugu ile aynı desen; vurgu rengi indigo (#6366F1).
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DoktorNav from '@/components/doktor/DoktorNav';
import { toolsShell, toolsInput, getAccessTokenAsync, normalizeHastalar, type HastaOption } from '@/lib/doktor/toolsUi';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { doktorAraciBransaUygun } from '@/lib/doktor/doktorAraclari';

export const psikStil = {
  kutu: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 18, marginBottom: 14 } as React.CSSProperties,
  etiket: { fontSize: 13, fontWeight: 700, color: '#A5B4FC', marginBottom: 8 } as React.CSSProperties,
  kucuk: { fontSize: 12, color: '#8FA0B5', lineHeight: 1.45 } as React.CSSProperties,
  metin: { fontSize: 14, color: '#EDF1F7', lineHeight: 1.5 } as React.CSSProperties,
  satir: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 } as React.CSSProperties,
  btn: { background: '#6366F1', color: '#EEF2FF', border: 'none', borderRadius: 12, padding: '11px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44 } as React.CSSProperties,
  ghost: { background: 'transparent', color: '#C9D4E3', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 44 } as React.CSSProperties,
  input: { ...toolsInput, fontSize: 16 } as React.CSSProperties,
  hata: { color: '#FCA5A5', fontSize: 13 } as React.CSSProperties,
  iyi: { color: '#A5B4FC', fontSize: 14, fontWeight: 700 } as React.CSSProperties,
  uyari: { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.4)', color: '#FCA5A5', borderRadius: 12, padding: '10px 12px', fontSize: 13, lineHeight: 1.5 } as React.CSSProperties,
};

export function PsikSecim({ deger, set, secenekler, bos, etiket }: { deger: string; set: (x: string) => void; secenekler: Array<[string, string]>; bos?: string; etiket?: string }) {
  return (
    <select aria-label={etiket} value={deger} onChange={(e) => set(e.target.value)} style={{ ...psikStil.input, width: 'auto', minWidth: 120, minHeight: 44 }}>
      {bos != null && <option value="" style={{ color: '#000' }}>{bos}</option>}
      {secenekler.map(([k, a]) => <option key={k} value={k} style={{ color: '#000' }}>{a}</option>)}
    </select>
  );
}

export function PsikOnay({ ad, deger, set, aciklama }: { ad: string; deger: boolean; set: (b: boolean) => void; aciklama?: string }) {
  return (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', minHeight: 44, padding: '6px 0', cursor: 'pointer', flex: '1 1 260px' }}>
      <input type="checkbox" checked={deger} onChange={(e) => set(e.target.checked)} style={{ width: 20, height: 20, marginTop: 3 }} />
      <span>
        <span style={psikStil.metin}>{ad}</span>
        {aciklama && <span style={{ ...psikStil.kucuk, display: 'block' }}>{aciklama}</span>}
      </span>
    </label>
  );
}

/** 0–3 sıklık satırı — PHQ-9 / GAD-7 maddeleri için tek bileşen. */
export function PsikMadde({
  no, metin, secenekler, deger, set,
}: { no: number; metin: string; secenekler: ReadonlyArray<{ deger: 0 | 1 | 2 | 3; etiket: string }>; deger: number | null; set: (v: number | null) => void }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={psikStil.metin}>{no}. {metin}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        {secenekler.map((s) => (
          <button
            key={s.deger}
            type="button"
            aria-pressed={deger === s.deger}
            onClick={() => set(deger === s.deger ? null : s.deger)}
            style={{
              ...psikStil.ghost,
              minHeight: 40,
              padding: '8px 12px',
              background: deger === s.deger ? 'rgba(99,102,241,0.25)' : 'transparent',
              color: deger === s.deger ? '#C7D2FE' : '#C9D4E3',
              borderColor: deger === s.deger ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.16)',
            }}
          >{s.deger} · {s.etiket}</button>
        ))}
      </div>
    </div>
  );
}

export async function panoyaKopyala(metin: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(metin);
    return true;
  } catch { return false; }
}

export function PsikKopyala({ metin, etiket = 'Sonucu kopyala' }: { metin: string; etiket?: string }) {
  const [durum, setDurum] = useState('');
  return (
    <div style={psikStil.satir}>
      <button
        type="button"
        style={psikStil.ghost}
        onClick={async () => { setDurum((await panoyaKopyala(metin)) ? 'Kopyalandı' : 'Kopyalanamadı — metni seçip kopyalayın'); }}
      >{etiket}</button>
      {durum && <span style={psikStil.kucuk} aria-live="polite">{durum}</span>}
    </div>
  );
}

/** Hekimin kendi hasta listesi (/api/doktor/hastalar — doctor_id kapsamlı). Seçim isteğe bağlıdır. */
export function PsikHastaSecici({ secili, sec }: { secili: string; sec: (id: string, ad: string) => void }) {
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
      <div style={psikStil.satir}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hasta ara (isteğe bağlı)" aria-label="Hasta ara" style={{ ...psikStil.input, flex: '1 1 200px', width: 'auto' }} />
        <select aria-label="Hasta seç" value={secili} onChange={(e) => { const h = (liste || []).find((x) => x.id === e.target.value); sec(e.target.value, h?.label || ''); }} style={{ ...psikStil.input, flex: '1 1 220px', width: 'auto', minHeight: 44 }}>
          <option value="" style={{ color: '#000' }}>{liste == null ? 'Yükleniyor…' : 'Hasta seçilmedi'}</option>
          {gorunen.map((h) => <option key={h.id} value={h.id} style={{ color: '#000' }}>{h.label}</option>)}
        </select>
      </div>
      {hata && <div style={{ ...psikStil.hata, marginTop: 6 }}>{hata}</div>}
    </div>
  );
}

export default function PsikAracKabugu({ route, baslik, aciklama, children }: { route: string; baslik: string; aciklama: string; children: React.ReactNode }) {
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
          <div style={{ color: '#9BB0C7', fontSize: 15, padding: '12px 0' }}>{izin === null ? 'Yükleniyor…' : 'Bu araç yalnızca psikiyatri için.'}</div>
        ) : (
          <>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: 8 }}>Araçlar · Psikiyatri</div>
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
