'use client';
/** NOTYA-DAH-WOW-NEXT UI — Polifarmasi · Hedef kartı · Sigara · Vit D/B12 · e-Nabız · Gut · Osteoporoz sekmeleri (DahiliyeHome › "Bakım+" satırı). */
import React, { useState } from 'react';
import { getAccessTokenAsync, toolsInput } from '@/lib/doktor/toolsUi';
import type { Wow5Veri } from '@/app/api/doktor/dahiliye/_wow5';
import { Kaynak } from './DahiliyeWow2';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type Props = { sekme: string; w5: Wow5Veri; patientId: string; kaynak: boolean; refler: Record<string, string>; calistir: (body: Record<string, unknown>, ok?: string) => Promise<Record<string, unknown> | null> };

const kucuk: React.CSSProperties = { fontSize: 11, color: CHROME_RENK.muted };
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 6 };
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 };
const govde: React.CSSProperties = { fontSize: 12, color: CHROME_RENK.ink, marginTop: 8 };
const btn: React.CSSProperties = { background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: CHROME_RENK.muted, border: '1px solid rgba(255,255,255,0.15)' };
const kirmiziBtn: React.CSSProperties = { ...btn, background: '#B91C1C' };
const chk = (label: string, v: boolean, on: (x: boolean) => void) => <label key={label} style={{ ...kucuk, display: 'flex', gap: 4, alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '3px 8px', cursor: 'pointer', color: v ? '#2DD4BF' : CHROME_RENK.muted }}><input type="checkbox" checked={v} onChange={(e) => on(e.target.checked)} />{label}</label>;
const Liste = ({ x, renk, on }: { x: string[]; renk?: string; on?: string }) => <>{x.map((y) => <div key={y} style={{ color: renk || CHROME_RENK.ink }}>{on || '•'} {y}</div>)}</>;
const SIDDET_RENK: Record<string, string> = { durdur: '#F87171', gozden_gecir: '#FBBF24', baslat: '#2DD4BF' };
const SIDDET_AD: Record<string, string> = { durdur: 'DURDURMA ÖNERİSİ', gozden_gecir: 'gözden geçir', baslat: 'eksik tedavi (START)' };

/** Kilitli plan + "Nota ekle" — plan kilitlenmeden nota gitmez. */
function PlanKilit({ kart, kilitPlan, taslak, calistir }: { kart: string; kilitPlan: string | null; taslak: string; calistir: Props['calistir'] }) {
  const [p, setP] = useState<string | null>(null);
  return (<div style={satir}>
    <textarea value={p ?? (kilitPlan || taslak)} onChange={(e) => setP(e.target.value)} rows={2} placeholder="hekim planı (kilitlenir)" style={{ ...toolsInput, width: 'auto', flex: '1 1 320px' }} />
    <button type="button" style={btn} disabled={!(p ?? (kilitPlan || taslak)).trim()} onClick={() => calistir({ adim: 'kilit', kart, alan: 'plan', deger: (p ?? (kilitPlan || taslak)).trim() }, 'Plan hekim tarafından kilitlendi.')}>Planı kilitle</button>
    <button type="button" style={ghost} disabled={!kilitPlan} onClick={() => calistir({ adim: 'kart_nota', kart }, 'Kilitli plan bugünkü nota eklendi.')}>Nota ekle</button>
    {kilitPlan && <span style={{ ...kucuk, color: '#22C55E' }}>✓ kilitli</span>}
  </div>);
}

export default function DahiliyeWow5({ sekme, w5, patientId, kaynak, refler, calistir }: Props) {
  const [f, setF] = useState<Record<string, unknown>>({});
  const s = (k: string, d = '') => (f[k] === undefined ? d : String(f[k] ?? ''));
  const set = (k: string, x: unknown) => setF((p) => ({ ...p, [k]: x }));
  const bv = (k: string, d: boolean) => (f[k] === undefined ? d : !!f[k]);
  const [yukleme, setYukleme] = useState('');

  if (sekme === 'Polifarmasi') {
    const p = w5.polifarmasi; const r = p.sonuc;
    return (<div>
      <div style={etiket}>Yaşlı polifarmasi <span style={kucuk}>· ≥65 · STOPP/START v3 esinli kurallar (hasta_ilaclar + onaylı eGFR/K/Na + kart bayrakları) · öneri, otomatik kesme YOK · hekim kararı kayıtlı</span></div>
      <div style={kucuk}>{r.not}</div>
      {r.uygulanabilir && !r.oneriler.length && <div style={govde}>Kural tetiklenmedi.</div>}
      {r.oneriler.map((o) => {
        const k = p.kararlar.find((x) => x.kod === o.kod)?.karar;
        const g = s(`g_${o.kod}`);
        return (<div key={o.kod} style={{ ...govde, borderLeft: `3px solid ${SIDDET_RENK[o.siddet]}`, paddingLeft: 8 }}>
          <div><b style={{ color: SIDDET_RENK[o.siddet] }}>{SIDDET_AD[o.siddet]}</b> · <b>{o.baslik}</b>{o.ilaclar.length ? <span style={kucuk}> ({o.ilaclar.join(', ')})</span> : null}</div>
          <div style={kucuk}>{o.gerekce}</div>
          <div>→ {o.oneri}</div>
          <Kaynak d={[o.dipnot]} acik={kaynak} refler={refler} />
          {k ? <div style={{ ...kucuk, color: '#22C55E' }}>✓ hekim kararı: {k.karar === 'kabul' ? 'kabul' : `uygulanmadı — ${k.gerekce || ''}`} ({String(k.created_at).slice(0, 10)})</div> : (
            <div style={satir}>
              <button type="button" style={btn} onClick={() => calistir({ adim: 'polifarmasi_karar', kuralKod: o.kod, karar: 'kabul' }, 'Karar kaydedildi (ilaç listesi değişmedi — değişiklik reçeteyle).')}>Kabul (plana al)</button>
              <input value={g} onChange={(e) => set(`g_${o.kod}`, e.target.value)} placeholder={o.engelleyici ? `uygulamama gerekçesi (≥${p.overrideMin} karakter, zorunlu)` : 'uygulamama gerekçesi (isteğe bağlı)'} style={{ ...toolsInput, width: 'auto', flex: '1 1 260px' }} />
              <button type="button" style={o.engelleyici ? kirmiziBtn : ghost} disabled={o.engelleyici && g.trim().length < p.overrideMin} onClick={() => calistir({ adim: 'polifarmasi_karar', kuralKod: o.kod, karar: 'override', gerekce: g }, 'Gerekçeli karar kaydedildi.')}>Uygulama (override)</button>
            </div>)}
        </div>);
      })}
      {r.uygulanabilir && r.oneriler.length > 0 && <div style={satir}><button type="button" style={ghost} onClick={() => calistir({ adim: 'polifarmasi_nota' }, 'Polifarmasi kararları bugünkü nota eklendi.')}>Kararları nota ekle</button><span style={kucuk}>Yalnız hekim kararı verilen öneriler yazılır.</span></div>}
      <Kaynak d={r.dipnotlar} acik={kaynak} refler={refler} />
    </div>);
  }

  if (sekme === 'Hedef kartı') {
    const h = w5.hedef; const r = h.sonuc;
    const secili = (f.yap as string[] | undefined) ?? r.yapraklar;
    const t = h.htHedefTaslak;
    return (<div>
      <div style={etiket}>Hasta hedef kartı + eğitim yaprakları <span style={kucuk}>· yalnız hekimin kilitlediği hedefler · hasta dilinde tek sayfa · yazdırma hekim onayıyla</span></div>
      <table style={{ ...govde, borderCollapse: 'collapse', width: '100%' }}><tbody>
        {r.satirlar.map((x) => <tr key={x.kod} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}><td style={{ padding: 4 }}>{x.ad}</td><td style={{ padding: 4, fontWeight: 700, color: x.durum === 'hekim_belirleyecek' ? '#FBBF24' : CHROME_RENK.ink }}>{x.hedef}</td><td style={{ padding: 4 }}>{x.son || '—'}</td><td style={{ padding: 4, color: x.durum === 'hedefte' ? '#22C55E' : x.durum === 'hedef_disi' ? '#F87171' : CHROME_RENK.muted }}>{x.kod === 'kvr' ? '' : x.durum.replace('_', ' ')}</td></tr>)}
      </tbody></table>
      {!r.satirlar.length && <div style={kucuk}>Aktif HT/DM/lipid kartı yok — yalnız yaşam tarzı yaprağı basılabilir.</div>}
      {r.eksikKilit.length > 0 && <div style={{ ...kucuk, color: '#FBBF24', marginTop: 4 }}>Kilitsiz hedef: {r.eksikKilit.join(', ')} — kartta “Hekiminiz belirleyecek” yazar. HbA1c hedefi DM sekmesinde, LDL hedefi ve KVR kategorisi KVR sekmesinde kilitlenir.</div>}
      <div style={satir}>
        <span style={kucuk}>KB hedefi kilidi:</span>
        <input value={s('sbpU', h.kbHedefKilit ? String(h.kbHedefKilit.sbpUst) : t ? String(t.sbpUst) : '')} onChange={(e) => set('sbpU', e.target.value)} placeholder="SBP <" style={{ ...toolsInput, width: 70 }} />
        <input value={s('dbpU', h.kbHedefKilit?.dbpUst != null ? String(h.kbHedefKilit.dbpUst) : t?.dbpUst != null ? String(t.dbpUst) : '')} onChange={(e) => set('dbpU', e.target.value)} placeholder="DBP <" style={{ ...toolsInput, width: 70 }} />
        <button type="button" style={ghost} disabled={!Number(s('sbpU', h.kbHedefKilit ? String(h.kbHedefKilit.sbpUst) : t ? String(t.sbpUst) : ''))} onClick={() => { const sb = Number(s('sbpU', h.kbHedefKilit ? String(h.kbHedefKilit.sbpUst) : t ? String(t.sbpUst) : '')); const db = s('dbpU', h.kbHedefKilit?.dbpUst != null ? String(h.kbHedefKilit.dbpUst) : t?.dbpUst != null ? String(t.dbpUst) : ''); calistir({ adim: 'kilit', kart: 'ht', alan: 'hedef', deger: { sbpUst: sb, dbpUst: db ? Number(db) : null } }, 'KB hedefi kilitlendi.'); }}>KB hedefini kilitle</button>
        {t && !h.kbHedefKilit && <span style={kucuk}>taslak (Uzlaşı kovası): &lt;{t.sbpUst}{t.dbpUst ? `/${t.dbpUst}` : ''}</span>}
      </div>
      <div style={satir}><span style={kucuk}>Yapraklar:</span>{h.yapraklar.map((y) => chk(y.baslik, secili.includes(y.kod), (x) => set('yap', x ? [...secili, y.kod] : secili.filter((k) => k !== y.kod))))}</div>
      <div style={satir}>
        {chk('bugünkü nota ekle', bv('hn', false), (x) => set('hn', x))}
        <button type="button" style={btn} onClick={async () => { const j = await calistir({ adim: 'hedefkart', yapraklar: secili, notaEkle: bv('hn', false) }, 'Kart hekim tarafından onaylandı — yazdırma penceresi açılıyor.'); if (j?.html) { const w = window.open('', '_blank'); if (w) { w.document.write(String(j.html)); w.document.close(); w.print(); } } }}>Onayla ve yazdır</button>
        {h.sonKart && <span style={kucuk}>son verilen kart: {String(h.sonKart.created_at).slice(0, 10)}</span>}
      </div>
      <Kaynak d={r.dipnotlar} acik={kaynak} refler={refler} />
    </div>);
  }

  if (sekme === 'Sigara') {
    const g = w5.sigara; const k = g.kayit; const r = g.sonuc;
    const d = (key: string, v: unknown) => s(key, v == null ? '' : String(v));
    const danisma = (f.dan as string[] | undefined) ?? ((k?.danisma as string[] | null) || []);
    const govdeBody = () => ({ adim: 'sigara', durum: d('dur', k?.durum), gunlukAdet: d('ga', k?.gunluk_adet), yil: d('yil', k?.yil), ilkSigaraDk: d('ilk', k?.ilk_sigara_dk), evre: d('evre', k?.evre), birakmaTarihi: d('bt', k?.birakma_tarihi) || null, nobetOyku: bv('nob', !!k?.nobet_oyku), yemeBozuklugu: bv('yb', !!k?.yeme_bozuklugu), psikiyatrikOyku: bv('psi', !!k?.psikiyatrik_oyku), danisma });
    return (<div>
      <div style={etiket}>Sigara bırakma paketi <span style={kucuk}>· paket-yıl · HSI bağımlılık · değişim evresi · 5A · ALO 171 · farmakoterapi sınıfı (doz hekim) · izlem görevleri · plan hekim kilidi</span></div>
      <div style={satir}>
        <select value={d('dur', k?.durum)} onChange={(e) => set('dur', e.target.value)} style={{ ...toolsInput, width: 'auto' }}><option value="">durum</option>{[['iciyor', 'içiyor'], ['birakti', 'bıraktı'], ['hic', 'hiç içmedi']].map(([v, a]) => <option key={v} value={v} style={{ color: '#000' }}>{a}</option>)}</select>
        <input value={d('ga', k?.gunluk_adet)} onChange={(e) => set('ga', e.target.value)} placeholder="adet/gün" style={{ ...toolsInput, width: 80 }} />
        <input value={d('yil', k?.yil)} onChange={(e) => set('yil', e.target.value)} placeholder="yıl" style={{ ...toolsInput, width: 60 }} />
        <input value={d('ilk', k?.ilk_sigara_dk)} onChange={(e) => set('ilk', e.target.value)} placeholder="uyanınca ilk sigara (dk)" style={{ ...toolsInput, width: 170 }} />
        <select value={d('evre', k?.evre)} onChange={(e) => set('evre', e.target.value)} style={{ ...toolsInput, width: 'auto' }}><option value="">değişim evresi</option>{Object.entries(g.evreler).map(([v, a]) => <option key={v} value={v} style={{ color: '#000' }}>{a}</option>)}</select>
        <span style={kucuk}>bırakma tarihi</span><input type="date" value={d('bt', k?.birakma_tarihi)} onChange={(e) => set('bt', e.target.value)} style={{ ...toolsInput, width: 140 }} />
      </div>
      <div style={satir}>{chk('nöbet öyküsü', bv('nob', !!k?.nobet_oyku), (x) => set('nob', x))}{chk('yeme bozukluğu', bv('yb', !!k?.yeme_bozuklugu), (x) => set('yb', x))}{chk('psikiyatrik öykü', bv('psi', !!k?.psikiyatrik_oyku), (x) => set('psi', x))}</div>
      <div style={satir}><span style={kucuk}>5A danışmanlık:</span>{g.besA.map((a) => chk(a.ad, danisma.includes(a.kod), (x) => set('dan', x ? [...danisma, a.kod] : danisma.filter((y) => y !== a.kod))))}</div>
      <div style={satir}><button type="button" style={btn} onClick={() => calistir(govdeBody(), 'Sigara kartı güncellendi.')}>Değerlendir</button><button type="button" style={ghost} onClick={() => calistir({ ...govdeBody(), gorevAc: true }, 'İzlem görevleri açıldı.')}>Kaydet + izlem görevleri</button></div>
      <div style={govde}>
        <div>Paket-yıl: <b>{r.paketYil ?? '—'}</b> · HSI: <b>{r.hsi ?? '—'}</b>{r.bagimlilik ? ` (${r.bagimlilik} bağımlılık)` : ''}{r.evreAd ? ` · evre: ${r.evreAd}` : ''}</div>
        <Liste x={r.yaklasim} /><Liste x={r.farmakoterapiSinifi} renk="#2DD4BF" on="℞ sınıf:" /><Liste x={r.uyarilar} renk="#FBBF24" on="⚠" />
        {r.gorevler.length > 0 && <div style={kucuk}>Görevler: {r.gorevler.map((x) => `${x.ad} (${x.due})`).join(' · ')}</div>}
        <Liste x={r.sevk} renk="#F87171" on="→" />
        {r.sevk.length > 0 && <button type="button" style={ghost} onClick={() => calistir({ adim: 'sevk', hedef: 'sigara_birakma', not: r.sevk.join(' · ') }, 'Sigara bırakma polikliniği sevki kaydedildi.')}>Sigara bırakma polikliniği sevk</button>}
        <div style={kucuk}>{r.kaynaklar.join(' · ')}</div>
        <Kaynak d={r.dipnotlar} acik={kaynak} refler={refler} />
      </div>
      <PlanKilit kart="sigara" kilitPlan={g.kilitPlan} taslak={[r.evreAd ? `Evre: ${r.evreAd}` : '', ...r.farmakoterapiSinifi, r.gorevler.length ? `İzlem: ${r.gorevler.map((x) => x.due).join(', ')}` : ''].filter(Boolean).join('; ')} calistir={calistir} />
    </div>);
  }

  if (sekme === 'Vit D/B12') {
    const v = w5.vitamin; const r = v.sonuc; const k = v.kayit;
    const body = { adim: 'vitamin', noroSemptom: bv('noro', !!k?.noro_semptom), malabsorpsiyon: bv('mal', !!k?.malabsorpsiyon), vegan: bv('veg', !!k?.vegan) };
    return (<div>
      <div style={etiket}>D vitamini / B12 eksikliği <span style={kucuk}>· yalnız onaylı lab · sonraki test + replasman sınıfı (yol/doz hekim) · SGK rapor şablonu</span></div>
      <div style={kucuk}>25-OH D: {v.vitD?.kanonik_deger ?? '—'} ng/mL {v.vitD?.numune_tarihi || ''} · B12: {v.b12?.kanonik_deger ?? '—'} pg/mL {v.b12?.numune_tarihi || ''}</div>
      <div style={satir}>{chk('nörolojik bulgu', bv('noro', !!k?.noro_semptom), (x) => set('noro', x))}{chk('malabsorpsiyon / gastrektomi', bv('mal', !!k?.malabsorpsiyon), (x) => set('mal', x))}{chk('vegan', bv('veg', !!k?.vegan), (x) => set('veg', x))}<button type="button" style={btn} onClick={() => calistir(body, 'Kart güncellendi.')}>Değerlendir</button><button type="button" style={ghost} onClick={() => calistir({ ...body, gorevAc: true }, 'Kontrol görevleri açıldı.')}>+ kontrol görevleri</button></div>
      <div style={govde}>
        <div><b>D vitamini:</b> {r.d.durum || 'lab yok'}</div><Liste x={r.d.plan} /><Liste x={r.d.sonrakiTest} on="sonraki test:" /><Liste x={r.d.uyarilar} renk="#FBBF24" on="⚠" />
        <div style={{ marginTop: 6 }}><b>B12:</b> {r.b12.durum || 'lab yok'}</div><Liste x={r.b12.plan} /><Liste x={r.b12.sonrakiTest} on="sonraki test:" /><Liste x={r.b12.uyarilar} renk="#FBBF24" on="⚠" />
        <Liste x={r.sevk} renk="#F87171" on="→" />
        {r.sevk.length > 0 && <button type="button" style={ghost} onClick={() => calistir({ adim: 'sevk', hedef: 'noroloji', not: r.sevk.join(' · ') }, 'Nöroloji sevki kaydedildi.')}>Nöroloji sevk</button>}
        {r.sgkSablonlari.length > 0 && <div style={satir}><span style={kucuk}>SGK rapor taslağı:</span>{r.sgkSablonlari.map((x) => <button key={x} type="button" style={ghost} onClick={() => calistir({ adim: 'sgkrapor', sablon: x, sureAy: 3 }, 'SGK rapor taslağı oluşturuldu — Belge › SGK rapor sekmesinde hekim düzenler ve kilitler.')}>{x === 'vitd' ? 'D vitamini' : 'B12'} raporu</button>)}</div>}
        <Kaynak d={r.dipnotlar} acik={kaynak} refler={refler} />
      </div>
      <PlanKilit kart="vitamin" kilitPlan={v.kilitPlan} taslak={[...r.d.plan.slice(0, 1), ...r.b12.plan.slice(0, 1)].join('; ')} calistir={calistir} />
    </div>);
  }

  if (sekme === 'e-Nabız') {
    const yukle = async (file: File) => {
      setYukleme('Yükleniyor…');
      try {
        const token = await getAccessTokenAsync();
        const form = new FormData(); form.append('file', file); form.append('patientId', patientId); form.append('category', 'lab');
        const up = await fetch('/api/doktor/documents', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
        const uj = await up.json().catch(() => ({}));
        if (!up.ok || !uj.document?.id) throw new Error(uj.error || 'Yüklenemedi');
        setYukleme('Çıkarılıyor (satır başına tarih)…');
        const c = await fetch('/api/doktor/belgeler/lab', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ adim: 'cikar', documentId: uj.document.id, kaynak: 'enabiz' }) });
        const cj = await c.json().catch(() => ({}));
        if (!c.ok) throw new Error(cj.error || 'Çıkarılamadı');
        window.location.href = `/dashboard/doktor/hastalar/${patientId}/belgeler/${uj.document.id}/lab?geriTab=dahiliye`;
      } catch (e) { setYukleme(e instanceof Error ? e.message : 'Hata'); }
    };
    return (<div>
      <div style={etiket}>e-Nabız geçmiş PDF → Belgeler <span style={kucuk}>· yalnız hekimin yüklediği PDF (canlı e-Nabız çekimi yok) · aynı lab hattı: çıkar → tablo onayla → raporla → Onayla · kimlik kontrolü aynı</span></div>
      <div style={kucuk}>Hasta e-Nabız’dan “Tahlillerim” çıktısını PDF olarak verir. Her satır basılı tarihini taşır; tarihi okunamayan satır onaylanana kadar kartlara ve şeride girmez.</div>
      <div style={satir}><input type="file" accept="application/pdf" onChange={(e) => { const x = e.target.files?.[0]; if (x) yukle(x); }} style={{ ...kucuk }} />{yukleme && <span style={{ ...kucuk, color: /Hata|amadı|kabul/.test(yukleme) ? '#F87171' : '#2DD4BF' }}>{yukleme}</span>}</div>
      <div style={govde}>{w5.enabiz.paneller.map((p) => <div key={p.id}><a href={`/dashboard/doktor/hastalar/${patientId}/belgeler/${p.belge_id}/lab?geriTab=dahiliye`} style={{ color: '#2DD4BF' }}>e-Nabız geçmiş · {String(p.created_at).slice(0, 10)}</a> <span style={kucuk}>· durum {p.durum}{p.numune_tarihi ? ` · en yeni ${p.numune_tarihi}` : ''}{(p.kimlik_uyari as { eslesme?: boolean } | null)?.eslesme === false ? ' · ⚠ kimlik eşleşmiyor' : ''}</span></div>)}{!w5.enabiz.paneller.length && <span style={kucuk}>Henüz içe aktarma yok.</span>}</div>
    </div>);
  }

  if (sekme === 'Gut') {
    const g = w5.gut; const k = g.kayit; const r = g.sonuc;
    const body = { adim: 'gut', atakAktif: bv('aa', !!k?.atak_aktif), ates: bv('at', !!k?.ates), kristalKanit: bv('kk', !!k?.kristal_kanit), atakSayisi12Ay: s('as', k?.atak_sayisi_12ay != null ? String(k.atak_sayisi_12ay) : '0'), tofus: bv('to', !!k?.tofus), radyografikHasar: bv('rh', !!k?.radyografik_hasar), urolitiyazis: bv('ur', !!k?.urolitiyazis) };
    return (<div>
      <div style={etiket}>Gut / ürik asit <span style={kucuk}>· atak vs ürat düşürücü merdiven · hedef ürik asit · diyet danışmanlığı · sınıf önerisi (doz hekim) · tanı ve plan hekim kilidi</span></div>
      <div style={kucuk}>Ürik asit (onaylı): {g.urik?.kanonik_deger ?? '—'} mg/dL {g.urik?.numune_tarihi || ''}</div>
      <div style={satir}>{chk('aktif atak', bv('aa', !!k?.atak_aktif), (x) => set('aa', x))}{chk('ateş', bv('at', !!k?.ates), (x) => set('at', x))}{chk('MSU kristali (aspirasyon)', bv('kk', !!k?.kristal_kanit), (x) => set('kk', x))}<input value={s('as', k?.atak_sayisi_12ay != null ? String(k.atak_sayisi_12ay) : '0')} onChange={(e) => set('as', e.target.value)} placeholder="atak/12 ay" style={{ ...toolsInput, width: 80 }} />{chk('tofüs', bv('to', !!k?.tofus), (x) => set('to', x))}{chk('radyografik hasar', bv('rh', !!k?.radyografik_hasar), (x) => set('rh', x))}{chk('ürat taşı', bv('ur', !!k?.urolitiyazis), (x) => set('ur', x))}</div>
      <div style={satir}><button type="button" style={btn} onClick={() => calistir(body, 'Gut kartı güncellendi.')}>Değerlendir</button><button type="button" style={ghost} onClick={() => calistir({ ...body, gorevAc: true }, 'Ürik asit görevleri açıldı.')}>+ görevler</button></div>
      <div style={govde}>
        <Liste x={r.kirmizi} renk="#F87171" on="⛔" />
        <div>Evre taslak: <b>{r.evre.replace(/_/g, ' ')}</b>{g.kilitTani ? ` · hekim tanısı: ${g.kilitTani}` : ''}{r.ultEndikasyon ? ` · ULT endikasyonu: ${r.ultEndikasyon}` : ''}{r.hedefUrik ? ` · hedef <${r.hedefUrik} mg/dL` : ''}</div>
        <Liste x={r.atakSinif} renk="#2DD4BF" on="atak:" /><Liste x={r.ultNeden} on="·" /><Liste x={r.ultMerdiven} /><Liste x={r.profilaksi} /><Liste x={r.ilacUyari} renk="#FBBF24" on="⚠" />
        {r.diyet.length > 0 && <div style={{ marginTop: 4 }}><b>Diyet danışmanlığı</b><Liste x={r.diyet} /></div>}
        <Liste x={r.sevk} renk="#F87171" on="→" />
        {r.sevk.length > 0 && <div style={satir}>{r.sevk.some((x) => /[Rr]omatoloji|aspirasyon|Acil/.test(x)) && <button type="button" style={r.kirmizi.length ? kirmiziBtn : ghost} onClick={() => calistir({ adim: 'sevk', hedef: 'romatoloji', not: r.sevk.join(' · ') }, 'Romatoloji sevki kaydedildi.')}>Romatoloji sevk</button>}{r.sevk.some((x) => /Üroloji/.test(x)) && <button type="button" style={ghost} onClick={() => calistir({ adim: 'sevk', hedef: 'uroloji', not: 'Ürat taşı öyküsü' }, 'Üroloji sevki kaydedildi.')}>Üroloji sevk</button>}</div>}
        <Kaynak d={r.dipnotlar} acik={kaynak} refler={refler} />
      </div>
      <div style={satir}><input value={s('gt')} onChange={(e) => set('gt', e.target.value)} placeholder="hekim tanısı (ör. gut, kronik)" style={{ ...toolsInput, width: 'auto', flex: '1 1 220px' }} /><button type="button" style={ghost} disabled={!s('gt')} onClick={() => calistir({ adim: 'kilit', kart: 'gut', alan: 'tani', deger: s('gt') }, 'Tanı kilitlendi.')}>Tanıyı kilitle</button></div>
      <PlanKilit kart="gut" kilitPlan={g.kilitPlan} taslak={[r.hedefUrik ? `Hedef ürik asit <${r.hedefUrik} mg/dL` : '', ...r.ultMerdiven.slice(0, 1), ...r.atakSinif.slice(0, 1)].filter(Boolean).join('; ')} calistir={calistir} />
    </div>);
  }

  if (sekme === 'Osteoporoz') {
    const o = w5.osteo; const k = o.kayit; const r = o.sonuc;
    const rk = { ...((k?.riskler as Record<string, boolean> | null) || {}), ...((f.rk as Record<string, boolean> | undefined) || {}) };
    const RISK_AD: [string, string][] = [['kirilganlikKirigi', 'kırılganlık kırığı'], ['vertebraKalcaKirigi', 'vertebra/kalça kırığı'], ['glukokortikoid3Ay', 'glukokortikoid ≥3 ay'], ['erkenMenopoz', 'erken menopoz'], ['romatoidArtrit', 'romatoid artrit'], ['sigara', 'sigara'], ['alkol3Unite', 'alkol (günde ≥3 birim)'], ['ebeveynKalcaKirigi', 'ebeveynde kalça kırığı'], ['aromatazInhibitoruAdt', 'aromataz inh. / ADT']];
    const tv = (key: string, v: unknown) => s(key, v == null ? '' : String(v));
    return (<div>
      <div style={etiket}>Osteoporoz · DXA T-skoru <span style={kucuk}>· TEMD Osteoporoz 2025 · T-skoru belgeden veya hekim girişi · kırık risk bayrakları · FRAX HESAPLANMAZ (lisanslı) · plan + DXA aralığı hekim kilidi</span></div>
      {o.dxaOneri && k?.belge_analiz_id !== o.dxaOneri.analizId && <div style={{ ...govde, border: '1px dashed rgba(45,212,191,0.5)', borderRadius: 8, padding: 6 }}>Onaylı belgede T-skoru bulundu ({o.dxaOneri.tarih}): {Object.entries(o.dxaOneri.t).map(([b, v]) => `${o.bolgeAd[b as keyof typeof o.bolgeAd]} ${String(v).replace('.', ',')}`).join(' · ')} <button type="button" style={ghost} onClick={() => calistir({ adim: 'osteo_belge', analizId: o.dxaOneri!.analizId }, 'T-skorları onaylı belgeden alındı.')}>Belgeden al</button></div>}
      <div style={satir}>
        <input value={tv('tl', o.tSkorlari.lomber)} onChange={(e) => set('tl', e.target.value)} placeholder="T lomber" style={{ ...toolsInput, width: 80 }} />
        <input value={tv('tf', o.tSkorlari.femurBoyun)} onChange={(e) => set('tf', e.target.value)} placeholder="T femur boyun" style={{ ...toolsInput, width: 110 }} />
        <input value={tv('tk', o.tSkorlari.totalKalca)} onChange={(e) => set('tk', e.target.value)} placeholder="T total kalça" style={{ ...toolsInput, width: 100 }} />
        <span style={kucuk}>DXA</span><input type="date" value={tv('dt', k?.dxa_tarihi)} onChange={(e) => set('dt', e.target.value)} style={{ ...toolsInput, width: 140 }} />
        {k?.t_kaynak && <span style={kucuk}>kaynak: {k.t_kaynak}</span>}
      </div>
      <div style={satir}>{RISK_AD.map(([key, ad]) => chk(ad, !!rk[key], (x) => set('rk', { ...((f.rk as Record<string, boolean>) || {}), [key]: x })))}</div>
      <div style={satir}>
        <button type="button" style={btn} onClick={() => calistir({ adim: 'osteo', ...(f.tl !== undefined || f.tf !== undefined || f.tk !== undefined ? { tLomber: tv('tl', o.tSkorlari.lomber).replace(',', '.').replace('−', '-'), tFemurBoyun: tv('tf', o.tSkorlari.femurBoyun).replace(',', '.').replace('−', '-'), tTotalKalca: tv('tk', o.tSkorlari.totalKalca).replace(',', '.').replace('−', '-') } : {}), dxaTarihi: tv('dt', k?.dxa_tarihi) || null, riskler: rk }, 'Osteoporoz kartı güncellendi.')}>Değerlendir</button>
        <button type="button" style={ghost} onClick={() => calistir({ adim: 'osteo', gorevAc: true, riskler: rk }, 'DXA görevi açıldı.')}>+ DXA görevi</button>
      </div>
      <div style={govde}>
        <div>Sınıf taslak: <b>{r.sinif ? r.sinif.replace('_', ' ') : 'T-skoru yok'}</b>{r.enDusukT != null ? ` · en düşük T ${String(r.enDusukT).replace('.', ',')} (${r.enDusukBolge ? o.bolgeAd[r.enDusukBolge] : ''})` : ''}{r.klinikOsteoporoz ? ' · kırılganlık kırığı → klinik osteoporoz' : ''}{o.kilitTani ? ` · hekim tanısı: ${o.kilitTani}` : ''}</div>
        {r.riskBayraklari.length > 0 && <div style={kucuk}>Risk bayrakları: {r.riskBayraklari.join(' · ')}</div>}
        <div style={kucuk}>{r.fraxNotu}</div>
        <Liste x={r.tedaviSinifi} renk="#2DD4BF" on="℞ sınıf:" /><Liste x={r.plan} /><Liste x={r.uyarilar} renk="#FBBF24" on="⚠" />
        {r.sekonderTetkik.length > 0 && <div style={kucuk}>Sekonder neden tetkikleri: {r.sekonderTetkik.join(' · ')}</div>}
        <div>DXA aralığı taslak: {r.dxaAraligiAy ? `${r.dxaAraligiAy} ay` : '—'}{r.sonrakiDxa ? ` → ${r.sonrakiDxa}` : ''}</div>
        <Liste x={r.sevk} renk="#F87171" on="→" />
        {r.sevk.length > 0 && <div style={satir}><button type="button" style={ghost} onClick={() => calistir({ adim: 'sevk', hedef: 'endokrinoloji', not: r.sevk.join(' · ') }, 'Endokrinoloji sevki kaydedildi.')}>Endokrinoloji sevk</button><button type="button" style={ghost} onClick={() => calistir({ adim: 'sevk', hedef: 'fiziksel_tip', not: r.sevk.join(' · ') }, 'FTR sevki kaydedildi.')}>FTR sevk</button></div>}
        <Kaynak d={r.dipnotlar} acik={kaynak} refler={refler} />
      </div>
      <div style={satir}><input value={s('ot')} onChange={(e) => set('ot', e.target.value)} placeholder="hekim tanısı (ör. postmenopozal osteoporoz)" style={{ ...toolsInput, width: 'auto', flex: '1 1 260px' }} /><button type="button" style={ghost} disabled={!s('ot')} onClick={() => calistir({ adim: 'kilit', kart: 'osteo', alan: 'tani', deger: s('ot') }, 'Tanı kilitlendi.')}>Tanıyı kilitle</button></div>
      <PlanKilit kart="osteo" kilitPlan={o.kilitPlan} taslak={[...r.tedaviSinifi.slice(0, 1), r.dxaAraligiAy ? `DXA ${r.dxaAraligiAy} ay${r.sonrakiDxa ? ` (${r.sonrakiDxa})` : ''}` : ''].filter(Boolean).join('; ')} calistir={calistir} />
    </div>);
  }
  return null;
}
