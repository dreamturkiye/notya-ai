'use client';
/** NOTYA-DAH-WOW W0/W1 UI — vizit şeridi + KVR · KBH · Ev kayıt · İlaç izlem sekmeleri. DahiliyeHome'dan çağrılır. */
import React, { useState } from 'react';
import { toolsInput } from '@/lib/doktor/toolsUi';
import type { VizitSeridi } from '../engines/serit';
import type { KvrSonuc } from '../engines/score2';
import type { CkdSonuc } from '../engines/ckd';
import type { EvKbOzet } from '../engines/evKayit';

export type WowVeri = {
  kvr: { sigara: boolean; askvh: boolean; dm_tod: boolean; dm_sure_10y: boolean; statin_yogunluk: string; ezetimib: boolean; sonuc: KvrSonuc; kilitKategori: string | null; kilitHedefLdl: number | null } | null;
  ckd: { uacr_manual: number | null; uacr_tarih: string | null; ras_blokeri: boolean; sglt2: boolean; nsaii: boolean; sonuc: CkdSonuc; egfr: number | null; uacr: number | null; uacrKaynak: string; kilitEvre: string | null } | null;
  ev: { kb: EvKbOzet; glukoz: { n: number; aclikOrt: number | null; hipo: number; yuksek: number; not: string }; kayitlar: { id: string; tip: string; sbp: number | null; dbp: number | null; deger: number | null; olcum_at: string; kaynak: string }[] };
  izlem: { kod: string; ad: string; due: string; labs: string[]; ilac: string; kaynak: string }[];
};
type Dip = { ref: string; not: string };
type Props = { sekme: string; wow: WowVeri; kaynak: boolean; refler: Record<string, string>; calistir: (body: Record<string, unknown>, ok?: string) => Promise<void> };

const kucuk: React.CSSProperties = { fontSize: 11, color: '#8FA0B5' };
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 6 };
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 };
const btn: React.CSSProperties = { background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const chk = (label: string, v: boolean, on: (x: boolean) => void) => <label key={label} style={{ ...kucuk, display: 'flex', gap: 4, alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '3px 8px', cursor: 'pointer' }}><input type="checkbox" checked={v} onChange={(e) => on(e.target.checked)} />{label}</label>;
const Kaynak = ({ d, acik, refler }: { d?: Dip[] | null; acik: boolean; refler: Record<string, string> }) => (!acik || !d?.length ? null : <div style={{ ...kucuk, marginTop: 4, borderLeft: '2px solid rgba(45,212,191,0.4)', paddingLeft: 6 }}>{d.map((x, i) => <div key={i}>[{refler[x.ref] || x.ref}] {x.not}</div>)}</div>);
const RENK: Record<string, string> = { yesil: '#22C55E', sari: '#FBBF24', turuncu: '#FB923C', kirmizi: '#F87171' };
const KOVA_AD: Record<string, string> = { dusuk_orta: 'Düşük–orta', yuksek: 'Yüksek', cok_yuksek: 'Çok yüksek' };

export function VizitSeridiBar({ s, onPlan }: { s: VizitSeridi; onPlan: () => void }) {
  const [acik, setAcik] = useState(false);
  const renk = (d: string) => (d === 'kotu' ? '#F87171' : d === 'dikkat' ? '#FBBF24' : d === 'iyi' ? '#22C55E' : '#64748B');
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 5, background: '#0B1B2F', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '6px 10px', marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ ...kucuk, fontWeight: 700, color: '#2DD4BF' }}>BUGÜNKÜ VİZİT</span>
        {s.chips.map((c) => <span key={c.ad} title={c.alt || ''} style={{ fontSize: 12, color: '#EDF1F7', border: `1px solid ${renk(c.durum)}`, borderRadius: 999, padding: '2px 8px' }}>{c.ad} <b>{c.deger}</b>{c.alt ? <span style={{ ...kucuk, marginLeft: 4 }}>{c.alt}</span> : null}</span>)}
        <button type="button" onClick={() => { setAcik(!acik); if (!acik) onPlan(); }} style={{ ...btn, marginLeft: 'auto', padding: '4px 10px' }}>{acik ? 'Planı kapat' : '1-tap bugünkü plan'}</button>
      </div>
      {acik && (<div style={{ marginTop: 6, fontSize: 12, color: '#EDF1F7' }}>
        {s.planTaslagi.length === 0 && <div style={kucuk}>Plan maddesi yok — kartları çalıştırın.</div>}
        {s.planTaslagi.map((p, i) => <div key={i} style={{ color: p.startsWith('⚑') ? '#F87171' : '#EDF1F7' }}>{p}</div>)}
        <div style={{ ...kucuk, marginTop: 4 }}>Taslak — SOAP P'ye kopyalamadan önce hekim kilitleri (evre / hedef / kategori) tamamlanmalı.</div>
        <button type="button" onClick={() => navigator.clipboard?.writeText(s.planTaslagi.join('\n'))} style={{ ...btn, marginTop: 6, background: 'transparent', color: '#8FA0B5', border: '1px solid rgba(255,255,255,0.15)' }}>📋 Planı kopyala</button>
      </div>)}
    </div>
  );
}

export default function DahiliyeWow({ sekme, wow, kaynak, refler, calistir }: Props) {
  const [f, setF] = useState<Record<string, unknown>>({});
  const s = (k: string) => (f[k] as string) ?? ''; const set = (k: string, x: unknown) => setF((p) => ({ ...p, [k]: x }));
  const bv = (k: string, d: boolean) => (f[k] === undefined ? d : !!f[k]);

  if (sekme === 'KVR') {
    const k = wow.kvr; const r = k?.sonuc;
    return (<div>
      <div style={etiket}>Kardiyovasküler risk (KVR) <span style={kucuk}>· ESC 2021 SCORE2 · TEMD/ESC LDL hedefleri · kategori hekim kilidi</span></div>
      <div style={satir}>
        {chk('sigara', bv('sigara', !!k?.sigara), (x) => set('sigara', x))}{chk('ASKVH öyküsü (MI/inme/PAH/revask.)', bv('askvh', !!k?.askvh), (x) => set('askvh', x))}
        {chk('DM + hedef organ hasarı', bv('dmTod', !!k?.dm_tod), (x) => set('dmTod', x))}{chk('DM ≥10 yıl', bv('dmSure', !!k?.dm_sure_10y), (x) => set('dmSure', x))}
        <select value={s('sy') || k?.statin_yogunluk || 'yok'} onChange={(e) => set('sy', e.target.value)} style={{ ...toolsInput, width: 'auto' }}>{['yok', 'dusuk', 'orta', 'yuksek'].map((x) => <option key={x} value={x} style={{ color: '#000' }}>statin: {x}</option>)}</select>
        {chk('ezetimib', bv('ez', !!k?.ezetimib), (x) => set('ez', x))}
        <button type="button" style={btn} onClick={() => calistir({ adim: 'kvr', sigara: bv('sigara', !!k?.sigara), askvh: bv('askvh', !!k?.askvh), dmTod: bv('dmTod', !!k?.dm_tod), dmSure10Yil: bv('dmSure', !!k?.dm_sure_10y), statinYogunluk: s('sy') || k?.statin_yogunluk || 'yok', ezetimib: bv('ez', !!k?.ezetimib) }, 'KVR hesaplandı.')}>Hesapla</button>
      </div>
      {r && (<div style={{ fontSize: 12, color: '#EDF1F7', marginTop: 8 }}>
        <div>Kova taslak: <b style={{ color: r.kova === 'cok_yuksek' ? '#F87171' : r.kova === 'yuksek' ? '#FBBF24' : '#22C55E' }}>{r.kova ? KOVA_AD[r.kova] : 'belirlenemedi'}</b>{r.kovaNedeni ? ` — ${r.kovaNedeni}` : ''}{k?.kilitKategori ? ` · hekim kilidi: ${KOVA_AD[k.kilitKategori] || k.kilitKategori}` : ''}</div>
        {r.score2 != null && <div>SCORE2: <b>%{r.score2}</b> (yüksek risk bölgesi)</div>}
        {r.score2Notu && <div style={{ color: '#FBBF24' }}>ⓘ {r.score2Notu}</div>}
        <div>{r.hedefNotu}{k?.kilitHedefLdl ? ` · kilitli hedef <${k.kilitHedefLdl}` : ''}</div>
        {r.statinAcigi.map((x) => <div key={x} style={{ color: '#FBBF24' }}>⚠ {x}</div>)}
        <Kaynak d={r.dipnotlar} acik={kaynak} refler={refler} />
        <div style={satir}>
          <select value={s('kk')} onChange={(e) => set('kk', e.target.value)} style={{ ...toolsInput, width: 'auto' }}><option value="">kategori kilitle (hekim)</option>{Object.entries(KOVA_AD).map(([v, a]) => <option key={v} value={v} style={{ color: '#000' }}>{a}</option>)}</select>
          <button type="button" style={btn} disabled={!s('kk')} onClick={() => calistir({ adim: 'kilit', kart: 'kvr', alan: 'kategori', deger: s('kk') }, 'KVR kategorisi kilitlendi.')}>Kilitle</button>
          <input value={s('kl')} onChange={(e) => set('kl', e.target.value)} placeholder="LDL hedef mg/dL" style={{ ...toolsInput, width: 130 }} />
          <button type="button" style={btn} disabled={!s('kl')} onClick={() => calistir({ adim: 'kilit', kart: 'kvr', alan: 'hedef_ldl', deger: Number(s('kl')) }, 'LDL hedefi kilitlendi.')}>Hedefi kilitle</button>
        </div>
      </div>)}
    </div>);
  }

  if (sekme === 'KBH') {
    const c = wow.ckd; const r = c?.sonuc;
    return (<div>
      <div style={etiket}>Kronik böbrek hastalığı <span style={kucuk}>· KDIGO 2024 eGFR × UACR · yalnız onaylı lab · evre hekim kilidi</span></div>
      <div style={satir}>
        <span style={kucuk}>eGFR: <b style={{ color: '#EDF1F7' }}>{c?.egfr ?? '—'}</b> · UACR: <b style={{ color: '#EDF1F7' }}>{c?.uacr ?? '—'}</b> mg/g {c?.uacrKaynak ? `(${c.uacrKaynak})` : ''}</span>
        <input value={s('uacr')} onChange={(e) => set('uacr', e.target.value)} placeholder="UACR mg/g (lab satırı yoksa)" style={{ ...toolsInput, width: 210 }} />
        {chk('ACEi/ARB kullanıyor', bv('ras', !!c?.ras_blokeri), (x) => set('ras', x))}{chk('SGLT2 kullanıyor', bv('sg', !!c?.sglt2), (x) => set('sg', x))}{chk('aktif NSAİİ', bv('ns', !!c?.nsaii), (x) => set('ns', x))}
        <button type="button" style={btn} onClick={() => calistir({ adim: 'ckd', uacr: s('uacr') || undefined, rasBlokeri: bv('ras', !!c?.ras_blokeri), sglt2: bv('sg', !!c?.sglt2), nsaii: bv('ns', !!c?.nsaii) }, 'KBH kartı güncellendi.')}>Değerlendir</button>
      </div>
      {r && (<div style={{ fontSize: 12, color: '#EDF1F7', marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: r.renk ? RENK[r.renk] : '#64748B', display: 'inline-block' }} />
          <span>KDIGO taslak: <b>{r.g ?? '—'} {r.a ?? '(UACR yok)'}</b> · kronisite: {r.kronikMi}{r.hizliDusus ? ' · HIZLI DÜŞÜŞ' : ''}{r.izlemAy ? ` · izlem her ${r.izlemAy} ay` : ''}{c?.kilitEvre ? ` · hekim kilidi: ${c.kilitEvre}` : ''}</span>
        </div>
        {r.uyarilar.map((x) => <div key={x} style={{ color: '#FBBF24' }}>⚠ {x}</div>)}
        {r.plan.map((x) => <div key={x}>• {x}</div>)}
        {r.sevk.map((x) => <div key={x} style={{ color: '#F87171' }}>→ {x}</div>)}
        <Kaynak d={r.dipnotlar} acik={kaynak} refler={refler} />
        <div style={satir}>
          <input value={s('ke')} onChange={(e) => set('ke', e.target.value)} placeholder="evre kilitle örn. G3a A2" style={{ ...toolsInput, width: 170 }} />
          <button type="button" style={btn} disabled={!s('ke')} onClick={() => calistir({ adim: 'kilit', kart: 'ckd', alan: 'evre', deger: s('ke') }, 'KBH evresi kilitlendi.')}>Kilitle</button>
          {r.sevk.length > 0 && <button type="button" style={{ ...btn, background: '#B91C1C' }} onClick={() => calistir({ adim: 'ckd', sevk: true, uacr: s('uacr') || undefined, rasBlokeri: bv('ras', !!c?.ras_blokeri), sglt2: bv('sg', !!c?.sglt2), nsaii: bv('ns', !!c?.nsaii) }, 'Nefroloji sevk paketi oluşturuldu (Sevk sekmesi).')}>Nefro sevk paketi</button>}
        </div>
      </div>)}
    </div>);
  }

  if (sekme === 'Ev kayıt') {
    const e = wow.ev;
    return (<div>
      <div style={etiket}>Ev KB / glukoz / kilo <span style={kucuk}>· son 14 gün · ev KB ≥135/85 eşiği · portal girişi W2.7 ile</span></div>
      <div style={satir}>
        <select value={s('tip') || 'kb'} onChange={(e2) => set('tip', e2.target.value)} style={{ ...toolsInput, width: 'auto' }}>{['kb', 'glukoz', 'kilo'].map((x) => <option key={x} value={x} style={{ color: '#000' }}>{x}</option>)}</select>
        {(s('tip') || 'kb') === 'kb' ? (<><input value={s('esbp')} onChange={(e2) => set('esbp', e2.target.value)} placeholder="SBP" style={{ ...toolsInput, width: 70 }} /><input value={s('edbp')} onChange={(e2) => set('edbp', e2.target.value)} placeholder="DBP" style={{ ...toolsInput, width: 70 }} /></>) : <input value={s('edeger')} onChange={(e2) => set('edeger', e2.target.value)} placeholder={(s('tip') === 'kilo') ? 'kg' : 'mg/dL'} style={{ ...toolsInput, width: 90 }} />}
        {(s('tip') === 'glukoz') && chk('açlık', bv('ac', true), (x) => set('ac', x))}
        <input type="datetime-local" value={s('eat')} onChange={(e2) => set('eat', e2.target.value)} style={{ ...toolsInput, width: 'auto' }} />
        <button type="button" style={btn} onClick={() => calistir({ adim: 'evkayit', tip: s('tip') || 'kb', sbp: s('esbp') || undefined, dbp: s('edbp') || undefined, deger: s('edeger') || undefined, aclik: bv('ac', true), olcumAt: s('eat') || undefined }, 'Ev kaydı eklendi.')}>Ekle</button>
      </div>
      <div style={{ fontSize: 12, color: '#EDF1F7', marginTop: 8 }}>
        <div>Ev KB: {e.kb.n} ölçüm{e.kb.ortSbp != null ? ` · ort ${e.kb.ortSbp}/${e.kb.ortDbp}` : ''} · <b style={{ color: e.kb.fenotip === 'kontrolde' ? '#22C55E' : e.kb.fenotip === 'yetersiz_veri' ? '#8FA0B5' : '#FBBF24' }}>{e.kb.fenotip.replace('_', ' ')}</b></div>
        <div style={kucuk}>{e.kb.not}</div>
        <div style={{ marginTop: 4 }}>Ev glukoz: {e.glukoz.n} ölçüm{e.glukoz.aclikOrt != null ? ` · açlık ort ${e.glukoz.aclikOrt}` : ''} · hipo {e.glukoz.hipo} · &gt;180: {e.glukoz.yuksek}</div>
        <div style={kucuk}>{e.glukoz.not}</div>
        <Kaynak d={e.kb.dipnotlar} acik={kaynak} refler={refler} />
        <div style={{ marginTop: 6, maxHeight: 140, overflowY: 'auto' }}>{e.kayitlar.map((k) => <div key={k.id} style={kucuk}>{new Date(k.olcum_at).toLocaleString('tr-TR')} · {k.tip} {k.tip === 'kb' ? `${k.sbp}/${k.dbp}` : k.deger} <span style={{ opacity: 0.6 }}>({k.kaynak})</span></div>)}</div>
      </div>
    </div>);
  }

  if (sekme === 'İzlem') {
    return (<div>
      <div style={etiket}>İlaç izlem takvimi <span style={kucuk}>· hasta_ilaclar → lab izlem görevleri · kural tabanlı, doz yok</span></div>
      <div style={satir}><button type="button" style={btn} onClick={() => calistir({ adim: 'ilacizlem' }, 'İzlem görevleri açık görevlere eklendi.')}>Görevleri oluştur / yenile</button></div>
      {wow.izlem.length === 0 && <div style={{ ...kucuk, marginTop: 6 }}>Aktif ilaçlar için bekleyen izlem yok (veya son lablar taze).</div>}
      {wow.izlem.map((g) => <div key={g.kod} style={{ fontSize: 12, color: g.due < new Date().toISOString().slice(0, 10) ? '#F87171' : '#EDF1F7', marginTop: 4 }}>{g.ad} <span style={kucuk}>· {g.ilac} · {g.labs.join('/')} · due {g.due}</span>{kaynak && <div style={kucuk}>{g.kaynak}</div>}</div>)}
    </div>);
  }
  return null;
}
