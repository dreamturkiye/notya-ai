'use client';
/** GOZ-CHAPTER — Göz sekme kartları. Veri /api/doktor/goz GET; yazma POST adımları. Motor önerir/uyarır, hekim kilitler. */
import React, { useState } from 'react';
import { toolsInput } from '@/lib/doktor/toolsUi';
import type { GozSerit } from '../engines/serit';
import type { AcilBayrak } from '../engines/acil';
import type { Enjeksiyon } from '../engines/antiVegf';
import { AJAN_ADI, ENDIKASYON_ADI } from '../engines/antiVegf';
import type { GlokomDegerlendirme, GlokomKart } from '../engines/glokom';
import type { DrSonuc } from '../engines/dr';
import { EVRE_ADI, DMO_ADI } from '../engines/dr';
import type { ProtokolKart } from '../engines/klinik';
import type { GozKaynak } from '../protocols/sources';
import type { Dipnot } from '../protocols/sources';

export const stil = {
  btn: { background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 30 } as React.CSSProperties,
  ghost: { background: 'transparent', color: '#8FA0B5', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', minHeight: 28 } as React.CSSProperties,
  etiket: { fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 6 } as React.CSSProperties,
  kucuk: { fontSize: 11, color: '#8FA0B5' } as React.CSSProperties,
  satir: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 } as React.CSSProperties,
  metin: { fontSize: 12, color: '#EDF1F7' } as React.CSSProperties,
};
const { btn, ghost, etiket, kucuk, satir, metin } = stil;

type Okuma = { id: string; taslak: string; taslak_yazan: string; durum: string; uzman_metin: string | null; goz: string | null; created_at: string };
export interface GozVeri {
  hasta: { yas: number | null; yasAy: number | null }
  rol: 'doktor' | 'sekreter'
  serit: GozSerit
  muayeneler: Array<{ id: string; tarih: string; gib_sag: number | null; gib_sol: number | null; gib_yontem: string | null; kaynak: string; gosterim: { sag: string; sol: string } }>
  kopya: { taslak: { tarih: string; va: { sag?: Record<string, string | null | undefined>; sol?: Record<string, string | null | undefined> }; gibSag: number | null; gibSol: number | null; gibYontem?: string | null }; kaynakTarih: string } | null
  glokom: { kart: GlokomKart; degerlendirme: GlokomDegerlendirme } | null
  dr: { satir: Record<string, string | boolean | null>; degerlendirme: DrSonuc } | null
  acikGozSevkleri: Array<{ id: string; not_metni: string | null; kaynak: string | null; created_at: string }>
  enjeksiyonlar: Enjeksiyon[]
  sonrakiDoz: Record<'sag' | 'sol', { faz: string | null; dozNo: number | null; enErken: string | null; enGec: string | null; not: string }>
  sgkRaporlari: Array<{ id: string; sablon: string; draft: Record<string, unknown>; eksikler: string[]; durum: string; created_at: string }>
  sgkSablonlari: Array<{ id: string; ad: string }>
  katarakt: Array<{ id: string; goz: string; checklist: Record<string, boolean>; gil_tipi_hekim: string | null; planlanan_tarih: string | null; durum: string; hazirlik: { tamam: number; toplam: number; eksikZorunlu: string[]; hazir: boolean; dipnotlar: Dipnot[] } }>
  kataraktKontrol: Array<{ kod: string; ad: string; zorunlu: boolean }>
  goruntuler: Array<{ id: string; modalite: string; goz: string | null; tarih: string; url: string | null; okumalar: Okuma[] }>
  goruntuDisclaimer: string
  kontroller: Array<{ id: string; tarih: string; neden: string; dilatasyon: boolean; durum: string }>
  pediatrik: { satir: Record<string, string | boolean | null> | null; izlem: { hatirlatmalar: string[]; gorevler: unknown[]; dipnotlar: Dipnot[] } }
  gorevler: Array<{ id: string; kod: string; ad: string; due: string | null; kaynak: string | null }>
  intake: { subjektif: string; ipuclari: Array<{ kart: string; neden: string }>; acil: AcilBayrak[] } | null
  acil: AcilBayrak[]
  acilKodlari: Array<{ kod: string; ad: string }>
  protokoller: ProtokolKart[]
  kaynaklar: Record<string, GozKaynak>
}

const MOD_ADI: Record<string, string> = { oct: 'OCT', fundus: 'Fundus', on_segment: 'Ön segment' };
const gozAd = (g: string | null | undefined) => (g === 'sag' ? 'OD' : g === 'sol' ? 'OS' : g === 'iki' ? 'OU' : '—');
const bugun = () => new Date().toISOString().slice(0, 10);

function Kaynak({ d, acik, k }: { d?: Dipnot[] | null; acik: boolean; k: GozVeri['kaynaklar'] }) {
  if (!acik || !d?.length) return null;
  return <div style={{ ...kucuk, marginTop: 4, borderLeft: '2px solid rgba(15,155,142,0.5)', paddingLeft: 8 }}>{d.map((x, i) => <div key={i}><b>{x.ref}</b> — {x.not} <span style={{ opacity: 0.7 }}>({k[x.ref]?.ad || x.ref}{k[x.ref]?.dogrulama === 'hekim' ? ' · hekim teyit eder' : ''})</span></div>)}</div>;
}

/** GİB mini trend: OD/OS çizgisi + hekim hedefi kesik çizgi. Sayı yok-yorum yok; hekim ekranı. */
function GibGrafik({ seriSag, seriSol, hedefSag, hedefSol }: { seriSag: { tarih: string; deger: number }[]; seriSol: { tarih: string; deger: number }[]; hedefSag: number | null; hedefSol: number | null }) {
  const tum = [...seriSag, ...seriSol];
  if (tum.length < 2) return <div style={kucuk}>Trend için en az iki GİB ölçümü gerekir.</div>;
  const tarihler = [...new Set(tum.map((x) => x.tarih))].sort();
  const degerler = [...tum.map((x) => x.deger), ...(hedefSag != null ? [hedefSag] : []), ...(hedefSol != null ? [hedefSol] : [])];
  const min = Math.floor(Math.min(...degerler) - 2), max = Math.ceil(Math.max(...degerler) + 2);
  const W = 340, H = 120, L = 28, R = 8, T = 8, B = 18;
  const x = (t: string) => L + (tarihler.indexOf(t) / Math.max(1, tarihler.length - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - min) / (max - min || 1)) * (H - T - B);
  const cizgi = (s: { tarih: string; deger: number }[]) => s.map((p) => `${x(p.tarih)},${y(p.deger)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 420, display: 'block' }} role="img" aria-label="GİB trendi">
      {[min, Math.round((min + max) / 2), max].map((v) => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.08)" /><text x={L - 4} y={y(v) + 3} fontSize="9" textAnchor="end" fill="#64748B">{v}</text></g>)}
      {hedefSag != null && <line x1={L} x2={W - R} y1={y(hedefSag)} y2={y(hedefSag)} stroke="#2DD4BF" strokeDasharray="4 3" opacity="0.6" />}
      {hedefSol != null && <line x1={L} x2={W - R} y1={y(hedefSol)} y2={y(hedefSol)} stroke="#60A5FA" strokeDasharray="4 3" opacity="0.6" />}
      <polyline points={cizgi(seriSag)} fill="none" stroke="#2DD4BF" strokeWidth="2" />
      <polyline points={cizgi(seriSol)} fill="none" stroke="#60A5FA" strokeWidth="2" />
      {seriSag.map((p) => <circle key={`d${p.tarih}`} cx={x(p.tarih)} cy={y(p.deger)} r="3" fill="#2DD4BF"><title>{`OD ${p.tarih}: ${p.deger}`}</title></circle>)}
      {seriSol.map((p) => <circle key={`s${p.tarih}`} cx={x(p.tarih)} cy={y(p.deger)} r="3" fill="#60A5FA"><title>{`OS ${p.tarih}: ${p.deger}`}</title></circle>)}
      <text x={L} y={H - 4} fontSize="9" fill="#64748B">{tarihler[0]}</text><text x={W - R} y={H - 4} fontSize="9" fill="#64748B" textAnchor="end">{tarihler[tarihler.length - 1]}</text>
    </svg>
  );
}

const Secim = ({ deger, set, secenekler, bos }: { deger: string; set: (x: string) => void; secenekler: Array<[string, string]>; bos?: string }) => (
  <select value={deger} onChange={(e) => set(e.target.value)} style={{ ...toolsInput, width: 'auto' }}>
    {bos != null && <option value="" style={{ color: '#000' }}>{bos}</option>}
    {secenekler.map(([k, a]) => <option key={k} value={k} style={{ color: '#000' }}>{a}</option>)}
  </select>
);

export function GozKartlar({ v, sekme, kaynak, salt, calistir }: { v: GozVeri; sekme: string; kaynak: boolean; salt: boolean; calistir: (b: Record<string, unknown>, ok?: string) => Promise<Record<string, unknown> | null> }) {
  const [f, setF] = useState<Record<string, unknown>>({});
  const s = (k: string, d = '') => (f[k] == null ? d : String(f[k]));
  const set = (k: string, x: unknown) => setF((p) => ({ ...p, [k]: x }));
  const [sonuc, setSonuc] = useState<Record<string, unknown> | null>(null);
  const yaz = salt ? () => undefined : calistir;

  if (sekme === 'Özet') return (
    <div>
      {v.intake && (
        <div style={{ marginBottom: 10 }}>
          <div style={etiket}>Muayene öncesi form (hasta beyanı)</div>
          <pre style={{ ...metin, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{v.intake.subjektif || '—'}</pre>
          {v.intake.ipuclari.length > 0 && <div style={{ ...kucuk, marginTop: 4 }}>İlgili kartlar: {v.intake.ipuclari.map((i) => `${i.kart} (${i.neden})`).join(' · ')}</div>}
          {!salt && <div style={satir}><button type="button" onClick={() => yaz({ adim: 'intake_nota' }, 'Form yanıtları bugünkü notun Subjektif bölümüne eklendi.')} style={ghost}>Nota ekle (S)</button></div>}
        </div>
      )}
      <div style={etiket}>Açık görevler ({v.gorevler.length})</div>
      {!v.gorevler.length && <div style={kucuk}>Açık görev yok.</div>}
      {v.gorevler.map((g) => (
        <div key={g.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: g.due && g.due < bugun() ? '#F87171' : '#EDF1F7', padding: '2px 0' }}>
          <span style={{ flex: 1 }}>{g.ad} <span style={kucuk}>{g.due || 'tarih yok'}</span></span>
          {!salt && <button type="button" aria-label="Tamamlandı" onClick={() => yaz({ adim: 'gorev', gorevId: g.id, durum: 'tamam' })} style={{ ...ghost, minWidth: 36 }}>✓</button>}
        </div>
      ))}
      <div style={{ ...etiket, marginTop: 10 }}>Ölçüm geçmişi</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#EDF1F7', minWidth: 320 }}>
          <thead><tr style={{ color: '#8FA0B5', textAlign: 'left' }}><th style={{ padding: 4 }}>Tarih</th><th>VA OD</th><th>VA OS</th><th>GİB OD</th><th>GİB OS</th></tr></thead>
          <tbody>{v.muayeneler.map((m) => <tr key={m.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}><td style={{ padding: 4, whiteSpace: 'nowrap' }}>{m.tarih}{m.kaynak === 'kopya_onayli' ? ' ⧉' : ''}</td><td>{m.gosterim.sag}</td><td>{m.gosterim.sol}</td><td>{m.gib_sag ?? '—'}</td><td>{m.gib_sol ?? '—'}</td></tr>)}</tbody>
        </table>
      </div>
      {!salt && (
        <div style={{ marginTop: 10 }}>
          <div style={etiket}>Acil işaret (hekim) <span style={kucuk}>· şikâyet metni otomatik taranır; burada elle de işaretleyin</span></div>
          <div style={satir}><input value={s('acilMetin')} onChange={(e) => set('acilMetin', e.target.value)} placeholder="şikâyet (ör. ışık çakması, perde)" style={{ ...toolsInput, minWidth: 200, flex: 1 }} /><button type="button" onClick={async () => { const j = await calistir({ adim: 'acil', metin: s('acilMetin') }, 'Tarandı.'); setSonuc(j); }} style={ghost}>Tara</button></div>
          {Array.isArray(sonuc?.acil) && ((sonuc!.acil as AcilBayrak[]).length ? (sonuc!.acil as AcilBayrak[]).map((a) => <div key={a.kod} style={{ ...metin, color: '#F87171' }}><b>{a.ad}:</b> {a.eylem}</div>) : <div style={kucuk}>Kırmızı bayrak eşleşmedi — klinik değerlendirme hekimin.</div>)}
        </div>
      )}
    </div>
  );

  if (sekme === 'Glokom') {
    const k = v.glokom?.kart; const d = v.glokom?.degerlendirme;
    const damlalar = (f.damlalar as GlokomKart['damlalar']) || k?.damlalar || [];
    return (
      <div>
        <div style={etiket}>Glokom döngüsü <span style={kucuk}>· tanı, hedef GİB, damla, GA/OCT aralığı hekimin · motor titrasyon önermez</span></div>
        {d && <>
          <GibGrafik seriSag={d.gozler.find((g) => g.goz === 'sag')?.seri || []} seriSol={d.gozler.find((g) => g.goz === 'sol')?.seri || []} hedefSag={k?.hedefSag ?? null} hedefSol={k?.hedefSol ?? null} />
          <div style={kucuk}><span style={{ color: '#2DD4BF' }}>━ OD</span> · <span style={{ color: '#60A5FA' }}>━ OS</span> · kesik çizgi = hekim hedefi</div>
          {d.bayraklar.map((b) => <div key={b} style={{ ...metin, color: '#FBBF24' }}>⚠ {b}</div>)}
          {d.gorevler.map((g) => <div key={g.kod} style={metin}>• {g.ad}{g.due ? ` — ${g.due}` : ''}</div>)}
          {d.rejim.length > 0 && <div style={{ ...metin, marginTop: 4 }}>Rejim: {d.rejim.join(' | ')}</div>}
          <Kaynak d={d.dipnotlar} acik={kaynak} k={v.kaynaklar} />
        </>}
        {!salt && <>
          <div style={satir}>
            <input value={s('taniHekim', k?.taniHekim || '')} onChange={(e) => set('taniHekim', e.target.value)} placeholder="Tanı (hekim) — ör. POAG" style={{ ...toolsInput, width: 180 }} />
            <Secim deger={s('goz', k?.goz || 'iki')} set={(x) => set('goz', x)} secenekler={[['iki', 'İki göz'], ['sag', 'OD'], ['sol', 'OS']]} />
            <input value={s('hedefSag', k?.hedefSag?.toString() || '')} onChange={(e) => set('hedefSag', e.target.value)} placeholder="Hedef OD" style={{ ...toolsInput, width: 80 }} inputMode="decimal" />
            <input value={s('hedefSol', k?.hedefSol?.toString() || '')} onChange={(e) => set('hedefSol', e.target.value)} placeholder="Hedef OS" style={{ ...toolsInput, width: 80 }} inputMode="decimal" />
          </div>
          <div style={satir}>
            <span style={kucuk}>Son GA</span><input type="date" value={s('sonGormeAlani', k?.sonGormeAlani || '')} onChange={(e) => set('sonGormeAlani', e.target.value)} style={{ ...toolsInput, width: 150 }} />
            <span style={kucuk}>GA / ay</span><input value={s('gaAralikAy', k?.gaAralikAy?.toString() || '')} onChange={(e) => set('gaAralikAy', e.target.value)} style={{ ...toolsInput, width: 56 }} inputMode="numeric" />
            <span style={kucuk}>Son OCT</span><input type="date" value={s('sonOctRnfl', k?.sonOctRnfl || '')} onChange={(e) => set('sonOctRnfl', e.target.value)} style={{ ...toolsInput, width: 150 }} />
            <span style={kucuk}>OCT / ay</span><input value={s('octAralikAy', k?.octAralikAy?.toString() || '')} onChange={(e) => set('octAralikAy', e.target.value)} style={{ ...toolsInput, width: 56 }} inputMode="numeric" />
          </div>
          <div style={{ ...kucuk, marginTop: 8 }}>Damlalar (hekim yazar — etken madde / ticari ad + göz + sıklık)</div>
          {damlalar.map((dm, i) => (
            <div key={i} style={satir}>
              <input value={dm.ad} onChange={(e) => set('damlalar', damlalar.map((x, j) => (j === i ? { ...x, ad: e.target.value } : x)))} placeholder="damla" style={{ ...toolsInput, width: 160 }} />
              <Secim deger={dm.goz} set={(g) => set('damlalar', damlalar.map((x, j) => (j === i ? { ...x, goz: g as 'sag' } : x)))} secenekler={[['iki', 'İki göz'], ['sag', 'OD'], ['sol', 'OS']]} />
              <input value={dm.siklik} onChange={(e) => set('damlalar', damlalar.map((x, j) => (j === i ? { ...x, siklik: e.target.value } : x)))} placeholder="sıklık (ör. akşam 1)" style={{ ...toolsInput, width: 140 }} />
              <button type="button" onClick={() => set('damlalar', damlalar.filter((_, j) => j !== i))} style={ghost}>Sil</button>
            </div>
          ))}
          <div style={satir}>
            <button type="button" onClick={() => set('damlalar', [...damlalar, { ad: '', goz: 'iki', siklik: '' }])} style={ghost}>+ damla</button>
            <button type="button" onClick={() => calistir({ adim: 'glokom', taniHekim: s('taniHekim', k?.taniHekim || ''), goz: s('goz', k?.goz || 'iki'), hedefSag: s('hedefSag', k?.hedefSag?.toString() || ''), hedefSol: s('hedefSol', k?.hedefSol?.toString() || ''), damlalar, sonGormeAlani: s('sonGormeAlani', k?.sonGormeAlani || ''), sonOctRnfl: s('sonOctRnfl', k?.sonOctRnfl || ''), gaAralikAy: s('gaAralikAy', k?.gaAralikAy?.toString() || ''), octAralikAy: s('octAralikAy', k?.octAralikAy?.toString() || '') }, 'Glokom kartı kaydedildi (hekim kilidi).')} style={btn}>Kaydet</button>
          </div>
        </>}
      </div>
    );
  }

  if (sekme === 'DR') {
    const r = v.dr?.satir; const d = v.dr?.degerlendirme;
    const evreSec: Array<[string, string]> = Object.entries(EVRE_ADI);
    const dmoSec: Array<[string, string]> = Object.entries(DMO_ADI);
    return (
      <div>
        <div style={etiket}>Diyabetik retinopati <span style={kucuk}>· evre yalnız hekim fundus muayenesiyle · TEMD 2026 (TR) ↔ ICO 2017 iki sütun</span></div>
        {v.acikGozSevkleri.map((sv) => (
          <div key={sv.id} style={{ border: '1px solid rgba(251,191,36,0.4)', borderRadius: 8, padding: 8, marginBottom: 8, ...metin }}>
            Dahiliye göz sevki ({sv.created_at.slice(0, 10)}): {sv.not_metni || 'göz dibi'}
            {!salt && <div style={satir}><button type="button" onClick={async () => { const j = await calistir({ adim: 'dr_sevk_kapat', sevkId: sv.id }, 'Sevk kapatıldı; dahiliye DM kartına göz dibi tarihi yazıldı.'); if (j?.geriBildirim) setSonuc(j); }} style={btn}>Sevki kapat + dahiliyeye geri bildir</button><span style={kucuk}>önce aşağıda evre + fundus tarihi</span></div>}
          </div>
        ))}
        {typeof sonuc?.geriBildirim === 'string' && <div style={{ ...metin, color: '#2DD4BF' }}>Geri bildirim: {sonuc.geriBildirim as string}</div>}
        {d && <>
          {d.taramaGorevi && <div style={{ ...metin, color: '#FBBF24' }}>⚠ {d.taramaGorevi.ad}</div>}
          {d.kontrol && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, margin: '6px 0' }}>
              <div style={{ border: '1px solid rgba(45,212,191,0.35)', borderRadius: 8, padding: 8, ...metin }}><div style={kucuk}>TR — TEMD 2026</div><b>{d.kontrol.tr.enErken === d.kontrol.tr.enGec ? d.kontrol.tr.enGec : `${d.kontrol.tr.enErken} → ${d.kontrol.tr.enGec}`}</b><div style={kucuk}>{d.kontrol.tr.gerekce}</div></div>
              <div style={{ border: '1px solid rgba(96,165,250,0.35)', borderRadius: 8, padding: 8, ...metin }}><div style={kucuk}>Uluslararası — ICO 2017</div><b>{d.kontrol.uluslararasi.enErken} → {d.kontrol.uluslararasi.enGec}</b><div style={kucuk}>{d.kontrol.uluslararasi.gerekce}</div></div>
            </div>
          )}
          {d.kontrol?.catisma && <div style={{ ...kucuk, color: '#FBBF24' }}>Çakışma: {d.kontrol.not}</div>}
          {d.sevkAciliyet === 'ayni_gun' && <div style={{ ...metin, color: '#F87171' }}>Aynı gün değerlendirme / tedavi</div>}
          {d.uyarilar.map((u) => <div key={u} style={{ ...metin, color: '#FBBF24' }}>⚠ {u}</div>)}
          <Kaynak d={d.dipnotlar} acik={kaynak} k={v.kaynaklar} />
        </>}
        {!salt && <>
          <div style={satir}>
            <Secim deger={s('dmTip', String(r?.dm_tip || ''))} set={(x) => set('dmTip', x)} secenekler={[['T2', 'Tip 2'], ['T1', 'Tip 1'], ['diger', 'Diğer']]} bos="DM tipi" />
            <span style={kucuk}>tanı</span><input type="date" value={s('dmTaniTarihi', String(r?.dm_tani_tarihi || ''))} onChange={(e) => set('dmTaniTarihi', e.target.value)} style={{ ...toolsInput, width: 150 }} />
            <label style={{ ...kucuk, display: 'flex', gap: 4, alignItems: 'center' }}><input type="checkbox" checked={f.gebe == null ? !!r?.gebe : !!f.gebe} onChange={(e) => set('gebe', e.target.checked)} />gebe (önceden DM)</label>
          </div>
          <div style={satir}>
            <span style={kucuk}>OD</span><Secim deger={s('evreSag', String(r?.evre_sag || ''))} set={(x) => set('evreSag', x)} secenekler={evreSec} bos="evre" /><Secim deger={s('dmoSag', String(r?.dmo_sag || ''))} set={(x) => set('dmoSag', x)} secenekler={dmoSec} bos="DMÖ" />
            <span style={kucuk}>OS</span><Secim deger={s('evreSol', String(r?.evre_sol || ''))} set={(x) => set('evreSol', x)} secenekler={evreSec} bos="evre" /><Secim deger={s('dmoSol', String(r?.dmo_sol || ''))} set={(x) => set('dmoSol', x)} secenekler={dmoSec} bos="DMÖ" />
          </div>
          <div style={satir}>
            <span style={kucuk}>Fundus tarihi</span><input type="date" value={s('sonFundus', String(r?.son_fundus || ''))} onChange={(e) => set('sonFundus', e.target.value)} style={{ ...toolsInput, width: 150 }} />
            <span style={kucuk}>Sonraki kontrol (hekim kilidi)</span><input type="date" value={s('sonrakiKontrol', String(r?.sonraki_kontrol || ''))} onChange={(e) => set('sonrakiKontrol', e.target.value)} style={{ ...toolsInput, width: 150 }} />
            <button type="button" onClick={() => { const o: Record<string, unknown> = {}; for (const [a, b] of [['dmTip', 'dm_tip'], ['dmTaniTarihi', 'dm_tani_tarihi'], ['evreSag', 'evre_sag'], ['evreSol', 'evre_sol'], ['dmoSag', 'dmo_sag'], ['dmoSol', 'dmo_sol'], ['sonFundus', 'son_fundus'], ['sonrakiKontrol', 'sonraki_kontrol']]) { const x = s(a, String(r?.[b] || '')); if (x) o[a] = x; } o.gebe = f.gebe == null ? !!r?.gebe : !!f.gebe; calistir({ adim: 'dr', dr: o }, 'DR kartı kaydedildi (hekim evresi).'); }} style={btn}>Kaydet</button>
          </div>
        </>}
      </div>
    );
  }

  if (sekme === 'Enjeksiyon') {
    const e = { goz: s('eGoz', 'sag'), ajan: s('eAjan', 'bevacizumab'), endikasyon: s('eEnd', 'ybmd'), faz: s('eFaz', 'yukleme'), dozNo: Number(s('eDoz', '1')) || undefined, tarih: s('eTarih', bugun()), durum: s('eDurum', 'planli') };
    const kapi = sonuc?.kapi as { odenebilir: boolean | null; uyarilar: string[]; engeller: string[]; dipnotlar: Dipnot[] } | undefined;
    const takvim = (sonuc?.takvim as Array<{ dozNo: number; enErken: string; enGec: string }>) || [];
    return (
      <div>
        <div style={etiket}>İntravitreal enjeksiyon <span style={kucuk}>· SUT 4.2.33 · karar, doz ve idame aralığı hekimin</span></div>
        {(['sag', 'sol'] as const).map((g) => <div key={g} style={metin}><b>{gozAd(g)}:</b> {v.sonrakiDoz[g].not}{v.sonrakiDoz[g].enErken ? ` — pencere ${v.sonrakiDoz[g].enErken} → ${v.sonrakiDoz[g].enGec}` : ''}</div>)}
        <div style={{ overflowX: 'auto', marginTop: 6 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#EDF1F7', minWidth: 360 }}>
            <thead><tr style={{ color: '#8FA0B5', textAlign: 'left' }}><th style={{ padding: 4 }}>Tarih</th><th>Göz</th><th>Ajan</th><th>Faz</th><th>Durum</th></tr></thead>
            <tbody>{v.enjeksiyonlar.map((x) => <tr key={x.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}><td style={{ padding: 4 }}>{x.tarih}</td><td>{gozAd(x.goz)}</td><td>{AJAN_ADI[x.ajan]}</td><td>{x.faz === 'yukleme' ? `yükleme ${x.dozNo ?? ''}` : 'idame'}</td><td>{x.durum}{!salt && x.durum === 'planli' && <button type="button" onClick={() => calistir({ adim: 'enjeksiyon', id: x.id, enjeksiyon: { goz: x.goz, ajan: x.ajan, endikasyon: x.endikasyon, faz: x.faz, dozNo: x.dozNo ?? undefined, tarih: x.tarih, durum: 'yapildi' } }, 'Yapıldı olarak işaretlendi.')} style={{ ...ghost, marginLeft: 6, padding: '2px 8px' }}>yapıldı</button>}</td></tr>)}</tbody>
          </table>
        </div>
        {!salt && <>
          <div style={satir}>
            <Secim deger={e.goz} set={(x) => set('eGoz', x)} secenekler={[['sag', 'OD'], ['sol', 'OS']]} />
            <Secim deger={e.ajan} set={(x) => set('eAjan', x)} secenekler={Object.entries(AJAN_ADI)} />
            <Secim deger={e.endikasyon} set={(x) => set('eEnd', x)} secenekler={Object.entries(ENDIKASYON_ADI)} />
            <Secim deger={e.faz} set={(x) => set('eFaz', x)} secenekler={[['yukleme', 'Yükleme'], ['idame', 'İdame']]} />
            {e.faz === 'yukleme' && <input value={s('eDoz', '1')} onChange={(ev) => set('eDoz', ev.target.value)} style={{ ...toolsInput, width: 50 }} aria-label="doz no" inputMode="numeric" />}
          </div>
          <div style={satir}>
            <input type="date" value={e.tarih} onChange={(ev) => set('eTarih', ev.target.value)} style={{ ...toolsInput, width: 150 }} />
            <Secim deger={e.durum} set={(x) => set('eDurum', x)} secenekler={[['planli', 'Planlı'], ['yapildi', 'Yapıldı']]} />
            <Secim deger={s('basamak', 'muayenehane')} set={(x) => set('basamak', x)} secenekler={[['muayenehane', 'Muayenehane'], ['2', '2. basamak'], ['3', '3. basamak']]} />
            <label style={{ ...kucuk, display: 'flex', gap: 4, alignItems: 'center' }}><input type="checkbox" checked={!!f.mi} onChange={(ev) => set('mi', ev.target.checked)} />son 3 ay MI/SVO</label>
            <button type="button" onClick={async () => setSonuc(await calistir({ adim: 'sgk_kapi', enjeksiyon: e, basamak: s('basamak', 'muayenehane'), son3AydaMiVeyaSvo: !!f.mi }, 'SUT kontrolü yapıldı.'))} style={ghost}>SUT kontrol</button>
            <button type="button" onClick={async () => setSonuc(await calistir({ adim: 'enjeksiyon', enjeksiyon: e, basamak: s('basamak', 'muayenehane'), son3AydaMiVeyaSvo: !!f.mi }, 'Enjeksiyon kaydedildi.'))} style={btn}>Kaydet</button>
          </div>
        </>}
        {kapi && <div style={{ marginTop: 6 }}>
          {kapi.engeller.map((x) => <div key={x} style={{ ...metin, color: '#F87171' }}>✕ {x}</div>)}
          {kapi.uyarilar.map((x) => <div key={x} style={{ ...metin, color: '#FBBF24' }}>⚠ {x}</div>)}
          {!kapi.engeller.length && !kapi.uyarilar.length && <div style={{ ...metin, color: '#2DD4BF' }}>SUT kapılarında engel yok.</div>}
          <Kaynak d={kapi.dipnotlar} acik={kaynak} k={v.kaynaklar} />
        </div>}
        {takvim.length > 0 && <div style={{ ...metin, marginTop: 4 }}>Yükleme takvimi taslağı: {takvim.map((t) => `${t.dozNo}. doz ${t.enErken === t.enGec ? t.enErken : `${t.enErken}–${t.enGec}`}`).join(' · ')}</div>}
      </div>
    );
  }

  if (sekme === 'SGK rapor') {
    const alan = (k: string, ph: string, w = 120, tip = 'text') => <input type={tip} value={s(k)} onChange={(e) => set(k, e.target.value)} placeholder={ph} title={ph} style={{ ...toolsInput, width: w }} />;
    const r = sonuc?.draft ? sonuc as { raporTipi: string; eksikler: string[]; sutKontrol: { madde: string; tamam: boolean | null }[]; draft: Record<string, unknown>; dipnotlar: Dipnot[] } : null;
    return (
      <div>
        <div style={etiket}>SGK rapor taslağı <span style={kucuk}>· SUT 4.2.33 zorunlu içerik · hekim kilitler, Medula'ya hekim e-imza ile</span></div>
        {!salt && <>
          <div style={satir}>
            <Secim deger={s('sablon', 'anti_vegf_baslangic')} set={(x) => set('sablon', x)} secenekler={v.sgkSablonlari.map((x) => [x.id, x.ad])} />
            <Secim deger={s('rGoz', 'sag')} set={(x) => set('rGoz', x)} secenekler={[['sag', 'OD'], ['sol', 'OS']]} />
            {s('sablon', 'anti_vegf_baslangic') !== 'katarakt_gil' && <><Secim deger={s('rAjan', 'bevacizumab')} set={(x) => set('rAjan', x)} secenekler={Object.entries(AJAN_ADI)} /><Secim deger={s('rEnd', 'ybmd')} set={(x) => set('rEnd', x)} secenekler={Object.entries(ENDIKASYON_ADI)} /></>}
          </div>
          <div style={satir}><textarea value={s('anamnez')} onChange={(e) => set('anamnez', e.target.value)} placeholder="Anamnez (hekim)" rows={2} style={{ ...toolsInput, width: '100%' }} /></div>
          <div style={satir}>{alan('vaBaslangic', 'VA başlangıç', 100)}{alan('vaOnceki', 'VA önceki', 90)}{alan('vaSimdi', 'VA şimdi', 90)}{alan('mfkBaslangic', 'MFK başl. µm', 100)}{alan('mfkOnceki', 'MFK önceki µm', 110)}{alan('mfkSimdi', 'MFK şimdi µm', 100)}</div>
          <div style={satir}><span style={kucuk}>Renkli resim</span>{alan('renkliResim', 'renkli resim tarihi', 150, 'date')}<span style={kucuk}>FFA</span>{alan('ffa', 'FFA tarihi', 150, 'date')}<label style={{ ...kucuk, display: 'flex', gap: 4 }}><input type="checkbox" checked={!!f.ffaKontrendike} onChange={(e) => set('ffaKontrendike', e.target.checked)} />FFA kontrendike</label><span style={kucuk}>OKT</span>{alan('okt', 'OKT tarihi', 150, 'date')}</div>
          <div style={satir}><label style={{ ...kucuk, display: 'flex', gap: 4 }}><input type="checkbox" checked={!!f.hekimYanit} onChange={(e) => set('hekimYanit', e.target.checked)} />Hekim beyanı: tedaviye yanıt var (MFK ≥250 µm, 4.2.33(5))</label>
            <button type="button" onClick={async () => setSonuc(await calistir({ adim: 'sgkrapor', sablon: s('sablon', 'anti_vegf_baslangic'), goz: s('rGoz', 'sag'), ajan: s('rAjan', 'bevacizumab'), endikasyon: s('rEnd', 'ybmd'), anamnez: s('anamnez'), vaBaslangic: s('vaBaslangic'), vaOnceki: s('vaOnceki'), vaSimdi: s('vaSimdi'), mfkBaslangic: s('mfkBaslangic'), mfkOnceki: s('mfkOnceki'), mfkSimdi: s('mfkSimdi'), renkliResim: s('renkliResim'), ffa: s('ffa'), ffaKontrendike: !!f.ffaKontrendike, okt: s('okt'), hekimYanitVarBeyani: !!f.hekimYanit }, 'Rapor taslağı oluşturuldu.'))} style={btn}>Taslak oluştur</button></div>
        </>}
        {r && <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: 8, marginTop: 8, ...metin }}>
          <div><b>{String(r.draft.raporBasligi)}</b> · {r.raporTipi}</div>
          <div>Tanı önerisi: {(r.draft.tani as { icd10: string; aciklama: string }).icd10} {(r.draft.tani as { aciklama: string }).aciklama} <span style={kucuk}>(hekim doğrular)</span></div>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: '4px 0' }}>{String(r.draft.mevcutDurum || '')}</pre>
          {(r.draft.zorunluTetkikler as string[] | undefined)?.length ? <div style={kucuk}>Tetkikler: {(r.draft.zorunluTetkikler as string[]).join(' · ')}</div> : null}
          <div>{String(r.draft.hekim_degerlendirmesi || '')}</div>
          {r.sutKontrol.map((x) => <div key={x.madde} style={{ color: x.tamam === true ? '#2DD4BF' : x.tamam === false ? '#F87171' : '#8FA0B5' }}>{x.tamam === true ? '✓' : x.tamam === false ? '✕' : '?'} {x.madde}</div>)}
          {r.eksikler.map((x) => <div key={x} style={{ color: '#FBBF24' }}>Eksik: {x}</div>)}
          <Kaynak d={r.dipnotlar} acik={kaynak} k={v.kaynaklar} />
        </div>}
        <div style={{ ...etiket, marginTop: 10 }}>Kayıtlı taslaklar</div>
        {v.sgkRaporlari.map((x) => <div key={x.id} style={{ ...metin, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><span>{x.created_at.slice(0, 10)} · {v.sgkSablonlari.find((t) => t.id === x.sablon)?.ad} · <b>{x.durum}</b>{x.eksikler.length ? ` · ${x.eksikler.length} eksik` : ''}</span>{!salt && x.durum === 'taslak' && <button type="button" onClick={() => calistir({ adim: 'sgkrapor_kilit', id: x.id, eksikRaganKilitle: false }, 'Rapor kilitlendi.')} style={ghost}>Kilitle</button>}</div>)}
        {!v.sgkRaporlari.length && <div style={kucuk}>Taslak yok.</div>}
      </div>
    );
  }

  if (sekme === 'Katarakt') {
    const secili = (f.kat as Record<string, boolean>) || {};
    return (
      <div>
        <div style={etiket}>Katarakt / GİL ön-op <span style={kucuk}>· GİL gücü biyometri cihazı + hekim; Notya hesaplamaz</span></div>
        {v.katarakt.map((k) => <div key={k.id} style={{ ...metin, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 8, marginBottom: 6 }}>
          <b>{gozAd(k.goz)}</b> · {k.durum} · {k.hazirlik.tamam}/{k.hazirlik.toplam}{k.gil_tipi_hekim ? ` · GİL: ${k.gil_tipi_hekim}` : ''}{k.planlanan_tarih ? ` · ${k.planlanan_tarih}` : ''}
          {k.hazirlik.eksikZorunlu.map((x) => <div key={x} style={{ color: '#FBBF24' }}>• {x}</div>)}
          {!salt && <button type="button" onClick={() => setF((p) => ({ ...p, katId: k.id, kat: k.checklist, katGoz: k.goz, gilTipi: k.gil_tipi_hekim || '', planlananTarih: k.planlanan_tarih || '' }))} style={{ ...ghost, marginTop: 4 }}>Düzenle</button>}
          <Kaynak d={k.hazirlik.dipnotlar} acik={kaynak} k={v.kaynaklar} />
        </div>)}
        {!salt && <>
          <div style={satir}><Secim deger={s('katGoz', 'sag')} set={(x) => set('katGoz', x)} secenekler={[['sag', 'OD'], ['sol', 'OS']]} /><Secim deger={s('gilTipi')} set={(x) => set('gilTipi', x)} secenekler={[['monofokal', 'Monofokal'], ['torik', 'Torik'], ['multifokal', 'Multifokal'], ['edof', 'EDOF'], ['diger', 'Diğer']]} bos="GİL tipi (hekim)" /><input type="date" value={s('planlananTarih')} onChange={(e) => set('planlananTarih', e.target.value)} style={{ ...toolsInput, width: 150 }} /></div>
          <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>{v.kataraktKontrol.map((m) => <label key={m.kod} style={{ ...metin, display: 'flex', gap: 6, alignItems: 'flex-start' }}><input type="checkbox" checked={!!secili[m.kod]} onChange={(e) => set('kat', { ...secili, [m.kod]: e.target.checked })} /><span>{m.ad}{m.zorunlu ? '' : <span style={kucuk}> (gerekirse)</span>}</span></label>)}</div>
          <div style={satir}><button type="button" onClick={() => calistir({ adim: 'katarakt', id: f.katId || undefined, goz: s('katGoz', 'sag'), gilTipi: s('gilTipi') || null, planlananTarih: s('planlananTarih') || null, checklist: secili }, 'Katarakt kontrol listesi kaydedildi.')} style={btn}>{f.katId ? 'Güncelle' : 'Yeni plan kaydet'}</button></div>
        </>}
      </div>
    );
  }

  if (sekme === 'Görüntü') return (
    <div>
      <div style={etiket}>OCT / fundus / ön segment <span style={kucuk}>· {v.goruntuDisclaimer} · asistan taslağı → uzman onayı</span></div>
      <div style={kucuk}>Yükleme: Görüntüleme sekmesinde modalite olarak OCT / Fundus fotoğrafı / Ön segment fotoğrafı seçin; göz bilgisini bölge alanına yazın.</div>
      {!v.goruntuler.length && <div style={{ ...kucuk, marginTop: 6 }}>Göz görüntüsü yok.</div>}
      {v.goruntuler.map((g) => (
        <div key={g.id} style={{ borderLeft: '2px solid rgba(99,102,241,0.6)', paddingLeft: 10, margin: '10px 0', ...metin }}>
          <div><b>{g.tarih}</b> · {MOD_ADI[g.modalite] || g.modalite} · {g.goz || 'göz belirtilmedi'}{g.url && <> · <a href={g.url} target="_blank" rel="noreferrer" style={{ color: '#2DD4BF' }}>aç</a></>}</div>
          {g.okumalar.map((o) => (
            <div key={o.id} style={{ marginTop: 4, padding: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
              <div style={kucuk}>{o.taslak_yazan === 'asistan' ? 'Asistan taslağı' : 'Uzman taslağı'} · {o.durum === 'draft' ? 'onay bekliyor' : o.durum}</div>
              <div>{o.taslak}</div>
              {o.uzman_metin && <div style={{ color: '#2DD4BF' }}>Uzman: {o.uzman_metin}</div>}
              {!salt && o.durum === 'draft' && <div style={satir}>
                <button type="button" onClick={() => calistir({ adim: 'goruntu_okuma', eylem: 'onayla', id: o.id }, 'Okuma uzman onaylı.')} style={btn}>Onayla</button>
                <input value={s(`duz_${o.id}`)} onChange={(e) => set(`duz_${o.id}`, e.target.value)} placeholder="düzeltilmiş metin" style={{ ...toolsInput, minWidth: 160, flex: 1 }} />
                <button type="button" onClick={() => calistir({ adim: 'goruntu_okuma', eylem: 'duzelt', id: o.id, uzmanMetin: s(`duz_${o.id}`) }, 'Düzeltildi.')} style={ghost}>Düzelt</button>
                <button type="button" onClick={() => calistir({ adim: 'goruntu_okuma', eylem: 'reddet', id: o.id }, 'Reddedildi.')} style={ghost}>Reddet</button>
              </div>}
            </div>
          ))}
          {!salt && <div style={satir}>
            <input value={s(`t_${g.id}`)} onChange={(e) => set(`t_${g.id}`, e.target.value)} placeholder="Gözlem taslağı (tanı değil)" style={{ ...toolsInput, minWidth: 180, flex: 1 }} />
            <Secim deger={s(`y_${g.id}`, 'asistan')} set={(x) => set(`y_${g.id}`, x)} secenekler={[['asistan', 'Asistan'], ['uzman', 'Uzman']]} />
            <button type="button" onClick={async () => { const j = await calistir({ adim: 'goruntu_okuma', eylem: 'taslak', goruntuId: g.id, taslak: s(`t_${g.id}`), taslakYazan: s(`y_${g.id}`, 'asistan') }, 'Taslak eklendi — uzman onayı bekliyor.'); if (j?.uyari) setSonuc(j); }} style={ghost}>Taslak ekle</button>
          </div>}
        </div>
      ))}
      {typeof sonuc?.uyari === 'string' && <div style={{ ...metin, color: '#FBBF24' }}>⚠ {sonuc.uyari as string}</div>}
    </div>
  );

  if (sekme === 'Ön segment') return (
    <div style={{ display: 'grid', gap: 10 }}>
      {v.protokoller.map((p) => (
        <div key={p.id} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 8, ...metin }}>
          <div style={etiket}>{p.ad}</div>
          <div style={kucuk}>Sorgu</div>{p.sorgu.map((x) => <div key={x}>• {x}</div>)}
          <div style={{ ...kucuk, color: '#F87171', marginTop: 4 }}>Kırmızı bayrak</div>{p.kirmiziBayrak.map((x) => <div key={x} style={{ color: '#FCA5A5' }}>• {x}</div>)}
          <div style={{ ...kucuk, marginTop: 4 }}>Yaklaşım (sınıf düzeyi, doz hekimin)</div>{p.yaklasim.map((x) => <div key={x}>• {x}</div>)}
          {p.sgk.length > 0 && <><div style={{ ...kucuk, marginTop: 4 }}>SGK</div>{p.sgk.map((x) => <div key={x}>• {x}</div>)}</>}
          <Kaynak d={p.dipnotlar} acik={kaynak} k={v.kaynaklar} />
        </div>
      ))}
    </div>
  );

  if (sekme === 'Pediatrik') {
    const r = v.pediatrik.satir;
    return (
      <div>
        <div style={etiket}>Ambliyopi / şaşılık izlem <span style={kucuk}>· pediatri bölümü çatallanmaz; kapama rejimi hekim yazar</span></div>
        {v.pediatrik.izlem.hatirlatmalar.map((h) => <div key={h} style={metin}>• {h}</div>)}
        {!v.pediatrik.izlem.hatirlatmalar.length && <div style={kucuk}>{v.hasta.yasAy != null && v.hasta.yasAy >= 216 ? 'Erişkin hasta.' : 'Hatırlatma yok.'}</div>}
        <Kaynak d={v.pediatrik.izlem.dipnotlar} acik={kaynak} k={v.kaynaklar} />
        {!salt && <>
          <div style={satir}>
            <Secim deger={s('pTip', String(r?.tip || ''))} set={(x) => set('pTip', x)} secenekler={[['ambliyopi', 'Ambliyopi'], ['sasilik', 'Şaşılık'], ['ambliyopi_sasilik', 'Ambliyopi + şaşılık'], ['refraktif', 'Refraktif']]} bos="tip" />
            <input value={s('kapama', String(r?.kapama_hekim || ''))} onChange={(e) => set('kapama', e.target.value)} placeholder="kapama / penalizasyon (hekim)" style={{ ...toolsInput, width: 200 }} />
            <label style={{ ...kucuk, display: 'flex', gap: 4 }}><input type="checkbox" checked={f.gozluk == null ? !!r?.gozluk : !!f.gozluk} onChange={(e) => set('gozluk', e.target.checked)} />gözlük</label>
            <input type="date" value={s('pKontrol', String(r?.sonraki_kontrol || ''))} onChange={(e) => set('pKontrol', e.target.value)} style={{ ...toolsInput, width: 150 }} />
            <button type="button" onClick={() => calistir({ adim: 'pediatrik', tip: s('pTip', String(r?.tip || '')), kapamaHekim: s('kapama', String(r?.kapama_hekim || '')), gozluk: f.gozluk == null ? !!r?.gozluk : !!f.gozluk, sonrakiKontrol: s('pKontrol', String(r?.sonraki_kontrol || '')) }, 'Pediatrik izlem kaydedildi.')} style={btn}>Kaydet</button>
          </div>
        </>}
      </div>
    );
  }

  if (sekme === 'Kontrol') return (
    <div>
      <div style={etiket}>Kontrol randevusu hatırlatması <span style={kucuk}>· hastanın Sağlığım › Gözlerim bölümünde görünür</span></div>
      {!salt && <div style={satir}>
        <input type="date" value={s('kTarih')} onChange={(e) => set('kTarih', e.target.value)} style={{ ...toolsInput, width: 150 }} />
        <input value={s('kNeden')} onChange={(e) => set('kNeden', e.target.value)} placeholder="neden (ör. glokom kontrolü)" style={{ ...toolsInput, width: 200 }} />
        <label style={{ ...kucuk, display: 'flex', gap: 4 }}><input type="checkbox" checked={!!f.kDil} onChange={(e) => set('kDil', e.target.checked)} />dilatasyon</label>
        <button type="button" onClick={() => calistir({ adim: 'kontrol', tarih: s('kTarih'), neden: s('kNeden') || 'Göz kontrolü', dilatasyon: !!f.kDil }, 'Kontrol eklendi.')} style={btn}>Ekle</button>
      </div>}
      {v.kontroller.map((k) => <div key={k.id} style={{ ...metin, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '3px 0' }}><span>{k.tarih} · {k.neden}{k.dilatasyon ? ' · dilatasyon' : ''} · <b>{k.durum}</b></span>{!salt && k.durum === 'planli' && <><button type="button" onClick={() => calistir({ adim: 'kontrol', id: k.id, durum: 'yapildi' })} style={ghost}>yapıldı</button><button type="button" onClick={() => calistir({ adim: 'kontrol', id: k.id, durum: 'iptal' })} style={ghost}>iptal</button></>}</div>)}
      {!v.kontroller.length && <div style={kucuk}>Planlı kontrol yok.</div>}
    </div>
  );

  return null;
}
