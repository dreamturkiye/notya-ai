'use client';
/**
 * AMELIYAT-NOTU-01 (Kaan, 2026-11-05) — "Ameliyat Notları" of the patient file. CORE: the same shell for every surgical
 * branch (lib/doktor/ameliyatNotu.ts → ameliyatNotuBransi decides who sees the tab; the tab button and this mount use the
 * same boolean). Templates come from the SERVER, chosen by the doctor's own branch — a non-KD surgeon receives none.
 *
 * `AmeliyatNotuFormu` is exported for the KD delivery spine (sezaryen: template preset, linked to the delivery, the old
 * free-text intraop record shown read-only above the form so nothing recorded before is lost).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import {
  ACILIYET, ACILIYET_ETIKETLERI, AMELIYAT_NOTU_ETIKETLERI as E, ANESTEZI_ETIKETLERI, ANESTEZI_TURLERI, BOS_AMELIYAT_NOTU,
  ENDIKASYON_SINIFI_ETIKETLERI, KISA_ALANLAR, UZUN_ALANLAR, sablonUygula, type AmeliyatNotuVeri, type AmeliyatSablonu,
} from '@/lib/doktor/ameliyatNotu';
import { GE_MEDIKAL_GEREKCE } from '@/lib/clinical/genitalEstetik';

/** GENITAL-ESTETIK-01: the words of the indication field, sent by the server only with templates that need it. */
export type EndikasyonEtiketleri = { gerekce: Record<string, string>; kapi: string } | null;

export type AmeliyatNotuSatiri = { id: string; ameliyat_tarihi: string; sablon: string | null; dogum_id: string | null; imzalandi_at: string | null; veri: AmeliyatNotuVeri };

const btn: React.CSSProperties = { background: CHROME_RENK.pine, color: '#FAF8F4', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' };
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: CHROME_RENK.ink, border: `1px solid ${CHROME_RENK.border}` };
const etiketS: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: CHROME_RENK.muted, marginBottom: 4 };
const izgara: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 };

const simdiYerel = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

export function AmeliyatNotuFormu({ patientId, mevcut, sablonlar, sabitSablon, dogumId, eskiKayit, onKaydedildi, onVazgec, endikasyonEtiketleri }: {
  patientId: string
  mevcut?: AmeliyatNotuSatiri | null
  sablonlar: readonly AmeliyatSablonu[]
  /** Preset template (sezaryen from the delivery spine). */
  sabitSablon?: string
  dogumId?: string | null
  /** A record written before the structured note existed (legacy intraop free text): shown read-only, never dropped. */
  eskiKayit?: string | null
  onKaydedildi: (n: AmeliyatNotuSatiri) => void
  onVazgec?: () => void
  endikasyonEtiketleri?: EndikasyonEtiketleri
}) {
  const ilkSablon = mevcut?.sablon || sabitSablon || '';
  const [sablon, setSablon] = useState(ilkSablon);
  const [v, setV] = useState<AmeliyatNotuVeri>(() => {
    if (mevcut) return mevcut.veri;
    const bos = { ...BOS_AMELIYAT_NOTU, baslangic: simdiYerel() };
    return sablonUygula(bos, sablonlar.find((s) => s.kod === ilkSablon));
  });
  const [mesaj, setMesaj] = useState('');
  const [kaydediyor, setKaydediyor] = useState(false);
  const seciliSablon = useMemo(() => sablonlar.find((s) => s.kod === sablon) || null, [sablonlar, sablon]);
  const set = <K extends keyof AmeliyatNotuVeri>(k: K, val: AmeliyatNotuVeri[K]) => setV((x) => ({ ...x, [k]: val }));

  const sablonSec = (kod: string) => {
    setSablon(kod);
    // Only empty fields are filled: what the surgeon already wrote is never overwritten.
    setV((x) => sablonUygula(x, sablonlar.find((s) => s.kod === kod)));
  };

  const kaydet = async (imzala: boolean) => {
    setMesaj(''); setKaydediyor(true);
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/ameliyat-notlari', {
        method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, id: mevcut?.id, sablon: sablon || null, dogumId: dogumId || undefined, veri: v, imzala }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setMesaj(j.error || 'Kaydedilemedi.'); return; }
      setMesaj(imzala ? 'Ameliyat notu imzalandı.' : 'Taslak kaydedildi.');
      onKaydedildi(j.not);
    } catch { setMesaj('Kaydedilemedi.'); } finally { setKaydediyor(false); }
  };

  const metinAlani = (k: keyof AmeliyatNotuVeri, uzun: boolean) => (
    <label key={k} style={{ display: 'block', gridColumn: uzun ? '1 / -1' : undefined }}>
      <span style={etiketS}>{E[k]}</span>
      {uzun
        ? <textarea value={String(v[k] ?? '')} onChange={(e) => set(k, e.target.value as never)} rows={k === 'teknik' ? 12 : 3} style={{ ...toolsInput, width: '100%', fontFamily: 'inherit', lineHeight: 1.45 }} />
        : <input value={String(v[k] ?? '')} onChange={(e) => set(k, e.target.value as never)} style={{ ...toolsInput, width: '100%' }} />}
    </label>
  );

  return (
    <div style={{ ...toolsCard, marginBottom: 12 }} data-ameliyat-notu="form">
      {eskiKayit ? (
        <div style={{ background: '#F6F0E4', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 10, padding: 10, marginBottom: 10 }} data-ameliyat-notu="eski-kayit">
          <div style={{ fontSize: 12, fontWeight: 700, color: CHROME_RENK.muted, marginBottom: 4 }}>Önceki serbest metin kaydı (korunur)</div>
          <div style={{ fontSize: 12.5, whiteSpace: 'pre-wrap', color: CHROME_RENK.ink }}>{eskiKayit}</div>
        </div>
      ) : null}
      {sablonlar.length > 0 && !mevcut?.imzalandi_at && (
        <div style={{ marginBottom: 10 }} data-ameliyat-notu="sablonlar">
          <label style={etiketS} htmlFor="ameliyat-sablon">Şablon (standart adımlar — düzenlenebilir)</label>
          <select id="ameliyat-sablon" value={sablon} onChange={(e) => sablonSec(e.target.value)} style={{ ...toolsInput, width: '100%' }}>
            <option value="">Boş not</option>
            {Array.from(new Set(sablonlar.map((s) => s.grup))).map((g) => (
              <optgroup key={g} label={g}>{sablonlar.filter((s) => s.grup === g).map((s) => <option key={s.kod} value={s.kod}>{s.ad}</option>)}</optgroup>
            ))}
          </select>
          {seciliSablon && <div style={{ fontSize: 11, color: CHROME_RENK.muted, marginTop: 4 }}>Kaynak: {seciliSablon.kaynak} · "__" yerlerini doldurun; doz ve sayı şablonda yazılmaz.</div>}
        </div>
      )}
      {seciliSablon?.endikasyonSinifiGerekli && (
        <div style={{ border: `1px solid ${CHROME_RENK.border}`, borderRadius: 10, padding: 10, marginBottom: 10, background: '#FBF7EF' }} data-ameliyat-notu="endikasyon">
          <div style={izgara}>
            <label><span style={etiketS}>{E.endikasyonSinifi}</span>
              <select value={v.endikasyonSinifi} onChange={(e) => set('endikasyonSinifi', e.target.value as AmeliyatNotuVeri['endikasyonSinifi'])} style={{ ...toolsInput, width: '100%' }}>
                <option value="">—</option>{(['kozmetik', 'medikal'] as const).map((a) => <option key={a} value={a}>{ENDIKASYON_SINIFI_ETIKETLERI[a]}</option>)}
              </select></label>
            {v.endikasyonSinifi === 'medikal' && (
              <label><span style={etiketS}>{E.medikalGerekce}</span>
                <select value={v.medikalGerekce} onChange={(e) => set('medikalGerekce', e.target.value)} style={{ ...toolsInput, width: '100%' }}>
                  <option value="">—</option>{GE_MEDIKAL_GEREKCE.map((k) => <option key={k} value={k}>{endikasyonEtiketleri?.gerekce[k] || k}</option>)}
                </select></label>
            )}
            {v.endikasyonSinifi === 'medikal' && metinAlani('medikalAciklama', true)}
          </div>
          {endikasyonEtiketleri?.kapi && <div style={{ fontSize: 11.5, color: CHROME_RENK.muted, marginTop: 6 }}>{endikasyonEtiketleri.kapi}</div>}
          <a href={`/dashboard/doktor/hastalar/${patientId}/genital-estetik/yazdir?talimat=${encodeURIComponent(seciliSablon.kod)}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: CHROME_RENK.pine, fontWeight: 600 }}>Hasta talimat sayfasını yazdır</a>
        </div>
      )}
      <div style={izgara}>
        <label><span style={etiketS}>{E.baslangic}</span><input type="datetime-local" value={v.baslangic} onChange={(e) => set('baslangic', e.target.value)} style={{ ...toolsInput, width: '100%' }} /></label>
        <label><span style={etiketS}>{E.bitis}</span><input type="time" value={v.bitis} onChange={(e) => set('bitis', e.target.value)} style={{ ...toolsInput, width: '100%' }} /></label>
        <label><span style={etiketS}>{E.aciliyet}</span>
          <select value={v.aciliyet} onChange={(e) => set('aciliyet', e.target.value as AmeliyatNotuVeri['aciliyet'])} style={{ ...toolsInput, width: '100%' }}>
            <option value="">—</option>{ACILIYET.map((a) => <option key={a} value={a}>{ACILIYET_ETIKETLERI[a]}</option>)}
          </select></label>
        <label><span style={etiketS}>{E.anesteziTuru}</span>
          <select value={v.anesteziTuru} onChange={(e) => set('anesteziTuru', e.target.value as AmeliyatNotuVeri['anesteziTuru'])} style={{ ...toolsInput, width: '100%' }}>
            <option value="">—</option>{ANESTEZI_TURLERI.map((a) => <option key={a} value={a}>{ANESTEZI_ETIKETLERI[a]}</option>)}
          </select></label>
        {KISA_ALANLAR.filter((k) => !['patolojiMateryal'].includes(k)).map((k) => metinAlani(k, false))}
        <label><span style={etiketS}>{E.patoloji}</span>
          <select value={v.patoloji} onChange={(e) => set('patoloji', e.target.value as AmeliyatNotuVeri['patoloji'])} style={{ ...toolsInput, width: '100%' }}>
            <option value="">—</option><option value="gonderildi">Gönderildi</option><option value="gonderilmedi">Gönderilmedi</option>
          </select></label>
        {v.patoloji === 'gonderildi' && metinAlani('patolojiMateryal', false)}
        <label><span style={etiketS}>{E.kanKaybiMl}</span><input type="number" min={0} step={10} value={v.kanKaybiMl ?? ''} onChange={(e) => set('kanKaybiMl', e.target.value === '' ? null : Number(e.target.value))} style={{ ...toolsInput, width: '100%' }} /></label>
        {UZUN_ALANLAR.map((k) => metinAlani(k, true))}
      </div>
      {mesaj && <div style={{ fontSize: 12.5, marginTop: 8, color: /imzalandı|kaydedildi/i.test(mesaj) ? '#2E6E4E' : CHROME_RENK.warn }}>{mesaj}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button type="button" disabled={kaydediyor} style={ghost} onClick={() => kaydet(false)}>Taslak kaydet</button>
        <button type="button" disabled={kaydediyor} style={btn} onClick={() => kaydet(true)}>İmzala</button>
        {onVazgec && <button type="button" style={ghost} onClick={onVazgec}>Vazgeç</button>}
      </div>
      <div style={{ fontSize: 11, color: CHROME_RENK.muted, marginTop: 8 }}>İmzalanan not değiştirilemez; düzeltme yeni not olarak eklenir. İçerik RCS Good Surgical Practice (2014) ameliyat notu standardını izler.</div>
    </div>
  );
}

export function AmeliyatNotuOzeti({ n, patientId, onDuzenle }: { n: AmeliyatNotuSatiri; patientId: string; onDuzenle?: () => void }) {
  return (
    <div style={{ borderTop: `1px solid ${CHROME_RENK.border}`, padding: '10px 0', display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }} data-ameliyat-notu="satir">
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontWeight: 700, color: CHROME_RENK.ink, fontSize: 14 }}>{n.veri.islem || '—'}</div>
        <div style={{ fontSize: 12, color: CHROME_RENK.muted }}>
          {new Date(`${n.ameliyat_tarihi}T12:00:00Z`).toLocaleDateString('tr-TR')} · {n.veri.cerrah || 'operatör —'} · {n.imzalandi_at ? '✓ imzalı' : 'taslak'}
        </div>
      </div>
      {!n.imzalandi_at && onDuzenle && <button type="button" style={ghost} onClick={onDuzenle}>Düzenle</button>}
      <a href={`/dashboard/doktor/hastalar/${patientId}/ameliyat-notu/${n.id}/yazdir`} target="_blank" rel="noreferrer" style={{ ...ghost, textDecoration: 'none' }}>Yazdır / PDF</a>
    </div>
  );
}

export default function HastaAmeliyatNotlari({ patientId }: { patientId: string }) {
  const [notlar, setNotlar] = useState<AmeliyatNotuSatiri[] | null>(null);
  const [sablonlar, setSablonlar] = useState<AmeliyatSablonu[]>([]);
  const [endikasyonEtiketleri, setEndikasyonEtiketleri] = useState<EndikasyonEtiketleri>(null);
  const [acik, setAcik] = useState<'yeni' | string | null>(null);
  const [hata, setHata] = useState('');

  const yukle = useCallback(async () => {
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch(`/api/doktor/ameliyat-notlari?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setHata(j.error || 'Yüklenemedi.'); return; }
      setNotlar(j.notlar || []); setSablonlar(j.sablonlar || []); setEndikasyonEtiketleri(j.endikasyonEtiketleri || null);
    } catch { setHata('Yüklenemedi.'); }
  }, [patientId]);
  useEffect(() => { yukle(); }, [yukle]);

  if (hata) return <div style={{ ...toolsCard, color: CHROME_RENK.warn, fontSize: 13 }}>{hata}</div>;
  if (!notlar) return <div style={{ ...toolsCard, color: CHROME_RENK.muted, fontSize: 13 }}>Ameliyat notları yükleniyor…</div>;
  const duzenlenen = acik && acik !== 'yeni' ? notlar.find((n) => n.id === acik) || null : null;

  return (
    <div data-sekme="ameliyat">
      <div style={{ ...toolsCard, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, color: CHROME_RENK.ink, fontSize: 16 }}>Ameliyat Notları</div>
            <div style={{ fontSize: 12.5, color: CHROME_RENK.muted }}>Yapılandırılmış ameliyat notu · antetli kâğıda yazdırılır</div>
          </div>
          {!acik && <button type="button" style={btn} onClick={() => setAcik('yeni')}>+ Yeni ameliyat notu</button>}
        </div>
        {!notlar.length && !acik && <div style={{ fontSize: 13, color: CHROME_RENK.muted, marginTop: 10 }}>Bu hastada ameliyat notu yok.</div>}
        {notlar.map((n) => <AmeliyatNotuOzeti key={n.id} n={n} patientId={patientId} onDuzenle={() => setAcik(n.id)} />)}
      </div>
      {acik && (
        <AmeliyatNotuFormu
          key={acik}
          patientId={patientId}
          mevcut={duzenlenen}
          sablonlar={sablonlar}
          endikasyonEtiketleri={endikasyonEtiketleri}
          onKaydedildi={() => { setAcik(null); yukle(); }}
          onVazgec={() => setAcik(null)}
        />
      )}
    </div>
  );
}
