'use client';
/**
 * ARACLAR-CILA-01 — Doktor Araçları ortak UI kütüphanesi. TEK kaynak.
 *
 * Neden: beş branşın araç kabuğu (Göz, Dermatoloji, Dahiliye, Kadın Hastalıkları ve Doğum, Pediatri)
 * farklı sprintlerde yazıldı; her sprint kütüphaneyi büyüttü ama öncekiler geriye doldurulmadı —
 * göz kabuğunda 3, pediatri kabuğunda 12 paylaşılan parça vardı, aynı `Secim`in beş kopyası dolaşıyordu.
 * Burası o parçaların tek evi: stil sözlüğü, alanlar, segment, katlanır bölüm, taslak rozeti, hasta seçici.
 *
 * Branş kabukları KALIR: branş kapısı (doktorAraciBransaUygun), başlık ve renk vurgusu branşa özeldir.
 * Kabuk yalnız vurgusunu `AracVurguSaglayici` ile verir; buradaki bileşenler o vurguyu okur.
 * `gozStil` / `dermStil` / `dahStil` / `kdStil` / `pediStil` dışa aktarımları kabuklarda duruyor —
 * artık `aracStil(<vurgu>)` sonucunu gösteren ince sarmalayıcılar, 27 aracın importu kırılmıyor.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { toolsInput, getAccessTokenAsync, normalizeHastalar, type HastaOption } from '@/lib/doktor/toolsUi';
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu';
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon';

/** Bir branşın renk vurgusu — birincil düğme, etiket ve sayfa üst şeridi. */
export type AracVurgu = {
  /** Birincil düğme zemini. */ ana: string;
  /** Birincil düğme yazısı. */ anaMetin: string;
  /** Kart etiketi / rozet yazısı. */ yumusak: string;
  /** Sayfa üstündeki "Araçlar · …" şeridi. */ baslik: string;
};

export const VURGU_TEAL: AracVurgu = { ana: '#0F9B8E', anaMetin: '#041016', yumusak: '#2DD4BF', baslik: '#14B8A6' };
export const VURGU_DAHILIYE: AracVurgu = { ana: '#0D9488', anaMetin: '#ECFEFF', yumusak: '#5EEAD4', baslik: '#14B8A6' };
export const VURGU_DERM: AracVurgu = { ana: '#DB2777', anaMetin: '#FFF1F7', yumusak: '#F9A8D4', baslik: '#F472B6' };
export const VURGU_KD: AracVurgu = { ana: '#DB2777', anaMetin: '#FFFFFF', yumusak: '#F9A8D4', baslik: '#F472B6' };
export const VURGU_PSIK: AracVurgu = { ana: '#6366F1', anaMetin: '#EEF2FF', yumusak: '#A5B4FC', baslik: '#818CF8' };

export interface AracStil {
  kutu: React.CSSProperties;
  etiket: React.CSSProperties;
  kucuk: React.CSSProperties;
  metin: React.CSSProperties;
  satir: React.CSSProperties;
  btn: React.CSSProperties;
  ghost: React.CSSProperties;
  input: React.CSSProperties;
  hata: React.CSSProperties;
  uyari: React.CSSProperties;
  kirmizi: React.CSSProperties;
  iyi: React.CSSProperties;
  /** Geniş içerik (tablo) kendi kabında kayar — sayfa yatay kaymaz (390 px). */
  kaydir: React.CSSProperties;
}

const stilOnbellek = new Map<AracVurgu, AracStil>();

/** Bir vurgudan tam stil sözlüğü. Aynı vurgu için aynı nesne döner (referans kararlı). */
export function aracStil(v: AracVurgu): AracStil {
  const hazir = stilOnbellek.get(v);
  if (hazir) return hazir;
  const s: AracStil = {
    kutu: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 18, marginBottom: 14, minWidth: 0 },
    etiket: { fontSize: 13, fontWeight: 700, color: v.yumusak, marginBottom: 8 },
    kucuk: { fontSize: 12, color: '#8FA0B5', lineHeight: 1.45 },
    metin: { fontSize: 14, color: '#EDF1F7', lineHeight: 1.5 },
    satir: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 },
    btn: { background: v.ana, color: v.anaMetin, border: 'none', borderRadius: 12, padding: '11px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44 },
    ghost: { background: 'transparent', color: '#C9D4E3', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 44, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
    input: { ...toolsInput, fontSize: 16, minHeight: 44 },
    hata: { color: '#FCA5A5', fontSize: 13 },
    uyari: { background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.35)', color: '#FDE68A', borderRadius: 12, padding: '10px 12px', fontSize: 13, lineHeight: 1.45 },
    kirmizi: { background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.4)', color: '#FCA5A5', borderRadius: 12, padding: '10px 12px', fontSize: 13, lineHeight: 1.45 },
    iyi: { color: '#5EEAD4', fontSize: 14, fontWeight: 700 },
    kaydir: { overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' },
  };
  stilOnbellek.set(v, s);
  return s;
}

const VurguBaglami = createContext<AracVurgu>(VURGU_TEAL);

/** Branş kabuğu kendi vurgusunu böyle verir; içerideki ortak bileşenler onu okur. */
export function AracVurguSaglayici({ vurgu, children }: { vurgu: AracVurgu; children: React.ReactNode }) {
  return <VurguBaglami.Provider value={vurgu}>{children}</VurguBaglami.Provider>;
}

export function useVurgu(): AracVurgu { return useContext(VurguBaglami); }
export function useAracStil(): AracStil { return aracStil(useContext(VurguBaglami)); }

/* ───────────────────────── Alanlar ve girdiler ───────────────────────── */

/** Etiketli alan — etiket üstte, girdi tam genişlik. */
export function Alan({ etiket, ipucu, children }: { etiket: string; ipucu?: React.ReactNode; children: React.ReactNode }) {
  const stil = useAracStil();
  return (
    <label style={{ display: 'grid', gap: 6, minWidth: 0 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#C9D4E3' }}>{etiket}</span>
      {children}
      {ipucu ? <span style={stil.kucuk}>{ipucu}</span> : null}
    </label>
  );
}

/** Görünür etiketli satır-içi alan — doldurulunca placeholder kaybolsa da alanın ne olduğu okunur. */
export function Etiketli({ ad, children, genislik }: { ad: string; children: React.ReactNode; genislik?: number | string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: genislik === '100%' ? '1 1 100%' : '0 1 auto', maxWidth: '100%' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#9BB0C7' }}>{ad}</span>
      {children}
    </label>
  );
}

/** Açılır menü — seçenek sayısı çoksa (≥ 6) ya da liste uzunsa. Azsa Segment tercih edilir. */
export function Secim({ deger, set, secenekler, bos, etiket }: { deger: string; set: (x: string) => void; secenekler: Array<[string, string]>; bos?: string; etiket?: string }) {
  const stil = useAracStil();
  return (
    <select aria-label={etiket} value={deger} onChange={(e) => set(e.target.value)} style={{ ...stil.input, width: 'auto', minWidth: 120 }}>
      {bos != null && <option value="" style={{ color: '#000' }}>{bos}</option>}
      {secenekler.map(([k, a]) => <option key={k} value={k} style={{ color: '#000' }}>{a}</option>)}
    </select>
  );
}

/** iOS tarzı segmentli seçim — az seçenekli alanlarda açılır menü yerine tek dokunuş. Her parça ≥ 44 px. */
export function Segment<T extends string | number>({ deger, set, secenekler, etiket }: { deger: T; set: (x: T) => void; secenekler: Array<[T, string]>; etiket: string }) {
  const v = useVurgu();
  return (
    <div role="radiogroup" aria-label={etiket} style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 3, flexWrap: 'wrap' }}>
      {secenekler.map(([k, a]) => {
        const on = k === deger;
        return (
          <button key={String(k)} type="button" role="radio" aria-checked={on} onClick={() => set(k)}
            style={{ flex: '1 1 auto', minHeight: 40, minWidth: 44, padding: '8px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: on ? 700 : 500, background: on ? v.ana : 'transparent', color: on ? v.anaMetin : '#C9D4E3' }}>
            {a}
          </button>
        );
      })}
    </div>
  );
}

/** Onay kutusu — açıklamalı, 44 px dokunma alanı. */
export function Onay({ ad, deger, set, aciklama }: { ad: string; deger: boolean; set: (b: boolean) => void; aciklama?: string }) {
  const stil = useAracStil();
  return (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', minHeight: 44, padding: '6px 0', cursor: 'pointer', flex: '1 1 240px' }}>
      <input type="checkbox" checked={deger} onChange={(e) => set(e.target.checked)} style={{ width: 20, height: 20, marginTop: 3 }} />
      <span>
        <span style={stil.metin}>{ad}</span>
        {aciklama && <span style={{ ...stil.kucuk, display: 'block' }}>{aciklama}</span>}
      </span>
    </label>
  );
}

/** Tek satırlık onay kutusu (açıklamasız). */
export function Kutu({ on, set, children }: { on: boolean; set: (x: boolean) => void; children: React.ReactNode }) {
  const stil = useAracStil();
  return (
    <label style={{ ...stil.metin, display: 'flex', gap: 10, alignItems: 'center', minHeight: 44, cursor: 'pointer' }}>
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} style={{ width: 20, height: 20, flex: 'none' }} />
      <span>{children}</span>
    </label>
  );
}

/** Birimli sayı alanı. */
export function Sayi({ ad, deger, set, birim, genislik = 110, adim }: { ad: string; deger: string; set: (x: string) => void; birim?: string; genislik?: number; adim?: string }) {
  const stil = useAracStil();
  return (
    <label style={{ ...stil.metin, display: 'flex', gap: 6, alignItems: 'center' }}>
      {ad}
      <input type="number" inputMode="decimal" step={adim} aria-label={ad} value={deger} onChange={(e) => set(e.target.value)} style={{ ...stil.input, width: genislik }} />
      {birim && <span style={stil.kucuk}>{birim}</span>}
    </label>
  );
}

/** Gelişmiş seçenekler — varsayılan kapalı (ilk ekranı kalabalıklaştırmaz). */
export function Katlanir({ baslik, acik: baslangic = false, children, rozet }: { baslik: string; acik?: boolean; children: React.ReactNode; rozet?: string }) {
  const stil = useAracStil();
  const v = useVurgu();
  const [acik, setAcik] = useState(baslangic);
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 12, paddingTop: 4 }}>
      <button type="button" aria-expanded={acik} onClick={() => setAcik(!acik)} style={{ ...stil.ghost, border: 'none', padding: '8px 0', width: '100%', justifyContent: 'space-between', color: '#9BB0C7' }}>
        <span>{baslik}{rozet ? <span style={{ marginLeft: 8, fontSize: 12, color: v.yumusak }}>{rozet}</span> : null}</span>
        <span aria-hidden style={{ transform: acik ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>›</span>
      </button>
      {acik && <div style={{ paddingTop: 6 }}>{children}</div>}
    </div>
  );
}

/* ───────────────────────── Çıktı bileşenleri ───────────────────────── */

/** Uygulamanın hekim kilidi dili — her klinik çıktının yanında. */
export function TaslakNotu({ children }: { children?: React.ReactNode }) {
  const stil = useAracStil();
  const v = useVurgu();
  return (
    <div style={{ ...stil.kucuk, marginTop: 10, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <span style={{ flexShrink: 0, border: `1px solid ${v.yumusak}66`, color: v.yumusak, borderRadius: 999, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>TASLAK</span>
      <span>{children || 'Karar desteğidir; klinik yorum ve onay hekimindir. Nota otomatik yazılmaz.'}</span>
    </div>
  );
}

/** Küçük durum rozeti (renk tonu: iyi / uyarı / kırmızı / bilgi / nötr). Ton semantiktir — branş vurgusundan bağımsız. */
export function Rozet({ ton = 'notr', children }: { ton?: 'iyi' | 'uyari' | 'kirmizi' | 'notr' | 'bilgi'; children: React.ReactNode }) {
  const r = {
    iyi: ['rgba(45,212,191,0.12)', 'rgba(45,212,191,0.4)', '#5EEAD4'],
    uyari: ['rgba(251,191,36,0.1)', 'rgba(251,191,36,0.4)', '#FDE68A'],
    kirmizi: ['rgba(248,113,113,0.1)', 'rgba(248,113,113,0.45)', '#FCA5A5'],
    notr: ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.14)', '#C9D4E3'],
    bilgi: ['rgba(96,165,250,0.1)', 'rgba(96,165,250,0.4)', '#BFDBFE'],
  }[ton];
  return <span style={{ background: r[0], border: `1px solid ${r[1]}`, color: r[2], borderRadius: 999, padding: '2px 9px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', display: 'inline-block' }}>{children}</span>;
}

/** Doğrulanamayan her ön ayarın yanındaki etiket (klinik kaynak disiplini). */
export function OneriRozet() {
  return <Rozet ton="uyari">öneri — hekim kilitler</Rozet>;
}

/** Büyük sayı kartı — sonuç ekranının üst şeridi. */
export function Istatistik({ deger, etiket, ton = 'notr' }: { deger: React.ReactNode; etiket: string; ton?: 'iyi' | 'uyari' | 'kirmizi' | 'notr' }) {
  const stil = useAracStil();
  const renk = { iyi: '#5EEAD4', uyari: '#FDE68A', kirmizi: '#FCA5A5', notr: '#EDF1F7' }[ton];
  return (
    <div style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', flex: '1 1 120px', minWidth: 0 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: renk, letterSpacing: '-0.5px', lineHeight: 1.15, overflowWrap: 'anywhere' }}>{deger}</div>
      <div style={{ ...stil.kucuk, marginTop: 2 }}>{etiket}</div>
    </div>
  );
}

/** Metni panoya kopyalar; destek yoksa sessizce false döner (mobil Safari eski sürümleri). */
export async function panoyaKopyala(metin: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(metin);
    return true;
  } catch { return false; }
}

/** Panoya kopyala — sonuç metnini hekimin kendi notuna yapıştırması için. */
export function KopyalaButonu({ metin, etiket = 'Sonucu kopyala' }: { metin: string; etiket?: string }) {
  const stil = useAracStil();
  const [durum, setDurum] = useState<'' | 'ok' | 'hata'>('');
  return (
    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        type="button"
        disabled={!metin}
        style={{ ...stil.ghost, opacity: metin ? 1 : 0.5 }}
        onClick={async () => {
          const ok = await panoyaKopyala(metin);
          setDurum(ok ? 'ok' : 'hata');
          if (ok) setTimeout(() => setDurum(''), 1600);
        }}
      >{durum === 'ok' ? 'Kopyalandı ✓' : etiket}</button>
      {durum === 'hata' && <span style={stil.kucuk} aria-live="polite">Kopyalanamadı — metni seçip kopyalayın</span>}
    </span>
  );
}

/* ───────────────────────── Hasta seçimi ───────────────────────── */

/**
 * Hekimin kendi hasta listesi (/api/doktor/hastalar — doctor_id kapsamlı; sahiplik sunucuda).
 * Seçim araçların çoğunda isteğe bağlıdır: hasta seçmeden de elle hesap yapılır.
 */
export function HastaSecici({ secili, sec, bosEtiket = 'Hasta seçilmedi' }: { secili: string; sec: (id: string, ad: string) => void; bosEtiket?: string }) {
  const stil = useAracStil();
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
      <div style={{ ...stil.satir, marginTop: 0 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hasta ara (isteğe bağlı)" aria-label="Hasta ara" style={{ ...stil.input, flex: '1 1 180px', width: 'auto', minWidth: 0 }} />
        <select aria-label="Hasta seç" value={secili} onChange={(e) => { const h = (liste || []).find((x) => x.id === e.target.value); sec(e.target.value, h?.label || ''); }} style={{ ...stil.input, flex: '1 1 200px', width: 'auto', minWidth: 0 }}>
          <option value="" style={{ color: '#000' }}>{liste == null ? (hata ? 'Liste yüklenemedi' : 'Yükleniyor…') : liste.length ? bosEtiket : 'Kayıtlı hasta yok'}</option>
          {gorunen.map((h) => <option key={h.id} value={h.id} style={{ color: '#000' }}>{h.label}</option>)}
        </select>
      </div>
      {hata && <div style={{ ...stil.hata, marginTop: 6 }}>{hata}</div>}
    </div>
  );
}

/** Kohort satırından derin bağlantı — /doktor-tools/<arac>?hasta=<id>. Sahiplik yine sunucuda doğrulanır. */
export function useUrlHasta(set: (id: string) => void) {
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('hasta');
    if (id && /^[0-9a-f-]{8,64}$/i.test(id)) set(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Seçili hastanın branş özetini okur (hasta seçilmediyse hiç istek atmaz).
 * `yol` branşa özeldir (ör. /api/doktor/pediatri?patientId=…); sahiplik her zaman sunucuda doğrulanır.
 */
export function useHastaVerisi<T>(
  patientId: string,
  yol: (id: string) => string,
  hataMetni = 'Hasta bilgisi alınamadı',
): { veri: T | null; hata: string; yukleniyor: boolean } {
  const [veri, setVeri] = useState<T | null>(null);
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  useEffect(() => {
    setVeri(null); setHata('');
    if (!patientId) return;
    let iptal = false;
    setYukleniyor(true);
    (async () => {
      try {
        const t = await getAccessTokenAsync();
        const r = await fetch(yol(patientId), { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
        const j = await r.json().catch(() => ({}));
        if (!iptal) { if (r.ok) setVeri(j as T); else setHata(j.error || hataMetni); }
      } catch { if (!iptal) setHata(`${hataMetni} — bağlantıyı kontrol edin.`); }
      finally { if (!iptal) setYukleniyor(false); }
    })();
    return () => { iptal = true; };
  }, [patientId]); // eslint-disable-line react-hooks/exhaustive-deps
  return { veri, hata, yukleniyor };
}

/* ───────────────────────── Bugünkü muayene formuna ekle ───────────────────────── */

/**
 * ARACLAR-CILA-01 Faz 2 — her aracın sonuç kartında duran ortak eylem.
 *
 * Bugüne kadar her araç "TASLAK — nota otomatik yazılmaz" ile bitiyor, hekim sonucu ELLE tekrar
 * yazıyordu. Bu düğme o işi bitirir: hekim BASAR, sonuç bugünün açık notuna okunabilir Türkçe bir
 * blok olarak eklenir (lib/doktor/aracNotu + gununNotunaEkle) ve muayene formuna dönüş bağlantısı
 * görünür (muayeneFormuYolu).
 *
 * Kurallar:
 *   • hiçbir şey OTOMATİK yazılmaz — tek yol bu düğmedir;
 *   • hasta seçili değilse düğme pasiftir ve nedenini söyler ("Önce hasta seçin");
 *   • eklenen metin hekimin düzenleyebileceği düz metindir; tanı/doz/evre iddiası içermez;
 *   • hekim kilidi dili (TaslakNotu) kaldırılmaz — bu düğme onun yanında durur.
 */
export function MuayeneFormunaEkle({
  hastaId,
  arac,
  satirlar,
  alan,
  etiket = 'Bugünkü muayene formuna ekle',
  hastaYokMetni = 'Önce hasta seçin — sonuç ancak seçili hastanın bugünkü muayene formuna eklenebilir.',
}: {
  hastaId: string
  /** Not bloğunun başlığı — aracın adı (ör. "VA / logMAR"). */
  arac: string
  /** Nota yazılacak satırlar; boş/anlamsız satırlar sunucuda elenir. */
  satirlar: Array<string | null | undefined>
  alan?: 'content_degerlendirme' | 'content_subjektif' | 'content_objektif'
  etiket?: string
  hastaYokMetni?: string
}) {
  const stil = useAracStil()
  const [gonderiyor, setGonderiyor] = useState(false)
  const [mesaj, setMesaj] = useState('')
  const [iyiMi, setIyiMi] = useState(false)
  const [notId, setNotId] = useState<string | null>(null)

  const temiz = satirlar.map((x) => String(x ?? '').trim()).filter(Boolean)
  const kapali = !hastaId || !temiz.length || gonderiyor

  const ekle = async () => {
    if (kapali) return
    setGonderiyor(true); setMesaj(''); setIyiMi(false); setNotId(null)
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/araclar/nota-ekle', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, arac, satirlar: temiz, alan }),
      })
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; notId?: string; error?: string }
      const id = eklenenNotId(j)
      if (j.ok && id) {
        setIyiMi(true)
        setMesaj('Bugünkü muayene formuna eklendi — metni formda düzenleyebilirsiniz.')
        setNotId(id)
      } else {
        setMesaj(j.error || 'Eklenemedi — bugünkü muayene bulunamadı.')
      }
    } catch {
      setMesaj('Eklenemedi — bağlantıyı kontrol edin.')
    } finally {
      setGonderiyor(false)
    }
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ ...stil.satir, marginTop: 0 }}>
        <button
          type="button"
          onClick={ekle}
          disabled={kapali}
          aria-disabled={kapali}
          style={{ ...stil.btn, opacity: kapali ? 0.55 : 1, cursor: kapali ? 'not-allowed' : 'pointer' }}
        >{gonderiyor ? 'Ekleniyor…' : etiket}</button>
        {mesaj && (
          <span style={{ fontSize: 13, color: iyiMi ? '#5EEAD4' : '#FDE68A' }} aria-live="polite">{mesaj}</span>
        )}
        <MuayeneFormunaDon notId={notId} />
      </div>
      {!hastaId
        ? <div style={{ ...stil.kucuk, marginTop: 6 }}>{hastaYokMetni}</div>
        : !temiz.length
          ? <div style={{ ...stil.kucuk, marginTop: 6 }}>Önce sonucu üretin — eklenecek satır yok.</div>
          : <div style={{ ...stil.kucuk, marginTop: 6 }}>Nota eklenecek: “{arac} — {temiz[0].slice(0, 90)}{temiz.length > 1 ? ` …(+${temiz.length - 1} satır)` : ''}” — siz basmadan yazılmaz.</div>}
    </div>
  )
}
