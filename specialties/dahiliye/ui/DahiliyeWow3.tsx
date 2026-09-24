'use client';
/** NOTYA-DAH-WOW Wave 3 UI — KY · Antikoagülan · Solunum · GI · EKG · Ramazan sekmeleri; Tiroid nodül (Tiroid altında) ve Check-up paket defteri (Check-up altında). */
import React, { useState } from 'react';
import { toolsInput } from '@/lib/doktor/toolsUi';
import type { Wow3Veri } from '@/app/api/doktor/dahiliye/_wow3';
import type { EkgSonuc } from '../engines/ekg';
import type { RaporBolum } from '../engines/checkupPaket';
import { Kaynak } from './DahiliyeWow2';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type Props = { sekme: string; w3: Wow3Veri; kaynak: boolean; refler: Record<string, string>; calistir: (body: Record<string, unknown>, ok?: string) => Promise<Record<string, unknown> | null> };

const kucuk: React.CSSProperties = { fontSize: 11, color: CHROME_RENK.muted };
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 6 };
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 };
const govde: React.CSSProperties = { fontSize: 12, color: CHROME_RENK.ink, marginTop: 8 };
const btn: React.CSSProperties = { background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: CHROME_RENK.muted, border: '1px solid rgba(255,255,255,0.15)' };
const kirmiziBtn: React.CSSProperties = { ...btn, background: '#B91C1C' };
const chk = (label: string, v: boolean, on: (x: boolean) => void) => <label key={label} style={{ ...kucuk, display: 'flex', gap: 4, alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '3px 8px', cursor: 'pointer', color: v ? '#0F9B8E' : CHROME_RENK.muted }}><input type="checkbox" checked={v} onChange={(e) => on(e.target.checked)} />{label}</label>;
const sec = (v: string, on: (x: string) => void, ops: [string, string][], ph?: string) => <select value={v} onChange={(e) => on(e.target.value)} style={{ ...toolsInput, width: 'auto' }}>{ph && <option value="">{ph}</option>}{ops.map(([k, a]) => <option key={k} value={k} style={{ color: '#000' }}>{a}</option>)}</select>;
const Liste = ({ x, renk, on }: { x: string[]; renk?: string; on?: string }) => <>{x.map((y) => <div key={y} style={{ color: renk || CHROME_RENK.ink }}>{on || '•'} {y}</div>)}</>;
const esc = (x: unknown) => String(x ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
function yazdir(baslik: string, govdeHtml: string) {
  const w = window.open('', '_blank'); if (!w) return;
  w.document.write(`<html lang="tr"><head><meta charset="utf-8"><title>${esc(baslik)}</title><style>body{font-family:Arial,sans-serif;max-width:760px;margin:24px auto;font-size:13px;line-height:1.5}h1{font-size:18px}h2{font-size:14px;margin:16px 0 4px;border-bottom:1px solid #ccc}pre{white-space:pre-wrap;font-family:inherit}</style></head><body>${govdeHtml}</body></html>`);
  w.document.close(); w.print();
}

export default function DahiliyeWow3({ sekme, w3, kaynak, refler, calistir }: Props) {
  const [f, setF] = useState<Record<string, unknown>>({});
  const s = (k: string, d = '') => (f[k] === undefined ? d : String(f[k] ?? ''));
  const set = (k: string, x: unknown) => setF((p) => ({ ...p, [k]: x }));
  const bv = (k: string, d: boolean) => (f[k] === undefined ? d : !!f[k]);
  const [ekg, setEkg] = useState<EkgSonuc | null>(null);
  const [rapor, setRapor] = useState<{ paketId: string; bolumler: RaporBolum[]; taslak: boolean } | null>(null);

  if (sekme === 'KY') {
    const h = w3.hf; const r = h?.sonuc;
    return (<div>
      <div style={etiket}>Kalp yetersizliği / GDMT <span style={kucuk}>· EF kategorisi · 4 sütun kontrol listesi (hasta_ilaclar) · kardiyoloji sevk tetikleyicileri · yoğun bakım protokolü yok</span></div>
      <div style={satir}>
        <input value={s('ef', h?.ef != null ? String(h.ef) : '')} onChange={(e) => set('ef', e.target.value)} placeholder="EF %" style={{ ...toolsInput, width: 80 }} />
        {sec(s('nyha', h?.nyha != null ? String(h.nyha) : ''), (x) => set('nyha', x), [['1', 'NYHA I'], ['2', 'NYHA II'], ['3', 'NYHA III'], ['4', 'NYHA IV']], 'NYHA (hekim)')}
        <span style={kucuk}>eko</span><input type="date" value={s('eko', h?.eko_tarihi || '')} onChange={(e) => set('eko', e.target.value)} style={{ ...toolsInput, width: 140 }} />
        {chk('son 12 ayda KY yatışı', bv('yat', !!h?.yatis_12ay), (x) => set('yat', x))}
        <button type="button" style={btn} onClick={() => calistir({ adim: 'hf', ef: s('ef', h?.ef != null ? String(h.ef) : ''), nyha: s('nyha', h?.nyha != null ? String(h.nyha) : ''), ekoTarihi: s('eko', h?.eko_tarihi || '') || null, yatis12Ay: bv('yat', !!h?.yatis_12ay) }, 'KY kartı güncellendi.')}>Değerlendir</button>
      </div>
      {r && (<div style={govde}>
        <div>Kategori: <b>{r.efKategori || 'EF bilinmiyor'}</b></div>
        {r.sutunlar.map((x) => <div key={x.kod} style={{ color: !x.endike ? CHROME_RENK.muted : x.var ? '#22C55E' : '#FBBF24' }}>{!x.endike ? '–' : x.var ? '✓' : '□'} {x.ad}{x.not ? ` (${x.not})` : ''}{!x.endike ? ' · bu kategoride zorunlu sütun değil' : ''}</div>)}
        <Liste x={r.uyarilar} renk="#FBBF24" on="⚠" /><Liste x={r.plan} /><Liste x={r.sevk} renk="#F87171" on="→" />
        <Kaynak d={r.dipnotlar} acik={kaynak} refler={refler} />
        <div style={satir}><input value={s('hfplan')} onChange={(e) => set('hfplan', e.target.value)} placeholder="hekim planı (kilitlenir)" style={{ ...toolsInput, minWidth: 260 }} /><button type="button" style={btn} disabled={!s('hfplan')} onClick={() => calistir({ adim: 'kilit', kart: 'hf', alan: 'plan', deger: s('hfplan') }, 'KY planı kilitlendi.')}>Kilitle</button>
          {r.sevk.length > 0 && <button type="button" style={kirmiziBtn} onClick={() => calistir({ adim: 'sevk', hedef: 'kardiyoloji', not: r.sevk.join(' · ') }, 'Kardiyoloji sevki oluşturuldu.')}>Kardiyoloji sevk</button>}</div>
      </div>)}
    </div>);
  }

  if (sekme === 'Antikoagülan') {
    const a = w3.antikoagulan; const r = a?.sonuc; const hb = a?.has_bled || {};
    return (<div>
      <div style={etiket}>Antikoagülan kartı <span style={kucuk}>· warfarin INR + TTR · DOAK uygunluk (KrKl, yaş, kilo) · HAS-BLED maddeleri kontrol listesi · doz hekimde</span></div>
      <div style={satir}>
        {sec(s('end', a?.endikasyon || ''), (x) => set('end', x), [['af', 'AF'], ['vte', 'VTE'], ['mekanik_kapak', 'Mekanik kapak'], ['diger', 'Diğer']], 'endikasyon')}
        <input value={s('ia', a?.hedef_inr_alt != null ? String(a.hedef_inr_alt) : '')} onChange={(e) => set('ia', e.target.value)} placeholder="hedef INR alt" style={{ ...toolsInput, width: 100 }} />
        <input value={s('iu', a?.hedef_inr_ust != null ? String(a.hedef_inr_ust) : '')} onChange={(e) => set('iu', e.target.value)} placeholder="üst" style={{ ...toolsInput, width: 60 }} />
        <input value={s('kg', a?.kilo_kg != null ? String(a.kilo_kg) : '')} onChange={(e) => set('kg', e.target.value)} placeholder="kilo kg" style={{ ...toolsInput, width: 80 }} />
        {chk('karaciğer hst.', bv('hk', !!hb.karaciger), (x) => set('hk', x))}{chk('inme öyküsü', bv('hi', !!hb.inme), (x) => set('hi', x))}{chk('kanama öyküsü', bv('hkn', !!hb.kanama), (x) => set('hkn', x))}{chk('alkol', bv('ha', !!hb.alkol), (x) => set('ha', x))}
        <button type="button" style={btn} onClick={() => calistir({ adim: 'antikoagulan', endikasyon: s('end', a?.endikasyon || '') || null, hedefInrAlt: s('ia', a?.hedef_inr_alt != null ? String(a.hedef_inr_alt) : ''), hedefInrUst: s('iu', a?.hedef_inr_ust != null ? String(a.hedef_inr_ust) : ''), kiloKg: s('kg', a?.kilo_kg != null ? String(a.kilo_kg) : ''), hasBled: { karaciger: bv('hk', !!hb.karaciger), inme: bv('hi', !!hb.inme), kanama: bv('hkn', !!hb.kanama), alkol: bv('ha', !!hb.alkol) } }, 'Antikoagülan kartı güncellendi.')}>Değerlendir</button>
      </div>
      {!a && <div style={{ ...kucuk, marginTop: 6 }}>Aktif antikoagülan yok. Kartı açmak için endikasyon kaydedin.</div>}
      {r && (<div style={govde}>
        <div>Ajan (hasta_ilaclar): <b>{r.ajan || '—'}</b>{r.krkl != null ? ` · KrKl (Cockcroft-Gault) ${r.krkl} mL/dk` : ''}{r.ttr != null ? ` · TTR %${r.ttr}` : ''}{r.sonInr ? ` · son INR ${String(r.sonInr.deger).replace('.', ',')} (${r.sonInr.tarih})` : ''}{r.sonrakiInr ? ` · sonraki INR ${r.sonrakiInr}` : ''}</div>
        <Liste x={r.kirmizi} renk="#F87171" on="⚑" /><Liste x={r.uygunluk} /><Liste x={r.uyarilar} renk="#FBBF24" on="⚠" /><Liste x={r.plan} />
        <div style={{ ...kucuk, marginTop: 6 }}>HAS-BLED maddeleri (kontrol listesi — skor değil; değiştirilebilir olanlara odaklan):</div>
        {r.hasBledMaddeleri.map((m) => <div key={m.madde} style={{ ...kucuk, color: m.var ? (m.degistirilebilir ? '#FBBF24' : CHROME_RENK.ink) : CHROME_RENK.muted }}>{m.var == null ? '?' : m.var ? '■' : '□'} {m.madde}{m.var && m.degistirilebilir ? ' — değiştirilebilir' : ''}</div>)}
        <Kaynak d={r.dipnotlar} acik={kaynak} refler={refler} />
        <div style={satir}>{r.sonrakiInr && <button type="button" style={ghost} onClick={() => calistir({ adim: 'antikoagulan', endikasyon: a?.endikasyon, hedefInrAlt: a?.hedef_inr_alt, hedefInrUst: a?.hedef_inr_ust, kiloKg: a?.kilo_kg, hasBled: hb, inrGorev: r.sonrakiInr }, 'INR görevi açıldı.')}>INR görevi aç ({r.sonrakiInr})</button>}
          {sec(s('kaj'), (x) => set('kaj', x), [['warfarin', 'warfarin'], ['apiksaban', 'apiksaban'], ['rivaroksaban', 'rivaroksaban'], ['dabigatran', 'dabigatran'], ['edoksaban', 'edoksaban']], 'ajan kilitle (hekim)')}<button type="button" style={btn} disabled={!s('kaj')} onClick={() => calistir({ adim: 'kilit', kart: 'antikoagulan', alan: 'ajan', deger: s('kaj') }, 'Ajan kilitlendi.')}>Kilitle</button></div>
      </div>)}
    </div>);
  }

  if (sekme === 'Solunum') {
    const p = w3.pulm?.satir as Record<string, unknown> | undefined; const r = w3.pulm?.sonuc;
    const v = (k: string) => (p?.[k] != null ? String(p[k]) : '');
    const ak = (p?.astim_kontrol || {}) as Record<string, boolean>;
    const tani = s('tani', v('tani'));
    const teknik = (f.teknik as string[] | undefined) ?? ((p?.teknik as string[]) || []);
    return (<div>
      <div style={etiket}>KOAH / astım <span style={kucuk}>· spirometri belgesi (Belgeler) değerleri · GOLD + ABE · astım kontrolü · inhaler SINIFI + teknik · tanı hekim kilidi</span></div>
      <div style={satir}>
        {sec(tani, (x) => set('tani', x), [['koah', 'KOAH'], ['astim', 'Astım']], 'tanı (hekim)')}
        <input value={s('oran', v('fev1_fvc'))} onChange={(e) => set('oran', e.target.value)} placeholder="FEV1/FVC (0,65 veya 65)" style={{ ...toolsInput, width: 150 }} />
        <input value={s('fev1', v('fev1_yuzde'))} onChange={(e) => set('fev1', e.target.value)} placeholder="FEV1 %beklenen" style={{ ...toolsInput, width: 120 }} />
        <input value={s('bdy', v('bd_artis_yuzde'))} onChange={(e) => set('bdy', e.target.value)} placeholder="BD artış %" style={{ ...toolsInput, width: 90 }} />
        <input value={s('bdm', v('bd_artis_ml'))} onChange={(e) => set('bdm', e.target.value)} placeholder="BD artış mL" style={{ ...toolsInput, width: 100 }} />
        <span style={kucuk}>spirometri</span><input type="date" value={s('spd', v('son_spirometri'))} onChange={(e) => set('spd', e.target.value)} style={{ ...toolsInput, width: 140 }} />
      </div>
      <div style={satir}>
        {tani === 'koah' && (<><input value={s('mmrc', v('mmrc'))} onChange={(e) => set('mmrc', e.target.value)} placeholder="mMRC 0–4" style={{ ...toolsInput, width: 90 }} /><input value={s('cat', v('cat'))} onChange={(e) => set('cat', e.target.value)} placeholder="CAT 0–40" style={{ ...toolsInput, width: 90 }} /><input value={s('oa', v('orta_alevlenme'))} onChange={(e) => set('oa', e.target.value)} placeholder="orta alevlenme/12 ay" style={{ ...toolsInput, width: 150 }} /><input value={s('ya', v('yatisli_alevlenme'))} onChange={(e) => set('ya', e.target.value)} placeholder="yatışlı alevlenme" style={{ ...toolsInput, width: 130 }} /></>)}
        {tani === 'astim' && (<>{chk('gündüz semptom >2/hafta', bv('a1', !!ak.gunduzSemptom), (x) => set('a1', x))}{chk('gece uyanma', bv('a2', !!ak.geceUyanma), (x) => set('a2', x))}{chk('kurtarıcı >2/hafta', bv('a3', !!ak.kurtariciIhtiyac), (x) => set('a3', x))}{chk('aktivite kısıtı', bv('a4', !!ak.aktiviteKisit), (x) => set('a4', x))}<input value={s('oks', v('oks_kur'))} onChange={(e) => set('oks', e.target.value)} placeholder="oral steroid kür/yıl" style={{ ...toolsInput, width: 140 }} /></>)}
        <input value={s('spo2', v('spo2'))} onChange={(e) => set('spo2', e.target.value)} placeholder="SpO₂ %" style={{ ...toolsInput, width: 80 }} />
        <button type="button" style={btn} onClick={() => calistir({ adim: 'pulm', tani: tani || null, fev1Fvc: s('oran', v('fev1_fvc')).replace(',', '.'), fev1Yuzde: s('fev1', v('fev1_yuzde')), bdArtisYuzde: s('bdy', v('bd_artis_yuzde')), bdArtisMl: s('bdm', v('bd_artis_ml')), mmrc: s('mmrc', v('mmrc')), cat: s('cat', v('cat')), ortaAlevlenme: s('oa', v('orta_alevlenme')), yatisliAlevlenme: s('ya', v('yatisli_alevlenme')), spo2: s('spo2', v('spo2')), oksKur: s('oks', v('oks_kur')), sonSpirometri: s('spd', v('son_spirometri')) || null, teknik, astimKontrol: tani === 'astim' ? { gunduzSemptom: bv('a1', !!ak.gunduzSemptom), geceUyanma: bv('a2', !!ak.geceUyanma), kurtariciIhtiyac: bv('a3', !!ak.kurtariciIhtiyac), aktiviteKisit: bv('a4', !!ak.aktiviteKisit) } : null }, 'Solunum kartı güncellendi.')}>Değerlendir</button>
      </div>
      {r && (<div style={govde}>
        <div>Obstrüksiyon: <b>{r.obstruksiyon == null ? '—' : r.obstruksiyon ? 'var (<0,70)' : 'yok'}</b>{r.bdYanit != null ? ` · BD yanıtı ${r.bdYanit ? 'anlamlı' : 'yok'}` : ''}{r.gold ? ` · GOLD ${r.gold}` : ''}{r.grup ? ` · grup ${r.grup}` : ''}{r.astimKontrol ? ` · astım kontrolü: ${r.astimKontrol}` : ''}</div>
        <Liste x={r.inhalerSinifi} /><Liste x={r.uyarilar} renk="#FBBF24" on="⚠" /><Liste x={r.sevk} renk="#F87171" on="→" />
        {r.gorevler.map((g) => <div key={g.kod} style={kucuk}>□ {g.ad} · {g.due}</div>)}
        <div style={{ ...kucuk, marginTop: 6 }}>İnhaler teknik kontrolü (her vizit):</div>
        <div style={satir}>{w3.inhalerTeknik.map((t) => chk(t, teknik.includes(t), (x) => set('teknik', x ? [...teknik, t] : teknik.filter((y) => y !== t))))}</div>
        <Kaynak d={r.dipnotlar} acik={kaynak} refler={refler} />
        <div style={satir}><button type="button" style={btn} disabled={!tani} onClick={() => calistir({ adim: 'kilit', kart: 'pulm', alan: 'tani', deger: tani }, 'Tanı kilitlendi.')}>Tanıyı kilitle</button>{r.gorevler.length > 0 && <button type="button" style={ghost} onClick={() => calistir({ adim: 'duegorev', gorevler: r.gorevler.map((g) => ({ ...g, kaynak: 'tarama' })) }, 'Spirometri görevi açıldı.')}>Görev aç</button>}</div>
      </div>)}
    </div>);
  }

  if (sekme === 'GI') {
    const g = w3.gi?.satir as Record<string, unknown> | undefined; const r = w3.gi?.sonuc;
    const al = (g?.alarm || {}) as Record<string, boolean>, ge = (g?.gerd || {}) as Record<string, boolean>, ib = (g?.ibs || {}) as Record<string, boolean>, hp = (g?.hp || {}) as Record<string, string | null>;
    const ALARM: [string, string][] = [['disfaji', 'disfaji'], ['kiloKaybi', 'kilo kaybı'], ['gisKanama', 'GİS kanama'], ['anemi', 'anemi'], ['kusma', 'persistan kusma'], ['aileGisKanser', 'ailede GİS kanseri'], ['geceSemptom', 'gece semptomu']];
    const IBS: [string, string][] = [['karinAgrisiHaftada1Gun3Ay', 'karın ağrısı ≥1 gün/hafta, son 3 ay'], ['defekasyonIliskili', 'defekasyonla ilişkili'], ['siklikDegisimi', 'dışkılama sıklığı değişimi'], ['formDegisimi', 'dışkı formu değişimi'], ['baslangic6AyOnce', 'başlangıç ≥6 ay önce']];
    return (<div>
      <div style={etiket}>Ofis GI <span style={kucuk}>· GÖRH hızlı kart · İBS Roma IV · MASLD FIB-4 (DM döngü ile ortak) · H. pylori eradikasyon + kontrol testi zamanlaması</span></div>
      <div style={kucuk}>Alarm bulguları</div>
      <div style={satir}>{ALARM.map(([k, a]) => chk(a, bv(`al_${k}`, !!al[k]), (x) => set(`al_${k}`, x)))}</div>
      <div style={satir}>{chk('GÖRH: tipik yanma/regürjitasyon', bv('gerd', !!ge.tipikSemptom), (x) => set('gerd', x))}{chk('8 hafta PPI yanıtsız', bv('ppiy', !!ge.ppiYanitsiz8Hafta), (x) => set('ppiy', x))}</div>
      <div style={kucuk}>İBS (Roma IV)</div>
      <div style={satir}>{IBS.map(([k, a]) => chk(a, bv(`ib_${k}`, !!ib[k]), (x) => set(`ib_${k}`, x)))}</div>
      <div style={satir}>
        {sec(s('hpt', hp.test || ''), (x) => set('hpt', x), [['pozitif', 'H. pylori pozitif'], ['negatif', 'negatif']], 'H. pylori testi')}
        <span style={kucuk}>eradikasyon bitiş</span><input type="date" value={s('hpb', hp.eradikasyonBitis || '')} onChange={(e) => set('hpb', e.target.value)} style={{ ...toolsInput, width: 140 }} />
        <span style={kucuk}>PPI kesim</span><input type="date" value={s('hpp', hp.ppiKesimTarihi || '')} onChange={(e) => set('hpp', e.target.value)} style={{ ...toolsInput, width: 140 }} />
        {sec(s('hpk', hp.kontrolSonuc || ''), (x) => set('hpk', x), [['negatif', 'kontrol negatif'], ['pozitif', 'kontrol pozitif']], 'kontrol sonucu')}
        <button type="button" style={btn} onClick={() => calistir({ adim: 'gi', alarm: Object.fromEntries(ALARM.map(([k]) => [k, bv(`al_${k}`, !!al[k])])), gerd: { tipikSemptom: bv('gerd', !!ge.tipikSemptom), ppiYanitsiz8Hafta: bv('ppiy', !!ge.ppiYanitsiz8Hafta) }, ibs: Object.fromEntries(IBS.map(([k]) => [k, bv(`ib_${k}`, !!ib[k])])), hp: { test: s('hpt', hp.test || '') || null, eradikasyonBitis: s('hpb', hp.eradikasyonBitis || '') || null, ppiKesimTarihi: s('hpp', hp.ppiKesimTarihi || '') || null, kontrolSonuc: s('hpk', hp.kontrolSonuc || '') || null } }, 'GI kartı güncellendi.')}>Değerlendir</button>
      </div>
      {r && (<div style={govde}>
        {r.alarmVar && <div style={{ color: '#F87171' }}>⚑ Alarm bulgusu var</div>}
        <Liste x={r.gerd} />
        {r.ibs.not && <div>İBS: {r.ibs.not}</div>}
        <Liste x={r.hp.plan} />
        {r.masld.skor != null && <div>MASLD FIB-4 {String(r.masld.skor).replace('.', ',')} — {r.masld.aksiyon}</div>}
        <Liste x={r.sevk} renk="#F87171" on="→" />
        <Kaynak d={r.dipnotlar} acik={kaynak} refler={refler} />
        <div style={satir}><input value={s('gitani')} onChange={(e) => set('gitani', e.target.value)} placeholder="tanı kilitle (hekim) ör. GÖRH" style={{ ...toolsInput, minWidth: 220 }} /><button type="button" style={btn} disabled={!s('gitani')} onClick={() => calistir({ adim: 'kilit', kart: 'gi', alan: 'tani', deger: s('gitani') }, 'GI tanısı kilitlendi.')}>Kilitle</button>{r.sevk.length > 0 && <button type="button" style={kirmiziBtn} onClick={() => calistir({ adim: 'sevk', hedef: 'gastroenteroloji', not: r.sevk.join(' · ') }, 'Gastroenteroloji sevki oluşturuldu.')}>Gastro sevk</button>}</div>
      </div>)}
    </div>);
  }

  if (sekme === 'EKG') {
    const girdi = () => ({ ritim: s('ritim', 'sinus'), hiz: s('hiz'), pr: s('pr'), qrs: s('qrs'), qt: s('qt'), aks: s('aks', 'normal'), stElevasyon: bv('ste', false), stDepresyon: bv('std', false), tInversiyon: bv('tinv', false), yeniLbbb: bv('lbbb', false), rbbb: bv('rbbb', false), avBlok: s('avb', 'yok'), deltaDalga: bv('delta', false), lvh: bv('lvh', false), gogusAgrisi: bv('ga', false), not: s('enot') });
    const sablonYukle = (k: string) => { const S: Record<string, Record<string, unknown>> = { normal: { ritim: 'sinus', hiz: '72', pr: '160', qrs: '90', qt: '380', aks: 'normal' }, af: { ritim: 'af', hiz: '95', pr: '', qrs: '90', qt: '360', aks: 'normal' }, lvh: { ritim: 'sinus', hiz: '70', pr: '170', qrs: '100', qt: '400', aks: 'sol', lvh: true }, rbbb: { ritim: 'sinus', hiz: '75', pr: '160', qrs: '130', qt: '400', aks: 'normal', rbbb: true }, bradi: { ritim: 'sinus', hiz: '52', pr: '170', qrs: '90', qt: '420', aks: 'normal' }, avb1: { ritim: 'sinus', hiz: '68', pr: '240', qrs: '90', qt: '400', aks: 'normal', avb: '1' } }; setF((p) => ({ ...p, ste: false, std: false, tinv: false, lbbb: false, rbbb: false, delta: false, lvh: false, avb: 'yok', ...S[k] })); setEkg(null); };
    return (<div>
      <div style={etiket}>EKG 1-tap rapor <span style={kucuk}>· şablon → düzelt → Türkçe rapor · acil bulgu kırmızı bayrak kapısına bağlı · hekim onayı nota yazar</span></div>
      <div style={satir}>{Object.entries(w3.ekg.sablonlar).map(([k, ad]) => <button key={k} type="button" style={ghost} onClick={() => sablonYukle(k)}>{ad}</button>)}</div>
      <div style={satir}>
        {sec(s('ritim', 'sinus'), (x) => set('ritim', x), [['sinus', 'sinüs'], ['af', 'AF'], ['flutter', 'flutter'], ['svt', 'SVT'], ['vt', 'VT'], ['pacemaker', 'pacemaker'], ['diger', 'diğer']])}
        {(['hiz', 'pr', 'qrs', 'qt'] as const).map((k) => <input key={k} value={s(k)} onChange={(e) => set(k, e.target.value)} placeholder={k === 'hiz' ? 'hız /dk' : `${k.toUpperCase()} ms`} style={{ ...toolsInput, width: 80 }} />)}
        {sec(s('aks', 'normal'), (x) => set('aks', x), [['normal', 'aks normal'], ['sol', 'sol aks'], ['sag', 'sağ aks'], ['belirsiz', 'belirsiz']])}
        {sec(s('avb', 'yok'), (x) => set('avb', x), [['yok', 'AV blok yok'], ['1', '1. derece'], ['2_mobitz1', 'Mobitz I'], ['2_mobitz2', 'Mobitz II'], ['3', 'tam blok']])}
      </div>
      <div style={satir}>{chk('ST elevasyonu', bv('ste', false), (x) => set('ste', x))}{chk('ST depresyonu', bv('std', false), (x) => set('std', x))}{chk('T negatifliği', bv('tinv', false), (x) => set('tinv', x))}{chk('yeni LBBB', bv('lbbb', false), (x) => set('lbbb', x))}{chk('RBBB', bv('rbbb', false), (x) => set('rbbb', x))}{chk('SVH', bv('lvh', false), (x) => set('lvh', x))}{chk('delta dalgası', bv('delta', false), (x) => set('delta', x))}{chk('göğüs ağrısı', bv('ga', false), (x) => set('ga', x))}<input value={s('enot')} onChange={(e) => set('enot', e.target.value)} placeholder="not" style={{ ...toolsInput, minWidth: 140 }} /></div>
      <div style={satir}>
        <button type="button" style={ghost} onClick={async () => { const j = await calistir({ adim: 'ekg', girdi: girdi(), onizleme: true }, 'Önizleme hazır.'); if (j?.degerlendirme) setEkg(j.degerlendirme as EkgSonuc); }}>Önizle</button>
        {chk('acil / sevk onayı (hekim)', bv('eacil', false), (x) => set('eacil', x))}
        <button type="button" style={btn} onClick={async () => { const j = await calistir({ adim: 'ekg', girdi: girdi(), acilSevkOnayi: bv('eacil', false) }, 'EKG raporu taslak olarak kaydedildi.'); if (j?.degerlendirme) setEkg(j.degerlendirme as EkgSonuc); }}>Kaydet</button>
      </div>
      {ekg && (<div style={govde}><Liste x={ekg.acil} renk="#F87171" on="⚑" /><Liste x={ekg.dikkat} renk="#FBBF24" on="⚠" /><div style={{ marginTop: 4 }}>{ekg.rapor}</div><Kaynak d={ekg.dipnotlar} acik={kaynak} refler={refler} /></div>)}
      {w3.ekg.raporlar.length > 0 && <div style={{ ...etiket, marginTop: 10 }}>Kayıtlı EKG raporları</div>}
      {(w3.ekg.raporlar as { id: string; rapor: string; acil: string[]; durum: string; created_at: string }[]).map((e) => (<div key={e.id} style={{ ...govde, marginTop: 4 }}>
        <div style={kucuk}>{new Date(e.created_at).toLocaleString('tr-TR')} · <b style={{ color: e.durum === 'onayli' ? '#22C55E' : '#FBBF24' }}>{e.durum}</b>{e.acil?.length ? ' · ⚑ acil' : ''}</div>
        <div>{e.rapor}</div>
        {e.durum !== 'onayli' && <button type="button" style={{ ...btn, marginTop: 4 }} onClick={() => calistir({ adim: 'ekgonay', ekgId: e.id }, 'EKG raporu onaylandı ve bugünkü nota eklendi.')}>Hekim onayı → nota</button>}
      </div>))}
    </div>);
  }

  if (sekme === 'Tiroid nodül') {
    return (<div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
      <div style={satir}>{sec(s('ttani'), (x) => set('ttani', x), [['otiroid', 'ötiroid'], ['subklinik_hipotiroidi', 'subklinik hipotiroidi'], ['asikar_hipotiroidi', 'aşikâr hipotiroidi'], ['hipertiroidi', 'hipertiroidi'], ['nodul', 'nodüler guatr']], 'tiroid tanısı kilitle (hekim)')}<button type="button" style={btn} disabled={!s('ttani')} onClick={() => calistir({ adim: 'kilit', kart: 'tiroid', alan: 'tani', deger: s('ttani') }, 'Tiroid tanısı kilitlendi.')}>Kilitle</button></div>
      <div style={etiket}>Tiroid nodül tarifi <span style={kucuk}>· US belgesi Belgeler'de · TI-RADS tarzı puan · İİAB/ablasyon = endokrin sevki · izlem görevleri · TSH {w3.tsh ?? '—'}</span></div>
      <div style={satir}>
        <input value={s('nlok')} onChange={(e) => set('nlok', e.target.value)} placeholder="lokasyon (sağ lob alt)" style={{ ...toolsInput, width: 150 }} />
        <input value={s('nmm')} onChange={(e) => set('nmm', e.target.value)} placeholder="en büyük boyut mm" style={{ ...toolsInput, width: 130 }} />
        <span style={kucuk}>US</span><input type="date" value={s('nus')} onChange={(e) => set('nus', e.target.value)} style={{ ...toolsInput, width: 140 }} />
      </div>
      <div style={satir}>
        {sec(s('nb', 'solid'), (x) => set('nb', x), [['kistik', 'kistik'], ['sungerimsi', 'süngerimsi'], ['mikst', 'mikst'], ['solid', 'solid']])}
        {sec(s('ne', 'hiper_izo'), (x) => set('ne', x), [['anekoik', 'anekoik'], ['hiper_izo', 'hiper/izoekoik'], ['hipo', 'hipoekoik'], ['cok_hipo', 'çok hipoekoik']])}
        {sec(s('ns', 'genis'), (x) => set('ns', x), [['genis', 'genişlik > yükseklik'], ['uzun', 'yükseklik > genişlik']])}
        {sec(s('nk', 'duzgun'), (x) => set('nk', x), [['duzgun', 'düzgün'], ['belirsiz', 'belirsiz'], ['lobule_duzensiz', 'lobüle/düzensiz'], ['ekstratiroidal', 'ekstratiroidal']])}
        {sec(s('no', 'yok'), (x) => set('no', x), [['yok', 'odak yok'], ['makro', 'makrokalsifikasyon'], ['periferik', 'periferik'], ['punktat', 'punktat']])}
        <button type="button" style={btn} onClick={() => calistir({ adim: 'nodul', lokasyon: s('nlok'), girdi: { bilesim: s('nb', 'solid'), ekojenite: s('ne', 'hiper_izo'), sekil: s('ns', 'genis'), kenar: s('nk', 'duzgun'), odak: s('no', 'yok'), boyutMm: s('nmm'), usTarihi: s('nus') || undefined } }, 'Nodül kaydedildi; izlem görevi / sevk oluşturuldu.')}>Kaydet</button>
      </div>
      {w3.noduller.map((n) => (<div key={n.id} style={{ ...govde, marginTop: 6 }}>
        <div><b>TR{n.sonuc.tr}</b> {n.lokasyon ? `(${n.lokasyon}) ` : ''}{n.sonuc.tarif}</div>
        <Liste x={n.sonuc.notlar} renk="#FBBF24" on="ⓘ" /><Liste x={n.sonuc.sevk} renk="#F87171" on="→" />
        <Kaynak d={[n.sonuc.dipnot]} acik={kaynak} refler={refler} />
        <div style={satir}><button type="button" style={btn} onClick={() => calistir({ adim: 'kilit', kart: 'nodul', alan: 'tarif', deger: n.sonuc.tarif }, 'Nodül tarifi hekim kilidiyle kaydedildi.')}>Tarifi kilitle</button><button type="button" style={ghost} onClick={() => navigator.clipboard?.writeText(n.sonuc.tarif)}>📋</button><button type="button" style={ghost} onClick={() => calistir({ adim: 'nodulkapat', nodulId: n.id }, 'Nodül kapatıldı.')}>Kapat</button></div>
      </div>))}
    </div>);
  }

  if (sekme === 'Ramazan') {
    const r = w3.ramazan; const g = r?.girdi || {};
    const K: [string, string][] = [['son3AyAgirHipo', 'son 3 ay ağır hipoglisemi'], ['son3AyDkaHhs', 'son 3 ay DKA/HHS'], ['tekrarlayanHipo', 'tekrarlayan hipoglisemi'], ['hipoFarkindalikAzalmis', 'hipo farkındalığı azalmış'], ['ileriMakrovaskuler', 'ileri makrovasküler hst.'], ['akutHastalik', 'akut hastalık'], ['yalnizYasiyor', 'yalnız yaşıyor'], ['kirilgan', 'kırılgan'], ['agirFizikselIs', 'ağır fiziksel iş']];
    const yil = Number(new Date().toISOString().slice(0, 4));
    const girdiGonder = (aktif: boolean) => calistir({ adim: 'ramazan', yil, aktif, girdi: Object.fromEntries(K.map(([k]) => [k, bv(`r_${k}`, !!g[k])])) }, aktif ? 'Ramazan değerlendirmesi güncellendi.' : 'Ramazan kartı kapatıldı.');
    return (<div>
      <div style={etiket}>Ramazan DM/HT rehberi <span style={kucuk}>· TEMD Ramazan · mevsimsel (hekim açar) · risk kademesi + ilaç ZAMANLAMA (doz/insülin titrasyonu yok) + hasta yaprağı</span></div>
      <div style={satir}>{K.map(([k, a]) => chk(a, bv(`r_${k}`, !!g[k]), (x) => set(`r_${k}`, x)))}</div>
      <div style={satir}><button type="button" style={btn} onClick={() => girdiGonder(true)}>{r?.aktif ? 'Güncelle' : `Ramazan ${yil} kartını aç`}</button>{r?.aktif && <button type="button" style={ghost} onClick={() => girdiGonder(false)}>Kartı kapat (sezon dışı)</button>}</div>
      {r?.sonuc && (<div style={govde}>
        <div>Risk: <b style={{ color: r.sonuc.risk === 'cok_yuksek' || r.sonuc.risk === 'yuksek' ? '#F87171' : r.sonuc.risk === 'orta' ? '#FBBF24' : '#22C55E' }}>{r.sonuc.risk.replace('_', ' ')}</b> — {r.sonuc.nedenler.join(', ')}</div>
        <div>{r.sonuc.oruc}</div>
        <div style={{ ...kucuk, marginTop: 4 }}>İlaç zamanlaması (taslak — hekim düzenler):</div><Liste x={r.sonuc.ilacRehberi} />
        <Kaynak d={r.sonuc.dipnotlar} acik={kaynak} refler={refler} />
        <div style={satir}>
          {sec(s('rk'), (x) => set('rk', x), [['dusuk', 'düşük'], ['orta', 'orta'], ['yuksek', 'yüksek'], ['cok_yuksek', 'çok yüksek']], 'risk kilitle (hekim)')}<button type="button" style={btn} disabled={!s('rk')} onClick={() => calistir({ adim: 'kilit', kart: 'ramazan', alan: 'risk', deger: s('rk') }, 'Ramazan riski kilitlendi.')}>Kilitle</button>
          <button type="button" style={ghost} onClick={() => yazdir('Ramazan bilgilendirme', `<pre>${esc(r.sonuc!.hastaYapragi)}</pre>`)}>🖨 Hasta yaprağı</button>
        </div>
      </div>)}
    </div>);
  }

  if (sekme === 'Check-up paket') {
    const c = w3.checkup;
    return (<div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
      <div style={etiket}>Check-up paket defteri <span style={kucuk}>· KENDİ ÖDEMELİ — SGK'ya fatura edilmez · kalemler onaylı lab/belge ile otomatik işaretlenir · birleşik rapor</span></div>
      <div style={satir}>
        {sec(s('sku'), (x) => set('sku', x), c.uygun.map((p) => [p.sku, `${p.ad} (${p.kalemSayi} kalem)`]), 'yaşa/cinsiyete uygun paket')}
        <input value={s('ucret')} onChange={(e) => set('ucret', e.target.value)} placeholder="ücret ₺ (isteğe bağlı)" style={{ ...toolsInput, width: 150 }} />
        <button type="button" style={btn} disabled={!s('sku')} onClick={() => calistir({ adim: 'checkuppaket', sku: s('sku'), ucret: s('ucret') || undefined }, 'Paket başlatıldı (kendi ödemeli).')}>Paketi başlat</button>
      </div>
      <Kaynak d={c.dipnotlar} acik={kaynak} refler={refler} />
      {c.paketler.map((p) => (<div key={p.id} style={{ ...govde, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 8 }}>
        <div><b>{p.ad}</b> · {p.tarih} · {p.tamamlanan}/{p.zorunluToplam} zorunlu kalem{p.ucret != null ? ` · ₺${p.ucret}` : ''} · kendi ödemeli{p.raporKilitli ? ' · rapor onaylı' : ''}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>{p.kalemler.map((k) => <label key={k.kod} title={k.not || ''} style={{ ...kucuk, border: `1px solid ${k.tamam ? '#22C55E' : k.opsiyonel ? 'rgba(255,255,255,0.1)' : '#FBBF24'}`, borderRadius: 999, padding: '2px 8px', color: k.tamam ? '#22C55E' : CHROME_RENK.muted, display: 'flex', gap: 4, alignItems: 'center' }}><input type="checkbox" checked={k.tamam} disabled={k.kaynak === 'lab' || k.kaynak === 'belge' || k.kaynak === 'tarama'} onChange={(e) => calistir({ adim: 'checkupmanuel', paketId: p.id, kod: k.kod, tamam: e.target.checked }, 'Kalem güncellendi.')} />{k.ad}{k.opsiyonel ? ' (ops.)' : ''}{k.kaynak ? ` · ${k.kaynak}` : ''}</label>)}</div>
        <div style={satir}>
          <button type="button" style={btn} onClick={async () => { const j = await calistir({ adim: 'checkuprapor', paketId: p.id }, 'Birleşik rapor hazır.'); const rp = j?.rapor as { bolumler: RaporBolum[]; taslak: boolean } | undefined; if (rp) setRapor({ paketId: p.id, ...rp }); }}>Birleşik rapor</button>
          {!p.raporKilitli && <button type="button" style={ghost} onClick={() => calistir({ adim: 'checkupkilit', paketId: p.id }, 'Birleşik rapor hekim onayıyla kilitlendi.')}>Hekim onayı (kilitle)</button>}
        </div>
        {rapor?.paketId === p.id && (<div style={{ marginTop: 6 }}>
          {rapor.bolumler.map((b) => <div key={b.baslik} style={{ marginTop: 4 }}><div style={{ fontWeight: 700 }}>{b.baslik}</div>{b.satirlar.map((x, i) => <div key={i} style={kucuk}>{x}</div>)}</div>)}
          <button type="button" style={{ ...ghost, marginTop: 6 }} onClick={() => yazdir('Check-up birleşik raporu', rapor.bolumler.map((b, i) => (i === 0 ? `<h1>${esc(b.baslik)}</h1>` : `<h2>${esc(b.baslik)}</h2>`) + b.satirlar.map((x) => `<div>${esc(x)}</div>`).join('')).join(''))}>🖨 Yazdır / PDF</button>
        </div>)}
      </div>))}
    </div>);
  }
  return null;
}
