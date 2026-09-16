'use client';
/** NOTYA-DAH-01 — Dahiliye home: header chips (KB / HbA1c+Δ / LDL / eGFR / TSH / ilaç) + tabs Özet | HT | DM | Lipid | Tiroid | Check-up | İlaçlar | Sevk. Kaynak toggle. */
import React, { useCallback, useEffect, useState } from 'react';
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi';

type L = { kanonik_deger: number | null; numune_tarihi: string | null } | null;
type Dip = { ref: string; not: string };
type Veri = { hasta: { yas: number | null; kadin: boolean; gebe: boolean }; chips: { kb: { sbp: number; dbp: number; tarih: string; bugun: boolean } | null; hba1c: { deger: number | null; tarih: string | null; delta: number | null } | null; ldl: L; egfr: L; tsh: L; k: L; hb: L; ilacSayi: number; polifarmasi: boolean; kirmizi: boolean }; ht: { id: string; tarih: string; sbp: number; dbp: number; evre_taslak: string; evre_hekim: string | null; kirilgan: boolean; degerlendirme: { sinif: string; hedef: { hedefSbp: number[]; hedefDbp: number[] | null; kova: string }; hedefteMi: boolean; dogrulanmisHt: boolean; plan: string[]; direncli: boolean; baslangicTetkik: string[]; sevk: string[]; dipnotlar: Dip[] } }[]; dm: { tip: string; hedef_hba1c: number | null; ilac_siniflari: string[]; degerlendirme: { kontrolde: boolean | null; delta: number | null; sonrakiHba1cAy: number; gorevler: { ad: string }[]; uyarilar: string[]; plan: string[]; dipnotlar: Dip[] } | null } | null; lipid: { hedef_ldl: number | null; statin: string | null; degerlendirme: { ldlHedefte: boolean | null; uyarilar: string[]; plan: string[]; dipnotlar: Dip[] } | null } | null; tiroid: { levo_mcg: number | null; nodul: boolean; degerlendirme: { yorum: string; gorevler: { ad: string }[]; sevk: string[]; dipnotlar: Dip[] } | null } | null; checkup: { tarih: string; susturuldu: boolean }[]; gorevler: { id: string; ad: string; due: string | null; kaynak: string }[]; sevkler: { id: string; hedef: string; not_metni: string | null; created_at: string }[]; ilaclar: { id: string; ilac_adi: string; doz: string | null; kullanim_sikli: string | null; aktif: boolean }[]; ilacUyari: string[]; jineDue: { ad: string; due: string | null }[]; checkupAralik: { not: string }; kutuphane: { checkup: string[]; sevk: readonly string[]; refler: Record<string, string> } };

const btn: React.CSSProperties = { background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: '#8FA0B5', border: '1px solid rgba(255,255,255,0.15)' };
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 6 };
const kucuk: React.CSSProperties = { fontSize: 11, color: '#8FA0B5' };
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 };
const chip = (ad: string, v: string, kirmizi = false) => <span key={ad} style={{ border: `1px solid ${kirmizi ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 999, padding: '3px 10px', fontSize: 11, color: kirmizi ? '#F87171' : '#EDF1F7' }}><span style={{ color: '#8FA0B5' }}>{ad} </span>{v}</span>;
const chk = (label: string, v: boolean, on: (x: boolean) => void) => <label key={label} style={{ ...kucuk, display: 'flex', gap: 4, alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '2px 8px', color: v ? '#2DD4BF' : '#8FA0B5' }}><input type="checkbox" checked={v} onChange={(e) => on(e.target.checked)} />{label}</label>;
const Kaynak = ({ d, acik, refler }: { d?: Dip[] | null; acik: boolean; refler: Record<string, string> }) => (!acik || !d?.length ? null : <div style={{ ...kucuk, marginTop: 4, borderLeft: '2px solid rgba(15,155,142,0.5)', paddingLeft: 8 }}>{d.map((x, i) => <div key={i}><b>{x.ref}</b> — {x.not} <span style={{ opacity: 0.7 }}>({refler[x.ref] || x.ref})</span></div>)}</div>);
const SEKME = ['Özet', 'HT', 'DM', 'Lipid', 'Tiroid', 'Check-up', 'İlaçlar', 'Sevk'] as const;

export default function DahiliyeHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null);
  const [sekme, setSekme] = useState<(typeof SEKME)[number]>('Özet');
  const [kaynak, setKaynak] = useState(false);
  const [mesaj, setMesaj] = useState('');
  const [f, setF] = useState<Record<string, unknown>>({});
  const s = (k: string) => (f[k] as string) ?? ''; const b = (k: string) => !!f[k]; const set = (k: string, x: unknown) => setF((p) => ({ ...p, [k]: x }));
  const api = useCallback(async (body: Record<string, unknown>) => { const token = await getAccessTokenAsync(); const r = await fetch('/api/doktor/dahiliye', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Hata'); return j; }, [patientId]);
  const yukle = useCallback(async () => { const token = await getAccessTokenAsync(); const r = await fetch(`/api/doktor/dahiliye?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }); if (r.ok) setV(await r.json()); }, [patientId]);
  useEffect(() => { yukle(); }, [yukle]);
  const calistir = async (body: Record<string, unknown>, ok?: string) => { setMesaj(''); try { await api(body); setMesaj(ok || 'Kaydedildi.'); await yukle(); } catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); } };
  if (!v) return <div style={{ ...toolsCard, color: '#8FA0B5', fontSize: 12 }}>Dahiliye yükleniyor…</div>;
  const c = v.chips; const fmt = (l: L, u = '') => (l?.kanonik_deger != null ? `${l.kanonik_deger}${u}` : '—');
  const sonHt = v.ht[0] || null;

  return (
    <div style={{ ...toolsCard }} data-chapter="dahiliye">
      {v.hasta.gebe && <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.4)', color: '#FBBF24', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Gebe — ilaçları gözden geçir (ACEi/ARB, statin, metformin dışı OAD). Obstetri araçları burada çalışmaz.</div>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {chip('KB', c.kb ? `${c.kb.sbp}/${c.kb.dbp}` : 'yok', !c.kb?.bugun)}{chip('HbA1c', c.hba1c ? `${c.hba1c.deger}%${c.hba1c.delta != null ? ` (${c.hba1c.delta > 0 ? '+' : ''}${c.hba1c.delta})` : ''}` : '—')}{chip('LDL', fmt(c.ldl))}{chip('eGFR', fmt(c.egfr))}{chip('TSH', fmt(c.tsh))}{chip('İlaç', String(c.ilacSayi), c.polifarmasi)}{c.kirmizi && chip('!', 'geciken görev / bugün KB yok', true)}
        <button type="button" onClick={() => setKaynak(!kaynak)} style={{ ...ghost, padding: '2px 8px', fontSize: 10, color: kaynak ? '#2DD4BF' : '#64748B', marginLeft: 'auto' }}>{kaynak ? 'Kaynak: açık' : 'Kaynak'}</button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>{SEKME.map((x) => <button key={x} type="button" onClick={() => setSekme(x)} style={{ ...ghost, background: sekme === x ? 'rgba(15,155,142,0.2)' : 'transparent', color: sekme === x ? '#2DD4BF' : '#8FA0B5', borderRadius: 999 }}>{x}</button>)}</div>
      {mesaj && <div style={{ fontSize: 12, color: /amadı|zorunlu|Kırmızı|geçersiz|Hata/.test(mesaj) ? '#F87171' : '#2DD4BF', marginBottom: 8 }}>{mesaj}</div>}

      {sekme === 'Özet' && (<div>
        <div style={etiket}>Bugünkü KB gir <span style={kucuk}>· her vizit zorunlu · Uzlaşı 2025 evre taslak, hekim kilitler</span></div>
        <div style={satir}><input value={s('sbp')} onChange={(e) => set('sbp', e.target.value)} placeholder="SBP" style={{ ...toolsInput, width: 70 }} /><input value={s('dbp')} onChange={(e) => set('dbp', e.target.value)} placeholder="DBP" style={{ ...toolsInput, width: 70 }} /><input value={s('nabiz')} onChange={(e) => set('nabiz', e.target.value)} placeholder="nabız" style={{ ...toolsInput, width: 70 }} />{chk('kırılgan (hekim)', b('kirilgan'), (x) => set('kirilgan', x))}<button type="button" onClick={() => calistir({ adim: 'kb', sbp: s('sbp'), dbp: s('dbp'), nabiz: s('nabiz'), kirilgan: b('kirilgan') }, 'KB kaydedildi.')} style={btn}>Kaydet</button></div>
        {v.gorevler.length > 0 && <div style={{ ...etiket, marginTop: 10 }}>Açık görevler ({v.gorevler.length})</div>}
        {v.gorevler.map((g) => <div key={g.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: g.due && g.due < new Date().toISOString().slice(0, 10) ? '#F87171' : '#EDF1F7', padding: '2px 0' }}><span style={{ flex: 1 }}>{g.ad} <span style={kucuk}>{g.due || ''} · {g.kaynak}</span></span><button type="button" onClick={() => calistir({ adim: 'gorev', gorevId: g.id, durum: 'tamam' })} style={{ ...ghost, padding: '1px 8px', fontSize: 10 }}>✓</button></div>)}
        {v.jineDue.length > 0 && <div style={{ ...kucuk, marginTop: 6 }}>Kadın sağlığı (jine takvimi): {v.jineDue.map((j) => `${j.ad}${j.due ? ` · ${j.due}` : ''}`).join(' | ')}</div>}
        <div style={{ ...kucuk, marginTop: 6 }}>Check-up aralığı: {v.checkupAralik.not}. Lab/EKG/CXR → Belgeler › Asistana raporla → Onayla → son muayene.</div>
      </div>)}

      {sekme === 'HT' && (<div>
        <div style={etiket}>Hipertansiyon kartı <span style={kucuk}>· Türk Hipertansiyon Uzlaşı 2025</span></div>
        {!sonHt && <div style={kucuk}>Önce Özet'ten KB girin.</div>}
        {sonHt?.degerlendirme && (<div style={{ fontSize: 12, color: '#EDF1F7' }}>
          <div><b>{sonHt.sbp}/{sonHt.dbp}</b> ({sonHt.tarih}) · taslak evre: <b>{sonHt.degerlendirme.sinif}</b>{sonHt.evre_hekim ? ` · hekim: ${sonHt.evre_hekim}` : ''} · hedef {sonHt.degerlendirme.hedef.hedefSbp.join('–')}{sonHt.degerlendirme.hedef.hedefDbp ? `/${sonHt.degerlendirme.hedef.hedefDbp.join('–')}` : ''} ({sonHt.degerlendirme.hedef.kova}) · {sonHt.degerlendirme.hedefteMi ? 'hedefte' : 'hedef dışı'}{sonHt.degerlendirme.dogrulanmisHt ? ' · HT doğrulanmış' : ''}{sonHt.degerlendirme.direncli ? ' · DİRENÇLİ' : ''}</div>
          {sonHt.degerlendirme.plan.map((p) => <div key={p}>• {p}</div>)}
          {sonHt.degerlendirme.dogrulanmisHt && <div style={kucuk}>Başlangıç tetkik: {sonHt.degerlendirme.baslangicTetkik.join(' · ')}</div>}
          <Kaynak d={sonHt.degerlendirme.dipnotlar} acik={kaynak} refler={v.kutuphane.refler} />
          <div style={satir}><select value={s('evre')} onChange={(e) => set('evre', e.target.value)} style={{ ...toolsInput, width: 'auto' }}><option value="">evre kilitle (hekim)</option>{['normal', 'artmis', 'ht_evre1', 'ht_evre2'].map((x) => <option key={x} value={x} style={{ color: '#000' }}>{x}</option>)}</select>{chk('sekonder HT araştır', b('sek'), (x) => set('sek', x))}<button type="button" onClick={() => calistir({ adim: 'kb', sbp: sonHt.sbp, dbp: sonHt.dbp, kirilgan: sonHt.kirilgan, evreHekim: s('evre') || null, sekonderSuphe: b('sek') }, 'Evre kilitlendi.')} style={ghost}>Kaydet</button></div>
          <div style={kucuk}>KB geçmişi: {v.ht.map((h) => `${h.tarih} ${h.sbp}/${h.dbp}`).join(' · ')}</div>
        </div>)}
      </div>)}

      {sekme === 'DM' && (<div>
        <div style={etiket}>Diyabet kartı <span style={kucuk}>· TEMD 2026 · HbA1c lab motorundan · doz hekimin</span></div>
        <div style={satir}><select value={s('tip') || v.dm?.tip || 'T2'} onChange={(e) => set('tip', e.target.value)} style={{ ...toolsInput, width: 'auto' }}>{['T2', 'T1', 'diger'].map((x) => <option key={x} value={x} style={{ color: '#000' }}>{x}</option>)}</select><input value={s('hedef') || String(v.dm?.hedef_hba1c ?? '')} onChange={(e) => set('hedef', e.target.value)} placeholder="HbA1c hedef (hekim; not: 7.0)" style={{ ...toolsInput, width: 200 }} /><input type="date" value={s('goz')} onChange={(e) => set('goz', e.target.value)} title="son göz dibi" style={{ ...toolsInput, width: 140 }} /><input type="date" value={s('ayak')} onChange={(e) => set('ayak', e.target.value)} title="son ayak" style={{ ...toolsInput, width: 140 }} /></div>
        <div style={satir}>{['metformin', 'sglt2', 'glp1', 'dpp4', 'sulfonilure', 'insulin'].map((k) => chk(k, ((f.sinif as string[]) || v.dm?.ilac_siniflari || []).includes(k), (x) => set('sinif', x ? [...((f.sinif as string[]) || v.dm?.ilac_siniflari || []), k] : ((f.sinif as string[]) || v.dm?.ilac_siniflari || []).filter((y) => y !== k))))}<input value={s('hipo')} onChange={(e) => set('hipo', e.target.value)} placeholder="hipo / DKA notu" style={{ ...toolsInput, minWidth: 180 }} /><button type="button" onClick={() => calistir({ adim: 'dm', tip: s('tip') || v.dm?.tip || 'T2', hedefHba1c: s('hedef') || v.dm?.hedef_hba1c, ilacSiniflari: (f.sinif as string[]) || v.dm?.ilac_siniflari || [], sonGozDibi: s('goz') || null, sonAyak: s('ayak') || null, hipoDka: s('hipo') || null }, 'DM kartı güncellendi; yıllık görevler açıldı.')} style={btn}>Değerlendir</button></div>
        {v.dm?.degerlendirme && (<div style={{ fontSize: 12, color: '#EDF1F7', marginTop: 6 }}><div>HbA1c {c.hba1c?.deger ?? '—'}%{c.hba1c?.delta != null ? ` (Δ ${c.hba1c.delta > 0 ? '+' : ''}${c.hba1c.delta})` : ''} · {v.dm.degerlendirme.kontrolde == null ? 'değer yok' : v.dm.degerlendirme.kontrolde ? 'hedefte' : 'hedef dışı'} · sonraki HbA1c {v.dm.degerlendirme.sonrakiHba1cAy} ay</div>{v.dm.degerlendirme.uyarilar.map((u) => <div key={u} style={{ color: '#FBBF24' }}>⚠ {u}</div>)}{v.dm.degerlendirme.plan.map((p) => <div key={p}>• {p}</div>)}<Kaynak d={v.dm.degerlendirme.dipnotlar} acik={kaynak} refler={v.kutuphane.refler} /></div>)}
      </div>)}

      {sekme === 'Lipid' && (<div>
        <div style={etiket}>Dislipidemi <span style={kucuk}>· TEMD 2021 · LDL hedefi hekim alanı · statin/ALT trend</span></div>
        <div style={satir}><input value={s('ldlh') || String(v.lipid?.hedef_ldl ?? '')} onChange={(e) => set('ldlh', e.target.value)} placeholder="LDL hedef mg/dL (hekim)" style={{ ...toolsInput, width: 180 }} /><input value={s('statin') || v.lipid?.statin || ''} onChange={(e) => set('statin', e.target.value)} placeholder="statin (hekim)" style={{ ...toolsInput, width: 150 }} /><input type="date" value={s('sb')} onChange={(e) => set('sb', e.target.value)} title="statin başlangıç" style={{ ...toolsInput, width: 140 }} />{chk('ezetimib', b('eze'), (x) => set('eze', x))}{chk('obezite', b('ob'), (x) => set('ob', x))}<button type="button" onClick={() => calistir({ adim: 'lipid', hedefLdl: s('ldlh') || v.lipid?.hedef_ldl, statin: s('statin') || v.lipid?.statin, statinBaslangic: s('sb') || null, ezetimib: b('eze'), obezite: b('ob') }, 'Lipid kartı güncellendi.')} style={btn}>Değerlendir</button></div>
        <div style={{ ...kucuk, marginTop: 4 }}>Son: LDL {fmt(c.ldl)} · TC/HDL/TG lab motorundan</div>
        {v.lipid?.degerlendirme && (<div style={{ fontSize: 12, color: '#EDF1F7', marginTop: 6 }}>{v.lipid.degerlendirme.uyarilar.map((u) => <div key={u} style={{ color: '#FBBF24' }}>⚠ {u}</div>)}{v.lipid.degerlendirme.plan.map((p) => <div key={p}>• {p}</div>)}<Kaynak d={v.lipid.degerlendirme.dipnotlar} acik={kaynak} refler={v.kutuphane.refler} /></div>)}
      </div>)}

      {sekme === 'Tiroid' && (<div>
        <div style={etiket}>Tiroid mini kart <span style={kucuk}>· TEMD 2025 · TSH/fT4 lab motorundan</span></div>
        <div style={satir}><input value={s('levo') || String(v.tiroid?.levo_mcg ?? '')} onChange={(e) => set('levo', e.target.value)} placeholder="levotiroksin mcg (hekim)" style={{ ...toolsInput, width: 180 }} /><input value={s('kilo')} onChange={(e) => set('kilo', e.target.value)} placeholder="kilo kg" style={{ ...toolsInput, width: 90 }} /><input type="date" value={s('dozd')} onChange={(e) => set('dozd', e.target.value)} title="son doz değişimi" style={{ ...toolsInput, width: 140 }} />{chk('nodül', b('nod') || !!v.tiroid?.nodul, (x) => set('nod', x))}<button type="button" onClick={() => calistir({ adim: 'tiroid', levoMcg: s('levo') || v.tiroid?.levo_mcg, kiloKg: s('kilo'), sonDozDegisim: s('dozd') || null, nodul: b('nod') || !!v.tiroid?.nodul }, 'Tiroid kartı güncellendi.')} style={btn}>Değerlendir</button></div>
        <div style={{ ...kucuk, marginTop: 4 }}>TSH {fmt(c.tsh)}</div>
        {v.tiroid?.degerlendirme && (<div style={{ fontSize: 12, color: '#EDF1F7', marginTop: 6 }}><div>{v.tiroid.degerlendirme.yorum}</div>{v.tiroid.degerlendirme.sevk.map((x) => <div key={x} style={{ color: '#FBBF24' }}>→ {x}</div>)}<Kaynak d={v.tiroid.degerlendirme.dipnotlar} acik={kaynak} refler={v.kutuphane.refler} /></div>)}
      </div>)}

      {sekme === 'Check-up' && (<div>
        <div style={etiket}>Dahiliye check-up V1 <span style={kucuk}>· önce yükle (Belgeler › Lab / EKG / CXR), sonra Asistana raporla · aralık {v.checkupAralik.not}</span></div>
        <ul style={{ fontSize: 12, color: '#EDF1F7', margin: 0, paddingLeft: 18 }}>{v.kutuphane.checkup.map((x) => <li key={x}>{x}</li>)}</ul>
        <div style={satir}>{chk('erken osteoporoz riski (erken menopoz / steroid / kırık)', b('er'), (x) => set('er', x))}<button type="button" onClick={() => calistir({ adim: 'checkup', erkenRisk: b('er') }, 'Check-up paketi kaydedildi; tekrar/DXA görevleri açıldı.')} style={btn}>Paketi kaydet</button><button type="button" onClick={() => calistir({ adim: 'checkup', sustur: true }, 'Check-up hatırlatması susturuldu.')} style={ghost}>Hatırlatmayı sustur</button></div>
        {v.checkup.map((cu, i) => <div key={i} style={kucuk}>{cu.tarih}{cu.susturuldu ? ' · susturuldu' : ''}</div>)}
      </div>)}

      {sekme === 'İlaçlar' && (<div>
        <div style={etiket}>İlaç listesi (hasta_ilaclar) <span style={kucuk}>· eGFR {fmt(c.egfr)} · {c.polifarmasi ? 'POLİFARMASİ (≥5)' : `${c.ilacSayi} aktif`}</span></div>
        {v.ilacUyari.map((u) => <div key={u} style={{ fontSize: 12, color: '#FBBF24' }}>⚠ {u}</div>)}
        {v.ilaclar.map((i) => <div key={i.id} style={{ fontSize: 12, color: i.aktif ? '#EDF1F7' : '#64748B' }}>{i.aktif ? '● ' : '○ '}{i.ilac_adi} {i.doz || ''} {i.kullanim_sikli || ''}</div>)}
        <div style={kucuk}>Yeni reçete muayenede yazılır ve bu listeyi günceller (İlaçlar sekmesi).</div>
      </div>)}

      {sekme === 'Sevk' && (<div>
        <div style={etiket}>Kırmızı bayrak + sevk <span style={kucuk}>· K {fmt(c.k)} · Hb {fmt(c.hb)} · eGFR {fmt(c.egfr)}</span></div>
        <div style={satir}>{chk('göğüs ağrısı', b('ga'), (x) => set('ga', x))}{chk('yeni EKG belgesi', b('ye'), (x) => set('ye', x))}{chk('ateş', b('at'), (x) => set('at', x))}{chk('acil / sevk onayı (hekim)', b('ao'), (x) => set('ao', x))}<input value={s('knot')} onChange={(e) => set('knot', e.target.value)} placeholder="not" style={{ ...toolsInput, minWidth: 160 }} /><button type="button" onClick={() => calistir({ adim: 'kirmizi', gogusAgrisi: b('ga'), yeniEkg: b('ye'), ates: b('at'), acilSevkOnayi: b('ao'), not: s('knot') }, 'Kırmızı bayrak kontrolü tamam.')} style={ghost}>Kırmızı bayrak kontrolü</button></div>
        <div style={satir}><select value={s('sh')} onChange={(e) => set('sh', e.target.value)} style={{ ...toolsInput, width: 'auto' }}><option value="">sevk hedefi</option>{v.kutuphane.sevk.map((x) => <option key={x} value={x} style={{ color: '#000' }}>{x}</option>)}</select><input value={s('snot')} onChange={(e) => set('snot', e.target.value)} placeholder="kısa not (son onaylı lab paneli eklenir)" style={{ ...toolsInput, minWidth: 260 }} /><button type="button" disabled={!s('sh')} onClick={() => calistir({ adim: 'sevk', hedef: s('sh'), not: s('snot') }, 'Sevk kaydedildi.')} style={btn}>Sevk et</button></div>
        {v.sevkler.map((x) => <div key={x.id} style={{ fontSize: 12, color: '#EDF1F7' }}>→ {x.hedef}{x.not_metni ? ` — ${x.not_metni}` : ''} <span style={kucuk}>{new Date(x.created_at).toLocaleDateString('tr-TR')}</span></div>)}
      </div>)}
    </div>
  );
}
